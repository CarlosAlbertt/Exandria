// Recetas de oficio: lo que une los catálogos de materiales con lo que sale de
// ellos. Esta tanda cubre **Alquimia**; los otros cinco oficios llegarán con el
// mismo tipo.
//
// Ambientación propia de la campaña: qué ingrediente lleva cada poción lo dicta
// esta app, no los libros. Lo que **sí** es un hecho del reglamento es la
// rareza de la poción (`data/pociones.ts`), y de ella sale la CD.
//
// **Una receta por cosa preparable**, no por entrada del catálogo: las dos
// familias (Curación y Fuerza de Gigante) se despliegan en una receta por
// variante. 23 pociones simples + 4 potencias + 5 filas de gigante = 32, y así
// las 25 entradas del libro son preparables sin excepción.
//
// Verificado por `scripts/check-recetas.ts` (gate 31).

import { POCIONES, type Rareza } from "@/data/pociones";
import type { Oficio } from "@/lib/materiales";

/**
 * La CD sale de la **rareza de lo que produce**, no del capricho de cada
 * receta. Es lo que mantiene la escala coherente: si mañana se añade una poción
 * rara, su receta ya sabe contra qué se tira, y el gate lo comprueba en vez de
 * confiar en que quien la escribió mirase la tabla.
 */
export const CD_POR_RAREZA: Record<Exclude<Rareza, "variable">, number> = {
  "comun": 10,
  "infrecuente": 13,
  "rara": 16,
  "muy-rara": 19,
  "legendaria": 22,
};

export type Receta = {
  /** Id estable, kebab-case. Es lo que se guarda al descubrirla. */
  slug: string;
  oficio: Oficio;
  /** Slug de la poción de `data/pociones.ts` que sale de aquí. */
  produce: string;
  /**
   * Nombre EXACTO de la variante, solo en las familias. Una receta de familia
   * tiene que declararlo y una de poción simple no puede: sin eso, «preparo una
   * poción de curación» no diría cuál de las cuatro.
   */
  variante?: string;
  cd: number;
  /**
   * Qué lleva, por **número de catálogo del oficio** (`n` en `data/alquimia.ts`).
   * Se referencia por número y no por nombre porque el número es lo estable:
   * es como el DM y la mesa se refieren a ellos entre sesiones («el 46, el
   * residuum»).
   */
  materiales: { n: number; qty: number }[];
  /**
   * Lo que hace falta tener **a mano pero no se gasta**: cinceles, agujas,
   * pinzas y paños. Por número de catálogo, como los materiales.
   *
   * Alquimia no usa ninguna todavía, pero el campo entra ya —y el gate lo
   * vigila— porque cristalografía y tatuaje sí, y es justo lo que no hay que
   * confundir: meter un cincel en `materiales` lo gastaría en cada tirada.
   */
  herramientas?: number[];
  /**
   * Se sabe al elegir la pericia, sin que nadie la enseñe. Son las comunes: el
   * libro arranca con algo dentro en vez de con un caldero inútil.
   *
   * **No se persisten** en `lore_unlocked`: se derivan de tener la pericia. Un
   * personaje que deja de tener Alquimia deja de saberlas, que es lo correcto.
   */
  inicial?: true;
};

export const RECETAS: Receta[] = [
  // --- Las comunes: con las que arranca el libro --------------------------
  { slug: "entendimiento", oficio: "alquimia", produce: "entendimiento", cd: 10, inicial: true,
    materiales: [{ n: 1, qty: 1 }, { n: 69, qty: 1 }] },
  { slug: "trepar", oficio: "alquimia", produce: "trepar", cd: 10, inicial: true,
    materiales: [{ n: 28, qty: 1 }, { n: 38, qty: 1 }] },
  { slug: "curacion", oficio: "alquimia", produce: "curacion", variante: "Poción de curación", cd: 10, inicial: true,
    materiales: [{ n: 69, qty: 2 }, { n: 16, qty: 1 }] },

  // --- Infrecuentes --------------------------------------------------------
  { slug: "aliento-de-fuego", oficio: "alquimia", produce: "aliento-de-fuego", cd: 13,
    materiales: [{ n: 15, qty: 2 }, { n: 29, qty: 1 }, { n: 50, qty: 1 }] },
  { slug: "amistad-animal", oficio: "alquimia", produce: "amistad-animal", cd: 13,
    materiales: [{ n: 39, qty: 1 }, { n: 16, qty: 1 }, { n: 69, qty: 2 }] },
  { slug: "crecimiento", oficio: "alquimia", produce: "crecimiento", cd: 13,
    materiales: [{ n: 26, qty: 1 }, { n: 8, qty: 1 }, { n: 63, qty: 2 }] },
  { slug: "pugilismo", oficio: "alquimia", produce: "pugilismo", cd: 13,
    materiales: [{ n: 40, qty: 1 }, { n: 26, qty: 1 }, { n: 5, qty: 1 }] },
  { slug: "resistencia", oficio: "alquimia", produce: "resistencia", cd: 13,
    materiales: [{ n: 5, qty: 2 }, { n: 37, qty: 1 }, { n: 19, qty: 1 }] },
  { slug: "respirar-bajo-el-agua", oficio: "alquimia", produce: "respirar-bajo-el-agua", cd: 13,
    materiales: [{ n: 14, qty: 2 }, { n: 54, qty: 1 }, { n: 41, qty: 1 }] },
  { slug: "veneno", oficio: "alquimia", produce: "veneno", cd: 13,
    materiales: [{ n: 22, qty: 1 }, { n: 11, qty: 2 }, { n: 43, qty: 1 }] },
  { slug: "curacion-mayor", oficio: "alquimia", produce: "curacion", variante: "Poción de curación (mayor)", cd: 13,
    materiales: [{ n: 69, qty: 2 }, { n: 16, qty: 2 }, { n: 34, qty: 1 }] },
  { slug: "fuerza-de-gigante-colinas", oficio: "alquimia", produce: "fuerza-de-gigante", variante: "Fuerza de gigante (colinas)", cd: 13,
    materiales: [{ n: 26, qty: 2 }, { n: 5, qty: 1 }] },

  // --- Raras ---------------------------------------------------------------
  { slug: "clarividencia", oficio: "alquimia", produce: "clarividencia", cd: 16,
    materiales: [{ n: 23, qty: 1 }, { n: 1, qty: 2 }, { n: 70, qty: 1 }] },
  { slug: "encoger", oficio: "alquimia", produce: "encoger", cd: 16,
    materiales: [{ n: 25, qty: 2 }, { n: 17, qty: 1 }, { n: 58, qty: 1 }] },
  { slug: "forma-gaseosa", oficio: "alquimia", produce: "forma-gaseosa", cd: 16,
    materiales: [{ n: 68, qty: 2 }, { n: 62, qty: 1 }, { n: 58, qty: 1 }] },
  { slug: "heroismo", oficio: "alquimia", produce: "heroismo", cd: 16,
    materiales: [{ n: 34, qty: 1 }, { n: 15, qty: 1 }, { n: 67, qty: 2 }] },
  { slug: "invisibilidad", oficio: "alquimia", produce: "invisibilidad", cd: 16,
    materiales: [{ n: 65, qty: 2 }, { n: 13, qty: 1 }, { n: 38, qty: 1 }] },
  { slug: "invulnerabilidad", oficio: "alquimia", produce: "invulnerabilidad", cd: 16,
    materiales: [{ n: 24, qty: 1 }, { n: 56, qty: 2 }, { n: 5, qty: 2 }] },
  { slug: "leer-mentes", oficio: "alquimia", produce: "leer-mentes", cd: 16,
    materiales: [{ n: 35, qty: 1 }, { n: 1, qty: 1 }, { n: 61, qty: 1 }] },
  { slug: "potencia-maxima", oficio: "alquimia", produce: "potencia-maxima", cd: 16,
    materiales: [{ n: 46, qty: 2 }, { n: 2, qty: 1 }, { n: 47, qty: 1 }] },
  { slug: "curacion-superior", oficio: "alquimia", produce: "curacion", variante: "Poción de curación (superior)", cd: 16,
    materiales: [{ n: 34, qty: 2 }, { n: 67, qty: 1 }, { n: 16, qty: 2 }] },
  { slug: "fuerza-de-gigante-escarcha-piedra", oficio: "alquimia", produce: "fuerza-de-gigante", variante: "Fuerza de gigante (escarcha o piedra)", cd: 16,
    materiales: [{ n: 26, qty: 2 }, { n: 51, qty: 1 }, { n: 52, qty: 1 }] },
  { slug: "fuerza-de-gigante-fuego", oficio: "alquimia", produce: "fuerza-de-gigante", variante: "Fuerza de gigante (fuego)", cd: 16,
    materiales: [{ n: 26, qty: 2 }, { n: 53, qty: 1 }, { n: 29, qty: 1 }] },

  // --- Muy raras -----------------------------------------------------------
  { slug: "invisibilidad-mejorada", oficio: "alquimia", produce: "invisibilidad-mejorada", cd: 19,
    materiales: [{ n: 65, qty: 3 }, { n: 38, qty: 2 }, { n: 46, qty: 1 }] },
  { slug: "longevidad", oficio: "alquimia", produce: "longevidad", cd: 19,
    materiales: [{ n: 34, qty: 2 }, { n: 64, qty: 1 }, { n: 48, qty: 2 }, { n: 46, qty: 1 }] },
  { slug: "posibilidad", oficio: "alquimia", produce: "posibilidad", cd: 19,
    materiales: [{ n: 48, qty: 3 }, { n: 46, qty: 2 }, { n: 57, qty: 1 }] },
  { slug: "velocidad", oficio: "alquimia", produce: "velocidad", cd: 19,
    materiales: [{ n: 31, qty: 2 }, { n: 68, qty: 1 }, { n: 48, qty: 2 }] },
  { slug: "vitalidad", oficio: "alquimia", produce: "vitalidad", cd: 19,
    materiales: [{ n: 34, qty: 2 }, { n: 67, qty: 2 }, { n: 16, qty: 1 }, { n: 46, qty: 1 }] },
  { slug: "vuelo", oficio: "alquimia", produce: "vuelo", cd: 19,
    materiales: [{ n: 31, qty: 2 }, { n: 25, qty: 2 }, { n: 68, qty: 2 }] },
  { slug: "curacion-suprema", oficio: "alquimia", produce: "curacion", variante: "Poción de curación (suprema)", cd: 19,
    materiales: [{ n: 34, qty: 3 }, { n: 67, qty: 2 }, { n: 46, qty: 1 }] },
  { slug: "fuerza-de-gigante-nubes", oficio: "alquimia", produce: "fuerza-de-gigante", variante: "Fuerza de gigante (nubes)", cd: 19,
    materiales: [{ n: 26, qty: 3 }, { n: 68, qty: 2 }, { n: 46, qty: 1 }] },

  // --- Legendaria ----------------------------------------------------------
  { slug: "fuerza-de-gigante-tormentas", oficio: "alquimia", produce: "fuerza-de-gigante", variante: "Fuerza de gigante (tormentas)", cd: 22,
    materiales: [{ n: 26, qty: 3 }, { n: 68, qty: 2 }, { n: 46, qty: 2 }, { n: 47, qty: 1 }] },
];

/** Las recetas de un oficio. Hoy solo alquimia tiene ninguna. */
export function recetasDe(oficio: Oficio): Receta[] {
  return RECETAS.filter((r) => r.oficio === oficio);
}

export function recetaPorSlug(slug: string): Receta | undefined {
  return RECETAS.find((r) => r.slug === slug);
}

/** Las que se saben por tener la pericia, sin que nadie las enseñe. */
export function recetasIniciales(oficio: Oficio): Receta[] {
  return RECETAS.filter((r) => r.oficio === oficio && r.inicial);
}

/**
 * Cómo se llama lo que sale de una receta: el nombre de la variante en las
 * familias, el de la poción en el resto. Es el nombre con el que el objeto
 * entra en la bolsa, así que **una sola fuente**: si la ficha lo escribiera por
 * su cuenta, dos pociones de curación mayor podrían no apilarse por una tilde.
 */
export function produceNombre(r: Receta): string {
  if (r.variante) return r.variante;
  return POCIONES.find((p) => p.slug === r.produce)?.name ?? r.produce;
}

/** La rareza de lo que sale: la de la variante en las familias. */
export function produceRareza(r: Receta): Rareza | undefined {
  const p = POCIONES.find((x) => x.slug === r.produce);
  if (!p) return undefined;
  if (!r.variante) return p.rareza;
  return p.variantes?.find((v) => v.name === r.variante)?.rareza;
}
