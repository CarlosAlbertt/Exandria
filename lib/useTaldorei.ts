"use client";

import { useEffect, useState } from "react";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import { REGIONS as DEF_REGIONS, type Region } from "@/data/taldorei";
import { POIS as DEF_POIS, type Poi } from "@/data/pois";

// Definiciones EDITABLES de Tal'Dorei (regiones + POIs) en app_config (JSON),
// sin migración. La posición/known/explored de regiones sigue en region_state y
// la de POIs (posición/revelado) en poi_state (ya con Realtime). Aquí solo van
// los datos: nombre, tipo, descripción, capital, etc.
const KEY = "taldorei_defs";

export type Defs = { regions: Region[]; pois: Record<string, Poi[]> };
const defaults = (): Defs => ({ regions: DEF_REGIONS, pois: DEF_POIS });

export function useTaldorei() {
  const [defs, setDefs] = useState<Defs>(defaults);
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
          const d = JSON.parse(data.value) as Defs;
          if (d && Array.isArray(d.regions) && d.pois) setDefs(d);
        } catch { /* JSON inválido: defaults */ }
      }
      setReady(true);
    };
    load();

    const ch = supabase
      .channel(`taldorei_rt_${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "app_config", filter: `key=eq.${KEY}` }, () => load())
      .subscribe();

    return () => { mounted = false; supabase.removeChannel(ch); };
  }, []);

  const save = (d: Defs) => { setDefs(d); void persist(d); };

  return { regions: defs.regions, poisByRegion: defs.pois, ready, save };
}

async function persist(d: Defs) {
  if (!supabaseConfigured) return;
  await createClient().from("app_config").upsert({ key: KEY, value: JSON.stringify(d), updated_at: new Date().toISOString() });
}

// slug a partir del nombre (para regiones nuevas).
export function slugify(name: string): string {
  return name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `region-${Date.now()}`;
}
