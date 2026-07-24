// Comprobación de la geometría del tablero. Uso: npx tsx scripts/check-tablero.ts
import { celda, distanciaMetros } from "../lib/tablero";

let failures = 0;
function check(label: string, cond: boolean) {
  if (cond) console.log(`OK   ${label}`);
  else { console.log(`FAIL ${label}`); failures++; }
}

// 20 columnas: x=0 ⇒ col 0; x=100 ⇒ col 19 (última); x=50 ⇒ col 10.
check("x=0 cae en la columna 0", celda({ x: 0, y: 0 }, 20, 12).cx === 0);
check("x=100 se acota a la última columna", celda({ x: 100, y: 0 }, 20, 12).cx === 19);
check("x=50 cae en la columna 10", celda({ x: 50, y: 0 }, 20, 12).cx === 10);
check("y=100 se acota a la última fila", celda({ x: 0, y: 100 }, 20, 12).cy === 11);

// Distancia: misma casilla ⇒ 0; una en diagonal ⇒ 1,5 (Chebyshev, no 3).
check("misma casilla ⇒ 0 m", distanciaMetros({ x: 10, y: 10 }, { x: 12, y: 12 }, 20, 12) === 0);
check("una casilla en diagonal ⇒ 1,5 m", distanciaMetros({ x: 2, y: 2 }, { x: 7, y: 10 }, 20, 12) === 1.5);
check("tres casillas en recta ⇒ 4,5 m", distanciaMetros({ x: 2, y: 2 }, { x: 17, y: 2 }, 20, 12) === 4.5);

if (failures) { console.log(`\n${failures} FALLos`); process.exit(1); }
console.log("\nTodo en verde");
