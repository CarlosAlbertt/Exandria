"use client";

// Llama a Ollama DIRECTAMENTE desde el navegador del DM/jugador.
// Así funciona aunque la app esté desplegada en Vercel: la IA corre en la
// máquina local de quien narra, no en el servidor.
// Requiere que Ollama permita el origen (variable de entorno OLLAMA_ORIGINS).

import { NARRACION, pickLore } from "@/data/loreText";

export const DEFAULT_HOST = "http://localhost:11434";
export const DEFAULT_MODEL = "llama3.1:8b";
const HOST_KEY = "taldorei.ollamaHost";
const MODEL_KEY = "taldorei.model";

export function getOllamaHost() {
  if (typeof window === "undefined") return DEFAULT_HOST;
  return localStorage.getItem(HOST_KEY) || DEFAULT_HOST;
}
export function getOllamaModel() {
  if (typeof window === "undefined") return DEFAULT_MODEL;
  return localStorage.getItem(MODEL_KEY) || DEFAULT_MODEL;
}

export type Msg = { role: "system" | "user" | "assistant"; content: string };

export type NarrarResult =
  | { ok: true; reply: string }
  | { ok: false; error: string; offline?: boolean };

export async function narrar(opts: {
  messages: Msg[];
  character?: string;
  model?: string;
  host?: string;
}): Promise<NarrarResult> {
  const host = opts.host || getOllamaHost();
  const model = opts.model || getOllamaModel();
  const userMsgs = opts.messages.filter((m) => m.role === "user");
  const query = userMsgs.slice(-2).map((m) => m.content).join(" ");
  const lore = pickLore(query);

  const system: Msg = {
    role: "system",
    content:
      NARRACION +
      (lore ? `\n\n# Lore relevante de Tal'Dorei\n\n${lore}` : "") +
      (opts.character ? `\n\n# Personaje del jugador\n${opts.character}` : ""),
  };
  const messages = [system, ...opts.messages].slice(-21);

  try {
    const res = await fetch(`${host}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages, stream: false, options: { temperature: 0.8 } }),
      signal: AbortSignal.timeout(180000),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return { ok: false, error: `Ollama respondió ${res.status}. ¿Está descargado el modelo "${model}"? (ollama pull ${model})${detail ? ` — ${detail.slice(0, 120)}` : ""}` };
    }
    const data = await res.json();
    return { ok: true, reply: data?.message?.content ?? "" };
  } catch {
    return {
      ok: false,
      offline: true,
      error: `No se pudo contactar con Ollama en ${host}. Arráncalo en tu equipo y permite el origen con OLLAMA_ORIGINS. Modelo: "ollama pull ${model}".`,
    };
  }
}
