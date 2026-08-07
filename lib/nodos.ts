// Dónde está cada jugador y adónde puede ir, como reglas puras.
//
// Módulo neutral (sin "use client" y sin Supabase) igual que `lib/niebla.ts` y
// `lib/misiones.ts`: la niebla falló ABIERTA durante semanas porque su regla
// vivía dentro de un `.map` y no había forma de comprobarla. Aquí lo que está
// en juego es que una tarjeta no lleve a ninguna parte, o que moverse no tenga
// efecto — dos fallos que no gritan.

import type { Nodo } from "@/data/lugares";

/** Índice por id, que es como se consulta el grafo en todas partes. */
export function indexar(nodos: readonly Nodo[]): Map<string, Nodo> {
  return new Map(nodos.map((n) => [n.id, n]));
}

/**
 * Dónde está este jugador.
 *
 * `sitio` es lo que el jugador se ha movido por su cuenta (vive en
 * `characters.play_state`). `ancla` es dónde ha plantado el DM al grupo
 * (`party_location`).
 *
 * **Sin `sitio`, se está donde el grupo**, y eso es lo que hace que la
 * migración no rompa nada: quien no se haya movido nunca ve exactamente lo de
 * antes. Y un `sitio` que ya no existe —el DM borró ese sub-lugar— **cae al
 * ancla en vez de dejar al jugador en la nada**: falla hacia el sitio conocido,
 * igual que la niebla falla cerrado.
 */
export function nodoDelJugador(
  sitio: Sitio | null | undefined,
  ancla: string | null,
  index: Map<string, Nodo>,
): Nodo | null {
  if (sitio && sitioVigente(sitio, ancla) && index.has(sitio.nodo)) return index.get(sitio.nodo)!;
  if (ancla && index.has(ancla)) return index.get(ancla)!;
  return null;
}

/**
 * Dónde se ha ido el jugador, **y desde qué ancla**.
 *
 * El `desde` no es contabilidad: es lo que evita el agujero de que el DM mueva
 * al grupo a Emon y alguien que se había metido en la taberna de Byroden **se
 * quede allí solo**, en un pueblo que el grupo ya abandonó.
 */
export type Sitio = { nodo: string; desde: string };

/**
 * ¿Sigue valiendo lo que este jugador se movió?
 *
 * Solo si el grupo no se ha ido a otra parte desde entonces. En cuanto el ancla
 * cambia, todo lo andado por libre **caduca solo**: no hace falta que el DM
 * limpie nada ni que se escriba en la ficha de cinco personas.
 */
export function sitioVigente(sitio: Sitio, ancla: string | null): boolean {
  return !!ancla && sitio.desde === ancla;
}

/**
 * Las salidas de un nodo que **existen de verdad**.
 *
 * Una salida a un id que no está en el grafo es una tarjeta que el jugador
 * pulsa y no le lleva a ningún sitio. Se filtran aquí para que la pantalla no
 * pueda pintarlas, y el gate exige aparte que no haya ninguna: esto es la red,
 * no el permiso para dejarlas sueltas.
 */
export function salidasDe(nodo: Nodo | null, index: Map<string, Nodo>): Nodo[] {
  if (!nodo) return [];
  return nodo.salidas.flatMap((id) => {
    const n = index.get(id);
    return n ? [n] : [];
  });
}

/**
 * ¿Puede este jugador ir de `desde` a `hacia`?
 *
 * Es la PUERTA de la interfaz, no del servidor: se evalúa en el navegador. Vale
 * así **porque no hay nada que proteger** — moverse no escribe en nadie más que
 * en la propia ficha, y el grafo entero viaja ya en el bundle. El día que
 * entrar en un sitio cueste algo o revele algo, esto se comprueba en servidor.
 */
export function puedeIr(desde: string | null, hacia: string, index: Map<string, Nodo>): boolean {
  if (!index.has(hacia)) return false;
  if (!desde) return false;
  const n = index.get(desde);
  return !!n && n.salidas.includes(hacia);
}

/**
 * Los PNJ que se ven en un nodo.
 *
 * ⚠️ **Un PNJ con `venue` nulo sale en el nodo del PUEBLO**, que es donde
 * salían todos antes de la v25: por eso la migración no esconde a nadie. Dentro
 * de un sub-lugar solo se ve a quien está puesto ahí a mano.
 */
/**
 * ¿Se puede sembrar la plantilla de un sitio?
 *
 * Sale de dentro de `seedNpcs` a propósito. Allí vivía pegada a la consulta de
 * Supabase, **donde ningún gate puede mirarla**, y es la regla que impide que un
 * botón le meta al DM once desconocidos encima de los PNJ que ya creó a mano.
 * Es la misma razón por la que `facesFrom` se exporta: una regla que no se puede
 * comprobar no la vigila nadie.
 *
 * Se niega también con la plantilla vacía: sembrar cero no es sembrar, y el
 * botón debe decirlo en vez de parecer que no hizo nada.
 */
export function puedeSembrar(
  yaEnElSitio: number, tamanoPlantilla: number,
): { ok: true } | { ok: false; error: string } {
  if (tamanoPlantilla === 0) return { ok: false, error: "Este sitio no tiene plantilla." };
  if (yaEnElSitio > 0) return { ok: false, error: "Ya hay alguien en este sitio; no se siembra encima." };
  return { ok: true };
}

export function npcsDeNodo<T extends { poi_name: string; venue?: string | null }>(
  npcs: readonly T[],
  nodo: Nodo | null,
): T[] {
  if (!nodo) return [];
  if (nodo.id.startsWith("poi:")) {
    const poi = nodo.id.slice(4);
    return npcs.filter((n) => n.poi_name === poi && !n.venue);
  }
  return npcs.filter((n) => n.venue === nodo.id);
}
