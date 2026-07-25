# Diseño — G4: Targeting (objetivo de ataque y las reglas que lo necesitan)

Fecha: 2026-07-25 · Rama prevista: `g4-targeting` · **Sin migración.**

## Contexto — cuarta losa de la jugabilidad 2024

G1 (estado del combatiente), G2 (economía de turno + ataque) y G3 (tablero) están
en `master`. G1/G2/G3 dejaron **a propósito** documentadas cuatro reglas que
necesitan un **objetivo** (quién ataca a quién) o el acoplamiento impacto→daño:

1. **Ventaja para el atacante** por la condición del objetivo (cegado, derribado,
   restringido, paralizado, aturdido, inconsciente, petrificado).
2. **Alcance del arma** que bloquee el ataque si no llegas (la distancia ya se
   mide en G3).
3. **Fallo automático de salvación** de Fue/Des por estar paralizado/aturdido/
   inconsciente/petrificado (+ desventaja de Des por restringido, que G1 omitió
   porque el botón no pasaba la característica).
4. **Crítico automático**: 20 natural dobla los dados de daño; y el ataque cuerpo
   a ≤1,5 m contra paralizado/inconsciente es crítico si acierta (RAW 2024).

G4 las entrega. La idea rectora de siempre: la app **aplica** la regla, no solo la
recuerda. Es la primera losa que junta el estado (G1), el ataque (G2) y la
posición (G3).

## Modelo de trabajo — DM presente, sin IA aún

La visión a futuro es que una IA (Ollama) lleve los PNJ para que los jugadores
jueguen desde casa; por ahora **el DM controla los PNJ a mano y está en la mesa**.
Consecuencia de diseño: **no hace falta guardar estado de los PNJ** (condiciones,
PG) en el tablero. La automatización de la regla 1 solo hace falta cuando el
objetivo es un **jugador** (tiene `play_state`); contra un PNJ el DM juzga a ojo,
coherente con todo el resto de la app. **Esto mantiene G4 sin migración.**

## Dónde vive el objetivo — desplegable en la ficha (no clic en el lienzo)

El ataque ya vive en la ficha (`components/personaje/Ataques.tsx`), el tablero es
otra página. G4 **no muda** el ataque al lienzo ni rehace el board: `Ataques`
gana un desplegable de objetivo alimentado por `useBattle` (las fichas del
tablero), con la distancia en vivo desde tu propia ficha. El «sobre el tablero»
del handoff = **usa las posiciones del tablero**, no clicar el lienzo. Se
descarta clicar-en-el-board porque duplicaría la UI de ataque que ya está en la
ficha y sería rework del lienzo para poca ganancia con el DM presente.

## Decisiones (preguntadas antes de escribir el spec)

- **Alcance: bloqueo duro.** Fuera de alcance no deja atacar y no gasta la acción;
  mensaje «Fuera de alcance (X m)». La app impone la regla.
- **Regla 1: auto-o-mesa, sin toggle manual.** La ventaja por condición del
  objetivo dispara automática **solo cuando el cliente puede leer las condiciones
  del objetivo** (siempre en el panel DM vía `useParty`; en el cliente de un
  jugador, solo si RLS comparte el estado del grupo). Cuando no es legible (PNJ, o
  jugador no visible), **no hay auto y el DM juzga** — como el resto. Sin UI extra
  (YAGNI). Si el juego-desde-casa lo pide más adelante, se añade el toggle.
- **Crítico por proximidad: incluido.** Además del 20 natural, el ataque cuerpo a
  ≤1,5 m contra paralizado/inconsciente dobla los dados. Barato con la distancia y
  las condiciones del objetivo ya calculadas.

## Nota sobre «si acierta» — la app nunca compara CA

La app **no** compara la tirada de impacto contra la CA del objetivo: quién
acierta lo juzga la mesa leyendo el feed, como en todo ataque desde G2. Por tanto:

- El **20 natural** siempre produce daño doblado (RAW: impacto automático).
- El **crítico por proximidad** produce daño doblado igualmente; su «si acierta»
  lo resuelve la mesa al aplicar (o no) el daño, exactamente como cualquier tirada
  de daño, que solo «cuenta» si hubo impacto.

El crítico, en la práctica, solo gobierna **si los dados de daño se doblan**. No
se acumula: 20 natural y proximidad a la vez ⇒ un único doblado.

## Capa pura nueva — `lib/targeting.ts`

Pura como `lib/ataque.ts`/`lib/estado.ts` (sin React ni Supabase). Verificada por
`scripts/check-targeting.ts` antes de tocar UI. Las mecánicas son hechos de las
2024; los textos, redacción propia.

```ts
import type { Arma } from "@/data/weapons";

// Ventaja/desventaja que gana EL ATACANTE por la condición del objetivo + la
// distancia. Devuelve flags crudos (sin colapsar) para que la anulación 2024 se
// aplique una sola vez, global, en combinar().
export function ventajaAtacante(
  condsObjetivo: string[],
  distanciaM: number,
): { adv: boolean; dis: boolean } {
  const c = new Set(condsObjetivo);
  let adv = false, dis = false;
  // Atacar a estos es con ventaja (RAW 2024):
  for (const s of ["cegado", "paralizado", "petrificado", "restringido", "aturdido", "inconsciente"])
    if (c.has(s)) adv = true;
  // Derribado: ventaja a ≤1,5 m (cuerpo), desventaja a >1,5 m (distancia).
  if (c.has("derribado")) { if (distanciaM <= 1.5) adv = true; else dis = true; }
  // apresado (grappled) NO da ventaja al atacante.
  return { adv, dis };
}

// Anulación 2024 sobre TODAS las fuentes: tu propia ventaja (envenenado/asustado,
// vía estado.ventajaDe) + la del objetivo. Cualquier adv Y cualquier dis ⇒ recto.
// `propia` ya viene colapsada de ventajaDe; hoy no hay fuentes de ventaja propia,
// así que colapsarla antes es sin pérdida (documentado por si G5+ añade alguna).
export function combinar(
  propia: "adv" | "dis" | null,
  objetivo: { adv: boolean; dis: boolean },
): "adv" | "dis" | null {
  const adv = objetivo.adv || propia === "adv";
  const dis = objetivo.dis || propia === "dis";
  if (adv && dis) return null;
  if (adv) return "adv";
  if (dis) return "dis";
  return null;
}

// ¿El arma llega a esa distancia? Cuerpo ⇒ ≤1,5 m (el catálogo no tiene armas de
// alcance extendido). Distancia ⇒ siempre llega en el tablero (30 m × 18 m por
// defecto; el catálogo no trae normal/largo, y sería inventar SRD — queda fuera).
export function enAlcance(arma: Arma, distanciaM: number): boolean {
  return arma.alcance === "distancia" ? true : distanciaM <= 1.5;
}

// ¿Se auto-falla esta salvación por condición? Fue/Des con paralizado/aturdido/
// inconsciente/petrificado ⇒ fallo automático (no se tira).
export function autoFallaSalvacion(conds: string[], caracteristica: string): boolean {
  if (caracteristica !== "fue" && caracteristica !== "des") return false;
  const c = new Set(conds);
  return ["paralizado", "aturdido", "inconsciente", "petrificado"].some((s) => c.has(s));
}

// Desventaja de la salvación por condición específica de característica. Hoy solo
// restringido ⇒ desventaja en la salvación de Des. (Las genéricas de salvez, si
// las hubiera, siguen en estado.ventajaDe(play,"salvez").)
export function ventajaSalvacion(conds: string[], caracteristica: string): "dis" | null {
  return caracteristica === "des" && conds.includes("restringido") ? "dis" : null;
}

// ¿El ataque es crítico por proximidad? Cuerpo a ≤1,5 m contra objetivo
// paralizado/inconsciente. (El 20 natural va aparte, vía dice.critState.)
export function critProximidad(arma: Arma, condsObjetivo: string[], distanciaM: number): boolean {
  if (arma.alcance !== "cuerpo" || distanciaM > 1.5) return false;
  const c = new Set(condsObjetivo);
  return c.has("paralizado") || c.has("inconsciente");
}
```

El crítico **no** necesita función de detección nueva: `dice.critState(formula,
rolls)` ya deduce el 20 natural respetando ventaja/desventaja. G4 solo construye
la fórmula de daño doblada (dados ×2, mod sin doblar): `1d8+3` → `2d8+3`. Un
helper `formulaDañoCrit(dado, mod)` en `targeting.ts` o inline en `Ataques`.

## Cableado 1 — `components/personaje/Ataques.tsx` (ataque con objetivo)

- Monta `useBattle()` → tokens + board. Encuentra **tu propia** ficha por
  `token.user_id === userIdPropio` (nuevo prop `ownUserId`, que la hoja ya conoce:
  `targetUserId`).
- **Desplegable de objetivo**: las demás fichas (`label`), con la distancia en
  vivo a cada una (`distanciaMetros(tuFicha, objetivo, cols, rows)`). Por defecto
  sin objetivo.
- Condiciones del objetivo: si el objetivo es un **jugador** (`token.user_id`),
  se leen de `useParty` (mapeo `user_id → character.play_state.conds`) cuando el
  cliente las tiene; PNJ o no legible ⇒ `[]`.
- **Al atacar** (`atacar()`):
  1. Distancia = ficha propia → objetivo. Sin ficha propia o sin objetivo ⇒
     distancia desconocida ⇒ **degrada a G2** (solo `ventajaDe(play,"ataque")`,
     sin bloqueo de alcance ni ventaja de objetivo).
  2. **Alcance**: `enAlcance(arma, distanciaM)` falso ⇒ mensaje «Fuera de alcance
     (X m)», **no** publica ni gasta la acción. `return`.
  3. **Ventaja**: `combinar(ventajaDe(play,"ataque"), ventajaAtacante(condsObj,
     distanciaM))` → pasa a `publishRoll("attack", …, { adv })`.
  4. **Impacto**: `publishRoll` devuelve `result`. `dice.critState(result.formula,
     result.rolls) === "crit"` **o** `critProximidad(arma, condsObj, distanciaM)`
     ⇒ crítico.
  5. **Daño**: fórmula normal, o doblada si crítico. `publishRoll("custom", …)`.
     La etiqueta dice por qué es crítico («20 natural» / «objetivo indefenso»).
  6. `onChange(gastar(play,"accion"))`.
- Degrada: sin `useBattle`/tablero (o `missing`) ⇒ el desplegable no aparece y el
  ataque cae al comportamiento G2 exacto. Nada revienta.

## Cableado 2 — `components/CharacterSheet.tsx` (salvaciones)

Los botones de salvación ya iteran `ABILITIES` con `a.key` (fue/des/con/int/sab/
car) — la característica **ya está** en el sitio de la llamada
(`CharacterSheet.tsx:662-677`). El handler pasa a:

- `autoFallaSalvacion(playState.conds ?? [], a.key)` verdadero ⇒ publica una
  tirada `"save"` etiquetada «Salvación de X: fallo automático» **sin tirar**
  (fórmula fija que refleje el fallo, p. ej. `total` bajo o una nota; se decide en
  el plan cómo representarlo en el feed sin romper `critState`/animación).
- Si no auto-falla: la ventaja pasa a ser
  `combinar(ventajaDe(playState,"salvez"), { adv:false, dis: ventajaSalvacion(
  conds, a.key) === "dis" })` — es decir, la desventaja de Des por restringido se
  suma a lo que ya hubiera. (Hoy `ventajaDe(...,"salvez")` no devuelve nada porque
  ninguna condición da desventaja genérica de salvación; el gancho queda listo.)

Esto **cierra** la omisión honesta que G1 dejó anotada (restringido → salvación de
Des con desventaja) sin sobre-aplicar: solo Des, solo restringido.

## Qué NO entra (fuera de alcance, a propósito)

- **Estado de los PNJ en el tablero** (condiciones/PG por token): el DM los lleva
  a mano. Entraría con la IA-Ollama o si el juego-desde-casa lo pide.
- **Toggle manual de ventaja** en `Ataques`: descartado ahora (YAGNI); la regla 1
  es auto-o-mesa.
- **Comparar la tirada de impacto contra la CA**: la app no resuelve el impacto;
  la mesa lo juzga. Se mantiene desde G2.
- **Alcance normal/largo de armas a distancia** (desventaja más allá del normal):
  el catálogo no trae esos metros y sería inventar SRD; en un tablero de 30 m casi
  siempre se llega. Refinamiento futuro si se añade la data.
- **Alcance extendido cuerpo** (armas de 3 m): no hay ninguna en el catálogo de 12
  armas; `enAlcance` usa 1,5 m fijo para cuerpo. Trivial de extender si se añade.

## Verificación (el gate real; no hay tests)

- **`scripts/check-targeting.ts`** (capa pura primero): `ventajaAtacante` por cada
  condición y el caso distancia de derribado (≤1,5 adv, >1,5 dis); `combinar` con
  la anulación 2024 (adv+dis global ⇒ null, incl. blinded+prone a distancia);
  `enAlcance` cuerpo/distancia en ambos lados de 1,5 m; `autoFallaSalvacion` (Fue/
  Des sí, otras no; cada condición); `ventajaSalvacion` (solo Des+restringido);
  `critProximidad` (cuerpo ≤1,5 vs paralizado/inconsciente sí, distancia o >1,5
  no).
- `npx tsc --noEmit` + `npx next build` limpios.
- Sin regresión: `check-estado` (35), `check-turno`, `check-ataque`,
  `check-tablero`, `check-clases` (116), `check-lore` (69).
- **No probado en vivo** (sin sesión ni tablas del tablero en dev). Pruebas del
  usuario (tras desplegar): atacar con daga a un objetivo a 6 m ⇒ bloqueado;
  acercar la ficha a ≤1,5 m ⇒ deja atacar; poner al objetivo (un jugador)
  derribado y atacar a quemarropa ⇒ ventaja; a distancia ⇒ desventaja; sacar un 20
  natural ⇒ daño doblado; atacar cuerpo a un jugador inconsciente a quemarropa ⇒
  daño doblado; con un personaje paralizado, tirar salvación de Fuerza ⇒ fallo
  automático; salvación de Destreza estando restringido ⇒ desventaja.
