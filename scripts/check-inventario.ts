// Comprobación manual del inventario. Uso: npx tsx scripts/check-inventario.ts
import { categoriaDe, CATEGORIAS, huecosDe, huecoDestino, agrupaPorCategoria, norm, quitarUno, devolver, tiposDeHuecoPara } from "../lib/inventario";
import { CATALOG } from "../data/equipment";
import { ARMAS } from "../data/weapons";
import { ARMOR_LOOKUP, SHIELD_NAME } from "../lib/derive";
import type { Item } from "../lib/character";

let failures = 0;
function check(label: string, cond: boolean) {
  if (cond) console.log(`OK   ${label}`);
  else { console.log(`FAIL ${label}`); failures++; }
}
const item = (name: string, qty = 1): Item => ({ id: name, name, qty });

// --- categoriaDe ---
check("un arma del catálogo es Armas", categoriaDe("Espada larga") === "Armas");
check("una armadura es Armaduras", categoriaDe("Coraza") === "Armaduras");
check("el escudo es Armaduras", categoriaDe("Escudo") === "Armaduras");
check("una poción es Consumibles", categoriaDe("Poción de curación") === "Consumibles");
check("una soga es Aventura", categoriaDe("Soga de cáñamo (15 m)") === "Aventura");
check("unas ganzúas son Herramientas", categoriaDe("Herramientas de ladrón") === "Herramientas");
check("ignora mayúsculas", categoriaDe("ESPADA LARGA") === "Armas");
check("ignora tildes", categoriaDe("Pocion de curacion") === "Consumibles");
check("recorta espacios", categoriaDe("  Daga  ") === "Armas");
check("un nombre inventado es Otro", categoriaDe("Carta del gremio") === "Otro");
check("cadena vacía es Otro", categoriaDe("") === "Otro");

// La decisión de diseño más importante: SOLO coincidencia exacta. Adivinar por
// trozos pintaría de verde una "Poción de veneno".
check("no adivina por subcadena", categoriaDe("Poción de curación mayor") === "Otro");
check("no adivina por prefijo", categoriaDe("Espada larga rúnica") === "Otro");

// Ningún nombre real puede caer en Otro: si el catálogo crece y esto se rompe,
// es que falta engancharlo.
check("ningún arma cae en Otro", Object.keys(ARMAS).every((n) => categoriaDe(n) === "Armas"));
check("ninguna armadura cae en Otro", Object.keys(ARMOR_LOOKUP).every((n) => categoriaDe(n) === "Armaduras"));
check("ningún objeto del CATALOG cae en Otro",
  Object.values(CATALOG).flat().every((n) => categoriaDe(n) !== "Otro"));

// --- CATEGORIAS (icono y color de cada una) ---
check("hay 6 categorías", CATEGORIAS.length === 6);
// ORDEN es un array a mano: el Record META garantiza que ninguna categoria se
// quede sin icono, pero no que ORDEN las liste todas. Esto ultimo si.
check("ORDEN no se deja ninguna categoria fuera",
  new Set(CATEGORIAS.map((c) => c.id)).size === CATEGORIAS.length);
check("«Otro» va la ultima", CATEGORIAS[CATEGORIAS.length - 1].id === "Otro");
check("toda categoría tiene icono y color", CATEGORIAS.every((c) => c.icon.length > 0 && c.color.length > 0));
check("los colores son variables del tema", CATEGORIAS.every((c) => c.color.startsWith("var(--color-")));
check("categoriaDe siempre devuelve una categoría conocida",
  ["Espada larga", "Coraza", "Antorcha", "Antídoto", "Kit de sanador", "xyz"]
    .every((n) => CATEGORIAS.some((c) => c.id === categoriaDe(n))));

// --- huecosDe ---
check("mod 0 da 20 huecos", huecosDe(0) === 20);
check("mod +3 da 26", huecosDe(3) === 26);
check("mod -1 no baja del suelo de 10", huecosDe(-1) === 18);
check("un mod absurdamente negativo se queda en 10", huecosDe(-99) === 10);

// --- huecoDestino ---
check("un arma va a la principal", huecoDestino("Espada larga", {}) === "arma_principal");
check("con la principal ocupada, va a la secundaria",
  huecoDestino("Daga", { arma_principal: item("Espada larga") }) === "arma_secundaria");
check("con las dos ocupadas, no hay destino",
  huecoDestino("Daga", { arma_principal: item("Espada larga"), arma_secundaria: item("Escudo") }) === null);
check("el escudo va a la secundaria", huecoDestino("Escudo", {}) === "arma_secundaria");
check("una armadura de cuerpo va al torso", huecoDestino("Coraza", {}) === "torso");
check("un objeto desconocido no tiene destino", huecoDestino("Carta del gremio", {}) === null);

// --- las dos listas de armadura no pueden separarse ---
// CATALOG.Armaduras y ARMOR_LOOKUP se mantienen a mano por separado. Una
// armadura que esté solo en el catálogo se clasifica bien pero no da CA: el
// fallo es mudo, así que lo caza el gate en vez de un comentario.
const armadurasConocidas = new Set([...Object.keys(ARMOR_LOOKUP), SHIELD_NAME].map(norm));
const soloEnCatalogo = CATALOG.Armaduras.filter((n) => !armadurasConocidas.has(norm(n)));
check(
  `toda armadura del catálogo está en ARMOR_LOOKUP (sobran: ${soloEnCatalogo.join(", ") || "ninguna"})`,
  soloEnCatalogo.length === 0
);

// --- ninguna fuente puede reclamar el mismo nombre para dos categorías ---
// El índice se construye con Map.set desde seis listas: si dos reclaman el
// mismo nombre, la última gana en silencio. Esto lo hace ruidoso.
const reclamos = new Map<string, Set<string>>();
const reclama = (nombres: string[], cat: string) => {
  for (const n of nombres) {
    const k = norm(n);
    if (!reclamos.has(k)) reclamos.set(k, new Set());
    reclamos.get(k)!.add(cat);
  }
};
reclama(Object.keys(ARMAS), "Armas");
reclama([...Object.keys(ARMOR_LOOKUP), SHIELD_NAME], "Armaduras");
reclama(CATALOG.Armas, "Armas");
reclama(CATALOG.Armaduras, "Armaduras");
reclama(CATALOG.Aventura, "Aventura");
reclama(CATALOG.Consumibles, "Consumibles");
reclama(CATALOG.Herramientas, "Herramientas");
const enConflicto = [...reclamos.entries()].filter(([, cats]) => cats.size > 1).map(([n]) => n);
check(
  `ningún nombre se reclama para dos categorías (conflictos: ${enConflicto.join(", ") || "ninguno"})`,
  enConflicto.length === 0
);

// --- tiposDeHuecoPara: el bug del anillo en el hueco de arma ---
// Un hueco que alimenta una regla solo acepta lo que la app puede verificar.
check("un arma del catalogo solo va a huecos de arma", JSON.stringify(tiposDeHuecoPara("Espada larga")) === JSON.stringify(["arma"]));
check("el escudo va al hueco de arma (mano secundaria)", JSON.stringify(tiposDeHuecoPara("Escudo")) === JSON.stringify(["arma"]));
check("una armadura de cuerpo solo va a huecos de armadura", JSON.stringify(tiposDeHuecoPara("Coraza")) === JSON.stringify(["armadura"]));
check("un anillo NO puede ir a un hueco de arma", !tiposDeHuecoPara("Anillo de proteccion").includes("arma"));
check("un anillo puede ir a un accesorio", tiposDeHuecoPara("Anillo de proteccion").includes("accesorio"));
check("un objeto raro no puede ir a un hueco de arma", !tiposDeHuecoPara("Carta del gremio").includes("arma"));
check("una espada inventada tampoco entra en el hueco de arma", !tiposDeHuecoPara("Espada de Kael").includes("arma"));
check("ningun objeto se queda sin ningun hueco posible",
  ["Espada larga", "Coraza", "Escudo", "Anillo", "Carta del gremio", ""].every((n) => tiposDeHuecoPara(n).length > 0));

// --- agrupaPorCategoria ---
const bolsa = [item("Espada larga"), item("Daga", 2), item("Poción de curación", 3), item("Carta del gremio")];
const grupos = agrupaPorCategoria(bolsa);
check("agrupa sin perder objetos", grupos.reduce((s, g) => s + g.items.length, 0) === bolsa.length);
check("no crea grupos vacíos", grupos.every((g) => g.items.length > 0));
check("respeta el orden de CATEGORIAS",
  grupos.map((g) => CATEGORIAS.findIndex((c) => c.id === g.cat)).every((n, i, a) => i === 0 || a[i - 1] < n));
check("agrupa las dos armas juntas",
  (grupos.find((g) => g.cat === "Armas")?.items.length ?? 0) === 2);
check("una bolsa vacía no da grupos", agrupaPorCategoria([]).length === 0);

// --- quitarUno / devolver ---
// Los dos helpers que mueven unidades entre la bolsa y el muñeco. Vivían dentro
// de CharacterSheet.tsx sin vigilancia; ahora son de la capa pura.
const unaDaga = [item("Daga")];
check("quitar el último borra la entrada", quitarUno(unaDaga, "Daga").length === 0);

const tresPociones = [item("Poción de curación", 3)];
const dosPociones = quitarUno(tresPociones, "Poción de curación");
check("quitar uno de tres deja dos", dosPociones.length === 1 && dosPociones[0].qty === 2);

const intacta = [item("Daga", 2), item("Coraza")];
const trasFallo = quitarUno(intacta, "no-existe");
check("quitar un id que no existe no cambia nada",
  trasFallo.length === 2 && trasFallo[0].qty === 2 && trasFallo[1].name === "Coraza");

// Coincide por NOMBRE, no por id: es lo que fusiona dos dagas en una entrada
// con qty 2, y de eso depende puedeDosArmas (lib/ataque.ts).
const conDaga = [{ id: "abc", name: "Daga", qty: 1 } as Item];
const dosDagas = devolver(conDaga, { id: "otro-id-distinto", name: "Daga", qty: 1 });
check("devolver algo cuyo nombre ya está sube la cantidad en vez de crear otra fila",
  dosDagas.length === 1 && dosDagas[0].qty === 2);

const conCoraza = devolver(conDaga, item("Coraza"));
check("devolver algo nuevo añade una entrada con qty 1",
  conCoraza.length === 2 && conCoraza[1].name === "Coraza" && conCoraza[1].qty === 1);

const conNotas = devolver([], { id: "x", name: "Anillo", qty: 1, notes: "Regalo de Vex" });
check("devolver conserva las notas del objeto", conNotas[0].notes === "Regalo de Vex");

console.log(failures === 0 ? "\nTodo en verde" : `\n${failures} fallo(s)`);
process.exit(failures === 0 ? 0 : 1);
