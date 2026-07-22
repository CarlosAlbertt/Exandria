-- ============================================================================
-- Exandria — esquema v20 (ejecutar DESPUÉS de v1..v19)
-- Fase O1: estado de juego de la ficha (usos de pozos de clase). La Fase O2
-- reutilizará esta MISMA columna para los huecos de conjuro y los preparados,
-- con claves distintas dentro del jsonb — no hará falta otra migración.
-- Idempotente y SOLO AÑADE: no reestructura nada (a diferencia de la v14).
-- ============================================================================

alter table public.characters
  add column if not exists play_state jsonb not null default '{}'::jsonb;
