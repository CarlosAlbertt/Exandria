// La manipulación del taller: lo que las manos del jugador le suman o le restan
// a la tirada de pericia. Capa pura —sin React, sin Supabase, sin estado— para
// que `scripts/check-recetas.ts` pueda comprobar las reglas sin montar una
// pantalla, igual que `lib/recetario.ts`.
//
// **La manipulación NO sustituye la tirada: la modifica.** El tope de ±3 es lo
// que impide que un minijuego bien jugado se coma la matemática del reglamento:
// con la competencia, el atributo y el nivel, un +3 más ya es mucho.

import type { Receta } from "@/data/recetas";
import { materialPorN } from "@/lib/materiales";
import type { Rareza } from "@/data/pociones";

/** Las tres fases de alquimia, en el orden en que se juegan. */
export type Fase = "echar" | "pipeta" | "cocer";
export const FASES: Fase[] = ["echar", "pipeta", "cocer"];

export const FASE_LABEL: Record<Fase, string> = {
  echar: "Echar",
  pipeta: "Pipeta",
  cocer: "Cocer",
};

/** Lo que saca una fase. Ni una fase puede dar más de 1 ni quitar más de 1. */
export type Punto = -1 | 0 | 1;

/** El tope, en los dos sentidos. */
export const TOPE = 3;

/**
 * El bono que se le suma a la tirada.
 *
 * Hoy son tres fases de ±1, así que la suma nunca se sale de ±3 y el clamp
 * parece decorativo. Se escribe igual: es la garantía de que añadir una cuarta
 * fase mañana no rompa la matemática **sin que nadie se acuerde de mirarlo**.
 * El gate comprueba el clamp, no la suma.
 */
export function totalManipulacion(puntos: Punto[]): number {
  const suma = puntos.reduce<number>((a, p) => a + p, 0);
  return Math.max(-TOPE, Math.min(TOPE, suma));
}

/* ----------------------------- Fase 1: echar ----------------------------- */

/**
 * Los materiales van al caldero **en el orden que pide la receta**. Acertarlo
 * entero da +1; cualquier cosa distinta, −1.
 *
 * No hay término medio a propósito: «medio orden» no significa nada para quien
 * está mirando el caldero, y una regla que el jugador no puede explicar con una
 * frase no se juega, se sufre.
 */
export function puntoEchar(jugado: number[], receta: number[]): Punto {
  if (jugado.length !== receta.length) return -1;
  return jugado.every((n, i) => n === receta[i]) ? 1 : -1;
}

/** El orden que la receta pide: sus materiales, tal y como están escritos. */
export function ordenDeReceta(r: Receta): number[] {
  return r.materiales.map((m) => m.n);
}

/* ---------------------- Fases 2 y 3: soltar y parar ---------------------- */
// Las dos son lo mismo por dentro: una posición normalizada 0–1 que el jugador
// congela, y dos bandas concéntricas. Se separan porque los números difieren y
// porque el gate los lee de aquí en vez de repetirlos.

/** Centro y banda de la pipeta, en posición normalizada 0–1. */
export const PIPETA = { centro: [0.45, 0.55], banda: [0.32, 0.68] } as const;
/** Sector estrecho y arco ancho de la aguja de cocer. */
export const COCER = { centro: [0.46, 0.54], banda: [0.3, 0.7] } as const;

function puntoEnBandas(p: number, b: { centro: readonly [number, number]; banda: readonly [number, number] }): Punto {
  // Una posición que no es un número finito cuenta como fallo y no como acierto:
  // si algún día un `NaN` llega hasta aquí, que cueste, no que regale un +1.
  if (!Number.isFinite(p)) return -1;
  if (p >= b.centro[0] && p <= b.centro[1]) return 1;
  if (p >= b.banda[0] && p <= b.banda[1]) return 0;
  return -1;
}

/** Soltar la pipeta: centro +1, dentro de la banda 0, fuera −1. */
export function puntoPipeta(p: number): Punto {
  return puntoEnBandas(p, PIPETA);
}

/** Parar la aguja: clavarla +1, dentro del arco 0, pasarse −1. */
export function puntoCocer(p: number): Punto {
  return puntoEnBandas(p, COCER);
}

/* ------------------------------ El desastre ------------------------------ */

export type TipoDano = "veneno" | "acido" | "fuego";

/**
 * De qué daña una mezcla echada a perder, según de qué esté hecha. Sale de la
 * categoría que ya tiene cada ingrediente en `data/alquimia.ts`: no hay campo
 * nuevo ni lore que inventarse.
 *
 * ⚠️ Si un catálogo estrena una quinta categoría, **el gate falla**. Es
 * deliberado: preferimos parar la tanda a que una poción nueva no dañe nunca
 * porque su categoría no estaba en este mapa.
 */
export const DANO_POR_CATEGORIA: Record<string, TipoDano> = {
  flora: "veneno",
  fauna: "veneno",
  mineral: "acido",
  esencia: "fuego",
};

export const DANO_LABEL: Record<TipoDano, string> = {
  veneno: "veneno",
  acido: "ácido",
  fuego: "fuego",
};

/**
 * La categoría de la que más lleva la receta, **contando cantidades**: dos
 * raíces pesan más que un mineral suelto.
 *
 * El empate se rompe por **el primer material de la receta**, no por el orden
 * en que un `Map` decida iterar: la misma receta tiene que dar siempre el mismo
 * tipo de daño, hoy y en el navegador de otro.
 */
export function categoriaDominante(r: Receta): string | null {
  const suma = new Map<string, number>();
  let primera: string | null = null;
  for (const m of r.materiales) {
    const mat = materialPorN(r.oficio, m.n);
    const cat = mat?.category;
    if (!cat) continue;
    if (primera === null) primera = cat;
    suma.set(cat, (suma.get(cat) ?? 0) + m.qty);
  }
  if (suma.size === 0) return null;
  let mejor: string | null = null;
  let mejorN = -1;
  for (const [cat, n] of suma) {
    if (n > mejorN) { mejor = cat; mejorN = n; continue; }
    // Empate: gana la categoría del primer material de la receta si está en él.
    if (n === mejorN && cat === primera) mejor = cat;
  }
  return mejor;
}

/**
 * De qué daña esta receta al echarse a perder, o `null` si no se puede saber.
 *
 * Devuelve `null` en vez de un respaldo cómodo: un tipo por defecto escondería
 * justo el caso que el gate tiene que cazar. El caldero, ante `null`, no aplica
 * daño — pero el gate no deja llegar ahí.
 */
export function danoDeReceta(r: Receta): TipoDano | null {
  const cat = categoriaDominante(r);
  if (cat === null) return null;
  return DANO_POR_CATEGORIA[cat] ?? null;
}

/**
 * ¿Se ha ido todo al garete?
 *
 * Dos formas, y las dos tenían que costar algo más que los materiales:
 * - **pifia**: 1 natural en el d20, pase lo que pase con las manos;
 * - **manipulación −3**: las tres fases falladas.
 *
 * `cara` es la cara del d20 **sin modificadores**: un total de 1 con un +5 no
 * es una pifia, y confundirlos castigaría al que peor tira.
 */
export function esDesastre(cara: number, manipulacion: number): boolean {
  return cara === 1 || manipulacion <= -TOPE;
}

/* ------------------------------ El brebaje ------------------------------- */

/**
 * El color del líquido del caldero. El caldero es SVG, así que el brebaje dice
 * qué se está preparando sin una etiqueta encima.
 *
 * Va por **rareza** y no por poción: son cinco valores en vez de treinta y dos,
 * y una poción nueva entra ya con su color sin tocar nada.
 */
export function colorBrebaje(rareza: Rareza | undefined): string {
  switch (rareza) {
    case "infrecuente": return "#45c7bd"; // arcano
    case "rara": return "#9d8cf0"; // violeta
    case "muy-rara": return "#ef6a3d"; // brasa
    case "legendaria": return "#f0d79a"; // bronce claro
    default: return "#5fbf7a"; // verdante: común y variable
  }
}
