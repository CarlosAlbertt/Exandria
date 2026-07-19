# Fase C — Tiendas con IA 🛒

**Fecha**: 2026-07-17
**Estado**: diseño (autónomo), pasa directo a plan

## Objetivo

El jugador compra y vende contra su **ficha real** (oro + inventario) en las
tiendas de un POI, con un **tendero IA** que atiende. Vive en `/lugar` (Fase B).

## Alcance

Core transaccional + tendero IA. **Diferido a follow-up (C2)**: el **regateo**
(tirada de Persuasión con dados 3D + descuento por tramos + una vez por descanso)
— depende del control de descansos (Fase D) y añade estado por-descanso; se hará
cuando D exista o como C2 aparte.

## Migración (paso manual del usuario)

**`supabase/schema_v15.sql`** (la guía la llamaba v13, pero v13/v14 ya están
usadas; la siguiente libre es **v15**). Idempotente, patrón de `schema_v11`:

- **`shops`**: `id` (identity PK), `poi_name text`, `name text`, `kind text`
  (herreria/alquimista/general/magica/…), `npc_prompt text`, `greeting text`,
  `created_at`. RLS: select autenticados; **all** DM (`is_dm()`).
- **`shop_items`**: `id`, `shop_id` (fk → shops, on delete cascade), `name`,
  `price int`, `stock int` (**nullable** = ilimitado), `notes text`. RLS: select
  autenticados; insert/delete DM; **update autenticados** (para que el jugador
  decremente stock al comprar — modelo de confianza de mesa, como el resto).
- **`shop_log`**: `id`, `shop_id` (fk), `user_id` (fk auth.users), `item text`,
  `price int`, `kind text check (kind in ('compra','venta'))`, `created_at`. RLS:
  select autenticados; insert propio (`user_id = auth.uid()`); delete DM.
- **Realtime**: `shop_items` y `shop_log` (stock y actividad en vivo).

## Datos semilla

`data/shopTemplates.ts`: catálogos base por `kind` (equipo PHB con precios
estándar — hechos de juego). Ej.: `herreria` (espada corta 10, cota de malla 75…),
`alquimista` (poción de curación 50, ácido 25…), `general` (raciones, cuerda,
antorcha…). `SHOP_TEMPLATES: Record<string, { name: string; price: number }[]>`.

## Hook y transacciones

`lib/useShops.ts` (`"use client"`):
- `useShops(poiName)` → `{ shops, ready }` donde cada shop trae sus `items`.
  Carga `shops` where `poi_name = poiName` + sus `shop_items`; realtime sobre
  `shop_items` y `shop_log` (recarga).
- **DM CRUD**: `createShop`, `updateShop`, `deleteShop`, `addItem`, `updateItem`,
  `deleteItem`, `seedCatalog(shopId, kind)` (inserta el template).
- **Transacción del jugador** (`lib/shopTx.ts`, puro + BD):
  - `buy(char, item, shop)`: si `char.gold >= item.price` y (`item.stock` null o
    `> 0`): `saveCharacter(char.id, { gold: char.gold - item.price, items:
    mergeItem(char.items, item.name) })`; si stock no es null, `shop_items.update`
    stock-1; insert `shop_log { shop_id, user_id, item, price, kind:'compra' }`.
  - `sell(char, ownItem, shop, price)`: `price = floor(base/2)` (regla fija por
    ahora); suma oro, quita 1 del item del inventario; insert `shop_log
    kind:'venta'`. (El precio de venta base lo teclea el jugador o se toma del
    catálogo si el item existe en la tienda; v1: mitad del precio de catálogo si
    coincide por nombre, si no, 0/deshabilitado.)
  - Validación en cliente (oro/stock); errores en español.

La ficha activa del jugador se obtiene con `loadActiveCharacter(userId)`
(`lib/character.ts`); `saveCharacter(id, patch)` ya persiste oro/items con la
sesión del jugador (RLS de propietario, igual que la tirada de PG).

## Tendero IA

Dentro de la vista de tienda, un chat estilo Taberna: reutiliza `narrar({
messages, persona })` (`lib/narrador.ts`) con `persona = npc_prompt + catálogo
inyectado` (nombres/precios/stock) para que recomiende. Los **botones** ejecutan
la compra/venta; la IA solo charla. Si la IA está offline, la tienda funciona
igual (el chat degrada).

## Editor DM

Nueva pestaña **"Tiendas"** en `DmDashboard` (`app/dm/TiendasPanel.tsx`): crear
tienda (POI por selector del atlas o texto, `kind`, `npc_prompt`, `greeting`),
CRUD de catálogo (item: nombre/precio/stock/notas), y botón **"Semilla {kind}"**
que rellena desde `SHOP_TEMPLATES`. Guardado directo a la BD (realtime refleja).

## `/lugar`

Bajo la cabecera del POI, `<ShopSection poiName={poi.name} />`
(`components/lugar/ShopSection.tsx`): lista las tiendas del POI (de `useShops`);
al abrir una, muestra saludo + catálogo (nombre/precio/stock) con botón
**Comprar** (deshabilitado si falta oro/stock), la sección **Vender** (items del
jugador), el **chat del tendero**, y un pequeño **registro** reciente
(`shop_log`). La tarjeta placeholder "Tienda" de `ServiceSections` (Fase B) se
**retira** (ahora es real); posada/NPCs/tablón siguen como placeholder.

## Fuera de alcance (YAGNI)

- Regateo (dados + once-per-rest) → C2/Fase D.
- Feed global cross-app de la compra (por ahora el `shop_log` en vivo dentro de
  `/lugar` cumple "que todos lo vean" en la tienda). Enlace a Crónica: luego.
- Catálogos por nivel/rareza avanzados; economía dinámica. YAGNI.

## Verificación

- `tsc --noEmit` + `next build` limpios; `check-*` existentes verdes.
- **Migración**: el usuario ejecuta `schema_v15.sql`. Sin ella, `useShops` no
  encuentra tablas y la sección tienda queda vacía (no rompe `/lugar`).
- **Sin sesión en dev**: no se prueba en vivo (superficies con sesión). El
  usuario prueba: crear tienda + catálogo (DM), comprar/vender desde `/lugar`
  con un jugador, ver oro/inventario y stock cambiar, y el chat del tendero.

## Nota

Realtime aquí SÍ (tablas propias en la publicación), a diferencia de `app_config`.
`shop_items`/`shop_log` disparan; no hace falta update optimista (aunque para
snappiness la compra puede refrescar local igualmente).
