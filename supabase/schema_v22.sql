-- ============================================================================
-- Exandria — v22: TABLERO DE BATALLA (Fase G3)
--
-- Dos tablas nuevas para el tablero ligero (VTT): las FICHAS (una por
-- combatiente) y la CONFIG del tablero (fila única). Van con RLS y realtime,
-- como `initiative`. Es la primera migración pendiente desde la v21.
--
-- El código degrada con elegancia si estas tablas no existen (lib/useBattle.ts
-- detecta 42P01 y muestra el tablero vacío con un aviso al DM), así que la app
-- compila y arranca sin ejecutar esto; el tablero solo funciona tras hacerlo.
-- Idempotente: se puede reejecutar sin miedo.
-- ============================================================================

-- Fichas del tablero. Una por combatiente (jugador o PNJ).
create table if not exists public.battle_tokens (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade,  -- null = PNJ
  label text not null,
  x real not null default 50,   -- posición en % [0,100] del ancho del tablero
  y real not null default 50,   -- posición en % [0,100] del alto
  color text not null default '#c9a35c',
  icon text,                     -- Font Awesome sin prefijo, opcional
  dead boolean not null default false,
  updated_at timestamptz default now()
);
alter table public.battle_tokens enable row level security;

drop policy if exists "tokens: leer" on public.battle_tokens;
create policy "tokens: leer" on public.battle_tokens
  for select to authenticated using (true);

-- Mover: el DM cualquiera; el jugador solo la suya.
drop policy if exists "tokens: mover propia o DM" on public.battle_tokens;
create policy "tokens: mover propia o DM" on public.battle_tokens
  for update to authenticated using (public.is_dm() or user_id = auth.uid())
  with check (public.is_dm() or user_id = auth.uid());

-- Crear/borrar: solo el DM.
drop policy if exists "tokens: crear DM" on public.battle_tokens;
create policy "tokens: crear DM" on public.battle_tokens
  for insert to authenticated with check (public.is_dm());

drop policy if exists "tokens: borrar DM" on public.battle_tokens;
create policy "tokens: borrar DM" on public.battle_tokens
  for delete to authenticated using (public.is_dm());

-- Configuración del tablero. Fila única (id = 1).
create table if not exists public.battle_board (
  id int primary key default 1,
  bg_url text,
  cols int not null default 20,
  rows int not null default 12,
  active boolean not null default false,   -- ¿combate en curso? (muestra el tablero a los jugadores)
  updated_at timestamptz default now(),
  constraint battle_board_singleton check (id = 1)
);
alter table public.battle_board enable row level security;

drop policy if exists "board: leer" on public.battle_board;
create policy "board: leer" on public.battle_board
  for select to authenticated using (true);

drop policy if exists "board: editar DM" on public.battle_board;
create policy "board: editar DM" on public.battle_board
  for all to authenticated using (public.is_dm()) with check (public.is_dm());

insert into public.battle_board (id) values (1) on conflict do nothing;

-- Realtime (idempotente: sólo añade si no está ya en la publicación).
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'battle_tokens') then
    alter publication supabase_realtime add table public.battle_tokens;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'battle_board') then
    alter publication supabase_realtime add table public.battle_board;
  end if;
end $$;
