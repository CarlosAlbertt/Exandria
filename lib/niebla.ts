// La niebla del mapa del mundo, como reglas puras.
//
// Módulo neutral (sin "use client" y sin importar nada) a propósito, igual que
// `lib/slug.ts`: así puede mirarlo el gate. Vivía suelta dentro del JSX de
// `/mapa`, y por eso nadie se enteró de que fallaba ABIERTA — un continente sin
// pin quedaba despejado. Es la misma razón por la que `facesFrom` se exporta.

/** Lo mínimo que la niebla necesita saber de un pin de continente. */
export type PinContinente = { revealed: boolean };

/**
 * ¿Ha descubierto el grupo este continente?
 *
 * **Falla cerrado**: sin pin no hay nada que revelar, así que no está
 * descubierto. Lo contrario dejaría entrar a un continente al que se le hubiera
 * caído el pin, y en una niebla el error tiene que ir hacia el lado de esconder.
 */
export function continenteDescubierto(pin: PinContinente | undefined | null): boolean {
  return !!pin?.revealed;
}

/**
 * ¿Se pinta niebla encima de este continente?
 *
 * Es la negación de la anterior **para los dos roles**, y eso es deliberado: al
 * DM también se le pinta, pero translúcida y con «oculto» escrito, que es como
 * ve de un vistazo lo que al grupo le falta. Quien decide la opacidad es la
 * pantalla, no esta regla.
 */
export function hayNiebla(pin: PinContinente | undefined | null): boolean {
  return !continenteDescubierto(pin);
}

/**
 * ¿Se le enseña este continente al jugador (pin, etiqueta, lista lateral)?
 * El DM lo ve todo; el jugador, solo lo descubierto.
 */
export function continenteVisible(pin: PinContinente | undefined | null, isDM: boolean): boolean {
  return isDM || continenteDescubierto(pin);
}

/**
 * Al marcar una región como conocida, ¿hay que descubrir su continente?
 *
 * Sí, y no es comodidad: una región conocida bajo un continente con niebla es
 * **inalcanzable** —el jugador no puede entrar en el continente para verla—, así
 * que el estado se leería como un fallo de la app. Es el mismo escalón que ya
 * hace «Explorada» al poner «Conocida».
 *
 * Solo sube: dejar de conocer una región **no** vuelve a poner la niebla, que
 * taparía las otras regiones del continente de rebote.
 */
export function conocerRegionDescubreContinente(known: boolean): boolean {
  return known;
}
