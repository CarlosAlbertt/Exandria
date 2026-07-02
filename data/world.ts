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

export const WORLD_POIS: WorldPoi[] = [
  // ---------------- CONTINENTES (etiquetas) ----------------
  { name: "Tal'Dorei", type: "continente", continent: "Tal'Dorei", x: 48, y: 12, blurb: "Continente central de la campaña. República de Tal'Dorei, Syngorn, Riscomartillo y Piedrablanca. Gestiona sus regiones en el mapa de continente." },
  { name: "Issylra", type: "continente", continent: "Issylra", x: 22, y: 5, blurb: "Continente al noroeste, cuna religiosa e histórica de Exandria. Dominado por la teocracia de Vasselheim." },
  { name: "Wildemount", type: "continente", continent: "Wildemount", x: 85, y: 6, blurb: "Continente al este: el Imperio Dwendaliano, la Dinastía Kryn de Xhorhas y la Costa del Serrallo." },
  { name: "Marquet", type: "continente", continent: "Marquet", x: 14, y: 58, blurb: "Continente meridional de desiertos, junglas y tierras altas. En su corazón, la metrópoli de Ank'Harel." },
  { name: "Los Dientes Rotos", type: "continente", continent: "Dientes Rotos", x: 75, y: 58, blurb: "Archipiélago de 43 islas al sur, resto del continente de Domunas, destruido al inicio de la Calamidad. Tras la Cortina del Necio." },

  // ---------------- ISSYLRA ----------------
  { name: "Othanzia", type: "region", continent: "Issylra", x: 23, y: 17, blurb: "Región que abarca la mayoría de las tierras desarrolladas del continente, bajo la teocracia de Vasselheim." },
  { name: "Valle Demithore", type: "region", continent: "Issylra", x: 19, y: 31, blurb: "Valle apartado en Issylra, lejos del dominio de Othanzia." },
  { name: "Montañas Sunderpeak", type: "natural", continent: "Issylra", x: 27, y: 21, blurb: "Cordillera volcánica de Othanzia; alberga la Arboleda Cendrosa." },
  { name: "Montañas Utesspire", type: "natural", continent: "Issylra", x: 14, y: 13, blurb: "Macizo del oeste de Issylra, sobre el Lago Umamu." },
  { name: "Vasselheim", type: "capital", continent: "Issylra", x: 21, y: 19, blurb: "La Ciudad de la Semilla: la urbe más antigua y devota de Exandria, sede de grandes órdenes de fe." },
  { name: "Pyrah", type: "ciudad", continent: "Issylra", x: 29, y: 25, blurb: "Enclave de los Ashari del Fuego junto a un desgarrón elemental, en la Arboleda Cendrosa." },
  { name: "Ria'Doin", type: "ruina", continent: "Issylra", x: 13, y: 15, blurb: "Aldea abandonada a orillas del Lago Umamu, en las Utesspire." },
  { name: "Hishari", type: "pueblo", continent: "Issylra", x: 17, y: 28, blurb: "Aldea nacida como comuna que degeneró en culto, al pie de las montañas." },

  // ---------------- WILDEMOUNT ----------------
  { name: "Imperio Dwendaliano", type: "region", continent: "Wildemount", x: 79, y: 22, blurb: "Nación austera y militarista del oeste de Wildemount, regida desde Rexxentrum." },
  { name: "Xhorhas", type: "region", continent: "Wildemount", x: 91, y: 17, blurb: "Yermos orientales, corazón de la secreta Dinastía Kryn." },
  { name: "Costa del Serrallo", type: "region", continent: "Wildemount", x: 73, y: 40, blurb: "Costa tropical del suroeste; siete ciudades-estado unidas en el Cónclave de Clovis." },
  { name: "Yermos Grisáceos", type: "region", continent: "Wildemount", x: 82, y: 10, blurb: "Tierras salvajes y frías del norte de Wildemount." },
  { name: "Valle del Tuétano", type: "natural", continent: "Wildemount", x: 81, y: 29, blurb: "Valle fronterizo entre el Imperio y Xhorhas, tierra de conflicto." },
  { name: "Cordillera Penumbra", type: "natural", continent: "Wildemount", x: 90, y: 13, blurb: "Sierra sombría del norte de Xhorhas; en su extremo se alza Bazzoxan." },
  { name: "Montañas Cyrios", type: "natural", continent: "Wildemount", x: 75, y: 33, blurb: "Barrera montañosa entre la Costa del Serrallo y el interior." },
  { name: "Rexxentrum", type: "capital", continent: "Wildemount", x: 80, y: 20, blurb: "Capital del Imperio Dwendaliano; el doble de grande que Emon, sede del poder imperial." },
  { name: "Zadash", type: "ciudad", continent: "Wildemount", x: 79, y: 25, blurb: "Ciudad central del Imperio, antaño capital del Dominio de Julous." },
  { name: "Trostenwald", type: "pueblo", continent: "Wildemount", x: 76, y: 30, blurb: "Pueblo cervecero a orillas del lago; donde se conoció la Poderosa Nein." },
  { name: "Bladegarden", type: "fortaleza", continent: "Wildemount", x: 82, y: 30, blurb: "Ciudadela de la Marca Justa, el ejército imperial." },
  { name: "Talonstadt", type: "pueblo", continent: "Wildemount", x: 84, y: 31, blurb: "Ciudad-campamento de refugiados en el borde del Valle del Tuétano." },
  { name: "Uthodurn", type: "ciudad", continent: "Wildemount", x: 83, y: 11, blurb: "Ciudad subterránea de enanos y elfos de la plata, en los Yermos Grisáceos." },
  { name: "Aldea Palebank", type: "pueblo", continent: "Wildemount", x: 88, y: 9, blurb: "Aldea pesquera helada junto al Lago Estrellafría." },
  { name: "Rosohna", type: "capital", continent: "Wildemount", x: 90, y: 20, blurb: "Capital de la Dinastía Kryn, alzada sobre las ruinas de Ghor Dranas, en noche perpetua." },
  { name: "Bazzoxan", type: "fortaleza", continent: "Wildemount", x: 91, y: 13, blurb: "Puesto militar y templo oscuro en el norte de la Cordillera Penumbra." },
  { name: "Asarius", type: "ciudad", continent: "Wildemount", x: 86, y: 17, blurb: "La Ciudad de los Reyes: nexo militar y cultural del noroeste de Xhorhas." },
  { name: "Urzin", type: "pueblo", continent: "Wildemount", x: 93, y: 24, blurb: "Pueblo errante sobre los caparazones de tortugas gigantes de la marisma." },
  { name: "Jigow", type: "pueblo", continent: "Wildemount", x: 95, y: 28, blurb: "Aldea norteña a orillas del Barranco Esmeralda." },
  { name: "Puerto Damali", type: "ciudad", continent: "Wildemount", x: 76, y: 45, blurb: "La mayor ciudad de la Costa del Serrallo y capital del Cónclave de Clovis." },
  { name: "Nicodranas", type: "ciudad", continent: "Wildemount", x: 72, y: 42, blurb: "Ciudad portuaria de placeres y comercio en la Costa del Serrallo." },
  { name: "Gwardan", type: "ciudad", continent: "Wildemount", x: 70, y: 37, blurb: "Ciudad interior en el linde de la Costa del Serrallo y las tierras áridas." },
  { name: "Feolinn", type: "pueblo", continent: "Wildemount", x: 78, y: 48, blurb: "Ciudad-estado del Cónclave de Clovis." },
  { name: "Othe", type: "pueblo", continent: "Wildemount", x: 74, y: 47, blurb: "Ciudad-estado del Cónclave de Clovis." },
  { name: "Puerto Zoon", type: "pueblo", continent: "Wildemount", x: 77, y: 47, blurb: "Ciudad-estado portuaria del Cónclave de Clovis." },
  { name: "Tussoa", type: "pueblo", continent: "Wildemount", x: 71, y: 49, blurb: "Ciudad-estado del Cónclave de Clovis." },

  // ---------------- MARQUET ----------------
  { name: "Desierto Rumedam", type: "region", continent: "Marquet", x: 23, y: 72, blurb: "Vasto desierto que cubre un tercio del continente; en su centro, Ank'Harel." },
  { name: "Valle Hellcatch", type: "region", continent: "Marquet", x: 18, y: 69, blurb: "Yermos polvorientos de cañones; nexo de rutas y aldeas rivales." },
  { name: "Tierras Salvajes de Oderan", type: "region", continent: "Marquet", x: 12, y: 63, blurb: "Valle selvático rodeado de montañas, al noroeste del Hellcatch." },
  { name: "Aeshanadoor", type: "region", continent: "Marquet", x: 25, y: 84, blurb: "Jungla del sur; hogar de la erudita sociedad órquica de Yios." },
  { name: "Tierras Altas Taladas", type: "region", continent: "Marquet", x: 11, y: 84, blurb: "Montañas del suroeste con valles cultivables; poder del Trono Estratos." },
  { name: "Picos Serpenteantes", type: "natural", continent: "Marquet", x: 10, y: 66, blurb: "Cordillera que ciñe las Tierras Salvajes de Oderan." },
  { name: "Ank'Harel", type: "capital", continent: "Marquet", x: 22, y: 74, blurb: "La Ciudad de la Esperanza: metrópoli en el corazón del desierto, regida por J'mon Sa Ord." },
  { name: "Shandal", type: "pueblo", continent: "Marquet", x: 25, y: 71, blurb: "Aldea-oasis cercana a Ank'Harel; tierra natal de Shaun Gilmore." },
  { name: "Shammel", type: "ciudad", continent: "Marquet", x: 29, y: 78, blurb: "Ciudad portuaria y balneario en una bahía de clima suave." },
  { name: "Yios", type: "ciudad", continent: "Marquet", x: 26, y: 85, blurb: "Ciudad órquica de Aeshanadoor; cima del estudio y la influencia colegial." },
  { name: "Gujjar-Serai", type: "ciudad", continent: "Marquet", x: 18, y: 68, blurb: "Sede de la República de Bassur, que gobierna nominalmente el Hellcatch." },
  { name: "Bassuras", type: "ciudad", continent: "Marquet", x: 15, y: 70, blurb: "Ciudad polvorienta y anárquica del Valle Hellcatch." },
  { name: "Trono Estratos", type: "fortaleza", continent: "Marquet", x: 10, y: 85, blurb: "Bastión militar que domina las Tierras Altas Taladas." },

  // ---------------- LOS DIENTES ROTOS ----------------
  { name: "Cortina del Necio", type: "peligro", continent: "Dientes Rotos", x: 65, y: 64, blurb: "Banco de niebla perpetuo que aísla el archipiélago del resto de Exandria." },
  { name: "Ruukvaya", type: "natural", continent: "Dientes Rotos", x: 71, y: 72, blurb: "Una de las islas mayores; alberga la ciudad de Revespire de la Hueste Osendada." },
  { name: "Revespire", type: "ciudad", continent: "Dientes Rotos", x: 72, y: 74, blurb: "Ciudad de la Hueste Osendada en la isla de Ruukvaya." },
  { name: "Athova-Rae", type: "natural", continent: "Dientes Rotos", x: 78, y: 78, blurb: "Isla que acoge la aldea de Drobanagos." },
  { name: "Drobanagos", type: "pueblo", continent: "Dientes Rotos", x: 79, y: 79, blurb: "Aldea de la isla de Athova-Rae." },
  { name: "Evaterena", type: "natural", continent: "Dientes Rotos", x: 82, y: 83, blurb: "Isla hogar de una tribu de goliats." },
  { name: "Kalutha", type: "natural", continent: "Dientes Rotos", x: 67, y: 83, blurb: "Isla donde mora Evontra'vir, un antiguo espíritu-árbol." },
  { name: "Rumblecusp", type: "peligro", continent: "Dientes Rotos", x: 84, y: 69, blurb: "Isla volcánica adonde Vokodo desplazó criaturas de todo Exandria." },

  // ---------------- MARES Y ZONAS ----------------
  { name: "Mar de Ozmit", type: "natural", continent: "Mares", x: 30, y: 44, blurb: "Mar que separa Issylra y Tal'Dorei de Marquet." },
  { name: "Océano Lucidiano", type: "natural", continent: "Mares", x: 57, y: 64, blurb: "El gran océano meridional de Exandria." },
  { name: "Las Profundidades Gélidas", type: "natural", continent: "Mares", x: 61, y: 7, blurb: "Mares helados del extremo norte del mundo." },
  { name: "Archipiélago Hespet", type: "natural", continent: "Mares", x: 30, y: 53, blurb: "Cadena de islas dispersas en el Mar de Ozmit." },
];

export function worldByContinent(): { continent: string; items: WorldPoi[] }[] {
  return CONTINENTS.map((c) => ({ continent: c, items: WORLD_POIS.filter((p) => p.continent === c) }));
}
