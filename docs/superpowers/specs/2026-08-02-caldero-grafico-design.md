# El caldero gráfico y la manipulación de Alquimia

**Fecha**: 2 de agosto de 2026
**Estado**: aprobado en brainstorming, pendiente de plan
**Oficio que toca**: alquimia. Los otros cinco heredan la cáscara, no entran aquí.

---

## 1. El problema

El taller de Alquimia funciona y está desplegado, pero **no hay caldero**: hay
una lista de recetas a la izquierda y, a la derecha, una lista de ingredientes
con tics y un botón «Preparar». Se prepara una poción igual que se marca una
casilla. El oficio no se juega, se rellena.

Y prepararlo es una decisión sin consecuencia: se pulsa, se tira 1d20 contra la
CD y ya. La pericia manda entera y el jugador no hace nada.

## 2. Lo que se construye

Un **banco de trabajo**: el caldero dibujado, los materiales como huecos con
imagen, y **tres fases de manipulación** que el jugador hace con las manos y que
**modifican la tirada de pericia sin sustituirla**, con tope **±3** para no
romper la matemática del reglamento.

## 3. Decisiones cerradas

Todas con el usuario, el 2026-08-02, antes de escribir código:

| # | Decisión | Elegido |
|---|---|---|
| 1 | Alcance | **Repintar + manipulación**. No es solo estética. |
| 2 | ¿La manipulación entra en alquimia, que ya está desplegada? | **Sí.** No se reserva para los oficios nuevos. |
| 3 | Imágenes de los 369 materiales | **Un PNG por material**, con icono de categoría como respaldo mientras no lleguen. |
| 4 | ¿Un desastre cuesta más que los materiales? | **Sí: 1d4 de daño**, además de perderlos. |
| 5 | Reparto del ±3 | Tres fases, **−1…+1 cada una**. |
| 6 | Disposición de la pantalla | Banco a lo ancho, libro como pestaña. Maqueta aprobada. |

## 4. La pantalla

De arriba abajo, dentro de la pestaña **«El banco»** (el libro pasa a ser
pestaña hermana):

1. **Tira de la receta**: nombre, cuántos materiales pide, qué sale, tu
   `Alquimia +N` y la **CD**. Es lo que el boceto llamaba «qué pide y qué sale»,
   y va arriba porque es lo que se consulta a mitad de manipulación.
2. **El caldero**, centrado y grande.
3. **Los huecos de material**: cuadrados, del mismo tamaño y forma que los de la
   bolsa de `/inventario`, con la imagen dentro, la cantidad en la esquina y el
   nombre debajo. Un hueco por material de la receta, más los vacíos.
4. **Las tres fases**, en fila.
5. **El botón rojo de parada** con la acción escrita, y al lado
   **«Preparar sin manipular»**.
6. **La manipulación acumulada** y la tirada resultante, en texto:
   `1d20 +5 +2 contra CD 10`. El jugador ve de dónde sale su número **antes** de
   tirarlo — misma lección que el arreglo del tablero de dados del 2026-08-02.

## 5. El caldero es SVG, no una imagen

Dibujado en el propio componente: cuerpo de hierro con degradado, asa curva,
tres patas, borde con filo de bronce, brebaje con degradado radial, burbujas que
suben, vapor y leña con llamas.

**Se dibuja en vez de encargarse por tres razones concretas:**

- **El brebaje se colorea por poción.** El color sale de la rareza y del efecto
  de lo que se prepara (verde curación, ámbar fuego alquímico…), así que el
  caldero dice qué hay dentro sin una etiqueta.
- **El fuego se enciende y se apaga por fase.** Apagado mientras se echan
  materiales, vivo al cocer.
- **No hay assets que esperar.** `public/species/lineages/` lleva vacío desde
  siempre; un caldero en PNG habría sido el mismo agujero.

## 6. Las tres fases y el ±3

Cada fase da **−1, 0 o +1**. La suma se acota a **±3** (hoy no puede pasarse,
pero el clamp se escribe igual: es la garantía de que añadir una cuarta fase
mañana no rompa la matemática).

| Fase | Qué se hace | +1 | 0 | −1 |
|---|---|---|---|---|
| **1 · Echar** | Arrastrar cada material al caldero **en el orden de la receta** | todos en orden | — | alguno fuera de orden |
| **2 · Pipeta** | Mantener pulsado y soltar dentro de una banda | soltar en el centro | soltar en la banda, fuera del centro | soltar fuera |
| **3 · Cocer** | Parar una aguja que va y viene | clavarla en el sector | parar dentro del arco ancho | pasarse |

**El orden de la fase 1 no necesita dato nuevo**: `Receta.materiales` ya es un
array, y su orden es el orden. Se documenta que a partir de ahora ese orden es
**significativo** y no decorativo.

**Cuando algo se mueve solo hay un botón rojo que lo para**, con la acción
escrita dentro («PARAR LA AGUJA»), y **`espacio` hace lo mismo**. Nunca hay que
adivinar qué se pulsa.

## 7. El desastre

**Es un desastre** si se da cualquiera de las dos:

- **pifia**: 1 natural en el d20, o
- **manipulación −3**: las tres fases falladas.

**Qué cuesta**: los materiales (como hoy) **y 1d4 de daño** al personaje.

El **tipo de daño** sale de la **categoría dominante** de los materiales de la
receta (`IngredienteCategoria` en `data/alquimia.ts`), que ya existe y no hay que
inventarse nada:

| Categoría dominante | Daño |
|---|---|
| `flora` | veneno |
| `fauna` | veneno |
| `mineral` | ácido |
| `esencia` | fuego |

Dominante = la más repetida contando cantidades. **Empate → la del primer
material de la receta**, que es determinista y no depende del orden de un `Map`.

**Cómo se aplica**: con `aplicarDaño` de `lib/estado.ts`, el mismo que usa
combate — no una resta a mano —, y escribiendo `play_state` con **relectura y
fusión** como hace `gastarCupo`. Ahí viven también los PG, las condiciones y los
huecos de conjuro: escribir el objeto que teníamos en memoria borraría lo que el
combate haya movido mientras el caldero estaba abierto.

## 8. El arte de los 369

Cada hueco pide `/materiales/<oficio>/<n>.png` — **por número de catálogo**,
porque el número es lo estable (así se refieren a ellos el DM y la mesa), no el
nombre.

**Si el PNG no está, cae a un icono de categoría** (flora, fauna, mineral,
esencia, herramienta). Los PNG van entrando en `public/` **sin tocar código** y
el taller no espera a nadie. Es la lección de `public/species/lineages/`.

## 9. La caja de arena del DM

Sigue funcionando igual y **hereda la manipulación entera**: el DM puede echar,
dosificar y cocer. Lo que no ocurre en la caja de arena:

- no se descuentan materiales,
- no se gasta el cupo,
- **no se aplica el 1d4** — no hay ficha a la que restar PG.

El mensaje ya dice qué habría pasado; ahora dirá además el daño que se habría
llevado.

## 10. Accesibilidad y salidas

- **«Preparar sin manipular» siempre está**, al lado del botón rojo, y tira a
  pelo con +0. Es accesibilidad y es el atajo para la décima poción.
- Con `prefers-reduced-motion`, la aguja y la banda no se animan: el botón de
  «sin manipular» se pinta como acción principal.
- Todas las fases se pueden completar **solo con teclado**: `espacio` para
  parar, flechas para elegir hueco, `enter` para echar.

## 11. El gate

`scripts/check-recetas.ts` crece con lo siguiente, y **cada regla se prueba por
mutación** (romperla a propósito, ver fallar el gate, restaurar):

1. **El clamp del ±3 se cumple**: ninguna combinación de las tres fases se sale
   de −3…+3.
2. **La categoría dominante está definida para las 32 recetas** y cae en una de
   las cuatro categorías conocidas — nada de `undefined` silencioso.
3. **El mapa categoría → tipo de daño cubre las cuatro** categorías. Añadir una
   quinta categoría mañana tiene que romper el gate, no salir sin daño.
4. **El empate de dominante es determinista**: misma receta, mismo tipo, sin
   depender del orden de iteración.
5. **Toda receta tiene al menos un material**, o la fase 1 no tendría nada que
   ordenar.

> Al escribir cada check, la pregunta es **qué tendría que romperse para que
> fallara**. Si la respuesta es «las dos mitades a la vez», no vigila nada —
> exactamente lo que pasó con `check-origen`, verde por construcción.

**Lo puro va aparte**: el cálculo de la manipulación, el clamp, la categoría
dominante y el tipo de daño viven en `lib/` como funciones puras, sin React, para
que el gate pueda llamarlas. La UI solo las invoca.

## 12. Migración

**Ninguna.** No cambia el esquema: `Receta` no gana campos, `play_state` usa
`hp`/`tempHp`, que ya existen. Las fichas y las recetas guardadas siguen
valiendo.

## 13. Fuera de alcance

- **Los otros cinco oficios.** Heredan la cáscara cuando tengan producto, y no
  lo tienen: cocina, forja, destilación, cristalografía y tatuaje no tienen
  catálogo de qué se fabrica, y eso lo dicta el DM.
- **El `riesgo` de destilación.** Sigue sin conectar. El 1d4 de este documento
  es una regla de alquimia, no ese campo.
- **La `mecanica` de forja.** Deuda aparte.
- **Los 369 PNG.** Encargo de arte, no código.
