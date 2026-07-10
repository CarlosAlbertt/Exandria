// Datos mecánicos para construir encuentros (D&D 2024, DMG).
// Presupuesto de XP por PJ según nivel y dificultad, y XP por CR de monstruo.
// Fuente: tabla "XP Budget per Character" y tabla "XP por CR" del DMG 2024.

export type Difficulty = "baja" | "moderada" | "alta";

/**
 * XP por personaje según nivel (índice 0 = nivel 1 … índice 19 = nivel 20)
 * y dificultad. El presupuesto total del encuentro = suma de este valor para
 * el nivel de cada PJ del grupo (no se multiplica por un número fijo, porque
 * el grupo puede tener niveles distintos).
 */
export const XP_BUDGET: Record<Difficulty, number[]> = {
  baja: [
    50, 100, 150, 250, 500, 600, 750, 1000, 1300, 1600,
    1900, 2200, 2600, 2900, 3300, 3800, 4500, 5000, 5500, 6400,
  ],
  moderada: [
    75, 150, 225, 375, 750, 1000, 1300, 1700, 2000, 2300,
    2900, 3700, 4200, 4900, 5400, 6100, 7200, 8700, 10700, 13200,
  ],
  alta: [
    100, 200, 400, 500, 1100, 1400, 1700, 2100, 2600, 3100,
    4100, 4700, 5400, 6200, 7800, 9800, 11700, 14200, 17200, 22000,
  ],
};

/** XP por CR de monstruo (DMG 2024). */
export const CR_XP: { cr: string; xp: number }[] = [
  { cr: "0", xp: 10 },
  { cr: "1/8", xp: 25 },
  { cr: "1/4", xp: 50 },
  { cr: "1/2", xp: 100 },
  { cr: "1", xp: 200 },
  { cr: "2", xp: 450 },
  { cr: "3", xp: 700 },
  { cr: "4", xp: 1100 },
  { cr: "5", xp: 1800 },
  { cr: "6", xp: 2300 },
  { cr: "7", xp: 2900 },
  { cr: "8", xp: 3900 },
  { cr: "9", xp: 5000 },
  { cr: "10", xp: 5900 },
  { cr: "11", xp: 7200 },
  { cr: "12", xp: 8400 },
  { cr: "13", xp: 10000 },
  { cr: "14", xp: 11500 },
  { cr: "15", xp: 13000 },
  { cr: "16", xp: 15000 },
  { cr: "17", xp: 18000 },
  { cr: "18", xp: 20000 },
  { cr: "19", xp: 22000 },
  { cr: "20", xp: 25000 },
  { cr: "21", xp: 33000 },
  { cr: "22", xp: 41000 },
  { cr: "23", xp: 50000 },
  { cr: "24", xp: 62000 },
  { cr: "25", xp: 75000 },
  { cr: "26", xp: 90000 },
  { cr: "27", xp: 105000 },
  { cr: "28", xp: 120000 },
  { cr: "29", xp: 135000 },
  { cr: "30", xp: 155000 },
];

/** XP por CR (lookup rápido). */
export function xpForCr(cr: string): number {
  return CR_XP.find((c) => c.cr === cr)?.xp ?? 0;
}

/** Presupuesto total del grupo (suma por PJ) para una dificultad dada. */
export function partyBudget(levels: number[], diff: Difficulty): number {
  return levels.reduce((sum, lvl) => sum + (XP_BUDGET[diff][Math.max(1, Math.min(20, lvl)) - 1] ?? 0), 0);
}

/** Veredicto de dificultad real del encuentro frente a los presupuestos del grupo. */
export function verdict(totalMonsterXp: number, budgets: Record<Difficulty, number>): Difficulty | "mortal" {
  if (totalMonsterXp > budgets.alta) return "mortal";
  if (totalMonsterXp > budgets.moderada) return "alta";
  if (totalMonsterXp > budgets.baja) return "moderada";
  return "baja";
}
