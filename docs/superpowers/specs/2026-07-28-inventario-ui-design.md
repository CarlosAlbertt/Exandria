# Diseño — El inventario, rediseñado

Fecha: 2026-07-28 · Rama prevista: `inventario-ui` · **Sin migración.**

> Petición del usuario: «el inventario no lo veo llamativo, quiero algo sorprendente,
> muy currado». Es un trabajo de **interfaz**: no se añaden reglas de juego.
>
> Se eligió el inventario, y no la «arena» del combate, porque la arena es la **fase
> 2** de los monstruos y está bloqueada hasta jugar una sesión. El inventario no
> depende de nada de eso.

## Contexto — qué hay hoy

- **`/inventario` es un redirect**: `app/inventario/page.tsx` solo hace
  `router.replace("/personaje")`. La ruta existe y está libre.
- El inventario real es una `<section>` dentro de **`components/CharacterSheet.tsx`
  (897 líneas)**, que además contiene stats, salvaciones, pericias, equipo, oro,
  nivel e historia.
- Un objeto guardado es `{ id, name, qty, notes?, doc? }`. **No tiene categoría, ni
  peso, ni rareza.**
- **Huecos** = `20 + 2 × mod. Fuerza`. Se muestra como un número suelto (`7/24`) y
  no se explica de dónde sale.
- **Equipar es un modo de dos pasos**: pulsas un hueco del muñeco, la lista cambia
  de comportamiento, y luego pulsas el objeto.
- El **muñeco** son 8 cajas en rejilla 2×2 (6 de armadura + 2 de arma), más los
  accesorios dinámicos de `data/leveling.ts`. Sin silueta.
- Cada fila arrastra una caja de **«Notas…» siempre visible**, aunque casi nunca se
  use: ocupa la mitad del alto de la lista.
- Todas las filas se ven igual: una espada, una cuerda y una poción son texto plano.

## Decisiones tomadas con el usuario

| Pregunta | Respuesta |
|---|---|
| ¿Dónde se usa? | **DM en portátil, jugadores en móvil.** Responsive obligatorio; nada puede depender de arrastrar. |
| ¿Dentro de la ficha o pantalla propia? | **Las dos**: resumen compacto en `/personaje` + pantalla completa en `/inventario`. |
| ¿Qué dirección visual? | **El muñeco como protagonista**, con la **bolsa como lista agrupada** (no rejilla de casillas). |
| ¿Huecos de armadura huérfanos? | **Dejarlos como están**, con selector de hueco para lo desconocido. Ampliar el catálogo es contenido, va al backlog. |

## El hallazgo que sostiene el diseño

**`derive.ts` ya calcula la CA a partir de los huecos de equipo** (`lib/derive.ts:81`,
`const equipped = c.equipment ? Object.values(c.equipment) : []`), y además devuelve
**`acSource`**, el porqué en texto («Coraza + DES (máx 2)»).

Es decir: que la CA cambie al equiparte, y que se explique sola, **ya está calculado y
solo hace falta enseñarlo**. La parte más vistosa del rediseño no cuesta ni una regla
nueva. Hoy un jugador se pone una coraza y no ve pasar nada.

## La pantalla `/inventario`

Tres zonas. En portátil, dos columnas; en móvil, apiladas con el muñeco arriba. El
mismo componente en ambos casos: **se estrecha, no se reordena**.

1. **El muñeco** — silueta central con los huecos colocados a los lados donde va cada
   cosa. Los 6 de armadura + 2 de arma que ya existen, más los accesorios dinámicos.
2. **Las vitales, debajo del muñeco** — **CA · Impacto · Daño**, en vivo, con la línea
   de `acSource` explicando la CA. Y la **barra de huecos**, que sustituye al número
   suelto: ámbar al 80 %, roja al llegar al tope, y el texto dice `20 + 2 × mod. Fuerza`.
3. **La bolsa** — lista **agrupada por categoría** con su recuento (`Armas · 2`), icono
   y color por categoría, y buscador arriba. Los nombres largos en español caben
   enteros, que es justo lo que una rejilla de casillas no permite. **No lleva chapa de
   «equipada»**: lo que llevas puesto no está en la bolsa (ver abajo), y ponerla sería
   describir un estado que no existe.

**El detalle del objeto no es un modal**: se abre en el sitio y empuja la lista. En
móvil aparece bajo las vitales; en portátil, al pie de la columna derecha. Un modal
en el móvil de un jugador tapa la mesa y obliga a cerrarlo para seguir jugando.
Las **notas** dejan de ocupar una caja por fila y viven aquí.

## La categoría, deducida del nombre

`lib/inventario.ts` (nuevo, **puro**) expone `categoriaDe(nombre)`. Seis categorías,
cada una con su icono y su color:

| Categoría | Color | De dónde salen los nombres |
|---|---|---|
| Armas | `--color-ember` | `ARMAS` (`data/weapons.ts`, 12) |
| Armaduras | `--color-arcane` | `ARMOR_LOOKUP` (`lib/derive.ts`, 5) |
| Aventura | `--color-bronze` | `CATALOG.Aventura` (14) |
| Consumibles | `--color-verdant` (**nuevo**) | `CATALOG.Consumibles` (6) |
| Herramientas | `--color-violet` | `CATALOG.Herramientas` (8) |
| Otro | `--color-dim` | todo lo demás |

**Solo coincidencia exacta**, normalizando mayúsculas y tildes. **Nada de adivinar por
trozos del nombre.** Una «Poción de curación mayor» sale como **Otro**, con icono
neutro, en vez de arriesgarse a pintar de verde una «Poción de veneno». Sobre-aplicar
es peor que quedarse corto.

Los **documentos** (`it.doc`) conservan su trato aparte, que ya lo tienen.

> **Ojo con el verde: hay que definirlo antes de usarlo.** La paleta de `globals.css`
> **no tiene ningún verde de uso general**; el único es `--color-primitivo` (#6cc24a),
> que es el **acento de la clase primitiva** y significa otra cosa. Reutilizarlo ataría
> el color de los consumibles al de una clase, que es la misma trampa de las dos listas
> a sincronizar. Se añade **`--color-verdant` al `@theme`**, una línea, como token
> propio.
>
> Esto se dice explícitamente porque el 2026-07-23 costó una tanda entera: `--color-gold`
> y `--color-gold-line` se usaban en seis sitios **sin estar definidas**, y un `var()`
> sin definir **invalida la declaración entera en silencio** — sin error de build, sin
> aviso, el color simplemente no aparece. Definir el token es el trabajo; usarlo es lo
> fácil.

**No se duplica ninguna lista.** Para eso hay que **exportar `ARMOR_LOOKUP` y
`SHIELD_NAME`** de `lib/derive.ts`, hoy `const` privados (líneas 43 y 49). Eso además
elimina el comentario de `data/equipment.ts:11` — *«Mantener estos nombres en sincronía
con ARMOR_LOOKUP»* —, que documenta exactamente el riesgo de tener dos listas a mano.

## Equipar, soltar, y la bolsa llena

**Equipar se invierte.** Tocas el objeto → su detalle trae **«Equipar»** → va al hueco
que le toca. `huecoDestino(nombre, equipoActual)`, puro:

- En `ARMAS` → **Principal**; si Principal está ocupada, **Secundaria**.
- «Escudo» → **Secundaria**.
- En `ARMOR_LOOKUP` y no es escudo → **Torso**.
- **Cualquier otra cosa** → `null`, y el detalle muestra los huecos para que elija el
  jugador.

Ese último caso es honesto, no pereza: **el muñeco tiene 6 huecos de armadura y el
catálogo no tiene ni un yelmo, ni guantes, ni botas.** En D&D 2024 esas piezas **no dan
CA**, así que los cuatro huecos son decorativos por diseño del juego. Se quedan (se
llenan a mano, para describir tu pinta) y ampliar el catálogo va al backlog.

**Cómo funciona hoy de verdad, y no se cambia**: equipar **saca el objeto de la bolsa**
(`removeOne`, `CharacterSheet.tsx:49`) y lo mete en el hueco; desequipar lo devuelve
(`addBack`, `:58`). O sea:

- **El muñeco y la bolsa son conjuntos disjuntos**: lo puesto no está guardado. Eso
  simplifica la pantalla — no hay que marcar nada como «equipado» dentro de la lista,
  porque no aparece ahí.
- **Lo equipado no cuenta para los huecos** (`used` solo suma `items`,
  `CharacterSheet.tsx:305`). Ponerte la coraza te libera un hueco. Es raro visto de
  cerca, pero **es la regla actual y cambiarla sería tocar mecánica**, no interfaz.
  Se documenta aquí para que nadie lo «arregle» de paso.
- **Desequipar se hace desde el muñeco**, tocando el hueco ocupado. Ese gesto ya existe
  y se conserva tal cual.

> **Corrección sobre una versión anterior de este spec**: decía que soltar un objeto
> equipado dejaba el hueco con una copia obsoleta (y que por eso la CA no bajaba).
> **Es falso.** Salió de leer `changeQty` sin leer `equipInto`. Un objeto equipado no
> está en la bolsa, así que no se puede soltar desde ella, y desequipar ya lo devuelve
> bien. No hay bug que arreglar aquí.

## Quién puede qué (decidido el 2026-07-28, tras leer el código)

**Hallazgo que cambió el diseño**: en `app/personaje/page.tsx:19`, la hoja propia de
un jugador es **`readOnly`**. Está comentado a propósito: *«Hoja propia: editable solo
si eres DM; el jugador la ve en solo lectura.»* O sea que hoy **un jugador no puede
tocar su propio inventario**, y el diseño original de este spec daba por hecho que sí.

No es una limitación de la base: la policy `chars: actualizar lo propio` (schema_v14)
deja a un jugador escribir su propia fila. Es una decisión de producto.

**Decisión del usuario: el jugador equipa y escribe notas; nada más.**

| Acción | Jugador (su ficha) | DM |
|---|---|---|
| Equipar / desequipar | ✅ | ✅ |
| Escribir notas de un objeto | ✅ | ✅ |
| Añadir un objeto | ❌ | ✅ |
| Soltar un objeto / cambiar cantidad | ❌ | ✅ |

El porqué: **el DM controla qué posees, y tú decides qué llevas puesto.** Es lo que pasa
en una mesa real, y evita que un jugador se regale objetos.

Dos consecuencias para la implementación:

1. Hacen falta **dos permisos distintos**, no uno: `puedeEquipar` (dueño o DM) y
   `puedeEditarContenido` (solo DM). No basta con `readOnly`.
2. El formulario de **añadir** (input libre + chips de `CATALOG`) vive hoy en la hoja
   detrás de `!readOnly`, así que **solo lo ve el DM**. Al sacar el inventario de la
   hoja hay que llevárselo a `/inventario`, o el DM se queda sin forma de dar objetos.
   El DM llega a la bolsa de un jugador por **`/inventario?user=<id>`**, igual que ya
   hace con `/personaje?user=<id>`.

## La ficha y el panel del DM

- **`/personaje`** conserva un **resumen**: chapas de lo equipado, **CA · Impacto ·
  Daño**, barra de huecos y un botón «Abrir el inventario». Lo que se mira en mitad de
  un turno es qué llevas puesto y cuánta CA tienes, no la lista de sogas.
- **Panel DM › Grupo** hereda la lista agrupada con iconos en **modo lectura**, sin
  botones. Reutiliza el `readOnly` que la hoja ya tiene. Para dar o quitar cosas, el DM
  ya tiene «entregar» en su panel.

## Estructura de archivos

| Archivo | Qué hace |
|---|---|
| `lib/inventario.ts` | **Nuevo, puro**: `categoriaDe`, `huecosDe`, `huecoDestino`, `agrupaPorCategoria`. |
| `scripts/check-inventario.ts` | **Nuevo**. El gate pasa de **20 a 21** scripts. |
| `components/inventario/MuñecoEquipo.tsx` | La silueta y sus huecos. |
| `components/inventario/BolsaAgrupada.tsx` | La lista por categorías + buscador. |
| `components/inventario/DetalleObjeto.tsx` | Detalle en el sitio: notas, equipar, soltar. |
| `components/inventario/ResumenEquipo.tsx` | El resumen de la ficha. |
| `app/inventario/page.tsx` | Deja de ser redirect y monta la pantalla. |
| `components/CharacterSheet.tsx` | Pierde la sección de inventario; gana `ResumenEquipo`. |
| `lib/derive.ts` | Exporta `ARMOR_LOOKUP` y `SHIELD_NAME`. |
| `data/equipment.ts` | Se borra el comentario de sincronía, ya innecesario. |
| `app/globals.css` | **Define `--color-verdant`** en el `@theme`. Una línea. |

La regla de la casa: **la capa pura y su script primero, la UI después.** Cuatro veces
en la losa de los monstruos se coló una regla dentro de un componente y el gate la dejó
pasar en verde, porque los scripts solo cubren funciones puras.

## Qué NO entra (a propósito)

- **Peso, rareza y sintonización.** No existen hoy y no se inventan.
- **Arte por objeto.** Iconos y color, no ilustraciones. (Recordatorio del inventario
  de arte: 13 retratos de clase, 0 imágenes de monstruo, `public/species/lineages/`
  vacío.)
- **Arrastrar y soltar.** La mitad de la mesa juega en móvil.
- **Ampliar `CATALOG` con yelmos, guantes y botas.** Es contenido, no interfaz. Backlog.
- **Tocar `/crear`** ni el reparto de botín del DM.
- **Reordenar la bolsa a mano**, favoritos, o pestañas por categoría: el agrupado ya
  ordena.

## Verificación (el gate real; no hay tests)

- **`scripts/check-inventario.ts`**: `categoriaDe` con un objeto de cada categoría, con
  mayúsculas y tildes cambiadas, con un nombre inventado (⇒ `otro`) y con cadena vacía;
  que **ningún nombre del catálogo caiga en `otro`**; `huecosDe` con mod. de Fuerza
  negativo, 0 y alto; `huecoDestino` en sus cuatro ramas, incluida la de Principal
  ocupada; y que `agrupaPorCategoria` no pierda ni duplique objetos.
- `npx tsc --noEmit` + `npx next build` limpios.
- Sin regresión en los 20 scripts actuales, en especial `check-ficha` (11) y
  `check-derive` (35), que cubren la carga de la ficha y la CA.
- `npx eslint` sin avisos en los archivos tocados.
- **Grep de `var(--color-` contra `globals.css`**: toda variable usada tiene que estar
  definida. `tsc` y `next build` no lo ven, y ya costó una tanda entera el 2026-07-23.
- **Grep de referencias al quitar la sección de la hoja**: `tsc` no ve un enlace muerto,
  y ya pasó al borrar `/tablero` (quedó un botón «Ir al tablero» que no llevaba a
  ningún sitio).
- **Prueba del usuario**: equipar una coraza y ver la CA subir y el texto explicarlo, y
  que **desaparece de la bolsa**; desequiparla desde el muñeco y ver la CA bajar y el
  objeto volver a la bolsa; llenar la bolsa y ver la barra en rojo con
  el porqué del tope; buscar «poción» y encontrarla; escribir un objeto a mano y verlo
  como «Otro»; abrir un objeto y escribir una nota; entrar desde el móvil y comprobar
  que el muñeco se estrecha en vez de romperse; y que el DM ve la lista con iconos y
  sin botones en su panel.
