// Capa pura del inventario: sin React, sin Supabase, sin estado.
// Verificada por scripts/check-inventario.ts.

import { CATALOG } from "@/data/equipment";
import { ARMAS } from "@/data/weapons";
import { ARMOR_LOOKUP, SHIELD_NAME } from "@/lib/derive";
import type { Item } from "@/lib/character";

export type CategoriaId = "Armas" | "Armaduras" | "Aventura" | "Consumibles" | "Herramientas" | "Otro";

export type Categoria = {
  id: CategoriaId;
  icon: string;   // Font Awesome, con el prefijo "fa-"
  color: string;  // var() del tema: si no está definida en globals.css NO se ve, y sin error
};

/**
 * Icono y color de cada categoría. Es un `Record` sobre `CategoriaId` **a
 * propósito**: así, si algún día se añade una categoría al tipo y se olvida
 * aquí, **no compila**. Con un array suelto el olvido habría sido mudo, y
 * `CATEGORIAS.find(...)` habría devuelto `undefined` en tiempo de ejecución.
 */
const META: Record<CategoriaId, Omit<Categoria, "id">> = {
  Armas:        { icon: "fa-khanda",              color: "var(--color-ember)" },
  Armaduras:    { icon: "fa-shield-halved",       color: "var(--color-arcane)" },
  Aventura:     { icon: "fa-hiking",              color: "var(--color-bronze)" },
  Consumibles:  { icon: "fa-flask",               color: "var(--color-verdant)" },
  Herramientas: { icon: "fa-screwdriver-wrench",  color: "var(--color-violet)" },
  Otro:         { icon: "fa-cube",                color: "var(--color-dim)" },
};

/** El orden manda: es el de los grupos en la bolsa. «Otro» siempre al final. */
const ORDEN: CategoriaId[] = ["Armas", "Armaduras", "Aventura", "Consumibles", "Herramientas", "Otro"];

export const CATEGORIAS: Categoria[] = ORDEN.map((id) => ({ id, ...META[id] }));

/** Icono y color de una categoría. Nunca es `undefined`: el `Record` lo garantiza. */
export function metaDe(cat: CategoriaId): Categoria {
  return { id: cat, ...META[cat] };
}

/**
 * Normaliza para comparar: sin mayúsculas, sin tildes, sin espacios de sobra.
 *
 * Se exporta **para que las comprobaciones normalicen igual que el índice**. Un
 * check que compara los nombres de otra forma tiene un punto ciego justo donde
 * el índice es más permisivo (las tildes), y entonces no vigila lo que dice
 * vigilar.
 */
export function norm(s: string): string {
  return s.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Índice nombre normalizado → categoría, armado una vez a partir de las listas
// que ya existen. Ninguna se duplica aquí: si el catálogo crece, esto crece solo.
const INDICE: Map<string, CategoriaId> = (() => {
  const m = new Map<string, CategoriaId>();
  for (const n of Object.keys(ARMAS)) m.set(norm(n), "Armas");
  for (const n of Object.keys(ARMOR_LOOKUP)) m.set(norm(n), "Armaduras");
  m.set(norm(SHIELD_NAME), "Armaduras");
  for (const n of CATALOG.Armas) m.set(norm(n), "Armas");
  for (const n of CATALOG.Armaduras) m.set(norm(n), "Armaduras");
  for (const n of CATALOG.Aventura) m.set(norm(n), "Aventura");
  for (const n of CATALOG.Consumibles) m.set(norm(n), "Consumibles");
  for (const n of CATALOG.Herramientas) m.set(norm(n), "Herramientas");
  return m;
})();

/**
 * Categoría de un objeto, deducida del nombre por coincidencia EXACTA (salvo
 * mayúsculas, tildes y espacios). No se adivina por trozos del nombre a
 * propósito: "Poción de curación mayor" sale como Otro antes que arriesgarse a
 * pintar de verde una "Poción de veneno". Quedarse corto es preferible.
 */
export function categoriaDe(nombre: string): CategoriaId {
  return INDICE.get(norm(nombre)) ?? "Otro";
}

/** Huecos de la bolsa: 20 + 2 × mod. Fuerza, con un suelo de 10. */
export function huecosDe(modFuerza: number): number {
  return Math.max(10, 20 + 2 * Math.round(modFuerza));
}

/**
 * A qué hueco va un objeto al pulsar «Equipar». `null` = la app no lo sabe y
 * hay que preguntárselo al jugador.
 *
 * Devuelve `null` para casi toda la armadura por una razón del juego, no por
 * pereza: el muñeco tiene huecos de cabeza, antebrazos, manos y pies, y en
 * D&D 2024 esas piezas NO dan CA, así que el catálogo no las trae.
 */
export function huecoDestino(nombre: string, equipo: Record<string, Item>): string | null {
  if (norm(nombre) === norm(SHIELD_NAME)) return equipo.arma_secundaria ? null : "arma_secundaria";
  const cat = categoriaDe(nombre);
  if (cat === "Armas") {
    if (!equipo.arma_principal) return "arma_principal";
    if (!equipo.arma_secundaria) return "arma_secundaria";
    return null;
  }
  if (cat === "Armaduras") return equipo.torso ? null : "torso";
  return null;
}

/**
 * Quita UNA unidad del objeto con ese `id`. Si era la última, la entrada
 * desaparece de la bolsa; si no, baja `qty` en uno.
 *
 * Un `id` que no está en la bolsa devuelve la lista tal cual (sin lanzar): es
 * lo que pasa cuando dos pestañas sueltan el mismo objeto a la vez.
 */
export function quitarUno(items: Item[], id: string): Item[] {
  const out: Item[] = [];
  for (const it of items) {
    if (it.id === id) {
      if (it.qty > 1) out.push({ ...it, qty: it.qty - 1 });
    } else out.push(it);
  }
  return out;
}

/**
 * Devuelve UNA unidad a la bolsa: al retirar algo del muñeco, o al desplazar a
 * quien ocupaba el hueco donde acabas de equipar.
 *
 * Busca por **NOMBRE, no por id**, y eso es a propósito y carga con peso: es
 * justo lo que hace que dos dagas sean una sola entrada `{ name: "Daga", qty: 2 }`
 * en vez de dos filas. Media app cuenta con ello — `puedeDosArmas`
 * (lib/ataque.ts) suma cantidades precisamente porque la bolsa fusiona por
 * nombre. Si esto pasara a comparar por id, cada unidad equipada y retirada
 * volvería como fila suelta y esa regla dejaría de dispararse.
 *
 * La entrada nueva estrena `id`: el del objeto que vuelve puede seguir vivo en
 * otro hueco del equipo.
 */
export function devolver(items: Item[], item: Item): Item[] {
  const idx = items.findIndex((i) => i.name === item.name);
  if (idx >= 0) {
    const next = [...items];
    next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
    return next;
  }
  return [...items, { id: crypto.randomUUID(), name: item.name, qty: 1, notes: item.notes }];
}

export type TipoHueco = "arma" | "armadura" | "accesorio";

/**
 * Qué CLASES de hueco admite un objeto al equiparlo a mano. La enumeración de
 * huecos concretos la hace quien pinta; la regla vive aquí, donde el gate la ve.
 *
 * La línea que se traza: **un hueco que alimenta una regla solo acepta lo que la
 * app puede verificar.**
 *
 * - Los huecos de **arma** alimentan `ataqueDe`, que produce impacto y daño. Si
 *   ahí cabe cualquier cosa, la app acaba enseñando una tirada de ataque para un
 *   anillo — afirmando algo falso, que es peor que quedarse corta. Así que solo
 *   admiten armas del catálogo (`ARMAS`), que es una lista cerrada y comprobable.
 * - Los huecos de **armadura** se autofiltran: la CA sale de `ARMOR_LOOKUP`, así
 *   que algo desconocido en el torso no cambia ningún número, solo describe.
 * - Los **accesorios** no alimentan ninguna regla, así que admiten cualquier cosa.
 *   Es donde va un anillo, un colgante o el trofeo raro que te dio el DM.
 *
 * Consecuencia asumida: una «Espada de Kael» inventada **no** entra en el hueco
 * de arma. Es correcto — la app tampoco sabría calcular su ataque. Para que un
 * arma funcione, tiene que llamarse como una del catálogo.
 */
export function tiposDeHuecoPara(nombre: string): TipoHueco[] {
  const cat = categoriaDe(nombre);
  if (cat === "Armas") return ["arma"];
  if (cat === "Armaduras") return norm(nombre) === norm(SHIELD_NAME) ? ["arma"] : ["armadura"];
  return ["accesorio", "armadura"];
}

export type Grupo = { cat: CategoriaId; items: Item[] };

/** Agrupa la bolsa por categoría, en el orden de CATEGORIAS y sin grupos vacíos. */
export function agrupaPorCategoria(items: Item[]): Grupo[] {
  return CATEGORIAS
    .map((c) => ({ cat: c.id, items: items.filter((i) => categoriaDe(i.name) === c.id) }))
    .filter((g) => g.items.length > 0);
}
