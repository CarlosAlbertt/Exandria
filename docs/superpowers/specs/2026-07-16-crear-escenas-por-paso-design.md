# Diseño — `/crear`: una escena por paso

**Fecha**: 2026-07-16 · **Rama**: `master` (trabajo directo)
**Sustituye visualmente a**: `2026-07-15-creador-circulo-invocacion-design.md`

## Por qué

El círculo de invocación (2026-07-15) funciona pero reparte mal el espacio. Medido
en el navegador a 1280px de ancho, con el dev server y `crear` excluido del matcher
del proxy:

| Cosa | Hoy | Problema |
|---|---|---|
| Página | tope 1152px | Deja aire a los lados y aprieta lo de dentro. |
| Columna izquierda | 824px para un círculo de 300px | 262px vacíos a cada lado. |
| Medallón | 168px | Pequeño para ser el retrato. |
| Carril derecho | 280px | Ahogado. |
| Tarjetas de método (paso Aptitudes) | **75px de ancho × 425 de alto** | Títulos partidos en 2–3 líneas, descripciones de 180–200px de alto. |

La causa de lo peor: `.crear-grid` es `1fr 280px` y **los pasos 3–5 (Aptitudes,
Pericias, Ficha) se renderizan dentro del carril de 280px**, cuando no son listas
y no tienen nada que hacer ahí.

Además, `min(74vw, 300px)` topa en 300px desde vw≥405: el `74vw` no llega a usarse
nunca en escritorio, así que el círculo no crece por mucha pantalla que haya.

**Falso positivo descartado**: las runas *no* están mal colocadas ni recortadas.
Medido a 375, 900 y 1280px, `--r: min(37vw,150px)` es exactamente la mitad de
`min(74vw,300px)`, así que caen siempre sobre el aro y ninguna sale del contenedor.
Lo que se percibe como "cortada" es que cada runa está centrada en la línea del aro
y la mitad sobresale del disco. Se resuelve solo al retirar el círculo.

## Decisión de diseño

**Cada paso es su propia escena a pantalla completa.** Ninguna disposición sirve
para los seis pasos: la especie es una galería con mucho texto, la clase un pase de
arte, las aptitudes una mesa de dados. Se diseña cada uno para lo que es.

**El círculo se retira; la navegación pasa a una barra de runas.** Las 6 runas
siguen siendo los pasos, con los mismos estados (encendida = completo, resaltada =
actual, apagada + `disabled` = no alcanzable) y el mismo gate. El arte deja de vivir
recortado en un medallón de 168px y se muestra a tamaño de retrato.

> Se pierde el círculo de invocación como imagen de marca del creador, que tiene dos
> días. Decisión explícita del usuario tras ver las tres alternativas.

**La página deja de tener tope de 1152px**: `max-w-[1600px]`, centrada, `px-6`.

## Regla de arte

El arte de clase es **vertical, 659×1025** (medido sobre `/classes/clerigo.jpg`).
Todas las escenas con retrato reservan un panel vertical de **260px** de ancho.

- Con imagen → el retrato, sin recortar en círculo.
- Sin imagen → **silueta rúnica** en el mismo hueco (la de `Medallion` hoy).

Estado actual, que se acepta a sabiendas:

- `public/classes/`: **11 de 13**. Bardo y Paladín van con silueta y a este tamaño
  canta mucho más que en una miniatura de 30px.
- `public/species/`: **vacío** (solo la carpeta `lineages`). Las 36 especies van con
  silueta. **El panel se reserva igualmente** porque el usuario va a subir arte;
  cuando suelte `public/species/<slug>.jpg` aparece solo, sin tocar código.
- Trasfondos: `data/backgrounds.ts` no tiene campo `image` ni está previsto. Su
  escena **no lleva panel de arte**.

## Las seis escenas

Todas comparten: barra de runas arriba (centrada), input de nombre y botones
Atrás/Siguiente donde están hoy.

### 0 · Especie — acordeón grande + retrato + detalle

Tres columnas: `300px | 260px | 1fr`.

- **Acordeón por región** (7 grupos con recuento, uno abierto a la vez, auto-abre el
  de la especie elegida). Más grande y legible que hoy: filas de 38px, miniatura de
  38px, nombre a 14px y lema debajo. Hoy: filas de ~30px y nombre a 12px.
- **Retrato** 260px (silueta hoy).
- **Detalle**: región, nombre, lema, blurb, origen, tamaño, velocidad, rasgos y el
  **linaje anidado** como elección.

El buscador se conserva.

### 1 · Clase — flechas + retrato + detalle + tira de 13

`◀ | 260px de arte | 1fr de detalle | ▶`, y debajo una **tira de las 13 miniaturas**.

- **Fuera el acordeón y el buscador**: aquí la navegación son las flechas, una clase
  cada vez.
- La **tira** dice dónde estás y cuánto queda, y deja saltar de un clic (sin ella, de
  Bárbaro a Cazador de Sangre son 12 clics a ciegas).
- Contador «Clase 4 de 13» y el grupo (Marcial · Arcano · Divino · Primigenio) como
  antetítulo.
- **Detalle**: nombre, lema, blurb, dado de golpe, salvaciones, nº de pericias, y las
  **subclases** como elección, visibles sin bajar la vista.
- El orden de recorrido es el de `classOptions` (ya ordenado por grupo), así que las
  flechas pasan por los grupos en orden.

### 2 · Trasfondo — lista + detalle

Dos columnas: `300px | 1fr`. Lista plana de los 16 (no tienen grupo) y detalle a lo
ancho: blurb, dote, pericias, herramienta y las tres aptitudes que podrán recibir
el +3. Sin panel de arte.

### 3 · Aptitudes — la escena entera

- **Elegir método**: las tres tarjetas en `grid-cols-3` a ~340px cada una, con el
  aviso de tirada única centrado y en `--color-ember`. Verificado en el mockup: los
  títulos caben en una línea (hoy, 2–3).
- **Repartir**: una fila por aptitud, holgada y en línea — nombre (130px) · valor
  (stepper en point-buy, select en dados/array) · bonus de trasfondo · total a la
  derecha. Los dos chips de estado (valores/puntos y bonus 3/3) arriba, centrados.

### 4 · Pericias — dos bloques a lo ancho

`1fr 1fr`: las fijas del trasfondo (con candado) a un lado, las elegibles de la clase
al otro, con el contador `n/need`.

### 5 · Ficha — héroe y historia en paralelo

`1fr 1fr`: a la izquierda nombre, línea de identidad, las 6 aptitudes en rejilla, PG,
competencia y dado de golpe; a la derecha el textarea de historia y los botones
(Crear personaje · Copiar hoja · Ir a la ficha · Empezar de nuevo). Sin bajar la vista.

## Componentes

Nuevos, en `components/crear/`:

| Archivo | Responsabilidad | Depende de |
|---|---|---|
| `RuneBar.tsx` | Las 6 runas: estado, gate (`maxStep`), `onGo`. | — |
| `ArtPanel.tsx` | Retrato vertical o silueta. Resetea el fallo de carga al cambiar `src` (igual que `Medallion` hoy). | — |
| `steps/SpeciesScene.tsx` | Escena 0. | `OptionRail`, `ArtPanel` |
| `steps/ClassScene.tsx` | Escena 1: flechas, tira, detalle, subclase. | `ArtPanel` |
| `steps/BackgroundScene.tsx` | Escena 2. | `OptionRail` |

Cambian:

- `OptionRail.tsx` — se queda para especies (acordeón) y trasfondos (lista plana).
  **Pierde su uso en clases.** Estilos más grandes.
- `AbilitiesStep.tsx` — misma lógica, estilos a lo ancho. Cambia el flujo de tirada
  única (ver abajo).
- `app/crear/page.tsx` — deja de montar el círculo; monta `RuneBar` + la escena del
  paso. `StepSkills` y `StepSummary` pasan a 2 columnas.

Se retiran:

- `InvocationCircle.tsx` y `Medallion.tsx` (la silueta se muda a `ArtPanel`).
- `DetailPanel.tsx` — su contenido se reparte entre las escenas, que ya tienen sitio
  para él. Se borra si no le queda ningún consumidor.

CSS (`app/globals.css`): fuera `.crear-grid`, `.crear-left`, `.inv-*`, `.medallion*`.
Entran `.rune-bar`, `.rune`, `.art-panel`, `.scene-*`. `.rail*` se queda, con medidas
mayores.

**`page.tsx` tiene ya ~575 líneas** y va a crecer. Sacar las escenas 0–2 a sus
propios archivos lo deja como lo que debe ser: estado, validación, gate y guardado.

## Bug — crear un segundo personaje

**No se pudo reproducir en vivo** (requiere sesión; no hay credenciales de ninguna
cuenta en el entorno de desarrollo). Diagnóstico por lectura de código.

**Causa**: `reset()` (`page.tsx:188`, botón «Empezar de nuevo») pone `statMethod: null`
**solo en el cliente**. La fila de `stat_rolls` sigue en la BD. Al volver al paso
Aptitudes reaparece el selector de método, cualquier elección llama a `saveStatRoll`
→ `insert` → choca con la PK, y `AbilitiesStep` pinta el mensaje crudo de Postgres
(`duplicate key value violates unique constraint "stat_rolls_pkey"`). Con 4d6 es peor:
`AbilitiesStep.tsx:70-77` lanza los **seis dados primero** y hace el insert **después**.

**El bloqueo del servidor es correcto y no se toca.** Lo que falla es qué hace el
cliente al chocar.

**Fix — reusar la tirada**:

1. `reset()` **conserva** `statMethod`, `rolled` y `assign`. Rehaces nombre, especie,
   clase y trasfondo; las aptitudes son las que te tocaron. Coherente con el diseño:
   la tirada es del jugador, no del personaje.
2. `AbilitiesStep` **no enseña el selector de método si ya hay fila**. En su lugar:
   los valores y «Tu tirada quedó registrada. Pide al DM que la resetee si quieres
   repetirla» (Panel DM › Grupo › Resetear aptitudes).
3. Si aun así llega un error de la BD, **se traduce** — nada de texto de Postgres.

Con (1) y (2) no se llega nunca al insert duplicado; (3) es la red.

## Bug — `assign` no persiste

Hoy `assign` no se guarda en ningún sitio. Al volver a `/crear`, el efecto de
`page.tsx:123` recupera `method` y `rolled` de `stat_rolls`, pero con `assign` vacío
`stepDone[3]` es `false` → el gate te bloquea en Aptitudes y te obliga a reasignar
los 6 valores aunque la ficha esté completa. **Pasa siempre**, sin tocar «Empezar de
nuevo».

**Fix — derivarlo de `base`**, sin migración: `base` ya guarda las puntuaciones
finales y `stat_rolls.scores` los 6 valores. Al cargar, se emparejan para
reconstruir la asignación.

Función pura nueva en `lib/statRolls.ts`:

```ts
// Reconstruye qué índice de `scores` fue a cada aptitud. `base` ya es la
// puntuación SIN el bonus de trasfondo (ese vive aparte en `bonus`), así que
// empareja por valor directo, consumiendo cada índice una sola vez: los valores
// se repiten y dos 13 son dos índices distintos.
export function deriveAssign(
  base: Record<AbilityKey, number>,
  scores: number[],
): Assign
```

Si no cuadra (ficha vieja, valores editados a mano, `scores` vacío en point-buy),
devuelve `ASSIGN_EMPTY` y el jugador reasigna como hoy. Nunca inventa.

Verificada por `scripts/check-statrolls.ts`: reparto normal, valores repetidos, sin
tirada, y no-cuadra → vacío.

## No-objetivos

- **No se toca la lógica de estado ni de validación**: `stepDone`, el gate, `maxStep`,
  el borrador en localStorage sin sesión, la nube con sesión. `base` sigue siendo la
  fuente de verdad de las puntuaciones.
- **No se toca `saveCharacter` ni la hoja** (`/personaje`).
- **Sin migración**: nada de `schema_v14`.
- **No se arregla `npm run lint`**, roto repo-wide de antes por
  `react-hooks/set-state-in-effect` en ~7 archivos preexistentes.
- No se sube arte (ni de especies ni de Bardo/Paladín): es del usuario.

## Verificación

- `npx tsc --noEmit`, `npm run build`, `npx tsx scripts/check-{dice,dicebox,statrolls}.ts`.
- En el navegador, excluyendo `crear` del matcher de `proxy.ts` **y revirtiendo
  después**: medir por DOM que las tarjetas de método pasan de 75px a ≥320px y que
  sus títulos ocupan **una línea**; que la barra de runas respeta el gate (solo la 1ª
  activa al entrar); que el arte de Clérigo carga de verdad; que las flechas y la tira
  recorren las 13 clases; y que no hay scroll horizontal a 1280 y 375px.
- **El screenshot del navegador se cuelga con WebGL** (dice-box): inspección por
  `javascript_tool`, que funciona siempre.
- **Solo el usuario puede probar**: el paso de dados con sesión, que no deja repetir
  la tirada, y «Resetear aptitudes» en Panel DM › Grupo.

## Riesgos

- El arte a 260px deja en evidencia a Bardo y Paladín (silueta), y a las 36 especies
  hasta que se suba arte. Asumido.
- Es un rediseño grande sobre código de dos días. Mitigación: la lógica de estado no
  se toca; lo que cambia es dónde se pinta.
