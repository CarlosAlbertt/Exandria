// Script de comprobación manual para data/bestiary (bestiario D&D 2024).
// Uso: npx tsx scripts/check-bestiary.ts
import { ALL_MONSTERS } from "../data/bestiary";
import { CR_XP } from "../data/encounters";
import { pbForCr, CR_OPTIONS } from "../lib/useBestiary";

let failures = 0;

function check(label: string, condition: boolean) {
  if (condition) {
    console.log(`OK   ${label}`);
  } else {
    console.log(`FAIL ${label}`);
    failures++;
  }
}

// --- CR (string) -> valor numérico, para comparar contra tablas por rango ---
function crToNumber(cr: string): number {
  if (cr.includes("/")) {
    const [num, den] = cr.split("/").map(Number);
    return num / den;
  }
  return Number(cr);
}

// --- BC esperado según CR (tabla estándar 2024) ---
function expectedPb(cr: string): number {
  const n = crToNumber(cr);
  if (n <= 4) return 2;
  if (n <= 8) return 3;
  if (n <= 12) return 4;
  if (n <= 16) return 5;
  if (n <= 20) return 6;
  if (n <= 24) return 7;
  if (n <= 28) return 8;
  return 9;
}

const HP_FORMULA_RE = /^\d+d\d+( ?[+-] ?\d+)?$/;

check(`ALL_MONSTERS no está vacío (${ALL_MONSTERS.length} monstruos)`, ALL_MONSTERS.length > 0);

// --- Slugs únicos ---
const slugs = ALL_MONSTERS.map((m) => m.slug);
const uniqueSlugs = new Set(slugs);
check(
  `todos los slugs son únicos (${slugs.length} monstruos, ${uniqueSlugs.size} slugs)`,
  slugs.length === uniqueSlugs.size
);

for (const m of ALL_MONSTERS) {
  const tag = `${m.name} (${m.slug})`;

  // Las 6 características entre 1 y 30
  for (const key of ["fue", "des", "con", "int", "sab", "car"] as const) {
    const v = m.abilities[key];
    check(`${tag}: ${key} en rango 1-30 (${v})`, v >= 1 && v <= 30);
  }

  // xp coincide con la tabla CR_XP para su cr
  const expectedXp = CR_XP.find((c) => c.cr === m.cr)?.xp;
  check(
    `${tag}: xp (${m.xp}) coincide con CR_XP para CR ${m.cr} (${expectedXp})`,
    expectedXp !== undefined && m.xp === expectedXp
  );

  // pb coherente con el CR
  check(`${tag}: pb (${m.pb}) coherente con CR ${m.cr}`, m.pb === expectedPb(m.cr));

  // hpFormula parsea
  check(`${tag}: hpFormula parsea (${m.hpFormula})`, HP_FORMULA_RE.test(m.hpFormula));

  // ac en rango 5-25
  check(`${tag}: ac en rango 5-25 (${m.ac})`, m.ac >= 5 && m.ac <= 25);

  // blurb no vacío y <= 300 caracteres (fuerza concisión, evita prosa copiada)
  check(`${tag}: blurb no vacío`, m.blurb.length > 0);
  check(`${tag}: blurb <= 300 caracteres (${m.blurb.length})`, m.blurb.length <= 300);

  // al menos una acción
  check(`${tag}: tiene al menos 1 acción`, m.actions.length >= 1);
}

// --- lib/useBestiary: pbForCr y CR_OPTIONS (comprobaciones puras rápidas) ---
check(`pbForCr("1/4") === 2 (${pbForCr("1/4")})`, pbForCr("1/4") === 2);
check(`pbForCr("13") === 5 (${pbForCr("13")})`, pbForCr("13") === 5);
check(`CR_OPTIONS.length === CR_XP.length (${CR_OPTIONS.length} vs ${CR_XP.length})`, CR_OPTIONS.length === CR_XP.length);

console.log(failures === 0 ? "\nTodas las comprobaciones pasaron." : `\n${failures} comprobación(es) fallaron.`);
process.exit(failures === 0 ? 0 : 1);
