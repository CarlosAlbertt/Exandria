// Comprobación manual del catálogo de materiales de forja.
// Uso: npx tsx scripts/check-forja.ts
import {
  MATERIALES_FORJA, FORJA_CATEGORIA_LABEL, FORJA_CON_MECANICA, forjaDe, forjaPorN,
  type ForjaCategoria,
} from "../data/forja";

let failures = 0;
function check(label: string, condition: boolean) {
  if (condition) console.log(`OK   ${label}`);
  else { console.log(`FAIL ${label}`); failures++; }
}

// --- El catálogo entero -----------------------------------------------------
check("hay 81 materiales de forja (75 originales + 6 de despiece)", MATERIALES_FORJA.length === 81);
check("ningún nombre repetido",
  new Set(MATERIALES_FORJA.map((m) => m.name)).size === MATERIALES_FORJA.length);
check("ningún nombre vacío", MATERIALES_FORJA.every((m) => m.name.trim().length > 0));
check("ninguna descripción vacía", MATERIALES_FORJA.every((m) => m.blurb.trim().length > 0));

const ns = MATERIALES_FORJA.map((m) => m.n);
check("los números de catálogo son únicos", new Set(ns).size === ns.length);
check(`van de 1 a ${MATERIALES_FORJA.length} sin huecos`,
  ns.slice().sort((a, b) => a - b).every((n, idx) => n === idx + 1));
check("el catálogo está en orden de número",
  ns.every((n, idx) => idx === 0 || n > ns[idx - 1]));

// --- Reparto por categoría --------------------------------------------------
const ESPERADO: Record<ForjaCategoria, number> = {
  metal: 15, cristal: 15, monstruo: 21, madera: 15, temple: 15, // monstruo: 15 + 6 de despiece
};
let suma = 0;
for (const cat of Object.keys(ESPERADO) as ForjaCategoria[]) {
  const n = forjaDe(cat).length;
  suma += n;
  check(`categoría ${cat}: ${ESPERADO[cat]} materiales (tiene ${n})`, n === ESPERADO[cat]);
  check(`categoría ${cat} tiene etiqueta`, (FORJA_CATEGORIA_LABEL[cat] ?? "").trim().length > 0);
}
check("las categorías suman el catálogo entero", suma === MATERIALES_FORJA.length);
check("no hay ninguna categoría fuera de las cinco",
  MATERIALES_FORJA.every((m) => m.category in ESPERADO));

// ⚠️ Solo los 75 originales: ver la nota de check-alquimia. El `n` manda.
const BLOQUE_ORIGINAL = 75;
const orden: ForjaCategoria[] = ["metal", "cristal", "monstruo", "madera", "temple"];
let cursor = 0;
let seguidas = true;
for (const m of MATERIALES_FORJA.slice(0, BLOQUE_ORIGINAL)) {
  if (m.category === orden[cursor]) continue;
  if (m.category === orden[cursor + 1]) { cursor++; continue; }
  seguidas = false;
  break;
}
check(`los ${BLOQUE_ORIGINAL} originales van en bloques seguidos (metal → cristal → monstruo → madera → temple)`, seguidas);

// --- La mecánica ------------------------------------------------------------
// Este catálogo es el único de los tres que trae REGLA, no solo sabor. Si el
// campo se queda vacío o se llena de descripción, deja de poder conectarse.
check("ningún `mecanica` vacío o en blanco",
  MATERIALES_FORJA.every((m) => m.mecanica === undefined || m.mecanica.trim().length > 0));
check("FORJA_CON_MECANICA solo trae los que la tienen",
  FORJA_CON_MECANICA.every((m) => !!m.mecanica));
check("FORJA_CON_MECANICA los trae todos",
  FORJA_CON_MECANICA.length === MATERIALES_FORJA.filter((m) => m.mecanica).length);
check("hay al menos un material con mecánica en cada categoría",
  (Object.keys(ESPERADO) as ForjaCategoria[]).every((c) => FORJA_CON_MECANICA.some((m) => m.category === c)));

// Los cuatro que más cambian las reglas, fijados por nombre: si alguien los
// renombra o les quita la mecánica, se entera.
for (const n of ["Mithril Estelar", "Adamantina de Kraghammer", "Residuum refinado", "Azuremita"]) {
  const m = MATERIALES_FORJA.find((x) => x.name === n);
  check(`«${n}» existe y trae mecánica`, !!m?.mecanica);
}

// El cruce entre catálogos vive en `scripts/check-materiales.ts`, que los
// conoce los seis: tenerlo aquí también sería una segunda fuente de verdad.

// --- Los helpers ------------------------------------------------------------
check("forjaPorN(3) es el Mithril Estelar", forjaPorN(3)?.name === "Mithril Estelar");
check("forjaPorN(16) es el Residuum refinado", forjaPorN(16)?.name === "Residuum refinado");
check("forjaPorN(75) es el Polvo de Estrella Fugaz",
  forjaPorN(75)?.name === "Polvo de Estrella Fugaz");
check("forjaPorN de un número que no existe da undefined", forjaPorN(999) === undefined);
check("forjaDe respeta la categoría", forjaDe("madera").every((m) => m.category === "madera"));

console.log(failures === 0 ? `\nTodo OK` : `\n${failures} FALLOS`);
process.exit(failures === 0 ? 0 : 1);
