-- ============================================================================
-- Tal'Dorei — esquema v11 (ejecutar DESPUÉS de v1..v10)
-- Dados compartidos: tiradas visibles al grupo (o privadas), peticiones de
-- tirada del DM al grupo/un jugador, e iniciativa en vivo (jugadores + PNJ
-- añadidos por el DM). Idempotente.
-- ============================================================================

-- 1. PETICIONES DE TIRADA ------------------------------------------------------
-- target: NULL = todo el grupo; o un id de auth.users = petición individual.
create table if not exists public.roll_requests (
  id bigint generated always as identity primary key,
  target uuid,
  label text not null default '',
  formula text not null default '1d20',
  open boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.roll_requests enable row level security;

drop policy if exists "rr: leer autenticados" on public.roll_requests;
create policy "rr: leer autenticados" on public.roll_requests
  for select to authenticated using (true);

drop policy if exists "rr: el DM gestiona" on public.roll_requests;
create policy "rr: el DM gestiona" on public.roll_requests
  for all to authenticated using (public.is_dm()) with check (public.is_dm());

-- 2. TIRADAS DE DADOS -----------------------------------------------------------
-- kind: ability/save/skill/attack/custom/requested (respuesta a una petición).
-- private: solo la ve su autor y el DM; si no, la ve todo el grupo.
create table if not exists public.dice_rolls (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null default 'custom'
    check (kind in ('ability', 'save', 'skill', 'attack', 'custom', 'requested')),
  label text not null default '',
  formula text not null default '',
  rolls int[] not null default '{}',
  total int not null default 0,
  private boolean not null default false,
  request_id bigint references public.roll_requests(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.dice_rolls enable row level security;

drop policy if exists "dados: leer visibles" on public.dice_rolls;
create policy "dados: leer visibles" on public.dice_rolls
  for select to authenticated using (not private or user_id = auth.uid() or public.is_dm());

drop policy if exists "dados: insertar lo propio" on public.dice_rolls;
create policy "dados: insertar lo propio" on public.dice_rolls
  for insert to authenticated with check (user_id = auth.uid() or public.is_dm());

-- Sin update: una tirada no se edita una vez hecha.
drop policy if exists "dados: el DM borra" on public.dice_rolls;
create policy "dados: el DM borra" on public.dice_rolls
  for delete to authenticated using (public.is_dm());

-- 3. INICIATIVA EN VIVO -----------------------------------------------------------
-- id propio (no user_id como PK): el DM añade PNJ sin usuario asociado
-- (is_npc + npc_name); cada jugador tiene como mucho una fila (índice único
-- parcial sobre user_id).
create table if not exists public.initiative (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade,
  is_npc boolean not null default false,
  npc_name text,
  value int,
  active boolean not null default false,
  updated_at timestamptz not null default now()
);

create unique index if not exists initiative_user_id_key
  on public.initiative (user_id) where user_id is not null;

alter table public.initiative enable row level security;

drop policy if exists "ini: leer autenticados" on public.initiative;
create policy "ini: leer autenticados" on public.initiative
  for select to authenticated using (true);

drop policy if exists "ini: insertar lo propio" on public.initiative;
create policy "ini: insertar lo propio" on public.initiative
  for insert to authenticated with check (user_id = auth.uid() or public.is_dm());

drop policy if exists "ini: actualizar lo propio" on public.initiative;
create policy "ini: actualizar lo propio" on public.initiative
  for update to authenticated using (user_id = auth.uid() or public.is_dm())
  with check (user_id = auth.uid() or public.is_dm());

drop policy if exists "ini: el DM borra" on public.initiative;
create policy "ini: el DM borra" on public.initiative
  for delete to authenticated using (public.is_dm());

-- 4. REALTIME -----------------------------------------------------------------
alter publication supabase_realtime add table public.roll_requests;
alter publication supabase_realtime add table public.dice_rolls;
alter publication supabase_realtime add table public.initiative;
