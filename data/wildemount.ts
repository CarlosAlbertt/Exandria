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
    { name: "Mar de las Profundidades Gélidas", type: "natural", blurb: "El mar helado que cierra los Campos Zemni por el norte; sus aguas bañan Icehaven, el único puerto del Imperio capaz de navegarlas.", x: 23, y: 17 },
    { name: "Bysaes Tyl", type: "ciudad", blurb: "Única ciudad de fundación élfica dentro del Imperio, alzada al pie de las Montañas Dunrock; su población es hoy mayoritariamente élfica.", x: 62, y: 21 },
    { name: "Montañas Dunrock", type: "natural", blurb: "Cordillera nevada al norte de los Campos Zemni, entre Bysaes Tyl y la Espesura de Pearlbow; en sus alturas se oculta el campamento de Rastun Den.", x: 73, y: 34 },
    { name: "Rastun Den", type: "campamento", blurb: "Campamento de altura en las Montañas Dunrock donde el Imperio cría y adiestra grifos para la Marca Justa; el mal tiempo lo hace casi inaccesible.", x: 65, y: 40 },
    { name: "Sanatorio Vergesson", type: "fortaleza", blurb: "Institución cercada por una verja de hierro en la Espesura de Pearlbow, a un día y medio de Rexxentrum; el Cónclave Cerbero vigila lo que ocurre dentro.", x: 73, y: 39 },
    { name: "Espesura de Pearlbow", type: "natural", blurb: "El bosque que separa las Montañas Dunrock de Rexxentrum; un camino y un río lo cruzan de norte a sur camino a Odesloe.", x: 65, y: 46 },
    { name: "Ciénaga de Saltwallow", type: "natural", blurb: "Zona pantanosa al pie de los montes que separan Icehaven del interior; el terreno blando obliga a rodearla por el camino de Havenpath.", x: 32, y: 58 },
    { name: "Soto de Velvin", type: "natural", blurb: "Bosquecillo denso al suroeste de los Campos Zemni, entre la Ciénaga de Saltwallow y el camino que baja hacia Pride's Call.", x: 33, y: 66 },
    { name: "Icehaven", type: "ciudad", blurb: "El único puerto del Imperio Dwendaliano, a orillas del Mar de las Profundidades Gélidas; sus barcos reforzados contra el hielo zarpan junto al Lago Kaltenloch.", x: 40, y: 47 },
    { name: "Lago Kaltenloch", type: "natural", blurb: "Lago junto a Icehaven, donde el camino que baja de las montañas se une a la ruta hacia Rexxentrum.", x: 45, y: 54 },
    { name: "Odesloe", type: "ciudad", blurb: "Asentamiento de pescadores y leñadores a orillas del Lago Erdeloch; parada habitual entre Rexxentrum y la Espesura de Pearlbow.", x: 69, y: 52 },
    { name: "Lago Erdeloch", type: "natural", blurb: "El lago que da sustento a Odesloe, encajado entre la Espesura de Pearlbow y los caminos que bajan a Rexxentrum.", x: 64, y: 53 },
    { name: "Cruce de Amber", type: "campamento", blurb: "Encrucijada donde se cruzan los caminos que bajan de Rexxentrum hacia Druvenlode y Yrossa; parada obligada de las caravanas del camino Amber.", x: 69, y: 63 },
    { name: "Blumenthal", type: "ciudad", blurb: "Aldea agrícola al sureste de Rexxentrum; sus huertas y graneros, en su mayoría propiedad de la Corona, alimentan buena parte de la capital.", x: 75, y: 64 },
    { name: "Druvenlode", type: "ciudad", blurb: "Ciudad minera al pie de la Cresta Silberquell, en el camino Amber al sur de Rexxentrum; de sus vetas sale buena parte de la plata del Imperio.", x: 73, y: 67 },
    { name: "Cresta Silberquell", type: "natural", blurb: "Cordillera que se extiende al sur de Druvenlode y sostiene sus minas de plata; el camino Amber bordea sus estribaciones hacia el Valle del Tuétano.", x: 80, y: 77 },
    { name: "Nogvurot", type: "ciudad", blurb: "Ciudad del extremo oriental de los Campos Zemni, al pie de la Espesura de Pearlbow, camino de los Yermos Grisáceos.", x: 86, y: 58 },
    { name: "Ruinas de Shattengrod", type: "ruina", blurb: "Ciudad hundida de la Era Arcana, hallada en un sumidero rocoso cerca de Pride's Call; el Cónclave Cerbero la excava bajo vigilancia armada.", x: 55, y: 80 },
    { name: "Pride's Call", type: "ciudad", blurb: "Población de mayoría enana asentada al pie de las Montañas Cyrios, en el oeste de los Campos Zemni.", x: 38, y: 87 },
    { name: "Monte Mentiri", type: "natural", blurb: "Macizo aislado en el sur de los Campos Zemni, entre Pride's Call y las rutas que bajan hacia el Valle del Tuétano.", x: 50, y: 96 },
    { name: "Yrossa", type: "ciudad", blurb: "Población en la ruta entre Pride's Call y Rexxentrum que sirve de base a quienes exploran las Ruinas de Shattengrod.", x: 55, y: 66 },
  ],
  "valle-del-tuetano": [
    { name: "Zadash", type: "ciudad", blurb: "Ciudad central del Imperio, antaño capital del Dominio de Julous. Gremios y los Ojos de Cinco Puntas.", x: 42, y: 48 },
    { name: "Trostenwald", type: "ciudad", blurb: "Pueblo cervecero a orillas de un lago; allí se conoció la Poderosa Nein.", x: 45, y: 89 },
    { name: "Bladegarden", type: "fortaleza", blurb: "Ciudadela de la Marca Justa en el Valle del Tuétano; bastión frente a Xhorhas.", x: 75, y: 23 },
    { name: "Hupperdook", type: "ciudad", blurb: "Ciudad industrial de gnomos en el Valle del Tuétano: fábricas, pólvora y la fiesta de la Chispa.", x: 57, y: 10 },
    { name: "Talonstadt", type: "ciudad", blurb: "Ciudad-campamento de refugiados en el borde oriental del Valle del Tuétano.", x: 73, y: 47 },
    { name: "Matorral de Crispvale", type: "natural", blurb: "Espesura al norte del Valle del Tuétano, junto a la Cresta Silberquell; el camino que baja de Hupperdook la bordea por el oeste.", x: 65, y: 12 },
    { name: "Guarnición de Rockguard", type: "fortaleza", blurb: "Puesto fortificado que vigila el paso norte de los Riscos Brokenveil, en la frontera del Imperio con Xhorhas.", x: 84, y: 12 },
    { name: "Guarnición de Ashguard", type: "fortaleza", blurb: "Puesto fortificado que vigila el paso sur de los Riscos Brokenveil; la Guarnición de Rockguard cubre el flanco norte de la misma frontera.", x: 78, y: 33 },
    { name: "Pantano de Labenda", type: "natural", blurb: "Humedal al pie de la Cresta Silberquell donde se forma el Lago Ounterloch; Berleben se asienta sobre pilotes en su misma orilla.", x: 52, y: 21 },
    { name: "Lago Ounterloch", type: "natural", blurb: "Laguna dentro del Pantano de Labenda, junto a Berleben.", x: 48, y: 23 },
    { name: "Berleben", type: "ciudad", blurb: "Población construida sobre pilotes al borde del Pantano de Labenda, al noreste de Zadash.", x: 45, y: 26 },
    { name: "Vol'antim", type: "ciudad", blurb: "Asentamiento oculto en los riscos de las Montañas Cyrios, al oeste del Valle del Tuétano; solo se alcanza volando.", x: 3, y: 44 },
    { name: "Kamordah", type: "ciudad", blurb: "Villa vinícola del norte del Valle de Truscan, entre las Colinas de Bromkiln y el camino Amber.", x: 21, y: 40 },
    { name: "Colinas de Bromkiln", type: "natural", blurb: "Lomas suaves al norte del Valle de Truscan, entre Kamordah y los montes que lo separan de Vol'antim.", x: 20, y: 44 },
    { name: "Valle de Truscan", type: "natural", blurb: "Vega entre montañas al oeste del Valle del Tuétano, con Kamordah al norte y Deastock al sur.", x: 17, y: 56 },
    { name: "Minas de Herathis", type: "cueva", blurb: "Explotación minera en las laderas boscosas al este del Valle de Truscan.", x: 28, y: 57 },
    { name: "Deastock", type: "ciudad", blurb: "Ciudad próspera del Valle de Truscan, al sur de Kamordah; sus edificios de piedra destacan entre las granjas vecinas.", x: 21, y: 61 },
    { name: "Cantera de Egelin", type: "cueva", blurb: "Cantera al norte de Zadash, junto al camino Amber.", x: 35, y: 39 },
    { name: "Felderwin", type: "ciudad", blurb: "Villa agrícola a orillas del río, entre Zadash y Talonstadt; sus campos de labranza dan nombre a la comarca.", x: 63, y: 50 },
    { name: "Bosque Gyrengreen", type: "natural", blurb: "Gran mancha boscosa al suroeste del Valle del Tuétano, entre el Valle de Truscan y Trostenwald.", x: 30, y: 70 },
    { name: "Alfield", type: "ciudad", blurb: "Pueblo agrícola en el camino entre Zadash y Trostenwald; sus campos de cultivo alimentan a ambas ciudades.", x: 46, y: 66 },
    { name: "Lago Uztaloch", type: "natural", blurb: "El lago a cuya orilla se asienta Trostenwald.", x: 47, y: 81 },
    { name: "Picos Ashkeeper", type: "natural", blurb: "Cordillera al sureste del Valle del Tuétano, entre Talonstadt y el Lago Sorrowseep.", x: 69, y: 70 },
    { name: "Lago Sorrowseep", type: "natural", blurb: "Lago en el extremo oriental del Valle del Tuétano, cerca de la frontera con Xhorhas.", x: 87, y: 68 },
    { name: "Las Muchas Huestes de Igrathad", type: "peligro", blurb: "Paraje remoto entre los Picos Ashkeeper cuyo nombre evoca antiguas huestes; ningún camino señalado lleva hasta allí.", x: 83, y: 79 },
  ],
  "xhorhas": [
    { name: "Rosohna", type: "ciudad", blurb: "Capital de la Dinastía Kryn sobre las ruinas de Ghor Dranas, en los Campos Espinados. \"Renacer\" en drow: metrópoli en noche perpetua, devota del Luxon.", x: 81, y: 41 },
    { name: "Bazzoxan", type: "fortaleza", blurb: "Puesto militar y antiguo templo oscuro en el norte de la Penumbra; contiene los horrores de la Calamidad.", x: 75, y: 28 },
    { name: "Asarius", type: "ciudad", blurb: "La Ciudad de los Reyes: nexo militar y cultural del noroeste de Xhorhas.", x: 36, y: 37 },
    { name: "Cordillera Penumbra", type: "natural", blurb: "Sierra tenebrosa del norte de Xhorhas; en su extremo vela Bazzoxan.", x: 91, y: 48 },
    { name: "Urzin", type: "ciudad", blurb: "Pueblo errante sobre los caparazones de tortugas horizonte gigantes de la marisma.", x: 34, y: 12 },
    { name: "Jigow", type: "ciudad", blurb: "Aldea norteña a orillas del Barranco Esmeralda; famosa por su Festival de la Búsqueda.", x: 58, y: 13 },
    { name: "Barranco Esmeralda", type: "natural", blurb: "Ensenada de aguas verdosas en la costa noreste de Xhorhas; Jigow se asienta en su misma orilla y un camino la bordea hacia el sur.", x: 79, y: 11 },
    { name: "Marisma de Brokenveil", type: "natural", blurb: "Humedal al pie de los Riscos Brokenveil, entre las guarniciones que el Imperio reparte a ambos lados de ese mismo paso fronterizo.", x: 32, y: 20 },
    { name: "Campos Espinados", type: "natural", blurb: "Llanura agreste entre Bazzoxan y Rosohna que da nombre a la capital kryn; sus veredas unen el paso de Bazzoxan con la metrópoli drow.", x: 76, y: 30 },
    { name: "Árbol Ejemplar", type: "natural", blurb: "Un único árbol señalado en los Campos Espinados, entre Bazzoxan y la mina del Río Profundo; sirve de referencia solitaria en la llanura.", x: 80, y: 31 },
    { name: "Mina del Río Profundo", type: "cueva", blurb: "Explotación minera en los Campos Espinados, al pie de la Cordillera Penumbra que separa esta llanura de Rosohna.", x: 75, y: 39 },
    { name: "Bosque Vermaloc", type: "natural", blurb: "Masa boscosa oscura al oeste de Rosohna, entre los Campos Espinados y los Páramos de Iothlia, al sur.", x: 62, y: 39 },
    { name: "Dumaran", type: "ciudad", blurb: "Asentamiento al borde del Bosque Vermaloc, donde la espesura se topa con las estribaciones de la Cordillera Penumbra.", x: 70, y: 53 },
    { name: "Reposo del Encantador", type: "ruina", blurb: "Paraje remoto en las estribaciones orientales de la Cordillera Penumbra, cerca de la costa que separa Xhorhas de Blightshore.", x: 92, y: 56 },
    { name: "Fosa de Miskath", type: "cueva", blurb: "Excavación en las laderas rocosas del sureste de Xhorhas, camino de Rotthold y de la costa que mira a Blightshore.", x: 90, y: 69 },
    { name: "Rotthold", type: "ciudad", blurb: "Asentamiento costero en el extremo sureste de Xhorhas, frente al mar que separa estas tierras de Blightshore.", x: 88, y: 75 },
    { name: "Lago Fevergulf", type: "natural", blurb: "Lago irregular salpicado de islotes en el centro de Xhorhas, alimentado por el río que baja de los Páramos de Iothlia.", x: 44, y: 64 },
    { name: "Charis", type: "ciudad", blurb: "Población al sur de Xhorhas, junto al bosque que bordea el Lago Fevergulf por el oeste.", x: 36, y: 75 },
    { name: "Páramos de Iothlia", type: "natural", blurb: "Yermo salpicado de bosquecillos entre Dumaran y el Lago Fevergulf, cruzado por un río que baja hacia el sur.", x: 56, y: 56 },
    { name: "Draconia", type: "ruina", blurb: "Ruinas del bastión dracónico que dominó Xhorhas hasta su caída ante el Cónclave Cromático; hoy solo quedan sus piedras entre las montañas del oeste.", x: 18, y: 80 },
    { name: "Barranco de Dreemoth", type: "natural", blurb: "Hondonada rocosa entre las montañas occidentales de Xhorhas, justo al sur de las ruinas de Draconia.", x: 18, y: 83 },
    { name: "Xarzith Kitril", type: "ciudad", blurb: "Asentamiento en las estribaciones montañosas del oeste de Xhorhas, cerca del Barranco de Dreemoth y del Bosque Lotusgarden.", x: 18, y: 87 },
    { name: "Bosque Lotusgarden", type: "natural", blurb: "Gran extensión boscosa que cubre el suroeste de Xhorhas, entre las montañas occidentales y la costa del Océano Lucidiano.", x: 40, y: 78 },
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
