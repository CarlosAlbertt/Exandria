// Comprobación manual del catálogo de ingredientes de alquimia.
// Uso: npx tsx scripts/check-alquimia.ts
import {
  INGREDIENTES, CATEGORIA_LABEL, ingredientesDe, ingredientePorN,
  type IngredienteCategoria,
} from "../data/alquimia";

let failures = 0;
function check(label: string, condition: boolean) {
  if (condition) console.log(`OK   ${label}`);
  else { console.log(`FAIL ${label}`); failures++; }
}

// --- El catálogo entero -----------------------------------------------------
check("hay 70 ingredientes", INGREDIENTES.length === 70);
check("ningún nombre repetido",
  new Set(INGREDIENTES.map((i) => i.name)).size === INGREDIENTES.length);
check("ningún nombre vacío", INGREDIENTES.every((i) => i.name.trim().length > 0));
check("ninguna descripción vacía", INGREDIENTES.every((i) => i.blurb.trim().length > 0));

// El número de catálogo es cómo se referencian entre sesiones («el 46, el
// residuum»): tiene que ser único y no puede saltarse ninguno, o una receta
// futura apuntaría a un hueco.
const ns = INGREDIENTES.map((i) => i.n);
check("los números de catálogo son únicos", new Set(ns).size === ns.length);
check("van de 1 a 70 sin huecos",
  ns.slice().sort((a, b) => a - b).every((n, idx) => n === idx + 1));
check("el catálogo está en orden de número",
  ns.every((n, idx) => idx === 0 || n > ns[idx - 1]));

// --- Reparto por categoría --------------------------------------------------
const ESPERADO: Record<IngredienteCategoria, number> = {
  flora: 20, fauna: 25, mineral: 15, esencia: 10,
};
let suma = 0;
for (const cat of Object.keys(ESPERADO) as IngredienteCategoria[]) {
  const n = ingredientesDe(cat).length;
  suma += n;
  check(`categoría ${cat}: ${ESPERADO[cat]} ingredientes (tiene ${n})`, n === ESPERADO[cat]);
  check(`categoría ${cat} tiene etiqueta`, (CATEGORIA_LABEL[cat] ?? "").trim().length > 0);
}
check("las categorías suman el catálogo entero", suma === INGREDIENTES.length);
check("no hay ninguna categoría fuera de las cuatro",
  INGREDIENTES.every((i) => i.category in ESPERADO));

// Los bloques van seguidos: si alguien inserta un mineral entre la flora, el
// catálogo deja de leerse por secciones.
const orden: IngredienteCategoria[] = ["flora", "fauna", "mineral", "esencia"];
let cursor = 0;
let seguidas = true;
for (const i of INGREDIENTES) {
  if (i.category === orden[cursor]) continue;
  if (i.category === orden[cursor + 1]) { cursor++; continue; }
  seguidas = false;
  break;
}
check("las categorías van en bloques seguidos (flora → fauna → mineral → esencia)", seguidas);

// --- Los helpers ------------------------------------------------------------
check("ingredientePorN(46) es el Residuum",
  ingredientePorN(46)?.name === "Polvo de Residuum puro");
check("ingredientePorN(1) es la Raíz de Oloore",
  ingredientePorN(1)?.name === "Raíz de Oloore");
check("ingredientePorN(70) es el Extracto de Luz de Catha",
  ingredientePorN(70)?.name === "Extracto de Luz de Catha");
check("ingredientePorN de un número que no existe da undefined",
  ingredientePorN(999) === undefined);
check("ingredientesDe respeta la categoría",
  ingredientesDe("mineral").every((i) => i.category === "mineral"));

console.log(failures === 0 ? `\nTodo OK` : `\n${failures} FALLOS`);
process.exit(failures === 0 ? 0 : 1);
