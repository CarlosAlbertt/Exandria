"use client";

import { useEffect, useState } from "react";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";

export type NpcMsg = { id: number; role: "user" | "assistant"; author: string; content: string };

// Chat de NPC compartido por toda la mesa, en tiempo real.
export function useNpcChat(scene = "taberna") {
  const [messages, setMessages] = useState<NpcMsg[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!supabaseConfigured) { setReady(true); return; }
    const supabase = createClient();
    let mounted = true;

    supabase.from("npc_chat").select("id, role, author, content").eq("scene", scene).order("id", { ascending: true }).limit(100)
      .then(({ data }) => { if (mounted) { if (data) setMessages(data as NpcMsg[]); setReady(true); } });

    const ch = supabase
      .channel(`npc_${scene}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "npc_chat", filter: `scene=eq.${scene}` }, (p) => {
        const m = p.new as NpcMsg;
        setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "npc_chat" }, () => setMessages([]))
      .subscribe();

    return () => { mounted = false; supabase.removeChannel(ch); };
  }, [scene]);

  return { messages, ready };
}

export async function postNpcMessage(scene: string, role: "user" | "assistant", author: string, content: string) {
  if (!supabaseConfigured) return;
  await createClient().from("npc_chat").insert({ scene, role, author, content });
}
export async function clearNpcChat(scene: string) {
  if (!supabaseConfigured) return;
  await createClient().from("npc_chat").delete().eq("scene", scene);
}
