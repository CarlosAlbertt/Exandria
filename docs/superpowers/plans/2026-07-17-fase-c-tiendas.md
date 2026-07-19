# Fase C — Tiendas con IA · Implementation Plan

> **For agentic workers:** ejecutar task-by-task; gates `tsc --noEmit` + `next build`.

**Goal:** Comprar/vender contra la ficha real en tiendas de un POI, con tendero IA, dentro de `/lugar`.

**Architecture:** Migración `schema_v15.sql` (shops/shop_items/shop_log, RLS, realtime). Hook `useShops(poiName)` (carga + realtime + CRUD DM). Transacción de compra/venta contra `characters` vía `saveCharacter`. Editor DM en pestaña «Tiendas». UI en `/lugar` con catálogo, botones y chat IA (reusa `narrar`).

**Tech Stack:** Next.js 16, React 19, TS, Supabase (Postgres+RLS+Realtime), `@supabase/ssr`.

**Verificación:** `tsc` + `build`. Migración = paso manual del usuario. Sin sesión en dev → prueba en vivo del usuario.

**Spec:** `docs/superpowers/specs/2026-07-17-fase-c-tiendas-design.md`

**Convenciones:** commits con trailer `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`, autor `CarlosAlbertt`. Realtime SÍ (tablas propias). Sin tests unitarios.

---

### Task 1: Migración `schema_v15.sql` + plantillas

- Create `supabase/schema_v15.sql` (patrón `schema_v11`): tablas `shops`,
  `shop_items`, `shop_log` con RLS y realtime (ver spec §Migración). Idempotente.
- Create `data/shopTemplates.ts`: `SHOP_TEMPLATES: Record<string, {name:string;price:number}[]>`
  con `herreria`, `alquimista`, `general` (equipo PHB, precios estándar).
- Verify: `tsc` + `build`. Commit.

### Task 2: `lib/useShops.ts` (carga + realtime + CRUD DM)

- `useShops(poiName)` → `{ shops, ready }`, cada shop con `items`. Carga shops por
  `poi_name` + `shop_items`; canal realtime sobre `shop_items` y `shop_log`.
- Exports CRUD (funciones sueltas, no en el hook): `createShop`, `updateShop`,
  `deleteShop`, `addItem`, `updateItem`, `deleteItem`, `seedCatalog(shopId, kind)`.
- Tipos `Shop`, `ShopItem`.
- Verify + commit.

### Task 3: `lib/shopTx.ts` (compra/venta contra la ficha)

- `mergeItem(items, name)`: sube qty si existe, si no añade `{ id, name, qty:1 }`.
- `buy(char, item, shopId)`: valida oro/stock; `saveCharacter(char.id, {gold, items})`;
  si `stock!=null` update `shop_items` stock-1; insert `shop_log kind:'compra'`.
  Devuelve `{ ok } | { error }`.
- `sell(char, ownItem, shopId, price)`: suma oro, quita 1 del item; insert
  `shop_log kind:'venta'`. `price = floor(catalogPrice/2)`.
- Verify + commit.

### Task 4: Editor DM — pestaña «Tiendas»

- Create `app/dm/TiendasPanel.tsx`: selector de POI (de `useAtlas`, todos los POIs
  de todos los continentes/regiones), crear/editar/borrar tienda (kind, prompt,
  greeting), CRUD de catálogo, botón «Semilla {kind}».
- Modify `app/dm/DmDashboard.tsx`: tab `"tiendas"` (icono `fa-store`) + render.
- Verify + commit.

### Task 5: `/lugar` — ShopSection + chat IA

- Create `components/lugar/ShopSection.tsx`: `useShops(poiName)`; lista tiendas;
  al abrir una → catálogo (Comprar), Vender (items del jugador), chat del tendero
  (`narrar` con persona = prompt+catálogo), y `shop_log` reciente. Usa un hook/estado
  para la ficha activa del jugador (`loadActiveCharacter` con el user de sesión;
  reusa `useRole`/`SessionProvider` para el user id — ver cómo `/personaje` lo hace).
- Modify `app/lugar/page.tsx`: render `<ShopSection poiName={poi.name} />` bajo la
  cabecera. Modify `components/lugar/ServiceSections.tsx`: quitar la tarjeta «Tienda»
  (ahora real).
- Verify + commit.

### Task 6: Docs

- `HANDOFF.md` milestone Fase C (+ paso manual `schema_v15.sql`). Vault Historial +
  Pendientes (marcar C hecha, migración pendiente, regateo diferido a C2/D). Commit
  (solo repo; vault fuera de git).

---

## Notas de implementación
- La ficha del jugador en `/lugar`: obtener `user.id` de la sesión (Supabase
  `auth.getUser()` cliente, o el contexto de `SessionProvider`), luego
  `loadActiveCharacter(userId)`. Si no hay ficha activa, la tienda muestra el
  catálogo pero deshabilita Comprar/Vender con aviso.
- Realtime propio: no hace falta update optimista, pero la compra puede refrescar
  la ficha local para snappiness.
- Errores de BD en español.
