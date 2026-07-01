// IA del juego (narración y NPCs). Proxy server -> Ollama.
// En local, OLLAMA_HOST = localhost. En Vercel, OLLAMA_HOST = túnel https
// (p. ej. cloudflared). Los navegadores llaman aquí (mismo origen), sin CORS.
import { NARRACION, pickLore } from "@/data/loreText";

export const runtime = "nodejs";

const HOST = process.env.OLLAMA_HOST ?? "http://127.0.0.1:11434";
const MODEL = process.env.OLLAMA_MODEL ?? "qwen2.5:14b";

type Msg = { role: "system" | "user" | "assistant"; content: string };

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

  try {
    const res = await fetch(`${HOST}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages, stream: false, options: { temperature: 0.8 } }),
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
