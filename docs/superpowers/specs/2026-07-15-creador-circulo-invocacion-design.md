# Diseño — Creador de personaje: Círculo de invocación (+ Fase K)

Aprobado 2026-07-15. Sustituye la puesta en escena del creador actual (el
**tomo**, `components/CharacterBook.tsx`) por un **círculo de invocación**, e
integra la **Fase K** (aptitudes por dados de tirada única / array /
point-buy) de la guía
`docs/superpowers/specs/2026-07-12-campana-semivirtual-guia.md`.

## Por qué

El tomo no convence como metáfora. Además, el creador se ve pobre porque
**faltan imágenes**: `public/species/` está vacío (36 especies sin arte) y de
las clases hay **11 de 13** (`public/classes/`, faltan `bardo.jpg` y
`paladin.jpg`). Un creador tipo galería de retratos no puede lucir hoy.

El círculo resuelve las dos cosas: es **generativo** (runas, siluetas y
brillos en CSS/SVG — espectacular sin arte) y **hace protagonista al arte
donde sí existe** (medallón con la imagen de clase). Mejora sola según se
suba arte, y encaja con los dados 3D recién hechos (Fase A).

## Qué NO cambia (importante)

- **La lógica de estado y validación del creador se conserva intacta**: los
  6 pasos, `stepDone`, el gate de pasos, el borrador en `localStorage`, el
  guardado en Supabase y los datos (`data/species.ts`, `classes.ts`,
  `backgrounds.ts`, `rules.ts`). Solo cambia la puesta en escena.
- Los 6 pasos siguen siendo: **Especie → Clase → Trasfondo → Aptitudes →
  Pericias → Ficha**.
- Reglas D&D 2024 (point-buy 27, bonus de trasfondo, pericias) igual.

## Escena

Dos zonas:

- **Círculo** (centro/izquierda): dos aros (exterior bronce sólido, interior
  arcano discontinuo), un **medallón** central y **6 runas** repartidas por
  el borde — una por paso.
- **Carril** (derecha, ~240–280px; abajo en móvil): la lista de opciones del
  paso actual, con miniatura + nombre + subtítulo.

**Las runas son la navegación y el progreso**: encendida = paso completo,
resaltada = paso actual, apagada = pendiente. Pulsar una runa salta a ese
paso (respetando el gate actual: no se puede saltar a un paso posterior al
primero incompleto). No hay barra de progreso ni migas de pan.

## Medallón (regla de arte)

Un único componente resuelve todos los casos:

1. **Hay imagen** → se muestra recortada en círculo, con aro bronce y halo.
   Fuente por orden: URL de Storage (futuro, Fase H) → `public/classes/<slug>.jpg`
   → `public/species/<slug>.jpg` → `public/species/lineages/<slug>.jpg`.
2. **No hay imagen** → **silueta rúnica generativa**: una figura simple
   (cabeza+cuerpo) en degradado, cuyo **tinte** varía según lo elegido
   (p. ej. por región de la especie) y con un glifo. No es un placeholder
   vacío: es el estilo.

`components/PortraitFrame.tsx` ya hace fallback a icono; se **reutiliza su
lógica de resolución de imagen** y se le añade la variante "medallón". No se
duplica.

## Los 6 pasos

| Paso | Carril | Círculo |
|---|---|---|
| **Especie** | 36 especies **agrupadas por región** (`REGIONS`/`regionSpecies()`, ya existen); linaje como sub-lista al elegir | Medallón = silueta (sin arte hoy), tintada por región; runa "✦" se enciende |
| **Clase** | 13 clases con **miniatura real**; subclase como sub-lista | Medallón = **arte de la clase**; la subclase dibuja un anillo interior |
| **Trasfondo** | 16 trasfondos | Se clava una **runa-símbolo** del trasfondo en el borde |
| **Aptitudes** | Selector de método + asignación (ver Fase K abajo) | **El círculo es la arena de dados**: los 4d6 ruedan dentro |
| **Pericias** | Pericias disponibles (según clase/trasfondo) | Cada pericia elegida **enciende una marca** del anillo exterior |
| **Ficha** | Nombre + historia (12000 car.) | El círculo **se cierra**, destello, el personaje **se materializa** → resumen + "Crear personaje" |

Todas las animaciones respetan `prefers-reduced-motion` (sin destellos ni
pulsos; los estados se muestran igual).

## Fase K — Aptitudes (integrada)

El jugador elige **una vía, una sola vez**:

1. **Dados**: 4d6-descarta-el-menor ×6, tirados con los **dados 3D de la Fase
   A** dentro del círculo (usa `rollVisual`; el jugador lanza, estilo BG3).
   Los 6 valores quedan **fijos para siempre**; la **asignación** a
   FUE/DES/CON/INT/SAB/CAR sí es libre hasta guardar la ficha.
2. **Array estándar 2024**: 15/14/13/12/10/8, asignación libre.
3. **Point-buy 27**: el actual, intacto.

**Bloqueo en servidor** (en `localStorage` se saltaría por consola):

- Tabla **`stat_rolls`** (migración `schema_v13`): `user_id uuid PK →
  profiles`, `method text` (`dados`|`array`|`pointbuy`), `values int[]`,
  `rolled_at timestamptz`.
- **RLS**: `select` propio (y DM), `insert` propio, **sin `update` ni
  `delete`** para jugadores → la fila es inmutable y la **PK impide una
  segunda tirada**. El **DM tiene `delete`** (`is_dm()`) = **resetear** la
  tirada de un jugador.
- Elegir array/point-buy **también inserta su fila** (bloquea cambiar de
  método para "probar suerte").
- **UI DM**: botón "Resetear tirada de aptitudes" en Panel DM › Grupo.
- **Sin sesión Supabase** (modo localStorage): solo array/point-buy, con
  aviso — los dados exigen sesión para poder bloquearse.

**Modelo de confianza** (explícito): los dados ruedan en el cliente y el
cliente inserta el resultado; un tramposo con consola podría falsear UNA
inserción, igual que las tiendas autoservicio (Fase C). Lo que el sistema
garantiza es que **no hay repetición**. Tirar en servidor mataría la
animación (dice-box no permite forzar resultados).

Los **bonus de trasfondo** se aplican después del método, como hoy.

## Arquitectura

`app/crear/page.tsx` tiene **615 líneas** y mezcla estado, validación y toda
la UI. Se parte por responsabilidad (la lógica se conserva, se mueve):

- `app/crear/page.tsx` — estado del borrador, validación, gate de pasos,
  guardado. **Sin UI de escena.**
- `components/crear/InvocationCircle.tsx` — el círculo: aros, runas
  (navegación) y slot para el medallón/arena.
- `components/crear/Medallion.tsx` — medallón: imagen si existe, silueta
  rúnica generativa si no (reutiliza la resolución de `PortraitFrame`).
- `components/crear/OptionRail.tsx` — carril genérico: lista de opciones con
  miniatura/nombre/subtítulo, con soporte de agrupación (regiones) y
  sub-lista (linaje/subclase).
- `components/crear/steps/` — un componente por paso (`SpeciesStep`,
  `ClassStep`, `BackgroundStep`, `AbilitiesStep`, `SkillsStep`, `SheetStep`).
- `lib/statRolls.ts` — reglas de Fase K: `roll4d6DropLowest` (puro,
  testeable), `STANDARD_ARRAY`, y el cliente de `stat_rolls`.
- **Se retira** `components/CharacterBook.tsx` (el tomo) una vez sin
  consumidores.

## Verificación

- `npx tsc --noEmit`, `npm run build`, `npx tsx scripts/check-*.ts`.
- **Nuevo** `scripts/check-statrolls.ts`: `roll4d6DropLowest` (6 valores en
  3–18, descarta el menor de 4 dados, 200 iteraciones) y `STANDARD_ARRAY`.
- **Visual en navegador**: `/crear` funciona **sin sesión** (borrador en
  `localStorage`), así que la escena, el carril, el medallón (con y sin
  arte), las runas y el responsive **se validan en el navegador de verdad**.
- **Límite conocido**: el paso de dados usa WebGL y el navegador headless del
  entorno se cuelga al capturar → ese paso se valida por código + prueba en
  vivo del usuario.
- La migración `schema_v13` la **ejecuta el usuario** en el SQL Editor.

## Fuera de alcance

- Subir arte desde la app (eso es **Fase H**); aquí solo se **consume** el
  arte que exista y se deja lista la resolución por URL.
- Generar las imágenes que faltan (`bardo.jpg`, `paladin.jpg`, 36 especies).
- Cambiar los datos de reglas, el número de pasos o el modelo de `characters`.
