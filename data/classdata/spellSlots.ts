// Espacios de conjuro por nivel de clase (D&D 2024). Hechos de juego.
// FULL_CASTER_SLOTS[nivel-1] = espacios de nv1..nv9.
// Tabla compartida por Bardo, Clérigo, Druida, Hechicero y Mago.
import type { CasterKind } from "./types";

export const FULL_CASTER_SLOTS: number[][] = [
  [2, 0, 0, 0, 0, 0, 0, 0, 0], // nv1
  [3, 0, 0, 0, 0, 0, 0, 0, 0], // nv2
  [4, 2, 0, 0, 0, 0, 0, 0, 0], // nv3
  [4, 3, 0, 0, 0, 0, 0, 0, 0], // nv4
  [4, 3, 2, 0, 0, 0, 0, 0, 0], // nv5
  [4, 3, 3, 0, 0, 0, 0, 0, 0], // nv6
  [4, 3, 3, 1, 0, 0, 0, 0, 0], // nv7
  [4, 3, 3, 2, 0, 0, 0, 0, 0], // nv8
  [4, 3, 3, 3, 1, 0, 0, 0, 0], // nv9
  [4, 3, 3, 3, 2, 0, 0, 0, 0], // nv10
  [4, 3, 3, 3, 2, 1, 0, 0, 0], // nv11
  [4, 3, 3, 3, 2, 1, 0, 0, 0], // nv12
  [4, 3, 3, 3, 2, 1, 1, 0, 0], // nv13
  [4, 3, 3, 3, 2, 1, 1, 0, 0], // nv14
  [4, 3, 3, 3, 2, 1, 1, 1, 0], // nv15
  [4, 3, 3, 3, 2, 1, 1, 1, 0], // nv16
  [4, 3, 3, 3, 2, 1, 1, 1, 1], // nv17
  [4, 3, 3, 3, 3, 1, 1, 1, 1], // nv18
  [4, 3, 3, 3, 3, 2, 1, 1, 1], // nv19
  [4, 3, 3, 3, 3, 2, 2, 1, 1], // nv20
];

// Tabla compartida por Paladín y Explorador (semiconjuradores, PHB 2024:
// obtienen conjuros ya en nv1).
export const HALF_CASTER_SLOTS: number[][] = [
  [2, 0, 0, 0, 0], // nv1
  [2, 0, 0, 0, 0], // nv2
  [3, 0, 0, 0, 0], // nv3
  [3, 0, 0, 0, 0], // nv4
  [4, 2, 0, 0, 0], // nv5
  [4, 2, 0, 0, 0], // nv6
  [4, 3, 0, 0, 0], // nv7
  [4, 3, 0, 0, 0], // nv8
  [4, 3, 2, 0, 0], // nv9
  [4, 3, 2, 0, 0], // nv10
  [4, 3, 3, 0, 0], // nv11
  [4, 3, 3, 0, 0], // nv12
  [4, 3, 3, 1, 0], // nv13
  [4, 3, 3, 1, 0], // nv14
  [4, 3, 3, 2, 0], // nv15
  [4, 3, 3, 2, 0], // nv16
  [4, 3, 3, 3, 1], // nv17
  [4, 3, 3, 3, 1], // nv18
  [4, 3, 3, 3, 2], // nv19
  [4, 3, 3, 3, 2], // nv20
];

// Magia de Pacto del Brujo: número de espacios y el nivel de esos espacios
// (todos los espacios de un mismo nivel de brujo son del mismo nivel de conjuro).
export const PACT_SLOTS: { count: number; slotLevel: number }[] = [
  { count: 1, slotLevel: 1 }, // nv1
  { count: 2, slotLevel: 1 }, // nv2
  { count: 2, slotLevel: 2 }, // nv3
  { count: 2, slotLevel: 2 }, // nv4
  { count: 2, slotLevel: 3 }, // nv5
  { count: 2, slotLevel: 3 }, // nv6
  { count: 2, slotLevel: 4 }, // nv7
  { count: 2, slotLevel: 4 }, // nv8
  { count: 2, slotLevel: 5 }, // nv9
  { count: 2, slotLevel: 5 }, // nv10
  { count: 3, slotLevel: 5 }, // nv11
  { count: 3, slotLevel: 5 }, // nv12
  { count: 3, slotLevel: 5 }, // nv13
  { count: 3, slotLevel: 5 }, // nv14
  { count: 3, slotLevel: 5 }, // nv15
  { count: 3, slotLevel: 5 }, // nv16
  { count: 4, slotLevel: 5 }, // nv17
  { count: 4, slotLevel: 5 }, // nv18
  { count: 4, slotLevel: 5 }, // nv19
  { count: 4, slotLevel: 5 }, // nv20
];

/**
 * Devuelve la fila de espacios de conjuro para un tipo de conjurador y nivel
 * de clase dados. "full" y "half" devuelven filas de 9 y 5 columnas
 * respectivamente; "pact" se expande a una fila de 9 columnas (índice
 * slotLevel-1 = count); "none" devuelve null. El nivel se acota a 1..20.
 */
export function slotsFor(caster: CasterKind, level: number): number[] | null {
  const lvl = Math.min(20, Math.max(1, level));
  switch (caster) {
    case "full":
      return FULL_CASTER_SLOTS[lvl - 1].slice();
    case "half":
      return HALF_CASTER_SLOTS[lvl - 1].slice();
    case "pact": {
      const { count, slotLevel } = PACT_SLOTS[lvl - 1];
      const row = new Array(9).fill(0);
      row[slotLevel - 1] = count;
      return row;
    }
    case "none":
    default:
      return null;
  }
}
