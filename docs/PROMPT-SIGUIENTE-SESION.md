Retomo Exandria, mi app de campaña de D&D 2024. Clon canónico:
`C:\Users\carlo\Downloads\dnd-campaign-app` (rama `master`, repo privado
CarlosAlbertt/Exandria, desplegada en exandria.vercel.app).

**Lee primero `HANDOFF.md`** — es el documento de estado vivo. El vault de
Obsidian (`C:\Users\carlo\Desktop\Exandria-Obsidian\Exandria`) está al día y
explica el porqué de las decisiones.

## La tarea de esta sesión: rehacer las subclases

Quiero **borrar todas las subclases actuales y sustituirlas por 70 nuevas que te
voy a pasar yo**. No tires de las que hay ni de memoria: **espérate a que te dé
la lista** y trabaja solo con lo que te pase. Pídemela al empezar.

**Antes de escribir nada, pregúntame lo que necesites saber sobre el formato de
lo que te voy a dar** (¿solo nombres?, ¿nombre + descripción?, ¿agrupadas por
clase?, ¿traen rasgos mecánicos por nivel o solo el blurb?). De eso depende
media sesión, así que acláralo primero.

## Dónde viven las subclases hoy, para que no lo busques a ciegas

- **`data/classes.ts`** — cada una de las 13 clases tiene `subclassLabel` (p. ej.
  «Colegio bárdico», «Juramento sagrado») y `subclasses: { name, blurb }[]`. Ahí
  están las **67 subclases actuales**, como nombre + blurb. Es la lista que se
  enseña en el creador y en la ficha.
- **`data/classdata/<clase>.ts`** — los **rasgos mecánicos por nivel** de cada
  clase. Algunos rasgos llevan `subclass: true` (los otorga la subclase, no la
  clase base). Si las 70 nuevas traen mecánica, aquí es donde aterriza, no en
  `classes.ts`.
- **`data/classdata/types.ts`** — el tipo de esos rasgos.

**Consumidores de subclases** (lo que se rompe si cambias la forma del dato):
`components/crear/steps/ClassScene.tsx` (selector en el creador),
`components/crear/steps/SummaryScene.tsx`, `app/crear/page.tsx`,
`components/CharacterSheet.tsx` (la ficha), `app/dm/GrupoPanel.tsx` (panel DM) y
`lib/character.ts`. **Ojo**: puede haber personajes ya creados en Supabase con
una subclase guardada por nombre; si renombramos o quitamos subclases, decidir
qué pasa con esas fichas (¿migración?, ¿se quedan con el nombre viejo?).

## Cómo trabajamos (esto ya está rodado, respétalo)

- **Antes de escribir nada**: brainstorming → spec → plan → ejecución con las
  skills de superpowers. Specs y planes en `docs/superpowers/{specs,plans}/`.
- Rama feature por tarea → gate **`npx tsc --noEmit` + `npx next build` + los 23
  `scripts/check-*.ts`** (no hay tests; ese es el gate real) → commit por tarea →
  actualizar `HANDOFF.md` y el vault → merge a `master` y push.
- **La regla que va a mandar aquí**: si las subclases traen mecánica, **la capa
  pura y su script primero, la UI después**. Y hay un `scripts/check-clases.ts`
  (116 comprobaciones) que hoy **no valida los nombres de subclase**: si esta
  tanda toca subclases en serio, ese script tiene que empezar a mirarlas, o el
  gate no verá nada de lo que hagamos.
- Ejecutar con subagentes (implementador + revisión por tarea) funciona muy bien
  y en las últimas tandas cazó una decena de fallos reales que el gate no veía.
  Pero **revisa lo que devuelven**: han llegado a afirmar verificaciones que no
  habían hecho, y un par de veces el bug estaba en el propio código que yo puse
  en el plan.
- Commits acaban con `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.
  Autor `CarlosAlbertt` (Vercel bloquea otros emails). Con backticks en el
  mensaje, usar `git commit -F -` con heredoc y el **bash tool** (el shell por
  defecto es PowerShell).
- **Nunca `git add -A` a ciegas**: añade los archivos que has tocado.
- `AGENTS.md`: este Next.js 16 tiene cambios rompedores. Ante dudas de API, lee
  `node_modules/next/dist/docs/`, no tires de memoria.

## Convención de contenido, que aquí también aplica

Los **nombres y los datos mecánicos son hechos** de la ambientación 2024 y se
usan tal cual. **Todos los blurbs y descripciones son redacción original en
español**, nunca prosa de los libros ni traducida de cerca. Es una herramienta
de fans no oficial.

## Dónde lo dejamos (29 de julio de 2026)

- **El atlas de dos continentes, hecho esta última tanda.**
  - **Tal'Dorei**: estaba roto (tres capitales de región que no existían, Emon en
    la región equivocada, coordenadas de plantilla, cero comprobaciones del gate)
    y pasó de 45 a **94 POIs** leídos de sus ocho submapas rotulados.
  - **Wildemount**: reestructurado de 4 regiones políticas a **8 regiones —una
    por hoja de mapa—** y de 25 a **158 POIs**. Se añadieron Valle del Tuétano,
    Costa del Serrallo Norte, Eiselcross y Costa de la Plaga.
  - Se **generalizó la maquinaria** del atlas: `REGION_RATIO` → `data/regionRatio.ts`,
    las reglas del gate → `lib/continente.ts` (`comprobarContinente`, un gate por
    continente sin copiar código), y `TALDOREI_FIXES` → `ATLAS_FIXES` con campo
    de continente. Añadir el siguiente continente es escribir su `data/<cont>.ts`
    y un `check-<cont>.ts` de tres líneas.
  - Se arregló que **el visor de región (`/mapa`) descolocaba los pines** al
    pulsar un POI: los pines se posicionaban sobre el hueco y no sobre la imagen.
  - `PoiType` ganó `cueva` y `campamento` (7 tipos).
- **Gate: 23 `scripts/check-*.ts` en verde** el 2026-07-29, con `tsc` y
  `next build` limpios. **Nada probado en la app en vivo** (sin sesión): la
  colocación de los POIs se verificó pintando los pines sobre los submapas (SVG).

## Lo que sigue pendiente y NO es esto

No lo empieces sin decírmelo: **poblar Issylra, Marquet y los Dientes Rotos**
(les faltan submapas rotulados propios, así que necesito pasarte fuentes antes),
deshacer el aplastamiento `capital`/`pueblo`→`ciudad` en esos tres continentes
generados, la **fase 2 del combate (la «arena»)** —diseñada, spec en
`docs/superpowers/specs/2026-07-28-monstruos-al-combate-design.md`—, ampliar la
biblioteca de conjuros, los pozos de las 5 clases que faltan, el bestiario a
medias (124 monstruos, solo CR 0–1/2), Fase P (downtime), Fase Q (misiones IA),
C2 (regateo), y los retratos de especie (`public/species/lineages/` vacío).

**Empieza pidiéndome la lista de las 70 subclases y preguntándome en qué formato
te la doy. No escribas código hasta que la tengas.**
</content>
