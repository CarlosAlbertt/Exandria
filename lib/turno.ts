// Economía del turno de combate 2024, PURO (sin React ni Supabase). Molde de
// lib/recursos.ts / lib/estado.ts. Fusiona play_state, no toca usos/hp/conds.
import type { PlayState } from "@/lib/recursos";

export type Recurso = "accion" | "adicional" | "reaccion";

/** Lee la economía del turno; ausente ⇒ todo libre, contadores a 0. */
export function turnoDe(play: PlayState): { accion: boolean; adicional: boolean; reaccion: boolean; movGastado: number; ataquesUsados: number } {
  const t = play.turno ?? {};
  return {
    accion: !!t.accion,
    adicional: !!t.adicional,
    reaccion: !!t.reaccion,
    movGastado: Math.max(0, Math.floor(t.movGastado ?? 0)),
    ataquesUsados: Math.max(0, Math.floor(t.ataquesUsados ?? 0)),
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

/**
 * Marca un ataque más de los que da la acción de Atacar (tope `max`).
 * Ojo: NO gasta la acción — la acción de Atacar se paga una vez, en el primer
 * golpe, y de ahí salen todos los ataques del turno.
 */
export function gastarAtaque(play: PlayState, max: number): PlayState {
  return conTurno(play, { ataquesUsados: Math.min(max, turnoDe(play).ataquesUsados + 1) });
}

/** Ataques que quedan de la acción de Atacar este turno. */
export function ataquesRestantes(play: PlayState, max: number): number {
  return Math.max(0, max - turnoDe(play).ataquesUsados);
}

/** Limpia el turno (empieza tu turno): borra la clave `turno`. */
export function limpiarTurno(play: PlayState): PlayState {
  const next = { ...play };
  delete next.turno;
  return next;
}
