// Datos mecánicos del Guerrero (PHB 2024, vía D&D Beyond). Hechos de juego:
// dados, competencias, progresión. Descripciones: resúmenes propios en español.
import type { ClassMechanics } from "./types";

export const GUERRERO: ClassMechanics = {
  slug: "guerrero",
  primaryAbility: ["fue", "des"],
  saves: ["fue", "con"],
  skillChoices: {
    pick: 2,
    from: ["Acrobacias", "Atletismo", "Historia", "Intimidación", "Percepción", "Perspicacia", "Persuasión", "Supervivencia"],
  },
  armor: ["ligera", "media", "pesada", "escudos"],
  weapons: ["sencillas", "marciales"],
  startingGold: 155,
  startingEquipment: ["Cota de mallas", "Mandoble", "Mangual", "8 jabalinas", "Paquete de mazmorrero", "4 PO"],
  caster: "none",
  features: [
    {
      level: 1,
      name: "Estilo de Combate",
      blurb: "El guerrero elige un estilo de combate que le otorga un beneficio pasivo permanente en batalla.",
    },
    {
      level: 1,
      name: "Segundo Aliento",
      blurb: "Como acción adicional, el guerrero recupera puntos de golpe una cantidad limitada de veces por descanso.",
    },
    {
      level: 1,
      name: "Maestría con Armas",
      blurb: "Aplica la propiedad especial de maestría de varias armas sencillas o marciales mientras las empuña.",
    },
    {
      level: 2,
      name: "Acción Sorpresiva",
      blurb: "El guerrero puede realizar una acción adicional en su turno, un número limitado de veces por descanso largo.",
    },
    {
      level: 2,
      name: "Mente Táctica",
      blurb: "El guerrero puede usar su bono de competencia para mejorar una prueba de característica fallida, gastando un uso de Segundo Aliento.",
    },
    {
      level: 3,
      name: "Subclase de Guerrero",
      blurb: "Elige un arquetipo marcial que define su estilo de combate y le otorga rasgos exclusivos en niveles posteriores.",
      subclass: true,
    },
    {
      level: 4,
      name: "Mejora de Característica",
      blurb: "El personaje aumenta sus puntuaciones de característica o adquiere un talento.",
    },
    {
      level: 5,
      name: "Ataque Extra",
      blurb: "Al usar la acción de Atacar, el guerrero golpea dos veces en vez de una.",
    },
    {
      level: 5,
      name: "Cambio Táctico",
      blurb: "Al gastar un uso de Segundo Aliento, el guerrero puede además moverse hasta la mitad de su velocidad sin provocar ataques de oportunidad.",
    },
    {
      level: 6,
      name: "Mejora de Característica",
      blurb: "Nueva ronda de mejora de característica o talento.",
    },
    {
      level: 7,
      name: "Rasgo de subclase",
      blurb: "El arquetipo marcial concede un nuevo poder que amplía las opciones tácticas del guerrero.",
      subclass: true,
    },
    {
      level: 8,
      name: "Mejora de Característica",
      blurb: "Nueva ronda de mejora de característica o talento.",
    },
    {
      level: 9,
      name: "Maestro Táctico",
      blurb: "Al impactar con un ataque, el guerrero puede aplicar un efecto de maestría de arma distinto al propio de esa arma.",
    },
    {
      level: 9,
      name: "Indomable",
      blurb: "El guerrero puede repetir una salvación fallida, un número limitado de veces por descanso largo.",
    },
    {
      level: 10,
      name: "Rasgo de subclase",
      blurb: "El arquetipo marcial otorga un nuevo poder que refuerza su especialidad en combate.",
      subclass: true,
    },
    {
      level: 11,
      name: "Dos Ataques Extra",
      blurb: "Al usar la acción de Atacar, el guerrero golpea tres veces en vez de dos.",
    },
    {
      level: 12,
      name: "Mejora de Característica",
      blurb: "Nueva ronda de mejora de característica o talento.",
    },
    {
      level: 13,
      name: "Ataques Estudiados",
      blurb: "Si el guerrero falla un ataque, gana ventaja en el siguiente ataque que realice contra el mismo objetivo antes de que termine su próximo turno.",
    },
    {
      level: 14,
      name: "Mejora de Característica",
      blurb: "Nueva ronda de mejora de característica o talento.",
    },
    {
      level: 15,
      name: "Rasgo de subclase",
      blurb: "El arquetipo marcial concede un poder avanzado propio de guerreros veteranos.",
      subclass: true,
    },
    {
      level: 16,
      name: "Mejora de Característica",
      blurb: "Nueva ronda de mejora de característica o talento.",
    },
    {
      level: 17,
      name: "Reservas de Combate Ampliadas",
      blurb: "El guerrero gana un uso adicional de Acción Sorpresiva y de Indomable, pudiendo recurrir a ellos con más frecuencia.",
    },
    {
      level: 18,
      name: "Rasgo de subclase",
      blurb: "El arquetipo marcial otorga un rasgo culminante propio de guerreros legendarios.",
      subclass: true,
    },
    {
      level: 19,
      name: "Don Épico",
      blurb: "El guerrero obtiene un don épico, una mejora extraordinaria reservada a personajes de nivel legendario.",
    },
    {
      level: 20,
      name: "Tres Ataques Extra",
      blurb: "Al usar la acción de Atacar, el guerrero golpea cuatro veces en vez de tres, la cúspide de su maestría marcial.",
    },
  ],
  resources: [
    { name: "Usos de Segundo Aliento", values: [2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4] },
    { name: "Maestría con Armas", values: [3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6] },
    { name: "Usos de Acción Sorpresiva", values: [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2] },
    { name: "Usos de Indomable", values: [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3] },
    { name: "Ataques por acción de Atacar", values: [1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 4] },
  ],
};
