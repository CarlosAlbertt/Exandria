// Materiales de cristalografía arcana: gemas, geodas, pulimentos y las
// herramientas para tallarlos, con la pericia de oficio **Cristalografía
// Arcana** (`data/rules.ts`).
//
// Quinto catálogo del mismo tipo. **Numeración propia**, de 1 a 50.
//
// El DM lo pasó en dos bloques —25 sin numerar y 25 numeradas del 26 al 50—;
// aquí van renumeradas de 1 a 50 seguidas, en el mismo orden.
//
// Varias entradas **no son material sino herramienta** (cinceles, pinzas, paños
// de pulir). Van marcadas con `herramienta`, porque una receta futura las
// necesita disponibles pero **no las gasta**.
//
// **Todavía sin mecánica**: ni CD, ni receta, ni qué sale de tallar cada cosa.

export type MaterialCristal = {
  /** Número de catálogo, estable. */
  n: number;
  name: string;
  blurb: string;
  /** No se consume: es utillaje del taller. */
  herramienta?: true;
};

export const MATERIALES_CRISTAL: MaterialCristal[] = [
  { n: 1, name: "Ruidium en bruto", blurb: "El cristal rojo de la Calamidad. Extremadamente volátil de tallar: potencia objetos mágicos a niveles absurdos, pero maldice a quien los porta." },
  { n: 2, name: "Polvo de Piedra de Bruma", blurb: "Se usa como pulimento. Una gema pulida con esto flota perpetuamente a tu alrededor: es como se hacen piedras ioun caseras." },
  { n: 3, name: "Cristal Nulo de Aeor", blurb: "Cristal negro de la ciudad caída. Suprime la magia a su alrededor, así que tallarlo es un infierno: desactiva las herramientas mágicas del joyero al acercarse." },
  { n: 4, name: "Piedra Lunar de Catha", blurb: "Roca blanca que brilla sola en la oscuridad. El núcleo perfecto para amuletos que controlan o suprimen la licantropía." },
  { n: 5, name: "Lente de Ojo de Gorgona", blurb: "Cristalizada de forma natural. Pulida y montada en un catalejo, deja ver el interior de estatuas petrificadas o de muros de piedra." },
  { n: 6, name: "Diente de Vampiro Anciano", herramienta: true, blurb: "El estilete de los nigromantes: tan afilado y denso que es lo único capaz de grabar runas en adamantina sin romperse." },
  { n: 7, name: "Psicoda de Azotamentes", blurb: "Cristal violeta alienígena. No canaliza magia sino pensamientos: se puede tallar para grabar un mensaje telepático que suena al tocarlo." },
  { n: 8, name: "Diamante de Presión Abisal", blurb: "De la fosa del Lucidian. Virtualmente indestructible; aguanta cualquier nivel de magia de evocación sin fracturarse." },
  { n: 9, name: "Escama de Acorazado Astral", herramienta: true, blurb: "El paño de pulir definitivo. Su fricción sintoniza los cristales con el Plano Astral: ideal para gemas de teletransportación." },
  { n: 10, name: "Cristal de Sal de Lágrima de Banshee", blurb: "Un cristal tristísimo. Si se talla cerca de magia curativa o de música alegre, se hace añicos solo." },
  { n: 11, name: "Geoda de Relámpago de Behir", blurb: "Piedra en bruto que chisporrotea. Al abrirla trae cristales azules que hacen de batería eléctrica para los artífices." },
  { n: 12, name: "Espejo de Obsidiana de Xhorhas", blurb: "Cristal volcánico negro perfectamente pulido. La base para espejos de escrutinio indetectables." },
  { n: 13, name: "Ópalo de Tormenta de los Ashari", blurb: "Gema turbia con lo que parecen nubes arremolinadas dentro. El núcleo de un bastón del trueno y el relámpago." },
  { n: 14, name: "Cristal Espejismo de Marquet", blurb: "Refracta la luz de formas imposibles: según el ángulo, la gema es invisible. Va en anillos de ladrón." },
  { n: 15, name: "Citrino de Fuego Fatuo", blurb: "Gema amarilla y cálida, capaz de absorber un alma humana en el momento de morir si está a metro y medio." },
  { n: 16, name: "Piedra de Eco del Laberinto", blurb: "Cuarzo extraño que resuena. Si lanzas un conjuro a través de ella, al día siguiente puede repetirlo sin gastar espacio." },
  { n: 17, name: "Polvo de Estrella Fugaz para gemas", blurb: "Se inyecta en fisuras microscópicas de otras gemas para darles un brillo interno perpetuo que ninguna oscuridad mágica apaga." },
  { n: 18, name: "Cuarzo de Tiempo Astillado", blurb: "Fragmento de un faro Kryn dañado. Sirve para un amuleto frágil que deja repetir un dado, y que se rompe al usarlo." },
  { n: 19, name: "Gema Sombra", blurb: "Zafiro del Páramo Sombrío tan oscuro que absorbe la luz a un metro, dejando un halo de penumbra perpetua." },
  { n: 20, name: "Cincel de Hueso de Dragón Rojo", herramienta: true, blurb: "Inmune al calor. Necesario para tallar rubíes de fuego o cristales volcánicos que derretirían el acero." },
  { n: 21, name: "Ámbar de Molaesmyr corrupto", blurb: "Con un insecto feérico deformado dentro. Canaliza magia salvaje: lo que se hace con él siempre tiene un efecto secundario impredecible." },
  { n: 22, name: "Fragmento de la Puerta Divina", blurb: "Mítico. Una mota de polvo dorado que vale reinos: emite luz cegadora e invalida la magia de los corruptores a su alrededor." },
  { n: 23, name: "Geoda Canta-Huesos", blurb: "De Kraghammer. Bien tallada, vibra y da un tono agudo cuando detecta túneles huecos o pasadizos secretos en la roca." },
  { n: 24, name: "Lágrima de Levitar de Ank'Harel", blurb: "Cristal en forma de gota que siempre apunta hacia arriba. Se usa para calibrar los motores de los barcos voladores." },
  { n: 25, name: "Turmalina de Transmutación", blurb: "Cambia de color para imitar la última gema que haya tocado." },
  { n: 26, name: "Residuum en bruto", blurb: "Rocas de cristal verde sin refinar de Whitestone. Talladas mal, explotan liberando fuerza mágica." },
  { n: 27, name: "Prisma Dunamántico Inerte", blurb: "Cuarzo grisáceo que, tallado con geometría sagrada Kryn, atrapa ecos temporales." },
  { n: 28, name: "Fragmento de Azuremita Brillante", blurb: "Resuena cuando alguien piensa cerca. Exige tallado con herramientas psiónicas, no físicas." },
  { n: 29, name: "Arena de Escama de Dragón", herramienta: true, blurb: "El único abrasivo bastante duro para pulir diamantes mágicos o adamantina." },
  { n: 30, name: "Polvo de Diamante Puro", blurb: "Recubrimiento para lentes de catalejos arcanos o gafas de visión verdadera." },
  { n: 31, name: "Geoda de Tormenta", blurb: "Fea por fuera; por dentro, cristales que sueltan chispas. Base para varitas de relámpago." },
  { n: 32, name: "Zafiro Vidente", blurb: "Cortado en esferas perfectas, es la lente principal de una bola de cristal de adivinación." },
  { n: 33, name: "Ónix Atrapa-Almas", blurb: "Gema negra como el vacío, usada por nigromantes para guardar espíritus o componentes de reanimar a los muertos." },
  { n: 34, name: "Rubí Sangre de Corazón", blurb: "Gema roja que palpita al tocarla; amplifica los conjuros de evocación." },
  { n: 35, name: "Cristal de Sal Marina para tallar", blurb: "Del Lucidian. Bien tallado, absorbe y purifica cualquier líquido no mágico." },
  { n: 36, name: "Ácido de Cieno de Precisión", blurb: "En gotas microscópicas, derrite facetas en gemas que no se pueden cortar a cincel." },
  { n: 37, name: "Lente de Ojo de Basilisco", blurb: "Cristalizada sola. Se talla en monóculos que dejan ver seres petrificados o etéreos." },
  { n: 38, name: "Cincel de Adamantina", herramienta: true, blurb: "La herramienta básica de cualquier cristalógrafo que se respete: nunca pierde el filo." },
  { n: 39, name: "Piedra del Eco del Underdark", blurb: "Cristal cavernoso que repite el último sonido que oyó. Útil para alarmas mágicas." },
  { n: 40, name: "Esmeralda Atrapa-Veneno", blurb: "Cambia de color si hay toxinas en la sala. Se engarza en los cálices de los reyes." },
  { n: 41, name: "Ámbar de Aeor", blurb: "Contiene chispas de magia corrupta fosilizadas. Al tallarlo, sus virutas levitan." },
  { n: 42, name: "Cuarzo de Ilusión", blurb: "Parece estar tres centímetros más allá de donde está. Difícil de tallar sin cortarse un dedo." },
  { n: 43, name: "Piedra Imán de Kraghammer", blurb: "Mineral magnético para calibrar brújulas y amuletos que señalan planos concretos." },
  { n: 44, name: "Perla del Kraken", blurb: "Perla negra del tamaño de un puño. Tallada, hace sintonizadores para controlar el clima local." },
  { n: 45, name: "Pinzas de Hueso de Dragón", herramienta: true, blurb: "Necesarias para manipular cristales que queman o irradian de forma letal al tacto." },
  { n: 46, name: "Vidrio Feérico", blurb: "Soplado por hadas: flexible como el cuero hasta que se enfría bajo la luz de la luna." },
  { n: 47, name: "Plata Líquida en amalgama", blurb: "Baña el reverso de los cristales y los convierte en espejos de escrutinio." },
  { n: 48, name: "Geoda de Sangre", blurb: "Cristales formados en campos de batalla masivos; rezuman un líquido rojo al cortarlos." },
  { n: 49, name: "Piedra Solar de Ank'Harel", blurb: "Absorbe la luz del día y la devuelve como luz brillante toda la noche, indefinidamente." },
  { n: 50, name: "Turmalina Prismática", blurb: "Descompone cualquier magia de evocación que la atraviese, separando el fuego del hielo." },
];

/** Las que son utillaje del taller y no se consumen. */
export const CRISTAL_HERRAMIENTAS: MaterialCristal[] =
  MATERIALES_CRISTAL.filter((m) => m.herramienta);

/** Busca por número de catálogo de cristalografía (1-50). */
export function cristalPorN(n: number): MaterialCristal | undefined {
  return MATERIALES_CRISTAL.find((m) => m.n === n);
}
