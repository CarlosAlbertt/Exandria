# Diseño — Objetivos múltiples (varios ataques, varias instancias)

Fecha: 2026-07-26 · Rama prevista: `objetivos-multiples` · **Sin migración.**

## Contexto — la app asume un solo objetivo

G4 dio el targeting y la mudanza al tablero lo puso en su sitio, pero toda la
capa asume **un objetivo, uno y solo uno**. En la mesa eso es falso casi siempre:
un guerrero de nivel 5 pega **dos veces** y puede repartir los golpes, el Rayo
Abrasador dispara **tres rayos** a quien quiera, el Proyectil Mágico reparte
**tres dardos**, y un pícaro con dos armas ligeras ataca **otra vez** con la
acción adicional.

Esta losa rompe esa suposición: la selección deja de ser un objetivo y pasa a ser
una **lista**.

## La idea rectora — una lista, varias formas de llenarla

Hay cuatro maneras de golpear a varios, y no son la misma cosa:

| Forma | Ejemplo | Entra ahora |
|---|---|---|
| **N ataques** por la acción de Atacar | Guerrero nv5 (2), nv11 (3), nv20 (4) | **Sí** |
| **Ataque de acción adicional** | Dos armas ligeras (pícaro, quien sea) | **Sí** |
| **N instancias** de un conjuro | Rayo Abrasador (3 rayos), Proyectil Mágico (3 dardos) | **Sí** |
| **Área** | Bola de Fuego (esfera), Manos Ardientes (cono) | **No** — siguiente losa |

Se modela **la lista** ahora, aunque solo se llene a mano, **para que el área
encaje después sin rehacer nada**: un área no es un caso especial, es otra forma
de producir la misma lista de objetivos. Si ahora se hiciera «uno o dos» a lo
bruto, la geometría no cabría luego.

## Decisiones (preguntadas antes de escribir el spec)

- **Alcance de esta tanda**: la lista de objetivos y las tres formas que **no**
  piden geometría. Las **áreas quedan fuera**, por su propio ciclo.
- **Resolución fiel a cada regla**, no uniforme:
  - **Armas, una a una**: pegas, ves el resultado, y **eliges el objetivo del
    siguiente golpe**. Si el primero cae, rediriges — que es lo que pasa en mesa.
  - **Conjuros multiobjetivo, declarados antes**: eliges los tres objetivos del
    Rayo Abrasador y se resuelve de golpe, que es como funciona el conjuro.
- **Sí al ataque de acción adicional** (dos armas), porque si no el pícaro no gana
  nada con esta losa y es como ataca de verdad.

## A — Armas: N ataques por acción

**Los datos ya existen**, no hay que inventar nada:

- `guerrero.ts` trae la columna **«Ataques por acción de Atacar»** con
  `[1,1,1,1,2,2,2,2,2,2,3,3,3,3,3,3,3,3,3,4]`.
- **Seis clases** declaran el rasgo **«Ataque Extra» a nivel 5**: guerrero,
  bárbaro, explorador, cazador de sangre, paladín y monje.
- **Pícaro y bardo no lo tienen**, y es correcto: el escalado del pícaro es el
  **Ataque Furtivo**, una vez por turno, no más ataques. Darles un segundo ataque
  sería inventarse una regla.

**`ataquesPorAccion(clsSlug, level): number`** (puro, en `lib/ataque.ts`):

1. Si la clase tiene la columna «Ataques por acción de Atacar», se lee de ahí.
2. Si no, ¿tiene el rasgo «Ataque Extra» a un nivel ya alcanzado? → **2**.
3. Si no → **1**.

**Estado**: `play_state.turno.ataquesUsados?: number` — clave nueva **dentro del
`turno` que ya existe**, así que **sin migración**, y `limpiarTurno` la borra
sola cuando te toca el turno. En `lib/turno.ts`: `gastarAtaque(play)` y
`ataquesRestantes(play, max)`.

**Economía**: el **primer** golpe gasta la **acción** y un ataque; los siguientes
solo gastan ataque (la acción de Atacar ya está pagada). Agotados los ataques, el
botón se apaga con «sin ataques este turno». El marcador dice **«Ataque 1 de 2»**.

## B — Ataque con acción adicional (dos armas)

`Arma` **no tiene la propiedad «ligera»** (solo `sutil` y `versatil`), y luchar
con dos armas la exige. Se añade `ligera?: boolean` a las cuatro armas ligeras del
catálogo: **Daga, Espada corta, Hacha de mano y Cimitarra**.

> **Trampa a evitar**: la **«Ballesta ligera» NO es un arma ligera.** Se llama así,
> pero sus propiedades son cargar, dos manos y munición. Marcarla sería un error
> clásico. Tampoco lo son Maza, Bastón, Lanza, Martillo de guerra, Espada larga,
> Arco corto ni Arco largo.

**UI**: si llevas **dos armas ligeras cuerpo a cuerpo** —una en cada mano, que es
lo que exige la regla: dos dagas valen, una no— y la acción adicional está libre,
aparece un botón aparte «**Otra mano**» que gasta la **adicional** en vez de un
ataque de la acción. No consume `ataquesUsados`.

**Daño sin modificador**: el ataque de la otra mano **no suma el modificador de
característica al daño** salvo que tengas el estilo de combate correspondiente, y
los estilos de combate **no están modelados en la app**. Se aplica la regla base
(sin modificador) y se dice en la interfaz — **quedarse corto es preferible a
pasarse**, que es la lección de G1.

**Fuera: la Ráfaga de Golpes del monje.** Es acción adicional, sí, pero cuesta un
punto de foco y son **golpes sin arma**, que no están en el catálogo. Es otro
modelo y entra en su momento; el monje ya tiene su pozo de foco en «Rasgos».

## C — Conjuros: N instancias declaradas

**`Spell` gana `instancias?: number`**: Rayo Abrasador **3**, Proyectil Mágico
**3**. Ausente ⇒ 1, como hasta ahora.

Al lanzar un conjuro con `instancias > 1`, aparece un mini-selector con **N huecos
de objetivo** (se puede repetir el mismo). Un clic: gasta **un** hueco de conjuro
y publica las N tiradas, cada una etiquetada «→ objetivo (rayo 2 de 3)».

> **Arregla de paso una incoherencia de O2**: hoy Proyectil Mágico guarda el daño
> **agregado** (`3d4+3`) y Rayo Abrasador el de **un** rayo (`2d6`) — el mismo
> campo significando dos cosas. Con `instancias`, `damage.dice` pasa a ser
> **siempre por instancia**: Proyectil Mágico → `1d4+1` × 3. Y además ya puedes
> repartir los dardos, que es lo que dice el conjuro.

## D — Cómo se conectan

`PanelCombate` sigue siendo dueño del **objetivo seleccionado** (lo usan las armas,
una a una) y además pasa hacia abajo **`objetivosDisponibles: Objetivo[]`**, que es
lo que `Conjuros` necesita para montar sus N selectores. El día que entren las
áreas, la geometría solo tiene que producir esa misma lista.

## Qué NO entra (a propósito)

- **Áreas** (esfera, cono, línea): necesitan geometría de casillas en
  `lib/tablero.ts`, un campo de área legible por máquina en `Spell` y que el
  tablero pinte la plantilla. Siguiente losa, y encaja sin rehacer esto.
- **Ráfaga de Golpes** del monje (golpes sin arma + coste de foco).
- **Conjuros de varios objetivos sin tirada** (Bendición y sus 3 aliados): solo se
  anuncian; llevar quién está bendecido pediría otro campo y no compensa aún.
- **Estilos de combate** (y con ellos, el modificador de daño de la otra mano).
- **Comparar la tirada con la CA**: la mesa sigue juzgando el impacto, como desde
  G2.

## Verificación (el gate real; no hay tests)

- **`ataquesPorAccion`** y el contador de ataques son **capa pura**: se amplían
  **`check-ataque`** (la derivación por clase y nivel: el **guerrero** por su
  columna, 1/2/3/4 en los niveles centinela; las **otras cinco** con «Ataque
  Extra» —bárbaro, explorador, cazador de sangre, paladín y monje— dando 2 desde
  nivel 5 y 1 antes; y **pícaro y bardo siempre 1**, que es la comprobación que
  impide que a alguien se le ocurra regalarles un ataque que no tienen) y
  **`check-turno`** (gastar ataques, el tope,
  y que `limpiarTurno` borre el contador sin tocar `usos`/`hp`/`conds`).
- **`check-spells`** valida `instancias` (entero ≥1 cuando está) y que el daño de
  Proyectil Mágico sea el de **un** dardo.
- `npx tsc --noEmit` + `npx next build` limpios.
- Sin regresión: los 11 scripts de siempre.
- **No probado en vivo.** **Pruebas del usuario**: con un guerrero nv5, pegar,
  cambiar de objetivo y pegar otra vez, ver «Ataque 2 de 2» y que el botón se
  apague; que «Siguiente turno» lo reinicie; con un pícaro con dos dagas, usar
  «Otra mano» y ver que gasta la adicional y no un ataque; con un mago, lanzar
  Rayo Abrasador repartiendo los tres rayos entre dos enemigos y ver tres tiradas
  etiquetadas; y que Proyectil Mágico tire tres dardos de 1d4+1 en vez de uno de
  3d4+3.
