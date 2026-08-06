// Bestiario D&D 2024 — LOTE 06. Monster Manual 2024, páginas 32 y 34 del libro
// (35 y 37 del PDF), leídas de la página renderizada.
//
// Convención de troceo y criterio: ver la cabecera de `lote-01.ts`.
// Los dos de este lote los CITA el catálogo de materiales (Sangre de Basilisco,
// Lente de Ojo de Basilisco, Hueso de Behemoth…), así que desbloquean parte de
// la tabla de despiece.
import type { Monster } from "./types";

export const BASILISCO: Monster = {
  slug: "basilisco",
  name: "Basilisco",
  nameEn: "Basilisk",
  size: "Mediano",
  type: "Monstruosidad",
  alignment: "Sin alineamiento",
  ac: 15,
  initiative: -1,
  hp: 52,
  hpFormula: "8d8 + 16",
  speeds: "6 m",
  abilities: { fue: 16, des: 8, con: 15, int: 2, sab: 8, car: 7 },
  senses: "Visión en la oscuridad 18 m; Percepción pasiva 9",
  languages: "Ninguno",
  cr: "3",
  xp: 700,
  pb: 2,
  actions: [
    { name: "Mordisco", text: "Ataque cuerpo a cuerpo: +5, alcance 1,5 m, 10 (2d6+3) perforante más 7 (2d6) de veneno." },
  ],
  bonusActions: [
    { name: "Mirada Petrificante (Recarga 4-6)", text: "Salvación de Constitución CD 12 para cada criatura en un cono de 9 m. Si el basilisco ve su propio reflejo en el cono, tiene que hacer él la salvación. Primer fallo: el objetivo queda Apresado y repite la salvación al final de su siguiente turno si sigue Apresado, librándose al superarla. Segundo fallo: queda Petrificado en vez de Apresado." },
  ],
  blurb: "Depredador pesado de ocho patas y espinas cristalinas. No persigue: petrifica con la mirada y devora a su ritmo.",
  habitat: "Montaña, Underdark",
  treasure: "Cualquiera",
};

export const BEHIR: Monster = {
  slug: "behir",
  name: "Behir",
  nameEn: "Behir",
  size: "Enorme",
  type: "Monstruosidad",
  alignment: "Neutral Malvado",
  ac: 17,
  initiative: 3,
  hp: 168,
  hpFormula: "16d12 + 64",
  speeds: "15 m, trepar 15 m",
  abilities: { fue: 23, des: 16, con: 18, int: 7, sab: 14, car: 12 },
  skills: "Percepción +6, Sigilo +7",
  immunities: "Relámpago",
  senses: "Visión en la oscuridad 27 m; Percepción pasiva 16",
  languages: "Dracónico",
  cr: "11",
  xp: 7200,
  pb: 4,
  actions: [
    { name: "Multiataque", text: "Un ataque de Mordisco y usa Constreñir." },
    { name: "Mordisco", text: "Ataque cuerpo a cuerpo: +10, alcance 3 m, 19 (2d12+6) perforante más 11 (2d10) de relámpago." },
    { name: "Constreñir", text: "Salvación de Fuerza CD 18 para una criatura Grande o menor que vea a 1,5 m. Fallo: 28 (5d8+6) contundente, queda Agarrada (CD 16 para escapar) y Apresada hasta que acabe el agarre." },
    { name: "Aliento de Relámpago (Recarga 5-6)", text: "Salvación de Destreza CD 16 para cada criatura en una línea de 27 m de largo por 1,5 m de ancho. Fallo: 66 (12d10) de relámpago. Éxito: la mitad." },
  ],
  bonusActions: [
    { name: "Engullir", text: "Salvación de Destreza CD 18 para una criatura Grande o menor que tenga Agarrada (solo puede tener una engullida a la vez). Fallo: se la traga y deja de estar Agarrada. Dentro queda Cegada y Apresada, tiene cobertura total contra lo de fuera y sufre 21 (6d6) de ácido al inicio de cada turno del behir. Si el behir recibe 30 o más de daño en un turno de parte de la criatura engullida, debe superar una salvación de Constitución CD 14 al final de ese turno o la regurgita a 3 m de sí, Derribada. Si el behir muere, la criatura deja de estar Apresada y sale del cadáver gastando 4,5 m de movimiento, Derribada." },
  ],
  blurb: "Reptil de doce patas que corre por suelos y paredes tras su siguiente comida, y fulmina con relámpago lo que no alcanza.",
  habitat: "Underdark",
  treasure: "Cualquiera",
};

export const LOTE_06_MONSTERS: Monster[] = [BASILISCO, BEHIR];
