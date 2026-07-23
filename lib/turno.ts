// Economía del turno de combate 2024, PURO (sin React ni Supabase). Molde de
// lib/recursos.ts / lib/estado.ts. Fusiona play_state, no toca usos/hp/conds.
import type { PlayState } from "@/lib/recursos";

export type Recurso = "accion" | "adicional" | "reaccion";

/** Lee la economía del turno; ausente ⇒ todo libre, movGastado 0. */
export function turnoDe(play: PlayState): { accion: boolean; adicional: boolean; reaccion: boolean; movGastado: number } {
  const t = play.turno ?? {};
  return {
    accion: !!t.accion,
    adicional: !!t.adicional,
    reaccion: !!t.reaccion,
    movGastado: Math.max(0, Math.floor(t.movGastado ?? 0)),
  };
}

function conTurno(play: PlayState, cambio: Partial<NonNullable<PlayState["turno"]>>): PlayState {
  return { ...play, turno: { ...(play.turno ?? {}), ...cambio } };
}

/** Marca un recurso como gastado. */
export function gastar(play: PlayState, r: Recurso): PlayState {
  return conTurno(play, { [r]: true });
}

/** Desmarca un recurso (deshacer). */
export function devolver(play: PlayState, r: Recurso): PlayState {
  return conTurno(play, { [r]: false });
}

/** Invierte el estado de un recurso (toque manual en la UI). */
export function alternarRecurso(play: PlayState, r: Recurso): PlayState {
  return conTurno(play, { [r]: !turnoDe(play)[r] });
}

/** Avanza (o retrocede, con `metros` negativo) el movimiento, en [0, velocidad]. */
export function mover(play: PlayState, metros: number, velocidad: number): PlayState {
  const actual = turnoDe(play).movGastado;
  const next = Math.max(0, Math.min(velocidad, actual + metros));
  return conTurno(play, { movGastado: next });
}

/** Metros que quedan por mover este turno. */
export function movRestante(play: PlayState, velocidad: number): number {
  return Math.max(0, velocidad - turnoDe(play).movGastado);
}

/** Limpia el turno (empieza tu turno): borra la clave `turno`. */
export function limpiarTurno(play: PlayState): PlayState {
  const next = { ...play };
  delete next.turno;
  return next;
}
