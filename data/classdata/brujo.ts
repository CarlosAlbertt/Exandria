// Datos mecánicos del Brujo (PHB 2024, vía D&D Beyond). Hechos de juego:
// dados, competencias, progresión. Descripciones: resúmenes propios en español.
import type { ClassMechanics } from "./types";

export const BRUJO: ClassMechanics = {
  slug: "brujo",
  primaryAbility: ["car"],
  saves: ["sab", "car"],
  skillChoices: {
    pick: 2,
    from: ["Arcanos", "Engaño", "Historia", "Intimidación", "Investigación", "Naturaleza", "Religión"],
  },
  armor: ["ligera"],
  weapons: ["sencillas"],
  startingGold: 100,
  startingEquipment: ["Armadura de cuero", "Hoz", "2 dagas", "Foco arcano (orbe)", "Libro de leyendas ocultas", "Paquete de erudito", "15 PO"],
  caster: "pact",
  spellAbility: "car",
  features: [
    {
      level: 1,
      name: "Invocaciones Ocultas",
      blurb: "El brujo aprende invocaciones que le conceden dones mágicos permanentes, como conjuros a voluntad o mejoras a su magia de pacto.",
    },
    {
      level: 1,
      name: "Magia de Pacto",
      blurb: "El brujo lanza conjuros con un número reducido de espacios que siempre son del nivel más alto disponible y se recuperan en un descanso corto.",
    },
    {
      level: 2,
      name: "Astucia Mágica",
      blurb: "Como acción adicional en un descanso corto, el brujo recupera parte de sus espacios de conjuro gastados.",
    },
    {
      level: 3,
      name: "Subclase de Brujo",
      blurb: "Elige un patrón sobrenatural que define el origen de su pacto y le otorga rasgos exclusivos en niveles posteriores.",
      subclass: true,
    },
    {
      level: 4,
      name: "Mejora de Característica",
      blurb: "El personaje aumenta sus puntuaciones de característica o adquiere un talento.",
    },
    {
      level: 6,
      name: "Rasgo de subclase",
      blurb: "El patrón sobrenatural concede un nuevo poder que refuerza el vínculo del pacto.",
      subclass: true,
    },
    {
      level: 8,
      name: "Mejora de Característica",
      blurb: "Nueva ronda de mejora de característica o talento.",
    },
    {
      level: 9,
      name: "Contactar con el Patrón",
      blurb: "El brujo puede establecer contacto directo con su patrón para obtener respuestas o guía.",
    },
    {
      level: 10,
      name: "Rasgo de subclase",
      blurb: "El patrón sobrenatural otorga un nuevo poder que amplía las opciones del brujo.",
      subclass: true,
    },
    {
      level: 11,
      name: "Arcano Místico",
      blurb: "El brujo aprende un conjuro de nivel 6 que puede lanzar una vez por descanso largo sin gastar espacio de conjuro.",
    },
    {
      level: 12,
      name: "Mejora de Característica",
      blurb: "Nueva ronda de mejora de característica o talento.",
    },
    {
      level: 13,
      name: "Arcano Místico",
      blurb: "El brujo añade un conjuro de nivel 7 a su Arcano Místico, lanzable una vez por descanso largo.",
    },
    {
      level: 14,
      name: "Rasgo de subclase",
      blurb: "El patrón sobrenatural concede un poder culminante propio de brujos experimentados.",
      subclass: true,
    },
    {
      level: 15,
      name: "Arcano Místico",
      blurb: "El brujo añade un conjuro de nivel 8 a su Arcano Místico.",
    },
    {
      level: 16,
      name: "Mejora de Característica",
      blurb: "Nueva ronda de mejora de característica o talento.",
    },
    {
      level: 17,
      name: "Arcano Místico",
      blurb: "El brujo añade un conjuro de nivel 9 a su Arcano Místico, la cúspide de este rasgo.",
    },
    {
      level: 19,
      name: "Don Épico",
      blurb: "El brujo obtiene un don épico, una mejora extraordinaria reservada a personajes de nivel legendario.",
    },
    {
      level: 20,
      name: "Maestro Místico",
      blurb: "Una vez por descanso largo, el brujo puede recuperar todos sus espacios de Magia de Pacto gastados.",
    },
  ],
  resources: [
    { name: "Trucos", values: [2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4] },
    { name: "Conjuros preparados", values: [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15] },
    { name: "Invocaciones", values: [1, 3, 3, 3, 5, 5, 6, 6, 7, 7, 7, 8, 8, 8, 9, 9, 9, 10, 10, 10] },
  ],
};
