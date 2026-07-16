"use client";

// Fase K — aptitudes de tirada única.
// El jugador elige UN método una sola vez; el resultado se guarda en la tabla
// `stat_rolls` (schema_v13), que es inmutable: user_id es PK (una fila = una
// tirada) y no hay policy de UPDATE. Solo el DM puede borrar la fila
// (= resetear la tirada).
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import type { AbilityKey } from "@/data/rules";

export type StatMethod = "dados" | "array" | "pointbuy";

// Fila de `stat_rolls`. `scores` son los 6 valores SIN asignar (la asignación
// a FUE/DES/… vive en `characters.base`). Vacío para point-buy.
export type StatRoll = { user_id: string; method: StatMethod; scores: number[]; rolled_at: string };

// Array estándar de D&D 2024.
export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];

// Asignación aptitud -> índice dentro de `scores` (null = sin asignar).
export type Assign = Record<AbilityKey, number | null>;
export const ASSIGN_EMPTY: Assign = { fue: null, des: null, con: null, int: null, sab: null, car: null };

// 4d6 descartando el menor: suma los 3 dados más altos. Con menos de 4 dados
// devuelve la suma tal cual (no hay nada que descartar).
export function dropLowest(dice: number[]): number {
  if (dice.length < 4) return dice.reduce((a, b) => a + b, 0);
  const sorted = [...dice].sort((a, b) => b - a);
  return sorted.slice(0, 3).reduce((a, b) => a + b, 0);
}

// ¿Están las 6 aptitudes asignadas?
export function isAssignComplete(assign: Assign): boolean {
  return (Object.keys(ASSIGN_EMPTY) as AbilityKey[]).every((k) => assign[k] !== null);
}

// Lee la tirada del jugador. null = todavía no ha elegido método.
export async function loadStatRoll(userId: string): Promise<StatRoll | null> {
  if (!supabaseConfigured) return null;
  const { data } = await createClient()
    .from("stat_rolls")
    .select("user_id, method, scores, rolled_at")
    .eq("user_id", userId)
    .maybeSingle();
  return (data as StatRoll) ?? null;
}

// Registra el método+valores. Falla si ya existe fila (PK) — eso es justo lo
// que impide repetir la tirada. Devuelve el mensaje de error o null.
export async function saveStatRoll(userId: string, method: StatMethod, scores: number[]): Promise<string | null> {
  if (!supabaseConfigured) return "Supabase no configurado";
  const { error } = await createClient().from("stat_rolls").insert({ user_id: userId, method, scores });
  return error?.message ?? null;
}
