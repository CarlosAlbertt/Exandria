"use client";

import { useEffect, useState } from "react";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";

export type PoiStateRow = { region: string; name: string; x: number | null; y: number | null; revealed: boolean };

const key = (region: string, name: string) => `${region}::${name}`;

// Estado de POIs (posición ajustada + revelado), sincronizado por Realtime.
export function usePois() {
  const [states, setStates] = useState<Record<string, PoiStateRow>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!supabaseConfigured) { setReady(true); return; }
    const supabase = createClient();
    let mounted = true;

    supabase.from("poi_state").select("region, name, x, y, revealed").then(({ data }) => {
      if (!mounted) return;
      if (data) {
        const m: Record<string, PoiStateRow> = {};
        for (const r of data as PoiStateRow[]) m[key(r.region, r.name)] = r;
        setStates(m);
      }
      setReady(true);
    });

    const ch = supabase
      .channel(`poi_state_rt_${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "poi_state" }, (p) => {
        const r = p.new as PoiStateRow;
        if (r?.region) setStates((prev) => ({ ...prev, [key(r.region, r.name)]: r }));
      })
      .subscribe();

    return () => { mounted = false; supabase.removeChannel(ch); };
  }, []);

  return { states, ready, keyOf: key };
}

export async function setPoiPos(region: string, name: string, x: number, y: number) {
  if (!supabaseConfigured) return;
  await createClient().from("poi_state").upsert({
    region, name, x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, updated_at: new Date().toISOString(),
  });
}
export async function setPoiRevealed(region: string, name: string, revealed: boolean) {
  if (!supabaseConfigured) return;
  await createClient().from("poi_state").upsert({ region, name, revealed, updated_at: new Date().toISOString() });
}
