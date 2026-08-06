// Qué suelta cada monstruo al despiezarlo con **Extracción de Componentes**.
//
// Es la primera mitad del bucle que hoy no existe: los seis talleres GASTAN
// materiales y ninguno los CONSIGUE, así que «al fallar se pierden los
// ingredientes» no significa nada — no cuesta nada reponerlos porque no cuesta
// nada tenerlos.
//
// Los nombres apuntan a materiales de los seis catálogos por su `name` exacto.
// Es la misma clave que usa `lib/materiales.ts`, y vale como clave porque el
// gate 30 garantiza que ningún nombre se repite entre catálogos.

import type { Monster } from "./bestiary/types";

/**
 * Cuántas piezas distintas puede dar un monstruo.
 *
 * Base por CR, **+1 si es Grande o mayor**, acotado a 1–5. El tamaño entra
 * porque un bicho grande da más de donde cortar aunque su CR sea bajo.
 *
 * ⚠️ Esto NO es cuántas piezas salen de un cadáver concreto: eso es **1d4**, se
 * tira al abrirlo y cada fallo se come una (spec del 2026-08-02). Esto es de
 * cuántas COSAS DISTINTAS puede salir, o sea el tamaño de la tabla.
 */
export function piezasDe(cr: string, size: string): number {
  const base =
    ["0", "1/8", "1/4"].includes(cr) ? 1 :
    ["1/2", "1", "2"].includes(cr) ? 2 :
    Number(cr) <= 6 ? 3 :
    Number(cr) <= 12 ? 4 : 5;
  const grande = /Grande|Enorme|Gargantuesco/i.test(size);
  return Math.max(1, Math.min(5, base + (grande ? 1 : 0)));
}

/**
 * Monstruo (por `slug`) → nombres de material que puede soltar.
 *
 * **Un monstruo que no esté aquí simplemente NO es despiezable**, y eso se dice
 * en pantalla sin que parezca un fallo. Con 124 monstruos en el bestiario no
 * hace falta cubrirlos todos para que el oficio funcione.
 *
 * ⚠️ **Los Humanoides se quedan fuera a propósito.** El Plebeyo es CR 0 y
 * entraría solo por la regla, pero una tabla de despiece con personas mete
 * «Hígado de Plebeyo» en el catálogo de cocina. Si algún día se quiere, es una
 * decisión de mesa y va escrita, no derivada.
 */
export const DESPIECE: Record<string, string[]> = {
  // --- CR 0 (tanda del 2026-08-06) ------------------------------------------
  // Todos Diminuto/Pequeño/Mediano, así que a uno por barba.
  aguila: ["Pluma Timonera de Águila"],
  arana: ["Hilo de Araña Común"],
  babuino: ["Carne Magra de Babuino"],
  buho: ["Pluma Silenciosa de Búho"],
  buitre: ["Buche de Buitre"],
  cabra: ["Cuajo de Cabra"],
  cangrejo: ["Pinza de Cangrejo"],
  chacal: ["Colmillo de Chacal"],
  ciervo: ["Asta de Ciervo"],
  comadreja: ["Piel de Comadreja"],
  cuervo: ["Pluma Negra de Cuervo"],
  // Este ya tenía material propio desde que existe el catálogo de alquimia: se
  // reutiliza en vez de escribir un duplicado con otro nombre.
  "escarabajo-de-fuego-gigante": ["Caparazón de Escarabajo de Fuego"],
  escorpion: ["Aguijón de Escorpión"],
  gato: ["Pelo de Gato Negro"],
  halcon: ["Zarpa de Halcón"],
  hiena: ["Mandíbula de Hiena"],
  lagarto: ["Cola de Lagarto Cercenada"],
  murcielago: ["Guano de Murciélago"],
  pirana: ["Diente de Piraña"],
  pulpo: ["Ventosa de Pulpo"],
  rana: ["Piel Húmeda de Rana"],
  rata: ["Cola de Rata"],
  tejon: ["Grasa de Tejón"],
};

/** ¿Se puede despiezar este bicho? */
export function esDespiezable(slug: string): boolean {
  return (DESPIECE[slug]?.length ?? 0) > 0;
}

/** Lo que suelta, o vacío si no está emparejado. */
export function despieceDe(monstruo: Pick<Monster, "slug">): string[] {
  return DESPIECE[monstruo.slug] ?? [];
}
