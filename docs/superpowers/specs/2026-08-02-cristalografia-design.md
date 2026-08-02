# El banco de tallar: cristalografía, la veta y el punto de rotura

**Fecha**: 2 de agosto de 2026
**Estado**: boceto aprobado, decisión cerrada, **sin construir**
**Boceto**: `docs/bocetos/cristalografia-banco.html`

---

## 1. Lo propio de este oficio: la pieza se rompe

El catálogo ya lo dice, en sus propios blurbs: «extremadamente volátil de
tallar», «se hace añicos solo», «tallarlo es un infierno». En los demás talleres
lo que se pierde es una mezcla; aquí se pierde **la piedra**.

Y es el único de los seis cuyo catálogo trae **herramientas marcadas**
(`herramienta: true`): Cincel de Adamantina, Pinzas de Hueso de Dragón, Arena de
Escama de Dragón, Escama de Acorazado Astral. Se exigen a mano y **no se gastan**.
El campo existe, el gate lo vigila desde la tanda de alquimia y **ninguna receta
lo usa todavía**: esta sería la primera.

## 2. Las tres fases

| Fase | Qué se hace | +1 | 0 | −1 |
|---|---|---|---|---|
| **1 · Leer la veta** | Girar la piedra hasta alinear su plano de fractura con el cincel | alineado | de lado | contra la veta |
| **2 · Hendir** | Mantener pulsado para cargar fuerza y soltar | golpe justo | abre mal | roce, o **añicos** |
| **3 · Pulir** | Seguir puliendo… o parar | cerca del punto de rotura | a medias | **pasarse y agrietarla** |

Mismo ±1 por fase y mismo tope **±3**, por las mismas funciones que alquimia y
forja (`puntoEnBandas`, `totalManipulacion`).

## 3. Por qué estas tres, y no otras barras

Los talleres tienen que sentirse distintos **con el mando en la mano**, no solo
con otro dibujo. Alquimia ordena y para cursores; forja aguanta un compás;
destilación captura una ventana. Aquí entran tres cosas que no hace ninguno:

- **Un ángulo, no una barra.** Alinear la veta es la única fase de los cuatro
  oficios que se juega en círculo. `puntoEnBandas` no la cubre: hará falta una
  distancia angular, que además **es circular** — 350° y 10° están a 20°, no a
  340°, y ese es exactamente el fallo que se cuela solo.
- **Cargar y soltar.** La fuerza la acumula el jugador manteniendo pulsado. En
  los demás talleres el cursor se mueve solo y el jugador solo lo para.
- **Una barra que no vuelve.** Pulir siempre mejora hasta el punto de rotura, y
  nadie obliga a seguir. Es lo único de los cuatro oficios donde **el jugador
  elige cuánto arriesgar**, en vez de acertar o fallar un instante.

## 4. La decisión: el desastre rompe la gema

**Elegida por el DM el 2026-08-02 (opción A de tres).**

Hendir con fuerza de más, o pasarse puliendo, **parte la piedra**: se pierde la
gema y no sale nada, tire lo que tire el dado. **Las herramientas no se rompen
nunca** — se exigen y se devuelven, como ya hace `consumir`.

Es el equivalente al 1d4 de alquimia y al riesgo de destilación: cada oficio paga
su desastre en la moneda que le es propia. Aquí es material.

Descartadas: *solo resta al dado* (deja la tercera fase sin tensión: si pulir de
más no da miedo, no es una decisión, es un botón) y *sale una talla menor* (exige
que cada receta declare su versión pobre, y no hay ni versión buena todavía).

## 5. Lo que falta para poder construirlo

**Qué produce cristalografía.** Los 50 del catálogo son gemas en bruto y
utillaje, no piezas talladas. Sin la lista, el banco enciende y no sale ninguna
talla — el mismo tope que la fragua y el alambique.

## 6. Fuera de alcance

- Los otros oficios.
- Que una herramienta pueda **faltar** y bloquear la receta ya funciona
  (`requisitos` y `puedePreparar` las miran); lo que no existe es una receta que
  las pida.
