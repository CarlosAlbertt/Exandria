// Comprobación de la economía de turno. Uso: npx tsx scripts/check-turno.ts
import { turnoDe, gastar, devolver, alternarRecurso, mover, movRestante, limpiarTurno, gastarAtaque, ataquesRestantes } from "../lib/turno";
import type { PlayState } from "../lib/recursos";

let failures = 0;
function check(label: string, cond: boolean) {
  if (cond) console.log(`OK   ${label}`);
  else { console.log(`FAIL ${label}`); failures++; }
}

const vacio: PlayState = {};

// Turno ausente ⇒ todo libre.
const t0 = turnoDe(vacio);
check("turno ausente: accion libre", t0.accion === false);
check("turno ausente: movGastado 0", t0.movGastado === 0);

// Gastar / devolver / alternar.
check("gastar accion", turnoDe(gastar(vacio, "accion")).accion === true);
check("devolver accion", turnoDe(devolver(gastar(vacio, "accion"), "accion")).accion === false);
check("alternar reaccion dos veces vuelve al inicio", turnoDe(alternarRecurso(alternarRecurso(vacio, "reaccion"), "reaccion")).reaccion === false);
check("gastar adicional no toca accion", turnoDe(gastar(vacio, "adicional")).accion === false);

// Movimiento.
check("mover avanza", turnoDe(mover(vacio, 3, 9)).movGastado === 3);
check("mover topa en velocidad", turnoDe(mover(vacio, 99, 9)).movGastado === 9);
check("mover no baja de 0", turnoDe(mover(vacio, -5, 9)).movGastado === 0);
check("movRestante correcto", movRestante(mover(vacio, 3, 9), 9) === 6);

// limpiarTurno borra la clave y no toca lo demás.
const sucio: PlayState = { usos: { furias: 1 }, hp: 12, conds: ["envenenado"], turno: { accion: true, movGastado: 6 } };
const limpio = limpiarTurno(sucio);
check("limpiarTurno borra la clave turno", limpio.turno === undefined);
check("limpiarTurno no toca usos", JSON.stringify(limpio.usos) === JSON.stringify({ furias: 1 }));
check("limpiarTurno no toca hp", limpio.hp === 12);
check("limpiarTurno no toca conds", JSON.stringify(limpio.conds) === JSON.stringify(["envenenado"]));

// gastar no toca usos/hp.
const g = gastar({ usos: { foco: 2 }, hp: 5 }, "accion");
check("gastar no toca usos", JSON.stringify(g.usos) === JSON.stringify({ foco: 2 }));
check("gastar no toca hp", g.hp === 5);

// --- Multiataque: contador de ataques de la acción de Atacar ---------------
check("turno ausente: 0 ataques usados", turnoDe(vacio).ataquesUsados === 0);
check("gastarAtaque suma uno", turnoDe(gastarAtaque(vacio, 2)).ataquesUsados === 1);
check("gastarAtaque respeta el tope", turnoDe(gastarAtaque(gastarAtaque(gastarAtaque(vacio, 2), 2), 2)).ataquesUsados === 2);
check("ataquesRestantes con 2 y ninguno usado", ataquesRestantes(vacio, 2) === 2);
check("ataquesRestantes tras gastar uno", ataquesRestantes(gastarAtaque(vacio, 2), 2) === 1);
check("ataquesRestantes nunca es negativo", ataquesRestantes({ turno: { ataquesUsados: 9 } }, 2) === 0);
check("gastarAtaque no toca la accion", turnoDe(gastarAtaque(vacio, 2)).accion === false);
check("gastar accion no toca los ataques", turnoDe(gastar(vacio, "accion")).ataquesUsados === 0);
check("limpiarTurno borra tambien los ataques", turnoDe(limpiarTurno({ turno: { ataquesUsados: 2, accion: true } })).ataquesUsados === 0);
check("gastarAtaque no toca usos ni hp", (() => {
  const r = gastarAtaque({ usos: { furias: 1 }, hp: 7 }, 2);
  return JSON.stringify(r.usos) === JSON.stringify({ furias: 1 }) && r.hp === 7;
})());

if (failures) { console.log(`\n${failures} FALLos`); process.exit(1); }
console.log("\nTodo en verde");
