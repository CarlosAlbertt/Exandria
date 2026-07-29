Retomo Exandria, mi app de campaña de D&D 2024. Clon canónico:
`C:\Users\carlo\Downloads\dnd-campaign-app` (rama `master`, repo privado
CarlosAlbertt/Exandria, desplegada en exandria.vercel.app).

**Lee primero `HANDOFF.md`** — es el documento de estado vivo. El vault de
Obsidian (`C:\Users\carlo\Desktop\Exandria-Obsidian\Exandria`) está al día a
2026-07-29 y explica el porqué de las decisiones.

## Esta sesión va de CONTENIDO, no de mecánica

Quiero dos cosas, en este orden:

1. **Una lista completa de los continentes**, con todo lo que hay en cada uno:
   pueblos, ciudades, campamentos, zonas de interés, cuevas, ruinas, montañas,
   bosques y lo que falte. Que la pueda leer de un vistazo y decidir sobre ella.
2. **Generar los POIs que faltan** de **todas las ciudades y zonas de interés de
   cada continente**, apoyándote en la información de los libros, enlaces y
   fuentes que me pidas.

**Pídeme las fuentes que necesites.** No te las inventes ni tires solo de lo que
recuerdes: dime qué te hace falta (mapas, libros, wikis, enlaces) y te lo paso.

## Dónde está eso hoy, para que no lo busques a ciegas

- **`data/world.ts`** — `REGIONS_BY_CONTINENT` y `WORLD_POIS`: los continentes,
  sus regiones y los pines del mapa mundial.
- **`data/atlas.ts` + `lib/useAtlas.ts`** — el atlas editable por continente,
  persistido como **JSON en `app_config`, clave `atlas_defs`** (sin migración).
  `seedAtlas()` arma la semilla la primera vez que falta.
- **`data/pois.ts`** — el tipo `Poi`/`PoiType` con sus iconos y colores.
- **`data/taldorei.ts`** — regiones, mapas y lore de Tal'Dorei.
- **`public/maps/regions/`** — submapas de región. **`public/maps/pueblos/`** —
  mapas de pueblo, enlazados desde `data/townMaps.ts` (hay 6: emon, oestruun,
  piedrablanca, riscomartillo, stilben, syngorn).
- **`scripts/check-atlas.ts`** — 118 comprobaciones. Es el gate de esto.
- El editor del DM vive en **Panel DM › Mapa** (`app/dm/MapaPanel.tsx`): CRUD de
  regiones y de POIs por región, por continente.

## El desequilibrio, que es el problema de fondo

| Continente | Regiones | POIs propios |
|---|---|---|
| **Tal'Dorei** | 8 | **45** (15 ciudades · 4 fortalezas · 10 naturales · 9 peligros · 7 ruinas) |
| Issylra | 4 | solo lo que salga de `WORLD_POIS` |
| Wildemount | 4 | solo lo que salga de `WORLD_POIS` |
| Marquet | 7 | solo lo que salga de `WORLD_POIS` |
| Los Dientes Rotos | 1 | solo lo que salga de `WORLD_POIS` |

**Solo Tal'Dorei está poblado de verdad.** Los otros cuatro continentes suman 16
regiones y sus POIs se generan de la lista gruesa del mapa mundial. Ahí está el
trabajo de esta sesión.

Otro dato que manda: **solo Tal'Dorei y Wildemount tienen submapas de región**.
Issylra, Marquet y Los Dientes Rotos van con `image: ""` y caen al marco «Región
sin mapa propio» — los POIs se posicionan igual por porcentaje, pero el fondo no
es esa región. Y hay una **limitación conocida del editor**: para una región sin
`image`, la superficie de arrastre de POIs cae al mapa del mundo sin recortar.

Hay **5 tipos de POI**: `ciudad`, `fortaleza`, `natural`, `peligro`, `ruina`. Si
para lo que pido hacen falta más (cueva, campamento, bosque, montaña…), **dímelo
y lo decidimos**: añadir un tipo toca iconos, colores y el gate, no es gratis.

## La convención de contenido, que en esta sesión es LA regla

Esto va de escribir mucho texto de ambientación, así que léelo dos veces:

- **Los nombres y los datos son hechos** de la ambientación y se usan tal cual.
- **Todos los blurbs y descripciones son redacción original en español.** Nunca
  prosa de los libros, ni traducida ni parafraseada de cerca. Es una herramienta
  de fans no oficial.
- Si una fuente te da tres frases sobre un lugar, lo que se guarda es **tu resumen
  propio**, no sus frases con las palabras cambiadas.

## Cómo trabajamos

- **Antes de escribir nada**: brainstorming → spec → plan → ejecución con las
  skills de superpowers. Specs y planes en `docs/superpowers/{specs,plans}/`.
- Rama feature por tarea → gate **`npx tsc --noEmit` + `npx next build` + los 21
  `scripts/check-*.ts`** (no hay tests; ese es el gate real) → commit por tarea →
  actualizar `HANDOFF.md` y el vault → merge a `master` y push.
- **La capa pura y su script primero, la UI después.** Si algo es una regla, va a
  `lib/` con su `scripts/check-*.ts`.
- Ejecutar los planes con subagentes (implementador + revisión de spec + revisión
  de calidad por tarea) funciona: en las últimas tandas cazaron una decena de
  fallos reales que el gate no veía. Pero **revisa lo que devuelven**: han llegado
  a afirmar verificaciones que no habían hecho.
- Commits acaban con `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
  Autor `CarlosAlbertt` (Vercel bloquea otros emails). Con backticks en el
  mensaje, usar `git commit -F -` con heredoc y el **bash tool** (el shell por
  defecto es PowerShell).
- **Nunca `git add -A` a ciegas**: añade los archivos que has tocado.
- `AGENTS.md`: este Next.js 16 tiene cambios rompedores. Ante dudas de API, lee
  `node_modules/next/dist/docs/`, no tires de memoria.

## Dónde lo dejamos (28–29 de julio de 2026)

- **Migraciones v1–v23 al día.** La v23 se ejecutó el 28.
- **Fase 1 de los monstruos** hecha: el DM añade monstruos del bestiario a la
  iniciativa por tandas, con sus PG y condiciones; el DM ve `11/13` y los
  jugadores «malherido». Arregló que las reglas de G4 no mordían contra
  monstruos.
- **El inventario, rediseñado**: `/inventario` es una pantalla propia (muñeco con
  retrato, vitales con la CA **y su porqué**, bolsa agrupada, detalle en el
  sitio). La ficha bajó de 897 a 780 líneas. El jugador equipa y anota; añadir y
  soltar son del DM, que llega por `/inventario?user=<id>`.
- **Y por fin se jugó.** En cinco minutos salieron tres fallos seguidos del
  selector de huecos (un anillo se equipaba como arma principal), con `tsc`,
  `next build` y los 21 scripts **en verde**. Arreglados los tres. Es la quinta
  vez que una regla vivía en un componente y el gate no la veía.

## Lecciones que ya costaron caro, no las repitas

1. **Un error tragado disfraza el fallo.** `const { data } = await …` sin mirar
   `error` convirtió «falta una columna» en «no tienes personaje».
2. **El código y la migración aterrizan juntos.**
3. **Sobre-aplicar es peor que no aplicar.** En una app que impone reglas,
   quedarse corto es preferible.
4. **No confundas dos estados distintos** (no hay ficha ≠ la consulta falló).
5. **Una regla que vive en un componente escapa al gate.** Van cinco veces.
6. **`tsc` no ve un enlace muerto.** Al borrar rutas, grep de referencias.
7. **Un comentario que se queda mintiendo se arregla, no se deja ahí.**
8. **Construir muchas cosas seguidas sin probarlas sale caro.** El tablero de
   batalla se tiró entero por eso, y lo del anillo lo confirmó: una partida
   encuentra lo que ocho tandas de gate no.

## Lo que hay pendiente y NO es esto

No lo empieces sin decírmelo: la **fase 2 del combate (la «arena»)** —diseñada y
maquetada, spec en
`docs/superpowers/specs/2026-07-28-monstruos-al-combate-design.md`—, ampliar la
biblioteca de conjuros (32), los pozos de las 5 clases que faltan (bardo, mago,
pícaro, brujo, cazador de sangre), el bestiario a medias (124 monstruos, solo
CR 0–1/2), Fase P (downtime + minijuegos), Fase Q (misiones con IA), C2 (regateo
con Persuasión), modo espectador/TV y los retratos de especie
(`public/species/lineages/` vacío).

**Empieza leyendo `HANDOFF.md` y la tabla de arriba, y dime qué ves y qué fuentes
necesitas antes de proponer nada.**
