// Comprobación manual de las pericias: las 18 del reglamento 2024 más las 7 de
// oficio (homebrew), su reparto por clase y el cupo por nivel.
// Uso: npx tsx scripts/check-pericias.ts
import { SKILLS, SKILLS_2024, OFICIOS, ABILITIES, type AbilityKey } from "../data/rules";
import { CLASSES } from "../data/classes";
import { OFICIO_LEVELS, oficioPicks } from "../data/leveling";
import { derive } from "../lib/derive";

let failures = 0;
function check(label: string, condition: boolean) {
  if (condition) console.log(`OK   ${label}`);
  else { console.log(`FAIL ${label}`); failures++; }
}

const CLAVES = new Set(ABILITIES.map((a) => a.key));

// --- Las 18 del reglamento --------------------------------------------------
const BASE_2024 = [
  "Acrobacias", "Arcanos", "Atletismo", "Engaño", "Historia", "Interpretación",
  "Intimidación", "Investigación", "Juego de Manos", "Medicina", "Naturaleza",
  "Percepción", "Perspicacia", "Persuasión", "Religión", "Sigilo",
  "Supervivencia", "Trato con Animales",
];
check("hay exactamente 18 pericias del reglamento 2024", SKILLS_2024.length === 18);
for (const n of BASE_2024) {
  check(`la pericia 2024 «${n}» existe y no es de oficio`,
    SKILLS_2024.some((s) => s.name === n));
}
check("ninguna pericia 2024 lleva aptitud secundaria",
  SKILLS_2024.every((s) => s.ability2 === undefined));

// --- Las 7 de oficio --------------------------------------------------------
// La aptitud DOBLE se escribe primaria–secundaria: la primaria es la única que
// suma competencia. Si alguien invierte el orden, cambia la mecánica sin que se
// note en ningún sitio; por eso se fija aquí el par exacto.
const OFICIOS_ESPERADOS: { name: string; ability: AbilityKey; ability2?: AbilityKey }[] = [
  { name: "Alquimia", ability: "int" },
  { name: "Forja", ability: "sab", ability2: "fue" },
  { name: "Cocina", ability: "sab" },
  { name: "Cristalografía Arcana", ability: "int" },
  { name: "Tatuaje Rúnico", ability: "des", ability2: "int" },
  { name: "Extracción de Componentes", ability: "des", ability2: "int" },
  { name: "Destilación Exandriana", ability: "sab" },
];
check("hay exactamente 7 pericias de oficio", OFICIOS.length === 7);
for (const e of OFICIOS_ESPERADOS) {
  const s = OFICIOS.find((x) => x.name === e.name);
  check(`oficio «${e.name}» existe`, !!s);
  check(`oficio «${e.name}»: aptitud primaria ${e.ability}`, s?.ability === e.ability);
  check(`oficio «${e.name}»: aptitud secundaria ${e.ability2 ?? "(ninguna)"}`,
    s?.ability2 === e.ability2);
}

// --- Coherencia del conjunto ------------------------------------------------
check("no hay nombres de pericia repetidos",
  new Set(SKILLS.map((s) => s.name)).size === SKILLS.length);
check("ninguna pericia tiene el nombre vacío",
  SKILLS.every((s) => s.name.trim().length > 0));
check("todas las aptitudes son claves válidas",
  SKILLS.every((s) => CLAVES.has(s.ability) && (!s.ability2 || CLAVES.has(s.ability2))));
check("en las dobles, la secundaria NO es la primaria",
  SKILLS.every((s) => !s.ability2 || s.ability2 !== s.ability));
check("solo las de oficio pueden llevar aptitud secundaria",
  SKILLS.every((s) => !s.ability2 || s.oficio === true));
check("SKILLS = SKILLS_2024 + OFICIOS, sin solapes",
  SKILLS.length === SKILLS_2024.length + OFICIOS.length);

// --- Reparto por clase ------------------------------------------------------
const NOMBRES_2024 = new Set(SKILLS_2024.map((s) => s.name));
const NOMBRES_OFICIO = new Set(OFICIOS.map((s) => s.name));

for (const c of CLASSES) {
  for (const n of c.skillList) {
    check(`${c.slug}: la pericia «${n}» de skillList existe y es del reglamento`,
      NOMBRES_2024.has(n));
  }
  check(`${c.slug}: skillList sin repetidos`,
    new Set(c.skillList).size === c.skillList.length);
  check(`${c.slug}: skillCount (${c.skillCount}) no supera su lista (${c.skillList.length})`,
    c.skillCount <= c.skillList.length);

  for (const n of c.oficios) {
    check(`${c.slug}: el oficio «${n}» existe`, NOMBRES_OFICIO.has(n));
  }
  check(`${c.slug}: oficios sin repetidos`,
    new Set(c.oficios).size === c.oficios.length);
  // Sin esto, la elección del nivel 7 se queda sin nada que elegir.
  check(`${c.slug}: tiene al menos ${OFICIO_LEVELS.length} oficios (tiene ${c.oficios.length})`,
    c.oficios.length >= OFICIO_LEVELS.length);
  check(`${c.slug}: ningún oficio se cuela en skillList`,
    c.skillList.every((n) => !NOMBRES_OFICIO.has(n)));
}

check("las 13 clases declaran oficios", CLASSES.every((c) => Array.isArray(c.oficios)));
// Un oficio que no ofrece ninguna clase es un oficio que nadie puede aprender.
for (const o of OFICIOS) {
  check(`el oficio «${o.name}» lo ofrece alguna clase`,
    CLASSES.some((c) => c.oficios.includes(o.name)));
}

// --- Cupo de oficio por nivel ----------------------------------------------
check("OFICIO_LEVELS son [1, 7]", JSON.stringify(OFICIO_LEVELS) === "[1,7]");
check("nivel 1 → 1 oficio", oficioPicks(1) === 1);
check("nivel 6 → sigue 1", oficioPicks(6) === 1);
check("nivel 7 → 2", oficioPicks(7) === 2);
check("nivel 20 → 2", oficioPicks(20) === 2);
check("nivel 0 se acota a 1 → 1", oficioPicks(0) === 1);
check("nivel 99 se acota a 20 → 2", oficioPicks(99) === 2);

// --- La derivada: la competencia SOLO en la primaria ------------------------
// Forja es SAB(primaria)–FUE(secundaria). Con SAB 16 (+3), FUE 14 (+2) y
// competencia +2 (nivel 1), un personaje con Forja aprendida debe dar +5 con
// SAB y +2 con FUE. Es la regla entera de la aptitud doble en un solo caso.
{
  const d = derive({
    cls: "guerrero", level: 1,
    base: { fue: 14, des: 10, con: 10, int: 10, sab: 16, car: 10 },
    skills: ["Forja"],
  } as Parameters<typeof derive>[0]);
  const forja = d.skills.find((s) => s.name === "Forja");
  check("derive: Forja aparece en la derivada", !!forja);
  check("derive: Forja es de oficio", forja?.oficio === true);
  check("derive: Forja competente", forja?.proficient === true);
  check(`derive: Forja(SAB) = mod + competencia = +5 (dio ${forja?.mod})`, forja?.mod === 5);
  check(`derive: Forja(FUE) = mod SIN competencia = +2 (dio ${forja?.mod2})`, forja?.mod2 === 2);
  check("derive: la secundaria de Forja es fue", forja?.ability2 === "fue");

  // Sin competencia las dos tiradas son la aptitud pelada.
  const sin = derive({
    cls: "guerrero", level: 1,
    base: { fue: 14, des: 10, con: 10, int: 10, sab: 16, car: 10 },
    skills: [],
  } as Parameters<typeof derive>[0]);
  const f2 = sin.skills.find((s) => s.name === "Forja");
  check(`derive: Forja(SAB) sin competencia = +3 (dio ${f2?.mod})`, f2?.mod === 3);
  check(`derive: Forja(FUE) sin competencia = +2 (dio ${f2?.mod2})`, f2?.mod2 === 2);

  // Una pericia normal no gana un segundo número por error.
  const atl = d.skills.find((s) => s.name === "Atletismo");
  check("derive: una pericia normal no tiene mod2", atl?.mod2 === undefined);
  check("derive: una pericia normal no es de oficio", atl?.oficio === false);
  check("derive: la derivada trae las 25 pericias", d.skills.length === 25);
}

console.log(failures === 0 ? `\nTodo OK` : `\n${failures} FALLOS`);
process.exit(failures === 0 ? 0 : 1);
