-- ============================================================================
-- Exandria — esquema v19 (ejecutar DESPUÉS de v1..v18)
-- Saber por origen: cada personaje sabe lo suyo (su continente, su subregión y
-- su deidad) y va descubriendo el resto. Migración AGRUPADA de las cuatro vías
-- de descubrimiento. Idempotente; solo añade columnas/tabla, no reestructura.
-- ============================================================================

-- 1. ORIGEN, FE Y LO APRENDIDO (por personaje) --------------------------------
-- origin_continent / origin_region: de dónde es el PJ (la subregión solo aplica
-- a Tal'Dorei). deity: slug de data/pantheon.ts, o null = sin fe.
-- lore_unlocked: ids de entradas de saber que ESTE personaje ha aprendido
-- (tomos, misiones, concesión del DM, tirada in situ).
alter table public.characters add column if not exists origin_continent text;
alter table public.characters add column if not exists origin_region text;
alter table public.characters add column if not exists deity text;
alter table public.characters add column if not exists lore_unlocked jsonb not null default '[]'::jsonb;

-- 2. MISIONES QUE ENSEÑAN ------------------------------------------------------
-- Ids de entradas de saber que la misión reparte al grupo al completarse.
alter table public.quests add column if not exists unlock_lore jsonb not null default '[]'::jsonb;

-- 3. TIRADA DE SABER IN SITU ---------------------------------------------------
-- Una tirada por lugar y personaje (misma filosofía que stat_rolls de la Fase K:
-- el resultado queda fijado; no se repite hasta que el DM lo borre).
create table if not exists public.lore_rolls (
  character_id uuid not null references public.characters(id) on delete cascade,
  poi_name text not null,
  total int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (character_id, poi_name)
);

alter table public.lore_rolls enable row level security;

-- El jugador gestiona las tiradas de SUS personajes.
drop policy if exists "saber: el jugador gestiona las suyas" on public.lore_rolls;
create policy "saber: el jugador gestiona las suyas" on public.lore_rolls
  for all to authenticated
  using (exists (select 1 from public.characters c where c.id = character_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.characters c where c.id = character_id and c.user_id = auth.uid()));

-- El DM las ve y borra todas (borrar = permitir repetir la tirada).
drop policy if exists "saber: el DM gestiona todas" on public.lore_rolls;
create policy "saber: el DM gestiona todas" on public.lore_rolls
  for all to authenticated using (public.is_dm()) with check (public.is_dm());

-- Realtime (idempotente: add table falla si la tabla ya es miembro).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'lore_rolls'
  ) then
    alter publication supabase_realtime add table public.lore_rolls;
  end if;
end $$;
