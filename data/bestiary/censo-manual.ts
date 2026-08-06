// El CENSO del Monster Manual 2024: qué statblocks trae el libro, por tipo de
// criatura. Transcrito del apéndice B «Monsters by Creature Type» (páginas 379,
// 380 y 381 del libro = páginas 382, 383 y 384 del PDF), leído de la página
// RENDERIZADA y no de la capa OCR — que entrelaza las dos columnas y además
// sustituye G por C (Ciant, Coblin, Cnoll).
//
// **Esto NO son datos de la app**: es la lista de trabajo de la extracción.
// Sirve para una sola cosa, y es la que faltaba: saber **qué falta**.
// `scripts/check-bestiary.ts` lo cruza con `ALL_MONSTERS` y canta la cobertura.
//
// Los nombres van en INGLÉS, como el libro, porque es la clave con la que se
// busca en el PDF. La traducción se decide al extraer cada uno.
//
// ⚠️ Las entradas «X dragons (all)» del libro son UNA línea que esconde cuatro
// statblocks (wyrmling, young, adult, ancient). Van desplegadas aquí, o el
// censo mentiría sobre cuánto falta.

export const CENSO_MANUAL: Record<string, string[]> = {
  aberracion: [
    "Aboleth", "Beholder", "Blue Slaad", "Chuul", "Cloaker", "Darkmantle",
    "Death Slaad", "Flumph", "Gibbering Mouther", "Githyanki Dracomancer",
    "Githyanki Knight", "Githyanki Soldier", "Githzerai Monk", "Githzerai Psion",
    "Githzerai Zerth", "Gray Slaad", "Green Slaad", "Grell", "Grick",
    "Grick Ancient", "Grimlock", "Intellect Devourer", "Kuo-toa",
    "Kuo-toa Archpriest", "Kuo-toa Monitor", "Kuo-toa Whip", "Mind Flayer",
    "Mind Flayer Arcanist", "Nothic", "Otyugh", "Piercer", "Red Slaad", "Roper",
    "Slaad Tadpole", "Spectator",
  ],
  bestia: [
    "Allosaurus", "Ankylosaurus", "Ape", "Archelon", "Baboon", "Badger", "Bat",
    "Black Bear", "Blood Hawk", "Boar", "Brown Bear", "Camel", "Cat",
    "Constrictor Snake", "Crab", "Crocodile", "Deer", "Dire Wolf", "Draft Horse",
    "Eagle", "Elephant", "Elk", "Frog", "Giant Ape", "Giant Badger", "Giant Bat",
    "Giant Boar", "Giant Centipede", "Giant Constrictor Snake", "Giant Crab",
    "Giant Crocodile", "Giant Fire Beetle", "Giant Frog", "Giant Goat",
    "Giant Hyena", "Giant Lizard", "Giant Octopus", "Giant Rat", "Giant Scorpion",
    "Giant Seahorse", "Giant Shark", "Giant Spider", "Giant Squid", "Giant Toad",
    "Giant Venomous Snake", "Giant Wasp", "Giant Weasel", "Giant Wolf Spider",
    "Goat", "Hawk", "Hippopotamus", "Hunter Shark", "Hyena", "Jackal",
    "Killer Whale", "Lion", "Lizard", "Mammoth", "Mastiff", "Mule", "Octopus",
    "Owl", "Panther", "Piranha", "Plesiosaurus", "Polar Bear", "Pony",
    "Pteranodon", "Rat", "Raven", "Reef Shark", "Rhinoceros", "Riding Horse",
    "Saber-Toothed Tiger", "Scorpion", "Seahorse", "Spider", "Swarm of Bats",
    "Swarm of Insects", "Swarm of Piranhas", "Swarm of Rats", "Swarm of Ravens",
    "Swarm of Venomous Snakes", "Tiger", "Triceratops", "Tyrannosaurus Rex",
    "Venomous Snake", "Vulture", "Warhorse", "Weasel", "Wolf",
  ],
  celestial: [
    "Animal Lord", "Couatl", "Deva", "Empyrean", "Empyrean Iota", "Giant Eagle",
    "Giant Elk", "Giant Owl", "Guardian Naga", "Pegasus", "Planetar", "Solar",
    "Sphinx of Lore", "Sphinx of Secrets", "Sphinx of Valor", "Sphinx of Wonder",
    "Unicorn",
  ],
  constructo: [
    "Animated Armor", "Animated Broom", "Animated Flying Sword",
    "Animated Rug of Smothering", "Brazen Gorgon", "Clay Golem", "Colossus",
    "Flesh Golem", "Gorgon", "Helmed Horror", "Homunculus", "Iron Golem",
    "Modron Duodrone", "Modron Monodrone", "Modron Pentadrone", "Modron Quadrone",
    "Modron Tridrone", "Scarecrow", "Shield Guardian", "Stone Golem",
  ],
  // Las diez familias cromáticas y metálicas, desplegadas en sus cuatro edades.
  dragon: [
    "Black Dragon Wyrmling", "Young Black Dragon", "Adult Black Dragon", "Ancient Black Dragon",
    "Blue Dragon Wyrmling", "Young Blue Dragon", "Adult Blue Dragon", "Ancient Blue Dragon",
    "Green Dragon Wyrmling", "Young Green Dragon", "Adult Green Dragon", "Ancient Green Dragon",
    "Red Dragon Wyrmling", "Young Red Dragon", "Adult Red Dragon", "Ancient Red Dragon",
    "White Dragon Wyrmling", "Young White Dragon", "Adult White Dragon", "Ancient White Dragon",
    "Brass Dragon Wyrmling", "Young Brass Dragon", "Adult Brass Dragon", "Ancient Brass Dragon",
    "Bronze Dragon Wyrmling", "Young Bronze Dragon", "Adult Bronze Dragon", "Ancient Bronze Dragon",
    "Copper Dragon Wyrmling", "Young Copper Dragon", "Adult Copper Dragon", "Ancient Copper Dragon",
    "Gold Dragon Wyrmling", "Young Gold Dragon", "Adult Gold Dragon", "Ancient Gold Dragon",
    "Silver Dragon Wyrmling", "Young Silver Dragon", "Adult Silver Dragon", "Ancient Silver Dragon",
    "Dragon Turtle", "Faerie Dragon Adult", "Faerie Dragon Youth", "Half-Dragon",
    "Juvenile Shadow Dragon", "Kobold Warrior", "Pseudodragon", "Shadow Dragon",
    "Winged Kobold", "Wyvern",
  ],
  elemental: [
    "Aarakocra Aeromancer", "Aarakocra Skirmisher", "Air Elemental",
    "Azer Pyromancer", "Azer Sentinel", "Dao", "Djinni", "Dust Mephit",
    "Earth Elemental", "Efreeti", "Elemental Cataclysm", "Fire Elemental",
    "Galeb Duhr", "Gargoyle", "Ice Mephit", "Invisible Stalker",
    "Lizardfolk Geomancer", "Lizardfolk Sovereign", "Magma Mephit", "Magmin",
    "Marid", "Merfolk Skirmisher", "Merfolk Wavebender", "Mud Mephit",
    "Salamander", "Salamander Fire Snake", "Salamander Inferno Master",
    "Smoke Mephit", "Steam Mephit", "Water Elemental", "Water Weird", "Xorn",
  ],
  fey: [
    "Arch-hag", "Blink Dog", "Bugbear Stalker", "Bugbear Warrior",
    "Bullywug Bog Sage", "Bullywug Warrior", "Centaur Trooper", "Centaur Warden",
    "Dire Worg", "Dryad", "Goblin Boss", "Goblin Hexer", "Goblin Minion",
    "Goblin Warrior", "Green Hag", "Hobgoblin Captain", "Hobgoblin Warlord",
    "Hobgoblin Warrior", "Pixie", "Pixie Wonderbringer", "Satyr",
    "Satyr Revelmaster", "Sea Hag", "Sprite", "Worg",
  ],
  diablo: [
    "Arcanaloth", "Balor", "Barbed Devil", "Barlgura", "Bearded Devil",
    "Bone Devil", "Cambion", "Chain Devil", "Chasme", "Dretch", "Empyrean",
    "Erinyes", "Glabrezu", "Gnoll Demoniac", "Gnoll Fang of Yeenoghu",
    "Gnoll Pack Lord", "Gnoll Warrior", "Goristro", "Hell Hound", "Hezrou",
    "Horned Devil", "Ice Devil", "Imp", "Incubus", "Jackalwere", "Lamia",
    "Larva", "Lemure", "Manes", "Manes Vaporspawn", "Marilith", "Mezzoloth",
    "Nalfeshnee", "Night Hag", "Nightmare", "Nycaloth", "Oni", "Pit Fiend",
    "Quasit", "Rakshasa", "Sahuagin Baron", "Sahuagin Priest", "Sahuagin Warrior",
    "Shadow Demon", "Spined Devil", "Spirit Naga", "Succubus", "Swarm of Dretches",
    "Swarm of Larvae", "Swarm of Lemures", "Ultroloth", "Vrock", "Yochlol",
  ],
  gigante: [
    "Cloud Giant", "Cyclops Oracle", "Cyclops Sentry", "Ettin", "Fire Giant",
    "Fomorian", "Frost Giant", "Hill Giant", "Ogre", "Ogrillon Ogre",
    "Stone Giant", "Storm Giant", "Troll", "Troll Limb",
  ],
  humanoide: [
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
  monstruosidad: [
    "Abominable Yeti", "Ankheg", "Axe Beak", "Basilisk", "Behir", "Bulette",
    "Bulette Pup", "Carrion Crawler", "Chimera", "Cockatrice", "Cockatrice Regent",
    "Death Dog", "Displacer Beast", "Doppelganger", "Drider", "Ettercap",
    "Flying Snake", "Giant Axe Beak", "Giant Vulture", "Griffon", "Harpy",
    "Hippogriff", "Hook Horror", "Hydra", "Kenku", "Kraken", "Manticore",
    "Medusa", "Merrow", "Mimic", "Minotaur of Baphomet", "Owlbear", "Peryton",
    "Phase Spider", "Primeval Owlbear", "Purple Worm", "Quaggoth",
    "Quaggoth Thonot", "Remorhaz", "Roc", "Rust Monster", "Stirge",
    "Swarm of Stirges", "Tarrasque", "Thri-kreen Marauder", "Thri-kreen Psion",
    "Troglodyte", "Umber Hulk", "Werebear", "Wereboar", "Wererat", "Weretiger",
    "Werewolf", "Winter Wolf", "Yeti", "Young Remorhaz", "Yuan-ti Abomination",
    "Yuan-ti Infiltrator", "Yuan-ti Malison",
  ],
  cieno: [
    "Black Pudding", "Blob of Annihilation", "Gelatinous Cube", "Gray Ooze",
    "Ochre Jelly", "Psychic Gray Ooze",
  ],
  planta: [
    "Awakened Shrub", "Awakened Tree", "Gas Spore Fungus", "Gulthias Blight",
    "Myconid Adult", "Myconid Sovereign", "Myconid Spore Servant", "Myconid Sprout",
    "Needle Blight", "Shambling Mound", "Shrieker Fungus", "Treant", "Tree Blight",
    "Twig Blight", "Vine Blight", "Violet Fungus", "Violet Fungus Necrohulk",
  ],
  nomuerto: [
    "Banshee", "Beholder Zombie", "Bone Naga", "Crawling Claw", "Death Knight",
    "Death Knight Aspirant", "Death Tyrant", "Demilich", "Dracolich", "Flameskull",
    "Flaming Skeleton", "Ghast", "Ghast Gravecaller", "Ghost", "Ghoul",
    "Graveyard Revenant", "Haunting Revenant", "Lacedon Ghoul", "Lich",
    "Minotaur Skeleton", "Mummy", "Mummy Lord", "Ogre Zombie", "Poltergeist",
    "Revenant", "Shadow", "Skeleton", "Specter", "Swarm of Crawling Claws",
    "Vampire", "Vampire Nightbringer", "Vampire Spawn", "Vampire Umbral Lord",
    "Warhorse Skeleton", "Wight", "Will-o'-Wisp", "Wraith", "Zombie",
  ],
};

/** Todos los nombres del censo, en inglés, sin repetir. */
export const CENSO_TODOS: string[] = Array.from(
  new Set(Object.values(CENSO_MANUAL).flat())
).sort();
