# Plan — Fase N (parte 1): clima por región y estación

Spec: `docs/superpowers/specs/2026-07-19-fase-n-clima-design.md`. Rama
`fase-n-clima`. Gate por commit: `npx tsc --noEmit` + `npx next build`.

## Tarea 1 — `lib/weather.ts`
Tipos `Weather`/`Zone`, tablas zona×estación, `zoneFor` (explícito Tal'Dorei →
heurística → continente → templado), `weatherFor(...)` determinista por semilla,
`ambientLine`.

## Tarea 2 — `/lugar`
Badge de clima bajo la cabecera (useGameClock + weatherFor). Pasa `ambient` a
ShopSection y NpcSection.

## Tarea 3 — inyección en NPCs
`ShopSection` y `NpcSection` aceptan `ambient?: string` y lo añaden al persona.

## Tarea 4 — nav
`PartyLocationWidget` muestra icono + temperatura del clima del lugar del grupo.

## Tarea 5 — docs
HANDOFF + vault; merge a master + push.
