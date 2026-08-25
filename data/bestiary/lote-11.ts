// Bestiario D&D 2024 — LOTE 11. Los bocetos de la LINDE de la Expansión Verdante.
//
// ⚠️ **Lote DIRIGIDO, como el 10 y a diferencia del 01-09** (que iban por el
// nombre inglés y llegaron hasta la D). Son las tres entradas de la franja
// `linde` de `ENCUENTROS_VERDANTE` (`data/bosque.ts`) que estaban escritas sin
// ficha: la tabla las ofrecía y `jugablesDe("linde")` las descartaba en
// silencio, así que en mesa no se podían sacar. Con estas tres, la linde pasa a
// estar completa (15 de 15).
//
// Páginas del libro 125, 350 y 359 (127, 352 y 361 del PDF), las tres leídas de
// la página RENDERIZADA. La capa OCR de este PDF interleava las dos columnas y
// no vale ni para los números — ya dio un «CR 5» falso para el Cíclope del lote
// 10, que es CR 6.
//
// El Oso Pardo y la Araña Gigante salen del **Apéndice A (Animales)**, que no
// trae línea de Hábitat ni Tesoro: por eso van sin esos campos, igual que el
// Jabalí y el Lobo que ya estaban. El Hongo Chillón sí los trae, de la cabecera
// de «Fungi» (Underdark / Ninguno) — y **sí, el libro lo pone en el Underdark**
// aunque la campaña lo use en el bosque: el campo es un hecho del manual, no
// una decisión de la mesa.
//
// Convención de troceo y criterio: ver la cabecera de `lote-01.ts`. Distancias
// en metros (5 ft = 1,5 m). Blurbs y texto de rasgos y acciones son redacción
// propia y concisa; del manual no se copia prosa.
import type { Monster } from "./types";

/**
 * ⚠️ **No tiene ni una acción, y no es un error de extracción.**
 *
 * El Hongo Chillón es CR 0 y su único recurso es una REACCIÓN: grita cuando algo
 * se le acerca. No pega, no se mueve del sitio y no hace nada en su turno. Es
 * exactamente lo que dice su nota en la tabla del bosque — «no hace daño: grita,
 * y lo que viene detrás sí».
 *
 * Esto obligó a aflojar `check-bestiary`, que exigía **al menos una acción** a
 * toda ficha. La regla estaba bien pensada y era demasiado fuerte: en el Manual
 * 2024 hay monstruos legales sin acciones. La alternativa era inventarle una, y
 * eso es falsificar el libro.
 */
export const HONGO_CHILLON: Monster = {
  slug: "hongo-chillon",
  name: "Hongo Chillón",
  nameEn: "Shrieker Fungus",
  size: "Mediano",
  type: "Planta",
  alignment: "Sin alineamiento",
  ac: 5,
  initiative: -5,
  hp: 13,
  hpFormula: "3d8",
  speeds: "1,5 m",
  abilities: { fue: 1, des: 1, con: 10, int: 1, sab: 3, car: 1 },
  immunities: "Cegado, Encantado, Ensordecido, Asustado",
  senses: "Visión ciega 9 m; Percepción pasiva 6",
  languages: "Ninguno",
  cr: "0",
  xp: 0,
  pb: 2,
  actions: [],
  reactions: [
    {
      name: "Chillido",
      text: "Desencadenante: una criatura o una fuente de Luz Brillante se mueve a 9 m o menos del hongo. Respuesta: emite un chillido audible a 90 m durante 1 minuto o hasta que el hongo muera.",
    },
  ],
  blurb: "Seta del tamaño de un hombre que grita cuando algo se le acerca. No es el peligro: es lo que avisa al peligro de que estás ahí.",
  habitat: "Underdark",
  treasure: "Ninguno",
};

export const OSO_PARDO: Monster = {
  slug: "oso-pardo",
  name: "Oso Pardo",
  nameEn: "Brown Bear",
  size: "Grande",
  type: "Bestia",
  alignment: "Sin alineamiento",
  ac: 11,
  initiative: 1,
  hp: 22,
  hpFormula: "3d10 + 6",
  speeds: "12 m, trepar 9 m",
  abilities: { fue: 17, des: 12, con: 15, int: 2, sab: 13, car: 7 },
  skills: "Percepción +3",
  senses: "Visión en la oscuridad 18 m; Percepción pasiva 13",
  languages: "Ninguno",
  cr: "1",
  xp: 200,
  pb: 2,
  actions: [
    { name: "Multiataque", text: "Un ataque de Mordisco y uno de Zarpazo." },
    { name: "Mordisco", text: "Ataque de arma: +5, alcance 1,5 m, 7 (1d8+3) perforante." },
    { name: "Zarpazo", text: "Ataque de arma: +5, alcance 1,5 m, 5 (1d4+3) cortante. Si el objetivo es Grande o menor, queda Derribado." },
  ],
  blurb: "Baja a las colmenas y a los graneros cuando el bosque no da de sí. Trepa mejor de lo que su tamaño hace pensar.",
};

export const ARANA_GIGANTE: Monster = {
  slug: "arana-gigante",
  name: "Araña Gigante",
  nameEn: "Giant Spider",
  size: "Grande",
  type: "Bestia",
  alignment: "Sin alineamiento",
  ac: 14,
  initiative: 3,
  hp: 26,
  hpFormula: "4d10 + 4",
  speeds: "9 m, trepar 9 m",
  abilities: { fue: 14, des: 16, con: 12, int: 2, sab: 11, car: 4 },
  skills: "Percepción +4, Sigilo +7",
  senses: "Visión en la oscuridad 18 m; Percepción pasiva 14",
  languages: "Ninguno",
  cr: "1",
  xp: 200,
  pb: 2,
  traits: [
    { name: "Trepamuros", text: "Trepa superficies difíciles, techos incluidos, sin tirar." },
    { name: "Caminatelas", text: "Ignora las restricciones de movimiento por telarañas y sabe dónde está cualquier criatura en contacto con la misma tela." },
  ],
  actions: [
    { name: "Mordisco", text: "Ataque de arma: +5, alcance 1,5 m, 7 (1d8+3) perforante y 7 (2d6) veneno." },
    { name: "Telaraña (recarga 5-6)", text: "Salvación de Destreza CD 13 a una criatura que vea a 18 m. Fallo: queda Apresada hasta que se destruya la tela (CA 10; 5 PG; vulnerable al fuego; inmune a veneno y psíquico)." },
  ],
  blurb: "Del tamaño de un perro grande y con la tela tendida entre las ramas bajas. Donde la tela tiene un orden, hay algo que la pastorea.",
};

export const LOTE_11_MONSTERS: Monster[] = [
  HONGO_CHILLON, OSO_PARDO, ARANA_GIGANTE,
];
