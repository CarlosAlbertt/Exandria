# Wildemount — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wildemount pasa de 4 regiones y 25 POIs a **8 regiones —una por hoja de
mapa— y ~160 POIs**, con la maquinaria del atlas generalizada para que el
siguiente continente no obligue a copiar nada.

**Architecture:** Wildemount deja de derivar sus POIs de `WORLD_POIS` y pasa al
modelo de Tal'Dorei: archivo propio (`data/wildemount.ts`) consumido por
`seedAtlas`. Tres piezas atadas a Tal'Dorei se generalizan: `REGION_RATIO` →
`data/regionRatio.ts`, las reglas del gate → `lib/continente.ts`,
`TALDOREI_FIXES` → `ATLAS_FIXES`. Los ocho JPG rotulados de
`public/maps/wildemount/` son la fuente de nombres y posiciones.

**Tech Stack:** TypeScript, Next.js 16, tsx para los scripts. No hay tests: el
gate es `npx tsc --noEmit` + `npx next build` + los `scripts/check-*.ts`.

**Spec:** `docs/superpowers/specs/2026-07-29-atlas-wildemount-design.md`

**Rama:** `atlas-wildemount` (creada, con el spec commiteado).

---

## Las ocho hojas y sus regiones

| Región (nombre nuevo o existente) | slug | Hoja | Proporción real |
|---|---|---|---|
| Imperio Dwendaliano *(existe)* | `imperio-dwendaliano` | `zemni_fields.jpg` | 2000×1294 |
| **Valle del Tuétano** *(nueva)* | `valle-del-tuetano` | `marrow_valley.jpg` | 2000×1294 |
| Xhorhas *(existe)* | `xhorhas` | `xhorhas.jpg` | 1294×2000 |
| Yermos Grisáceos *(existe)* | `yermos-grisaceos` | `greying_wildlands.jpg` | 2000×1294 |
| Costa del Serrallo *(existe)* | `costa-del-serrallo` | `menagerie_coast_south.jpg` | 2000×1294 |
| **Costa del Serrallo Norte** *(nueva)* | `costa-del-serrallo-norte` | `menagerie_coast_north.jpg` | 2000×1294 |
| **Eiselcross** *(nueva)* | `eiselcross` | `eiselcross.jpg` | 2000×1294 |
| **Costa de la Plaga** *(nueva)* | `costa-de-la-plaga` | `blightshore.jpg` | 1294×2000 |

Los slugs de las nuevas se derivan con `uniqueRegionSlug`, que ya existe; hay que
confirmar que no chocan con ninguno de los 20 slugs ya usados.

> **El Imperio Dwendaliano conserva su nombre pero pasa a ser la hoja de los
> Campos Zemni.** Es deliberado: renombrarlo obligaría a corregir el atlas
> guardado a cambio de nada, y su blurb ya explicará que el Imperio abarca
> también el Valle del Tuétano.

## Convención de contenido — vale para TODAS las tareas

- **Nombres y datos geográficos son hechos.** Se traduce el nombre descriptivo
  (Frostbogen se queda, *Tomb of the Worm* → Tumba del Gusano) y se respeta el
  propio (Rexxentrum, Bysaes Tyl, Aeor, Xhorhas, Rosohna).
- **Todos los blurbs son redacción original en español.** Nunca prosa de los
  libros ni de la wiki, ni traducida ni parafraseada de cerca.
- **Y la regla de esta tanda: sin fuente, no se inventa historia.** De la mayoría
  de estos sitios solo se sabe lo que enseña el mapa. El blurb describe **lo que
  se ve** —terreno, qué tiene al lado, qué ruta pasa por ahí— y no añade
  batallas, fundadores ni maldiciones. Un blurb honesto de «Yrossa» es que es un
  alto en el camino entre Rexxentrum y el sur.
- Mínimo 40 caracteres (el gate lo exige). Una o dos frases.

**Fuentes**: las ocho hojas (`Read` sobre el JPG). La wiki de Critical Role
**solo por el panel Browser** (`preview_start` con la URL y `get_page_text`):
`defuddle` da 403 y `WebFetch` da 402. Y
`C:\Users\carlo\Desktop\Exandria-Obsidian\Exandria\Books\Explorer-s-Guide-to-Wildemount.pdf`
(308 páginas, escaneo **sin capa de texto**: `py` + `pypdfium2` a PNG escala 2.5
y lectura visual; página de libro = página de PDF − 1). Úsalo solo si un lugar
concreto lo pide.

---

# FASE A — la maquinaria

## Task A1: `REGION_RATIO` sale de `data/taldorei.ts`

**Files:**
- Create: `data/regionRatio.ts`
- Modify: `data/taldorei.ts` (quitar la tabla)
- Modify: `components/RegionExplore.tsx:4`, `app/dm/MapaPanel.tsx:4`, `scripts/check-taldorei.ts:5`

- [ ] **Step 1: Crear `data/regionRatio.ts`**

```ts
// Proporción (ancho/alto) del submapa de cada región, para que el contenedor
// del editor DM (PinDragMap, con `background-size: cover`) no deforme el mapa.
// Vivía en data/taldorei.ts, que dejó de ser cierto al llegar Wildemount.
// `scripts/check-*` verifica cada entrada contra la cabecera del JPG real.
export const REGION_RATIO: Record<string, string> = {
  // Tal'Dorei
  "costa-lucidiana": "2550 / 3300",
  "sierras-alabastro": "3300 / 2550",
  "llanuras-divisorias": "3300 / 2550",
  "montanas-torrerrisco": "5100 / 3300",
  "montanas-crestormentas": "3300 / 2550",
  "peninsula-pleabruma": "5100 / 3300",
  "expansion-verdante": "3300 / 2550",
  "litoral-filofulgor": "3300 / 5100",
  // Wildemount (medidos: 2000x1294 apaisadas, 1294x2000 verticales)
  "imperio-dwendaliano": "2000 / 1294",
  "valle-del-tuetano": "2000 / 1294",
  "xhorhas": "1294 / 2000",
  "yermos-grisaceos": "2000 / 1294",
  "costa-del-serrallo": "2000 / 1294",
  "costa-del-serrallo-norte": "2000 / 1294",
  "eiselcross": "2000 / 1294",
  "costa-de-la-plaga": "1294 / 2000",
};
```

- [ ] **Step 2: Quitar la tabla de `data/taldorei.ts`** y actualizar los tres
      importadores a `@/data/regionRatio` (en `scripts/check-taldorei.ts`,
      `../data/regionRatio`).

- [ ] **Step 3: Verificar**

Run: `npx tsc --noEmit && npx tsx scripts/check-taldorei.ts`
Expected: `tsc` limpio y el script en verde (las 8 entradas de Tal'Dorei siguen
cuadrando con sus JPG; las de Wildemount aún no las mira nadie).

- [ ] **Step 4: Commit**

```bash
git add data/regionRatio.ts data/taldorei.ts components/RegionExplore.tsx app/dm/MapaPanel.tsx scripts/check-taldorei.ts
git commit -m "refactor(atlas): REGION_RATIO sale de data/taldorei.ts

Con Wildemount dentro, una tabla global de proporciones dejaba de tener
sentido en el archivo de un continente.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task A2: las reglas del gate salen a `lib/continente.ts`

Las 130 líneas de `scripts/check-taldorei.ts` valen igual para cualquier
continente con submapas. Copiarlas sería duplicar la regla.

**Files:**
- Create: `lib/continente.ts`
- Modify: `scripts/check-taldorei.ts` (adelgaza)

- [ ] **Step 1: Crear `lib/continente.ts`**

Mueve ahí, **sin cambiar ninguna regla**, todo lo que hoy comprueba
`check-taldorei`, con esta forma:

```ts
import type { Region } from "@/data/taldorei";
import type { Poi } from "@/data/pois";

export type Hallazgo = { label: string; ok: boolean };

export type EntradaContinente = {
  nombre: string;
  regions: Region[];
  pois: Record<string, Poi[]>;
  ratios: Record<string, string>;
  townMaps: Record<string, string>;
  /** nombres de POI de OTROS continentes: poi_state indexa por nombre sin
   *  distinguir continente, así que la unicidad es global. */
  nombresAjenos?: Set<string>;
  /** nombres retirados que ningún blurb puede citar */
  nombresRetirados?: string[];
  /** raíz de `public/` para comprobar que los archivos existen */
  raizPublic: string;
};

export function comprobarContinente(c: EntradaContinente): Hallazgo[];
export function tamañoJpeg(ruta: string): { w: number; h: number } | null;
```

Las reglas, todas las que ya hay:
1. cada región tiene entrada en `pois`, no vacía, `image` no vacía y el archivo existe;
2. no hay claves en `pois` que no sean regiones;
3. la capital de cada región existe como POI **de esa región** (`"—"` exento);
4. `REGION_RATIO` declara la región y cuadra con la cabecera del JPG (desvío < 0.5%);
5. nombres de POI únicos **dentro del continente y contra `nombresAjenos`**;
6. ningún par x/y repetido dentro del continente; x e y en [2, 98];
7. nombres en español (la lista negra de sustantivos comunes ingleses);
8. blurbs de 40 caracteres o más;
9. ningún blurb cita un nombre de `nombresRetirados`;
10. `townMaps`: cada clave es un POI vivo del continente y su archivo existe.

> **Ojo con la regla 10 al generalizar**: `TOWN_MAPS` es una tabla global con
> mapas de pueblo **de Tal'Dorei**. Comprobar «cada clave es un POI de ESTE
> continente» rompería en Wildemount. Pasa la tabla **filtrada** por el llamante,
> o comprueba solo las claves que casen con algún POI del continente y deja la
> comprobación de «ninguna clave queda huérfana» en `check-taldorei`, que es
> quien tiene la tabla entera. Decide y **escríbelo en un comentario**.

- [ ] **Step 2: Adelgazar `scripts/check-taldorei.ts`**

Queda como el llamante: arma la `EntradaContinente` de Tal'Dorei (con
`nombresRetirados: ["Anclado", "Cerrofauces", "Fort Daxio"]` y `TOWN_MAPS`),
imprime los `Hallazgo` con el mismo formato `OK`/`FAIL` y sale con 0 o 1.

- [ ] **Step 3: Verificar que NO se ha perdido ninguna comprobación**

Run: `npx tsx scripts/check-taldorei.ts`
Expected: **913 líneas OK** y «Todas las comprobaciones pasaron.» Si el recuento
baja, se ha perdido una regla por el camino: encuéntrala antes de seguir.

Comprueba también que sigue cazando: cambia a mano un blurb a 10 caracteres,
ejecuta, confirma el FAIL, y deshazlo.

- [ ] **Step 4: Commit**

```bash
git add lib/continente.ts scripts/check-taldorei.ts
git commit -m "refactor(atlas): las reglas del gate salen a lib/continente.ts

Valen igual para cualquier continente con submapas. Copiarlas para
Wildemount habria sido duplicar la regla.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task A3: `data/wildemount.ts` — las 8 regiones y los 25 POIs de siempre

**Files:**
- Create: `data/wildemount.ts`
- Modify: `data/atlas.ts` (`CONTINENTES_PROPIOS`, `seedAtlas`, `mergeAtlas`)
- Modify: `data/world.ts` (`REGIONS_BY_CONTINENT["Wildemount"]` → las 8)
- Create: `scripts/check-wildemount.ts`

- [ ] **Step 1: Leer las ocho hojas**

`Read` los ocho JPG de `public/maps/wildemount/`. Anota, por hoja, **todos** los
rótulos. Los vas a necesitar enteros en la Fase B; aquí solo hacen falta para
saber en qué hoja cae cada uno de los 25 POIs que ya existen.

- [ ] **Step 2: Escribir `data/wildemount.ts`**

Espejo de `data/taldorei.ts` + `data/pois.ts`:

```ts
import type { Region } from "@/data/taldorei";
import type { Poi } from "@/data/pois";

export const WILDEMOUNT_REGIONS: Region[] = [ /* las 8, ver tabla del plan */ ];
export const WILDEMOUNT_POIS: Record<string, Poi[]> = { /* por slug */ };
```

Para cada región: `capital` (un POI **de esa región**, o `"—"`), `accent` (de la
paleta `ACCENTS` de `data/atlas.ts`), `feature` (tres o cuatro palabras),
`blurb` **original** que sitúe la región y **diga a quién pertenece** (Imperio
Dwendaliano, Dinastía Kryn, Concordato Clovis, tierra de nadie), `image` la ruta
de su hoja, y `map` la posición del pin de región **sobre el mapa del mundo**,
dentro de `CONTINENT_VIEW["Wildemount"].box = { x: 66, y: 6, w: 34, h: 52 }`.

- [ ] **Step 3: Repartir y COLOCAR los 25 POIs que ya existen**

Hoy sus x/y vienen de `WORLD_POIS`, que son **coordenadas del mapa del mundo**:
como coordenadas de región no significan nada. Hay que colocarlos leyendo su
hoja, igual que se hizo en Tal'Dorei.

Los 25, con su región actual:
- **Imperio Dwendaliano**: Montañas Cyrios, Rexxentrum, Zadash, Trostenwald,
  Bladegarden, Hupperdook, Talonstadt, **Valle del Tuétano**
- **Xhorhas**: Cordillera Penumbra, Rosohna, Bazzoxan, Asarius, Urzin, Jigow
- **Costa del Serrallo**: Puerto Damali, Nicodranas, Gwardan, Feolinn, Othe,
  Puerto Zoon, Tussoa, Vesrah
- **Yermos Grisáceos**: Uthodurn, Shadycreek Run, Aldea Palebank

**Cada uno va a la región cuya hoja lo rotula.** Sabemos ya de dos casos:
- **«Valle del Tuétano» era un POI de tipo `natural` y ahora es una REGIÓN.**
  Se elimina como POI: el nombre lo toma la región. Anótalo en el commit.
- **«Aldea Palebank» está rotulada en la hoja de Eiselcross** (Tundra
  Crystalsands), no en los Yermos Grisáceos. Se mueve.

El resto los decides mirando las hojas. Si un POI no está rotulado en ninguna,
déjalo en su región actual y anótalo en el informe.

- [ ] **Step 4: `data/atlas.ts` — Wildemount deja de generarse**

```ts
// Continentes con datos propios (regiones y POIs escritos a mano, no derivados
// de WORLD_POIS). Los demás siguen saliendo de REGIONS_BY_CONTINENT.
const CONTINENTES_PROPIOS: Record<string, () => ContinentAtlas> = {
  "Tal'Dorei": () => ({ regions: REGIONS, pois: POIS }),
  "Wildemount": () => ({ regions: WILDEMOUNT_REGIONS, pois: WILDEMOUNT_POIS }),
};
const GENERATED_CONTINENTS = ["Issylra", "Marquet", "Dientes Rotos"] as const;
```

`seedAtlas` monta los propios desde ese mapa (respetando el `taldoreiOverride`
que ya existe) y genera los otros tres. `mergeAtlas` sustituye su rama
`if (contName === "Tal'Dorei")` por un recorrido de `CONTINENTES_PROPIOS`, con
la misma semántica: **suma regiones y POIs que falten por nombre, y no toca nada
de lo guardado**.

`WILDEMOUNT_IMAGES` desaparece: la `image` vive ahora en cada región de
`data/wildemount.ts`.

- [ ] **Step 5: `data/world.ts`**

`REGIONS_BY_CONTINENT["Wildemount"]` pasa a las 8 (se sigue usando para el
editor DM y para `check-atlas`). **No toques todavía los `WORLD_POIS`**: eso es
la Task C1. Sí cambia el campo `region` de «Aldea Palebank» a `"Eiselcross"`,
que si no `check-atlas` dirá que apunta a una región inexistente.

- [ ] **Step 6: `scripts/check-wildemount.ts`**

Igual que el `check-taldorei` adelgazado, con `nombresAjenos` = todos los
nombres de POI de los otros continentes del atlas, y sin `TOWN_MAPS` (Wildemount
no tiene mapas de pueblo).

- [ ] **Step 7: Ajustar `scripts/check-atlas.ts`**

Wildemount ya no reparte `WORLD_POIS` por región: hay que excluirlo del filtro
`relevantWorldPois` igual que Tal'Dorei y Mares, o el recuento fallará (mira el
comentario que ya hay ahí, explica justo esto).

- [ ] **Step 8: Verificar**

Run: `npx tsc --noEmit && npx next build`
Run: `npx tsx scripts/check-wildemount.ts && npx tsx scripts/check-taldorei.ts && npx tsx scripts/check-atlas.ts`
Expected: los tres en verde. `check-atlas` sigue comprobando la idempotencia de
`mergeAtlas` y que Emon acabe en el Litoral de Filofulgor: **eso no puede
romperse** al generalizar.

- [ ] **Step 9: Commit**

```bash
git add data/wildemount.ts data/atlas.ts data/world.ts scripts/check-wildemount.ts scripts/check-atlas.ts
git commit -F - <<'EOF'
feat(atlas): Wildemount, ocho regiones con datos propios

Las ocho hojas rotuladas dejan de estar desaprovechadas: cada una es una
region. Se anaden Valle del Tuetano, Costa del Serrallo Norte, Eiselcross
y Costa de la Plaga sin renombrar las cuatro que ya habia.

Wildemount deja de derivar sus POIs de WORLD_POIS -que es el mapa del
mundo y no aguanta 160 pines- y pasa al modelo de Tal'Dorei, con
data/wildemount.ts. seedAtlas y mergeAtlas dejan de tratar a Tal'Dorei
como caso unico.

Los 25 POIs que ya habia llevaban coordenadas del mapa del MUNDO, que
como coordenadas de region no significan nada: recolocados leyendo su
hoja. "Valle del Tuetano" deja de ser un POI y pasa a ser region, y
"Aldea Palebank" se va a Eiselcross, que es donde la rotula el mapa.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
```

---

## Task A4: `ATLAS_FIXES` — que las correcciones lleguen al atlas guardado

`TALDOREI_FIXES` solo mira Tal'Dorei. Los cambios de la Task A3 sobre POIs que
**ya viajaron** al `atlas_defs` del DM (Aldea Palebank cambia de región, los 25
cambian de posición, el Valle del Tuétano desaparece como POI) no llegarían.

**Files:**
- Modify: `data/atlas.ts`
- Modify: `scripts/check-atlas.ts`

- [ ] **Step 1: Generalizar el tipo**

`TaldoreiFix` → `AtlasFix`, con `continente: string` y un campo nuevo
`borrar?: boolean` (para el Valle del Tuétano, que deja de ser POI).
`TALDOREI_FIXES` → `ATLAS_FIXES`, con las 11 entradas actuales marcadas
`continente: "Tal'Dorei"` **sin tocar sus valores**.

- [ ] **Step 2: Añadir las de Wildemount**

Una por cada POI de los 25 que cambie de región, de posición o desaparezca. Los
`desdeX`/`desdeY` son los que tiene hoy el atlas sembrado, o sea los de
`WORLD_POIS`: sácalos con `git show master:data/world.ts`. Los `x`/`y` de
destino son los que la Task A3 dejó en `data/wildemount.ts`: **cópialos de ahí,
no del plan** (es el error que se cometió en Tal'Dorei).

- [ ] **Step 3: Aplicar por continente en `mergeAtlas`**

El bucle de correcciones deja de estar dentro de la rama de Tal'Dorei y filtra
por `fix.continente`. **Conserva las tres propiedades**: solo casa si el POI
sigue exactamente como estaba; si el destino es la misma región, la lista base
es `origenCopia` (si no, un renombre deja fantasma); y es idempotente.

- [ ] **Step 4: Extender la comprobación de `check-atlas`**

La que reconstruye el estado anterior deshaciendo cada fix ya existe: hazla
recorrer los dos continentes. Y **verifica que sigue cazando**: reintroduce el
bug del fantasma (`const base = cont.pois[destino] ?? []`), confirma los FAIL,
deshazlo.

- [ ] **Step 5: Verificar y commit**

Run: `npx tsx scripts/check-atlas.ts && npx tsx scripts/check-wildemount.ts && npx tsc --noEmit`

```bash
git add data/atlas.ts scripts/check-atlas.ts
git commit -m "fix(atlas): ATLAS_FIXES, las correcciones por continente

TALDOREI_FIXES solo miraba Tal'Dorei; los cambios de Wildemount sobre
POIs ya sembrados no habrian llegado nunca a la partida.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

# FASE B — las ocho hojas

Una tarea por hoja. **El método es siempre el mismo**, y es el que funcionó en
Tal'Dorei:

1. `Read` la imagen de la hoja.
2. Anotar **todos** los rótulos que no estén ya como POI.
3. Para cada uno: nombre (traducido si es descriptivo), tipo (`ciudad`,
   `fortaleza`, `ruina`, `natural`, `peligro`, `cueva`, `campamento`), posición
   en **% del ancho y del alto de la imagen**, y blurb original según la
   convención de arriba —**sin inventar historia**.
4. `npx tsx scripts/check-wildemount.ts` → verde. Si sale `posición repetida`,
   mueve una un punto. Si sale `nombre repetido`, **desambigua** (ojo con
   «Profundidades Gélidas», que ya existe en Tal'Dorei y vuelve a salir rotulada
   como *Frigid Depths* en los Campos Zemni).
5. Commit de esa hoja.

Consulta la wiki por el panel Browser cuando un lugar dé para más que «lo que se
ve»: `https://criticalrole.fandom.com/wiki/<Nombre>`. Si la página no existe o no
dice nada, **no lo rellenes**: describe lo que enseña el mapa.

- [ ] **Task B1: Campos Zemni** (`imperio-dwendaliano`, `zemni_fields.jpg`)
      ~30 rótulos: Bysaes Tyl, Icehaven, Kaltenloch, Erdeloch, Ciénaga de
      Saltwallow, Espesura de Kelvin, Yermo de Pearlbow, Montañas Dunrock,
      Sanatorio de Vergesson, Guarida de Rastun, Odesloe, Blumenthal,
      Druvenlode, Cruce de Ámbar, Yrossa, Shattengrod, Pride's Call, Monte
      Mentiri, Berleben, Ciénaga de Labenda, Ounterloch, Cresta de Silberquell,
      Espesura de Crispvale, Nogvurot, Quannah Breach, Savalirwood, Molaesmyr,
      Montañas Cyrios *(ya existe)*, las Profundidades Gélidas *(¡nombre
      ocupado!)*.
- [ ] **Task B2: Valle del Tuétano** (`valle-del-tuetano`, `marrow_valley.jpg`)
- [ ] **Task B3: Xhorhas** (`xhorhas`, `xhorhas.jpg`)
- [ ] **Task B4: Costa del Serrallo sur** (`costa-del-serrallo`, `menagerie_coast_south.jpg`)
- [ ] **Task B5: Costa del Serrallo Norte** (`costa-del-serrallo-norte`, `menagerie_coast_north.jpg`)
- [ ] **Task B6: Yermos Grisáceos** (`yermos-grisaceos`, `greying_wildlands.jpg`)
- [ ] **Task B7: Eiselcross** (`eiselcross`, `eiselcross.jpg`)
      ~19 rótulos: Biessel, Gelier, Vurmas, Tumba del Gusano, Schneescel,
      Frostbogen, Mutalos, Aeor, Fortaleza del Jarl Muerto, Dampfkan, Foren,
      Río Inferno, Santuario de Aloravak, Syrinlya, Kaltsel, Balenpost,
      Taergoss, Tundra Crystalsands, Aldea Palebank *(ya existe, llega de la
      Task A3)*.
- [ ] **Task B8: Costa de la Plaga** (`costa-de-la-plaga`, `blightshore.jpg`)

Commit por hoja:

```bash
git add data/wildemount.ts
git commit -m "content(atlas): POIs de <hoja>, leidos de su submapa

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

# FASE C — cierre

## Task C1: las ciudades y fortalezas nuevas al mapa del mundo

**Files:** `data/world.ts`, `scripts/check-atlas.ts`

- [ ] **Step 1:** Añadir a `WORLD_POIS` una entrada por cada POI de Wildemount de
      tipo `ciudad` o `fortaleza` que no la tenga. **Los accidentes naturales no
      suben** (mismo criterio que Tal'Dorei). `region` = el **nombre** de la
      región nueva; `blurb` = el mismo de `data/wildemount.ts`; `x`/`y` en
      coordenadas del **mapa mundial**, dentro de
      `CONTINENT_VIEW["Wildemount"].box = { x: 66, y: 6, w: 34, h: 52 }`,
      leyendo `public/maps/taldorei.jpg` (que es el mapa del mundo).
- [ ] **Step 2:** En `check-atlas`, la comprobación «cada ciudad/fortaleza tiene
      pin de mundo» que ya existe para Tal'Dorei, ahora también para Wildemount.
- [ ] **Step 3:** Gate y commit.

## Task C2: gate completo, verificación visual y cierre

- [ ] **Step 1:** Los **23** `scripts/check-*.ts` en verde, uno a uno. Anota el
      recuento de cada uno.
- [ ] **Step 2:** `npx tsc --noEmit && npx next build` limpios.
- [ ] **Step 3: Verificación visual.** Generar un SVG por hoja con los pines
      pintados encima (mismo método que en Tal'Dorei: `<image href>` al JPG +
      un círculo y una etiqueta por POI) y entregárselos al usuario. **`/mapa`
      exige sesión y el asistente no introduce contraseñas**, así que esta es la
      comprobación de que los pines caen sobre su rótulo.
- [ ] **Step 4:** `HANDOFF.md`: sección `## RESUELTO (2026-07-29): Wildemount`
      con el recuento 25 → ~160, las 8 regiones, lo que se generalizó y las
      trampas que salgan. Actualizar la tabla de «Scripts de comprobación» a 23.
- [ ] **Step 5:** Vault: `40 Datos del juego/Cosmología y mapa.md` y
      `00 Meta/Historial de desarrollo.md`.
- [ ] **Step 6:** Merge a `master` y push.

```bash
git checkout master && git merge atlas-wildemount --ff-only && git push
```

---

## Lo que este plan NO hace

- Issylra, Marquet y los Dientes Rotos: sin submapa propio y sin fuentes.
- `WORLDTYPE_TO_POITYPE` sigue aplastando `capital`/`pueblo` en `ciudad` para
  los tres continentes que quedan generados.
- Mapas de pueblo para ciudades de Wildemount: no hay imágenes.
- El campo `image` en el formulario de región del editor DM.
</content>
