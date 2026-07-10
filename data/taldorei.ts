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
    year: "La Fundación",
    title: "La llegada de los dioses",
    text: "Los dioses llegaron a Exandria y conocieron a los titanes en el Puente Ascendente de Issylra. Poblaron el mundo de criaturas y, en la guerra contra los Titanes Primordiales, se dividieron en dos bandos: las Deidades Primarias y los Dioses Traidores. La era terminó con la derrota de los Primordiales y el destierro de los Traidores.",
  },
  {
    year: "Era de los Arcanos",
    title: "El apogeo de la magia mortal",
    text: "Durante miles de años, los mortales llevaron el poder arcano hasta sus límites: ciudades voladoras, prodigios imposibles… y la soberbia de desafiar a sus creadores. Al final, algunos liberaron a los Dioses Traidores encadenados.",
  },
  {
    year: "La Calamidad",
    title: "La caída de los cielos",
    text: "Los Traidores desataron la segunda gran guerra. La civilización quedó devastada, la geografía del mundo se reescribió (el continente de Domunas se hizo añicos en los Dientes Rotos) y solo sobrevivió un tercio de la población. Terminó con la derrota del Olvido Encadenado y la construcción de la Puerta Divina.",
  },
  {
    year: "La Divergencia · año 0 PD",
    title: "El sello de los dioses",
    text: "Para salvar el mundo, las Deidades Primarias se impusieron el exilio tras la Puerta Divina. Desde entonces los dioses solo tocan Exandria a través de sus fieles. Los monjes del Alma de Cobalto cuentan los años como 'PD' (Post-Divergencia) desde este punto.",
  },
  {
    year: "Era de la Reclamación",
    title: "El mundo se reconstruye",
    text: "Sobre las ruinas del Imperio de Ghor Dranas y la tiranía dracónica, los pueblos libres levantaron reinos y ciudades-estado. Héroes legendarios derrocaron tiranos y forjaron las alianzas que darían origen a la Tal'Dorei moderna y a su capital, Emon.",
  },
  {
    year: "Actualidad · ~836 PD",
    title: "Una república en ciernes",
    text: "Hoy el Consejo de Tal'Dorei gobierna desde Emon una frágil república. La paz es real, pero las viejas amenazas de la Calamidad nunca duermen del todo.",
  },
];

// Mapas del continente (imágenes optimizadas en public/maps).
export const MAPS = {
  world: "/maps/world.jpg",
  taldorei: "/maps/taldorei.jpg",
  wildemount: "/maps/wildemount.jpg",
};

// Aspecto (ancho/alto) del mapa de cada región, para alinear los POIs.
export const REGION_RATIO: Record<string, string> = {
  "costa-lucidiana": "2550 / 3300",
  "sierras-alabastro": "3300 / 2550",
  "llanuras-divisorias": "3300 / 2500",
  "montanas-torrerrisco": "5100 / 3300",
  "montanas-crestormentas": "3300 / 2550",
  "peninsula-pleabruma": "5100 / 3300",
  "expansion-verdante": "3300 / 2550",
  "litoral-filofulgor": "3300 / 5100",
};

export type Region = {
  slug: string;
  name: string;
  capital: string;
  accent: string;
  feature: string;
  blurb: string;
  /** mapa detallado de la región (public/maps/regions) */
  image: string;
  /** posición relativa del pin sobre el mapa de Tal'Dorei (%) — ajustable */
  map: { x: number; y: number };
};

export const REGIONS: Region[] = [
  { slug: "costa-lucidiana", name: "Costa Lucidiana", capital: "Emon", accent: "var(--color-arcane)", feature: "Capital y corazón político", blurb: "El litoral más poblado del continente. Aquí se alza Emon, sede del Consejo de Tal'Dorei, junto a puertos prósperos y campos fértiles.", image: "/maps/regions/costa-lucidiana.jpg", map: { x: 52, y: 38 } },
  { slug: "sierras-alabastro", name: "Sierras de Alabastro", capital: "Westruun", accent: "var(--color-bronze)", feature: "Mesetas y rutas comerciales", blurb: "Colinas pálidas y pasos de montaña que conectan el oeste con el interior. Tierra de caravanas, minas y la ciudad de Westruun.", image: "/maps/regions/sierras-alabastro.jpg", map: { x: 50, y: 36 } },
  { slug: "llanuras-divisorias", name: "Llanuras Divisorias", capital: "Kymal", accent: "var(--color-divino)", feature: "Praderas y juego", blurb: "Vastas llanuras que parten el continente en dos. Hogar de la ciudad del vicio de Kymal y de tribus nómadas.", image: "/maps/regions/llanuras-divisorias.jpg", map: { x: 50, y: 43 } },
  { slug: "montanas-torrerrisco", name: "Montañas Torrerrisco", capital: "Riscomartillo", accent: "var(--color-marcial)", feature: "Forjas enanas", blurb: "Picos escarpados donde las casas enanas de Riscomartillo dominan la forja, la runa y el comercio de metales.", image: "/maps/regions/montanas-torrerrisco.jpg", map: { x: 49, y: 28 } },
  { slug: "montanas-crestormentas", name: "Montañas Crestormentas", capital: "—", accent: "var(--color-violet)", feature: "Cumbres salvajes", blurb: "Una cordillera azotada por tormentas perpetuas, refugio de gigantes, dragones y peligros que pocos osan cruzar.", image: "/maps/regions/montanas-crestormentas.jpg", map: { x: 54, y: 30 } },
  { slug: "peninsula-pleabruma", name: "Península de Pleabruma", capital: "Puerto Sombrío", accent: "var(--color-arcane-deep)", feature: "Brumas y secretos", blurb: "Una península envuelta en niebla y leyenda, con puertos sombríos donde florece todo lo que prefiere no ser visto.", image: "/maps/regions/peninsula-pleabruma.jpg", map: { x: 48, y: 55 } },
  { slug: "expansion-verdante", name: "Expansión Verdante", capital: "Syngorn", accent: "var(--color-primitivo)", feature: "Bosque élfico", blurb: "Un inmenso bosque primigenio que alberga Syngorn, la ciudad élfica que se desliza entre planos para protegerse.", image: "/maps/regions/expansion-verdante.jpg", map: { x: 46, y: 45 } },
  { slug: "litoral-filofulgor", name: "Litoral de Filofulgor", capital: "Bys", accent: "var(--color-ember)", feature: "Costa oriental ardiente", blurb: "La costa más lejana y agreste, de acantilados cortantes y asentamientos fronterizos que miran al mar abierto.", image: "/maps/regions/litoral-filofulgor.jpg", map: { x: 44, y: 50 } },
];

// El panteón canónico completo vive ahora en data/pantheon.ts
// (PRIME_DEITIES, BETRAYER_GODS, LESSER_IDOLS, PANTHEON de compatibilidad).

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
