// Materiales de forja: con lo que se fabrican armas, armaduras y escudos usando
// la pericia de oficio **Forja** (`data/rules.ts`).
//
// Tercer catálogo del mismo tipo, junto a `data/alquimia.ts` (70 ingredientes)
// y `data/cocina.ts` (100). **Cada uno tiene su propia numeración** y no se
// buscan entre sí. Un mismo material PUEDE aparecer en dos catálogos —el
// residuum sirve para pociones y para armas— y eso no es un error: son usos
// distintos del mismo mineral, con presentación distinta (polvo, cristal
// refinado). El gate vigila que la lista de solapes no crezca sin querer.
//
// **Lo que distingue a este catálogo**: muchos materiales traen **mecánica de
// verdad** (mithril anula el requisito de Fuerza, la adamantina anula los
// críticos, el residuum hace mágica el arma). Eso va en `mecanica`, aparte del
// `blurb`, para no mezclar regla con sabor.
//
// ⚠️ **Nada de esto está conectado todavía.** Ni el equipo (`data/equipment.ts`)
// ni la derivada (`lib/derive.ts`) saben que estos materiales existen: forjar
// un peto de mithril hoy no quita ningún requisito de Fuerza. Es catálogo, no
// mecánica en juego. Eso llega con la mecánica de las pericias (ver
// `docs/pericias-borrador.md`).

export type ForjaCategoria = "metal" | "cristal" | "monstruo" | "madera" | "temple";

export type MaterialForja = {
  /** Número de catálogo, estable: es como se referencian entre sesiones. */
  n: number;
  name: string;
  category: ForjaCategoria;
  /** Qué es y cómo se trabaja. Redacción del DM. */
  blurb: string;
  /** Qué hace en reglas, cuando el material lo tiene. Sin conectar todavía. */
  mecanica?: string;
};

export const FORJA_CATEGORIA_LABEL: Record<ForjaCategoria, string> = {
  metal: "Metales, aleaciones y minerales crudos",
  cristal: "Cristales, gemas mágicas y núcleos",
  monstruo: "Partes de monstruos: escamas, cueros y huesos",
  madera: "Maderas de forja: mangos, arcos y astiles",
  temple: "Aceites de temple, fundentes y catalizadores",
};

export const MATERIALES_FORJA: MaterialForja[] = [
  // --- Metales, aleaciones y minerales crudos ------------------------------
  { n: 1, name: "Hierro Frío", category: "metal", blurb: "Hierro extraído bajo cero, letal contra hadas y criaturas del Feywild." },
  { n: 2, name: "Plata de Whitestone", category: "metal", blurb: "Plata purificada extremadamente brillante, indispensable contra licántropos y vampiros." },
  { n: 3, name: "Mithril Estelar", category: "metal", blurb: "Un metal plateado, ligero como la seda pero duro como el acero.", mecanica: "La armadura pesada de mithril no exige puntuación mínima de Fuerza." },
  { n: 4, name: "Adamantina de Kraghammer", category: "metal", blurb: "Un mineral negro verdoso, el más duro que se conoce.", mecanica: "La armadura de adamantina convierte los críticos recibidos en impactos normales; las armas destrozan objetos con facilidad." },
  { n: 5, name: "Acero Dwendaliano", category: "metal", blurb: "Acero de grado militar, muy denso. Mantiene el filo meses sin afilarse." },
  { n: 6, name: "Oricalco", category: "metal", blurb: "El oro de dragón: un metal cobrizo que resuena con la magia. Ideal para armas de hechiceros o paladines." },
  { n: 7, name: "Bronce de Vasselheim", category: "metal", blurb: "Aleación forjada por clérigos. Brilla levemente en presencia de no-muertos." },
  { n: 8, name: "Hierro Sangriento", category: "metal", blurb: "Extraído de los campos de batalla de la Calamidad. Lo forjado con él está siempre caliente al tacto." },
  { n: 9, name: "Cobalto Refinado", category: "metal", blurb: "Metal azul oscuro que no refleja la luz, usado por los monjes del Alma de Cobalto para armas ocultas." },
  { n: 10, name: "Acero de Vidrio", category: "metal", blurb: "Secreto de los elfos de Syngorn: transparente como el cristal, con la dureza del acero." },
  { n: 11, name: "Plomo Denso", category: "metal", blurb: "Inmune a la adivinación mágica. Perfecto para forrar cofres o esconder contrabando.", mecanica: "Lo que envuelve queda oculto a la magia de adivinación." },
  { n: 12, name: "Cobre Oxidado del Lucidian", category: "metal", blurb: "Metal verdoso resistente a la corrosión, usado en armas piratas y arpones." },
  { n: 13, name: "Platino de Bahamut", category: "metal", blurb: "El metal más puro, reservado a escudos sagrados y cálices." },
  { n: 14, name: "Escoria de la Forja Ancestral", category: "metal", blurb: "El residuo impuro de los enanos, pesadísimo, ideal para cabezas de martillos de asedio." },
  { n: 15, name: "Hierro Meteorítico de Aeor", category: "metal", blurb: "Metal sacado de cráteres caídos. Desprende una ligera radiación mágica." },

  // --- Cristales, gemas mágicas y núcleos ----------------------------------
  { n: 16, name: "Residuum refinado", category: "cristal", blurb: "Cristal verde brillante de Whitestone. Se engarza en el pomo o se tritura como fundente.", mecanica: "Forjado junto al acero, vuelve mágica el arma (+1, +2…)." },
  { n: 17, name: "Piedra de Bruma", category: "cristal", blurb: "Cristales morados que anulan la gravedad.", mecanica: "Incrustada en armadura pesada, deja de pesar." },
  { n: 18, name: "Azuremita", category: "cristal", blurb: "Gema azul del Underdark que reacciona a la mente.", mecanica: "El arma usa Inteligencia en vez de Fuerza o Destreza." },
  { n: 19, name: "Cuarzo Dunamántico", category: "cristal", blurb: "Cristal grisáceo del Luxon.", mecanica: "Engarzado en un escudo, permite manipular la inercia de los golpes que llegan." },
  { n: 20, name: "Rubí de Fuego Consumido", category: "cristal", blurb: "Absorbe el calor. Útil para armaduras que aguanten el aliento de dragón." },
  { n: 21, name: "Zafiro del Invierno Eterno", category: "cristal", blurb: "Una gema de Eiselcross que congela el agua a su alrededor." },
  { n: 22, name: "Piedra de Sangre de Moorengorge", category: "cristal", blurb: "Resuena con la nigromancia. Ideal para armas de cazador de sangre." },
  { n: 23, name: "Geoda Aullante", category: "cristal", blurb: "Un cristal hueco que atrapa el sonido.", mecanica: "Forjada en una daga, la vuelve completamente silenciosa." },
  { n: 24, name: "Ópalo de las Sombras", category: "cristal", blurb: "Absorbe la luz.", mecanica: "La armadura que lo lleve da ventaja en Sigilo en la oscuridad." },
  { n: 25, name: "Esmeralda Feérica", category: "cristal", blurb: "Brilla cuando hay ilusiones mágicas cerca." },
  { n: 26, name: "Diamante sin mácula de Rexxentrum", category: "cristal", blurb: "El núcleo reflectante perfecto para canalizar magia de luz." },
  { n: 27, name: "Obsidiana Ashari", category: "cristal", blurb: "Cristal volcánico que corta a nivel molecular; se astilla con facilidad, pero es el filo más letal que existe." },
  { n: 28, name: "Ámbar de Savalir", category: "cristal", blurb: "Contiene insectos corruptos fosilizados.", mecanica: "Imbuye el arma con daño de ácido." },
  { n: 29, name: "Perla Negra del Abismo", category: "cristal", blurb: "De la fosa del Océano Lucidian; soporta presiones inmensas." },
  { n: 30, name: "Cuarzo Tormenta", category: "cristal", blurb: "Una piedra atravesada por vetas que sueltan chispas." },

  // --- Partes de monstruos --------------------------------------------------
  { n: 31, name: "Cuero de Wyvern", category: "monstruo", blurb: "Grueso, verdoso y naturalmente resistente al veneno." },
  { n: 32, name: "Escama de Dragón", category: "monstruo", blurb: "Cromática o metálica: el pináculo de la protección.", mecanica: "Da resistencia al elemento del dragón del que salió." },
  { n: 33, name: "Seda de Araña de Fase para telares", category: "monstruo", blurb: "Tela etérea, casi sin peso. Perfecta para ropajes mágicos o cuerdas de arco." },
  { n: 34, name: "Caparazón de Tortuga Dragón", category: "monstruo", blurb: "Con él se fabrican los escudos torre más impenetrables que existen." },
  { n: 35, name: "Piel de Tiburón de Arena", category: "monstruo", blurb: "Increíblemente abrasiva. Va en la empuñadura para que no resbale ni con sangre ni con sudor." },
  { n: 36, name: "Tendón de Gigante", category: "monstruo", blurb: "Elástico y durísimo: el único material capaz de tensar arcos largos de gran potencia." },
  { n: 37, name: "Hueso de Behemoth", category: "monstruo", blurb: "Blanco y denso como el marfil; sustituye al acero en las armas de los bárbaros de Xhorhas." },
  { n: 38, name: "Quitina de Ankheg", category: "monstruo", blurb: "Placas orgánicas marrones, ligeras y resistentes al ácido. Ideales para corazas medias." },
  { n: 39, name: "Piel de Bestia Desplazadora", category: "monstruo", blurb: "Cuero oscuro que curva ligeramente la luz a su alrededor." },
  { n: 40, name: "Cuerno de Minotauro para yelmos", category: "monstruo", blurb: "Remata los salientes de los yelmos o el centro de los escudos, para empujar." },
  { n: 41, name: "Cuero de Oso Lechuza", category: "monstruo", blurb: "El material estándar y más fiable para las armaduras de los exploradores." },
  { n: 42, name: "Escamas de Naga", category: "monstruo", blurb: "Suaves y brillantes.", mecanica: "Repelen pasivamente la magia menor." },
  { n: 43, name: "Pelaje de Yeti", category: "monstruo", blurb: "Aislante térmico absoluto.", mecanica: "Forrar la armadura con él te hace inmune al clima helado." },
  { n: 44, name: "Glándula de Fuego Infernal", category: "monstruo", blurb: "Del sabueso infernal. Se curte con el cuero para que la armadura mantenga vivo el calor corporal." },
  { n: 45, name: "Baba de Mímico cristalizada", category: "monstruo", blurb: "Pegamento biológico irrompible para unir piezas de armadura sin un solo remache." },

  // --- Maderas de forja -----------------------------------------------------
  { n: 46, name: "Madera de Fresno de Syngorn", category: "madera", blurb: "Flexible y resistente: la reina de las maderas para arcos largos." },
  { n: 47, name: "Árbol de Hierro", category: "madera", blurb: "Madera druídica tan dura como el acero.", mecanica: "Permite a un druida llevar «placas» hechas de madera." },
  { n: 48, name: "Roble de Sangre", category: "madera", blurb: "Madera roja que absorbe la sangre y no se pudre jamás." },
  { n: 49, name: "Madera de Bruma", category: "madera", blurb: "Blanco pálido y tan ligera que cambia cómo se maneja el arma.", mecanica: "Un arma pesada hecha con ella gana la propiedad Sutil." },
  { n: 50, name: "Raíz de Mangle del Pantano", category: "madera", blurb: "Completamente impermeable, perfecta para astiles de tridentes y arpones." },
  { n: 51, name: "Madera de Ébano de Marquet", category: "madera", blurb: "Negra como el carbón, pesada, para mangos ceremoniales." },
  { n: 52, name: "Hueso-madera", category: "madera", blurb: "Parece hueso fosilizado pero es un árbol del Páramo Sombrío.", mecanica: "Canaliza energía necrótica." },
  { n: 53, name: "Arce Petrificado de Aeor", category: "madera", blurb: "Madera de la Era de los Arcanos, completamente rígida: no se dobla ni un milímetro." },
  { n: 54, name: "Bambú de Hierro de las Islas de los Dedos", category: "madera", blurb: "Hueco por dentro —esconde venenos o pergaminos— e irrompible por fuera." },
  { n: 55, name: "Rama de Treant cedida voluntariamente", category: "madera", blurb: "Madera viva.", mecanica: "Si el arma se astilla, se repara sola en un día." },
  { n: 56, name: "Pino del Norte Mordiente", category: "madera", blurb: "Aguanta temperaturas criogénicas sin volverse quebradiza." },
  { n: 57, name: "Madera de Sauce Llorón del Feywild", category: "madera", blurb: "Extremadamente elástica: para látigos de madera o mangos que absorben vibraciones." },
  { n: 58, name: "Corteza de Árbol de Ceniza", category: "madera", blurb: "De los Ashari, ignífuga.", mecanica: "El mango no arde ni sumergiendo el arma en lava." },
  { n: 59, name: "Madera Corrompida de Molaesmyr", category: "madera", blurb: "Peligrosa de tocar.", mecanica: "Envenena pasivamente a quien corte el arma." },
  { n: 60, name: "Nuez de Caoba Imperial", category: "madera", blurb: "Madera preciosa, pulida y barnizada, para las armas de los nobles de Zadash." },

  // --- Aceites de temple, fundentes y catalizadores ------------------------
  { n: 61, name: "Aceite de Basilisco", category: "temple", blurb: "El líquido en que se hunde la hoja al rojo.", mecanica: "Endurece la hoja hasta ignorar el desgaste y el óxido." },
  { n: 62, name: "Sangre de Dragón Rojo", category: "temple", blurb: "El temple con el que se hacen las espadas lengua de fuego." },
  { n: 63, name: "Sal de Eiselcross", category: "temple", blurb: "Se echa al fuego para enfriar el metal de golpe sin que se fracture por el choque térmico." },
  { n: 64, name: "Polvo de Hada para el temple", category: "temple", blurb: "Se espolvorea sobre la armadura pesada al rojo vivo.", mecanica: "Reduce su peso a la mitad sin perder protección." },
  { n: 65, name: "Veneno de Mantícora", category: "temple", blurb: "Ácido para grabar runas oscuras o canalizadores de veneno en la hoja." },
  { n: 66, name: "Lágrima de Elemental de Agua", category: "temple", blurb: "Templar el acero aquí le da una flexibilidad imposible: la espada se dobla como un cinturón sin romperse." },
  { n: 67, name: "Bilis de Cieno Verde", category: "temple", blurb: "El fundente perfecto para grabar runas: el ácido come el acero con precisión milimétrica." },
  { n: 68, name: "Ceniza Sagrada de Vasselheim", category: "temple", blurb: "Frotar el arma con ella antes del temple la purifica.", mecanica: "Elimina maldiciones previas del metal." },
  { n: 69, name: "Carbón Mágico de Aeor", category: "temple", blurb: "Arde tan alto que es lo único capaz de fundir adamantina o hierro meteorítico." },
  { n: 70, name: "Sudor de Salamandra", category: "temple", blurb: "Se añade a la fragua para que el fuego arda semanas sin madera ni carbón." },
  { n: 71, name: "Aceite de Kraken", category: "temple", blurb: "Impregna la armadura acabada.", mecanica: "La deja a prueba de óxido y de las presiones del fondo marino." },
  { n: 72, name: "Mercurio Alquímico", category: "temple", blurb: "Se inyecta en el hueco de la hoja.", mecanica: "El peso se desplaza a la punta al tajar y suma daño." },
  { n: 73, name: "Barro del Underdark", category: "temple", blurb: "Arcilla que aguanta miles de grados; para los moldes de fundición de espadas complejas." },
  { n: 74, name: "Resina de Árbol Carnívoro", category: "temple", blurb: "Se unta en el mango acabado.", mecanica: "Se adhiere a la mano: no te pueden desarmar." },
  { n: 75, name: "Polvo de Estrella Fugaz", category: "temple", blurb: "Se tira al carbón en el último segundo. El arma brillará con luz estelar para siempre." },
];

/** Los materiales de una categoría, en orden de catálogo. */
export function forjaDe(cat: ForjaCategoria): MaterialForja[] {
  return MATERIALES_FORJA.filter((m) => m.category === cat);
}

/** Busca por número de catálogo de forja (1-75). */
export function forjaPorN(n: number): MaterialForja | undefined {
  return MATERIALES_FORJA.find((m) => m.n === n);
}

/** Los materiales que traen regla, no solo sabor. */
export const FORJA_CON_MECANICA: MaterialForja[] = MATERIALES_FORJA.filter((m) => m.mecanica);
