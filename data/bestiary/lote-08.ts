// Bestiario D&D 2024 — LOTE 08. Monster Manual 2024, página 38 del libro
// (41 del PDF), leída de la página renderizada.
//
// Convención de troceo y criterio: ver la cabecera de `lote-01.ts`.
// Arrancan los DRAGONES. Cada color trae cuatro edades (cría, joven, adulto,
// anciano) y son cuatro statblocks distintos, no variantes: cambian CR, tamaño,
// dados de golpe y aliento. Para el DESPIECE, en cambio, las cuatro edades caen
// en la MISMA familia (`data/bestiary/familias.ts`): la escama sigue siendo de
// dragón negro. Lo que separa allí es el color.
import type { Monster } from "./types";

export const CRIA_DRAGON_NEGRO: Monster = {
  slug: "cria-dragon-negro",
  name: "Cría de Dragón Negro",
  nameEn: "Black Dragon Wyrmling",
  size: "Mediano",
  type: "Dragón (cromático)",
  alignment: "Caótico Malvado",
  ac: 17,
  initiative: 4,
  hp: 33,
  hpFormula: "6d8 + 6",
  speeds: "9 m, vuelo 18 m, nadar 9 m",
  abilities: { fue: 15, des: 14, con: 13, int: 10, sab: 11, car: 13 },
  saves: "Des +4, Sab +2",
  skills: "Percepción +4, Sigilo +4",
  immunities: "Ácido",
  senses: "Visión ciega 3 m, visión en la oscuridad 18 m; Percepción pasiva 14",
  languages: "Dracónico",
  cr: "2",
  xp: 450,
  pb: 2,
  traits: [
    { name: "Anfibio", text: "Respira aire y agua." },
  ],
  actions: [
    { name: "Multiataque", text: "Dos ataques de Desgarro." },
    { name: "Desgarro", text: "Ataque cuerpo a cuerpo: +4, alcance 1,5 m, 5 (1d6+2) cortante más 2 (1d4) de ácido." },
    { name: "Aliento Ácido (Recarga 5-6)", text: "Salvación de Destreza CD 11 para cada criatura en una línea de 4,5 m de largo por 1,5 m de ancho. Fallo: 22 (5d8) de ácido. Éxito: la mitad." },
  ],
  blurb: "Acecha en ciénagas y aguas corrompidas buscando presas fáciles. Las recién salidas del huevo se matan entre ellas por la nidada.",
  habitat: "Pantano",
  treasure: "Reliquias",
};

export const DRAGON_NEGRO_JOVEN: Monster = {
  slug: "dragon-negro-joven",
  name: "Dragón Negro Joven",
  nameEn: "Young Black Dragon",
  size: "Grande",
  type: "Dragón (cromático)",
  alignment: "Caótico Malvado",
  ac: 18,
  initiative: 5,
  hp: 127,
  hpFormula: "15d10 + 45",
  speeds: "12 m, vuelo 24 m, nadar 12 m",
  abilities: { fue: 19, des: 14, con: 17, int: 12, sab: 11, car: 15 },
  saves: "Des +5, Con +3, Sab +3, Car +2",
  skills: "Percepción +6, Sigilo +5",
  immunities: "Ácido",
  senses: "Visión ciega 9 m, visión en la oscuridad 36 m; Percepción pasiva 16",
  languages: "Común, dracónico",
  cr: "7",
  xp: 2900,
  pb: 3,
  traits: [
    { name: "Anfibio", text: "Respira aire y agua." },
  ],
  actions: [
    { name: "Multiataque", text: "Tres ataques de Desgarro." },
    { name: "Desgarro", text: "Ataque cuerpo a cuerpo: +7, alcance 3 m, 9 (2d4+4) cortante más 3 (1d6) de ácido." },
    { name: "Aliento Ácido (Recarga 5-6)", text: "Salvación de Destreza CD 14 para cada criatura en una línea de 9 m de largo por 1,5 m de ancho. Fallo: 49 (14d6) de ácido. Éxito: la mitad." },
  ],
  blurb: "Reclama una guarida escondida tras ruinas mortales o una ciénaga traicionera, y somete a kóbolds y trogloditas a su servicio.",
  habitat: "Pantano",
  treasure: "Reliquias",
};

export const LOTE_08_MONSTERS: Monster[] = [CRIA_DRAGON_NEGRO, DRAGON_NEGRO_JOVEN];
