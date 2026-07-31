Retomo Exandria, mi app de campaña de D&D 2024. Repo privado
CarlosAlbertt/Exandria, rama `master`, desplegada en exandria.vercel.app.

> **Ojo con la ruta**: el clon está en `C:\Users\carlo_pjou9vc\Exandria`. Los
> docs viejos dicen `C:\Users\carlo\Downloads\dnd-campaign-app` — es otra
> máquina. Si `node_modules` no está, `npm install` primero: **el gate no corre
> sin él**. `npm install` toca `package-lock.json` y los assets de
> `public/dice-box/`; eso **no es tuyo, no lo commitees**.

**Lee primero `HANDOFF.md`** — es el documento de estado vivo.

## Lo primero, y no es código: PROBAR LOS DADOS EN LA APP

La tanda anterior arregló algo que llevaba roto **desde que existe el tablero**:
ninguna tirada visual usaba las caras de los dados. `dice-box` devuelve un array
plano y el código leía `res[0].rolls`, así que el `TypeError` mandaba todo al
fallback aleatorio — **los dados 3D eran decoración**. Está corregido y con gate,
pero **no se ha visto en la app viva**: todo está tras el login.

Por orden de sospecha:

1. **`/crear` → Aptitudes → «Tirar 4d6»**. Que el número grande del overlay sea
   **el mismo** que acaba en «Tus valores», seis veces. Debajo del total tienen
   que salir **las cuatro caras con la menor tachada**; si ese desglose no
   aparece, `rollVisual` sigue devolviendo `null` y hay que mirar la consola.
   > **La tirada es de una sola vez.** `stat_rolls` tiene PK por usuario y no hay
   > policy de UPDATE: para repetir, resetéala en **Panel DM › Grupo**.
2. **Que el resultado dé tiempo a leerse** entre tirada y tirada (`hold`, 1,5 s).
3. **Que el resto de tiradas sigan bien**: el caldero de `/taller`, `SaberRoll`
   en `/lugar` y el feed de dados. Todas pasan por el mismo `rollVisual`, así que
   el arreglo las toca a todas — conviene mirar al menos una.
4. **Alquimia**, que sigue sin verse en partida: el libro con 3 recetas
   iniciales, preparar una poción, que **sobreviva a recargar**, los huecos en
   `/inventario` (un montón = 1 hueco), «Enseñar recetas» del DM y `/oficios`.

Si algo de esto falla, arreglarlo va **antes** que empezar nada nuevo.

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
  cualquier punto con el árbol limpio.
- Gate: **`npx tsc --noEmit` + `npx next build` + los 32 `scripts/check-*.ts`**
  (no hay tests; ese es el gate real).
- **Si la tanda toca datos, el gate tiene que verlo**, y **con prueba de
  mutación**: rómpelo a propósito, comprueba que el gate falla, restaura.
  > Dos veces ya ha encontrado un fallo real. En alquimia, el índice de
  > materiales descartaba `herramienta` en silencio y la regla estaba **vacía**,
  > verde por casualidad. En los dados, el puente con `dice-box` **no era
  > comprobable** y por eso sobrevivió tanto. Desconfía de una regla que **no
  > puede fallar**, y desconfía de un puente con una librería externa que no
  > tenga prueba de forma.
- **Commitea ANTES de mutar**: `git checkout --` no restaura un archivo que git
  aún no conoce.
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
> Lección pagada **tres veces** ya. Todo lo que se guarde ahí necesita **update
> optimista**; no te suscribas esperando eventos. `lib/useOficios.ts` lo hace
> bien y lo explica; `lib/useBestiary.ts` tiene una suscripción que **no entrega
> nunca** y sigue ahí.

> [!warning] **No puedes ver la app**
> Todo está tras el login y **no debes meter credenciales**. Para UI puedes
> montar un banco de pruebas estático y servirlo por `/dice-box/` (excluida del
> proxy), pero **bórralo antes de commitear**. La comprobación en vivo la hago yo.

## Dónde lo dejamos (31 de julio de 2026, tarde)

- **Los dados usan por fin sus caras.** `facesFrom()` lee las dos formas
  posibles del resultado de `dice-box`; si no salen tantas caras como dados se
  pidieron, se cae al fallback en vez de guardar un total a medias.
- **4d6 descartando el menor** se resuelve dentro de `rollVisual` (`keep: 3`), y
  el overlay enseña las cuatro caras con la menor tachada. `hold` deja el
  resultado en pantalla entre tirada y tirada.
- **Gate 32 `check-dados.ts`**, probado por mutación con cuatro roturas.
- **Alquimia se juega** (32 recetas, el caldero, el libro en `lore_unlocked`,
  `/oficios` para el DM) — de la tanda anterior, y **aún sin ver en partida**.
- **Gate: 32 checks en verde**, con `tsc` y `next build` limpios.
- **Migraciones v1–v23 al día.** Esta tanda **no llevó ninguna**.

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

**Empieza leyendo `HANDOFF.md`. Luego prueba los dados en `/crear` y dime qué
falla. No empieces tarea nueva hasta que eso esté visto.**
