// Ingredientes de cocina: la despensa con la que se guisa usando la pericia de
// oficio **Cocina** (`data/rules.ts`).
//
// Hermano de `data/alquimia.ts` y con la misma forma —número de catálogo,
// categoría y descripción— pero **catálogo aparte**: la numeración de cocina va
// de 1 a 100 y la de alquimia de 1 a 70. Son dos despensas distintas y un
// ingrediente no se busca nunca en la otra.
//
// Setting propio de la campaña. Los nombres y descripciones son del DM; los
// sitios que se citan (Emon, Zadash, Kraghammer, Whitestone, Syngorn, Marquet,
// Eiselcross, Rifenmist, Pyrah, Uthodurn, Xhorhas, Molaesmyr, el Océano
// Lucidian, el Concordato Clovis, el Norte Mordiente, Torrerrisco, Savalirwood)
// son lugares de Exandria que la app ya conoce por el atlas y el saber.
//
// **Todavía NO tienen mecánica**: ni CD, ni receta, ni efecto al comerlo. Eso
// llega con la mecánica de las pericias (ver `docs/pericias-borrador.md`).

export type CocinaCategoria = "carne" | "pescado" | "vegetal" | "lacteo" | "despensa";

export type IngredienteCocina = {
  /** Número de catálogo, estable: es como se referencian entre sesiones. */
  n: number;
  name: string;
  category: CocinaCategoria;
  /** Qué es y cómo se cocina. Redacción del DM. */
  blurb: string;
};

export const COCINA_CATEGORIA_LABEL: Record<CocinaCategoria, string> = {
  carne: "Carnes, aves y monstruosidades",
  pescado: "Pescados, mariscos y vida marina",
  vegetal: "Vegetales, hongos, frutas y cereales",
  lacteo: "Lácteos, grasas, condimentos y especias",
  despensa: "Masas, bebidas de cocina, dulces y especiales",
};

export const INGREDIENTES_COCINA: IngredienteCocina[] = [
  // --- Carnes, aves y monstruosidades --------------------------------------
  { n: 1, name: "Lomo de Oso Lechuza", category: "carne", blurb: "Carne veteada, jugosa y con un sutil sabor a caza y pluma." },
  { n: 2, name: "Corte de Muslo de Wyvern", category: "carne", blurb: "Carne roja, muy dura pero llena de sabor si se marina con ácido." },
  { n: 3, name: "Ancas de Sapo Gigante", category: "carne", blurb: "De textura similar al pollo, pero gigantescas y muy tiernas." },
  { n: 4, name: "Costillar de Jabalí de las Colinas", category: "carne", blurb: "Graso, sabroso y perfecto para asar a la estaca." },
  { n: 5, name: "Carne de Tiburón de Arena de Marquet", category: "carne", blurb: "Magra, seca y con un toque salado natural." },
  { n: 6, name: "Entrecot de Mamut de Uthodurn", category: "carne", blurb: "Cortes masivos de carne marmolada con grasa pura del norte." },
  { n: 7, name: "Filete de Basilisco desintoxicado", category: "carne", blurb: "Una delicia exótica; si se cocina bien, parece ternera tierna." },
  { n: 8, name: "Pechuga de Roc", category: "carne", blurb: "Un solo filete puede alimentar a una patrulla entera durante días." },
  { n: 9, name: "Carne de Lagarto Acorazado", category: "carne", blurb: "Carne firme del desierto, muy apreciada entre los orcos de Xhorhas." },
  { n: 10, name: "Lomo de Ciervo Feérico", category: "carne", blurb: "Carne mágicamente tierna que parece derretirse en la boca." },
  { n: 11, name: "Lengua de Minotauro", category: "carne", blurb: "Un corte magro ideal para curar en salazón o cocer a fuego lento." },
  { n: 12, name: "Carne de Buey de Carga Imperial", category: "carne", blurb: "La carne de trabajo habitual en Dwendallia, económica y nutritiva." },
  { n: 13, name: "Pechuga de Faisán del Bosque de Savalir", category: "carne", blurb: "Ave silvestre de carne oscura y aroma a hierbas." },
  { n: 14, name: "Carne de Grifo", category: "carne", blurb: "Algo fibrosa, pero cotizadísima en los banquetes reales de Emon." },
  { n: 15, name: "Hígado de Cerdo del Underdark", category: "carne", blurb: "Un ingrediente viscoso pero lleno de hierro y sabor potente." },
  { n: 16, name: "Glándula de Fuego de Salamandra", category: "carne", blurb: "Se usa en dosis minúsculas para picar o ahumar carnes de forma mágica." },
  { n: 17, name: "Chorizo de Cabra de Torrerrisco", category: "carne", blurb: "Embutido curado con sal marina y especias enanas." },
  { n: 18, name: "Pato de la Costa de la Casa de Fieras", category: "carne", blurb: "Ave acuática grasienta, perfecta para asados crujientes." },
  { n: 19, name: "Ancas de Grillo Gigante", category: "carne", blurb: "Crujientes al freírlas, la botana preferida en las arenas de combate." },
  { n: 20, name: "Tocino de Jabalí de Sangre", category: "carne", blurb: "Salado, ahumado y con un color rojo intenso." },
  { n: 21, name: "Carne de Hidra muy cocinada", category: "carne", blurb: "Hay que cocinarla a altas temperaturas para que no intente regenerarse en el estómago." },
  { n: 22, name: "Corazón de Wargo", category: "carne", blurb: "Una carne dura y amarga, consumida por los clanes nómadas para ganar fuerza." },
  { n: 23, name: "Muslo de Pavo Real de Syngorn", category: "carne", blurb: "Ave noble que se sirve en los banquetes élficos decorada con sus propias plumas." },
  { n: 24, name: "Grasa de Ballena del Mar Helado", category: "carne", blurb: "Manteca esencial para conservar alimentos o freír en climas fríos." },
  { n: 25, name: "Carne de Yeti ahumada", category: "carne", blurb: "Carne blanca que se conserva perfectamente bajo cero." },

  // --- Pescados, mariscos y vida marina ------------------------------------
  { n: 26, name: "Tentáculo de Calamar del Océano Lucidian", category: "pescado", blurb: "Dulce, firme y perfecto para cortar en rodajas finas o a la brasa." },
  { n: 27, name: "Salmón Dorado de los Ríos de Tal'Dorei", category: "pescado", blurb: "Pescado rosado rico en aceites saludables." },
  { n: 28, name: "Ostras Gigantes del Concordato Clovis", category: "pescado", blurb: "Mariscos del tamaño de un plato, servidos vivos con zumo de cítricos." },
  { n: 29, name: "Cangrejo de las Profundidades", category: "pescado", blurb: "Del Underdark, de caparazón negro; su carne es increíblemente dulce." },
  { n: 30, name: "Pez Vela de la Costa de las Sombras", category: "pescado", blurb: "Un pez rápido de carne firme, ideal para ceviches marítimos." },
  { n: 31, name: "Erizo de Mar Bioluminiscente", category: "pescado", blurb: "Sus huevas brillan en la oscuridad con un sabor marino concentrado." },
  { n: 32, name: "Anguila de Relámpago desactivada", category: "pescado", blurb: "Pescado azul que deja un ligero cosquilleo en la lengua al comerlo." },
  { n: 33, name: "Langosta de Roca de Kraghammer", category: "pescado", blurb: "Marisco de caparazón tan duro que hay que romperlo con martillo de forja." },
  { n: 34, name: "Pez Globo del Arrecife", category: "pescado", blurb: "Delicioso, pero requiere una prueba de Cocina para no envenenar al comensal." },
  { n: 35, name: "Bacalao del Norte Mordiente", category: "pescado", blurb: "Salazón de pescado blanco indispensable para los barcos que viajan a Eiselcross." },
  { n: 36, name: "Anchoas del Mar del Sur", category: "pescado", blurb: "Pequeñas, saladas y usadas como base para salsas umami." },
  { n: 37, name: "Caracol de Mar Gigante", category: "pescado", blurb: "Carne elástica que se hierve con ajo y mantequilla de hierbas." },
  { n: 38, name: "Trucha de Montaña", category: "pescado", blurb: "Pescado de agua dulce, pequeño y de carne muy delicada." },
  { n: 39, name: "Hueva de Esturión Imperial", category: "pescado", blurb: "El caviar dwendaliano: diminutas perlas negras que consume la aristocracia de Zadash." },
  { n: 40, name: "Aleta de Rayo de Sol", category: "pescado", blurb: "Pescado plano que se dora al sol sobre las rocas del desierto." },
  { n: 41, name: "Piraña de Jungla", category: "pescado", blurb: "Pescado pequeño pero de carne muy sabrosa al freírse entero." },
  { n: 42, name: "Mejillones Mágicos del Feywild", category: "pescado", blurb: "Mariscos cuyos colores cambian según el estado de ánimo de quien los cocina." },
  { n: 43, name: "Almejas de Agua Dulce", category: "pescado", blurb: "Se encuentran en los lechos de los ríos tranquilos." },
  { n: 44, name: "Pez Luna de Marquet", category: "pescado", blurb: "De gran tamaño y carne blanca, seco pero muy rendidor." },
  { n: 45, name: "Carne de Kraken", category: "pescado", blurb: "Un trocito basta: ingrediente místico casi imposible de conseguir, de sabor incalculable." },

  // --- Vegetales, hongos, frutas y cereales --------------------------------
  { n: 46, name: "Hongo Brillo de Cueva", category: "vegetal", blurb: "Hongos comestibles del Underdark que emiten una suave luz azul." },
  { n: 47, name: "Trigo Dorado de Zadash", category: "vegetal", blurb: "El grano principal con el que se elabora el pan del Imperio Dwendaliano." },
  { n: 48, name: "Patata de la Cima", category: "vegetal", blurb: "Tubérculo denso y oscuro de Kraghammer, que crece en la tierra de montaña." },
  { n: 49, name: "Cebolla de Fuego de Pyrah", category: "vegetal", blurb: "Pica tanto al cortarla que hace llorar a los bárbaros más rudos." },
  { n: 50, name: "Arroz de los Pantanos de Zenobia", category: "vegetal", blurb: "Grano largo y aromático que crece en aguas estancadas." },
  { n: 51, name: "Baya de Sol de Marquet", category: "vegetal", blurb: "Pequeñas bayas amarillas que explotan en la boca con un sabor dulzón." },
  { n: 52, name: "Manzana de Sangre de Whitestone", category: "vegetal", blurb: "Fruta roja de pulpa oscura, dulce y ligeramente ácida." },
  { n: 53, name: "Setas de Espora Dulce", category: "vegetal", blurb: "Hongos del bosque que sustituyen perfectamente al azúcar en los postres." },
  { n: 54, name: "Maíz de las Llanuras", category: "vegetal", blurb: "Grano amarillo ideal para moler y hacer tortillas o gachas." },
  { n: 55, name: "Tomate de la Costa", category: "vegetal", blurb: "Dulce, denso y lleno de jugo gracias al sol marino." },
  { n: 56, name: "Ajo de la Cripta", category: "vegetal", blurb: "Dientes de ajo blancos como el hueso, de sabor intensísimo." },
  { n: 57, name: "Zanahoria de Nieve de Eiselcross", category: "vegetal", blurb: "Un vegetal de raíz dulce que solo crece bajo el hielo." },
  { n: 58, name: "Higo de la Jungla de Rifenmist", category: "vegetal", blurb: "Fruta pegajosa repleta de semillas crujientes." },
  { n: 59, name: "Calabaza del Páramo Sombrío", category: "vegetal", blurb: "De piel morada; su pulpa sirve para sopas densas y reconfortantes." },
  { n: 60, name: "Seta de Sombrilla Gigante", category: "vegetal", blurb: "El sombrero de esta seta se puede empanar y freír como si fuera un filete." },
  { n: 61, name: "Chiles Abrasadores de Marquet", category: "vegetal", blurb: "Pimientos rojos secos que hacen sudar hasta a los dragones." },
  { n: 62, name: "Trufa de Árbol Feérico", category: "vegetal", blurb: "Un hongo subterráneo que huele a tierra, perfume y magia puras." },
  { n: 63, name: "Limoncillo del Concordato", category: "vegetal", blurb: "Hierba cítrica usada para infusiones y para marinar pescados." },
  { n: 64, name: "Semillas de Girasol de las Colinas", category: "vegetal", blurb: "Tostadas con sal, la botana preferida de los aventureros." },
  { n: 65, name: "Ciruela Negra de Molaesmyr", category: "vegetal", blurb: "Fruta silvestre de sabor complejo que debe lavarse bien." },
  { n: 66, name: "Guisantes de Vaina Doble", category: "vegetal", blurb: "Legumbres crujientes que se comen enteras." },
  { n: 67, name: "Espinaca de Cueva", category: "vegetal", blurb: "Hojas oscuras que crecen con la humedad de las cavernas." },
  { n: 68, name: "Dátil de Oasis", category: "vegetal", blurb: "Fruta seca extremadamente dulce y cargada de energía para el desierto." },
  { n: 69, name: "Pimiento Verde Picante", category: "vegetal", blurb: "Usado para adobar la carne de caza." },
  { n: 70, name: "Cizaña Salada", category: "vegetal", blurb: "Alga terrestre que aporta un toque salino a las ensaladas." },

  // --- Lácteos, grasas, condimentos y especias -----------------------------
  { n: 71, name: "Queso Azul de Kraghammer", category: "lacteo", blurb: "Un queso de leche de cabra de olor fortísimo y sabor picante." },
  { n: 72, name: "Mantequilla de Leche de Yorith", category: "lacteo", blurb: "Mantequilla cremosa y amarilla, ideal para dorar carnes." },
  { n: 73, name: "Queso de Cueva Envejecido", category: "lacteo", blurb: "Queso duro que se cura envuelto en telas en las profundidades de la tierra." },
  { n: 74, name: "Aceite de Oliva de la Costa", category: "lacteo", blurb: "El «oro líquido» con el que se cocina en el sur." },
  { n: 75, name: "Sal Marina de las Islas Menores", category: "lacteo", blurb: "Sal en escamas gruesas para rematar cortes de carne." },
  { n: 76, name: "Pimienta Negra de Rifenmist", category: "lacteo", blurb: "Especia exótica que vale su peso en plata en los mercados del norte." },
  { n: 77, name: "Azafrán de Goldfield", category: "lacteo", blurb: "La especia más cara de Exandria, de color naranja brillante." },
  { n: 78, name: "Vinagre de Manzana de Whitestone", category: "lacteo", blurb: "Ácido, limpio y perfecto para encurtir vegetales." },
  { n: 79, name: "Leche de Yorith", category: "lacteo", blurb: "De cabra de montaña: densa, nutritiva y ligeramente dulce." },
  { n: 80, name: "Miel de Avispa Feérica", category: "lacteo", blurb: "Miel dorada que brilla y tiene un toque floral mágico." },
  { n: 81, name: "Manteca de Cerdo de Caza", category: "lacteo", blurb: "Grasa animal para masas de tartas y frituras pesadas." },
  { n: 82, name: "Jengibre de la Selva", category: "lacteo", blurb: "Raíz picante que refresca el aliento y ayuda a la digestión." },
  { n: 83, name: "Semillas de Mostaza Silvestre", category: "lacteo", blurb: "Se machacan con vino o vinagre para hacer salsas potentes." },
  { n: 84, name: "Salsa de Pescado Fermentado", category: "lacteo", blurb: "Condimento líquido salado, indispensable para los guisos orientales." },
  { n: 85, name: "Nuez Moscada Mística", category: "lacteo", blurb: "Una nuez pálida que le da un toque aromático a las salsas de queso." },

  // --- Masas, bebidas de cocina, dulces y especiales -----------------------
  { n: 86, name: "Harina de Trigo Integral", category: "despensa", blurb: "La base para panes de campo y barras rústicas." },
  { n: 87, name: "Levadura de Cerveza Enana", category: "despensa", blurb: "El ingrediente secreto para que las masas de pan suban altas y esponjosas." },
  { n: 88, name: "Vino Rojo de la Cosecha de Zadash", category: "despensa", blurb: "Un vino peleón perfecto para reducir salsas y estofados de carne." },
  { n: 89, name: "Cerveza Oscura de Kraghammer", category: "despensa", blurb: "Cerveza densa casi como sopa, usada para cocer salchichas y carne de vacuno." },
  { n: 90, name: "Masa Madre Centenaria", category: "despensa", blurb: "Un pedazo de masa fermentada que ha pasado de cocinero a cocinero por generaciones." },
  { n: 91, name: "Azúcar de Caña de Marquet", category: "despensa", blurb: "Cristalitos marrones, ideales para caramelizar carnes o hacer postres." },
  { n: 92, name: "Cacao en Polvo de Rifenmist", category: "despensa", blurb: "Amargo y rico, usado para bebidas reconfortantes o salsas mole para carnes." },
  { n: 93, name: "Nueces de Árbol Alto", category: "despensa", blurb: "Frutos secos crujientes que se añaden a panes y rellenos de aves." },
  { n: 94, name: "Cerveza de Raíz Feérica", category: "despensa", blurb: "Una bebida refrescante y espumosa sin alcohol." },
  { n: 95, name: "Polvo de Hueso de Dragón", category: "despensa", blurb: "Saborizante legendario, extremadamente picante y humeante." },
  { n: 96, name: "Cera de Abeja para Conservas", category: "despensa", blurb: "Se usa para sellar tarros de mermeladas o patés." },
  { n: 97, name: "Savia Dulce de Arce", category: "despensa", blurb: "Sirope espeso perfecto para verter sobre gachas matutinas." },
  { n: 98, name: "Raciones Secas de Aventurero", category: "despensa", blurb: "El ingrediente base cuando todo lo demás falla." },
  { n: 99, name: "Pasta Tradicional de la Costa", category: "despensa", blurb: "Tiras de masa seca listas para hervir en caldos pesados." },
  { n: 100, name: "Baya Buena deshidratada", category: "despensa", blurb: "Ingrediente mágico: una sola baya integrada en un pastel puede quitarle el hambre de un día a quien lo coma." },

  // --- Piezas de despiece, tanda CR 0 (2026-08-06) --------------------------
  // De `data/despiece.ts`. Correlativas al final: el `n` es la referencia de
  // mesa y renumerar lo viejo la rompería.
  { n: 101, name: "Carne Magra de Babuino", category: "carne", blurb: "Dura y con sabor fuerte. Come quien no tiene otra cosa, y se agradece guisada mucho rato." },
  { n: 102, name: "Cuajo de Cabra", category: "lacteo", blurb: "Del cuarto estómago del cabrito. Sin él no hay queso: es lo que separa la cuajada del suero." },
  { n: 103, name: "Pinza de Cangrejo", category: "pescado", blurb: "Se parte con el mango del cuchillo. Poca carne y muy dulce, y el caldo que suelta vale más que ella." },
  { n: 104, name: "Ventosa de Pulpo", category: "pescado", blurb: "La parte que queda tierna si se cuece despacio y correosa si se tiene prisa." },
  { n: 105, name: "Grasa de Tejón", category: "carne", blurb: "Se derrite limpia y aguanta meses en tarro. Es la manteca de quien cocina lejos de una despensa." },
];

/** Los ingredientes de cocina de una categoría, en orden de catálogo. */
export function cocinaDe(cat: CocinaCategoria): IngredienteCocina[] {
  return INGREDIENTES_COCINA.filter((i) => i.category === cat);
}

/** Busca por número de catálogo de cocina (1-100). */
export function cocinaPorN(n: number): IngredienteCocina | undefined {
  return INGREDIENTES_COCINA.find((i) => i.n === n);
}
