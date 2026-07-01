-- ============================================================================
-- Tal'Dorei — esquema Supabase (ejecutar en SQL Editor del proyecto nuevo)
-- Modelo: un mundo compartido, roles 'dm' (admin) y 'player'.
-- Login por usuario+contraseña: el usuario se mapea a email u@taldorei.local.
-- Los usuarios los crea el DM (panel admin con la service_role key).
-- ============================================================================

-- 1. PERFILES ----------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  role text not null default 'player' check (role in ('dm', 'player')),
  created_at timestamptz not null default now()
);

-- ¿el usuario actual es DM?  (security definer evita recursión de RLS)
create or replace function public.is_dm()
returns boolean
language sql security definer stable
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'dm');
$$;

alter table public.profiles enable row level security;

drop policy if exists "perfiles: leer autenticados" on public.profiles;
create policy "perfiles: leer autenticados" on public.profiles
  for select to authenticated using (true);

drop policy if exists "perfiles: el DM gestiona" on public.profiles;
create policy "perfiles: el DM gestiona" on public.profiles
  for all to authenticated using (public.is_dm()) with check (public.is_dm());

-- 2. ESTADO DE REGIONES ------------------------------------------------------
create table if not exists public.region_state (
  slug text primary key,
  explored boolean not null default false,
  known boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.region_state enable row level security;

drop policy if exists "regiones: leer autenticados" on public.region_state;
create policy "regiones: leer autenticados" on public.region_state
  for select to authenticated using (true);

drop policy if exists "regiones: el DM edita" on public.region_state;
create policy "regiones: el DM edita" on public.region_state
  for all to authenticated using (public.is_dm()) with check (public.is_dm());

-- semilla de las 8 regiones (idempotente)
insert into public.region_state (slug, explored, known) values
  ('costa-lucidiana', true,  true),
  ('sierras-alabastro', false, true),
  ('llanuras-divisorias', false, false),
  ('montanas-torrerrisco', false, false),
  ('montanas-crestormentas', false, false),
  ('peninsula-pleabruma', false, false),
  ('expansion-verdante', false, false),
  ('litoral-filofulgor', false, false)
on conflict (slug) do nothing;

-- 3. SESIÓN EN VIVO (narración sincronizada) ---------------------------------
create table if not exists public.live_session (
  id int primary key default 1,
  epic_mode boolean not null default false,   -- pantalla épica activa para todos
  narrator_typing boolean not null default false,
  current_narration text not null default '',
  title text not null default '',
  updated_at timestamptz not null default now()
);

insert into public.live_session (id) values (1) on conflict (id) do nothing;

alter table public.live_session enable row level security;

drop policy if exists "sesion: leer autenticados" on public.live_session;
create policy "sesion: leer autenticados" on public.live_session
  for select to authenticated using (true);

drop policy if exists "sesion: el DM controla" on public.live_session;
create policy "sesion: el DM controla" on public.live_session
  for all to authenticated using (public.is_dm()) with check (public.is_dm());

-- 4. REALTIME ----------------------------------------------------------------
-- Publicar cambios de estas tablas por WebSocket.
alter publication supabase_realtime add table public.region_state;
alter publication supabase_realtime add table public.live_session;

-- ============================================================================
-- Tras ejecutar: crea el primer DM desde el panel admin de la app, o a mano:
--   1) Authentication > Users > Add user:
--        email: admin@taldorei.local   password: (la que quieras)
--   2) SQL:  update public.profiles set role='dm' where username='admin';
--      (el perfil se crea solo al primer login si usas el trigger de abajo)
-- ============================================================================

-- Trigger opcional: crea profile al registrarse en auth (username = parte local del email)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, role)
  values (new.id, split_part(new.email, '@', 1), 'player')
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
