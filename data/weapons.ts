// Estadísticas de combate de las armas del catálogo (data/equipment.ts).
// Son datos mecánicos de las 2024 (hechos), no prosa: dado, tipo, alcance y
// propiedades. Keyed por el nombre EXACTO de CATALOG.Armas.

export type Arma = {
  nombre: string;
  categoria: "sencilla" | "marcial";
  dado: string;            // "1d8" (formato de lib/dice.ts)
  tipo: "cortante" | "perforante" | "contundente";
  alcance: "cuerpo" | "distancia";
  sutil?: boolean;         // finesse: elige la mejor de Fue/Des
  versatil?: string;       // dado a dos manos (informativo en G2)
};

export const ARMAS: Record<string, Arma> = {
  "Daga": { nombre: "Daga", categoria: "sencilla", dado: "1d4", tipo: "perforante", alcance: "cuerpo", sutil: true },
  "Espada corta": { nombre: "Espada corta", categoria: "marcial", dado: "1d6", tipo: "perforante", alcance: "cuerpo", sutil: true },
  "Espada larga": { nombre: "Espada larga", categoria: "marcial", dado: "1d8", tipo: "cortante", alcance: "cuerpo", versatil: "1d10" },
  "Hacha de mano": { nombre: "Hacha de mano", categoria: "sencilla", dado: "1d6", tipo: "cortante", alcance: "cuerpo" },
  "Maza": { nombre: "Maza", categoria: "sencilla", dado: "1d6", tipo: "contundente", alcance: "cuerpo" },
  "Bastón": { nombre: "Bastón", categoria: "sencilla", dado: "1d6", tipo: "contundente", alcance: "cuerpo", versatil: "1d8" },
  "Arco corto": { nombre: "Arco corto", categoria: "sencilla", dado: "1d6", tipo: "perforante", alcance: "distancia" },
  "Arco largo": { nombre: "Arco largo", categoria: "marcial", dado: "1d8", tipo: "perforante", alcance: "distancia" },
  "Ballesta ligera": { nombre: "Ballesta ligera", categoria: "sencilla", dado: "1d8", tipo: "perforante", alcance: "distancia" },
  "Lanza": { nombre: "Lanza", categoria: "sencilla", dado: "1d6", tipo: "perforante", alcance: "cuerpo", versatil: "1d8" },
  "Martillo de guerra": { nombre: "Martillo de guerra", categoria: "marcial", dado: "1d8", tipo: "contundente", alcance: "cuerpo", versatil: "1d10" },
  "Cimitarra": { nombre: "Cimitarra", categoria: "marcial", dado: "1d6", tipo: "cortante", alcance: "cuerpo", sutil: true },
};

/** El arma de ese nombre, o null si el objeto no es un arma del catálogo. */
export function armaDe(nombre: string): Arma | null {
  return ARMAS[nombre] ?? null;
}
