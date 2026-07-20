# Plan — Saber por origen

Spec: `docs/superpowers/specs/2026-07-19-saber-por-origen-design.md`. Rama
`fase-n-saber-origen`. Gate por etapa: `npx tsc --noEmit` + `npx next build`.

## Etapa 1 — Núcleo (migración + modelo + creador + /reino)
1. `supabase/schema_v19.sql`: columnas de `characters` (origin_continent,
   origin_region, deity, lore_unlocked), `quests.unlock_lore`, tabla `lore_rolls`.
2. `data/saber.ts`: tipos + derivación de entradas desde pantheon/REGIONS/
   WORLD_POIS + la capa curada de `loreTiers.ts`.
3. `lib/saber.ts`: `knows(entry, ctx)` puro + `SaberCtx`.
4. `lib/character.ts`: campos nuevos en `CharacterData` + `FIELDS`.
5. Creador: origen (continente + subregión) y deidad opcional en `BackgroundScene`.
6. `components/SaberSection.tsx`: reescrito sobre el modelo nuevo.

## Etapa 2 — Tomos y DM a mano
7. `ItemDoc.unlockLore`; el visor concede al abrir; selector en el Baúl.
8. Op `unlockLore` en `/api/dm/character`; concesión manual en Panel DM › Grupo.

## Etapa 3 — Misiones
9. `Quest.unlock_lore` en el hook + form del DM; al completar, reparte al grupo.

## Etapa 4 — Tirada de saber in situ
10. Entradas ligadas a POI; botón «¿Qué sé de esto?» en `/lugar` con dados 3D;
    persistencia en `lore_rolls` (una por lugar+PJ).

## Docs
11. HANDOFF + vault; merge a master + push.
