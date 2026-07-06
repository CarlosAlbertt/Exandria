// Especies del PHB 2024. Descripciones originales y resumidas; los rasgos
// reflejan datos mecánicos del juego (factual). No reproducen texto del libro.

export type RegionKey =
  | "universal" | "taldorei" | "wildemount"
  | "marquet" | "issylra" | "underdark" | "oceans";

export type Lineage = { name: string; perk: string; image?: string; homebrew?: boolean };

export type Species = {
  slug: string;
  name: string;
  region: RegionKey;
  origin: string;
  size: string;
  speed: number;
  /** rasgos clave en una línea cada uno */
  traits: string[];
  /** linajes / subrazas elegibles */
  lineages?: Lineage[];
  tagline: string;
  blurb: string;
  image?: string;   // /species/<slug>.jpg
  homebrew?: boolean;
};

export const SPECIES: Species[] = [
  {
    slug: "humano",
    name: "Humano",
    region: "universal",
    origin: "La raza más numerosa: fundaron la República de Tal'Dorei, el Imperio Dwendaliano de Wildemount y Othanzia en Issylra.",
    size: "Mediano",
    speed: 9,
    tagline: "Ambición y adaptabilidad.",
    blurb: "Versátiles y resueltos, los humanos pueblan cada rincón de Exandria. Su vida corta los empuja a dejar huella pronto, para bien o para mal.",
    traits: ["Hábil: competencia en una pericia a elección", "Versátil: una dote de origen", "Ingenioso: Inspiración Heroica tras descanso largo"],
    lineages: [
      { name: "Humano Estándar", perk: "+1 a todas las características (variante clásica)." },
      { name: "Humano Variante", perk: "+1 a dos características, una pericia y una dote (variante clásica)." },
    ],
  },
  {
    slug: "elfo",
    name: "Elfo",
    region: "taldorei",
    origin: "Tras la Calamidad fundaron la inexpugnable Syngorn en el Bosque Verdeante; protectores, altivos, con la magia en la sangre.",
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
    region: "taldorei",
    origin: "Gobiernan Kraghammer, metrópolis subterránea bajo las Montañas Cliffkeep; estoicos maestros forjadores de runa y acero.",
    size: "Mediano",
    speed: 9,
    tagline: "Roca, forja y memoria de piedra.",
    blurb: "Tenaces como la montaña, los enanos de las Crestormentas guardan tradiciones de runa y acero. Su resistencia es legendaria.",
    traits: ["Visión en la oscuridad 18 m", "Resistencia Enana: ventaja vs. veneno y resistencia al daño", "Conocimiento de la Piedra: detectar trampas de piedra", "Tenacidad Enana: +1 PG por nivel"],
    lineages: [
      { name: "Enano de las Colinas", perk: "Aguante férreo: salud y puntos de golpe adicionales (variante clásica)." },
      { name: "Enano de las Montañas", perk: "Adiestramiento marcial: competencia con armadura ligera y media (variante clásica)." },
    ],
  },
  {
    slug: "mediano",
    name: "Mediano",
    region: "universal",
    origin: "Comunes en las llanuras agrícolas y ciudades humanas; en Tal'Dorei, famosos en Byroden y Kymal. Suerte innata y astucia comercial.",
    size: "Pequeño",
    speed: 7.5,
    tagline: "Suerte, valor y buen corazón.",
    blurb: "Pequeños pero indomables, los medianos afrontan el peligro con una sonrisa y una suerte que raya en lo sobrenatural.",
    traits: ["Suerte: repite un 1 en d20", "Valiente: ventaja contra el estado asustado", "Agilidad Mediana: moverse a través de criaturas mayores", "Sigilo Natural: esconderse tras criaturas grandes"],
    lineages: [
      { name: "Piesligeros", perk: "Sigilo natural y don social; puedes esconderte con facilidad (variante clásica)." },
      { name: "Fornido", perk: "Sangre robusta: ventaja vs. veneno y resistencia al daño venenoso (variante clásica)." },
    ],
  },
  {
    slug: "draconido",
    name: "Dracónido",
    region: "wildemount",
    origin: "Originarios de Wildemount; divididos históricamente en castas Draconblood (con cola, antiguos amos de Draconia) y Ravenite (sin cola, feroces).",
    size: "Mediano",
    speed: 9,
    tagline: "Sangre de dragón, aliento de furia.",
    blurb: "Herederos de la estirpe dracónica, llevan en la sangre el elemento de su linaje y un orgullo de escamas relucientes.",
    traits: ["Arma de Aliento según linaje", "Resistencia al daño del tipo de linaje", "Visión en la oscuridad 18 m", "Vuelo Dracónico a nivel 5"],
    lineages: [
      { name: "Negro", perk: "Linaje crómatico · daño de ácido." },
      { name: "Azul", perk: "Linaje crómatico · daño de rayo." },
      { name: "Verde", perk: "Linaje crómatico · daño de veneno." },
      { name: "Rojo", perk: "Linaje crómatico · daño de fuego." },
      { name: "Blanco", perk: "Linaje crómatico · daño de frío." },
      { name: "Latón", perk: "Linaje metálico · daño de fuego." },
      { name: "Bronce", perk: "Linaje metálico · daño de rayo." },
      { name: "Cobre", perk: "Linaje metálico · daño de ácido." },
      { name: "Oro", perk: "Linaje metálico · daño de fuego." },
      { name: "Plata", perk: "Linaje metálico · daño de frío." },
    ],
  },
  {
    slug: "gnomo",
    name: "Gnomo",
    region: "wildemount",
    origin: "En Hupperdook, ciudad gnoma de humo y chispas del Imperio Dwendaliano; grandes inventores de Exandria.",
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
    region: "universal",
    origin: "Descendientes de linajes tocados por los Dioses Traidores; temidos en el Imperio, libres y valorados en la Dinastía Kryn y en Tal'Dorei.",
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
    region: "issylra",
    origin: "Muy comunes en Issylra, el continente sagrado; suelen volverse paladines y clérigos de Vasselheim.",
    size: "Mediano",
    speed: 9,
    tagline: "Una chispa celestial en mortal.",
    blurb: "Tocados por lo divino, los aasimar irradian una luz interior. En la hora oscura, esa luz se vuelve revelación.",
    traits: ["Visión en la oscuridad 18 m", "Resistencia celestial: necrótico y radiante", "Manos Sanadoras: cura igual a tu nivel", "Revelación Celestial a nivel 3"],
    lineages: [
      { name: "Alas Celestiales", perk: "Revelación: alas de luz para volar." },
      { name: "Resplandor Interior", perk: "Revelación: luz radiante que daña a los cercanos." },
      { name: "Sudario Necrótico", perk: "Revelación: aura de muerte que asusta y daña." },
    ],
  },
  {
    slug: "goliat",
    name: "Goliat",
    region: "issylra",
    origin: "Nativos de las cumbres letales de Issylra y los Picos Flotantes; manadas que valoran la fuerza y la gloria en combate.",
    size: "Mediano",
    speed: 10.5,
    tagline: "Sangre de gigante, corazón de cumbre.",
    blurb: "Descendientes de gigantes, los goliat miden el valor por las hazañas. Sus dones reflejan el linaje gigante que portan.",
    traits: ["Constitución Gigante: ventaja vs. estado derribado", "Don de Linaje Gigante según ascendencia", "Poderoso: cuentas como una talla mayor al cargar"],
    lineages: [
      { name: "Gigante de las Nubes", perk: "Andares de Nube: teletransporte corto tras descanso." },
      { name: "Gigante de Fuego", perk: "Pisada Ardiente: daño de fuego en área al moverte." },
      { name: "Gigante de Escarcha", perk: "Aliento Gélido: reduce la velocidad de un enemigo." },
      { name: "Gigante de las Colinas", perk: "Pisotón Tambaleante: derriba a quien golpeas." },
      { name: "Gigante de Piedra", perk: "Resistencia Pétrea: reduce el daño recibido." },
      { name: "Gigante de las Tormentas", perk: "Trueno Vengativo: daño de trueno al ser herido." },
    ],
  },
  {
    slug: "orco",
    name: "Orco",
    region: "wildemount",
    origin: "Abundan en los páramos de Xhorhas; lejos de ser salvajes, muchos son ciudadanos, herreros y soldados de la Dinastía Kryn.",
    size: "Mediano",
    speed: 9,
    tagline: "Furia incansable y empuje implacable.",
    blurb: "Fuertes y de voluntad férrea, los orcos avanzan donde otros se rinden. Su resistencia los devuelve una y otra vez a la pelea.",
    traits: ["Visión en la oscuridad 36 m", "Empuje Adrenalínico: acción adicional para correr", "Resistencia Implacable: caer a 1 PG en vez de 0 una vez por descanso"],
  },
];

export const REGIONS: { key: RegionKey; label: string; blurb: string }[] = [
  { key: "universal", label: "Universales", blurb: "Sus pueblos se extienden por toda Exandria." },
  { key: "taldorei", label: "Tal'Dorei", blurb: "El continente clásico y salvaje del oeste." },
  { key: "wildemount", label: "Wildemount", blurb: "El continente dividido entre el Imperio y la Dinastía Kryn." },
  { key: "marquet", label: "Marquet", blurb: "Contrastes y arena; ciudades verticales y oasis." },
  { key: "issylra", label: "Issylra y las Ashari", blurb: "El continente sagrado y las fronteras elementales." },
  { key: "underdark", label: "Infraoscuridad y fronteras planares", blurb: "Culturas de las profundidades y de otros planos." },
  { key: "oceans", label: "Los océanos", blurb: "Lucidian, Ozmit y Los Dientes Destrozados." },
];

export function regionSpecies(key: RegionKey) {
  return SPECIES.filter((s) => s.region === key);
}

export function getSpecies(slug: string) {
  return SPECIES.find((s) => s.slug === slug);
}
