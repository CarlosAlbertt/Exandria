-- ============================================================================
-- Tal'Dorei — esquema v3 (ejecutar DESPUÉS de schema.sql y schema_v2.sql)
-- Añade: posición ajustable de los pines de región y estado de los POIs
-- (posición + revelado uno a uno). Idempotente.
-- ============================================================================

-- 1. POSICIÓN DE PIN POR REGIÓN (override de las coords del código) -----------
alter table public.region_state add column if not exists pin_x real;
alter table public.region_state add column if not exists pin_y real;

-- 2. ESTADO DE POIs -----------------------------------------------------------
-- El catálogo de POIs vive en el código (data/pois.ts). Aquí guardamos, por POI,
-- su posición ajustada y si está revelado a los jugadores.
create table if not exists public.poi_state (
  region text not null,
  name text not null,
  x real,
  y real,
  revealed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (region, name)
);

alter table public.poi_state enable row level security;

drop policy if exists "poi: leer autenticados" on public.poi_state;
create policy "poi: leer autenticados" on public.poi_state
  for select to authenticated using (true);

drop policy if exists "poi: el DM edita" on public.poi_state;
create policy "poi: el DM edita" on public.poi_state
  for all to authenticated using (public.is_dm()) with check (public.is_dm());

-- 3. REALTIME -----------------------------------------------------------------
alter publication supabase_realtime add table public.poi_state;
