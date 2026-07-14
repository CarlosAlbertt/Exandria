// Motor de dados puro (sin React/Supabase): parseo de fórmulas, tiradas y
// formateo. Las fórmulas son texto libre introducido por jugadores, así que
// el parseo es estricto (lista blanca de dados) y nunca lanza excepciones.

export type RollResult = { formula: string; rolls: number[]; modifier: number; total: number };

const VALID_DICE = new Set([2, 4, 6, 8, 10, 12, 20, 100]);

// Acepta "XdY", "XdY+Z", "XdY-Z" (may/min, espacios tolerados).
// X: 1..20 dados; Y: dado de la lista blanca; Z: modificador -99..99.
export function parseFormula(f: string): { n: number; die: number; mod: number } | null {
  if (typeof f !== "string") return null;
  const m = f.trim().match(/^(\d{1,2})\s*[dD]\s*(\d{1,3})\s*(?:([+-])\s*(\d{1,3}))?$/);
  if (!m) return null;

  const n = parseInt(m[1], 10);
  const die = parseInt(m[2], 10);
  let mod = 0;
  if (m[3]) {
    const val = parseInt(m[4], 10);
    mod = m[3] === "-" ? -val : val;
  }

  if (n < 1 || n > 20) return null;
  if (!VALID_DICE.has(die)) return null;
  if (mod < -99 || mod > 99) return null;

  return { n, die, mod };
}

// Tira una fórmula validada. Devuelve null si la fórmula no es válida.
export function roll(f: string): RollResult | null {
  const parsed = parseFormula(f);
  if (!parsed) return null;
  const { n, die, mod } = parsed;

  const rolls: number[] = [];
  for (let i = 0; i < n; i++) rolls.push(1 + Math.floor(Math.random() * die));
  const total = rolls.reduce((a, b) => a + b, 0) + mod;

  return { formula: f.trim(), rolls, modifier: mod, total };
}

// Tirada de d20 con modificador fijo (salvación/habilidad/pericia/ataque).
// adv: tira 2d20 y toma el más alto; dis: toma el más bajo. Sin ventaja ni
// desventaja, tira un único d20. `rolls` incluye ambos dados cuando aplica.
export function d20Check(mod: number, adv?: "adv" | "dis"): RollResult {
  const a = 1 + Math.floor(Math.random() * 20);

  let rolls: number[];
  let picked: number;
  let suffix = "";

  if (adv === "adv") {
    const b = 1 + Math.floor(Math.random() * 20);
    rolls = [a, b];
    picked = Math.max(a, b);
    suffix = " (ventaja)";
  } else if (adv === "dis") {
    const b = 1 + Math.floor(Math.random() * 20);
    rolls = [a, b];
    picked = Math.min(a, b);
    suffix = " (desventaja)";
  } else {
    rolls = [a];
    picked = a;
  }

  const total = picked + mod;
  const sign = mod < 0 ? "-" : "+";
  const formula = `1d20${sign}${Math.abs(mod)}${suffix}`;

  return { formula, rolls, modifier: mod, total };
}

// Formatea el desglose de una tirada: "[14, 3] + 5 = 22".
// Sin modificador (0) se omite el segmento: "[14, 3] = 17".
export function fmtRoll(r: RollResult): string {
  if (r.modifier === 0) return `[${r.rolls.join(", ")}] = ${r.total}`;
  const sign = r.modifier < 0 ? "-" : "+";
  return `[${r.rolls.join(", ")}] ${sign} ${Math.abs(r.modifier)} = ${r.total}`;
}

// --- Puente con los dados físicos (dice-box) --------------------------------
// dice-box calcula el valor de cada dado por física; estos helpers construyen
// el mismo RollResult que roll()/d20Check() pero tomando esas caras, para que
// el total del feed sea exactamente la suma de los dados que se vieron rodar.

// Fórmula libre / dado rápido: `dice` son las N caras de NdX; total = suma+mod.
export function rollFromDice(formula: string, dice: number[], mod: number): RollResult {
  const total = dice.reduce((a, b) => a + b, 0) + mod;
  return { formula: formula.trim(), rolls: dice, modifier: mod, total };
}

// Chequeo d20: dice = [a] normal, [a,b] con ventaja/desventaja. La fórmula
// resultante coincide con la de d20Check (incluye " (ventaja)"/" (desventaja)").
export function d20FromDice(dice: number[], mod: number, adv?: "adv" | "dis"): RollResult {
  const picked = adv === "adv" ? Math.max(...dice) : adv === "dis" ? Math.min(...dice) : dice[0];
  const total = picked + mod;
  const suffix = adv === "adv" ? " (ventaja)" : adv === "dis" ? " (desventaja)" : "";
  const sign = mod < 0 ? "-" : "+";
  const formula = `1d20${sign}${Math.abs(mod)}${suffix}`;
  return { formula, rolls: dice, modifier: mod, total };
}

// Estado crítico de una tirada d20, para efectos visuales del feed. Solo
// aplica a tiradas de un d20 (chequeo o fórmula que empieza por 1d20/2d20).
// La cara "elegida" se deduce de la fórmula: (ventaja)=max, (desventaja)=min,
// resto=primer dado. Crítico si la elegida es 20; pifia si es 1.
export function critState(formula: string, rolls: number[]): "crit" | "fumble" | null {
  const isD20 = /d20/i.test(formula);
  if (!isD20 || rolls.length === 0) return null;
  const picked = /\(ventaja\)/.test(formula)
    ? Math.max(...rolls)
    : /\(desventaja\)/.test(formula)
      ? Math.min(...rolls)
      : rolls[0];
  if (picked === 20) return "crit";
  if (picked === 1) return "fumble";
  return null;
}
