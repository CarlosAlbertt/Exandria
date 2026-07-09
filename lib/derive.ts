// Motor de derivación de ficha (D&D 2024). Módulo puro: sin React, sin
// Supabase, sin efectos secundarios. Toma los datos crudos de personaje
// (aptitudes base, bonos, ASI, nivel, clase, equipo, pericias) y calcula
// todo lo derivado: puntuaciones finales, PG máx, CA, salvaciones, pericias,
// percepción pasiva y (si conjurador) CD/ataque/espacios de conjuro.
//
// Las fórmulas de PG (maxHpFromRolls) y competencia (proficiencyBonus) se
// reutilizan tal cual de data/leveling.ts: son las mismas que ya usa
// components/LevelPanel.tsx, para no duplicar ni desincronizar semántica.
import { ABILITIES, SKILLS, abilityMod } from "@/data/rules";
import type { AbilityKey } from "@/data/rules";
import { proficiencyBonus, maxHpFromRolls } from "@/data/leveling";
import { getMechanics } from "@/data/classdata";
import { slotsFor } from "@/data/classdata/spellSlots";
import { getClass } from "@/data/classes";
import type { CharacterData } from "@/lib/character";

export type Derived = {
  abilities: Record<AbilityKey, { score: number; mod: number }>;
  prof: number;
  maxHp: number;
  ac: number;
  acSource: string;
  initiative: number;
  saves: Record<AbilityKey, { mod: number; proficient: boolean }>;
  skills: { name: string; ability: AbilityKey; mod: number; proficient: boolean }[];
  passivePerception: number;
  spellDc?: number;
  spellAttack?: number;
  spellSlots?: number[]; // fila de slotsFor (9 col en full/pact, 5 col en half), solo si caster !== "none"
};

/** Tipo de armadura pesada/media/ligera → progresión de bono de Destreza. */
type ArmorKind = "ligera" | "media" | "pesada";

/**
 * Catálogo interno de CA por nombre de armadura. data/equipment.ts sólo
 * define nombres de objetos (sin datos de CA), así que este mapeo traduce
 * los 4 nombres de armadura corporal de CATALOG.Armaduras a sus valores
 * base de D&D 2024. "Escudo" se trata aparte (bono plano, no cuerpo).
 * Mantener en sincronía con CATALOG.Armaduras en data/equipment.ts.
 */
const ARMOR_LOOKUP: Record<string, { base: number; kind: ArmorKind }> = {
  "Armadura de cuero": { base: 11, kind: "ligera" },
  "Cota de escamas": { base: 14, kind: "media" },
  "Coraza": { base: 14, kind: "media" },
  "Cota de mallas": { base: 16, kind: "pesada" },
};
const SHIELD_NAME = "Escudo";
const SHIELD_BONUS = 2;

/** Puntuación final de una aptitud: base + bono de trasfondo + suma de ASI repartida en todos los hitos. */
export function totalScore(c: Partial<CharacterData>, k: AbilityKey): number {
  const base = c.base?.[k] ?? 10;
  const bonus = c.bonus?.[k] ?? 0;
  let asiSum = 0;
  if (c.asi) {
    for (const lvlKey of Object.keys(c.asi)) {
      asiSum += c.asi[lvlKey]?.[k] ?? 0;
    }
  }
  return base + bonus + asiSum;
}

export function derive(c: Partial<CharacterData>): Derived {
  const level = c.level ?? 1;

  const abilities = {} as Derived["abilities"];
  for (const a of ABILITIES) {
    const score = totalScore(c, a.key);
    abilities[a.key] = { score, mod: abilityMod(score) };
  }

  const prof = proficiencyBonus(level);
  const mechanics = getMechanics(c.cls);
  const clsInfo = c.cls ? getClass(c.cls) : undefined;
  const hitDie = clsInfo?.hitDie ?? 8;
  const maxHp = maxHpFromRolls(hitDie, level, abilities.con.mod, c.hp_rolls ?? {});

  // --- Clase de Armadura ---
  const equipped = c.equipment ? Object.values(c.equipment) : [];
  let armorName: string | undefined;
  let shieldEquipped = false;
  for (const it of equipped) {
    if (!it) continue;
    if (it.name === SHIELD_NAME) shieldEquipped = true;
    else if (ARMOR_LOOKUP[it.name] && !armorName) armorName = it.name;
  }

  const des = abilities.des.mod;
  let ac: number;
  let acSource: string;
  if (armorName) {
    const info = ARMOR_LOOKUP[armorName];
    if (info.kind === "ligera") {
      ac = info.base + des;
      acSource = `${armorName} + DES`;
    } else if (info.kind === "media") {
      ac = info.base + Math.min(des, 2);
      acSource = `${armorName} + DES (máx 2)`;
    } else {
      ac = info.base;
      acSource = armorName;
    }
  } else if (c.cls === "barbaro") {
    ac = 10 + des + abilities.con.mod;
    acSource = "Defensa sin armadura (bárbaro): 10 + DES + CON";
  } else if (c.cls === "monje") {
    ac = 10 + des + abilities.sab.mod;
    acSource = "Defensa sin armadura (monje): 10 + DES + SAB";
  } else {
    ac = 10 + des;
    acSource = "10 + DES";
  }
  if (shieldEquipped) {
    ac += SHIELD_BONUS;
    acSource += " + Escudo (+2)";
  }

  const initiative = des;

  // --- Salvaciones ---
  const saves = {} as Derived["saves"];
  for (const a of ABILITIES) {
    const proficient = !!mechanics?.saves.includes(a.key);
    saves[a.key] = { mod: abilities[a.key].mod + (proficient ? prof : 0), proficient };
  }

  // --- Pericias ---
  const known = new Set(c.skills ?? []);
  const skills = SKILLS.map((s) => {
    const proficient = known.has(s.name);
    return { name: s.name, ability: s.ability, mod: abilities[s.ability].mod + (proficient ? prof : 0), proficient };
  });

  const percepcion = skills.find((s) => s.name === "Percepción");
  const passivePerception = 10 + (percepcion?.mod ?? abilities.sab.mod);

  // --- Conjuros ---
  let spellDc: number | undefined;
  let spellAttack: number | undefined;
  let spellSlots: number[] | undefined;
  if (mechanics && mechanics.caster !== "none" && mechanics.spellAbility) {
    const spellMod = abilities[mechanics.spellAbility].mod;
    spellDc = 8 + prof + spellMod;
    spellAttack = prof + spellMod;
    spellSlots = slotsFor(mechanics.caster, level) ?? undefined;
  }

  return {
    abilities,
    prof,
    maxHp,
    ac,
    acSource,
    initiative,
    saves,
    skills,
    passivePerception,
    spellDc,
    spellAttack,
    spellSlots,
  };
}
