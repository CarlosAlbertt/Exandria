# Plan — Fase M (partes 2 y 3)

Spec: `docs/superpowers/specs/2026-07-19-fase-m-completar-design.md`. Rama
`fase-m-completa`. Gate: `npx tsc --noEmit` + `npx next build`.

## Documentos in-game
1. `Item.doc`/`ItemDoc` en `lib/character.ts`; `doc` en `addItems` de
   `/api/dm/character` (no fusiona documentos). `generarDocumento` en
   `lib/generar.ts`.
2. `StashEntry.doc` en `lib/useDmStash.ts`; sección «Documento in-game» + «✨ IA»
   en `BaulPanel`; pasar `doc` al entregar; marcador en la lista.
3. `DocViewer` + botón «Leer» en `CharacterSheet`.

## Memoria de NPC
4. `supabase/schema_v18.sql` (npc_memories + RLS + realtime idempotente).
5. `lib/useNpcMemory.ts`.
6. `NpcChat` con `memoryRef` (carga+inyecta, resume+guarda al cerrar);
   `NpcSection` lo pasa; bloque «Memorias» en `NpcsPanel`.

## Docs
7. HANDOFF + vault; merge a master + push.
