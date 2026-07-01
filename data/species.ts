// Especies del PHB 2024. Descripciones originales y resumidas; los rasgos
// reflejan datos mecánicos del juego (factual). No reproducen texto del libro.

export type Species = {
  slug: string;
  name: string;
  size: string;
  speed: number;
  /** rasgos clave en una línea cada uno */
  traits: string[];
  /** linajes / subrazas elegibles */
  lineages?: { name: string; perk: string }[];
  tagline: string;
  blurb: string;
};

export const SPECIES: Species[] = [
  {
    slug: "humano",
    name: "Humano",
    size: "Mediano",
    speed: 9,
    tagline: "Ambición y adaptabilidad.",
    blurb: "Versátiles y resueltos, los humanos pueblan cada rincón de Tal'Dorei. Su ambición los lleva tan lejos como su ingenio.",
    traits: ["Hábil: competencia en una pericia a elección", "Versátil: una dote de origen", "Ingenioso: Inspiración Heroica tras descanso largo"],
  },
  {
    slug: "elfo",
    name: "Elfo",
    size: "Mediano",
    speed: 9,
    tagline: "Gracia inmortal y vínculo arcano.",
    blurb: "Longevos y de aguda percepción, los elfos sienten la trama mágica del mundo. Sus linajes los acercan al sol, a la sombra o al bosque.",
    traits: ["Visión en la oscuridad 18 m", "Sentidos Élficos: competencia en Percepción", "Linaje Feérico: ventaja contra el estado hechizado", "Trance: descanso largo en 4 horas"],
    lineages: [
      { name: "Alto Elfo", perk: "Truco de mago y modos de magia menores." },
      { name: "Elfo del Bosque", perk: "Velocidad 10,5 m y sigilo natural." },
      { name: "Drow", perk: "Visión en la oscuridad superior y magia innata." },
    ],
  },
  {
    slug: "enano",
    name: "Enano",
    size: "Mediano",
    speed: 9,
    tagline: "Roca, forja y memoria de piedra.",
    blurb: "Tenaces como la montaña, los enanos de las Crestormentas guardan tradiciones de runa y acero. Su resistencia es legendaria.",
    traits: ["Visión en la oscuridad 18 m", "Resistencia Enana: ventaja vs. veneno y resistencia al daño", "Conocimiento de la Piedra: detectar trampas de piedra", "Tenacidad Enana: +1 PG por nivel"],
  },
  {
    slug: "mediano",
    name: "Mediano",
    size: "Pequeño",
    speed: 7.5,
    tagline: "Suerte, valor y buen corazón.",
    blurb: "Pequeños pero indomables, los medianos afrontan el peligro con una sonrisa y una suerte que raya en lo sobrenatural.",
    traits: ["Suerte: repite un 1 en d20", "Valiente: ventaja contra el estado asustado", "Agilidad Mediana: moverse a través de criaturas mayores", "Sigilo Natural: esconderse tras criaturas grandes"],
  },
  {
    slug: "draconido",
    name: "Dracónido",
    size: "Mediano",
    speed: 9,
    tagline: "Sangre de dragón, aliento de furia.",
    blurb: "Herederos de la estirpe dracónica, llevan en la sangre el elemento de su linaje y un orgullo de escamas relucientes.",
    traits: ["Arma de Aliento según linaje", "Resistencia al daño del tipo de linaje", "Visión en la oscuridad 18 m", "Vuelo Dracónico a nivel 5"],
    lineages: [
      { name: "Crómatico / Metálico", perk: "Elige el tipo de daño: fuego, frío, ácido, veneno o rayo." },
    ],
  },
  {
    slug: "gnomo",
    name: "Gnomo",
    size: "Pequeño",
    speed: 7.5,
    tagline: "Curiosidad inagotable e ingenio arcano.",
    blurb: "Inventores, ilusionistas y bromistas, los gnomos abordan el mundo con una chispa de asombro imposible de apagar.",
    traits: ["Visión en la oscuridad 18 m", "Astucia Gnoma: ventaja en salvaciones de INT, SAB y CAR vs. magia"],
    lineages: [
      { name: "Gnomo de las Rocas", perk: "Artilugios mecánicos y conocimiento de artefactos." },
      { name: "Gnomo del Bosque", perk: "Truco de ilusión menor y hablar con bestias pequeñas." },
    ],
  },
  {
    slug: "tiefling",
    name: "Tiefling",
    size: "Mediano",
    speed: 9,
    tagline: "Un legado infernal que se porta con orgullo.",
    blurb: "Marcados por una herencia de otros planos, los tieflings cargan cuernos y miradas que inquietan, y una resiliencia forjada en el prejuicio.",
    traits: ["Visión en la oscuridad 18 m", "Legado planar: trucos y conjuros según el legado"],
    lineages: [
      { name: "Legado Infernal", perk: "Resistencia al fuego; conjuros infernales." },
      { name: "Legado Abisal", perk: "Resistencia al veneno; magia abisal." },
      { name: "Legado Ctónico", perk: "Resistencia al necrótico; magia de la muerte." },
    ],
  },
  {
    slug: "aasimar",
    name: "Aasimar",
    size: "Mediano",
    speed: 9,
    tagline: "Una chispa celestial en mortal.",
    blurb: "Tocados por lo divino, los aasimar irradian una luz interior. En la hora oscura, esa luz se vuelve revelación.",
    traits: ["Visión en la oscuridad 18 m", "Resistencia celestial: necrótico y radiante", "Manos Sanadoras: cura igual a tu nivel", "Revelación Celestial a nivel 3"],
  },
  {
    slug: "goliat",
    name: "Goliat",
    size: "Mediano",
    speed: 10.5,
    tagline: "Sangre de gigante, corazón de cumbre.",
    blurb: "Descendientes de gigantes, los goliat miden el valor por las hazañas. Sus dones reflejan el linaje gigante que portan.",
    traits: ["Constitución Gigante: ventaja vs. estado derribado", "Don de Linaje Gigante (fuego, escarcha, piedra, etc.)", "Poderoso: cuentas como una talla mayor al cargar"],
  },
  {
    slug: "orco",
    name: "Orco",
    size: "Mediano",
    speed: 9,
    tagline: "Furia incansable y empuje implacable.",
    blurb: "Fuertes y de voluntad férrea, los orcos avanzan donde otros se rinden. Su resistencia los devuelve una y otra vez a la pelea.",
    traits: ["Visión en la oscuridad 36 m", "Empuje Adrenalínico: acción adicional para correr", "Resistencia Implacable: caer a 1 PG en vez de 0 una vez por descanso"],
  },
];

export function getSpecies(slug: string) {
  return SPECIES.find((s) => s.slug === slug);
}
