# Diseño — Fuera el tablero: la iniciativa es el combate

Fecha: 2026-07-26 · Rama prevista: `quitar-tablero` · **Sin migración.**

## Contexto — por qué se retira el tablero

G3 puso una rejilla con fichas arrastrables, G4 midió distancias sobre ella y la
mudanza a `/tablero` la convirtió en la pantalla de combate. **Nunca llegó a
probarse en una sesión real.** Al mirarlo con calma, el usuario decide retirarlo
por dos razones a la vez:

1. **No encaja con cómo juegan.** Están todos en la mesa y el DM narra: colocar
   fichas y medir casillas es fricción que no aporta nada que no esté ya sobre la
   mesa o en la cabeza del DM.
2. **No compensa lo que cuesta mantener.** Es la parte más enredada de la app
   (dos tablas propias, realtime, arrastre, geometría) para lo poco que da.

## El hallazgo que abarata la retirada

**Casi ninguna regla de G4 necesita medir distancia: se deduce del arma.** Si
atacas con una daga estás en cuerpo a cuerpo por definición; si disparas un arco,
estás a distancia.

| Regla | ¿Necesita rejilla? |
|---|---|
| Bloqueo de alcance | **No** — un arma de cuerpo se usa en cuerpo a cuerpo. La rejilla solo servía para impedir declarar un absurdo. |
| Ventaja por cegado/paralizado/aturdido/petrificado/restringido | **No** — depende de la condición del objetivo. |
| Derribado: ventaja de cerca, desventaja de lejos | **No** — sale del arma: cuerpo ⇒ ventaja, distancia ⇒ desventaja. **Más limpio que medir.** |
| Crítico por proximidad | **No** — arma de cuerpo ⇒ estás a quemarropa. |
| Movimiento en metros | **Sí.** Es lo único que se pierde de verdad. |

Lo que el targeting necesitaba de la rejilla no era *dónde* está el enemigo, sino
**quién es**. Y eso ya está en la tabla `initiative`, que tiene **una fila por
combatiente** (jugadores y PNJ) y ya publica por realtime.

## Qué se retira

- `app/tablero/page.tsx` (pasa a ser `app/combate/page.tsx`).
- `components/tablero/BattleBoard.tsx`, `lib/useBattle.ts`, `lib/tablero.ts`,
  `scripts/check-tablero.ts`.
- La pestaña **Panel DM › Tablero** (`app/dm/TableroPanel.tsx`), cuyos mandos
  útiles (añadir PNJ, siguiente turno, vaciar) **ya existen** en Panel DM › Dados.
- El enlace «Tablero» de `SiteNav` pasa a «Combate».

> **Las tablas `battle_tokens` y `battle_board` NO se borran.** Se quedan vacías y
> sin uso, documentadas como **retiradas**. Borrar tablas es irreversible y no
> gana nada; si algún día vuelve el mapa, siguen ahí. `schema_v22` se marca en la
> documentación como «ejecutada y luego retirada», no se toca el archivo.

**Un concepto que desaparece solo**: `battle_board.active` marcaba «hay combate en
curso». Sin esa tabla, **hay combate si la iniciativa tiene filas**, y vaciarla
—botón que ya existe— lo termina. Una idea menos que mantener.

## Qué ocupa su sitio — `/combate`

- **Izquierda: la lista de combatientes** (`ListaCombatientes`), una fila por
  entrada de `initiative`, ordenada por iniciativa:
  - nombre (el del jugador, o `npc_name`),
  - **PG y condiciones** si es un jugador (de `useParty`, como ya se hace),
  - marca de **«le toca»** en la fila activa,
  - **clic en la fila ⇒ es tu objetivo** (resaltado). **Tu propia fila no es
    elegible** como objetivo, igual que tu ficha no lo era en el tablero: el
    objetivo es para atacar, y curarse se hace desde Estado.
  - Para el DM, los mandos que ya existen: siguiente turno, añadir PNJ, vaciar.
- **Derecha: `PanelCombate`** tal cual — estado, turno y las pestañas de Ataques,
  Conjuros y Rasgos. Solo cambia **de dónde salen los objetivos**.
- **Abajo: `DiceFeedStrip`**, sin cambios.
- Igual que ahora, **funciona sin combate**: sin filas en la iniciativa, la
  izquierda avisa y la derecha sigue entera (curarse, preparar conjuros, rasgos).

## El cambio en las reglas — de medir a deducir

`Objetivo` pierde `distancia`:

```ts
export type Objetivo = {
  /** id de la fila de iniciativa. */
  id: number;
  label: string;
  /** Condiciones del objetivo si es un jugador legible; PNJ ⇒ vacío. */
  conds: string[];
};
```

`lib/targeting.ts` cambia el parámetro `distanciaM: number` por
**`cuerpoACuerpo: boolean`**:

- **`enAlcance` se elimina.** Con la rejilla fuera, un arma de cuerpo se usa en
  cuerpo a cuerpo y una de distancia dispara: no hay nada que bloquear. Se va
  también su comprobación.
- **`ventajaAtacante(condsObjetivo, cuerpoACuerpo)`**: cegado, paralizado,
  petrificado, restringido, aturdido e inconsciente siguen dando ventaja;
  **derribado** da ventaja si `cuerpoACuerpo` y desventaja si no. `apresado` sigue
  sin dar nada.
- **`critProximidad(condsObjetivo, cuerpoACuerpo)`**: `cuerpoACuerpo` y el
  objetivo paralizado o inconsciente.
- `combinar`, `autoFallaSalvacion`, `ventajaSalvacion` y `formulaDaño`
  **no cambian**.

`Ataques.tsx` calcula `cuerpoACuerpo = arma.alcance === "cuerpo"` en el momento de
atacar y se lo pasa. **Desaparece el bloqueo de alcance** y su mensaje.

`Conjuros.tsx` **no cambia de reglas**: sigue solo **nombrando** al objetivo en el
anuncio, como decidimos en O2. Solo se adapta al `Objetivo` sin `distancia`.

## Qué se pierde, dicho claro

- **La medición de movimiento en metros.** El contador de `EconomiaTurno` se
  queda, pero los metros los lleva el DM a ojo, como el resto de la posición.
- **El mapa compartido.** Ya no hay una imagen de la escena en la app.
- **El bloqueo de alcance** como regla impuesta: pasa a ser cosa de la mesa
  (declarar que apuñalas a alguien que está al otro lado de la sala no lo impide
  la app, lo impide el DM). Es coherente con que la app tampoco compare la CA.

## Qué NO entra (a propósito)

- **PG y condiciones de los PNJ**: es la **losa siguiente**, y es la que de verdad
  hace la pelea interactiva (el DM deja de llevar la vida de los monstruos en
  papel). Necesita `initiative` con `hp`/`hp_max`/`conds`, o sea **migración
  `schema_v23`**. Aquí los PNJ se listan solo con su nombre.
- **Borrar las tablas del tablero.**
- **Zonas** (frente/retaguardia) u otra noción de posición: se descartó a favor de
  no tener ninguna.
- Tocar `GrupoPanel`, la ficha, o cualquier regla que no sea la distancia.

## Verificación (el gate real; no hay tests)

- **`check-targeting`** se adapta: fuera las comprobaciones de `enAlcance`, y las
  de `ventajaAtacante`/`critProximidad` pasan de metros a `cuerpoACuerpo`
  (derribado con `true` ⇒ ventaja, con `false` ⇒ desventaja; crítico por
  proximidad solo con `true`).
- **`check-tablero` se borra** con `lib/tablero.ts`. El gate pasa de 11 scripts a
  **10**.
- `npx tsc --noEmit` + `npx next build` limpios.
- Sin regresión: `check-ficha` (11), `check-spells`, `check-conjuros`,
  `check-estado`, `check-turno`, `check-ataque`, `check-clases` (116),
  `check-lore` (69), `check-clima`.
- **No probado en vivo.** **Pruebas del usuario**: entrar en `/combate` sin
  iniciativa y ver que el panel derecho funciona igual; que el DM añada un PNJ a
  la iniciativa y aparezca en la lista del jugador **sin recargar**; elegir
  objetivo tocando una fila y atacar; con el objetivo **derribado**, que un arma
  de cuerpo dé ventaja y un arco desventaja; que «Siguiente turno» mueva la marca
  y limpie la economía del que empieza; y que ya no exista `/tablero` ni la
  pestaña del DM.
