-- ============================================================================
-- Exandria — esquema v24 (ejecutar DESPUÉS de v1..v23)
-- MISIONES INDIVIDUALES: una misión puede ser de UN personaje y encargarla un
-- PNJ concreto. Hasta ahora `quests` no sabía de quién era ni quién la daba,
-- así que /api/aceptar-encargo tenía que apuntar «_Aceptado por X_» dentro del
-- propio `body` a falta de columna donde ponerlo.
--
-- Idempotente y solo añade columnas. La única política que cambia es la de
-- LECTURA de `quests`, y se recrea entera.
-- ============================================================================

-- 1. LAS DOS COLUMNAS --------------------------------------------------------
-- assigned_character_id: la FICHA a la que se asigna, no el jugador. De ficha
-- se llega siempre al jugador (characters.user_id); al revés no, porque un
-- jugador tiene hasta 3 fichas. Y así la misión muere con la ficha archivada:
-- el encargo era de ESE personaje, no lo hereda el siguiente.
-- NULL = misión del grupo, que es como se comportan todas las que ya existen.
alter table public.quests add column if not exists assigned_character_id uuid
  references public.characters(id) on delete set null;

-- npc_id: el PNJ de `location_npcs` que la encarga (y ante quien se entrega).
-- NULL = misión de tablón o del DM, sin PNJ detrás.
alter table public.quests add column if not exists npc_id bigint
  references public.location_npcs(id) on delete set null;

-- ⚠️ `on delete set null` en las dos, y NO `cascade` como en v14/v19.
-- Borrar un PNJ al reordenar un POI no puede llevarse por delante la misión
-- que encargó, y borrar un personaje de verdad debe devolver su misión al
-- grupo, no evaporarla. Archivar NO borra (`archived_at`), así que el camino
-- normal de retirar un personaje ni siquiera toca esto.

-- Índices para las dos consultas nuevas: «mis misiones» y «las de este PNJ».
create index if not exists quests_assigned_idx
  on public.quests (assigned_character_id) where assigned_character_id is not null;
create index if not exists quests_npc_idx
  on public.quests (npc_id) where npc_id is not null;

-- 2. LA LECTURA: UNA MISIÓN ASIGNADA ES PRIVADA ------------------------------
-- La política de v12 era `status <> 'oculta' or is_dm()`: todo el grupo veía
-- toda misión no oculta. Con misiones individuales eso hace que «individual»
-- no signifique nada. Se recrea con tres ramas:
--   · el DM lo ve todo, como siempre;
--   · una misión SIN asignar sigue siendo del grupo (comportamiento de hoy);
--   · una asignada solo la ve quien tiene esa ficha — incluidas sus fichas
--     ARCHIVADAS: la misión de un personaje retirado sigue siendo suya de leer.
-- `oculta` sigue siendo el borrador del DM y no se le enseña ni a su asignado.
drop policy if exists "misiones: leer visibles" on public.quests;
create policy "misiones: leer visibles" on public.quests
  for select to authenticated using (
    public.is_dm()
    or (status <> 'oculta' and assigned_character_id is null)
    or (status <> 'oculta' and assigned_character_id in (
          select c.id from public.characters c where c.user_id = auth.uid()))
  );

-- La ESCRITURA no cambia: `quests` sigue siendo DM-only ("misiones: el DM
-- gestiona", v12). Los dos caminos del jugador —aceptar y entregar— van por
-- service_role desde /api, igual que /api/aceptar-encargo desde la v17.
-- Realtime tampoco cambia: `quests` está en la publicación desde la v12.
