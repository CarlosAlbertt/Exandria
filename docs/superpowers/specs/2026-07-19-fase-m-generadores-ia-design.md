# Fase M — Caja de herramientas IA del DM 🤖 (diseño)

**Fecha**: 2026-07-19 · **Rama**: `fase-m-generadores-ia`

## Contexto
La Fase M de la guía tiene tres piezas: (1) **generadores IA** en los formularios
del DM, (2) **documentos in-game** (item legible + visor), (3) **memoria de NPC**
(tabla nueva, resumen al cerrar chat). La guía dice que M «se implementa primero»
porque multiplica el resto.

## Alcance de esta sesión: solo (1), los generadores
Es lo que tiene **superficie hoy** y **sin migración**: los tres formularios DM
ya existen (`NpcsPanel`, `TiendasPanel`, `CronicaPanel`) y `/api/ia` (proxy a
Ollama) ya funciona. Botón **«✨ IA»** que pide a la IA un JSON y rellena/crea.

**Diferido** (fuera de esta sesión):
- **Documentos in-game**: necesita un campo `doc` en items + entrega por Baúl +
  visor de pergamino en el inventario. Es una feature propia (M-docs).
- **Memoria de NPC**: necesita **migración** (`npc_memories`) + resumir al cerrar
  el chat + inyectar al system prompt. Va con su schema (M-memory).
- **Catálogo de tienda por IA**: ya hay «Semilla {kind}» con precios PHB; generar
  el catálogo con IA se difiere (el generador cubre el tendero, no el stock).

## Cómo generan (`lib/generar.ts`)
`/api/ia` acepta `persona` (system prompt) + `messages` y devuelve `reply` (texto
libre). Para obtener estructura:
- `generarJSON<T>(persona, prompt)`: llama `narrar` con un persona que **exige
  JSON puro** (sin markdown, claves exactas, en español, ambientado en
  Exandria/Tal'Dorei) y **parsea con tolerancia** (quita vallas ```json, recorta
  del primer `{` al último `}`, `JSON.parse`). Devuelve `{ ok, data } | { ok:false,
  error, offline }`. Propaga `offline` para desactivar el botón sin ruido.
- Envoltorios tipados:
  - `generarNpc(pista, poi)` → `{ name, role, prompt }`
  - `generarTienda(pista, kind, poi)` → `{ name, greeting, npc_prompt }`
  - `generarEncargo(pista, poi)` → `{ title, body, reward }`

`pista` es texto opcional que el DM ya tiene escrito (nombre a medias, «tabernero
elfo gruñón»); si está vacío, la IA inventa de cero coherente con el POI.

## UX por formulario
- **NpcsPanel** (fila «Nuevo PNJ»): botón «✨ IA» usa el campo *nombre* como
  pista. Al generar crea el PNJ ya formado (`createNpc` + `updateNpc` con el
  prompt) y recarga. El DM lo retoca en el editor como siempre.
- **TiendasPanel** (fila «Nueva tienda»): botón «✨ IA» usa *nombre*+*tipo* como
  pista. Crea la tienda (`createShop`) y le pone `greeting`/`npc_prompt`
  generados. El catálogo sigue en «Semilla».
- **CronicaPanel** (form de misiones): botón «✨ IA» usa *título*/*POI* como
  pista y **rellena el formulario** (título, cuerpo, recompensa) sin escribir en
  BD — el DM ajusta estado/POI y guarda. Encaja con el tablón de la Fase F.

Con el túnel caído (`offline`), el botón se desactiva y muestra un aviso; los
formularios manuales no dependen de la IA.

## Verificación
`npx tsc --noEmit` + `npx next build` limpios (gate real). Sin sesión DM ni túnel
en dev no se prueba en vivo; prueba del usuario con Ollama arriba.
