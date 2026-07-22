// Datos mecánicos del Druida (PHB 2024, vía D&D Beyond). Hechos de juego:
// dados, competencias, progresión. Descripciones: resúmenes propios en español.
import type { ClassMechanics } from "./types";

export const DRUIDA: ClassMechanics = {
  slug: "druida",
  primaryAbility: ["sab"],
  saves: ["int", "sab"],
  skillChoices: {
    pick: 2,
    from: ["Arcanos", "Medicina", "Naturaleza", "Percepción", "Perspicacia", "Religión", "Supervivencia", "Trato con Animales"],
  },
  armor: ["ligera", "escudos"],
  weapons: ["sencillas"],
  startingGold: 50,
  startingEquipment: ["Armadura de cuero", "Escudo", "Hoz", "Foco druídico (bastón)", "Paquete de explorador", "Kit de herbolario", "9 PO"],
  caster: "full",
  spellAbility: "sab",
  features: [
    {
      level: 1,
      name: "Lanzamiento de Conjuros",
      blurb: "El druida prepara conjuros de su lista de clase usando Sabiduría y los lanza gastando espacios de conjuro.",
    },
    {
      level: 1,
      name: "Druídico",
      blurb: "El druida conoce una lengua secreta de druidas que le permite dejar mensajes ocultos y comunicarse en clave.",
    },
    {
      level: 1,
      name: "Orden Primigenia",
      blurb: "El druida elige un rol: mago, con un truco extra, o guardián, con entrenamiento marcial y armadura media.",
    },
    {
      level: 2,
      name: "Forma Salvaje",
      blurb: "El druida puede transformarse en una bestia que ya ha visto, adoptando su forma física durante un tiempo limitado.",
    },
    {
      level: 2,
      name: "Compañero Salvaje",
      blurb: "El druida puede lanzar Encontrar Familiar como ritual, invocando un espíritu con forma de bestia menor.",
    },
    {
      level: 3,
      name: "Subclase de Druida",
      blurb: "Elige un círculo druídico que define su vínculo con la naturaleza y le otorga rasgos exclusivos en niveles posteriores.",
      subclass: true,
    },
    {
      level: 4,
      name: "Mejora de Característica",
      blurb: "El personaje aumenta sus puntuaciones de característica o adquiere un talento.",
    },
    {
      level: 5,
      name: "Resurgimiento Salvaje",
      blurb: "El druida puede gastar un uso de Forma Salvaje para recuperar puntos de golpe, incluso sin transformarse.",
    },
    {
      level: 6,
      name: "Rasgo de subclase",
      blurb: "El círculo druídico concede un nuevo poder que amplía su vínculo con lo salvaje.",
      subclass: true,
    },
    {
      level: 7,
      name: "Furia Elemental",
      blurb: "Los ataques del druida, en su forma normal o salvaje, infligen daño elemental extra una vez por turno.",
    },
    {
      level: 8,
      name: "Mejora de Característica",
      blurb: "Nueva ronda de mejora de característica o talento.",
    },
    {
      level: 10,
      name: "Rasgo de subclase",
      blurb: "El círculo druídico otorga un nuevo poder que refuerza su especialidad temática.",
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
      blurb: "El círculo druídico concede un poder avanzado propio de druidas de gran experiencia.",
      subclass: true,
    },
    {
      level: 15,
      name: "Furia Elemental Mejorada",
      blurb: "El daño elemental extra de Furia Elemental aumenta y gana una opción adicional de aplicación.",
    },
    {
      level: 16,
      name: "Mejora de Característica",
      blurb: "Nueva ronda de mejora de característica o talento.",
    },
    {
      level: 18,
      name: "Conjuros de Bestia",
      blurb: "El druida puede lanzar ciertos conjuros mientras está transformado en Forma Salvaje.",
    },
    {
      level: 19,
      name: "Don Épico",
      blurb: "El druida obtiene un don épico, una mejora extraordinaria reservada a personajes de nivel legendario.",
    },
    {
      level: 20,
      name: "Archidruida",
      blurb: "El druida puede usar Forma Salvaje un número ilimitado de veces y recupera un espacio de conjuro gastado tras transformarse.",
    },
  ],
  resources: [
    { name: "Trucos", values: [2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4] },
    { name: "Conjuros preparados", values: [4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22] },
    { name: "Usos de Forma Salvaje", values: ["—", 2, 2, 3, 3, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 8, 8, 8, 9, "Ilimitados"], spend: { key: "forma-salvaje", recharge: "corto" } },
    { name: "RD máximo de Forma Salvaje", values: ["—", "1/4", "1/4", "1/2", "1/2", "1/2", "1", "1", "1", "1", "1", "1", "2", "2", "2", "2", "2", "2", "3", "3"] },
  ],
};
