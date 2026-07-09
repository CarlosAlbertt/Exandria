// Datos mecánicos del Monje (PHB 2024, vía D&D Beyond). Hechos de juego:
// dados, competencias, progresión. Descripciones: resúmenes propios en español.
import type { ClassMechanics } from "./types";

export const MONJE: ClassMechanics = {
  slug: "monje",
  primaryAbility: ["des", "sab"],
  saves: ["fue", "des"],
  skillChoices: {
    pick: 2,
    from: ["Acrobacias", "Atletismo", "Historia", "Interpretación", "Perspicacia", "Religión", "Sigilo"],
  },
  armor: [],
  weapons: ["sencillas", "marciales con la propiedad Ligera"],
  startingGold: 50,
  startingEquipment: ["Lanza", "5 dagas", "Herramienta de artesano o instrumento musical", "Paquete de explorador", "11 PO"],
  caster: "none",
  features: [
    {
      level: 1,
      name: "Artes Marciales",
      blurb: "Sin armas pesadas ni armadura, el monje golpea con puños y armas sencillas usando Destreza y con un dado de daño propio que crece con el nivel.",
    },
    {
      level: 1,
      name: "Defensa sin Armadura",
      blurb: "Sin armadura, la Clase de Armadura del monje se calcula con Destreza y Sabiduría en vez de depender de una coraza.",
    },
    {
      level: 2,
      name: "Enfoque del Monje",
      blurb: "El monje obtiene puntos de foco que puede gastar para potenciar sus golpes o activar rasgos especiales de Artes Marciales.",
    },
    {
      level: 2,
      name: "Movimiento sin Armadura",
      blurb: "Sin armadura ni escudo, la velocidad del monje aumenta y puede moverse por superficies verticales o sobre líquidos brevemente.",
    },
    {
      level: 2,
      name: "Metabolismo Sorprendente",
      blurb: "Al terminar un descanso corto, el monje recupera puntos de golpe y todos sus puntos de foco gastados, una vez por descanso largo.",
    },
    {
      level: 3,
      name: "Desviar Ataques",
      blurb: "Con su reacción, el monje reduce el daño de un ataque cuerpo a cuerpo que le impacte, pudiendo anularlo por completo.",
    },
    {
      level: 3,
      name: "Subclase de Monje",
      blurb: "Elige una tradición marcial que define su estilo de combate y le otorga rasgos exclusivos en niveles posteriores.",
      subclass: true,
    },
    {
      level: 4,
      name: "Mejora de Característica",
      blurb: "El personaje aumenta sus puntuaciones de característica o adquiere un talento.",
    },
    {
      level: 4,
      name: "Caída Suave",
      blurb: "El monje puede gastar su reacción para reducir el daño que sufre por una caída.",
    },
    {
      level: 5,
      name: "Ataque Extra",
      blurb: "Al usar la acción de Atacar, el monje golpea dos veces en vez de una.",
    },
    {
      level: 5,
      name: "Golpe Aturdidor",
      blurb: "Al impactar con un ataque, el monje puede gastar un punto de foco para intentar aturdir al objetivo.",
    },
    {
      level: 6,
      name: "Golpes Potenciados",
      blurb: "Los ataques desarmados del monje cuentan como mágicos para superar resistencias e inmunidades.",
    },
    {
      level: 6,
      name: "Rasgo de subclase",
      blurb: "La tradición marcial concede un nuevo poder que amplía su estilo de combate.",
      subclass: true,
    },
    {
      level: 7,
      name: "Evasión",
      blurb: "Ante efectos que exigen una salvación de Destreza para sufrir la mitad del daño, el monje no recibe daño si tiene éxito y solo la mitad si falla.",
    },
    {
      level: 8,
      name: "Mejora de Característica",
      blurb: "Nueva ronda de mejora de característica o talento.",
    },
    {
      level: 9,
      name: "Movimiento Acrobático",
      blurb: "El monje ignora el terreno difícil al moverse y puede cruzar superficies inestables sin caer.",
    },
    {
      level: 10,
      name: "Enfoque Superior",
      blurb: "El monje recupera puntos de foco al iniciar su turno si no le queda ninguno.",
    },
    {
      level: 10,
      name: "Autorrestauración",
      blurb: "Al terminar un descanso corto, el monje puede eliminar una condición perjudicial que lo afecte.",
    },
    {
      level: 11,
      name: "Rasgo de subclase",
      blurb: "La tradición marcial otorga un nuevo poder que refuerza su especialidad temática.",
      subclass: true,
    },
    {
      level: 12,
      name: "Mejora de Característica",
      blurb: "Nueva ronda de mejora de característica o talento.",
    },
    {
      level: 13,
      name: "Desviar Energía",
      blurb: "El monje puede usar Desviar Ataques también contra ataques a distancia, absorbiendo o redirigiendo parte del daño.",
    },
    {
      level: 14,
      name: "Superviviente Disciplinado",
      blurb: "El monje gana competencia en todas las salvaciones y puede gastar un punto de foco para convertir un fallo en éxito.",
    },
    {
      level: 15,
      name: "Enfoque Perfecto",
      blurb: "El monje recupera todos sus puntos de foco al iniciar su turno si no le queda ninguno.",
    },
    {
      level: 16,
      name: "Mejora de Característica",
      blurb: "Nueva ronda de mejora de característica o talento.",
    },
    {
      level: 17,
      name: "Rasgo de subclase",
      blurb: "La tradición marcial concede un poder avanzado propio de monjes de gran disciplina.",
      subclass: true,
    },
    {
      level: 18,
      name: "Defensa Superior",
      blurb: "Como acción adicional, el monje gasta un punto de foco para ganar resistencia a todo el daño hasta el inicio de su próximo turno.",
    },
    {
      level: 19,
      name: "Don Épico",
      blurb: "El monje obtiene un don épico, una mejora extraordinaria reservada a personajes de nivel legendario.",
    },
    {
      level: 20,
      name: "Cuerpo y Mente",
      blurb: "La Destreza y la Sabiduría del monje aumentan permanentemente, culminando su entrenamiento marcial y espiritual.",
    },
  ],
  resources: [
    { name: "Dado de Artes Marciales", values: ["1d6", "1d6", "1d6", "1d6", "1d8", "1d8", "1d8", "1d8", "1d8", "1d8", "1d10", "1d10", "1d10", "1d10", "1d10", "1d10", "1d12", "1d12", "1d12", "1d12"] },
    { name: "Puntos de foco", values: [0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20] },
  ],
};
