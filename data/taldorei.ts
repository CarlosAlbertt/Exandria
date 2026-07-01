// Lore de Tal'Dorei (Escenario de Campaña Renacido). Resúmenes originales
// basados en la ambientación; no reproducen el texto del libro.

export const CONTINENT = {
  name: "Tal'Dorei",
  world: "Exandria",
  intro:
    "Tal'Dorei es un continente joven y bullicioso de Exandria: una república de fronteras salvajes forjada sobre las cenizas de un imperio caído. Desde la Costa Lucidiana hasta las Montañas Crestormentas, sus tierras guardan magia antigua, ruinas de la Calamidad y la promesa de aventura en cada horizonte.",
};

export type Era = { year: string; title: string; text: string };

export const HISTORY: Era[] = [
  {
    year: "Era de los Arcanos",
    title: "El Mito de Exandria",
    text: "Los dioses dieron forma al mundo y lo poblaron de maravillas. Mortales y deidades convivieron en una edad de prodigios mágicos sin igual.",
  },
  {
    year: "La Calamidad",
    title: "La caída de los cielos",
    text: "Los Dioses Traidores se rebelaron y desataron una guerra que estuvo a punto de destruir Exandria. Ciudades enteras ardieron y el continente quedó marcado para siempre.",
  },
  {
    year: "La Divergencia",
    title: "El sello de los dioses",
    text: "Para salvar el mundo, las deidades sellaron las puertas de los planos divinos. Desde entonces los dioses solo tocan Exandria de forma indirecta, a través de sus fieles.",
  },
  {
    year: "Orígenes",
    title: "Orígenes de Tal'Dorei",
    text: "Sobre las ruinas del Imperio de Ghor Dranas y la tiranía dracónica, los pueblos libres de Tal'Dorei comenzaron a levantar reinos y ciudades-estado.",
  },
  {
    year: "El Ascenso",
    title: "El ascenso de Tal'Dorei",
    text: "Héroes legendarios derrocaron a tiranos y forjaron alianzas. De aquellas gestas nació la base de la Tal'Dorei moderna y su capital, Emon.",
  },
  {
    year: "Actualidad",
    title: "Una república en ciernes",
    text: "Hoy el Consejo de Tal'Dorei gobierna desde Emon una frágil república. La paz es real, pero las viejas amenazas de la Calamidad nunca duermen del todo.",
  },
];

export type Region = {
  slug: string;
  name: string;
  capital: string;
  accent: string;
  feature: string;
  blurb: string;
  /** posición relativa en el mapa (%) — provisional hasta tener la imagen */
  map: { x: number; y: number };
};

export const REGIONS: Region[] = [
  { slug: "costa-lucidiana", name: "Costa Lucidiana", capital: "Emon", accent: "var(--color-arcane)", feature: "Capital y corazón político", blurb: "El litoral más poblado del continente. Aquí se alza Emon, sede del Consejo de Tal'Dorei, junto a puertos prósperos y campos fértiles.", map: { x: 24, y: 52 } },
  { slug: "sierras-alabastro", name: "Sierras de Alabastro", capital: "Westruun", accent: "var(--color-bronze)", feature: "Mesetas y rutas comerciales", blurb: "Colinas pálidas y pasos de montaña que conectan el oeste con el interior. Tierra de caravanas, minas y la ciudad de Westruun.", map: { x: 40, y: 44 } },
  { slug: "llanuras-divisorias", name: "Llanuras Divisorias", capital: "Kymal", accent: "var(--color-divino)", feature: "Praderas y juego", blurb: "Vastas llanuras que parten el continente en dos. Hogar de la ciudad del vicio de Kymal y de tribus nómadas.", map: { x: 52, y: 56 } },
  { slug: "montanas-torrerrisco", name: "Montañas Torrerrisco", capital: "Riscomartillo", accent: "var(--color-marcial)", feature: "Forjas enanas", blurb: "Picos escarpados donde las casas enanas de Riscomartillo dominan la forja, la runa y el comercio de metales.", map: { x: 64, y: 40 } },
  { slug: "montanas-crestormentas", name: "Montañas Crestormentas", capital: "—", accent: "var(--color-violet)", feature: "Cumbres salvajes", blurb: "Una cordillera azotada por tormentas perpetuas, refugio de gigantes, dragones y peligros que pocos osan cruzar.", map: { x: 76, y: 30 } },
  { slug: "peninsula-pleabruma", name: "Península de Pleabruma", capital: "Puerto Sombrío", accent: "var(--color-arcane-deep)", feature: "Brumas y secretos", blurb: "Una península envuelta en niebla y leyenda, con puertos sombríos donde florece todo lo que prefiere no ser visto.", map: { x: 14, y: 70 } },
  { slug: "expansion-verdante", name: "Expansión Verdante", capital: "Syngorn", accent: "var(--color-primitivo)", feature: "Bosque élfico", blurb: "Un inmenso bosque primigenio que alberga Syngorn, la ciudad élfica que se desliza entre planos para protegerse.", map: { x: 60, y: 70 } },
  { slug: "litoral-filofulgor", name: "Litoral de Filofulgor", capital: "Bys", accent: "var(--color-ember)", feature: "Costa oriental ardiente", blurb: "La costa más lejana y agreste, de acantilados cortantes y asentamientos fronterizos que miran al mar abierto.", map: { x: 86, y: 58 } },
];

export type Deity = { name: string; domain: string; side: "Primaria" | "Traidor" };

export const PANTHEON: Deity[] = [
  { name: "El Padre Tormenta", domain: "Guerra y honor", side: "Primaria" },
  { name: "La Luz del Alba", domain: "Sol, luz y renacer", side: "Primaria" },
  { name: "La Madre Salvaje", domain: "Naturaleza y bestias", side: "Primaria" },
  { name: "El Forjador", domain: "Creación y artesanía", side: "Primaria" },
  { name: "La Matriarca de Cuervos", domain: "Muerte y destino", side: "Primaria" },
  { name: "El Custodio del Conocimiento", domain: "Saber y aprendizaje", side: "Primaria" },
  { name: "El Caminante de los Páramos", domain: "Naturaleza salvaje", side: "Primaria" },
  { name: "La Dama de los Lazos", domain: "Amor y belleza", side: "Primaria" },
  { name: "La Reina Carmesí", domain: "Conquista y dominio", side: "Traidor" },
  { name: "El Caos Errante", domain: "Destrucción y locura", side: "Traidor" },
  { name: "El Engañador", domain: "Mentira y traición", side: "Traidor" },
  { name: "La Tejedora de Plagas", domain: "Enfermedad y muerte", side: "Traidor" },
];

export type Faction = { name: string; blurb: string };

export const FACTIONS: Faction[] = [
  { name: "Consejo de Tal'Dorei", blurb: "El órgano de gobierno de la república, con sede en Emon." },
  { name: "El Arcano Omnisciente", blurb: "Sociedad de magos que custodia el saber arcano del continente." },
  { name: "Los Asharis", blurb: "Guardianes elementales que sellan portales a los planos primigenios." },
  { name: "Cámara de Piedrablanca", blurb: "Influyente gremio mercantil que mueve los hilos del comercio." },
  { name: "Órdenes Claret", blurb: "Cazadores de monstruos al servicio de quien pueda pagarlos." },
  { name: "La Garra Carmesí", blurb: "Culto dracónico que sueña con el regreso de los tiranos alados." },
  { name: "Casas de Riscomartillo", blurb: "Las dinastías enanas que rigen las forjas de Torrerrisco." },
  { name: "Biblioteca del Alma de Cobalto", blurb: "Orden de eruditos dedicada a preservar todo conocimiento." },
  { name: "Los Remanentes", blurb: "Restos de un poder antiguo que conspiran en las sombras." },
  { name: "Guardianes de Syngorn", blurb: "Defensores élficos de la ciudad que viaja entre planos." },
];
