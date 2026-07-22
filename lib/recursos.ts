// Resolución PURA de los pozos de usos de clase. Sin React ni Supabase, mismo
// espíritu que lib/derive.ts y lib/gameClock.ts.
//
// Se guarda lo GASTADO, no lo restante: el máximo depende del nivel, así que si
// el personaje sube de nivel los usos nuevos le llegan solos.

import { getMechanics } from "@/data/classdata";

/** Estado de juego de la ficha. La Fase O2 añadirá `huecos`/`preparados`. */
export type PlayState = {
  usos?: Record<string, number>;
  [otros: string]: unknown;
};

export type Pozo = {
  key: string;
  name: string;
  max: number;
  gastados: number;
  quedan: number;
  recharge: "corto" | "largo";
};

/** Pozos de esa clase a ese nivel. Los que aún valen 0 NO se listan. */
export function pozosDe(clsSlug: string, level: number, play: PlayState): Pozo[] {
  const m = getMechanics(clsSlug);
  if (!m?.resources) return [];
  const i = Math.max(0, Math.min(19, Math.floor(level) - 1));
  const out: Pozo[] = [];
  for (const r of m.resources) {
    if (!r.spend) continue;
    const max = Number(r.values[i]) || 0;
    if (max <= 0) continue;
    const gastados = Math.min(max, Math.max(0, play.usos?.[r.spend.key] ?? 0));
    out.push({ key: r.spend.key, name: r.name, max, gastados, quedan: max - gastados, recharge: r.spend.recharge });
  }
  return out;
}

/** Columnas de referencia (daño de furia, dado de artes marciales…) al nivel. */
export function referenciasDe(clsSlug: string, level: number): { name: string; value: string }[] {
  const m = getMechanics(clsSlug);
  if (!m?.resources) return [];
  const i = Math.max(0, Math.min(19, Math.floor(level) - 1));
  return m.resources
    .filter((r) => !r.spend)
    .map((r) => ({ name: r.name, value: String(r.values[i]) }))
    .filter((r) => r.value && r.value !== "0" && r.value !== "—");
}

export function gastar(play: PlayState, key: string, max: number): PlayState {
  const usos = { ...(play.usos ?? {}) };
  usos[key] = Math.min(max, (usos[key] ?? 0) + 1);
  return { ...play, usos };
}

export function devolver(play: PlayState, key: string): PlayState {
  const usos = { ...(play.usos ?? {}) };
  usos[key] = Math.max(0, (usos[key] ?? 0) - 1);
  return { ...play, usos };
}

/** Descansar: corto recarga solo los suyos; largo, todos. Nunca toca otras claves. */
export function recargar(play: PlayState, clsSlug: string, level: number, tipo: "corto" | "largo"): PlayState {
  const usos = { ...(play.usos ?? {}) };
  for (const p of pozosDe(clsSlug, level, play)) {
    if (tipo === "largo" || p.recharge === "corto") usos[p.key] = 0;
  }
  return { ...play, usos };
}
