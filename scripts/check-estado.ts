// Comprobación manual del estado de combate. Uso: npx tsx scripts/check-estado.ts
import {
  CONDICIONES, AGOTAMIENTO,
  pgActuales, pgTemp, estaAbajo, aplicarDaño, curar, setTemp,
  marcarMuerte, desmarcarMuerte, resultadoMuerte,
  alternarCondicion, setAgotamiento, ventajaDe,
} from "../lib/estado";
import type { PlayState } from "../lib/recursos";

let failures = 0;
function check(label: string, cond: boolean) {
  if (cond) console.log(`OK   ${label}`);
  else { console.log(`FAIL ${label}`); failures++; }
}

// --- Datos ---
check("hay 15 condiciones", CONDICIONES.length === 15);
check("slugs de condición únicos", new Set(CONDICIONES.map((c) => c.slug)).size === 15);
check("toda condición tiene regla no vacía", CONDICIONES.every((c) => c.regla.trim().length > 0));
check("agotamiento tiene 7 entradas (0–6)", AGOTAMIENTO.length === 7);
check("nivel 6 de agotamiento es la muerte", /muer/i.test(AGOTAMIENTO[6]));

// --- PG ---
const vacio: PlayState = {};
check("hp ausente = maxHp", pgActuales(vacio, 20) === 20);
check("hp se acota al máximo", pgActuales({ hp: 999 }, 20) === 20);
check("hp no baja de 0", pgActuales({ hp: -5 }, 20) === 0);
check("pgTemp por defecto 0", pgTemp(vacio) === 0);

const dañado = aplicarDaño({ hp: 20 }, 7, 20);
check("daño baja los PG", pgActuales(dañado, 20) === 13);
check("daño no marca muerte si aún tienes PG", !dañado.muerte);

const conTemp = aplicarDaño({ hp: 20, tempHp: 5 }, 7, 20);
check("el daño come temporales primero", pgTemp(conTemp) === 0 && pgActuales(conTemp, 20) === 18);

const alSuelo = aplicarDaño({ hp: 3 }, 50, 20);
check("el daño masivo deja los PG en 0, no negativos", pgActuales(alSuelo, 20) === 0);

check("no toca usos", JSON.stringify(aplicarDaño({ hp: 20, usos: { furias: 1 } }, 5, 20).usos) === JSON.stringify({ furias: 1 }));

// --- Muerte ---
const abajo: PlayState = { hp: 0 };
check("estaAbajo a 0 PG", estaAbajo(abajo, 20));
const golpeAbajo = aplicarDaño(abajo, 4, 20);
check("daño a 0 PG marca un fallo de muerte", golpeAbajo.muerte?.fail === 1);
const critAbajo = aplicarDaño(abajo, 4, 20, true);
check("daño crítico a 0 PG marca dos fallos", critAbajo.muerte?.fail === 2);

let m: PlayState = { hp: 0, muerte: { ok: 0, fail: 0 } };
m = marcarMuerte(marcarMuerte(marcarMuerte(m, "fail"), "fail"), "fail");
check("tres fallos = muerto", resultadoMuerte(m) === "muerto");
check("marcarMuerte topa en 3", marcarMuerte(m, "fail").muerte?.fail === 3);
let s: PlayState = { hp: 0, muerte: { ok: 2, fail: 1 } };
s = marcarMuerte(s, "ok");
check("tres éxitos = estable", resultadoMuerte(s) === "estable");
check("desmarcar resta", desmarcarMuerte({ hp: 0, muerte: { ok: 1, fail: 0 } }, "ok").muerte?.ok === 0);
check("sin muerte, resultado null", resultadoMuerte({ hp: 5 }) === null);

const levantado = curar({ hp: 0, muerte: { ok: 1, fail: 2 } }, 3, 20);
check("curar sube los PG", pgActuales(levantado, 20) === 3);
check("curar borra las salvaciones de muerte", !levantado.muerte);

check("setTemp fija los temporales", pgTemp(setTemp(vacio, 8)) === 8);
check("setTemp no baja de 0", pgTemp(setTemp(vacio, -3)) === 0);

// --- Condiciones y agotamiento ---
const env = alternarCondicion(vacio, "envenenado");
check("alternar añade la condición", env.conds?.includes("envenenado") === true);
check("alternar de nuevo la quita", alternarCondicion(env, "envenenado").conds?.includes("envenenado") === false);
check("setAgotamiento acota a 6", setAgotamiento(vacio, 9).agotamiento === 6);
check("setAgotamiento acota a 0", setAgotamiento(vacio, -1).agotamiento === 0);

// --- Resolvedor de ventaja ---
check("envenenado ⇒ desventaja en ataque", ventajaDe(env, "ataque") === "dis");
check("envenenado ⇒ desventaja en prueba", ventajaDe(env, "prueba") === "dis");
check("envenenado NO afecta a salvaciones", ventajaDe(env, "salvez") === null);
check("sin condiciones ⇒ null", ventajaDe(vacio, "prueba") === null);
check("derribado ⇒ desventaja solo en ataque", ventajaDe(alternarCondicion(vacio, "derribado"), "ataque") === "dis" && ventajaDe(alternarCondicion(vacio, "derribado"), "prueba") === null);

if (failures) { console.log(`\n${failures} FALLos`); process.exit(1); }
console.log("\nTodo en verde");
