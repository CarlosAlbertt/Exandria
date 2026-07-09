// Datos mecánicos del Mago (PHB 2024, vía D&D Beyond). Hechos de juego:
// dados, competencias, progresión. Descripciones: resúmenes propios en español.
import type { ClassMechanics } from "./types";

export const MAGO: ClassMechanics = {
  slug: "mago",
  primaryAbility: ["int"],
  saves: ["int", "sab"],
  skillChoices: {
    pick: 2,
    from: ["Arcanos", "Historia", "Investigación", "Medicina", "Naturaleza", "Perspicacia", "Religión"],
  },
  armor: [],
  weapons: ["sencillas"],
  startingGold: 55,
  startingEquipment: ["2 dagas", "Foco arcano (bastón)", "Túnica", "Libro de conjuros", "Paquete de erudito", "5 PO"],
  caster: "full",
  spellAbility: "int",
  features: [
    {
      level: 1,
      name: "Lanzamiento de Conjuros",
      blurb: "El mago prepara conjuros de su libro usando Inteligencia y los lanza gastando espacios de conjuro.",
    },
    {
      level: 1,
      name: "Adepto de Rituales",
      blurb: "El mago puede lanzar como ritual cualquier conjuro con la etiqueta de ritual que tenga anotado en su libro, sin necesidad de tenerlo preparado.",
    },
    {
      level: 1,
      name: "Recuperación Arcana",
      blurb: "Una vez al día, en un descanso corto, el mago recupera algunos espacios de conjuro gastados.",
    },
    {
      level: 2,
      name: "Erudito",
      blurb: "El mago gana un beneficio adicional al usar una pericia concreta relacionada con su estudio arcano.",
    },
    {
      level: 3,
      name: "Subclase de Mago",
      blurb: "Elige una tradición arcana que define su especialidad de estudio y le otorga rasgos exclusivos en niveles posteriores.",
      subclass: true,
    },
    {
      level: 4,
      name: "Mejora de Característica",
      blurb: "El personaje aumenta sus puntuaciones de característica o adquiere un talento.",
    },
    {
      level: 5,
      name: "Memorizar Conjuro",
      blurb: "Tras un descanso corto, el mago puede cambiar un conjuro preparado por otro de su libro de conjuros.",
    },
    {
      level: 6,
      name: "Rasgo de subclase",
      blurb: "La tradición arcana concede un nuevo poder que profundiza su especialidad de estudio.",
      subclass: true,
    },
    {
      level: 8,
      name: "Mejora de Característica",
      blurb: "Nueva ronda de mejora de característica o talento.",
    },
    {
      level: 10,
      name: "Rasgo de subclase",
      blurb: "La tradición arcana otorga un nuevo poder que amplía las aplicaciones de su magia.",
      subclass: true,
    },
    {
      level: 12,
      name: "Mejora de Característica",
      blurb: "Nueva ronda de mejora de característica o talento.",
    },
    {
      level: 14,
      name: "Rasgo de subclase",
      blurb: "La tradición arcana concede un poder avanzado propio de magos de gran erudición.",
      subclass: true,
    },
    {
      level: 16,
      name: "Mejora de Característica",
      blurb: "Nueva ronda de mejora de característica o talento.",
    },
    {
      level: 18,
      name: "Maestría de Conjuros",
      blurb: "El mago elige un conjuro de nivel 1 y otro de nivel 2 que puede lanzar gratis, sin gastar espacio de conjuro.",
    },
    {
      level: 19,
      name: "Don Épico",
      blurb: "El mago obtiene un don épico, una mejora extraordinaria reservada a personajes de nivel legendario.",
    },
    {
      level: 20,
      name: "Conjuros Insignia",
      blurb: "El mago elige dos conjuros de nivel 3 que siempre tiene preparados y puede lanzar dos veces por descanso largo sin gastar espacio.",
    },
  ],
  resources: [
    { name: "Trucos", values: [3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5] },
    { name: "Conjuros preparados", values: [4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 18, 19, 21, 22, 23, 24, 25] },
  ],
};
