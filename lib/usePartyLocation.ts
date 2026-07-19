"use client";
import { useEffect, useState } from "react";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";

export type PartyLocation = { continent: string; regionSlug: string; poiName: string };
const KEY = "party_location";

async function save(loc: PartyLocation | null) {
  if (!supabaseConfigured) return;
  await createClient().from("app_config").upsert({
    key: KEY,
    value: loc ? JSON.stringify(loc) : "",
    updated_at: new Date().toISOString(),
  });
}

export function usePartyLocation() {
  const [location, setLoc] = useState<PartyLocation | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!supabaseConfigured) { setReady(true); return; }
    const supabase = createClient();
    let mounted = true;
    const load = async () => {
      const { data } = await supabase.from("app_config").select("value").eq("key", KEY).maybeSingle();
      if (!mounted) return;
      try {
        const raw = data?.value as string | undefined;
        setLoc(raw ? (JSON.parse(raw) as PartyLocation) : null);
      } catch { setLoc(null); }
      setReady(true);
    };
    load();
    const ch = supabase
      .channel(`party_loc_rt_${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "app_config", filter: `key=eq.${KEY}` }, () => load())
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(ch); };
  }, []);

  // Optimista: app_config no dispara realtime (ver useArt).
  const setLocation = (loc: PartyLocation | null) => {
    setLoc(loc);
    void save(loc);
  };

  return { location, ready, setLocation };
}
