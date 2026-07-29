# Atlas de Tal'Dorei — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Arreglar los 45 POIs de Tal'Dorei (capitales rotas, cuatro POIs en la
región equivocada, nombres mal traducidos, coordenadas de plantilla), añadir los
49 lugares que los submapas rotulan y no están, y ponerle un gate para que no
vuelva a pasar.

**Architecture:** `data/pois.ts` y `data/taldorei.ts` son las fuentes; los ocho
JPG de `public/maps/regions/` son la verdad cartográfica y se leen con la
herramienta Read. La regla nueva vive en `scripts/check-taldorei.ts` (no en un
componente). Como `atlas_defs` ya está sembrado en `app_config`, las
correcciones sobre POIs existentes viajan además en `TALDOREI_FIXES`, que
`mergeAtlas` aplica una sola vez y solo si el DM no había tocado ese pin.

**Tech Stack:** TypeScript, Next.js 16, tsx para los scripts. No hay tests: el
gate es `npx tsc --noEmit` + `npx next build` + los `scripts/check-*.ts`.

**Spec:** `docs/superpowers/specs/2026-07-29-atlas-taldorei-design.md`

**Rama:** `atlas-taldorei` (ya creada, con el spec commiteado).

---

## Estructura de archivos

| Archivo | Responsabilidad | Acción |
|---|---|---|
| `data/pois.ts` | tipo `Poi`/`PoiType`, iconos, colores y los POIs de Tal'Dorei por región | Modificar (tipos nuevos + contenido) |
| `data/taldorei.ts` | regiones de Tal'Dorei (`REGIONS`), con su `capital` | Modificar (3 capitales) |
| `data/atlas.ts` | semilla y fusión del atlas de los 5 continentes | Modificar (mapeo de tipos + `TALDOREI_FIXES` + `mergeAtlas`) |
| `data/world.ts` | pines del mapa mundial | Modificar (ciudades y fortalezas de Tal'Dorei) |
| `scripts/check-taldorei.ts` | el gate nuevo del continente | Crear |
| `scripts/check-atlas.ts` | gate del atlas | Modificar (1 comprobación) |

---

## Convención de contenido — vale para TODAS las tareas

- **Los nombres y los datos geográficos son hechos** de la ambientación. Un
  nombre descriptivo se traduce al español (Salted Bluffs → Peñascos Salados);
  un nombre propio se respeta (Mooren, Syngorn, Wittebak, T'Zarrm, Bronbog).
- **Todos los blurbs son redacción original en español**: un resumen propio de
  qué es el lugar y qué se puede hacer allí. **Nunca** prosa de los libros ni de
  ninguna wiki, ni traducida ni parafraseada de cerca. Es una herramienta de
  fans no oficial.
- Un blurb es **una o dos frases**, con un gancho jugable si el lugar lo tiene
  («de aquí bajó el dragón», «nadie pasa dos veces sin motivo»). Nada de
  «Ciudad de la región X» a secas: eso es lo que ya hay y es lo que no sirve.

---

## Task 1: `PoiType` gana `cueva` y `campamento`

**Files:**
- Modify: `data/pois.ts:5-34`
- Modify: `data/atlas.ts:34-42`

- [ ] **Step 1: Ampliar el tipo, el icono y el color**

En `data/pois.ts`, sustituir el bloque de tipo/iconos/colores por:

```ts
export type PoiType = "ciudad" | "fortaleza" | "ruina" | "natural" | "peligro" | "cueva" | "campamento";

export const POI_ICON: Record<PoiType, string> = {
  ciudad: "fa-city",
  fortaleza: "fa-chess-rook",
  ruina: "fa-dungeon",
  natural: "fa-tree",
  peligro: "fa-skull",
  cueva: "fa-mountain",
  campamento: "fa-campground",
};
export const POI_COLOR: Record<PoiType, string> = {
  ciudad: "var(--color-bronze)",
  fortaleza: "var(--color-arcane)",
  ruina: "var(--color-violet)",
  natural: "var(--color-primitivo)",
  peligro: "var(--color-ember)",
  cueva: "var(--color-arcane-deep)",
  campamento: "var(--color-warm)",
};
```

- [ ] **Step 2: Comprobar que `tsc` obliga a cerrar los `Record`**

Run: `npx tsc --noEmit`
Expected: PASA. (Si alguno de los dos `Record` se hubiera dejado a medias,
fallaría con «Property 'cueva' is missing» — esa es la propiedad que se busca.)

- [ ] **Step 3: Verificar que `WORLDTYPE_TO_POITYPE` sigue compilando**

`data/atlas.ts:34` declara `Partial<Record<WorldType, PoiType>>`. Los tipos
nuevos no existen en `WorldType`, así que **no hay que tocarlo**. Confirmar
leyendo el archivo que sigue siendo `Partial<...>` y dejarlo igual.

- [ ] **Step 4: Gate completo**

Run: `npx tsc --noEmit && npx next build`
Expected: los dos limpios.

- [ ] **Step 5: Commit**

```bash
git add data/pois.ts
git commit -m "feat(atlas): PoiType gana cueva y campamento"
```

---

## Task 2: El gate — `scripts/check-taldorei.ts`

Se escribe **antes** de arreglar nada: tiene que salir en rojo y enseñar los
fallos que el spec documenta.

**Files:**
- Create: `scripts/check-taldorei.ts`

- [ ] **Step 1: Escribir el script entero**

```ts
// Comprobación manual del atlas de Tal'Dorei (data/taldorei.ts + data/pois.ts).
// Uso: npx tsx scripts/check-taldorei.ts
import fs from "node:fs";
import path from "node:path";
import { REGIONS } from "../data/taldorei";
import { POIS } from "../data/pois";
import { TOWN_MAPS } from "../data/townMaps";

let failures = 0;
function check(label: string, cond: boolean) {
  if (cond) console.log(`OK   ${label}`);
  else { console.log(`FAIL ${label}`); failures++; }
}

// --- Cada región tiene POIs, imagen y el archivo existe ---
for (const r of REGIONS) {
  const pois = POIS[r.slug];
  check(`${r.name}: tiene entrada en POIS`, Array.isArray(pois));
  check(`${r.name}: no está vacía`, !!pois && pois.length > 0);
  check(`${r.name}: tiene image`, r.image.length > 0);
  if (r.image) {
    check(
      `${r.name}: el submapa existe (${r.image})`,
      fs.existsSync(path.join(process.cwd(), "public", r.image))
    );
  }
}

// --- No hay regiones en POIS que no estén en REGIONS ---
const slugsConocidos = new Set(REGIONS.map((r) => r.slug));
for (const slug of Object.keys(POIS)) {
  check(`POIS["${slug}"] corresponde a una región de REGIONS`, slugsConocidos.has(slug));
}

// --- La capital de cada región existe como POI de ESA región ---
// "—" es la ausencia declarada de capital (Montañas Crestormentas).
for (const r of REGIONS) {
  if (r.capital === "—") continue;
  const nombres = (POIS[r.slug] ?? []).map((p) => p.name);
  check(`${r.name}: su capital "${r.capital}" es un POI de la región`, nombres.includes(r.capital));
}

// --- Nombres de POI únicos en todo el continente ---
// poi_state indexa por nombre: dos POIs con el mismo nombre se pisarían el
// estado de revelado aunque estén en regiones distintas.
const vistos = new Map<string, string>();
for (const r of REGIONS) {
  for (const p of POIS[r.slug] ?? []) {
    const previo = vistos.get(p.name);
    check(`"${p.name}" no está repetido (${r.slug}${previo ? ` y ${previo}` : ""})`, !previo);
    if (!previo) vistos.set(p.name, r.slug);
  }
}

// --- Coordenadas: dentro de rango y sin repetirse en TODO el continente ---
const posiciones = new Map<string, string>();
for (const r of REGIONS) {
  for (const p of POIS[r.slug] ?? []) {
    check(`${p.name}: x en [2,98] (${p.x})`, p.x >= 2 && p.x <= 98);
    check(`${p.name}: y en [2,98] (${p.y})`, p.y >= 2 && p.y <= 98);
    const clave = `${p.x},${p.y}`;
    const previo = posiciones.get(clave);
    check(
      `${p.name}: posición ${clave} sin repetir${previo ? ` (choca con ${previo})` : ""}`,
      !previo
    );
    if (!previo) posiciones.set(clave, `${p.name} [${r.slug}]`);
  }
}

// --- Todos los nombres en español: sustantivos comunes ingleses prohibidos ---
// Los nombres PROPIOS (Wittebak, Bronbog, Syngorn, T'Zarrm) pasan: la lista
// solo tiene sustantivos comunes que deberían haberse traducido.
const PALABRAS_INGLESAS = [
  "Fort", "Village", "City", "Town", "Port", "Keep", "Outpost",
  "Mount", "Mountain", "Mountains", "Hills", "Peaks", "Ridge", "Valley",
  "Bay", "Sea", "Ocean", "Lake", "River", "Falls", "Reef", "Isle", "Island",
  "Wood", "Woods", "Forest", "Pines", "Grove", "Thicket", "Timberland",
  "Marsh", "Marshlands", "Swamp", "Gorge", "Basin", "Cavern", "Cave", "Tomb",
  "Fields", "Waters", "Depths", "Bluffs", "Channel", "Crossroads", "Roadway",
  "Path", "Trail", "Countryside", "Shoreline", "Range", "Barrow", "Narrows",
];
const reIngles = new RegExp(`\\b(${PALABRAS_INGLESAS.join("|")})\\b`, "i");
for (const r of REGIONS) {
  for (const p of POIS[r.slug] ?? []) {
    const m = p.name.match(reIngles);
    check(`${p.name}: nombre en español${m ? ` (encontrado "${m[1]}")` : ""}`, !m);
  }
}
for (const r of REGIONS) {
  const m = r.capital.match(reIngles);
  check(`capital de ${r.name} en español${m ? ` (encontrado "${m[1]}")` : ""}`, !m);
}

// --- Blurbs con sustancia: ni vacíos ni de una línea de relleno ---
for (const r of REGIONS) {
  for (const p of POIS[r.slug] ?? []) {
    check(`${p.name}: blurb de al menos 40 caracteres (${p.blurb.length})`, p.blurb.length >= 40);
  }
}

// --- TOWN_MAPS apunta a POIs vivos y a archivos que existen ---
const todosLosNombres = new Set(vistos.keys());
for (const [nombre, ruta] of Object.entries(TOWN_MAPS)) {
  check(`TOWN_MAPS["${nombre}"] es un POI de Tal'Dorei`, todosLosNombres.has(nombre));
  check(
    `TOWN_MAPS["${nombre}"]: el archivo existe (${ruta})`,
    fs.existsSync(path.join(process.cwd(), "public", ruta))
  );
}

console.log(failures === 0 ? "\nTodas las comprobaciones pasaron." : `\n${failures} comprobación(es) fallaron.`);
process.exit(failures === 0 ? 0 : 1);
```

- [ ] **Step 2: Ejecutarlo y ver que sale en ROJO**

Run: `npx tsx scripts/check-taldorei.ts`
Expected: FALLA. Tienen que aparecer, al menos:
- `FAIL Sierras de Alabastro: su capital "Westruun" es un POI de la región`
- `FAIL Península de Pleabruma: su capital "Puerto Sombrío" es un POI de la región`
- `FAIL Litoral de Filofulgor: su capital "Bys" es un POI de la región`
- `FAIL capital de Sierras de Alabastro en español (encontrado "…")` — no, «Westruun» no lleva palabra inglesa; **esta no aparece**. Si aparece, revisar la lista.
- Siete `FAIL … posición X,Y sin repetir`
- `FAIL Fort Daxio: nombre en español (encontrado "Fort")`
- Varios `FAIL … blurb de al menos 40 caracteres` (los blurbs cortos actuales)

**Si el script pasa a la primera, está mal escrito**: los fallos del spec están
verificados y tienen que salir.

- [ ] **Step 3: Anotar el recuento de fallos**

Guardar la salida (`npx tsx scripts/check-taldorei.ts > /tmp/antes.txt 2>&1` o
equivalente en Windows) para poder comparar al final. No se commitea.

- [ ] **Step 4: Commit del script en rojo**

```bash
git add scripts/check-taldorei.ts
git commit -m "test(atlas): check-taldorei, el gate que faltaba (en rojo a proposito)"
```

---

## Task 3: Los tres `capital` y los cuatro POIs de región

**Files:**
- Modify: `data/taldorei.ts:79-86`
- Modify: `data/pois.ts:36-98`

- [ ] **Step 1: Arreglar los tres `capital` en `data/taldorei.ts`**

- `sierras-alabastro`: `capital: "Westruun"` → `capital: "Piedrablanca"`
- `peninsula-pleabruma`: `capital: "Puerto Sombrío"` → `capital: "Byroden"`
- `litoral-filofulgor`: `capital: "Bys"` → `capital: "Emon"`

(`costa-lucidiana` deja de tener a Emon; su capital pasa a `"Stilben"`, que es
el mayor asentamiento que la hoja de la Costa Lucidiana rotula.)

- [ ] **Step 2: Mover los cuatro POIs de región en `data/pois.ts`**

Cortar y pegar la entrada entera (con su blurb) de una región a otra:

| POI | De | A |
|---|---|---|
| `Emon` | `costa-lucidiana` | `litoral-filofulgor` |
| `Zephrah` | `montanas-crestormentas` | `costa-lucidiana` |
| `Lyrengorn` | `montanas-crestormentas` | `montanas-torrerrisco` |
| `Abismo de Cerrofauces` | `peninsula-pleabruma` | `montanas-crestormentas` |

- [ ] **Step 3: Renombrar lo mal traducido**

| Antes | Después | Por qué |
|---|---|---|
| `Lago Anclado` | `Lago Mooren` | el mapa rotula **Mooren Lake**; *moor* se tradujo como *anclar* y Mooren es nombre propio |
| `Rivera del río Anclado` | `Vega del Mooren` | ídem, **Mooren River Run** |
| `Fort Daxio` | `Fuerte Daxio` | único nombre sin traducir |
| `Abismo de Cerrofauces` | `Garganta Cenicienta` | el mapa rotula **Ashen Gorge**; el blurb ya hablaba del Rey Cinéreo |

- [ ] **Step 4: Arreglar «Bahía de las Dagas»**

En `litoral-filofulgor`, cambiar el tipo de `ciudad` a `natural` y reescribir el
blurb: **es una bahía**, no un puerto pirata. El mapa rotula `Daggerbay` sobre
agua abierta al sur de Emon. Blurb nuevo, original y en español, en la línea de:
una ensancha de agua tranquila al sur de la capital, con calas a las que es fácil
llegar sin que te vean desde la costa.

- [ ] **Step 5: Retipar lo que está mal**

- `Montañas Puntormenta` (`peninsula-pleabruma`): `peligro` → `natural`.
- `Caverna del Axioma` (`montanas-crestormentas`): `ruina` → `cueva`.
- `Cavernas Cienocristal` (`litoral-filofulgor`): `ruina` → `cueva`.
- `Aldea de Jorenn` y `Byroden` se quedan en `ciudad`: no hay tipo «aldea» y el
  spec decidió no añadirlo.

- [ ] **Step 6: Ejecutar el gate parcial**

Run: `npx tsx scripts/check-taldorei.ts`
Expected: **los tres FAIL de capital desaparecen** y el de `Fort Daxio` también.
Siguen fallando las posiciones repetidas y los blurbs cortos: son la Task 4 y la
Task 5.

- [ ] **Step 7: Commit**

```bash
git add data/taldorei.ts data/pois.ts
git commit -m "fix(atlas): capitales, regiones y nombres de los POIs de Tal'Dorei"
```

---

## Task 4: Recolocar los 45 POIs sobre su submapa

Ocho pasos, uno por región. **El método es el mismo siempre**, y es el corazón
de la tarea:

1. `Read` la imagen `public/maps/regions/<slug>.jpg`.
2. Localizar el rótulo de cada POI de esa región en la imagen.
3. Traducir su posición a **porcentaje del ancho (x) y del alto (y)** de la
   imagen, redondeado al entero.
4. Escribir esas x/y en `data/pois.ts`.
5. Un POI que **no** esté rotulado en la hoja (lista abajo) se coloca en un
   punto verosímil de su región según su blurb, y se anota en el commit.

**Files:**
- Modify: `data/pois.ts`

Las coordenadas de referencia de abajo salen de la lectura de las ocho hojas
hecha al escribir el spec. **Son el punto de partida, no el evangelio**: al
abrir la imagen, si el rótulo está claramente en otro sitio, manda la imagen.

- [ ] **Step 1: `costa-lucidiana` (portrait, 2550×3300)**

| POI | x | y |
|---|---|---|
| Drynna | 53 | 20 |
| Lago Mooren | 60 | 26 |
| Vega del Mooren | 73 | 44 |
| Zephrah | 21 | 55 |
| Pantano de K'Tawl | 37 | 63 |
| Stilben | 35 | 84 |

- [ ] **Step 2: `sierras-alabastro` (landscape)**

| POI | x | y |
|---|---|---|
| Peñascos Salados | 44 | 12 |
| Piedrablanca | 44 | 34 |
| Bosque de Sotosecos | 47 | 78 |
| Canal Roto | 79 | 44 |

- [ ] **Step 3: `llanuras-divisorias` (landscape)**

| POI | x | y |
|---|---|---|
| Bosque de las Zarzas | 57 | 32 |
| Oestruun | 59 | 41 |
| Tumulosombrío | 76 | 44 |
| Kymal | 29 | 62 |
| Ruinas de Torthil | 20 | 79 |
| Campos de Turst | 91 | 9 |
| Deastok | *(no rotulado)* | — |

`Deastok` no aparece en la hoja: colocarlo en la llanura abierta al sur de
Oestruun, sobre la ruta de caravanas (aprox. `68,58`), y anotarlo.

- [ ] **Step 4: `montanas-torrerrisco` (landscape, 5100×3300)**

| POI | x | y |
|---|---|---|
| Lyrengorn | 63 | 12 |
| Terrah | 41 | 44 |
| Fuerte Daxio | 25 | 68 |
| Riscomartillo | 46 | 74 |
| Aldea de Jorenn | 74 | 75 |
| Brasalcázar | *(no rotulado)* | — |
| Yug'Voril | *(subterránea)* | — |
| Grietasombría | *(no rotulado)* | — |

`Yug'Voril` va bajo Riscomartillo en `48,80`: es subterránea y por eso ninguna
hoja la rotula. `Brasalcázar` en `57,39` (vertiente interior, entre picos) y
`Grietasombría` en `20,55` (la sima del oeste). Los tres se anotan en el commit
como colocados sin rótulo.

- [ ] **Step 5: `montanas-crestormentas` (landscape)**

| POI | x | y |
|---|---|---|
| El Bosquehelado | 33 | 25 |
| Caverna del Axioma | 34 | 38 |
| Garganta Cenicienta | 55 | 47 |
| Marismas de Filtrasueño | 48 | 73 |
| Ruhn-Shak | *(no rotulado)* | — |

`Ruhn-Shak` en `68,32`: alto de la sierra, al este de la Garganta Cenicienta.

- [ ] **Step 6: `peninsula-pleabruma` (landscape)**

| POI | x | y |
|---|---|---|
| Byroden | 25 | 18 |
| Montañas Puntormenta | 62 | 10 |
| Selva de Pleabruma | 41 | 43 |
| Niirdal-Poc | *(no rotulado)* | — |

`Niirdal-Poc` va dentro de la selva (aprox. `55,50`).

- [ ] **Step 7: `expansion-verdante` (landscape)**

| POI | x | y |
|---|---|---|
| Syngorn | 73 | 31 |
| Cataratas de Tormor | 75 | 40 |
| La Fortaleza Cambiante | 56 | 42 |
| El Mirescar | 55 | 61 |
| Las Aguaclaros | 37 | 82 |

- [ ] **Step 8: `litoral-filofulgor` (portrait)**

| POI | x | y |
|---|---|---|
| Montañas Seashale *(Task 6)* | 37 | 33 |
| Emon | 50 | 41 |
| Bahía de las Dagas | 46 | 76 |
| Puesto Esmeralda | 75 | 65 |
| Ruinas de O'Noa | 57 | 69 |
| Cavernas Cienocristal | *(no rotulado)* | — |
| Cicatriz del Rey Cinéreo | *(no rotulado)* | — |

`Cavernas Cienocristal` en `30,25` (en las Seashale, sobre la costa) y
`Cicatriz del Rey Cinéreo` en `64,52` (tierra quemada tierra adentro, al este de
Emon). Anotar ambas como colocadas sin rótulo.

- [ ] **Step 9: Ejecutar el gate**

Run: `npx tsx scripts/check-taldorei.ts`
Expected: **cero FAIL de posición repetida** y cero de rango. Siguen los de
blurb corto (Task 5).

- [ ] **Step 10: Commit**

```bash
git add data/pois.ts
git commit -F - <<'EOF'
fix(atlas): los 45 POIs de Tal'Dorei, colocados sobre su submapa

Las coordenadas eran plantilla: siete pares repetidos entre regiones
distintas y todas las capitales en la misma casilla. Ahora salen de leer
los ocho JPG de public/maps/regions, que estan rotulados.

Sin rotulo en ninguna hoja, colocados a ojo dentro de su region:
Deastok, Brasalcazar, Grietasombria, Yug'Voril (subterranea), Ruhn-Shak,
Niirdal-Poc, Cavernas Cienocristal y Cicatriz del Rey Cinereo.
EOF
```

---

## Task 5: Reescribir los blurbs pobres

El gate exige 40 caracteres. Varios blurbs actuales son de relleno
(«Bastión ígneo entre los picos», «Gruta de secretos arcanos», «Ciudad de las
Tierras Salvajes de Oderan»).

**Files:**
- Modify: `data/pois.ts`

- [ ] **Step 1: Listar los que fallan**

Run: `npx tsx scripts/check-taldorei.ts`
Anotar todos los `FAIL … blurb de al menos 40 caracteres`.

- [ ] **Step 2: Reescribirlos**

Uno o dos frases, **redacción original en español** (ver «Convención de
contenido» arriba), con gancho jugable cuando el lugar lo tenga. Ejemplo del
tono que se busca, para `Brasalcázar`:

```ts
{ name: "Brasalcázar", type: "fortaleza", blurb: "Bastión labrado en roca volcánica en lo hondo de la cordillera. Sus hornos no se apagan nunca, y quien vive cerca aprende a dormir con ese resplandor naranja en la ventana.", x: 57, y: 39 },
```

- [ ] **Step 3: Gate**

Run: `npx tsx scripts/check-taldorei.ts`
Expected: **PASA entero.** «Todas las comprobaciones pasaron.»

- [ ] **Step 4: Commit**

```bash
git add data/pois.ts
git commit -m "content(atlas): blurbs de Tal'Dorei con sustancia, redaccion propia"
```

---

## Task 6: Los 49 POIs nuevos que rotulan los mapas

> El spec estimaba ~57. La cuenta fina son **49**: varias hojas rotulan el mismo
> accidente en su borde (Turst Fields sale en tres, Wildwood en dos, Owlset Bay
> y Vues'dal en dos) y el nombre de POI tiene que ser único en el continente, así
> que cada uno se coloca **una sola vez**, en la región donde su rótulo es el
> principal.

Ocho pasos, uno por región y un commit por región (así un error se revierte
solo). En cada uno: `Read` la hoja, colocar, escribir blurb original.

Las x/y son las de la lectura del spec; la imagen manda.

**Files:**
- Modify: `data/pois.ts`

- [ ] **Step 1: `costa-lucidiana` — 5 nuevos**

| Nombre | Tipo | x | y | Qué es (para el blurb, no es el blurb) |
|---|---|---|---|---|
| Marisma de Rootgarden | natural | 70 | 13 | marisma arbolada al norte del lago |
| Cumbres Cimeras | natural | 26 | 45 | la sierra donde se asienta Zephrah |
| Dunghill | ciudad | 38 | 70 | aldea al borde del pantano, nombre poco halagüeño |
| Bahía de K'Tawl | natural | 47 | 71 | la bahía en que desagua el pantano |
| Bahía Owlset | natural | 14 | 92 | ensenada del suroeste |

- [ ] **Step 2: `sierras-alabastro` — 6 nuevos**

| Nombre | Tipo | x | y | Qué es |
|---|---|---|---|---|
| Bahía de Alabastro | natural | 60 | 33 | la bahía bajo Piedrablanca |
| Bahía Dawnmist | natural | 25 | 46 | bahía brumosa del oeste |
| Pinar Dawnmist | natural | 16 | 87 | pinar del suroeste |
| Bosque del Cerco Este | natural | 9 | 47 | masa forestal del borde occidental |
| Bahía de Sotosecos | natural | 75 | 55 | bahía junto al bosque de Sotosecos |
| Profundidades Gélidas | peligro | 72 | 6 | el mar helado del norte |

- [ ] **Step 3: `llanuras-divisorias` — 6 nuevos**

| Nombre | Tipo | x | y | Qué es |
|---|---|---|---|---|
| Gatshadow | natural | 52 | 18 | monte solitario sobre el bosque de las Zarzas |
| Cruce de Silvercut | ciudad | 33 | 48 | cruce de caminos con posta, nudo de la llanura |
| Cuenca de Foramere | natural | 56 | 84 | el gran lago del sur de la llanura |
| Cresta de Ironseat | natural | 23 | 52 | sierra corta al oeste de Kymal |
| Trono del Corazón Arcano | ruina | 9 | 51 | pico señalado en el extremo oeste |
| Espesura de Ivyheart | natural | 8 | 68 | bosque cerrado del suroeste |

- [ ] **Step 4: `montanas-torrerrisco` — 8 nuevos**

| Nombre | Tipo | x | y | Qué es |
|---|---|---|---|---|
| Wittebak | ciudad | 51 | 57 | asentamiento en pleno macizo |
| Valle Gris | natural | 66 | 48 | valle boscoso encajado entre picos |
| Colinas Umbra | natural | 74 | 70 | lomas sobre la aldea de Jorenn |
| Los Campos del Nunca | peligro | 70 | 4 | el yermo helado del norte |
| Bosque del Cerco Oeste | natural | 29 | 45 | franja de bosque de la vertiente oeste |
| Bosque Torian | natural | 33 | 96 | bosque del pie sur de la cordillera |
| Cabeza de la Serpiente | natural | 36 | 89 | espolón rocoso con forma reconocible |
| Bosque de Wildwood | natural | 55 | 76 | la mancha boscosa del sureste del macizo |

- [ ] **Step 5: `montanas-crestormentas` — 5 nuevos**

| Nombre | Tipo | x | y | Qué es |
|---|---|---|---|---|
| Tumba de Udah | ruina | 42 | 52 | sepulcro señalado en mitad de la sierra |
| Bronbog | ciudad | 44 | 60 | asentamiento al borde de las marismas |
| Wrettis | ciudad | 37 | 68 | asentamiento al oeste de las marismas |
| Aguas de Vues'dal | natural | 12 | 71 | lámina de agua del suroeste |
| Bahía Kirmont | natural | 61 | 82 | la bahía a la que drenan las marismas |

- [ ] **Step 6: `peninsula-pleabruma` — 7 nuevos**

Es la región peor servida: la hoja rotula cinco asentamientos y el dato conocía
uno.

| Nombre | Tipo | x | y | Qué es |
|---|---|---|---|---|
| Campiña de Mornset | natural | 37 | 25 | la franja cultivable del norte de la península |
| Ezordam-Haar | ciudad | 43 | 66 | asentamiento en el corazón de la selva |
| Hdar-Tye | ciudad | 31 | 70 | asentamiento costero del suroeste |
| Ortem-Vellak | ciudad | 78 | 64 | asentamiento del este, sobre el Lucidiano |
| Rybad-Kol | ciudad | 67 | 84 | asentamiento del sureste |
| T'Zarrm | ciudad | 48 | 96 | el asentamiento más meridional del continente |
| Río Orroyen | natural | 88 | 23 | el río que baja de la selva al noreste |

- [ ] **Step 7: `expansion-verdante` — 7 nuevos**

| Nombre | Tipo | x | y | Qué es |
|---|---|---|---|---|
| Orencleft | ruina | 71 | 35 | tajo en la roca junto a Syngorn |
| Puerto U'Daa | ciudad | 13 | 78 | puerto del borde occidental del bosque |
| Montañas Daggerbay | natural | 28 | 12 | la cordillera que cierra el bosque por el norte |
| Arrecife del Letargo | peligro | 8 | 16 | arrecife del noroeste |
| Isla Visa | natural | 3 | 52 | isla frente a la costa oeste |
| Vos'Sykriss | ruina | 5 | 61 | enclave en la isla, al sur de Visa |
| Angosturas del Feshun | natural | 28 | 63 | el estrechamiento del río Feshun |

- [ ] **Step 8: `litoral-filofulgor` — 5 nuevos**

| Nombre | Tipo | x | y | Qué es |
|---|---|---|---|---|
| Montañas Seashale | natural | 37 | 33 | la sierra que abriga Emon por el norte |
| Arboleda Flamereach | natural | 59 | 43 | bosquete justo al este de la capital |
| Bahía de Filofulgor | natural | 40 | 49 | la bahía que da nombre a la región |
| Senda Esmeralda | natural | 52 | 48 | la ruta que baja de Emon hacia el sur |
| Río Esmeralda | natural | 57 | 62 | el río que cruza el litoral hacia el este |

- [ ] **Step 9: Gate tras cada región**

Run: `npx tsx scripts/check-taldorei.ts`
Expected: PASA. Si sale `FAIL … posición X,Y sin repetir`, es que una
coordenada nueva chocó con una vieja: moverla un punto.

- [ ] **Step 10: Commit por región**

```bash
git add data/pois.ts
git commit -m "content(atlas): POIs nuevos de <region> leidos de su submapa"
```

- [ ] **Step 11: Recuento final**

Run: `npx tsx scripts/check-taldorei.ts`
Expected: PASA, y los POIs de Tal'Dorei suman **94** (45 + 49).

---

## Task 7: `TALDOREI_FIXES` — que las correcciones lleguen a la partida

Sin esto, las Tasks 3–6 se quedan en el repo: `atlas_defs` ya está sembrado en
`app_config` y `mergeAtlas` **solo suma POIs nuevos por nombre**; no
reposiciona, no renombra y no mueve de región.

**Files:**
- Modify: `data/atlas.ts` (después de `mergeAtlas`, antes del `return`)
- Modify: `scripts/check-atlas.ts`

- [ ] **Step 1: Declarar la tabla de correcciones**

En `data/atlas.ts`, junto a `mergeAtlas`:

```ts
// Correcciones puntuales sobre POIs de Tal'Dorei que ya viajaron a un
// `atlas_defs` sembrado. `mergeAtlas` solo SUMA POIs nuevos: sin esto, mover
// Emon de región o renombrar el Lago Mooren no llegaría nunca a la mesa.
// Cada corrección se aplica SOLO si el POI sigue exactamente como estaba
// (mismo nombre, misma región, mismas x/y de plantilla). Si el DM ya lo movió
// o lo renombró, se salta y su edición manda. Idempotente: aplicada una vez,
// la segunda no encuentra nada que casar.
export type TaldoreiFix = {
  nombre: string;        // nombre tal y como está guardado
  deRegion: string;      // slug de región donde estaba
  desdeX: number;        // x de plantilla que tenía
  desdeY: number;        // y de plantilla que tenía
  aRegion?: string;      // slug de región nueva (si cambia)
  nombreNuevo?: string;  // nombre nuevo (si cambia)
  tipoNuevo?: PoiType;   // tipo nuevo (si cambia)
  x?: number;            // posición nueva
  y?: number;
};

export const TALDOREI_FIXES: TaldoreiFix[] = [
  { nombre: "Emon", deRegion: "costa-lucidiana", desdeX: 40, desdeY: 40, aRegion: "litoral-filofulgor", x: 50, y: 41 },
  { nombre: "Zephrah", deRegion: "montanas-crestormentas", desdeX: 45, desdeY: 22, aRegion: "costa-lucidiana", x: 21, y: 55 },
  { nombre: "Lyrengorn", deRegion: "montanas-crestormentas", desdeX: 50, desdeY: 30, aRegion: "montanas-torrerrisco", x: 63, y: 12 },
  { nombre: "Abismo de Cerrofauces", deRegion: "peninsula-pleabruma", desdeX: 50, desdeY: 78, aRegion: "montanas-crestormentas", nombreNuevo: "Garganta Cenicienta", x: 55, y: 47 },
  { nombre: "Lago Anclado", deRegion: "costa-lucidiana", desdeX: 48, desdeY: 74, nombreNuevo: "Lago Mooren", x: 60, y: 26 },
  { nombre: "Rivera del río Anclado", deRegion: "sierras-alabastro", desdeX: 40, desdeY: 74, nombreNuevo: "Vega del Mooren", x: 54, y: 91 },
  { nombre: "Fort Daxio", deRegion: "montanas-torrerrisco", desdeX: 30, desdeY: 30, nombreNuevo: "Fuerte Daxio", x: 25, y: 68 },
  { nombre: "Bahía de las Dagas", deRegion: "litoral-filofulgor", desdeX: 45, desdeY: 40, tipoNuevo: "natural", x: 46, y: 76 },
  { nombre: "Montañas Puntormenta", deRegion: "peninsula-pleabruma", desdeX: 62, desdeY: 30, tipoNuevo: "natural", x: 62, y: 10 },
  { nombre: "Caverna del Axioma", deRegion: "montanas-crestormentas", desdeX: 70, desdeY: 40, tipoNuevo: "cueva", x: 34, y: 38 },
  { nombre: "Cavernas Cienocristal", deRegion: "litoral-filofulgor", desdeX: 30, desdeY: 55, tipoNuevo: "cueva" },
];
```

**Ojo**: los `desdeX`/`desdeY` tienen que ser los valores **que hay hoy en
`master`**, no los nuevos. Sacarlos de `git show master:data/pois.ts`.

- [ ] **Step 2: Aplicarlas en `mergeAtlas`**

Dentro de `mergeAtlas`, en el bloque de `contName === "Tal'Dorei"`, **antes** de
`continue`:

```ts
      for (const fix of TALDOREI_FIXES) {
        const origen = cont.pois[fix.deRegion];
        if (!origen) continue;
        const idx = origen.findIndex(
          (p) => p.name === fix.nombre && p.x === fix.desdeX && p.y === fix.desdeY
        );
        if (idx === -1) continue; // el DM lo tocó, o ya se corrigió: no se pisa

        // `origen` viene de un `{...prev.pois}`: el objeto está copiado, los
        // arrays NO. Copiar antes de tocar, o se muta el `stored` del llamante.
        const origenCopia = [...origen];
        const [poi] = origenCopia.splice(idx, 1);
        const corregido: Poi = {
          ...poi,
          name: fix.nombreNuevo ?? poi.name,
          type: fix.tipoNuevo ?? poi.type,
          x: fix.x ?? poi.x,
          y: fix.y ?? poi.y,
        };
        const destino = fix.aRegion ?? fix.deRegion;
        cont.pois = {
          ...cont.pois,
          [fix.deRegion]: origenCopia,
          [destino]: [...(cont.pois[destino] ?? []).filter((p) => p.name !== corregido.name), corregido],
        };
        changed = true;
      }
```

- [ ] **Step 3: Comprobar la idempotencia en `check-atlas.ts`**

Añadir al final de `scripts/check-atlas.ts`, antes del `console.log` de cierre:

```ts
// --- TALDOREI_FIXES es idempotente: aplicar mergeAtlas dos veces no cambia
// nada la segunda vez ---
import { mergeAtlas } from "../data/atlas"; // (subir al bloque de imports)

const primera = mergeAtlas(seedAtlas());
const segunda = mergeAtlas(primera.atlas);
check("mergeAtlas es idempotente sobre una semilla nueva", segunda.changed === false);
check(
  "tras mergeAtlas, Emon está en Litoral de Filofulgor",
  (primera.atlas["Tal'Dorei"].pois["litoral-filofulgor"] ?? []).some((p) => p.name === "Emon")
);
```

- [ ] **Step 4: Gate**

Run: `npx tsx scripts/check-atlas.ts && npx tsx scripts/check-taldorei.ts && npx tsc --noEmit`
Expected: los tres pasan.

- [ ] **Step 5: Commit**

```bash
git add data/atlas.ts scripts/check-atlas.ts
git commit -m "fix(atlas): TALDOREI_FIXES, para que las correcciones lleguen a un atlas ya sembrado"
```

---

## Task 8: Tal'Dorei vuelve al mapa del mundo

Hoy `WORLD_POIS` solo tiene el pin del continente: en el mapa mundial, Marquet
enseña 36 pines y el continente de la campaña está vacío.

**Files:**
- Modify: `data/world.ts:70` (bloque de Tal'Dorei)
- Modify: `scripts/check-atlas.ts`

- [ ] **Step 1: Añadir solo ciudades y fortalezas**

Los ~60 accidentes naturales **no van**: el mapa mundial ya lleva 101 pines y su
función es la navegación entre continentes. Añadir a `WORLD_POIS`, en el bloque
de Tal'Dorei, una entrada por cada POI de tipo `ciudad` o `fortaleza` de
`data/pois.ts`, con:
- `type`: `"capital"` para Emon (es la capital de la república), `"ciudad"` para
  el resto de `ciudad`, `"fortaleza"` para las fortalezas.
- `region`: el **nombre** de la región (no el slug) — `WORLD_POIS` usa nombres.
- `blurb`: **el mismo** que en `data/pois.ts`, sin reescribir.
- `x`/`y`: coordenadas del **mapa mundial** (`public/maps/taldorei.jpg`), no las
  de la región. `CONTINENT_VIEW["Tal'Dorei"].box` acota la zona:
  `x: 37, y: 14, w: 24, h: 50` — o sea x∈[37,61], y∈[14,64]. Leer
  `public/maps/taldorei.jpg` y colocarlas dentro de esa caja.

- [ ] **Step 2: Comprobarlo en `check-atlas.ts`**

```ts
// --- Cada ciudad/fortaleza de Tal'Dorei tiene su pin en el mapa mundial ---
import { POIS } from "../data/pois"; // (subir al bloque de imports)

const nombresMundo = new Set(WORLD_POIS.filter((p) => p.continent === "Tal'Dorei").map((p) => p.name));
for (const lista of Object.values(POIS)) {
  for (const p of lista) {
    if (p.type !== "ciudad" && p.type !== "fortaleza") continue;
    check(`${p.name}: tiene pin en el mapa mundial`, nombresMundo.has(p.name));
  }
}
```

- [ ] **Step 3: Gate**

Run: `npx tsx scripts/check-atlas.ts && npx tsx scripts/check-taldorei.ts`
Expected: los dos pasan.

- [ ] **Step 4: Commit**

```bash
git add data/world.ts scripts/check-atlas.ts
git commit -m "feat(atlas): las ciudades y fortalezas de Tal'Dorei en el mapa del mundo"
```

---

## Task 9: Gate completo y documentación

**Files:**
- Modify: `HANDOFF.md`
- Modify: vault de Obsidian (`C:\Users\carlo\Desktop\Exandria-Obsidian\Exandria`)

- [ ] **Step 1: Los 22 scripts**

Run, uno a uno: `npx tsx scripts/check-<nombre>.ts` para los 22
(`archive`, `ataque`, `atlas`, `bestiary`, `clases`, `clima`, `clock`,
`combate`, `conjuros`, `derive`, `dice`, `dicebox`, `estado`, `ficha`,
`inventario`, `lore`, `slots`, `spells`, `statrolls`, `taldorei`, `targeting`,
`turno`).
Expected: los 22 en verde. Anotar el recuento de cada uno.

- [ ] **Step 2: Compilar**

Run: `npx tsc --noEmit && npx next build`
Expected: los dos limpios.

- [ ] **Step 3: Comprobación visual en `/mapa`**

Abrir `/mapa`, entrar en las ocho regiones de Tal'Dorei y confirmar que cada pin
cae sobre su rótulo del submapa. Es lo único que el gate no puede ver.

- [ ] **Step 4: Actualizar `HANDOFF.md`**

Sección `## RESUELTO (2026-07-29): el atlas de Tal'Dorei` con: los cuatro
fallos verificados, los cuatro POIs que estaban en la región equivocada, el
recuento 45 → 94, el gate 21 → 22 scripts, y la nota de que `mergeAtlas` no
propagaba correcciones (la trampa de esta tanda). Actualizar también la tabla de
«Scripts de comprobación» con `check-taldorei` y su recuento.

- [ ] **Step 5: Actualizar el vault**

Reflejar el cambio en las notas de mapa/atlas del vault de Obsidian.

- [ ] **Step 6: Commit y merge**

```bash
git add HANDOFF.md
git commit -m "docs: el atlas de Tal'Dorei, arreglado y poblado"
git checkout master
git merge atlas-taldorei
git push
```

---

## Lo que este plan NO hace

- Poblar Issylra, Wildemount, Marquet y los Dientes Rotos. Es la tanda
  siguiente y necesita fuentes del usuario (libros o autorización para la wiki).
- Deshacer el aplastamiento `capital`/`pueblo` → `ciudad` de
  `WORLDTYPE_TO_POITYPE` (afecta a los continentes generados, no a Tal'Dorei).
- Submapas para Issylra, Marquet y Dientes Rotos, ni el campo `image` en el
  editor DM.
- Servicios de POI (tienda, posada, npcs, tablón).
</content>
