"use client";

// Cliente de IA: llama a la ruta server /api/ia (que a su vez habla con Ollama
// vía OLLAMA_HOST). Funciona desde Vercel para todos los jugadores.

const MODEL_KEY = "taldorei.model";

export function getOllamaModel() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(MODEL_KEY) || "";
}

export type Msg = { role: "system" | "user" | "assistant"; content: string };
export type NarrarResult = { ok: true; reply: string } | { ok: false; error: string; offline?: boolean };

export async function narrar(opts: {
  messages: Msg[];
  character?: string;
  persona?: string;
  model?: string;
}): Promise<NarrarResult> {
  try {
    const res = await fetch("/api/ia", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: opts.messages,
        character: opts.character,
        persona: opts.persona,
        model: opts.model || getOllamaModel() || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error ?? "Error de la IA.", offline: data.offline };
    return { ok: true, reply: data.reply || "" };
  } catch {
    return { ok: false, error: "No se pudo contactar con el servidor de IA.", offline: true };
  }
}
