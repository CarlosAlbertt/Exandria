// IA del juego (narración y NPCs). Proxy server -> Ollama.
// En local, OLLAMA_HOST = localhost. En Vercel, OLLAMA_HOST = túnel https
// (p. ej. cloudflared). Los navegadores llaman aquí (mismo origen), sin CORS.
import { NARRACION, pickLore } from "@/data/loreText";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const ENV_HOST = process.env.OLLAMA_HOST ?? "http://127.0.0.1:11434";
const MODEL = process.env.OLLAMA_MODEL ?? "qwen2.5:14b";

type Msg = { role: "system" | "user" | "assistant"; content: string };

// La URL del túnel la fija el DM desde el Panel (app_config.ollama_host).
// Si no hay valor en la DB, se usa la variable de entorno / localhost.
async function resolveHost(): Promise<string> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("app_config").select("value").eq("key", "ollama_host").maybeSingle();
    const v = (data?.value ?? "").trim().replace(/\/+$/, "");
    if (v) return v;
  } catch {}
  return ENV_HOST;
}

export async function POST(req: Request) {
  let body: { messages?: Msg[]; character?: string; persona?: string; model?: string };
  try { body = await req.json(); } catch { return Response.json({ error: "Petición inválida." }, { status: 400 }); }

  const model = (body.model || MODEL).trim();
  const userMsgs = (body.messages ?? []).filter((m) => m.role === "user");
  const query = userMsgs.slice(-2).map((m) => m.content).join(" ");
  const lore = pickLore(query);

  const base = body.persona?.trim() || NARRACION;
  const system: Msg = {
    role: "system",
    content:
      base +
      (lore ? `\n\n# Lore relevante de Tal'Dorei\n\n${lore}` : "") +
      (body.character ? `\n\n# Personaje del jugador\n${body.character}` : ""),
  };
  const messages = [system, ...(body.messages ?? [])].slice(-21);

  const HOST = await resolveHost();
  try {
    const res = await fetch(`${HOST}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model, messages, stream: false,
        options: { temperature: 0.8, top_p: 0.9, repeat_penalty: 1.12, num_predict: 340 },
      }),
      signal: AbortSignal.timeout(180000),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return Response.json({ error: `La IA respondió ${res.status}. ¿Modelo "${model}" descargado en el equipo del DM?`, detail: detail.slice(0, 160) }, { status: 502 });
    }
    const data = await res.json();
    return Response.json({ reply: data?.message?.content ?? "", model });
  } catch {
    return Response.json({
      error: "No se pudo contactar con la IA. El DM debe tener Ollama activo y, en Vercel, el túnel (OLLAMA_HOST) en marcha.",
      offline: true,
    }, { status: 503 });
  }
}
