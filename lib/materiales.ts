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

/**
 * Los SIETE oficios.
 *
 * ⚠️ **`extraccion` es el primero SIN catálogo propio, y esa suposición estaba
 * metida en todo el índice sin estar escrita en ninguna parte.** Los otros seis
 * reparten los 369 materiales entre ellos; Extracción no aporta ninguno porque
 * **no fabrica: consigue**. Lo que suelta ya está escrito en los catálogos
 * ajenos —88 de los 369 son piezas de monstruo— y quién suelta qué vive en
 * `data/despiece.ts`.
 *
 * La decisión de meterlo como `Oficio` de pleno derecho, y no como un tipo
 * aparte, es del usuario (2026-08-26) y la avisaba la propia spec: así los
 * `Record<Oficio, …>` obligan a rellenarlo y **TypeScript no deja olvidarse**.
 * El precio es que los gates que contaban catálogos han tenido que aprender que
 * un oficio puede tener CERO materiales — ver `catalogoPropio`.
 */
export type Oficio =
  | "alquimia" | "cocina" | "forja"
  | "destilacion" | "cristalografia" | "tatuaje"
  | "extraccion";

/**
 * ¿Este oficio trae materiales propios al índice?
 *
 * Escrito y no derivado de `MATERIALES.length`, a propósito: derivarlo haría
 * que un catálogo que se quedara vacío por accidente pasara por «es que este no
 * tiene», que es justo el fallo que se quiere cazar. Con la lista escrita, un
 * catálogo vacío por error **falla**, y el único exento lo está porque alguien
 * lo decidió.
 */
export function catalogoPropio(o: Oficio): boolean {
  return o !== "extraccion";
}

/** El nombre de la pericia de oficio, tal y como está en `data/rules.ts`. */
export const OFICIO_PERICIA: Record<Oficio, string> = {
  alquimia: "Alquimia",
  cocina: "Cocina",
  forja: "Forja",
  destilacion: "Destilación Exandriana",
  cristalografia: "Cristalografía Arcana",
  tatuaje: "Tatuaje Rúnico",
  extraccion: "Extracción de Componentes",
};

/** Cómo se llama cada taller en la interfaz. */
export const OFICIO_LABEL: Record<Oficio, string> = {
  alquimia: "Alquimia",
  cocina: "Cocina",
  forja: "Forja",
  destilacion: "Destilación",
  cristalografia: "Cristalografía",
  tatuaje: "Tatuaje",
  extraccion: "Extracción",
};

/** El orden en que salen las pestañas del taller y los filtros de `/oficios`. */
export const OFICIOS_ORDEN: Oficio[] = [
  "alquimia", "cocina", "forja", "destilacion", "cristalografia", "tatuaje",
  // ⚠️ El séptimo va AL FINAL y no en su sitio alfabético: es el que consigue
  // materiales, no el que los gasta, y leerlo después de los seis que los
  // gastan es lo que cuenta de qué va el taller sin tener que explicarlo.
  "extraccion",
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

/**
 * Los 369, en el orden de `OFICIOS_ORDEN` y dentro de cada uno por catálogo.
 *
 * **Se esparce la entrada entera (`...i`) en vez de copiar campo a campo**, y no
 * es un atajo: copiando campos, un dato nuevo en un catálogo se pierde aquí
 * **en silencio**. Costó encontrarlo una prueba de mutación —marcar como
 * herramienta un ingrediente de alquimia no hacía fallar nada, porque el índice
 * descartaba el campo y la regla de «ninguna receta gasta una herramienta» se
 * quedaba vacía—. Con el spread, lo que se añada a un catálogo llega solo.
 */
export const MATERIALES: Material[] = [
  ...INGREDIENTES.map((i): Material => ({ ...i, oficio: "alquimia" })),
  ...INGREDIENTES_COCINA.map((i): Material => ({ ...i, oficio: "cocina" })),
  ...MATERIALES_FORJA.map((m): Material => ({ ...m, oficio: "forja" })),
  ...INGREDIENTES_DESTILACION.map((i): Material => ({ ...i, oficio: "destilacion" })),
  ...MATERIALES_CRISTAL.map((m): Material => ({ ...m, oficio: "cristalografia" })),
  ...MATERIALES_TATUAJE.map((m): Material => ({ ...m, oficio: "tatuaje" })),
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
