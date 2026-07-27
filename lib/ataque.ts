// Cálculo PURO de un ataque con arma (2024). Traduce un arma + la ficha derivada
// en los números de la tirada: característica usada, modificador de impacto,
// competencia y dado/modificador de daño. Sin React ni Supabase.
import type { Arma } from "@/data/weapons";
import { getMechanics } from "@/data/classdata";

export type Ataque = {
  caracteristica: "fue" | "des";
  modImpacto: number;   // mod de característica + (competencia si aplica)
  competente: boolean;
  dadoDaño: string;     // el dado del arma, p. ej. "1d8"
  modDaño: number;      // el mod de la característica usada
};

/**
 * `abilities`: los MODS de característica (de derive.ts, campo `.mod`).
 * `prof`: bono de competencia. `classWeapons`: `getMechanics(cls).weapons`
 * ("sencillas"/"marciales"). Reglas 2024: distancia⇒Des, cuerpo sin sutil⇒Fue,
 * sutil⇒la mejor de Fue/Des; competente si la categoría del arma está entre las
 * de la clase; impacto = mod + (prof si competente); daño = dado + mod.
 */
export function ataqueDe(
  arma: Arma,
  abilities: { fue: number; des: number },
  prof: number,
  classWeapons: string[],
): Ataque {
  let caracteristica: "fue" | "des";
  if (arma.alcance === "distancia") caracteristica = "des";
  else if (arma.sutil) caracteristica = abilities.des >= abilities.fue ? "des" : "fue";
  else caracteristica = "fue";

  const mod = abilities[caracteristica];
  const competente = arma.categoria === "sencilla"
    ? classWeapons.includes("sencillas")
    : classWeapons.includes("marciales");

  return {
    caracteristica,
    modImpacto: mod + (competente ? prof : 0),
    competente,
    dadoDaño: arma.dado,
    modDaño: mod,
  };
}

// Nombre EXACTO de la columna del guerrero y del rasgo que dan multiataque.
const COLUMNA_ATAQUES = "Ataques por acción de Atacar";
const RASGO_ATAQUE_EXTRA = /^ataques? extra$/i;

/**
 * Cuántos ataques da la acción de Atacar a esa clase y nivel. Los datos YA
 * existen, no se inventa nada:
 *  1. El guerrero tiene su propia columna de progresión (1/2/3/4) ⇒ se lee.
 *  2. Si no, ¿tiene el rasgo «Ataque Extra» a un nivel ya alcanzado? ⇒ 2.
 *     (bárbaro, explorador, cazador de sangre, paladín y monje, todos a nv5)
 *  3. Si no ⇒ 1.
 *
 * Pícaro y bardo caen en el caso 3 y es CORRECTO: en 2024 no tienen Ataque
 * Extra. El escalado del pícaro es el Ataque Furtivo, una vez por turno.
 */
export function ataquesPorAccion(clsSlug: string, level: number): number {
  const m = getMechanics(clsSlug);
  if (!m) return 1;
  const i = Math.max(0, Math.min(19, Math.floor(level) - 1));
  const col = m.resources?.find((r) => r.name === COLUMNA_ATAQUES);
  if (col) return Math.max(1, Number(col.values[i]) || 1);
  const nivel = Math.max(1, Math.floor(level));
  const extra = m.features.some((f) => RASGO_ATAQUE_EXTRA.test(f.name) && f.level <= nivel);
  return extra ? 2 : 1;
}
