// Comprobación manual de los helpers físicos de lib/dice.ts.
// Uso: npx tsx scripts/check-dicebox.ts
import { rollFromDice, d20FromDice, critState } from "../lib/dice";

let failures = 0;
function check(label: string, condition: boolean) {
  if (condition) console.log(`OK   ${label}`);
  else { console.log(`FAIL ${label}`); failures++; }
}

// rollFromDice: total = suma de caras + modificador; conserva las caras dadas.
{
  const r = rollFromDice("2d6+3", [4, 5], 3);
  check("rollFromDice([4,5],+3): total 12", r.total === 12);
  check("rollFromDice conserva rolls [4,5]", JSON.stringify(r.rolls) === "[4,5]");
  check("rollFromDice modifier 3", r.modifier === 3);
  check("rollFromDice formula intacta", r.formula === "2d6+3");
}
{
  const r = rollFromDice("1d100", [77], 0);
  check("rollFromDice sin modificador: total = cara", r.total === 77 && r.modifier === 0);
}

// d20FromDice: normal usa la única cara; adv toma max; dis toma min.
{
  const r = d20FromDice([13], 5);
  check("d20FromDice([13],+5) normal: total 18, 1 dado", r.total === 18 && r.rolls.length === 1);
  check("d20FromDice normal: formula 1d20+5", r.formula === "1d20+5");
}
{
  const r = d20FromDice([18, 5], 3, "adv");
  check("d20FromDice([18,5],+3,adv): total = max+mod = 21", r.total === 21);
  check("d20FromDice adv: formula con (ventaja)", r.formula === "1d20+3 (ventaja)");
  check("d20FromDice adv: conserva ambos dados", JSON.stringify(r.rolls) === "[18,5]");
}
{
  const r = d20FromDice([18, 5], 0, "dis");
  check("d20FromDice([18,5],0,dis): total = min = 5", r.total === 5);
  check("d20FromDice dis: formula con (desventaja)", r.formula === "1d20+0 (desventaja)");
}
{
  const r = d20FromDice([7], -2);
  check("d20FromDice([7],-2): total 5, formula 1d20-2", r.total === 5 && r.formula === "1d20-2");
}

// critState: crítico si la cara elegida del d20 es 20; pifia si es 1.
check("critState ventaja elige max: [20,3] -> crit", critState("1d20+3 (ventaja)", [20, 3]) === "crit");
check("critState desventaja elige min: [20,1] -> fumble", critState("1d20+0 (desventaja)", [20, 1]) === "fumble");
check("critState desventaja: [20,3] descarta el 20 -> null", critState("1d20+3 (desventaja)", [20, 3]) === null);
check("critState normal [1] -> fumble", critState("1d20-2", [1]) === "fumble");
check("critState dado rápido d20 [20] -> crit", critState("1d20", [20]) === "crit");
check("critState no-d20 [6] -> null", critState("2d6+3", [4, 2]) === null);

console.log(failures === 0 ? "\nTodas las comprobaciones pasaron." : `\n${failures} fallaron.`);
process.exit(failures === 0 ? 0 : 1);
