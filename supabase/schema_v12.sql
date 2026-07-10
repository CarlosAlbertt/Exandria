-- ============================================================================
-- Tal'Dorei — esquema v12 (ejecutar DESPUÉS de v1..v11)
-- Crónica de campaña: diario de sesión, misiones, PNJ conocidos y fecha
-- narrativa actual. Idempotente.
-- ============================================================================

-- 1. DIARIO DE SESIÓN -----------------------------------------------------------
-- game_date: fecha exandriana en texto libre (p. ej. "12 de Sydenstar, 836 PD").
-- visible: si es false solo la ve el DM (borrador/notas antes de publicar).
create table if not exists public.journal_entries (
  id bigint generated always as identity primary key,
  session_no int,
  title text not null,
  body text not null default '',
  game_date text,
  visible boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.journal_entries enable row level security;

drop policy if exists "diario: leer visibles" on public.journal_entries;
create policy "diario: leer visibles" on public.journal_entries
  for select to authenticated using (visible or public.is_dm());

drop policy if exists "diario: el DM gestiona" on public.journal_entries;
create policy "diario: el DM gestiona" on public.journal_entries
  for all to authenticated using (public.is_dm()) with check (public.is_dm());

-- 2. MISIONES -----------------------------------------------------------------
create table if not exists public.quests (
  id bigint generated always as identity primary key,
  title text not null,
  body text not null default '',
  status text not null default 'activa'
    check (status in ('activa', 'completada', 'fallida', 'oculta')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.quests enable row level security;

drop policy if exists "misiones: leer visibles" on public.quests;
create policy "misiones: leer visibles" on public.quests
  for select to authenticated using (status <> 'oculta' or public.is_dm());

drop policy if exists "misiones: el DM gestiona" on public.quests;
create policy "misiones: el DM gestiona" on public.quests
  for all to authenticated using (public.is_dm()) with check (public.is_dm());

-- 3. PNJ CONOCIDOS --------------------------------------------------------------
-- region: slug de región (opcional, para agrupar/filtrar en el mapa).
create table if not exists public.npcs_met (
  id bigint generated always as identity primary key,
  name text not null,
  role text not null default '',
  notes text not null default '',
  region text,
  visible boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.npcs_met enable row level security;

drop policy if exists "pnj: leer visibles" on public.npcs_met;
create policy "pnj: leer visibles" on public.npcs_met
  for select to authenticated using (visible or public.is_dm());

drop policy if exists "pnj: el DM gestiona" on public.npcs_met;
create policy "pnj: el DM gestiona" on public.npcs_met
  for all to authenticated using (public.is_dm()) with check (public.is_dm());

-- 4. FECHA DE CAMPAÑA -----------------------------------------------------------
insert into public.app_config (key, value) values ('campaign_date', '1 de Horisal, 836 PD')
  on conflict (key) do nothing;

-- 5. REALTIME -------------------------------------------------------------------
alter publication supabase_realtime add table public.journal_entries;
alter publication supabase_realtime add table public.quests;
alter publication supabase_realtime add table public.npcs_met;
