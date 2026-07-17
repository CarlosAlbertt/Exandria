"use client";
import { useEffect, useState } from "react";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import { TOWN_MAPS } from "@/data/townMaps";

type TownMap = Record<string, string>;
const KEY = "town_maps";

export async function saveTownMaps(map: TownMap) {
  if (!supabaseConfigured) return;
  await createClient().from("app_config").upsert({ key: KEY, value: JSON.stringify(map), updated_at: new Date().toISOString() });
}

export function useTownMaps() {
  const [overrides, setOverrides] = useState<TownMap>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!supabaseConfigured) { setReady(true); return; }
    const supabase = createClient();
    let mounted = true;
    const load = async () => {
      const { data } = await supabase.from("app_config").select("value").eq("key", KEY).maybeSingle();
      if (!mounted) return;
      try { setOverrides(data?.value ? (JSON.parse(data.value as string) as TownMap) : {}); } catch { setOverrides({}); }
      setReady(true);
    };
    load();
    const ch = supabase
      .channel(`townmaps_rt_${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "app_config", filter: `key=eq.${KEY}` }, () => load())
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(ch); };
  }, []);

  const merged: TownMap = { ...TOWN_MAPS, ...overrides };
  const townMap = (name: string): string | undefined => merged[name];

  // Mutación OPTIMISTA (app_config no dispara realtime): actualiza el estado
  // local al instante y persiste; url vacía = borrar el override.
  const updateTown = (name: string, url: string) => {
    setOverrides((prev) => {
      const next = { ...prev };
      if (url) next[name] = url; else delete next[name];
      void saveTownMaps(next);
      return next;
    });
  };

  return { townMap, merged, overrides, ready, updateTown };
}
