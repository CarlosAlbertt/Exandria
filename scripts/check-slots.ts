// Script de comprobación manual para data/classdata/spellSlots.ts.
// Uso: npx tsx scripts/check-slots.ts
import {
  FULL_CASTER_SLOTS,
  HALF_CASTER_SLOTS,
  PACT_SLOTS,
  slotsFor,
} from "../data/classdata/spellSlots";

let failures = 0;

function check(label: string, condition: boolean) {
  if (condition) {
    console.log(`OK   ${label}`);
  } else {
    console.log(`FAIL ${label}`);
    failures++;
  }
}

function arraysEqual(a: number[] | null, b: number[]): boolean {
  if (!a) return false;
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

// --- Forma de las tablas ---
check("FULL_CASTER_SLOTS tiene 20 filas", FULL_CASTER_SLOTS.length === 20);
check(
  "FULL_CASTER_SLOTS: todas las filas tienen 9 columnas",
  FULL_CASTER_SLOTS.every((row) => row.length === 9)
);
check("HALF_CASTER_SLOTS tiene 20 filas", HALF_CASTER_SLOTS.length === 20);
check(
  "HALF_CASTER_SLOTS: todas las filas tienen 5 columnas",
  HALF_CASTER_SLOTS.every((row) => row.length === 5)
);
check("PACT_SLOTS tiene 20 filas", PACT_SLOTS.length === 20);

// --- Casos puntuales pedidos en la tarea ---
check(
  'slotsFor("full", 20) = [4,3,3,3,3,2,2,1,1]',
  arraysEqual(slotsFor("full", 20), [4, 3, 3, 3, 3, 2, 2, 1, 1])
);
check(
  'slotsFor("half", 1) = [2,0,0,0,0]',
  arraysEqual(slotsFor("half", 1), [2, 0, 0, 0, 0])
);
check(
  'slotsFor("pact", 5) = [0,0,2,0,0,0,0,0,0]',
  arraysEqual(slotsFor("pact", 5), [0, 0, 2, 0, 0, 0, 0, 0, 0])
);
check('slotsFor("none", 10) = null', slotsFor("none", 10) === null);

// --- Nivel fuera de rango se acota a 1..20 ---
check(
  'slotsFor("full", 999) === slotsFor("full", 20)',
  arraysEqual(slotsFor("full", 999), slotsFor("full", 20)!)
);
check(
  'slotsFor("full", 0) === slotsFor("full", 1)',
  arraysEqual(slotsFor("full", 0), slotsFor("full", 1)!)
);

// --- Monotonía: los espacios nunca bajan al subir de nivel (por columna) ---
function isMonotonic(table: number[][]): boolean {
  for (let col = 0; col < table[0].length; col++) {
    for (let row = 1; row < table.length; row++) {
      if (table[row][col] < table[row - 1][col]) return false;
    }
  }
  return true;
}

check("FULL_CASTER_SLOTS es monótona por columna", isMonotonic(FULL_CASTER_SLOTS));
check("HALF_CASTER_SLOTS es monótona por columna", isMonotonic(HALF_CASTER_SLOTS));

// PACT_SLOTS: el conteo de espacios nunca baja, y el nivel de espacio nunca baja
check(
  "PACT_SLOTS: count nunca baja",
  PACT_SLOTS.every((r, i) => i === 0 || r.count >= PACT_SLOTS[i - 1].count)
);
check(
  "PACT_SLOTS: slotLevel nunca baja",
  PACT_SLOTS.every((r, i) => i === 0 || r.slotLevel >= PACT_SLOTS[i - 1].slotLevel)
);

console.log(failures === 0 ? "\nTodas las comprobaciones pasaron." : `\n${failures} comprobación(es) fallaron.`);
process.exit(failures === 0 ? 0 : 1);
