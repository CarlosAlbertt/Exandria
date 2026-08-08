"use client";
import { useGameClock } from "@/lib/useGameClock";
import { useSitio } from "@/lib/useSitio";

/**
 * La hora de ESTE jugador: la del grupo más lo que lleve andado por su cuenta.
 *
 * ⚠️ **El reloj sigue siendo UNO.** No hay cinco relojes en `app_config`: hay el
 * del grupo, que es del DM, y un desfase por ficha que se le suma encima. Cinco
 * relojes habrían necesitado cinco filas que sincronizar, y el Panel Reloj del DM
 * no sabría cuál enseñar.
 *
 * ⚠️ **El desfase sale de `useSitio` y no de una consulta propia**, y no es
 * pereza: `useSitio` ya carga la ficha en juego y ya está suscrito a su fila por
 * realtime. Una segunda consulta con su propio canal sería una segunda forma de
 * leer lo mismo, y podrían discrepar medio segundo — el tiempo justo para que el
 * reloj de la barra y el de la hoja dijeran horas distintas.
 *
 * **El DM no tiene ficha**, así que su desfase es 0 y ve la hora del grupo. Eso
 * es lo que se quiere: su reloj es el ancla.
 */
export function useRelojJugador() {
  const { clock, nowGameMin, ready: relojListo } = useGameClock();
  const { desfase, ready: desfaseListo } = useSitio();

  return {
    clock,
    /** El minuto de juego de este jugador. */
    nowGameMin: nowGameMin + desfase,
    /** El del grupo, para cuando hay que enseñar los dos. */
    nowGrupoGameMin: nowGameMin,
    desfase,
    // ⚠️ Las DOS cosas listas. Con solo el reloj, la primera pintada saldría con
    // la hora del grupo y saltaría a la propia al cargar la ficha: un reloj que
    // da un brinco se lee como un fallo.
    ready: relojListo && desfaseListo,
  };
}
