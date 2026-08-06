// Comprobación de la tabla de despiece (data/despiece.ts): qué suelta cada
// monstruo con Extracción de Componentes.
// Uso: npx tsx scripts/check-despiece.ts
//
// Ojo con el nombre: `check-materiales.ts` es OTRO gate (los seis catálogos y
// el cruce entre ellos) y `check-bestiary.ts` otro más (los statblocks). Este
// vigila solo el PUENTE entre los dos, que es donde nadie miraba.
import { DESPIECE, piezasDe, esDespiezable, despieceDe } from "../data/despiece";
import { MATERIALES } from "../lib/materiales";
import { ALL_MONSTERS } from "../data/bestiary";

let failures = 0;
function check(label: string, condition: boolean) {
  if (condition) console.log(`OK   ${label}`);
  else { console.log(`FAIL ${label}`); failures++; }
}

const PORNOMBRE = new Map(MATERIALES.map((m) => [m.name, m]));
const SLUGS = new Map(ALL_MONSTERS.map((m) => [m.slug, m]));

// --- Todo lo que la tabla promete existe -----------------------------------
// Es la invariante que de verdad importa: un nombre mal escrito aquí sería un
// monstruo que al despiezarlo no suelta NADA, sin ningún error a la vista.
for (const [slug, mats] of Object.entries(DESPIECE)) {
  check(`${slug}: el monstruo existe en el bestiario`, SLUGS.has(slug));
  check(`${slug}: suelta algo`, mats.length > 0);
  check(`${slug}: sin materiales repetidos`, new Set(mats).size === mats.length);
  for (const n of mats) {
    check(`${slug}: el material «${n}» existe en algún catálogo`, PORNOMBRE.has(n));
  }
}

// --- La tabla no puede prometer más de lo que la regla permite -------------
for (const [slug, mats] of Object.entries(DESPIECE)) {
  const m = SLUGS.get(slug);
  if (!m) continue;
  const tope = piezasDe(m.cr, m.size);
  check(`${slug} (CR ${m.cr}, ${m.size}): ${mats.length} pieza(s) y el tope es ${tope}`,
    mats.length <= tope);
}

// --- La regla de cuántas piezas --------------------------------------------
check("CR 0 Diminuto → 1", piezasDe("0", "Diminuto") === 1);
check("CR 1/4 Mediano → 1", piezasDe("1/4", "Mediano") === 1);
check("CR 2 Mediano → 2", piezasDe("2", "Mediano") === 2);
check("CR 5 Mediano → 3", piezasDe("5", "Mediano") === 3);
check("CR 10 Mediano → 4", piezasDe("10", "Mediano") === 4);
check("CR 20 Mediano → 5", piezasDe("20", "Mediano") === 5);
// El tamaño suma, que es el motivo de que esté en la fórmula.
check("ser Grande suma uno: CR 2 Grande → 3", piezasDe("2", "Grande") === 3);
check("Enorme y Gargantuesco también suman",
  piezasDe("2", "Enorme") === 3 && piezasDe("2", "Gargantuesco") === 3);
// Y los topes, que es donde una fórmula se va de madre sin que se note.
check("nunca menos de 1", piezasDe("0", "Diminuto") >= 1);
check("nunca más de 5 aunque sume el tamaño",
  piezasDe("30", "Gargantuesco") === 5 && piezasDe("20", "Enorme") === 5);

// --- Los Humanoides se quedan fuera a propósito ----------------------------
// Va comprobado y no solo escrito: es una decisión de mesa, y si algún día
// alguien empareja un Plebeyo por inercia, que salte.
for (const [slug] of Object.entries(DESPIECE)) {
  const m = SLUGS.get(slug);
  if (!m) continue;
  check(`${slug}: no es Humanoide`, !/Humanoide/i.test(m.type));
}

// --- Los ayudantes hacen lo que dicen --------------------------------------
check("esDespiezable() dice que sí a uno emparejado", esDespiezable("aguila") === true);
check("esDespiezable() dice que no a uno sin emparejar",
  esDespiezable("plebeyo") === false && esDespiezable("no-existe") === false);
check("despieceDe() devuelve vacío y no undefined para uno sin emparejar",
  Array.isArray(despieceDe({ slug: "plebeyo" })) && despieceDe({ slug: "plebeyo" }).length === 0);

// --- Cobertura, informativa ------------------------------------------------
const cubiertos = Object.keys(DESPIECE).length;
console.log(`\n(${cubiertos} de ${ALL_MONSTERS.length} monstruos emparejados; el resto no es despiezable, que es válido)`);

console.log(failures === 0 ? `\nTodo OK` : `\n${failures} FALLOS`);
process.exit(failures === 0 ? 0 : 1);
