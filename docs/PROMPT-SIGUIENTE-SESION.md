Retomo Exandria, mi app de campaña de D&D 2024. Repo privado
CarlosAlbertt/Exandria, rama `master`, desplegada en exandria.vercel.app.

> [!danger] **LO PRIMERO DE TODO: `git fetch` Y `git status -sb`.**
> **Antes de leer un solo archivo.** El 2026-08-01 se perdió una sesión entera
> por saltarse esto: el clon estaba **15 commits por detrás**, el taller de
> Alquimia **ya estaba hecho y desplegado**, y se reconstruyó desde cero con
> otro diseño hasta que el merge lo destapó. Hubo que tirarlo y quedarse solo
> con lo nuevo.
>
> **Y el desfase va en los DOS sentidos.** Ese mismo día se descubrió lo
> contrario: este clon tenía **6 commits que el remoto no tenía**, en una rama
> sin pushear (la del origen, ya mergeada). Estar «al día» no es solo no ir por
> detrás — es que las dos mitades se conozcan.
>
> **`HANDOFF.md` y el vault describen el clon LOCAL, no el remoto: ninguno de
> los dos sirve para saber si estás al día.** Solo `git fetch` lo sabe.

> **Ojo con la ruta**: hay clon en `C:\Users\carlo_pjou9vc\Exandria` y en
> `C:\Users\carlo\Downloads\dnd-campaign-app` — **son máquinas distintas**;
> mira en cuál estás. Si `node_modules` no está, `npm install` primero: **el
> gate no corre sin él**. `npm install` toca `package-lock.json` y los assets de
> `public/dice-box/`; eso **no es tuyo, no lo commitees**.
>
> **Y ojo con el directorio del shell**: ya se le ha reseteado a otro repo a
> mitad de tanda y varios comandos corrieron en el sitio equivocado. Comprueba
> dónde estás antes de dar por buena una salida rara.

## Qué es esto, en cuatro líneas

App web multijugador en tiempo real para una campaña de **D&D 2024** en
**Exandria**. Dos roles: **DM** (lo ve todo) y **jugador**. Next.js 16 (App
Router, Turbopack) · React 19 · Tailwind v4 · TypeScript · Supabase (Auth +
Postgres + Realtime) · IA local con Ollama por túnel cloudflared. **No hay
tests**: el gate es `tsc` + `next build` + los `scripts/check-*.ts`.

**Lee `HANDOFF.md`** después del `fetch` — es el documento de estado vivo, con
una sección por tanda y las lecciones pagadas.

## Lo primero, y no es código: PROBAR EN LA APP

Se acumulan **cuatro tandas con el gate en verde y sin ver en partida**. La guía
paso a paso de dos de ellas está en el vault (`00 Meta/Pendientes.md`).

**Si algo de esto falla, arreglarlo va antes que empezar nada nuevo.**

### 1. La región de origen (lo último desplegado, y lo menos visto)

Al crear personaje **solo Tal'Dorei ofrecía subregión**. No era cosmético:
`originRegion` decide la entrada **«Tu tierra»** del saber inicial, y
`regionEntries()` solo recorría las regiones de Tal'Dorei, así que un personaje
de Marquet, Issylra o los Dientes Rotos **arrancaba con menos saber**, y no por
diseño.

En `/crear` → Trasfondos → «Origen y fe»:

1. Elige **Marquet** y mira que aparece «Tu región» con **7** opciones. Luego
   Issylra (**4**), Wildemount (**8**), Tal'Dorei (**8**), Dientes Rotos (**1**).
   Antes solo salía en Tal'Dorei.
2. Al **cambiar de continente**, la región elegida se limpia (el slug era de
   otro continente).
3. Termina una ficha con origen de **Marquet** y mira que en el saber sale su
   entrada **«Tu tierra»** con su texto — plaza principal y rasgo incluidos.
   Ese era el agujero: antes esa entrada no existía fuera de Tal'Dorei.
4. En `/reino`, que la región de Marquet **NO** aparezca archivada bajo
   Tal'Dorei. (`placeOf` mandaba todo id `reg:` a Tal'Dorei; está corregido.)

> **Sin migración.** Los slugs no cambian, así que las fichas y ubicaciones ya
> guardadas siguen valiendo, y los `atlas_defs` del DM no necesitan
> `ATLAS_FIXES`.

### 2. El cupo de las dos pociones cumbre

Que fallar **no** lo gaste, que acertar bloquee **solo esas dos**, y que
**adelantar días desde Panel DM › Tiempo lo libere** — va por reloj de campaña,
no por hora real, y es lo que más fácil falla.

### 3. El bestiario

Añadir, editar, borrar y marcar como descubierto **sin recargar**, y que
sobreviva a recargar.

### 4. Los dados

Se arregló algo que llevaba roto **desde que existe el tablero**: ninguna tirada
visual usaba las caras. `dice-box` devuelve un array plano y el código leía
`res[0].rolls`, así que el `TypeError` mandaba todo al fallback aleatorio — **los
dados 3D eran decoración**. Corregido y con gate.

**El usuario confirmó la tirada de 4d6 de `/crear`**; eso y solo eso se da por
visto. Por orden de sospecha, lo que queda:

1. Que el desglose de las cuatro caras **con la menor tachada** siga saliendo
   bajo el total; si no aparece, `rollVisual` devuelve `null` y hay que mirar la
   consola.
   > **La tirada es de una sola vez.** `stat_rolls` tiene PK por usuario y no hay
   > policy de UPDATE: para repetir, resetéala en **Panel DM › Grupo**.
2. Que el resultado dé tiempo a leerse entre tirada y tirada (`hold`, 1,5 s).
3. **Las otras tiradas, aún sin ver**: el caldero de `/taller`, `SaberRoll` en
   `/lugar` y el feed de dados. Todas pasan por el mismo `rollVisual`, así que el
   arreglo las toca a todas — mira al menos una.

### Y alquimia entera, que lleva tres tandas desplegada y sin jugarse

El libro con sus recetas iniciales, preparar una poción, que **sobreviva a
recargar**, los huecos en `/inventario` (un montón = 1 hueco), «Enseñar recetas»
del DM y `/oficios`.

> [!danger] **Y el DM no puede probarlo: por eso lleva tres tandas sin verse.**
> `/taller` está abierta al DM, pero el caldero se cierra **dos veces** dentro de
> `components/taller/Caldero.tsx`, y las dos miran a un personaje:
> 1. `if (!inv.characterId)` → «No tienes un personaje en juego». **El DM no
>    tiene ficha, así que se queda aquí** y no ve nada de nada.
> 2. `if (!tieneOficio)` → exige la pericia de oficio **Alquimia**, que se elige
>    al crear el personaje o al llegar a nivel 7.
>
> El resultado es que **la única persona que necesita probar los talleres es la
> única que no puede entrar en ellos**. Arreglar esto va **antes** de construir
> más talleres: si no, el siguiente nace igual de invisible.

## Lo que hay que añadir: EL DM PRUEBA LOS TALLERES SIN FICHA

**Siendo DM tengo que poder abrir cualquier taller y usarlo**, sin personaje y
sin la pericia. No es una comodidad: es la única forma de ver funcionar lo que se
construye, porque el asistente no pasa del login y yo no juego con ficha.

**Ojo con el alcance**: hoy **solo alquimia existe**. Las otras cinco pestañas de
`/taller` son la promesa («este taller se abrirá más adelante»), así que «probar
todo tipo de talleres» empieza por el caldero y se hereda según se vayan
construyendo — **el modo DM tiene que quedar en el patrón**, no parcheado en
alquimia, o los cinco siguientes repiten el fallo.

### Lo que hay que decidirme antes de tocarlo

1. **Con qué tira el DM.** El modificador sale de `derive` sobre la ficha, y sin
   ficha no hay número. ¿Tira con **+0**, con un valor que él fije, o el modo DM
   **se salta la tirada** y sirve para ver la interfaz y el resultado?
2. **De dónde salen los materiales y a dónde va lo que sale.** Preparar descuenta
   del inventario del personaje y guarda la poción en él. Sin ficha no hay bolsa:
   ¿el DM tiene **materiales infinitos** y lo fabricado se tira, o el modo DM
   **elige la ficha de un jugador** y trabaja sobre ella?
3. **Qué libro de recetas ve.** El libro enseña solo lo descubierto
   (`lore_unlocked`). El DM debería ver **las 32**, pero eso es otra pantalla
   distinta de la del jugador — o es justo lo que ya hace `/oficios`, y entonces
   lo que falta es solo **poder ejecutar** desde ahí.
4. **Si el cupo de las dos pociones cumbre le aplica.** Vive en
   `play_state.tallerCupo`, que es de la ficha. Probando sin ficha no hay dónde
   guardarlo — y probar el cupo es justo una de las cosas pendientes de ver.

## La tarea de esta sesión: LOS TALLERES JUGABLES

Hay un **boceto interactivo ya aprobado** con el usuario (dos bancos de trabajo,
alquimia y forja). Lo que propone, y que es la dirección acordada:

- **La manipulación NO sustituye la tirada de pericia: la modifica**, con tope
  **±3** para no romper la matemática del reglamento.
- **Cada oficio manipula lo suyo.** Alquimia: echar materiales al **caldero**,
  dosificar con la **pipeta** (mantener pulsado, soltar dentro de una banda) y
  **cocer** (parar una aguja en su punto). Forja: **caldear** con el fuelle hasta
  el rojo cereza, **martillar** tres golpes a compás y **templar** a tiempo.
- **Cuando algo se mueve solo, hay un botón rojo que lo para** con la acción
  escrita, y **`espacio` hace lo mismo**. Nunca hay que adivinar qué se pulsa.
- **Cada material es un hueco cuadrado** como el de la bolsa, con la imagen del
  objeto dentro. Una tira arriba dice **qué pide la receta y qué sale**.
- **Siempre hay salida**: «preparar sin manipular» tira a pelo, sin bonificador
  — accesibilidad, y atajo para la décima poción.

### Lo que hay que decidirme ANTES de escribir código

Son las decisiones que el boceto deja abiertas. **Pregúntamelas, no las supongas:**

1. **De dónde salen las imágenes de los materiales.** Son **369**. ¿Un PNG por
   material (encargo de arte enorme) o **un icono por categoría** —planta,
   mineral, animal, esencia…—, que son unos pocos? `public/species/lineages/`
   sigue vacío, así que hay precedente de que el arte se atasca.
2. **Si el minijuego entra en alquimia**, que ya está desplegada y jugable sin
   él, **o solo en los talleres nuevos**. Cambia algo que un jugador quizá ya ha
   usado.
3. **Qué se puede fabricar en los otros cinco oficios.** Alquimia tenía las 25
   pociones de los libros. Cocina, forja, destilación, cristalografía y tatuaje
   **no tienen producto**: no hay lista de comidas, armas, elixires, cristales ni
   tatuajes. **Eso lo dicto yo y no se rellena a ojo.**
4. **Cuánto pesa cada fase** del minijuego dentro de ese ±3, y si un desastre
   puede hacer algo peor que perder los materiales (la destilación tiene
   `riesgo` en medio catálogo y hoy no cuesta nada).

### Lo que el andamio ya contempla y ninguna receta usa

- **`herramientas`** (cristalografía y tatuaje): se exigen a mano pero **no se
  gastan**. El campo existe en `Receta` y el gate ya lo vigila —incluso comprueba
  que el detector dispara—, pero **ninguna receta lo usa todavía**.
- **`riesgo`** (destilación): la mitad del catálogo trae contrapartida y hoy el
  fallo solo cuesta los materiales.

## Decisión abierta que dejó la tanda del origen

**Los Dientes Rotos son UNA sola región** para todo el archipiélago, así que
elegirlos como origen no dice nada — es el único continente que sigue así. La
wiki da islas con nombre (Kalutha, Slival, Igthuldus, Ruukva, Evaterena,
Athova-Rae, Shardborne) y, sobre todo, **dos sociedades enfrentadas**: la
**Hueste Osendida**, tribus pescadoras aisladas que veneran sueños y pesadillas,
y la **Asamblea Wanderman**, compañía mercante de la Costa del Serrallo que
naufragó allí. Como origen, la sociedad dice mucho más que la isla.

**Cuáles son origen jugable lo dicto yo.** Ojo al implementarlo: serían regiones
**nuevas**, así que ahí sí entra `mergeAtlas` (solo SUMA regiones) y hay que
mirar qué pasa con la región genérica que ya esté guardada en `atlas_defs`.

## La otra opción, si prefieres deuda a features

**Conectar la `mecanica` de forja.** Es la deuda más señalada del repo: 25
materiales llevan **regla de verdad** en el campo `mecanica` —el mithril anula el
requisito de Fuerza de la armadura pesada, la adamantina anula los críticos
recibidos, el residuum vuelve mágica el arma, la madera de bruma da Sutil— y
**nada de eso está conectado**: `data/equipment.ts` y `lib/derive.ts` no saben que
existen, así que forjar un peto de mithril **hoy no quita ningún requisito**. Es
la única parte del sistema que promete una regla y no la cumple, y está dicho en
la propia pantalla de `/oficios` para que no engañe. Toca el motor de ficha
derivada, que es fuente de verdad para la hoja **y** para el panel del DM.

## Cómo trabajamos (esto ya está rodado, respétalo)

- **Pregúntame las decisiones ANTES de escribir código.** La tanda de alquimia
  fue bien justo por eso: ocho decisiones cerradas de entrada.
- Brainstorming → spec → plan → ejecución. Specs y planes en
  `docs/superpowers/{specs,plans}/`.
- **Rama feature por tarea**, y **un commit por pieza** — así se puede parar en
  cualquier punto con el árbol limpio. **Y púshéala en cuanto exista**: la rama
  del origen estuvo un día entero viviendo en un solo disco, y mientras tanto
  `master` avanzó siete commits por otro lado.
- Gate: **`npx tsc --noEmit` + `npx next build` + los `scripts/check-*.ts`**
  (33 ahora mismo; cuéntalos, no te fíes del número escrito aquí).
- **Si la tanda toca datos, el gate tiene que verlo**, y **con prueba de
  mutación**: rómpelo a propósito, comprueba que el gate falla, restaura.
  > **Tres veces ya ha encontrado un fallo real**, y **dos de esas tres el fallo
  > era una regla que NO PODÍA FALLAR**:
  > - En alquimia, el índice de materiales descartaba `herramienta` en silencio
  >   y la regla estaba **vacía**, verde por casualidad.
  > - En los dados, el puente con `dice-box` **no era comprobable**, y por eso
  >   `facesFrom` se exporta.
  > - En el origen, el check de «los slugs de Tal'Dorei no se mueven» comparaba
  >   `REGIONS` contra los slugs que el atlas **saca de `REGIONS`**: los dos
  >   lados se movían juntos, **verde por construcción**. Cambiar un slug no
  >   tumbaba nada. Se arregló escribiendo los ocho a mano en el script.
  >
  > Moraleja: cuando escribas un check, pregúntate **qué tendría que romperse
  > para que fallara**. Si la respuesta es «las dos mitades a la vez», no vigila
  > nada. Y desconfía de un puente con una librería externa sin prueba de forma.
- **Commitea ANTES de mutar**: `git checkout --` no restaura un archivo que git
  aún no conoce — y si el archivo **sí** está trackeado, te borra el trabajo sin
  commitear que tengas dentro. En la tanda del origen pasó exactamente eso:
  restaurar una mutación se llevó por delante una tabla nueva a medio escribir.
- **Cuidado con los pipes al comprobar el gate**: `npx tsx x.ts | tail` devuelve
  el código de salida de `tail`, no el del script, así que un `&&` detrás miente.
  Mira la salida, no solo el `$?`.
- **Nunca `git add -A` a ciegas**: añade los archivos que has tocado.
- Commits acaban con `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.
  Autor `CarlosAlbertt` (Vercel bloquea otros emails). Con backticks en el
  mensaje, usar `git commit -F -` con heredoc y el **bash tool** (el shell por
  defecto es PowerShell). **`git merge` no admite `-F -`**: escribe el mensaje a
  un archivo.
- `AGENTS.md`: este Next.js 16 tiene cambios rompedores. Ante dudas de API, lee
  `node_modules/next/dist/docs/`, no tires de memoria.

> [!danger] **Toda ruta nueva pasa por `lib/acceso.ts`**
> El jugador solo ve `/`, `/crear`, `/personaje`, `/inventario`, **`/taller`**,
> `/reino` y `/lugar`. `scripts/check-acceso.ts` **te hará fallar** si añades
> una página sin clasificarla, anidada incluida — y también si cambias el nav
> sin actualizarlo.

> [!warning] **`app_config` NO está en la publicación realtime**
> Lección pagada **cuatro veces** ya — la cuarta fue el bestiario el 2026-08-01,
> y era un fallo de cara al usuario, no teoría: el DM añadía un monstruo y no lo
> veía hasta recargar. Todo lo que se guarde ahí necesita **update optimista**;
> no te suscribas esperando eventos. `lib/useOficios.ts` y `lib/useBestiary.ts`
> lo hacen bien y lo explican. **Si escribes un hook nuevo sobre `app_config`,
> el patrón es ese y no hay excusa para repetirlo.**

> [!warning] **No puedes ver la app**
> Todo está tras el login y **no debes meter credenciales**. Para UI puedes
> montar un banco de pruebas estático y servirlo por `/dice-box/` (excluida del
> proxy), pero **bórralo antes de commitear**. La comprobación en vivo la hago yo.

## Dónde lo dejamos (1 de agosto de 2026)

Todo en `master` y desplegado. **Nada de esto se ha visto en la app viva.**

- **La región de origen existe en los cinco continentes.** 28 regiones:
  Tal'Dorei 8, Wildemount 8, Marquet 7, Issylra 4, Dientes Rotos 1. Salen de la
  **misma semilla que el atlas** (`regionesDeOrigen`), no de una segunda lista a
  mano. **`DETALLE_REGION`** (`data/world.ts`) da plaza principal y rasgo a las
  once regiones sembradas, que salían con `capital: "—"` y rasgo vacío.
  **Gate 33 `check-origen.ts`** (22 comprobaciones), probado por mutación con
  cinco roturas — una destapó que el propio check era tautológico.
- **El cupo de las dos pociones cumbre.** Posibilidad y Fuerza de gigante
  (tormentas) se fabrican, pero con los componentes más difíciles del catálogo y
  **una cada 1d6 días**. Cupo **compartido** entre las dos, **solo las bloquea a
  ellas** y **solo se consume al acertar**. Vive en `play_state.tallerCupo` como
  minuto de juego absoluto: va por **reloj de campaña**, así que adelantar días
  desde Panel DM › Tiempo lo libera. Al gastarlo se **relee y fusiona**
  `play_state` — ahí viven también los PG.
- **El bestiario se ve al instante.** Las mutaciones escribían en `app_config`
  sin tocar el estado local y el hook confiaba en una suscripción realtime **que
  no entrega nunca**. Ahora aplican en local y luego persisten, como
  `useOficios`, y la mezcla es capa pura que el gate comprueba.
- **Los dados usan por fin sus caras.** `facesFrom()` lee las dos formas posibles
  del resultado de `dice-box`; si no salen tantas caras como dados se pidieron,
  se cae al fallback en vez de guardar un total a medias.
- **Alquimia se juega** (32 recetas, el caldero, el libro en `lore_unlocked`,
  `/oficios` para el DM).
- **Gate: 33 checks en verde**, con `tsc` y `next build` limpios.
- **Migraciones v1–v23 al día**; ninguna de estas tandas llevó migración.

## Lo que sigue pendiente y NO es esto

No lo empieces sin decírmelo: **jugar una sesión de prueba**, **qué hace cada una
de las 18 pericias del reglamento** (plantilla en `docs/pericias-borrador.md` §5),
**`/api/*` sin control de rol** —un jugador con la consola abierta puede llamar
`/api/ia` aunque `/taberna` esté cerrada—, **Extracción de Componentes** (el
séptimo oficio: el que *consigue* materiales, sin catálogo propio; falta la
mecánica de despiece y recolección, y encaja con `/bestiario` y `/lugar`), poblar
Issylra, Marquet y los Dientes Rotos, ampliar la biblioteca de conjuros, los
pozos de las 5 clases que faltan, el bestiario a medias (124 monstruos, solo
CR 0–1/2), Fase P (downtime), Fase Q (misiones IA), C2 (regateo), y los
**retratos de linaje** (`public/species/lineages/` sigue vacío).

---

**El orden de arranque, sin saltarse pasos:** `git fetch` y `git status -sb`
—no leer archivos—, luego `HANDOFF.md`. Después dime qué falla de las cuatro
cosas sin ver: **el origen** (lo más reciente y lo menos mirado), el cupo, el
bestiario y los dados.

**Lo de alquimia no te lo puedo decir hasta que el DM pueda entrar al taller**,
así que esa es la primera pieza de código: pregúntame sus cuatro decisiones y
déjala en el patrón, no parcheada en el caldero. **Los talleres jugables van
después**, y también con sus cuatro decisiones preguntadas antes de escribir
nada: sin saber qué produce cada oficio no hay nada que fabricar.
