"use client";
// Pistas y rumores (Fase N): registro de bajo volumen en app_config (`clues`,
// JSON). El DM las crea y las revela (o las siembra como rumores en los NPCs
// IA); una pista descubierta aparece en la Crónica. Escritura DM-only por RLS.
// Mutación OPTIMISTA (app_config no dispara realtime local; ver useArt).
import { useEffect, useState } from "react";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";

export type Clue = {
  id: string;
  texto: string;
  mision?: string;   // título de la misión ligada (opcional)
  lugar?: string;    // POI relacionado (opcional)
  discovered: boolean;
  rumor: boolean;    // si true, se siembra en los NPCs IA mientras no se descubra
};

const KEY = "clues";

async function persist(clues: Clue[]) {
  if (!supabaseConfigured) return;
  await createClient().from("app_config").upsert({ key: KEY, value: JSON.stringify(clues), updated_at: new Date().toISOString() });
}

export function useClues() {
  const [clues, setClues] = useState<Clue[]>([]);
  const [ready, setReady] = useState(() => !supabaseConfigured);

  useEffect(() => {
    if (!supabaseConfigured) return;
    const supabase = createClient();
    let mounted = true;
    const load = async () => {
      const { data } = await supabase.from("app_config").select("value").eq("key", KEY).maybeSingle();
      if (!mounted) return;
      try { setClues(data?.value ? (JSON.parse(data.value as string) as Clue[]) : []); } catch { setClues([]); }
      setReady(true);
    };
    load();
    const ch = supabase
      .channel(`clues_rt_${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "app_config", filter: `key=eq.${KEY}` }, () => load())
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(ch); };
  }, []);

  // Todas las mutaciones son optimistas + persisten.
  const mutate = (fn: (prev: Clue[]) => Clue[]) => setClues((prev) => { const next = fn(prev); void persist(next); return next; });

  const addClue = (c: Omit<Clue, "id">) => mutate((prev) => [...prev, { ...c, id: crypto.randomUUID() }]);
  const updateClue = (id: string, patch: Partial<Clue>) => mutate((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const removeClue = (id: string) => mutate((prev) => prev.filter((c) => c.id !== id));

  return { clues, ready, addClue, updateClue, removeClue };
}
