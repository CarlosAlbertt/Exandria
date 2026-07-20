"use client";

import { useEffect, useState } from "react";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";

// Refleja journal_entries / quests / npcs_met de schema_v12. RLS ya filtra
// visible/oculta para jugadores; el DM ve todo.
export type JournalEntry = {
  id: number;
  session_no: number | null;
  title: string;
  body: string;
  game_date: string | null;
  visible: boolean;
  created_at: string;
  updated_at: string;
};

export type Quest = {
  id: number;
  title: string;
  body: string;
  status: "activa" | "completada" | "fallida" | "oculta" | "oferta";
  poi_name: string | null;
  reward: string;
  // Ids de saber que la misión reparte al grupo al completarse (schema_v19).
  unlock_lore: string[];
  created_at: string;
  updated_at: string;
};

export type NpcMet = {
  id: number;
  name: string;
  role: string;
  notes: string;
  region: string | null;
  visible: boolean;
  created_at: string;
};

const ENTRY_FIELDS = "id, session_no, title, body, game_date, visible, created_at, updated_at";
const QUEST_FIELDS = "id, title, body, status, poi_name, reward, unlock_lore, created_at, updated_at";
const NPC_FIELDS = "id, name, role, notes, region, visible, created_at";

// Crónica de campaña: diario de sesión, misiones y PNJ conocidos. Tres
// tablas de un mismo dominio que se renderizan juntas en /cronica, de ahí un
// único hook (recarga completa por evento, como useParty: tablas pequeñas).
// La fecha narrativa ya no vive aquí: la deriva `lib/useGameClock.ts` del
// reloj de campaña (`app_config.campaign_clock`); `campaign_date` (texto
// libre) queda deprecado.
export function useChronicle() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [npcs, setNpcs] = useState<NpcMet[]>([]);
  const [ready, setReady] = useState(() => !supabaseConfigured);

  useEffect(() => {
    if (!supabaseConfigured) return;
    const supabase = createClient();
    let mounted = true;

    const loadEntries = () =>
      supabase
        .from("journal_entries")
        .select(ENTRY_FIELDS)
        .order("session_no", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .then(({ data }) => { if (mounted && data) setEntries(data as JournalEntry[]); });

    const loadQuests = () =>
      supabase
        .from("quests")
        .select(QUEST_FIELDS)
        .order("updated_at", { ascending: false })
        .then(({ data }) => { if (mounted && data) setQuests(data as Quest[]); });

    const loadNpcs = () =>
      supabase
        .from("npcs_met")
        .select(NPC_FIELDS)
        .order("name", { ascending: true })
        .then(({ data }) => { if (mounted && data) setNpcs(data as NpcMet[]); });

    Promise.all([loadEntries(), loadQuests(), loadNpcs()]).then(() => { if (mounted) setReady(true); });

    const ch = supabase
      .channel(`chronicle_rt_${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "journal_entries" }, () => loadEntries())
      .on("postgres_changes", { event: "*", schema: "public", table: "quests" }, () => loadQuests())
      .on("postgres_changes", { event: "*", schema: "public", table: "npcs_met" }, () => loadNpcs())
      .subscribe();

    return () => { mounted = false; supabase.removeChannel(ch); };
  }, []);

  return { entries, quests, npcs, ready };
}

/* ------------------------------ Mutaciones ------------------------------ */
/* Solo el DM puede escribir (RLS); estas funciones no comprueban rol, se */
/* limitan a insertar/actualizar y devolver { error }. El panel DM (único */
/* punto que las llama) ya está protegido por /dm. */

// Crea (sin id) o actualiza (con id) una entrada de diario.
export async function saveJournalEntry(patch: Partial<JournalEntry> & { id?: number }): Promise<{ error: string | null }> {
  if (!supabaseConfigured) return { error: "Supabase no configurado" };
  const supabase = createClient();
  const { id, ...rest } = patch;
  if (id == null) {
    const { error } = await supabase.from("journal_entries").insert(rest);
    return { error: error?.message ?? null };
  }
  const { error } = await supabase.from("journal_entries").update({ ...rest, updated_at: new Date().toISOString() }).eq("id", id);
  return { error: error?.message ?? null };
}

export async function deleteJournalEntry(id: number): Promise<{ error: string | null }> {
  if (!supabaseConfigured) return { error: "Supabase no configurado" };
  const { error } = await createClient().from("journal_entries").delete().eq("id", id);
  return { error: error?.message ?? null };
}

// Crea (sin id) o actualiza (con id) una misión.
export async function saveQuest(patch: Partial<Quest> & { id?: number }): Promise<{ error: string | null }> {
  if (!supabaseConfigured) return { error: "Supabase no configurado" };
  const supabase = createClient();
  const { id, ...rest } = patch;
  if (id == null) {
    const { error } = await supabase.from("quests").insert(rest);
    return { error: error?.message ?? null };
  }
  const { error } = await supabase.from("quests").update({ ...rest, updated_at: new Date().toISOString() }).eq("id", id);
  return { error: error?.message ?? null };
}

export async function deleteQuest(id: number): Promise<{ error: string | null }> {
  if (!supabaseConfigured) return { error: "Supabase no configurado" };
  const { error } = await createClient().from("quests").delete().eq("id", id);
  return { error: error?.message ?? null };
}

// Crea (sin id) o actualiza (con id) un PNJ conocido.
export async function saveNpc(patch: Partial<NpcMet> & { id?: number }): Promise<{ error: string | null }> {
  if (!supabaseConfigured) return { error: "Supabase no configurado" };
  const supabase = createClient();
  const { id, ...rest } = patch;
  if (id == null) {
    const { error } = await supabase.from("npcs_met").insert(rest);
    return { error: error?.message ?? null };
  }
  const { error } = await supabase.from("npcs_met").update(rest).eq("id", id);
  return { error: error?.message ?? null };
}

export async function deleteNpc(id: number): Promise<{ error: string | null }> {
  if (!supabaseConfigured) return { error: "Supabase no configurado" };
  const { error } = await createClient().from("npcs_met").delete().eq("id", id);
  return { error: error?.message ?? null };
}
