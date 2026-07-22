// Datos mecánicos del Hechicero (PHB 2024, vía D&D Beyond). Hechos de juego:
// dados, competencias, progresión. Descripciones: resúmenes propios en español.
import type { ClassMechanics } from "./types";

export const HECHICERO: ClassMechanics = {
  slug: "hechicero",
  primaryAbility: ["car"],
  saves: ["con", "car"],
  skillChoices: {
    pick: 2,
    from: ["Arcanos", "Engaño", "Intimidación", "Perspicacia", "Persuasión", "Religión"],
  },
  armor: [],
  weapons: ["sencillas"],
  startingGold: 50,
  startingEquipment: ["Lanza", "2 dagas", "Foco arcano (cristal)", "Paquete de mazmorrero", "28 PO"],
  caster: "full",
  spellAbility: "car",
  features: [
    {
      level: 1,
      name: "Lanzamiento de Conjuros",
      blurb: "El hechicero conoce conjuros de su lista de clase de forma innata y los lanza usando Carisma y espacios de conjuro.",
    },
    {
      level: 1,
      name: "Hechicería Innata",
      blurb: "Al inicio de un combate, el hechicero puede activar brevemente un potenciamiento de su magia sin gastar recursos.",
    },
    {
      level: 2,
      name: "Fuente de Magia",
      blurb: "El hechicero obtiene puntos de hechicería que puede intercambiar por espacios de conjuro o gastar en Metamagia.",
    },
    {
      level: 2,
      name: "Metamagia",
      blurb: "El hechicero aprende opciones de Metamagia que le permiten alterar sus conjuros al lanzarlos, a cambio de puntos de hechicería.",
    },
    {
      level: 3,
      name: "Subclase de Hechicero",
      blurb: "Elige un origen de hechicería que explica la fuente de su poder y le otorga rasgos exclusivos en niveles posteriores.",
      subclass: true,
    },
    {
      level: 4,
      name: "Mejora de Característica",
      blurb: "El personaje aumenta sus puntuaciones de característica o adquiere un talento.",
    },
    {
      level: 5,
      name: "Restauración de Hechicero",
      blurb: "Al terminar un descanso corto, el hechicero recupera algunos de sus puntos de hechicería gastados.",
    },
    {
      level: 6,
      name: "Rasgo de subclase",
      blurb: "El origen de hechicería concede un nuevo poder que refuerza la naturaleza de su magia innata.",
      subclass: true,
    },
    {
      level: 7,
      name: "Hechicería Encarnada",
      blurb: "El hechicero puede volver a activar Hechicería Innata gastando puntos de hechicería, ampliando su ventana de poder potenciado.",
    },
    {
      level: 8,
      name: "Mejora de Característica",
      blurb: "Nueva ronda de mejora de característica o talento.",
    },
    {
      level: 10,
      name: "Metamagia",
      blurb: "El hechicero aprende una opción de Metamagia adicional.",
    },
    {
      level: 12,
      name: "Mejora de Característica",
      blurb: "Nueva ronda de mejora de característica o talento.",
    },
    {
      level: 14,
      name: "Rasgo de subclase",
      blurb: "El origen de hechicería otorga un nuevo poder que amplía las manifestaciones de su magia.",
      subclass: true,
    },
    {
      level: 16,
      name: "Mejora de Característica",
      blurb: "Nueva ronda de mejora de característica o talento.",
    },
    {
      level: 17,
      name: "Metamagia",
      blurb: "El hechicero aprende otra opción de Metamagia, ampliando su repertorio de manipulación arcana.",
    },
    {
      level: 18,
      name: "Rasgo de subclase",
      blurb: "El origen de hechicería concede un rasgo culminante propio de hechiceros de gran poder.",
      subclass: true,
    },
    {
      level: 19,
      name: "Don Épico",
      blurb: "El hechicero obtiene un don épico, una mejora extraordinaria reservada a personajes de nivel legendario.",
    },
    {
      level: 20,
      name: "Apoteosis Arcana",
      blurb: "El hechicero puede activar Hechicería Innata gratis en cada combate y transformar espacios de conjuro en puntos de hechicería con más eficiencia.",
    },
  ],
  resources: [
    { name: "Trucos", values: [4, 4, 4, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6] },
    { name: "Conjuros preparados", values: [2, 4, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22] },
    { name: "Puntos de hechicería", values: [0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20], spend: { key: "puntos-de-hechiceria", recharge: "largo" } },
  ],
};
