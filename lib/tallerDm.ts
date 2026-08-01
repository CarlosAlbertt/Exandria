// El modo DM de los talleres: la caja de arena con la que el máster prueba un
// oficio **sin ficha y sin la pericia**.
//
// Vive aparte del caldero a propósito. Hoy solo alquimia está construida, pero
// los otros cinco talleres llegarán, y si el modo DM naciera dentro de
// `Caldero.tsx` cada taller nuevo tendría que volver a inventárselo — o nacería
// sin él, que es exactamente por lo que alquimia llevaba tres tandas desplegada
// sin que nadie pudiera mirarla: el DM no tiene personaje, así que se quedaba en
// la primera puerta del caldero.
//
// Capa pura, sin React: `scripts/check-recetas.ts` la comprueba sin montar
// pantalla.

/**
 * Lo que el DM decide antes de tirar. No hay ficha de la que sacar el
 * modificador, así que lo pone él: `derive` necesita un personaje y aquí no lo
 * hay.
 */
export type ModoDm = {
  /** El modificador con el que se tira, en lugar del que daría la pericia. */
  mod: number;
};

export const MOD_DM_MIN = -5;
export const MOD_DM_MAX = 20;

/**
 * Acota el modificador que teclea el DM.
 *
 * El guardia de `Number.isFinite` no es de más: el `input` devuelve `""` cuando
 * se borra el campo, `Number("")` es `0` pero `Number("+")` es `NaN`, y un `NaN`
 * se propagaría hasta el total de la tirada —`NaN >= cd` es `false`—, así que
 * **todas las recetas fallarían sin decir por qué**. Ante un valor imposible,
 * 0: tirar a pelo se entiende, una tirada que nunca sale no.
 */
export function modDmValido(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(MOD_DM_MIN, Math.min(MOD_DM_MAX, Math.trunc(n)));
}
