Retomo Exandria, mi app de campaña de D&D 2024. Repo privado
CarlosAlbertt/Exandria, rama `master`, desplegada en exandria.vercel.app.

> **Ojo con la ruta**: el clon está en `C:\Users\carlo_pjou9vc\Exandria`. Los
> docs viejos dicen `C:\Users\carlo\Downloads\dnd-campaign-app` — es otra
> máquina. Si `node_modules` no está, `npm install` primero: **el gate no corre
> sin él**. `npm install` toca `package-lock.json` y los assets de
> `public/dice-box/`; eso **no es tuyo, no lo commitees**.
>
> **Y ojo con el directorio del shell**: la sesión anterior se le reseteó a otro
> repo a mitad de tanda y varios comandos corrieron en el sitio equivocado.
> Comprueba dónde estás antes de dar por buena una salida rara.

**Lee primero `HANDOFF.md`** — es el documento de estado vivo.

## Lo primero: HAY UNA RAMA SIN MERGEAR ESPERANDO DECISIÓN

`feat/origen-todos-los-continentes`, **5 commits, árbol limpio, gate 33 en
verde**, `tsc` y `next build` limpios. **No está en `master` y no se ha
desplegado**, a propósito: no se ha visto en la app viva y `master` despliega
en Vercel.

Lo que arregla: al crear personaje, **solo Tal'Dorei ofrecía subregión**. Y no
era cosmético — `originRegion` decide la entrada **«Tu tierra»** del saber
inicial, y `regionEntries()` solo recorría las regiones de Tal'Dorei, así que
un personaje de Marquet, Issylra o los Dientes Rotos **arrancaba con menos
saber**, y no por diseño.

**Compruébalo en la app antes de mergear** (`/crear` → Trasfondos → «Origen y
fe»):

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

Si va bien: **mergear a `master` y desplegar**. Si algo falla, arreglarlo va
antes que empezar nada nuevo.

> **Sin migración.** Los slugs no cambian, así que las fichas y las ubicaciones
> de grupo ya guardadas siguen valiendo, y los `atlas_defs` del DM tampoco
> necesitan `ATLAS_FIXES`.

## Lo segundo: LO QUE SIGUE SIN VERSE EN PARTIDA

- **Los dados: solo se ha confirmado la tirada de 4d6 de `/crear`.** Siguen sin
  comprobarse las otras tiradas que pasan por el mismo `rollVisual` —el caldero
  de `/taller`, `SaberRoll` en `/lugar` y el feed de dados—. El arreglo las toca
  a todas; conviene mirar al menos una.
- **Alquimia entera**, que lleva dos tandas desplegada y sin jugarse: el libro
  con sus recetas, preparar una poción, que **sobreviva a recargar**, los huecos
  en `/inventario` (un montón = 1 hueco), «Enseñar recetas» del DM y `/oficios`.

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

## Decisión abierta que dejó la tanda anterior

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
  cualquier punto con el árbol limpio.
- Gate: **`npx tsc --noEmit` + `npx next build` + los 33 `scripts/check-*.ts`**
  (no hay tests; ese es el gate real).
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
> Lección pagada **tres veces** ya. Todo lo que se guarde ahí necesita **update
> optimista**; no te suscribas esperando eventos. `lib/useOficios.ts` lo hace
> bien y lo explica; `lib/useBestiary.ts` tiene una suscripción que **no entrega
> nunca** y sigue ahí.

> [!warning] **No puedes ver la app**
> Todo está tras el login y **no debes meter credenciales**. Para UI puedes
> montar un banco de pruebas estático y servirlo por `/dice-box/` (excluida del
> proxy), pero **bórralo antes de commitear**. La comprobación en vivo la hago yo.

## Dónde lo dejamos (31 de julio de 2026, noche)

- **La región de origen existe en los cinco continentes.** 28 regiones:
  Tal'Dorei 8, Wildemount 8, Marquet 7, Issylra 4, Dientes Rotos 1. Salen de la
  **misma semilla que el atlas** (`regionesDeOrigen`), no de una segunda lista a
  mano. **En rama, sin mergear.**
- **`DETALLE_REGION`** (`data/world.ts`) da plaza principal y rasgo a las once
  regiones sembradas, que salían con `capital: "—"` y rasgo vacío.
- **Gate 33 `check-origen.ts`** (22 comprobaciones), probado por mutación con
  cinco roturas — una de ellas destapó que el propio check era tautológico.
- **Los dados usan sus caras** desde la tanda anterior, y el usuario **confirma
  la tirada de 4d6 de `/crear`**. El resto de tiradas, sin ver.
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

**Empieza leyendo `HANDOFF.md`. Luego mira la rama sin mergear en `/crear` y
dime si el selector de región va bien en los cinco continentes. No empieces
tarea nueva hasta que eso esté visto y mergeado.**
