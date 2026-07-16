-- ============================================================================
-- Exandria — esquema v13 (ejecutar DESPUÉS de v1..v12)
-- Fase K: aptitudes del creador con TIRADA ÚNICA.
-- El jugador elige un método una sola vez (dados 4d6 / array estándar /
-- point-buy) y queda registrado de forma INMUTABLE: la PK sobre user_id impide
-- una segunda fila y no hay políticas de update/delete para jugadores, así que
-- no se puede repetir la tirada hasta sacar lo que uno quiere.
-- Solo el DM puede borrar la fila = "resetear" la tirada de un jugador.
-- Idempotente.
-- ============================================================================

-- 1. TIRADAS DE APTITUDES -------------------------------------------------------
-- user_id como PRIMARY KEY: una fila por jugador = una única tirada.
-- method: cómo obtuvo sus valores ('dados' | 'array' | 'pointbuy').
-- scores: los 6 valores obtenidos, sin asignar a aptitudes (la asignación a
--   FUE/DES/CON/INT/SAB/CAR sí es libre y vive en `characters`).
--   Ojo: la columna NO se llama "values" porque es palabra reservada en SQL.
create table if not exists public.stat_rolls (
  user_id uuid primary key references auth.users(id) on delete cascade,
  method text not null check (method in ('dados', 'array', 'pointbuy')),
  scores int[] not null,
  rolled_at timestamptz not null default now()
);

alter table public.stat_rolls enable row level security;

-- Leer: lo propio; el DM lo ve todo (Panel DM › Grupo).
drop policy if exists "aptitudes: leer lo propio" on public.stat_rolls;
create policy "aptitudes: leer lo propio" on public.stat_rolls
  for select to authenticated using (user_id = auth.uid() or public.is_dm());

-- Insertar: solo lo propio (o el DM). La PK impide una segunda inserción.
drop policy if exists "aptitudes: insertar lo propio" on public.stat_rolls;
create policy "aptitudes: insertar lo propio" on public.stat_rolls
  for insert to authenticated with check (user_id = auth.uid() or public.is_dm());

-- NO se define policy de UPDATE: con RLS activo, sin policy = denegado.
-- Eso hace la fila inmutable para todos (incluido el DM: para corregir, borra).

-- Borrar: solo el DM = "resetear la tirada" de un jugador.
drop policy if exists "aptitudes: el DM resetea" on public.stat_rolls;
create policy "aptitudes: el DM resetea" on public.stat_rolls
  for delete to authenticated using (public.is_dm());

-- 2. REALTIME -------------------------------------------------------------------
-- Para que el creador reaccione al instante si el DM resetea la tirada.
alter publication supabase_realtime add table public.stat_rolls;
