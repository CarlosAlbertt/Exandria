// Los sitios por los que se anda, como grafo.
//
// Lo que se pide no son «sub-lugares de un pueblo»: es MOVERSE. Byroden → el
// bosque → más adentro → volver. Modelado como «un POI tiene una lista de
// sitios» el bosque no cabe, porque **la Expansión Verdante es una región, no
// un POI**, y sus franjas no son sub-lugares de Byroden.
//
// Así que un NODO, y una tarjeta por nodo.

import { FRANJAS, type Franja } from "./bosque";

/* -------------------------------- EL TEMA ------------------------------ */
/**
 * La PIEL de un sitio. De aquí salen el cielo, la silueta del horizonte, el
 * metal de los marcos y el color de acento de `/lugar`.
 *
 * ⚠️ **Un tema no mueve nada de sitio: solo cambia la piel.** La maqueta de
 * `/lugar` es la misma en Byroden y en Emon; lo que cambia son los quince
 * tokens de `.tema-*` en `app/globals.css` y la silueta de aquí abajo. Si algún
 * día un tema necesita recolocar algo, es señal de que no era un tema.
 *
 * Los cuatro salen de `docs/ARTE-IMAGENES.md`, que es donde están escritos los
 * prompts de las ilustraciones: el tema y el prompt tienen que contar lo mismo.
 */
export type TemaLugar = "valle" | "ciudadela" | "yermo" | "bosque";

/**
 * Los temas dibujados, con su silueta de horizonte.
 *
 * La `silueta` es el atributo `d` de un `<path>` sobre un `viewBox` de
 * `0 0 1200 300` con `preserveAspectRatio="none"`, relleno de `currentColor`.
 * Se pinta detrás de la bruma cuando el sitio **no tiene ilustración subida**:
 * un sitio sin dibujar sigue siendo un sitio, no un hueco roto.
 *
 * ⚠️ Vive aquí y no en el CSS a propósito. Es lo único del tema que no es un
 * color, y en CSS quedaría como un `data:` URI ilegible que ningún gate podría
 * mirar. Aquí `check-lugares` lo cruza contra `.tema-*` de `globals.css`.
 */
export const TEMAS: Record<TemaLugar, { label: string; silueta: string }> = {
  // Montañas nevadas cerrando el valle al fondo, como en Byroden.
  valle: {
    label: "Valle",
    silueta: "M0 300V150l120-90 90 70 110-120 140 150 120-80 150 110 130-60 140 90 200-40v220z",
  },
  // Agujas y torres sobre la bahía: Emon vista desde el puerto.
  ciudadela: {
    label: "Ciudadela",
    silueta:
      "M0 300V210H60V140L100 60 140 140V200H230V120L265 30 300 120V215H420V100L470 10 520 100" +
      "V205H640V145L675 70 710 145V220H850V125L890 40 930 125V210H1080V155L1115 85 1150 155V225H1200V300Z",
  },
  // Escombro plano y una torre partida. Nada en pie, salvo lo que no cayó.
  yermo: {
    label: "Yermo",
    silueta:
      "M0 300V258H120V244H210V266H330V180L345 96 372 100 360 182V214H408V252H540V240H650" +
      "V264H760V248H880V236H960V260H1080V246H1200V300Z",
  },
  // El dosel cerrado de la Expansión Verdante, visto desde dentro.
  bosque: {
    label: "Bosque",
    silueta:
      "M0 300V230L40 130 80 230 120 100 160 230 200 160 240 230 280 80 320 230 360 150 400 230" +
      " 440 110 480 230 520 170 560 230 600 90 640 230 680 140 720 230 760 200 800 230 840 120" +
      " 880 230 920 165 960 230 1000 100 1040 230 1080 175 1120 230 1160 135 1200 230V300Z",
  },
};

/**
 * El tema de un sitio del que nadie ha dicho nada.
 *
 * `valle` y no un tema «neutro» aparte: un quinto tema gris que nadie elige
 * sería la piel de la mitad del mapa, y la pantalla de un pueblo cualquiera
 * saldría más sosa que la de Byroden sin que eso lo hubiera decidido nadie.
 */
export const TEMA_DEFECTO: TemaLugar = "valle";

/**
 * ¿Es esto un tema de verdad?
 *
 * ⚠️ **Hace falta en tiempo de ejecución, no solo en el tipo.** El `tema` de un
 * nodo puede venir del JSON de `app_config` que escribe el DM, y ahí TypeScript
 * no llega: un `tema: "valle "` con un espacio dejaría la hoja **sin ninguno de
 * los quince tokens**, o sea texto negro sobre fondo transparente. Se cuela el
 * seto aquí y `construirNodos` se queda con el de la semilla.
 */
export function esTema(x: unknown): x is TemaLugar {
  return typeof x === "string" && Object.prototype.hasOwnProperty.call(TEMAS, x);
}

/**
 * Qué piel lleva cada pueblo.
 *
 * Va aquí y no en el atlas porque **el atlas es el mapa y esto es el aspecto**:
 * meter un campo de estilo en `data/pois.ts` obligaría a tocar los cinco
 * continentes para estrenar un tema. Lo que no esté escrito cae en
 * `TEMA_DEFECTO`, y el DM puede pisarlo por sitio desde Panel DM › Lugares.
 */
export const TEMA_POR_POI: Record<string, TemaLugar> = {
  Byroden: "valle",
  Emon: "ciudadela",
};

/** El tema de un pueblo, con el de defecto si no está escrito. */
export function temaDePoi(poiName: string): TemaLugar {
  return TEMA_POR_POI[poiName] ?? TEMA_DEFECTO;
}

/** Un sitio donde se puede estar. Cada uno es una tarjeta en pantalla. */
export type Nodo = {
  /** `poi:Byroden` · `sub:Byroden/taberna` · `franja:linde` */
  id: string;
  nombre: string;
  /** Font Awesome, como `POI_ICON`. */
  icono: string;
  blurb: string;
  /**
   * La ILUSTRACIÓN DE CABECERA del sitio: 16:9, a sangre y a todo ancho cuando
   * estás dentro. La pone el DM desde el panel, sin desplegar.
   *
   * ⚠️ **No es una miniatura.** Antes se pintaba también en la tarjeta de la
   * lista de salidas; ahora las puertas llevan sello de lacre y nada más, como
   * el boceto. El dibujo de un sitio se ve **al entrar en él**, que es cuando
   * cuenta algo; en la lista solo competía con las otras cinco.
   */
  imagen?: string;
  /**
   * La piel del sitio. Siempre puesta: `construirNodos` la resuelve para todos
   * —del pueblo, de la semilla o `bosque` en las franjas— para que la pantalla
   * no tenga que decidir nada ni pintar un `.tema-undefined`.
   */
  tema: TemaLugar;
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
export type SubSemilla = {
  slug: string;
  nombre: string;
  icono: string;
  blurb: string;
  /**
   * Piel propia, si el sitio no se parece a su pueblo. Sin poner **hereda la
   * del pueblo**, que es lo que se quiere casi siempre: la taberna de Byroden
   * es del valle porque Byroden lo es, y no hay que repetirlo cuatro veces.
   */
  tema?: TemaLugar;
};

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
    out.push({
      id: idPoi(p.name), nombre: p.name, icono: p.icono, blurb: p.blurb,
      tema: temaDePoi(p.name), salidas: [...subs, ...bosque],
    });
  }

  // 2. Los sub-lugares. Cada uno vuelve a su pueblo, y solo ahí: se sale por
  //    donde se entró. Ir de la taberna al cementerio sin cruzar la plaza haría
  //    que el pueblo no se sintiera un sitio.
  for (const [poi, subs] of Object.entries(SUB_LUGARES)) {
    if (!conocidos.has(poi)) continue; // un pueblo que el atlas no tiene no se inventa
    for (const s of subs) {
      out.push({
        id: idSub(poi, s.slug), nombre: s.nombre, icono: s.icono, blurb: s.blurb,
        // Sin tema propio, el del pueblo: la taberna de Byroden es del valle
        // porque Byroden lo es.
        tema: s.tema ?? temaDePoi(poi), salidas: [idPoi(poi)],
      });
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
      // Las franjas NO son de ningún pueblo, así que no hay tema del que
      // heredar: la Expansión Verdante es siempre bosque.
      tema: "bosque",
      salidas: [...salidasPueblo, ...vecinas],
    });
  });

  // 4. Lo que el DM haya cambiado encima. Se aplica al final para que pueda
  //    pisar cualquier cosa —nombre, blurb, imagen, tema y hasta las salidas—
  //    sin que la semilla se lo vuelva a comer.
  return out.map((n) => aplicarOverride(n, override[n.id]));
}

/**
 * Lo que el DM cambió, encima de la semilla, **con dos cosas que no se pisan**.
 *
 * ⚠️ Esto NO viene del tipo: viene de un JSON de `app_config` que escribe el DM
 * a mano, y ahí TypeScript no llega. Se defienden dos campos:
 *
 * - **El `id`**, ya de antes: pisarlo dejaría la tarjeta de la taberna
 *   apuntando a un nodo que ya no existe con ese nombre.
 * - **El `tema`**, nuevo: un valor que no sea uno de los cuatro deja la hoja
 *   **sin ninguno de los quince tokens** —texto negro sobre transparente, con
 *   el fondo oscuro de la app asomando— y no da ningún error. Un tema
 *   inventado se ignora y se queda el de la semilla, que es feo pero legible.
 */
function aplicarOverride(n: Nodo, ov?: Partial<Omit<Nodo, "id">>): Nodo {
  if (!ov) return n;
  const tema = (ov as { tema?: unknown }).tema;
  return { ...n, ...ov, id: n.id, tema: esTema(tema) ? tema : n.tema };
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
