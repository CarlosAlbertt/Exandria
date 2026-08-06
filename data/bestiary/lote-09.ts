// Bestiario D&D 2024 — LOTE 09. Monster Manual 2024, páginas 39 y 40 del libro
// (42 y 43 del PDF), leídas de la página renderizada.
//
// Convención de troceo y criterio: ver la cabecera de `lote-01.ts`.
// Con estos dos, la familia del DRAGÓN NEGRO queda completa: cría, joven,
// adulto y anciano.
import type { Monster } from "./types";

export const DRAGON_NEGRO_ADULTO: Monster = {
  slug: "dragon-negro-adulto",
  name: "Dragón Negro Adulto",
  nameEn: "Adult Black Dragon",
  size: "Enorme",
  type: "Dragón (cromático)",
  alignment: "Caótico Malvado",
  ac: 19,
  initiative: 12,
  hp: 195,
  hpFormula: "17d12 + 85",
  speeds: "12 m, vuelo 24 m, nadar 12 m",
  abilities: { fue: 23, des: 14, con: 21, int: 14, sab: 13, car: 19 },
  saves: "Des +7, Con +5, Sab +6, Car +4",
  skills: "Percepción +11, Sigilo +7",
  immunities: "Ácido",
  senses: "Visión ciega 18 m, visión en la oscuridad 36 m; Percepción pasiva 21",
  languages: "Común, dracónico",
  cr: "14",
  xp: 11500,
  pb: 5,
  traits: [
    { name: "Anfibio", text: "Respira aire y agua." },
    { name: "Resistencia Legendaria (3/día, 4 en su guarida)", text: "Si falla una salvación, puede optar por superarla." },
  ],
  actions: [
    { name: "Multiataque", text: "Tres ataques de Desgarro. Puede cambiar uno por Lanzamiento de Conjuros para lanzar Flecha Ácida de Melf (versión de nivel 3)." },
    { name: "Desgarro", text: "Ataque cuerpo a cuerpo: +11, alcance 3 m, 13 (2d6+6) cortante más 4 (1d8) de ácido." },
    { name: "Aliento Ácido (Recarga 5-6)", text: "Salvación de Destreza CD 18 para cada criatura en una línea de 18 m de largo por 1,5 m de ancho. Fallo: 54 (12d8) de ácido. Éxito: la mitad." },
    { name: "Lanzamiento de Conjuros", text: "Lanza sin componentes materiales, con Carisma (CD 21 de salvación, +9 al ataque). A voluntad: Detectar Magia, Miedo, Flecha Ácida de Melf (versión de nivel 3). 1/día cada uno: Hablar con los Muertos, Esfera Vitriólica." },
  ],
  legendary: [
    { name: "Nube de Insectos", text: "Salvación de Destreza CD 17 para una criatura que vea a 36 m. Fallo: 22 (4d10) de veneno y desventaja en las salvaciones para mantener la Concentración hasta el final de su siguiente turno. Falle o no, no puede repetir esta acción hasta el inicio de su siguiente turno." },
    { name: "Presencia Aterradora", text: "Usa Lanzamiento de Conjuros para lanzar Miedo. No puede repetirla hasta el inicio de su siguiente turno." },
    { name: "Abalanzarse", text: "Se mueve hasta la mitad de su Velocidad y hace un ataque de Desgarro." },
  ],
  blurb: "Ya es de los mayores terrores de las tierras que reclama. Cultistas y agoreros se le arriman, y con ellos llegan los no muertos.",
  habitat: "Pantano",
  treasure: "Reliquias",
};

export const DRAGON_NEGRO_ANCIANO: Monster = {
  slug: "dragon-negro-anciano",
  name: "Dragón Negro Anciano",
  nameEn: "Ancient Black Dragon",
  size: "Gargantuesco",
  type: "Dragón (cromático)",
  alignment: "Caótico Malvado",
  ac: 22,
  initiative: 16,
  hp: 367,
  hpFormula: "21d20 + 147",
  speeds: "12 m, vuelo 24 m, nadar 12 m",
  abilities: { fue: 27, des: 14, con: 25, int: 16, sab: 15, car: 22 },
  saves: "Des +9, Con +7, Sab +9, Car +6",
  skills: "Percepción +16, Sigilo +9",
  immunities: "Ácido",
  senses: "Visión ciega 18 m, visión en la oscuridad 36 m; Percepción pasiva 26",
  languages: "Común, dracónico",
  cr: "21",
  xp: 33000,
  pb: 7,
  traits: [
    { name: "Anfibio", text: "Respira aire y agua." },
    { name: "Resistencia Legendaria (4/día, 5 en su guarida)", text: "Si falla una salvación, puede optar por superarla." },
  ],
  actions: [
    { name: "Multiataque", text: "Tres ataques de Desgarro. Puede cambiar uno por Lanzamiento de Conjuros para lanzar Flecha Ácida de Melf (versión de nivel 4)." },
    { name: "Desgarro", text: "Ataque cuerpo a cuerpo: +15, alcance 4,5 m, 17 (2d8+8) cortante más 9 (2d8) de ácido." },
    { name: "Aliento Ácido (Recarga 5-6)", text: "Salvación de Destreza CD 22 para cada criatura en una línea de 27 m de largo por 3 m de ancho. Fallo: 67 (15d8) de ácido. Éxito: la mitad." },
    { name: "Lanzamiento de Conjuros", text: "Lanza sin componentes materiales, con Carisma (CD 21 de salvación, +13 al ataque). A voluntad: Detectar Magia, Miedo, Flecha Ácida de Melf (versión de nivel 4). 1/día cada uno: Crear No Muerto, Hablar con los Muertos, Esfera Vitriólica (versión de nivel 5)." },
  ],
  legendary: [
    { name: "Nube de Insectos", text: "Salvación de Destreza CD 21 para una criatura que vea a 36 m. Fallo: 33 (6d10) de veneno y desventaja en las salvaciones para mantener la Concentración hasta el final de su siguiente turno. Falle o no, no puede repetir esta acción hasta el inicio de su siguiente turno." },
    { name: "Presencia Aterradora", text: "Usa Lanzamiento de Conjuros para lanzar Miedo. No puede repetirla hasta el inicio de su siguiente turno." },
    { name: "Abalanzarse", text: "Se mueve hasta la mitad de su Velocidad y hace un ataque de Desgarro." },
  ],
  blurb: "Trama la ruina de reinos enteros: busca magia para corromper la tierra, levantar hordas de no muertos y atar infernales.",
  habitat: "Pantano",
  treasure: "Reliquias",
};

export const LOTE_09_MONSTERS: Monster[] = [
  DRAGON_NEGRO_ADULTO,
  DRAGON_NEGRO_ANCIANO,
];
