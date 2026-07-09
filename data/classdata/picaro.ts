// Datos mecánicos del Pícaro (PHB 2024, vía D&D Beyond). Hechos de juego:
// dados, competencias, progresión. Descripciones: resúmenes propios en español.
import type { ClassMechanics } from "./types";

export const PICARO: ClassMechanics = {
  slug: "picaro",
  primaryAbility: ["des"],
  saves: ["des", "int"],
  skillChoices: {
    pick: 4,
    from: ["Acrobacias", "Atletismo", "Engaño", "Interpretación", "Intimidación", "Investigación", "Juego de Manos", "Percepción", "Perspicacia", "Persuasión", "Sigilo"],
  },
  armor: ["ligera"],
  weapons: ["sencillas", "marciales con la propiedad Sutil o Ligera"],
  startingGold: 100,
  startingEquipment: ["Armadura de cuero", "2 dagas", "Espada corta", "Arco corto", "20 flechas", "Carcaj", "Herramientas de ladrón", "Paquete de saqueador", "8 PO"],
  caster: "none",
  features: [
    {
      level: 1,
      name: "Pericia",
      blurb: "El pícaro duplica su bono de competencia en dos pericias o en Herramientas de Ladrón, en las que ya sea competente.",
    },
    {
      level: 1,
      name: "Ataque Furtivo",
      blurb: "Una vez por turno, el pícaro inflige daño extra a un objetivo que tenga desventaja en su defensa o al que ataque con ventaja.",
    },
    {
      level: 1,
      name: "Argot de Ladrones",
      blurb: "El pícaro conoce una jerga secreta que le permite ocultar mensajes en conversaciones normales.",
    },
    {
      level: 1,
      name: "Maestría con Armas",
      blurb: "Aplica la propiedad especial de maestría de un arma sencilla o marcial de tipo sutil o ligero mientras la empuña.",
    },
    {
      level: 2,
      name: "Acción Astuta",
      blurb: "Como acción adicional, el pícaro puede correr, desengancharse o esconderse sin gastar su acción.",
    },
    {
      level: 3,
      name: "Subclase de Pícaro",
      blurb: "Elige un arquetipo que define su especialidad delictiva o de infiltración y le otorga rasgos exclusivos en niveles posteriores.",
      subclass: true,
    },
    {
      level: 3,
      name: "Puntería Firme",
      blurb: "Si el pícaro no se mueve en su turno, puede ganar ventaja en un ataque a distancia a cambio de exponer su posición.",
    },
    {
      level: 4,
      name: "Mejora de Característica",
      blurb: "El personaje aumenta sus puntuaciones de característica o adquiere un talento.",
    },
    {
      level: 5,
      name: "Golpe Astuto",
      blurb: "Al impactar con Ataque Furtivo, el pícaro puede sacrificar parte de ese daño para lograr un efecto especial, como derribar o desarmar.",
    },
    {
      level: 5,
      name: "Esquiva Prodigiosa",
      blurb: "El pícaro puede usar su reacción para reducir a la mitad el daño de un ataque que lo impacte.",
    },
    {
      level: 6,
      name: "Pericia",
      blurb: "El pícaro elige dos pericias adicionales para duplicar su bono de competencia en ellas.",
    },
    {
      level: 7,
      name: "Evasión",
      blurb: "Ante efectos que exigen una salvación de Destreza para sufrir la mitad del daño, el pícaro no recibe daño si tiene éxito y solo la mitad si falla.",
    },
    {
      level: 7,
      name: "Talento Fiable",
      blurb: "En pruebas de característica que usan una pericia o herramienta en la que el pícaro es competente, un resultado bajo del dado se trata como un 10.",
    },
    {
      level: 8,
      name: "Mejora de Característica",
      blurb: "Nueva ronda de mejora de característica o talento.",
    },
    {
      level: 9,
      name: "Rasgo de subclase",
      blurb: "El arquetipo del pícaro concede un nuevo poder que amplía su especialidad.",
      subclass: true,
    },
    {
      level: 10,
      name: "Mejora de Característica",
      blurb: "Nueva ronda de mejora de característica o talento.",
    },
    {
      level: 11,
      name: "Golpe Astuto Mejorado",
      blurb: "Golpe Astuto gana nuevas opciones de efecto especial, ampliando el control que el pícaro ejerce sobre sus víctimas.",
    },
    {
      level: 12,
      name: "Mejora de Característica",
      blurb: "Nueva ronda de mejora de característica o talento.",
    },
    {
      level: 13,
      name: "Rasgo de subclase",
      blurb: "El arquetipo del pícaro otorga un nuevo poder que refuerza su especialidad.",
      subclass: true,
    },
    {
      level: 14,
      name: "Golpes Insidiosos",
      blurb: "El pícaro puede gastar dados de Ataque Furtivo para imponer un efecto negativo adicional en el objetivo, además del daño.",
    },
    {
      level: 15,
      name: "Mente Escurridiza",
      blurb: "El pícaro gana competencia en las salvaciones de Sabiduría y Carisma.",
    },
    {
      level: 16,
      name: "Mejora de Característica",
      blurb: "Nueva ronda de mejora de característica o talento.",
    },
    {
      level: 17,
      name: "Rasgo de subclase",
      blurb: "El arquetipo del pícaro concede un poder avanzado propio de pícaros consumados.",
      subclass: true,
    },
    {
      level: 18,
      name: "Elusivo",
      blurb: "Ningún ataque puede tener ventaja contra el pícaro mientras no esté incapacitado.",
    },
    {
      level: 19,
      name: "Don Épico",
      blurb: "El pícaro obtiene un don épico, una mejora extraordinaria reservada a personajes de nivel legendario.",
    },
    {
      level: 20,
      name: "Golpe de Suerte",
      blurb: "El pícaro puede convertir un fallo en un ataque, prueba o salvación en un éxito, una vez por descanso corto o largo.",
    },
  ],
  resources: [
    { name: "Dado de ataque furtivo", values: ["1d6", "1d6", "2d6", "2d6", "3d6", "3d6", "4d6", "4d6", "5d6", "5d6", "6d6", "6d6", "7d6", "7d6", "8d6", "8d6", "9d6", "9d6", "10d6", "10d6"] },
  ],
};
