"use client";
import { useEffect, useState } from "react";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";

import type { ItemDoc } from "@/lib/character";

export type StashType = "magico" | "normal" | "oro";
export type StashEntry = { id: string; name: string; type: StashType; qty: number; notes?: string; doc?: ItemDoc };
const KEY = "dm_stash";

export async function saveStash(entries: StashEntry[]) {
  if (!supabaseConfigured) return;
  await createClient().from("app_config").upsert({ key: KEY, value: JSON.stringify(entries), updated_at: new Date().toISOString() });
}

export function useDmStash() {
  const [stash, setStash] = useState<StashEntry[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!supabaseConfigured) { setReady(true); return; }
    const supabase = createClient();
    let mounted = true;

    const load = async () => {
      const { data } = await supabase.from("app_config").select("value").eq("key", KEY).maybeSingle();
      if (!mounted) return;
      try { setStash(data?.value ? (JSON.parse(data.value as string) as StashEntry[]) : []); } catch { setStash([]); }
      setReady(true);
    };
    load();

    const ch = supabase
      .channel(`dm_stash_rt_${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "app_config", filter: `key=eq.${KEY}` }, () => load())
      .subscribe();

    return () => { mounted = false; supabase.removeChannel(ch); };
  }, []);

  return { stash, ready };
}
