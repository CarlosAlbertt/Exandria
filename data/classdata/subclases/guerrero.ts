import type { SubclassFeature } from "../types";

// Rasgos de subclase del Guerrero (niveles 3/7/10/15/18). Clave = nombre en data/classes.ts.
export const GUERRERO_SUBCLASSES: Record<string, SubclassFeature[]> = {
  "Guerrero Elementalista": [
    { level: 3, name: "Hoja Primigenia", text: "Aprendes dos Trucos (Cantrips) de la lista de Druida. Además, puedes imbuir tu arma: cambias todo tu daño al tipo Fuego, Frío o Relámpago (eliges al atacar). Cuando usas tu rasgo de Maestría de Armas, el objetivo recibe 1d4 extra de ese daño elemental." },
    { level: 7, name: "Escudo de Tormentas", text: "Cuando usas tu Nuevas Energías (Second Wind), obtienes Resistencia al Fuego, Frío y Relámpago durante 1 minuto." },
    { level: 10, name: "Detonación de Acción", text: "Cuando usas tu Acción Súbita (Action Surge), un estallido elemental brota de ti. Los enemigos a 10 pies reciben 2d8 de daño elemental y son empujados 10 pies." },
    { level: 15, name: "Acero Penetrante", text: "Tus ataques elementales ignoran las Resistencias al daño." },
    { level: 18, name: "Furia Bimental", text: "Cuando golpeas con un ataque, infliges 1d8 extra de dos elementos diferentes (por ejemplo: 1d8 Fuego y 1d8 Frío)." },
  ],
  "Hoplita de la Puerta Divina": [
    { level: 3, name: "Disciplina del Custodio", text: "Obtienes competencia en la habilidad Religión o Arcanos (tu elección). Además, aprendes a usar tu escudo como un arma ofensiva castigadora. Tus ataques con escudo se consideran ataques con armas cuerpo a cuerpo que infligen 1d4 de daño contundente y tienen la propiedad de Maestría de Armas (Weapon Mastery): Empujar (Push) o Atontar (Sap), a tu elección cada vez que atacas." },
    { level: 3, name: "Baluarte Anti-Magia", text: "Has aprendido a usar tu determinación para sacudirte la magia enemiga. Cuando usas tu rasgo de Nuevas Energías (Second Wind), obtienes Ventaja en todas las Tiradas de Salvación contra hechizos y efectos mágicos hasta el final de tu próximo turno. Si estabas bajo el efecto de un hechizo que te permitía hacer una salvación al final de tu turno, puedes hacer esa tirada inmediatamente como parte de la misma Acción Adicional." },
    { level: 7, name: "Égida de Vasselheim", text: "Puedes extender tu protección a tus aliados. Cuando una criatura que puedas ver a 30 pies (9 metros) de ti reciba daño de un hechizo, puedes usar tu Reacción para otorgarle Resistencia a ese daño. Si usas un escudo, puedes moverte hasta la mitad de tu velocidad hacia esa criatura como parte de la misma reacción." },
    { level: 10, name: "Ancla Inquisidora", text: "Tus golpes alteran el flujo arcano en el cuerpo del enemigo. Cuando golpeas a una criatura con un ataque de arma, puedes gastar un uso de tu Nuevas Energías (sin recuperar Puntos de Golpe) para imponerle un Ancla Arcana. Hasta el final de tu próximo turno, esa criatura no puede teletransportarse (como con Paso Brumoso) ni beneficiarse de invisibilidad mágica. Además, el objetivo tiene Desventaja en sus tiradas para mantener la Concentración." },
    { level: 15, name: "Voluntad Inquebrantable", text: "Tu mente es una fortaleza divina. Eres inmune a las condiciones Hechizado y Asustado. Además, cuando usas tu rasgo Indomable (Indomitable) para repetir una Tirada de Salvación contra un hechizo y tienes éxito, puedes reflejar la energía: el lanzador del hechizo recibe daño de Fuerza igual a tu nivel de Guerrero." },
    { level: 18, name: "Avatar de la Puerta", text: "Como Acción Adicional, canalizas el poder de la Puerta Divina, irradiando un aura de luz dorada de 15 pies (4,5 metros) durante 1 minuto.\n• Tú y los aliados dentro del aura tenéis Ventaja en Tiradas de Salvación contra magia.\n• Los enemigos que intenten lanzar un hechizo dentro del aura deben superar primero una Tirada de Salvación de Constitución (CD 8 + tu bonificador de Competencia + tu modificador de Fuerza o Destreza); si fallan, el hechizo falla y la acción se desperdicia. Recuperas el uso de esta habilidad al finalizar un Descanso Largo." },
  ],
  "Caballero de Grifos": [
    { level: 3, name: "Salto del Cazador", text: "Tu distancia y altura de salto se triplican. Además, si saltas o caes al menos 10 pies antes de impactar un ataque cuerpo a cuerpo, infliges 1d8 de daño extra y puedes empujar al objetivo 10 pies." },
    { level: 7, name: "Caída Controlada", text: "Ignoras los primeros 50 pies de daño por caída. Obtienes competencia en Acrobacias." },
    { level: 10, name: "Ataque en Picado", text: "Si usas la propiedad de Maestría de Armas de Derribar (Topple) tras caer sobre un enemigo, este tiene Desventaja en la salvación." },
    { level: 15, name: "Alas Espectrales", text: "Como Acción Adicional, te brotan alas de luz, dándote velocidad de Vuelo igual a tu velocidad durante 10 minutos. (Usos = modificador de Destreza o Fuerza por Descanso Largo)." },
    { level: 18, name: "Impacto de Meteoro", text: "Si caes al menos 30 pies y golpeas el suelo, emites una onda de choque. Todos los enemigos a 15 pies reciben 4d10 de daño de Fuerza y caen Derrumbados." },
  ],
  "Guardia de los Ecos": [
    { level: 3, name: "Manifestar Eco", text: "Como Acción Adicional, invocas un eco translúcido a 15 pies. Tiene CA 14 + tu bono de competencia, Inmunidad a todo estado, y 1 PG. En tu turno, puedes originar tus ataques desde tu posición o la del eco." },
    { level: 3, name: "Cambio de Lugar", text: "A costa de 15 pies de tu movimiento, puedes teletransportarte intercambiando posiciones con tu eco." },
    { level: 7, name: "Avatar del Eco", text: "Puedes transferir tu consciencia al eco hasta a 1.000 pies de distancia para explorar." },
    { level: 10, name: "Mártir Sombrío", text: "Como Reacción, si un aliado a 30 pies de ti va a recibir un ataque, puedes teletransportar al eco frente al aliado; el eco recibe el ataque." },
    { level: 15, name: "Reclamar Potencial", text: "Cuando tu eco es destruido, recuperas Puntos de Golpe Temporales iguales a 2d6 + tu modificador de Constitución. (Usos limitados)." },
    { level: 18, name: "Legión de Uno", text: "Puedes tener dos ecos activos al mismo tiempo, y recuperas un uso de Acción Súbita al tirar iniciativa si no te quedaban." },
  ],
  "Rompeasedios": [
    { level: 3, name: "Ariete Humano", text: "Tus ataques infligen el doble de daño a objetos y estructuras. Cuando usas la Maestría de Armas de Empujar (Push), empujas al objetivo 15 pies en lugar de 10." },
    { level: 7, name: "Postura Inamovible", text: "Eres Inmune a ser Derrumbado (Prone) mientras estés consciente." },
    { level: 10, name: "Ruptura de Falange", text: "Cuando usas tu Acción Súbita, destruyes los escudos de quienes golpeas (restando -2 a su CA) o les rompes la guardia, dándote Ventaja en todos tus ataques contra ellos ese turno." },
    { level: 15, name: "Acero Temprano", text: "Ignoras el daño Contundente, Cortante y Perforante inferior a 10 puntos en cada golpe que recibas." },
    { level: 18, name: "Juggernaut", text: "Si te mueves 20 pies en línea recta, puedes pasar a través de las casillas de enemigos. Estos deben hacer Salvaciones de Fuerza o recibir 3d10 daño Contundente y quedar aplastados (Derrumbados)." },
  ],
};
