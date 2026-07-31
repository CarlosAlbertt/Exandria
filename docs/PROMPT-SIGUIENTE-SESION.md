Retomo Exandria, mi app de campaña de D&D 2024. Repo privado
CarlosAlbertt/Exandria, rama `master`, desplegada en exandria.vercel.app.

> **Ojo con la ruta**: el clon está en `C:\Users\carlo_pjou9vc\Exandria`. Los
> docs viejos dicen `C:\Users\carlo\Downloads\dnd-campaign-app` — es otra
> máquina. Si `node_modules` no está, `npm install` primero: **el gate no corre
> sin él**. `npm install` toca `package-lock.json` y los assets de
> `public/dice-box/`; eso **no es tuyo, no lo commitees**.

**Lee primero `HANDOFF.md`** — es el documento de estado vivo.

## Lo primero, y no es código: PROBAR ALQUIMIA EN LA APP

La tanda anterior (31 de julio, madrugada) dejó **Alquimia jugable** y **nada de
ello se ha visto en la app viva**: todo está tras el login y el asistente no
mete credenciales. La tanda fue **sobre todo interfaz**, así que cuenta con idas
y venidas.

Lo que hay que mirar, por orden de sospecha:

1. **`/taller` → Alquimia**. ¿Sale el libro? Un personaje con la pericia debe
   ver **3 recetas iniciales** (Entendimiento, Trepar, Poción de curación). Sin
   la pericia, la pantalla dice que no sabes de Alquimia.
2. **Preparar una poción**: que descuente los materiales, que la poción entre en
   la bolsa, y sobre todo **que sobreviva a recargar la página**. El guardado va
   con debounce de 700 ms como el resto de la app.
3. **Los huecos**. Un montón de material ocupa **1 hueco** por muchas unidades
   que lleve; un arma sigue contando por unidad. Míralo en `/inventario`.
4. **Panel DM › Grupo → «Enseñar recetas»**: conceder una y ver que aparece en
   el libro del jugador.
5. **`/oficios`** (solo DM): que se vean los 369 materiales, que los filtros
   filtren, que **entregar** un material llegue a la bolsa del jugador, y que un
   material propio **siga ahí tras recargar**.
6. **El aviso de petición de tirada**: el DM pide una tirada desde Panel DM ›
   Dados y el jugador la ve **estando en cualquier página**, no solo en
   `/personaje` (que ya no tiene la sección de dados).

Si algo de esto falla, arreglarlo va **antes** que empezar nada nuevo.

## La tarea de esta sesión (elige tú, pregúntame si dudas)

### Opción A — los otros cinco talleres

El patrón ya está y **es replicable**: `/taller` es una ruta con pestañas, así
que un oficio nuevo **no toca `lib/acceso.ts`**. Lo que hace falta por oficio:

- **Recetas** en `data/recetas.ts` (el tipo `Receta` ya soporta los seis).
- **Su interfaz**, que tiene que parecerse a lo que hace: el **yunque y el
  temple** de la forja, el **alambique** de la destilación, los **fuegos** de la
  cocina, el **tallado** de la cristalografía, la **plantilla y las agujas** del
  tatuaje. No una pantalla genérica de fabricar.

**Dos oficios traen algo que alquimia no tenía**, y el andamio ya lo contempla:
- **Cristalografía y tatuaje usan `herramientas`**, que se exigen a mano pero
  **no se gastan**. El campo existe en `Receta` y el gate ya lo vigila (incluso
  comprueba que el detector dispara), pero **ninguna receta lo usa todavía**.
- **Destilación tiene `riesgo`**: la mitad del catálogo trae contrapartida. Hoy
  el fallo solo cuesta los materiales; ese catálogo pide algo peor.

**Lo que sale de cada oficio no existe.** Alquimia tenía las 25 pociones de los
libros. Cocina, forja, destilación, cristalografía y tatuaje **no tienen
producto**: no hay una lista de qué comidas, armas, elixires, cristales o
tatuajes se pueden hacer. **Eso lo dictas tú y no se rellena a ojo** — pregúntame
antes de inventarte un catálogo de productos.

### Opción B — conectar la `mecanica` de forja

**Es la deuda más señalada del repo.** 25 materiales de forja llevan **regla de
verdad** en el campo `mecanica`: el mithril anula el requisito de Fuerza de la
armadura pesada, la adamantina anula los críticos recibidos, el residuum vuelve
mágica el arma, la azuremita le cambia la aptitud, la madera de bruma da Sutil a
un arma pesada.

**Nada de eso está conectado**: `data/equipment.ts` y `lib/derive.ts` no saben
que estos materiales existen, así que forjar un peto de mithril **hoy no quita
ningún requisito**. Es la única parte del sistema que promete una regla y no la
cumple, y está dicho en la propia pantalla de `/oficios` para que no engañe.

Esto es lo más delicado de la lista: toca el motor de ficha derivada, que es
fuente de verdad para la hoja **y** para el panel del DM.

### Opción C — Extracción de Componentes

El séptimo oficio. Ya está decidido **qué es**: el oficio que **consigue**
materiales para los otros seis, así que no lleva catálogo propio. Lo que no
existe es la mecánica: contra qué se tira al despiezar un monstruo abatido o al
recolectar en un entorno, y qué sale.

Encaja con `/bestiario` (124 monstruos) y con `/lugar`.

## Cómo trabajamos (esto ya está rodado, respétalo)

- **Pregúntame las decisiones ANTES de escribir código.** La tanda de alquimia
  fue bien justo por eso: ocho decisiones cerradas de entrada.
- Brainstorming → spec → plan → ejecución. Specs y planes en
  `docs/superpowers/{specs,plans}/`.
- **Rama feature por tarea**, y **un commit por pieza** — así se puede parar en
  cualquier punto con el árbol limpio.
- Gate: **`npx tsc --noEmit` + `npx next build` + los 31 `scripts/check-*.ts`**
  (no hay tests; ese es el gate real).
- **Si la tanda toca datos, el gate tiene que verlo**, y **con prueba de
  mutación**: rómpelo a propósito, comprueba que el gate falla, restaura.
  > En la tanda de alquimia la mutación **encontró un fallo real**: el índice de
  > materiales copiaba campo a campo y descartaba `herramienta` en silencio, así
  > que la regla de «ninguna receta gasta una herramienta» estaba **vacía** —
  > verde por casualidad—. Sin mutar, eso no se ve. Hazla siempre.
  > Y desconfía de una regla que **no puede fallar**: comprueba también que el
  > detector **dispara** contra una entrada mala.
- **Commitea ANTES de mutar**: `git checkout --` no restaura un archivo que git
  aún no conoce.
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

## Dónde lo dejamos (31 de julio de 2026, madrugada)

- **Alquimia se juega**: 32 recetas, el caldero en `/taller`, el libro en
  `lore_unlocked` con prefijo `receta:` (sin migración), los materiales como
  objetos apilables que ocupan **1 hueco por montón**, y `/oficios` para el DM.
- **Gate 31 `check-recetas.ts`**, probado por mutación con seis roturas.
- **Fuera «Dados del grupo»** de `/personaje`; las peticiones de tirada del DM
  van en un aviso flotante del layout.
- **Los seis catálogos** (369 materiales) y **las 25 pociones**, de antes.
- **Gate: 31 checks en verde**, con `tsc` y `next build` limpios.
- **Migraciones v1–v23 al día.** Esta tanda **no llevó ninguna**.

## Lo que sigue pendiente y NO es esto

No lo empieces sin decírmelo: **jugar una sesión de prueba** (siguen las
features desplegadas y nunca vistas en partida), **qué hace cada una de las 18
pericias del reglamento** (plantilla en `docs/pericias-borrador.md` §5),
**`/api/*` sin control de rol** —un jugador con la consola abierta puede llamar
`/api/ia` aunque `/taberna` esté cerrada—, poblar Issylra, Marquet y los Dientes
Rotos, ampliar la biblioteca de conjuros, los pozos de las 5 clases que faltan,
el bestiario a medias (124 monstruos, solo CR 0–1/2), Fase P (downtime), Fase Q
(misiones IA), C2 (regateo), y los **retratos de linaje**
(`public/species/lineages/` sigue vacío).

**Empieza leyendo `HANDOFF.md`. Luego prueba Alquimia en la app viva y dime qué
falla. No empieces tarea nueva hasta que eso esté visto.**
