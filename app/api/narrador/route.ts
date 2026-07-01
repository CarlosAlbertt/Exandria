// Proxy hacia una IA local servida por Ollama (http://localhost:11434).
// No usa servicios externos ni claves: todo corre en la máquina del jugador.
// Configurable con OLLAMA_HOST y OLLAMA_MODEL.

export const runtime = "nodejs";

const HOST = process.env.OLLAMA_HOST ?? "http://127.0.0.1:11434";
const MODEL = process.env.OLLAMA_MODEL ?? "llama3.2";

type Msg = { role: "system" | "user" | "assistant"; content: string };

export async function POST(req: Request) {
  let body: { messages?: Msg[]; character?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Petición inválida." }, { status: 400 });
  }

  const system: Msg = {
    role: "system",
    content:
      "Eres el Director de Juego (DM) de una campaña de Dungeons & Dragons ambientada en el continente de Tal'Dorei, en Exandria. " +
      "Narras escenas con tono de alta fantasía épica, interpretas a los NPCs y describes el mundo de forma vívida pero concisa (2-4 frases). " +
      "Respondes siempre en español." +
      (body.character ? ` El personaje del jugador es: ${body.character}.` : ""),
  };

  const messages = [system, ...(body.messages ?? [])].slice(-20);

  try {
    const res = await fetch(`${HOST}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODEL, messages, stream: false }),
      signal: AbortSignal.timeout(120000),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return Response.json(
        { error: `Ollama respondió ${res.status}. ¿Está descargado el modelo "${MODEL}"? (ollama pull ${MODEL})`, detail },
        { status: 502 }
      );
    }

    const data = await res.json();
    return Response.json({ reply: data?.message?.content ?? "", model: MODEL });
  } catch {
    return Response.json(
      {
        error:
          `No se pudo contactar con Ollama en ${HOST}. Instálalo desde ollama.com, ejecútalo y descarga un modelo: "ollama run ${MODEL}".`,
        offline: true,
      },
      { status: 503 }
    );
  }
}
