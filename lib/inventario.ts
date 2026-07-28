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

// El orden manda: es el de los grupos en la bolsa. "Otro" siempre al final.
export const CATEGORIAS: Categoria[] = [
  { id: "Armas",        icon: "fa-khanda",        color: "var(--color-ember)" },
  { id: "Armaduras",    icon: "fa-shield-halved", color: "var(--color-arcane)" },
  { id: "Aventura",     icon: "fa-hiking",        color: "var(--color-bronze)" },
  { id: "Consumibles",  icon: "fa-flask",         color: "var(--color-verdant)" },
  { id: "Herramientas", icon: "fa-screwdriver-wrench", color: "var(--color-violet)" },
  { id: "Otro",         icon: "fa-cube",          color: "var(--color-dim)" },
];

// Normaliza para comparar: sin mayúsculas, sin tildes, sin espacios de sobra.
function norm(s: string): string {
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
  const n = norm(nombre);
  if (n === norm(SHIELD_NAME)) return equipo.arma_secundaria ? null : "arma_secundaria";
  if (Object.keys(ARMAS).some((a) => norm(a) === n)) {
    if (!equipo.arma_principal) return "arma_principal";
    if (!equipo.arma_secundaria) return "arma_secundaria";
    return null;
  }
  if (Object.keys(ARMOR_LOOKUP).some((a) => norm(a) === n)) return equipo.torso ? null : "torso";
  return null;
}

export type Grupo = { cat: CategoriaId; items: Item[] };

/** Agrupa la bolsa por categoría, en el orden de CATEGORIAS y sin grupos vacíos. */
export function agrupaPorCategoria(items: Item[]): Grupo[] {
  return CATEGORIAS
    .map((c) => ({ cat: c.id, items: items.filter((i) => categoriaDe(i.name) === c.id) }))
    .filter((g) => g.items.length > 0);
}
