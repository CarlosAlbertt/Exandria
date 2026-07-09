"use client";

import { useEffect, useState } from "react";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import { parseFormula } from "@/lib/dice";

export type RollRequest = {
  id: number;
  target: string | null;
  label: string;
  formula: string;
  open: boolean;
  created_at: string;
};

const RR_FIELDS = "id, target, label, formula, open, created_at";

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
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "roll_requests" }, (p) => {
        const old = p.old as { id?: number };
        if (old?.id != null) setRequests((prev) => prev.filter((x) => x.id !== old.id));
      })
      .subscribe();

    return () => { mounted = false; supabase.removeChannel(ch); };
  }, []);

  return { requests, ready };
}

// Crea una petición de tirada (solo el DM, por RLS). target null = grupo.
export async function createRollRequest(label: string, formula: string, target: string | null): Promise<{ error: string | null }> {
  if (!supabaseConfigured) return { error: "Supabase no configurado" };
  if (!parseFormula(formula)) return { error: "Fórmula de dado no válida." };
  const { error } = await createClient().from("roll_requests").insert({ label, formula, target, open: true });
  return { error: error?.message ?? null };
}

export async function closeRollRequest(id: number): Promise<{ error: string | null }> {
  if (!supabaseConfigured) return { error: "Supabase no configurado" };
  const { error } = await createClient().from("roll_requests").update({ open: false }).eq("id", id);
  return { error: error?.message ?? null };
}
