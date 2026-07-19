# Fase N (partes 2 y 3) — saber del mundo + pistas/rumores 🌍 (diseño)

**Fecha**: 2026-07-19 · **Rama**: `fase-n-completa`

Completa la Fase N (la parte 1, clima, ya está). **Sin migración** (todo en
`app_config` + la ficha).

## Saber del mundo por personaje
La lore de `/reino` se estratifica en tres capas sin tocar el contenido estático
existente: se añade una **sección nueva** «Saber del mundo» con un dataset
curado por niveles.
- **Dato**: `data/loreTiers.ts` — `LoreEntry { id, tier, unlockSkill?, topic,
  title, text }`. `tier ∈ comun | erudito | secreto`. Redacción propia.
- **Común**: visible para todos.
- **Erudito**: se abre si el personaje **tiene la pericia** (`unlockSkill`:
  Historia/Arcanos/Religión/Naturaleza) — se lee de la ficha activa
  (`loadActiveCharacter().skills`). Si no, tarjeta bloqueada «requiere X».
- **Secreto**: lo revela el **DM** — `app_config.lore_revealed` (JSON de ids,
  `lib/useLoreRevealed.ts`, optimista). Los no revelados **no se listan** a los
  jugadores (ni el título). El DM lo ve todo y **revela/oculta inline** (no hace
  falta un panel aparte).
- **UI**: `components/SaberSection.tsx` (client island) montado en `/reino`.
- **Diferido**: la **tirada de saber in situ** (botón «¿Qué sé de esto?» en un
  lugar → tirada de Historia/Arcanos/Religión con dados 3D → revela lore de ese
  POI, persistida por lugar+PJ como la Fase K). Es un submecanismo de dados +
  persistencia por-POI propio; se deja para N-tirada.

## Pistas y rumores
- **Dato**: `app_config.clues` (JSON, volumen bajo) — `Clue { id, texto, mision?,
  lugar?, discovered, rumor }`. `lib/useClues.ts` (optimista, CRUD DM).
- **DM**: sección «Pistas y rumores» en `CronicaPanel` — crear (texto, misión
  ligada con datalist de quests, lugar con datalist de POIs, flag **rumor**),
  **revelar/ocultar**, borrar.
- **Jugador**: las pistas **descubiertas** aparecen en `/cronica` (bloque
  «Pistas», ligadas a su misión/lugar).
- **Rumores**: las pistas con `rumor` y sin descubrir se **siembran en los NPCs
  IA** de `/lugar` (se añaden al `ambient` que ya reciben tendero/PNJ, filtradas
  al POI actual o sin lugar) para que las dejen caer. El DM las marca como
  descubiertas a mano cuando el grupo las pilla.

## Verificación
`npx tsc --noEmit` + `npx next build` limpios. Sin sesión en dev no se prueba en
vivo.
