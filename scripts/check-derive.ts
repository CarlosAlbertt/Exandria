// Script de comprobación manual para lib/derive.ts.
// Uso: npx tsx scripts/check-derive.ts
import { derive, totalScore } from "../lib/derive";
import type { CharacterData } from "../lib/character";

let failures = 0;

function check(label: string, condition: boolean) {
  if (condition) {
    console.log(`OK   ${label}`);
  } else {
    console.log(`FAIL ${label}`);
    failures++;
  }
}

// --- Caso 1: bárbaro nivel 5, sin equipo, sin conjuros ---
{
  const c: Partial<CharacterData> = {
    level: 5,
    cls: "barbaro",
    base: { fue: 15, des: 14, con: 14, int: 8, sab: 10, car: 10 },
    bonus: { fue: 2, des: 0, con: 1, int: 0, sab: 0, car: 0 },
    asi: { "4": { fue: 2 } },
    skills: ["Atletismo"],
    equipment: {},
    hp_rolls: {},
  };
  const d = derive(c);
  check("Caso1: totalScore(fue) = 19", totalScore(c, "fue") === 19);
  check("Caso1: fue score 19", d.abilities.fue.score === 19);
  check("Caso1: fue mod +4", d.abilities.fue.mod === 4);
  check("Caso1: prof +3 (nivel 5)", d.prof === 3);
  check("Caso1: CA 14 (defensa sin armadura)", d.ac === 14);
  check("Caso1: acSource menciona bárbaro/sin armadura", /[Bb]árbaro/.test(d.acSource));
  check("Caso1: salvación FUE competente", d.saves.fue.proficient === true);
  check("Caso1: salvación CON competente", d.saves.con.proficient === true);
  check("Caso1: salvación INT NO competente", d.saves.int.proficient === false);
  check("Caso1: salvación FUE mod = 4+3=7", d.saves.fue.mod === 7);
  const atletismo = d.skills.find((s) => s.name === "Atletismo")!;
  check("Caso1: Atletismo competente", atletismo.proficient === true);
  check("Caso1: Atletismo mod = 4+3=7", atletismo.mod === 7);
  check("Caso1: iniciativa = mod DES = +2", d.initiative === 2);
  check("Caso1: sin conjuros (no spellDc)", d.spellDc === undefined);
}

// --- Caso 2: mago nivel 3, INT 16 ---
{
  const c: Partial<CharacterData> = {
    level: 3,
    cls: "mago",
    base: { fue: 8, des: 12, con: 12, int: 16, sab: 10, car: 8 },
    bonus: { fue: 0, des: 0, con: 0, int: 0, sab: 0, car: 0 },
    asi: {},
    skills: [],
  };
  const d = derive(c);
  check("Caso2: prof +2 (nivel 3)", d.prof === 2);
  check("Caso2: spellDc = 13", d.spellDc === 13);
  check("Caso2: spellAttack = +5", d.spellAttack === 5);
  check(
    "Caso2: spellSlots = [4,2,0,0,0,0,0,0,0]",
    JSON.stringify(d.spellSlots) === JSON.stringify([4, 2, 0, 0, 0, 0, 0, 0, 0])
  );
}

// --- Caso 3: personaje vacío ---
{
  const d = derive({});
  check("Caso3: no lanza excepción y nivel por defecto 1", d.prof === 2); // proficiencyBonus(1) = 2
  check("Caso3: todas las puntuaciones = 10", ABILITIES_ALL_TEN(d));
  check("Caso3: CA = 10", d.ac === 10);
  check("Caso3: acSource = '10 + DES'", d.acSource === "10 + DES");
  check("Caso3: iniciativa = 0", d.initiative === 0);
  check("Caso3: PG máx > 0 (dado por defecto 8 + CON 0)", d.maxHp === 8);
  check("Caso3: passivePerception = 10", d.passivePerception === 10);
  check("Caso3: sin conjuros", d.spellDc === undefined && d.spellSlots === undefined);
}
function ABILITIES_ALL_TEN(d: ReturnType<typeof derive>): boolean {
  return (["fue", "des", "con", "int", "sab", "car"] as const).every((k) => d.abilities[k].score === 10);
}

// --- Caso 4: hp_rolls cambia el PG máx ---
{
  const base: Partial<CharacterData> = {
    level: 2,
    cls: "guerrero", // dado de golpe 10
    base: { fue: 10, des: 10, con: 14, int: 10, sab: 10, car: 10 }, // CON mod +2
    bonus: { fue: 0, des: 0, con: 0, int: 0, sab: 0, car: 0 },
    asi: {},
    skills: [],
  };
  const withoutRoll = derive({ ...base, hp_rolls: {} });
  const withRoll = derive({ ...base, hp_rolls: { "2": 10 } }); // tirada máxima (d10=10)
  // Sin tirada: nivel1 = 10+2=12; nivel2 = media(10/2+1=6)+2=8 → total 20
  check("Caso4: PG máx sin tirada = 20 (media)", withoutRoll.maxHp === 20);
  // Con tirada máx 10 en nivel2: 10+2=12 → total 24
  check("Caso4: PG máx con tirada 10 = 24", withRoll.maxHp === 24);
  check("Caso4: la tirada cambia el resultado", withRoll.maxHp !== withoutRoll.maxHp);
}

console.log(failures === 0 ? "\nTodas las comprobaciones pasaron." : `\n${failures} comprobación(es) fallaron.`);
process.exit(failures === 0 ? 0 : 1);
