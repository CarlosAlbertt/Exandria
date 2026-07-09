// Datos mecánicos del Bardo (PHB 2024, vía D&D Beyond). Hechos de juego:
// dados, competencias, progresión. Descripciones: resúmenes propios en español.
import type { ClassMechanics } from "./types";

export const BARDO: ClassMechanics = {
  slug: "bardo",
  primaryAbility: ["car"],
  saves: ["des", "car"],
  skillChoices: {
    pick: 3,
    from: ["Acrobacias", "Arcanos", "Atletismo", "Engaño", "Historia", "Interpretación", "Intimidación", "Investigación", "Juego de Manos", "Medicina", "Naturaleza", "Percepción", "Perspicacia", "Persuasión", "Religión", "Sigilo", "Supervivencia", "Trato con Animales"],
  },
  armor: ["ligera"],
  weapons: ["sencillas"],
  startingGold: 90,
  startingEquipment: ["Armadura de cuero", "2 dagas", "Instrumento musical", "Paquete de artista", "19 PO"],
  caster: "full",
  spellAbility: "car",
  features: [
    {
      level: 1,
      name: "Inspiración Bárdica",
      blurb: "El bardo entrega un dado de inspiración a un aliado para que lo sume a una tirada de ataque, prueba o salvación, con usos limitados que se recuperan tras un descanso.",
    },
    {
      level: 1,
      name: "Lanzamiento de Conjuros",
      blurb: "El bardo prepara conjuros de su lista de clase usando Carisma y los lanza gastando espacios de conjuro.",
    },
    {
      level: 2,
      name: "Pericia",
      blurb: "El bardo duplica su bono de competencia en dos pericias o herramientas en las que ya es competente.",
    },
    {
      level: 2,
      name: "Toque de Todos los Oficios",
      blurb: "El bardo suma la mitad de su bono de competencia a cualquier prueba de característica en la que no sea competente.",
    },
    {
      level: 3,
      name: "Subclase de Bardo",
      blurb: "Elige un colegio bárdico que define su estilo artístico y desbloquea rasgos exclusivos en niveles posteriores.",
      subclass: true,
    },
    {
      level: 4,
      name: "Mejora de Característica",
      blurb: "El personaje aumenta sus puntuaciones de característica o adquiere un talento.",
    },
    {
      level: 5,
      name: "Fuente de Inspiración",
      blurb: "Si se queda sin usos de Inspiración Bárdica, el bardo recupera uno automáticamente al tirar iniciativa.",
    },
    {
      level: 6,
      name: "Rasgo de subclase",
      blurb: "El colegio bárdico concede un nuevo poder que amplía el repertorio artístico del bardo.",
      subclass: true,
    },
    {
      level: 7,
      name: "Contracanto",
      blurb: "Con su reacción, el bardo otorga a sí mismo o a un aliado cercano ventaja en salvaciones contra encantamiento o miedo.",
    },
    {
      level: 8,
      name: "Mejora de Característica",
      blurb: "Nueva ronda de mejora de característica o talento.",
    },
    {
      level: 9,
      name: "Pericia",
      blurb: "El bardo elige dos pericias adicionales para duplicar su bono de competencia en ellas.",
    },
    {
      level: 10,
      name: "Secretos Mágicos",
      blurb: "El bardo aprende conjuros de cualquier lista de clase, más allá de la lista propia de bardo.",
    },
    {
      level: 12,
      name: "Mejora de Característica",
      blurb: "Nueva ronda de mejora de característica o talento.",
    },
    {
      level: 14,
      name: "Rasgo de subclase",
      blurb: "El colegio bárdico otorga un nuevo poder que refuerza su especialidad temática.",
      subclass: true,
    },
    {
      level: 16,
      name: "Mejora de Característica",
      blurb: "Nueva ronda de mejora de característica o talento.",
    },
    {
      level: 18,
      name: "Inspiración Superior",
      blurb: "Al tirar iniciativa sin usos de Inspiración Bárdica restantes, el bardo recupera todos sus usos de golpe.",
    },
    {
      level: 19,
      name: "Don Épico",
      blurb: "El bardo obtiene un don épico, una mejora extraordinaria reservada a personajes de nivel legendario.",
    },
    {
      level: 20,
      name: "Palabras de la Creación",
      blurb: "El bardo puede lanzar, en su forma más poderosa y sin gastar espacio de conjuro, un conjuro de curación o de debilitación una vez por descanso largo.",
    },
  ],
  resources: [
    { name: "Trucos", values: [2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4] },
    { name: "Conjuros preparados", values: [4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22] },
    { name: "Dado de Inspiración Bárdica", values: ["d6", "d6", "d6", "d6", "d8", "d8", "d8", "d8", "d8", "d10", "d10", "d10", "d10", "d10", "d12", "d12", "d12", "d12", "d12", "d12"] },
  ],
};
