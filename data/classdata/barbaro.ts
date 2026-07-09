// Datos mecánicos del Bárbaro (PHB 2024, vía D&D Beyond). Hechos de juego:
// dados, competencias, progresión. Descripciones: resúmenes propios en español.
import type { ClassMechanics } from "./types";

export const BARBARO: ClassMechanics = {
  slug: "barbaro",
  primaryAbility: ["fue"],
  saves: ["fue", "con"],
  skillChoices: {
    pick: 2,
    from: ["Trato con Animales", "Atletismo", "Intimidación", "Naturaleza", "Percepción", "Supervivencia"],
  },
  armor: ["ligera", "media", "escudos"],
  weapons: ["sencillas", "marciales"],
  startingGold: 75,
  startingEquipment: ["Hacha grande", "4 hachas de mano", "Paquete de explorador", "15 PO"],
  caster: "none",
  features: [
    {
      level: 1,
      name: "Furia",
      blurb: "Entra en un estado de rabia que añade daño extra a los golpes cuerpo a cuerpo con Fuerza y da resistencia a daño físico, a cambio de perder concentración y ciertas acciones complejas.",
    },
    {
      level: 1,
      name: "Defensa sin Armadura",
      blurb: "Sin armadura, la Clase de Armadura del bárbaro se calcula con Destreza y Constitución en vez de depender de una coraza.",
    },
    {
      level: 1,
      name: "Maestría con Armas",
      blurb: "Aplica la propiedad especial de maestría de un arma sencilla o marcial mientras la empuña, aprovechando ventajas tácticas únicas de esa arma.",
    },
    {
      level: 2,
      name: "Sentir el Peligro",
      blurb: "Ventaja en salvaciones de Destreza contra efectos que el bárbaro puede ver venir, como trampas y conjuros de área.",
    },
    {
      level: 2,
      name: "Ataque Temerario",
      blurb: "Al atacar cuerpo a cuerpo con Fuerza, el bárbaro puede arriesgarse: gana ventaja en el ataque pero expone su guardia a los enemigos.",
    },
    {
      level: 3,
      name: "Subclase de Bárbaro",
      blurb: "Elige una senda primigenia que define un estilo de furia propio y desbloquea rasgos exclusivos en niveles posteriores.",
      subclass: true,
    },
    {
      level: 3,
      name: "Conocimiento Primal",
      blurb: "Mientras está enfurecido, el bárbaro puede volverse experto temporalmente en una pericia de Fuerza que no domine.",
    },
    {
      level: 4,
      name: "Mejora de Característica",
      blurb: "El personaje aumenta sus puntuaciones de característica o adquiere un talento, como todas las clases en los niveles de mejora.",
    },
    {
      level: 5,
      name: "Ataque Extra",
      blurb: "Al usar la acción de Atacar, el bárbaro golpea dos veces en vez de una, doblando su daño potencial por turno.",
    },
    {
      level: 5,
      name: "Movimiento Rápido",
      blurb: "La velocidad de desplazamiento del bárbaro aumenta mientras no lleve armadura pesada, facilitando perseguir o huir.",
    },
    {
      level: 6,
      name: "Rasgo de subclase",
      blurb: "La senda primigenia elegida concede un nuevo poder que refuerza su identidad temática particular.",
      subclass: true,
    },
    {
      level: 7,
      name: "Instinto Salvaje",
      blurb: "El bárbaro no puede ser sorprendido mientras no esté incapacitado, gracias a sus sentidos aguzados por la furia.",
    },
    {
      level: 7,
      name: "Arremetida Instintiva",
      blurb: "Al activar la Furia con su acción adicional, el bárbaro puede además moverse hasta la mitad de su velocidad como parte de esa misma acción.",
    },
    {
      level: 8,
      name: "Mejora de Característica",
      blurb: "Nueva ronda de mejora de característica o talento, como en el nivel 4.",
    },
    {
      level: 9,
      name: "Golpe Brutal",
      blurb: "Durante un Ataque Temerario, el bárbaro puede sacrificar parte de su ventaja para añadir un dado de daño extra al golpe.",
    },
    {
      level: 10,
      name: "Rasgo de subclase",
      blurb: "Nuevo poder de la senda primigenia que amplía las opciones tácticas del bárbaro en combate.",
      subclass: true,
    },
    {
      level: 11,
      name: "Furia Implacable",
      blurb: "Si un golpe dejaría al bárbaro enfurecido a 0 puntos de golpe, puede en su lugar quedarse con 1 punto de golpe, una vez por descanso largo.",
    },
    {
      level: 12,
      name: "Mejora de Característica",
      blurb: "Nueva ronda de mejora de característica o talento, como en niveles anteriores.",
    },
    {
      level: 13,
      name: "Golpe Brutal Mejorado",
      blurb: "El Golpe Brutal gana una opción adicional, como derribar al objetivo o alejarlo de un tirón.",
    },
    {
      level: 14,
      name: "Rasgo de subclase",
      blurb: "La senda primigenia otorga un rasgo culminante que suele definir el papel del bárbaro en niveles altos.",
      subclass: true,
    },
    {
      level: 15,
      name: "Furia Persistente",
      blurb: "La furia del bárbaro ya no termina antes de tiempo por perder la concentración o quedar sin objetivos que golpear o recibir daño.",
    },
    {
      level: 16,
      name: "Mejora de Característica",
      blurb: "Nueva ronda de mejora de característica o talento, como en niveles anteriores.",
    },
    {
      level: 17,
      name: "Golpe Brutal Mejorado",
      blurb: "El Golpe Brutal suma una tercera opción, ampliando aún más el control que el bárbaro ejerce sobre sus víctimas.",
    },
    {
      level: 18,
      name: "Fuerza Indómita",
      blurb: "Si el resultado de una prueba de característica con Fuerza es menor que la propia puntuación de Fuerza, el bárbaro puede usar esta última en su lugar.",
    },
    {
      level: 19,
      name: "Don Épico",
      blurb: "El bárbaro obtiene un don épico, una mejora extraordinaria reservada a personajes de nivel legendario.",
    },
    {
      level: 20,
      name: "Campeón Primal",
      blurb: "La Fuerza y la Constitución del bárbaro aumentan permanentemente y su furia alcanza su máxima expresión de poder físico.",
    },
  ],
  resources: [
    {
      name: "Furias",
      values: [2, 2, 3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 6, 6, 6, 6],
    },
    {
      name: "Daño de furia",
      values: ["+2", "+2", "+2", "+2", "+2", "+2", "+2", "+2", "+3", "+3", "+3", "+3", "+3", "+3", "+3", "+4", "+4", "+4", "+4", "+4"],
    },
    {
      name: "Maestría",
      values: [2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
    },
  ],
};
