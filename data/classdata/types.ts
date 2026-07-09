// Datos mecánicos por clase (D&D 2024 + Cazador de Sangre de Critical Role).
// Hechos de juego: dados, competencias, progresión. Descripciones: resúmenes
// propios en español.
import type { AbilityKey } from "@/data/rules";

export type CasterKind = "full" | "half" | "pact" | "none";

export type ClassFeature = {
  level: number;
  name: string;        // nombre canónico traducido (p. ej. "Furia")
  blurb: string;       // 1-2 frases PROPIAS en español
  subclass?: boolean;  // true si la otorga la subclase
};

export type ClassMechanics = {
  slug: string;                     // igual que data/classes.ts
  primaryAbility: AbilityKey[];     // p. ej. ["fue"]
  saves: [AbilityKey, AbilityKey];
  skillChoices: { pick: number; from: string[] }; // nombres de SKILLS (ES)
  armor: string[];                  // "ligera" | "media" | "pesada" | "escudos"
  weapons: string[];                // "sencillas" | "marciales" | lista concreta
  startingGold: number;             // opción B de equipo (solo oro)
  startingEquipment: string[];      // opción A, nombres en español
  caster: CasterKind;
  spellAbility?: AbilityKey;        // si caster !== "none"
  features: ClassFeature[];         // niveles 1-20, orden ascendente
  /** columnas extra de la tabla de progresión, por nivel 1-20 */
  resources?: { name: string; values: (number | string)[] }[];
};
