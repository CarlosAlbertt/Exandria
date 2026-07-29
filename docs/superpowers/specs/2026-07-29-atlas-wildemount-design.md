# Spec — Wildemount: 8 regiones y sus lugares (2026-07-29)

Continuación de `2026-07-29-atlas-taldorei-design.md`. Aquella tanda arregló y
pobló Tal'Dorei (45 → 94 POIs) y dejó montada la maquinaria: el gate
`check-taldorei`, las correcciones `TALDOREI_FIXES` sobre un `atlas_defs` ya
sembrado, y la lección de que **los submapas rotulados son la fuente**.

Wildemount tiene los mismos mapas rotulados. Lo que no tiene es una estructura
que los aproveche.

## El problema

**Las ocho hojas de mapa no coinciden con las cuatro regiones de la app.**

| Hoja en `public/maps/wildemount/` | Región en la app hoy |
|---|---|
| `zemni_fields.jpg` | Imperio Dwendaliano |
| `marrow_valley.jpg` | — *(sin usar)* |
| `xhorhas.jpg` | Xhorhas |
| `greying_wildlands.jpg` | Yermos Grisáceos |
| `menagerie_coast_south.jpg` | Costa del Serrallo |
| `menagerie_coast_north.jpg` | — *(sin usar)* |
| `blightshore.jpg` | — *(sin usar)* |
| `eiselcross.jpg` | — *(sin usar)* |

Las regiones actuales son **políticas** (Imperio Dwendaliano) y las hojas son
**geográficas**: el Imperio ocupa dos hojas (Campos Zemni y Valle del Tuétano),
la Costa del Serrallo otras dos, y Eiselcross y la Costa de la Plaga no existen
como región. **La mitad del continente no tiene dónde caer.**

Y el detalle que hay es mínimo: **25 POIs para todo Wildemount**, generados de
`WORLD_POIS`. La hoja de los Campos Zemni **ella sola** rotula unos 30 lugares
(Bysaes Tyl, Icehaven, Vergesson, Odesloe, Blumenthal, Druvenlode, Berleben,
Shattengrod, Pride's Call, Yrossa, Kaltenloch, Erdeloch, Ciénaga de Labenda…) y
el dato conoce 8 para todo el Imperio. La de Eiselcross rotula ~19 y el dato
conoce **cero**, porque Eiselcross no es una región.

**Un POI ya está en la región equivocada**: «Aldea Palebank» figura en Yermos
Grisáceos y su rótulo está en la hoja de Eiselcross, en la Tundra Crystalsands.
Es el mismo caso que Emon.

## Decisiones tomadas (por el usuario, 2026-07-29)

1. **Ocho regiones, una por hoja, sin renombrar ninguna de las cuatro que ya
   hay.** Se añaden **Valle del Tuétano**, **Costa del Serrallo Norte**,
   **Eiselcross** y **Costa de la Plaga**. Es aditivo: `mergeAtlas` suma
   regiones por nombre, así que un `atlas_defs` ya sembrado recibe las nuevas
   sin riesgo de duplicar las viejas. La lectura política (qué pertenece al
   Imperio Dwendaliano, qué a la Dinastía Kryn, qué al Concordato Clovis) se
   cuenta en el **blurb de cada región**, no en su nombre.
2. **Las ocho hojas enteras**, ~160 POIs.

> La asimetría «Costa del Serrallo» (sur) + «Costa del Serrallo Norte» es
> deliberada: renombrar la existente a «Sur» obligaría a una corrección sobre el
> atlas guardado a cambio de nada.

## Arquitectura: Wildemount deja de derivar de `WORLD_POIS`

Hoy `seedContinent` construye las regiones de los cuatro continentes generados a
partir de `REGIONS_BY_CONTINENT` y reparte los `WORLD_POIS` entre ellas. Eso no
sirve para 160 lugares: **`WORLD_POIS` son los pines del mapa del MUNDO**, y
meter ahí cada ciénaga y cada cruce de caminos satura la pantalla que sirve para
navegar entre continentes — exactamente lo que se decidió evitar en Tal'Dorei,
donde solo suben las ciudades y las fortalezas.

Wildemount pasa al modelo de Tal'Dorei:

- **`data/wildemount.ts`** (nuevo) — `WILDEMOUNT_REGIONS: Region[]` (las 8, con
  su `capital`, `accent`, `feature`, `blurb`, `image` y `map`) y
  `WILDEMOUNT_POIS: Record<string, Poi[]>` por slug de región. Es el espejo de
  `data/taldorei.ts` + `data/pois.ts`.
- **`data/atlas.ts`** — `seedAtlas` deja de tratar a Tal'Dorei como caso único.
  Un mapa `CONTINENTES_PROPIOS: Record<string, { regions, pois }>` con Tal'Dorei
  y Wildemount; los otros tres siguen generándose de `REGIONS_BY_CONTINENT` +
  `WORLD_POIS`. `mergeAtlas` recorre ese mapa en vez de tener una rama `if
  (contName === "Tal'Dorei")`.
- **`TALDOREI_FIXES` se generaliza a `ATLAS_FIXES`**, con un campo `continente`.
  Wildemount necesita al menos una corrección (Aldea Palebank → Eiselcross) y
  las que salgan al leer las hojas.
- **`WORLD_POIS`** conserva sus 25 entradas de Wildemount como pines de mundo y
  gana las ciudades y fortalezas de las cuatro regiones nuevas. Los ~120
  accidentes naturales **no suben**. La entrada de «Aldea Palebank» cambia su
  `region` a Eiselcross.
- **`check-atlas`** deja de contar Wildemount en el reparto de `WORLD_POIS` por
  región, igual que ya excluye Tal'Dorei y Mares, y gana la comprobación
  inversa: cada ciudad/fortaleza de Wildemount tiene su pin de mundo.

## `REGION_RATIO` sale de `data/taldorei.ts`

La tabla de proporciones es global por slug de región, y ahora la necesitan las
8 regiones de Wildemount para que la **superficie de arrastre del editor del DM**
(`PinDragMap`, que va con `background-size: cover`) no deforme el mapa. Vivir en
`data/taldorei.ts` ya era un nombre equivocado; con Wildemount dentro es
directamente engañoso.

Se mueve a **`data/regionRatio.ts`** con las 16 entradas. Importadores a
actualizar: `components/RegionExplore.tsx`, `app/dm/MapaPanel.tsx`,
`scripts/check-taldorei.ts`. La proporción de cada región **se comprueba contra
la cabecera del JPG**, como ya se hace en `check-taldorei` (fue lo que cazó que
Llanuras Divisorias declaraba 1.320 cuando el archivo es 1.294).

## El gate: un comprobador de continente, no un script por continente

`scripts/check-taldorei.ts` son 130 líneas de reglas que valen **igual** para
Wildemount: la capital de cada región existe como POI de esa región, ningún x/y
repetido, rango [2,98], nombres en español, blurbs de 40 caracteres, ningún
blurb citando un nombre retirado, `TOWN_MAPS` vivo, nombres únicos, y la
proporción declarada contra el archivo.

Copiarlas sería duplicar la regla. Se extraen a **`lib/continente.ts`**:

```ts
export type Hallazgo = { label: string; ok: boolean };
export function comprobarContinente(c: {
  nombre: string;
  regions: Region[];
  pois: Record<string, Poi[]>;
  ratios: Record<string, string>;
  raizPublic: string;
}): Hallazgo[];
```

`scripts/check-taldorei.ts` y `scripts/check-wildemount.ts` quedan en unas pocas
líneas cada uno. El gate pasa de 22 a **23** scripts.

**El unicidad de nombre de POI es GLOBAL, no por continente**: `poi_state`
indexa por nombre sin distinguir continente (por eso `uniqueRegionSlug` existe
para las regiones). `comprobarContinente` recibe además los nombres ya usados
por los otros continentes y comprueba que no choquen. Hay candidatos reales:
«Profundidades Gélidas» ya existe en las Sierras de Alabastro de Tal'Dorei y
**Frigid Depths vuelve a salir rotulado** en la hoja de los Campos Zemni.

## La convención de contenido, y una regla nueva

Como en Tal'Dorei: **los nombres y los datos geográficos son hechos** de la
ambientación y se usan tal cual (traducidos cuando el nombre es descriptivo,
respetados cuando es propio: Rexxentrum, Bysaes Tyl, Aeor, Xhorhas). **Todos los
blurbs son redacción original en español** — nunca prosa de los libros ni de la
wiki, ni traducida ni parafraseada de cerca.

**Regla nueva, y es la que importa en esta tanda**: de la mayoría de estos
lugares solo se sabe **lo que el mapa enseña**. Cuando no haya fuente sobre un
sitio, el blurb describe **lo que se ve** (qué tipo de terreno es, qué tiene al
lado, qué ruta pasa por ahí) y **no inventa historia**. Nada de batallas,
fundadores ni maldiciones que no estén en ninguna fuente. Un blurb honesto de
«Yrossa» es que es un alto en el camino entre Rexxentrum y el sur, no una
leyenda inventada.

Fuentes disponibles: las ocho hojas rotuladas (nombres y posiciones), la wiki de
Critical Role vía el navegador —el usuario la autorizó y `WebFetch` y `defuddle`
la tienen bloqueada, así que se lee con el panel Browser—, y
`Books/Explorer-s-Guide-to-Wildemount.pdf` en el vault (308 páginas, escaneo sin
capa de texto: se renderiza con `pypdfium2` a PNG y se lee visualmente; página
de libro = página de PDF − 1).

## Fases

**Fase A — la maquinaria, sin contenido nuevo.** `data/regionRatio.ts`,
`lib/continente.ts`, `check-wildemount`, `CONTINENTES_PROPIOS`, `ATLAS_FIXES`,
`data/wildemount.ts` con las 8 regiones y **los 25 POIs que ya existen**
repartidos donde toca. Al acabar, el gate está en verde y en pantalla no ha
cambiado nada salvo que hay 8 regiones en vez de 4 y Aldea Palebank está en
Eiselcross. **Es el punto de control**: si algo se rompe, se rompe aquí, con 25
POIs y no con 160.

**Fase B — las ocho hojas.** Una tarea por hoja, un commit por hoja, ~160 POIs.
Orden: Campos Zemni, Valle del Tuétano, Xhorhas, Costa del Serrallo (sur), Costa
del Serrallo Norte, Yermos Grisáceos, Eiselcross, Costa de la Plaga.

**Fase C — cierre.** Ciudades y fortalezas nuevas a `WORLD_POIS`, los 23 scripts
en verde, `tsc` + `next build`, HANDOFF y vault, merge.

## Lo que NO entra

- Issylra, Marquet y los Dientes Rotos. Siguen sin submapa propio y sin fuentes.
- Deshacer el aplastamiento `capital`/`pueblo` → `ciudad` de
  `WORLDTYPE_TO_POITYPE`. Con Wildemount fuera de `WORLD_POIS` el problema se
  reduce a los tres continentes que quedan; se decide cuando les toque.
- Mapas de pueblo (`TOWN_MAPS`) para ciudades de Wildemount. No hay imágenes.
- El campo `image` en el formulario de región del editor DM.

## Verificación

- `npx tsc --noEmit` + `npx next build` limpios.
- Los **23** `scripts/check-*.ts` en verde.
- **Los pines, comprobados sobre el dibujo**: como en Tal'Dorei, se generan los
  SVG con los pines pintados sobre cada hoja y se entregan al usuario. `/mapa`
  exige sesión y el asistente no introduce contraseñas.

## Riesgos

- **El choque de nombres entre continentes es real, no teórico**: «Profundidades
  Gélidas» (Sierras de Alabastro) vs «Frigid Depths» (Campos Zemni), y las hojas
  comparten accidentes en sus bordes igual que en Tal'Dorei. La comprobación
  global de nombres lo caza; la salida es **desambiguar en el nombre** («Mar de
  las Profundidades Gélidas») o dejar el rótulo en la hoja donde es principal.
- **160 POIs es más de lo que cabe cómodamente en una tanda.** La Fase A es el
  punto donde parar si hace falta: deja el continente coherente y con ocho
  regiones aunque la Fase B se quede a medias.
- **`data/wildemount.ts` va a ser un archivo grande** (~200 líneas de datos). Es
  el mismo tamaño que `data/pois.ts` tras Tal'Dorei y se lee bien porque está
  agrupado por región; si creciera más, se parte por región.
</content>
