// Pociones. Extraídas de los libros de
// `Desktop/Exandria-Obsidian/Exandria/Books/`, y crece a mano como el bestiario
// y la biblioteca de conjuros.
//
// **De dónde sale cada una:**
// - **23** del cap. 7 «Tesoros» de la **Guía del Dungeon Master 2024** (ed.
//   española, pp. 304-307 del libro).
// - **2** del cap. 6 «Wildemount Treasures» del Explorer's Guide to Wildemount
//   (p. 268), que son las únicas pociones del libro.
// - Los otros cuatro libros de la carpeta (los dos Monster Manual, Monsters of
//   the Multiverse y Heroes of Faerun) **no tienen ninguna**: una mención
//   incidental cada uno, ninguna es una entrada.
//
// Dos entradas son **familias**: Curación (4 potencias) y Fuerza de Gigante
// (5 filas, seis tipos de gigante). Van con `variantes` en vez de duplicadas,
// que es como las presenta el libro.
//
// Convención del repo: los datos mecánicos (rareza, dados, CD, duración) son
// **hechos**; el texto es **redacción propia en español**, nunca la prosa del
// libro.
//
// **Todavía sin receta**: qué ingredientes de `data/alquimia.ts` hacen falta
// para preparar cada una es parte de la mecánica de Alquimia, que aún no está
// decidida (ver `docs/pericias-borrador.md`).

export type Rareza = "comun" | "infrecuente" | "rara" | "muy-rara" | "legendaria" | "variable";

export const RAREZA_LABEL: Record<Rareza, string> = {
  "comun": "Común",
  "infrecuente": "Infrecuente",
  "rara": "Rara",
  "muy-rara": "Muy rara",
  "legendaria": "Legendaria",
  "variable": "Rareza variable",
};

/** Orden de menor a mayor, para listar y para el precio cuando lo haya. */
export const RAREZA_ORDEN: Rareza[] = ["comun", "infrecuente", "rara", "muy-rara", "legendaria", "variable"];

export type PocionVariante = {
  name: string;
  rareza: Exclude<Rareza, "variable">;
  /** Lo que cambia respecto a la entrada base: los PG, la Fuerza que fija… */
  detalle: string;
};

export type Pocion = {
  slug: string;
  /** Nombre en español, el que usa la app. */
  name: string;
  /** Nombre original, para buscarlo en el libro. */
  nameEn: string;
  rareza: Rareza;
  /** Dónde está, para poder comprobarlo. */
  source: string;
  /** Qué parece. Redacción propia. */
  blurb: string;
  /** Qué hace, en reglas. Redacción propia, fiel al efecto. */
  effect: string;
  /** Solo en las familias (Curación, Fuerza de Gigante). */
  variantes?: PocionVariante[];
};

const DMG = "Guía del Dungeon Master 2024, cap. 7";
const EGW = "Explorer's Guide to Wildemount, p. 268";

export const POCIONES: Pocion[] = [
  {
    slug: "aliento-de-fuego",
    name: "Poción de Aliento de Fuego",
    nameEn: "Potion of Fire Breath",
    rareza: "infrecuente",
    source: DMG,
    blurb: "Líquido naranja que titila, con la parte alta del frasco llena de humo que se escapa al abrirlo.",
    effect:
      "Tras beberla puedes usar una acción adicional para escupir fuego a un objetivo a 9 m o menos: salvación de Destreza CD 13, 4d6 de daño de fuego si falla, la mitad si la supera. Se agota a los tres escupitajos o al cabo de 1 hora.",
  },
  {
    slug: "amistad-animal",
    name: "Poción de Amistad Animal",
    nameEn: "Potion of Animal Friendship",
    rareza: "infrecuente",
    source: DMG,
    blurb: "Turbia; al agitarla se ven dentro trocitos sueltos: una escama, una pluma, una garra, un pelo.",
    effect: "Al beberla puedes lanzar «encantar animal» a nivel 3, con CD de salvación 13.",
  },
  {
    slug: "clarividencia",
    name: "Poción de Clarividencia",
    nameEn: "Potion of Clairvoyance",
    rareza: "rara",
    source: DMG,
    blurb: "Amarillenta, con un ojo flotando dentro que desaparece en cuanto se destapa el frasco.",
    effect: "Al beberla obtienes el efecto del conjuro «clarividencia», sin necesidad de concentrarte.",
  },
  {
    slug: "crecimiento",
    name: "Poción de Crecimiento",
    nameEn: "Potion of Growth",
    rareza: "infrecuente",
    source: DMG,
    blurb: "Una gota roja que se expande por el líquido transparente y vuelve a encogerse, una y otra vez. Agitarla no la interrumpe.",
    effect: "Al beberla obtienes durante 10 minutos el «agrandar» de «agrandar/reducir», sin concentración.",
  },
  {
    slug: "curacion",
    name: "Poción de Curación",
    nameEn: "Potion of Healing",
    rareza: "variable",
    source: DMG,
    blurb: "Líquido rojo que brilla al agitarse, sea cual sea su potencia.",
    effect: "Al beberla recuperas puntos de golpe. Cuántos, según su potencia.",
    variantes: [
      { name: "Poción de curación", rareza: "comun", detalle: "2d4 + 2 PG" },
      { name: "Poción de curación (mayor)", rareza: "infrecuente", detalle: "4d4 + 4 PG" },
      { name: "Poción de curación (superior)", rareza: "rara", detalle: "8d4 + 8 PG" },
      { name: "Poción de curación (suprema)", rareza: "muy-rara", detalle: "10d4 + 20 PG" },
    ],
  },
  {
    slug: "encoger",
    name: "Poción de Encoger",
    nameEn: "Potion of Diminution",
    rareza: "rara",
    source: DMG,
    blurb: "Como la de Crecimiento pero al revés: el rojo se contrae hasta una gota y vuelve a extenderse.",
    effect: "Al beberla obtienes durante 1d4 horas el «reducir» de «agrandar/reducir», sin concentración.",
  },
  {
    slug: "entendimiento",
    name: "Poción de Entendimiento",
    nameEn: "Potion of Comprehension",
    rareza: "comun",
    source: DMG,
    blurb: "Un mejunje claro con trazas de sal y hollín girando dentro.",
    effect: "Al beberla obtienes el efecto de «entender idiomas» durante 1 hora.",
  },
  {
    slug: "forma-gaseosa",
    name: "Poción de Forma Gaseosa",
    nameEn: "Potion of Gaseous Form",
    rareza: "rara",
    source: DMG,
    blurb: "El frasco parece contener niebla, que se mueve y se derrama como si fuese agua.",
    effect: "Al beberla obtienes el efecto de «forma gaseosa» durante 1 hora, sin concentración, o hasta que lo cortes con una acción adicional.",
  },
  {
    slug: "fuerza-de-gigante",
    name: "Poción de Fuerza de Gigante",
    nameEn: "Potion of Giant Strength",
    rareza: "variable",
    source: DMG,
    blurb: "Líquido transparente con un fragmento de luz dentro, con forma de uña de gigante.",
    effect: "Al beberla tu Fuerza pasa a ser un valor fijo durante 1 hora. Cuál, según el tipo de gigante.",
    variantes: [
      { name: "Fuerza de gigante (colinas)", rareza: "infrecuente", detalle: "Fuerza 21" },
      { name: "Fuerza de gigante (escarcha o piedra)", rareza: "rara", detalle: "Fuerza 23" },
      { name: "Fuerza de gigante (fuego)", rareza: "rara", detalle: "Fuerza 25" },
      { name: "Fuerza de gigante (nubes)", rareza: "muy-rara", detalle: "Fuerza 27" },
      { name: "Fuerza de gigante (tormentas)", rareza: "legendaria", detalle: "Fuerza 29" },
    ],
  },
  {
    slug: "heroismo",
    name: "Poción de Heroísmo",
    nameEn: "Potion of Heroism",
    rareza: "rara",
    source: DMG,
    blurb: "Líquido azul que borbotea y echa humo, como si estuviera hirviendo.",
    effect: "Al beberla obtienes 10 PG temporales durante 1 hora y, ese mismo rato, el efecto de «bendición» sin concentración.",
  },
  {
    slug: "invisibilidad",
    name: "Poción de Invisibilidad",
    nameEn: "Potion of Invisibility",
    rareza: "rara",
    source: DMG,
    blurb: "El frasco parece vacío y lleno a la vez.",
    effect: "Al beberla quedas invisible 1 hora. Se corta antes si atacas, causas daño o lanzas un conjuro.",
  },
  {
    slug: "invisibilidad-mejorada",
    name: "Poción de Invisibilidad Mejorada",
    nameEn: "Potion of Greater Invisibility",
    rareza: "muy-rara",
    source: DMG,
    blurb: "Igual que la normal: el frasco parece vacío y lleno a la vez.",
    effect: "Al beberla quedas invisible 1 hora, y atacar o lanzar conjuros NO la corta.",
  },
  {
    slug: "invulnerabilidad",
    name: "Poción de Invulnerabilidad",
    nameEn: "Potion of Invulnerability",
    rareza: "rara",
    source: DMG,
    blurb: "Espesa como el sirope; parece hierro líquido.",
    effect: "Durante 1 minuto tras beberla tienes resistencia a todo el daño.",
  },
  {
    slug: "leer-mentes",
    name: "Poción de Leer Mentes",
    nameEn: "Potion of Mind Reading",
    rareza: "rara",
    source: DMG,
    blurb: "Líquido morado y denso, con una nube rosa ovalada flotando dentro.",
    effect: "Al beberla obtienes «detectar pensamientos» durante 10 minutos, sin concentración, con CD de salvación 13.",
  },
  {
    slug: "longevidad",
    name: "Poción de Longevidad",
    nameEn: "Potion of Longevity",
    rareza: "muy-rara",
    source: DMG,
    blurb: "Líquido ámbar con un corazón diminuto suspendido dentro que aún late. Desaparece al abrir el frasco.",
    effect:
      "Al beberla rejuveneces 1d6 + 6 años, con un mínimo de 13. Cada poción de longevidad después de la primera tiene un 10 % acumulativo de hacer lo contrario: envejecerte 1d6 + 6 años.",
  },
  {
    slug: "pugilismo",
    name: "Poción de Pugilismo",
    nameEn: "Potion of Pugilism",
    rareza: "infrecuente",
    source: DMG,
    blurb: "Líquido espeso y verdoso que sabe a espinacas.",
    effect: "Durante 10 minutos, cada ataque sin armas que aciertes causa 1d6 de daño de fuerza adicional.",
  },
  {
    slug: "resistencia",
    name: "Poción de Resistencia",
    nameEn: "Potion of Resistance",
    rareza: "infrecuente",
    source: DMG,
    blurb: "Cambia de aspecto según a qué proteja.",
    effect:
      "Al beberla obtienes resistencia a un tipo de daño durante 1 hora. Lo elige el DM, o sale de un d10: 1 ácido, 2 frío, 3 fuego, 4 fuerza, 5 necrótico, 6 psíquico, 7 radiante, 8 relámpago, 9 trueno, 10 veneno.",
  },
  {
    slug: "respirar-bajo-el-agua",
    name: "Poción de Respirar Bajo el Agua",
    nameEn: "Potion of Water Breathing",
    rareza: "infrecuente",
    source: DMG,
    blurb: "Verde turbio, huele a mar y lleva dentro una burbuja con pinta de medusa.",
    effect: "Tras beberla puedes respirar bajo el agua durante 24 horas.",
  },
  {
    slug: "trepar",
    name: "Poción de Trepar",
    nameEn: "Potion of Climbing",
    rareza: "comun",
    source: DMG,
    blurb: "Se separa en tres capas —marrón, plateada y gris— como los estratos de una roca. Agitarla no las mezcla.",
    effect: "Al beberla obtienes velocidad trepando igual a tu velocidad durante 1 hora, y ventaja en las pruebas de Fuerza (Atletismo) para trepar.",
  },
  {
    slug: "velocidad",
    name: "Poción de Velocidad",
    nameEn: "Potion of Speed",
    rareza: "muy-rara",
    source: DMG,
    blurb: "Líquido amarillo con vetas negras que forma remolinos.",
    effect: "Al beberla obtienes el efecto de «acelerar» durante 1 minuto, sin concentración y **sin** la somnolencia que suele dejar al terminar.",
  },
  {
    slug: "veneno",
    name: "Poción de Veneno",
    nameEn: "Potion of Poison",
    rareza: "infrecuente",
    source: DMG,
    blurb: "Parece, huele y sabe a poción de curación. No lo es: es veneno disfrazado con ilusionismo. «Identificar» lo descubre.",
    effect: "Si la bebes sufres 4d6 de daño de veneno y haces una salvación de Constitución CD 13; si la fallas quedas envenenado 1 hora.",
  },
  {
    slug: "vitalidad",
    name: "Poción de Vitalidad",
    nameEn: "Potion of Vitality",
    rareza: "muy-rara",
    source: DMG,
    blurb: "Líquido carmesí que late con luz apagada, como un corazón.",
    effect:
      "Al beberla se te quitan todos los niveles de cansancio y el estado de envenenado. Durante las 24 horas siguientes, cada dado de golpe que gastes recupera su máximo.",
  },
  {
    slug: "vuelo",
    name: "Poción de Vuelo",
    nameEn: "Potion of Flying",
    rareza: "muy-rara",
    source: DMG,
    blurb: "Líquido transparente que flota en la parte alta del frasco, con impurezas blancas con forma de nube.",
    effect: "Al beberla obtienes velocidad volando igual a tu velocidad durante 1 hora, y puedes quedarte flotando. Si sigues en el aire al acabarse, te caes.",
  },

  // --- Explorer's Guide to Wildemount ---------------------------------------
  {
    slug: "potencia-maxima",
    name: "Poción de Potencia Máxima",
    nameEn: "Potion of Maximum Power",
    rareza: "rara",
    source: EGW,
    blurb: "Líquido morado que brilla, huele a azúcar y ciruela y sabe a barro.",
    effect:
      "Durante el minuto siguiente a bebértela, el primer conjuro de daño de nivel 4 o inferior que lances no tira daño: cada dado cuenta como su valor máximo.",
  },
  {
    slug: "posibilidad",
    name: "Poción de Posibilidad",
    nameEn: "Potion of Possibility",
    rareza: "muy-rara",
    source: EGW,
    blurb: "Líquido transparente del que, al beberlo, salen dos cuentas grisáceas de energía que te siguen flotando a un palmo.",
    effect:
      "Al beberla obtienes dos Fragmentos de Posibilidad, que duran 8 horas o hasta gastarse.\n" +
      "• En una tirada de ataque, prueba de característica o salvación, gasta un fragmento para tirar un d20 adicional y quedarte con el que prefieras.\n" +
      "• Cuando te atacan, gasta un fragmento para tirar un d20 adicional y elegir cuál usa el atacante: el suyo o el tuyo.\n" +
      "• Si la tirada tenía ventaja o desventaja, el d20 del fragmento se tira sin ninguna de las dos.\n" +
      "Mientras te quede un fragmento de esta poción, no puedes obtener otro de la misma fuente.",
  },
];

export function pocionPorSlug(slug: string): Pocion | undefined {
  return POCIONES.find((p) => p.slug === slug);
}

/** Todas las pociones de una rareza. Las familias van por su rareza declarada. */
export function pocionesDe(rareza: Rareza): Pocion[] {
  return POCIONES.filter((p) => p.rareza === rareza);
}
