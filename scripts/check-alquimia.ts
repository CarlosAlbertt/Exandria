// Comprobación manual del catálogo de ingredientes de alquimia.
// Uso: npx tsx scripts/check-alquimia.ts
import {
  INGREDIENTES, CATEGORIA_LABEL, ingredientesDe, ingredientePorN,
  type IngredienteCategoria,
} from "../data/alquimia";
import {
  POCIONES, RAREZA_LABEL, RAREZA_ORDEN, pocionPorSlug, pocionesDe,
} from "../data/pociones";

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

// --- Pociones ---------------------------------------------------------------
check("hay 25 pociones", POCIONES.length === 25);
check("ningún slug repetido",
  new Set(POCIONES.map((p) => p.slug)).size === POCIONES.length);
check("ningún nombre de poción repetido",
  new Set(POCIONES.map((p) => p.name)).size === POCIONES.length);
check("los slugs son kebab-case sin acentos",
  POCIONES.every((p) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.slug)));
check("ninguna poción con nombre, blurb, efecto o fuente vacíos",
  POCIONES.every((p) => p.name.trim() && p.nameEn.trim() && p.blurb.trim() && p.effect.trim() && p.source.trim()));
check("todas las rarezas están en RAREZA_ORDEN",
  POCIONES.every((p) => RAREZA_ORDEN.includes(p.rareza)));
check("todas las rarezas tienen etiqueta",
  RAREZA_ORDEN.every((r) => (RAREZA_LABEL[r] ?? "").trim().length > 0));

// «Rareza variable» solo tiene sentido si la entrada declara sus variantes, y
// al revés: una entrada con variantes no puede fingir una rareza única.
for (const p of POCIONES) {
  check(`«${p.name}»: rareza variable ⇔ tiene variantes`,
    (p.rareza === "variable") === Array.isArray(p.variantes));
  for (const v of p.variantes ?? []) {
    check(`«${p.name}» › «${v.name}»: rareza concreta`,
      v.rareza !== ("variable" as never) && RAREZA_ORDEN.includes(v.rareza));
    check(`«${p.name}» › «${v.name}»: nombre y detalle no vacíos`,
      v.name.trim().length > 0 && v.detalle.trim().length > 0);
  }
}
check("las dos familias son Curación y Fuerza de Gigante",
  POCIONES.filter((p) => p.variantes).map((p) => p.slug).join(",") === "curacion,fuerza-de-gigante");
check("Curación tiene 4 potencias",
  pocionPorSlug("curacion")?.variantes?.length === 4);
check("Fuerza de Gigante tiene 5 filas",
  pocionPorSlug("fuerza-de-gigante")?.variantes?.length === 5);

// La procedencia importa: es lo que permite volver al libro a comprobarlo.
check("23 pociones vienen de la Guía del Dungeon Master",
  POCIONES.filter((p) => p.source.startsWith("Guía del Dungeon Master")).length === 23);
check("2 pociones vienen de Wildemount",
  POCIONES.filter((p) => p.source.startsWith("Explorer's Guide")).length === 2);

check("pocionPorSlug encuentra la de curación",
  pocionPorSlug("curacion")?.name === "Poción de Curación");
check("pocionPorSlug de un slug que no existe da undefined",
  pocionPorSlug("no-existe") === undefined);
check("pocionesDe respeta la rareza",
  pocionesDe("comun").every((p) => p.rareza === "comun"));
check("hay pociones comunes, raras y muy raras",
  pocionesDe("comun").length > 0 && pocionesDe("rara").length > 0 && pocionesDe("muy-rara").length > 0);

console.log(failures === 0 ? `\nTodo OK` : `\n${failures} FALLOS`);
process.exit(failures === 0 ? 0 : 1);
