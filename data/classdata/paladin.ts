// Datos mecánicos del Paladín (PHB 2024, vía D&D Beyond). Hechos de juego:
// dados, competencias, progresión. Descripciones: resúmenes propios en español.
import type { ClassMechanics } from "./types";

export const PALADIN: ClassMechanics = {
  slug: "paladin",
  primaryAbility: ["fue", "car"],
  saves: ["sab", "car"],
  skillChoices: {
    pick: 2,
    from: ["Atletismo", "Intimidación", "Medicina", "Perspicacia", "Persuasión", "Religión"],
  },
  armor: ["ligera", "media", "pesada", "escudos"],
  weapons: ["sencillas", "marciales"],
  startingGold: 150,
  startingEquipment: ["Cota de mallas", "Escudo", "Espada larga", "6 jabalinas", "Símbolo sagrado", "Paquete de sacerdote", "9 PO"],
  caster: "half",
  spellAbility: "car",
  features: [
    {
      level: 1,
      name: "Imposición de Manos",
      blurb: "El paladín acumula una reserva de energía sanadora que puede gastar con un toque para curar heridas o neutralizar venenos y enfermedades.",
    },
    {
      level: 1,
      name: "Lanzamiento de Conjuros",
      blurb: "El paladín prepara conjuros de su lista de clase usando Carisma y los lanza gastando espacios de conjuro.",
    },
    {
      level: 1,
      name: "Maestría con Armas",
      blurb: "Aplica la propiedad especial de maestría de un arma sencilla o marcial mientras la empuña.",
    },
    {
      level: 2,
      name: "Estilo de Combate",
      blurb: "El paladín elige un estilo de combate que le otorga un beneficio pasivo permanente en batalla.",
    },
    {
      level: 2,
      name: "Golpe Divino del Paladín",
      blurb: "Al gastar un espacio de conjuro en un ataque cuerpo a cuerpo impactado, el paladín inflige daño radiante extra.",
    },
    {
      level: 3,
      name: "Canalizar Divinidad",
      blurb: "El paladín invoca directamente el poder de su juramento para lograr un efecto sobrenatural determinado por su orden sagrada.",
    },
    {
      level: 3,
      name: "Subclase de Paladín",
      blurb: "Elige un juramento sagrado que define su código de honor y le otorga rasgos exclusivos en niveles posteriores.",
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
      blurb: "Al usar la acción de Atacar, el paladín golpea dos veces en vez de una.",
    },
    {
      level: 5,
      name: "Corcel Fiel",
      blurb: "El paladín puede lanzar Encontrar Corcel como ritual, invocando una montura espiritual leal.",
    },
    {
      level: 6,
      name: "Aura de Protección",
      blurb: "El paladín y los aliados cercanos suman su bonificador de Carisma a las salvaciones que realicen.",
    },
    {
      level: 7,
      name: "Rasgo de subclase",
      blurb: "El juramento sagrado concede un nuevo poder que refuerza su código de honor.",
      subclass: true,
    },
    {
      level: 8,
      name: "Mejora de Característica",
      blurb: "Nueva ronda de mejora de característica o talento.",
    },
    {
      level: 9,
      name: "Rechazar Enemigos",
      blurb: "Como acción, el paladín emana un resplandor divino que amedrenta a las criaturas hostiles cercanas.",
    },
    {
      level: 10,
      name: "Aura de Valor",
      blurb: "El paladín y los aliados cercanos no pueden quedar asustados mientras el paladín siga consciente.",
    },
    {
      level: 11,
      name: "Golpes Radiantes",
      blurb: "Los ataques del paladín infligen daño radiante extra una vez por turno.",
    },
    {
      level: 12,
      name: "Mejora de Característica",
      blurb: "Nueva ronda de mejora de característica o talento.",
    },
    {
      level: 14,
      name: "Toque Restaurador",
      blurb: "Al usar Imposición de Manos, el paladín puede además eliminar una condición perjudicial que afecte al objetivo.",
    },
    {
      level: 15,
      name: "Rasgo de subclase",
      blurb: "El juramento sagrado otorga un nuevo poder que amplía su devoción.",
      subclass: true,
    },
    {
      level: 16,
      name: "Mejora de Característica",
      blurb: "Nueva ronda de mejora de característica o talento.",
    },
    {
      level: 18,
      name: "Expansión del Aura",
      blurb: "El alcance de las auras del paladín se duplica, protegiendo a más aliados en combate.",
    },
    {
      level: 19,
      name: "Don Épico",
      blurb: "El paladín obtiene un don épico, una mejora extraordinaria reservada a personajes de nivel legendario.",
    },
    {
      level: 20,
      name: "Rasgo de subclase",
      blurb: "El juramento sagrado concede un rasgo culminante propio de paladines legendarios.",
      subclass: true,
    },
  ],
  resources: [
    { name: "Conjuros preparados", values: [2, 2, 4, 5, 6, 6, 7, 7, 9, 9, 10, 10, 11, 11, 12, 12, 14, 14, 15, 15] },
    { name: "Usos de Canalizar Divinidad", values: ["—", "—", 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3] },
    { name: "Reserva de Imposición de Manos", values: [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100], spend: { key: "imposicion-de-manos", recharge: "largo" } },
  ],
};
