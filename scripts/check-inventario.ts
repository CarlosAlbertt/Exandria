// Comprobación manual del inventario. Uso: npx tsx scripts/check-inventario.ts
import { categoriaDe, CATEGORIAS, huecosDe, huecoDestino, agrupaPorCategoria } from "../lib/inventario";
import { CATALOG } from "../data/equipment";
import { ARMAS } from "../data/weapons";
import { ARMOR_LOOKUP } from "../lib/derive";
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

console.log(failures === 0 ? "\nTodo en verde" : `\n${failures} fallo(s)`);
process.exit(failures === 0 ? 0 : 1);
