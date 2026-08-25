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

// ⚠️ Los TRAMOS ya no están aquí: son `unlockCount` y `TRAMOS_SABER` en
// `lib/saber.ts`. Este módulo lleva `"use client"` y abre Supabase, así que
// ningún `scripts/check-*.ts` puede importarlo — la regla de cuánto se recuerda
// vivía donde no la miraba nadie. Aquí se queda solo el ir y venir a la tabla.
