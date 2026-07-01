"use client";

import { useEffect, useState } from "react";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";

export type GroupAction = { open: boolean; prompt: string; draft: string; submitted: string };
const EMPTY: GroupAction = { open: false, prompt: "", draft: "", submitted: "" };

// Acción de grupo con consenso: borrador compartido + "listos" por jugador.
export function useGroupAction() {
  const [action, setAction] = useState<GroupAction>(EMPTY);
  const [ready, setReady] = useState<Record<string, boolean>>({});
  const [players, setPlayers] = useState<{ id: string; username: string }[]>([]);

  useEffect(() => {
    if (!supabaseConfigured) return;
    const supabase = createClient();
    let mounted = true;

    const load = async () => {
      const [ga, ar, pl] = await Promise.all([
        supabase.from("group_action").select("open, prompt, draft, submitted").eq("id", 1).single(),
        supabase.from("action_ready").select("user_id, ready"),
        supabase.from("profiles").select("id, username").eq("role", "player"),
      ]);
      if (!mounted) return;
      if (ga.data) setAction(ga.data as GroupAction);
      if (ar.data) setReady(Object.fromEntries((ar.data as { user_id: string; ready: boolean }[]).map((r) => [r.user_id, r.ready])));
      if (pl.data) setPlayers(pl.data as { id: string; username: string }[]);
    };
    load();

    const ch = supabase
      .channel("group_rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "group_action", filter: "id=eq.1" }, (p) => { if (p.new) setAction(p.new as GroupAction); })
      .on("postgres_changes", { event: "*", schema: "public", table: "action_ready" }, (p) => {
        const r = p.new as { user_id: string; ready: boolean };
        if (p.eventType === "DELETE") { const old = p.old as { user_id: string }; setReady((prev) => { const n = { ...prev }; delete n[old.user_id]; return n; }); }
        else if (r?.user_id) setReady((prev) => ({ ...prev, [r.user_id]: r.ready }));
      })
      .subscribe();

    return () => { mounted = false; supabase.removeChannel(ch); };
  }, []);

  return { action, ready, players };
}

const sb = () => createClient();

export async function setDraft(draft: string) {
  if (!supabaseConfigured) return;
  await sb().from("group_action").update({ draft, updated_at: new Date().toISOString() }).eq("id", 1);
}
export async function setMyReady(userId: string, value: boolean) {
  if (!supabaseConfigured) return;
  await sb().from("action_ready").upsert({ user_id: userId, ready: value, updated_at: new Date().toISOString() });
}
export async function openRound(prompt: string) {
  if (!supabaseConfigured) return;
  await sb().from("group_action").update({ open: true, prompt, draft: "", submitted: "", updated_at: new Date().toISOString() }).eq("id", 1);
  await sb().from("action_ready").update({ ready: false, updated_at: new Date().toISOString() }).neq("user_id", "00000000-0000-0000-0000-000000000000");
}
export async function submitAction(text: string) {
  if (!supabaseConfigured) return;
  await sb().from("group_action").update({ submitted: text, open: false, updated_at: new Date().toISOString() }).eq("id", 1);
  await sb().from("action_ready").update({ ready: false, updated_at: new Date().toISOString() }).neq("user_id", "00000000-0000-0000-0000-000000000000");
}
export async function closeRound() {
  if (!supabaseConfigured) return;
  await sb().from("group_action").update({ open: false, updated_at: new Date().toISOString() }).eq("id", 1);
}
