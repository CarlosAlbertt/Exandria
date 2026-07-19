-- ============================================================================
-- Exandria — esquema v18 (ejecutar DESPUÉS de v1..v17)
-- Fase M — Memoria de NPC: al cerrar una conversación con un PNJ IA, la IA la
-- resume y se guarda por NPC + jugador; se inyecta al system prompt la próxima
-- vez para que el NPC "recuerde". Idempotente.
-- ============================================================================

-- npc_ref: identificador estable del NPC (p. ej. 'npc:42' para location_npcs.id).
-- user_id: el jugador. Una memoria por (npc, jugador) = PK compuesta.
create table if not exists public.npc_memories (
  npc_ref text not null,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  summary text not null default '',
  updated_at timestamptz not null default now(),
  primary key (npc_ref, user_id)
);

alter table public.npc_memories enable row level security;

-- El jugador gestiona SUS memorias (leer/insertar/actualizar la suya).
drop policy if exists "memorias: el jugador gestiona la suya" on public.npc_memories;
create policy "memorias: el jugador gestiona la suya" on public.npc_memories
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- El DM las ve y edita todas (desde el editor de PNJs).
drop policy if exists "memorias: el DM gestiona todas" on public.npc_memories;
create policy "memorias: el DM gestiona todas" on public.npc_memories
  for all to authenticated using (public.is_dm()) with check (public.is_dm());

-- Realtime (idempotente: add table falla si la tabla ya es miembro).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'npc_memories'
  ) then
    alter publication supabase_realtime add table public.npc_memories;
  end if;
end $$;
