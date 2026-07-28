// Capa pura del combate contra monstruos: sin React, sin Supabase, sin estado.
// Solo funciones que transforman datos, verificadas por scripts/check-combate.ts.
//
// No fusiona `play_state` ni lo toca: los PG y las condiciones de un MONSTRUO
// viven en su fila de `initiative` (schema_v23), no en una ficha. Los de un
// jugador siguen en `play_state` y los llevan lib/estado.ts y lib/recursos.ts.

/**
 * Cómo se le cuenta a un jugador la salud de un monstruo: en palabras, nunca
 * el número. Mantiene la tensión de la mesa — nadie calcula «le quedan 3».
 * El DM sí ve las cifras exactas (eso lo decide el componente, no esto).
 */
export type Salud = "intacto" | "herido" | "malherido" | "al borde" | "fuera de combate";

/**
 * Tramos (del spec): 100 % intacto · ≥50 % herido · ≥25 % malherido ·
 * >0 al borde · 0 fuera de combate.
 *
 * `hpMax` <= 0 no debería pasar (todo monstruo del bestiario trae `hp`), pero
 * un personalizado del DM mal metido no puede tumbar la pantalla de combate:
 * se responde por si hay vida o no, sin dividir por cero.
 */
export function saludDe(hp: number, hpMax: number): Salud {
  if (hpMax <= 0) return hp > 0 ? "intacto" : "fuera de combate";
  const vivos = Math.max(0, Math.min(hp, hpMax));
  if (vivos <= 0) return "fuera de combate";
  const parte = vivos / hpMax;
  if (parte >= 1) return "intacto";
  if (parte >= 0.5) return "herido";
  if (parte >= 0.25) return "malherido";
  return "al borde";
}

/**
 * PG de un monstruo acotados a su fila: nunca por debajo de 0 ni por encima
 * de su máximo, y siempre enteros (la columna es `int`). Devuelve `null` si
 * le llega algo que no es un número finito — quien llama debe cortar en vez
 * de escribir un `NaN`, que en JSON viaja como `null` y borraría los PG en
 * silencio.
 */
export function acotarHp(hp: number, hpMax: number): number | null {
  if (!Number.isFinite(hp) || !Number.isFinite(hpMax)) return null;
  const tope = Math.max(0, Math.round(hpMax));
  return Math.max(0, Math.min(Math.round(hp), tope));
}

/**
 * Nombres de una tanda de monstruos idénticos. Uno solo, y si no hay ninguno
 * más en la mesa, se queda con su nombre a secas («Goblin»); en cuanto hay
 * varios se numeran. `yaHay` es cuántos de ese mismo bicho hay ya en la
 * iniciativa, porque los monstruos entran por tandas y la numeración de la
 * segunda tanda tiene que seguir donde acabó la primera — si no, saldrían dos
 * «Goblin 1» y el DM no podría decir a cuál le pegas.
 */
export function nombresNumerados(nombre: string, n: number, yaHay = 0): string[] {
  const base = nombre.trim();
  if (n <= 0) return [];
  if (yaHay <= 0 && n === 1) return [base];
  const desde = Math.max(0, Math.round(yaHay));
  return Array.from({ length: n }, (_, i) => `${base} ${desde + i + 1}`);
}

/**
 * Cuántos de ese monstruo hay ya en la mesa, contando tanto el nombre a secas
 * («Goblin») como los numerados («Goblin 1»). Se compara sin distinguir
 * mayúsculas para que un personalizado escrito distinto no descuadre la cuenta.
 */
export function cuentaEnMesa(nombres: string[], nombre: string): number {
  const base = nombre.trim().toLowerCase();
  if (base.length === 0) return 0;
  return nombres.filter((n) => {
    const limpio = n.trim().toLowerCase();
    return limpio === base || new RegExp(`^${base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} \\d+$`).test(limpio);
  }).length;
}

/** Cuántos bichos añade una tanda: al menos 1, como mucho 20, siempre entero. */
export const TANDA_MAX = 20;

export function cantidadValida(texto: string): number {
  const n = Math.round(Number(texto));
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.min(TANDA_MAX, n));
}
