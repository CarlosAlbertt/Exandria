// Comprobación del cálculo de ataque. Uso: npx tsx scripts/check-ataque.ts
import { ataqueDe } from "../lib/ataque";
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

if (failures) { console.log(`\n${failures} FALLos`); process.exit(1); }
console.log("\nTodo en verde");
