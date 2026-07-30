// Clases del PHB 2024. Datos mecánicos (dado de golpe, aptitud principal,
// salvaciones, pericias, subclases). Descripciones originales y breves.

import type { AbilityKey } from "./rules";

export type CharClass = {
  slug: string;
  name: string;
  /** marcial | arcano | divino | primitivo — para color de acento */
  group: "marcial" | "arcano" | "divino" | "primitivo";
  hitDie: number;
  primary: AbilityKey[];
  saves: AbilityKey[];
  skillCount: number;
  /** lista de pericias elegibles (nombres exactos de rules.SKILLS) */
  skillList: string[];
  subclassLabel: string;
  subclasses: { name: string; blurb: string }[];
  tagline: string;
  blurb: string;
  image?: string;   // /classes/<slug>.png
};

export const CLASSES: CharClass[] = [
  {
    slug: "barbaro", name: "Bárbaro", group: "primitivo", hitDie: 12,
    primary: ["fue"], saves: ["fue", "con"], skillCount: 2,
    skillList: ["Atletismo", "Intimidación", "Naturaleza", "Percepción", "Supervivencia", "Trato con Animales"],
    subclassLabel: "Senda primigenia",
    subclasses: [
      { name: "Senda de la Furia Bermellón", blurb: "Canalizan el terror alienígena y el daño psíquico de la luna roja de Ruidus." },
      { name: "Senda del Titán Caído", blurb: "Asimilan la roca y la inamovilidad de los Primordiales, provocando seísmos al golpear." },
      { name: "Senda de la Ceniza Helada", blurb: "Guerreros de Eiselcross cuya furia congela el aire y la sangre de sus enemigos." },
      { name: "Senda de la Mutación Salvaje", blurb: "Bárbaros de los páramos que desarrollan garras, espinas o glándulas de ácido al enfurecerse." },
      { name: "Senda del Rompe-Mares", blurb: "Gladiadores piratas del Océano Lucidian, expertos en apresar bestias acuáticas." },
    ],
    tagline: "Furia primigenia hecha arma.",
    blurb: "Guerreros que canalizan una rabia ancestral. Donde otros calculan, el bárbaro carga.",
  },
  {
    slug: "bardo", name: "Bardo", group: "arcano", hitDie: 8,
    primary: ["car"], saves: ["des", "car"], skillCount: 3,
    skillList: ["Acrobacias", "Arcanos", "Atletismo", "Engaño", "Historia", "Interpretación", "Intimidación", "Investigación", "Juego de Manos", "Medicina", "Naturaleza", "Percepción", "Perspicacia", "Persuasión", "Religión", "Sigilo", "Supervivencia", "Trato con Animales"],
    subclassLabel: "Colegio bárdico",
    subclasses: [
      { name: "Colegio del Lamento", blurb: "Roban recuerdos y usan la tristeza del Páramo Sombrío para quebrar la mente del enemigo." },
      { name: "Colegio del Espejismo", blurb: "Ilusionistas del desierto de Marquet que crean laberintos mentales y copias exactas de sí mismos." },
      { name: "Colegio del Himno Marcial", blurb: "Estrategas hobgoblins que otorgan armadura temporal y ordenan reposicionamientos gratuitos." },
      { name: "Colegio de los Ecos", blurb: "Tocan la \"música\" del tiempo (Dunamancia), acelerando aliados o ralentizando enemigos." },
      { name: "Colegio de los Astros", blurb: "Astrólogos que alteran sus bufos mágicos según sintonicen con la luna Catha o Ruidus." },
    ],
    tagline: "La magia de la palabra y la canción.",
    blurb: "Maestros de mil oficios cuya música teje magia y reescribe el ánimo de una sala.",
  },
  {
    slug: "brujo", name: "Brujo", group: "arcano", hitDie: 8,
    primary: ["car"], saves: ["sab", "car"], skillCount: 2,
    skillList: ["Arcanos", "Engaño", "Historia", "Intimidación", "Investigación", "Naturaleza", "Religión"],
    subclassLabel: "Patrón sobrenatural",
    subclasses: [
      { name: "Patrón del Heraldo de Ruidus", blurb: "Roban los bufos, curaciones y escudos enemigos devorando su magia con pura radiación lunar." },
      { name: "Patrón del Leviatán Sellado", blurb: "Invocan tentáculos, ahogan a los enemigos en tierra firme y se protegen con agua a hiperpresión." },
      { name: "Patrón de la Tejedora", blurb: "Todas sus magias se tornan veneno puro, tejiendo telarañas que drenan vida e impiden reaccionar." },
      { name: "Patrón del Archimago Caído", blurb: "Magia corrupta de la Calamidad que les permite memorizar y robar un hechizo enemigo tras verlo lanzarse." },
      { name: "Patrón del Espíritu de la Tierra", blurb: "Su piel se vuelve roca basalto y extraen su energía de los restos de los Titanes muertos bajo el suelo." },
    ],
    tagline: "Poder a cambio de un pacto.",
    blurb: "Lanzadores que arrancan magia a un patrón de otro plano. Cada don tiene su precio.",
  },
  {
    slug: "clerigo", name: "Clérigo", group: "divino", hitDie: 8,
    primary: ["sab"], saves: ["sab", "car"], skillCount: 2,
    skillList: ["Historia", "Medicina", "Perspicacia", "Persuasión", "Religión"],
    subclassLabel: "Dominio divino",
    subclasses: [
      { name: "Dominio de la Convergencia", blurb: "Sacerdotes estelares que alternan entre la curación radiante y el castigo psíquico." },
      { name: "Dominio de la Sangre", blurb: "Manipulan el flujo vital para reanimar títeres de sangre, curar hemorragias y hervir venas enemigas." },
      { name: "Dominio de la Forja Ancestral", blurb: "Tanques de Kraghammer que graban runas explosivas de fuego en armas y armaduras." },
      { name: "Dominio del Cieno", blurb: "Adoradores de lo abisal; disuelven armas enemigas con ácido y apresan con lodo tóxico." },
      { name: "Dominio de la Puerta Divina", blurb: "Inquisidores de Vasselheim dedicados exclusivamente a silenciar hechiceros y disipar magia." },
    ],
    tagline: "Conducto de la voluntad de un dios.",
    blurb: "Campeones de una deidad de Exandria. Sanan, protegen y desatan poder divino.",
  },
  {
    slug: "druida", name: "Druida", group: "primitivo", hitDie: 8,
    primary: ["sab"], saves: ["int", "sab"], skillCount: 2,
    skillList: ["Arcanos", "Medicina", "Naturaleza", "Percepción", "Perspicacia", "Religión", "Supervivencia", "Trato con Animales"],
    subclassLabel: "Círculo druídico",
    subclasses: [
      { name: "Círculo de la Ceniza", blurb: "Se transforman en espíritus de ascuas puras; su magia ígnea quema todo a su paso." },
      { name: "Círculo del Enjambre Feérico", blurb: "Se disuelven en letales nubes de luciérnagas y avispas del Paraje Feérico para infiltrarse y curar." },
      { name: "Círculo de la Espora Abisal", blurb: "Reaniman cadáveres con hongos letales del Underdark y resisten la muerte sin órganos vitales." },
      { name: "Círculo de la Tormenta Primigenia", blurb: "Encarnan el clima extremo de los Ashari, volando como avatares de relámpago y huracán." },
      { name: "Círculo de la Escarcha Corrupta", blurb: "Se cubren de armaduras de hielo negro que ralentizan, congelan y necrosan a los atacantes." },
    ],
    tagline: "La voz de lo salvaje.",
    blurb: "Guardianes de la naturaleza que adoptan forma de bestia y dominan la magia primigenia.",
  },
  {
    slug: "explorador", name: "Explorador", group: "primitivo", hitDie: 10,
    primary: ["des", "sab"], saves: ["fue", "des"], skillCount: 3,
    skillList: ["Atletismo", "Investigación", "Naturaleza", "Percepción", "Perspicacia", "Sigilo", "Supervivencia", "Trato con Animales"],
    subclassLabel: "Arquetipo del explorador",
    subclasses: [
      { name: "Cazador de Malicia", blurb: "Sombras del Underdark que se teletransportan por la oscuridad para castigar a quienes huyen." },
      { name: "Vigilante del Telón", blurb: "Francotiradores del océano que ven a través de la niebla e ignoran el clima ambiental." },
      { name: "Rastreador de Yermos", blurb: "Sobrevivientes del hielo que ralentizan a sus presas y hacen estallar trampas glaciares." },
      { name: "Inquisidor de la Asamblea", blurb: "Cazadores de magos del Imperio; sus flechas rompen la concentración e imponen esferas de silencio." },
      { name: "Vigía de Rifenmist", blurb: "Guerrilleros de la jungla maestros en venenos que ignoran inmunidades y asaltos críticos desde las sombras." },
    ],
    tagline: "Cazador entre la espada y la magia.",
    blurb: "Rastreadores letales que combinan destreza marcial con magia de la naturaleza.",
  },
  {
    slug: "guerrero", name: "Guerrero", group: "marcial", hitDie: 10,
    primary: ["fue", "des"], saves: ["fue", "con"], skillCount: 2,
    skillList: ["Acrobacias", "Atletismo", "Historia", "Intimidación", "Percepción", "Perspicacia", "Persuasión", "Supervivencia"],
    subclassLabel: "Arquetipo marcial",
    subclasses: [
      { name: "Guerrero Elementalista", blurb: "Combinan los golpes físicos pesados con la destrucción de la magia primaria elemental." },
      { name: "Hoplita de la Puerta Divina", blurb: "Falanges anti-magia que anclan a magos al suelo e irradian auras de protección divina." },
      { name: "Caballero de Grifos", blurb: "La élite aérea de Emon, maestros de las lanzas de caballería, los saltos y el combate en caída libre." },
      { name: "Guardia de los Ecos", blurb: "Combatientes dunamánticos que atacan simultáneamente junto a clones temporales de sí mismos." },
      { name: "Rompeasedios", blurb: "Tropas pesadas imperiales expertas en control de masas físico, derribos y destrucción de escudos." },
    ],
    tagline: "La maestría absoluta de las armas.",
    blurb: "Combatientes consumados, versátiles en cualquier arma y armadura. Atacan más que nadie.",
  },
  {
    slug: "hechicero", name: "Hechicero", group: "arcano", hitDie: 6,
    primary: ["car"], saves: ["con", "car"], skillCount: 2,
    skillList: ["Arcanos", "Engaño", "Intimidación", "Perspicacia", "Persuasión", "Religión"],
    subclassLabel: "Origen de hechicería",
    subclasses: [
      { name: "Alma del Luxon", blurb: "Curvan la gravedad con cada hechizo e incluso pueden rebobinar su propio turno en el tiempo." },
      { name: "Corazón de Magma", blurb: "Su sangre es lava; sus hechizos de fuego dejan charcos ardientes en el campo de batalla." },
      { name: "Alma Feérica", blurb: "Magos impredecibles que bailan mediante teletransportación y atraviesan las inmunidades mentales del enemigo." },
      { name: "Linaje Radiante", blurb: "Baterías sagradas andantes; ciegan con luz divina e invocan alas de energía purificadora." },
      { name: "Linaje de la Calamidad", blurb: "Radiactivos e inestables, sacrifican su propia vida para maximizar los daños de su magia en ruina." },
    ],
    tagline: "Magia que brota de la propia sangre.",
    blurb: "Lanzadores natos que moldean la magia con Metamagia. El poder vive en ellos.",
  },
  {
    slug: "mago", name: "Mago", group: "arcano", hitDie: 6,
    primary: ["int"], saves: ["int", "sab"], skillCount: 2,
    skillList: ["Arcanos", "Historia", "Investigación", "Medicina", "Naturaleza", "Perspicacia", "Religión"],
    subclassLabel: "Tradición arcana",
    subclasses: [
      { name: "Tradición del Invocador de Ecos (Nigromante)", blurb: "Levantan los residuos espectrales de las almas en lugar de podrir cadáveres." },
      { name: "Tradición de la Graviturgia", blurb: "Alteran el peso de los objetos, derribando voladores y creando agujeros negros en la arena." },
      { name: "Tradición de la Cronurgia", blurb: "Detienen el tiempo, congelan hechizos en el aire y fuerzan a la realidad a fallar o acertar los dados." },
      { name: "Tradición del Hemomante", blurb: "Usan sus propios Puntos de Golpe como componentes materiales para sobrecargar sus conjuros." },
      { name: "Tradición del Maestro de Sellos", blurb: "Abjuradores tácticos que dibujan glifos explosivos rápidos que detonan al ser pisados." },
    ],
    tagline: "El estudio que desentraña el cosmos.",
    blurb: "Eruditos de la magia con el grimorio más amplio. Estudio, no instinto.",
  },
  {
    slug: "monje", name: "Monje", group: "marcial", hitDie: 8,
    primary: ["des", "sab"], saves: ["fue", "des"], skillCount: 2,
    skillList: ["Acrobacias", "Atletismo", "Historia", "Interpretación", "Perspicacia", "Religión", "Sigilo"],
    subclassLabel: "Tradición marcial",
    subclasses: [
      { name: "Camino del Hilo del Destino", blurb: "Artes marciales de la probabilidad; aseguran sus golpes y obligan a los enemigos a fallar en el último segundo." },
      { name: "Camino del Alma de Cobalto", blurb: "Eruditos que golpean puntos de presión para extraer información táctica y secretos del enemigo." },
      { name: "Camino de las Cadenas Rotas", blurb: "Invocan cadenas de ki desde sus muñecas para golpear, derribar y atraer desde lejos." },
      { name: "Camino de los Vientos Cenicientos", blurb: "Monjes Ashari que envuelven sus ráfagas de golpes en fuego y proyectan vientos inbloqueables." },
      { name: "Camino de la Mente Vacía", blurb: "Bloquean su cerebro contra la magia, devolviendo el daño psíquico a quien intente leer su mente." },
    ],
    tagline: "Cuerpo y mente como una sola arma.",
    blurb: "Artistas marciales que canalizan el ki para golpear rápido y moverse imposiblemente.",
  },
  {
    slug: "paladin", name: "Paladín", group: "divino", hitDie: 10,
    primary: ["fue", "car"], saves: ["sab", "car"], skillCount: 2,
    skillList: ["Atletismo", "Intimidación", "Medicina", "Perspicacia", "Persuasión", "Religión"],
    subclassLabel: "Juramento sagrado",
    subclasses: [
      { name: "Juramento de la Reclamación", blurb: "Cazatesoros acorazados especializados en desactivar trampas y proteger Vestigios mágicos." },
      { name: "Juramento del Exilio", blurb: "Defensores fronterizos que castigan a las aberraciones e imponen silencio a los viajeros planares." },
      { name: "Juramento de la Luz Primigenia", blurb: "Caballeros drow de la Luz que alteran la gravedad y la inercia con sus ataques castigadores." },
      { name: "Juramento del Alba", blurb: "Templarios del fuego solar, centrados en la erradicación absoluta de muertos vivientes mediante daño radiante masivo." },
      { name: "Juramento de los Grilletes", blurb: "Carceleros arcanos que paralizan a sus enemigos y les impiden teleportarse." },
    ],
    tagline: "Acero sagrado y juramento inquebrantable.",
    blurb: "Guerreros sagrados ligados a un juramento. Castigan con daño radiante y curan con imposición de manos.",
  },
  {
    slug: "picaro", name: "Pícaro", group: "marcial", hitDie: 8,
    primary: ["des"], saves: ["des", "int"], skillCount: 4,
    skillList: ["Acrobacias", "Atletismo", "Engaño", "Interpretación", "Intimidación", "Investigación", "Juego de Manos", "Percepción", "Perspicacia", "Persuasión", "Sigilo"],
    subclassLabel: "Arquetipo de pícaro",
    subclasses: [
      { name: "Sombra Dunamántica", blurb: "Cortan la línea temporal para golpear de nuevo a sus enemigos o intercambiar posiciones con sus ecos." },
      { name: "Saqueador Arcano", blurb: "Usan su ataque furtivo para robar espacios de conjuro e interrumpir la magia enemiga en pleno vuelo." },
      { name: "Sindicalista de la Myriad", blurb: "Mafiosos que engañan y obligan a que los enemigos gasten sus reacciones atacándose entre ellos." },
      { name: "Fantasma de las Dunas", blurb: "Asesinos del desierto que se disuelven en arena, ciegan con polvo y encierran a los vivos en sarcófagos." },
      { name: "Asesino de Azuremita", blurb: "Caminan por los techos y convierten todo su daño físico en dolor mental, silenciando los gritos de sus víctimas." },
    ],
    tagline: "El golpe certero desde las sombras.",
    blurb: "Expertos del sigilo y la precisión. Su Ataque Furtivo convierte una apertura en una herida mortal.",
  },
  {
    slug: "cazador-de-sangre", name: "Cazador de Sangre", group: "marcial", hitDie: 10,
    primary: ["fue", "des"], saves: ["fue", "int"], skillCount: 3,
    skillList: ["Acrobacias", "Arcanos", "Atletismo", "Historia", "Investigación", "Intimidación", "Perspicacia", "Religión", "Supervivencia"],
    subclassLabel: "Orden sanguínea",
    subclasses: [
      { name: "Orden del Velo Carmesí", blurb: "Gastan su propia salud para crear copias físicas perfectas y hacerse indetectables a la visión verdadera." },
      { name: "Orden del Paraje Marchito", blurb: "Sus espadas inyectan toxinas que ralentizan y sus cuerpos expulsan nubes de esporas necróticas si son atacados." },
      { name: "Orden del Inquisidor", blurb: "Si logran cortar a un mago, el dolor le revienta los canales arcanos causándole daño al intentar lanzar hechizos." },
      { name: "Orden del Mutante", blurb: "Beben inyecciones tóxicas (Mutágenos) para potenciar atributos base a límites sobrehumanos, asumiendo debilidades." },
      { name: "Orden de la Bestia", blurb: "Licántropos controlados mediante magia de sangre; monstruos de combate desarmado cuerpo a cuerpo." },
    ],
    tagline: "Magia de sangre para cazar lo que la teme.",
    blurb: "Guerreros que sacrifican su propia vitalidad en ritos de hemocratía para dar caza a lo sobrenatural. Clase de Matt Mercer, seña de identidad de Exandria.",
  },
];

export function getClass(slug: string) {
  return CLASSES.find((c) => c.slug === slug);
}

export const GROUP_ACCENT: Record<CharClass["group"], string> = {
  marcial: "var(--color-marcial)",
  arcano: "var(--color-arcano)",
  divino: "var(--color-divino)",
  primitivo: "var(--color-primitivo)",
};
export const GROUP_LABEL: Record<CharClass["group"], string> = {
  marcial: "Marcial", arcano: "Arcano", divino: "Divino", primitivo: "Primigenio",
};
