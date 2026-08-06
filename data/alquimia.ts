// Ingredientes de alquimia: los materiales con los que se preparan pociones
// usando la pericia de oficio **Alquimia** (`data/rules.ts`).
//
// Setting propio de la campaña. Los nombres y descripciones son originales del
// DM; los sitios que se citan (Emon, Xhorhas, Eiselcross, Ank'Harel, Whitestone,
// Kraghammer, Vasselheim, Blightshore, Pyrah, Aeor, Savalirwood, la Expansión
// Verdante, el Océano Lucidian, el Norte Mordiente, Rifenmist, Marquet) son
// lugares de Exandria que la app ya conoce por el atlas y el saber.
//
// **Todavía NO tienen mecánica**: ni CD, ni receta, ni efecto. Eso llega con la
// mecánica de las pericias (ver `docs/pericias-borrador.md`). Aquí están el
// catálogo y su procedencia, que es lo que se necesita para no perderlos.

export type IngredienteCategoria = "flora" | "fauna" | "mineral" | "esencia";

export type Ingrediente = {
  /** Número de catálogo, estable: es como se referencian entre sesiones. */
  n: number;
  name: string;
  category: IngredienteCategoria;
  /** Qué es y cómo se reconoce. Redacción del DM. */
  blurb: string;
};

export const CATEGORIA_LABEL: Record<IngredienteCategoria, string> = {
  flora: "Flora exandriana",
  fauna: "Fauna y monstruos",
  mineral: "Minerales, polvos y tierras",
  esencia: "Esencias, fluidos y elementos místicos",
};

export const INGREDIENTES: Ingrediente[] = [
  // --- Flora: botánica, raíces y hongos ------------------------------------
  { n: 1, name: "Raíz de Oloore", category: "flora", blurb: "Una raíz pálida y nudosa que induce viajes astrales y calma." },
  { n: 2, name: "Hojas de Suude crudo", category: "flora", blurb: "Hojas rojizas de las que se extrae la famosa y peligrosa droga potenciadora de magia." },
  { n: 3, name: "Musgo marchito de Savalirwood", category: "flora", blurb: "Musgo grisáceo y tóxico impregnado de magia corrupta." },
  { n: 4, name: "Lirio de la Niebla de Emon", category: "flora", blurb: "Una flor blanca que solo florece en la niebla matutina." },
  { n: 5, name: "Corteza de Árbol de Hierro", category: "flora", blurb: "Extremadamente dura, usada para hervir tés de resistencia." },
  { n: 6, name: "Esporas Bioluminiscentes del Underdark", category: "flora", blurb: "Polvo de hongos que brilla en la oscuridad." },
  { n: 7, name: "Flor de Loto de Hielo", category: "flora", blurb: "Nativas de Eiselcross; sus pétalos están siempre congelados." },
  { n: 8, name: "Raíz de Mandrágora de Rifenmist", category: "flora", blurb: "Grita débilmente al ser arrancada; muy venenosa." },
  { n: 9, name: "Semillas de Sandkheg", category: "flora", blurb: "Semillas del desierto de Marquet usadas para fermentar ácidos." },
  { n: 10, name: "Vid Sangrienta de Xhorhas", category: "flora", blurb: "Una enredadera roja y carnosa que palpita como venas." },
  { n: 11, name: "Sombrero de Hongo Letal", category: "flora", blurb: "Un hongo común pero mortal si no se hierve." },
  { n: 12, name: "Pétalos de Rosa de Ceniza", category: "flora", blurb: "Flores que crecen cerca de las fisuras volcánicas de los Ashari." },
  { n: 13, name: "Helecho de Sombras", category: "flora", blurb: "Planta del Páramo Sombrío que absorbe la luz a su alrededor." },
  { n: 14, name: "Alga del Océano Lucidian", category: "flora", blurb: "Algas ricas en sal, ideales para pociones de respiración acuática." },
  { n: 15, name: "Cardo de Fuego", category: "flora", blurb: "Una mala hierba picante que quema la lengua al tocarla." },
  { n: 16, name: "Néctar de Flor Feérica", category: "flora", blurb: "Un líquido dulce y tornasolado de la Expansión Verdante." },
  { n: 17, name: "Bulbo de Sueño", category: "flora", blurb: "Una cebolla morada que emite un gas somnífero al cortarse." },
  { n: 18, name: "Cactus de Cristal de Ank'Harel", category: "flora", blurb: "Un cactus cuya savia parece cristal líquido." },
  { n: 19, name: "Agujas de Pino del Norte Mordiente", category: "flora", blurb: "Perforan la piel si no se manipulan con guantes." },
  { n: 20, name: "Liquen de Tumba", category: "flora", blurb: "Crece exclusivamente sobre lápidas o huesos antiguos." },

  // --- Fauna: glándulas, sangre y restos -----------------------------------
  { n: 21, name: "Sangre de Basilisco", category: "fauna", blurb: "Sangre negra y espesa." },
  { n: 22, name: "Glándula de veneno de Wyvern", category: "fauna", blurb: "Un saco gomoso lleno de toxina verde letal." },
  { n: 23, name: "Ojo de Observador desecado", category: "fauna", blurb: "Un ojo lateral endurecido como una piedra." },
  { n: 24, name: "Escama de Dragón Cromático", category: "fauna", blurb: "Imbuida con el elemento de su escama." },
  { n: 25, name: "Polvo de ala de Hada", category: "fauna", blurb: "Brillantina mágica extremadamente volátil." },
  { n: 26, name: "Cuerno de Minotauro pulverizado", category: "fauna", blurb: "Un polvo ocre que huele a bestia y sudor." },
  { n: 27, name: "Pelo de Licántropo", category: "fauna", blurb: "Pelo de hombre lobo, útil para pociones de transformación o fuerza." },
  { n: 28, name: "Colmillo de Araña Gigante", category: "fauna", blurb: "Hueco por dentro, a menudo usado como jeringuilla." },
  { n: 29, name: "Corazón de Elemental de Fuego", category: "fauna", blurb: "Un carbón caliente que nunca se apaga; un ascua perpetua." },
  { n: 30, name: "Baba de Mímico", category: "fauna", blurb: "Un adhesivo natural increíblemente fuerte y pegajoso." },
  { n: 31, name: "Pluma de Grifo", category: "fauna", blurb: "Una pluma rígida cargada de inercia del viento." },
  { n: 32, name: "Ojo petrificante de Medusa", category: "fauna", blurb: "Cristalizado y peligroso de mirar directamente." },
  { n: 33, name: "Ácido de Fango Negro", category: "fauna", blurb: "Un vial de lodo que disuelve madera y carne." },
  { n: 34, name: "Sangre de Troll", category: "fauna", blurb: "Hierve y burbujea sola en el frasco, intentando regenerarse." },
  { n: 35, name: "Cerebelo de Azotamentes", category: "fauna", blurb: "Tejido cerebral alienígena conservado en formol." },
  { n: 36, name: "Hueso de Esqueleto Calcinado", category: "fauna", blurb: "Restos de un no-muerto quemado con fuego sagrado." },
  { n: 37, name: "Escama de Tiburón de Arena", category: "fauna", blurb: "Áspera como papel de lija, del desierto de Marquet." },
  { n: 38, name: "Seda de Araña de Fase", category: "fauna", blurb: "Hilos que parpadean entre el plano material y el etéreo." },
  { n: 39, name: "Lengua de Sapo Gigante", category: "fauna", blurb: "Elástica y rica en encimas digestivas." },
  { n: 40, name: "Garra de Oso Lechuza", category: "fauna", blurb: "Gruesa, perfecta para pociones de furia o fuerza." },
  { n: 41, name: "Tinta de Kraken diluida", category: "fauna", blurb: "Tinta negra como el vacío marino que enturbia el agua." },
  { n: 42, name: "Caparazón de Escarabajo de Fuego", category: "fauna", blurb: "Un exoesqueleto incandescente." },
  { n: 43, name: "Veneno de Serpiente de las Dunas", category: "fauna", blurb: "Un veneno amarillento que coagula la sangre." },
  { n: 44, name: "Saliva de Sabueso Infernal", category: "fauna", blurb: "Ácido gástrico que huele a azufre ardiente." },
  { n: 45, name: "Cuerno de Demonio triturado", category: "fauna", blurb: "Polvo de un demonio muerto; peligroso de ingerir." },

  // --- Minerales, polvos y tierras -----------------------------------------
  { n: 46, name: "Polvo de Residuum puro", category: "mineral", blurb: "Cristal verde molido de Whitestone; el amplificador mágico por excelencia." },
  { n: 47, name: "Fragmento de Azuremita", category: "mineral", blurb: "Un cristal azul de Kraghammer que reacciona a la energía psiónica." },
  { n: 48, name: "Arena de Reloj Dunamántico", category: "mineral", blurb: "Arena fina plateada que fluye hacia arriba en lugar de caer." },
  { n: 49, name: "Sal negra de Blightshore", category: "mineral", blurb: "Sal marina corrompida por la radiación de la Calamidad." },
  { n: 50, name: "Azufre del Páramo de Ceniza", category: "mineral", blurb: "Polvo amarillo asfixiante e inflamable." },
  { n: 51, name: "Polvo de Hielo Negro", category: "mineral", blurb: "Mineral nigromántico encontrado en las ruinas de Aeor." },
  { n: 52, name: "Obsidiana del Monte Mentiri", category: "mineral", blurb: "Roca volcánica afilada como una cuchilla." },
  { n: 53, name: "Ceniza Volcánica de Pyrah", category: "mineral", blurb: "Tierra fértil pero ardiente." },
  { n: 54, name: "Cristal de Sal Marina del Lucidian", category: "mineral", blurb: "Cristales de sal puros, grandes como el puño." },
  { n: 55, name: "Polvo de Plata purificada", category: "mineral", blurb: "Metal sagrado esencial para combatir no-muertos y licántropos." },
  { n: 56, name: "Limaduras de Hierro Frío", category: "mineral", blurb: "Metal repelente de hadas y criaturas feéricas." },
  { n: 57, name: "Geoda de Turmalina aplastada", category: "mineral", blurb: "Gema que almacena electricidad estática natural." },
  { n: 58, name: "Mercurio refinado", category: "mineral", blurb: "Metal líquido, base esencial para pociones de velocidad o transmutación." },
  { n: 59, name: "Carbón de Árbol de las Hadas", category: "mineral", blurb: "Madera quemada por rayos; excelente como filtro alquímico." },
  { n: 60, name: "Arcilla de Golem", category: "mineral", blurb: "Tierra con memoria mágica, maleable como la cera." },

  // --- Esencias, fluidos y elementos místicos ------------------------------
  { n: 61, name: "Lágrima cristalizada de Banshee", category: "esencia", blurb: "Fría al tacto, grita débilmente si se raspa." },
  { n: 62, name: "Ectoplasma de Fantasma", category: "esencia", blurb: "Una baba translúcida que flota y enfría el aire." },
  { n: 63, name: "Agua de la Expansión Verdante", category: "esencia", blurb: "Agua pura del Feywild que nunca se estropea ni congela." },
  { n: 64, name: "Polvo de Vampiro destruido", category: "esencia", blurb: "Las cenizas dejadas tras matar a un chupasangre con luz solar." },
  { n: 65, name: "Sombra embotellada", category: "esencia", blurb: "Un vial que contiene humo negro y frío extraído del Páramo Sombrío." },
  { n: 66, name: "Fuego Feérico condensado", category: "esencia", blurb: "Un frasco que contiene luz líquida rosa, verde o azul." },
  { n: 67, name: "Agua Bendita de Vasselheim", category: "esencia", blurb: "Agua bendecida por el mismísimo clero de la Puerta Divina." },
  { n: 68, name: "Aliento de Elemental de Aire", category: "esencia", blurb: "Una brisa huracanada atrapada a presión en una botella de cristal." },
  { n: 69, name: "Zumo de Baya Buena", category: "esencia", blurb: "Zumo rojo extremadamente nutritivo extraído por druidas." },
  { n: 70, name: "Extracto de Luz de Catha", category: "esencia", blurb: "Rocío recogido de hojas iluminadas únicamente por la luna blanca de Exandria." },

  // --- Piezas de despiece, tanda CR 0 (2026-08-06) --------------------------
  // Salen de `data/despiece.ts`: lo que suelta cada monstruo al despiezarlo con
  // Extracción de Componentes. Se añaden AL FINAL y con número correlativo
  // porque el `n` es como se referencian en mesa («el 46, el residuum») y
  // renumerar lo viejo rompería esa referencia.
  { n: 71, name: "Buche de Buitre", category: "fauna", blurb: "Bolsa correosa llena de jugos que digieren carroña sin envenenar al ave. Disuelve lo que ningún ácido de frasco toca." },
  { n: 72, name: "Guano de Murciélago", category: "fauna", blurb: "Se recoge en cuevas, seco y apelmazado. Mezclado con azufre es el componente clásico de todo lo que estalla." },
  { n: 73, name: "Zarpa de Halcón", category: "fauna", blurb: "Garra curva de cazador diurno. Molida, entra en las preparaciones que agudizan la vista." },
  { n: 74, name: "Cola de Lagarto Cercenada", category: "fauna", blurb: "Sigue moviéndose un rato después de soltarse. Base de todo lo que busca reconstruir carne." },
  { n: 75, name: "Piel Húmeda de Rana", category: "fauna", blurb: "Se conserva en agua o se agrieta y pierde el humor que la hace útil para respirar bajo el agua." },
  { n: 76, name: "Pelo de Gato Negro", category: "fauna", blurb: "Vale cualquier gato; el color es superstición de gremio, pero ningún alquimista se atreve a saltársela." },
  { n: 77, name: "Cola de Rata", category: "fauna", blurb: "Barata y en todas partes. Es el relleno con el que se estiran las preparaciones sin arruinarlas." },
];

/** Los ingredientes de una categoría, en orden de catálogo. */
export function ingredientesDe(cat: IngredienteCategoria): Ingrediente[] {
  return INGREDIENTES.filter((i) => i.category === cat);
}

/** Busca por número de catálogo. */
export function ingredientePorN(n: number): Ingrediente | undefined {
  return INGREDIENTES.find((i) => i.n === n);
}
