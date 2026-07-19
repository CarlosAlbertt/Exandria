# Plan — Fase M: generadores IA del DM

Spec: `docs/superpowers/specs/2026-07-19-fase-m-generadores-ia-design.md`. Rama
`fase-m-generadores-ia`. Gate por commit: `npx tsc --noEmit` + `npx next build`.

## Tarea 1 — `lib/generar.ts`
`generarJSON<T>(persona, prompt)` (parseo tolerante sobre `narrar`) +
`generarNpc`/`generarTienda`/`generarEncargo` con sus personas y tipos.

## Tarea 2 — NpcsPanel
Botón «✨ IA» en la fila «Nuevo PNJ»: genera {name,role,prompt}, crea el PNJ
formado, recarga. Estado busy/error, deshabilita si offline.

## Tarea 3 — TiendasPanel
Botón «✨ IA» en «Nueva tienda»: genera {name,greeting,npc_prompt}, crea la
tienda y le pone greeting/prompt. Catálogo sigue en «Semilla».

## Tarea 4 — CronicaPanel
Botón «✨ IA» en el form de misiones: genera {title,body,reward} y rellena el
form (sin escribir en BD). El DM ajusta estado/POI y guarda.

## Tarea 5 — Docs
HANDOFF + vault; merge a master + push.
