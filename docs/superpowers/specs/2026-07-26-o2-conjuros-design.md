# Diseño — O2: Conjuros (preparar, gastar huecos y lanzar)

Fecha: 2026-07-26 · Rama prevista: `o2-conjuros` · **Sin migración.**

## Contexto — la Fase O se cierra con los conjuros

La **Fase O1** (recursos de clase: los pozos de usos) está en `master` desde el
2026-07-21. **O2** es la otra mitad: el motor de **conjuros** — preparar, gastar
**huecos** (espacios) y **lanzar**. El estado va en `characters.play_state`, la
**misma columna jsonb** de O1/G1/G2/G3, con las claves nuevas `huecos`,
`preparados` y `concentrando`. **Sin migración** (el tipo `PlayState` ya anticipa
«La Fase O2 añadirá `huecos`/`preparados`»).

La idea rectora de siempre: la app **aplica** la regla. Aquí eso es gastar el
hueco correcto, respetar el tope de preparados, y ofrecer la tirada del conjuro
cuando la tiene.

### Lo que ya existe (no se rehace)

- **`data/classdata/spellSlots.ts`**: tablas `FULL_CASTER_SLOTS`,
  `HALF_CASTER_SLOTS`, `PACT_SLOTS` y `slotsFor(caster, level)` → la fila de
  espacios. Hecho.
- **`lib/derive.ts`**: si es conjurador, ya calcula `spellDc` (8+comp+mod),
  `spellAttack` (comp+mod) y `spellSlots` (los máximos). Hecho.
- **`data/classdata/*.ts`**: cada clase conjuradora declara `caster`
  (full/half/pact), `spellAbility`, y **columnas de referencia** ya presentes:
  **«Trucos»** (7 clases; paladín y explorador no tienen) y **«Conjuros
  preparados»** (las 8). Los topes por nivel **ya son datos**.
- **`lib/recursos.ts`**: el patrón `gastar/devolver/recargar` que **fusiona**
  `play_state` sin pisar otras claves. O2 lo calca para los huecos.
- **8 clases conjuradoras**: bardo, clérigo, druida, hechicero, mago (full);
  paladín, explorador (half); brujo (pact). Cazador de sangre es `none` (sus
  conjuros de subclase quedan fuera, como los pozos de subclase en O1).

### Lo que O2 añade

Los **datos de conjuros** (no existen), el **motor puro** de huecos/preparados/
concentración, el **lanzamiento** (anuncio al feed + tirada si aplica), la **UI**
de conjuros en la ficha y el Panel DM, y la integración con el **descanso**.

## Decisiones (preguntadas antes de escribir el spec)

- **Contenido: semilla + crecer** (modelo bestiario/atlas). Se construye el motor
  y la UI completos, y se siembra `data/spells.ts` con un set curado (~30-40: los
  trucos de las clases del grupo + conjuros icónicos de nivel 1-3). **Crece sesión
  a sesión**; no se escribe el SRD entero de golpe (riesgo de estancarse como el
  bestiario). Los datos son hechos; las descripciones, **redacción propia** en
  español.
- **Lanzar = gasta hueco/truco + anuncia al feed + tira si aplica.** Si el conjuro
  de la semilla trae efecto (`attack`/`damage`/`save`), se ofrece la tirada (reusa
  `publishRoll`, como G2); si no, solo anuncia. **No** hay motor de efectos por
  conjuro completo.
- **Preparar/despreparar libre** hasta el tope (no se fuerza «solo al descansar»:
  juego en casa, honesto). El tope de trucos y el de preparados salen de las
  columnas que ya existen.
- **Ritual**: los conjuros marcados `ritual` se pueden lanzar **sin gastar hueco**
  (botón aparte).
- **Concentración**: marcador de **una a la vez**; lanzar un conjuro de
  concentración reemplaza el anterior. La **salvación de Constitución al recibir
  daño** queda fuera (no se auto-aplica).

## Almacenamiento — `characters.play_state` (sin migración)

Se añaden al tipo `PlayState` (`lib/recursos.ts`) tres claves opcionales:

```ts
  /** Huecos de conjuro GASTADOS por nivel de espacio: { "1": 2, "3": 1 }. */
  huecos?: Record<string, number>;
  /** Ids de conjuro preparados/conocidos (trucos + niveles), de data/spells. */
  preparados?: string[];
  /** Id del conjuro de concentración activo, o ausente si ninguno. */
  concentrando?: string;
```

Como en O1, se guarda **lo gastado, no lo restante**: el máximo depende del nivel,
así que al subir de nivel los huecos nuevos llegan solos. Todas las escrituras
**fusionan** sobre `play_state`, nunca reemplazan el jsonb.

## Datos — `data/spells.ts`

```ts
import type { AbilityKey } from "@/data/rules";

export type Spell = {
  id: string;             // slug único (p. ej. "rayo-de-fuego")
  name: string;           // nombre en español
  level: number;          // 0 = truco (cantrip); 1..3 en la semilla
  school: string;         // escuela ("Evocación", "Abjuración"…)
  classes: string[];      // slugs de clase que lo tienen en su lista
  time: string;           // "1 acción" | "1 acción adicional" | "1 reacción" | "1 minuto"…
  range: string;          // "18 m" | "Toque" | "Personal"…
  components: string;     // "V, S, M (una pizca de azufre)"
  duration: string;       // "Instantáneo" | "Concentración, hasta 1 minuto"…
  concentration?: boolean;
  ritual?: boolean;
  desc: string;           // resumen PROPIO en español (nunca prosa del libro)
  // Efecto opcional, solo para el botón «Lanzar» (los que no lo traen solo anuncian):
  attack?: boolean;                       // tirada de ataque de conjuro
  save?: AbilityKey;                      // salvación que provoca ("des"…)
  damage?: { dice: string; type: string }; // daño base, p. ej. { dice: "1d10", type: "fuego" }
};

export const SPELLS: Record<string, Spell> = { /* semilla curada */ };

/** Los conjuros que una clase puede preparar/conocer, ordenados por nivel y nombre. */
export function spellsForClass(clsSlug: string): Spell[];
/** Un conjuro por id, o null. */
export function spellById(id: string): Spell | null;
```

**Nota de escalado**: `damage.dice` es el dado **base** (nivel mínimo del conjuro).
El escalado de trucos por nivel de personaje y el de conjuros por hueco superior
(upcast) **no se automatiza** en esta losa — la `desc` lo explica y la mesa lo
aplica. (Futuro, cuando la semilla crezca.)

## Motor puro — `lib/conjuros.ts` (+ `scripts/check-conjuros.ts`)

Puro como `recursos.ts`/`estado.ts`. Fusiona `play_state`, **nunca toca** `usos`,
`hp`, `conds`, `turno`. Verificado por `check-conjuros.ts` **antes** de la UI.

```ts
import type { PlayState } from "@/lib/recursos";
import type { CasterKind } from "@/data/classdata/types";

export type HuecoNivel = { nivel: number; max: number; gastados: number; quedan: number };

/** Filas de huecos del personaje (solo los niveles con max>0), desde slotsFor. */
export function huecosDe(caster: CasterKind, level: number, play: PlayState): HuecoNivel[];

/** Gasta un hueco de ese nivel (tope max). No baja de otros niveles. */
export function gastarHueco(play: PlayState, nivel: number, max: number): PlayState;
/** Devuelve un hueco de ese nivel (suelo 0). */
export function devolverHueco(play: PlayState, nivel: number): PlayState;

/** Descanso: largo restaura todos los huecos; corto restaura SOLO los de pacto (brujo). */
export function recargarHuecos(play: PlayState, caster: CasterKind, tipo: "corto" | "largo"): PlayState;

/** Tope de conjuros preparados y de trucos, de las columnas de la clase (0 si no hay). */
export function topePreparados(clsSlug: string, level: number): number;
export function topeTrucos(clsSlug: string, level: number): number;

/** Cuántos trucos / conjuros de nivel hay preparados ahora (partiendo por spell.level). */
export function cuentaTrucos(play: PlayState): number;
export function cuentaPreparados(play: PlayState): number;

/** Prepara/desprepara un conjuro. `preparar` respeta el tope correspondiente
 *  (trucos vs preparados según su nivel); si está lleno, devuelve `play` sin cambio. */
export function preparar(play: PlayState, spellId: string, capTrucos: number, capPrep: number): PlayState;
export function despreparar(play: PlayState, spellId: string): PlayState;

/** Fija (o limpia con null) el conjuro de concentración activo. */
export function setConcentracion(play: PlayState, spellId: string | null): PlayState;
```

- **Pacto (brujo)**: `slotsFor("pact", level)` ya devuelve la fila expandida (un
  solo nivel con `count`). `huecosDe` la trata igual que las demás; `recargarHuecos`
  con `"corto"` restaura solo esa fila cuando `caster === "pact"`.
- **`cuentaTrucos`/`cuentaPreparados`** miran `spellById(id).level` para partir la
  lista `preparados` entre trucos (nivel 0) y conjuros (nivel ≥1), y así comparar
  contra el tope correcto.

## Lanzar — anuncio + tirada (reusa `publishRoll`)

Al pulsar «Lanzar» sobre un conjuro preparado (UI, no motor puro):

1. **Nivel de lanzamiento (upcast)**: si el conjuro es de nivel N≥1, se elige el
   nivel de hueco (≥ N, con `quedan>0`) que se gasta; por defecto N. Los **trucos**
   (nivel 0) no gastan hueco. Los **rituales** se pueden lanzar sin hueco (botón
   «Ritual»).
2. **Gasto**: `gastarHueco(play, nivelElegido, max)` (salvo truco/ritual).
3. **Concentración**: si `spell.concentration`, `setConcentracion(play, id)`
   (reemplaza el anterior).
4. **Feed**:
   - Con `attack`: `publishRoll("attack", "Conjuro: <nombre>", "1d20", { mod: spellAttack })`
     (la ventaja de G1 no aplica a conjuros por defecto; se deja recto).
   - Con `save`: **anuncio** «Conjuro: <nombre> · salvación de <car.> CD <spellDc>».
   - Con `damage` (además de lo anterior): `publishRoll("custom", "Daño: <nombre>", "<dado>")`.
   - Sin efecto (utilidad): **anuncio** «Lanza <nombre> (nivel N)».

El **anuncio sin dado** entra al feed como una **nota**: fila con `rolls: []`,
`total: 0`. Esto necesita un **retoque mínimo** en `DicePanel.tsx` para pintar las
notas con solo la etiqueta (una chapa «conjuro»), sin el desglose «[] = 0», y para
que el aviso emergente diga «X lanza …» en vez de «ha sacado 0». Se añade un helper
`publishNote(userId, label)` en `lib/useDiceFeed.ts` (inserta `kind: "custom"`,
`formula: ""`, `rolls: []`, `total: 0`). Reutilizable por G-futuros (el auto-fallo
de G4 podría migrar a esto).

## UI — `components/personaje/Conjuros.tsx` (molde de `PozosClase`)

Solo si la clase es conjuradora (`caster !== "none"`). Secciones:

- **Cabecera**: CD de conjuro y ataque de conjuro (de `derive`), y el conjuro de
  **concentración** activo (con botón para soltarlo).
- **Huecos**: una fila por nivel de espacio con **chapas pulsables** (un toque
  gasta, un toque en una gastada la devuelve), cuántos quedan. Patrón de
  `PozosClase`. El brujo muestra su fila de pacto (recarga en descanso corto).
- **Trucos**: los trucos preparados, cada uno con «Lanzar».
- **Conjuros preparados** por nivel, cada uno con «Lanzar» (que abre el selector de
  nivel de hueco si aplica) y una chapa si es de concentración o ritual.
- **Selector «Preparar»**: navega `spellsForClass(cls)` agrupado por nivel; marca/
  desmarca hasta el tope (contador «preparados X/Y», «trucos X/Y»). Guardado
  optimista (mismo patrón que `onPlayStateChange`).

Montado en la **hoja** (`CharacterSheet.tsx`, sección propia) y en **Panel DM ›
Grupo** (`GrupoPanel.tsx`, contadores bajo cada jugador). Como en O1/G-, el
guardado va por `onPlayStateChange` (self → `saveCharacter`; DM → `/api/dm/character`
op `setUses`/`play_state`).

## Descanso — `app/api/descanso/route.ts`

El descanso ya recarga los `usos` de O1 y devuelve el `play_state` nuevo. Se
extiende para **restaurar los huecos** en la misma pasada: largo restaura todos,
corto solo los de pacto. Se aplica `recargarHuecos` al `play_state` junto a la
recarga de pozos, sin tocar otras claves.

## Qué NO entra (fuera de alcance, a propósito)

- **La biblioteca SRD entera**: la semilla crece como el bestiario.
- **Motor de efectos por conjuro completo** (resolver condición/curación/área):
  la mesa lo aplica con la `desc` y la CD/ataque delante.
- **Escalado automático**: trucos por nivel de personaje y daño por hueco superior
  (upcast) — la `desc` lo dice, la mesa lo aplica.
- **Salvación de Constitución por daño** para la concentración (marcador manual).
- **Rituales con temporizador** (los 10 minutos): botón que no gasta hueco, sin
  reloj.
- **Conjuros de subclase / dotes** y el libro de conjuros del mago como inventario
  aparte (prepara de la lista de clase).

## Verificación (el gate real; no hay tests)

- **`scripts/check-conjuros.ts`** (capa pura primero): `huecosDe` para full/half/
  pact a varios niveles (columnas correctas, solo niveles con max>0);
  `gastarHueco`/`devolverHueco` (topes y suelo, no tocan otros niveles);
  `recargarHuecos` (largo todo, corto solo pacto); `topePreparados`/`topeTrucos`
  (valores de las columnas, 0 para paladín/explorador en trucos);
  `cuentaTrucos`/`cuentaPreparados` (partición por nivel); `preparar` (respeta cada
  tope, no duplica), `despreparar`, `setConcentracion`; y que **ninguna** toca
  `usos`/`hp`/`conds`/`turno`.
- `npx tsc --noEmit` + `npx next build` limpios.
- Sin regresión: `check-clases` (116, las columnas de las clases no cambian),
  `check-estado` (36), `check-targeting` (49), `check-turno`, `check-ataque`,
  `check-tablero`, `check-lore` (69).
- **No probado en vivo** (sin sesión en dev). **Pruebas del usuario** (tras
  desplegar): con un mago nv3, preparar hasta el tope y ver que no deja pasarse;
  gastar un hueco de nivel 1 y ver que persiste al recargar; lanzar un truco de
  ataque y ver la tirada con el ataque de conjuro; lanzar un conjuro de nivel 1 en
  un hueco de nivel 2 (upcast) y ver que gasta el de 2; descanso largo restaura
  todos los huecos, corto no (salvo brujo); lanzar un conjuro de concentración y
  ver el marcador, lanzar otro y ver que lo reemplaza.
