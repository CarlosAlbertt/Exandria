# Plan — Fase N (partes 2 y 3)

Spec: `docs/superpowers/specs/2026-07-19-fase-n-completar-design.md`. Rama
`fase-n-completa`. Gate: `npx tsc --noEmit` + `npx next build`. Sin migración.

## Saber del mundo
1. `data/loreTiers.ts` (dataset por niveles).
2. `lib/useLoreRevealed.ts` (app_config.lore_revealed, optimista).
3. `components/SaberSection.tsx` (gate por pericia + DM reveal inline); montar en
   `/reino`.

## Pistas y rumores
4. `lib/useClues.ts` (app_config.clues, optimista, CRUD).
5. `PistasSection` en `CronicaPanel` (crear/revelar/borrar).
6. Bloque «Pistas» descubiertas en `CronicaView`.
7. Siembra de rumores en el `ambient` de los NPCs desde `/lugar`.

## Docs
8. HANDOFF + vault; merge a master + push.
