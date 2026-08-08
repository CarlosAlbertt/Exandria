// Dónde está cada jugador y adónde puede ir, como reglas puras.
//
// Módulo neutral (sin "use client" y sin Supabase) igual que `lib/niebla.ts` y
// `lib/misiones.ts`: la niebla falló ABIERTA durante semanas porque su regla
// vivía dentro de un `.map` y no había forma de comprobarla. Aquí lo que está
// en juego es que una tarjeta no lleve a ninguna parte, o que moverse no tenga
// efecto — dos fallos que no gritan.

import { poiDeNodo, type Nodo } from "@/data/lugares";

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
export type Sitio = {
  nodo: string;
  desde: string;
  /**
   * Quién lo puso ahí.
   *
   * ⚠️ **`"dm"` NO caduca al mover al grupo**, y ahí está toda la diferencia
   * que pidió el usuario: hay que distinguir «el DM te plantó en Emon» de «te
   * metiste en la taberna». Lo primero es una decisión de la mesa y tiene que
   * aguantar; lo segundo es un paseo y se recoge solo.
   *
   * **Ausente = lo anduvo el jugador**, que es lo que hay guardado en las fichas
   * de antes de esta tanda: sin el campo se comportan exactamente como siempre.
   */
  puesto?: "dm";
};

/**
 * ¿Sigue valiendo lo que este jugador se movió?
 *
 * Lo que puso el DM vale **siempre**. Lo que el jugador se anduvo, solo si el
 * grupo no se ha ido a otra parte desde entonces: en cuanto el ancla cambia,
 * todo lo andado por libre **caduca solo**, sin que el DM limpie nada ni haya
 * que escribir en la ficha de cinco personas.
 */
export function sitioVigente(sitio: Sitio, ancla: string | null): boolean {
  if (sitio.puesto === "dm") return true;
  return !!ancla && sitio.desde === ancla;
}

/**
 * Lee el `sitio` y el `desfase` de un `play_state` que puede traer cualquier
 * cosa, **y hace cumplir la invariante**.
 *
 * ⚠️ **Vive aquí y no dentro de `useSitio` a propósito, y esa es la lección más
 * repetida de este repo**: el guardia anti-duplicado de `seedNpcs` vivía pegado
 * a la consulta de Supabase, **donde ningún gate llegaba**, así que romperlo
 * dejaba el gate verde. Salió a `puedeSembrar` por lo mismo que esto sale aquí.
 * Y hace más falta todavía porque la invariante se aplica en DOS sitios: este
 * hook y `/api/dm/character`.
 *
 * ⚠️ **LA INVARIANTE: sin `sitio` no hay `desfase`.** Volver con el grupo es
 * volver a su hora. Un desfase huérfano dejaría a alguien adelantado ocho horas
 * **sentado en la misma plaza que los demás**, y eso no se lee como un fallo: se
 * lee como que la app miente.
 *
 * Tolerante con lo que haya guardado, porque es un `jsonb` que ha pasado por
 * varias versiones: una forma vieja o a medias **no puede tumbar la pantalla del
 * jugador**, se cae al ancla, que es lo peor que debería pasar.
 */
export function sanearSitio(rawSitio: unknown, rawDesfase: unknown): { sitio: Sitio | null; desfase: number } {
  const sitio = leerSitio(rawSitio);
  return { sitio, desfase: sitio ? leerDesfase(rawDesfase) : 0 };
}

function leerSitio(raw: unknown): Sitio | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.nodo !== "string" || typeof o.desde !== "string") return null;
  if (!o.nodo.trim() || !o.desde.trim()) return null;
  // `puesto` solo se acepta si dice EXACTAMENTE "dm". Cualquier otra cosa
  // —incluido que falte, que es lo que hay en las fichas de antes de esta
  // tanda— es «lo anduvo el jugador», que es el caso que CADUCA. Si un valor
  // raro colara como "dm", el sitio dejaría de caducar y alguien se quedaría
  // solo en un pueblo que el grupo abandonó: el agujero que ya se tapó una vez.
  return o.puesto === "dm"
    ? { nodo: o.nodo, desde: o.desde, puesto: "dm" }
    : { nodo: o.nodo, desde: o.desde };
}

/**
 * Los minutos que este jugador lleva de más por haber viajado.
 *
 * **Nunca negativo**: un desfase en negativo mandaría a alguien al pasado, con
 * la crónica y el cupo del taller detrás.
 */
function leerDesfase(raw: unknown): number {
  const n = typeof raw === "number" ? raw : Number.NaN;
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

/* --------------------- DÓNDE ESTÁ ESO, EN EL MUNDO --------------------- */

/** Un POI aplanado del atlas: lo mínimo para saber dónde cae. */
export type PoiUbicado = { name: string; continent: string; regionSlug: string };

/** Continente, región y pueblo de un nodo. `poiName` es null en el bosque. */
export type Ubicacion = { continent: string; regionSlug: string; poiName: string | null };

/**
 * Dónde está este nodo **de verdad**, mirándolo en el atlas.
 *
 * ⚠️ **Esto es lo que hace que la posición por jugador no mienta.** Antes la
 * región y el continente salían del ancla del grupo, y en cuanto un jugador
 * estuviera en otro pueblo se rompían cuatro cosas a la vez y ninguna gritaba:
 * Byroden está en `peninsula-pleabruma` y Emon en `litoral-filofulgor`, así que
 * el que estuviera en Emon vería **el clima y la región de Pleabruma**, y
 * `poisOf` no encontraría Emon — **sin tienda, sin posada, sin tablón y sin
 * tirada de saber**, en silencio.
 *
 * ⚠️ **Se RESUELVE, no se copia.** Guardar el continente y la región en la ficha
 * junto al nodo sería una segunda fuente que se desincroniza en cuanto el DM
 * mueva un POI de región — el fallo que ya tuvo `regionEntries()`. El nombre de
 * POI **es único en todo el mundo** y hay un gate que lo exige
 * (`comprobarContinente` lo cruza contra `nombresAjenos`), así que buscar por
 * nombre no es ambiguo.
 *
 * Recibe los POIs y las regiones **aplanados desde fuera**, no el atlas: es la
 * misma razón por la que `construirNodos` recibe los pueblos en vez de
 * importarlos, y es lo que permite que el gate lo pruebe sin arrastrar el atlas.
 */
export function ubicacionDeNodo(
  nodoId: string,
  pois: readonly PoiUbicado[],
  regiones: readonly { continent: string; slug: string }[],
  regionDelBosque: string,
): Ubicacion | null {
  if (nodoId.startsWith("franja:")) {
    // Una franja no es de ningún POI, así que su región va escrita y su
    // continente sale de buscarla en el atlas.
    const r = regiones.find((x) => x.slug === regionDelBosque);
    return r ? { continent: r.continent, regionSlug: r.slug, poiName: null } : null;
  }
  // `poiDeNodo` se IMPORTA en vez de copiarse aquí: `data/lugares` es neutro
  // igual que este módulo, así que no hay nada que ganar duplicando cuatro
  // líneas y sí una segunda forma de leer un id esperando a divergir.
  const poi = poiDeNodo(nodoId);
  if (!poi) return null;
  const p = pois.find((x) => x.name === poi);
  return p ? { continent: p.continent, regionSlug: p.regionSlug, poiName: p.name } : null;
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
