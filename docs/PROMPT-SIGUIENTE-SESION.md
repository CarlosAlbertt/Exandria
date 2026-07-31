Retomo Exandria, mi app de campaña de D&D 2024. Clon canónico:
`C:\Users\carlo\Downloads\dnd-campaign-app` (rama `master`, repo privado
CarlosAlbertt/Exandria, desplegada en exandria.vercel.app).

**Lee primero `HANDOFF.md`** — es el documento de estado vivo. El vault de
Obsidian (`C:\Users\carlo\Desktop\Exandria-Obsidian\Exandria`) está al día y
explica el porqué de las decisiones.

## La tarea de esta sesión: dos cosas, en este orden

### 1. Fuera el apartado «Dados del grupo» de la ficha

En `app/personaje/page.tsx` hay una sección al final, titulada **«Dados del
grupo»**, que monta `<DicePanel />`. **Ahí no tiene que salir nada.** Quítala.

**Decisión ya tomada: que el jugador pueda lanzar un dado del valor que le dé la
gana se deja para más adelante.** No hay que buscarle otro sitio ni partir el
panel: se quita de la ficha y ya está.

`components/DicePanel.tsx` trae cuatro cosas en una: el **feed de tiradas
recientes** del grupo, un **dado rápido**, una **fórmula libre** y las
**peticiones de tirada del DM** (`useRollRequests`). Las tres primeras son las
que se aparcan.

> [!warning] **Lo que sí hay que decidir: las peticiones de tirada del DM**
> El único otro consumidor de `useRollRequests` es `app/dm/DadosPanel.tsx`, que
> es la pantalla del DM. O sea que al quitar la sección **el jugador deja de ver
> y de poder responder lo que el DM le pide**, y no queda ningún sitio donde
> las vea. **Pregúntame qué hago con ellas** antes de borrar: se aparcan también,
> o se sacan a su propio sitio.

**Lo que NO se toca, comprobado:**
- **La tirada de estadísticas** (Fase K, `stat_rolls`) vive en
  `components/crear/steps/AbilitiesStep.tsx`, dentro de `/crear`, y **no usa
  `DicePanel` para nada**. Quitar la sección de la ficha no la roza. Sigue
  funcionando igual: tirada única e inmutable, y solo el DM la resetea desde
  `app/dm/GrupoPanel.tsx`.
- **`DicePanel` sigue montado en el Panel DM** (`app/dm/DadosPanel.tsx`).
- **Los dados 3D** (`DiceBoard` en `app/layout.tsx`) siguen: son la animación de
  la tirada, no este panel. Las tiradas que salen de la ficha (ataques,
  salvaciones, pericias) **no dependen de `DicePanel`** — publican por
  `publishRoll` de `lib/useDiceFeed.ts`.

### 2. Mecánicas jugables para las pericias

Esto es lo gordo y va en dos fases:

> [!important] **Lee `docs/pericias-borrador.md` antes que nada de esto**
> Es el documento vivo de la tanda. Ya recoge **las 25 pericias** (las 18 de
> 2024 más **7 nuevas homebrew**), las reglas ya decididas con el usuario, el
> reparto por clase propuesto, qué archivos hay que tocar y **qué falta por
> decidir**. Aquí abajo va solo el resumen.

**Son 25, no 18.** Se añaden siete de oficio: **Alquimia** (INT), **Forja**
(SAB–FUE), **Cocina** (SAB), **Cristalografía Arcana** (INT), **Tatuaje
Rúnico** (DES–INT), **Extracción de Componentes** (DES–INT) y **Destilación
Exandriana** (SAB).

**Dos reglas ya decididas:**

1. **Aptitud doble = dos tiradas posibles.** La primera es la primaria. Se puede
   tirar con cualquiera de las dos según pida la situación, pero **la
   competencia solo suma en la primaria**. La ficha enseña los dos números.
2. **Cupo de oficio aparte.** Las 7 no compiten con las pericias normales: cada
   clase mantiene su `pick` de siempre, y además elige **una de oficio a nivel
   1** y **otra a nivel 7**, restringidas a las que su clase tenga en lista.

**Fase 1 — la lista entera con lo que hace cada una.** Las 18 de 2024 existen en
`data/rules.ts` como `{ name: "Acrobacias", ability: "des" }` y **nada más**: ni
una línea de para qué sirven. El usuario va a dictar, por cada una de las 25,
**contra qué se tira** (CD fija, CD del DM, o tirada enfrentada), **qué pasa al
fallar** (nada, algo malo, o un solo intento) y **quién resuelve** (la app sola,
como `SaberRoll`, o texto que guía al DM en la mesa).

**Fase 2 — engancharlo.** El tipo `Skill`, `lib/derive.ts:131` (que hoy da **un**
número por pericia y tendrá que dar dos en las dobles), los 13 archivos de
clase, el creador y el subir de nivel. **Sin migración**: `characters.skills` ya
es `string[]` y el cupo se controla por pertenencia al conjunto de oficios.

**El gate tendrá que verlo**: hoy ningún `check-*` valida `SKILLS`. Es el mismo
patrón que ya salió caro con `check-clases` y `check-especies`.

**Dónde está hoy lo de pericias**, para que no lo busques a ciegas:
- `data/rules.ts` — `SKILLS`, las 18 (nombre + aptitud).
- `lib/derive.ts:131` — calcula el modificador de cada una (competencia
  incluida). **Es la fuente de verdad de los números**, compartida por la hoja y
  el panel del DM.
- `components/CharacterSheet.tsx` — las pinta y las tira.
- `components/crear/steps/SkillsScene.tsx` — la elección en el creador.
- `components/lugar/SaberRoll.tsx` — **el precedente más parecido a lo que
  quieres**: tres pericias con CD y consecuencia de verdad.
- `data/classes.ts` y `data/classdata/types.ts` — qué pericias puede elegir cada
  clase, por nombre exacto.

## Cómo trabajamos (esto ya está rodado, respétalo)

- **Antes de escribir nada**: brainstorming → spec → plan → ejecución con las
  skills de superpowers. Specs y planes en `docs/superpowers/{specs,plans}/`.
- Rama feature por tarea → gate **`npx tsc --noEmit` + `npx next build` + los 25
  `scripts/check-*.ts`** (no hay tests; ese es el gate real) → commit por tarea →
  actualizar `HANDOFF.md` y el vault → merge a `master` y push.
- **Si esta tanda toca datos, el gate tiene que verlo.** Es la lección de las
  tres últimas: `check-clases.ts` no miraba las subclases, `check-especies.ts` no
  existía, y `check-acceso.ts` nació clasificando solo el primer nivel de `app/`
  (una ruta anidada se colaba abierta con el gate en verde). **Si añades reglas
  nuevas, pruébalas por mutación**: rómpelo a propósito, comprueba que el gate
  falla, restaura. Un dato de pericias sin gate es un dato que se pudre solo.
- **No uses `git checkout --` para restaurar tras una prueba de mutación** si
  tienes cambios sin commitear en ese archivo: te los llevas por delante (me pasó
  el 2026-07-30). Usa `git stash` o haz la mutación sobre una copia.
- Ejecutar con subagentes funciona bien, pero **revisa lo que devuelven**: han
  llegado a afirmar verificaciones que no habían hecho. Y **la revisión final de
  la rama vale la pena**: en la tanda del 2026-07-30 encontró dos fallos reales
  que ni el spec ni el plan tenían (un enlace a ruta cerrada en el pie de página,
  que se pinta en *todas* las páginas, y el agujero del gate anidado).
- Commits acaban con `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.
  Autor `CarlosAlbertt` (Vercel bloquea otros emails). Con backticks en el
  mensaje, usar `git commit -F -` con heredoc y el **bash tool** (el shell por
  defecto es PowerShell).
- **Nunca `git add -A` a ciegas**: añade los archivos que has tocado.
- `AGENTS.md`: este Next.js 16 tiene cambios rompedores. Ante dudas de API, lee
  `node_modules/next/dist/docs/`, no tires de memoria.

> [!warning] **No puedes ver la app**
> Todo está detrás del login y **no debes meter credenciales**. Para verificar UI
> puedes montar un banco de pruebas estático con el CSS real y servirlo por
> `/dice-box/` (esa ruta está excluida del proxy), pero **bórralo antes de
> commitear**. La comprobación en la app viva la hago yo.

> [!danger] **Ojo con el alcance del jugador**
> Desde el 2026-07-30 el jugador **solo ve** `/`, `/crear`, `/personaje`,
> `/inventario`, `/reino` y `/lugar`. Todo lo demás pinta `/cerrado`. Si lo que
> construyas esta sesión necesita una ruta o un enlace nuevo, **tiene que pasar
> por `lib/acceso.ts`** o el jugador se choca contra una puerta cerrada — y
> `scripts/check-acceso.ts` te lo hará fallar si añades una página sin
> clasificarla. Las pericias caen en `/personaje` y `/lugar`, que están abiertas.

## Dónde lo dejamos (30 de julio de 2026)

- **El alcance del jugador, cerrado de verdad.** `lib/acceso.ts` es la fuente
  única (`RUTAS_JUGADOR`, `NAV_LINKS`, `PUERTAS_JUGADOR`, `puedeVer`); la puerta
  vive en `lib/supabase/proxy-session.ts` y hace `rewrite` a `/cerrado`; la barra
  y el pie filtran con **la misma función**, así que no pueden divergir. `/` es
  el panel del jugador; el DM conserva su portada intacta. Gate 25:
  `scripts/check-acceso.ts`. **Sin migración.**
- **Las 65 subclases, con mecánica.** 13 clases × 5 (sin Artificiero). Nombre y
  blurb en `data/classes.ts`; los rasgos por nivel en
  `data/classdata/subclases/<clase>.ts`. El gate exige 65/65.
- **El creador, rehecho.** Especie y Clase con flechas, tira de miniaturas y
  ventanas emergentes (subclase, linaje). Las 36 especies con emblema en
  `public/species/<slug>.jpg`.
- **Gate: 25 `scripts/check-*.ts` en verde**, con `tsc` y `next build` limpios.

## Lo que sigue pendiente y NO es esto

No lo empieces sin decírmelo: **jugar una sesión de prueba** (siete features
desplegadas y nunca vistas en partida; la fase 2 del combate está bloqueada a
propósito hasta que eso pase), **`/api/*` sin control de rol** (un jugador puede
llamar `/api/ia` aunque `/taberna` esté cerrada), poblar Issylra, Marquet y los
Dientes Rotos, deshacer el aplastamiento `capital`/`pueblo`→`ciudad` en esos tres
continentes, ampliar la biblioteca de conjuros, los pozos de las 5 clases que
faltan, el bestiario a medias (124 monstruos, solo CR 0–1/2), Fase P (downtime),
Fase Q (misiones IA), C2 (regateo), y los **retratos de linaje**
(`public/species/lineages/` sigue vacío).

**Empieza leyendo `HANDOFF.md`. Luego pregúntame lo de las peticiones de tirada
(punto 1) y el alcance de las pericias (punto 2). No escribas código hasta que
lo tengas.**
