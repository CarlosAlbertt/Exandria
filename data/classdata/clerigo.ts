// Datos mecánicos del Clérigo (PHB 2024, vía D&D Beyond). Hechos de juego:
// dados, competencias, progresión. Descripciones: resúmenes propios en español.
import type { ClassMechanics } from "./types";

export const CLERIGO: ClassMechanics = {
  slug: "clerigo",
  primaryAbility: ["sab"],
  saves: ["sab", "car"],
  skillChoices: {
    pick: 2,
    from: ["Historia", "Medicina", "Perspicacia", "Persuasión", "Religión"],
  },
  armor: ["ligera", "media", "escudos"],
  weapons: ["sencillas"],
  startingGold: 110,
  startingEquipment: ["Camisote de malla", "Escudo", "Maza", "Símbolo sagrado", "Paquete de sacerdote", "7 PO"],
  caster: "full",
  spellAbility: "sab",
  features: [
    {
      level: 1,
      name: "Lanzamiento de Conjuros",
      blurb: "El clérigo prepara conjuros de su lista de clase usando Sabiduría y los lanza gastando espacios de conjuro.",
    },
    {
      level: 1,
      name: "Orden Divina",
      blurb: "El clérigo elige un rol: protector, con entrenamiento marcial y armadura pesada, o taumaturgo, con un truco y competencia extra en pericias.",
    },
    {
      level: 2,
      name: "Canalizar Divinidad",
      blurb: "El clérigo invoca directamente el poder de su deidad para lograr un efecto sobrenatural determinado por su orden o dominio.",
    },
    {
      level: 3,
      name: "Subclase de Clérigo",
      blurb: "Elige un dominio divino que define el favor de su deidad y le otorga rasgos exclusivos en niveles posteriores.",
      subclass: true,
    },
    {
      level: 4,
      name: "Mejora de Característica",
      blurb: "El personaje aumenta sus puntuaciones de característica o adquiere un talento.",
    },
    {
      level: 5,
      name: "Marchitar Muertos",
      blurb: "Al usar Canalizar Divinidad para hacer huir a los no-muertos, el clérigo puede además infligirles daño radiante.",
    },
    {
      level: 6,
      name: "Rasgo de subclase",
      blurb: "El dominio divino concede un nuevo poder que refuerza la conexión del clérigo con su deidad.",
      subclass: true,
    },
    {
      level: 7,
      name: "Golpes Benditos",
      blurb: "Los ataques del clérigo, o sus conjuros de daño, infligen daño radiante extra una vez por turno.",
    },
    {
      level: 8,
      name: "Mejora de Característica",
      blurb: "Nueva ronda de mejora de característica o talento.",
    },
    {
      level: 10,
      name: "Intervención Divina",
      blurb: "El clérigo puede suplicar ayuda directa a su deidad para producir un efecto milagroso, con posibilidad de fallo.",
    },
    {
      level: 12,
      name: "Mejora de Característica",
      blurb: "Nueva ronda de mejora de característica o talento.",
    },
    {
      level: 14,
      name: "Golpes Benditos Mejorados",
      blurb: "El daño radiante extra de Golpes Benditos aumenta y gana una opción adicional de aplicación.",
    },
    {
      level: 16,
      name: "Mejora de Característica",
      blurb: "Nueva ronda de mejora de característica o talento.",
    },
    {
      level: 17,
      name: "Rasgo de subclase",
      blurb: "El dominio divino otorga un rasgo culminante propio de clérigos de gran devoción.",
      subclass: true,
    },
    {
      level: 19,
      name: "Don Épico",
      blurb: "El clérigo obtiene un don épico, una mejora extraordinaria reservada a personajes de nivel legendario.",
    },
    {
      level: 20,
      name: "Intervención Divina Mayor",
      blurb: "La ayuda de la deidad del clérigo llega de forma prácticamente garantizada al invocar Intervención Divina.",
    },
  ],
  resources: [
    { name: "Trucos", values: [3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5] },
    { name: "Conjuros preparados", values: [4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22] },
    { name: "Usos de Canalizar Divinidad", values: ["—", 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4], spend: { key: "canalizar-divinidad", recharge: "corto" } },
  ],
};
