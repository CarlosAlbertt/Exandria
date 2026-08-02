# El alambique: destilación y el corte

**Fecha**: 2 de agosto de 2026
**Estado**: boceto aprobado, decisión cerrada, **sin construir**
**Boceto**: `docs/bocetos/destilacion-alambique.html`

---

## 1. Qué se manipula, y por qué no es otra barra

Alquimia se juega **echando**, forja **golpeando**. Si destilación fuese una
tercera barra que parar, los tres talleres serían el mismo con distinto dibujo.

Lo propio del destilador es **el corte**: separar las **cabezas** (lo que sale
primero, tóxico), el **corazón** (lo que se guarda) y las **colas** (lo que sale
al final, turbio). Y no se para un instante: **se captura una ventana** — se abre
el frasco y se cierra.

## 2. Las tres fases

| Fase | Qué se hace | +1 | 0 | −1 |
|---|---|---|---|---|
| **1 · Avivar** | El fuego, ni flojo ni fuerte | en el punto | destila, pero mal | apagado, o **se sube** |
| **2 · El corte** | Abrir y cerrar el frasco dentro del corazón | ventana entera dentro del corazón | la pilla a medias | falla el corazón o pilla cabezas |
| **3 · Rebajar** | Bajarla de grado con agua | a punto | bebible | quema o no hace nada |

Mismo ±1 por fase y mismo tope **±3** que alquimia y forja, y por las mismas
funciones (`puntoEnBandas`, `totalManipulacion` en `lib/manipulacion.ts`). Un +1
de destilación tiene que valer lo que un +1 de alquimia.

**El corte necesita mecánica propia**: no es una posición, es un **intervalo**
`[abre, cierra]` contra el intervalo del corazón. No lo cubre `puntoEnBandas`.

## 3. La decisión: el corte manda sobre el riesgo

**Elegida por el DM el 2026-08-02 (opción A de tres).**

25 materiales de destilación llevan el campo `riesgo: true` con la contrapartida
escrita en el `blurb` —«te disuelve la garganta», «adicción fuerte», «mutaciones
rojas en las venas»— y **hoy no hace absolutamente nada**. Es una de las deudas
más señaladas del repo.

A partir de esta tanda:

- **Corte limpio** (la ventana entera dentro del corazón) → el riesgo **no** se
  dispara, aunque el material lo traiga.
- **Corte sucio** → el riesgo **se dispara**, aunque la tirada de pericia salga
  bien.

Es lo que le da sentido a que destilación tenga mecánica propia: el corte no solo
suma al dado, **es la única fase de los tres oficios que hace algo más**.

Las otras dos opciones, descartadas y por qué: *el riesgo va siempre* (deja el
corte como adorno) y *solo con pifia* (sería el desastre de alquimia otra vez, y
el campo `riesgo` seguiría sin significar nada propio).

## 4. Lo que falta para poder construirlo

**Qué produce destilación.** Los 49 del catálogo son **ingredientes**, no frascos
terminados. Sin la lista de qué sale del alambique, la pantalla enciende y no
llena nada — el mismo tope que tiene la fragua.

Y con el riesgo conectado hay una segunda pregunta que hoy no tiene respuesta:
**qué hace cada contrapartida en mecánica**. El `blurb` la cuenta en prosa
(«envenena si no se detecta a tiempo»), pero un motor no puede aplicar prosa.
Hará falta, por cada material con riesgo, o bien una condición de las que ya
existen (`play_state.conds`), o bien daño, o bien un efecto que el DM aplique a
mano. **Eso lo dicta el DM.**

## 5. Fuera de alcance

- Los otros cuatro oficios.
- La `mecanica` de forja, que es deuda aparte.
