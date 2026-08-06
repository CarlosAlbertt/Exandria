Retomo Exandria, mi app de campaña de D&D 2024. Repo privado
CarlosAlbertt/Exandria, rama `master`, desplegada en exandria.vercel.app.

> [!danger] **LO PRIMERO DE TODO: `git fetch` Y `git status -sb`.**
> **Antes de leer un solo archivo.** El 2026-08-01 se perdió una sesión entera
> por saltarse esto: el clon estaba **15 commits por detrás**, el taller de
> Alquimia **ya estaba hecho y desplegado**, y se reconstruyó desde cero con
> otro diseño hasta que el merge lo destapó.
>
> **Y el desfase va en los DOS sentidos**: ese mismo día este clon tenía 6
> commits que el remoto no tenía, en una rama sin pushear.
>
> **`HANDOFF.md` y el vault describen el clon LOCAL, no el remoto: ninguno de
> los dos sirve para saber si estás al día.** Solo `git fetch` lo sabe.

> **Ojo con la ruta**: hay clon en `C:\Users\carlo_pjou9vc\Exandria` y en
> `C:\Users\carlo\Downloads\dnd-campaign-app` — **son máquinas distintas**.
> Si `node_modules` no está, `npm install` primero: **el gate no corre sin él**.
> `npm install` toca `package-lock.json` y `public/dice-box/`; eso **no es tuyo,
> no lo commitees**. Y comprueba en qué directorio está el shell antes de dar
> por buena una salida rara: ya se le ha reseteado a otro repo a mitad de tanda.

## Qué es esto, en cuatro líneas

App web multijugador en tiempo real para una campaña de **D&D 2024** en
**Exandria**. Dos roles: **DM** (lo ve todo) y **jugador**. Next.js 16 (App
Router, Turbopack) · React 19 · Tailwind v4 · TypeScript · Supabase (Auth +
Postgres + Realtime) · IA local con Ollama por túnel cloudflared. **No hay
tests**: el gate es `tsc` + `next build` + los `scripts/check-*.ts`.

**Lee `HANDOFF.md`** después del `fetch` — es el documento de estado vivo.

## Lo primero, y no es código: PROBAR EN LA APP

Se acumulan **seis tandas con el gate en verde y sin ver en partida**. Si algo de
esto falla, arreglarlo va antes que empezar nada nuevo.

### 1. El caldero jugable (2026-08-02, lo más reciente y lo menos visto)

En `/taller` › Alquimia, con un personaje que sepa **Alquimia**:

1. **Elige una receta**: el libro va a la izquierda y el caldero a la derecha.
   Cada receta lleva **puntos de color** con las categorías de lo que pide.
2. **«Preparar manipulando (±3)»** → los huecos se vuelven arrastrables y la
   olla se ilumina en verde al pasar por encima, diciendo «arrastra aquí el
   material 2 de 3». **Prueba también el clic**: es el camino del móvil.
3. El hueco que ya cayó se apaga y le sale su **número de posición**.
4. Luego **pipeta** (soltar en la banda) y **cocer** (parar la aguja). Botón rojo
   con la acción escrita, y `espacio` hace lo mismo.
5. Al final, la tirada sale con **+pericia +manipulación**.
6. **Un desastre** —pifia natural o −3 de manipulación— tiene que **bajarte PG**
   de verdad, con el tipo de daño que dicte la categoría dominante.
7. **«Preparar sin manipular»** siempre está y tira a pelo.

### 2. Los dados, arreglados tres veces y solo vistos a medias

**El usuario confirmó el 4d6 de `/crear` y el desglose con la menor tachada.**
Lo que queda:

1. En un **chequeo con bonificador** (el caldero, `SaberRoll` de `/lugar`), bajo
   el total tienen que salir **la cara y el modificador aparte** — antes se veía
   un d20 en 12 y un 17 encima sin explicación.
2. Los dados se quedan **quietos y solos ~0,9 s** antes de que salte el número, y
   el total se ve **2,4 s**. En total 3,3 s de tirada visible.
3. Al abrir el tablero **no puede haber dados de la tirada anterior** en la mesa.
4. La **primera tirada de la sesión** ya no debería tardar en abrir el overlay.

### 3. La fragua

En `/taller` › Forja: la fragua se dibuja, los carbones se avivan al dar al
fuelle, el martillo cae y salta chispa. **No hay nada que forjar** y lo dice.
El DM puede jugar las tres fases enteras desde su caja de arena.

### 4. «Crear» se retira, y la historia se escribe después

1. Con ficha hecha, **«Crear» desaparece** de la barra y de la portada, y
   `/crear` dice «Ya tienes personaje».
2. Con una ficha **a medias** (sin especie ni clase) **sigue dejándote entrar**:
   si no, quien dejó el asistente por la mitad se quedaría fuera.
3. En `/personaje`, bajo la ficha, hay un panel de **Historia** que se puede
   escribir y guardar. Tiene que verse en **Panel DM › Grupo**.

### 5. Y lo de antes que sigue sin verse

El **cupo de las dos pociones cumbre** (que fallar no lo gaste, que acertar
bloquee solo esas dos y que **adelantar días desde Panel DM › Tiempo lo libere**),
el **bestiario** sin recargar, y la **región de origen** en los cinco continentes.

## Los siete oficios: bocetados, decididos, y cuatro sin construir

**`docs/bocetos/`** tiene los siete HTML (doble clic, sin servidor) y
`docs/superpowers/specs/` la spec de cada uno con **la decisión tomada y por qué
se descartaron las otras**. Cada oficio se juega distinto **con el mando en la
mano**, y eso es deliberado:

| Oficio | Se juega | Estado |
|---|---|---|
| **Alquimia** | ordenar, soltar la pipeta, parar la aguja | **construido** |
| **Forja** | banda, compás de tres golpes, temple | **construido sin piezas** |
| **Destilación** | **capturar una ventana** (cabezas/corazón/colas) | boceto |
| **Cristalografía** | girar un ángulo, cargar y soltar, arriesgar puliendo | boceto |
| **Tatuaje** | saber dónde va, trazar, y aguantar a alguien que se mueve | boceto |
| **Cocina** | **dos fuegos a la vez** y una cata que te contesta | boceto |
| **Extracción** | **entre intentos**, con un saldo que se gasta | boceto |

Las siete decisiones, ya cerradas: alquimia **1d4 de daño** · destilación **el
corte manda sobre el `riesgo`** · cristalografía **el desastre rompe la gema** ·
tatuaje **la runa torcida se queda puesta y el DM decide qué hace** · cocina
**raciones variables** · extracción **se puede cortar a ciegas**.

## La tarea de esta sesión: EXTRACCIÓN DE COMPONENTES

**Es el que más devuelve por lo que cuesta, y hay tres razones.**

1. **No te bloquea el catálogo.** Es el único de los siete del que **no hay que
   dictar qué produce**: **88 de los 369 materiales ya son piezas de monstruo**
   (19 alquimia, 24 cocina, 16 forja, 9 destilación, 11 cristalografía, 9
   tatuaje). Lo único que falta es **emparejar** monstruo con material, y el DM
   estaba en ello.
2. **Le da peso a todo lo ya construido.** Hoy los materiales **aparecen de la
   nada**, así que «al fallar se pierden los ingredientes» no significa nada.
3. **Media pieza está hecha**: `/bestiario` ya guarda los descubiertos,
   `/inventario` ya da un hueco por montón, y `/taller` es una ruta con pestañas.

**Todo está decidido** (ver `docs/superpowers/specs/2026-08-02-extraccion-componentes-design.md`):
se despieza **en el sitio con el cadáver fresco**, da **1d4 piezas por cadáver**,
**cada fallo se come una**, **pide herramientas** (sería el estreno del campo
`herramienta`, que el gate vigila desde alquimia y ninguna receta usa), y
**estudiar es opcional** — se puede cortar a ciegas sin saber si ahí había algo.

> [!warning] **Dos cosas que NO se resuelven a ojo**
> - **El DM mantiene su lista de cadáveres a mano.** *La mesa no siempre pasa por
>   la app*: no vale con que aparezcan solos al derrotar algo en `/combate`. Una
>   entrada **por cadáver** (no por monstruo), con qué bicho, dónde y cuántas
>   piezas le quedan.
> - **Esa lista vivirá en `app_config`, que NO está en la publicación realtime.**
>   El hook necesita **update optimista** o el DM añadirá un cadáver y no lo verá
>   hasta recargar. Van **cuatro veces** que esto muerde.
>
> Y un aviso de tipos: **extracción sería el primer `Oficio` SIN materiales
> propios**, y todo el índice asume que cada oficio tiene catálogo. Decidir si es
> un `Oficio` de pleno derecho o un tipo aparte — **no el día de la prisa**.

## Lo otro que se puede hacer, por orden

1. **Cocina**, que tiene atajo: los platos **se pueden nombrar a partir de lo que
   llevan**, así que quizá no haya que escribir cien recetas a mano. Falta
   decidirlo, y la Fase P (qué da de comer bien).
2. **Forja, destilación, cristalografía y tatuaje**: los cuatro esperan a que el
   DM dicte **qué producen**. Sin esa lista la pantalla enciende y no sale nada.
3. **La `mecanica` de forja**, la deuda más señalada: 25 materiales llevan regla
   de verdad —el mithril anula el requisito de Fuerza, la adamantina los críticos
   recibidos— y **nada está conectado** a `lib/derive.ts`.

## Deuda pequeña que dejé señalada

- **`CharacterSheet.tsx:435` repite la regla de «tiene personaje»** a mano
  (`!build.species && !build.cls`). Ya existe `tienePersonaje` en
  `lib/character.ts`, con el gate detrás; debería usarla.
- **`HistoriaPropia` recarga la ficha por su cuenta** en vez de compartirla con
  `CharacterSheet`: dos consultas donde cabría una.
- Si se quiere devolver al jugador la vía de reeditar su ficha, lo natural es un
  botón «Rehacer personaje» que lleve a `/crear?editar=1`.

## Cómo trabajamos (esto ya está rodado, respétalo)

- **Pregúntame las decisiones ANTES de escribir código.** Las siete tandas de
  oficios salieron bien justo por eso.
- Brainstorming → spec → plan → ejecución. En `docs/superpowers/{specs,plans}/`.
  **Y los bocetos aprobados se copian a `docs/bocetos/`**: perder uno ya costó
  una tanda entera.
- **Rama feature por tarea**, **un commit por pieza**, y **púshala en cuanto
  exista**.
- Gate: **`npx tsc --noEmit` + `npx next build` + los `scripts/check-*.ts`**
  (34 ahora mismo; cuéntalos, no te fíes del número escrito aquí).
- **Si la tanda toca datos o reglas, el gate tiene que verlo**, y **con prueba de
  mutación**: rómpelo a propósito, comprueba que falla, restaura.
  > **Ya ha encontrado cuatro fallos reales**, y el último fue mío: en
  > `check-forjado` escribí que soltar el martillo a media tanda costaba −1, y el
  > gate destapó que **el equivocado era el check** — dos golpes clavados y
  > soltar es «dos a tiempo de tres», igual que dar los tres fallando uno.
  >
  > Al escribir un check pregúntate **qué tendría que romperse para que fallara**.
  > Si la respuesta es «las dos mitades a la vez», no vigila nada.
- **Commitea ANTES de mutar**: `git checkout --` no restaura lo que git no
  conoce, y sí borra lo que tengas sin commitear.
- **Cuidado con los pipes**: `npx tsx x.ts | tail` devuelve el código de `tail`.
- **Nunca `git add -A` a ciegas.**
- **Antes de crear un `scripts/check-X.ts`, mira si ya existe**: `check-forja.ts`
  ya estaba (catálogo de 75 materiales) y casi lo piso; el nuevo se llamó
  `check-forjado.ts`, como su capa.
- Commits acaban con `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.
  Autor `CarlosAlbertt`. Con backticks en el mensaje, `git commit -F -` con
  heredoc y el **bash tool** (el shell por defecto es PowerShell). **`git merge`
  no admite `-F -`**: escribe el mensaje a un archivo.
- `AGENTS.md`: este Next.js 16 tiene cambios rompedores. Ante dudas de API, lee
  `node_modules/next/dist/docs/`, no tires de memoria.

> [!danger] **Toda ruta nueva pasa por `lib/acceso.ts`**
> El jugador solo ve `/`, `/crear`, `/personaje`, `/inventario`, `/taller`,
> `/reino` y `/lugar`. `scripts/check-acceso.ts` **te hará fallar** si añades una
> página sin clasificarla. Y ahora hay dos funciones: **`puedeVer` es la puerta**
> (la que usa el proxy) y **`puedeVerAhora` el escaparate** (lo que tiene sentido
> enseñar). Esconder algo **no es cerrarlo**.

> [!warning] **`app_config` NO está en la publicación realtime**
> Lección pagada **cuatro veces**. Todo lo que se guarde ahí necesita **update
> optimista**; no te suscribas esperando eventos. `lib/useOficios.ts` y
> `lib/useBestiary.ts` lo hacen bien y lo explican.

> [!warning] **No puedes ver la app**
> Todo está tras el login y **no debes meter credenciales**. Para UI puedes
> montar un banco de pruebas estático y servirlo por `/dice-box/` (excluida del
> proxy), pero **bórralo antes de commitear**. La comprobación en vivo la hago yo.

## Lo que sigue pendiente y NO es esto

**Jugar una sesión de prueba**, **qué hace cada una de las 18 pericias**
(`docs/pericias-borrador.md` §5), **`/api/*` sin control de rol** —un jugador con
la consola abierta puede llamar `/api/ia`—, **poblar Issylra, Marquet y los
Dientes Rotos**, **los Dientes Rotos por isla** (decidido: siete islas, pero
falta que el DM dicte el texto), ampliar la biblioteca de conjuros, los pozos de
las 5 clases que faltan, el **bestiario a medias** (124 monstruos, solo CR 0–1/2),
**Fase P (downtime)** —que es donde encaja cocina—, Fase Q (misiones IA), C2
(regateo), y los **retratos de linaje** (`public/species/lineages/` sigue vacío).

---

**El orden de arranque, sin saltarse pasos:** `git fetch` y `git status -sb`
—no leer archivos—, luego `HANDOFF.md`. Después dime qué falla de lo que está
sin ver, empezando por **el caldero jugable**, que es lo más reciente.

**Y luego, si la mesa de monstruos → materiales está lista, ataca EXTRACCIÓN.**
Es el único oficio que no espera a que nadie dicte un catálogo, y es el que hace
que perder ingredientes signifique algo.
