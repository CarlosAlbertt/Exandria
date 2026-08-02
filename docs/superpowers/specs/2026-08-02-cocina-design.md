# Los fuegos: cocina, la atención partida y la cata

**Fecha**: 2 de agosto de 2026
**Estado**: boceto aprobado, decisión cerrada, **sin construir**
**Boceto**: `docs/bocetos/cocina-fuegos.html`

---

## 1. Lo propio de este oficio: se lo come el grupo

Es el único taller cuyo producto **no va a una bolsa**. Los otros seis hacen una
cosa para uno; un guiso **se sirve, alimenta a varios y dura hasta el descanso
largo**. Es el oficio de la **Fase P (downtime)**, que sigue pendiente.

De ahí sale la asimetría que ningún otro tiene: **el que paga el fallo no es
quien tira**. En los demás talleres te fastidias tú; aquí se queda sin cenar la
mesa entera.

## 2. Las tres fases

| Fase | Qué se hace | +1 | 0 | −1 |
|---|---|---|---|---|
| **1 · La despensa** | Equilibrar el plato por categorías, no por lista | equilibrado | pasable | falta o sobra una categoría |
| **2 · Dos fuegos** | Sartén y olla a la vez; solo se puede atender una | los dos en su punto | uno se pasa | los dos |
| **3 · La cata** | Probar y corregir con tres cucharadas contadas | en su punto | comestible | soso o pasado |

Mismo ±1 por fase y mismo tope **±3** que los demás.

## 3. Por qué estas tres

Los seis anteriores se juegan **de uno en uno**: haces algo, lo paras, pasas a lo
siguiente. Cocina trae dos cosas que ninguno tiene:

- **Dos cosas a la vez.** La sartén no espera a que termines con la olla. Es la
  única fase de los siete oficios donde **desatender** es una forma de fallar:
  no fallas por hacerlo mal, fallas por no estar.
- **El juego contesta.** La cata dice «soso» o «pasado» y el jugador corrige. En
  los otros seis se acierta o se falla a ciegas; aquí hay **información parcial**,
  y la habilidad es usar tres cucharadas bien. No lo cubre `puntoEnBandas`:
  hace falta un objetivo oculto y una respuesta por intento.

## 4. La decisión: raciones variables

**Elegida por el DM el 2026-08-02 (opción A de tres).**

La receta declara **para cuántos es**, y la tirada —pericia más manipulación—
**sube o baja ese número**. Un guiso regular da de comer a dos en vez de a
cuatro.

Es la única de las tres que respeta la asimetría del oficio: **aquí el fallo lo
paga la mesa, no quien tira**. Con todo o nada, una mala tirada deja al grupo
entero sin cenar por algo que no hizo.

Lo que eso implica al construirlo:

- **`Receta` gana un campo de raciones base** para cocina. Es el primer campo de
  receta específico de un oficio, así que conviene que sea opcional y que el gate
  exija que **toda receta de cocina lo traiga** y ninguna de otro oficio lo use.
- **Las raciones nunca bajan de cero, y probablemente no de uno**: que un desastre
  deje media mesa sin comer es la gracia; que la deje entera y además pierda los
  ingredientes es el todo o nada que se acaba de descartar.
- **Servir es repartir**: hay que decidir a quién alimenta cada ración, y eso ya
  toca la Fase P.

Descartadas: *todo o nada* (castiga al grupo por una tirada ajena) y *siempre
sale algo con calidad* (exige tres versiones por receta, y no hay ni una).

## 5. Lo que falta para poder construirlo

**Qué platos existen.** Los 100 del catálogo son ingredientes, no platos.

> **Un atajo que solo tiene cocina**: los platos **se pueden nombrar a partir de
> lo que llevan** —«Asado de Oso Lechuza con raíces» sale solo de sus
> ingredientes—, así que el DM podría no tener que escribir cien recetas a mano.
> Está sin decidir, y cambia bastante lo que cuesta la tanda.

Y de la Fase P: **qué da de comer bien**, que es lo que convierte el plato en algo
más que sabor.
