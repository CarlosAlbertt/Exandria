// Comprobación del cálculo de ataque. Uso: npx tsx scripts/check-ataque.ts
import { ataqueDe, ataquesPorAccion, puedeDosArmas } from "../lib/ataque";
import { ARMAS } from "../data/weapons";

let failures = 0;
function check(label: string, cond: boolean) {
  if (cond) console.log(`OK   ${label}`);
  else { console.log(`FAIL ${label}`); failures++; }
}

const guerrero = ["sencillas", "marciales"];
const mago = ["sencillas"];
// Fue 3, Des 1 (mods), prof 2.
const fuerte = { fue: 3, des: 1 };
// Fue 0, Des 4.
const agil = { fue: 0, des: 4 };

// Espada larga (marcial, cuerpo, no sutil) ⇒ Fue; competente para guerrero.
const el = ataqueDe(ARMAS["Espada larga"], fuerte, 2, guerrero);
check("espada larga usa Fue", el.caracteristica === "fue");
check("espada larga competente para guerrero", el.competente === true);
check("espada larga impacto = 3 + 2", el.modImpacto === 5);
check("espada larga daño = 1d8", el.dadoDaño === "1d8");
check("espada larga modDaño = 3", el.modDaño === 3);

// Espada larga para el mago ⇒ marcial, NO competente.
const elMago = ataqueDe(ARMAS["Espada larga"], fuerte, 2, mago);
check("espada larga NO competente para mago", elMago.competente === false);
check("espada larga sin competencia: impacto = 3 (sin prof)", elMago.modImpacto === 3);

// Arco corto (sencilla, distancia) ⇒ Des; competente para el mago (sencillas).
const arco = ataqueDe(ARMAS["Arco corto"], agil, 2, mago);
check("arco corto usa Des", arco.caracteristica === "des");
check("arco corto competente para mago (sencilla)", arco.competente === true);
check("arco corto impacto = 4 + 2", arco.modImpacto === 6);

// Daga (sutil) con Des > Fue ⇒ elige Des.
const daga = ataqueDe(ARMAS["Daga"], agil, 2, mago);
check("daga sutil elige Des (mejor)", daga.caracteristica === "des");
check("daga modDaño = 4", daga.modDaño === 4);

// Daga (sutil) con Fue > Des ⇒ elige Fue.
const dagaFuerte = ataqueDe(ARMAS["Daga"], fuerte, 2, mago);
check("daga sutil elige Fue cuando es mejor", dagaFuerte.caracteristica === "fue");

// --- Ataques por acción de Atacar -----------------------------------------
// El guerrero tiene columna propia: 1 hasta nv4, 2 desde nv5, 3 desde nv11, 4 a nv20.
check("guerrero nv1: 1 ataque", ataquesPorAccion("guerrero", 1) === 1);
check("guerrero nv4: 1 ataque", ataquesPorAccion("guerrero", 4) === 1);
check("guerrero nv5: 2 ataques", ataquesPorAccion("guerrero", 5) === 2);
check("guerrero nv10: 2 ataques", ataquesPorAccion("guerrero", 10) === 2);
check("guerrero nv11: 3 ataques", ataquesPorAccion("guerrero", 11) === 3);
check("guerrero nv19: 3 ataques", ataquesPorAccion("guerrero", 19) === 3);
check("guerrero nv20: 4 ataques", ataquesPorAccion("guerrero", 20) === 4);

// Las otras cinco clases con «Ataque Extra» a nivel 5: 1 antes, 2 desde nv5.
for (const c of ["barbaro", "explorador", "cazador-de-sangre", "paladin", "monje"]) {
  check(`${c} nv4: 1 ataque`, ataquesPorAccion(c, 4) === 1);
  check(`${c} nv5: 2 ataques`, ataquesPorAccion(c, 5) === 2);
  check(`${c} nv20: 2 ataques`, ataquesPorAccion(c, 20) === 2);
}

// Pícaro y bardo NO tienen Ataque Extra en 2024: siempre 1. Esta comprobación
// existe para que nadie les regale un ataque que la clase no tiene.
for (const c of ["picaro", "bardo"]) {
  check(`${c} nv5: sigue con 1 ataque`, ataquesPorAccion(c, 5) === 1);
  check(`${c} nv20: sigue con 1 ataque`, ataquesPorAccion(c, 20) === 1);
}

check("clase desconocida: 1 ataque", ataquesPorAccion("no-existe", 20) === 1);
check("nivel fuera de rango se acota por arriba", ataquesPorAccion("guerrero", 99) === 4);
check("nivel fuera de rango se acota por abajo", ataquesPorAccion("guerrero", 0) === 1);

// --- Armas ligeras (luchar con dos armas) ---------------------------------
// Solo estas cuatro son ligeras en el catálogo.
for (const n of ["Daga", "Espada corta", "Hacha de mano", "Cimitarra"]) {
  check(`${n} es ligera`, ARMAS[n].ligera === true);
}
// TRAMPA CLÁSICA: la «Ballesta ligera» se llama así pero NO tiene la propiedad
// ligera (sus propiedades son cargar, dos manos y munición).
check("la Ballesta ligera NO es ligera", !ARMAS["Ballesta ligera"].ligera);
for (const n of ["Espada larga", "Maza", "Bastón", "Lanza", "Martillo de guerra", "Arco corto", "Arco largo"]) {
  check(`${n} no es ligera`, !ARMAS[n].ligera);
}
// Para luchar con dos armas hacen falta ligeras CUERPO A CUERPO.
check("todas las ligeras del catálogo son cuerpo a cuerpo", Object.values(ARMAS).filter((a) => a.ligera).every((a) => a.alcance === "cuerpo"));

// --- Luchar con dos armas (una ligera en CADA mano) -----------------------
// La hoja fusiona objetos del mismo nombre subiendo `qty`, así que dos dagas
// son UNA entrada con qty 2. Contar entradas dejaría la regla sin dispararse
// nunca en el caso más común: se cuenta por cantidad.
check("dos dagas en una entrada (qty 2): sí se puede", puedeDosArmas([{ name: "Daga", qty: 2 }]) === true);
check("una sola daga: no se puede", puedeDosArmas([{ name: "Daga", qty: 1 }]) === false);
check("daga sin qty: cuenta como una, no se puede", puedeDosArmas([{ name: "Daga" }]) === false);
check("daga + hacha de mano (dos entradas): sí se puede", puedeDosArmas([{ name: "Daga", qty: 1 }, { name: "Hacha de mano", qty: 1 }]) === true);
check("daga + espada larga: no (la larga no es ligera)", puedeDosArmas([{ name: "Daga", qty: 1 }, { name: "Espada larga", qty: 1 }]) === false);
check("dos ballestas ligeras: no (ni son ligeras ni cuerpo a cuerpo)", puedeDosArmas([{ name: "Ballesta ligera", qty: 2 }]) === false);
check("inventario vacío: no se puede", puedeDosArmas([]) === false);
check("objetos que no son armas: no se puede", puedeDosArmas([{ name: "Cuerda de cáñamo", qty: 5 }]) === false);
check("tres dagas: sí se puede", puedeDosArmas([{ name: "Daga", qty: 3 }]) === true);

if (failures) { console.log(`\n${failures} FALLos`); process.exit(1); }
console.log("\nTodo en verde");
