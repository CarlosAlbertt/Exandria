// Ingredientes de destilación: con lo que se preparan licores, brebajes y
// drogas usando la pericia de oficio **Destilación Exandriana**
// (`data/rules.ts`).
//
// Cuarto catálogo del mismo tipo, junto a `data/alquimia.ts` (70),
// `data/cocina.ts` (100) y `data/forja.ts` (75). **Numeración propia**, de 1
// a 49, y no se busca en los otros.
//
// Se consiguen en el mercado negro de Zadash, en los callejones de Ank'Harel o
// en las ruinas de Xhorhas. **Los efectos son potentes y el riesgo de adicción
// o envenenamiento es real**: es el catálogo más peligroso de los cuatro, y
// varios de sus ingredientes tienen contrapartida explícita.
//
// **Dos arreglos sobre la lista original del DM**, dichos y no escondidos:
// 1. La numeración se cortaba en el 26 y los 24 restantes iban sin número.
//    Aquí van renumerados de 1 a 49 seguidos, en el mismo orden.
// 2. **«Extracto de Memoria» aparecía dos veces** (el 14 y otro al final) con
//    descripciones distintas pero compatibles. Se fusionan en una entrada, la
//    número 14, que recoge las dos.
//
// **Todavía NO tienen mecánica**: ni CD, ni receta, ni reglas de adicción. Eso
// llega con la mecánica de las pericias (ver `docs/pericias-borrador.md`).

export type IngredienteDestilacion = {
  /** Número de catálogo, estable: es como se referencian entre sesiones. */
  n: number;
  name: string;
  /** Qué es, qué hace y qué te cuesta. Redacción del DM. */
  blurb: string;
  /** true si la descripción declara una contrapartida, no solo un beneficio. */
  riesgo?: true;
};

export const INGREDIENTES_DESTILACION: IngredienteDestilacion[] = [
  { n: 1, name: "Ruidium Líquido", riesgo: true, blurb: "Las lágrimas de Ruidus: líquido carmesí corrupto del Netherdeep. Amplifica un conjuro a niveles destructivos, pero causa mutaciones rojas en las venas de quien lo bebe." },
  { n: 2, name: "Agua de Deshielo de Eiselcross", riesgo: true, blurb: "Hielo anterior a la Calamidad, derretido. Lleva microbios primigenios: un trago da resistencia al frío y alucinaciones heladas." },
  { n: 3, name: "Néctar de Flumph", riesgo: true, blurb: "Líquido fluorescente y dulce. Induce telepatía involuntaria de corto alcance y ataques de risa incontrolables." },
  { n: 4, name: "Mucosidad de Aboleth purificada", riesgo: true, blurb: "Base viscosa. Bien destilada da respiración acuática durante días, pero la piel del bebedor se vuelve translúcida y viscosa." },
  { n: 5, name: "Glándula de Monstruo Oxidífero", riesgo: true, blurb: "Licor amargo que te hace eructar un gas capaz de oxidar y destruir cerraduras de hierro al instante." },
  { n: 6, name: "Té de Loto de Syngorn", blurb: "Doble fusión élfica que elimina por completo la necesidad de dormir durante 48 horas, sin dejar fatiga." },
  { n: 7, name: "Veneno de Basilisco Fermentado", riesgo: true, blurb: "La bebida de la muerte falsa: te paraliza y te baja los latidos a uno por minuto, así que pareces un cadáver de piedra." },
  { n: 8, name: "Brisa Embotellada de Zephrah", blurb: "Aire a presión de las tribus Ashari. Sirve para airear licores; quien lo bebe pesa la mitad durante unas horas." },
  { n: 9, name: "Leche de Gorgona", blurb: "Espesa y con sabor a hierro. Solidifica un rato la grasa bajo la piel y da resistencia al daño cortante." },
  { n: 10, name: "Aguardiente de Hupperdook", blurb: "Destilado con trazas de pólvora negra. El bebedor puede gastar su acción en escupir un cono de fuego, una vez." },
  { n: 11, name: "Miel Espectral", blurb: "Del Páramo Sombrío, producida por abejas no-muertas. Un trago te vuelve parcialmente incorpóreo: atraviesas una pared sólida antes de desvanecerte." },
  { n: 12, name: "Raíz de Trasgo", riesgo: true, blurb: "Narcótico barato de sabor asqueroso. Da hiperalerta (+5 a Iniciativa) y paranoia extrema (desventaja en Perspicacia)." },
  { n: 13, name: "Aceite de Araña de Fase", blurb: "Licor denso que sabe a ozono. Mete al que lo bebe en el Plano Etéreo durante exactamente un asalto." },
  { n: 14, name: "Extracto de Memoria", blurb: "Fluido cefalorraquídeo de azotamentes, destilado. Sirve para embotellar un recuerdo tuyo, para recordar con claridad perfecta algo que habías olvidado del todo, o para robarle a otro un recuerdo fugaz." },
  { n: 15, name: "Sangre Viciada de Vampiro", riesgo: true, blurb: "Vino rojo oscuro que da un montón de PG temporales, pero hace que el bebedor sufra daño bajo la luz directa del sol." },
  { n: 16, name: "Lágrima de Dragón Tartárico", blurb: "Líquido hirviendo que nunca se enfría. Mantiene calientes otras pociones y evita que se congelen en la nieve." },
  { n: 17, name: "Esporas del Soberano Micónido", blurb: "Fermentadas en té, dejan que todo un grupo comparta una alucinación telepática y hable sin hablar." },
  { n: 18, name: "Sirope de Flor de Ceniza", blurb: "Jarabe de Pyrah que sabe a fogata. Quita un nivel de cansancio al instante." },
  { n: 19, name: "Agua Estancada de Blightmarsh", riesgo: true, blurb: "Relleno tóxico. La Myriad lo usa para adulterar drogas caras; envenena si no se detecta a tiempo." },
  { n: 20, name: "Zumo de Mandrágora Grito-Sordo", riesgo: true, blurb: "Ensordece por completo al bebedor durante 1 hora, pero lo hace inmune al daño de trueno y a los ataques sónicos." },
  { n: 21, name: "Sudor de Rakshasa", blurb: "Esencia exótica carísima. Vuelve al bebedor indetectable por adivinación: un amuleto de no detección en líquido." },
  { n: 22, name: "Extracto de Eco Kryn", blurb: "Destilado de polvo dunamántico. Deja ver tu propio futuro a seis segundos vista: ventaja en la siguiente tirada de d20." },
  { n: 23, name: "Vino de Sal del Concordato Clovis", blurb: "Vino marino blanco y seco, para lavar y purificar órganos de monstruo antes de destilarlos." },
  { n: 24, name: "Lodo de Fuego Fatuo", riesgo: true, blurb: "Brilla con luz amarillenta. Narcótico que atrae espíritus menores; ideal para sesiones de espiritismo." },
  { n: 25, name: "Lágrima de Corellon", blurb: "Rocío del Feywild recogido bajo un arcoíris. Purifica solo cualquier líquido envenenado con el que se mezcle." },
  { n: 26, name: "Hojas de Suude Castaño", riesgo: true, blurb: "La variante común de la droga ilegal. Destilada da defensas arcanas temporales y una adicción fuerte." },
  { n: 27, name: "Polvo de Suude Azul", riesgo: true, blurb: "Altamente refinado; se fuma o se destila para recuperar espacios de conjuro perdidos, a riesgo de daño psíquico." },
  { n: 28, name: "Glándula Ácida de Sandkheg", riesgo: true, blurb: "La base del carísimo licor Sandkheg's Hide de Marquet. Si no se destila bien, te disuelve la garganta." },
  { n: 29, name: "Raíz de Oloore cruda", blurb: "Fermentada en té, provoca un trance alucinógeno que permite ver el plano astral." },
  { n: 30, name: "Levadura de Cueva del Underdark", blurb: "Un hongo negro que acelera cualquier fermentación de meses a horas." },
  { n: 31, name: "Agua de la Lágrima de la Matriarca", blurb: "Agua bendita recogida en Vasselheim, para licores que curen maldiciones o locura." },
  { n: 32, name: "Savia de Cactus Espejismo", blurb: "De Ank'Harel. Un trago te vuelve invisible unos segundos cada vez que hipas." },
  { n: 33, name: "Veneno de Viuda de las Sombras diluido", riesgo: true, blurb: "En microdosis es un analgésico extremo: el bebedor no siente dolor —ni el daño contundente— durante un rato." },
  { n: 34, name: "Miel de Avispa del Feywild", blurb: "El endulzante definitivo. Un licor con esta miel provoca euforia e inmunidad al miedo." },
  { n: 35, name: "Sangre de Troll Fermentada", blurb: "Sabe a cobre podrido, pero un trago regenera heridas cerrándolas ante tus ojos." },
  { n: 36, name: "Lirio de Loto Negro", riesgo: true, blurb: "Ilegal en todo el Imperio Dwendaliano. Da un veneno potente o un somnífero sin antídoto conocido." },
  { n: 37, name: "Ceniza de Vampiro", riesgo: true, blurb: "Mezclada con vino rojo hace una pócima que da visión nocturna y sed de sangre temporal." },
  { n: 38, name: "Zumo de Baya Buena envejecido", blurb: "Licor espeso; un solo trago alimenta y cura como una poción mayor." },
  { n: 39, name: "Rocío de la Luna Roja", riesgo: true, blurb: "Agua recogida bajo luz roja pura de Ruidus. Destila furia: quien lo bebe ataca con ventaja pero no puede huir." },
  { n: 40, name: "Hongo de Podredumbre Dulce", blurb: "Da un sabor afrutado a los alcoholes, y emborracha a elementales y hadas." },
  { n: 41, name: "Saliva de Mímico", blurb: "Espesante natural. Con él se hacen licores adhesivos que se pegan al estómago y alargan sus efectos mágicos días." },
  { n: 42, name: "Cáscara de Huevo de Dragón", blurb: "Pulverizada, filtra impurezas de líquidos extremadamente ácidos o mágicos." },
  { n: 43, name: "Azufre de Pyrah", blurb: "Para licores ardientes que dejan escupir fuego al exhalar durante un rato." },
  { n: 44, name: "Escarcha de Eiselcross", blurb: "Hielo que no se derrite solo, ideal para cócteles que exijan frío absoluto." },
  { n: 45, name: "Tinta de Pulpo Ilusionista", blurb: "Al beberla cambia un rato el color de la piel y la voz de quien la toma." },
  { n: 46, name: "Musgo de la Calamidad", riesgo: true, blurb: "Radiactivo y tóxico. Base de venenos indetectables que imitan enfermedades naturales." },
  { n: 47, name: "Néctar de Súcubo", riesgo: true, blurb: "Destilado del Abismo. Vuelve a quien lo bebe increíblemente persuasivo, y también increíblemente sugestionable." },
  { n: 48, name: "Vino de Sangre de Syngorn", blurb: "Vino ceremonial élfico que alimenta más que una comida completa y embriaga sin resaca." },
  { n: 49, name: "Filtro de Éter", blurb: "No se bebe: es un paño tejido con seda de araña de fase, imprescindible para colar pociones y darles propiedades etéreas, como la de forma gaseosa." },

  // --- Piezas de despiece, tanda CR 0 (2026-08-06) --------------------------
  // De `data/despiece.ts`. Correlativa al final, como en los demás catálogos.
  { n: 50, name: "Aguijón de Escorpión", riesgo: true, blurb: "Se corta con el saco entero o no vale nada. El veneno pierde fuerza al destilarlo, pero gana la constancia que no tiene en crudo. Reventar el saco al cortarlo envenena a quien lo hace." },
];

/** Los que declaran una contrapartida, no solo un beneficio. */
export const DESTILACION_CON_RIESGO: IngredienteDestilacion[] =
  INGREDIENTES_DESTILACION.filter((i) => i.riesgo);

/** Busca por número de catálogo de destilación (1-49). */
export function destilacionPorN(n: number): IngredienteDestilacion | undefined {
  return INGREDIENTES_DESTILACION.find((i) => i.n === n);
}
