"use client";

import { useEffect, useState } from "react";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import { WORLD_POIS, type WorldType } from "@/data/world";

export type WorldPoiRow = {
  id: string;
  name: string;
  type: WorldType;
  continent: string;
  icon: string | null; // override; si null se usa el icono del tipo
  x: number;
  y: number;
  blurb: string;
  revealed: boolean;
};

const FIELDS = "id, name, type, continent, icon, x, y, blurb, revealed";

// Pines del mundo desde Supabase (tabla world_poi), sincronizados por Realtime.
// Si la tabla aún no se ha "sembrado", devuelve los valores por defecto del
// código (solo lectura) para que el mapa no quede vacío.
export function useWorldPois() {
  const [rows, setRows] = useState<WorldPoiRow[]>([]);
  const [seeded, setSeeded] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!supabaseConfigured) { setReady(true); return; }
    const supabase = createClient();
    let mounted = true;

    const load = async () => {
      const { data } = await supabase.from("world_poi").select(FIELDS);
      if (!mounted) return;
      const rs = (data ?? []) as WorldPoiRow[];
      setRows(rs);
      setSeeded(rs.length > 0);
      setReady(true);
    };
    load();

    const ch = supabase
      .channel(`world_poi_rt_${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "world_poi" }, () => load())
      .subscribe();

    return () => { mounted = false; supabase.removeChannel(ch); };
  }, []);

  const fallback: WorldPoiRow[] = WORLD_POIS.map((p, i) => ({
    id: `default-${i}`, name: p.name, type: p.type, continent: p.continent,
    icon: null, x: p.x, y: p.y, blurb: p.blurb, revealed: false,
  }));

  return { pois: seeded ? rows : fallback, rows, seeded, ready };
}

const sb = () => createClient();
const round = (n: number) => Math.round(n * 10) / 10;

export async function addWorldPoi(p: Omit<WorldPoiRow, "id">) {
  if (!supabaseConfigured) return;
  await sb().from("world_poi").insert({ ...p, x: round(p.x), y: round(p.y), updated_at: new Date().toISOString() });
}
export async function updateWorldPoi(id: string, patch: Partial<Omit<WorldPoiRow, "id">>) {
  if (!supabaseConfigured) return;
  const p = { ...patch } as Record<string, unknown>;
  if (typeof patch.x === "number") p.x = round(patch.x);
  if (typeof patch.y === "number") p.y = round(patch.y);
  await sb().from("world_poi").update({ ...p, updated_at: new Date().toISOString() }).eq("id", id);
}
export async function deleteWorldPoi(id: string) {
  if (!supabaseConfigured) return;
  await sb().from("world_poi").delete().eq("id", id);
}
// Inserta los pines por defecto del código si la tabla está vacía.
export async function seedWorldPois() {
  if (!supabaseConfigured) return;
  const { count } = await sb().from("world_poi").select("id", { count: "exact", head: true });
  if (count && count > 0) return;
  const rows = WORLD_POIS.map((p) => ({ name: p.name, type: p.type, continent: p.continent, icon: null, x: p.x, y: p.y, blurb: p.blurb, revealed: false }));
  await sb().from("world_poi").insert(rows);
}
