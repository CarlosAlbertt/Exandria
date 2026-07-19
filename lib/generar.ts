"use client";
// Generadores IA para los formularios del DM (Fase M). Piden a la IA local
// (vía /api/ia → Ollama, mismo canal que la narración/NPCs) un JSON con las
// claves exactas del formulario, y lo parsean con tolerancia. El DM retoca y
// guarda como siempre; con el túnel caído el resultado es `offline` y el botón
// que llama a esto se desactiva.
import { narrar } from "@/lib/narrador";

export type GenResult<T> = { ok: true; data: T } | { ok: false; error: string; offline?: boolean };

// Base común de instrucción: JSON puro, español, ambientado en Exandria.
const AMBIENTE =
  "Ambienta todo en el mundo de Exandria (continente de Tal'Dorei), campaña de D&D. " +
  "Escribe en español. Responde ÚNICAMENTE con un objeto JSON válido, sin markdown, " +
  "sin vallas de código, sin texto antes ni después. Usa exactamente las claves pedidas " +
  "y valores breves.";

// Extrae el primer objeto JSON del texto (quita ```json, recorta a las llaves).
function parseJSON<T>(reply: string): T | null {
  const cleaned = reply.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}

async function generarJSON<T>(persona: string, prompt: string): Promise<GenResult<T>> {
  const r = await narrar({ messages: [{ role: "user", content: prompt }], persona: `${persona}\n\n${AMBIENTE}` });
  if (!r.ok) return { ok: false, error: r.error, offline: r.offline };
  const data = parseJSON<T>(r.reply);
  if (!data) return { ok: false, error: "La IA no devolvió un JSON válido. Prueba otra vez." };
  return { ok: true, data };
}

function pistaLine(pista: string, fallback: string): string {
  const p = pista.trim();
  return p ? `Idea de partida: ${p}.` : fallback;
}

/* ------------------------------- PNJ ------------------------------- */
export type NpcGen = { name: string; role: string; prompt: string };

export function generarNpc(pista: string, poi: string): Promise<GenResult<NpcGen>> {
  const persona =
    "Eres un asistente de dirección de juego que crea personajes no jugadores memorables. " +
    'Devuelve JSON con las claves: "name" (nombre propio), "role" (oficio u ocupación, pocas ' +
    'palabras), "prompt" (2-3 frases con su personalidad, tono de habla y algún secreto o ' +
    "motivación, redactado como instrucción para interpretarlo por IA).";
  const prompt = `Crea un PNJ para el lugar "${poi}". ${pistaLine(pista, "Invéntalo de cero, coherente con el lugar.")}`;
  return generarJSON<NpcGen>(persona, prompt);
}

/* ------------------------------ TIENDA ----------------------------- */
export type TiendaGen = { name: string; greeting: string; npc_prompt: string };

export function generarTienda(pista: string, kind: string, poi: string): Promise<GenResult<TiendaGen>> {
  const persona =
    "Eres un asistente de dirección de juego que crea tiendas con carácter. " +
    'Devuelve JSON con las claves: "name" (nombre del negocio, evocador), "greeting" (una ' +
    'frase de bienvenida del tendero), "npc_prompt" (2-3 frases con la personalidad y el tono ' +
    "del tendero, como instrucción para interpretarlo por IA).";
  const prompt = `Crea una tienda de tipo "${kind}" en el lugar "${poi}". ${pistaLine(pista, "Invéntala de cero.")}`;
  return generarJSON<TiendaGen>(persona, prompt);
}

/* ---------------------------- DOCUMENTO ---------------------------- */
export type DocumentoGen = { titulo: string; texto: string };

export function generarDocumento(pista: string): Promise<GenResult<DocumentoGen>> {
  const persona =
    "Eres un asistente de dirección de juego que redacta documentos in-game que los " +
    "personajes encuentran y leen: cartas, contratos, páginas de diario, órdenes, notas de " +
    'rescate, panfletos. Devuelve JSON con las claves: "titulo" (breve) y "texto" (el ' +
    "contenido del documento, redactado EN PRIMERA PERSONA o como el propio documento, con " +
    "voz de época; varias frases o párrafos cortos, sin meta-comentarios).";
  const prompt = `Escribe un documento in-game. ${pistaLine(pista, "Invéntalo de cero, con algún gancho jugable.")}`;
  return generarJSON<DocumentoGen>(persona, prompt);
}

/* ----------------------------- ENCARGO ----------------------------- */
export type EncargoGen = { title: string; body: string; reward: string };

export function generarEncargo(pista: string, poi: string): Promise<GenResult<EncargoGen>> {
  const persona =
    "Eres un asistente de dirección de juego que escribe ganchos de misión para un tablón. " +
    'Devuelve JSON con las claves: "title" (título corto y llamativo), "body" (2-4 frases con ' +
    'el gancho: quién lo pide, qué hace falta y por qué), "reward" (recompensa breve, p. ej. ' +
    '"50 po" o "50 po y el favor del gremio").';
  const donde = poi.trim() ? ` publicado en "${poi}"` : "";
  const prompt = `Escribe un encargo de tablón${donde}. ${pistaLine(pista, "Invéntalo de cero.")}`;
  return generarJSON<EncargoGen>(persona, prompt);
}
