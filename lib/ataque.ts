// Cálculo PURO de un ataque con arma (2024). Traduce un arma + la ficha derivada
// en los números de la tirada: característica usada, modificador de impacto,
// competencia y dado/modificador de daño. Sin React ni Supabase.
import type { Arma } from "@/data/weapons";

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
