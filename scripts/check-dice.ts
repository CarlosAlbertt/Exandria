// Script de comprobación manual para lib/dice.ts.
// Uso: npx tsx scripts/check-dice.ts
import { parseFormula, roll, d20Check, fmtRoll } from "../lib/dice";

let failures = 0;

function check(label: string, condition: boolean) {
  if (condition) {
    console.log(`OK   ${label}`);
  } else {
    console.log(`FAIL ${label}`);
    failures++;
  }
}

// --- parseFormula: casos válidos ---
{
  const p = parseFormula("2d6+3");
  check('parseFormula("2d6+3") = {n:2,die:6,mod:3}', !!p && p.n === 2 && p.die === 6 && p.mod === 3);
}
{
  const p = parseFormula(" 1D20 - 2 ");
  check('parseFormula(" 1D20 - 2 ") = {n:1,die:20,mod:-2}', !!p && p.n === 1 && p.die === 20 && p.mod === -2);
}
{
  const p = parseFormula("1d20");
  check('parseFormula("1d20") sin modificador = {n:1,die:20,mod:0}', !!p && p.n === 1 && p.die === 20 && p.mod === 0);
}

// --- parseFormula: casos inválidos ---
const invalid = ["d20", "0d6", "21d6", "2d7", "2d6+100", "abc", "2d6+3+4"];
for (const f of invalid) {
  check(`parseFormula(${JSON.stringify(f)}) = null`, parseFormula(f) === null);
}

// --- roll: rango y forma ---
{
  let ok = true;
  for (let i = 0; i < 200; i++) {
    const r = roll("2d6+3");
    if (!r) { ok = false; break; }
    if (r.rolls.length !== 2) { ok = false; break; }
    if (r.total < 5 || r.total > 15) { ok = false; break; }
    if (r.rolls.some((d) => d < 1 || d > 6)) { ok = false; break; }
  }
  check("roll(\"2d6+3\") total en [5,15], 2 dados en [1,6] (200 iteraciones)", ok);
}
check('roll("abc") = null', roll("abc") === null);
{
  let ok = true;
  for (let i = 0; i < 200; i++) {
    const r = roll("1d100");
    if (!r || r.rolls.length !== 1 || r.total < 1 || r.total > 100) { ok = false; break; }
  }
  check('roll("1d100") resultado en [1,100], 1 dado (200 iteraciones)', ok);
}

// --- d20Check ---
{
  let ok = true;
  for (let i = 0; i < 100; i++) {
    const r = d20Check(3, "adv");
    if (r.rolls.length !== 2) { ok = false; break; }
    if (r.total !== Math.max(...r.rolls) + 3) { ok = false; break; }
  }
  check('d20Check(3,"adv"): 2 dados, total = max(rolls)+3 (100 iteraciones)', ok);
}
{
  let ok = true;
  for (let i = 0; i < 100; i++) {
    const r = d20Check(0, "dis");
    if (r.rolls.length !== 2) { ok = false; break; }
    if (r.total !== Math.min(...r.rolls)) { ok = false; break; }
  }
  check('d20Check(0,"dis"): 2 dados, total = min(rolls) (100 iteraciones)', ok);
}
{
  const r = d20Check(5);
  check("d20Check(5) sin ventaja/desventaja: 1 solo dado", r.rolls.length === 1);
  check("d20Check(5) sin ventaja/desventaja: total = roll+5", r.total === r.rolls[0] + 5);
}

// --- fmtRoll ---
{
  const sample = fmtRoll({ formula: "2d6+5", rolls: [14, 3], modifier: 5, total: 22 });
  check('fmtRoll: "[14, 3] + 5 = 22"', sample === "[14, 3] + 5 = 22");
}
{
  const sample = fmtRoll({ formula: "1d20-2", rolls: [7], modifier: -2, total: 5 });
  check('fmtRoll con modificador negativo: "[7] - 2 = 5"', sample === "[7] - 2 = 5");
}
{
  const sample = fmtRoll({ formula: "2d6", rolls: [4, 2], modifier: 0, total: 6 });
  check('fmtRoll sin modificador: "[4, 2] = 6" (omite "+ 0")', sample === "[4, 2] = 6");
}

console.log(failures === 0 ? "\nTodas las comprobaciones pasaron." : `\n${failures} comprobación(es) fallaron.`);
process.exit(failures === 0 ? 0 : 1);
