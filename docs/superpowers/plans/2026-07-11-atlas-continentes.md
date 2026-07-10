# Plan — Atlas: regiones explorables en todos los continentes

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Que Issylra, Wildemount, Marquet y Dientes Rotos tengan regiones explorables como Tal'Dorei: click continente → sus regiones → `RegionExplore` (submapa + POIs revelados uno a uno). El DM crea/edita POIs por región en cualquier continente.

**Architecture:** Generalizar el modelo Tal'Dorei (`useTaldorei` + `poi_state` + `region_state` + `RegionExplore`) a "atlas por continente". Store `atlas_defs` en `app_config` (JSON, sin migración). Slugs de región únicos globalmente para no chocar en `poi_state`/`region_state`.

**Tech Stack:** Next.js 16, React 19, TS, Supabase. Español.

Ver diseño: `docs/superpowers/specs/2026-07-11-atlas-y-calendario-design.md`. **Hacer DESPUÉS del plan de calendario** (independientes, pero así se revisa uno cada vez).

---

## Contexto (verificar leyendo)

- `data/taldorei.ts`: `Region` (slug, name, capital, accent, feature, blurb, image, map:{x,y}), `REGIONS`, `MAPS`, `REGION_RATIO`.
- `data/pois.ts`: `Poi` (name, type, blurb, x, y), `POI_ICON`, `POI_COLOR`, `POIS` (default por región), `PoiType`.
- `data/world.ts`: `CONTINENTS` (Tal'Dorei, Issylra, Wildemount, Marquet, Dientes Rotos, Mares), `REGIONS_BY_CONTINENT`, `CONTINENT_VIEW` (recorte del mapa mundial por continente), `WORLD_POIS` (name/type/continent/region/x/y/blurb), `WORLD_ICON`, `WORLD_COLOR`.
- `lib/useTaldorei.ts`: `useTaldorei()` → `{ regions, poisByRegion, save }` desde `app_config` key `taldorei_defs`. `slugify(name)`.
- `lib/usePois.ts`: `usePois()` → estado `poi_state` keyed `region::name` (Realtime), `setPoiPos`, `setPoiRevealed`. `lib/useRegions.ts`: `region_state` (pin_x/pin_y, known, explored), `setRegionPin`, y setters de known/explored.
- `lib/useWorldPois.ts`: pines planos (`world_pois` JSON), a **retirar** del mapa una vez migrados a regiones.
- `app/mapa/page.tsx`: mundo→continente→(Tal'Dorei: regiones+RegionExplore / otros: pines planos). `components/RegionExplore.tsx` (submapa + POIs revelados; soporta `image` vacío → marco "por revelar"). `components/PinDragMap.tsx`.
- `app/dm/MapaPanel.tsx`: editor. Modos "mundo"/"Regiones Tal'Dorei"/"POIs por región".
- `public/maps/`: `taldorei.jpg` (mapa mundial 2560x1707), `wildemount.jpg`, `regions/<slug>.jpg` (8 de Tal'Dorei), `wildemount/<region>.jpg` (8 imágenes).

Verificación por tarea: `npx tsc --noEmit` + `npm run build`. Commits español, autor `CarlosAlbertt <CarlosAlbertt@users.noreply.github.com>`, coautoría `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

⚠️ Slugs de región deben ser **globalmente únicos** (poi_state/region_state van por slug). Al sembrar continentes nuevos, si un slug ya existe, prefijar con inicial de continente.

---

### Task 1: Modelo y semilla del atlas (`data/atlas.ts` + `lib/useAtlas.ts`)

**Files:** Create `data/atlas.ts`, `lib/useAtlas.ts`; Test `scripts/check-atlas.ts`.

- [ ] **Step 1**: `data/atlas.ts` — tipo y semilla por continente:

```ts
import type { Region } from "@/data/taldorei";
import type { Poi } from "@/data/pois";
export type ContinentAtlas = { regions: Region[]; pois: Record<string, Poi[]> }; // pois keyed por region.slug
export type AtlasDefs = Record<string, ContinentAtlas>; // key = nombre de continente

export function seedAtlas(): AtlasDefs { /* ver reglas */ }
```

Reglas de `seedAtlas`:
- Tal'Dorei: usar `REGIONS` + `POIS` de `data/taldorei.ts`/`data/pois.ts` tal cual (sus slugs ya existen en poi_state).
- Issylra/Wildemount/Marquet/Dientes Rotos: por cada nombre en `REGIONS_BY_CONTINENT[cont]`, crear una `Region`:
  - `slug = slugify(nombre)`; si colisiona con un slug ya usado (global), prefijar (`slugify(cont)[0] + "-" + slug`).
  - `name` = nombre; `capital` = "—"; `feature` = ""; `accent` = rotar una paleta; `blurb` = del `WORLD_POIS` de tipo "region"/"continente" con ese nombre si existe, si no "".
  - `image`: `/maps/<contDir>/<slug>.jpg` si existe físicamente en public (Wildemount tiene 8; mapear nombre→archivo con una tabla explícita porque los nombres de archivo Wildemount están en inglés: menagerie_coast_south, marrow_valley, zemni_fields, greying_wildlands, eiselcross, xhorhas, blightshore, menagerie_coast_north). Para los demás continentes `image: ""`.
  - `map:{x,y}`: posición del pin sobre el mapa mundial — tomar la del `WORLD_POIS` (region) correspondiente, si no, un spread por defecto dentro del `CONTINENT_VIEW.box`.
  - POIs de la región: los `WORLD_POIS` de ese continente cuyo `region` == nombre y `type !== "continente"/"region"`, mapeados a `Poi` (`name`, `type` traducido a `PoiType` — mapear WorldType→PoiType con una tabla; los que no encajen → "ciudad"), `blurb`, `x`/`y` (reusar o spread).
- Devuelve `AtlasDefs` con las 5 entradas de continente (sin "Mares").
- [ ] **Step 2**: `lib/useAtlas.ts` (generaliza `useTaldorei`): store `app_config` key `atlas_defs`.
  - `useAtlas()` → `{ atlas: AtlasDefs, ready, save(next) }`. Carga desde app_config; si no existe, `seedAtlas()`. Realtime filtrado por `key=eq.atlas_defs`. Guardado optimista + upsert (patrón `useTaldorei`).
  - Helpers: `regionsOf(atlas, cont)`, `poisOf(atlas, cont, slug)`.
  - Migración: si existe `taldorei_defs` (viejo) y no `atlas_defs`, usar el Tal'Dorei viejo dentro del seed para no perder ediciones. (Leer taldorei_defs una vez al sembrar.)
- [ ] **Step 3**: `scripts/check-atlas.ts`: `seedAtlas()` produce 5 continentes; **todos los slugs de región son únicos globalmente**; cada POI de WORLD_POIS no-continente/region acaba en exactamente una región; Wildemount tiene image en las 8 regiones con archivo.
- [ ] **Step 4**: `npx tsc --noEmit` + `npx tsx scripts/check-atlas.ts` pasa.
- [ ] **Step 5**: commit `feat: modelo y semilla del atlas por continentes`.

### Task 2: Mapa `/mapa` — regiones por continente

**Files:** Modify `app/mapa/page.tsx`.

- [ ] **Step 1**: sustituir `useTaldorei` por `useAtlas` y generalizar: al enfocar un continente `focus`, mostrar **sus regiones** (`regionsOf(atlas, focus)`) como pines (posición de `region_state` o `region.map`), con el mismo render que hoy usa Tal'Dorei. Quitar el render de pines planos por continente (`continentPois` de `useWorldPois`) — ya no se usan.
- [ ] **Step 2**: click región → `RegionExplore` con su submapa (`region.image` o fallback) y sus POIs (`poisOf`) + estado de `usePois`/`useRegions`. El panel lateral de continente lista las regiones del continente enfocado (no solo Tal'Dorei).
- [ ] **Step 3**: mapa base del continente: mantener el recorte `CONTINENT_VIEW` sobre `taldorei.jpg` (Wildemount puede seguir igual). La niebla de continentes se mantiene sin cambios.
- [ ] **Step 4**: retirar imports/uso de `useWorldPois` en la página si quedan huérfanos (grep). No romper "Mares" (etiquetas) — si se usaban, decidir: los pines de Mares pueden quedar como pines planos especiales o retirarse; reportar decisión.
- [ ] **Step 5**: `npm run build` + eslint limpios. Preview: `/mapa` carga (login) sin errores de consola.
- [ ] **Step 6**: commit `feat: mapa con regiones explorables en todos los continentes`.

### Task 3: Panel DM — editor de regiones/POIs por continente

**Files:** Modify `app/dm/MapaPanel.tsx`.

- [ ] **Step 1**: añadir un **selector de continente** a los modos "Regiones" y "POIs por región". El CRUD de región (crear/editar/borrar, arrastrar pin via `setRegionPin`) y de POI (crear/editar/borrar, arrastrar via `setPoiPos`, revelar via `setPoiRevealed`) operan sobre el atlas del continente elegido (`useAtlas().save`).
- [ ] **Step 2**: el submapa de arrastre de POIs usa `region.image` del continente (o `taldorei.jpg` recortado si vacío). El de regiones usa el mapa del continente (recorte `CONTINENT_VIEW` o `wildemount.jpg`).
- [ ] **Step 3**: retirar el modo "mundo" de pines planos (o dejarlo solo lectura para continentes/mares). Migrar cualquier utilidad que se pierda. `useWorldPois` puede quedar sin consumidores → marcar deprecado o borrar si nada lo usa (grep).
- [ ] **Step 4**: `npm run build` + eslint limpios.
- [ ] **Step 5**: commit `feat: editor DM de regiones y POIs para todos los continentes`.

### Task 4: Limpieza + fallback de mapas ausentes

**Files:** posible modify `components/RegionExplore.tsx` (solo si el fallback no cubre bien continentes sin imagen); `HANDOFF.md`.

- [ ] **Step 1**: verificar que `RegionExplore` con `image: ""` muestra un marco "mapa por revelar" claro (ya existe patrón en `/mapa` aside). Ajustar copy si hace falta para continentes nuevos.
- [ ] **Step 2**: `HANDOFF.md`: documentar el atlas (`atlas_defs`), cómo subir submapas de región (`public/maps/<continente>/<slug>.jpg`), y que Issylra/Marquet/Dientes Rotos van con fallback hasta que se suban imágenes. Nota: `world_pois` deprecado.
- [ ] **Step 3**: `npm run build` final limpio.
- [ ] **Step 4**: commit `chore: fallback de submapa y documentación del atlas`.

## Fuera de alcance
- Generar imágenes de mapa (las sube el usuario).
- Reescribir la niebla de continentes o el sistema de "known/explored" (se reutiliza tal cual).
- Migrar datos ya guardados en `world_pois` de la instancia del usuario (el seed reparte los defaults; los pines planos que el DM hubiera creado a mano en `world_pois` no se migran automáticamente — anotar en HANDOFF que se recrean por región).
