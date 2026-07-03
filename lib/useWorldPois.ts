"use client";

import { useEffect, useState } from "react";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import { WORLD_POIS, REGION_OF, type WorldType } from "@/data/world";

export type WorldPoiRow = {
  id: string;
  name: string;
  type: WorldType;
  continent: string;
  region: string;
  icon: string | null; // override; si null se usa el icono del tipo
  x: number;
  y: number;
  blurb: string;
  revealed: boolean;
};

// Todos los pines del mundo se guardan como JSON en app_config (ya existe, sin
// migración). El DM edita y se guarda el array entero.
const KEY = "world_pois";

const defaults = (): WorldPoiRow[] =>
  WORLD_POIS.map((p, i) => ({ id: `default-${i}`, name: p.name, type: p.type, continent: p.continent, region: p.region, icon: null, x: p.x, y: p.y, blurb: p.blurb, revealed: false }));

// Rellena la región si falta (pines guardados antes de existir el campo).
const withRegion = (r: WorldPoiRow): WorldPoiRow => ({ ...r, region: r.region || REGION_OF[r.name] || "" });

export function useWorldPois() {
  const [pois, setPois] = useState<WorldPoiRow[]>(defaults);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!supabaseConfigured) { setReady(true); return; }
    const supabase = createClient();
    let mounted = true;

    const load = async () => {
      const { data } = await supabase.from("app_config").select("value").eq("key", KEY).maybeSingle();
      if (!mounted) return;
      if (data?.value) {
        try {
          const arr = JSON.parse(data.value);
          if (Array.isArray(arr) && arr.length) setPois((arr as WorldPoiRow[]).map(withRegion));
        } catch { /* JSON inválido: dejamos los defaults */ }
      }
      setReady(true);
    };
    load();

    const ch = supabase
      .channel(`world_pois_rt_${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "app_config", filter: `key=eq.${KEY}` }, () => load())
      .subscribe();

    return () => { mounted = false; supabase.removeChannel(ch); };
  }, []);

  return { pois, ready };
}

const round = (n: number) => Math.round(n * 10) / 10;

export async function saveWorldPois(rows: WorldPoiRow[]) {
  if (!supabaseConfigured) return;
  const clean = rows.map((r) => ({ ...r, x: round(r.x), y: round(r.y) }));
  await createClient().from("app_config").upsert({ key: KEY, value: JSON.stringify(clean), updated_at: new Date().toISOString() });
}

export function newWorldPoi(p: Omit<WorldPoiRow, "id">): WorldPoiRow {
  const id = globalThis.crypto?.randomUUID?.() ?? `p-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return { ...p, id };
}
