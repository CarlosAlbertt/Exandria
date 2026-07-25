// Conjuros (D&D 2024). Los datos mecánicos —nivel, escuela, tiempo, alcance,
// componentes, duración, listas de clase— son hechos de juego. Las descripciones
// son resúmenes PROPIOS en español, nunca prosa de los libros.
//
// SEMILLA que CRECE: como el bestiario y el atlas, esta lista empieza curada
// (trucos + los conjuros de nivel 1-3 que más se usan en mesa) y se amplía
// sesión a sesión. No pretende ser el SRD entero.
import type { AbilityKey } from "@/data/rules";

export type Spell = {
  id: string;             // slug único
  name: string;           // nombre en español
  level: number;          // 0 = truco
  school: string;         // escuela de magia
  classes: string[];      // slugs de clase que lo tienen en su lista
  time: string;           // tiempo de lanzamiento
  range: string;          // alcance
  components: string;     // V, S, M
  duration: string;       // duración
  concentration?: boolean;
  ritual?: boolean;
  desc: string;           // resumen PROPIO
  // Efecto opcional: alimenta el botón «Lanzar». Los que no lo traen solo anuncian.
  attack?: boolean;                        // tirada de ataque de conjuro
  save?: AbilityKey;                       // salvación que provoca
  damage?: { dice: string; type: string }; // daño base (nivel mínimo)
  heal?: string;                           // dados de curación
};

export const SPELLS: Record<string, Spell> = {
  // --- TRUCOS (nivel 0) ------------------------------------------------------
  "luz": {
    id: "luz", name: "Luz", level: 0, school: "Evocación",
    classes: ["bardo", "clerigo", "hechicero", "mago"],
    time: "1 acción", range: "Toque", components: "V, M (una luciérnaga o musgo fosforescente)", duration: "1 hora",
    desc: "Un objeto que toques irradia luz brillante en un radio corto durante una hora. Si el objeto está en manos de alguien hostil, puede resistirse con una salvación de Destreza.",
  },
  "prestidigitacion": {
    id: "prestidigitacion", name: "Prestidigitación", level: 0, school: "Transmutación",
    classes: ["bardo", "brujo", "hechicero", "mago"],
    time: "1 acción", range: "3 m", components: "V, S", duration: "Hasta 1 hora",
    desc: "Pequeños trucos sin consecuencia: encender o apagar una vela, ensuciar o limpiar algo, enfriar o calentar comida, dejar una marca que se borra sola.",
  },
  "mano-de-mago": {
    id: "mano-de-mago", name: "Mano de Mago", level: 0, school: "Conjuración",
    classes: ["bardo", "brujo", "hechicero", "mago"],
    time: "1 acción", range: "9 m", components: "V, S", duration: "1 minuto",
    desc: "Aparece una mano espectral que manipula objetos a distancia: abrir un frasco, empujar una palanca, llevar algo ligero. No puede atacar ni activar objetos mágicos.",
  },
  "rayo-de-escarcha": {
    id: "rayo-de-escarcha", name: "Rayo de Escarcha", level: 0, school: "Evocación",
    classes: ["brujo", "hechicero", "mago"],
    time: "1 acción", range: "18 m", components: "V, S", duration: "Instantáneo",
    desc: "Un dardo de frío intenso golpea al objetivo. Además del daño, le reduce la velocidad hasta tu siguiente turno.",
    attack: true, damage: { dice: "1d8", type: "frío" },
  },
  "descarga-sobrenatural": {
    id: "descarga-sobrenatural", name: "Descarga Sobrenatural", level: 0, school: "Evocación",
    classes: ["brujo"],
    time: "1 acción", range: "36 m", components: "V, S", duration: "Instantáneo",
    desc: "Un haz de energía crepitante sale disparado hacia el objetivo. Es el ataque básico del brujo y mejora con las invocaciones de pacto.",
    attack: true, damage: { dice: "1d10", type: "fuerza" },
  },
  "llama-sagrada": {
    id: "llama-sagrada", name: "Llama Sagrada", level: 0, school: "Evocación",
    classes: ["clerigo"],
    time: "1 acción", range: "18 m", components: "V, S", duration: "Instantáneo",
    desc: "Un resplandor divino cae sobre el objetivo. La cobertura no le sirve de nada para esquivarlo.",
    save: "des", damage: { dice: "1d8", type: "radiante" },
  },
  "toque-helado": {
    id: "toque-helado", name: "Toque Helado", level: 0, school: "Nigromancia",
    classes: ["hechicero", "mago"],
    time: "1 acción", range: "36 m", components: "V, S", duration: "Instantáneo",
    desc: "Una mano espectral marchita a quien toca. Hasta tu siguiente turno, el objetivo no puede recuperar puntos de golpe.",
    attack: true, damage: { dice: "1d10", type: "necrótico" },
  },
  "taumaturgia": {
    id: "taumaturgia", name: "Taumaturgia", level: 0, school: "Transmutación",
    classes: ["clerigo"],
    time: "1 acción", range: "9 m", components: "V", duration: "Hasta 1 minuto",
    desc: "Manifestación menor de poder divino: tu voz retumba, las llamas parpadean, el suelo tiembra un instante o una puerta se abre de golpe. Impresiona, no daña.",
  },
  "artificio-druidico": {
    id: "artificio-druidico", name: "Artificio Druídico", level: 0, school: "Transmutación",
    classes: ["druida"],
    time: "1 acción", range: "9 m", components: "V, S", duration: "Instantáneo",
    desc: "Un guiño de la naturaleza: predices el tiempo que hará, haces florecer un capullo, creas un efecto sensorial inofensivo o apagas una llama pequeña.",
  },
  "latigo-espinoso": {
    id: "latigo-espinoso", name: "Látigo Espinoso", level: 0, school: "Transmutación",
    classes: ["druida"],
    time: "1 acción", range: "9 m", components: "V, S, M (el tallo de una planta con espinas)", duration: "Instantáneo",
    desc: "Una liana espinosa surge de tu mano, golpea a una criatura cercana y tira de ella hacia ti si es lo bastante ligera.",
    attack: true, damage: { dice: "1d6", type: "perforante" },
  },
  "burla-viciosa": {
    id: "burla-viciosa", name: "Burla Viciosa", level: 0, school: "Encantamiento",
    classes: ["bardo"],
    time: "1 acción", range: "18 m", components: "V", duration: "Instantáneo",
    desc: "Un insulto cargado de magia que se clava en la mente. Si le hace mella, además la criatura tira su siguiente ataque con desventaja.",
    save: "sab", damage: { dice: "1d6", type: "psíquico" },
  },

  // --- NIVEL 1 ---------------------------------------------------------------
  "curar-heridas": {
    id: "curar-heridas", name: "Curar Heridas", level: 1, school: "Abjuración",
    classes: ["bardo", "clerigo", "druida", "explorador", "paladin"],
    time: "1 acción", range: "Toque", components: "V, S", duration: "Instantáneo",
    desc: "Tocas a una criatura y sus heridas se cierran. Cura más si gastas un hueco de nivel superior. No funciona sobre autómatas ni muertos vivientes.",
    heal: "2d8",
  },
  "palabra-de-curacion": {
    id: "palabra-de-curacion", name: "Palabra de Curación", level: 1, school: "Abjuración",
    classes: ["bardo", "clerigo", "druida"],
    time: "1 acción adicional", range: "18 m", components: "V", duration: "Instantáneo",
    desc: "Una palabra a distancia que cura menos que un toque, pero se lanza como acción adicional: sirve para levantar a alguien que ha caído sin acercarte.",
    heal: "2d4",
  },
  "proyectil-magico": {
    id: "proyectil-magico", name: "Proyectil Mágico", level: 1, school: "Evocación",
    classes: ["hechicero", "mago"],
    time: "1 acción", range: "36 m", components: "V, S", duration: "Instantáneo",
    desc: "Tres dardos de fuerza que **siempre aciertan**: no hay tirada de ataque ni salvación. Cada dardo hace 1d4+1 y puedes repartirlos entre varios objetivos.",
    damage: { dice: "3d4+3", type: "fuerza" },
  },
  "manos-ardientes": {
    id: "manos-ardientes", name: "Manos Ardientes", level: 1, school: "Evocación",
    classes: ["hechicero", "mago"],
    time: "1 acción", range: "Cono de 4,5 m", components: "V, S", duration: "Instantáneo",
    desc: "Un abanico de llamas brota de tus dedos y prende lo inflamable que no lleve nadie encima. Media dosis de daño si la víctima se aparta a tiempo.",
    save: "des", damage: { dice: "3d6", type: "fuego" },
  },
  "escudo": {
    id: "escudo", name: "Escudo", level: 1, school: "Abjuración",
    classes: ["hechicero", "mago"],
    time: "1 reacción", range: "Personal", components: "V, S", duration: "1 asalto",
    desc: "Reaccionas a un ataque levantando una barrera invisible: +5 a la CA hasta tu siguiente turno, y anula por completo un Proyectil Mágico.",
  },
  "bendicion": {
    id: "bendicion", name: "Bendición", level: 1, school: "Encantamiento",
    classes: ["clerigo", "paladin"],
    time: "1 acción", range: "9 m", components: "V, S, M (una pizca de agua bendita)", duration: "Concentración, hasta 1 minuto",
    desc: "Hasta tres aliados suman 1d4 a sus tiradas de ataque y a sus salvaciones mientras dure. Poco vistoso, decisivo en una pelea larga.",
    concentration: true,
  },
  "perdicion": {
    id: "perdicion", name: "Perdición", level: 1, school: "Encantamiento",
    classes: ["clerigo"],
    time: "1 acción", range: "9 m", components: "V, S, M (una gota de sangre)", duration: "Concentración, hasta 1 minuto",
    desc: "El reverso de Bendición: hasta tres enemigos restan 1d4 a sus ataques y salvaciones mientras aguantes la concentración.",
    save: "car", concentration: true,
  },
  "hechizar-persona": {
    id: "hechizar-persona", name: "Hechizar Persona", level: 1, school: "Encantamiento",
    classes: ["bardo", "brujo", "druida", "hechicero", "mago"],
    time: "1 acción", range: "9 m", components: "V, S", duration: "1 hora",
    desc: "Una persona te ve como un amigo de confianza. No puede atacarte y te trata con simpatía, pero al terminar sabe que la embaucaste. Tira con ventaja si estabas peleando con ella.",
    save: "sab",
  },
  "detectar-magia": {
    id: "detectar-magia", name: "Detectar Magia", level: 1, school: "Adivinación",
    classes: ["bardo", "clerigo", "druida", "explorador", "hechicero", "mago", "paladin"],
    time: "1 acción", range: "Personal (radio de 9 m)", components: "V, S", duration: "Concentración, hasta 10 minutos",
    desc: "Percibes la presencia de magia a tu alrededor y, mirando de cerca, la escuela a la que pertenece. Como ritual no gasta hueco, solo tiempo.",
    concentration: true, ritual: true,
  },
  "marca-del-cazador": {
    id: "marca-del-cazador", name: "Marca del Cazador", level: 1, school: "Adivinación",
    classes: ["explorador"],
    time: "1 acción adicional", range: "27 m", components: "V", duration: "Concentración, hasta 1 hora",
    desc: "Señalas a una presa: cada vez que la golpeas con un arma le haces 1d6 de daño extra, y la rastreas con ventaja. Si cae, marcas a otra sin gastar otro hueco.",
    concentration: true, damage: { dice: "1d6", type: "fuerza" },
  },
  "favor-divino": {
    id: "favor-divino", name: "Favor Divino", level: 1, school: "Transmutación",
    classes: ["paladin"],
    time: "1 acción adicional", range: "Personal", components: "V, S", duration: "1 minuto",
    desc: "Tu arma se envuelve en luz sagrada y añade 1d4 de daño radiante a cada golpe mientras dura.",
    damage: { dice: "1d4", type: "radiante" },
  },

  // --- NIVEL 2 ---------------------------------------------------------------
  "rayo-abrasador": {
    id: "rayo-abrasador", name: "Rayo Abrasador", level: 2, school: "Evocación",
    classes: ["hechicero", "mago"],
    time: "1 acción", range: "36 m", components: "V, S", duration: "Instantáneo",
    desc: "Lanzas tres rayos de fuego, cada uno con su propia tirada de ataque; puedes repartirlos o concentrarlos en un solo blanco. Cada rayo hace 2d6.",
    attack: true, damage: { dice: "2d6", type: "fuego" },
  },
  "invisibilidad": {
    id: "invisibilidad", name: "Invisibilidad", level: 2, school: "Ilusión",
    classes: ["bardo", "brujo", "hechicero", "mago"],
    time: "1 acción", range: "Toque", components: "V, S, M (una pestaña envuelta en goma arábiga)", duration: "Concentración, hasta 1 hora",
    desc: "La criatura tocada desaparece de la vista, con todo lo que lleve encima. El efecto se rompe en cuanto ataca o lanza un conjuro.",
    concentration: true,
  },
  "telarana": {
    id: "telarana", name: "Telaraña", level: 2, school: "Conjuración",
    classes: ["hechicero", "mago"],
    time: "1 acción", range: "18 m", components: "V, S, M (un poco de tela de araña)", duration: "Concentración, hasta 1 hora",
    desc: "Llenas un cubo de 6 m de telarañas espesas. Quien entre queda restringido si no se aparta, y puede zafarse con una prueba de Fuerza. Arden con facilidad.",
    save: "des", concentration: true,
  },
  "restablecimiento-menor": {
    id: "restablecimiento-menor", name: "Restablecimiento Menor", level: 2, school: "Abjuración",
    classes: ["bardo", "clerigo", "druida", "explorador", "paladin"],
    time: "1 acción", range: "Toque", components: "V, S", duration: "Instantáneo",
    desc: "Limpias del cuerpo de un aliado una enfermedad o una condición: cegado, ensordecido, paralizado o envenenado. Uno cada vez.",
  },

  // --- NIVEL 3 ---------------------------------------------------------------
  "bola-de-fuego": {
    id: "bola-de-fuego", name: "Bola de Fuego", level: 3, school: "Evocación",
    classes: ["hechicero", "mago"],
    time: "1 acción", range: "45 m", components: "V, S, M (una bolita de guano y azufre)", duration: "Instantáneo",
    desc: "Una chispa vuela hasta el punto elegido y estalla en una esfera de fuego de 6 m de radio. Media dosis de daño a quien logre tirarse al suelo a tiempo; prende lo que no lleve nadie encima.",
    save: "des", damage: { dice: "8d6", type: "fuego" },
  },
  "relampago": {
    id: "relampago", name: "Relámpago", level: 3, school: "Evocación",
    classes: ["hechicero", "mago"],
    time: "1 acción", range: "Línea de 30 m", components: "V, S, M (un poco de piel y una varilla de ámbar)", duration: "Instantáneo",
    desc: "Un rayo recorre una línea recta y atraviesa a todo el que pille por el camino. Media dosis de daño si consiguen apartarse.",
    save: "des", damage: { dice: "8d6", type: "relámpago" },
  },
  "contrahechizo": {
    id: "contrahechizo", name: "Contrahechizo", level: 3, school: "Abjuración",
    classes: ["brujo", "hechicero", "mago"],
    time: "1 reacción", range: "18 m", components: "S", duration: "Instantáneo",
    desc: "Interrumpes a alguien que está lanzando un conjuro. El lanzador tira una salvación de su característica mágica: si falla, el conjuro se pierde junto con su hueco.",
  },
  "disipar-magia": {
    id: "disipar-magia", name: "Disipar Magia", level: 3, school: "Abjuración",
    classes: ["bardo", "brujo", "clerigo", "druida", "hechicero", "mago", "paladin"],
    time: "1 acción", range: "36 m", components: "V, S", duration: "Instantáneo",
    desc: "Apagas un efecto mágico en curso. Los de nivel 3 o menos se van sin más; contra los más poderosos hay que superar una prueba con tu característica mágica.",
  },
  "volar": {
    id: "volar", name: "Volar", level: 3, school: "Transmutación",
    classes: ["brujo", "hechicero", "mago"],
    time: "1 acción", range: "Toque", components: "V, S, M (una pluma de ala)", duration: "Concentración, hasta 10 minutos",
    desc: "La criatura tocada gana velocidad de vuelo de 18 m. Cuidado con que termine estando en el aire: la caída es parte del trato.",
    concentration: true,
  },
  "revivir": {
    id: "revivir", name: "Revivir", level: 3, school: "Nigromancia",
    classes: ["clerigo", "paladin"],
    time: "1 acción", range: "Toque", components: "V, S, M (diamantes por valor de 300 po, que se consumen)", duration: "Instantáneo",
    desc: "Devuelves a la vida a alguien que lleva muerto menos de un minuto, con 1 punto de golpe. No repone miembros perdidos ni funciona si murió de viejo.",
  },
};

/** Los conjuros que una clase puede preparar, por nivel y luego por nombre. */
export function spellsForClass(clsSlug: string): Spell[] {
  return Object.values(SPELLS)
    .filter((s) => s.classes.includes(clsSlug))
    .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name, "es"));
}

/** Un conjuro por su id, o null si no está en la semilla. */
export function spellById(id: string): Spell | null {
  return SPELLS[id] ?? null;
}
