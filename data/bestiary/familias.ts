// FAMILIAS de despiece: qué monstruos dan lo mismo al abrirlos.
//
// La regla, decidida con el DM el 2026-08-06, y no es «agrupar para ahorrar»:
// **separa lo que da material distinto, junta lo que da el mismo.**
//
//   - Una escama de dragón ROJO no es una de dragón BLANCO → el color separa,
//     y por eso las 40 fichas de dragón son 10 familias y no una.
//   - La EDAD **no parte la familia, pero tampoco da igual**: la escama sigue
//     siendo de dragón rojo, pero un anciano es otra liga. Se resuelve por
//     GRADO dentro de la familia (`data/despiece.ts`): lo normal sale de
//     cualquiera, y lo superior **solo de adulto y anciano**. Es el patrón que
//     el catálogo ya usaba con «Diente de Vampiro Anciano».
//     Y la dificultad y el número de piezas ya salen del CR y del tamaño.
//   - Un mefito de hielo no da lo mismo que uno de magma → el elemento separa.
//   - Del monodrón al pentadrón sale el mismo metal → una familia.
//
// Y lo que **no se despieza**: el tipo Humanoide entero. En el manual 2024 ese
// tipo es literalmente gente —plebeyos, guardias, espías, bandidos, magos—,
// porque trasgos, sirénidos y yuan-ti se mudaron a Fey, Elemental y
// Monstruosidad. Despiezar personas no entra en la campaña, y va escrito aquí
// en vez de derivado de una regla, para que sea una decisión y no un efecto.
//
// El despiece cuelga de la FAMILIA, no del statblock: `data/despiece.ts` lo
// resuelve monstruo → familia → materiales.

/** Familia de despiece: los que se abren igual y dan lo mismo. */
export type Familia = {
  /** Cómo se llama en la interfaz. */
  label: string;
  /** Miembros por su `nameEn` del censo (`censo-manual.ts`). */
  miembros: string[];
};

export const FAMILIAS: Record<string, Familia> = {
  // --- Dragones: por COLOR, no por edad -------------------------------------
  "dragon-negro": { label: "Dragón negro", miembros: ["Black Dragon Wyrmling", "Young Black Dragon", "Adult Black Dragon", "Ancient Black Dragon"] },
  "dragon-azul": { label: "Dragón azul", miembros: ["Blue Dragon Wyrmling", "Young Blue Dragon", "Adult Blue Dragon", "Ancient Blue Dragon"] },
  "dragon-verde": { label: "Dragón verde", miembros: ["Green Dragon Wyrmling", "Young Green Dragon", "Adult Green Dragon", "Ancient Green Dragon"] },
  "dragon-rojo": { label: "Dragón rojo", miembros: ["Red Dragon Wyrmling", "Young Red Dragon", "Adult Red Dragon", "Ancient Red Dragon"] },
  "dragon-blanco": { label: "Dragón blanco", miembros: ["White Dragon Wyrmling", "Young White Dragon", "Adult White Dragon", "Ancient White Dragon"] },
  "dragon-laton": { label: "Dragón de latón", miembros: ["Brass Dragon Wyrmling", "Young Brass Dragon", "Adult Brass Dragon", "Ancient Brass Dragon"] },
  "dragon-bronce": { label: "Dragón de bronce", miembros: ["Bronze Dragon Wyrmling", "Young Bronze Dragon", "Adult Bronze Dragon", "Ancient Bronze Dragon"] },
  "dragon-cobre": { label: "Dragón de cobre", miembros: ["Copper Dragon Wyrmling", "Young Copper Dragon", "Adult Copper Dragon", "Ancient Copper Dragon"] },
  "dragon-oro": { label: "Dragón de oro", miembros: ["Gold Dragon Wyrmling", "Young Gold Dragon", "Adult Gold Dragon", "Ancient Gold Dragon"] },
  "dragon-plata": { label: "Dragón de plata", miembros: ["Silver Dragon Wyrmling", "Young Silver Dragon", "Adult Silver Dragon", "Ancient Silver Dragon"] },
  "dragon-sombra": { label: "Dragón de sombra", miembros: ["Juvenile Shadow Dragon", "Shadow Dragon", "Dracolich"] },
  "dragon-feerico": { label: "Dragón feérico", miembros: ["Faerie Dragon Adult", "Faerie Dragon Youth"] },
  "tortuga-dragon": { label: "Tortuga dragón", miembros: ["Dragon Turtle"] },
  "pseudodragon": { label: "Pseudodragón", miembros: ["Pseudodragon"] },
  "wyvern": { label: "Wyvern", miembros: ["Wyvern"] },
  kobold: { label: "Kóbold", miembros: ["Kobold Warrior", "Winged Kobold"] },
  "medio-dragon": { label: "Medio dragón", miembros: ["Half-Dragon"] },

  // --- Elementales y genios: por ELEMENTO -----------------------------------
  "elemental-aire": { label: "Elemental de aire", miembros: ["Air Elemental", "Invisible Stalker", "Djinni", "Aarakocra Aeromancer", "Aarakocra Skirmisher"] },
  "elemental-tierra": { label: "Elemental de tierra", miembros: ["Earth Elemental", "Galeb Duhr", "Gargoyle", "Xorn", "Dao"] },
  "elemental-fuego": { label: "Elemental de fuego", miembros: ["Fire Elemental", "Magmin", "Efreeti", "Azer Pyromancer", "Azer Sentinel", "Salamander", "Salamander Fire Snake", "Salamander Inferno Master"] },
  "elemental-agua": { label: "Elemental de agua", miembros: ["Water Elemental", "Water Weird", "Marid", "Merfolk Skirmisher", "Merfolk Wavebender"] },
  "elemental-cataclismo": { label: "Cataclismo elemental", miembros: ["Elemental Cataclysm"] },
  // Los mefitos NO se juntan: cada uno destila su elemento.
  "mefito-polvo": { label: "Mefito de polvo", miembros: ["Dust Mephit"] },
  "mefito-hielo": { label: "Mefito de hielo", miembros: ["Ice Mephit"] },
  "mefito-magma": { label: "Mefito de magma", miembros: ["Magma Mephit"] },
  "mefito-lodo": { label: "Mefito de lodo", miembros: ["Mud Mephit"] },
  "mefito-humo": { label: "Mefito de humo", miembros: ["Smoke Mephit"] },
  "mefito-vapor": { label: "Mefito de vapor", miembros: ["Steam Mephit"] },
  "hombre-lagarto": { label: "Hombre lagarto", miembros: ["Lizardfolk Geomancer", "Lizardfolk Sovereign"] },

  // --- Constructos: el material es el metal o la piedra ---------------------
  modron: { label: "Modrón", miembros: ["Modron Monodrone", "Modron Duodrone", "Modron Tridrone", "Modron Quadrone", "Modron Pentadrone"] },
  "golem-arcilla": { label: "Gólem de arcilla", miembros: ["Clay Golem"] },
  "golem-carne": { label: "Gólem de carne", miembros: ["Flesh Golem"] },
  "golem-hierro": { label: "Gólem de hierro", miembros: ["Iron Golem", "Colossus"] },
  "golem-piedra": { label: "Gólem de piedra", miembros: ["Stone Golem"] },
  "objeto-animado": { label: "Objeto animado", miembros: ["Animated Armor", "Animated Broom", "Animated Flying Sword", "Animated Rug of Smothering", "Helmed Horror", "Shield Guardian"] },
  gorgona: { label: "Gorgona", miembros: ["Gorgon", "Brazen Gorgon"] },
  homunculo: { label: "Homúnculo", miembros: ["Homunculus"] },
  espantapajaros: { label: "Espantapájaros", miembros: ["Scarecrow"] },

  // --- No muertos: separa el material, no el poder --------------------------
  esqueleto: { label: "Esqueleto", miembros: ["Skeleton", "Minotaur Skeleton", "Warhorse Skeleton", "Flaming Skeleton", "Flameskull", "Bone Naga", "Crawling Claw", "Swarm of Crawling Claws"] },
  zombi: { label: "Zombi", miembros: ["Zombie", "Ogre Zombie", "Beholder Zombie"] },
  vampiro: { label: "Vampiro", miembros: ["Vampire", "Vampire Spawn", "Vampire Nightbringer", "Vampire Umbral Lord"] },
  momia: { label: "Momia", miembros: ["Mummy", "Mummy Lord"] },
  gul: { label: "Gul", miembros: ["Ghoul", "Ghast", "Ghast Gravecaller", "Lacedon Ghoul"] },
  espectro: { label: "Espectro", miembros: ["Specter", "Ghost", "Shadow", "Wraith", "Poltergeist", "Will-o'-Wisp", "Banshee"] },
  "no-muerto-mayor": { label: "No muerto mayor", miembros: ["Lich", "Demilich", "Death Knight", "Death Knight Aspirant", "Death Tyrant"] },
  espectral: { label: "Vengador espectral", miembros: ["Revenant", "Graveyard Revenant", "Haunting Revenant"] },
  "espectro-tumba": { label: "Espectro de tumba", miembros: ["Wight"] },

  // --- Bestias: por lo que dan al despiezar ---------------------------------
  oso: { label: "Oso", miembros: ["Black Bear", "Brown Bear", "Polar Bear", "Giant Badger", "Badger"] },
  lobo: { label: "Lobo", miembros: ["Wolf", "Dire Wolf", "Jackal", "Death Dog"] },
  felino: { label: "Felino", miembros: ["Cat", "Panther", "Lion", "Tiger", "Saber-Toothed Tiger"] },
  simio: { label: "Simio", miembros: ["Ape", "Giant Ape", "Baboon"] },
  ungulado: { label: "Ungulado", miembros: ["Deer", "Elk", "Goat", "Giant Goat", "Camel", "Mule", "Pony", "Riding Horse", "Draft Horse", "Warhorse", "Mastiff"] },
  paquidermo: { label: "Paquidermo", miembros: ["Elephant", "Mammoth", "Rhinoceros", "Hippopotamus"] },
  "jabali": { label: "Jabalí", miembros: ["Boar", "Giant Boar"] },
  hiena: { label: "Hiena", miembros: ["Hyena", "Giant Hyena"] },
  ave: { label: "Ave", miembros: ["Eagle", "Hawk", "Blood Hawk", "Owl", "Raven", "Vulture", "Swarm of Ravens", "Axe Beak", "Giant Axe Beak", "Giant Vulture"] },
  roedor: { label: "Roedor", miembros: ["Rat", "Giant Rat", "Weasel", "Giant Weasel", "Swarm of Rats"] },
  murcielago: { label: "Murciélago", miembros: ["Bat", "Giant Bat", "Swarm of Bats"] },
  reptil: { label: "Reptil", miembros: ["Lizard", "Giant Lizard", "Crocodile", "Giant Crocodile"] },
  serpiente: { label: "Serpiente", miembros: ["Venomous Snake", "Giant Venomous Snake", "Constrictor Snake", "Giant Constrictor Snake", "Swarm of Venomous Snakes", "Flying Snake"] },
  anfibio: { label: "Anfibio", miembros: ["Frog", "Giant Frog", "Giant Toad"] },
  aracnido: { label: "Arácnido", miembros: ["Spider", "Giant Spider", "Giant Wolf Spider", "Ettercap"] },
  insecto: { label: "Insecto", miembros: ["Giant Centipede", "Giant Fire Beetle", "Giant Wasp", "Swarm of Insects", "Stirge", "Swarm of Stirges"] },
  escorpion: { label: "Escorpión", miembros: ["Scorpion", "Giant Scorpion"] },
  pez: { label: "Pez", miembros: ["Piranha", "Swarm of Piranhas", "Reef Shark", "Hunter Shark", "Giant Shark", "Seahorse", "Giant Seahorse"] },
  cefalopodo: { label: "Cefalópodo", miembros: ["Octopus", "Giant Octopus", "Giant Squid"] },
  crustaceo: { label: "Crustáceo", miembros: ["Crab", "Giant Crab"] },
  cetaceo: { label: "Cetáceo", miembros: ["Killer Whale", "Plesiosaurus", "Archelon"] },
  dinosaurio: { label: "Dinosaurio", miembros: ["Allosaurus", "Ankylosaurus", "Pteranodon", "Triceratops", "Tyrannosaurus Rex"] },

  // --- Monstruosidades ------------------------------------------------------
  basilisco: { label: "Basilisco", miembros: ["Basilisk"] },
  cocatriz: { label: "Cocatriz", miembros: ["Cockatrice", "Cockatrice Regent"] },
  medusa: { label: "Medusa", miembros: ["Medusa"] },
  manticora: { label: "Mantícora", miembros: ["Manticore"] },
  quimera: { label: "Quimera", miembros: ["Chimera"] },
  grifo: { label: "Grifo", miembros: ["Griffon", "Hippogriff", "Peryton"] },
  "oso-lechuza": { label: "Oso lechuza", miembros: ["Owlbear", "Primeval Owlbear"] },
  hidra: { label: "Hidra", miembros: ["Hydra"] },
  kraken: { label: "Kraken", miembros: ["Kraken"] },
  roc: { label: "Roc", miembros: ["Roc"] },
  behir: { label: "Behir", miembros: ["Behir"] },
  bulette: { label: "Bulette", miembros: ["Bulette", "Bulette Pup"] },
  ankheg: { label: "Ankheg", miembros: ["Ankheg", "Carrion Crawler", "Umber Hulk", "Hook Horror"] },
  remorhaz: { label: "Remorhaz", miembros: ["Remorhaz", "Young Remorhaz"] },
  "gusano-purpura": { label: "Gusano púrpura", miembros: ["Purple Worm"] },
  tarrasca: { label: "Tarrasca", miembros: ["Tarrasque"] },
  "arana-de-fase": { label: "Araña de fase", miembros: ["Phase Spider"] },
  drider: { label: "Drider", miembros: ["Drider"] },
  "bestia-desplazadora": { label: "Bestia desplazadora", miembros: ["Displacer Beast"] },
  arpia: { label: "Arpía", miembros: ["Harpy"] },
  kenku: { label: "Kenku", miembros: ["Kenku"] },
  mimico: { label: "Mímico", miembros: ["Mimic"] },
  minotauro: { label: "Minotauro", miembros: ["Minotaur of Baphomet"] },
  "yuan-ti": { label: "Yuan-ti", miembros: ["Yuan-ti Abomination", "Yuan-ti Infiltrator", "Yuan-ti Malison", "Spirit Naga", "Guardian Naga"] },
  licantropo: { label: "Licántropo", miembros: ["Werebear", "Wereboar", "Wererat", "Weretiger", "Werewolf", "Jackalwere"] },
  yeti: { label: "Yeti", miembros: ["Yeti", "Abominable Yeti", "Winter Wolf"] },
  "thri-kreen": { label: "Thri-kreen", miembros: ["Thri-kreen Marauder", "Thri-kreen Psion"] },
  troglodita: { label: "Troglodita", miembros: ["Troglodyte", "Quaggoth", "Quaggoth Thonot", "Merrow"] },
  doppelganger: { label: "Doppelganger", miembros: ["Doppelganger"] },
  "rust-monster": { label: "Monstruo oxidífero", miembros: ["Rust Monster"] },

  // --- Aberraciones ---------------------------------------------------------
  contemplador: { label: "Contemplador", miembros: ["Beholder", "Spectator"] },
  azotamentes: { label: "Azotamentes", miembros: ["Mind Flayer", "Mind Flayer Arcanist", "Intellect Devourer"] },
  aboleth: { label: "Aboleth", miembros: ["Aboleth"] },
  slaad: { label: "Slaad", miembros: ["Blue Slaad", "Death Slaad", "Gray Slaad", "Green Slaad", "Red Slaad", "Slaad Tadpole"] },
  githyanki: { label: "Githyanki", miembros: ["Githyanki Dracomancer", "Githyanki Knight", "Githyanki Soldier"] },
  githzerai: { label: "Githzerai", miembros: ["Githzerai Monk", "Githzerai Psion", "Githzerai Zerth"] },
  "kuo-toa": { label: "Kuo-toa", miembros: ["Kuo-toa", "Kuo-toa Archpriest", "Kuo-toa Monitor", "Kuo-toa Whip"] },
  chuul: { label: "Chuul", miembros: ["Chuul"] },
  cloaker: { label: "Cloaker", miembros: ["Cloaker", "Darkmantle"] },
  flumph: { label: "Flumph", miembros: ["Flumph"] },
  grick: { label: "Grick", miembros: ["Grick", "Grick Ancient", "Grell", "Roper", "Piercer"] },
  grimlock: { label: "Grimlock", miembros: ["Grimlock", "Nothic"] },
  otyugh: { label: "Otyugh", miembros: ["Otyugh", "Gibbering Mouther"] },

  // --- Feéricos -------------------------------------------------------------
  trasgo: { label: "Trasgo", miembros: ["Goblin Boss", "Goblin Hexer", "Goblin Minion", "Goblin Warrior"] },
  hobgoblin: { label: "Hobgoblin", miembros: ["Hobgoblin Captain", "Hobgoblin Warlord", "Hobgoblin Warrior"] },
  osgo: { label: "Osgo", miembros: ["Bugbear Stalker", "Bugbear Warrior"] },
  bruja: { label: "Bruja feérica", miembros: ["Green Hag", "Sea Hag", "Night Hag", "Arch-hag"] },
  duende: { label: "Duende", miembros: ["Pixie", "Pixie Wonderbringer", "Sprite", "Blink Dog"] },
  satiro: { label: "Sátiro", miembros: ["Satyr", "Satyr Revelmaster", "Centaur Trooper", "Centaur Warden"] },
  driada: { label: "Dríade", miembros: ["Dryad"] },
  bullywug: { label: "Bullywug", miembros: ["Bullywug Bog Sage", "Bullywug Warrior"] },
  worg: { label: "Worg", miembros: ["Worg", "Dire Worg"] },

  // --- Infernales y demoníacos ---------------------------------------------
  demonio: { label: "Demonio", miembros: ["Balor", "Barlgura", "Chasme", "Dretch", "Glabrezu", "Goristro", "Hezrou", "Manes", "Manes Vaporspawn", "Marilith", "Nalfeshnee", "Quasit", "Shadow Demon", "Vrock", "Yochlol", "Swarm of Dretches"] },
  diablo: { label: "Diablo", miembros: ["Barbed Devil", "Bearded Devil", "Bone Devil", "Chain Devil", "Erinyes", "Horned Devil", "Ice Devil", "Imp", "Pit Fiend", "Spined Devil", "Lemure", "Larva", "Swarm of Larvae", "Swarm of Lemures"] },
  yugoloth: { label: "Yugoloth", miembros: ["Arcanaloth", "Mezzoloth", "Nycaloth", "Ultroloth"] },
  gnoll: { label: "Gnoll", miembros: ["Gnoll Demoniac", "Gnoll Fang of Yeenoghu", "Gnoll Pack Lord", "Gnoll Warrior"] },
  sahuagin: { label: "Sahuagin", miembros: ["Sahuagin Baron", "Sahuagin Priest", "Sahuagin Warrior"] },
  incubo: { label: "Íncubo y súcubo", miembros: ["Incubus", "Succubus", "Cambion"] },
  rakshasa: { label: "Rakshasa", miembros: ["Rakshasa"] },
  oni: { label: "Oni", miembros: ["Oni", "Lamia"] },
  "sabueso-infernal": { label: "Sabueso infernal", miembros: ["Hell Hound", "Nightmare"] },

  // --- Celestiales ----------------------------------------------------------
  angel: { label: "Ángel", miembros: ["Deva", "Planetar", "Solar"] },
  esfinge: { label: "Esfinge", miembros: ["Sphinx of Lore", "Sphinx of Secrets", "Sphinx of Valor", "Sphinx of Wonder"] },
  unicornio: { label: "Unicornio", miembros: ["Unicorn", "Pegasus"] },
  couatl: { label: "Couatl", miembros: ["Couatl"] },
  "bestia-celestial": { label: "Bestia celestial", miembros: ["Giant Eagle", "Giant Elk", "Giant Owl", "Animal Lord"] },
  empireo: { label: "Empíreo", miembros: ["Empyrean", "Empyrean Iota"] },

  // --- Gigantes -------------------------------------------------------------
  "gigante-nube": { label: "Gigante de las nubes", miembros: ["Cloud Giant"] },
  "gigante-fuego": { label: "Gigante de fuego", miembros: ["Fire Giant"] },
  "gigante-escarcha": { label: "Gigante de escarcha", miembros: ["Frost Giant"] },
  "gigante-colina": { label: "Gigante de las colinas", miembros: ["Hill Giant"] },
  "gigante-piedra": { label: "Gigante de piedra", miembros: ["Stone Giant"] },
  "gigante-tormenta": { label: "Gigante de las tormentas", miembros: ["Storm Giant"] },
  ciclope: { label: "Cíclope", miembros: ["Cyclops Oracle", "Cyclops Sentry", "Fomorian"] },
  ogro: { label: "Ogro", miembros: ["Ogre", "Ogrillon Ogre", "Ettin"] },
  trol: { label: "Trol", miembros: ["Troll", "Troll Limb"] },

  // --- Cienos, plantas y hongos --------------------------------------------
  cieno: { label: "Cieno", miembros: ["Black Pudding", "Gelatinous Cube", "Gray Ooze", "Ochre Jelly", "Psychic Gray Ooze", "Blob of Annihilation"] },
  miconido: { label: "Micónido", miembros: ["Myconid Adult", "Myconid Sovereign", "Myconid Spore Servant", "Myconid Sprout", "Violet Fungus", "Violet Fungus Necrohulk", "Shrieker Fungus", "Gas Spore Fungus"] },
  treant: { label: "Ent", miembros: ["Treant", "Awakened Tree", "Awakened Shrub"] },
  plaga: { label: "Plaga vegetal", miembros: ["Vine Blight", "Twig Blight", "Needle Blight", "Tree Blight", "Gulthias Blight"] },
  monticulo: { label: "Montículo reptante", miembros: ["Shambling Mound"] },
};

/**
 * Lo que NO se despieza, y por qué. Va escrito y no derivado de una regla: es
 * una decisión de mesa, y el gate exige que la partición sea TOTAL —cada
 * entrada del censo cae en una familia o está aquí—, así que un monstruo nuevo
 * obliga a decidir en vez de colarse en silencio.
 */
export const SIN_DESPIECE: Record<string, string[]> = {
  // El tipo Humanoide del manual 2024 es gente: plebeyos, guardias, magos,
  // bandidos, nobles. Despiezar personas no entra en esta campaña.
  "son personas": [
    "Aberrant Cultist", "Archmage", "Archpriest", "Assassin", "Bandit",
    "Bandit Captain", "Bandit Crime Lord", "Bandit Deceiver", "Berserker",
    "Berserker Commander", "Commoner", "Cultist", "Cultist Fanatic",
    "Cultist Hierophant", "Death Cultist", "Druid", "Elemental Cultist",
    "Fiend Cultist", "Gladiator", "Guard", "Guard Captain", "Knight", "Mage",
    "Mage Apprentice", "Noble", "Noble Prodigy", "Performer", "Performer Legend",
    "Performer Maestro", "Pirate", "Pirate Admiral", "Pirate Captain", "Priest",
    "Priest Acolyte", "Questing Knight", "Scout", "Scout Captain", "Spy",
    "Spy Master", "Tough", "Tough Boss", "Vampire Familiar", "Warrior Commander",
    "Warrior Infantry", "Warrior Veteran",
  ],
};

/** Índice inverso: `nameEn` → clave de familia. */
export const FAMILIA_DE: Record<string, string> = (() => {
  const m: Record<string, string> = {};
  for (const [clave, f] of Object.entries(FAMILIAS)) {
    for (const n of f.miembros) m[n] = clave;
  }
  return m;
})();

/** Todos los `nameEn` excluidos, en plano. */
export const EXCLUIDOS: string[] = Object.values(SIN_DESPIECE).flat();
