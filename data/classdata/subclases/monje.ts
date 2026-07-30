import type { SubclassFeature } from "../types";

// Rasgos de subclase del Monje (niveles 3/6/11/17; usa Puntos de Concentración).
// Clave = nombre en data/classes.ts.
export const MONJE_SUBCLASSES: Record<string, SubclassFeature[]> = {
  "Camino del Hilo del Destino": [
    { level: 3, name: "Hilos de Infortunio", text: "Puedes golpear la suerte misma de tus enemigos. Cuando usas tu rasgo Ráfaga de Golpes (Flurry of Blows), puedes imbuir tus ataques con el peso del destino. Si impactas a una criatura con uno de estos ataques, le aplicas un Hilo de Infortunio. La próxima vez que esa criatura realice una tirada de ataque antes del inicio de tu próximo turno, debe restar tu dado de Artes Marciales del total." },
    { level: 6, name: "Tejer la Probabilidad", text: "Como manipulador del destino, puedes evitar el desastre en el último milisegundo. Cuando un aliado a 30 pies (9 metros) de ti falla una Tirada de Salvación o una tirada de ataque, puedes usar tu Reacción y gastar 1 Punto de Concentración (Focus Point). Tiras tu dado de Artes Marciales y sumas el resultado a la tirada del aliado, pudiendo convertir el fallo en un éxito." },
    { level: 11, name: "Evasión Premonitoria", text: "Tus sentidos perciben el peligro antes de que ocurra. El rasgo de Monje Desviar Ataques (Deflect Attacks) de 5.5e (que ahora sirve también contra cuerpo a cuerpo) se vuelve predictivo. Cuando usas Desviar Ataques, puedes gastar 1 Punto de Concentración adicional para teletransportarte hasta 15 pies (4,5 metros) a un espacio desocupado inmediatamente después de recibir el daño reducido. Si el atacante te iba a golpear con múltiples ataques, tu reposicionamiento podría dejarte fuera de su alcance, desperdiciando el resto de su acción." },
    { level: 17, name: "Corte del Destino", text: "Has dominado la técnica para desvincular a un ser de la realidad temporal de Exandria. Cuando impactas a una criatura con un ataque desarmado, puedes gastar 3 Puntos de Concentración para intentar Cortar su Hilo. El objetivo debe hacer una Tirada de Salvación de Carisma (contra la CD de tu Concentración). Si falla, queda Desvinculado durante 1 minuto:\n• Pierde todas sus Resistencias al daño.\n• No puede recuperar Puntos de Golpe de ninguna manera.\n• Tiene Desventaja en todas las Tiradas de Salvación. Puede repetir la tirada de salvación al final de cada uno de sus turnos, terminando el efecto si tiene éxito." },
  ],
  "Camino del Alma de Cobalto": [
    { level: 3, name: "Extraer Aspecto", text: "Cuando golpeas a una criatura con tu Ráfaga de Golpes (Flurry of Blows), analizas su ki. Conoces automáticamente sus Inmunidades, Resistencias y Vulnerabilidades, y sabes si tiene menos de la mitad de su vida. Además, puedes seguir su rastro sin fallar durante 24 horas." },
    { level: 6, name: "Extorsionar Verdad", text: "Si golpeas a un enemigo con un ataque desarmado, puedes gastar 1 Punto de Concentración. El objetivo no puede decir mentiras deliberadas durante 1 minuto, y todos tus ataques contra él tienen Ventaja si intenta ocultar información." },
    { level: 11, name: "Mente de Mercurio", text: "Una vez por turno, si has gastado tu Reacción, puedes gastar 1 Punto de Concentración para tomar una Reacción adicional." },
    { level: 17, name: "Ráfaga Debilitadora", text: "Al impactar repetidamente, golpeas sus nervios. Tras golpear a un enemigo tres veces en un mismo turno, sufre Vulnerabilidad a un tipo de daño de tu elección hasta el final de tu próximo turno." },
  ],
  "Camino de las Cadenas Rotas": [
    { level: 3, name: "Cadenas Espectrales", text: "El alcance de tus ataques desarmados aumenta en 10 pies. Si golpeas a un objetivo a distancia con tu ataque desarmado, puedes arrastrarlo 10 pies hacia ti de forma gratuita." },
    { level: 6, name: "Barrido Infernal", text: "Como Acción Mágica (gastando 1 Punto de Concentración), haces girar tus cadenas. Los enemigos a 15 pies deben hacer Salvación de Destreza o recibir dos tiradas de tu dado de Artes Marciales y caer Derrumbados." },
    { level: 11, name: "Presa a Distancia", text: "Puedes iniciar la condición de Agarrado (Grappled) desde 15 pies de distancia usando tus cadenas. El objetivo atrapado sufre la condición de Silenciado." },
    { level: 17, name: "Condena del Abismo", text: "Gastas 3 Puntos de Concentración. Las cadenas envuelven al enemigo (Salvación de Fuerza). Si falla, queda Restringido (Restrained). Al inicio de cada turno del enemigo, las cadenas lo aplastan causándole 4d10 daño de Fuerza." },
  ],
  "Camino de los Vientos Cenicientos": [
    { level: 3, name: "Puños de Brasa", text: "Puedes elegir que tus ataques desarmados inflijan daño de Fuego o de Trueno. Además, si usas Paso del Viento (Step of the Wind), el lugar del que saltas estalla en un torbellino de ceniza, cegando a los enemigos a 5 pies de tu posición inicial hasta su próximo turno." },
    { level: 6, name: "Corriente de Humo", text: "Como Reacción cuando recibes daño de un ataque a distancia, gastas 1 Punto de Concentración para disolverte en humo. Te teletransportas 30 pies y evitas el daño por completo." },
    { level: 11, name: "Cabalgar el Vendaval", text: "Obtienes velocidad de Vuelo igual a tu velocidad de movimiento, siempre que termines tu turno en una superficie sólida (si no, caes)." },
    { level: 17, name: "Impacto de Tornado", text: "Como Acción, gastas 3 Puntos de Concentración para golpear el aire. Un cono de 60 pies arrasa la zona; los enemigos reciben 6d10 de daño de Trueno y son arrojados 30 pies hacia atrás." },
  ],
  "Camino de la Mente Vacía": [
    { level: 3, name: "Muralla de Pensamiento", text: "Obtienes Resistencia al daño Psíquico. Cuando superas una Salvación de Inteligencia, Sabiduría o Carisma, el lanzador del hechizo recibe daño Psíquico igual a una tirada de tu dado de Artes Marciales." },
    { level: 6, name: "Reflejo en Blanco", text: "Eres Inmune a que la magia lea tus pensamientos o emociones." },
    { level: 11, name: "Ojos del Vacío", text: "Eres Inmune a las condiciones Asustado y Hechizado. Como Acción Adicional (1 Punto de Concentración), tu mirada proyecta el vacío; un enemigo a 30 pies debe salvar Sabiduría o quedar Aturdido (Stunned) hasta tu próximo turno." },
    { level: 17, name: "Borrado Sináptico", text: "Cuando golpeas a un enemigo, gastas 3 Puntos de Concentración para golpear su lóbulo frontal. Si el enemigo falla una salvación de Inteligencia, olvida cómo usar magia, sus armas o quiénes son sus aliados durante 1 minuto (queda efectivamente Incapacitado de terror confuso)." },
  ],
};
