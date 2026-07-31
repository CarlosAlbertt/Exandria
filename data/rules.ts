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

// Abreviatura de una aptitud por su clave ("fue" → "FUE"). Cae a la clave en
// mayúsculas si no existe.
export function abbrOf(key: string): string {
  return ABILITIES.find((a) => a.key === key)?.abbr ?? key.toUpperCase();
}

export type Skill = {
  name: string;
  /** Aptitud primaria: la ÚNICA que suma el bono de competencia. */
  ability: AbilityKey;
  /**
   * Aptitud secundaria, solo en las pericias de oficio de aptitud doble.
   * Se puede tirar con ella cuando la situación lo pida, pero **a aptitud
   * pelada**: la competencia no entra. Por eso la ficha enseña dos números.
   */
  ability2?: AbilityKey;
  /**
   * Pericia de **oficio**: homebrew de esta campaña, no del reglamento 2024.
   * No compiten con las 18 de siempre — tienen su propio cupo (ver
   * `oficioPicks` en `data/leveling.ts`) y su propia lista por clase
   * (`CharClass.oficios` en `data/classes.ts`).
   */
  oficio?: true;
};

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

  // --- Pericias de oficio (homebrew de campaña) ----------------------------
  // Las siete no son del reglamento 2024. Tres llevan aptitud doble: la
  // primera es la primaria (la que suma competencia) y la segunda se tira a
  // pelo.
  { name: "Alquimia", ability: "int", oficio: true },
  { name: "Forja", ability: "sab", ability2: "fue", oficio: true },
  { name: "Cocina", ability: "sab", oficio: true },
  { name: "Cristalografía Arcana", ability: "int", oficio: true },
  { name: "Tatuaje Rúnico", ability: "des", ability2: "int", oficio: true },
  { name: "Extracción de Componentes", ability: "des", ability2: "int", oficio: true },
  { name: "Destilación Exandriana", ability: "sab", oficio: true },
];

/** Solo las pericias de oficio, en el orden de `SKILLS`. */
export const OFICIOS: Skill[] = SKILLS.filter((s) => s.oficio);

/** Solo las 18 del reglamento 2024. */
export const SKILLS_2024: Skill[] = SKILLS.filter((s) => !s.oficio);

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
