// Viajar de un pueblo a otro, como reglas puras.
//
// Módulo neutral (sin "use client", sin Supabase y sin importar el atlas) igual
// que `lib/niebla.ts` y `lib/nodos.ts`. La razón es la de siempre en este repo:
// la niebla falló ABIERTA durante semanas porque su regla vivía dentro del JSX
// y no había forma de comprobarla. Aquí lo que está en juego es peor —que un
// jugador se quede encerrado en un pueblo del que no puede salir— y tampoco
// grita.
//
// ⚠️ **Viajar NO es una arista del grafo, y por eso no vive en `lib/nodos.ts`.**
// `puedeIr` pregunta «¿hay camino de aquí a allí?», que es lo que ordena el
// pueblo y el bosque. Viajar pregunta otra cosa: «¿ha revelado el DM ese sitio
// en el mapa?». Meterlo como arista habría obligado a reconstruir el grafo cada
// vez que el DM revela un pin, y a que `check-lugares` tratara media docena de
// pueblos como salidas de Byroden.

/** Lo mínimo que el viaje necesita de una región: cómo se llama y dónde cae. */
export type RegionViaje = { slug: string; name: string; map?: { x: number; y: number } };

/** Lo mínimo de un POI candidato a destino. */
export type PoiViaje = { name: string; regionSlug: string };

/**
 * Cuánto se tarda por unidad de mapa.
 *
 * Las coordenadas de región son **porcentajes sobre el mapa del continente**
 * (`Region.map`), no leguas, así que esto es un dial narrativo y no una medida.
 * A 60 min/unidad, Byroden `{48,55}` → Emon `{44,50}` sale a **6 h 30**, que es
 * una jornada de camino corta y se lee bien. Si algún día hay que apretarlo, se
 * cambia aquí y el gate solo exige que el resultado siga en una banda sensata.
 */
export const MINUTOS_POR_UNIDAD_MAPA = 60;

/**
 * El suelo de cualquier viaje.
 *
 * Sin él, dos pueblos de la MISMA región —distancia cero, porque las
 * coordenadas son de la región y no del POI— saldrían a **cero minutos**, y
 * viajar se leería como que no se ha movido nada.
 */
export const MINUTOS_MINIMOS_DE_VIAJE = 240;

/** Los viajes se redondean a media hora: es camino, no un cronómetro. */
const REDONDEO_MIN = 30;

/** Un sitio al que se puede ir, con lo que cuesta llegar. */
export type Destino = {
  poiName: string;
  regionSlug: string;
  regionName: string;
  /** Minutos de juego de camino. Siempre > 0. */
  minutos: number;
  /**
   * Es donde está el grupo. Se ofrece **aunque no esté revelado**, y de eso
   * depende que nadie se quede encerrado — ver `destinosDesde`.
   */
  esElGrupo: boolean;
};

/**
 * Minutos de camino entre dos regiones del continente.
 *
 * Sin coordenadas en alguna de las dos se cobra el mínimo en vez de fallar: una
 * región a la que el DM no le haya puesto pin **no puede volver el viaje
 * gratis**, que es el error hacia el lado malo.
 */
export function minutosDeViaje(
  a: { x: number; y: number } | undefined,
  b: { x: number; y: number } | undefined,
): number {
  if (!a || !b) return MINUTOS_MINIMOS_DE_VIAJE;
  const d = Math.hypot(a.x - b.x, a.y - b.y);
  const bruto = Math.round((d * MINUTOS_POR_UNIDAD_MAPA) / REDONDEO_MIN) * REDONDEO_MIN;
  return Math.max(MINUTOS_MINIMOS_DE_VIAJE, bruto);
}

/**
 * Los sitios a los que se puede viajar desde donde estás.
 *
 * Tres reglas, y las tres importan:
 *
 * 1. **Solo se viaja desde la plaza de un pueblo** (`desde` con `poiName`). De
 *    dentro de la taberna se sale primero, y del bosque se vuelve andando por
 *    las franjas. Sin esto habría que explicar qué significa «ir a Emon desde el
 *    corazón del bosque», y la respuesta honesta es que se sale primero.
 * 2. **Solo lo que el DM ha revelado**, y **falla cerrado**: `poi_state` solo
 *    tiene fila para lo que el DM ha tocado, así que sin fila no está revelado.
 *    Es la misma dirección de error que `continenteDescubierto`: en una niebla
 *    el fallo tiene que ir hacia el lado de esconder.
 * 3. ⚠️ **DONDE ESTÁ EL GRUPO SE OFRECE SIEMPRE, revelado o no.** Es la regla
 *    anti-ratonera, y sin ella el agujero es real: si el DM revela Emon y no
 *    Byroden, quien viaje a Emon **no tiene ningún destino** y se queda
 *    encerrado, con la única salida de que el DM se dé cuenta. Es exactamente lo
 *    que `check-lugares` ya vigila con «todo nodo al que se puede entrar tiene
 *    por dónde salir», aplicado a la puerta nueva.
 */
export function destinosDesde(args: {
  /** Dónde estás. `null` si no estás en la plaza de un pueblo. */
  desde: { poiName: string; regionSlug: string } | null;
  /** Los POIs del continente en el que estás. */
  candidatos: readonly PoiViaje[];
  /** Las regiones de ese continente. */
  regiones: readonly RegionViaje[];
  /** ¿Ha revelado el DM este POI? */
  revelado: (regionSlug: string, poiName: string) => boolean;
  /** El nombre del POI donde el DM ha plantado al grupo. */
  anclaPoi: string | null;
}): Destino[] {
  const { desde, candidatos, regiones, revelado, anclaPoi } = args;
  if (!desde) return [];

  const porSlug = new Map(regiones.map((r) => [r.slug, r]));
  const aqui = porSlug.get(desde.regionSlug);

  const out: Destino[] = [];
  const vistos = new Set<string>();
  for (const p of candidatos) {
    if (p.name === desde.poiName) continue; // no se viaja a donde ya estás
    if (vistos.has(p.name)) continue; // el nombre es único, pero no se fía
    const esElGrupo = !!anclaPoi && p.name === anclaPoi;
    if (!esElGrupo && !revelado(p.regionSlug, p.name)) continue;
    const r = porSlug.get(p.regionSlug);
    if (!r) continue; // un POI de una región que este continente no tiene
    vistos.add(p.name);
    out.push({
      poiName: p.name,
      regionSlug: p.regionSlug,
      regionName: r.name,
      minutos: minutosDeViaje(aqui?.map, r.map),
      esElGrupo,
    });
  }

  // Lo más cerca primero, y donde está el grupo siempre arriba: es el destino
  // que se busca cuando uno quiere volver.
  return out.sort((a, b) =>
    Number(b.esElGrupo) - Number(a.esElGrupo)
    || a.minutos - b.minutos
    || a.poiName.localeCompare(b.poiName, "es"));
}

/** «6 h 30» / «1 d 4 h». Para pintar el coste sin que nadie divida a mano. */
export function duracionDeViaje(minutos: number): string {
  const dias = Math.floor(minutos / 1440);
  const horas = Math.floor((minutos % 1440) / 60);
  const min = minutos % 60;
  const partes: string[] = [];
  if (dias) partes.push(`${dias} d`);
  if (horas) partes.push(`${horas} h`);
  if (min) partes.push(`${min} min`);
  return partes.join(" ") || "0 min";
}
