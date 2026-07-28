-- schema_v23 — Los monstruos del bestiario entran al combate (FASE 1)
--
-- `initiative` gana cuatro columnas OPCIONALES. Ninguna toca las filas de
-- jugador que ya existan: los jugadores siguen llevando sus PG y sus
-- condiciones en `characters.play_state`, que es su única fuente de verdad.
-- Estas columnas son SOLO para los PNJ.
--
-- Idempotente y solo añade, como todas. Se puede reejecutar sin miedo.

alter table public.initiative add column if not exists monster_slug text;
alter table public.initiative add column if not exists hp int;
alter table public.initiative add column if not exists hp_max int;
alter table public.initiative add column if not exists conds text[] not null default '{}';

-- RLS: las políticas de `initiative` (schema_v11) ya dicen lo que hace falta
-- —el DM escribe, todos leen— y NO cambian. Realtime tampoco: la tabla ya
-- está en la publicación `supabase_realtime` desde la v11.
