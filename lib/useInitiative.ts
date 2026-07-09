"use client";

import { useEffect, useState } from "react";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";

export type InitiativeRow = {
  id: number;
  user_id: string | null;
  is_npc: boolean;
  npc_name: string | null;
  value: number | null;
  active: boolean;
};

const INI_FIELDS = "id, user_id, is_npc, npc_name, value, active";

// Iniciativa en vivo: todas las filas (jugadores + PNJ), orden descendente
// por valor (nulos al final). Se recarga entera ante cualquier cambio: es
// una tabla pequeña y así el orden con nulos y los borrados masivos quedan
// siempre correctos (igual que useParty en lib/character.ts).
export function useInitiative() {
  const [rows, setRows] = useState<InitiativeRow[]>([]);
  const [ready, setReady] = useState(() => !supabaseConfigured);

  useEffect(() => {
    if (!supabaseConfigured) return;
    const supabase = createClient();
    let mounted = true;

    const load = async () => {
      const { data } = await supabase
        .from("initiative")
        .select(INI_FIELDS)
        .order("value", { ascending: false, nullsFirst: false });
      if (!mounted) return;
      if (data) setRows(data as InitiativeRow[]);
      setReady(true);
    };
    load();

    const ch = supabase
      .channel(`initiative_rt_${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "initiative" }, () => load())
      .subscribe();

    return () => { mounted = false; supabase.removeChannel(ch); };
  }, []);

  return { rows, ready };
}

// Guarda la iniciativa propia: como hay un índice único parcial sobre
// user_id (no una restricción unique "de verdad"), upsert con onConflict no
// es fiable aquí — se busca la fila propia y se actualiza, o se inserta.
export async function setMyInitiative(userId: string, value: number): Promise<{ error: string | null }> {
  if (!supabaseConfigured) return { error: "Supabase no configurado" };
  const supabase = createClient();
  const { data } = await supabase.from("initiative").select("id").eq("user_id", userId).maybeSingle();

  if (data) {
    const { error } = await supabase
      .from("initiative")
      .update({ value, updated_at: new Date().toISOString() })
      .eq("id", data.id);
    return { error: error?.message ?? null };
  }

  const { error } = await supabase.from("initiative").insert({ user_id: userId, value, is_npc: false });
  return { error: error?.message ?? null };
}

// Añade un PNJ a la iniciativa (solo el DM, por RLS).
export async function addNpcInitiative(name: string, value: number): Promise<{ error: string | null }> {
  if (!supabaseConfigured) return { error: "Supabase no configurado" };
  const { error } = await createClient().from("initiative").insert({ is_npc: true, npc_name: name, value });
  return { error: error?.message ?? null };
}

// Marca una fila como activa (turno actual) y desactiva el resto.
export async function setActiveInitiative(id: number): Promise<{ error: string | null }> {
  if (!supabaseConfigured) return { error: "Supabase no configurado" };
  const supabase = createClient();
  const { error: e1 } = await supabase
    .from("initiative")
    .update({ active: false, updated_at: new Date().toISOString() })
    .neq("id", -1);
  if (e1) return { error: e1.message };

  const { error: e2 } = await supabase
    .from("initiative")
    .update({ active: true, updated_at: new Date().toISOString() })
    .eq("id", id);
  return { error: e2?.message ?? null };
}

// Vacía la iniciativa por completo (solo el DM, por RLS).
export async function clearInitiative(): Promise<{ error: string | null }> {
  if (!supabaseConfigured) return { error: "Supabase no configurado" };
  const { error } = await createClient().from("initiative").delete().neq("id", -1);
  return { error: error?.message ?? null };
}
