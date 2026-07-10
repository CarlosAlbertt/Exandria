# Diseño — Atlas por continentes + Calendario en tiempo real

Aprobado por el usuario 2026-07-11. Dos features independientes; un plan cada una.

## Contexto del repo

- Mapa `/mapa` (`app/mapa/page.tsx`): mundo → click continente → zoom (`CONTINENT_VIEW`
  recorta el mapa mundial). Tal'Dorei muestra **regiones** pinchables → `RegionExplore`
  (submapa + POIs revelados uno a uno). Los demás continentes solo muestran **pines
  planos** de `useWorldPois`.
- `lib/useTaldorei.ts`: regiones+POIs de Tal'Dorei editables (JSON en `app_config`,
  key `taldorei_defs`). `lib/usePois.ts`: estado de POI (posición+revelado) en tabla
  `poi_state` keyed por `region::name` (Realtime). `lib/useRegions.ts`: `region_state`
  (pin_x/pin_y, known, explored).
- `lib/useWorldPois.ts`: pines planos del mundo (JSON en `app_config`, key `world_pois`),
  con `revealed`. Sembrado desde `data/world.ts` `WORLD_POIS` (continente+region+type+blurb).
- `data/world.ts`: `CONTINENTS` (5 + "Mares"), `REGIONS_BY_CONTINENT`, `CONTINENT_VIEW`,
  `WORLD_POIS`.
- `data/cosmology.ts`: `CALENDAR` (11 meses solo nombres, 328 días, 7 días de semana),
  `SEASONS`, `HOLIDAYS`, `MOONS` (Catha/Ruidus). `lib/gameDate.ts`: `parseGameDate`,
  `holidayFor`. `app_config.campaign_date` (texto libre, editado en CronicaPanel).
- `app/dm/MapaPanel.tsx`: editor DM. Modo "mundo" (pines planos, cualquier continente),
  "Regiones Tal'Dorei", "POIs por región" (solo Tal'Dorei). `components/RegionExplore.tsx`,
  `components/PinDragMap.tsx`.
- `components/SiteNav.tsx`: barra de navegación.

## Feature 1 — Regiones explorables en todos los continentes

**Objetivo**: paridad con Tal'Dorei para Issylra, Wildemount, Marquet, Dientes Rotos:
click continente → sus regiones → `RegionExplore` con submapa y POIs revelables.

**Enfoque**: generalizar el modelo Tal'Dorei a "atlas por continente" reutilizando
`RegionExplore`, `PinDragMap`, `poi_state`, `region_state`.

- **Datos** (`lib/useAtlas.ts`, nuevo, generaliza `useTaldorei`): store en `app_config`
  key `atlas_defs` = `Record<continent, { regions: Region[]; pois: Record<slug, Poi[]> }>`.
  Sembrado inicial (`data/atlas.ts`): Tal'Dorei conserva sus `taldorei_defs` actuales;
  los otros 4 continentes se siembran desde `REGIONS_BY_CONTINENT` (una `Region` por
  cada nombre, con `image` de `public/maps/wildemount/<slug>.jpg` cuando exista, si no
  `""`) y sus POIs desde los `WORLD_POIS` de ese continente agrupados por `region`.
  Migración suave: si `atlas_defs` no existe, se construye desde `taldorei_defs` +
  defaults; `taldorei_defs` se mantiene para Tal'Dorei (o se absorbe — decisión en plan).
- **Slugs únicos globalmente**: `poi_state`/`region_state` van keyed por slug; los slugs
  de región de todos los continentes deben ser únicos. Se garantiza al sembrar (prefijo
  de continente si hay colisión).
- **Mapa** (`app/mapa/page.tsx`): al enfocar cualquier continente, mostrar sus **regiones**
  (pines desde el atlas, posición en `region_state`) en vez de pines planos. Click región →
  `RegionExplore` (ya soporta imagen ausente → marco "por revelar"). Mapa base del
  continente = mapa mundial recortado por `CONTINENT_VIEW` (Wildemount puede usar
  `wildemount.jpg` completo). Se elimina/retira el render de pines planos por continente
  (los `WORLD_POIS` pasan a ser POIs de región).
- **Panel DM** (`app/dm/MapaPanel.tsx`): "Regiones" y "POIs por región" pasan a aceptar
  un **selector de continente**; el CRUD y arrastre existentes se reutilizan contra el
  atlas del continente elegido. El modo "mundo" (pines planos) se retira o queda solo para
  continentes/mares como etiquetas de navegación.
- **Mapas que faltan**: Issylra/Marquet/Dientes Rotos sin submapa de región → fallback
  "mapa por revelar" hasta que el usuario suba imágenes a `public/maps/<continente>/<slug>.jpg`.

**Fuera de alcance**: no se generan imágenes de mapa; no se reescribe la niebla de
continentes (se mantiene).

## Feature 2 — Calendario exandriano en tiempo real

**Objetivo**: reloj de juego que corre solo (10 min reales = 1 h de juego), sincronizado
en vivo, con controles del DM. Corre por defecto desde el primer arranque.

- **Fuente única** (`app_config` key `campaign_clock`, JSON):
  `{ epochRealMs: number, epochGameMin: number, running: boolean, msPerGameMin: 10000 }`.
  `10000 ms reales = 1 min de juego` → 10 min reales = 1 h de juego. Hora de juego actual
  = `running ? epochGameMin + (Date.now() - epochRealMs)/msPerGameMin : epochGameMin`.
  Pausar: congelar `epochGameMin` al valor actual, `running=false`. Reanudar/saltar/fijar:
  reescribir `epochRealMs=now` y `epochGameMin=nuevoValor`.
- **Default** si la clave no existe: `running:true`, `epochGameMin` = 836 PD, 1 de Horisal,
  08:00 (o el `campaign_date` actual parseado si existe), `epochRealMs=now`.
- **Calendario exacto** (`data/cosmology.ts`): añadir longitudes de mes reales de Exandria
  a `CALENDAR`: Horisal 29, Misuthar 30, Dualahei 30, Thunsheer 31, Unndilar 28,
  Brussendar 31, Sydenstar 32, Fessuran 29, Quen'pillar 27, Cuersaar 29, Duscar 32
  (Σ=328). Año = 328 días.
- **Derivación** (`lib/gameClock.ts`, nuevo, puro): de `gameMinAbsolutas` →
  `{ year, monthIndex, monthName, day, hour, minute, weekdayName, season, moonPhase, holiday }`.
  Estación desde `SEASONS` (día del año). Fase de Catha: ciclo 33 días → 8 fases (nueva,
  creciente, cuarto, gibosa, llena, …). Festividad activa reusa `holidayFor(fechaStr)`.
  Formato de fecha "D de Mes, AAAA PD" (compat con `holidayFor`).
- **Hook** (`lib/useGameClock.ts`): lee `campaign_clock` de `app_config` (Realtime como
  los otros), expone `{ clock, nowGameMin, ready }` y un `useEffect` con `setInterval(1s)`
  que recalcula `nowGameMin` en cliente cuando `running`. Mutaciones DM (module-level,
  `{ error }`): `setClockRunning(bool)`, `advanceGame(minutes)`, `setGameDateTime({...})`.
- **Control DM** (`app/dm/RelojPanel.tsx`, nueva pestaña "Tiempo" en `DmDashboard`, icono
  `fa-clock`): play/pausa, +1 h, +descanso corto (1 h), +descanso largo (8 h), +1 día,
  y fijar fecha/hora exacta (selectores mes/día/año/hora). Muestra estado en vivo.
- **Widget** (`components/ClockWidget.tsx`): reloj compacto en `SiteNav` (día + hora +
  icono de luna), actualiza cada segundo en cliente. Bloque grande opcional en `/reino`
  o home con estación/luna/festividad.
- **Crónica**: `CronicaView`/`CronicaPanel` leen la fecha del reloj (`gameClock` formatea
  el string) en vez del `campaign_date` de texto libre; el input manual de fecha en
  CronicaPanel se retira o pasa a "ajustar en pestaña Tiempo". `campaign_date` queda
  deprecado (el reloj es la fuente).

**Sin migración de esquema** (todo en `app_config`). Sin dependencias nuevas.

## Verificación (ambas)

`npx tsc --noEmit`, `npm run build`, eslint limpios. Scripts `npx tsx` para lógica pura
(`gameClock` derivación: casos de año/mes/estación/luna/festividad; atlas seeding: slugs
únicos, POIs repartidos). Preview: `/mapa` y `/reino` cargan sin error en login.
Commits en español, autor `CarlosAlbertt`, coautoría Claude Fable 5.
