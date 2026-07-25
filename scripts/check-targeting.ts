// Comprobación de las reglas de targeting. Uso: npx tsx scripts/check-targeting.ts
import {
  ventajaAtacante, combinar, enAlcance, autoFallaSalvacion,
  ventajaSalvacion, critProximidad, formulaDaño,
} from "../lib/targeting";
import { ARMAS } from "../data/weapons";

let failures = 0;
function check(label: string, cond: boolean) {
  if (cond) console.log(`OK   ${label}`);
  else { console.log(`FAIL ${label}`); failures++; }
}

// --- ventajaAtacante -----------------------------------------------------
for (const s of ["cegado", "paralizado", "petrificado", "restringido", "aturdido", "inconsciente"]) {
  const v = ventajaAtacante([s], 1.5);
  check(`${s}: atacante con ventaja`, v.adv === true && v.dis === false);
}
check("apresado NO da ventaja al atacante", (() => { const v = ventajaAtacante(["apresado"], 1.5); return !v.adv && !v.dis; })());
check("sin condiciones: ni ventaja ni desventaja", (() => { const v = ventajaAtacante([], 1.5); return !v.adv && !v.dis; })());
check("derribado a ≤1,5 m: ventaja (cuerpo)", (() => { const v = ventajaAtacante(["derribado"], 1.5); return v.adv && !v.dis; })());
check("derribado a >1,5 m: desventaja (distancia)", (() => { const v = ventajaAtacante(["derribado"], 3); return !v.adv && v.dis; })());
check("cegado + derribado a distancia: ambas caras", (() => { const v = ventajaAtacante(["cegado", "derribado"], 6); return v.adv && v.dis; })());

// --- combinar (anulación 2024, global) -----------------------------------
check("combinar: solo ventaja objetivo ⇒ adv", combinar(null, { adv: true, dis: false }) === "adv");
check("combinar: solo desventaja objetivo ⇒ dis", combinar(null, { adv: false, dis: true }) === "dis");
check("combinar: nada ⇒ null", combinar(null, { adv: false, dis: false }) === null);
check("combinar: propia dis + objetivo adv ⇒ null (anula)", combinar("dis", { adv: true, dis: false }) === null);
check("combinar: propia dis + objetivo dis ⇒ dis", combinar("dis", { adv: false, dis: true }) === "dis");
check("combinar: objetivo con ambas caras ⇒ null", combinar(null, { adv: true, dis: true }) === null);
check("combinar: propia adv + objetivo adv ⇒ adv", combinar("adv", { adv: true, dis: false }) === "adv");

// --- enAlcance -----------------------------------------------------------
check("daga (cuerpo) a 1,5 m: llega", enAlcance(ARMAS["Daga"], 1.5) === true);
check("daga (cuerpo) a 3 m: NO llega", enAlcance(ARMAS["Daga"], 3) === false);
check("arco corto (distancia) a 20 m: llega", enAlcance(ARMAS["Arco corto"], 20) === true);
check("espada larga (cuerpo) a 0 m: llega", enAlcance(ARMAS["Espada larga"], 0) === true);

// --- autoFallaSalvacion --------------------------------------------------
for (const s of ["paralizado", "aturdido", "inconsciente", "petrificado"]) {
  check(`${s}: auto-falla salvación de Fuerza`, autoFallaSalvacion([s], "fue") === true);
  check(`${s}: auto-falla salvación de Destreza`, autoFallaSalvacion([s], "des") === true);
  check(`${s}: NO auto-falla salvación de Constitución`, autoFallaSalvacion([s], "con") === false);
}
check("envenenado NO auto-falla salvación de Fuerza", autoFallaSalvacion(["envenenado"], "fue") === false);
check("sin condición: no auto-falla", autoFallaSalvacion([], "fue") === false);

// --- ventajaSalvacion ----------------------------------------------------
check("restringido: salvación de Des con desventaja", ventajaSalvacion(["restringido"], "des") === "dis");
check("restringido: salvación de Fue sin desventaja", ventajaSalvacion(["restringido"], "fue") === null);
check("sin restringido: salvación de Des sin desventaja", ventajaSalvacion(["envenenado"], "des") === null);

// --- critProximidad ------------------------------------------------------
check("paralizado a ≤1,5 m: crítico por proximidad", critProximidad(["paralizado"], 1.5) === true);
check("inconsciente a ≤1,5 m: crítico por proximidad", critProximidad(["inconsciente"], 1.5) === true);
check("paralizado a 3 m: NO crítico (lejos)", critProximidad(["paralizado"], 3) === false);
check("paralizado a ≤1,5 m con arma a distancia: crítico igual (RAW: cualquier ataque)", critProximidad(["paralizado"], 1.5) === true);
check("cegado a ≤1,5 m: NO crítico (condición no aplica)", critProximidad(["cegado"], 1.5) === false);

// --- formulaDaño ---------------------------------------------------------
check("daño normal 1d8+3", formulaDaño("1d8", 3, false) === "1d8+3");
check("daño crítico dobla dados 1d8 ⇒ 2d8+3", formulaDaño("1d8", 3, true) === "2d8+3");
check("daño crítico mod negativo 1d6-1 ⇒ 2d6-1", formulaDaño("1d6", -1, true) === "2d6-1");
check("daño mod 0 conserva +0", formulaDaño("1d4", 0, false) === "1d4+0");
check("daño con dado malformado NO se dobla (cae al string)", formulaDaño("noesundado", 2, true) === "noesundado+2");

if (failures) { console.log(`\n${failures} FALLos`); process.exit(1); }
console.log("\nTodo en verde");
