// Comprobación manual de lib/statRolls.ts. Uso: npx tsx scripts/check-statrolls.ts
import { dropLowest, STANDARD_ARRAY, ASSIGN_EMPTY, isAssignComplete, deriveAssign } from "../lib/statRolls";

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

// deriveAssign: reconstruye la asignación comparando `base` con los 6 valores.
check("deriveAssign reparte normal",
  JSON.stringify(deriveAssign({ fue: 13, des: 14, con: 12, int: 10, sab: 15, car: 8 }, [15, 14, 13, 12, 10, 8]))
  === JSON.stringify({ fue: 2, des: 1, con: 3, int: 4, sab: 0, car: 5 }));

// Valores repetidos: dos 13 son DOS índices distintos, no el mismo.
check("deriveAssign con valores repetidos usa índices distintos", (() => {
  const a = deriveAssign({ fue: 13, des: 13, con: 12, int: 12, sab: 10, car: 8 }, [13, 13, 12, 12, 10, 8]);
  return isAssignComplete(a) && new Set(Object.values(a)).size === 6;
})());

check("deriveAssign sin tirada (point-buy) = vacío",
  JSON.stringify(deriveAssign({ fue: 13, des: 14, con: 12, int: 10, sab: 15, car: 8 }, []))
  === JSON.stringify(ASSIGN_EMPTY));

// Si no cuadra (ficha vieja, valores editados a mano) NO inventa: devuelve vacío
// y el jugador reasigna como hoy.
check("deriveAssign que no cuadra = vacío",
  JSON.stringify(deriveAssign({ fue: 18, des: 14, con: 12, int: 10, sab: 15, car: 8 }, [15, 14, 13, 12, 10, 8]))
  === JSON.stringify(ASSIGN_EMPTY));

console.log(failures === 0 ? "\nTodas las comprobaciones pasaron." : `\n${failures} fallaron.`);
process.exit(failures === 0 ? 0 : 1);
