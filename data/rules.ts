// Datos mecánicos base del sistema (D&D 2024). Hechos de juego: nombres,
// abreviaturas, asociación pericia↔aptitud, coste de compra de puntos.

export type AbilityKey = "fue" | "des" | "con" | "int" | "sab" | "car";

export const ABILITIES: { key: AbilityKey; name: string; abbr: string; blurb: string }[] = [
  { key: "fue", name: "Fuerza", abbr: "FUE", blurb: "Poder físico, atletismo y daño cuerpo a cuerpo." },
  { key: "des", name: "Destreza", abbr: "DES", blurb: "Agilidad, reflejos, sigilo y clase de armadura." },
  { key: "con", name: "Constitución", abbr: "CON", blurb: "Aguante, salud y puntos de golpe." },
  { key: "int", name: "Inteligencia", abbr: "INT", blurb: "Razonamiento, memoria y magia arcana." },
  { key: "sab", name: "Sabiduría", abbr: "SAB", blurb: "Percepción, intuición y magia divina." },
  { key: "car", name: "Carisma", abbr: "CAR", blurb: "Presencia, persuasión y fuerza de voluntad." },
];

export type Skill = { name: string; ability: AbilityKey };

export const SKILLS: Skill[] = [
  { name: "Acrobacias", ability: "des" },
  { name: "Arcanos", ability: "int" },
  { name: "Atletismo", ability: "fue" },
  { name: "Engaño", ability: "car" },
  { name: "Historia", ability: "int" },
  { name: "Interpretación", ability: "car" },
  { name: "Intimidación", ability: "car" },
  { name: "Investigación", ability: "int" },
  { name: "Juego de Manos", ability: "des" },
  { name: "Medicina", ability: "sab" },
  { name: "Naturaleza", ability: "int" },
  { name: "Percepción", ability: "sab" },
  { name: "Perspicacia", ability: "sab" },
  { name: "Persuasión", ability: "car" },
  { name: "Religión", ability: "int" },
  { name: "Sigilo", ability: "des" },
  { name: "Supervivencia", ability: "sab" },
  { name: "Trato con Animales", ability: "sab" },
];

// Compra de puntos (Point Buy 2024): 27 puntos, rango 8–15.
export const POINT_BUY_COST: Record<number, number> = {
  8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9,
};
export const POINT_BUY_BUDGET = 27;
export const POINT_BUY_MIN = 8;
export const POINT_BUY_MAX = 15;

export function abilityMod(score: number): number {
  return Math.floor((score - 10) / 2);
}
export function fmtMod(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}
