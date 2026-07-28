// Comprobación manual del combate contra monstruos. Uso: npx tsx scripts/check-combate.ts
import { saludDe, nombresNumerados, acotarHp } from "../lib/combate";

let failures = 0;
function check(label: string, cond: boolean) {
  if (cond) console.log(`OK   ${label}`);
  else { console.log(`FAIL ${label}`); failures++; }
}

// --- saludDe: los cinco tramos y sus bordes exactos ---
check("PG completos ⇒ intacto", saludDe(13, 13) === "intacto");
check("hp por encima del máximo ⇒ intacto", saludDe(99, 13) === "intacto");
check("justo por debajo del máximo ⇒ herido", saludDe(12, 13) === "herido");
check("exactamente la mitad ⇒ herido", saludDe(10, 20) === "herido");
check("justo por debajo de la mitad ⇒ malherido", saludDe(9, 20) === "malherido");
check("exactamente un cuarto ⇒ malherido", saludDe(5, 20) === "malherido");
check("justo por debajo del cuarto ⇒ al borde", saludDe(4, 20) === "al borde");
check("1 PG ⇒ al borde", saludDe(1, 20) === "al borde");
check("0 PG ⇒ fuera de combate", saludDe(0, 20) === "fuera de combate");
check("PG negativos ⇒ fuera de combate", saludDe(-7, 20) === "fuera de combate");

// hpMax raro no debe romper ni devolver NaN/undefined
check("hpMax 0 con vida ⇒ intacto", saludDe(3, 0) === "intacto");
check("hpMax 0 sin vida ⇒ fuera de combate", saludDe(0, 0) === "fuera de combate");
check("hpMax negativo no rompe", saludDe(0, -5) === "fuera de combate");

// La palabra siempre es una de las cinco, nunca undefined
const PALABRAS = ["intacto", "herido", "malherido", "al borde", "fuera de combate"];
let todasValidas = true;
for (let max = 1; max <= 30; max++) {
  for (let hp = -2; hp <= max + 2; hp++) {
    if (!PALABRAS.includes(saludDe(hp, max))) todasValidas = false;
  }
}
check("saludDe siempre devuelve una de las cinco palabras", todasValidas);

// El jugador NUNCA debe poder deducir el número: la palabra no lleva dígitos
check("la palabra no contiene números", PALABRAS.every((p) => !/\d/.test(p)));

// --- nombresNumerados ---
check("n=1 no añade el sufijo", JSON.stringify(nombresNumerados("Goblin", 1)) === JSON.stringify(["Goblin"]));
check("n=4 numera del 1 al 4", JSON.stringify(nombresNumerados("Goblin", 4)) === JSON.stringify(["Goblin 1", "Goblin 2", "Goblin 3", "Goblin 4"]));
check("n=0 no crea filas", nombresNumerados("Goblin", 0).length === 0);
check("n negativo no crea filas", nombresNumerados("Goblin", -3).length === 0);
check("recorta espacios del nombre", JSON.stringify(nombresNumerados("  Ogro  ", 1)) === JSON.stringify(["Ogro"]));
check("nombres únicos dentro de la tanda", new Set(nombresNumerados("Lobo", 6)).size === 6);
check("respeta nombres con espacios", nombresNumerados("Lobo huargo", 2)[1] === "Lobo huargo 2");

// --- acotarHp ---
check("acotarHp respeta un valor normal", acotarHp(7, 13) === 7);
check("acotarHp no baja de 0", acotarHp(-4, 13) === 0);
check("acotarHp no pasa del máximo", acotarHp(99, 13) === 13);
check("acotarHp redondea a entero", acotarHp(7.6, 13) === 8);
check("acotarHp con hpMax 0 da 0", acotarHp(5, 0) === 0);
check("acotarHp con hpMax negativo da 0", acotarHp(5, -3) === 0);
check("acotarHp rechaza NaN", acotarHp(NaN, 13) === null);
check("acotarHp rechaza Infinity", acotarHp(Infinity, 13) === null);
check("acotarHp rechaza un hpMax no finito", acotarHp(5, NaN) === null);

console.log(failures === 0 ? "\nTodo en verde" : `\n${failures} fallo(s)`);
process.exit(failures === 0 ? 0 : 1);
