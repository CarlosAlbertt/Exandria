// Buscarse la vida: encontrar trabajo sin que nadie te lo encargue.
//
// Módulo NEUTRO —sin "use client", sin importar React ni Supabase— por la razón
// de siempre: si esta regla viviera dentro del componente que la pinta, ningún
// gate podría mirarla. Es la lección de `puedeSembrar` y de las dos reglas de
// `/api/descanso`, y ya van doce.
//
// ⚠️ **Esto NO es `SaberRoll`.** Aquella tirada es de Historia, Arcanos o
// Religión y devuelve lo que tu personaje RECUERDA de un sitio. Esta es de
// Percepción, Perspicacia o Supervivencia y devuelve lo que hay AHÍ DELANTE
// ahora mismo. Una mira hacia dentro y la otra hacia fuera; mezclarlas haría
// que estudiar y mirar fueran lo mismo.

import { MISIONES, type Mision } from "@/data/misiones";

/** Las tres únicas pericias con las que se busca. */
export const PERICIAS_RASTREO = ["Percepción", "Perspicacia", "Supervivencia"] as const;
export type PericiaRastreo = (typeof PERICIAS_RASTREO)[number];

/** Una misión que se puede encontrar mirando, con su tirada ya resuelta. */
export type Rastro = {
  slug: string;
  titulo: string;
  pericia: PericiaRastreo;
  cd: number;
  /** Lo que se ve al acertar. Escrito desde los ojos del jugador. */
  texto: string;
};

/**
 * Qué se puede encontrar en este nodo.
 *
 * `nodoId` es un id de los de `lib/nodos.ts` (`poi:Byroden`, `franja:linde`,
 * `sub:Byroden/taberna`). Se cruza contra el `lugar` de cada misión, que es un
 * POI o una franja.
 *
 * ⚠️ **Un `sub:` hereda lo de su pueblo**, y a propósito: una misión escrita
 * «en Byroden» tiene que poder encontrarse estando en la taberna de Byroden. Sin
 * esta rama, entrar en un edificio haría desaparecer lo que se ve desde la
 * plaza, que es justo al revés de como funciona mirar.
 *
 * `yaDescubiertas` son los slugs que este personaje ya sacó: no se ofrecen dos
 * veces. Sin eso, la misma tirada se repite hasta que sale, y una CD deja de
 * significar nada.
 */
export function rastrosDe(nodoId: string, yaDescubiertas: readonly string[] = []): Rastro[] {
  const poi = poiDelNodo(nodoId);
  const hechas = new Set(yaDescubiertas);

  return MISIONES.filter((m) => {
    if (!m.descubrimiento) return false;
    if (hechas.has(m.slug)) return false;
    if (m.lugar === nodoId) return true;
    // El pueblo entero: `poi:Byroden` y `sub:Byroden/taberna` valen los dos para
    // una misión cuyo lugar sea «Byroden».
    return poi !== null && m.lugar === poi;
  }).map(rastroDe);
}

/** El POI al que pertenece un nodo, o `null` si no es de ninguno (las franjas). */
export function poiDelNodo(nodoId: string): string | null {
  if (nodoId.startsWith("poi:")) return nodoId.slice("poi:".length);
  if (nodoId.startsWith("sub:")) return nodoId.slice("sub:".length).split("/")[0] || null;
  return null;
}

/** Pasa una misión a rastro. Falla ruidosamente si no tenía `descubrimiento`. */
function rastroDe(m: Mision): Rastro {
  const d = m.descubrimiento!;
  return { slug: m.slug, titulo: m.titulo, pericia: d.pericia, cd: d.cd, texto: d.texto };
}

/**
 * ¿Se encuentra con este total?
 *
 * Un separado de una línea, sí, y va aquí igual: es LA comparación de la pieza,
 * y dentro del componente nadie podría comprobar que el empate cuenta como
 * éxito. En D&D sacar justo la CD acierta, y eso se olvida al reescribir.
 */
export function seEncuentra(rastro: Rastro, total: number): boolean {
  return total >= rastro.cd;
}
