// Las reglas de **Extracción de Componentes**: abrir un cadáver y sacarle
// piezas. Capa pura —sin React, sin Supabase, sin estado— para que
// `scripts/check-despiece.ts` pueda comprobarlas sin montar una pantalla, igual
// que `lib/manipulacion.ts` y `lib/recetario.ts`.
//
// ⚠️ **Esto NO es `data/despiece.ts`.** Aquello es la TABLA —qué suelta cada
// monstruo, escrito por el DM— y esto es el BUCLE: cuántas piezas hay, qué pasa
// al fallar y cuándo se acaba. Separarlos es lo que permite que el DM añada
// monstruos sin tocar reglas y que las reglas cambien sin tocar la tabla.
//
// ⚠️ **Y no es un taller más.** Los seis talleres gastan materiales; este los
// consigue, y por eso su tensión es distinta: allí se tira una vez y lo que
// salga salió; aquí el cadáver es un **saldo que se gasta**. Todas las
// decisiones de abajo son del DM (spec del 2026-08-02) salvo la CD, que se
// señala aparte.

import { TOPE, totalManipulacion, type Punto } from "@/lib/manipulacion";
import { piezasDe } from "@/data/despiece";

/* -------------------------------- LAS FASES ------------------------------- */

/**
 * Las tres fases, en el orden en que se juegan.
 *
 * ⚠️ **`estudiar` es OPCIONAL y no bloquea a `cortar`** (decisión del DM, opción
 * C de tres). Sin estudiar se corta igual, pero **no sabes si ese punto tenía
 * algo**. Es lo que convierte estudiar en una decisión y no en un trámite: el
 * que tiene prisa paga por tenerla.
 */
export type FaseExtraccion = "estudiar" | "cortar" | "guardar";
export const FASES_EXTRACCION: FaseExtraccion[] = ["estudiar", "cortar", "guardar"];

export const FASE_EXTRACCION_LABEL: Record<FaseExtraccion, string> = {
  estudiar: "Estudiar",
  cortar: "Cortar",
  guardar: "Guardar",
};

/** Qué se hace en cada fase, para que la pantalla no tenga que explicarlo. */
export const FASE_EXTRACCION_BLURB: Record<FaseExtraccion, string> = {
  estudiar: "Leer el cadáver: destapa dónde están las piezas.",
  cortar: "Elegir el punto y medir la profundidad.",
  guardar: "Al frasco, antes de que se eche a perder.",
};

/**
 * Lo que las manos suman a la tirada, con el MISMO tope que los otros seis.
 *
 * Se reexporta desde `lib/manipulacion.ts` en vez de reimplementarse: el tope de
 * ±3 es lo que impide que un minijuego bien jugado se coma la matemática del
 * reglamento, y tenerlo escrito dos veces era la forma segura de que un día
 * dejaran de coincidir.
 */
export { TOPE };
export function manipulacionExtraccion(puntos: Punto[]): number {
  return totalManipulacion(puntos);
}

/* ------------------------------- EL CADÁVER ------------------------------- */

/** Las caras del dado que dice cuántas piezas trae un cadáver. */
export const DADO_PIEZAS = 4;

/**
 * Cuántas piezas trae ESTE cadáver.
 *
 * ⚠️ **1d4 se tira AL ABRIRLO, no por intento** (spec del 2026-08-02). Tirarlo
 * por intento haría que fallar saliera gratis, y el oficio entero se apoya en lo
 * contrario: el jugador ve cuántas piezas hay y **cada fallo se lleva una**.
 *
 * El tamaño de la TABLA —de cuántas cosas distintas puede salir— es otra cosa y
 * vive en `piezasDe` (`data/despiece.ts`). Un cadáver puede traer 4 piezas de una
 * tabla de 2: repite.
 */
export function piezasDelCadaver(tirada: number): number {
  return Math.max(1, Math.min(DADO_PIEZAS, Math.trunc(tirada)));
}

/** El estado de un despiece en curso. Lo que la pantalla necesita saber. */
export type Despiece = {
  /** Piezas que le quedan al cadáver. Baja al fallar y al guardar. */
  restantes: number;
  /** Nombres de material ya guardados. */
  obtenidos: string[];
};

export function abrirCadaver(tirada: number): Despiece {
  return { restantes: piezasDelCadaver(tirada), obtenidos: [] };
}

/**
 * ¿Queda algo que intentar?
 *
 * Un cadáver **agotado desaparece**: sin piezas no hay nada que sacar y dejarlo
 * en pantalla haría creer que el oficio está roto.
 */
export function agotado(d: Despiece): boolean {
  return d.restantes <= 0;
}

/**
 * Un intento resuelto.
 *
 * ⚠️ **Gane o pierda, el cadáver pierde una pieza.** Al acertar porque se la
 * lleva el jugador; al fallar porque se echó a perder. Es la regla que hace que
 * fallar cueste de verdad y que el oficio sea una habilidad y no un botón: con
 * cuatro piezas y mala mano, te llevas dos.
 *
 * Devuelve un estado NUEVO en vez de mutar: así la pantalla puede pintar el
 * antes y el después, y el gate puede comprobar la regla sin montar nada.
 */
export function trasIntento(d: Despiece, exito: boolean, material: string): Despiece {
  if (agotado(d)) return d;
  return {
    restantes: d.restantes - 1,
    obtenidos: exito ? [...d.obtenidos, material] : d.obtenidos,
  };
}

/**
 * Retirarse con lo puesto.
 *
 * ⚠️ **Es lo único que ningún otro taller tiene**, y sale de que aquí haya un
 * saldo: en los seis no hay nada que conservar hasta que la tirada termina. Aquí
 * llevas dos piezas buenas, queda una, y decides si la intentas o te vas.
 */
export function retirarse(d: Despiece): string[] {
  return d.obtenidos;
}

/* ------------------------------ HERRAMIENTAS ------------------------------ */

/**
 * Sin cuchillo y frascos no se abre nada (decisión 4 del DM).
 *
 * ⚠️ **Se exigen disponibles y NO se gastan**, igual que los cinceles de
 * cristalografía. Confundirlo gastaría el cuchillo en cada corte. Es el campo
 * `herramienta` de `lib/materiales.ts`, y este sería su estreno: el gate lo
 * vigila desde alquimia y ninguna receta lo usa todavía.
 */
export const HERRAMIENTAS_EXTRACCION = ["Cuchillo de Despiece", "Frasco de Muestras"] as const;

export function faltanHerramientas(disponibles: readonly string[]): string[] {
  const tiene = new Set(disponibles);
  return HERRAMIENTAS_EXTRACCION.filter((h) => !tiene.has(h));
}

export function puedeAbrir(disponibles: readonly string[]): boolean {
  return faltanHerramientas(disponibles).length === 0;
}

/* ----------------------------------- CD ----------------------------------- */

/**
 * ⚠️ **LA CD ES LO ÚNICO QUE LA SPEC NO FIJÓ.** Todo lo demás de este módulo son
 * decisiones cerradas del DM el 2026-08-02; esto no, y va escrito aquí para que
 * se vea y se pueda cambiar de un sitio.
 *
 * Se deriva del CR porque es el único número del cadáver que dice lo difícil que
 * es de trabajar, y porque una CD fija haría que despiezar un Ciervo y un Ent
 * costaran lo mismo. Sube despacio a propósito: con competencia, atributo y la
 * manipulación (±3), un aventurero de oficio tiene que poder con lo suyo y
 * sudar con lo que le viene grande.
 *
 * Acotada a 10–20: por debajo de 10 no sería una tirada y por encima de 20 un
 * personaje sin competencia no podría ni con suerte.
 */
export const CD_MIN = 10;
export const CD_MAX = 20;

export function cdDespiece(cr: string): number {
  const n = cr === "0" ? 0 : cr.includes("/") ? 0.5 : Number(cr);
  const cd = 10 + Math.floor((Number.isFinite(n) ? n : 0) / 2);
  return Math.max(CD_MIN, Math.min(CD_MAX, cd));
}

/**
 * ¿Sale la pieza?
 *
 * La manipulación **no sustituye la tirada: la modifica**, igual que en los seis
 * talleres. Un 20 natural no está contemplado aquí a propósito: esto resuelve el
 * número, y las reglas de crítico son del reglamento, no del oficio.
 */
export function aciertaCorte(total: number, cd: number): boolean {
  return total >= cd;
}

/* ------------------------------ CORTAR A CIEGAS --------------------------- */

/**
 * Qué se sabe del punto antes de cortar.
 *
 * ⚠️ **Cortar a ciegas NO es un −1**: es no saber qué había ahí (decisión del DM,
 * opción C). Modelarlo como penalización habría sido más fácil y habría matado la
 * decisión: con un −1 conocido, estudiar es aritmética; sin saberlo, es apuesta.
 */
export type Vision = "visto" | "intuido" | "a-ciegas";

export function visionTrasEstudiar(punto: Punto | null): Vision {
  if (punto === null) return "a-ciegas";
  if (punto === 1) return "visto";
  if (punto === 0) return "intuido";
  return "a-ciegas";
}

export const VISION_LABEL: Record<Vision, string> = {
  visto: "Sabes lo que hay ahí.",
  intuido: "Intuyes algo, sin verlo del todo.",
  "a-ciegas": "No sabes si ahí había algo.",
};
