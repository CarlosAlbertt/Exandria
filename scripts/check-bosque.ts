// Comprobación de data/bosque.ts. Uso: npx tsx scripts/check-bosque.ts
//
// ⚠️ Este NO es `check-bestiary` (que vigila los statblocks y el censo) ni
// `check-encuentros`. Vigila el PUENTE: que la tabla de la Expansión Verdante
// apunte a monstruos que existen o que están declarados como pendientes, y que
// las dos listas no se solapen nunca.
//
// La pregunta de siempre: ¿qué tendría que romperse para que esto falle?
//   · Un nombre mal escrito → no está en ALL_MONSTERS ni en PENDIENTES.
//   · Un lote nuevo que extraiga un pendiente y no lo quite de la lista → el
//     bicho estaría en los dos sitios y el DM creería que sigue sin ficha.
//   · Una franja que contradiga el CR de un monstruo que SÍ existe.
import { ALL_MONSTERS } from "../data/bestiary";
import {
  ENCUENTROS_VERDANTE, PENDIENTES, FRANJAS, encuentrosDe, jugablesDe,
  type Franja,
} from "../data/bosque";

let failures = 0;
function check(label: string, cond: boolean) {
  if (cond) console.log(`OK   ${label}`);
  else { console.log(`FAIL ${label}`); failures++; }
}

const porNombre = new Map(ALL_MONSTERS.map((m) => [m.name, m]));
const pendientes = new Set(PENDIENTES);

/* ----------------------------- LAS FRANJAS ----------------------------- */
// Las tres van escritas a mano aquí: si salieran de FRANJAS, las dos mitades
// se moverían juntas y renombrar una no rompería nada.
const ESPERADAS: Franja[] = ["linde", "espesura", "corazon"];
check("hay exactamente 3 franjas", FRANJAS.length === 3);
check("las franjas son linde, espesura y corazon (en ese orden)",
  FRANJAS.map((f) => f.key).join(",") === ESPERADAS.join(","));
for (const f of FRANJAS) {
  check(`la franja "${f.key}" tiene etiqueta y descripción`, f.label.length > 0 && f.blurb.length > 20);
}

/* ------------------------- EL PUENTE, LO QUE IMPORTA ------------------- */
check("la tabla no está vacía", ENCUENTROS_VERDANTE.length > 0);

// Nada repetido: dos filas del mismo bicho harían que saliera el doble.
const nombres = ENCUENTROS_VERDANTE.map((e) => e.name);
const repes = nombres.filter((n, i) => nombres.indexOf(n) !== i);
check(`ningún monstruo repetido en la tabla${repes.length ? ` (repetidos: ${[...new Set(repes)].join(", ")})` : ""}`,
  repes.length === 0);

// LA GORDA: cada entrada existe o está declarada pendiente. Un nombre inventado
// —o con una tilde de menos— no está en ninguno de los dos sitios.
for (const e of ENCUENTROS_VERDANTE) {
  const existe = porNombre.has(e.name);
  const pend = pendientes.has(e.name);
  check(`"${e.name}" está en el bestiario o declarado pendiente`, existe || pend);
  // Y NUNCA en los dos: si un lote lo extrajo, hay que quitarlo de PENDIENTES o
  // la tabla seguirá diciendo que no tiene ficha cuando ya la tiene.
  check(`"${e.name}" no está a la vez extraído y pendiente`, !(existe && pend));
}

// Al revés: un pendiente que no use nadie es una lista que se quedó vieja.
const enTabla = new Set(nombres);
for (const p of PENDIENTES) {
  check(`el pendiente "${p}" sale en la tabla`, enTabla.has(p));
}

// Toda entrada lleva franja válida y nota escrita: una fila sin nota obliga al
// DM a adivinar por qué ese bicho está en esa franja.
for (const e of ENCUENTROS_VERDANTE) {
  check(`"${e.name}" tiene una franja válida`, ESPERADAS.includes(e.franja));
  check(`"${e.name}" explica por qué está en su franja`, e.nota.trim().length >= 15);
}

/* ------------------- LA FRANJA CONTRA EL CR, DONDE SE PUEDE ------------ */
// Solo se puede comprobar en los que YA tienen ficha; de los pendientes no
// sabemos el CR y no se inventa. La franja la dicta la narración, así que esto
// no es circular: pone suelo y techo a una decisión tomada a mano.
const CR_NUM: Record<string, number> = { "0": 0, "1/8": 0.125, "1/4": 0.25, "1/2": 0.5 };
const cr = (s: string) => (s in CR_NUM ? CR_NUM[s] : Number(s));

for (const e of ENCUENTROS_VERDANTE) {
  const m = porNombre.get(e.name);
  if (!m) continue;
  const c = cr(m.cr);
  if (e.franja === "linde") {
    check(`"${e.name}" en la linde no pasa de CR 1/2 (es ${m.cr})`, c <= 0.5);
  }
  if (e.franja === "corazon") {
    check(`"${e.name}" en el corazón no baja de CR 1 (es ${m.cr})`, c >= 1);
  }
}

/* ------------------------------ CONSULTAS ------------------------------ */
// Las tres franjas tienen algo. Una vacía deja al DM sin tabla en ese tramo.
for (const f of ESPERADAS) {
  check(`la franja "${f}" tiene entradas`, encuentrosDe(f).length > 0);
}
check("encuentrosDe reparte todas las entradas",
  ESPERADAS.reduce((n, f) => n + encuentrosDe(f).length, 0) === ENCUENTROS_VERDANTE.length);

// `jugablesDe` es lo que se puede poner en la mesa HOY. Que la linde tenga algo
// jugable es lo que hace que la tabla no nazca muerta esperando al bestiario.
check("la linde tiene monstruos jugables ya", jugablesDe("linde").length > 0);
check("la espesura tiene monstruos jugables ya", jugablesDe("espesura").length > 0);
for (const f of ESPERADAS) {
  check(`jugablesDe("${f}") no devuelve ningún pendiente`,
    jugablesDe(f).every((j) => !pendientes.has(j.name)));
  check(`jugablesDe("${f}") resuelve el monstruo de verdad`,
    jugablesDe(f).every((j) => j.monster.name === j.name));
}

const jugables = ESPERADAS.reduce((n, f) => n + jugablesDe(f).length, 0);
console.log(`\nTabla de la Expansión Verdante: ${ENCUENTROS_VERDANTE.length} entradas, ` +
  `${jugables} con ficha y ${PENDIENTES.length} esperando extracción.`);
console.log(failures === 0 ? "Todas las comprobaciones pasaron." : `${failures} fallaron.`);
process.exit(failures === 0 ? 0 : 1);
