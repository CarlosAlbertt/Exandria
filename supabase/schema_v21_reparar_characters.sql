-- ============================================================================
-- Exandria — v21: REPARAR `characters`
--
-- No es una feature: es una red de seguridad. El 2026-07-22 apareció una base
-- con la tabla `characters` creada pero SIN la columna `lore` (que añade la
-- v4), lo que tumbaba toda consulta de la ficha y dejaba al jugador viendo
-- «Aún no hay personaje» con el personaje intacto en la base.
--
-- Una migración a medias no deja rastro: `add column if not exists` no falla,
-- pero tampoco avisa de que en su día no llegó a correr. Este archivo declara
-- de una vez TODAS las columnas que la app espera de `characters`, con el tipo
-- y el default de la migración que las introdujo.
--
-- Es idempotente y SOLO AÑADE: si ya están todas, no hace nada. Se puede
-- reejecutar sin miedo, y conviene hacerlo ante cualquier error del tipo
-- «column characters.X does not exist».
-- ============================================================================

-- v4 — identidad y ficha base
alter table public.characters add column if not exists name text not null default '';
alter table public.characters add column if not exists species text;
alter table public.characters add column if not exists lineage text;
alter table public.characters add column if not exists cls text;
alter table public.characters add column if not exists subclass text;
alter table public.characters add column if not exists background text;
alter table public.characters add column if not exists base jsonb not null default '{}'::jsonb;
alter table public.characters add column if not exists bonus jsonb not null default '{}'::jsonb;
alter table public.characters add column if not exists skills jsonb not null default '[]'::jsonb;
alter table public.characters add column if not exists inventory jsonb not null default '[]'::jsonb;
alter table public.characters add column if not exists lore text not null default '';
alter table public.characters add column if not exists updated_at timestamptz not null default now();

-- v8 — progresión, oro y equipo
alter table public.characters add column if not exists level int not null default 1;
alter table public.characters add column if not exists gold int not null default 0;
alter table public.characters add column if not exists asi jsonb not null default '{}'::jsonb;
alter table public.characters add column if not exists equipment jsonb not null default '{}'::jsonb;
alter table public.characters add column if not exists items jsonb not null default '[]'::jsonb;

-- v9 / v10 — dados de golpe y experiencia
alter table public.characters add column if not exists hp_rolls jsonb not null default '{}'::jsonb;
alter table public.characters add column if not exists xp int not null default 0;

-- v14 — archivar personaje
alter table public.characters add column if not exists archived_at timestamptz;

-- v19 — saber por origen
alter table public.characters add column if not exists origin_continent text;
alter table public.characters add column if not exists origin_region text;
alter table public.characters add column if not exists deity text;
alter table public.characters add column if not exists lore_unlocked jsonb not null default '[]'::jsonb;

-- v20 — Fase O1: usos de los pozos de clase (y, más adelante, los conjuros)
alter table public.characters add column if not exists play_state jsonb not null default '{}'::jsonb;

-- Comprobación: lista lo que ha quedado. Deben salir 25 columnas.
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'characters'
order by ordinal_position;
