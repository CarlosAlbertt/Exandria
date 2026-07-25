// Motor de conjuros (Fase O2), PURO: sin React ni Supabase. Molde de
// lib/recursos.ts (O1): se guarda lo GASTADO, no lo restante, así que al subir
// de nivel los huecos nuevos llegan solos. Fusiona play_state y NUNCA toca las
// claves de otras fases (usos, hp, conds, turno).
import { getMechanics } from "@/data/classdata";
import type { CasterKind } from "@/data/classdata/types";
import { slotsFor } from "@/data/classdata/spellSlots";
import { spellById } from "@/data/spells";
import type { PlayState } from "@/lib/recursos";

export type HuecoNivel = { nivel: number; max: number; gastados: number; quedan: number };

/** Huecos del personaje por nivel de espacio. Solo los niveles con espacios. */
export function huecosDe(caster: CasterKind, level: number, play: PlayState): HuecoNivel[] {
  const fila = slotsFor(caster, level);
  if (!fila) return [];
  const out: HuecoNivel[] = [];
  fila.forEach((max, i) => {
    if (max <= 0) return;
    const nivel = i + 1;
    const gastados = Math.min(max, Math.max(0, play.huecos?.[String(nivel)] ?? 0));
    out.push({ nivel, max, gastados, quedan: max - gastados });
  });
  return out;
}

function conHuecos(play: PlayState, cambio: Record<string, number>): PlayState {
  return { ...play, huecos: { ...(play.huecos ?? {}), ...cambio } };
}

/** Gasta un hueco de ese nivel (tope `max`). No toca los demás niveles. */
export function gastarHueco(play: PlayState, nivel: number, max: number): PlayState {
  const k = String(nivel);
  return conHuecos(play, { [k]: Math.min(max, (play.huecos?.[k] ?? 0) + 1) });
}

/** Devuelve un hueco de ese nivel (suelo 0), para deshacer un error de mesa. */
export function devolverHueco(play: PlayState, nivel: number): PlayState {
  const k = String(nivel);
  return conHuecos(play, { [k]: Math.max(0, (play.huecos?.[k] ?? 0) - 1) });
}

/**
 * Descanso: el largo restaura todos los huecos; el corto solo los de PACTO
 * (la Magia de Pacto del brujo vuelve con el descanso corto).
 */
export function recargarHuecos(play: PlayState, caster: CasterKind, tipo: "corto" | "largo"): PlayState {
  if (tipo === "corto" && caster !== "pact") return play;
  const huecos = { ...(play.huecos ?? {}) };
  for (const k of Object.keys(huecos)) huecos[k] = 0;
  return { ...play, huecos };
}

// --- Topes de la clase -------------------------------------------------------
// Salen de las columnas de progresión que las clases YA declaran ("Trucos" y
// "Conjuros preparados"). Paladín y explorador no tienen trucos en 2024: no
// declaran la columna y el tope es 0.

function columna(clsSlug: string, nombre: string, level: number): number {
  const m = getMechanics(clsSlug);
  const col = m?.resources?.find((r) => r.name === nombre);
  if (!col) return 0;
  const i = Math.max(0, Math.min(19, Math.floor(level) - 1));
  return Number(col.values[i]) || 0;
}

/** Cuántos conjuros (nivel ≥1) puede llevar preparados a ese nivel. */
export function topePreparados(clsSlug: string, level: number): number {
  return columna(clsSlug, "Conjuros preparados", level);
}

/** Cuántos trucos conoce a ese nivel (0 si su clase no tiene trucos). */
export function topeTrucos(clsSlug: string, level: number): number {
  return columna(clsSlug, "Trucos", level);
}

// --- Preparados --------------------------------------------------------------
// `preparados` mezcla trucos y conjuros; se parte por el nivel del conjuro para
// compararlos contra el tope que les toca. Un id que no esté en la semilla no
// cuenta para ninguno (y no se puede preparar).

function esTruco(id: string): boolean {
  return spellById(id)?.level === 0;
}

/** Trucos preparados ahora mismo. */
export function cuentaTrucos(play: PlayState): number {
  return (play.preparados ?? []).filter((id) => spellById(id)?.level === 0).length;
}

/** Conjuros de nivel ≥1 preparados ahora mismo. */
export function cuentaPreparados(play: PlayState): number {
  return (play.preparados ?? []).filter((id) => (spellById(id)?.level ?? 0) > 0).length;
}

/**
 * Prepara un conjuro respetando el tope que le toca (trucos o conjuros). Si el
 * tope está lleno, o el id no existe, devuelve `play` sin cambio: la UI enseña
 * el contador y no deja pasarse.
 */
export function preparar(play: PlayState, spellId: string, capTrucos: number, capPrep: number): PlayState {
  const spell = spellById(spellId);
  if (!spell) return play;
  const actuales = play.preparados ?? [];
  if (actuales.includes(spellId)) return play;
  const truco = esTruco(spellId);
  const usados = truco ? cuentaTrucos(play) : cuentaPreparados(play);
  if (usados >= (truco ? capTrucos : capPrep)) return play;
  return { ...play, preparados: [...actuales, spellId] };
}

/** Quita un conjuro de los preparados. */
export function despreparar(play: PlayState, spellId: string): PlayState {
  return { ...play, preparados: (play.preparados ?? []).filter((id) => id !== spellId) };
}

/** Fija el conjuro de concentración activo (uno a la vez); `null` lo suelta. */
export function setConcentracion(play: PlayState, spellId: string | null): PlayState {
  const next = { ...play };
  if (spellId === null) delete next.concentrando;
  else next.concentrando = spellId;
  return next;
}
