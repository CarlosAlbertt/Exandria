// Las tres fases de la FORJA: caldear con el fuelle, martillar a compás y
// templar a tiempo. Capa pura —sin React, sin Supabase, sin estado— igual que
// `lib/manipulacion.ts`, para que el gate pueda comprobarlas sin montar una
// pantalla.
//
// **Cada oficio manipula lo suyo**, pero el ±1 por fase y el tope de ±3 son los
// mismos: `puntoEnBandas` y `totalManipulacion` viven en `lib/manipulacion.ts` y
// se reutilizan aquí. Si cada taller escribiera su propia aritmética, un +1 de
// forja no valdría lo mismo que un +1 de alquimia y la mesa no podría fiarse.

import { puntoEnBandas, type Bandas, type Punto } from "@/lib/manipulacion";

/* ---------------------------- 1 · Caldear ------------------------------ */

/**
 * El color al que hay que dejar el metal, en posición normalizada 0–1 sobre la
 * escala de temperatura.
 *
 * **El cereza no está en el centro de la escala, y es a propósito**: quedarse
 * corto solo significa que no se puede forjar, pero pasarse quema la pieza. El
 * punto bueno está por encima de la mitad para que el error barato (quedarse
 * corto) sea el que queda más cerca.
 */
export const CALDEAR: Bandas = { centro: [0.52, 0.62], banda: [0.42, 0.74] };

/** Parar el fuelle: en el cereza +1, dentro del rango forjable 0, fuera −1. */
export function puntoCaldear(p: number): Punto {
  return puntoEnBandas(p, CALDEAR);
}

/** Los cinco tramos de la escala, para poder decir en qué punto va la barra. */
export const COLORES_CALOR = [
  { hasta: 0.2, nombre: "frío", color: "#4a5464" },
  { hasta: 0.42, nombre: "rojo oscuro", color: "#8e2a1c" },
  { hasta: 0.74, nombre: "cereza", color: "#ef6a3d" },
  { hasta: 0.88, nombre: "naranja", color: "#ffb056" },
  { hasta: 1.01, nombre: "blanco", color: "#fff3c4" },
] as const;

/** En qué tramo de la escala está esta temperatura. */
export function tramoDeCalor(p: number): { nombre: string; color: string } {
  const limpio = Number.isFinite(p) ? Math.min(1, Math.max(0, p)) : 0;
  for (const t of COLORES_CALOR) if (limpio < t.hasta) return { nombre: t.nombre, color: t.color };
  // Inalcanzable: el último tramo llega a 1.01 y la entrada está acotada a 1.
  // Se devuelve el último igualmente para no tener que mentirle al tipo.
  return { nombre: COLORES_CALOR[COLORES_CALOR.length - 1].nombre, color: COLORES_CALOR[COLORES_CALOR.length - 1].color };
}

/* --------------------------- 2 · Martillar ----------------------------- */

/** Golpes que pide una pieza. Tres, como en el boceto. */
export const GOLPES = 3;

/**
 * Cuánto puede desviarse un golpe del compás y seguir contando, en fracción del
 * periodo. 0,16 es una ventana generosa a propósito: esto es un juego de rol,
 * no un simulador de ritmo, y quien no tenga oído tiene «forjar sin manipular».
 */
export const TOLERANCIA_GOLPE = 0.16;

/**
 * El punto de martillar, a partir de **cuánto se desvió cada golpe** (0 = clavado,
 * 1 = a contratiempo entero). Se pasan los desvíos ya medidos para que esta capa
 * siga siendo pura: aquí no hay reloj.
 *
 * **La regla entera es «cuántos de los tres cayeron a tiempo»**: tres, +1; dos,
 * 0; uno o ninguno, −1. Nada más.
 *
 * De ahí salen dos consecuencias que conviene decir en voz alta, porque no son
 * casos aparte sino la misma regla:
 * - **Un golpe que no se da es un golpe que no cayó a tiempo.** Soltar el
 *   martillo a la mitad no es una forma barata de no arriesgar; simplemente no
 *   suma. Y tampoco es un castigo extra: dos clavados y soltar vale lo mismo que
 *   dar los tres fallando uno, que es lo que la mesa espera al contarlos.
 * - **Golpear de más no arregla nada**: solo se miran los `GOLPES` que se piden.
 */
export function puntoMartillar(desvios: number[]): Punto {
  let aTiempo = 0;
  for (let i = 0; i < GOLPES; i++) {
    const d = desvios[i];
    if (typeof d === "number" && Number.isFinite(d) && Math.abs(d) <= TOLERANCIA_GOLPE) aTiempo++;
  }
  if (aTiempo >= GOLPES) return 1;
  if (aTiempo === GOLPES - 1) return 0;
  return -1;
}

/* ---------------------------- 3 · Templar ------------------------------ */

/**
 * Cuándo meterla al agua. Aquí sí manda el centro: **pasarse y quedarse corto
 * cuestan lo mismo** —blanda de un lado, rajada del otro—, así que la banda es
 * simétrica, al revés que la de caldear.
 */
export const TEMPLAR: Bandas = { centro: [0.44, 0.56], banda: [0.3, 0.7] };

/** Al agua: a tiempo +1, dentro del margen 0, pronto o tarde −1. */
export function puntoTemplar(p: number): Punto {
  return puntoEnBandas(p, TEMPLAR);
}
