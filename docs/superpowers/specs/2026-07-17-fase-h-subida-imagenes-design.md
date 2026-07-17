# Fase H — Subida de imágenes (Supabase Storage) 🖼️

**Fecha**: 2026-07-17
**Estado**: diseño aprobado (alcance), pendiente de revisión del spec escrito

## Objetivo

El DM sube imágenes desde la propia app — sin tocar código ni redeploy. Una sola
infraestructura (bucket + componente reutilizable) sirve para todas las
integraciones presentes y futuras.

## Alcance (decisión del usuario 2026-07-17)

"Fase H entera", acotada a lo que **tiene superficie hoy**. Dos integraciones de
la guía se difieren porque su UI aún no existe:

- **Retratos de NPC** → depende de la fase E (no hay editor de NPC).
- **Battlemaps y tokens** → depende de la fase I (no hay tablero de batalla).

El componente `ImageUpload` se diseña genérico para que esas fases lo enchufen en
una línea cuando existan. Este spec cubre: **infra + 4 integraciones**.

## Arquitectura

### Infra de Storage (paso manual del DM + helpers)

- **Bucket `assets`** en Supabase Storage: lectura **pública**, escritura solo
  DM. Carpetas: `maps/`, `species/`, `monsters/`, `towns/` (y `npcs/`,
  `battlemaps/`, `tokens/` reservadas para E/I). Crear el bucket y las policies
  es un **paso manual del usuario** en el dashboard de Supabase; el plan
  documentará el SQL exacto de las policies (`is_dm()` para insert/update/delete,
  público para select). **No hay migración de tablas** — Storage lleva sus
  propias policies.
- **`lib/storage.ts`** (cliente, sin hook):
  - `isStorageConfigured` — reexporta `supabaseConfigured` (bucket asumido si hay
    credenciales; si falla la subida, el componente cae a URL manual).
  - `async uploadImage(folder: string, filename: string, file: File, maxWidth: number): Promise<string>`
    — redimensiona/comprime en cliente con `<canvas>` (JPEG calidad ~0.85, ancho
    máx `maxWidth`), sube con
    `supabase.storage.from("assets").upload(\`${folder}/${filename}\`, blob, { upsert: true })`
    y devuelve la **URL pública** (`getPublicUrl`). `upsert: true` para poder
    resubir la misma ruta.
  - Errores traducidos al español (patrón del repo).

### Componente `ImageUpload` (genérico)

`components/ImageUpload.tsx` (`"use client"`). Props:

```ts
type Props = {
  folder: string;          // "maps" | "species" | "monsters" | "towns" | ...
  filename: string;        // p. ej. "marquet/ank-harel" o "aarakocra"
  label?: string;
  currentUrl?: string;     // URL ya guardada (preview inicial)
  maxWidth?: number;       // 1600 retratos, 4000 mapas
  onUploaded: (url: string) => void;
};
```

Comportamiento: input de archivo + **preview** + botón subir (spinner) →
`uploadImage` → `onUploaded(url)`. Si Storage no está configurado o la subida
falla, muestra un **input de URL manual** como fallback (pegar URL y guardar).
Un botón "quitar" que llama `onUploaded("")`.

### Integraciones

1. **Editor de región** (`app/dm/MapaPanel.tsx`): el campo `image` ya existe en
   el modelo (`region.image`, usado en `PinDragMap image={region.image || ...}`)
   pero **no hay UI**. Se añade `<ImageUpload folder="maps"
   filename={\`${continent}/${region.slug}\`} currentUrl={region.image}
   maxWidth={4000} onUploaded={url => setRegionImage(region.slug, url)} />` al
   formulario de región. `setRegionImage` persiste en el atlas
   (`atlas_defs`, ya optimista). **Cierra el hueco** de submapas de
   Issylra/Marquet/Dientes Rotos sin tocar código.

2. **Retratos de especie/linaje/clase** (pantalla DM nueva):
   - **Modelo**: `app_config.art_overrides` (JSON, **sin migración**):
     `{ "species/<slug>": url, "lineage/<slug>": url, "class/<slug>": url }`.
     La **clave del override = la ruta de Storage** (mismas carpetas:
     `species/`, `lineage/`, `class/`), así `ImageUpload` usa
     `folder`+`filename` que casan con la clave que lee `artSrc`. Ej.: linaje →
     `folder="lineage" filename={slug}` y clave `lineage/<slug>`.
   - **Hook** `lib/useArt.ts`: lee `art_overrides` (realtime, patrón de los demás
     hooks de `app_config`), expone `artSrc(kind, slug, localFallback)` que
     devuelve la URL de Storage si existe, si no el path local
     (`/species/<slug>.jpg`, `/classes/<slug>.jpg`), y el consumidor cae al icono
     vía `PortraitFrame` si tampoco carga.
   - **Pestaña DM "Arte"** (`app/dm/ArtePanel.tsx`): nuevo `Tab` `"arte"` en
     `DmDashboard.tsx` (icono `fa-image`). Lista especies (por región), linajes y
     clases; cada fila = miniatura actual (`artSrc`) + `<ImageUpload
     folder="species" filename={slug} maxWidth={1600} .../>` que escribe en
     `art_overrides`. Permite por fin subir Bardo/Paladín y las 36 especies.
   - **Display**: las escenas del creador que hoy pasan un path local a
     `ArtPanel`/`PortraitFrame` (`steps/SpeciesScene.tsx`, `steps/ClassScene.tsx`
     y `components/crear/ArtPanel.tsx`) consultan `artSrc(...)` en vez del path
     fijo. `PortraitFrame` no cambia (ya acepta `src` con fallback a icono).

3. **Mapas de pueblo data-driven** (`data/townMaps.ts` + DM UI):
   - Hoy `TOWN_MAPS` es un `Record` estático en código. Se mantiene como
     **defaults** y se superpone `app_config.town_maps` (JSON, sin migración):
     `{ "<nombre exacto del POI>": url }`.
   - **Hook** `lib/useTownMaps.ts`: merge defaults + overrides (realtime).
     `townMap(name)` pasa a leerse del hook donde se consume
     (`RegionExplore`/mapa). Los consumidores de la función pura actual se migran
     al hook.
   - **UI**: sección en `ArtePanel` (o sub-pestaña) para añadir/editar
     `{ nombre → imagen }` con `ImageUpload folder="towns"`.

4. **Arte de monstruo** (`data/bestiary/types` + formulario del DM):
   - `Monster` gana **`art?: string`** (opcional). Se renderiza en el statblock
     (`BestiarioView.tsx`) si existe. `CustomMonster = Monster & { custom: true }`
     ya arrastra el campo.
   - El formulario "Añadir monstruo" del DM gana `<ImageUpload folder="monsters"
     filename={slug} maxWidth={1600} currentUrl={form.art}
     onUploaded={url => setForm({...form, art: url})} />`. Se guarda en
     `app_config.custom_monsters` (ya existe, sin migración).

## Fuera de alcance (YAGNI)

- Retratos de NPC (fase E) y battlemaps/tokens (fase I): sin superficie; el
  `ImageUpload` genérico los cubrirá cuando se construyan esas fases.
- Borrado de archivos huérfanos en Storage (resubir usa `upsert`; los huérfanos
  no molestan y limpiar es sobre-ingeniería para una mesa de amigos).
- Galería/gestor de archivos de Storage: cada campo gestiona su propia imagen.

## Verificación

- `npx tsc --noEmit` + `next build` limpios; `npx tsx scripts/check-*.ts`
  existentes siguen verdes.
- **Prueba en vivo (solo el usuario, requiere Storage configurado + sesión DM)**:
  crear el bucket `assets` con las policies del plan; subir un submapa a una
  región de Marquet y verlo en `/mapa`; subir un retrato de especie y verlo en
  `/crear`; subir arte a un monstruo custom; añadir un mapa de pueblo.
- Sin credenciales en dev: se verifica el **fallback** (Storage no configurado →
  input de URL manual visible y funcional) y que `tsc`/`build` pasan.
- **Sin migración de tablas.** Paso manual: bucket + policies (SQL en el plan).

## Nota de infraestructura

Crear el bucket y las policies es lo único que bloquea la prueba en vivo. El plan
incluirá el SQL exacto (crear bucket público `assets` + policies de
insert/update/delete con `public.is_dm()`). Documentar también en el vault
(`Pendientes.md`, sección de pasos manuales) y en `HANDOFF.md`.
