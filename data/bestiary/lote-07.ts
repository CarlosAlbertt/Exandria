// Bestiario D&D 2024 — LOTE 07. Monster Manual 2024, páginas 36 y 37 del libro
// (39 y 40 del PDF), leídas de la página renderizada.
//
// Convención de troceo y criterio: ver la cabecera de `lote-01.ts`.
import type { Monster } from "./types";

export const CONTEMPLADOR: Monster = {
  slug: "contemplador",
  name: "Contemplador",
  nameEn: "Beholder",
  size: "Grande",
  type: "Aberración",
  alignment: "Legal Malvado",
  ac: 18,
  initiative: 12,
  hp: 190,
  hpFormula: "20d10 + 80",
  speeds: "1,5 m, vuelo 12 m (flotando)",
  abilities: { fue: 16, des: 14, con: 18, int: 17, sab: 15, car: 17 },
  saves: "Con +9, Sab +7",
  skills: "Percepción +12",
  immunities: "Derribado",
  senses: "Visión en la oscuridad 36 m; Percepción pasiva 22",
  languages: "Habla Profunda, infracomún",
  cr: "13",
  xp: 10000,
  pb: 5,
  traits: [
    { name: "Resistencia Legendaria (3/día, 4 en su guarida)", text: "Si falla una salvación, puede optar por superarla." },
  ],
  actions: [
    { name: "Multiataque", text: "Usa Rayos Oculares tres veces." },
    { name: "Mordisco", text: "Ataque cuerpo a cuerpo: +8, alcance 1,5 m, 13 (3d6+3) perforante." },
    {
      name: "Rayos Oculares",
      text: "Dispara al azar uno de estos rayos mágicos contra un objetivo que vea a 36 m (tira 1d10; repite si ya usó ese rayo este turno). Todas las salvaciones son CD 16. 1 Encanto: Sabiduría; fallo 13 (3d8) psíquico y queda Encantado 1 hora o hasta sufrir daño; éxito, mitad de daño. 2 Parálisis: Constitución; fallo, Paralizado y repite la salvación al final de cada turno suyo, y al cabo de 1 minuto la supera sola. 3 Miedo: Sabiduría; fallo 14 (4d6) psíquico y Asustado hasta el final de su siguiente turno; éxito, mitad. 4 Lentitud: Constitución; fallo 18 (4d8) necrótico y hasta el final de su siguiente turno tiene la Velocidad a la mitad, no puede reaccionar y solo puede usar acción o acción adicional, no ambas; éxito, mitad. 5 Enervación: Constitución; fallo 13 (3d8) de veneno y Envenenado hasta el final de su siguiente turno, sin poder recuperar puntos de golpe mientras dure; éxito, mitad. 6 Telequinesis: Fuerza (la supera sola si es Gargantuesco); fallo, el contemplador lo mueve hasta 9 m en cualquier dirección y queda Apresado hasta el inicio del siguiente turno del contemplador o hasta que este quede Incapacitado; también sirve para manipular objetos con precisión. 7 Sueño: Sabiduría (la supera sola si es Constructo o No Muerto); fallo, Inconsciente 1 minuto, y acaba si sufre daño o si alguien a 1,5 m dedica una acción a despertarlo. 8 Petrificación: Constitución; primer fallo, Apresado y repite al final de su siguiente turno; segundo fallo, Petrificado. 9 Desintegración: Destreza; fallo 36 (8d8) de fuerza, y si es un objeto no mágico o una creación de fuerza mágica, un cubo de 3 m se deshace en polvo; éxito, mitad. Falle o no: si es una criatura y el daño la deja a 0 puntos de golpe, se deshace en polvo. 10 Muerte: Destreza; fallo 55 (10d10) necrótico; éxito, mitad. Falle o no: muere si el rayo la deja a 0 puntos de golpe.",
    },
  ],
  bonusActions: [
    { name: "Cono Antimagia", text: "Su ojo central emite una onda antimagia en un cono de 45 m. Hasta el inicio de su siguiente turno esa zona funciona como un conjuro de Campo Antimagia, y afecta también a sus propios Rayos Oculares." },
  ],
  legendary: [
    { name: "Dentellada", text: "Hace dos ataques de Mordisco." },
    { name: "Fulminar", text: "Usa Rayos Oculares." },
  ],
  blurb: "Tirano flotante de un ojo enorme y diez tallos oculares, cada uno con su propio poder. Odia a los de su especie más que a nadie.",
  habitat: "Underdark",
  treasure: "Arcano",
};

export const COMANDANTE_BERSERKER: Monster = {
  slug: "comandante-berserker",
  name: "Comandante Berserker",
  nameEn: "Berserker Commander",
  size: "Mediano o Pequeño",
  type: "Humanoide",
  alignment: "Neutral",
  ac: 16,
  initiative: 5,
  hp: 136,
  hpFormula: "16d8 + 64",
  speeds: "12 m",
  abilities: { fue: 19, des: 14, con: 19, int: 10, sab: 14, car: 9 },
  saves: "Fue +7, Con +7, Sab +2",
  skills: "Atletismo +7, Percepción +5",
  immunities: "Encantado, Asustado",
  gear: "Hacha a dos manos, jabalinas (6)",
  senses: "Percepción pasiva 15",
  languages: "Común",
  cr: "8",
  xp: 3900,
  pb: 3,
  traits: [
    { name: "Frenesí de Sangre", text: "Mientras esté Ensangrentado tiene ventaja en tiradas de ataque y salvaciones." },
  ],
  actions: [
    { name: "Multiataque", text: "Tres ataques con hacha a dos manos o jabalina en cualquier combinación." },
    { name: "Hacha a dos manos", text: "Ataque cuerpo a cuerpo: +7, alcance 1,5 m, 10 (1d12+4) cortante, más 10 (3d6) de trueno al objetivo o a otra criatura a 1,5 m de él." },
    { name: "Jabalina", text: "Ataque cuerpo a cuerpo o a distancia: +7, alcance 1,5 m o 9/36 m, 18 (4d6+4) perforante, y la Velocidad del objetivo baja 1,5 m hasta el inicio del siguiente turno del berserker." },
  ],
  bonusActions: [
    { name: "Carga Frenética", text: "Cada aliado a 9 m o menos puede usar su reacción para moverse hasta la mitad de su Velocidad sin provocar ataques de oportunidad. El comandante también puede moverse hasta la mitad de la suya sin provocarlos." },
  ],
  blurb: "Lleva las cicatrices de mil batallas y arrastra a los suyos a su mismo celo. Tira de magia primigenia para crecerse.",
  habitat: "Cualquiera",
  treasure: "Armamento, individual",
};

export const BERSERKER: Monster = {
  slug: "berserker",
  name: "Berserker",
  nameEn: "Berserker",
  size: "Mediano o Pequeño",
  type: "Humanoide",
  alignment: "Neutral",
  ac: 13,
  initiative: 1,
  hp: 67,
  hpFormula: "9d8 + 27",
  speeds: "9 m",
  abilities: { fue: 16, des: 12, con: 17, int: 9, sab: 11, car: 9 },
  gear: "Hacha a dos manos, armadura de pieles",
  senses: "Percepción pasiva 10",
  languages: "Común",
  cr: "2",
  xp: 450,
  pb: 2,
  traits: [
    { name: "Frenesí de Sangre", text: "Mientras esté Ensangrentado tiene ventaja en tiradas de ataque y salvaciones." },
  ],
  actions: [
    { name: "Hacha a dos manos", text: "Ataque cuerpo a cuerpo: +5, alcance 1,5 m, 9 (1d12+3) cortante." },
  ],
  blurb: "Invasor temerario y luchador de foso al que la adrenalina del combate le puede. Pelea por gloria o en hordas aullantes.",
  habitat: "Cualquiera",
  treasure: "Armamento, individual",
};

export const LOTE_07_MONSTERS: Monster[] = [
  CONTEMPLADOR,
  COMANDANTE_BERSERKER,
  BERSERKER,
];
