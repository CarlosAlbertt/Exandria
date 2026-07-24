Retomo Exandria, mi app de campaña de D&D 2024. Clon canónico:
`C:\Users\carlo\Downloads\dnd-campaign-app` (rama `master`, repo privado
CarlosAlbertt/Exandria, desplegada en exandria.vercel.app).

**Lee primero `HANDOFF.md`** — es el documento de estado vivo. El vault de
Obsidian (`C:\Users\carlo\Desktop\Exandria-Obsidian\Exandria`) está al día a
2026-07-24 y explica el porqué de las decisiones.

## ⚠️ LO PRIMERO: ejecutar `schema_v22.sql`

Hay **una migración pendiente**: `supabase/schema_v22.sql` (la Fase G3, el
tablero). Crea dos tablas nuevas — `battle_tokens` y `battle_board` — con RLS y
realtime. **Sin ejecutarla, `/tablero` y la pestaña Panel DM › Tablero avisan y no
funcionan**, pero el resto de la app sigue igual (el hook `useBattle` detecta que
las tablas faltan y degrada). La ejecuto yo en el SQL Editor de Supabase; es
idempotente y solo añade. Es la primera pendiente desde la v21.

## Dónde lo dejamos (24 de julio de 2026)

Estoy construyendo la **capa de jugabilidad de combate 2024**, en losas. Tres ya
en `master` y desplegadas:

1. **G1 — estado del combatiente**: PG actuales/temporales, salvaciones de muerte
   (3 y 3), 14 condiciones y agotamiento, en la hoja y en el panel del DM, en
   vivo. Las condiciones aplican **ventaja/desventaja de verdad** a las tiradas
   (envenenado → 2d20 la peor). Sin migración (todo en `characters.play_state`).
2. **G2 — economía de turno y ataque**: marcador de acción/adicional/reacción/
   movimiento que se limpia solo al tocarte el turno (suscripción a la iniciativa),
   y **tirada de ataque desde la ficha** (tabla de 12 armas, característica
   correcta, competencia derivada de la clase, ventaja de G1). Sin migración.
3. **G3 — tablero de batalla**: rejilla con una ficha por combatiente, que el DM y
   los jugadores mueven **en vivo**, con **medición de distancia** (casillas ×
   1,5 m). El DM inicia el combate, fija fondo/tamaño y **puebla desde la
   iniciativa** de un clic. **Requiere `schema_v22`.**

La idea rectora: la app es para **jugar autodidacta en casa**, así que **aplica**
las reglas, no solo las recuerda.

## Lo que falta probar (es cosa mía, no tuya)

Nada de G1/G2/G3 se ha probado **con sesión real y varios jugadores**. Se verificó
con `tsc`, `next build` y los scripts de comprobación. Si te pido que verifiques
algo, ten en cuenta que no puedes entrar con credenciales ni tienes las tablas del
tablero en dev.

Pruebas mías pendientes:
- **G1/G2**: bajar a 0 PG y ver las salvaciones; atacar y ver que gasta la acción;
  «Siguiente turno» hasta que me toque y ver la economía limpia sin recargar; arma
  competente vs no competente; envenenado → ataque a 2d20 la peor.
- **G3** (tras `schema_v22`): activar el combate, poblar desde iniciativa, mover
  una ficha como DM y verla en la vista del jugador sin recargar; como jugador
  mover la propia y no otra; seleccionar dos fichas y ver la distancia.

## Qué queda por desarrollar

- **G4 — targeting** (la continuación natural de G3): elegir el **objetivo** de un
  ataque sobre el tablero y, con eso, las reglas que lo necesitan y que G1/G2/G3
  dejaron **documentadas a propósito**: **fallo automático de salvación** por
  estar paralizado/aturdido/inconsciente/petrificado; **ventaja para el atacante**
  por cegado/derribado/restringido; **crítico automático** (20 natural dobla los
  dados de daño); y el **alcance del arma** que bloquee el ataque si no llegas (la
  distancia ya se mide en G3).
- **Fase O2 — conjuros**: motor de preparar y gastar huecos, empezando por trucos
  y niveles 1–3 del SRD 5.2. El estado va en `characters.play_state` (las claves
  `huecos`/`preparados`), la misma columna de O1/G1/G2, **sin migración nueva**.
- **Pozos de las 5 clases que faltan**: bardo, mago, pícaro, brujo y cazador de
  sangre (usos derivados de un modificador o fórmula, otro modelo).
- **Fase P — downtime y minijuegos** · **Fase Q — misiones personales con IA**.
- **Bestiario a medias**: 124 monstruos, solo CR 0–1/2 completo.
- **C2 — regateo** con tirada de Persuasión.
- **Backlog pequeño**: modo espectador/TV; retratos de especie
  (`public/species/` sigue vacío → silueta).

## Cómo trabajamos

- **Rama feature por tarea** → gate `npx tsc --noEmit` + `npx next build` (no hay
  tests; ese es el gate real) + los scripts de comprobación que apliquen
  (`check-tablero`, `check-turno`, `check-ataque`, `check-estado` 35, `check-lore`
  69, `check-clases` 116, `check-ficha` 11, `check-clima` 32) → commit por tarea →
  actualizar `HANDOFF.md` y el vault → merge a `master` y push.
- Para features nuevas, skills de superpowers: brainstorming → spec → plan →
  ejecución. Specs y planes en `docs/superpowers/{specs,plans}/`. Los de las tres
  losas: `2026-07-23-g1-estado-combatiente*`, `2026-07-24-g2-economia-de-turno*`,
  `2026-07-24-g3-tablero*`.
- **La capa pura y su script primero, la UI después.** Cada capa nueva
  (`lib/estado.ts`, `lib/turno.ts`, `lib/ataque.ts`, `lib/tablero.ts`) es pura,
  fusiona `play_state` sin pisar las claves de las demás, y se verifica con un
  `scripts/check-*.ts`.
- Commits acaban con `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
  Autor `CarlosAlbertt` (Vercel bloquea otros emails). Con backticks en el
  mensaje, usa `git commit -F -` con heredoc.
- **Nunca `git add -A` a ciegas**: añade los archivos que has tocado.
- **Convención de contenido**: las mecánicas y los nombres son hechos de la
  ambientación; **todos los blurbs y descripciones son redacción original en
  español**, nunca prosa de los libros. Herramienta de fans no oficial. (Las stats
  de armas y las reglas de condición son hechos; sus textos de efecto, redacción
  propia.)
- `AGENTS.md`: este Next.js 16 tiene cambios rompedores. Ante dudas de API, lee
  `node_modules/next/dist/docs/`, no tires de memoria.

## Lecciones que me costaron caro, no las repitas

1. **Un error tragado disfraza el fallo.** `const { data } = await …` sin mirar
   `error` convirtió «falta una columna» en «no tienes personaje». Si algo
   desaparece, sospecha de la consulta antes que del dato, y pídeme la consola del
   navegador. (De ahí `schema_v21` y el `selectTolerante` de `lib/character.ts`.)
2. **El código y la migración aterrizan juntos.** Añadir una columna al `select`
   antes de ejecutar la migración rompe la app. Por eso el hook del tablero
   **degrada** si `schema_v22` no está, en vez de reventar.
3. **En una app que impone reglas, sobre-aplicar es peor que no aplicar.** En G1
   omití la desventaja de salvación de «restringido» (es solo Destreza, y el botón
   no pasa la característica) en vez de aplicarla a todas. Un subagente llegó a
   **inventarse una condición** («asqueado») para cuadrar un conteo mal puesto en
   el spec: revisa lo que devuelven los subagentes.

Empieza leyendo `HANDOFF.md` y dime qué ves antes de proponer nada. Si vamos a por
G4, usa brainstorming primero.
