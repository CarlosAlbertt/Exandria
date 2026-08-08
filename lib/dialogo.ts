// Los árboles de diálogo, como reglas puras.
//
// Módulo neutral (sin "use client", sin React y sin Supabase) igual que
// `lib/niebla.ts`, `lib/misiones.ts` y `lib/nodos.ts`. Aquí vive **todo lo que
// decide qué pasa** al elegir una opción: si la tirada acierta, cuánta
// confianza se mueve, a qué etapa se salta y qué opciones quedan quemadas.
//
// Va todo junto y fuera del JSX a propósito: una regla de consecuencia metida
// en un `onClick` no la puede mirar ningún gate, y aquí lo que está en juego es
// que una opción reparta un objeto épico cuando no toca.

/* -------------------------------- EL ÁRBOL ------------------------------- */

/** Una tirada de pericia con su CD, la que va escrita en la propia opción. */
export type Chequeo = { pericia: string; cd: number };

/** Lo que una opción entrega al acertar. */
export type Premio =
  | { tipo: "objeto"; name: string; qty?: number; notes?: string }
  | { tipo: "saber"; ids: string[] }
  | { tipo: "oro"; cantidad: number };

export type OpcionDialogo = {
  /** Lo que se lee en el botón. La etiqueta de la CD la pone la pantalla. */
  texto: string;
  /** Sin chequeo, la opción siempre sale bien: es charla o es una puerta. */
  chequeo?: Chequeo;
  /** Lo que dice el PNJ al acertar. Sin chequeo, lo que dice y ya está. */
  exito: string;
  /** Solo si hay chequeo. */
  fallo?: string;
  premio?: Premio;
  /**
   * Encargo que se abre al acertar: el **slug** de `data/misiones/`.
   *
   * ⚠️ Antes era `{ title, body, reward }` escrito aquí dentro, y eso duplicaba
   * el texto de la misión en dos sitios que podían discrepar sin que nada lo
   * dijera. Ahora manda el catálogo y aquí solo va la referencia; el gate cruza
   * que el slug exista de verdad.
   *
   * Sigue siendo un `string` pelado y NO el objeto de la misión a propósito:
   * este módulo es neutro —no importa nada— para que `check-dialogos` pueda
   * mirarlo. Resolver el slug es cosa de quien lo consume.
   */
  mision?: string;
  /** Etapa a la que se salta al acertar. `null` explícito = cerrar. */
  siguiente?: string | null;
  /** Al fallar. Si no se dice, se queda en la etapa actual. */
  siguienteSiFalla?: string;
  /** Abre la tienda del lugar en vez de hablar. */
  abreTienda?: true;
  /** Cuánta confianza mueve. Por defecto +10 / −5, como en el original. */
  confianza?: { exito?: number; fallo?: number };
};

export type EtapaDialogo = {
  /** Lo que el PNJ suelta al abrir esta etapa. */
  saludo: string;
  /** El oficio tal y como se presenta AQUÍ: cambia según lo que sepas de él. */
  role?: string;
  opciones: OpcionDialogo[];
  /** Confianza mínima para entrar. Sin ella, no se salta aquí. */
  confianzaMin?: number;
};

/** El árbol de un PNJ: sus etapas por clave, y por cuál se empieza. */
export type ArbolDialogo = {
  inicio: string;
  etapas: Record<string, EtapaDialogo>;
};

/* ------------------------- LO QUE EL JUGADOR LLEVA ----------------------- */

/**
 * El trato de UNA ficha con UN PNJ. Vive en `characters.play_state.pnj`.
 *
 * ⚠️ Va por **ficha** y no por jugador, al revés que `npc_memories`, y es
 * deliberado: la confianza se gana con tiradas de **tus** pericias y se paga en
 * objetos y oro **de tu** hoja. El PNJ recuerda al jugador (esa es la memoria
 * de la IA); el trato es del personaje.
 *
 * Y va en `play_state` porque **`characters` sí está en la publicación
 * realtime** y `app_config` no. Sin migración.
 */
export type TratoPnj = {
  /** 0–100. Empieza en 50, ni amigo ni enemigo. */
  confianza: number;
  /** Clave de etapa donde se quedó la conversación. */
  etapa: string;
  /** Índices de opción quemados **por etapa**: se falló y no se reintenta. */
  fallidas: Record<string, number[]>;
};

export const CONFIANZA_INICIAL = 50;
const SUBE = 10;
const BAJA = -5;

export function tratoInicial(arbol: ArbolDialogo): TratoPnj {
  return { confianza: CONFIANZA_INICIAL, etapa: arbol.inicio, fallidas: {} };
}

/**
 * Lee un trato guardado, tolerando cualquier cosa.
 *
 * `play_state` es un `jsonb` que ha pasado por varias versiones de la app: una
 * forma vieja o a medias **no puede tumbar la conversación**, se cae al trato
 * inicial. Y una etapa que ya no existe —el árbol se reescribió— **vuelve al
 * inicio en vez de dejar al jugador mirando una pantalla vacía**.
 */
export function leerTrato(raw: unknown, arbol: ArbolDialogo): TratoPnj {
  const base = tratoInicial(arbol);
  if (!raw || typeof raw !== "object") return base;
  const o = raw as Record<string, unknown>;
  const etapa = typeof o.etapa === "string" && arbol.etapas[o.etapa] ? o.etapa : base.etapa;
  const confianza = typeof o.confianza === "number" && Number.isFinite(o.confianza)
    ? Math.max(0, Math.min(100, o.confianza))
    : base.confianza;
  const fallidas: Record<string, number[]> = {};
  if (o.fallidas && typeof o.fallidas === "object") {
    for (const [k, v] of Object.entries(o.fallidas as Record<string, unknown>)) {
      if (Array.isArray(v)) fallidas[k] = v.filter((n): n is number => typeof n === "number");
    }
  }
  return { confianza, etapa, fallidas };
}

/* ------------------------------ LAS REGLAS ------------------------------ */

/**
 * ¿Se le enseña esta opción?
 *
 * Se apaga la que ya se falló **en esta etapa**: metiste la pata con este PNJ
 * y esa vía se cerró. Es lo que hace que elegir pese.
 */
export function opcionDisponible(trato: TratoPnj, etapa: string, indice: number): boolean {
  return !(trato.fallidas[etapa] ?? []).includes(indice);
}

/** El resultado de elegir una opción, ya resuelto. */
export type Resolucion = {
  acierto: boolean;
  /** Lo que dice el PNJ. */
  texto: string;
  /** El trato después. Nunca muta el que se le pasó. */
  trato: TratoPnj;
  /** Solo si acertó: lo que hay que entregar de verdad. */
  premio?: Premio;
  /** Slug de `data/misiones/`, solo si acertó. Lo resuelve quien lo consume. */
  mision?: string;
  abreTienda?: boolean;
  /** true = la conversación se cierra. */
  cierra: boolean;
};

/**
 * Resuelve una opción.
 *
 * `total` es lo que salió en la tirada **ya con el modificador sumado**; se le
 * pasa `null` cuando la opción no lleva chequeo. Que la tirada la haga el
 * tablero 3D o la escriba alguien no es asunto de esta función: aquí solo se
 * compara con la CD.
 *
 * ⚠️ **El premio y la misión solo salen al ACERTAR.** Va escrito aquí y no en
 * la pantalla porque es justo la regla que no puede fallar en silencio: una
 * opción que reparta el objeto al fallar no lo cantaría nadie.
 */
export function resolver(
  arbol: ArbolDialogo, trato: TratoPnj, indice: number, total: number | null,
): Resolucion | null {
  const etapa = arbol.etapas[trato.etapa];
  const opt = etapa?.opciones[indice];
  if (!etapa || !opt) return null;
  if (!opcionDisponible(trato, trato.etapa, indice)) return null;

  // Sin chequeo siempre acierta; con chequeo hace falta el total.
  if (opt.chequeo && total === null) return null;
  const acierto = !opt.chequeo || (total as number) >= opt.chequeo.cd;

  const delta = acierto
    ? (opt.confianza?.exito ?? SUBE)
    : (opt.confianza?.fallo ?? BAJA);
  const confianza = Math.max(0, Math.min(100, trato.confianza + delta));

  // Quemar la opción fallada, y **solo si llevaba chequeo**: apagar una de
  // charla la haría desaparecer sin que el jugador entienda por qué.
  const fallidas = { ...trato.fallidas };
  if (!acierto && opt.chequeo) {
    const ya = fallidas[trato.etapa] ?? [];
    if (!ya.includes(indice)) fallidas[trato.etapa] = [...ya, indice];
  }

  const destino = acierto ? opt.siguiente : opt.siguienteSiFalla;
  const cierra = acierto && opt.siguiente === null;
  // Una etapa que no existe deja al jugador donde estaba en vez de en la nada.
  const etapaNueva = destino && arbol.etapas[destino] ? destino : trato.etapa;

  return {
    acierto,
    texto: acierto ? opt.exito : (opt.fallo ?? opt.exito),
    trato: { confianza, etapa: etapaNueva, fallidas },
    premio: acierto ? opt.premio : undefined,
    mision: acierto ? opt.mision : undefined,
    abreTienda: acierto ? opt.abreTienda : undefined,
    cierra,
  };
}

/** Color de la barra de confianza. La pantalla solo pinta lo que diga esto. */
export function tonoConfianza(c: number): "hostil" | "neutral" | "amistoso" {
  if (c < 30) return "hostil";
  if (c < 70) return "neutral";
  return "amistoso";
}

/**
 * ¿Puede este jugador estar en esta etapa?
 *
 * Una etapa con `confianzaMin` se cierra si la confianza baja después de
 * haberla alcanzado: el PNJ deja de tratarte como te trataba. Devuelve la
 * etapa a la que hay que caer, o la misma si todo está bien.
 */
export function etapaVigente(arbol: ArbolDialogo, trato: TratoPnj): string {
  const e = arbol.etapas[trato.etapa];
  if (!e) return arbol.inicio;
  if (e.confianzaMin != null && trato.confianza < e.confianzaMin) return arbol.inicio;
  return trato.etapa;
}
