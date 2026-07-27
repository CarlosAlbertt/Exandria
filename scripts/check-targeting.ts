// Comprobación de las reglas de targeting. Uso: npx tsx scripts/check-targeting.ts
import {
  ventajaAtacante, combinar, autoFallaSalvacion,
  ventajaSalvacion, critProximidad, formulaDaño,
} from "../lib/targeting";

let failures = 0;
function check(label: string, cond: boolean) {
  if (cond) console.log(`OK   ${label}`);
  else { console.log(`FAIL ${label}`); failures++; }
}

// --- ventajaAtacante -----------------------------------------------------
// Ya no se mide: `cuerpoACuerpo` se deduce del arma (true = arma de cuerpo).
for (const s of ["cegado", "paralizado", "petrificado", "restringido", "aturdido", "inconsciente"]) {
  const v = ventajaAtacante([s], true);
  check(`${s}: atacante con ventaja (cuerpo)`, v.adv === true && v.dis === false);
  const vd = ventajaAtacante([s], false);
  check(`${s}: atacante con ventaja también a distancia`, vd.adv === true && vd.dis === false);
}
check("apresado NO da ventaja al atacante", (() => { const v = ventajaAtacante(["apresado"], true); return !v.adv && !v.dis; })());
check("sin condiciones: ni ventaja ni desventaja", (() => { const v = ventajaAtacante([], true); return !v.adv && !v.dis; })());
check("derribado, arma de cuerpo: ventaja", (() => { const v = ventajaAtacante(["derribado"], true); return v.adv && !v.dis; })());
check("derribado, arma a distancia: desventaja", (() => { const v = ventajaAtacante(["derribado"], false); return !v.adv && v.dis; })());
check("cegado + derribado a distancia: ambas caras", (() => { const v = ventajaAtacante(["cegado", "derribado"], false); return v.adv && v.dis; })());

// --- combinar (anulación 2024, global) -----------------------------------
check("combinar: solo ventaja objetivo ⇒ adv", combinar(null, { adv: true, dis: false }) === "adv");
check("combinar: solo desventaja objetivo ⇒ dis", combinar(null, { adv: false, dis: true }) === "dis");
check("combinar: nada ⇒ null", combinar(null, { adv: false, dis: false }) === null);
check("combinar: propia dis + objetivo adv ⇒ null (anula)", combinar("dis", { adv: true, dis: false }) === null);
check("combinar: propia dis + objetivo dis ⇒ dis", combinar("dis", { adv: false, dis: true }) === "dis");
check("combinar: objetivo con ambas caras ⇒ null", combinar(null, { adv: true, dis: true }) === null);
check("combinar: propia adv + objetivo adv ⇒ adv", combinar("adv", { adv: true, dis: false }) === "adv");

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
check("paralizado, arma de cuerpo: crítico", critProximidad(["paralizado"], true) === true);
check("inconsciente, arma de cuerpo: crítico", critProximidad(["inconsciente"], true) === true);
check("paralizado, arma a distancia: NO crítico", critProximidad(["paralizado"], false) === false);
check("cegado, arma de cuerpo: NO crítico (condición no aplica)", critProximidad(["cegado"], true) === false);
check("sin condiciones: NO crítico", critProximidad([], true) === false);

// --- formulaDaño ---------------------------------------------------------
check("daño normal 1d8+3", formulaDaño("1d8", 3, false) === "1d8+3");
check("daño crítico dobla dados 1d8 ⇒ 2d8+3", formulaDaño("1d8", 3, true) === "2d8+3");
check("daño crítico mod negativo 1d6-1 ⇒ 2d6-1", formulaDaño("1d6", -1, true) === "2d6-1");
check("daño mod 0 conserva +0", formulaDaño("1d4", 0, false) === "1d4+0");
check("daño con dado malformado NO se dobla (cae al string)", formulaDaño("noesundado", 2, true) === "noesundado+2");

if (failures) { console.log(`\n${failures} FALLos`); process.exit(1); }
console.log("\nTodo en verde");
