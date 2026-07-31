Retomo Exandria, mi app de campaña de D&D 2024. Clon canónico:
`C:\Users\carlo\Downloads\dnd-campaign-app` (rama `master`, repo privado
CarlosAlbertt/Exandria, desplegada en exandria.vercel.app).

**Lee primero `HANDOFF.md`** — es el documento de estado vivo. El vault de
Obsidian (`C:\Users\carlo\Desktop\Exandria-Obsidian\Exandria`) está al día y
explica el porqué de las decisiones.

## La tarea de esta sesión: darle cuerpo a los oficios

Los siete oficios existen y tienen **369 materiales** repartidos en seis
catálogos, pero **no se puede hacer nada con ellos**: son listas sueltas. Esta
sesión va de convertirlos en algo que se juegue.

### 1. Una interfaz propia para cada oficio

No una pantalla genérica de «fabricar». **Cada oficio con la suya**, que se
parezca a lo que hace:

> **Alquimia**: una especie de **caldero**. El jugador tiene un **libro** con X
> recetas y conocimientos que **va descubriendo** poco a poco, y con lo que ha
> aprendido puede preparar pociones.

Y por el estilo el resto: la **forja** con su yunque y su temple, el **tatuaje**
con su plantilla y sus agujas, la **cristalografía** con su tallado, la
**cocina** con sus fuegos, la **destilación** con su alambique.

### 2. Recetas y mezclas

Lo que une los catálogos con lo que sale de ellos: **qué materiales lleva cada
cosa**, contra qué se tira y qué pasa al fallar. Hoy no existe ni una.

### 3. Un apartado de DM para verlo TODO

Quiero **una pantalla mía**, de máster, donde estén **todos** los ingredientes,
las recetas, las pociones y lo que vaya saliendo: **ordenado, buscable y
manipulable**.

Hoy los 369 materiales y las 25 pociones **solo existen dentro de archivos de
código**. Yo no los veo en ningún sitio de la app: para saber qué hay tengo que
abrir `data/alquimia.ts` en un editor. Eso no vale.

Lo que necesito de esa pantalla:
- **Todo junto**, los seis catálogos más las pociones más las recetas.
- **Buscar por texto** y **filtrar** por oficio, por categoría, por rareza, por
  si es herramienta, por si tiene riesgo.
- **Manipular**. Aquí necesito que me preguntes qué significa exactamente (ver
  abajo): no es lo mismo editar el catálogo que dárselo a un jugador.

**El precedente exacto ya existe en el repo**: `/bestiario` es una pantalla con
buscador y filtros sobre datos que vienen del código, **y encima deja al DM
añadir monstruos propios**. Míratela antes de diseñar nada
(`app/bestiario/BestiarioView.tsx`), y también **Panel DM › Baúl**
(`app/dm/BaulPanel.tsx`), que es cómo el DM entrega cosas hoy.

## Lo que quiero que me preguntes antes de escribir código

Hay al menos siete decisiones que no puedes tomar tú:

1. **¿Alcance?** Seis interfaces a medida es muchísimo. Mi instinto es
   **hacer Alquimia entera primero**, con su caldero y su libro, y que sirva de
   patrón para las otras cinco. Dímelo tú.
2. **¿Los materiales son objetos de inventario de verdad?** Hoy los seis
   catálogos son **datos puros**: no existen como objetos, no ocupan hueco en la
   bolsa, no se pueden tener ni gastar. O entran en `characters.items` (y ocupan
   sitio, con lo que eso implica: el inventario va por huecos, 20 + 2×mod Fuerza)
   o llevan un contador aparte. **Es la decisión más grande de la tanda**.
3. **¿Cómo se descubre una receta?** Ver abajo: ya hay maquinaria para esto.
4. **¿Dónde vive cada taller?** ¿Una ruta nueva por oficio (`/alquimia`…)? ¿Una
   sola `/taller` con pestañas? ¿Dentro de `/lugar`, que ya es «estás en…» y
   tiene tienda y posada? ¿En la ficha?
5. **¿Qué pasa al fallar la tirada?** ¿Se pierden los materiales? ¿Sale algo
   malo? ¿Se puede reintentar?
6. **¿Qué es «manipular» en la pantalla de máster?** No es lo mismo:
   - **Solo consultar** (buscar, filtrar, leer). Lo más barato con diferencia.
   - **Entregar**: darle materiales o recetas a un jugador desde ahí. Ya existe
     la fontanería (`/api/dm/character` con `addItems` y `unlockLore`), pero
     depende de la decisión 2: si los materiales no son objetos, no hay nada que
     entregar.
   - **Editar el catálogo**: añadir materiales y recetas propios sin tocar
     código, como haces con los monstruos del bestiario. Esto es lo caro, y hay
     un precedente exacto de cómo se hace en este repo: el **atlas** se siembra
     desde el código y se persiste como JSON en `app_config` (`atlas_defs`),
     que es lo que permite editarlo sin desplegar.
     ⚠️ **`app_config` NO está en la publicación realtime** — hace falta update
     optimista. Es una lección ya pagada dos veces.
7. **¿Dónde vive esa pantalla?** ¿Pestaña nueva del Panel DM —que ya tiene
   Narración, Grupo, Baúl, Dados, Crónica, Mesa, Tiempo, Regiones, Mapa,
   Usuarios— o ruta propia tipo `/bestiario`, DM-only?

## Lo que ya existe y no hay que inventar

> [!tip] **La maquinaria de «descubrir cosas poco a poco» YA ESTÁ**
> El sistema de **saber por origen** hace exactamente eso: `characters.lore_unlocked`
> es un `string[]`, el DM concede entradas desde **Panel DM › Grupo** con
> `LorePicker` (op `unlockLore` en `/api/dm/character`, que fusiona sin pisar), y
> leer un tomo in-game también enseña (`openDocument` en `CharacterSheet.tsx`).
> **Un libro de recetas descubiertas es el mismo patrón**, y como `lore_unlocked`
> ya es un array, **probablemente no haga falta migración**: el mismo truco que
> se usó con las pericias de oficio, que viven en `characters.skills` y se
> separan por pertenencia a un conjunto.
> La fe se descubre igual desde el 2026-07-31 (`ConcederFe` en `GrupoPanel`).

**Los seis catálogos** (`data/`): `alquimia.ts` 70 · `cocina.ts` 100 ·
`forja.ts` 75 · `destilacion.ts` 49 · `cristalografia.ts` 50 · `tatuaje.ts` 25.
Todos con la misma forma: número de catálogo estable, nombre y descripción.

**Tres campos que ya separan cosas que no son lo mismo**, y que las recetas
tienen que respetar:
- **`herramienta`** (cristalografía, tatuaje): cinceles, pinzas, agujas y paños
  **no se gastan**. Una receta los exige disponibles, no los consume.
- **`riesgo`** (destilación): la mitad del catálogo trae contrapartida
  explícita. Es el catálogo peligroso.
- **`mecanica`** (forja): es el único con **regla de verdad** —el mithril anula
  el requisito de Fuerza, la adamantina anula los críticos recibidos, el
  residuum vuelve mágica el arma—. Conectar eso toca `data/equipment.ts` y
  `lib/derive.ts`, que hoy **no saben que estos materiales existen**.

**Las 25 pociones** (`data/pociones.ts`): 23 de la Guía del DM 2024 y 2 de
Wildemount, con rareza y efecto. **Es lo que sale del caldero.** Curación y
Fuerza de Gigante son familias con variantes.

**El precedente de tirada con consecuencia**: `components/lugar/SaberRoll.tsx`
tira Historia/Arcanos/Religión contra una CD y el éxito desbloquea saber. Es lo
más parecido que hay a lo que se va a construir.

**Falta un catálogo**: **Extracción de Componentes**, el séptimo oficio, no
tiene materiales. Tiene sentido que sea el oficio que *consigue* materiales para
los otros; pregúntame.

## Lo que sigue pendiente de la sesión anterior

**Quitar el apartado «Dados del grupo» de `/personaje`** — la sección al final de
`app/personaje/page.tsx` que monta `<DicePanel />`. **Ahí no tiene que salir
nada.** Decisión tomada: que el jugador pueda lanzar un dado de valor libre se
aparca, no hay que buscarle otro sitio.

> [!warning] **Pero eso arrastra las peticiones de tirada del DM**
> El único otro consumidor de `useRollRequests` es `app/dm/DadosPanel.tsx`. Al
> quitar la sección, **el jugador deja de ver y de poder responder lo que el DM
> le pide**. Pregúntame qué hago con ellas antes de borrar.

**No se toca**: la tirada de estadísticas (`stat_rolls`, en
`components/crear/steps/AbilitiesStep.tsx`) **no usa `DicePanel`** —comprobado—,
el `DicePanel` del Panel DM se queda, y los dados 3D (`DiceBoard` en el layout)
también.

## Cómo trabajamos (esto ya está rodado, respétalo)

- **Antes de escribir nada**: brainstorming → spec → plan → ejecución con las
  skills de superpowers. Specs y planes en `docs/superpowers/{specs,plans}/`.
- **Rama feature por tarea.** (La tanda de la fe y los ingredientes se fue a
  `master` directamente; no lo repitas.)
- Gate: **`npx tsc --noEmit` + `npx next build` + los 30 `scripts/check-*.ts`**
  (no hay tests; ese es el gate real) → commit por tarea → actualizar
  `HANDOFF.md` y el vault → merge a `master` y push.
- **Si esta tanda toca datos, el gate tiene que verlo.** Es la lección de las
  cuatro últimas. Las recetas necesitarán su propio check: que toda receta
  apunte a materiales que existen, que no gaste herramientas, que lo que produce
  exista en `data/pociones.ts`. **Y con prueba de mutación**: rómpelo a
  propósito, comprueba que el gate falla, restaura.
- **Commitea ANTES de mutar.** `git checkout --` no restaura un archivo que git
  aún no conoce; me pasó con `data/alquimia.ts` y hubo que reponer la línea a
  mano.
- Ejecutar con subagentes funciona bien, pero **revisa lo que devuelven**. Y **la
  revisión final de la rama vale la pena**: en la tanda del alcance del jugador
  encontró dos fallos reales que ni el spec ni el plan tenían.
- Commits acaban con `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.
  Autor `CarlosAlbertt` (Vercel bloquea otros emails). Con backticks en el
  mensaje, usar `git commit -F -` con heredoc y el **bash tool** (el shell por
  defecto es PowerShell).
- **Nunca `git add -A` a ciegas**: añade los archivos que has tocado.
- `AGENTS.md`: este Next.js 16 tiene cambios rompedores. Ante dudas de API, lee
  `node_modules/next/dist/docs/`, no tires de memoria.

> [!danger] **Toda ruta nueva pasa por `lib/acceso.ts`**
> Desde el 2026-07-30 el jugador **solo ve** `/`, `/crear`, `/personaje`,
> `/inventario`, `/reino` y `/lugar`. Si los talleres van en rutas nuevas,
> **hay que añadirlas a `RUTAS_JUGADOR`** o el jugador se chocará contra
> «esto se abrirá más adelante». Y `scripts/check-acceso.ts` **te hará fallar**
> si añades una página sin clasificarla, anidada incluida.

> [!warning] **No puedes ver la app**
> Todo está detrás del login y **no debes meter credenciales**. Para verificar UI
> puedes montar un banco de pruebas estático con el CSS real y servirlo por
> `/dice-box/` (esa ruta está excluida del proxy), pero **bórralo antes de
> commitear**. La comprobación en la app viva la hago yo. **Esta tanda es sobre
> todo interfaz**, así que cuenta con que la validación visual real la hago yo y
> habrá idas y venidas.

## Dónde lo dejamos (31 de julio de 2026)

- **Los seis catálogos de oficio**, 369 entradas, cada uno con numeración
  propia. Gates 28, 29 y 30; el 30 centraliza el cruce entre los seis.
- **Las 25 pociones** de los libros (`data/pociones.ts`).
- **Las pericias de oficio**: las 7 existen, la aptitud doble da dos tiradas
  (competencia solo en la primaria), y el cupo es aparte —una a nivel 1 en el
  creador y otra a nivel 7 en `LevelPanel`—. Gate 26.
- **La fe ya no se elige**: la impone la subclase o la concede el DM.
- **El alcance del jugador**, cerrado de verdad en el proxy. Gate 25.
- **Gate: 30 `scripts/check-*.ts` en verde**, con `tsc` y `next build` limpios.

## Lo que sigue pendiente y NO es esto

No lo empieces sin decírmelo: **jugar una sesión de prueba** (siete features
desplegadas y nunca vistas en partida), **qué hace cada una de las 18 pericias
del reglamento** (la plantilla sigue en `docs/pericias-borrador.md` §5; esta
tanda cubre los oficios, no las 18 de siempre), **`/api/*` sin control de rol**,
poblar Issylra, Marquet y los Dientes Rotos, ampliar la biblioteca de conjuros,
los pozos de las 5 clases que faltan, el bestiario a medias (124 monstruos, solo
CR 0–1/2), Fase P (downtime), Fase Q (misiones IA), C2 (regateo), y los
**retratos de linaje** (`public/species/lineages/` sigue vacío).

**Empieza leyendo `HANDOFF.md`. Luego pregúntame las siete decisiones de arriba
y qué hago con las peticiones de tirada. No escribas código hasta que las
tengas.**
