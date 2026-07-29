// Puntos de interés por región (nombres del Nomenclátor de Tal'Dorei; las
// descripciones son resúmenes propios). Posición x/y en % sobre el mapa de la
// región — aproximada y ajustable (o colócalas con el modo DM de arrastre).

export type PoiType = "ciudad" | "fortaleza" | "ruina" | "natural" | "peligro" | "cueva" | "campamento";

export type Poi = {
  name: string;
  type: PoiType;
  blurb: string;
  x: number;
  y: number;
  services?: {
    tienda?: string[];   // ids de tienda (Fase C)
    posada?: boolean;    // descanso (Fase D)
    npcs?: string[];     // ids de NPC (Fase E)
    tablon?: boolean;    // tablón de misiones (Fase F)
  };
};

export const POI_ICON: Record<PoiType, string> = {
  ciudad: "fa-city",
  fortaleza: "fa-chess-rook",
  ruina: "fa-dungeon",
  natural: "fa-tree",
  peligro: "fa-skull",
  cueva: "fa-mountain",
  campamento: "fa-campground",
};
export const POI_COLOR: Record<PoiType, string> = {
  ciudad: "var(--color-bronze)",
  fortaleza: "var(--color-arcane)",
  ruina: "var(--color-violet)",
  natural: "var(--color-primitivo)",
  peligro: "var(--color-ember)",
  cueva: "var(--color-arcane-deep)",
  campamento: "var(--color-warm)",
};

export const POIS: Record<string, Poi[]> = {
  "costa-lucidiana": [
    { name: "Stilben", type: "ciudad", blurb: "Puerto portuario de mala fama, nido de contrabando y timos.", x: 35, y: 84 },
    { name: "Drynna", type: "ciudad", blurb: "La Ciudad Estrella, enclave próspero de la costa.", x: 53, y: 20 },
    { name: "Pantano de K'Tawl", type: "peligro", blurb: "Ciénaga traicionera de brumas y criaturas ocultas.", x: 37, y: 63 },
    { name: "Lago Mooren", type: "natural", blurb: "Gran lago que nutre la costa y sus asentamientos.", x: 60, y: 26 },
    { name: "Zephrah", type: "ciudad", blurb: "Hogar de los Ashari del Aire, en un altiplano de las cumbres; custodian un desgarrón al Plano del Aire.", x: 21, y: 55 },
  ],
  "sierras-alabastro": [
    { name: "Piedrablanca", type: "ciudad", blurb: "Ciudad-estado de los De Rolo, marcada por la sombra de los Briarwood.", x: 44, y: 34 },
    { name: "Bosque de Sotosecos", type: "natural", blurb: "Espesura seca de caza y senderos ocultos.", x: 47, y: 76 },
    { name: "Peñascos Salados", type: "natural", blurb: "Acantilados salinos batidos por el viento.", x: 44, y: 12 },
    { name: "Canal Roto", type: "peligro", blurb: "Paso quebrado, ruta peligrosa entre riscos.", x: 88, y: 43 },
    { name: "Vega del Mooren", type: "natural", blurb: "Vega fértil a lo largo del río Anclado.", x: 53, y: 90 },
  ],
  "llanuras-divisorias": [
    { name: "Kymal", type: "ciudad", blurb: "La ciudad del vicio: casinos, apuestas y contrabando.", x: 30, y: 65 },
    { name: "Oestruun", type: "ciudad", blurb: "Gran urbe comercial, cicatrizada por un ataque gnoll.", x: 59, y: 41 },
    { name: "Campos de Turst", type: "natural", blurb: "Graneros de la región; llanuras de labranza.", x: 91, y: 9 },
    { name: "Ruinas de Torthil", type: "ruina", blurb: "Restos de una era olvidada bajo la hierba alta.", x: 18, y: 78 },
    { name: "Tumulosombrío", type: "peligro", blurb: "Túmulos malditos donde los muertos no descansan.", x: 75, y: 43 },
    { name: "Bosque de las Zarzas", type: "natural", blurb: "Espesura de zarzas casi impenetrable.", x: 56, y: 26 },
    { name: "Deastok", type: "ciudad", blurb: "Ciudad comercial de las Llanuras, nudo de caravanas y almacenes entre Emon y el interior.", x: 68, y: 58 },
  ],
  "montanas-torrerrisco": [
    { name: "Riscomartillo", type: "ciudad", blurb: "Gran ciudad enana bajo la montaña; forjas y política de clanes.", x: 46, y: 74 },
    { name: "Fuerte Daxio", type: "fortaleza", blurb: "Fortaleza militar clave de Tal'Dorei.", x: 25, y: 65 },
    { name: "Brasalcázar", type: "fortaleza", blurb: "Bastión ígneo entre los picos.", x: 57, y: 39 },
    { name: "Yug'Voril", type: "ruina", blurb: "Antigua ciudad hundida en las profundidades.", x: 48, y: 80 },
    { name: "Aldea de Jorenn", type: "ciudad", blurb: "Aldea minera acosada por males subterráneos.", x: 75, y: 75 },
    { name: "Grietasombría", type: "peligro", blurb: "Sima oscura de peligros insondables.", x: 20, y: 55 },
    { name: "Terrah", type: "ciudad", blurb: "Hogar de los Ashari de la Tierra, en un valle en cuenco al norte de Riscomartillo; custodian un desgarrón al Plano de la Tierra.", x: 41, y: 42 },
    { name: "Lyrengorn", type: "ciudad", blurb: "Los Picos Élficos; guardianes de auroras y dracoformes.", x: 63, y: 12 },
  ],
  "montanas-crestormentas": [
    { name: "El Bosquehelado", type: "natural", blurb: "Bosque perpetuamente nevado en las alturas.", x: 33, y: 24 },
    { name: "Ruhn-Shak", type: "ruina", blurb: "Ruinas azotadas por tormentas eternas.", x: 68, y: 32 },
    { name: "Marismas de Filtrasueño", type: "peligro", blurb: "Pantano brumoso donde el sueño y la vigilia se confunden.", x: 48, y: 73 },
    { name: "Caverna del Axioma", type: "cueva", blurb: "Gruta de secretos arcanos.", x: 34, y: 38 },
    { name: "Garganta Cenicienta", type: "peligro", blurb: "Grieta ligada al advenimiento del Rey Cinéreo.", x: 55, y: 47 },
  ],
  "peninsula-pleabruma": [
    { name: "Byroden", type: "ciudad", blurb: "Pueblo humilde, cuna de héroes legendarios.", x: 25, y: 18 },
    { name: "Niirdal-Poc", type: "ruina", blurb: "Reliquia de la Calamidad, sede de magia incognoscible.", x: 55, y: 50 },
    { name: "Selva de Pleabruma", type: "natural", blurb: "Jungla brumosa que devora los caminos.", x: 41, y: 43 },
    { name: "Montañas Puntormenta", type: "natural", blurb: "Cumbres tempestuosas y tribus orroyen.", x: 61, y: 8 },
  ],
  "expansion-verdante": [
    { name: "Syngorn", type: "ciudad", blurb: "La ciudad élfica que se desliza entre planos para protegerse.", x: 73, y: 31 },
    { name: "Las Aguaclaros", type: "natural", blurb: "Aguas cristalinas en el corazón del bosque.", x: 37, y: 82 },
    { name: "El Mirescar", type: "peligro", blurb: "Ciénaga oscura de la espesura profunda.", x: 55, y: 61 },
    { name: "La Fortaleza Cambiante", type: "fortaleza", blurb: "Bastión que muda de forma y lugar.", x: 56, y: 42 },
    { name: "Cataratas de Tormor", type: "natural", blurb: "Grandes cascadas de aguas rugientes.", x: 75, y: 40 },
  ],
  "litoral-filofulgor": [
    { name: "Emon", type: "ciudad", blurb: "Capital de Tal'Dorei y sede del Consejo. Puertos, aerobarcos y política.", x: 50, y: 39 },
    { name: "Bahía de las Dagas", type: "natural", blurb: "Una ensenada abierta y amplia al sur de la capital, resguardada del oleaje por la costa recortada. Entre sus calas escondidas se puede fondear sin que nadie te vea desde tierra firme.", x: 46, y: 63 },
    { name: "Puesto Esmeralda", type: "fortaleza", blurb: "Enclave fronterizo en la costa agreste.", x: 74, y: 59 },
    { name: "Cavernas Cienocristal", type: "cueva", blurb: "Grutas de cristal fangoso y ecos antiguos.", x: 32, y: 27 },
    { name: "Cicatriz del Rey Cinéreo", type: "peligro", blurb: "Tierra quemada por un poder de la Calamidad.", x: 64, y: 52 },
    { name: "Ruinas de O'Noa", type: "ruina", blurb: "Los restos de la vieja O'Noa, hoy reasentada.", x: 56, y: 64 },
  ],
};

export function poisFor(slug: string): Poi[] {
  return POIS[slug] ?? [];
}
