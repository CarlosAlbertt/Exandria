// Reglas de targeting de combate 2024, PURO (sin React ni Supabase). Molde de
// lib/ataque.ts / lib/estado.ts. Junta estado (G1), ataque (G2) y posición (G3):
// ventaja del atacante por la condición del objetivo, alcance del arma, fallo
// automático de salvación y crítico por proximidad. Mecánicas = hechos 2024.
import { parseFormula } from "@/lib/dice";

/**
 * Ventaja/desventaja que gana EL ATACANTE por la condición del objetivo.
 * `cuerpoACuerpo` se DEDUCE DEL ARMA (una daga se usa en cuerpo a cuerpo, un
 * arco dispara), así que no hace falta medir nada sobre un tablero.
 * Devuelve flags crudos: la anulación 2024 se aplica una sola vez en `combinar`.
 */
export function ventajaAtacante(
  condsObjetivo: string[],
  cuerpoACuerpo: boolean,
): { adv: boolean; dis: boolean } {
  const c = new Set(condsObjetivo);
  let adv = false;
  let dis = false;
  // Atacar a estos objetivos es con ventaja (RAW 2024), se esté cerca o lejos:
  for (const s of ["cegado", "paralizado", "petrificado", "restringido", "aturdido", "inconsciente"])
    if (c.has(s)) adv = true;
  // Derribado: ventaja cuerpo a cuerpo, desventaja a distancia.
  if (c.has("derribado")) { if (cuerpoACuerpo) adv = true; else dis = true; }
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
 * ¿El ataque es crítico por proximidad? Con un arma de CUERPO A CUERPO contra un
 * objetivo paralizado o inconsciente (RAW 2024: cualquier ataque que acierte a
 * ≤1,5 m, y con un arma de cuerpo estás ahí por definición). El 20 natural va
 * aparte, vía dice.critState.
 */
export function critProximidad(condsObjetivo: string[], cuerpoACuerpo: boolean): boolean {
  if (!cuerpoACuerpo) return false;
  const c = new Set(condsObjetivo);
  return c.has("paralizado") || c.has("inconsciente");
}

/**
 * Fórmula de daño del arma. En crítico se DOBLAN los dados, no el modificador:
 * "1d8" + mod 3 crítico ⇒ "2d8+3". Reusa parseFormula (lib/dice) para no duplicar
 * el parseo; si `dado` no es una fórmula NdM válida, cae al string tal cual (no
 * finge un doblado sobre algo que no supo leer). Conserva el "+0" (compat con G2).
 */
export function formulaDaño(dado: string, mod: number, crit: boolean): string {
  const parsed = parseFormula(dado);
  const dados = crit && parsed ? `${parsed.n * 2}d${parsed.die}` : dado;
  return `${dados}${mod >= 0 ? "+" : ""}${mod}`;
}
