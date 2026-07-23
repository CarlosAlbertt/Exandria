# Diseño — G2: Economía de turno y ataque desde la ficha

Fecha: 2026-07-24 · Rama prevista: `g2-economia-turno` · **Sin migración.**

## Contexto — segunda losa de la jugabilidad 2024

G1 dejó el estado del combatiente (PG, muerte, condiciones) y **cableó
`ventajaDe(play, "ataque")` sin consumidor** — no había tirada de ataque desde la
ficha. G2 cierra el turno de combate: sabes **qué te queda por hacer** (economía
de acción/adicional/reacción/movimiento) y **atacas desde la hoja** con la
característica correcta, la competencia derivada y la ventaja de tus condiciones.

Piezas que ya existen y se reutilizan:
- **Iniciativa** (`schema_v11`, `lib/useInitiative.ts`, `components/InitiativeTracker.tsx`):
  filas con `active` (turno actual) y «Siguiente turno» que rota. `initiative`
  está en la publicación realtime.
- **`ventajaDe(play, tipo)`** (`lib/estado.ts`, G1): el resolvedor de
  (des)ventaja; el tipo `"ataque"` ya está soportado y sin usar.
- **`derive.ts`**: mods de característica, bono de competencia, velocidad.
- **`publishRoll(userId, kind, label, formula, { mod, adv })`**
  (`lib/useDiceFeed.ts`): ya acepta `adv` y anima el tablero físico.
- **`data/equipment.ts` `CATALOG.Armas`**: los 12 nombres de arma (solo nombres,
  sin stats — G2 añade la tabla de stats).
- **`data/classdata/*.ts`**: cada clase declara `weapons: ["sencillas"]` o
  `["sencillas", "marciales"]` — de ahí sale la competencia con el arma.

La losa es independiente; depende de G1 + iniciativa, ambos en `master`. Siguen
**G3 — tablero** (posiciones, alcance real, crítico auto) y **O2 — conjuros**.

## Decisiones del usuario

1. **Alcance**: A **+** B — el marcador de economía de turno **y** la tirada de
   ataque desde la ficha.
2. **Reset de la economía**: **automático** al tocarte el turno (cuando la
   iniciativa te pone `active`). Se permite además el toque manual sobre cada
   recurso (cubre «gasté la reacción en el turno de otro»), que no cuesta nada.
3. **Ataque**: **impacto + daño** con la característica correcta. Cuerpo→Fuerza,
   distancia→Destreza, sutil→la mejor de las dos. Impacto = d20 + mod +
   competencia (si eres competente con esa categoría de arma), con la ventaja de
   G1; daño = dado del arma + mod. Gasta la acción.
4. **Competencia derivada**: de `classdata.weapons` × la categoría del arma. No
   se pregunta ni se guarda aparte.

## Modelo de datos — sin migración

Todo en `characters.play_state` (jsonb), la columna de la Fase O. **Una clave
nueva**, fusiona, **no toca `usos`/`hp`/`conds`** (O1/G1):

```ts
export type PlayState = {
  // ...usos (O1), hp/tempHp/muerte/conds/agotamiento (G1)...
  turno?: {
    accion?: boolean;      // acción gastada
    adicional?: boolean;   // acción adicional gastada
    reaccion?: boolean;    // reacción gastada
    movGastado?: number;   // metros ya movidos este turno (0 = fresco)
  };
  [otros: string]: unknown;
};
```

Se guarda **lo gastado** (filosofía O1/G1). «Limpiar turno» = borrar la clave
`turno`. La reacción vuelve al inicio de tu turno (RAW 2024), así que se limpia
con el resto. `turno` ausente ⇒ turno fresco (nada gastado). `PlayState` se
amplía en `lib/recursos.ts`.

## Arquitectura

### 1. Datos de armas (`data/weapons.ts`, nuevo)

Las stats son **hechos** de las 2024 (no prosa; la convención de redacción propia
aplica a descripciones, no a un dado de daño). Tabla keyed por los nombres de
`CATALOG.Armas`:

```ts
export type Arma = {
  nombre: string;          // = nombre del catálogo, p. ej. "Espada larga"
  categoria: "sencilla" | "marcial";
  dado: string;            // "1d8" (formato de lib/dice.ts)
  tipo: "cortante" | "perforante" | "contundente";
  alcance: "cuerpo" | "distancia";
  sutil?: boolean;         // finesse: elige la mejor de Fue/Des
  versatil?: string;       // dado a dos manos, p. ej. "1d10" (informativo)
};

export const ARMAS: Record<string, Arma>;   // las 12 de CATALOG.Armas
export function armaDe(nombre: string): Arma | null;
```

Las 12 con sus stats 2024:

| Arma | Categoría | Dado | Tipo | Alcance | Sutil | Versátil |
|---|---|---|---|---|---|---|
| Daga | sencilla | 1d4 | perforante | cuerpo | sí | — |
| Espada corta | marcial | 1d6 | perforante | cuerpo | sí | — |
| Espada larga | marcial | 1d8 | cortante | cuerpo | — | 1d10 |
| Hacha de mano | sencilla | 1d6 | cortante | cuerpo | — | — |
| Maza | sencilla | 1d6 | contundente | cuerpo | — | — |
| Bastón | sencilla | 1d6 | contundente | cuerpo | — | 1d8 |
| Arco corto | sencilla | 1d6 | perforante | distancia | — | — |
| Arco largo | marcial | 1d8 | perforante | distancia | — | — |
| Ballesta ligera | sencilla | 1d8 | perforante | distancia | — | — |
| Lanza | sencilla | 1d6 | perforante | cuerpo | — | 1d8 |
| Martillo de guerra | marcial | 1d8 | contundente | cuerpo | — | 1d10 |
| Cimitarra | marcial | 1d6 | cortante | cuerpo | sí | — |

> **Nota de mesa**: el arco corto es sencillo en 2024 (lo era marcial en algunas
> ediciones); se toma la 2024. `versatil` es informativo en G2 (no hay elección
> de una/dos manos todavía); el ataque usa `dado`.

### 2. Economía de turno (`lib/turno.ts`, nuevo)

Puro sobre `PlayState`, molde de `lib/recursos.ts`/`lib/estado.ts`. Fusiona, no
toca `usos`/`hp`/`conds`.

```ts
export type Recurso = "accion" | "adicional" | "reaccion";

export function turnoDe(play: PlayState): { accion: boolean; adicional: boolean; reaccion: boolean; movGastado: number };
export function gastar(play: PlayState, r: Recurso): PlayState;      // marca gastado
export function devolver(play: PlayState, r: Recurso): PlayState;    // desmarca
export function alternarRecurso(play: PlayState, r: Recurso): PlayState; // toque manual
export function mover(play: PlayState, metros: number, velocidad: number): PlayState; // suma a movGastado, techo velocidad, suelo 0
export function movRestante(play: PlayState, velocidad: number): number; // velocidad - movGastado, suelo 0
export function limpiarTurno(play: PlayState): PlayState;            // borra la clave `turno`
```

`gastar`/`devolver` fijan el booleano; `alternarRecurso` lo invierte (para la UI
pulsable). `mover(play, +n)` avanza y `mover(play, -n)` deshace, siempre en
`[0, velocidad]`. `limpiarTurno` hace `delete next.turno`.

**Verificación** (`scripts/check-turno.ts`): gastar/devolver/alternar cada
recurso; `mover` topa en velocidad y no baja de 0; `movRestante` correcto;
`limpiarTurno` borra la clave y **no** toca `usos`/`hp`/`conds`; turno ausente ⇒
todo libre y `movGastado` 0.

### 3. Cálculo de ataque (`lib/ataque.ts`, nuevo)

Puro. Traduce un arma + la ficha derivada en los números del ataque.

```ts
export type Ataque = {
  caracteristica: "fue" | "des";  // la usada
  modImpacto: number;             // mod + (prof si competente)
  competente: boolean;
  dadoDaño: string;               // el dado del arma, "1d8"
  modDaño: number;                // el mod de característica
};

// abilities: los mods derivados (de derive.ts); prof: bono de competencia;
// classWeapons: classdata.weapons de la clase del PJ.
export function ataqueDe(
  arma: Arma,
  abilities: { fue: number; des: number },
  prof: number,
  classWeapons: ("sencillas" | "marciales")[],
): Ataque;
```

Reglas 2024:
- **Característica**: `distancia` ⇒ Des; `cuerpo` sin `sutil` ⇒ Fue; `sutil` ⇒ la
  **mejor** de Fue/Des (por su mod).
- **Competente**: `arma.categoria === "sencilla"` ⇒ `classWeapons.includes("sencillas")`;
  `"marcial"` ⇒ `classWeapons.includes("marciales")`.
- **Impacto**: `mod + (competente ? prof : 0)`.
- **Daño**: `dadoDaño = arma.dado`, `modDaño = mod` (misma característica).

**Verificación** (`scripts/check-ataque.ts`): la espada larga (marcial, cuerpo)
usa Fue y es competente para el guerrero (`["sencillas","marciales"]`) e
incompetente para el mago (`["sencillas"]`); el arco corto (sencilla, distancia)
usa Des; la daga (sutil) elige la mejor de Fue/Des; el impacto suma prof solo si
competente; el modDaño = mod de la característica elegida.

### 4. UI — economía de turno (`components/personaje/EconomiaTurno.tsx`, nuevo)

Contrato de `PozosClase`/`EstadoVivo`: `{ play, velocidad, onChange, readOnly }`.

- Tres chapas pulsables (Acción, Adicional, Reacción): gastada = rellena en color
  de alarma, libre = contorno (patrón de las condiciones de G1). Toque =
  `alternarRecurso`.
- **Movimiento**: muestra `movRestante / velocidad` m, con botones −/+ (paso de
  1,5 m, la casilla 2024) que llaman a `mover`. Sin tablero, es un contador
  manual; útil igualmente para no pasarte.
- `readOnly` desactiva los controles.

Se monta en `CharacterSheet`, en la sección «Estado de combate» (junto a
`EstadoVivo`), reutilizando `onPlayStateChange`.

### 5. UI — ataques (`components/personaje/Ataques.tsx`, nuevo)

`{ play, items, abilities, prof, classWeapons, velocidad?, onChange, session, readOnly }`
— o el subconjunto que necesite; el componente cruza los `items` del inventario
con `ARMAS` (`armaDe(item.name)`) y lista las **armas equipadas/en inventario**.

Por cada arma:
- Nombre, característica usada, «competente» o no, y el desglose (impacto
  `+N`, daño `dado+M`).
- Botón **Atacar**: si hay sesión, tira **impacto** con
  `publishRoll(session.id, "attack", `Ataque: ${arma.nombre}`, "1d20", { mod: modImpacto, adv: ventajaDe(play, "ataque") ?? undefined })`
  y a continuación el **daño** con
  `publishRoll(session.id, "custom", `Daño: ${arma.nombre}`, `${dadoDaño}${modDaño >= 0 ? "+" : ""}${modDaño}`)`.
  Al atacar, marca la **acción** gastada vía `onChange(gastar(play, "accion"))`.
- Si la acción ya está gastada, el botón avisa (deshabilitado o con aviso) —
  atacar dos veces requiere desmarcar la acción (Extra Attack queda fuera, ver
  YAGNI).

> **Kinds sin cambios**: `"attack"` **ya existe** en `RollKind` y **ya está** en
> `D20_KINDS` (`lib/useDiceFeed.ts:9,27`), así que el impacto anima como d20 y
> aplica `adv`. El daño es una **fórmula** (`1d8+3`), no un chequeo d20: va con el
> kind `"custom"` que ya existe, y `publishRoll` la resuelve con `roll()` (no
> entra en `D20_KINDS`). No se añade ningún `RollKind`.

### 6. Reset automático al tocarte el turno (`CharacterSheet.tsx`)

La hoja `self` se suscribe a **su fila de `initiative`** (`user_id=eq.<uid>`);
`initiative` ya está en la publicación realtime (`schema_v11`), sin migración. Un
`useRef` guarda el `active` previo; cuando pasa de `false`→`true` (empieza tu
turno), se llama a `onPlayStateChange(limpiarTurno(playState))`. Solo en la
transición, no en cada evento. Mismo patrón que la suscripción de estado de G1.

### 7. Panel DM (`app/dm/GrupoPanel.tsx`)

Bajo cada jugador, `EconomiaTurno` y `Ataques` en modo escritura vía `dmPatch`
(play_state completo, snapshot fresco de `useParty`, conserva las demás claves).
El DM puede ajustar la economía o disparar un ataque de un PJ. El reset
automático es cosa de la hoja del jugador (el DM no necesita reaccionar a su
propia iniciativa aquí).

## Qué NO entra en G2 (YAGNI)

- **Ataques múltiples** (Extra Attack del guerrero, etc.): atacar marca la acción
  y ya; si tienes ataque extra, desmarca la acción para volver a atacar.
- **Crítico automático** (doblar dados al sacar 20 natural en impacto): requiere
  leer el resultado del feed → losa aparte si se quiere.
- **Alcance y posiciones reales** (¿llego al enemigo?, ¿tengo cobertura?): → G3
  (tablero). El movimiento de G2 es un contador manual sin rejilla.
- **Elección una/dos manos** (versátil): el dado versátil es informativo; el
  ataque usa el dado a una mano.
- **Munición, cargar la ballesta, alcance largo/corto**: fuera.
- **Reset de recursos de clase** (pozos de O1) al descansar: ya lo hace el
  descanso; el turno no lo toca.

## Verificación

`npx tsc --noEmit` + `npx next build` limpios · `scripts/check-turno.ts` y
`scripts/check-ataque.ts` en verde · `check-estado.ts` (35), `check-clases.ts`
(116) y `check-lore.ts` (69) sin regresión. **No probable en vivo sin sesión**:
prueba del usuario al cerrar — gastar la acción atacando y ver que se marca;
«Siguiente turno» hasta que te toque y ver la economía limpia sin recargar;
atacar con un arma competente vs una que no lo es y ver la diferencia en el
impacto; envenenado ⇒ el ataque sale 2d20 la peor.
