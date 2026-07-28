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
 * Nombres de una tanda de monstruos idénticos. Uno solo se queda con su
 * nombre a secas («Goblin»); varios se numeran («Goblin 1»… «Goblin 4») para
 * que el DM pueda decir a cuál le pegas.
 */
export function nombresNumerados(nombre: string, n: number): string[] {
  const base = nombre.trim();
  if (n <= 0) return [];
  if (n === 1) return [base];
  return Array.from({ length: n }, (_, i) => `${base} ${i + 1}`);
}
