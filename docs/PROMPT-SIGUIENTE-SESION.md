Retomo Exandria, mi app de campaña de D&D 2024. Clon canónico:
`C:\Users\carlo\Downloads\dnd-campaign-app` (rama `master`, repo privado
CarlosAlbertt/Exandria, desplegada en exandria.vercel.app).

**Lee primero `HANDOFF.md`** — es el documento de estado vivo. El vault de
Obsidian (`C:\Users\carlo\Desktop\Exandria-Obsidian\Exandria`) está al día y
explica el porqué de las decisiones.

## La tarea de esta sesión: preparar el arranque de campaña

Vamos a **estrechar la app** para el inicio: de momento el jugador solo debe
poder tocar **tres cosas**:

1. **Crear personaje** (`/crear`) y su **ficha** (`/personaje`).
2. **Inventario** (`/inventario`).
3. **El reino** (`/reino` y `/reino/[continente]`).

Todo lo demás queda **fuera de su alcance** hasta que la campaña avance. El DM
(rol `dm`) sigue viéndolo todo, sin cambios.

**Antes de escribir nada, pregúntame lo que necesites.** Hay al menos cuatro
decisiones que no puedo tomar yo solo y que están listadas más abajo.

## Cómo está hoy la navegación (para que no lo busques a ciegas)

`components/SiteNav.tsx` tiene un `BASE_LINKS` con **9 enlaces que ve cualquier
jugador**, y añade 2 más si el rol es `dm`:

```
BASE_LINKS: /  ·  /reino  ·  /panteon  ·  /cronica  ·  /bestiario
            /crear  ·  /inventario  ·  /mapa  ·  /combate
DM_LINKS  : /narrador  ·  /dm
```

Es decir: hay que **quitar del alcance del jugador** `/panteon`, `/cronica`,
`/bestiario`, `/mapa` y `/combate`, y decidir qué pasa con `/` (Inicio).

> [!danger] **Ocultar el enlace NO es cerrar la puerta**
> `proxy.ts` (el antiguo middleware, Next 16) **solo refresca la sesión**
> (`updateSession`): no mira roles ni rutas. Si solo quitamos enlaces del nav,
> cualquiera que escriba `/bestiario` en la barra del navegador entra igual.
> **La sesión tiene que cerrar de verdad las rutas, no solo esconderlas.**

Otro cabo suelto que encontré: **`/personaje` no está en el nav**. Hoy solo se
llega desde el botón «Ir a la ficha» del último paso del creador
(`components/crear/steps/SummaryScene.tsx:82`). Si el jugador recarga o vuelve
otro día, no tiene por dónde entrar a su propia ficha. Habrá que arreglarlo,
porque justo la ficha es una de las tres cosas que sí debe poder tocar.

## Lo que necesito que me preguntes antes de tocar código

1. **¿Dónde se corta el acceso?** ¿En `proxy.ts` (una sola puerta, redirige a
   `/` las rutas no permitidas según rol), en cada página, o las dos cosas?
2. **¿Qué pasa con `/` (Inicio)?** Hoy lleva a los continentes de Exandria. ¿Se
   queda como portada, se convierte en el panel del jugador (mi ficha, mi
   inventario, el reino), o se retira también?
3. **¿La lista permitida es fija o configurable?** Se podría dejar en
   `app_config` para que puedas ir abriendo secciones desde el Panel DM según
   avance la campaña, sin desplegar. Ojo: si vamos por ahí, **`app_config` NO
   está en la publicación realtime** — hace falta update optimista (lección ya
   pagada dos veces).
4. **¿Qué ve el jugador si entra a una ruta cerrada?** ¿Redirección silenciosa a
   `/`, o una página de «Esto se abrirá más adelante»?

## Cómo trabajamos (esto ya está rodado, respétalo)

- **Antes de escribir nada**: brainstorming → spec → plan → ejecución con las
  skills de superpowers. Specs y planes en `docs/superpowers/{specs,plans}/`.
- Rama feature por tarea → gate **`npx tsc --noEmit` + `npx next build` + los 24
  `scripts/check-*.ts`** (no hay tests; ese es el gate real) → commit por tarea →
  actualizar `HANDOFF.md` y el vault → merge a `master` y push.
- **Si esta tanda toca datos, el gate tiene que verlo.** Es la lección de las dos
  últimas: `check-clases.ts` no miraba las subclases y `check-especies.ts` no
  existía; una región mal escrita hacía **desaparecer especies sin dar ningún
  error**. Si añades reglas nuevas, **pruébalas por mutación** (rómpelo a
  propósito, comprueba que el gate falla, restaura).
- **No uses `git checkout --` para restaurar tras una prueba de mutación** si
  tienes cambios sin commitear en ese archivo: te los llevas por delante (me pasó
  el 2026-07-30). Usa `git stash` o haz la mutación sobre una copia.
- Ejecutar con subagentes funciona bien, pero **revisa lo que devuelven**: han
  llegado a afirmar verificaciones que no habían hecho, y uno se quedó a medias
  por límite de sesión dejando el archivo a mitad.
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

## Dónde lo dejamos (30 de julio de 2026)

- **Las 65 subclases, con mecánica.** 13 clases × 5 (sin Artificiero). Nombre y
  blurb en `data/classes.ts`; los **rasgos por nivel** en
  `data/classdata/subclases/<clase>.ts` (tipo `SubclassFeature {level,name,text}`,
  registro en `subclases/index.ts` + helper `subclassFeaturesFor`). Se quitaron
  los placeholders `subclass:true` de los 13 `classdata`. El gate exige 65/65.
- **El creador, rehecho.** Especie y Clase navegan igual (flechas + tira de
  miniaturas, recorrido por región/grupo), con **ventanas emergentes**: subclase
  (descripción + rasgos por nivel + fe), y en Especie tres (elegir linaje,
  describir especie, describir linaje). Carcasa en `components/crear/Modal.tsx`.
- **Fe predefinida por subclase** (`data/subclassDeity.ts`): 10 subclases
  rellenan la deidad del personaje al elegirlas.
- **Región «Planos y Paraje Feérico»** para Eladrin, Shadar-kai y Gith, y
  `scripts/check-especies.ts` (el gate 24).
- **Las 36 especies tienen emblema** en `public/species/<slug>.jpg` (JPEG
  1024×1024, 3,1 MB en total; llegaron como PNG de 151 MB y se reencodearon).
- **Gate: 24 `scripts/check-*.ts` en verde**, con `tsc` y `next build` limpios.
  **La UI del creador está verificada en navegador solo con banco de pruebas
  estático** (rejilla, flechas, miniaturas, modales); en la app viva la vio el
  usuario y dio el visto bueno.

## Lo que sigue pendiente y NO es esto

No lo empieces sin decírmelo: **jugar una sesión de prueba** (hay siete features
desplegadas y nunca vistas en partida; la fase 2 del combate está bloqueada a
propósito hasta que eso pase), poblar Issylra, Marquet y los Dientes Rotos,
deshacer el aplastamiento `capital`/`pueblo`→`ciudad` en esos tres continentes,
ampliar la biblioteca de conjuros, los pozos de las 5 clases que faltan, el
bestiario a medias (124 monstruos, solo CR 0–1/2), Fase P (downtime), Fase Q
(misiones IA), C2 (regateo), y los **retratos de linaje**
(`public/species/lineages/` sigue vacío).

**Empieza leyendo `HANDOFF.md` y preguntándome las cuatro decisiones de arriba.
No escribas código hasta que las tengas.**
