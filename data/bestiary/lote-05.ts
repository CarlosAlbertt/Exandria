// Bestiario D&D 2024 — LOTE 05. Monster Manual 2024, páginas 30, 31 y 33 del
// libro (33, 34 y 36 del PDF), leídas de la página renderizada.
//
// Convención de troceo y criterio: ver la cabecera de `lote-01.ts`.
import type { Monster } from "./types";

export const DIABLO_ESPINOSO: Monster = {
  slug: "diablo-espinoso",
  name: "Diablo Espinoso",
  nameEn: "Barbed Devil",
  size: "Mediano",
  type: "Infernal (diablo)",
  alignment: "Legal Malvado",
  ac: 15,
  initiative: 3,
  hp: 110,
  hpFormula: "13d8 + 52",
  speeds: "9 m, trepar 9 m",
  abilities: { fue: 16, des: 17, con: 18, int: 12, sab: 14, car: 14 },
  saves: "Fue +6, Con +7, Sab +5, Car +5",
  skills: "Engaño +5, Perspicacia +5, Percepción +8",
  resistances: "Frío",
  immunities: "Fuego, veneno; Envenenado",
  senses: "Visión en la oscuridad 36 m (sin estorbo de la oscuridad mágica); Percepción pasiva 18",
  languages: "Infernal; telepatía 36 m",
  cr: "5",
  xp: 1800,
  pb: 3,
  traits: [
    { name: "Piel de Púas", text: "Al inicio de cada uno de sus turnos inflige 5 (1d10) perforante a cualquier criatura a la que esté agarrando o que lo esté agarrando a él." },
    { name: "Restauración Diabólica", text: "Si muere fuera de los Nueve Infiernos su cuerpo se deshace en humo sulfuroso y renace al instante allí con todos sus puntos de golpe." },
    { name: "Resistencia a la Magia", text: "Ventaja en las salvaciones contra conjuros y efectos mágicos." },
  ],
  actions: [
    { name: "Multiataque", text: "Un ataque de Garras y uno de Cola, o dos de Arrojar Llama." },
    { name: "Garras", text: "Ataque cuerpo a cuerpo: +6, alcance 1,5 m, 10 (2d6+3) perforante. Si el objetivo es Grande o menor, queda Agarrado con las dos garras (CD 13 para escapar)." },
    { name: "Cola", text: "Ataque cuerpo a cuerpo: +6, alcance 3 m, 14 (2d10+3) cortante." },
    { name: "Arrojar Llama", text: "Ataque a distancia: +5, alcance 45 m, 17 (5d6) de fuego. Si el objetivo es un objeto inflamable que nadie lleva puesto ni encima, empieza a arder." },
  ],
  blurb: "Coleccionista infernal que guarda su tesoro con fanatismo y adorna su piel de púas con sus trofeos más preciados.",
  habitat: "Planar (Nueve Infiernos)",
  treasure: "Cualquiera",
};

export const BARLGURA: Monster = {
  slug: "barlgura",
  name: "Barlgura",
  nameEn: "Barlgura",
  size: "Grande",
  type: "Infernal (demonio)",
  alignment: "Caótico Malvado",
  ac: 15,
  initiative: 2,
  hp: 85,
  hpFormula: "10d10 + 30",
  speeds: "12 m, trepar 12 m",
  abilities: { fue: 18, des: 15, con: 16, int: 7, sab: 14, car: 9 },
  saves: "Fue +4, Des +5, Con +6, Sab +2",
  skills: "Percepción +5, Sigilo +5",
  resistances: "Frío, fuego, relámpago",
  immunities: "Veneno; Envenenado",
  senses: "Visión ciega 9 m, visión en la oscuridad 36 m; Percepción pasiva 15",
  languages: "Abisal; telepatía 36 m",
  cr: "5",
  xp: 1800,
  pb: 3,
  traits: [
    { name: "Restauración Demoníaca", text: "Si muere fuera del Abismo su cuerpo se deshace en icor y renace al instante allí con todos sus puntos de golpe." },
  ],
  actions: [
    { name: "Multiataque", text: "Un ataque de Mordisco Atormentador y dos de Zarandeo." },
    { name: "Mordisco Atormentador", text: "Ataque cuerpo a cuerpo: +7, alcance 1,5 m, 11 (2d6+4) perforante más 13 (2d12) psíquico." },
    { name: "Zarandeo", text: "Ataque cuerpo a cuerpo: +7, alcance 1,5 m, 9 (1d10+4) contundente. Si el objetivo es Grande o menor, queda Derribado." },
    { name: "Lanzamiento de Conjuros", text: "Lanza sin componentes materiales, con Sabiduría (CD 13). 2/día cada uno: Disfrazarse, Invisibilidad (solo sobre sí mismo). 1/día cada uno: Enredar, Asesino Fantasmal (versión de nivel 6)." },
  ],
  bonusActions: [
    { name: "Salto", text: "Salta hasta 12 m gastando 3 m de movimiento." },
  ],
  blurb: "Demonio simiesco de brutalidad pura que caza a cuanto entra en su territorio y lo llena de iconos y restos de sus presas.",
  habitat: "Planar (Abismo)",
  treasure: "Cualquiera",
};

export const DIABLO_BARBUDO: Monster = {
  slug: "diablo-barbudo",
  name: "Diablo Barbudo",
  nameEn: "Bearded Devil",
  size: "Mediano",
  type: "Infernal (diablo)",
  alignment: "Legal Malvado",
  ac: 13,
  initiative: 2,
  hp: 58,
  hpFormula: "9d8 + 18",
  speeds: "9 m",
  abilities: { fue: 16, des: 15, con: 15, int: 9, sab: 11, car: 14 },
  saves: "Fue +5, Con +4, Car +4",
  resistances: "Frío",
  immunities: "Fuego, veneno; Asustado, Envenenado",
  senses: "Visión en la oscuridad 36 m (sin estorbo de la oscuridad mágica); Percepción pasiva 10",
  languages: "Infernal; telepatía 36 m",
  cr: "3",
  xp: 700,
  pb: 2,
  traits: [
    { name: "Resistencia a la Magia", text: "Ventaja en las salvaciones contra conjuros y efectos mágicos." },
  ],
  actions: [
    { name: "Multiataque", text: "Un ataque de Barba y uno de Guja Infernal." },
    { name: "Barba", text: "Ataque cuerpo a cuerpo: +5, alcance 1,5 m, 7 (1d8+3) perforante, y el objetivo queda Envenenado hasta el inicio del siguiente turno del diablo. Mientras dure ese veneno no puede recuperar puntos de golpe." },
    { name: "Guja Infernal", text: "Ataque cuerpo a cuerpo: +5, alcance 3 m, 8 (1d10+3) cortante. Si es una criatura y no tiene ya una herida infernal, salvación de Constitución CD 12. Al fallar recibe una herida infernal: pierde 5 (1d10) puntos de golpe al inicio de cada uno de sus turnos. La herida se cierra al cabo de 1 minuto, cuando un conjuro le devuelva puntos de golpe, o cuando el objetivo o alguien a 1,5 m dedique una acción a restañarla superando una prueba de Sabiduría (Medicina) CD 12." },
  ],
  blurb: "Soldado de las legiones infernales, con una barba de tentáculos con púas cuyo veneno impide curarse por magia.",
  habitat: "Planar (Nueve Infiernos)",
  treasure: "Armamento",
};

export const LOTE_05_MONSTERS: Monster[] = [
  DIABLO_ESPINOSO,
  BARLGURA,
  DIABLO_BARBUDO,
];
