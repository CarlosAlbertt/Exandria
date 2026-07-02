-- ============================================================================
-- Tal'Dorei — esquema v4 (ejecutar DESPUÉS de v1, v2 y v3)
-- Fichas de personaje en la nube: cada jugador tiene una fila; el DM las ve.
-- ============================================================================

create table if not exists public.characters (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  species text,
  lineage text,
  cls text,
  subclass text,
  background text,
  base jsonb not null default '{}'::jsonb,      -- aptitudes base (compra de puntos)
  bonus jsonb not null default '{}'::jsonb,      -- bonus de trasfondo
  skills jsonb not null default '[]'::jsonb,      -- pericias de clase elegidas
  inventory jsonb not null default '[]'::jsonb,   -- objetos del inventario
  lore text not null default '',                   -- historia/trasfondo del personaje
  updated_at timestamptz not null default now()
);

-- Si ya creaste la tabla antes de esta versión, añade la columna:
alter table public.characters add column if not exists lore text not null default '';

alter table public.characters enable row level security;

-- Todos los autenticados pueden leer las fichas (el grupo y el DM se ven).
drop policy if exists "chars: leer autenticados" on public.characters;
create policy "chars: leer autenticados" on public.characters
  for select to authenticated using (true);

-- Cada jugador gestiona SOLO su propia ficha.
drop policy if exists "chars: gestionar lo propio" on public.characters;
create policy "chars: gestionar lo propio" on public.characters
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

alter publication supabase_realtime add table public.characters;
