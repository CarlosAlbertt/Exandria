// Resolución PURA de los pozos de usos de clase. Sin React ni Supabase, mismo
// espíritu que lib/derive.ts y lib/gameClock.ts.
//
// Se guarda lo GASTADO, no lo restante: el máximo depende del nivel, así que si
// el personaje sube de nivel los usos nuevos le llegan solos.

import { getMechanics } from "@/data/classdata";

/** Estado de juego de la ficha: usos (O1), combate (G1/G2) y conjuros (O2). */
export type PlayState = {
  usos?: Record<string, number>;
  /** PG actuales; ausente ⇒ el máximo (una ficha nueva está a tope). */
  hp?: number;
  /** PG temporales; se restan antes que `hp` y no exceden el daño recibido. */
  tempHp?: number;
  /** Salvaciones de muerte a 0 PG; presente solo mientras estás a 0. */
  muerte?: { ok: number; fail: number };
  /** Slugs de condición activa: ["envenenado", "derribado"]. */
  conds?: string[];
  /** Nivel de agotamiento 0–6. */
  agotamiento?: number;
  /** Economía del turno de combate actual (G2); ausente ⇒ turno fresco. */
  turno?: {
    accion?: boolean;      // acción gastada
    adicional?: boolean;   // acción adicional gastada
    reaccion?: boolean;    // reacción gastada
    movGastado?: number;   // metros ya movidos este turno
    ataquesUsados?: number; // ataques ya gastados de la acción de Atacar (multiataque)
  };
  /** Huecos de conjuro GASTADOS por nivel de espacio: { "1": 2, "3": 1 } (O2). */
  huecos?: Record<string, number>;
  /** Ids de conjuro preparados/conocidos, trucos incluidos (O2). */
  preparados?: string[];
  /** Id del conjuro de concentración activo; ausente ⇒ ninguno (O2). */
  concentrando?: string;
  /**
   * Cupo del taller: el **minuto de juego absoluto** en que vuelve a estar
   * libre. Ausente ⇒ nunca se ha gastado.
   *
   * Se compara contra el reloj de campaña y NO contra la hora real, para que el
   * cupo avance cuando el DM adelanta días desde Panel DM › Tiempo. Lo leen y lo
   * escriben `lib/recetario.ts` y el caldero.
   */
  tallerCupo?: number;
  /** Dónde está este jugador por su cuenta. Ver `lib/nodos.ts` (`Sitio`). */
  sitio?: { nodo: string; desde: string; puesto?: "dm" };
  /**
   * Minutos de juego que lleva de más por haber viajado o descansado solo.
   *
   * ⚠️ **Sin `sitio` no hay `desfase`**: volver con el grupo es volver a su hora.
   * La regla vive en `sanearSitio` (`lib/nodos.ts`) y el gate la vigila.
   */
  desfase?: number;
  /**
   * Su último descanso largo, en SU minuto de juego (con el desfase dentro).
   *
   * Va por ficha desde la tanda del reloj por jugador: el freno vivía en
   * `app_config.last_long_rest`, compartido, y quien se iba solo a Emon no podía
   * descansar porque sus compañeros habían descansado en Byroden.
   */
  ultimoLargo?: number;
  [otros: string]: unknown;
};

export type Pozo = {
  key: string;
  name: string;
  max: number;
  gastados: number;
  quedan: number;
  recharge: "corto" | "largo";
  /** Sin tope (Forma Salvaje del druida a nv20): no se cuenta, se usa y ya. */
  ilimitado?: boolean;
};

// Las tablas de progresión no son solo números: usan "—" para los niveles en
// que la clase AÚN NO tiene el rasgo, e "Ilimitados" para el caso del druida a
// nivel 20. Se traducen aquí y no en los datos, porque la tabla es lo que
// imprime el libro y se muestra tal cual como referencia.
const SIN_TOPE = "ilimitados";

function maxDeNivel(valor: number | string): { max: number; ilimitado: boolean } {
  if (typeof valor === "string" && valor.trim().toLowerCase() === SIN_TOPE) return { max: 0, ilimitado: true };
  return { max: Number(valor) || 0, ilimitado: false }; // "—" → NaN → 0: aún no lo tienes
}

/** Pozos de esa clase a ese nivel. Los que aún valen 0 NO se listan. */
export function pozosDe(clsSlug: string, level: number, play: PlayState): Pozo[] {
  const m = getMechanics(clsSlug);
  if (!m?.resources) return [];
  const i = Math.max(0, Math.min(19, Math.floor(level) - 1));
  const out: Pozo[] = [];
  for (const r of m.resources) {
    if (!r.spend) continue;
    const { max, ilimitado } = maxDeNivel(r.values[i]);
    if (!ilimitado && max <= 0) continue;
    const gastados = ilimitado ? 0 : Math.min(max, Math.max(0, play.usos?.[r.spend.key] ?? 0));
    out.push({
      key: r.spend.key,
      name: r.name,
      max,
      gastados,
      quedan: max - gastados,
      recharge: r.spend.recharge,
      ...(ilimitado ? { ilimitado: true } : {}),
    });
  }
  return out;
}

/** Columnas de referencia (daño de furia, dado de artes marciales…) al nivel. */
export function referenciasDe(clsSlug: string, level: number): { name: string; value: string }[] {
  const m = getMechanics(clsSlug);
  if (!m?.resources) return [];
  const i = Math.max(0, Math.min(19, Math.floor(level) - 1));
  return m.resources
    .filter((r) => !r.spend)
    .map((r) => ({ name: r.name, value: String(r.values[i]) }))
    .filter((r) => r.value && r.value !== "0" && r.value !== "—");
}

export function gastar(play: PlayState, key: string, max: number): PlayState {
  const usos = { ...(play.usos ?? {}) };
  usos[key] = Math.min(max, (usos[key] ?? 0) + 1);
  return { ...play, usos };
}

export function devolver(play: PlayState, key: string): PlayState {
  const usos = { ...(play.usos ?? {}) };
  usos[key] = Math.max(0, (usos[key] ?? 0) - 1);
  return { ...play, usos };
}

/** Descansar: corto recarga solo los suyos; largo, todos. Nunca toca otras claves. */
export function recargar(play: PlayState, clsSlug: string, level: number, tipo: "corto" | "largo"): PlayState {
  const usos = { ...(play.usos ?? {}) };
  for (const p of pozosDe(clsSlug, level, play)) {
    if (tipo === "largo" || p.recharge === "corto") usos[p.key] = 0;
  }
  return { ...play, usos };
}
