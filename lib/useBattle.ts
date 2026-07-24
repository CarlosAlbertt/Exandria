"use client";

import { useEffect, useState } from "react";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";

export type Token = { id: number; user_id: string | null; label: string; x: number; y: number; color: string; icon: string | null; dead: boolean };
export type Board = { bg_url: string | null; cols: number; rows: number; active: boolean };

const DEFAULT_BOARD: Board = { bg_url: null, cols: 20, rows: 12, active: false };
const TOKEN_FIELDS = "id, user_id, label, x, y, color, icon, dead";

// Estado del tablero en vivo. Si `schema_v22` no está ejecutada, las consultas
// fallan con 42P01 (relación inexistente): se degrada a vacío con `missing = true`
// para que la app no reviente y el DM sepa que falta la migración.
export function useBattle(): { tokens: Token[]; board: Board; ready: boolean; missing: boolean } {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [board, setBoard] = useState<Board>(DEFAULT_BOARD);
  const [ready, setReady] = useState(() => !supabaseConfigured);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (!supabaseConfigured) return;
    const supabase = createClient();
    let mounted = true;

    const load = async () => {
      const t = await supabase.from("battle_tokens").select(TOKEN_FIELDS).order("id");
      if (!mounted) return;
      if (t.error) {
        // 42P01 = tabla inexistente (migración sin ejecutar).
        if (t.error.code === "42P01") setMissing(true);
        setReady(true);
        return;
      }
      setTokens((t.data ?? []) as Token[]);
      const b = await supabase.from("battle_board").select("bg_url, cols, rows, active").eq("id", 1).maybeSingle();
      if (!mounted) return;
      if (!b.error && b.data) setBoard(b.data as Board);
      setReady(true);
    };
    load();

    const ch = supabase
      .channel(`battle_rt_${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "battle_tokens" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "battle_board" }, () => load())
      .subscribe();

    return () => { mounted = false; supabase.removeChannel(ch); };
  }, []);

  return { tokens, board, ready, missing };
}

// --- Mutaciones (RLS decide quién puede) ------------------------------------

export async function moveToken(id: number, x: number, y: number): Promise<{ error: string | null }> {
  if (!supabaseConfigured) return { error: "Supabase no configurado" };
  const { error } = await createClient().from("battle_tokens").update({ x, y, updated_at: new Date().toISOString() }).eq("id", id);
  return { error: error?.message ?? null };
}

export async function addNpcToken(label: string, opts?: { color?: string; icon?: string }): Promise<{ error: string | null }> {
  if (!supabaseConfigured) return { error: "Supabase no configurado" };
  const { error } = await createClient().from("battle_tokens").insert({ label, user_id: null, color: opts?.color ?? "#ef6a3d", icon: opts?.icon ?? null });
  return { error: error?.message ?? null };
}

export async function addPlayerToken(userId: string, label: string, color?: string): Promise<{ error: string | null }> {
  if (!supabaseConfigured) return { error: "Supabase no configurado" };
  const { error } = await createClient().from("battle_tokens").insert({ label, user_id: userId, color: color ?? "#45c7bd" });
  return { error: error?.message ?? null };
}

export async function removeToken(id: number): Promise<{ error: string | null }> {
  if (!supabaseConfigured) return { error: "Supabase no configurado" };
  const { error } = await createClient().from("battle_tokens").delete().eq("id", id);
  return { error: error?.message ?? null };
}

export async function clearTokens(): Promise<{ error: string | null }> {
  if (!supabaseConfigured) return { error: "Supabase no configurado" };
  const { error } = await createClient().from("battle_tokens").delete().gte("id", 0);
  return { error: error?.message ?? null };
}

export async function setBoardConfig(patch: Partial<Board>): Promise<{ error: string | null }> {
  if (!supabaseConfigured) return { error: "Supabase no configurado" };
  const { error } = await createClient().from("battle_board").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", 1);
  return { error: error?.message ?? null };
}

// Rehace el tablero desde la iniciativa: borra los tokens y crea uno por fila.
// `nombre(userId)` resuelve el nombre del jugador (de useParty en el llamador).
export async function poblarDesdeIniciativa(
  rows: { user_id: string | null; is_npc: boolean; npc_name: string | null }[],
  nombre: (userId: string) => string,
): Promise<{ error: string | null }> {
  if (!supabaseConfigured) return { error: "Supabase no configurado" };
  const supabase = createClient();
  const del = await supabase.from("battle_tokens").delete().gte("id", 0);
  if (del.error) return { error: del.error.message };
  const filas = rows.map((r, i) => ({
    user_id: r.is_npc ? null : r.user_id,
    label: r.is_npc ? (r.npc_name ?? "PNJ") : nombre(r.user_id ?? ""),
    color: r.is_npc ? "#ef6a3d" : "#45c7bd",
    x: 10 + (i % 8) * 10,
    y: r.is_npc ? 75 : 25,
  }));
  if (filas.length === 0) return { error: null };
  const { error } = await supabase.from("battle_tokens").insert(filas);
  return { error: error?.message ?? null };
}
