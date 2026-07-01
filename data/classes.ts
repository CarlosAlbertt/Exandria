// Clases del PHB 2024. Datos mecánicos (dado de golpe, aptitud principal,
// salvaciones, pericias, subclases). Descripciones originales y breves.

import type { AbilityKey } from "./rules";

export type CharClass = {
  slug: string;
  name: string;
  /** marcial | arcano | divino | primitivo — para color de acento */
  group: "marcial" | "arcano" | "divino" | "primitivo";
  hitDie: number;
  primary: AbilityKey[];
  saves: AbilityKey[];
  skillCount: number;
  /** lista de pericias elegibles (nombres exactos de rules.SKILLS) */
  skillList: string[];
  subclassLabel: string;
  subclasses: { name: string; blurb: string }[];
  tagline: string;
  blurb: string;
};

export const CLASSES: CharClass[] = [
  {
    slug: "barbaro", name: "Bárbaro", group: "primitivo", hitDie: 12,
    primary: ["fue"], saves: ["fue", "con"], skillCount: 2,
    skillList: ["Atletismo", "Intimidación", "Naturaleza", "Percepción", "Supervivencia", "Trato con Animales"],
    subclassLabel: "Senda primigenia",
    subclasses: [
      { name: "Árbol-Mundo", blurb: "Vida y vínculo con el árbol cósmico; resistencia y alcance." },
      { name: "Berserker", blurb: "Furia desatada y golpes extra al precio del agotamiento." },
      { name: "Corazón Salvaje", blurb: "Espíritus animales que otorgan dones según la bestia." },
      { name: "Fanático Celante", blurb: "Furia divina que castiga con daño necrótico o radiante." },
    ],
    tagline: "Furia primigenia hecha arma.",
    blurb: "Guerreros que canalizan una rabia ancestral. Donde otros calculan, el bárbaro carga.",
  },
  {
    slug: "bardo", name: "Bardo", group: "arcano", hitDie: 8,
    primary: ["car"], saves: ["des", "car"], skillCount: 3,
    skillList: ["Acrobacias", "Arcanos", "Atletismo", "Engaño", "Historia", "Interpretación", "Intimidación", "Investigación", "Juego de Manos", "Medicina", "Naturaleza", "Percepción", "Perspicacia", "Persuasión", "Religión", "Sigilo", "Supervivencia", "Trato con Animales"],
    subclassLabel: "Colegio bárdico",
    subclasses: [
      { name: "Colegio de la Danza", blurb: "Magia en movimiento; defensa y golpes ágiles." },
      { name: "Colegio del Glamour", blurb: "Encanto feérico que cautiva y protege a los aliados." },
      { name: "Colegio del Saber", blurb: "Erudición vasta y palabras cortantes." },
      { name: "Colegio del Valor", blurb: "Baladas de guerra que inspiran en el combate." },
    ],
    tagline: "La magia de la palabra y la canción.",
    blurb: "Maestros de mil oficios cuya música teje magia y reescribe el ánimo de una sala.",
  },
  {
    slug: "brujo", name: "Brujo", group: "arcano", hitDie: 8,
    primary: ["car"], saves: ["sab", "car"], skillCount: 2,
    skillList: ["Arcanos", "Engaño", "Historia", "Intimidación", "Investigación", "Naturaleza", "Religión"],
    subclassLabel: "Patrón sobrenatural",
    subclasses: [
      { name: "El Celestial", blurb: "Pacto de luz; curación y fuego radiante." },
      { name: "El Feérico", blurb: "Magia de la corte feérica; teletransporte y encanto." },
      { name: "El Infernal", blurb: "Pacto abisal; resistencia y maldiciones." },
      { name: "El Gran Antiguo", blurb: "Susurros de una mente alienígena; poder psíquico." },
    ],
    tagline: "Poder a cambio de un pacto.",
    blurb: "Lanzadores que arrancan magia a un patrón de otro plano. Cada don tiene su precio.",
  },
  {
    slug: "clerigo", name: "Clérigo", group: "divino", hitDie: 8,
    primary: ["sab"], saves: ["sab", "car"], skillCount: 2,
    skillList: ["Historia", "Medicina", "Perspicacia", "Persuasión", "Religión"],
    subclassLabel: "Dominio divino",
    subclasses: [
      { name: "Dominio de la Vida", blurb: "Curación poderosa y protección de los aliados." },
      { name: "Dominio de la Luz", blurb: "Fuego radiante y resplandor cegador." },
      { name: "Dominio del Engaño", blurb: "Ilusiones, sigilo y bendiciones traicioneras." },
      { name: "Dominio de la Guerra", blurb: "Bendiciones marciales y ataques divinos." },
    ],
    tagline: "Conducto de la voluntad de un dios.",
    blurb: "Campeones de una deidad de Exandria. Sanan, protegen y desatan poder divino.",
  },
  {
    slug: "druida", name: "Druida", group: "primitivo", hitDie: 8,
    primary: ["sab"], saves: ["int", "sab"], skillCount: 2,
    skillList: ["Arcanos", "Medicina", "Naturaleza", "Percepción", "Perspicacia", "Religión", "Supervivencia", "Trato con Animales"],
    subclassLabel: "Círculo druídico",
    subclasses: [
      { name: "Círculo de la Luna", blurb: "Forma Salvaje feroz para combatir como bestia." },
      { name: "Círculo de la Tierra", blurb: "Magia ligada al terreno y conjuros extra." },
      { name: "Círculo de las Estrellas", blurb: "Constelaciones que guían curación y daño." },
      { name: "Círculo del Mar", blurb: "Tormentas y mareas al servicio del druida." },
    ],
    tagline: "La voz de lo salvaje.",
    blurb: "Guardianes de la naturaleza que adoptan forma de bestia y dominan la magia primigenia.",
  },
  {
    slug: "explorador", name: "Explorador", group: "primitivo", hitDie: 10,
    primary: ["des", "sab"], saves: ["fue", "des"], skillCount: 3,
    skillList: ["Atletismo", "Investigación", "Naturaleza", "Percepción", "Perspicacia", "Sigilo", "Supervivencia", "Trato con Animales"],
    subclassLabel: "Arquetipo del explorador",
    subclasses: [
      { name: "Cazador", blurb: "Especialista en abatir presas grandes o numerosas." },
      { name: "Errante Feérico", blurb: "Magia feérica, encanto y desplazamiento." },
      { name: "Señor de las Bestias", blurb: "Un compañero animal que lucha a tu lado." },
      { name: "Acechador Sombrío", blurb: "Sigilo sobrenatural y golpes desde la penumbra." },
    ],
    tagline: "Cazador entre la espada y la magia.",
    blurb: "Rastreadores letales que combinan destreza marcial con magia de la naturaleza.",
  },
  {
    slug: "guerrero", name: "Guerrero", group: "marcial", hitDie: 10,
    primary: ["fue", "des"], saves: ["fue", "con"], skillCount: 2,
    skillList: ["Acrobacias", "Atletismo", "Historia", "Intimidación", "Percepción", "Perspicacia", "Persuasión", "Supervivencia"],
    subclassLabel: "Arquetipo marcial",
    subclasses: [
      { name: "Campeón", blurb: "Maestría física pura: críticos y atletismo." },
      { name: "Maestro de Batalla", blurb: "Maniobras tácticas que controlan el combate." },
      { name: "Caballero Arcano", blurb: "Acero y conjuros de mago entrelazados." },
      { name: "Guerrero Psiónico", blurb: "Poder mental que potencia ataques y defensa." },
    ],
    tagline: "La maestría absoluta de las armas.",
    blurb: "Combatientes consumados, versátiles en cualquier arma y armadura. Atacan más que nadie.",
  },
  {
    slug: "hechicero", name: "Hechicero", group: "arcano", hitDie: 6,
    primary: ["car"], saves: ["con", "car"], skillCount: 2,
    skillList: ["Arcanos", "Engaño", "Intimidación", "Perspicacia", "Persuasión", "Religión"],
    subclassLabel: "Origen de hechicería",
    subclasses: [
      { name: "Hechicería Dracónica", blurb: "Sangre de dragón: resistencia y daño elemental." },
      { name: "Magia Salvaje", blurb: "Caos arcano impredecible con cada conjuro." },
      { name: "Hechicería Aberrante", blurb: "Poder psiónico de origen alienígena." },
      { name: "Hechicería Mecánica", blurb: "Orden de Mechanus: precisión y protección." },
    ],
    tagline: "Magia que brota de la propia sangre.",
    blurb: "Lanzadores natos que moldean la magia con Metamagia. El poder vive en ellos.",
  },
  {
    slug: "mago", name: "Mago", group: "arcano", hitDie: 6,
    primary: ["int"], saves: ["int", "sab"], skillCount: 2,
    skillList: ["Arcanos", "Historia", "Investigación", "Medicina", "Naturaleza", "Perspicacia", "Religión"],
    subclassLabel: "Tradición arcana",
    subclasses: [
      { name: "Abjurador", blurb: "Escudos arcanos y defensa contra la magia." },
      { name: "Adivino", blurb: "Atisbar el futuro y reescribir tiradas." },
      { name: "Evocador", blurb: "Explosiones de energía sin dañar a los aliados." },
      { name: "Ilusionista", blurb: "Engaños mágicos que doblan la realidad." },
    ],
    tagline: "El estudio que desentraña el cosmos.",
    blurb: "Eruditos de la magia con el grimorio más amplio. Estudio, no instinto.",
  },
  {
    slug: "monje", name: "Monje", group: "marcial", hitDie: 8,
    primary: ["des", "sab"], saves: ["fue", "des"], skillCount: 2,
    skillList: ["Acrobacias", "Atletismo", "Historia", "Interpretación", "Perspicacia", "Religión", "Sigilo"],
    subclassLabel: "Tradición marcial",
    subclasses: [
      { name: "Mano Abierta", blurb: "Maestría del combate sin armas: empujar y derribar." },
      { name: "Misericordia", blurb: "Ki que cura a los aliados o marchita a los enemigos." },
      { name: "Elementos", blurb: "Canaliza ki en ráfagas elementales a distancia." },
      { name: "Sombra", blurb: "Sigilo, oscuridad y teletransporte entre sombras." },
    ],
    tagline: "Cuerpo y mente como una sola arma.",
    blurb: "Artistas marciales que canalizan el ki para golpear rápido y moverse imposiblemente.",
  },
  {
    slug: "paladin", name: "Paladín", group: "divino", hitDie: 10,
    primary: ["fue", "car"], saves: ["sab", "car"], skillCount: 2,
    skillList: ["Atletismo", "Intimidación", "Medicina", "Perspicacia", "Persuasión", "Religión"],
    subclassLabel: "Juramento sagrado",
    subclasses: [
      { name: "Juramento de Entrega", blurb: "El ideal del caballero: honor y protección." },
      { name: "Juramento de Gloria", blurb: "Heroísmo atlético que inspira hazañas." },
      { name: "Juramento de los Antiguos", blurb: "Defensa de la luz y la vida feérica." },
      { name: "Juramento de Venganza", blurb: "Cazador implacable de los culpables." },
    ],
    tagline: "Acero sagrado y juramento inquebrantable.",
    blurb: "Guerreros sagrados ligados a un juramento. Castigan con daño radiante y curan con imposición de manos.",
  },
  {
    slug: "picaro", name: "Pícaro", group: "marcial", hitDie: 8,
    primary: ["des"], saves: ["des", "int"], skillCount: 4,
    skillList: ["Acrobacias", "Atletismo", "Engaño", "Interpretación", "Intimidación", "Investigación", "Juego de Manos", "Percepción", "Perspicacia", "Persuasión", "Sigilo"],
    subclassLabel: "Arquetipo de pícaro",
    subclasses: [
      { name: "Ladrón", blurb: "Manos rápidas, escalada y uso de objetos mágicos." },
      { name: "Asesino", blurb: "Golpes letales por sorpresa e infiltración." },
      { name: "Embaucador Arcano", blurb: "Magia de ilusión y encantamiento al servicio del robo." },
      { name: "Alma-Cuchilla", blurb: "Hojas psiónicas y teletransporte mental." },
    ],
    tagline: "El golpe certero desde las sombras.",
    blurb: "Expertos del sigilo y la precisión. Su Ataque Furtivo convierte una apertura en una herida mortal.",
  },
];

export function getClass(slug: string) {
  return CLASSES.find((c) => c.slug === slug);
}

export const GROUP_ACCENT: Record<CharClass["group"], string> = {
  marcial: "var(--color-marcial)",
  arcano: "var(--color-arcano)",
  divino: "var(--color-divino)",
  primitivo: "var(--color-primitivo)",
};
export const GROUP_LABEL: Record<CharClass["group"], string> = {
  marcial: "Marcial", arcano: "Arcano", divino: "Divino", primitivo: "Primigenio",
};
