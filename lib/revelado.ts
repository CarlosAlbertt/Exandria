// Quién ha descubierto qué sitio, como reglas puras.
//
// Módulo neutral (sin "use client" y sin Supabase) igual que `lib/niebla.ts`,
// `lib/nodos.ts` y `lib/viaje.ts`. Y aquí importa especialmente: lo que decide
// esto es **qué le enseñas a cada jugador**, y un fallo hacia el lado abierto le
// destripa el mapa a toda la mesa sin que nada avise.

/**
 * Lo que sabe un personaje **por su cuenta**, tal y como está guardado.
 *
 * ⚠️ Es una lista de NOMBRES de POI, no de slugs de región ni de ids de nodo. El
 * nombre de POI es único en todo el mundo y ya hay un gate que lo exige
 * (`comprobarContinente` lo cruza contra `nombresAjenos`), así que un nombre
 * identifica un sitio sin ambigüedad y sirve igual en `poi_state`, que también
 * indexa por nombre.
 *
 * Tolerante con lo que haya en el `jsonb`: lo que no sea una cadena con algo se
 * cae. Un `play_state` a medias **no puede tumbar el mapa del jugador**.
 */
export function leerRevelados(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const x of raw) {
    if (typeof x === "string" && x.trim()) out.push(x.trim());
  }
  return Array.from(new Set(out));
}

/**
 * ¿Ve este jugador este sitio?
 *
 * **Es una SUMA, no una sustitución**: lo que el DM revela para todos
 * (`poi_state.revealed`) más lo que sepa este personaje por su cuenta. Así el
 * caso que pidió el usuario —«el que nació en Syngorn conoce Syngorn, los demás
 * no»— no obliga a quitarle nada a nadie, y revelar al grupo sigue funcionando
 * exactamente como antes.
 *
 * ⚠️ **Falla CERRADO**: sin nada que lo revele, no se ve. Es la misma dirección
 * que `continenteDescubierto` — en una niebla el error tiene que ir hacia el lado
 * de esconder, porque el contrario le cuenta al grupo algo que no había
 * descubierto y eso no se puede deshacer.
 */
export function poiVisible(args: {
  /** `poi_state.revealed` del sitio: lo que el DM abrió para TODOS. */
  paraTodos: boolean;
  /** Los nombres que este personaje conoce por su cuenta. */
  propios: readonly string[];
  poiName: string;
}): boolean {
  if (args.paraTodos) return true;
  return args.propios.includes(args.poiName);
}

/** Añade o quita un sitio de lo que sabe un personaje. Devuelve la lista nueva. */
export function conRevelado(propios: readonly string[], poiName: string, on: boolean): string[] {
  const limpio = leerRevelados(propios);
  const nombre = poiName.trim();
  if (!nombre) return limpio;
  if (on) return limpio.includes(nombre) ? limpio : [...limpio, nombre];
  return limpio.filter((n) => n !== nombre);
}
