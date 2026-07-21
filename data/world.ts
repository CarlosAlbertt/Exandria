// Pines del MUNDO de Exandria sobre el mapa mundial (public/maps/taldorei.jpg,
// 2560x1707). Nombres de la lore de Critical Role; descripciones propias.
// Jerarquía: continente › región › lugar. Posición x/y en % — aproximada; el DM
// la ajusta arrastrando. Se editan y guardan en app_config (JSON), sin migración.
// Tal'Dorei se gestiona aparte (taldorei.ts / pois.ts); aquí solo su etiqueta.

export const WORLD_SLUG = "__world__";

export type WorldType =
  | "continente" | "region" | "capital" | "ciudad" | "pueblo"
  | "fortaleza" | "ruina" | "natural" | "peligro";

export type WorldPoi = {
  name: string;
  type: WorldType;
  continent: string;
  region: string; // región dentro del continente ("" para continentes/mares)
  x: number;
  y: number;
  blurb: string;
};

export const WORLD_ICON: Record<WorldType, string> = {
  continente: "fa-earth-americas",
  region: "fa-draw-polygon",
  capital: "fa-crown",
  ciudad: "fa-city",
  pueblo: "fa-house-chimney",
  fortaleza: "fa-chess-rook",
  ruina: "fa-dungeon",
  natural: "fa-mountain-sun",
  peligro: "fa-skull",
};

export const WORLD_COLOR: Record<WorldType, string> = {
  continente: "var(--color-gold)",
  region: "var(--color-divino)",
  capital: "var(--color-bronze-bright)",
  ciudad: "var(--color-bronze)",
  pueblo: "var(--color-warm)",
  fortaleza: "var(--color-arcane)",
  ruina: "var(--color-violet)",
  natural: "var(--color-primitivo)",
  peligro: "var(--color-ember)",
};

export const CONTINENTS = ["Tal'Dorei", "Issylra", "Wildemount", "Marquet", "Dientes Rotos", "Mares"] as const;

// Regiones conocidas por continente (para el selector del editor).
export const REGIONS_BY_CONTINENT: Record<string, string[]> = {
  "Tal'Dorei": ["Costa Lucidiana", "Sierras de Alabastro", "Llanuras Divisorias", "Montañas Torrerrisco", "Montañas Crestormentas", "Península de Pleabruma", "Expansión Verdante", "Litoral de Filofulgor"],
  "Issylra": ["Othanzia", "Valle Demithore", "Montañas Utesspire", "Alcance Caramarin"],
  "Wildemount": ["Imperio Dwendaliano", "Xhorhas", "Costa del Serrallo", "Yermos Grisáceos"],
  "Marquet": ["Desierto Rumedam", "Valle Hellcatch", "Tierras Salvajes de Oderan", "Aeshanadoor", "Tierras Altas Taladas", "Montañas Aggrad", "Arenas Panagrip"],
  "Dientes Rotos": ["Dientes Rotos"],
  "Mares": ["Mares"],
};

export type ContinentView = { cx: number; cy: number; scale: number; box: { x: number; y: number; w: number; h: number } };
export const CONTINENT_VIEW: Record<string, ContinentView> = {
  "Tal'Dorei": { cx: 49, cy: 38, scale: 2.0, box: { x: 37, y: 14, w: 24, h: 50 } },
  "Issylra": { cx: 21, cy: 22, scale: 2.3, box: { x: 8, y: 3, w: 27, h: 40 } },
  "Wildemount": { cx: 83, cy: 31, scale: 2.0, box: { x: 66, y: 6, w: 34, h: 52 } },
  "Marquet": { cx: 20, cy: 75, scale: 2.1, box: { x: 6, y: 54, w: 29, h: 44 } },
  "Dientes Rotos": { cx: 75, cy: 77, scale: 2.4, box: { x: 61, y: 60, w: 30, h: 34 } },
};

export const WORLD_POIS: WorldPoi[] = [
  // ---------------- CONTINENTES ----------------
  { name: "Tal'Dorei", type: "continente", continent: "Tal'Dorei", region: "", x: 48, y: 12, blurb: "Continente central de la campaña. República de Tal'Dorei (Emon), Syngorn, Riscomartillo y Piedrablanca. Sus regiones se gestionan en el mapa de continente." },
  { name: "Issylra", type: "continente", continent: "Issylra", region: "", x: 22, y: 5, blurb: "Continente al noroeste, cuna de la fe. Aquí los dioses conocieron a los titanes en la Fundación. Dominado por la teocracia de Vasselheim." },
  { name: "Wildemount", type: "continente", continent: "Wildemount", region: "", x: 85, y: 6, blurb: "Continente al este: Imperio Dwendaliano, Dinastía Kryn de Xhorhas y la Costa del Serrallo. Escenario de la Poderosa Nein." },
  { name: "Marquet", type: "continente", continent: "Marquet", region: "", x: 14, y: 58, blurb: "Continente meridional de desiertos, junglas y tierras altas. En su corazón, Ank'Harel. Escenario de Bells Hells." },
  { name: "Los Dientes Rotos", type: "continente", continent: "Dientes Rotos", region: "", x: 75, y: 58, blurb: "Archipiélago de 43 islas al sur, resto del continente de Domunas, destruido en la Calamidad con la caída de Avalir. Tras la Cortina del Necio." },

  // ---------------- ISSYLRA ----------------
  { name: "Othanzia", type: "region", continent: "Issylra", region: "Othanzia", x: 23, y: 17, blurb: "El territorio más desarrollado de Issylra, bajo el gobierno de la teocracia de Vasselheim." },
  { name: "Valle Demithore", type: "region", continent: "Issylra", region: "Valle Demithore", x: 19, y: 31, blurb: "Valle remoto y verde, apartado del dominio de Othanzia." },
  { name: "Montañas Sunderpeak", type: "natural", continent: "Issylra", region: "Othanzia", x: 27, y: 21, blurb: "Cordillera volcánica de Othanzia; en su Arboleda Cendrosa vela Pyrah." },
  { name: "Montañas Utesspire", type: "region", continent: "Issylra", region: "Montañas Utesspire", x: 14, y: 13, blurb: "Macizo del oeste de Issylra, sobre el Lago Umamu." },
  { name: "Vasselheim", type: "capital", continent: "Issylra", region: "Othanzia", x: 21, y: 19, blurb: "La Ciudad de la Semilla: la urbe más antigua y devota de Exandria, superviviente de la Calamidad. Sede de grandes órdenes de fe y de la Caza Gris." },
  { name: "Pyrah", type: "ciudad", continent: "Issylra", region: "Othanzia", x: 29, y: 25, blurb: "Enclave de los Ashari del Fuego que custodia un desgarrón al Plano del Fuego en la Arboleda Cendrosa." },
  { name: "Ria'Doin", type: "ruina", continent: "Issylra", region: "Montañas Utesspire", x: 13, y: 15, blurb: "Aldea abandonada a orillas del Lago Umamu, en las Utesspire." },
  { name: "Hishari", type: "pueblo", continent: "Issylra", region: "Othanzia", x: 17, y: 28, blurb: "Aldea nacida como comuna que degeneró en un culto cerrado, al pie de las montañas." },
  { name: "Alcance Caramarin", type: "region", continent: "Issylra", region: "Alcance Caramarin", x: 12, y: 20, blurb: "Comarca nevada y montañosa, lejos de todo camino trillado; bosques de pino de altura en torno al Lago Umamu." },
  { name: "Bosque Vesper", type: "natural", continent: "Issylra", region: "Othanzia", x: 22, y: 22, blurb: "Taiga oscura y enorme que rodea Vasselheim y se estira al norte hasta deshilacharse en tundra. De sus copas asoman picos sueltos." },
  { name: "Tundra Thorain", type: "natural", continent: "Issylra", region: "Othanzia", x: 24, y: 10, blurb: "Llanura helada del norte donde el bosque se rinde. De aquí bajó el dragón blanco Rimefang." },
  { name: "Muldire", type: "pueblo", continent: "Issylra", region: "Othanzia", x: 19, y: 14, blurb: "Pueblo de frío mordiente en el camino que sale de Vasselheim hacia el noroeste." },
  { name: "Montañas Zenwick", type: "natural", continent: "Issylra", region: "Othanzia", x: 16, y: 10, blurb: "Cordillera tras el paso de Tordusk. Guarda un tajo enorme en la roca: la herida que dejó el Titán de Tierra al desenterrarse." },
  { name: "Valle Cegado", type: "natural", continent: "Issylra", region: "Othanzia", x: 15, y: 9, blurb: "Valle de las Zenwick cuyas aguas curan solas. Justo por eso su ecosistema es de una violencia excepcional: allí nada muere del todo." },
  { name: "Criptas de Thomara", type: "ruina", continent: "Issylra", region: "Othanzia", x: 17, y: 9, blurb: "Ciudad-bóveda enana labrada dentro de un Titán de Tierra caído. Dejó de estar donde estaba el día que el titán se levantó y echó a andar hacia Vasselheim." },
  { name: "Laguna Marrowglade", type: "ruina", continent: "Issylra", region: "Othanzia", x: 19, y: 22, blurb: "Lago pequeño rodeado de ciénaga a unas horas al suroeste de Vasselheim. Bajo el agua duermen templos consagrados a la Matriarca Cuervo." },
  { name: "Monte Puente Ascendente", type: "natural", continent: "Issylra", region: "Othanzia", x: 25, y: 27, blurb: "La montaña más alta de toda Exandria. Se ve desde muy lejos, y quien la reconoce sabe en qué continente ha amanecido." },
  { name: "Shorecomb", type: "ciudad", continent: "Issylra", region: "Othanzia", x: 15, y: 26, blurb: "Ciudad pesquera modesta en la costa, a unas doscientas millas al suroeste de Vasselheim." },
  { name: "Scaldseat", type: "peligro", continent: "Issylra", region: "Othanzia", x: 13, y: 27, blurb: "Isla volcánica a cinco millas de Shorecomb. Bajo ella late el Yunque Primigenio." },
  { name: "Yunque Primigenio", type: "ruina", continent: "Issylra", region: "Othanzia", x: 13, y: 29, blurb: "Fragua legendaria en las entrañas de Scaldseat, capaz de dar forma a lo que ninguna herrería mortal podría siquiera calentar." },
  { name: "Garganta Espectro", type: "natural", continent: "Issylra", region: "Valle Demithore", x: 21, y: 33, blurb: "Barranco geotérmico del Valle Demithore: vapores de colores, aguas hirvientes y una luz que no se parece a ninguna otra." },
  { name: "Camino Exterior", type: "natural", continent: "Issylra", region: "Valle Demithore", x: 20, y: 29, blurb: "La ruta que sube del valle hacia Othanzia, pasando por Hearthdell y Endovaar. Poco tránsito y muchas leguas entre posada y posada." },
  { name: "Hearthdell", type: "pueblo", continent: "Issylra", region: "Valle Demithore", x: 18, y: 33, blurb: "Aldea del Camino Exterior, apegada a sus costumbres y poco amiga de forasteros con preguntas." },
  { name: "Endovaar", type: "pueblo", continent: "Issylra", region: "Valle Demithore", x: 20, y: 30, blurb: "Villa del Camino Exterior, entre Hearthdell y las tierras de Othanzia." },
  { name: "Yermo Serratus", type: "natural", continent: "Issylra", region: "Valle Demithore", x: 17, y: 35, blurb: "Espesura agreste al sur del valle; tres días de marcha para cruzarla, y no se cruza sola." },
  { name: "Cañón Irriam", type: "natural", continent: "Issylra", region: "Valle Demithore", x: 16, y: 37, blurb: "Cañón al otro lado del Yermo Serratus." },
  { name: "Lago Umamu", type: "natural", continent: "Issylra", region: "Alcance Caramarin", x: 11, y: 18, blurb: "Lago de montaña rodeado de pinar a gran altura. En su fondo hay un portal que no lleva a ninguna parte de este mundo." },

  // ---------------- WILDEMOUNT ----------------
  { name: "Imperio Dwendaliano", type: "region", continent: "Wildemount", region: "Imperio Dwendaliano", x: 79, y: 22, blurb: "Nación austera y militarista del oeste (Wynandir Occidental), regida por el rey Bertrand Dwendal desde Rexxentrum." },
  { name: "Xhorhas", type: "region", continent: "Wildemount", region: "Xhorhas", x: 91, y: 17, blurb: "Yermos orientales, corazón de la secreta Dinastía Kryn, enfrentada al Imperio por las balizas del Luxon." },
  { name: "Costa del Serrallo", type: "region", continent: "Wildemount", region: "Costa del Serrallo", x: 73, y: 40, blurb: "Litoral tropical del suroeste; siete ciudades-estado unidas bajo el Cónclave de Clovis." },
  { name: "Yermos Grisáceos", type: "region", continent: "Wildemount", region: "Yermos Grisáceos", x: 82, y: 10, blurb: "Tierras salvajes y frías del norte, sin ley; hogar de Uthodurn y las tribus de Shadycreek Run." },
  { name: "Valle del Tuétano", type: "natural", continent: "Wildemount", region: "Imperio Dwendaliano", x: 81, y: 29, blurb: "Corredor fronterizo entre el Imperio y Xhorhas; primera línea de la guerra." },
  { name: "Cordillera Penumbra", type: "natural", continent: "Wildemount", region: "Xhorhas", x: 90, y: 13, blurb: "Sierra tenebrosa del norte de Xhorhas; en su extremo vela Bazzoxan." },
  { name: "Montañas Cyrios", type: "natural", continent: "Wildemount", region: "Imperio Dwendaliano", x: 75, y: 33, blurb: "Barrera montañosa que separa la Costa del Serrallo del interior imperial." },
  { name: "Rexxentrum", type: "capital", continent: "Wildemount", region: "Imperio Dwendaliano", x: 80, y: 20, blurb: "Capital del Imperio y mayor ciudad de Wildemount. Sede del rey Dwendal, la Escuela Soltryce y el Cónclave Cerbero. En los Zemni Fields." },
  { name: "Zadash", type: "ciudad", continent: "Wildemount", region: "Imperio Dwendaliano", x: 79, y: 25, blurb: "Ciudad central del Imperio, antaño capital del Dominio de Julous. Gremios y los Ojos de Cinco Puntas." },
  { name: "Trostenwald", type: "pueblo", continent: "Wildemount", region: "Imperio Dwendaliano", x: 76, y: 30, blurb: "Pueblo cervecero a orillas de un lago; allí se conoció la Poderosa Nein." },
  { name: "Bladegarden", type: "fortaleza", continent: "Wildemount", region: "Imperio Dwendaliano", x: 82, y: 30, blurb: "Ciudadela de la Marca Justa en el Valle del Tuétano; bastión frente a Xhorhas." },
  { name: "Hupperdook", type: "pueblo", continent: "Wildemount", region: "Imperio Dwendaliano", x: 78, y: 27, blurb: "Ciudad industrial de gnomos en el Valle del Tuétano: fábricas, pólvora y la fiesta de la Chispa." },
  { name: "Talonstadt", type: "pueblo", continent: "Wildemount", region: "Imperio Dwendaliano", x: 84, y: 31, blurb: "Ciudad-campamento de refugiados en el borde oriental del Valle del Tuétano." },
  { name: "Uthodurn", type: "ciudad", continent: "Wildemount", region: "Yermos Grisáceos", x: 83, y: 11, blurb: "Ciudad subterránea de enanos y elfos de la plata, en los Yermos Grisáceos." },
  { name: "Shadycreek Run", type: "pueblo", continent: "Wildemount", region: "Yermos Grisáceos", x: 80, y: 12, blurb: "Refugio sin ley de las tribus de los Yermos Grisáceos; crimen, contrabando y familias rivales." },
  { name: "Aldea Palebank", type: "pueblo", continent: "Wildemount", region: "Yermos Grisáceos", x: 88, y: 9, blurb: "Aldea pesquera helada junto al Lago Estrellafría." },
  { name: "Rosohna", type: "capital", continent: "Wildemount", region: "Xhorhas", x: 90, y: 20, blurb: "Capital de la Dinastía Kryn sobre las ruinas de Ghor Dranas, en los Campos Espinados. \"Renacer\" en drow: metrópoli en noche perpetua, devota del Luxon." },
  { name: "Bazzoxan", type: "fortaleza", continent: "Wildemount", region: "Xhorhas", x: 91, y: 13, blurb: "Puesto militar y antiguo templo oscuro en el norte de la Penumbra; contiene los horrores de la Calamidad." },
  { name: "Asarius", type: "ciudad", continent: "Wildemount", region: "Xhorhas", x: 86, y: 17, blurb: "La Ciudad de los Reyes: nexo militar y cultural del noroeste de Xhorhas." },
  { name: "Urzin", type: "pueblo", continent: "Wildemount", region: "Xhorhas", x: 93, y: 24, blurb: "Pueblo errante sobre los caparazones de tortugas horizonte gigantes de la marisma." },
  { name: "Jigow", type: "pueblo", continent: "Wildemount", region: "Xhorhas", x: 95, y: 28, blurb: "Aldea norteña a orillas del Barranco Esmeralda; famosa por su Festival de la Búsqueda." },
  { name: "Puerto Damali", type: "ciudad", continent: "Wildemount", region: "Costa del Serrallo", x: 76, y: 45, blurb: "La mayor ciudad de la Costa del Serrallo y capital del Cónclave de Clovis." },
  { name: "Nicodranas", type: "ciudad", continent: "Wildemount", region: "Costa del Serrallo", x: 72, y: 42, blurb: "Ciudad portuaria de placeres y comercio; hogar del Distrito de las Mareas y del Rubí del Mar." },
  { name: "Gwardan", type: "ciudad", continent: "Wildemount", region: "Costa del Serrallo", x: 70, y: 37, blurb: "Ciudad de caravanas en el linde de la costa y las tierras áridas; crisol de pueblos." },
  { name: "Feolinn", type: "pueblo", continent: "Wildemount", region: "Costa del Serrallo", x: 78, y: 48, blurb: "Ciudad-estado del Cónclave de Clovis." },
  { name: "Othe", type: "pueblo", continent: "Wildemount", region: "Costa del Serrallo", x: 74, y: 47, blurb: "Ciudad-estado insular del Cónclave de Clovis, entre las Islas Swavain." },
  { name: "Puerto Zoon", type: "pueblo", continent: "Wildemount", region: "Costa del Serrallo", x: 77, y: 47, blurb: "Ciudad-estado portuaria del Cónclave de Clovis." },
  { name: "Tussoa", type: "pueblo", continent: "Wildemount", region: "Costa del Serrallo", x: 71, y: 49, blurb: "Ciudad-estado del Cónclave de Clovis, en la cálida costa." },
  { name: "Vesrah", type: "pueblo", continent: "Wildemount", region: "Costa del Serrallo", x: 69, y: 46, blurb: "Hogar de los Ashari del Agua, en una isla frente a la Costa del Serrallo; custodian un desgarrón al Plano del Agua." },

  // ---------------- MARQUET ----------------
  { name: "Desierto Rumedam", type: "region", continent: "Marquet", region: "Desierto Rumedam", x: 23, y: 72, blurb: "Vasto desierto que cubre un tercio del continente; en su centro, Ank'Harel." },
  { name: "Valle Hellcatch", type: "region", continent: "Marquet", region: "Valle Hellcatch", x: 18, y: 69, blurb: "Yermos de cañones en el centro de Marquet; nexo de rutas y aldeas rivales bajo la República de Bassur." },
  { name: "Tierras Salvajes de Oderan", type: "region", continent: "Marquet", region: "Tierras Salvajes de Oderan", x: 12, y: 63, blurb: "Valle selvático rodeado por los Picos Serpenteantes, al noroeste. Su capital es Jrusar." },
  { name: "Aeshanadoor", type: "region", continent: "Marquet", region: "Aeshanadoor", x: 25, y: 84, blurb: "Jungla del sur; hogar de la sociedad órquica erudita y de Yios." },
  { name: "Tierras Altas Taladas", type: "region", continent: "Marquet", region: "Tierras Altas Taladas", x: 11, y: 84, blurb: "Montañas del suroeste con valles cultivables; su poder militar es el Trono Estratos." },
  { name: "Picos Serpenteantes", type: "natural", continent: "Marquet", region: "Tierras Salvajes de Oderan", x: 10, y: 66, blurb: "Cordillera que ciñe las Tierras Salvajes de Oderan." },
  { name: "Ank'Harel", type: "capital", continent: "Marquet", region: "Desierto Rumedam", x: 22, y: 74, blurb: "La Ciudad de la Esperanza: metrópoli en el corazón del desierto, regida por J'mon Sa Ord (un dragón de bronce)." },
  { name: "Shandal", type: "pueblo", continent: "Marquet", region: "Desierto Rumedam", x: 25, y: 71, blurb: "Aldea-oasis cercana a Ank'Harel; tierra natal de Shaun Gilmore." },
  { name: "Shammel", type: "ciudad", continent: "Marquet", region: "Desierto Rumedam", x: 29, y: 78, blurb: "Ciudad portuaria y balneario en una bahía de clima templado." },
  { name: "Jrusar", type: "capital", continent: "Marquet", region: "Tierras Salvajes de Oderan", x: 13, y: 62, blurb: "La Ciudad de las Cinco Agujas: gran urbe comercial sobre espolones de roca en las Tierras Salvajes de Oderan. Inicio de la campaña de Bells Hells." },
  { name: "Yios", type: "ciudad", continent: "Marquet", region: "Aeshanadoor", x: 26, y: 85, blurb: "Ciudad de eruditos en Aeshanadoor; pináculo académico de Marquet." },
  { name: "Gujjar-Serai", type: "ciudad", continent: "Marquet", region: "Valle Hellcatch", x: 18, y: 68, blurb: "La Ciudad Verde: sede de la República de Bassur, que gobierna nominalmente el Hellcatch." },
  { name: "Bassuras", type: "ciudad", continent: "Marquet", region: "Valle Hellcatch", x: 15, y: 70, blurb: "Ciudad polvorienta y sin ley del Valle Hellcatch; carreras de vehículos de chatarra y bandas." },
  { name: "Trono Estratos", type: "fortaleza", continent: "Marquet", region: "Tierras Altas Taladas", x: 10, y: 85, blurb: "Bastión y poder militar que domina las Tierras Altas Taladas." },
  { name: "Montañas Aggrad", type: "region", continent: "Marquet", region: "Montañas Aggrad", x: 24, y: 64, blurb: "Espinazo de cientos de millas que ocupa el norte del continente, entre el Golfo de los Dones y el Rumedam. Un brazo suyo baja al suroeste y cierra el Valle Hellcatch por arriba." },
  { name: "Arenas Panagrip", type: "region", continent: "Marquet", region: "Arenas Panagrip", x: 31, y: 82, blurb: "El desierto hermano del Rumedam, al sureste. Menos rutas, menos pozos y ninguna Ank'Harel que dé cobijo." },
  { name: "Golfo de los Dones", type: "natural", continent: "Marquet", region: "Montañas Aggrad", x: 27, y: 61, blurb: "Gran bahía de la costa norte, de aguas mansas y playas largas. Destino de veraneo para quien puede pagarlo." },
  { name: "Bóveda de Shumas", type: "ruina", continent: "Marquet", region: "Montañas Aggrad", x: 21, y: 63, blurb: "Santuario escondido en la sierra. Perteneció a una fe desde el comienzo de la Era de los Arcanos hasta que, ya en vísperas de la Calamidad, los siervos de la Serpiente Encapotada lo tomaron a sangre." },
  { name: "Montañas Ascuacorona", type: "natural", continent: "Marquet", region: "Desierto Rumedam", x: 26, y: 77, blurb: "Anillo estrecho de agujas dentadas a unas 290 millas al sureste de Ank'Harel. Dentro hubo un zigurat que abría paso al Páramo de las Sombras." },
  { name: "Arenas Escaldaviento", type: "peligro", continent: "Marquet", region: "Desierto Rumedam", x: 19, y: 78, blurb: "Desierto abrasado que fue guarida y trono del dragón rojo Thordak mientras dominó media Marquet." },
  { name: "Cael Morrow", type: "ruina", continent: "Marquet", region: "Valle Hellcatch", x: 17, y: 72, blurb: "La Ciudad Ahogada: lo que quedó de la joya de Marquet cuando el golpe de la Calamidad la hundió bajo las aguas. Su nombre significa justo eso en un dialecto marquesiano del norte." },
  { name: "La Falla", type: "peligro", continent: "Marquet", region: "Valle Hellcatch", x: 16, y: 68, blurb: "Tajo del Hellcatch por el que nadie pasa dos veces sin motivo." },
  { name: "Caída del Rey", type: "pueblo", continent: "Marquet", region: "Valle Hellcatch", x: 20, y: 70, blurb: "Uno de los asentamientos independientes que se disputan el Valle Hellcatch." },
  { name: "Loonpur", type: "pueblo", continent: "Marquet", region: "Valle Hellcatch", x: 14, y: 67, blurb: "Aldea del Hellcatch, de las que aparecen y desaparecen según quién mande ese año." },
  { name: "Nadigarh", type: "pueblo", continent: "Marquet", region: "Valle Hellcatch", x: 20, y: 66, blurb: "Asentamiento del Valle Hellcatch en la ruta hacia el norte." },
  { name: "El Heartmoor", type: "natural", continent: "Marquet", region: "Tierras Salvajes de Oderan", x: 14, y: 65, blurb: "El punto más bajo de las Tierras Salvajes: allí se junta el agua y la vegetación se desboca. También las arañas de ciénaga." },
  { name: "Aldea Heartmoor", type: "pueblo", continent: "Marquet", region: "Tierras Salvajes de Oderan", x: 14, y: 66, blurb: "El asentamiento principal del Heartmoor. Sus huertos aprovechan una jungla tocada por lo feérico: frutas que no existen en ninguna otra parte." },
  { name: "Sendas Honradas", type: "natural", continent: "Marquet", region: "Tierras Salvajes de Oderan", x: 12, y: 64, blurb: "Red de caminos que atraviesa la jungla espesa de las Tierras Salvajes. De ella salen la Senda del Azúcar de Oro y la Senda de la Hoja Dulce." },
  { name: "Evishi", type: "ciudad", continent: "Marquet", region: "Tierras Salvajes de Oderan", x: 9, y: 61, blurb: "Ciudad donde conviven trols de muy distintas clases." },
  { name: "Goradire", type: "ciudad", continent: "Marquet", region: "Tierras Salvajes de Oderan", x: 15, y: 59, blurb: "Ciudad de las Tierras Salvajes de Oderan." },
  { name: "Otoladume", type: "ciudad", continent: "Marquet", region: "Tierras Salvajes de Oderan", x: 11, y: 59, blurb: "Ciudad de las Tierras Salvajes de Oderan." },
  { name: "Refugio Sapiro", type: "pueblo", continent: "Marquet", region: "Tierras Salvajes de Oderan", x: 13, y: 57, blurb: "Puerto de la costa norte de las Tierras Salvajes." },
  { name: "Isla de Droojh", type: "natural", continent: "Marquet", region: "Tierras Salvajes de Oderan", x: 15, y: 55, blurb: "Isla frente a la costa norte de las Tierras Salvajes de Oderan." },
  { name: "Valle Hundido", type: "natural", continent: "Marquet", region: "Tierras Salvajes de Oderan", x: 10, y: 64, blurb: "Comarca deprimida de las Tierras Salvajes, encajada entre la jungla y la roca." },
  { name: "Picos Serpenteantes: Eish Allay", type: "natural", continent: "Marquet", region: "Tierras Salvajes de Oderan", x: 9, y: 64, blurb: "Vallecito escondido en los Picos Serpenteantes." },
  { name: "Lago Koron", type: "natural", continent: "Marquet", region: "Aeshanadoor", x: 26, y: 84, blurb: "Gran lago de Aeshanadoor. Yios se alza en mitad de sus aguas, y de él sale el Canal Lapis hacia el sur." },
  { name: "Seminario Aydinlan", type: "fortaleza", continent: "Marquet", region: "Aeshanadoor", x: 27, y: 86, blurb: "Institución de estudio de Yios, de las que marcan a quien pasa por sus aulas." },
  { name: "Turbión de Seda", type: "ciudad", continent: "Marquet", region: "Aeshanadoor", x: 23, y: 87, blurb: "Ciudad-campamento flotante desde la que la familia Wyvernwind guía a un pueblo genasi del aire disperso por medio mundo. Lleva generaciones viajando; estas últimas décadas, sobre Marquet." },
  { name: "Montañas Kaal", type: "natural", continent: "Marquet", region: "Aeshanadoor", x: 20, y: 86, blurb: "Cordillera del sur que separa las junglas de Aeshanadoor de las Tierras Altas Taladas." },
  { name: "Canal Lapis", type: "natural", continent: "Marquet", region: "Aeshanadoor", x: 28, y: 89, blurb: "Vía de agua que baja del Lago Koron y las Junglas Sombrías hasta el Mar Berilo." },
  { name: "Gelvaan", type: "pueblo", continent: "Marquet", region: "Tierras Altas Taladas", x: 12, y: 82, blurb: "Aldea de campos de hierba alta en un valle elevado de las Tierras Altas. Verde, tranquila y muy lejos de todo." },
  { name: "Sruwargas", type: "ciudad", continent: "Marquet", region: "Tierras Altas Taladas", x: 10, y: 86, blurb: "Sede del Trono Estratos, en lo más alto de las Tierras Altas Taladas." },
  { name: "Volcán Suuthan", type: "peligro", continent: "Marquet", region: "Tierras Altas Taladas", x: 13, y: 89, blurb: "Volcán del extremo sur, en una sierra que nunca termina de calmarse." },

  // ---------------- LOS DIENTES ROTOS ----------------
  { name: "Cortina del Necio", type: "peligro", continent: "Dientes Rotos", region: "Dientes Rotos", x: 65, y: 64, blurb: "Banco de niebla perpetuo que aísla el archipiélago del resto de Exandria; sepulcro de barcos." },
  { name: "Ruukva", type: "natural", continent: "Dientes Rotos", region: "Dientes Rotos", x: 71, y: 72, blurb: "Una de las islas mayores del archipiélago; lo bastante grande para sostener una ciudad entera, Revespire." },
  { name: "Revespire", type: "ciudad", continent: "Dientes Rotos", region: "Dientes Rotos", x: 72, y: 74, blurb: "Ciudad de la Hueste Osendada, en la isla de Ruukva." },
  { name: "Igthuldus", type: "natural", continent: "Dientes Rotos", region: "Dientes Rotos", x: 69, y: 77, blurb: "Isla dominada por el Pico Athos y su boca de lava, las Fauces de Chynes." },
  { name: "Pico Athos", type: "peligro", continent: "Dientes Rotos", region: "Dientes Rotos", x: 69, y: 78, blurb: "Montaña de fuego de Igthuldus. En su cráter, las Fauces de Chynes, donde reposaba una chispa del Emperador del Fuego." },
  { name: "Slival", type: "natural", continent: "Dientes Rotos", region: "Dientes Rotos", x: 74, y: 80, blurb: "Isla de abedules blanquinegros retorcidos en espiral. Allí vive Jirana, a quien llaman la Musaraña de la Orilla." },
  { name: "Shardborne", type: "natural", continent: "Dientes Rotos", region: "Dientes Rotos", x: 74, y: 78, blurb: "Isla justo al norte de Slival." },
  { name: "Arrecife Utu", type: "peligro", continent: "Dientes Rotos", region: "Dientes Rotos", x: 77, y: 73, blurb: "Arrecife del archipiélago; poco fondo y mucha serpiente." },
  { name: "Arrecife Bermellón", type: "peligro", continent: "Dientes Rotos", region: "Dientes Rotos", x: 76, y: 85, blurb: "Arrecife del sur del archipiélago, entre islas que no siempre están donde las dejaste." },
  { name: "Monte Ygora", type: "ruina", continent: "Dientes Rotos", region: "Dientes Rotos", x: 73, y: 77, blurb: "Bajo esta montaña quedaron sellados dos primordiales tras la Fundación. Sobre ella creció Cathmoíra, ciudad hermana de la voladora Avalir. De ambas no queda gran cosa." },
  { name: "Kurunpa-Mina", type: "natural", continent: "Dientes Rotos", region: "Dientes Rotos", x: 82, y: 85, blurb: "Montaña de Evaterena. Su cima y sus entrañas no siempre pertenecen al mismo mundo." },
  { name: "Yutazo", type: "pueblo", continent: "Dientes Rotos", region: "Dientes Rotos", x: 82, y: 84, blurb: "Aldea de Evaterena, al pie del Kurunpa-Mina." },
  { name: "Athova-Rae", type: "natural", continent: "Dientes Rotos", region: "Dientes Rotos", x: 78, y: 78, blurb: "Isla que acoge la aldea de Drobanagos." },
  { name: "Drobanagos", type: "pueblo", continent: "Dientes Rotos", region: "Dientes Rotos", x: 79, y: 79, blurb: "Aldea remota de la isla de Athova-Rae." },
  { name: "Evaterena", type: "natural", continent: "Dientes Rotos", region: "Dientes Rotos", x: 82, y: 83, blurb: "Isla del sur, hogar de una tribu de goliats." },
  { name: "Kalutha", type: "natural", continent: "Dientes Rotos", region: "Dientes Rotos", x: 67, y: 83, blurb: "Isla donde arraiga Evontra'vir, un antiguo espíritu-árbol." },
  { name: "Rumblecusp", type: "peligro", continent: "Dientes Rotos", region: "Dientes Rotos", x: 84, y: 69, blurb: "Isla volcánica adonde el titán Vokodo arrastró criaturas; sus brumas roban los recuerdos." },

  // ---------------- MARES Y ZONAS ----------------
  { name: "Mar de Ozmit", type: "natural", continent: "Mares", region: "Mares", x: 30, y: 44, blurb: "Mar interior que separa Issylra y Tal'Dorei de Marquet." },
  { name: "Océano Lucidiano", type: "natural", continent: "Mares", region: "Mares", x: 57, y: 64, blurb: "El gran océano meridional de Exandria." },
  { name: "Las Profundidades Gélidas", type: "natural", continent: "Mares", region: "Mares", x: 61, y: 7, blurb: "Mares helados del extremo norte del mundo." },
  { name: "Archipiélago Hespet", type: "natural", continent: "Mares", region: "Mares", x: 30, y: 53, blurb: "Cadena de islas dispersas en el Mar de Ozmit, entre Marquet y Tal'Dorei." },
  { name: "Mar Berilo", type: "natural", continent: "Mares", region: "Mares", x: 22, y: 93, blurb: "Mar que baña el sur de Marquet; a él desemboca el Canal Lapis desde el Lago Koron." },
];

export function worldByContinent(): { continent: string; items: WorldPoi[] }[] {
  return CONTINENTS.map((c) => ({ continent: c, items: WORLD_POIS.filter((p) => p.continent === c) }));
}

// Región por nombre (para respaldar pines antiguos sin región guardada).
export const REGION_OF: Record<string, string> = Object.fromEntries(WORLD_POIS.map((p) => [p.name, p.region]));
