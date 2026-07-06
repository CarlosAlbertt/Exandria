"use client";

import { useEffect, useState } from "react";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import type { AbilityKey } from "@/data/rules";

export type Item = { id: string; name: string; qty: number; notes?: string };

export type Asi = Record<string, Partial<Record<AbilityKey, number>>>;

export type CharacterData = {
  name: string;
  species: string | null;
  lineage: string | null;
  cls: string | null;
  subclass: string | null;
  background: string | null;
  base: Record<AbilityKey, number>;
  bonus: Record<AbilityKey, number>;
  skills: string[];
  inventory: string[];        // legado (text[]); ya no se escribe
  items: Item[];              // inventario enriquecido
  equipment: Record<string, Item>;
  asi: Asi;
  level: number;
  gold: number;
  lore: string;
};

const FIELDS =
  "name, species, lineage, cls, subclass, background, base, bonus, skills, inventory, items, equipment, asi, level, gold, lore";

// Carga la ficha del usuario (o null si no hay).
export async function loadCharacter(userId: string): Promise<Partial<CharacterData> | null> {
  if (!supabaseConfigured || !userId) return null;
  const { data } = await createClient().from("characters").select(FIELDS).eq("user_id", userId).maybeSingle();
  if (!data) return null;
  const row = data as Partial<CharacterData>;
  if ((!row.items || row.items.length === 0) && Array.isArray(row.inventory) && row.inventory.length) {
    row.items = row.inventory.map((name, i) => ({ id: `legacy-${i}`, name, qty: 1 }));
  }
  return row;
}

// Guarda (upsert) la ficha del usuario.
export async function saveCharacter(userId: string, patch: Partial<CharacterData>) {
  if (!supabaseConfigured || !userId) return;
  await createClient().from("characters").upsert({ user_id: userId, ...patch, updated_at: new Date().toISOString() });
}

// --- Vista del DM: todas las fichas del grupo con su username ---
export type PartyMember = CharacterData & { user_id: string; username: string };

export function useParty() {
  const [party, setParty] = useState<PartyMember[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!supabaseConfigured) { setReady(true); return; }
    const supabase = createClient();
    let mounted = true;

    const load = async () => {
      const [chars, profs] = await Promise.all([
        supabase.from("characters").select(`user_id, ${FIELDS}`),
        supabase.from("profiles").select("id, username, role"),
      ]);
      if (!mounted) return;
      const names: Record<string, string> = {};
      const roles: Record<string, string> = {};
      for (const p of (profs.data ?? []) as { id: string; username: string; role: string }[]) { names[p.id] = p.username; roles[p.id] = p.role; }
      const rows = ((chars.data ?? []) as (CharacterData & { user_id: string })[])
        .filter((c) => roles[c.user_id] !== "dm")
        .map((c) => ({ ...c, username: names[c.user_id] ?? "jugador" }));
      setParty(rows);
      setReady(true);
    };
    load();

    const ch = supabase
      .channel("characters_rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "characters" }, () => load())
      .subscribe();

    return () => { mounted = false; supabase.removeChannel(ch); };
  }, []);

  return { party, ready };
}
