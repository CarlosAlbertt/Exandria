// Comprobación del mapa de familias de despiece (data/bestiary/familias.ts).
// Uso: npx tsx scripts/check-familias.ts
//
// Ojo con el nombre: `check-bestiary` vigila los statblocks, `check-despiece`
// el puente monstruo→material, y `check-materiales` los seis catálogos. Este
// vigila solo una cosa, y es la que sostiene todo lo demás: que **la partición
// del censo sea TOTAL**.
import { CENSO_TODOS } from "../data/bestiary/censo-manual";
import { FAMILIAS, SIN_DESPIECE, FAMILIA_DE, EXCLUIDOS } from "../data/bestiary/familias";

let failures = 0;
function check(label: string, condition: boolean) {
  if (condition) console.log(`OK   ${label}`);
  else { console.log(`FAIL ${label}`); failures++; }
}

const censo = new Set(CENSO_TODOS);
const excluidos = new Set(EXCLUIDOS);
const enFamilia = Object.keys(FAMILIA_DE);

// --- La partición es TOTAL --------------------------------------------------
// Esta es la razón de existir del archivo. Sin ella, un monstruo del manual se
// quedaría sin familia **en silencio** y al despiezarlo no soltaría nada — el
// mismo fallo mudo que ya vigila `check-despiece` un nivel más abajo. Con ella,
// añadir un monstruo al censo OBLIGA a decidir si se despieza o no.
const sinClasificar = CENSO_TODOS.filter((n) => !FAMILIA_DE[n] && !excluidos.has(n));
check(`todo el censo está clasificado (${sinClasificar.length} sin clasificar${sinClasificar.length ? ": " + sinClasificar.slice(0, 5).join(", ") : ""})`,
  sinClasificar.length === 0);

// --- Y es una PARTICIÓN, no un revoltijo -----------------------------------
// Sin esto, «clasificado» podría significar «está en tres sitios a la vez».
const cuenta = new Map<string, number>();
for (const f of Object.values(FAMILIAS)) for (const n of f.miembros) cuenta.set(n, (cuenta.get(n) ?? 0) + 1);
const dobles = [...cuenta.entries()].filter(([, c]) => c > 1).map(([n]) => n);
check(`ningún monstruo en dos familias${dobles.length ? ": " + dobles.join(", ") : ""}`, dobles.length === 0);

const enAmbos = enFamilia.filter((n) => excluidos.has(n));
check(`ninguno con familia Y excluido a la vez${enAmbos.length ? ": " + enAmbos.join(", ") : ""}`, enAmbos.length === 0);

// --- Nada inventado ---------------------------------------------------------
// Un miembro que no esté en el censo es un nombre mal escrito, y valdría por
// dos: el monstruo real se quedaría sin familia y este no existiría nunca.
const fantasmas = enFamilia.filter((n) => !censo.has(n));
check(`ningún miembro fuera del censo${fantasmas.length ? ": " + fantasmas.slice(0, 5).join(", ") : ""}`, fantasmas.length === 0);

const exclFantasma = EXCLUIDOS.filter((n) => !censo.has(n));
check(`ningún excluido fuera del censo${exclFantasma.length ? ": " + exclFantasma.join(", ") : ""}`, exclFantasma.length === 0);

// --- Las cuentas cuadran ----------------------------------------------------
check(`familias + excluidos = censo (${new Set(enFamilia).size} + ${EXCLUIDOS.length} = ${CENSO_TODOS.length})`,
  new Set(enFamilia).size + EXCLUIDOS.length === CENSO_TODOS.length);

// --- Forma ------------------------------------------------------------------
for (const [clave, f] of Object.entries(FAMILIAS)) {
  check(`${clave}: tiene etiqueta`, f.label.trim().length > 0);
  check(`${clave}: tiene al menos un miembro`, f.miembros.length > 0);
  check(`${clave}: la clave es kebab sin acentos ni mayúsculas`, /^[a-z0-9]+(-[a-z0-9]+)*$/.test(clave));
  check(`${clave}: sin miembros repetidos dentro`, new Set(f.miembros).size === f.miembros.length);
}
check("ninguna etiqueta de familia repetida",
  new Set(Object.values(FAMILIAS).map((f) => f.label)).size === Object.keys(FAMILIAS).length);
check("cada exclusión trae su motivo escrito",
  Object.keys(SIN_DESPIECE).every((motivo) => motivo.trim().length > 0));
check("hay exclusiones declaradas (si no, la regla de los Humanoides se perdió)",
  EXCLUIDOS.length > 0);

// --- La regla que decidió el reparto ---------------------------------------
// «Separa lo que da material distinto, junta lo que da el mismo.» Se ancla en
// los dos casos que la definieron, escritos a mano: si alguien fusiona los
// dragones por familia o parte las edades, el gate lo canta.
check("los dragones se separan por COLOR: rojo y blanco no son la misma familia",
  FAMILIA_DE["Adult Red Dragon"] !== FAMILIA_DE["Adult White Dragon"]);
check("y NO por edad: cría y anciano rojo caen en la misma",
  FAMILIA_DE["Red Dragon Wyrmling"] === FAMILIA_DE["Ancient Red Dragon"]);
check("los mefitos se separan por elemento: hielo y magma no son lo mismo",
  FAMILIA_DE["Ice Mephit"] !== FAMILIA_DE["Magma Mephit"]);
check("los modrones NO se separan: del monodrón al pentadrón sale el mismo metal",
  FAMILIA_DE["Modron Monodrone"] === FAMILIA_DE["Modron Pentadrone"]);
check("el Plebeyo no tiene familia: las personas no se despiezan",
  FAMILIA_DE["Commoner"] === undefined && excluidos.has("Commoner"));

console.log(`\n(${Object.keys(FAMILIAS).length} familias cubren ${new Set(enFamilia).size} statblocks; ${EXCLUIDOS.length} excluidos)`);
console.log(failures === 0 ? `\nTodo OK` : `\n${failures} FALLOS`);
process.exit(failures === 0 ? 0 : 1);
