# Fase B — Modo ubicación: "Estás en…" 📍

**Fecha**: 2026-07-17
**Estado**: diseño aprobado, pendiente de revisión del spec escrito

## Objetivo

El grupo tiene una **ubicación actual** que fija el DM. Al abrirla, el jugador ve
qué hay en ese lugar sin depender del DM. Es la **base de las fases C–F** (tiendas,
posada, NPCs, tablón): esas fases enchufan sus secciones de servicio en la página
`/lugar` que crea esta fase.

## Alcance (decisión del usuario 2026-07-17)

"Fase B entera", acotada a lo físicamente posible hoy. La **funcionalidad real**
de los servicios (comprar, descansar, hablar con NPC, misiones) es de las fases
C–F y **no existe todavía**. Esta fase deja montado **todo el scaffolding**:
ubicación + página + widget + modelo `services` + editor DM + **secciones
placeholder** ("próximamente — Fase C/D/E/F") que cada fase posterior rellenará.

## Arquitectura

### Ubicación del grupo (`app_config` + hook optimista)

- **`app_config.party_location`** (JSON, **sin migración**):
  `{ continent: string, regionSlug: string, poiName: string } | null`. `null` (o
  ausente) = el grupo viaja, sin lugar concreto.
- **`lib/usePartyLocation.ts`**: patrón de los demás hooks de `app_config`
  (`useDmStash`), **con mutación OPTIMISTA** — `app_config` NO está en la
  publicación realtime, así que la subscripción `postgres_changes` no dispara;
  hay que actualizar el estado local al instante y persistir. (Ver el fix de la
  Fase H, mismo problema.)
  - `usePartyLocation()` → `{ location, ready, setLocation }`.
  - `setLocation(loc: PartyLocation | null)`: `setState(loc)` optimista +
    `save`. `save` hace `upsert` de `party_location` (JSON o `""` para limpiar).

### DM fija la ubicación (editor de mapa)

En `app/dm/MapaPanel.tsx`, sub-pestaña **POIs por región** (que ya lista los POIs
del continente+región elegidos), cada POI de la lista gana un botón **"El grupo
está aquí"** → `setLocation({ continent, regionSlug: region.slug, poiName:
p.name })`. Un botón global **"El grupo viaja (sin lugar)"** → `setLocation(null)`.
El POI que es la ubicación actual se resalta. Guardado optimista (se ve al
instante).

### Widget en nav

`components/PartyLocationWidget.tsx` (`"use client"`): si hay `location`, muestra
"📍 {poiName}" enlazado a `/lugar`; si no, no renderiza nada (o un discreto "De
camino"). Se monta en `SiteNav` junto a `ClockWidget` (variante compacta). Usa
`usePartyLocation`. Visible para jugador y DM.

### Página `/lugar`

`app/lugar/page.tsx` (`"use client"`, player+DM, **sin gate** — coherente con la
tabla de acceso de la Fase L, donde `/lugar` es ✅ para ambos). Lee
`usePartyLocation`, `useAtlas` (para resolver el POI y su región) y `useTownMaps`.

- **Con ubicación** y POI encontrado en el atlas:
  - Cabecera: nombre del POI, tipo (icono/color de `POI_ICON`/`POI_COLOR`),
    blurb, y la región/continente.
  - Imagen del pueblo si `townMap(poiName)` existe (misma que abre `/mapa`).
  - **Secciones de servicios** según `poi.services` (ver abajo): una tarjeta por
    servicio activo, con cuerpo **placeholder** ("Próximamente — Fase C") hasta
    que la fase correspondiente la rellene.
- **Sin ubicación** (viajando) o POI no encontrado: estado **"De camino…"** con
  la región actual (si hay `regionSlug`) y el reloj de campaña (`ClockWidget`
  grande). Nunca una página en blanco.

### Modelo de servicios en el POI

`data/pois.ts` — el tipo `Poi` gana:
```ts
services?: {
  tienda?: string[];   // ids de inventario de tienda (Fase C)
  posada?: boolean;    // hay dónde descansar (Fase D)
  npcs?: string[];     // ids de NPC presentes (Fase E)
  tablon?: boolean;    // hay tablón de misiones (Fase F)
};
```
Opcional → **sin migración**, no rompe los POIs existentes ni el atlas
(`atlas_defs`). El editor de POIs del DM (`PForm` en `MapaPanel.tsx`) gana
controles para estos campos: checkbox posada, checkbox tablón, y campos de texto
(coma-separados) para tienda y npcs (ids libres por ahora; las fases C/E los
interpretarán). Se guardan en el atlas (`atlas_defs`, ya optimista vía `useAtlas`).

### Secciones de servicio (placeholders)

`/lugar` renderiza, por cada flag activo en `poi.services`, una tarjeta con
título e icono del servicio y cuerpo "Próximamente (Fase X)". Se aíslan en un
componente `components/lugar/ServiceSections.tsx` para que cada fase C–F sustituya
el cuerpo de su tarjeta sin tocar el resto. Si `services` está vacío/ausente: no
se muestran secciones (solo cabecera + mapa).

## Fuera de alcance (YAGNI)

- La lógica real de tienda (C), posada/descanso que mueve el reloj (D), chat de
  NPC por ubicación (E) y tablón (F). Son sus propias fases; aquí solo el hueco.
- Interpretar los ids de `tienda`/`npcs`: hoy son texto libre; C y E definirán su
  significado. No se valida contra catálogos aún.
- Historial de ubicaciones / rutas de viaje. YAGNI.

## Verificación

- `npx tsc --noEmit` + `next build` limpios.
- **Sin credenciales/sesión en dev**: las superficies DM (editor de mapa) y
  `/lugar` con datos requieren sesión. Se verifica lo posible: `/lugar` sin
  ubicación muestra "De camino…" (fallback), build limpio, y que el widget no
  rompe el nav. **Prueba en vivo del usuario**: fijar la ubicación en un POI
  desde el editor, ver el widget y `/lugar` con cabecera+mapa, marcar servicios
  en un POI y ver las tarjetas placeholder, y "El grupo viaja" → "De camino…".
- **Sin migración** (todo en `app_config` + `atlas_defs`).

## Nota

Coherencia con la Fase L: `/lugar` es player+DM, sin gate de rol (ya estaba en la
tabla de superficies). La mutación optimista de `usePartyLocation` sigue la
lección documentada del `app_config` sin realtime (ver milestone Fase H y la
memoria del proyecto).
