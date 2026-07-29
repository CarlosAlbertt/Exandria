// Lore de Wildemount para /reino y /saber: regiones (narrativa curada),
// facciones e idiomas. Resúmenes originales basados en la ambientación
// (Explorer's Guide to Wildemount); no reproducen el texto del libro.
// Complementa data/taldorei.ts sin tocarlo.
//
// OJO: esto NO es el atlas (WILDEMOUNT_REGIONS/WILDEMOUNT_POIS, más abajo en
// este mismo archivo). Son dos modelos distintos que conviven aquí: este es
// narrativa curada de 7 regiones históricas para /saber; el atlas son las 8
// regiones-hoja con sus POIs para /mapa. Se llamaban igual ("WILDEMOUNT_
// REGIONS") antes de que el atlas necesitara ese nombre; esta tabla se
// renombró a WILDEMOUNT_LORE_REGIONS para dejarle sitio.
import type { Region } from "@/data/taldorei";
import type { Poi } from "@/data/pois";

// Modelo de región deliberadamente sin acoplar a pines de mapa (a diferencia
// de taldorei.ts): esta tabla no alimenta /mapa (ver backlog del spec), así
// que "image" es solo la ilustración de portada de la tarjeta cuando existe
// un archivo real en public/maps/wildemount/.
export type WildemountLoreRegion = {
  slug: string;
  name: string;
  capital: string;
  accent: string;
  feature: string;
  blurb: string;
  /** mapa regional en public/maps/wildemount — solo si el archivo existe */
  image?: string;
};

export const WILDEMOUNT_LORE_REGIONS: WildemountLoreRegion[] = [
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

// --- ATLAS: las 8 regiones-hoja y sus POIs, modelo de data/taldorei.ts +
// data/pois.ts (regiones y POIs escritos a mano, no derivados de WORLD_POIS).
// Una región por hoja rotulada de public/maps/wildemount/. Los blurbs son
// redacción original: sitúan cada lugar (terreno, vecinos, a quién
// pertenece) sin inventar batallas ni leyendas que no estén en el mapa.
export const WILDEMOUNT_REGIONS: Region[] = [
  {
    slug: "imperio-dwendaliano",
    name: "Imperio Dwendaliano",
    capital: "Rexxentrum",
    accent: "var(--color-bronze)",
    feature: "Sede del Imperio Dwendaliano",
    blurb:
      "Los Campos Zemni, corazón agrícola y militar del Imperio Dwendaliano: aquí se alza Rexxentrum, sede del rey Dwendal, con el Valle del Tuétano justo al este.",
    image: "/maps/wildemount/zemni_fields.jpg",
    map: { x: 79, y: 22 },
  },
  {
    slug: "valle-del-tuetano",
    name: "Valle del Tuétano",
    capital: "Zadash",
    accent: "var(--color-arcane)",
    feature: "Frontera militar con Xhorhas",
    blurb:
      "Corredor fronterizo del Imperio Dwendaliano entre los Campos Zemni y Xhorhas, con Zadash, Trostenwald y las guarniciones de Bladegarden y Talonstadt.",
    image: "/maps/wildemount/marrow_valley.jpg",
    map: { x: 81, y: 29 },
  },
  {
    slug: "xhorhas",
    name: "Xhorhas",
    capital: "Rosohna",
    accent: "var(--color-divino)",
    feature: "Yermos de la Dinastía Kryn",
    blurb:
      "Yermos orientales gobernados por la Dinastía Kryn desde su capital, Rosohna; la Cordillera Penumbra, al norte, separa estas tierras del Imperio.",
    image: "/maps/wildemount/xhorhas.jpg",
    map: { x: 91, y: 17 },
  },
  {
    slug: "yermos-grisaceos",
    name: "Yermos Grisáceos",
    capital: "Uthodurn",
    accent: "var(--color-marcial)",
    feature: "Tundra fría sin ley",
    blurb:
      "Tundra sin ley al norte de Wildemount, entre la Tundra Crystalsands y los Alpes Flotket; ni el Imperio ni la Dinastía Kryn reclaman esta tierra fría.",
    image: "/maps/wildemount/greying_wildlands.jpg",
    map: { x: 82, y: 10 },
  },
  {
    slug: "costa-del-serrallo",
    name: "Costa del Serrallo",
    capital: "Puerto Damali",
    accent: "var(--color-violet)",
    feature: "Litoral del Cónclave Clovis",
    blurb:
      "Litoral meridional del Cónclave de Clovis, con Puerto Damali por capital y Nicodranas como puerto de placeres; al norte lo cierran las Cyrios Mountains.",
    image: "/maps/wildemount/menagerie_coast_south.jpg",
    map: { x: 73, y: 40 },
  },
  {
    slug: "costa-del-serrallo-norte",
    name: "Costa del Serrallo Norte",
    capital: "Gwardan",
    accent: "var(--color-primitivo)",
    feature: "Bosques costeros del norte",
    blurb:
      "Franja boscosa al norte de la Costa del Serrallo, entre los bosques de Doralle y Lushgut; el Cónclave de Clovis gobierna aquí Gwardan y Tussoa.",
    image: "/maps/wildemount/menagerie_coast_north.jpg",
    map: { x: 68, y: 33 },
  },
  {
    slug: "eiselcross",
    name: "Eiselcross",
    capital: "—",
    accent: "var(--color-ember)",
    feature: "Continente helado y aislado",
    blurb:
      "Continente helado al norte de Wildemount, salpicado de islas heladas y las ruinas de Aeor; tierra de nadie, ajena al Imperio y a la Dinastía Kryn.",
    image: "/maps/wildemount/eiselcross.jpg",
    map: { x: 92, y: 7 },
  },
  {
    slug: "costa-de-la-plaga",
    name: "Costa de la Plaga",
    capital: "—",
    accent: "var(--color-arcane-deep)",
    feature: "Litoral yermo sin dueño",
    blurb:
      "Litoral erial al este de Xhorhas, entre la Cordillera Penumbra y el mar; tierra de nadie que no reclaman ni el Imperio ni la Dinastía Kryn.",
    image: "/maps/wildemount/blightshore.jpg",
    map: { x: 98, y: 20 },
  },
];

// Los 25 POIs que ya existían (venían de WORLD_POIS, con coordenadas del mapa
// del MUNDO que como posición de región no significan nada) recolocados leyendo
// su hoja. "Valle del Tuétano" deja de ser POI: pasa a ser la región de arriba.
// "Aldea Palebank" se muda a Eiselcross, que es donde la rotula el mapa.
// Costa de la Plaga no rotula ninguno de los 25: "Nueva Haxon" es una semilla
// mínima (leída de blightshore.jpg) para que la región no quede vacía; el
// resto de sus rótulos llega en la Fase B (Task B8).
export const WILDEMOUNT_POIS: Record<string, Poi[]> = {
  "imperio-dwendaliano": [
    { name: "Rexxentrum", type: "ciudad", blurb: "Capital del Imperio y mayor ciudad de Wildemount. Sede del rey Dwendal, la Escuela Soltryce y el Cónclave Cerbero. En los Campos Zemni.", x: 80, y: 61 },
    { name: "Montañas Cyrios", type: "natural", blurb: "Barrera montañosa que separa la Costa del Serrallo del interior imperial.", x: 8, y: 85 },
  ],
  "valle-del-tuetano": [
    { name: "Zadash", type: "ciudad", blurb: "Ciudad central del Imperio, antaño capital del Dominio de Julous. Gremios y los Ojos de Cinco Puntas.", x: 42, y: 48 },
    { name: "Trostenwald", type: "ciudad", blurb: "Pueblo cervecero a orillas de un lago; allí se conoció la Poderosa Nein.", x: 45, y: 89 },
    { name: "Bladegarden", type: "fortaleza", blurb: "Ciudadela de la Marca Justa en el Valle del Tuétano; bastión frente a Xhorhas.", x: 75, y: 23 },
    { name: "Hupperdook", type: "ciudad", blurb: "Ciudad industrial de gnomos en el Valle del Tuétano: fábricas, pólvora y la fiesta de la Chispa.", x: 57, y: 10 },
    { name: "Talonstadt", type: "ciudad", blurb: "Ciudad-campamento de refugiados en el borde oriental del Valle del Tuétano.", x: 73, y: 47 },
  ],
  "xhorhas": [
    { name: "Rosohna", type: "ciudad", blurb: "Capital de la Dinastía Kryn sobre las ruinas de Ghor Dranas, en los Campos Espinados. \"Renacer\" en drow: metrópoli en noche perpetua, devota del Luxon.", x: 81, y: 41 },
    { name: "Bazzoxan", type: "fortaleza", blurb: "Puesto militar y antiguo templo oscuro en el norte de la Penumbra; contiene los horrores de la Calamidad.", x: 75, y: 28 },
    { name: "Asarius", type: "ciudad", blurb: "La Ciudad de los Reyes: nexo militar y cultural del noroeste de Xhorhas.", x: 36, y: 37 },
    { name: "Cordillera Penumbra", type: "natural", blurb: "Sierra tenebrosa del norte de Xhorhas; en su extremo vela Bazzoxan.", x: 91, y: 48 },
    { name: "Urzin", type: "ciudad", blurb: "Pueblo errante sobre los caparazones de tortugas horizonte gigantes de la marisma.", x: 34, y: 12 },
    { name: "Jigow", type: "ciudad", blurb: "Aldea norteña a orillas del Barranco Esmeralda; famosa por su Festival de la Búsqueda.", x: 58, y: 13 },
  ],
  "yermos-grisaceos": [
    { name: "Uthodurn", type: "ciudad", blurb: "Ciudad subterránea de enanos y elfos de la plata, en los Yermos Grisáceos.", x: 60, y: 46 },
    { name: "Shadycreek Run", type: "ciudad", blurb: "Refugio sin ley de las tribus de los Yermos Grisáceos; crimen, contrabando y familias rivales.", x: 34, y: 96 },
  ],
  "costa-del-serrallo": [
    { name: "Puerto Damali", type: "ciudad", blurb: "La mayor ciudad de la Costa del Serrallo y capital del Cónclave de Clovis.", x: 35, y: 6 },
    { name: "Nicodranas", type: "ciudad", blurb: "Ciudad portuaria de placeres y comercio; hogar del Distrito de las Mareas y del Rubí del Mar.", x: 80, y: 48 },
    { name: "Feolinn", type: "ciudad", blurb: "Ciudad-estado del Cónclave de Clovis, en el litoral de la Costa del Serrallo.", x: 59, y: 23 },
    { name: "Puerto Zoon", type: "ciudad", blurb: "Ciudad-estado portuaria del Cónclave de Clovis.", x: 63, y: 41 },
    { name: "Vesrah", type: "ciudad", blurb: "Hogar de los Ashari del Agua, en una isla frente a la Costa del Serrallo; custodian un desgarrón al Plano del Agua.", x: 92, y: 70 },
  ],
  "costa-del-serrallo-norte": [
    { name: "Gwardan", type: "ciudad", blurb: "Ciudad de caravanas en el linde de la costa y las tierras áridas; crisol de pueblos.", x: 55, y: 62 },
    { name: "Tussoa", type: "ciudad", blurb: "Ciudad-estado del Cónclave de Clovis, en la cálida costa.", x: 71, y: 89 },
    { name: "Othe", type: "ciudad", blurb: "Ciudad-estado insular del Cónclave de Clovis, entre las Islas Swavain.", x: 97, y: 94 },
  ],
  "eiselcross": [
    { name: "Aldea Palebank", type: "ciudad", blurb: "Aldea pesquera helada junto al Lago Estrellafría, en la Tundra Crystalsands.", x: 97, y: 82 },
  ],
  "costa-de-la-plaga": [
    { name: "Nueva Haxon", type: "ciudad", blurb: "Asentamiento costero en Blightshore, al pie de la Cordillera Penumbra; el único apoyo señalado en ese tramo de litoral yermo.", x: 45, y: 81 },
  ],
};

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
