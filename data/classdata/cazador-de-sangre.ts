// Datos mecánicos del Cazador de Sangre (Critical Role / Matt Mercer, vía D&D
// Beyond). Hechos de juego: dados, competencias, progresión. Descripciones:
// resúmenes propios en español. El equipo inicial no ofrece alternativa de
// oro en la fuente consultada; se estima 75 PO por convención con otras
// clases marciales de d10 (ver informe de verificación).
import type { ClassMechanics } from "./types";

export const CAZADOR_DE_SANGRE: ClassMechanics = {
  slug: "cazador-de-sangre",
  primaryAbility: ["fue", "des"],
  saves: ["fue", "int"],
  skillChoices: {
    pick: 3,
    from: ["Acrobacias", "Arcanos", "Atletismo", "Historia", "Investigación", "Intimidación", "Perspicacia", "Religión", "Supervivencia"],
  },
  armor: ["ligera", "media", "escudos"],
  weapons: ["sencillas", "marciales"],
  startingGold: 75,
  startingEquipment: ["Un arma marcial (o dos armas sencillas)", "Ballesta ligera y 20 virotes", "Armadura de cuero tachonada o cota de escamas", "Paquete de explorador", "Kit de alquimista"],
  caster: "none",
  features: [
    {
      level: 1,
      name: "Presagio del Cazador",
      blurb: "El cazador de sangre gana competencia y ventaja en ciertas pruebas relacionadas con rastrear y comprender a criaturas sobrenaturales.",
    },
    {
      level: 1,
      name: "Maldición de Sangre",
      blurb: "Sacrificando parte de sus propios puntos de golpe, el cazador de sangre activa una maldición mágica limitada que perjudica a un enemigo cercano.",
    },
    {
      level: 2,
      name: "Estilo de Combate",
      blurb: "El cazador de sangre elige un estilo de combate que le otorga un beneficio pasivo permanente en batalla.",
    },
    {
      level: 2,
      name: "Rito Carmesí",
      blurb: "El cazador de sangre inflige daño a sí mismo para imbuir su arma con energía hemocrática, añadiendo daño necrótico a sus golpes durante un tiempo limitado.",
    },
    {
      level: 3,
      name: "Orden de Cazador de Sangre",
      blurb: "Elige una orden sanguínea que define su especialidad de caza y le otorga rasgos exclusivos en niveles posteriores.",
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
      blurb: "Al usar la acción de Atacar, el cazador de sangre golpea dos veces en vez de una.",
    },
    {
      level: 6,
      name: "Marca de Castigo",
      blurb: "El cazador de sangre puede marcar a un enemigo con un símbolo hemocrático que lo castiga si intenta atacarlo a él o a sus aliados.",
    },
    {
      level: 7,
      name: "Rasgo de subclase",
      blurb: "La orden sanguínea concede un nuevo poder que amplía su especialidad de caza.",
      subclass: true,
    },
    {
      level: 7,
      name: "Rito Carmesí Mejorado",
      blurb: "El Rito Carmesí del cazador de sangre puede imbuir armas a distancia además de armas cuerpo a cuerpo.",
    },
    {
      level: 8,
      name: "Mejora de Característica",
      blurb: "Nueva ronda de mejora de característica o talento.",
    },
    {
      level: 9,
      name: "Psicometría Sombría",
      blurb: "Tocando un objeto o cadáver, el cazador de sangre puede percibir impresiones psíquicas de sucesos recientes relacionados con él.",
    },
    {
      level: 10,
      name: "Aumento Oscuro",
      blurb: "El cazador de sangre puede gastar puntos de golpe adicionales al activar Rito Carmesí para obtener un beneficio sobrenatural extra y temporal.",
    },
    {
      level: 11,
      name: "Rasgo de subclase",
      blurb: "La orden sanguínea otorga un nuevo poder que refuerza su papel de cazador de lo sobrenatural.",
      subclass: true,
    },
    {
      level: 12,
      name: "Mejora de Característica",
      blurb: "Nueva ronda de mejora de característica o talento.",
    },
    {
      level: 13,
      name: "Marca de Atadura",
      blurb: "La Marca de Castigo del cazador de sangre puede además impedir que el objetivo se aleje demasiado de él.",
    },
    {
      level: 14,
      name: "Alma Templada",
      blurb: "El cazador de sangre gana resistencia a ser asustado y a ciertos efectos que dañan su fuerza de voluntad.",
    },
    {
      level: 14,
      name: "Rito Carmesí Mejorado",
      blurb: "El Rito Carmesí del cazador de sangre puede imbuir un arma adicional al mismo tiempo.",
    },
    {
      level: 15,
      name: "Rasgo de subclase",
      blurb: "La orden sanguínea concede un poder avanzado propio de cazadores de sangre experimentados.",
      subclass: true,
    },
    {
      level: 16,
      name: "Mejora de Característica",
      blurb: "Nueva ronda de mejora de característica o talento.",
    },
    {
      level: 17,
      name: "Maldición de Sangre Mejorada",
      blurb: "Las maldiciones de sangre del cazador de sangre ganan efectos adicionales más poderosos al activarse.",
    },
    {
      level: 18,
      name: "Rasgo de subclase",
      blurb: "La orden sanguínea otorga un rasgo culminante propio de cazadores de sangre legendarios.",
      subclass: true,
    },
    {
      level: 19,
      name: "Mejora de Característica",
      blurb: "Nueva ronda de mejora de característica o talento.",
    },
    {
      level: 20,
      name: "Maestría Sanguínea",
      blurb: "El cazador de sangre reduce el daño que se inflige a sí mismo con sus propios rasgos hemocráticos, culminando el dominio sobre su propia sangre.",
    },
  ],
  resources: [
    { name: "Dado de hemocraft", values: ["1d4", "1d4", "1d4", "1d4", "1d6", "1d6", "1d6", "1d6", "1d6", "1d6", "1d8", "1d8", "1d8", "1d8", "1d8", "1d8", "1d10", "1d10", "1d10", "1d10"] },
    { name: "Maldiciones de sangre conocidas", values: [1, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5] },
  ],
};
