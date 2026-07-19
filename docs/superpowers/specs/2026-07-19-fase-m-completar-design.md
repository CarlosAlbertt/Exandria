# Fase M (partes 2 y 3) — documentos in-game + memoria de NPC 🤖 (diseño)

**Fecha**: 2026-07-19 · **Rama**: `fase-m-completa`

Completa la Fase M (la parte 1, generadores IA, ya está). Cierra las dos piezas
que quedaban diferidas.

## Documentos in-game (sin migración)
Objeto **legible** que el DM entrega y el jugador abre en un visor de pergamino.
- **Dato**: `Item.doc?: { titulo, texto, imagen? }` dentro de `items` (jsonb) —
  `lib/character.ts` (tipo `ItemDoc`). El endpoint `/api/dm/character` acepta
  `doc` en `addItems` y **nunca fusiona** un documento por nombre (cada carta es
  única); el resto de objetos sí apila.
- **DM (Baúl)**: `BaulPanel` gana una sección plegable «Documento in-game»
  (título, texto, imagen URL) + botón **«✨ IA»** (`generarDocumento` en
  `lib/generar.ts` → `{titulo, texto}`). La entrada del baúl lleva el `doc`
  adjunto (marcador «documento») y se pasa al entregar.
- **Jugador**: en `CharacterSheet`, los objetos con `doc` muestran un botón
  **«Leer»** que abre `DocViewer` (modal pergamino a pantalla completa). Visible
  también en la hoja de solo-lectura (el jugador lee su propio documento).

## Memoria de NPC (migración `schema_v18`)
El NPC IA **recuerda** entre visitas, por jugador.
- **Dato**: tabla `npc_memories (npc_ref, user_id, summary, updated_at)`, PK
  `(npc_ref, user_id)`. RLS: el jugador gestiona la suya (`user_id = auth.uid()`),
  el DM todas (`is_dm()`). Realtime. `npc_ref` = `npc:{location_npcs.id}`.
- **`lib/useNpcMemory.ts`**: `loadMemory`/`saveMemory` (jugador),
  `listMemories`/`updateMemory`/`deleteMemory` (DM).
- **`NpcChat`** gana `memoryRef?`: al abrir carga el resumen del jugador y lo
  **inyecta al system prompt** («Recuerdas de encuentros pasados…»); al cerrar
  (desmontar) con conversación, pide a la IA un **resumen** (integrando el previo)
  y lo persiste (fire-and-forget en el cleanup). `NpcSection` pasa
  `memoryRef={npc:<id>}`. El tendero (`ShopSection`) **no** lleva memoria en esta
  entrega (queda para más adelante si hace falta).
- **DM**: en `NpcsPanel`, cada NPC tiene un bloque plegable **«Memorias»** para
  leer/editar/olvidar lo que recuerda de cada jugador.

## Verificación
`npx tsc --noEmit` + `npx next build` limpios. Sin sesión ni túnel en dev no se
prueba en vivo; prueba del usuario tras `schema_v18.sql`.
