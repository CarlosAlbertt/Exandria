-- ============================================================================
-- Tal'Dorei — esquema v2 (ejecutar DESPUÉS de schema.sql)
-- Añade: narración con destino (grupo o jugador), consenso de acción de grupo
-- y chat de NPC en la taberna. Idempotente.
-- ============================================================================

-- 1. NARRACIÓN CON DESTINO -----------------------------------------------------
-- target: NULL/'all' = todos; o un id de profiles = visión individual.
alter table public.live_session add column if not exists target text;

-- 2. ACCIÓN DE GRUPO (consenso) ------------------------------------------------
create table if not exists public.group_action (
  id int primary key default 1,
  open boolean not null default false,   -- ¿se está pidiendo acción al grupo?
  prompt text not null default '',        -- la escena/pregunta a la que responden
  draft text not null default '',         -- propuesta compartida y editable
  submitted text not null default '',     -- última acción consensuada enviada al DM
  updated_at timestamptz not null default now()
);
insert into public.group_action (id) values (1) on conflict (id) do nothing;

alter table public.group_action enable row level security;
drop policy if exists "ga: leer autenticados" on public.group_action;
create policy "ga: leer autenticados" on public.group_action for select to authenticated using (true);
-- Jugadores y DM pueden editar el borrador y enviar; el DM además abre/cierra.
drop policy if exists "ga: editar autenticados" on public.group_action;
create policy "ga: editar autenticados" on public.group_action for update to authenticated using (true) with check (true);

-- Estado "listo" por jugador
create table if not exists public.action_ready (
  user_id uuid primary key references auth.users(id) on delete cascade,
  ready boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.action_ready enable row level security;
drop policy if exists "ar: leer autenticados" on public.action_ready;
create policy "ar: leer autenticados" on public.action_ready for select to authenticated using (true);
drop policy if exists "ar: gestionar lo propio" on public.action_ready;
create policy "ar: gestionar lo propio" on public.action_ready for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
-- El DM puede limpiar los "listos" de todos al cerrar una ronda.
drop policy if exists "ar: el DM gestiona" on public.action_ready;
create policy "ar: el DM gestiona" on public.action_ready for all to authenticated
  using (public.is_dm()) with check (public.is_dm());

-- 3. CHAT DE NPC (taberna) -----------------------------------------------------
create table if not exists public.npc_chat (
  id bigint generated always as identity primary key,
  scene text not null default 'taberna',  -- por si hay varias escenas
  role text not null check (role in ('user', 'assistant')),
  author text not null default '',         -- username del jugador (o nombre del NPC)
  content text not null,
  created_at timestamptz not null default now()
);
alter table public.npc_chat enable row level security;
drop policy if exists "npc: leer autenticados" on public.npc_chat;
create policy "npc: leer autenticados" on public.npc_chat for select to authenticated using (true);
drop policy if exists "npc: insertar autenticados" on public.npc_chat;
create policy "npc: insertar autenticados" on public.npc_chat for insert to authenticated with check (true);
drop policy if exists "npc: el DM limpia" on public.npc_chat;
create policy "npc: el DM limpia" on public.npc_chat for delete to authenticated using (public.is_dm());

-- 4. REALTIME ------------------------------------------------------------------
alter publication supabase_realtime add table public.group_action;
alter publication supabase_realtime add table public.action_ready;
alter publication supabase_realtime add table public.npc_chat;
