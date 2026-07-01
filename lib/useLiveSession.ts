"use client";

import { useEffect, useState } from "react";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";

export type LiveSession = {
  epic_mode: boolean;
  narrator_typing: boolean;
  current_narration: string;
  title: string;
  target: string | null; // null/'all' = todos; o id de jugador = visión individual
};

const EMPTY: LiveSession = { epic_mode: false, narrator_typing: false, current_narration: "", title: "", target: null };

// Suscribe a la fila única live_session (id=1) por Realtime.
export function useLiveSession() {
  const [session, setSession] = useState<LiveSession>(EMPTY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!supabaseConfigured) { setReady(true); return; }
    const supabase = createClient();
    let mounted = true;

    supabase
      .from("live_session")
      .select("epic_mode, narrator_typing, current_narration, title, target")
      .eq("id", 1)
      .single()
      .then(({ data }) => {
        if (mounted && data) setSession(data as LiveSession);
        if (mounted) setReady(true);
      });

    const channel = supabase
      .channel("live_session_rt")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "live_session", filter: "id=eq.1" },
        (payload) => {
          if (payload.new) setSession(payload.new as LiveSession);
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return { session, ready };
}

// Actualiza la sesión (solo el DM por RLS). Devuelve error si falla.
export async function updateLiveSession(patch: Partial<LiveSession>) {
  if (!supabaseConfigured) return { error: "Supabase no configurado" };
  const supabase = createClient();
  const { error } = await supabase
    .from("live_session")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", 1);
  return { error: error?.message ?? null };
}
