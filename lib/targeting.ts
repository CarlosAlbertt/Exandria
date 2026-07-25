// Reglas de targeting de combate 2024, PURO (sin React ni Supabase). Molde de
// lib/ataque.ts / lib/estado.ts. Junta estado (G1), ataque (G2) y posición (G3):
// ventaja del atacante por la condición del objetivo, alcance del arma, fallo
// automático de salvación y crítico por proximidad. Mecánicas = hechos 2024.
import type { Arma } from "@/data/weapons";

/**
 * Ventaja/desventaja que gana EL ATACANTE por la condición del objetivo + la
 * distancia. Devuelve flags crudos (sin colapsar) para que la anulación 2024 se
 * aplique una sola vez, global, en `combinar`.
 */
export function ventajaAtacante(
  condsObjetivo: string[],
  distanciaM: number,
): { adv: boolean; dis: boolean } {
  const c = new Set(condsObjetivo);
  let adv = false;
  let dis = false;
  // Atacar a estos objetivos es con ventaja (RAW 2024):
  for (const s of ["cegado", "paralizado", "petrificado", "restringido", "aturdido", "inconsciente"])
    if (c.has(s)) adv = true;
  // Derribado: ventaja a ≤1,5 m (cuerpo), desventaja a >1,5 m (distancia).
  if (c.has("derribado")) { if (distanciaM <= 1.5) adv = true; else dis = true; }
  // apresado (grappled) NO da ventaja al atacante.
  return { adv, dis };
}

/**
 * Anulación 2024 sobre TODAS las fuentes: la ventaja propia (envenenado/asustado,
 * vía estado.ventajaDe) + la del objetivo. Cualquier adv Y cualquier dis ⇒ recto.
 * `propia` ya viene colapsada de ventajaDe; hoy no hay fuentes de ventaja propia,
 * así que colapsarla antes es sin pérdida.
 */
export function combinar(
  propia: "adv" | "dis" | null,
  objetivo: { adv: boolean; dis: boolean },
): "adv" | "dis" | null {
  const adv = objetivo.adv || propia === "adv";
  const dis = objetivo.dis || propia === "dis";
  if (adv && dis) return null;
  if (adv) return "adv";
  if (dis) return "dis";
  return null;
}

/**
 * ¿El arma llega a esa distancia? Cuerpo ⇒ ≤1,5 m (el catálogo no tiene armas de
 * alcance extendido). Distancia ⇒ siempre llega en el tablero (30 m × 18 m por
 * defecto; el catálogo no trae normal/largo).
 */
export function enAlcance(arma: Arma, distanciaM: number): boolean {
  return arma.alcance === "distancia" ? true : distanciaM <= 1.5;
}

/**
 * ¿Se auto-falla esta salvación por condición? Fue/Des con paralizado/aturdido/
 * inconsciente/petrificado ⇒ fallo automático (no se tira).
 */
export function autoFallaSalvacion(conds: string[], caracteristica: string): boolean {
  if (caracteristica !== "fue" && caracteristica !== "des") return false;
  const c = new Set(conds);
  return ["paralizado", "aturdido", "inconsciente", "petrificado"].some((s) => c.has(s));
}

/**
 * Desventaja de la salvación por condición específica de característica. Hoy solo
 * restringido ⇒ desventaja en la salvación de Des. Cierra la omisión honesta de G1.
 */
export function ventajaSalvacion(conds: string[], caracteristica: string): "dis" | null {
  return caracteristica === "des" && conds.includes("restringido") ? "dis" : null;
}

/**
 * ¿El ataque es crítico por proximidad? Cuerpo a ≤1,5 m contra objetivo
 * paralizado/inconsciente. (El 20 natural va aparte, vía dice.critState.)
 */
export function critProximidad(arma: Arma, condsObjetivo: string[], distanciaM: number): boolean {
  if (arma.alcance !== "cuerpo" || distanciaM > 1.5) return false;
  const c = new Set(condsObjetivo);
  return c.has("paralizado") || c.has("inconsciente");
}

/**
 * Fórmula de daño del arma. En crítico se DOBLAN los dados, no el modificador:
 * "1d8" + mod 3 crítico ⇒ "2d8+3". Sin crítico conserva el "+0" (compat con G2).
 */
export function formulaDaño(dado: string, mod: number, crit: boolean): string {
  const m = dado.match(/^(\d+)d(\d+)$/);
  const dados = crit && m ? `${parseInt(m[1], 10) * 2}d${m[2]}` : dado;
  return `${dados}${mod >= 0 ? "+" : ""}${mod}`;
}
