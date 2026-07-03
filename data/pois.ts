// Puntos de interés por región (nombres del Nomenclátor de Tal'Dorei; las
// descripciones son resúmenes propios). Posición x/y en % sobre el mapa de la
// región — aproximada y ajustable (o colócalas con el modo DM de arrastre).

export type PoiType = "ciudad" | "fortaleza" | "ruina" | "natural" | "peligro";

export type Poi = {
  name: string;
  type: PoiType;
  blurb: string;
  x: number;
  y: number;
};

export const POI_ICON: Record<PoiType, string> = {
  ciudad: "fa-city",
  fortaleza: "fa-chess-rook",
  ruina: "fa-dungeon",
  natural: "fa-tree",
  peligro: "fa-skull",
};
export const POI_COLOR: Record<PoiType, string> = {
  ciudad: "var(--color-bronze)",
  fortaleza: "var(--color-arcane)",
  ruina: "var(--color-violet)",
  natural: "var(--color-primitivo)",
  peligro: "var(--color-ember)",
};

export const POIS: Record<string, Poi[]> = {
  "costa-lucidiana": [
    { name: "Emon", type: "ciudad", blurb: "Capital de Tal'Dorei y sede del Consejo. Puertos, aerobarcos y política.", x: 40, y: 40 },
    { name: "Stilben", type: "ciudad", blurb: "Puerto portuario de mala fama, nido de contrabando y timos.", x: 58, y: 30 },
    { name: "Drynna", type: "ciudad", blurb: "La Ciudad Estrella, enclave próspero de la costa.", x: 30, y: 60 },
    { name: "Pantano de K'Tawl", type: "peligro", blurb: "Ciénaga traicionera de brumas y criaturas ocultas.", x: 62, y: 62 },
    { name: "Lago Anclado", type: "natural", blurb: "Gran lago que nutre la costa y sus asentamientos.", x: 48, y: 74 },
  ],
  "sierras-alabastro": [
    { name: "Piedrablanca", type: "ciudad", blurb: "Ciudad-estado de los De Rolo, marcada por la sombra de los Briarwood.", x: 45, y: 40 },
    { name: "Bosque de Sotosecos", type: "natural", blurb: "Espesura seca de caza y senderos ocultos.", x: 30, y: 62 },
    { name: "Peñascos Salados", type: "natural", blurb: "Acantilados salinos batidos por el viento.", x: 66, y: 55 },
    { name: "Canal Roto", type: "peligro", blurb: "Paso quebrado, ruta peligrosa entre riscos.", x: 60, y: 30 },
    { name: "Rivera del río Anclado", type: "natural", blurb: "Vega fértil a lo largo del río Anclado.", x: 40, y: 74 },
  ],
  "llanuras-divisorias": [
    { name: "Kymal", type: "ciudad", blurb: "La ciudad del vicio: casinos, apuestas y contrabando.", x: 45, y: 45 },
    { name: "Oestruun", type: "ciudad", blurb: "Gran urbe comercial, cicatrizada por un ataque gnoll.", x: 30, y: 35 },
    { name: "Campos de Turst", type: "natural", blurb: "Graneros de la región; llanuras de labranza.", x: 25, y: 60 },
    { name: "Ruinas de Torthil", type: "ruina", blurb: "Restos de una era olvidada bajo la hierba alta.", x: 62, y: 55 },
    { name: "Tumulosombrío", type: "peligro", blurb: "Túmulos malditos donde los muertos no descansan.", x: 68, y: 70 },
    { name: "Bosque de las Zarzas", type: "natural", blurb: "Espesura de zarzas casi impenetrable.", x: 55, y: 30 },
    { name: "Deastok", type: "ciudad", blurb: "Ciudad comercial de las Llanuras, nudo de caravanas y almacenes entre Emon y el interior.", x: 40, y: 48 },
  ],
  "montanas-torrerrisco": [
    { name: "Riscomartillo", type: "ciudad", blurb: "Gran ciudad enana bajo la montaña; forjas y política de clanes.", x: 42, y: 48 },
    { name: "Fort Daxio", type: "fortaleza", blurb: "Fortaleza militar clave de Tal'Dorei.", x: 30, y: 30 },
    { name: "Brasalcázar", type: "fortaleza", blurb: "Bastión ígneo entre los picos.", x: 58, y: 40 },
    { name: "Yug'Voril", type: "ruina", blurb: "Antigua ciudad hundida en las profundidades.", x: 50, y: 62 },
    { name: "Aldea de Jorenn", type: "ciudad", blurb: "Aldea minera acosada por males subterráneos.", x: 68, y: 55 },
    { name: "Grietasombría", type: "peligro", blurb: "Sima oscura de peligros insondables.", x: 25, y: 60 },
    { name: "Terrah", type: "ciudad", blurb: "Hogar de los Ashari de la Tierra, en un valle en cuenco al norte de Riscomartillo; custodian un desgarrón al Plano de la Tierra.", x: 38, y: 30 },
  ],
  "montanas-crestormentas": [
    { name: "Lyrengorn", type: "ciudad", blurb: "Los Picos Élficos; guardianes de auroras y dracoformes.", x: 50, y: 30 },
    { name: "El Bosquehelado", type: "natural", blurb: "Bosque perpetuamente nevado en las alturas.", x: 40, y: 55 },
    { name: "Ruhn-Shak", type: "ruina", blurb: "Ruinas azotadas por tormentas eternas.", x: 62, y: 60 },
    { name: "Marismas de Filtrasueño", type: "peligro", blurb: "Pantano brumoso donde el sueño y la vigilia se confunden.", x: 30, y: 72 },
    { name: "Caverna del Axioma", type: "ruina", blurb: "Gruta de secretos arcanos.", x: 70, y: 40 },
    { name: "Zephrah", type: "ciudad", blurb: "Hogar de los Ashari del Aire, en un altiplano de las cumbres; custodian un desgarrón al Plano del Aire.", x: 45, y: 22 },
  ],
  "peninsula-pleabruma": [
    { name: "Byroden", type: "ciudad", blurb: "Pueblo humilde, cuna de héroes legendarios.", x: 45, y: 35 },
    { name: "Niirdal-Poc", type: "ruina", blurb: "Reliquia de la Calamidad, sede de magia incognoscible.", x: 58, y: 55 },
    { name: "Selva de Pleabruma", type: "natural", blurb: "Jungla brumosa que devora los caminos.", x: 35, y: 62 },
    { name: "Montañas Puntormenta", type: "peligro", blurb: "Cumbres tempestuosas y tribus orroyen.", x: 62, y: 30 },
    { name: "Abismo de Cerrofauces", type: "peligro", blurb: "Grieta ligada al advenimiento del Rey Cinéreo.", x: 50, y: 78 },
  ],
  "expansion-verdante": [
    { name: "Syngorn", type: "ciudad", blurb: "La ciudad élfica que se desliza entre planos para protegerse.", x: 45, y: 45 },
    { name: "Las Aguaclaros", type: "natural", blurb: "Aguas cristalinas en el corazón del bosque.", x: 30, y: 60 },
    { name: "El Mirescar", type: "peligro", blurb: "Ciénaga oscura de la espesura profunda.", x: 62, y: 55 },
    { name: "La Fortaleza Cambiante", type: "fortaleza", blurb: "Bastión que muda de forma y lugar.", x: 55, y: 32 },
    { name: "Cataratas de Tormor", type: "natural", blurb: "Grandes cascadas de aguas rugientes.", x: 38, y: 74 },
  ],
  "litoral-filofulgor": [
    { name: "Bahía de las Dagas", type: "ciudad", blurb: "Puerto de piratas y contrabandistas entre acantilados.", x: 45, y: 40 },
    { name: "Puesto Esmeralda", type: "fortaleza", blurb: "Enclave fronterizo en la costa agreste.", x: 55, y: 58 },
    { name: "Cavernas Cienocristal", type: "ruina", blurb: "Grutas de cristal fangoso y ecos antiguos.", x: 30, y: 55 },
    { name: "Cicatriz del Rey Cinéreo", type: "peligro", blurb: "Tierra quemada por un poder de la Calamidad.", x: 60, y: 30 },
    { name: "Ruinas de O'Noa", type: "ruina", blurb: "Los restos de la vieja O'Noa, hoy reasentada.", x: 40, y: 74 },
  ],
};

export function poisFor(slug: string): Poi[] {
  return POIS[slug] ?? [];
}
