"use client";
// Lore secreta revelada por el DM (Fase N): lista de ids en app_config
// (`lore_revealed`, JSON). Escritura DM-only por RLS. app_config no dispara
// realtime local para quien escribe → mutación OPTIMISTA (ver useArt / memoria
// del proyecto).
import { useEffect, useState } from "react";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";

const KEY = "lore_revealed";

async function persist(ids: string[]) {
  if (!supabaseConfigured) return;
  await createClient().from("app_config").upsert({ key: KEY, value: JSON.stringify(ids), updated_at: new Date().toISOString() });
}

export function useLoreRevealed() {
  const [revealed, setRevealed] = useState<string[]>([]);
  const [ready, setReady] = useState(() => !supabaseConfigured);

  useEffect(() => {
    if (!supabaseConfigured) return;
    const supabase = createClient();
    let mounted = true;
    const load = async () => {
      const { data } = await supabase.from("app_config").select("value").eq("key", KEY).maybeSingle();
      if (!mounted) return;
      try { setRevealed(data?.value ? (JSON.parse(data.value as string) as string[]) : []); } catch { setRevealed([]); }
      setReady(true);
    };
    load();
    const ch = supabase
      .channel(`lore_rev_rt_${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "app_config", filter: `key=eq.${KEY}` }, () => load())
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(ch); };
  }, []);

  // Optimista: refleja el cambio al instante y persiste en paralelo.
  const toggle = (id: string) => setRevealed((prev) => {
    const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
    void persist(next);
    return next;
  });

  // Revelado en BLOQUE (una categoría, un lugar entero). Afecta a todo el
  // grupo; lo individual va por `lore_unlocked` desde Panel DM › Grupo.
  const revealMany = (ids: string[]) => setRevealed((prev) => {
    const next = [...new Set([...prev, ...ids])];
    void persist(next);
    return next;
  });

  const hideMany = (ids: string[]) => setRevealed((prev) => {
    const quitar = new Set(ids);
    const next = prev.filter((x) => !quitar.has(x));
    void persist(next);
    return next;
  });

  return { revealed, ready, toggle, revealMany, hideMany };
}
