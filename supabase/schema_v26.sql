-- ============================================================================
-- Exandria — esquema v26 (ejecutar DESPUÉS de v1..v25)
-- ÁRBOLES DE DIÁLOGO: un PNJ puede tener una conversación ESCRITA, con tiradas
-- de pericia, consecuencias y etapas, en vez de solo el chat libre con IA.
--
-- Idempotente y solo añade una columna. Sin RLS nueva y sin tocar realtime.
-- ============================================================================

-- dialogo: clave del árbol en `data/dialogos.ts` (p. ej. 'mirna').
--
-- ⚠️ **Va una CLAVE y no el árbol entero, y tampoco el id del PNJ.** Los PNJ de
-- esta app son filas que crea el DM, así que su `id` cambia si borra y recrea a
-- alguien: un árbol atado a `npc:42` se quedaría huérfano en silencio. La clave
-- es estable y la elige el DM de una lista en el panel.
--
-- ⚠️ **NULL = solo chat libre con IA**, que es como funcionan todos los PNJ que
-- ya existen. Nadie pierde su conversación por esta migración.
alter table public.location_npcs add column if not exists dialogo text;

-- RLS: las políticas de v16 siguen valiendo. `dialogo` no es un eje de
-- permisos —lo que se esconde se esconde con `public`—, es de contenido.
-- Realtime tampoco cambia: la tabla está en la publicación desde la v16.
--
-- La confianza, la etapa y las opciones quemadas NO van aquí: viven en
-- `characters.play_state.pnj`, porque son del JUGADOR y no del PNJ, y porque
-- `characters` sí está en la publicación realtime. Eso no necesita migración.
