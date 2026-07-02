-- ============================================================================
-- Tal'Dorei — esquema v6 (ejecutar DESPUÉS de v1..v5)
-- Portavoz de la acción de grupo: solo un jugador redacta y envía la respuesta;
-- el resto ve el borrador y marca "de acuerdo".
-- ============================================================================

alter table public.group_action add column if not exists speaker uuid;
