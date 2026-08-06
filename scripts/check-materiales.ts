// Comprobación manual de los catálogos de destilación, cristalografía y
// tatuaje, MÁS el cruce entre los seis catálogos de oficio.
// Uso: npx tsx scripts/check-materiales.ts
import { INGREDIENTES } from "../data/alquimia";
import { INGREDIENTES_COCINA } from "../data/cocina";
import { MATERIALES_FORJA } from "../data/forja";
import { INGREDIENTES_DESTILACION, DESTILACION_CON_RIESGO, destilacionPorN } from "../data/destilacion";
import { MATERIALES_CRISTAL, CRISTAL_HERRAMIENTAS, cristalPorN } from "../data/cristalografia";
import { MATERIALES_TATUAJE, TATUAJE_HERRAMIENTAS, tatuajePorN } from "../data/tatuaje";

let failures = 0;
function check(label: string, condition: boolean) {
  if (condition) console.log(`OK   ${label}`);
  else { console.log(`FAIL ${label}`); failures++; }
}

/** Las reglas que valen para cualquier catálogo de oficio. */
function comprobarCatalogo(
  etiqueta: string,
  items: { n: number; name: string; blurb: string }[],
  total: number,
) {
  check(`${etiqueta}: hay ${total} entradas (tiene ${items.length})`, items.length === total);
  check(`${etiqueta}: ningún nombre repetido`,
    new Set(items.map((i) => i.name)).size === items.length);
  check(`${etiqueta}: ningún nombre vacío`, items.every((i) => i.name.trim().length > 0));
  check(`${etiqueta}: ninguna descripción vacía`, items.every((i) => i.blurb.trim().length > 0));
  const ns = items.map((i) => i.n);
  check(`${etiqueta}: números únicos`, new Set(ns).size === ns.length);
  check(`${etiqueta}: van de 1 a ${total} sin huecos`,
    ns.slice().sort((a, b) => a - b).every((n, idx) => n === idx + 1));
  check(`${etiqueta}: en orden de número`,
    ns.every((n, idx) => idx === 0 || n > ns[idx - 1]));
}

comprobarCatalogo("destilación", INGREDIENTES_DESTILACION, 50); // 49 + 1 de despiece
comprobarCatalogo("cristalografía", MATERIALES_CRISTAL, 50);
comprobarCatalogo("tatuaje", MATERIALES_TATUAJE, 28); // 25 + 3 de despiece

// --- Destilación: el riesgo -------------------------------------------------
// Es el catálogo peligroso: varios ingredientes traen contrapartida explícita.
// Si la marca se pierde, una receta futura no sabría cuáles envenenan.
check("destilación: DESTILACION_CON_RIESGO solo trae los marcados",
  DESTILACION_CON_RIESGO.every((i) => i.riesgo === true));
check("destilación: los trae todos",
  DESTILACION_CON_RIESGO.length === INGREDIENTES_DESTILACION.filter((i) => i.riesgo).length);
check("destilación: hay riesgo marcado en al menos un tercio",
  DESTILACION_CON_RIESGO.length >= Math.floor(INGREDIENTES_DESTILACION.length / 3));
check("destilación: «Extracto de Memoria» está UNA vez (venía duplicado)",
  INGREDIENTES_DESTILACION.filter((i) => i.name.startsWith("Extracto de Memoria")).length === 1);

// --- Herramientas -----------------------------------------------------------
// Cinceles, agujas y paños no se gastan: una receta los exige disponibles, no
// los consume. Confundirlos con material haría gastar el cincel en cada tirada.
check("cristalografía: CRISTAL_HERRAMIENTAS solo trae las marcadas",
  CRISTAL_HERRAMIENTAS.every((m) => m.herramienta === true));
check("cristalografía: las trae todas",
  CRISTAL_HERRAMIENTAS.length === MATERIALES_CRISTAL.filter((m) => m.herramienta).length);
check("cristalografía: hay herramientas declaradas", CRISTAL_HERRAMIENTAS.length > 0);
check("tatuaje: TATUAJE_HERRAMIENTAS solo trae las marcadas",
  TATUAJE_HERRAMIENTAS.every((m) => m.herramienta === true));
check("tatuaje: las trae todas",
  TATUAJE_HERRAMIENTAS.length === MATERIALES_TATUAJE.filter((m) => m.herramienta).length);
check("tatuaje: hay herramientas declaradas", TATUAJE_HERRAMIENTAS.length > 0);
check("cristalografía: los dos cinceles y las pinzas son herramienta",
  ["Cincel de Hueso de Dragón Rojo", "Cincel de Adamantina", "Pinzas de Hueso de Dragón"]
    .every((n) => MATERIALES_CRISTAL.find((m) => m.name === n)?.herramienta === true));

// --- El cruce entre los SEIS catálogos --------------------------------------
// Cada oficio tiene su propia numeración y no se busca en los otros. Un mismo
// material PUEDE servir a dos oficios —el residuum vale para pociones, para
// armas y para tallar—, pero entonces aparece con nombre propio en cada uno.
// Un nombre EXACTO repetido entre catálogos es ambiguo: una receta no sabría de
// cuál tirar. La lista de solapes se declara aquí; hoy está vacía, así que uno
// nuevo hace fallar el gate y obliga a decidir.
const SOLAPES_ESPERADOS: string[] = [];

const CATALOGOS: { etiqueta: string; nombres: string[] }[] = [
  { etiqueta: "alquimia", nombres: INGREDIENTES.map((i) => i.name) },
  { etiqueta: "cocina", nombres: INGREDIENTES_COCINA.map((i) => i.name) },
  { etiqueta: "forja", nombres: MATERIALES_FORJA.map((m) => m.name) },
  { etiqueta: "destilación", nombres: INGREDIENTES_DESTILACION.map((i) => i.name) },
  { etiqueta: "cristalografía", nombres: MATERIALES_CRISTAL.map((m) => m.name) },
  { etiqueta: "tatuaje", nombres: MATERIALES_TATUAJE.map((m) => m.name) },
];

const vistos = new Map<string, string[]>();
for (const c of CATALOGOS) {
  for (const n of c.nombres) {
    const donde = vistos.get(n) ?? [];
    donde.push(c.etiqueta);
    vistos.set(n, donde);
  }
}
const repetidos = [...vistos.entries()]
  .filter(([, donde]) => donde.length > 1)
  .map(([n, donde]) => `${n} (${donde.join(" + ")})`)
  .sort();

check(`ningún nombre exacto en dos catálogos${repetidos.length ? ` — hay: ${repetidos.join("; ")}` : ""}`,
  JSON.stringify(repetidos.map((r) => r.split(" (")[0])) === JSON.stringify(SOLAPES_ESPERADOS));

check("los seis catálogos suman 391 entradas (77+105+81+50+50+28)",
  CATALOGOS.reduce((s, c) => s + c.nombres.length, 0) === 391);
check("los seis catálogos están declarados", CATALOGOS.length === 6);

// --- Los helpers ------------------------------------------------------------
check("destilacionPorN(1) es el Ruidium Líquido",
  destilacionPorN(1)?.name === "Ruidium Líquido");
check("destilacionPorN(49) es el Filtro de Éter",
  destilacionPorN(49)?.name === "Filtro de Éter");
check("cristalPorN(26) es el Residuum en bruto",
  cristalPorN(26)?.name === "Residuum en bruto");
check("tatuajePorN(1) es la Tinta de Kraken del Lucidian",
  tatuajePorN(1)?.name === "Tinta de Kraken del Lucidian");
check("los tres helpers dan undefined si no existe",
  destilacionPorN(999) === undefined && cristalPorN(999) === undefined && tatuajePorN(999) === undefined);

console.log(failures === 0 ? `\nTodo OK` : `\n${failures} FALLOS`);
process.exit(failures === 0 ? 0 : 1);
