// Datos mecánicos del bestiario (D&D 2024, Monster Manual). Hechos de juego:
// estadísticas, dados, CR/XP/BC, mecánica de rasgos/acciones. El texto
// descriptivo del manual NO se copia ni se traduce: `blurb` y el `text` de
// cada rasgo/acción son redacción PROPIA y concisa (1-2 frases, solo mecánica).

/** Rasgo, acción, acción adicional, reacción o acción legendaria de un monstruo. */
export type MonsterAbility = { name: string; text: string }; // text = mecánica en ES propio, conciso

export type Monster = {
  slug: string; // kebab del nombre ES
  name: string; // ES (traducción propia/convencional)
  nameEn: string; // nombre original (hecho)
  size: string; // "Mediano", "Grande"…
  type: string; // "Dragón", "No muerto"…
  alignment: string;
  ac: number;
  initiative: number; // modificador de iniciativa (p. ej. +2 → 2)
  hp: number;
  hpFormula: string; // "5d8 + 5"
  speeds: string; // "9 m, vuelo 18 m"
  abilities: Record<"fue" | "des" | "con" | "int" | "sab" | "car", number>;
  saves?: string;
  skills?: string;
  resistances?: string;
  immunities?: string;
  vulnerabilities?: string;
  gear?: string;
  senses: string;
  languages: string;
  cr: string;
  xp: number;
  pb: number; // "1/4", 50, 2
  traits?: MonsterAbility[];
  actions: MonsterAbility[];
  bonusActions?: MonsterAbility[];
  reactions?: MonsterAbility[];
  legendary?: MonsterAbility[];
  blurb: string; // 1-2 frases PROPIAS
  habitat?: string;
  treasure?: string; // hechos de la cabecera 2024
  image?: string; // URL Storage (Fase H, después)
};
