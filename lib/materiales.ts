// Índice único de los seis catálogos de oficio. Capa pura: sin React, sin
// Supabase, sin estado. Verificada por `scripts/check-recetas.ts`.
//
// Los seis catálogos son seis arrays con seis tipos distintos y numeración
// propia (el 46 de alquimia y el 46 de cocina son cosas diferentes). Aquí se
// unen SIN tocarlos, etiquetando cada entrada con su oficio.
//
// **Por qué el nombre puede usarse como clave**: `scripts/check-materiales.ts`
// (gate 30) ya declara que no hay ningún nombre exacto repetido entre los seis
// catálogos, y la lista de solapes está vacía. Ese invariante es lo que permite
// que un objeto de la bolsa llamado «Raíz de Oloore» **sea** el material 1 de
// alquimia sin columna nueva ni migración: el mismo truco que `esOficio()` usa
// sobre `characters.skills`.
//
// ⚠️ Eso ata esta capa al gate 30. `check-recetas.ts` vuelve a comprobar la
// unicidad desde este lado para que el acoplamiento no quede tácito: si alguien
// admite un nombre repetido entre catálogos, falla aquí y no en silencio.

import { INGREDIENTES } from "@/data/alquimia";
import { INGREDIENTES_COCINA } from "@/data/cocina";
import { MATERIALES_FORJA } from "@/data/forja";
import { INGREDIENTES_DESTILACION } from "@/data/destilacion";
import { MATERIALES_CRISTAL } from "@/data/cristalografia";
import { MATERIALES_TATUAJE } from "@/data/tatuaje";
import { norm } from "@/lib/slug";

export type Oficio =
  | "alquimia" | "cocina" | "forja"
  | "destilacion" | "cristalografia" | "tatuaje";

/** El nombre de la pericia de oficio, tal y como está en `data/rules.ts`. */
export const OFICIO_PERICIA: Record<Oficio, string> = {
  alquimia: "Alquimia",
  cocina: "Cocina",
  forja: "Forja",
  destilacion: "Destilación Exandriana",
  cristalografia: "Cristalografía Arcana",
  tatuaje: "Tatuaje Rúnico",
};

/** Cómo se llama cada taller en la interfaz. */
export const OFICIO_LABEL: Record<Oficio, string> = {
  alquimia: "Alquimia",
  cocina: "Cocina",
  forja: "Forja",
  destilacion: "Destilación",
  cristalografia: "Cristalografía",
  tatuaje: "Tatuaje",
};

/** El orden en que salen las pestañas del taller y los filtros de `/oficios`. */
export const OFICIOS_ORDEN: Oficio[] = [
  "alquimia", "cocina", "forja", "destilacion", "cristalografia", "tatuaje",
];

export type Material = {
  oficio: Oficio;
  /** Número de catálogo, **propio de cada oficio**: no es único entre los seis. */
  n: number;
  name: string;
  blurb: string;
  /** Solo alquimia, cocina y forja reparten por categoría. */
  category?: string;
  /**
   * Cinceles, agujas, pinzas y paños: una receta los exige **disponibles**,
   * pero NO los consume. Confundirlo gastaría el cincel en cada tirada.
   */
  herramienta?: true;
  /** Destilación: la mitad del catálogo trae contrapartida explícita. */
  riesgo?: true;
  /** Forja: regla de verdad, no sabor. Hoy sin conectar a `lib/derive.ts`. */
  mecanica?: string;
};

/** Los 369, en el orden de `OFICIOS_ORDEN` y dentro de cada uno por catálogo. */
export const MATERIALES: Material[] = [
  ...INGREDIENTES.map((i): Material => ({ oficio: "alquimia", n: i.n, name: i.name, blurb: i.blurb, category: i.category })),
  ...INGREDIENTES_COCINA.map((i): Material => ({ oficio: "cocina", n: i.n, name: i.name, blurb: i.blurb, category: i.category })),
  ...MATERIALES_FORJA.map((m): Material => ({ oficio: "forja", n: m.n, name: m.name, blurb: m.blurb, category: m.category, mecanica: m.mecanica })),
  ...INGREDIENTES_DESTILACION.map((i): Material => ({ oficio: "destilacion", n: i.n, name: i.name, blurb: i.blurb, riesgo: i.riesgo })),
  ...MATERIALES_CRISTAL.map((m): Material => ({ oficio: "cristalografia", n: m.n, name: m.name, blurb: m.blurb, herramienta: m.herramienta })),
  ...MATERIALES_TATUAJE.map((m): Material => ({ oficio: "tatuaje", n: m.n, name: m.name, blurb: m.blurb, herramienta: m.herramienta })),
];

// Índice por nombre normalizado. Usa el `norm` de `lib/inventario` a propósito
// —el mismo que clasifica la bolsa— para que un material se reconozca con las
// mismas reglas de tildes y mayúsculas con las que se categoriza.
const POR_NOMBRE: Map<string, Material> = (() => {
  const m = new Map<string, Material>();
  for (const mat of MATERIALES) m.set(norm(mat.name), mat);
  return m;
})();

/** El material que se llama así, o `undefined` si no es un material. */
export function materialPorNombre(name: string): Material | undefined {
  return POR_NOMBRE.get(norm(name));
}

/**
 * ¿Este objeto de la bolsa es un material de oficio? Es lo que decide que un
 * montón ocupe **un solo hueco** (ver `huecosUsados` en `lib/inventario.ts`).
 */
export function esMaterial(name: string): boolean {
  return POR_NOMBRE.has(norm(name));
}

/** Los materiales de un oficio, en orden de catálogo. */
export function materialesDe(oficio: Oficio): Material[] {
  return MATERIALES.filter((m) => m.oficio === oficio);
}

/** El material número `n` del catálogo de ese oficio. */
export function materialPorN(oficio: Oficio, n: number): Material | undefined {
  return MATERIALES.find((m) => m.oficio === oficio && m.n === n);
}
