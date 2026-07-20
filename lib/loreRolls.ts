"use client";
// Tiradas de saber in situ (schema_v19): una por lugar y personaje. Misma
// filosofía que stat_rolls de la Fase K — el resultado queda fijado; repetir
// exige que el DM borre la fila.
import { createClient, supabaseConfigured } from "@/lib/supabase/client";

export async function loadLoreRoll(characterId: string, poiName: string): Promise<number | null> {
  if (!supabaseConfigured || !characterId) return null;
  const { data } = await createClient()
    .from("lore_rolls")
    .select("total")
    .eq("character_id", characterId)
    .eq("poi_name", poiName)
    .maybeSingle();
  return data ? ((data.total as number) ?? 0) : null;
}

export async function saveLoreRoll(characterId: string, poiName: string, total: number) {
  if (!supabaseConfigured || !characterId) return;
  await createClient()
    .from("lore_rolls")
    .upsert({ character_id: characterId, poi_name: poiName, total, updated_at: new Date().toISOString() });
}

// Tramos: cuántas entradas se desbloquean según el total de la tirada.
export function unlockCount(total: number): number {
  if (total >= 20) return 3;
  if (total >= 15) return 2;
  if (total >= 10) return 1;
  return 0;
}
