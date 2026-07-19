"use client";
// Memoria de NPC (Fase M): resumen persistido por (npc_ref, jugador) en la tabla
// npc_memories (schema_v18). El jugador lee/escribe la suya (RLS), el DM todas.
import { createClient, supabaseConfigured } from "@/lib/supabase/client";

export type NpcMemory = { npc_ref: string; user_id: string; summary: string; updated_at: string };

// Resumen del jugador actual con un NPC (o "" si no hay). RLS filtra a lo suyo.
export async function loadMemory(npcRef: string, userId: string): Promise<string> {
  if (!supabaseConfigured || !userId) return "";
  const { data } = await createClient()
    .from("npc_memories")
    .select("summary")
    .eq("npc_ref", npcRef)
    .eq("user_id", userId)
    .maybeSingle();
  return (data?.summary as string) ?? "";
}

// Guarda (upsert por la PK compuesta) el resumen del jugador con un NPC.
export async function saveMemory(npcRef: string, userId: string, summary: string) {
  if (!supabaseConfigured || !userId) return;
  await createClient()
    .from("npc_memories")
    .upsert({ npc_ref: npcRef, user_id: userId, summary, updated_at: new Date().toISOString() });
}

// Todas las memorias de un NPC (para el editor del DM), con el username.
export async function listMemories(npcRef: string): Promise<(NpcMemory & { username: string })[]> {
  if (!supabaseConfigured) return [];
  const supabase = createClient();
  const { data } = await supabase.from("npc_memories").select("npc_ref, user_id, summary, updated_at").eq("npc_ref", npcRef);
  const rows = (data ?? []) as NpcMemory[];
  if (rows.length === 0) return [];
  const { data: profs } = await supabase.from("profiles").select("id, username");
  const names: Record<string, string> = {};
  for (const p of (profs ?? []) as { id: string; username: string }[]) names[p.id] = p.username;
  return rows.map((r) => ({ ...r, username: names[r.user_id] ?? "jugador" }));
}

export async function updateMemory(npcRef: string, userId: string, summary: string) {
  if (!supabaseConfigured) return;
  await createClient().from("npc_memories").update({ summary, updated_at: new Date().toISOString() }).eq("npc_ref", npcRef).eq("user_id", userId);
}

export async function deleteMemory(npcRef: string, userId: string) {
  if (!supabaseConfigured) return;
  await createClient().from("npc_memories").delete().eq("npc_ref", npcRef).eq("user_id", userId);
}
