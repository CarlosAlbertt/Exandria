"use client";

import { useEffect, useState } from "react";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";

export type RegionState = { slug: string; explored: boolean; known: boolean; pin_x: number | null; pin_y: number | null };

// Estado de exploración de las regiones, sincronizado por Realtime.
export function useRegions() {
  const [states, setStates] = useState<Record<string, RegionState>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!supabaseConfigured) { setReady(true); return; }
    const supabase = createClient();
    let mounted = true;

    const load = async () => {
      const { data } = await supabase.from("region_state").select("slug, explored, known, pin_x, pin_y");
      if (mounted && data) {
        const map: Record<string, RegionState> = {};
        for (const r of data as RegionState[]) map[r.slug] = r;
        setStates(map);
      }
      if (mounted) setReady(true);
    };
    load();

    const channel = supabase
      .channel(`region_state_rt_${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "region_state" }, (payload) => {
        const r = payload.new as RegionState;
        if (r?.slug) setStates((prev) => ({ ...prev, [r.slug]: r }));
      })
      .subscribe();

    return () => { mounted = false; supabase.removeChannel(channel); };
  }, []);

  return { states, ready };
}

export async function setRegion(slug: string, patch: Partial<Pick<RegionState, "explored" | "known">>) {
  if (!supabaseConfigured) return { error: "Supabase no configurado" };
  const supabase = createClient();
  const { error } = await supabase
    .from("region_state")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("slug", slug);
  return { error: error?.message ?? null };
}

// Guarda la posición del pin de una región (arrastre del DM).
export async function setRegionPin(slug: string, x: number, y: number) {
  if (!supabaseConfigured) return;
  const supabase = createClient();
  await supabase
    .from("region_state")
    .update({ pin_x: Math.round(x * 10) / 10, pin_y: Math.round(y * 10) / 10, updated_at: new Date().toISOString() })
    .eq("slug", slug);
}
