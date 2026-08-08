// A quién le pasa el tiempo cuando alguien descansa, como reglas puras.
//
// ⚠️ Aparte de `lib/descanso.ts`, que es el CLIENTE del endpoint y lleva
// "use client". Estas son las reglas, y tienen que poder importarse desde el
// servidor (`/api/descanso`) y desde el gate: un módulo de cliente no vale para
// ninguna de las dos cosas.
//
// Módulo neutral (sin "use client" y sin Supabase) igual que `lib/nodos.ts` y
// `lib/viaje.ts`, y aquí hacía especialmente falta: **toda esta decisión vivía
// dentro de `/api/descanso`, pegada a los `upsert` de Supabase, donde ningún gate
// llega**. Es la lección de `puedeSembrar` y van diez.
//
// ⚠️ Y al sacarla salieron DOS fallos que ya estaban ahí, ver abajo.

/** Lo que dura cada descanso, en minutos de juego. */
export const MINUTOS_DESCANSO = { corto: 60, largo: 480 } as const;

/** Lo que hay que esperar entre dos descansos largos. 20 h de juego. */
export const MIN_ENTRE_LARGOS = 1200;

export type Descanso = "corto" | "largo";

/**
 * ¿Puede este jugador echarse otro descanso largo?
 *
 * ⚠️ **Va POR FICHA, y antes era del grupo.** El freno vivía en
 * `app_config.last_long_rest`, compartido, y con la posición por jugador eso
 * pasó a estar mal: un jugador que se iba solo a Emon **no podía descansar
 * porque sus compañeros habían descansado en Byroden**, y el mensaje se lo
 * decía tal cual («el grupo ya ha descansado hace poco»). Sigue frenando el
 * abuso —no se encadenan largos— sin castigar a nadie por lo que hizo otro.
 *
 * Tolerante con lo que haya guardado: un `ultimoLargo` que no sea un número
 * finito **deja descansar**. Es la dirección de error correcta —lo peor que pasa
 * es un descanso de más— frente a dejar a alguien sin poder descansar nunca por
 * un `jsonb` a medias.
 */
export function puedeDescansarLargo(
  ultimoLargoPropio: unknown,
  ahoraPropio: number,
): { ok: true } | { ok: false; error: string } {
  const last = typeof ultimoLargoPropio === "number" ? ultimoLargoPropio : Number.NaN;
  if (!Number.isFinite(last)) return { ok: true };
  if (ahoraPropio - last < MIN_ENTRE_LARGOS) {
    return { ok: false, error: "Ya has descansado hace poco; espera al menos un día." };
  }
  return { ok: true };
}

/** Qué mueve un descanso: el reloj de todos, o solo el tuyo. */
export type PlanDescanso = {
  /** Lo que dura. */
  minutos: number;
  /** Minutos que se le suman al reloj COMPARTIDO. 0 = no se toca. */
  avanceCompartido: number;
  /** El desfase que le queda a este jugador. */
  desfase: number;
  /** Su «ahora» justo después, con el que sellar el freno del largo. */
  ahoraPropioDespues: number;
};

/**
 * A quién le avanza el tiempo.
 *
 * ⚠️ **Depende de si estás con el grupo, y es la decisión de la tanda.**
 *
 * - **Con el grupo**: mueve el reloj COMPARTIDO, como hasta ahora. El grupo
 *   descansa junto y que a todos les pasen ocho horas es lo correcto.
 * - **Por tu cuenta**: mueve solo TU desfase. Antes un jugador que descansaba
 *   solo en Emon **le adelantaba ocho horas a los cuatro que seguían en
 *   Byroden**, sin que hubieran hecho nada. Ese fallo ya estaba ahí; con la
 *   posición por jugador se volvía indefendible.
 *
 * ⚠️ **Y el segundo fallo que ya estaba: el reloj se sumaba UNA VEZ POR CADA
 * UNO.** Cinco jugadores descansando largo juntos son cinco llamadas, y cada
 * una hacía `epochGameMin = ahora + 480`: el grupo se comía **cuarenta horas**
 * por una noche. Se desduplica con `ultimoAvanceGrupo`: si el reloj ya se movió
 * por un descanso hace menos de lo que dura este, no se vuelve a mover.
 *
 * Efecto lateral aceptado: un descanso CORTO justo después del largo de otro
 * tampoco mueve el reloj. Se prefiere así — el error va hacia **no inflar el
 * tiempo**, que es el que se acumula y no se ve.
 */
export function planDescanso(args: {
  kind: Descanso;
  /** ¿Está donde el DM plantó al grupo? */
  conElGrupo: boolean;
  /** El desfase que ya llevaba. */
  desfase: number;
  /** El minuto de juego del reloj compartido, ahora. */
  ahoraCompartido: number;
  /** Cuándo movió un descanso el reloj compartido por última vez. */
  ultimoAvanceGrupo: number | null;
}): PlanDescanso {
  const { kind, conElGrupo, ahoraCompartido, ultimoAvanceGrupo } = args;
  const minutos = MINUTOS_DESCANSO[kind];
  const desfasePrevio = Number.isFinite(args.desfase) && args.desfase > 0 ? Math.floor(args.desfase) : 0;

  if (!conElGrupo) {
    const desfase = desfasePrevio + minutos;
    return { minutos, avanceCompartido: 0, desfase, ahoraPropioDespues: ahoraCompartido + desfase };
  }

  // Con el grupo: el desfase es cero por la invariante («sin sitio no hay
  // desfase»), así que no hay nada que arrastrar.
  const yaMovido = ultimoAvanceGrupo !== null
    && Number.isFinite(ultimoAvanceGrupo)
    && ahoraCompartido - ultimoAvanceGrupo < minutos;
  const avanceCompartido = yaMovido ? 0 : minutos;
  return { minutos, avanceCompartido, desfase: 0, ahoraPropioDespues: ahoraCompartido + avanceCompartido };
}
