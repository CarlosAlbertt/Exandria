// Reglas de progresión (D&D 2024): niveles de mejora de característica (ASI),
// competencia, PG, y config de huecos de accesorio dinámicos.
import type { AbilityKey } from "./rules";

/** Niveles de ASI por slug de clase (los que difieren del estándar). */
export const ASI_LEVELS: Record<string, number[]> = {
  guerrero: [4, 6, 8, 12, 14, 16, 19],
  picaro: [4, 8, 10, 12, 16, 19],
};
export const DEFAULT_ASI_LEVELS = [4, 8, 12, 16, 19];

export function asiLevelsFor(clsSlug: string | null | undefined): number[] {
  return (clsSlug && ASI_LEVELS[clsSlug]) || DEFAULT_ASI_LEVELS;
}

/** Hitos de ASI ya alcanzados a un nivel dado. */
export function reachedAsiLevels(clsSlug: string | null | undefined, level: number): number[] {
  return asiLevelsFor(clsSlug).filter((l) => l <= level);
}

/** Puntos de ASI totales disponibles (2 por hito alcanzado). */
export function asiPoints(clsSlug: string | null | undefined, level: number): number {
  return reachedAsiLevels(clsSlug, level).length * 2;
}

/** Competencia 2024: 2 + floor((nivel-1)/4). Nivel se acota a 1..20. */
export function proficiencyBonus(level: number): number {
  const l = Math.max(1, Math.min(20, level));
  return 2 + Math.floor((l - 1) / 4);
}

/** PG máximo: nivel 1 = dado + modCon; siguientes = (dado/2 + 1 + modCon) c/u. */
export function maxHp(hitDie: number, level: number, conMod: number): number {
  const l = Math.max(1, Math.min(20, level));
  const first = hitDie + conMod;
  const perLevel = Math.floor(hitDie / 2) + 1 + conMod;
  return Math.max(1, first + (l - 1) * perLevel);
}

/** Config de huecos de accesorio dinámicos. count = max(min, mult*mod). */
export const ACCESSORY_SLOTS: { type: string; label: string; stat: AbilityKey; mult: number; min: number }[] = [
  { type: "anillo", label: "Anillo", stat: "int", mult: 2, min: 0 },
  { type: "colgante", label: "Colgante", stat: "sab", mult: 1, min: 0 },
  { type: "amuleto", label: "Amuleto", stat: "car", mult: 1, min: 0 },
];

/** Accesorio fijo: 1 collar. */
export const FIXED_ACCESSORY = { type: "collar", label: "Collar", count: 1 };

export function accessoryCount(mult: number, mod: number, min: number): number {
  return Math.max(min, mult * mod);
}

/** Tira un dado de PG (1..hitDie). */
export function rollHitDie(hitDie: number): number {
  return 1 + Math.floor(Math.random() * hitDie);
}

/**
 * PG máx a partir de las tiradas guardadas.
 * Nivel 1 = dado máx + CON. Niveles 2..N: (tirada guardada o media dado/2+1) + CON.
 * `rolls` = mapa nivel(str)→dado bruto (sin CON).
 */
export function maxHpFromRolls(hitDie: number, level: number, conMod: number, rolls: Record<string, number>): number {
  const l = Math.max(1, Math.min(20, level));
  let hp = hitDie + conMod;
  for (let lv = 2; lv <= l; lv++) {
    const raw = rolls[String(lv)];
    const base = typeof raw === "number" ? raw : Math.floor(hitDie / 2) + 1;
    hp += base + conMod;
  }
  return Math.max(1, hp);
}
