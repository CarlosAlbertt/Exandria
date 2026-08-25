// El catálogo entero de misiones preparadas. Ver `types.ts` para qué es esto y
// qué NO es (no es la tabla `quests`, no es `lib/misiones.ts`).
//
// Quince misiones, con el reparto que se pidió el 2026-08-08 y que el gate
// obliga a mantener:
//   · 6 para uno o dos jugadores  (`menores.ts`)
//   · 4 para tres                 (`trios.ts`)
//   · 2 para el grupo entero      (`grupo.ts` + `zigurat.ts`)
//   · 3 legendarias, letales      (`legendarias.ts`)

import type { Mision, Tamano } from "./types";
import { esFranja } from "../lugares";
import { ZIGURAT_LINDE } from "./zigurat";
import { MENORES } from "./menores";
import { TRIOS } from "./trios";
import { GRUPO } from "./grupo";
import { LEGENDARIAS } from "./legendarias";

export const MISIONES: Mision[] = [
  ZIGURAT_LINDE,
  ...MENORES,
  ...TRIOS,
  ...GRUPO,
  ...LEGENDARIAS,
];

export function getMision(slug: string | null | undefined): Mision | null {
  return (slug ? MISIONES.find((m) => m.slug === slug) : null) ?? null;
}

/** Las de un tamaño, en el orden en que están escritas. */
export function misionesDe(tamano: Tamano): Mision[] {
  return MISIONES.filter((m) => m.tamano === tamano);
}

/**
 * Las que se pueden poner delante de un grupo de N jugadores a nivel L.
 *
 * El nivel es un RANGO y se cruza por solape, no por igualdad: una misión
 * escrita para [3, 4] vale a nivel 3 y a nivel 4. Y `jugadores` es para cuántos
 * está presupuestada, así que se pide exacto: una misión medida para uno no se
 * le pone a seis sin rehacer el presupuesto.
 */
export function misionesPara(jugadores: number, nivel: number): Mision[] {
  return MISIONES.filter(
    (m) => m.jugadores === jugadores && nivel >= m.nivel[0] && nivel <= m.nivel[1],
  );
}

/**
 * El `poi_name` con el que se abre la fila de `quests`, o `null`.
 *
 * ⚠️ **Una franja del bosque no es un pin del mapa.** Guardar `franja:linde` en
 * `poi_name` deja la misión apuntando a algo que el mapa no sabe pintar, y eso
 * no da error en ninguna parte: simplemente la Crónica enseña un lugar que no se
 * puede abrir.
 *
 * Vivía dentro de `app/api/mision-dialogo/route.ts` como un `startsWith`
 * suelto — la cuarta copia del prefijo en el repo. El dueño del prefijo es
 * `data/lugares.ts`, que es quien lo compone con `idFranja`.
 */
export function poiDeMision(lugar: string): string | null {
  return esFranja(lugar) ? null : lugar;
}

export type { Mision, Tamano, Encuentro, Escena } from "./types";
export { TAMANO_LABEL, TAMANOS, TAMANOS_DE_GRUPO, esDelGrupo } from "./types";
