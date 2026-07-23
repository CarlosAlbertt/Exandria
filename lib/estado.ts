// Estado de combate 2024, PURO (sin React ni Supabase). Mismo espíritu que
// lib/recursos.ts / lib/derive.ts. Las mecánicas son hechos de las 2024; los
// textos de efecto son resúmenes propios, nunca prosa de los libros.
import type { PlayState } from "@/lib/recursos";

/** Sobre qué tiradas PROPIAS impone (des)ventaja una condición. */
export type TipoTirada = "ataque" | "prueba" | "salvez";

export type Condicion = {
  slug: string;
  name: string;
  icon: string;      // Font Awesome, sin el prefijo "fa-"
  regla: string;     // resumen propio del efecto
  desventaja?: TipoTirada[]; // desventaja en tus propias tiradas de estos tipos
};

// Las 15 condiciones de 2024. `desventaja` solo recoge lo EXACTO sin más
// contexto (ver el spec): lo que la RAW acota a una característica, o lo que da
// ventaja al atacante, no se modela aquí.
export const CONDICIONES: Condicion[] = [
  { slug: "cegado", name: "Cegado", icon: "eye-slash",
    regla: "No ves: fallas cualquier prueba que dependa de la vista. Atacar es con desventaja y quien te ataca lo hace con ventaja." },
  { slug: "hechizado", name: "Hechizado", icon: "heart",
    regla: "No puedes atacar a quien te hechizó ni elegirlo como objetivo de efectos dañinos. Esa criatura te influye con ventaja en tratos sociales." },
  { slug: "ensordecido", name: "Ensordecido", icon: "ear-deaf",
    regla: "No oyes: fallas cualquier prueba que dependa del oído." },
  { slug: "asustado", name: "Asustado", icon: "face-fearful",
    regla: "Mientras veas la fuente del miedo, tiras con desventaja las pruebas y los ataques, y no puedes acercarte a ella por tu voluntad.",
    desventaja: ["ataque", "prueba"] },
  { slug: "apresado", name: "Apresado", icon: "hand-back-fist",
    regla: "Tu velocidad es 0 y no te beneficias de bonificadores a ella. Termina si quien te apresa queda incapacitado o te sacan de su alcance." },
  { slug: "incapacitado", name: "Incapacitado", icon: "ban",
    regla: "No puedes realizar acciones, acciones adicionales ni reacciones. Se rompe tu concentración." },
  { slug: "invisible", name: "Invisible", icon: "ghost",
    regla: "No te ven sin ayuda mágica o un sentido especial. Atacas con ventaja y quien te ataca lo hace con desventaja." },
  { slug: "paralizado", name: "Paralizado", icon: "person-falling",
    regla: "Estás incapacitado, no te mueves ni hablas. Fallas las salvaciones de Fuerza y Destreza. Un ataque a menos de 1,5 m es crítico si acierta." },
  { slug: "petrificado", name: "Petrificado", icon: "gem",
    regla: "Te has vuelto piedra: incapacitado, sin moverte ni hablar, con resistencia a todo el daño e inmune a veneno y enfermedad. Fallas las salvaciones de Fuerza y Destreza." },
  { slug: "envenenado", name: "Envenenado", icon: "flask-vial",
    regla: "Tiras con desventaja las tiradas de ataque y las pruebas de característica.",
    desventaja: ["ataque", "prueba"] },
  { slug: "derribado", name: "Derribado", icon: "person-falling-burst",
    regla: "Solo puedes arrastrarte o gastar la mitad de tu velocidad en levantarte. Atacas con desventaja; quien te ataca a menos de 1,5 m lo hace con ventaja, y a distancia con desventaja.",
    desventaja: ["ataque"] },
  { slug: "restringido", name: "Restringido", icon: "link",
    regla: "Tu velocidad es 0. Atacas con desventaja y quien te ataca lo hace con ventaja. Salvas Destreza con desventaja.",
    desventaja: ["ataque"] },
  { slug: "aturdido", name: "Aturdido", icon: "star",
    regla: "Estás incapacitado, no te mueves y hablas con dificultad. Fallas las salvaciones de Fuerza y Destreza. Quien te ataca lo hace con ventaja." },
  { slug: "inconsciente", name: "Inconsciente", icon: "bed",
    regla: "Estás incapacitado, tirado y sin saber qué pasa. Sueltas lo que llevas. Fallas las salvaciones de Fuerza y Destreza; quien te ataca lo hace con ventaja, y a menos de 1,5 m es crítico si acierta." },
];

// Agotamiento 2024: cada nivel resta -2 acumulativo a las pruebas de d20 y
// -1,5 m de velocidad; a nivel 6, mueres. Índice 0 = "sin agotamiento".
export const AGOTAMIENTO: string[] = [
  "Sin agotamiento.",
  "Nivel 1: -2 a las pruebas de d20 y -1,5 m de velocidad.",
  "Nivel 2: -4 a las pruebas de d20 y -3 m de velocidad.",
  "Nivel 3: -6 a las pruebas de d20 y -4,5 m de velocidad.",
  "Nivel 4: -8 a las pruebas de d20 y -6 m de velocidad.",
  "Nivel 5: -10 a las pruebas de d20 y -7,5 m de velocidad.",
  "Nivel 6: mueres.",
];

// --- PG ----------------------------------------------------------------------

/** PG actuales; `hp` ausente ⇒ el máximo. Siempre en [0, maxHp]. */
export function pgActuales(play: PlayState, maxHp: number): number {
  const hp = typeof play.hp === "number" ? play.hp : maxHp;
  return Math.max(0, Math.min(maxHp, Math.floor(hp)));
}

/** PG temporales, nunca negativos. */
export function pgTemp(play: PlayState): number {
  return Math.max(0, Math.floor(play.tempHp ?? 0));
}

/** ¿Está a 0 PG (caído, tirando salvaciones)? */
export function estaAbajo(play: PlayState, maxHp: number): boolean {
  return pgActuales(play, maxHp) === 0;
}

/**
 * Aplica daño: come primero los temporales, luego los actuales, suelo 0.
 * Si YA estaba a 0 PG, no baja de 0 pero marca un fallo de muerte (dos si el
 * golpe fue crítico).
 */
export function aplicarDaño(play: PlayState, n: number, maxHp: number, critico = false): PlayState {
  const dmg = Math.max(0, Math.floor(n));
  if (estaAbajo(play, maxHp)) {
    const fails = critico ? 2 : 1;
    let next = play;
    for (let i = 0; i < fails; i++) next = marcarMuerte(next, "fail");
    return next;
  }
  const temp = pgTemp(play);
  const usadoTemp = Math.min(temp, dmg);
  const resto = dmg - usadoTemp;
  const hp = pgActuales(play, maxHp) - resto;
  return { ...play, tempHp: temp - usadoTemp, hp: Math.max(0, hp) };
}

/** Cura: sube los PG (techo maxHp). Levanta (borra `muerte`). No toca temporales. */
export function curar(play: PlayState, n: number, maxHp: number): PlayState {
  const cura = Math.max(0, Math.floor(n));
  const hp = Math.min(maxHp, pgActuales(play, maxHp) + cura);
  const next = { ...play, hp };
  delete next.muerte;
  return next;
}

/** Fija los PG temporales al valor dado (suelo 0). */
export function setTemp(play: PlayState, n: number): PlayState {
  return { ...play, tempHp: Math.max(0, Math.floor(n)) };
}

// --- Salvaciones de muerte ---------------------------------------------------

function muerteDe(play: PlayState): { ok: number; fail: number } {
  return { ok: play.muerte?.ok ?? 0, fail: play.muerte?.fail ?? 0 };
}

/** Marca un éxito o un fallo de salvación de muerte (tope 3). */
export function marcarMuerte(play: PlayState, tipo: "ok" | "fail"): PlayState {
  const m = muerteDe(play);
  m[tipo] = Math.min(3, m[tipo] + 1);
  return { ...play, muerte: m };
}

/** Desmarca un éxito o fallo (deshacer un toque, suelo 0). */
export function desmarcarMuerte(play: PlayState, tipo: "ok" | "fail"): PlayState {
  const m = muerteDe(play);
  m[tipo] = Math.max(0, m[tipo] - 1);
  return { ...play, muerte: m };
}

/** Veredicto de las salvaciones de muerte. `null` si no estás tirando. */
export function resultadoMuerte(play: PlayState): "estable" | "muerto" | "tirando" | null {
  if (!play.muerte) return null;
  const { ok, fail } = muerteDe(play);
  if (fail >= 3) return "muerto";
  if (ok >= 3) return "estable";
  return "tirando";
}
