-- ============================================================================
-- Exandria — esquema v17 (ejecutar DESPUÉS de v1..v16)
-- Fase F — Tablón de misiones: amplía `quests` (schema_v12) con el estado
-- 'oferta' (encargo publicado en un POI, aún sin aceptar) y dos columnas:
-- poi_name (dónde se publica) y reward (recompensa mostrada). Idempotente.
-- ============================================================================

-- 1. El estado 'oferta' -------------------------------------------------------
-- El CHECK inline de v12 se llama `quests_status_check` (nombre autogenerado).
-- Se recrea para admitir 'oferta'.
alter table public.quests drop constraint if exists quests_status_check;
alter table public.quests add constraint quests_status_check
  check (status in ('activa', 'completada', 'fallida', 'oculta', 'oferta'));

-- 2. Columnas nuevas ----------------------------------------------------------
-- poi_name: nombre del POI donde se publica la oferta (coincide con Poi.name,
-- igual que party_location.poiName). reward: recompensa en texto libre.
alter table public.quests add column if not exists poi_name text;
alter table public.quests add column if not exists reward text not null default '';

-- RLS y Realtime: sin cambios. La policy de lectura de v12
-- (`status <> 'oculta' or is_dm()`) ya deja ver las ofertas a los jugadores;
-- `quests` ya está en la publicación supabase_realtime.
