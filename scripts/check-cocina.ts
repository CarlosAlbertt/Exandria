// Comprobación manual de la despensa de cocina.
// Uso: npx tsx scripts/check-cocina.ts
import {
  INGREDIENTES_COCINA, COCINA_CATEGORIA_LABEL, cocinaDe, cocinaPorN,
  type CocinaCategoria,
} from "../data/cocina";

let failures = 0;
function check(label: string, condition: boolean) {
  if (condition) console.log(`OK   ${label}`);
  else { console.log(`FAIL ${label}`); failures++; }
}

// --- La despensa entera -----------------------------------------------------
check("hay 100 ingredientes de cocina", INGREDIENTES_COCINA.length === 100);
check("ningún nombre repetido",
  new Set(INGREDIENTES_COCINA.map((i) => i.name)).size === INGREDIENTES_COCINA.length);
check("ningún nombre vacío", INGREDIENTES_COCINA.every((i) => i.name.trim().length > 0));
check("ninguna descripción vacía", INGREDIENTES_COCINA.every((i) => i.blurb.trim().length > 0));

// Igual que en alquimia: el número es cómo se referencian entre sesiones, así
// que no puede haber huecos ni repetidos o una receta apuntaría a la nada.
const ns = INGREDIENTES_COCINA.map((i) => i.n);
check("los números de catálogo son únicos", new Set(ns).size === ns.length);
check("van de 1 a 100 sin huecos",
  ns.slice().sort((a, b) => a - b).every((n, idx) => n === idx + 1));
check("la despensa está en orden de número",
  ns.every((n, idx) => idx === 0 || n > ns[idx - 1]));

// --- Reparto por categoría --------------------------------------------------
const ESPERADO: Record<CocinaCategoria, number> = {
  carne: 25, pescado: 20, vegetal: 25, lacteo: 15, despensa: 15,
};
let suma = 0;
for (const cat of Object.keys(ESPERADO) as CocinaCategoria[]) {
  const n = cocinaDe(cat).length;
  suma += n;
  check(`categoría ${cat}: ${ESPERADO[cat]} ingredientes (tiene ${n})`, n === ESPERADO[cat]);
  check(`categoría ${cat} tiene etiqueta`, (COCINA_CATEGORIA_LABEL[cat] ?? "").trim().length > 0);
}
check("las categorías suman la despensa entera", suma === INGREDIENTES_COCINA.length);
check("no hay ninguna categoría fuera de las cinco",
  INGREDIENTES_COCINA.every((i) => i.category in ESPERADO));

const orden: CocinaCategoria[] = ["carne", "pescado", "vegetal", "lacteo", "despensa"];
let cursor = 0;
let seguidas = true;
for (const i of INGREDIENTES_COCINA) {
  if (i.category === orden[cursor]) continue;
  if (i.category === orden[cursor + 1]) { cursor++; continue; }
  seguidas = false;
  break;
}
check("las categorías van en bloques seguidos (carne → pescado → vegetal → lácteo → despensa)", seguidas);

// El cruce entre catálogos vive en `scripts/check-materiales.ts`, que los
// conoce los seis: tenerlo aquí también sería una segunda fuente de verdad.

// --- Los helpers ------------------------------------------------------------
check("cocinaPorN(1) es el Lomo de Oso Lechuza",
  cocinaPorN(1)?.name === "Lomo de Oso Lechuza");
check("cocinaPorN(47) es el Trigo Dorado de Zadash",
  cocinaPorN(47)?.name === "Trigo Dorado de Zadash");
check("cocinaPorN(100) es la Baya Buena deshidratada",
  cocinaPorN(100)?.name === "Baya Buena deshidratada");
check("cocinaPorN de un número que no existe da undefined",
  cocinaPorN(999) === undefined);
check("cocinaPorN(71) no se confunde con el catálogo de alquimia",
  cocinaPorN(71)?.name === "Queso Azul de Kraghammer");
check("cocinaDe respeta la categoría",
  cocinaDe("pescado").every((i) => i.category === "pescado"));

console.log(failures === 0 ? `\nTodo OK` : `\n${failures} FALLOS`);
process.exit(failures === 0 ? 0 : 1);
