// Saber del mundo por niveles (Fase N). La lore se estratifica en tres capas:
//  - comun: lo que cualquier habitante sabe (visible para todos).
//  - erudito: se desbloquea si el personaje tiene la pericia indicada.
//  - secreto: lo revela el DM (app_config.lore_revealed) o, en el futuro, una
//    tirada de saber in situ.
// Descripciones = redacción propia (convención del proyecto). Herramienta de
// fans no oficial ambientada en Exandria.

export type LoreTier = "comun" | "erudito" | "secreto";
// Pericias de saber que desbloquean lore erudita (nombres de data/rules.ts).
export type LoreSkill = "Historia" | "Arcanos" | "Religión" | "Naturaleza";

export type LoreEntry = {
  id: string;
  tier: LoreTier;
  unlockSkill?: LoreSkill; // solo en erudito
  topic: string;           // etiqueta corta de tema
  title: string;
  text: string;
};

// Historia BREVE: lo que cualquier habitante de Exandria sabría contarte en una
// taberna. El detalle (eras, Calamidad, cronología) ya no se regala en /reino:
// vive en el saber y se descubre estudiando, leyendo o jugando.
export const HISTORIA_BREVE = [
  "Hubo un tiempo en que los dioses caminaban por el mundo. Se pelearon, y su guerra dejó cicatrices que todavía se ven en el mapa.",
  "Al final de aquella guerra los dioses se retiraron tras una barrera, y el mundo empezó a contar los años de nuevo: eso es la Divergencia, el año 0.",
  "Desde entonces han pasado más de ocho siglos. Han caído imperios, se han fundado repúblicas y la mayoría de la gente vive sin pensar mucho en todo aquello.",
];

export const LORE_TIERS: LoreEntry[] = [
  // --- COMÚN -------------------------------------------------------------
  {
    id: "divergencia",
    tier: "comun",
    topic: "Historia",
    title: "La Divergencia y el año 0",
    text: "Todos saben que los dioses libraron una guerra terrible y que, al terminar, se alzó una barrera que los apartó del mundo mortal. Ese momento marca el año 0 del calendario Post-Divergencia (PD).",
  },
  {
    id: "taldorei-republica",
    tier: "comun",
    topic: "Política",
    title: "Tal'Dorei, la república",
    text: "Tal'Dorei se gobierna desde Emon a través del Consejo. Es tierra de ciudades prósperas, rutas de caravanas y una frontera salvaje que empieza donde acaban los caminos.",
  },
  {
    id: "lunas-calendario",
    tier: "comun",
    topic: "Cielo",
    title: "Las dos lunas",
    text: "Catha, la luna pálida, rige el calendario con su ciclo regular. La segunda luna, roja y errática, inquieta a quien la mira demasiado: la gente sencilla la considera de mal agüero.",
  },

  // --- ERUDITO: HISTORIA -------------------------------------------------
  {
    id: "calamidad",
    tier: "erudito",
    unlockSkill: "Historia",
    topic: "Historia",
    title: "La Calamidad",
    text: "Antes de la Divergencia, la guerra de los dioses y sus campeones arrasó continentes enteros: ciudades hundidas, mares abiertos y cicatrices que aún hoy deforman el mapa. Muchos eruditos fechan en ella el fin de la era de los grandes imperios arcanos.",
  },
  {
    id: "anos-hielo",
    tier: "erudito",
    unlockSkill: "Historia",
    topic: "Historia",
    title: "Los Años del Hielo",
    text: "Siglos atrás, el archimago Errevon el Señor de la Escarcha sumió a Tal'Dorei en un invierno perpetuo. Su derrota se recuerda cada Cima del Invierno; pocos saben cuánto costó realmente romper aquel hechizo.",
  },

  // --- ERUDITO: ARCANOS --------------------------------------------------
  {
    id: "planos",
    tier: "erudito",
    unlockSkill: "Arcanos",
    topic: "Cosmología",
    title: "Los planos de existencia",
    text: "Más allá del plano material se extienden los planos elementales, los reinos exteriores de los dioses y las profundidades del Abismo. La barrera de la Divergencia no separó a los dioses del cosmos, solo del mundo mortal.",
  },
  {
    id: "vestigios",
    tier: "erudito",
    unlockSkill: "Arcanos",
    topic: "Magia",
    title: "Los Vestigios de la Divergencia",
    text: "Se dice que ciertas armas y reliquias forjadas durante la Calamidad conservan una fracción del poder de aquella era, y que crecen en fuerza junto a quien las porta. La mayoría se consideran leyenda.",
  },

  // --- ERUDITO: RELIGIÓN -------------------------------------------------
  {
    id: "dioses-traidores",
    tier: "erudito",
    unlockSkill: "Religión",
    topic: "Panteón",
    title: "Los Dioses Traidores",
    text: "No todos los dioses lucharon del mismo lado. Los Traidores —entre ellos el Dios de la Mentira y la Reina Gusano— fueron los que provocaron la Calamidad, y su culto está proscrito en casi todo el continente.",
  },
  {
    id: "matriarca-cuervos",
    tier: "erudito",
    unlockSkill: "Religión",
    topic: "Panteón",
    title: "La Matriarca de Cuervos",
    text: "Diosa de la muerte y el destino, ascendida desde la mortalidad. Su culto vela por que las almas sigan su curso y persigue a quienes burlan la muerte; sus días santos caen en el corazón del invierno.",
  },

  // --- ERUDITO: NATURALEZA ----------------------------------------------
  {
    id: "ashari",
    tier: "erudito",
    unlockSkill: "Naturaleza",
    topic: "Pueblos",
    title: "Los Ashari",
    text: "Cuatro pueblos guardianes viven junto a los portales donde los planos elementales rozan el mundo, sellándolos con su vigilancia. Cada enclave —fuego, tierra, aire y agua— domina la magia de su elemento.",
  },
  {
    id: "tierras-salvajes",
    tier: "erudito",
    unlockSkill: "Naturaleza",
    topic: "Geografía",
    title: "Las tierras salvajes",
    text: "Más allá de las rutas comerciales, las Crestormentas y los bosques primigenios albergan gigantes, dragones y bestias que no figuran en ningún bestiario de ciudad. Quien lee el terreno sabe leer también sus peligros.",
  },

  // --- SECRETO (lo revela el DM) ----------------------------------------
  {
    id: "remanentes",
    tier: "secreto",
    topic: "Facciones",
    title: "Los Remanentes",
    text: "Restos de un poder antiguo que conspiran en las sombras para devolver al mundo algo que la Divergencia enterró. Sus agentes se infiltran donde menos se espera.",
  },
  {
    id: "garra-carmesi",
    tier: "secreto",
    topic: "Facciones",
    title: "La Garra Carmesí",
    text: "Un culto dracónico que sueña con el regreso de los tiranos alados. Reúne en secreto reliquias y aliados por todo Tal'Dorei, tejiendo una red mayor de lo que nadie sospecha.",
  },
  {
    id: "grieta-divergencia",
    tier: "secreto",
    topic: "Amenaza",
    title: "La barrera se debilita",
    text: "En ciertos lugares la frontera entre los planos ya no es lo que era. Quienes lo saben temen que la barrera de la Divergencia esté cediendo, y que algo aguarde al otro lado.",
  },
];

export const LORE_TIER_LABEL: Record<LoreTier, string> = {
  comun: "Común",
  erudito: "Erudito",
  secreto: "Secreto",
};
