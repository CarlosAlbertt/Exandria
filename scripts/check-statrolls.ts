// Comprobación manual de lib/statRolls.ts. Uso: npx tsx scripts/check-statrolls.ts
import { dropLowest, STANDARD_ARRAY, ASSIGN_EMPTY, isAssignComplete } from "../lib/statRolls";

let failures = 0;
function check(label: string, cond: boolean) {
  if (cond) console.log(`OK   ${label}`);
  else { console.log(`FAIL ${label}`); failures++; }
}

// dropLowest: suma los 3 mayores de 4 dados.
check("dropLowest([4,3,2,1]) = 9", dropLowest([4, 3, 2, 1]) === 9);
check("dropLowest([6,6,6,1]) = 18", dropLowest([6, 6, 6, 1]) === 18);
check("dropLowest([1,1,1,1]) = 3", dropLowest([1, 1, 1, 1]) === 3);
check("dropLowest ignora el orden", dropLowest([1, 6, 3, 5]) === dropLowest([6, 5, 3, 1]));
check("dropLowest con menos de 4 dados = suma", dropLowest([5, 5]) === 10);

// STANDARD_ARRAY 2024
check("STANDARD_ARRAY = [15,14,13,12,10,8]", JSON.stringify(STANDARD_ARRAY) === "[15,14,13,12,10,8]");
check("STANDARD_ARRAY tiene 6 valores", STANDARD_ARRAY.length === 6);

// ASSIGN_EMPTY: 6 aptitudes sin asignar
check("ASSIGN_EMPTY tiene las 6 aptitudes a null",
  JSON.stringify(ASSIGN_EMPTY) === JSON.stringify({ fue: null, des: null, con: null, int: null, sab: null, car: null }));

// isAssignComplete
check("isAssignComplete(vacío) = false", isAssignComplete(ASSIGN_EMPTY) === false);
check("isAssignComplete(completo) = true",
  isAssignComplete({ fue: 0, des: 1, con: 2, int: 3, sab: 4, car: 5 }) === true);
check("isAssignComplete(uno a null) = false",
  isAssignComplete({ fue: 0, des: 1, con: 2, int: 3, sab: 4, car: null }) === false);

console.log(failures === 0 ? "\nTodas las comprobaciones pasaron." : `\n${failures} fallaron.`);
process.exit(failures === 0 ? 0 : 1);
