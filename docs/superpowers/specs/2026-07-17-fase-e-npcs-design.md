# Fase E — NPCs por ubicación 🗣️

**Fecha**: 2026-07-17 · **Estado**: hecho (autónomo).

## Objetivo
Cada POI puede tener personajes con los que hablar por IA, cada uno con su
personalidad. Vive en `/lugar` (Fase B).

## Implementado
- **Migración `schema_v16.sql`**: tabla `location_npcs` (id, poi_name, name,
  role, prompt, public bool, portrait nullable). RLS: lectura de públicos +
  todos para el DM; escritura DM-only. Realtime.
- **Hook** `lib/useNpcs.ts` (por POI, realtime, CRUD DM).
- **Chat IA reutilizable** `components/lugar/NpcChat.tsx`: `narrar` con
  `persona`. Extraído para reusar (el tendero de la Fase C podría migrar a él más
  adelante; hoy tiene su propio chat inline).
- **`/lugar`** `components/lugar/NpcSection.tsx`: «Gente del lugar», lista los
  NPCs (los jugadores solo ven `public`), abre uno → chat en personaje. Se retiró
  la tarjeta placeholder «Gente del lugar» de `ServiceSections`.
- **Editor DM** `app/dm/NpcsPanel.tsx` (pestaña **«PNJs»**): selector de POI,
  CRUD de NPCs (nombre, rol, prompt, visible, retrato URL).

## Diferido
- **Auto-insert en `npcs_met`** (códice de PNJs conocidos se llena al hablar) —
  requiere fijar el shape de `npcs_met`; se hará con la integración de Crónica.
- **Chat grupal en vivo** por NPC (canal compartido) vs privado: hoy es chat
  local por jugador. Suficiente para empezar.
- **Contexto de reloj/festividad** en el prompt: luego.

## Verificación
`tsc` + `build` limpios. Migración `schema_v16.sql` = paso manual del usuario.
Sin sesión en dev → prueba del usuario: crear un NPC en un POI (Panel DM › PNJs),
hablarle desde `/lugar`.
