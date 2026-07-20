# Saber por origen — cada PJ sabe lo suyo, y descubre el resto 📚 (diseño)

**Fecha**: 2026-07-19 · **Rama**: `fase-n-saber-origen`

Rediseño del «saber del mundo» de la Fase N. Decisiones tomadas con el usuario:

1. **Base por origen + deidad**, y **además** las pericias siguen abriendo lore
   erudita (las dos vías conviven).
2. **Región = continente Y subregión** (si el continente es Tal'Dorei).
3. **Deidad opcional** en el creador: eliges patrón o «sin fe».
4. **Cuatro vías de descubrimiento**: tomos/documentos, misiones completadas,
   concesión manual del DM y **tirada de saber in situ**.

## Principio: derivar, no duplicar
La lore base **no se escribe a mano otra vez**: se deriva de datos que ya
existen — `data/pantheon.ts` (33 deidades con `blurb`, `commandments`, `holyDay`,
`symbol`), `data/taldorei.ts` (`REGIONS` con `blurb`, `capital`, `feature`) y
`data/world.ts` (`WORLD_POIS` de tipo continente con su `blurb`). Solo se
mantiene a mano la capa curada de `data/loreTiers.ts` (erudito + secreto).

## Modelo de conocimiento (`data/saber.ts` + `lib/saber.ts` puro)
```ts
type SaberScope =
  | { kind: "continente"; continent: string }   // básico: todos · profundo: si eres de allí
  | { kind: "region"; regionSlug: string }      // si es TU subregión
  | { kind: "deidad"; deitySlug: string }       // si es TU deidad
  | { kind: "erudito"; skill: LoreSkill }       // si tienes la pericia
  | { kind: "secreto" };                        // si el DM lo reveló
type SaberEntry = { id; scope; depth: "basico"|"profundo"; topic; title; text };
```
`knows(entry, ctx)` con
`ctx = { isDm, originContinent, originRegion, deity, skills, unlocked, revealed }`.
**Cualquier entrada** se abre además si su `id` está en `unlocked` (lo aprendido
por el personaje) — esa es la puerta de las cuatro vías de descubrimiento.

## Migración `schema_v19` (agrupada)
- `characters`: `origin_continent text`, `origin_region text`, `deity text`,
  `lore_unlocked jsonb not null default '[]'`.
- `quests`: `unlock_lore jsonb not null default '[]'` (ids que enseña al
  completarse).
- Tabla `lore_rolls (character_id, poi_name, total, updated_at)`, PK compuesta —
  **una tirada de saber por lugar y personaje** (filosofía de la Fase K).

## Creador
El origen y la fe se piden en el paso **Trasfondo** (no se añade una runa nueva:
evita tocar el gate de 6 pasos). Continente → si es Tal'Dorei, subregión →
deidad (o «sin fe»). Todo **opcional**: sin origen simplemente sabes lo básico.

## Las cuatro vías de descubrimiento
- **Tomos/documentos**: `ItemDoc.unlockLore?: string[]`. Al abrir el documento en
  el visor, esas entradas se añaden al `lore_unlocked` **de ese personaje**. El
  DM elige qué enseña el tomo desde el Baúl.
- **Misiones**: `quests.unlock_lore`. Al pasar una misión a `completada`, el DM
  la reparte al grupo (vía `/api/dm/character`, op `unlockLore`).
- **DM a mano**: en Panel DM › Grupo, dar una entrada a un jugador concreto.
- **Tirada in situ**: en `/lugar`, botón «¿Qué sé de esto?» → tirada de
  Historia/Arcanos/Religión con los dados 3D → por tramos de total desbloquea
  entradas ligadas a ese lugar; se persiste en `lore_rolls` (una por lugar+PJ).

## Verificación
`npx tsc --noEmit` + `npx next build` limpios por etapa. Sin sesión en dev no se
prueba en vivo; prueba del usuario tras `schema_v19.sql`.
