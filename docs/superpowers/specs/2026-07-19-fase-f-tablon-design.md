# Fase F — Tablón de misiones 📜 (diseño)

**Fecha**: 2026-07-19 · **Rama**: `fase-f-tablon`

## Objetivo
Ganchos y encargos publicados **por lugar**. El DM publica una **oferta** en un
POI; el jugador la ve en el **tablón** de `/lugar` y la **acepta** → pasa a ser
una misión **activa** del grupo (visible en `/cronica` para todos).

## Modelo de datos (`schema_v17.sql`)
Reutiliza `quests` (schema_v12). Cambios idempotentes:
- **Recrear el CHECK de `status`** para añadir el valor `'oferta'`
  (`activa | completada | fallida | oculta | oferta`). El constraint inline de
  v12 se llama `quests_status_check`; se hace `drop constraint if exists` +
  `add constraint`.
- **`poi_name text`** (nullable): el POI donde se publica la oferta. Coincide
  con `Poi.name` (igual que `party_location.poiName`).
- **`reward text not null default ''`**: recompensa mostrada en el tablón.

**RLS**: sin cambios. La policy de lectura de v12 ya es
`status <> 'oculta' or is_dm()`, así que las ofertas son visibles a los
jugadores. La escritura sigue DM-only; el jugador **no** actualiza `quests`
directamente (lo hace el endpoint con `service_role`).

**`/cronica` no se ensucia**: `CronicaView` filtra explícitamente
`status === 'activa'` (activas) y `completada|fallida` (cerradas); `'oferta'`
(como `'oculta'`) cae fuera de ambas listas. Sin cambios ahí.

## UI DM (ampliar el CRUD de misiones en `CronicaPanel`)
El formulario de misiones ya existe; se amplía:
- `QUEST_LABEL`/`QUEST_COLOR` ganan `'oferta'` («Oferta», color arcano).
- Campos nuevos en el form: **POI** (input con `<datalist>` de todos los POIs
  del atlas → autocompletar sin typos, pero admite texto libre) y
  **recompensa** (texto). En la lista, se muestran junto al estado.
- Publicar una oferta = crear una misión con estado `'oferta'` y su POI.

## UI jugador (`TablonSection` en `/lugar`)
Nueva sección, solo si `poi.services?.tablon`. Lista las quests con
`poi_name === poi.name` y `status === 'oferta'` (vienen de `useChronicle`, ya
realtime). Cada una: título, cuerpo, recompensa, y botón **«Aceptar encargo»**.

## Endpoint `app/api/aceptar-encargo/route.ts`
Patrón de `app/api/descanso`: `service_role`, jugador autenticado. Recibe
`{ id }`. Verifica que la quest existe y está en `'oferta'` (anti-abuso: no
re-aceptar), la pasa a `'activa'` y **añade al body una nota de quién la
aceptó** (nombre de su personaje activo) — así se cumple «con nota de quién lo
aceptó» sin columna nueva. Cliente en `lib/encargo.ts` (espejo de
`lib/descanso.ts`).

## Fuera de alcance / diferido
- Recompensa **mecánica** (oro/XP automáticos al completar): hoy `reward` es
  texto descriptivo; el DM entrega la recompensa a mano como siempre.
- Filtrar ofertas por nivel/facción, caducidad, límite de una por grupo.
- Nota automática en el diario al aceptar (más allá del append al body).

## Verificación
`npx tsc --noEmit` + `npx next build` limpios (gate real, sin tests unitarios).
Sin sesión en dev no se prueba en vivo; prueba del usuario tras `schema_v17.sql`.
