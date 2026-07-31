// Comprobación de las recetas de oficio y de la maquinaria del caldero.
// Uso: npx tsx scripts/check-recetas.ts
//
// Vigila tres cosas que se rompen en silencio:
//  1. Que una receta no apunte a un material o a una poción que no existe —el
//     caldero se quedaría mudo, sin ningún error.
//  2. Que ninguna receta **gaste una herramienta**. Es el error que el propio
//     catálogo avisa de no cometer: un cincel se exige disponible, no se
//     consume, y confundirlo lo gastaría en cada tirada.
//  3. Que la CD concuerde con la rareza de lo que produce, para que la escala no
//     dependa de que quien escribió la receta mirase la tabla.

import { RECETAS, CD_POR_RAREZA, recetasDe, recetaPorSlug, recetasIniciales, produceNombre, produceRareza } from "../data/recetas";
import { POCIONES } from "../data/pociones";
import { MATERIALES, materialPorN, materialPorNombre, materialesDe, esMaterial, OFICIOS_ORDEN, OFICIO_PERICIA, type Oficio } from "../lib/materiales";
import { huecosUsados } from "../lib/inventario";
import { recetasSabidas, requisitos, puedePreparar, consumir, anadirProducto, idReceta, slugDeId } from "../lib/recetario";
import { SKILLS } from "../data/rules";
import { norm } from "../lib/slug";
import type { Item } from "../lib/character";

let failures = 0;
function check(label: string, condition: boolean) {
  if (condition) console.log(`OK   ${label}`);
  else { console.log(`FAIL ${label}`); failures++; }
}

const item = (name: string, qty: number): Item => ({ id: `t-${name}-${qty}`, name, qty });

/* ------------------- El índice de los seis catálogos ------------------- */
// Esta capa es nueva y **depende de un invariante del gate 30**: que no haya
// ningún nombre repetido entre catálogos. Se vuelve a comprobar aquí, desde el
// lado que ahora depende de él, para que el acoplamiento no quede tácito: si
// alguien admite un solapamiento, falla aquí y no en silencio.
check("el índice reúne los 369 materiales", MATERIALES.length === 369);
const REPARTO: Record<Oficio, number> = {
  alquimia: 70, cocina: 100, forja: 75, destilacion: 49, cristalografia: 50, tatuaje: 25,
};
for (const o of OFICIOS_ORDEN) {
  check(`el índice trae los ${REPARTO[o]} de ${o} (trae ${materialesDe(o).length})`, materialesDe(o).length === REPARTO[o]);
}
const normalizados = MATERIALES.map((m) => norm(m.name));
check("ningún nombre de material es ambiguo entre los seis catálogos",
  new Set(normalizados).size === normalizados.length);
check("materialPorNombre ignora tildes y mayúsculas",
  materialPorNombre("raiz de oloore")?.n === 1 && materialPorNombre("Raíz de Oloore")?.oficio === "alquimia");
check("esMaterial no confunde un arma con un material",
  esMaterial("Espada larga") === false && esMaterial("Raíz de Oloore") === true);
check("cada oficio tiene su pericia en data/rules.ts",
  OFICIOS_ORDEN.every((o) => SKILLS.some((s) => s.name === OFICIO_PERICIA[o] && s.oficio)));

/* ------------------------- Huecos de la bolsa ------------------------- */
// La regla de esta tanda: un montón de material ocupa UN hueco; lo demás cuenta
// por unidad. Si esto se invierte, o recolectar arruina la bolsa o las armas
// dejan de pesar.
check("un montón de 50 materiales ocupa 1 hueco",
  huecosUsados([item("Raíz de Oloore", 50)]) === 1);
check("tres dagas siguen ocupando 3 huecos",
  huecosUsados([item("Daga", 3)]) === 3);
check("materiales distintos ocupan un hueco cada uno",
  huecosUsados([item("Raíz de Oloore", 9), item("Cardo de Fuego", 4), item("Polvo de Residuum puro", 2)]) === 3);
check("la bolsa mezclada suma bien",
  huecosUsados([item("Daga", 2), item("Raíz de Oloore", 30), item("Cuerda de cáñamo", 1)]) === 4);
check("una bolsa vacía ocupa 0", huecosUsados([]) === 0);

/* ----------------------------- Las recetas ----------------------------- */
check("hay 32 recetas", RECETAS.length === 32);
check("ningún slug de receta repetido",
  new Set(RECETAS.map((r) => r.slug)).size === RECETAS.length);
check("los slugs son kebab-case sin acentos",
  RECETAS.every((r) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(r.slug)));
check("esta tanda solo trae recetas de alquimia",
  RECETAS.every((r) => r.oficio === "alquimia") && recetasDe("alquimia").length === 32);
check("recetaPorSlug encuentra y falla bien",
  recetaPorSlug("trepar")?.produce === "trepar" && recetaPorSlug("no-existe") === undefined);

for (const r of RECETAS) {
  // --- Materiales: existen, no se repiten, cantidades sanas ---------------
  check(`«${r.slug}»: lleva al menos un material`, r.materiales.length > 0);
  check(`«${r.slug}»: todos sus materiales existen en el catálogo de ${r.oficio}`,
    r.materiales.every((m) => materialPorN(r.oficio, m.n) !== undefined));
  check(`«${r.slug}»: no repite un material en dos líneas`,
    new Set(r.materiales.map((m) => m.n)).size === r.materiales.length);
  check(`«${r.slug}»: todas las cantidades son enteros ≥ 1`,
    r.materiales.every((m) => Number.isInteger(m.qty) && m.qty >= 1));

  // --- La regla que el catálogo avisa de no romper ------------------------
  check(`«${r.slug}»: NO gasta ninguna herramienta`,
    r.materiales.every((m) => materialPorN(r.oficio, m.n)?.herramienta !== true));
  check(`«${r.slug}»: lo que declara como herramienta lo es`,
    (r.herramientas ?? []).every((n) => materialPorN(r.oficio, n)?.herramienta === true));

  // --- Lo que produce ------------------------------------------------------
  const p = POCIONES.find((x) => x.slug === r.produce);
  check(`«${r.slug}»: produce una poción que existe`, p !== undefined);
  if (!p) continue;
  // Una familia sin variante no diría cuál de las cuatro sale del caldero; una
  // poción simple con variante inventa una que el libro no tiene.
  check(`«${r.slug}»: familia ⇔ declara variante`,
    Array.isArray(p.variantes) === (r.variante !== undefined));
  if (r.variante) {
    check(`«${r.slug}»: la variante «${r.variante}» existe en «${p.name}»`,
      (p.variantes ?? []).some((v) => v.name === r.variante));
  }

  // --- La CD sale de la rareza --------------------------------------------
  const rareza = produceRareza(r);
  check(`«${r.slug}»: se sabe la rareza de lo que produce`, rareza !== undefined && rareza !== "variable");
  if (rareza && rareza !== "variable") {
    check(`«${r.slug}»: CD ${r.cd} es la de ${rareza} (${CD_POR_RAREZA[rareza]})`,
      r.cd === CD_POR_RAREZA[rareza]);
  }
  check(`«${r.slug}»: produceNombre no cae al slug`, produceNombre(r) !== r.produce || p.name === r.produce);
}

/* --------------------- Cobertura: nada queda fuera --------------------- */
// Si una poción del libro no tiene receta, el caldero no puede prepararla y
// nadie se entera: no falla nada, simplemente no está.
for (const p of POCIONES) {
  if (p.variantes) {
    for (const v of p.variantes) {
      check(`«${p.name}» › «${v.name}» tiene receta`,
        RECETAS.some((r) => r.produce === p.slug && r.variante === v.name));
    }
  } else {
    check(`«${p.name}» tiene receta`, RECETAS.some((r) => r.produce === p.slug));
  }
}
check("las 25 pociones del libro están cubiertas",
  new Set(RECETAS.map((r) => r.produce)).size === POCIONES.length);

/* ---------------------------- Las iniciales ---------------------------- */
// Arrancar sabiendo algo raro se saltaría toda la progresión del oficio.
check("hay 3 recetas iniciales", recetasIniciales("alquimia").length === 3);
check("las iniciales son todas comunes (CD 10)",
  recetasIniciales("alquimia").every((r) => r.cd === CD_POR_RAREZA["comun"] && produceRareza(r) === "comun"));

/* ------------------------- El libro del personaje ------------------------- */
check("idReceta y slugDeId son inversas",
  slugDeId(idReceta("trepar")) === "trepar");
check("slugDeId ignora un id de saber que no es receta",
  slugDeId("reg:emon") === null && slugDeId("cont:taldorei:profundo") === null);

// Sin la pericia el libro está vacío aunque el DM haya concedido recetas: saber
// la fórmula no es saber prepararla.
check("sin la pericia Alquimia el libro está vacío",
  recetasSabidas("alquimia", ["Historia"], [idReceta("vuelo")]).length === 0);
check("con la pericia se saben las 3 iniciales",
  recetasSabidas("alquimia", ["Alquimia"], []).length === 3);
check("una receta concedida se suma a las iniciales",
  recetasSabidas("alquimia", ["Alquimia"], [idReceta("vuelo")]).length === 4);
check("conceder una inicial no la duplica",
  recetasSabidas("alquimia", ["Alquimia"], [idReceta("trepar")]).length === 3);
check("un id de saber no cuela como receta",
  recetasSabidas("alquimia", ["Alquimia"], ["reg:emon"]).length === 3);

/* ----------------------------- El caldero ----------------------------- */
const trepar = recetaPorSlug("trepar")!;   // 28 ×1 y 38 ×1
const n28 = materialPorN("alquimia", 28)!.name;
const n38 = materialPorN("alquimia", 38)!.name;

check("requisitos lista todas las líneas de la receta",
  requisitos(trepar, []).length === trepar.materiales.length);
check("con la bolsa vacía no se puede preparar", puedePreparar(trepar, []) === false);
check("faltando una sola unidad tampoco",
  puedePreparar(trepar, [item(n28, 1)]) === false);
check("con todo, se puede preparar",
  puedePreparar(trepar, [item(n28, 1), item(n38, 1)]) === true);
check("sobrar material no estorba",
  puedePreparar(trepar, [item(n28, 5), item(n38, 3)]) === true);

const tras = consumir([item(n28, 3), item(n38, 1), item("Daga", 2)], trepar);
check("consumir descuenta lo justo",
  tras.find((i) => i.name === n28)?.qty === 2);
check("el montón que se agota desaparece de la bolsa",
  tras.find((i) => i.name === n38) === undefined);
check("consumir no toca lo que no es de la receta",
  tras.find((i) => i.name === "Daga")?.qty === 2);

// Al fallar se gasta igual: lo que cambia es solo si además entra la poción.
check("consumir es el mismo camino en éxito y en fallo",
  JSON.stringify(consumir([item(n28, 1), item(n38, 1)], trepar)) === JSON.stringify([]));

check("el producto se apila si ya llevabas uno",
  anadirProducto([item("Poción de curación", 2)], "Poción de curación")
    .find((i) => i.name === "Poción de curación")?.qty === 3);
check("el producto entra como fila nueva si no llevabas",
  anadirProducto([], "Poción de Vuelo").length === 1);
check("el nombre del producto es el de la variante en las familias",
  produceNombre(recetaPorSlug("curacion-suprema")!) === "Poción de curación (suprema)");

// Una herramienta se exige disponible pero NO se gasta. Alquimia no usa
// ninguna, así que se prueba con una receta armada aquí: sin este caso, la
// regla no estaría vigilada por nada hasta que llegue cristalografía.
const cincel = materialesDe("cristalografia").find((m) => m.herramienta)!;
const piedra = materialesDe("cristalografia").find((m) => !m.herramienta)!;
const conHerramienta = {
  slug: "prueba", oficio: "cristalografia" as Oficio, produce: "x", cd: 10,
  materiales: [{ n: piedra.n, qty: 1 }], herramientas: [cincel.n],
};
check("sin la herramienta no se puede preparar",
  puedePreparar(conHerramienta, [item(piedra.name, 1)]) === false);
check("con la herramienta sí",
  puedePreparar(conHerramienta, [item(piedra.name, 1), item(cincel.name, 1)]) === true);
const trasHerr = consumir([item(piedra.name, 1), item(cincel.name, 1)], conHerramienta);
check("la herramienta NO se gasta",
  trasHerr.find((i) => i.name === cincel.name)?.qty === 1);
check("el material sí se gasta",
  trasHerr.find((i) => i.name === piedra.name) === undefined);

console.log(failures === 0 ? `\nTodo OK` : `\n${failures} FALLOS`);
process.exit(failures === 0 ? 0 : 1);
