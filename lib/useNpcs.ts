"use client";
import { useCallback, useEffect, useState } from "react";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";

export type LocationNpc = { id: number; poi_name: string; name: string; role: string; prompt: string; public: boolean; portrait: string | null };

export function useNpcs(poiName: string | null) {
  const [npcs, setNpcs] = useState<LocationNpc[]>([]);
  const [ready, setReady] = useState(false);

  const load = useCallback(async () => {
    if (!supabaseConfigured || !poiName) { setNpcs([]); setReady(true); return; }
    const { data } = await createClient().from("location_npcs").select("*").eq("poi_name", poiName).order("id");
    setNpcs((data ?? []) as LocationNpc[]);
    setReady(true);
  }, [poiName]);

  useEffect(() => {
    if (!supabaseConfigured) { setReady(true); return; }
    let mounted = true;
    const supabase = createClient();
    const run = async () => { if (mounted) await load(); };
    run();
    const ch = supabase
      .channel(`npcs_rt_${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "location_npcs" }, () => { void load(); })
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(ch); };
  }, [load]);

  return { npcs, ready, reload: load };
}

export async function createNpc(poiName: string, name: string, role: string): Promise<number | null> {
  if (!supabaseConfigured) return null;
  const { data } = await createClient().from("location_npcs").insert({ poi_name: poiName, name, role }).select("id").single();
  return data ? (data as { id: number }).id : null;
}
export async function updateNpc(id: number, patch: Partial<Pick<LocationNpc, "name" | "role" | "prompt" | "public" | "portrait">>) {
  if (!supabaseConfigured) return;
  await createClient().from("location_npcs").update(patch).eq("id", id);
}
export async function deleteNpc(id: number) {
  if (!supabaseConfigured) return;
  await createClient().from("location_npcs").delete().eq("id", id);
}
