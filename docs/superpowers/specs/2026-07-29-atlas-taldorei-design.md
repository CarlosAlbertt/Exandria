# Spec — Arreglar y poblar el atlas de Tal'Dorei (2026-07-29)

## El problema

La sesión empezó con la intención de poblar los cuatro continentes que se ven
vacíos frente a Tal'Dorei. Al comprobarlo, el continente que se daba por bueno
—Tal'Dorei, donde se juega la campaña— resultó ser el que está mal.

### Lo verificado en el código

1. **`capital` roto en 3 de 8 regiones** (`data/taldorei.ts`):
   - Sierras de Alabastro → `capital: "Westruun"`. Ese POI existe, pero está en
     **Llanuras Divisorias** y traducido («Oestruun»). La capital real de las
     Sierras es Piedrablanca.
   - Península de Pleabruma → `"Puerto Sombrío"`: no existe como POI.
   - Litoral de Filofulgor → `"Bys"`: no existe como POI.

   `RegionCard` enseña al jugador una capital a la que no puede ir.

2. **Las coordenadas x/y son plantilla, no posiciones.** Siete pares idénticos
   repetidos entre regiones distintas (`45,40`, `45,45`, `62,55`, `30,60`,
   `60,30`, `40,74`, `25,60`). Cada región tiene su capital en ~(40-45, 35-48)
   y el resto repartido en las mismas cuatro casillas. Nadie las colocó nunca
   sobre el submapa.

3. **El gate no mira nada de esto.** `scripts/check-atlas.ts` son 118
   comprobaciones y **ninguna** toca los 45 POIs de Tal'Dorei: valida que los
   `WORLD_POIS` caigan en su región y que los slugs sean únicos. De Tal'Dorei
   solo comprueba que los slugs de región sigan presentes. Es la sexta vez en el
   proyecto que una regla vive donde el gate no llega.

4. **Tal'Dorei no tiene ni un POI en `WORLD_POIS`** — solo su pin de continente.
   En el mapa del mundo, Marquet enseña 36 pines y el continente de la campaña
   está vacío.

### Lo verificado abriendo los ocho submapas

`public/maps/regions/*.jpg` son mapas hexagonales rotulados (de MrFarland) con
la toponimia de Tal'Dorei encima, y las ocho hojas se llaman **exactamente**
como las ocho regiones del continente. **Son la fuente de verdad de esta
tarea**: no hace falta ningún libro ni ninguna wiki para nombres ni posiciones
de Tal'Dorei.

Al leerlas salen fallos que solo se ven mirando el mapa:

5. **Cuatro POIs están en la región equivocada**:
   | POI | Está en | Debe estar en | Prueba |
   |---|---|---|---|
   | Emon | Costa Lucidiana | **Litoral de Filofulgor** | rotulado en `litoral-filofulgor.jpg`; Emon mira al Mar de Ozmit por el oeste, la Costa Lucidiana es el litoral este |
   | Zephrah | Mtes. Crestormentas | **Costa Lucidiana** | rotulado en `costa-lucidiana.jpg`, en los Summit Peaks |
   | Lyrengorn | Mtes. Crestormentas | **Mtes. Torrerrisco** | rotulado en `montanas-torrerrisco.jpg`, junto a los Neverfields |
   | Abismo de Cerrofauces (Ashen Gorge) | Pen. de Pleabruma | **Mtes. Crestormentas** | rotulado en `montanas-crestormentas.jpg` |

   («Montañas Puntormenta» / Stormpoint Mountains aparece rotulado en las hojas
   de Crestormentas **y** de Pleabruma: es frontera. Se queda en Pleabruma, que
   es donde está hoy, y no cuenta como error.)

6. **Dos nombres propios mal traducidos**: «Lago Anclado» y «Rivera del río
   Anclado» son **Mooren Lake** y **Mooren River Run**. Se tradujo *moor* →
   *anclar*. Mooren es un nombre propio.

7. **Un POI mal entendido**: «Bahía de las Dagas» está tipada `ciudad` con blurb
   de «puerto de piratas y contrabandistas». En el mapa, **Daggerbay es una
   bahía** (y las Daggerbay Mountains, una cordillera). No hay puerto ahí.

8. **Faltan ~57 lugares que los mapas rotulan.** El caso extremo es la Península
   de Pleabruma: la hoja rotula **cinco** asentamientos (Ezordam-Haar, Hdar-Tye,
   Ortem-Vellak, Rybad-Kol, T'Zarrm) y el dato conoce **uno** (Byroden).

## Qué se construye

Cuatro tareas, en este orden. Las tres primeras son Tal'Dorei; la cuarta lo
devuelve al mapa del mundo. Poblar los otros cuatro continentes **no entra en
esta tanda**: no tienen submapa propio y dependen de fuentes que el usuario aún
no ha pasado.

### Tarea 1 — El gate primero: `scripts/check-taldorei.ts`

La capa pura y su script antes que el contenido, que es la convención del
proyecto y justo lo que faltó aquí. El script comprueba, sobre
`data/taldorei.ts` + `data/pois.ts`:

- **La capital de cada región existe como POI de esa misma región.** Excepción
  explícita: `capital: "—"` (Montañas Crestormentas no tiene capital). Esto es
  lo que caza los tres capitales rotos.
- **Ningún par x/y se repite entre regiones distintas.** Dentro de una región,
  dos POIs tampoco comparten posición exacta.
- **Todo x/y está en `[2, 98]`**, para que ningún pin caiga pegado al borde del
  submapa ni fuera.
- **Todos los nombres están en español**: sin `Fort`, `Village`, `Mount`,
  `Bay`, `Wood` sueltos. Lista negra de palabras inglesas, no adivinanza.
- **`TOWN_MAPS` apunta a POIs vivos**: cada clave de `data/townMaps.ts` existe
  como nombre de POI en alguna región, y su archivo existe en `public/`.
- **Cada región de `REGIONS` tiene entrada en `POIS`** y ninguna está vacía.
- **Cada región tiene su `image` y el archivo existe** en `public/maps/regions/`.
- **Nombres de POI únicos en todo el continente** (`poi_state` indexa por
  nombre, dos «Torian Forest» se pisarían el estado de revelado).

El script es nuevo: el gate pasa de 21 scripts a **22**.

### Tarea 2 — Arreglar los 45 POIs que ya hay

Con el script en rojo, arreglar hasta ponerlo en verde:

- Los tres `capital`: Sierras de Alabastro → `Piedrablanca`; Litoral de
  Filofulgor → `Emon`; Península de Pleabruma → `Byroden`.
- Mover los cuatro POIs de región (tabla del punto 5).
- Renombrar «Lago Anclado» → **Lago Mooren** y «Rivera del río Anclado» →
  **Vega del Mooren**.
- «Bahía de las Dagas» pasa a `natural` con blurb de bahía, y se separa de las
  **Montañas Daggerbay**, que son otro accidente.
- Traducir «Fort Daxio» → **Fuerte Daxio**.
- **Recolocar los 45 x/y leyendo cada submapa**, lugar a lugar.
- Retipar lo que está mal: aldeas tipadas `ciudad` que son aldeas, «Montañas
  Puntormenta» de `peligro` a `natural`, «Caverna del Axioma» de `ruina` a
  `cueva` (ver tipos nuevos abajo).

Todo cambio de esta tarea que afecte a un POI **ya existente** (posición,
nombre, región, tipo) entra además en `TALDOREI_FIXES` — ver «Riesgos», sin eso
nada de esto llega a la partida.

**Los POIs que no aparecen rotulados en ninguna hoja se quedan** (Yug'Voril es
subterránea, Brasalcázar, Grietasombría, Ruhn-Shak, Niirdal-Poc, Cavernas
Cienocristal, Cicatriz del Rey Cinéreo, Deastok). No se borra nada por no
encontrarlo en un mapa: se le da una posición razonable dentro de su región y se
anota en el plan cuáles no tienen confirmación cartográfica.

### Tarea 3 — Añadir lo que los mapas rotulan y falta

~57 POIs nuevos leídos de las ocho hojas, con posición real. Tal'Dorei pasa de
**45 a ~100**. Reparto aproximado por región: Lucidiana +6, Alabastro +7,
Divisorias +8, Torrerrisco +9, Crestormentas +6, Pleabruma +8, Verdante +7,
Filofulgor +6.

**Convención de contenido, que en esta tarea es la regla**: los nombres y los
datos geográficos son hechos de la ambientación y se usan tal cual (traducidos
al español cuando el nombre es descriptivo, respetados cuando es propio: Mooren,
Syngorn, T'Zarrm). **Todos los blurbs son redacción original en español** — un
resumen propio de qué es el lugar y qué se puede hacer allí, nunca prosa de los
libros ni de la wiki, ni traducida ni parafraseada de cerca. Es una herramienta
de fans no oficial.

### Tarea 4 — Tal'Dorei vuelve al mapa del mundo

`WORLD_POIS` gana las entradas de Tal'Dorei que hoy no tiene, derivadas de
`POIS` (nombre, tipo, región, blurb; x/y en coordenadas del mapa **mundial**,
que son otras). Alcance: **solo las ciudades y las fortalezas**, no los ~60
accidentes naturales — el mapa mundial ya se satura con 101 pines y su función
es la navegación entre continentes, no el detalle.

`check-atlas` gana la comprobación de que cada ciudad/fortaleza de Tal'Dorei
tiene su pin de mundo.

## Decisiones tomadas

**Siete tipos de POI.** `PoiType` gana **`cueva`** y **`campamento`**, que es lo
que el usuario pidió y no tenía sitio. Bahías, bosques, cordilleras y cruces de
caminos **siguen en `natural`**: un icono por accidente geográfico sería una
lista sin fin. Tocar `PoiType` obliga a tocar `POI_ICON`, `POI_COLOR` y
`WORLDTYPE_TO_POITYPE` en `data/atlas.ts` — los tres son `Record` completos, así
que olvidarse de uno **no compila**, que es justo la propiedad que se quiere.

- `cueva` → icono `fa-mountain`, color `var(--color-arcane-deep)`.
- `campamento` → icono `fa-campground`, color `var(--color-warm)`.

(Font Awesome 6 free no tiene icono de cueva; `fa-mountain` es la boca en la
roca y no choca con `natural`, que usa `fa-tree`.)

**Emon no necesita mapa nuevo.** La duda inicial («el mapa de la Costa Lucidiana
no incluye Emon») era un síntoma, no la causa: Emon está rotulado en la hoja del
Litoral de Filofulgor. Se mueve de región y queda colocado sobre un mapa que sí
lo contiene.

**El aplastamiento `capital`/`pueblo` → `ciudad` de `WORLDTYPE_TO_POITYPE` se
queda.** Es un problema real (Rexxentrum y una aldea comparten icono) pero es de
los continentes generados, no de Tal'Dorei, y arreglarlo pide decidir si
`PoiType` gana `capital` y `aldea`. Fuera de alcance; se anota para la tanda de
los otros continentes.

## Lo que NO entra

- Poblar Issylra, Wildemount, Marquet y los Dientes Rotos. Es la tanda
  siguiente, y necesita fuentes que el usuario tiene que pasar (o autorización
  para leer la wiki de Critical Role).
- Submapas de región para Issylra, Marquet y Dientes Rotos.
- El campo `image` en el formulario de región del editor DM.
- La limitación conocida del editor (arrastre de POIs sobre el mapa mundial sin
  recortar cuando la región no tiene `image`). No afecta a Tal'Dorei, que tiene
  las ocho.
- Servicios de POI (`services`: tienda, posada, npcs, tablón). Es contenido de
  otra fase.

## Verificación

- `npx tsc --noEmit` + `npx next build` limpios.
- Los **22** `scripts/check-*.ts` en verde, incluido el nuevo `check-taldorei`.
- Comprobación a ojo en `/mapa`: entrar en las ocho regiones de Tal'Dorei y ver
  que los pines caen sobre el rótulo que les corresponde en el submapa.

## Riesgos

- **`atlas_defs` ya está sembrado en `app_config`, y `mergeAtlas` no arregla
  nada de esto.** `seedAtlas()` solo corre la primera vez; después manda
  `mergeAtlas`, que **suma POIs nuevos por nombre pero no reposiciona, no
  renombra y no mueve de región**. Sin más, la Tarea 2 entera (recolocar,
  renombrar Mooren, mover Emon/Zephrah/Lyrengorn/Ashen Gorge) **no llegaría
  nunca a la partida**: el atlas guardado seguiría con los pines viejos, y solo
  se vería el efecto en una base recién sembrada.

  **Decisión: una lista explícita de correcciones, aplicada una sola vez.**
  `data/atlas.ts` gana `TALDOREI_FIXES`: una tabla de `{ nombre, deRegión,
  aRegión?, nombreNuevo?, x?, y?, tipo? }` que `mergeAtlas` aplica **solo a los
  POIs de Tal'Dorei que siguen exactamente como estaban** (mismo nombre, misma
  región, mismas x/y de plantilla). Si el DM ya movió o renombró ese pin, la
  corrección **se salta** y su edición se respeta. Es idempotente: aplicada una
  vez, la segunda no encuentra nada que casar.

  Se descarta borrar `atlas_defs` y resembrar: es irreversible y se llevaría por
  delante cualquier edición del DM en los cinco continentes, no solo en
  Tal'Dorei.
- Recolocar 45 POIs y añadir ~57 leyendo imágenes es trabajo a ojo: un pin puede
  quedar a un hexágono de su sitio. El DM lo arrastra desde Panel DM › Mapa; no
  es un fallo que bloquee.
</content>
</invoke>
