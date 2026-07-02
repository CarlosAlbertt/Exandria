// Pines del MUNDO de Exandria sobre el mapa mundial (public/maps/taldorei.jpg,
// 2560x1707). Nombres tomados de la lore de Critical Role; las descripciones son
// resúmenes propios. Posición x/y en % — APROXIMADA (agrupada por continente);
// el DM la ajusta arrastrando en Panel DM › Mapa › Mundo (se guarda en poi_state
// con la "región" sintética __world__, sin migración nueva).
//
// Tal'Dorei se gestiona aparte con sus 8 regiones y sus POIs (ver taldorei.ts /
// pois.ts); aquí solo va su etiqueta de continente para no duplicar pines.

export const WORLD_SLUG = "__world__";

export type WorldType =
  | "continente" | "region" | "capital" | "ciudad" | "pueblo"
  | "fortaleza" | "ruina" | "natural" | "peligro";

export type WorldPoi = {
  name: string;
  type: WorldType;
  continent: string;
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

// Encuadre de cada continente sobre el mapa mundial (para el zoom al clicar) y
// caja aproximada de su masa de tierra (para la niebla de lo no descubierto).
export type ContinentView = { cx: number; cy: number; scale: number; box: { x: number; y: number; w: number; h: number } };
export const CONTINENT_VIEW: Record<string, ContinentView> = {
  "Tal'Dorei": { cx: 49, cy: 38, scale: 2.0, box: { x: 37, y: 14, w: 24, h: 50 } },
  "Issylra": { cx: 21, cy: 22, scale: 2.3, box: { x: 8, y: 3, w: 27, h: 40 } },
  "Wildemount": { cx: 83, cy: 31, scale: 2.0, box: { x: 66, y: 6, w: 34, h: 52 } },
  "Marquet": { cx: 20, cy: 75, scale: 2.1, box: { x: 6, y: 54, w: 29, h: 44 } },
  "Dientes Rotos": { cx: 75, cy: 77, scale: 2.4, box: { x: 61, y: 60, w: 30, h: 34 } },
};

export const WORLD_POIS: WorldPoi[] = [
  // ---------------- CONTINENTES (etiquetas) ----------------
  { name: "Tal'Dorei", type: "continente", continent: "Tal'Dorei", x: 48, y: 12, blurb: "Continente central de la campaña, joven y bullicioso. Reúne la República de Tal'Dorei (desde Emon), el reino élfico de Syngorn, la fortaleza enana de Riscomartillo y la ciudad-estado de Piedrablanca. Levantado sobre las ruinas de la Calamidad; gestiona sus regiones en el mapa de continente." },
  { name: "Issylra", type: "continente", continent: "Issylra", x: 22, y: 5, blurb: "Continente al noroeste, cuna religiosa e histórica de Exandria. Aquí los dioses conocieron a los titanes en la Fundación (Puente Ascendente). Dominado por la teocracia de Vasselheim." },
  { name: "Wildemount", type: "continente", continent: "Wildemount", x: 85, y: 6, blurb: "Continente al este de Tal'Dorei, de climas extremos y viejas heridas. Alberga el Imperio Dwendaliano (oeste), la secreta Dinastía Kryn de Xhorhas (este) y la próspera Costa del Serrallo. Escenario de la campaña de la Poderosa Nein." },
  { name: "Marquet", type: "continente", continent: "Marquet", x: 14, y: 58, blurb: "Continente meridional de desiertos abrasadores, junglas y tierras altas. Un tercio lo cubren las arenas del Rumedam, en cuyo corazón brilla la metrópoli de Ank'Harel. Escenario de la campaña de Bells Hells." },
  { name: "Los Dientes Rotos", type: "continente", continent: "Dientes Rotos", x: 75, y: 58, blurb: "Archipiélago aislado de 43 islas al sur, tras el banco de niebla de la Cortina del Necio. Es cuanto queda del continente de Domunas, hecho añicos al inicio de la Calamidad con la caída de la ciudad voladora de Avalir." },

  // ---------------- ISSYLRA ----------------
  { name: "Othanzia", type: "region", continent: "Issylra", x: 23, y: 17, blurb: "El territorio más desarrollado de Issylra, que agrupa la mayoría de sus dominios bajo la protección y el gobierno de la teocracia de Vasselheim." },
  { name: "Valle Demithore", type: "region", continent: "Issylra", x: 19, y: 31, blurb: "Valle remoto y verde de Issylra, apartado del dominio de Othanzia; tierra de comunidades aisladas y de secretos que la fe prefiere no remover." },
  { name: "Montañas Sunderpeak", type: "natural", continent: "Issylra", x: 27, y: 21, blurb: "Cordillera volcánica de Othanzia. En su Arboleda Cendrosa, junto a un desgarrón al Plano del Fuego, vela el enclave de Pyrah." },
  { name: "Montañas Utesspire", type: "natural", continent: "Issylra", x: 14, y: 13, blurb: "Macizo escarpado del oeste de Issylra que se alza sobre el Lago Umamu; tierra fría, alta y poco hollada." },
  { name: "Vasselheim", type: "capital", continent: "Issylra", x: 21, y: 19, blurb: "La Ciudad de la Semilla: la urbe más antigua y devota de Exandria, superviviente de la Calamidad. Sede de grandes órdenes de fe (el Alba, la Matriarca de Cuervos, el Amanecer Platino) y de la Caza Gris." },
  { name: "Pyrah", type: "ciudad", continent: "Issylra", x: 29, y: 25, blurb: "Enclave de los Ashari del Fuego que custodia un desgarrón al Plano Elemental del Fuego en la Arboleda Cendrosa. Arrasado más de una vez por dragones, siempre renace de sus cenizas." },
  { name: "Ria'Doin", type: "ruina", continent: "Issylra", x: 13, y: 15, blurb: "Aldea abandonada a orillas del Lago Umamu, en las Utesspire; hoy, ruinas silenciosas azotadas por el viento de montaña." },
  { name: "Hishari", type: "pueblo", continent: "Issylra", x: 17, y: 28, blurb: "Aldea que nació como comuna idealista al pie de las montañas y acabó degenerando en un culto cerrado y receloso de los forasteros." },

  // ---------------- WILDEMOUNT ----------------
  { name: "Imperio Dwendaliano", type: "region", continent: "Wildemount", x: 79, y: 22, blurb: "Nación austera y militarista que domina el oeste de Wildemount (Wynandir Occidental). Regida con mano dura por el rey Bertrand Dwendal desde Rexxentrum, con culto al Padre Tormenta y a la Luz del Alba impuesto por decreto." },
  { name: "Xhorhas", type: "region", continent: "Wildemount", x: 91, y: 17, blurb: "Vastos yermos orientales, tierra hostil de sombras y monstruos. Corazón de la secreta Dinastía Kryn, enfrentada al Imperio por las balizas del Luxon." },
  { name: "Costa del Serrallo", type: "region", continent: "Wildemount", x: 73, y: 40, blurb: "Litoral tropical y próspero del suroeste, de puertos bulliciosos, comercio y contrabando. Siete ciudades-estado unidas bajo el Cónclave de Clovis." },
  { name: "Yermos Grisáceos", type: "region", continent: "Wildemount", x: 82, y: 10, blurb: "Tierras salvajes, frías y brumosas del norte de Wildemount, entre el Imperio y Xhorhas; refugio de exiliados y hogar de la ciudad de Uthodurn." },
  { name: "Valle del Tuétano", type: "natural", continent: "Wildemount", x: 81, y: 29, blurb: "Corredor fronterizo entre el Imperio y Xhorhas, sembrado de fortalezas y campos de batalla: la primera línea de la guerra." },
  { name: "Cordillera Penumbra", type: "natural", continent: "Wildemount", x: 90, y: 13, blurb: "Sierra tenebrosa del norte de Xhorhas. En su extremo, sobre los Campos Espinados, vela la fortaleza-templo de Bazzoxan contra lo que repta bajo la tierra." },
  { name: "Montañas Cyrios", type: "natural", continent: "Wildemount", x: 75, y: 33, blurb: "Barrera montañosa que separa la Costa del Serrallo del interior imperial; pasos difíciles y minas disputadas." },
  { name: "Rexxentrum", type: "capital", continent: "Wildemount", x: 80, y: 20, blurb: "Capital del Imperio Dwendaliano y mayor ciudad de Wildemount (el doble que Emon). Sede del rey Bertrand Dwendal, la Escuela Soltryce y los Ojos de Cinco Puntas." },
  { name: "Zadash", type: "ciudad", continent: "Wildemount", x: 79, y: 25, blurb: "Ciudad amurallada en el centro del Imperio, antaño capital del Dominio de Julous. Nudo de gremios, el Tribunal y los vigilantes Ojos de Cinco Puntas." },
  { name: "Trostenwald", type: "pueblo", continent: "Wildemount", x: 76, y: 30, blurb: "Pueblo cervecero a orillas de un lago, famoso por sus tres cervecerías; allí se conoció por primera vez la Poderosa Nein." },
  { name: "Bladegarden", type: "fortaleza", continent: "Wildemount", x: 82, y: 30, blurb: "Ciudadela fronteriza de la Marca Justa, el ejército imperial; bastión clave frente a Xhorhas (antes llamada Puerto Cementerio)." },
  { name: "Talonstadt", type: "pueblo", continent: "Wildemount", x: 84, y: 31, blurb: "Ciudad-campamento de refugiados, de lona y barro, en el borde oriental del Valle del Tuétano, junto a la frontera de Xhorhas." },
  { name: "Uthodurn", type: "ciudad", continent: "Wildemount", x: 83, y: 11, blurb: "Ciudad subterránea compartida por enanos y elfos de la plata, excavada en los Yermos Grisáceos; forja, plata y frío perpetuo." },
  { name: "Aldea Palebank", type: "pueblo", continent: "Wildemount", x: 88, y: 9, blurb: "Aldea pesquera helada a orillas del Lago Estrellafría, en los Yermos Grisáceos; puerta al norte olvidado." },
  { name: "Rosohna", type: "capital", continent: "Wildemount", x: 90, y: 20, blurb: "Capital de la Dinastía Kryn, alzada sobre las ruinas de Ghor Dranas (viejo bastión de los Traidores). \"Renacer\" en drow: metrópoli en noche perpetua, iluminada por faroles arcanos, devota del Luxon y la consecución." },
  { name: "Bazzoxan", type: "fortaleza", continent: "Wildemount", x: 91, y: 13, blurb: "Puesto militar y antiguo templo oscuro en el norte de la Penumbra; sus guarniciones contienen sin descanso a los horrores que suben de las ruinas de la Calamidad." },
  { name: "Asarius", type: "ciudad", continent: "Wildemount", x: 86, y: 17, blurb: "La Ciudad de los Reyes: nexo militar y cultural del pueblo yermo del noroeste de Xhorhas, bajo la Dinastía Kryn." },
  { name: "Urzin", type: "pueblo", continent: "Wildemount", x: 93, y: 24, blurb: "Pueblo errante que avanza despacio por la marisma sobre los caparazones musgosos de unas cuarenta tortugas horizonte gigantes." },
  { name: "Jigow", type: "pueblo", continent: "Wildemount", x: 95, y: 28, blurb: "Aldea norteña a orillas del Barranco Esmeralda, célebre por sus ferias y su Festival de la Búsqueda." },
  { name: "Puerto Damali", type: "ciudad", continent: "Wildemount", x: 76, y: 45, blurb: "La mayor y más rica ciudad de la Costa del Serrallo y capital del Cónclave de Clovis; gran puerto de comercio libre." },
  { name: "Nicodranas", type: "ciudad", continent: "Wildemount", x: 72, y: 42, blurb: "Ciudad portuaria de placeres, mercados y niebla marina en la Costa del Serrallo; hogar del Distrito de las Mareas y del salón del Rubí del Mar." },
  { name: "Gwardan", type: "ciudad", continent: "Wildemount", x: 70, y: 37, blurb: "Ciudad de caravanas en el linde de la Costa del Serrallo y las tierras áridas; crisol de culturas y pueblos nómadas." },
  { name: "Feolinn", type: "pueblo", continent: "Wildemount", x: 78, y: 48, blurb: "Una de las siete ciudades-estado del Cónclave de Clovis, en la Costa del Serrallo." },
  { name: "Othe", type: "pueblo", continent: "Wildemount", x: 74, y: 47, blurb: "Ciudad-estado insular del Cónclave de Clovis, entre las Islas Swavain." },
  { name: "Puerto Zoon", type: "pueblo", continent: "Wildemount", x: 77, y: 47, blurb: "Ciudad-estado portuaria del Cónclave de Clovis, de muelles siempre abiertos al comercio." },
  { name: "Tussoa", type: "pueblo", continent: "Wildemount", x: 71, y: 49, blurb: "Ciudad-estado del Cónclave de Clovis, en la cálida costa del Serrallo." },

  // ---------------- MARQUET ----------------
  { name: "Desierto Rumedam", type: "region", continent: "Marquet", x: 23, y: 72, blurb: "Inmenso desierto que cubre casi un tercio de Marquet, salpicado de oasis y caravanas. En su centro se alza Ank'Harel." },
  { name: "Valle Hellcatch", type: "region", continent: "Marquet", x: 18, y: 69, blurb: "Yermos de cañones polvorientos en el centro de Marquet; nexo de rutas y aldeas independientes que compiten por el dominio, bajo la nominal República de Bassur." },
  { name: "Tierras Salvajes de Oderan", type: "region", continent: "Marquet", x: 12, y: 63, blurb: "Valle selvático rodeado de montañas al noroeste del Hellcatch; naturaleza indómita y tribus aisladas." },
  { name: "Aeshanadoor", type: "region", continent: "Marquet", x: 25, y: 84, blurb: "Jungla húmeda del sur de Marquet; hogar de la erudita sociedad órquica de la Corte del Sendero Lúcido y de la ciudad de Yios." },
  { name: "Tierras Altas Taladas", type: "region", continent: "Marquet", x: 11, y: 84, blurb: "Montañas del suroeste con valles y mesetas cultivables; su poderío militar reside en el Trono Estratos." },
  { name: "Picos Serpenteantes", type: "natural", continent: "Marquet", x: 10, y: 66, blurb: "Cordillera que ciñe las Tierras Salvajes de Oderan; cumbres retorcidas de difícil paso." },
  { name: "Ank'Harel", type: "capital", continent: "Marquet", x: 22, y: 74, blurb: "La Ciudad de la Esperanza: gran metrópoli en el corazón del Desierto Rumedam, regida por el enigmático J'mon Sa Ord (un dragón de bronce). Encrucijada de comercio, gremios y la orden secreta del Alba de Cobalto." },
  { name: "Shandal", type: "pueblo", continent: "Marquet", x: 25, y: 71, blurb: "Aldea-oasis del Rumedam, cercana a Ank'Harel; tierra natal del mercader y mago Shaun Gilmore." },
  { name: "Shammel", type: "ciudad", continent: "Marquet", x: 29, y: 78, blurb: "Ciudad portuaria y balneario en una bahía de clima templado; refugio de descanso frente al rigor del desierto." },
  { name: "Yios", type: "ciudad", continent: "Marquet", x: 26, y: 85, blurb: "Ciudad de Aeshanadoor regida por orcos eruditos; cumbre del estudio y la influencia colegial de Marquet." },
  { name: "Gujjar-Serai", type: "ciudad", continent: "Marquet", x: 18, y: 68, blurb: "Sede de la República de Bassur, que gobierna nominalmente el caótico Valle Hellcatch." },
  { name: "Bassuras", type: "ciudad", continent: "Marquet", x: 15, y: 70, blurb: "Ciudad polvorienta y sin ley del Valle Hellcatch; carreras de vehículos de chatarra y bandas rivales." },
  { name: "Trono Estratos", type: "fortaleza", continent: "Marquet", x: 10, y: 85, blurb: "Bastión y poder militar que domina las Tierras Altas Taladas del suroeste de Marquet." },

  // ---------------- LOS DIENTES ROTOS ----------------
  { name: "Cortina del Necio", type: "peligro", continent: "Dientes Rotos", x: 65, y: 64, blurb: "Banco de niebla perpetuo y casi infranqueable que aísla el archipiélago del resto de Exandria; sepulcro de innumerables barcos." },
  { name: "Ruukvaya", type: "natural", continent: "Dientes Rotos", x: 71, y: 72, blurb: "Una de las islas mayores del archipiélago; alberga Revespire, ciudad de la Hueste Osendada." },
  { name: "Revespire", type: "ciudad", continent: "Dientes Rotos", x: 72, y: 74, blurb: "Ciudad de la Hueste Osendada, en la isla de Ruukvaya; sociedad marcada por la muerte y sus ritos." },
  { name: "Athova-Rae", type: "natural", continent: "Dientes Rotos", x: 78, y: 78, blurb: "Isla del archipiélago que acoge la aislada aldea de Drobanagos." },
  { name: "Drobanagos", type: "pueblo", continent: "Dientes Rotos", x: 79, y: 79, blurb: "Aldea remota de la isla de Athova-Rae, en los Dientes Rotos." },
  { name: "Evaterena", type: "natural", continent: "Dientes Rotos", x: 82, y: 83, blurb: "Isla del sur del archipiélago, hogar de una tribu de goliats." },
  { name: "Kalutha", type: "natural", continent: "Dientes Rotos", x: 67, y: 83, blurb: "Isla donde arraiga Evontra'vir, un antiquísimo espíritu-árbol guardián de memorias." },
  { name: "Rumblecusp", type: "peligro", continent: "Dientes Rotos", x: 84, y: 69, blurb: "Isla volcánica adonde el titán Vokodo arrastró criaturas de todo Exandria; sus brumas roban los recuerdos a quien pisa la playa." },

  // ---------------- MARES Y ZONAS ----------------
  { name: "Mar de Ozmit", type: "natural", continent: "Mares", x: 30, y: 44, blurb: "Mar interior que separa Issylra y Tal'Dorei de Marquet; rutas mercantes y piratas por igual." },
  { name: "Océano Lucidiano", type: "natural", continent: "Mares", x: 57, y: 64, blurb: "El gran océano meridional que baña Tal'Dorei, la Costa del Serrallo y el sur del mundo." },
  { name: "Las Profundidades Gélidas", type: "natural", continent: "Mares", x: 61, y: 7, blurb: "Mares helados del extremo norte de Exandria; icebergs, criaturas abisales y rutas casi imposibles." },
  { name: "Archipiélago Hespet", type: "natural", continent: "Mares", x: 30, y: 53, blurb: "Cadena de islas dispersas en el Mar de Ozmit, entre Marquet y Tal'Dorei." },
];

export function worldByContinent(): { continent: string; items: WorldPoi[] }[] {
  return CONTINENTS.map((c) => ({ continent: c, items: WORLD_POIS.filter((p) => p.continent === c) }));
}
