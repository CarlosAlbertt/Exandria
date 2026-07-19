-- ============================================================================
-- Tal'Dorei — esquema v15 (ejecutar DESPUÉS de v1..v14)
-- Fase C: Tiendas con IA. El jugador compra/vende contra su ficha real; el DM
-- crea tiendas por POI y su catálogo. Idempotente.
-- (La guía la llamaba v13, pero v13/v14 ya se usaron; v15 es la siguiente libre.)
-- ============================================================================

-- 1. TIENDAS -------------------------------------------------------------------
-- poi_name: nombre exacto del POI del atlas donde está la tienda.
-- kind: herreria/alquimista/general/magica/… (texto libre, usado para semillas).
create table if not exists public.shops (
  id bigint generated always as identity primary key,
  poi_name text not null,
  name text not null default 'Tienda',
  kind text not null default 'general',
  npc_prompt text not null default '',
  greeting text not null default '',
  created_at timestamptz not null default now()
);

alter table public.shops enable row level security;

drop policy if exists "shops: leer autenticados" on public.shops;
create policy "shops: leer autenticados" on public.shops
  for select to authenticated using (true);

drop policy if exists "shops: el DM gestiona" on public.shops;
create policy "shops: el DM gestiona" on public.shops
  for all to authenticated using (public.is_dm()) with check (public.is_dm());

-- 2. CATÁLOGO ------------------------------------------------------------------
-- stock NULL = ilimitado. El jugador puede DECREMENTAR stock al comprar (update
-- para autenticados = modelo de confianza de mesa, como el resto de la app).
create table if not exists public.shop_items (
  id bigint generated always as identity primary key,
  shop_id bigint not null references public.shops(id) on delete cascade,
  name text not null,
  price int not null default 0,
  stock int,
  notes text not null default ''
);

alter table public.shop_items enable row level security;

drop policy if exists "items: leer autenticados" on public.shop_items;
create policy "items: leer autenticados" on public.shop_items
  for select to authenticated using (true);

drop policy if exists "items: el DM crea" on public.shop_items;
create policy "items: el DM crea" on public.shop_items
  for insert to authenticated with check (public.is_dm());

-- update autenticados: el jugador decrementa stock al comprar; el DM edita todo.
drop policy if exists "items: actualizar autenticados" on public.shop_items;
create policy "items: actualizar autenticados" on public.shop_items
  for update to authenticated using (true) with check (true);

drop policy if exists "items: el DM borra" on public.shop_items;
create policy "items: el DM borra" on public.shop_items
  for delete to authenticated using (public.is_dm());

-- 3. REGISTRO ------------------------------------------------------------------
-- kind: 'compra' | 'venta'. Cada jugador inserta lo suyo.
create table if not exists public.shop_log (
  id bigint generated always as identity primary key,
  shop_id bigint references public.shops(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  item text not null,
  price int not null default 0,
  kind text not null default 'compra' check (kind in ('compra', 'venta')),
  created_at timestamptz not null default now()
);

alter table public.shop_log enable row level security;

drop policy if exists "log: leer autenticados" on public.shop_log;
create policy "log: leer autenticados" on public.shop_log
  for select to authenticated using (true);

drop policy if exists "log: insertar lo propio" on public.shop_log;
create policy "log: insertar lo propio" on public.shop_log
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "log: el DM borra" on public.shop_log;
create policy "log: el DM borra" on public.shop_log
  for delete to authenticated using (public.is_dm());

-- 4. REALTIME ------------------------------------------------------------------
alter publication supabase_realtime add table public.shop_items;
alter publication supabase_realtime add table public.shop_log;
