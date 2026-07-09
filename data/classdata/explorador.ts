// Datos mecánicos del Explorador (PHB 2024, vía D&D Beyond). Hechos de juego:
// dados, competencias, progresión. Descripciones: resúmenes propios en español.
import type { ClassMechanics } from "./types";

export const EXPLORADOR: ClassMechanics = {
  slug: "explorador",
  primaryAbility: ["des", "sab"],
  saves: ["fue", "des"],
  skillChoices: {
    pick: 3,
    from: ["Atletismo", "Investigación", "Naturaleza", "Percepción", "Perspicacia", "Sigilo", "Supervivencia", "Trato con Animales"],
  },
  armor: ["ligera", "media", "escudos"],
  weapons: ["sencillas", "marciales"],
  startingGold: 150,
  startingEquipment: ["Armadura de cuero tachonada", "Cimitarra", "Espada corta", "Arco largo", "20 flechas", "Carcaj", "Foco druídico", "Paquete de explorador", "7 PO"],
  caster: "half",
  spellAbility: "sab",
  features: [
    {
      level: 1,
      name: "Lanzamiento de Conjuros",
      blurb: "El explorador prepara conjuros de su lista de clase usando Sabiduría y los lanza gastando espacios de conjuro.",
    },
    {
      level: 1,
      name: "Enemigo Predilecto",
      blurb: "Al impactar a una criatura, el explorador puede marcarla como presa para rastrearla mejor y darle ventaja en ciertas pruebas contra ella.",
    },
    {
      level: 1,
      name: "Maestría con Armas",
      blurb: "Aplica la propiedad especial de maestría de un arma sencilla o marcial mientras la empuña.",
    },
    {
      level: 2,
      name: "Explorador Ágil",
      blurb: "El explorador gana competencia en una pericia adicional y aprende un truco de la lista de druida.",
    },
    {
      level: 2,
      name: "Estilo de Combate",
      blurb: "El explorador elige un estilo de combate que le otorga un beneficio pasivo permanente en batalla.",
    },
    {
      level: 3,
      name: "Subclase de Explorador",
      blurb: "Elige un arquetipo del explorador que define su especialidad y le otorga rasgos exclusivos en niveles posteriores.",
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
      blurb: "Al usar la acción de Atacar, el explorador golpea dos veces en vez de una.",
    },
    {
      level: 6,
      name: "Merodeo",
      blurb: "La velocidad de desplazamiento del explorador aumenta mientras no lleve armadura pesada.",
    },
    {
      level: 7,
      name: "Rasgo de subclase",
      blurb: "El arquetipo del explorador concede un nuevo poder que amplía sus habilidades de caza.",
      subclass: true,
    },
    {
      level: 8,
      name: "Mejora de Característica",
      blurb: "Nueva ronda de mejora de característica o talento.",
    },
    {
      level: 9,
      name: "Pericia",
      blurb: "El explorador duplica su bono de competencia en dos pericias en las que ya es competente.",
    },
    {
      level: 10,
      name: "Incansable",
      blurb: "Al final de un descanso corto, el explorador recupera puntos de golpe y puede eliminar un nivel de agotamiento.",
    },
    {
      level: 11,
      name: "Rasgo de subclase",
      blurb: "El arquetipo del explorador otorga un nuevo poder que refuerza su papel en el grupo.",
      subclass: true,
    },
    {
      level: 12,
      name: "Mejora de Característica",
      blurb: "Nueva ronda de mejora de característica o talento.",
    },
    {
      level: 13,
      name: "Cazador Implacable",
      blurb: "El explorador ignora el terreno difícil no mágico y gana ventaja en salvaciones contra ser apresado.",
    },
    {
      level: 14,
      name: "Velo de la Naturaleza",
      blurb: "El explorador puede volverse invisible durante un breve instante, fundiéndose con su entorno natural.",
    },
    {
      level: 15,
      name: "Rasgo de subclase",
      blurb: "El arquetipo del explorador concede un poder avanzado propio de cazadores experimentados.",
      subclass: true,
    },
    {
      level: 16,
      name: "Mejora de Característica",
      blurb: "Nueva ronda de mejora de característica o talento.",
    },
    {
      level: 17,
      name: "Cazador Preciso",
      blurb: "El explorador puede convertir un fallo en un ataque en un impacto una vez por descanso corto o largo.",
    },
    {
      level: 18,
      name: "Sentidos Feroces",
      blurb: "El explorador ignora la desventaja al atacar a criaturas invisibles que estén cerca de él.",
    },
    {
      level: 19,
      name: "Don Épico",
      blurb: "El explorador obtiene un don épico, una mejora extraordinaria reservada a personajes de nivel legendario.",
    },
    {
      level: 20,
      name: "Verdugo de Enemigos",
      blurb: "El explorador puede atacar dos veces adicionales como parte de la acción de Atacar contra sus enemigos favoritos, una vez por descanso largo.",
    },
  ],
  resources: [
    { name: "Conjuros preparados", values: [2, 3, 4, 5, 6, 6, 7, 7, 9, 9, 10, 10, 11, 11, 12, 12, 14, 14, 15, 15] },
    { name: "Usos de Enemigo Predilecto", values: [2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6] },
  ],
};
