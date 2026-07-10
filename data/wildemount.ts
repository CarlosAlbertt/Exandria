// Lore de Wildemount para /reino: regiones, facciones e idiomas. Resúmenes
// originales basados en la ambientación (Explorer's Guide to Wildemount); no
// reproducen el texto del libro. Complementa data/taldorei.ts sin tocarlo.

// Modelo de región deliberadamente sin acoplar a pines de mapa (a diferencia
// de taldorei.ts): Wildemount aún no tiene mapa interactivo en /mapa (ver
// backlog del spec), así que "image" es solo la ilustración de portada de la
// tarjeta cuando existe un archivo real en public/maps/wildemount/.
export type WildemountRegion = {
  slug: string;
  name: string;
  capital: string;
  accent: string;
  feature: string;
  blurb: string;
  /** mapa regional en public/maps/wildemount — solo si el archivo existe */
  image?: string;
};

export const WILDEMOUNT_REGIONS: WildemountRegion[] = [
  {
    slug: "costa-casa-de-fieras",
    name: "Costa de la Casa de Fieras",
    capital: "Port Damali",
    accent: "var(--color-primitivo)",
    feature: "Comercio, piratería y el Cónclave de Clovis",
    blurb: "Un litoral cálido de ciudades-estado independientes unidas por el Cónclave de Clovis. Puertos abarrotados, contrabandistas y la red de La Revelry mueven aquí más mercancía —y más secretos— que ningún ejército.",
    image: "/maps/wildemount/menagerie_coast_south.jpg",
  },
  {
    slug: "valle-marrow",
    name: "Valle Marrow",
    capital: "Zadash / Rexxentrum",
    accent: "var(--color-marcial)",
    feature: "Corazón agrícola e industrial del Imperio",
    blurb: "El antiguo Dominio de Julous, hoy provincia central del Imperio Dwendaliano. Zadash vive del comercio de caravanas y sus gremios; sus aldeas y ciudadelas fronterizas abastecen la guerra que arde al este.",
    image: "/maps/wildemount/marrow_valley.jpg",
  },
  {
    slug: "campos-zemnianos",
    name: "Campos Zemnianos",
    capital: "Rexxentrum",
    accent: "var(--color-divino)",
    feature: "Capital imperial y cuna zemniana",
    blurb: "Llanuras fértiles alrededor de Rexxentrum, la mayor ciudad de Wildemount y sede del rey Bertrand Dwendal. Aquí nació el pueblo zemniano y aquí laten hoy la Escuela Soltryce y el Cónclave Cerbero.",
    image: "/maps/wildemount/zemni_fields.jpg",
  },
  {
    slug: "tierras-salvajes-grises",
    name: "Tierras Salvajes Grises",
    capital: "Uthodurn / Shadycreek Run",
    accent: "var(--color-arcane-deep)",
    feature: "Bosque corrupto y asentamientos sin ley",
    blurb: "Al norte del Imperio, donde el bosque de Savalirwood se pudrió tras la Corrupción de Molaesmyr. Uthodurn resiste bajo tierra entre enanos y elfos refugiados, mientras las familias rivales de Shadycreek Run gobiernan el crimen en la superficie.",
    image: "/maps/wildemount/greying_wildlands.jpg",
  },
  {
    slug: "eiselcross",
    name: "Eiselcross",
    capital: "Palebank",
    accent: "var(--color-arcane)",
    feature: "Hielo eterno y ruinas de Aeor",
    blurb: "Un continente helado al extremo norte, sembrado de ruinas de la ciudad flotante de Aeor caída en la Calamidad. La fiebre de los exploradores atrae cazatesoros y estudiosos dispuestos a arriesgarlo todo por saber arcano perdido.",
    image: "/maps/wildemount/eiselcross.jpg",
  },
  {
    slug: "paramos-de-xhorhas",
    name: "Páramos de Xhorhas",
    capital: "Rosohna",
    accent: "var(--color-violet)",
    feature: "Dinastía Kryn y el culto al Luxon",
    blurb: "Yermos orientales alzados sobre las cenizas de Ghor Dranas. Los drow de Rosohna abandonaron a Lolth por el Luxon y hoy luchan al Imperio por las balizas robadas, en una guerra que ninguno de los dos bandos puede permitirse perder.",
    image: "/maps/wildemount/xhorhas.jpg",
  },
  {
    slug: "blightshore",
    name: "Blightshore",
    capital: "—",
    accent: "var(--color-ember)",
    feature: "Costa maldita de horrores post-Calamidad",
    blurb: "Una franja costera remota donde la Calamidad dejó cicatrices que nunca cerraron del todo. Pocos se asientan aquí; los que lo hacen conviven con aberraciones y restos de magia salvaje que ninguna nación se atreve a reclamar.",
    image: "/maps/wildemount/blightshore.jpg",
  },
];

export type WildemountFaction = { name: string; blurb: string };

export const WILDEMOUNT_FACTIONS: WildemountFaction[] = [
  { name: "Imperio Dwendaliano", blurb: "Nación militarista del rey Bertrand Dwendal, sostenida por la Marca Justa, la Guardia de la Corona y un sistema de starostas que vigilan cada asentamiento." },
  { name: "Dinastía Kryn", blurb: "Estado drow de Xhorhas bajo la Reina Brillante Leylas Kryn, devoto del Luxon y protegido por guerreros con armadura quitinosa, los cricks." },
  { name: "Cónclave Cerbero (Asamblea Cerberus)", blurb: "Orden de archimagos al servicio directo de la Corona imperial, con laboratorios propios y agentes encubiertos por todo Wildemount." },
  { name: "Cónclave de Clovis (Concordato Clovis)", blurb: "Alianza de ciudades-estado de la Costa de la Casa de Fieras que reparte el poder político sin coronar a ningún monarca único." },
  { name: "La Myriad", blurb: "Red criminal descentralizada que trafica información, contrabando y favores a ambos lados de la guerra actual." },
  { name: "Hijos de la Malicia", blurb: "Cultistas de los Dioses Traidores que operan en las sombras de Xhorhas, alimentando el miedo a un regreso de la Calamidad." },
  { name: "Diarquía de Uthodurn", blurb: "Gobierno compartido entre clanes enanos y elfos de la plata que sostiene la ciudad subterránea de Uthodurn." },
  { name: "Tribus de Shadycreek Run", blurb: "Familias criminales rivales que se reparten el control del único asentamiento sin ley de las Tierras Salvajes Grises." },
  { name: "Biblioteca del Alma de Cobalto", blurb: "La misma orden erudita de Tal'Dorei mantiene aquí archivos y agentes discretos, vigilando el conflicto con ojo neutral." },
  { name: "Cicatrices de Escama y Diente", blurb: "Compañía de cazadores de monstruos que se gana la vida limpiando las tierras fronterizas de amenazas que ni el Imperio ni Xhorhas atienden." },
  { name: "Órdenes Claret", blurb: "La misma hermandad mercenaria de Tal'Dorei opera también aquí, vendiendo su acero a quien pueda pagarlo." },
  { name: "Sonrisa Dorada", blurb: "Gremio clandestino de ladrones y contrabandistas que controla buena parte del bajo mundo de Zadash." },
  { name: "La Revelry", blurb: "Red de comerciantes y piratas de la Costa de la Casa de Fieras que difumina la línea entre el negocio legítimo y el saqueo." },
];

export type Language = { name: string; blurb: string };

export const LANGUAGES: Language[] = [
  { name: "Zemniano", blurb: "La lengua rural y de gobierno del Imperio Dwendaliano, hablada desde las granjas de los Campos Zemnianos hasta las cortes de Rexxentrum." },
  { name: "Marquesiano", blurb: "El idioma de la alta sociedad en el Cónclave de Clovis y de buena parte de la piratería que surca la Costa de la Casa de Fieras." },
  { name: "Naush", blurb: "La jerga marinera de los Ki'Nau, salpicada de términos rituales heredados de su antigua alianza con Uk'otoa." },
];

export type DailyLifeNote = { title: string; body: string };

export const DAILY_LIFE: DailyLifeNote[] = [
  {
    title: "Tecnología",
    body: "La pólvora negra da sus primeros pasos en talleres como los de Hupperdook y Port Zoon; las armas de fuego siguen siendo casi exclusivamente militares y muy escasas fuera de esos arsenales.",
  },
  {
    title: "Moneda",
    body: "Cada nación acuña su propia moneda —imperial, kryn, del Cónclave de Clovis—, pero el oro puro se acepta y se pesa igual en cualquier mercado de Wildemount.",
  },
];
