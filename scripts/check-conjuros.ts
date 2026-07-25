// Comprobación del motor de conjuros. Uso: npx tsx scripts/check-conjuros.ts
import {
  huecosDe, gastarHueco, devolverHueco, recargarHuecos,
  topePreparados, topeTrucos, cuentaTrucos, cuentaPreparados,
  preparar, despreparar, setConcentracion,
} from "../lib/conjuros";
import type { PlayState } from "../lib/recursos";

let failures = 0;
function check(label: string, cond: boolean) {
  if (cond) console.log(`OK   ${label}`);
  else { console.log(`FAIL ${label}`); failures++; }
}

const vacio: PlayState = {};

// --- huecosDe --------------------------------------------------------------
const full5 = huecosDe("full", 5, vacio);
check("full nv5: tres niveles de hueco", full5.length === 3);
check("full nv5: 4/3/2 espacios", full5[0].max === 4 && full5[1].max === 3 && full5[2].max === 2);
check("full nv5: niveles 1,2,3", full5.map((h) => h.nivel).join(",") === "1,2,3");
check("full nv1: un solo nivel con 2 espacios", (() => { const h = huecosDe("full", 1, vacio); return h.length === 1 && h[0].max === 2; })());
check("half nv1 (paladín): 2 espacios de nivel 1", (() => { const h = huecosDe("half", 1, vacio); return h.length === 1 && h[0].nivel === 1 && h[0].max === 2; })());
check("half nv5: 4 de nv1 y 2 de nv2", (() => { const h = huecosDe("half", 5, vacio); return h.length === 2 && h[0].max === 4 && h[1].max === 2; })());
check("pact nv3 (brujo): 2 espacios, todos de nivel 2", (() => { const h = huecosDe("pact", 3, vacio); return h.length === 1 && h[0].nivel === 2 && h[0].max === 2; })());
check("none: sin huecos", huecosDe("none", 10, vacio).length === 0);
check("solo se listan los niveles con espacios", huecosDe("full", 3, vacio).every((h) => h.max > 0));

// Gastados y restantes salen de play.huecos.
const gastado1: PlayState = { huecos: { "1": 3 } };
check("gastados se leen de play.huecos", huecosDe("full", 5, gastado1)[0].gastados === 3);
check("quedan = max - gastados", huecosDe("full", 5, gastado1)[0].quedan === 1);
check("gastados por encima del max se acotan", huecosDe("full", 1, { huecos: { "1": 9 } })[0].quedan === 0);

// --- gastarHueco / devolverHueco -------------------------------------------
const g1 = gastarHueco(vacio, 1, 4);
check("gastarHueco marca uno", g1.huecos?.["1"] === 1);
check("gastarHueco respeta el tope", gastarHueco({ huecos: { "1": 4 } }, 1, 4).huecos?.["1"] === 4);
check("gastarHueco no toca otros niveles", (() => { const r = gastarHueco({ huecos: { "2": 1 } }, 1, 4); return r.huecos?.["2"] === 1 && r.huecos?.["1"] === 1; })());
check("devolverHueco resta uno", devolverHueco({ huecos: { "1": 2 } }, 1).huecos?.["1"] === 1);
check("devolverHueco tiene suelo 0", devolverHueco({ huecos: { "1": 0 } }, 1).huecos?.["1"] === 0);

// --- recargarHuecos --------------------------------------------------------
const usados: PlayState = { huecos: { "1": 3, "2": 2 } };
check("descanso largo restaura todos los huecos", (() => { const r = recargarHuecos(usados, "full", "largo"); return r.huecos?.["1"] === 0 && r.huecos?.["2"] === 0; })());
check("descanso corto NO restaura los del conjurador completo", (() => { const r = recargarHuecos(usados, "full", "corto"); return r.huecos?.["1"] === 3 && r.huecos?.["2"] === 2; })());
check("descanso corto NO restaura los del semiconjurador", recargarHuecos(usados, "half", "corto").huecos?.["1"] === 3);
check("descanso corto SÍ restaura los de pacto (brujo)", recargarHuecos(usados, "pact", "corto").huecos?.["1"] === 0);
check("descanso largo también restaura los de pacto", recargarHuecos(usados, "pact", "largo").huecos?.["1"] === 0);

// --- topes de la clase -----------------------------------------------------
check("mago nv1: 3 trucos", topeTrucos("mago", 1) === 3);
check("mago nv1: 4 conjuros preparados", topePreparados("mago", 1) === 4);
check("mago nv5: 9 preparados", topePreparados("mago", 5) === 9);
check("hechicero nv1: 4 trucos", topeTrucos("hechicero", 1) === 4);
check("paladín no tiene trucos", topeTrucos("paladin", 5) === 0);
check("explorador no tiene trucos", topeTrucos("explorador", 5) === 0);
check("paladín nv3: 4 preparados", topePreparados("paladin", 3) === 4);
check("una clase sin conjuros no tiene topes", topePreparados("barbaro", 5) === 0 && topeTrucos("barbaro", 5) === 0);
check("el nivel se acota por arriba", topePreparados("mago", 99) === topePreparados("mago", 20));

// --- cuentas y preparar ----------------------------------------------------
// "luz" es truco (nivel 0); "curar-heridas" es de nivel 1.
const conAmbos: PlayState = { preparados: ["luz", "curar-heridas"] };
check("cuentaTrucos cuenta solo los de nivel 0", cuentaTrucos(conAmbos) === 1);
check("cuentaPreparados cuenta solo los de nivel ≥1", cuentaPreparados(conAmbos) === 1);
check("un id desconocido no cuenta en ninguna", (() => { const p: PlayState = { preparados: ["no-existe"] }; return cuentaTrucos(p) === 0 && cuentaPreparados(p) === 0; })());

check("preparar añade el conjuro", preparar(vacio, "curar-heridas", 3, 4).preparados?.includes("curar-heridas") === true);
check("preparar no duplica", preparar({ preparados: ["luz"] }, "luz", 3, 4).preparados?.length === 1);
check("preparar respeta el tope de conjuros", (() => {
  const lleno: PlayState = { preparados: ["curar-heridas"] };
  return preparar(lleno, "escudo", 3, 1).preparados?.length === 1; // tope 1, ya hay 1
})());
check("preparar respeta el tope de trucos", (() => {
  const lleno: PlayState = { preparados: ["luz"] };
  return preparar(lleno, "mano-de-mago", 1, 4).preparados?.length === 1; // tope trucos 1
})());
check("el tope de trucos no bloquea un conjuro de nivel", (() => {
  const lleno: PlayState = { preparados: ["luz"] };
  return preparar(lleno, "curar-heridas", 1, 4).preparados?.length === 2;
})());
check("preparar un id desconocido no hace nada", preparar(vacio, "no-existe", 3, 4).preparados === undefined);
check("despreparar lo quita", despreparar({ preparados: ["luz", "escudo"] }, "luz").preparados?.join(",") === "escudo");
check("despreparar un id que no está no rompe", despreparar({ preparados: ["luz"] }, "escudo").preparados?.join(",") === "luz");

// --- concentración ---------------------------------------------------------
check("setConcentracion fija el conjuro", setConcentracion(vacio, "bendicion").concentrando === "bendicion");
check("setConcentracion reemplaza el anterior", setConcentracion({ concentrando: "bendicion" }, "telarana").concentrando === "telarana");
check("setConcentracion con null lo borra", setConcentracion({ concentrando: "bendicion" }, null).concentrando === undefined);

// --- no pisar las claves de otras fases ------------------------------------
const mixto: PlayState = { usos: { furias: 2 }, hp: 7, conds: ["envenenado"], turno: { accion: true }, huecos: { "1": 1 } };
const tras = recargarHuecos(preparar(gastarHueco(mixto, 1, 4), "luz", 3, 4), "full", "largo");
check("no toca usos", tras.usos?.furias === 2);
check("no toca hp", tras.hp === 7);
check("no toca conds", tras.conds?.join(",") === "envenenado");
check("no toca turno", tras.turno?.accion === true);

if (failures) { console.log(`\n${failures} FALLos`); process.exit(1); }
console.log("\nTodo en verde");
