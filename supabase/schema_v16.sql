-- ============================================================================
-- Tal'Dorei — esquema v16 (ejecutar DESPUÉS de v1..v15)
-- Fase E: NPCs por ubicación. Cada POI puede tener personajes con los que
-- hablar por IA. Idempotente.
-- ============================================================================

-- role: oficio/rol narrativo (tabernero, guardia, sabia…).
-- prompt: personalidad/secretos para la IA (solo el DM lo ve/edita).
-- public: si los jugadores lo ven en /lugar (el DM ve todos).
-- portrait: URL de Storage (Fase H) opcional.
create table if not exists public.location_npcs (
  id bigint generated always as identity primary key,
  poi_name text not null,
  name text not null,
  role text not null default '',
  prompt text not null default '',
  public boolean not null default true,
  portrait text,
  created_at timestamptz not null default now()
);

alter table public.location_npcs enable row level security;

-- Lectura: jugadores ven los públicos; el DM ve todos.
drop policy if exists "npcs: leer visibles" on public.location_npcs;
create policy "npcs: leer visibles" on public.location_npcs
  for select to authenticated using (public or public.is_dm());

drop policy if exists "npcs: el DM gestiona" on public.location_npcs;
create policy "npcs: el DM gestiona" on public.location_npcs
  for all to authenticated using (public.is_dm()) with check (public.is_dm());

-- Realtime (aparición/cambios de NPC en vivo).
alter publication supabase_realtime add table public.location_npcs;
