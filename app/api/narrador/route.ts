// Proxy hacia una IA local servida por Ollama (http://localhost:11434).
// No usa servicios externos ni claves: todo corre en la máquina del jugador.
// Inyecta una guía de narración y lore de Tal'Dorei desde lore/*.md, eligiendo
// las secciones relevantes a la conversación para no inflar el prompt.

import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";

const HOST = process.env.OLLAMA_HOST ?? "http://127.0.0.1:11434";
const DEFAULT_MODEL = process.env.OLLAMA_MODEL ?? "llama3.1:8b";
const LORE_DIR = join(process.cwd(), "lore");

type Msg = { role: "system" | "user" | "assistant"; content: string };

let cache: { narracion: string; sections: { title: string; body: string }[] } | null = null;

async function loadLore() {
  if (cache) return cache;
  const [narracion, mundo] = await Promise.all([
    readFile(join(LORE_DIR, "narracion.md"), "utf8").catch(() => ""),
    readFile(join(LORE_DIR, "mundo.md"), "utf8").catch(() => ""),
  ]);
  // trocear mundo.md por encabezados "## "
  const sections: { title: string; body: string }[] = [];
  for (const chunk of mundo.split(/\n(?=## )/)) {
    const m = chunk.match(/^##\s+(.+)/);
    if (m) sections.push({ title: m[1].trim(), body: chunk.trim() });
  }
  cache = { narracion, sections };
  return cache;
}

function pickSections(sections: { title: string; body: string }[], query: string, max = 4) {
  const q = query.toLowerCase();
  const always = sections.filter((s) => /resumen/i.test(s.title));
  const scored = sections
    .filter((s) => !/resumen/i.test(s.title))
    .map((s) => {
      const words = s.title.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
      let score = words.reduce((n, w) => n + (q.includes(w) ? 2 : 0), 0);
      // coincidencias de nombres propios dentro del cuerpo
      for (const name of (s.body.match(/[A-ZÁÉÍÓÚ][\wáéíóúñ']{4,}/g) ?? [])) {
        if (q.includes(name.toLowerCase())) score += 1;
      }
      return { s, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map((x) => x.s);
  return [...always, ...scored];
}

export async function POST(req: Request) {
  let body: { messages?: Msg[]; character?: string; model?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Petición inválida." }, { status: 400 });
  }

  const model = (body.model || DEFAULT_MODEL).trim();
  const userMsgs = (body.messages ?? []).filter((m) => m.role === "user");
  const query = userMsgs.slice(-2).map((m) => m.content).join(" ");

  const { narracion, sections } = await loadLore();
  const relevant = pickSections(sections, query);
  const loreBlock = relevant.length
    ? "\n\n# Lore relevante de Tal'Dorei\n\n" + relevant.map((s) => s.body).join("\n\n")
    : "";

  const system: Msg = {
    role: "system",
    content:
      (narracion || "Eres el DM de una campaña de D&D en Tal'Dorei. Narra en español, breve y evocador.") +
      loreBlock +
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
      return Response.json(
        { error: `Ollama respondió ${res.status}. ¿Está descargado el modelo "${model}"? (ollama pull ${model})`, detail },
        { status: 502 }
      );
    }

    const data = await res.json();
    return Response.json({ reply: data?.message?.content ?? "", model });
  } catch {
    return Response.json(
      {
        error: `No se pudo contactar con Ollama en ${HOST}. Instálalo desde ollama.com, ejecútalo y descarga un modelo: "ollama run ${model}".`,
        offline: true,
      },
      { status: 503 }
    );
  }
}
