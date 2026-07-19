# Plan — Fase F: Tablón de misiones

Spec: `docs/superpowers/specs/2026-07-19-fase-f-tablon-design.md`. Rama
`fase-f-tablon`. Un commit por tarea. Gate por commit: `npx tsc --noEmit` +
`npx next build`.

## Tarea 1 — Migración `schema_v17.sql`
`supabase/schema_v17.sql` idempotente: recrear `quests_status_check` con
`'oferta'`; `add column if not exists poi_name text`; `add column if not exists
reward text not null default ''`. Sin tocar RLS ni Realtime (`quests` ya está).

## Tarea 2 — Tipo `Quest` + hook
`lib/useChronicle.ts`: `status` gana `'oferta'`; `Quest` gana
`poi_name: string | null` y `reward: string`; `QUEST_FIELDS` añade
`poi_name, reward`.

## Tarea 3 — Form DM
`app/dm/CronicaPanel.tsx`: `QUEST_LABEL`/`QUEST_COLOR` ganan `'oferta'`;
`EMPTY_QUEST` gana `poi_name`/`reward`; el form añade input POI (con `<datalist>`
de POIs del atlas vía `useAtlas`) + input recompensa; `edit()` y `save()` los
incluyen; la lista muestra recompensa/POI.

## Tarea 4 — Endpoint + cliente
`app/api/aceptar-encargo/route.ts` (service_role): valida quest en `'oferta'`,
pasa a `'activa'`, appendea nota con el nombre del personaje activo.
`lib/encargo.ts`: `aceptarEncargo(id)` (espejo de `lib/descanso.ts`).

## Tarea 5 — `TablonSection` + limpieza
`components/lugar/TablonSection.tsx`: ofertas del POI + botón Aceptar.
Montarla en `app/lugar/page.tsx`. Quitar la tarjeta placeholder «Tablón» de
`ServiceSections.tsx` (queda sin cards → se retira del render de `/lugar`).

## Tarea 6 — Docs
Actualizar `HANDOFF.md` (sección RESUELTO Fase F + migraciones) y el vault.
Merge a master + push.
