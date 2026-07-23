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
