"use client";

import { useEffect, useState } from "react";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import { parseFormula, roll, d20Check, type RollResult } from "@/lib/dice";

export type DiceRoll = {
  id: number;
  user_id: string;
  kind: string;
  label: string;
  formula: string;
  rolls: number[];
  total: number;
  private: boolean;
  request_id: number | null;
  created_at: string;
};

export type RollRequest = {
  id: number;
  target: string | null;
  label: string;
  formula: string;
  open: boolean;
  created_at: string;
};

export type InitiativeRow = {
  id: number;
  user_id: string | null;
  is_npc: boolean;
  npc_name: string | null;
  value: number | null;
  active: boolean;
};

const DICE_FIELDS = "id, user_id, kind, label, formula, rolls, total, private, request_id, created_at";
const RR_FIELDS = "id, target, label, formula, open, created_at";
const INI_FIELDS = "id, user_id, is_npc, npc_name, value, active";

// Feed de tiradas del grupo: últimas 50, más reciente primero. Las tiradas
// privadas ya llegan filtradas por RLS (autor o DM). El DM puede borrar el
// historial (DELETE masivo) y el feed se vacía.
export function useDiceFeed() {
  const [rolls, setRolls] = useState<DiceRoll[]>([]);
  const [ready, setReady] = useState(() => !supabaseConfigured);

  useEffect(() => {
    if (!supabaseConfigured) return;
    const supabase = createClient();
    let mounted = true;

    supabase
      .from("dice_rolls")
      .select(DICE_FIELDS)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (!mounted) return;
        if (data) setRolls(data as DiceRoll[]);
        setReady(true);
      });

    const ch = supabase
      .channel(`dice_rolls_rt_${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "dice_rolls" }, (p) => {
        const r = p.new as DiceRoll;
        setRolls((prev) => (prev.some((x) => x.id === r.id) ? prev : [r, ...prev].slice(0, 50)));
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "dice_rolls" }, () => setRolls([]))
      .subscribe();

    return () => { mounted = false; supabase.removeChannel(ch); };
  }, []);

  return { rolls, ready };
}

// Peticiones de tirada abiertas (del DM al grupo o a un jugador).
export function useRollRequests() {
  const [requests, setRequests] = useState<RollRequest[]>([]);
  const [ready, setReady] = useState(() => !supabaseConfigured);

  useEffect(() => {
    if (!supabaseConfigured) return;
    const supabase = createClient();
    let mounted = true;

    supabase
      .from("roll_requests")
      .select(RR_FIELDS)
      .eq("open", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!mounted) return;
        if (data) setRequests(data as RollRequest[]);
        setReady(true);
      });

    const ch = supabase
      .channel(`roll_requests_rt_${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "roll_requests" }, (p) => {
        const r = p.new as RollRequest;
        if (r.open) setRequests((prev) => (prev.some((x) => x.id === r.id) ? prev : [r, ...prev]));
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "roll_requests" }, (p) => {
        const r = p.new as RollRequest;
        setRequests((prev) => {
          if (!r.open) return prev.filter((x) => x.id !== r.id);
          return prev.some((x) => x.id === r.id) ? prev.map((x) => (x.id === r.id ? r : x)) : [r, ...prev];
        });
      })
      .subscribe();

    return () => { mounted = false; supabase.removeChannel(ch); };
  }, []);

  return { requests, ready };
}

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

const sb = () => createClient();

// Publica una tirada. Si kind es ability/save/skill/attack y se pasa
// opts.mod, se usa d20Check (con ventaja/desventaja); si no, se parsea y
// tira `formula` con roll(). Rechaza fórmulas inválidas sin tocar la BD.
export async function publishRoll(
  userId: string,
  kind: string,
  label: string,
  formula: string,
  opts?: { priv?: boolean; requestId?: number; adv?: "adv" | "dis"; mod?: number }
): Promise<{ error: string | null; result: RollResult | null }> {
  if (!supabaseConfigured) return { error: "Supabase no configurado", result: null };

  const isCheck = ["ability", "save", "skill", "attack"].includes(kind) && typeof opts?.mod === "number";
  const result = isCheck ? d20Check(opts!.mod as number, opts?.adv) : roll(formula);

  if (!result) return { error: "Fórmula de dado no válida.", result: null };

  const { error } = await sb().from("dice_rolls").insert({
    user_id: userId,
    kind,
    label,
    formula: result.formula,
    rolls: result.rolls,
    total: result.total,
    private: opts?.priv ?? false,
    request_id: opts?.requestId ?? null,
  });

  return { error: error?.message ?? null, result };
}

export async function createRollRequest(label: string, formula: string, target: string | null): Promise<{ error: string | null }> {
  if (!supabaseConfigured) return { error: "Supabase no configurado" };
  if (!parseFormula(formula)) return { error: "Fórmula de dado no válida." };
  const { error } = await sb().from("roll_requests").insert({ label, formula, target, open: true });
  return { error: error?.message ?? null };
}

export async function closeRollRequest(id: number): Promise<{ error: string | null }> {
  if (!supabaseConfigured) return { error: "Supabase no configurado" };
  const { error } = await sb().from("roll_requests").update({ open: false }).eq("id", id);
  return { error: error?.message ?? null };
}

// Guarda la iniciativa propia: como hay un índice único parcial sobre
// user_id (no una restricción unique "de verdad"), upsert con onConflict no
// es fiable aquí — se busca la fila propia y se actualiza, o se inserta.
export async function setMyInitiative(userId: string, value: number): Promise<{ error: string | null }> {
  if (!supabaseConfigured) return { error: "Supabase no configurado" };
  const supabase = sb();
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

export async function addNpcInitiative(name: string, value: number): Promise<{ error: string | null }> {
  if (!supabaseConfigured) return { error: "Supabase no configurado" };
  const { error } = await sb().from("initiative").insert({ is_npc: true, npc_name: name, value });
  return { error: error?.message ?? null };
}

// Marca una fila como activa (turno actual) y desactiva el resto.
export async function setActiveInitiative(id: number): Promise<{ error: string | null }> {
  if (!supabaseConfigured) return { error: "Supabase no configurado" };
  const supabase = sb();
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
  const { error } = await sb().from("initiative").delete().neq("id", -1);
  return { error: error?.message ?? null };
}
