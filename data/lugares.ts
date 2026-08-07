// Los sitios por los que se anda, como grafo.
//
// Lo que se pide no son «sub-lugares de un pueblo»: es MOVERSE. Byroden → el
// bosque → más adentro → volver. Modelado como «un POI tiene una lista de
// sitios» el bosque no cabe, porque **la Expansión Verdante es una región, no
// un POI**, y sus franjas no son sub-lugares de Byroden.
//
// Así que un NODO, y una tarjeta por nodo.

import { FRANJAS, type Franja } from "./bosque";

/** Un sitio donde se puede estar. Cada uno es una tarjeta en pantalla. */
export type Nodo = {
  /** `poi:Byroden` · `sub:Byroden/taberna` · `franja:linde` */
  id: string;
  nombre: string;
  /** Font Awesome, como `POI_ICON`. */
  icono: string;
  blurb: string;
  /** La pone el DM desde el panel; se puede cambiar sin desplegar. */
  imagen?: string;
  /** Ids de nodos a los que se puede ir DESDE aquí. */
  salidas: string[];
};

/* ------------------------------- LOS IDS ------------------------------- */
// Se componen en un solo sitio para que no haya dos formas de escribir lo
// mismo. Un id mal formado deja una tarjeta que no lleva a ninguna parte.

export const idPoi = (poiName: string) => `poi:${poiName}`;
export const idSub = (poiName: string, slug: string) => `sub:${poiName}/${slug}`;
export const idFranja = (f: Franja) => `franja:${f}`;

/** El POI al que pertenece un nodo, o null si no cuelga de ninguno. */
export function poiDeNodo(id: string): string | null {
  if (id.startsWith("poi:")) return id.slice(4);
  if (id.startsWith("sub:")) return id.slice(4).split("/")[0] || null;
  return null; // las franjas no son de ningún pueblo
}

/** ¿Se está al aire libre? Decide si se pinta el clima. */
export function alAireLibre(id: string): boolean {
  return id.startsWith("poi:") || id.startsWith("franja:");
}

/* ---------------------------- LA SEMILLA ------------------------------ */
/**
 * Los sub-lugares que trae la app de fábrica, por POI.
 *
 * ⚠️ **Los nodos `poi:` NO se escriben aquí.** Se derivan del atlas, que ya
 * tiene los POI de los cinco continentes; escribirlos otra vez sería una
 * segunda lista que se desincroniza del mapa — el mismo fallo que ya tuvo
 * `regionEntries()` con las regiones.
 *
 * Solo Byroden viene poblado, y a propósito: el resto los añade el DM desde el
 * panel, que para eso no hace falta desplegar. Es la lección de las tiendas,
 * donde «para que existiera una pescadería había que desplegar».
 */
export type SubSemilla = { slug: string; nombre: string; icono: string; blurb: string };

export const SUB_LUGARES: Record<string, SubSemilla[]> = {
  Byroden: [
    {
      slug: "taberna",
      nombre: "La Taberna",
      icono: "fa-beer-mug-empty",
      blurb:
        "Vigas bajas, suelo pegajoso y el mejor sitio del pueblo para enterarse de algo. " +
        "Aquí se sabe quién ha llegado antes de que llegue.",
    },
    {
      slug: "iglesia",
      nombre: "La Iglesia",
      icono: "fa-place-of-worship",
      blurb:
        "Pequeña, encalada y con más velas de las que hacen falta. La reconstruyeron antes " +
        "que las casas, que dice bastante de lo que pasó aquí.",
    },
    {
      slug: "cementerio",
      nombre: "El Cementerio",
      icono: "fa-monument",
      blurb:
        "Detrás de la iglesia, cuesta arriba. Hay una franja entera de lápidas con la misma " +
        "fecha grabada, y nadie del pueblo necesita que le expliquen cuál es.",
    },
    {
      slug: "ayuntamiento",
      nombre: "El Ayuntamiento",
      icono: "fa-landmark",
      blurb:
        "Dos plantas, un archivo húmedo y un alguacil que hace de todo. Aquí se pagan los " +
        "impuestos, se firman los encargos y se guarda la memoria escrita de Byroden.",
    },
  ],
};

/**
 * Desde qué POI se entra al bosque, y por qué franja.
 *
 * Va aparte de `SUB_LUGARES` porque **no es un sub-lugar**: la tarjeta «El
 * bosque» de Byroden no lleva a un sitio de Byroden, lleva a la Expansión
 * Verdante. Meterlo en la lista de arriba obligaría a que un `sub:` pudiera no
 * ser del pueblo, y entonces `poiDeNodo` mentiría.
 */
export const ENTRADAS_AL_BOSQUE: { poi: string; franja: Franja; nombre: string; blurb: string }[] = [
  {
    poi: "Byroden",
    franja: "linde",
    nombre: "El bosque",
    blurb:
      "Los campos del norte se acaban de golpe contra una pared de árboles. Ahí empieza la " +
      "Expansión Verdante, y desde el pueblo solo se ve el primer palmo.",
  },
];

/* --------------------------- CONSTRUIR EL GRAFO ------------------------ */

/** Overrides del DM: mismo id, campos que pisan la semilla. */
export type NodosOverride = Record<string, Partial<Omit<Nodo, "id">>>;

/**
 * El grafo entero: los POI que se le pasen, sus sub-lugares, y el bosque.
 *
 * Recibe los nombres de POI **desde fuera** (el atlas) justo para no tener una
 * segunda lista de pueblos aquí dentro.
 */
export function construirNodos(
  pois: { name: string; blurb: string; icono: string }[],
  override: NodosOverride = {},
): Nodo[] {
  const out: Nodo[] = [];
  const conocidos = new Set(pois.map((p) => p.name));

  // 1. Un nodo por POI, con salidas a sus sub-lugares y al bosque si lo tiene.
  for (const p of pois) {
    const subs = (SUB_LUGARES[p.name] ?? []).map((s) => idSub(p.name, s.slug));
    const bosque = ENTRADAS_AL_BOSQUE.filter((e) => e.poi === p.name).map((e) => idFranja(e.franja));
    out.push({ id: idPoi(p.name), nombre: p.name, icono: p.icono, blurb: p.blurb, salidas: [...subs, ...bosque] });
  }

  // 2. Los sub-lugares. Cada uno vuelve a su pueblo, y solo ahí: se sale por
  //    donde se entró. Ir de la taberna al cementerio sin cruzar la plaza haría
  //    que el pueblo no se sintiera un sitio.
  for (const [poi, subs] of Object.entries(SUB_LUGARES)) {
    if (!conocidos.has(poi)) continue; // un pueblo que el atlas no tiene no se inventa
    for (const s of subs) {
      out.push({ id: idSub(poi, s.slug), nombre: s.nombre, icono: s.icono, blurb: s.blurb, salidas: [idPoi(poi)] });
    }
  }

  // 3. Las tres franjas, encadenadas de fuera adentro. La primera vuelve
  //    además a los pueblos desde los que se entra.
  FRANJAS.forEach((f, i) => {
    const vecinas: string[] = [];
    if (i > 0) vecinas.push(idFranja(FRANJAS[i - 1].key));
    if (i < FRANJAS.length - 1) vecinas.push(idFranja(FRANJAS[i + 1].key));
    const salidasPueblo = i === 0
      ? ENTRADAS_AL_BOSQUE.filter((e) => e.franja === f.key && conocidos.has(e.poi)).map((e) => idPoi(e.poi))
      : [];
    out.push({
      id: idFranja(f.key),
      nombre: f.label,
      icono: "fa-tree",
      blurb: f.blurb,
      salidas: [...salidasPueblo, ...vecinas],
    });
  });

  // 4. Lo que el DM haya cambiado encima. Se aplica al final para que pueda
  //    pisar cualquier cosa —nombre, blurb, imagen y hasta las salidas— sin
  //    que la semilla se lo vuelva a comer.
  return out.map((n) => (override[n.id] ? { ...n, ...override[n.id], id: n.id } : n));
}

/**
 * El nombre de la tarjeta del bosque tal y como se ve DESDE el pueblo.
 *
 * La franja se llama «La linde» cuando ya estás dentro, pero desde Byroden lo
 * que se ve es «El bosque»: es la misma puerta contada desde los dos lados.
 */
export function etiquetaDeSalida(desde: string, hacia: string): { nombre: string; blurb: string } | null {
  const poi = desde.startsWith("poi:") ? desde.slice(4) : null;
  if (!poi) return null;
  const e = ENTRADAS_AL_BOSQUE.find((x) => x.poi === poi && idFranja(x.franja) === hacia);
  return e ? { nombre: e.nombre, blurb: e.blurb } : null;
}
