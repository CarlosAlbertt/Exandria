-- ============================================================================
-- Exandria — esquema v25 (ejecutar DESPUÉS de v1..v24)
-- SUB-LUGARES: un PNJ puede estar en un sitio concreto del pueblo (la taberna,
-- el cementerio) y no en el pueblo entero. Hasta ahora `location_npcs` solo
-- sabía de `poi_name`, así que en Byroden salían todos juntos.
--
-- Idempotente y solo añade una columna. Sin RLS nueva y sin tocar realtime.
-- ============================================================================

-- venue: id del nodo donde está el PNJ (p. ej. 'sub:Byroden/taberna').
--
-- ⚠️ **NULL = el pueblo entero**, y eso es lo que hace que la migración no
-- rompa nada: todos los PNJ que el DM ya tiene creados se quedan con `venue`
-- nulo y siguen saliendo exactamente donde salían. Solo los que él mueva a
-- mano dejarán de verse en la plaza.
alter table public.location_npcs add column if not exists venue text;

-- Los PNJ de un sitio se piden por (poi_name, venue) en cada pantalla.
create index if not exists location_npcs_venue_idx
  on public.location_npcs (poi_name, venue);

-- RLS: las políticas de v16 ya dicen lo que hace falta —los jugadores ven los
-- públicos, el DM gestiona— y NO cambian: `venue` no es un eje de permisos,
-- es de colocación. Un PNJ escondido se esconde con `public`, como siempre.
-- Realtime tampoco: `location_npcs` está en la publicación desde la v16.
