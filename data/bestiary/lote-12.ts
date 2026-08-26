// Bestiario D&D 2024 — LOTE 12. Los bocetos de la ESPESURA de la Expansión Verdante.
//
// ⚠️ **Lote DIRIGIDO, como el 10 y el 11.** Son once de las entradas de la
// franja `espesura` de `ENCUENTROS_VERDANTE` (`data/bosque.ts`) que estaban
// escritas sin ficha: la tabla las ofrecía y `jugablesDe("espesura")` las
// descartaba en silencio. Era la franja rota de verdad — 8 jugables de 21 —
// mientras el gate la daba por buena, porque el mínimo son 5.
//
// Páginas del libro 62, 107, 115, 158, 164, 234, 238, 268, 276, 323 y 352
// (64, 109, 117, 160, 166, 236, 240, 270, 278, 325 y 354 del PDF), TODAS leídas
// de la página RENDERIZADA. La capa OCR de este PDF interleava las dos columnas
// y no vale ni para los números.
//
// ⚠️ **Dos nombres que el índice del Manual corrigió**, y que se habrían
// escrito mal de fiarse del sentido común:
//   · «Sátiro Juerguista» no es *Satyr Reveler* sino **Satyr Revelmaster**, y es
//     CR 6, no un sátiro de refuerzo: pega tres veces por turno y encanta.
//   · «Lobo Huargo» es el **Dire Wolf** del Apéndice A. El índice trae también
//     un *Dire Worg* (p. 335) y la elección no es obvia; se ha ido a Dire Wolf
//     porque la nota de la tabla dice «el lobo de la linde, pero grande», y el
//     Huargo ya está en la tabla como entrada aparte. Si la intención era el
//     Dire Worg, esto se cambia con el statblock de la p. 335.
//
// El Lobo Huargo sale del **Apéndice A (Animales)**, que no trae línea de
// Hábitat ni Tesoro: va sin esos campos. Los otros diez sí los traen.
//
// ⚠️ **El hábitat es un hecho del manual, no una decisión de la mesa.** El Ser
// del Agua dice «Underdark, Urban» y la Arpía y el Peryton hablan de colinas y
// montañas: se copian tal cual aunque la campaña los use en el bosque. Que un
// bicho salga en la Expansión Verdante lo decide `ENCUENTROS_VERDANTE`, no esto.
//
// Convención de troceo y criterio: ver la cabecera de `lote-01.ts`. Distancias
// en metros (5 ft = 1,5 m). Blurbs y texto de rasgos y acciones son redacción
// propia y concisa; del manual no se copia prosa.
import type { Monster } from "./types";

export const MONTICULO_REPTANTE: Monster = {
  slug: "monticulo-reptante",
  name: "Montículo Reptante",
  nameEn: "Shambling Mound",
  size: "Grande",
  type: "Planta",
  alignment: "Sin alineamiento",
  ac: 15,
  initiative: -1,
  hp: 110,
  hpFormula: "13d10 + 39",
  speeds: "9 m, nadar 6 m",
  abilities: { fue: 18, des: 8, con: 16, int: 5, sab: 10, car: 5 },
  skills: "Sigilo +3",
  resistances: "Frío, fuego",
  immunities: "Relámpago; ensordecido, agotamiento",
  senses: "Visión ciega 18 m; Percepción pasiva 10",
  languages: "Ninguno",
  cr: "5",
  xp: 1800,
  pb: 3,
  traits: [
    { name: "Absorción de Relámpago", text: "Cuando recibe daño de relámpago, recupera tantos PG como daño le habría hecho." },
  ],
  actions: [
    { name: "Multiataque", text: "Tres ataques de Zarcillo Cargado. Puede cambiar uno por un Engullir." },
    { name: "Zarcillo Cargado", text: "Ataque de arma: +7, alcance 3 m, 7 (1d6+4) contundente y 5 (2d4) relámpago. Si el objetivo es Mediano o menor, lo arrastra 1,5 m hacia sí." },
    { name: "Engullir", text: "Salvación de Fuerza CD 15 a una criatura Mediana o menor a 1,5 m. Fallo: es arrastrada al espacio del montículo y queda Apresada (escapar CD 14). Mientras dure, está Cegada y Restringida y sufre 10 (3d6) relámpago al principio de cada uno de sus turnos. Si el montículo se mueve, se la lleva sin gastar movimiento extra. Solo puede tener a una criatura así a la vez." },
  ],
  blurb: "Masa de vegetación podrida que se levanta y anda. Lo que atrapa acaba dentro, haciendo de compost.",
  habitat: "Bosque, pantano",
  treasure: "Ninguno",
};

export const SER_DEL_AGUA: Monster = {
  slug: "ser-del-agua",
  name: "Ser del Agua",
  nameEn: "Water Weird",
  size: "Grande",
  type: "Elemental",
  alignment: "Neutral",
  ac: 13,
  initiative: 3,
  hp: 65,
  hpFormula: "10d10 + 10",
  speeds: "1,5 m, nadar 18 m",
  abilities: { fue: 17, des: 16, con: 13, int: 11, sab: 10, car: 10 },
  resistances: "Fuego",
  immunities: "Veneno; agotamiento, apresado, paralizado, petrificado, envenenado, derribado, restringido, inconsciente",
  senses: "Visión ciega 9 m; Percepción pasiva 10",
  languages: "Entiende primordial pero no habla",
  cr: "3",
  xp: 700,
  pb: 2,
  traits: [
    { name: "Invisible en el Agua", text: "Está Invisible mientras esté completamente sumergido." },
    { name: "Atado al Agua", text: "Muere si sale del agua a la que está atado o si esa agua se destruye." },
  ],
  actions: [
    { name: "Embate", text: "Ataque de arma: +5, alcance 3 m, 13 (3d6+3) frío. Si el objetivo es Mediano o menor, queda Apresado (escapar CD 13) y Restringido mientras dure la presa." },
  ],
  blurb: "Espíritu serpentino que guarda una charca o una fuente. Dentro del agua no se distingue del agua, hasta que se levanta.",
  habitat: "Underdark, urbano",
  treasure: "Cualquiera",
};

export const LOBO_HUARGO: Monster = {
  slug: "lobo-huargo",
  name: "Lobo Huargo",
  nameEn: "Dire Wolf",
  size: "Grande",
  type: "Bestia",
  alignment: "Sin alineamiento",
  ac: 14,
  initiative: 2,
  hp: 22,
  hpFormula: "3d10 + 6",
  speeds: "15 m",
  abilities: { fue: 17, des: 15, con: 15, int: 3, sab: 12, car: 7 },
  skills: "Percepción +5, Sigilo +4",
  senses: "Visión en la oscuridad 18 m; Percepción pasiva 15",
  languages: "Ninguno",
  cr: "1",
  xp: 200,
  pb: 2,
  traits: [
    { name: "Tácticas de Manada", text: "Tiene Ventaja en el ataque si un aliado suyo está a 1,5 m del objetivo y no está Incapacitado." },
  ],
  actions: [
    { name: "Mordisco", text: "Ataque de arma: +5, alcance 1,5 m, 8 (1d10+3) perforante. Si el objetivo es Grande o menor, queda Derribado." },
  ],
  blurb: "El lobo del bosque profundo, del tamaño de un poni. Caza en manada y derriba antes de morder.",
};

export const OSGO_ACECHADOR: Monster = {
  slug: "osgo-acechador",
  name: "Osgo Acechador",
  nameEn: "Bugbear Stalker",
  size: "Mediano",
  type: "Feérico (Goblinoide)",
  alignment: "Caótico Malvado",
  ac: 15,
  initiative: 2,
  hp: 65,
  hpFormula: "10d8 + 20",
  speeds: "9 m",
  abilities: { fue: 17, des: 14, con: 14, int: 11, sab: 12, car: 11 },
  saves: "Constitución +4, Sabiduría +3",
  skills: "Sigilo +6, Supervivencia +3",
  gear: "Camisote de mallas, jabalinas (6), lucero del alba",
  senses: "Visión en la oscuridad 18 m; Percepción pasiva 11",
  languages: "Común, goblin",
  cr: "3",
  xp: 700,
  pb: 2,
  traits: [
    { name: "Secuestrar", text: "No gasta movimiento extra por mover a una criatura que tenga Apresada." },
  ],
  actions: [
    { name: "Multiataque", text: "Dos ataques de Jabalina o de Lucero del Alba." },
    { name: "Jabalina", text: "Ataque de arma cuerpo a cuerpo o a distancia: +5, alcance 3 m o distancia 9/36 m, 13 (3d6+3) perforante." },
    { name: "Lucero del Alba", text: "Ataque de arma: +5 (con Ventaja si el objetivo está Apresado por el osgo), alcance 3 m, 12 (2d8+3) perforante." },
  ],
  bonusActions: [
    { name: "Presa Rápida", text: "Salvación de Destreza CD 13 a una criatura Mediana o menor que vea a 3 m. Fallo: queda Apresada (escapar CD 13)." },
  ],
  blurb: "Goblinoide grande y callado que sigue a su presa durante días. Prefiere llevarse viva a la gente antes que matarla.",
  habitat: "Bosque, pradera, Planar (Feywild), Underdark",
  treasure: "Armamento, individual",
};

export const DRIADE: Monster = {
  slug: "driade",
  name: "Dríade",
  nameEn: "Dryad",
  size: "Mediano",
  type: "Feérico",
  alignment: "Neutral",
  ac: 16,
  initiative: 1,
  hp: 22,
  hpFormula: "5d8",
  speeds: "9 m",
  abilities: { fue: 10, des: 12, con: 11, int: 14, sab: 15, car: 18 },
  skills: "Percepción +4, Sigilo +5",
  senses: "Visión en la oscuridad 18 m; Percepción pasiva 14",
  languages: "Élfico, silvano",
  cr: "1",
  xp: 200,
  pb: 2,
  traits: [
    { name: "Resistencia Mágica", text: "Ventaja en salvaciones contra conjuros y otros efectos mágicos." },
    { name: "Hablar con Bestias y Plantas", text: "Se comunica con bestias y plantas como si compartieran idioma." },
  ],
  actions: [
    { name: "Multiataque", text: "Un ataque de Latigazo de Liana o de Estallido de Espinas, y puede usar Lanzamiento de Conjuros para lanzar Encantar Monstruo." },
    { name: "Latigazo de Liana", text: "Ataque de arma: +6, alcance 3 m, 8 (1d8+4) cortante." },
    { name: "Estallido de Espinas", text: "Ataque de arma a distancia: +6, distancia 18 m, 7 (1d6+4) perforante." },
    { name: "Lanzamiento de Conjuros", text: "Lanza sin componentes materiales, usando Carisma (salvación CD 14). A voluntad: Amistad con los Animales, Encantar Monstruo (dura 24 horas; termina antes si lo vuelve a lanzar), Trucos de Druida. 1/día cada uno: Enredar, Pasar sin Rastro." },
  ],
  bonusActions: [
    { name: "Paso Arbóreo", text: "Estando a 1,5 m de un árbol Grande o mayor, se teletransporta a un espacio libre a 1,5 m de otro árbol Grande o mayor que esté a 18 m del primero." },
  ],
  blurb: "Guardiana atada a un árbol concreto, del que enferma si lo talan. Enreda al que entra sin permiso antes que pelear.",
  habitat: "Bosque",
  treasure: "Cualquiera",
};

export const SATIRO_JUERGUISTA: Monster = {
  slug: "satiro-juerguista",
  name: "Sátiro Juerguista",
  nameEn: "Satyr Revelmaster",
  size: "Mediano",
  type: "Feérico",
  alignment: "Caótico Neutral",
  ac: 17,
  initiative: 7,
  hp: 82,
  hpFormula: "15d8 + 15",
  speeds: "12 m",
  abilities: { fue: 12, des: 18, con: 12, int: 12, sab: 14, car: 17 },
  saves: "Destreza +7, Sabiduría +5",
  skills: "Acrobacias +7, Percepción +5, Interpretación +9",
  senses: "Percepción pasiva 15",
  languages: "Común, élfico, silvano",
  cr: "6",
  xp: 2300,
  pb: 3,
  traits: [
    { name: "Resistencia Mágica", text: "Ventaja en salvaciones contra conjuros y otros efectos mágicos." },
  ],
  actions: [
    { name: "Multiataque", text: "Tres ataques de Cabriola." },
    { name: "Cabriola", text: "Ataque de arma: +7, alcance 1,5 m, 13 (2d8+4) contundente, y el objetivo queda Encantado hasta el principio del siguiente turno del sátiro." },
    { name: "Melodía Feérica (recarga 4-6)", text: "Salvación de Sabiduría CD 14 a cada enemigo en una emanación de 18 m. Fallo: sufre el efecto de la canción. Encantadora: queda Encantado 1 minuto; mientras lo esté está Incapacitado y gasta todo su movimiento bailando en el sitio, y el efecto acaba si sufre daño. Aterradora: 10 (2d6+3) psíquico y queda Asustado 1 minuto; acaba si termina su turno fuera de la línea de visión del sátiro." },
  ],
  blurb: "El que lleva la fiesta, y decide con la música si te quedas a bailar o sales corriendo. Mucho más peligroso que un sátiro cualquiera.",
  habitat: "Bosque, Planar (Feywild)",
  treasure: "Utensilios",
};

export const OSO_LECHUZA: Monster = {
  slug: "oso-lechuza",
  name: "Oso Lechuza",
  nameEn: "Owlbear",
  size: "Grande",
  type: "Monstruosidad",
  alignment: "Sin alineamiento",
  ac: 13,
  initiative: 1,
  hp: 59,
  hpFormula: "7d10 + 21",
  speeds: "12 m, trepar 12 m",
  abilities: { fue: 20, des: 12, con: 17, int: 3, sab: 12, car: 7 },
  skills: "Percepción +5",
  senses: "Visión en la oscuridad 18 m; Percepción pasiva 15",
  languages: "Ninguno",
  cr: "3",
  xp: 700,
  pb: 2,
  actions: [
    { name: "Multiataque", text: "Dos ataques de Desgarro." },
    { name: "Desgarro", text: "Ataque de arma: +7, alcance 1,5 m, 14 (2d8+5) cortante." },
  ],
  blurb: "Cuerpo de oso, ojos y pico de búho. Sigue un rastro durante kilómetros y no suele soltar lo que ha empezado a cazar.",
  habitat: "Bosque",
  treasure: "Ninguno",
};

export const ETTERCAP: Monster = {
  slug: "ettercap",
  name: "Ettercap",
  nameEn: "Ettercap",
  size: "Mediano",
  type: "Monstruosidad",
  alignment: "Neutral Malvado",
  ac: 13,
  initiative: 2,
  hp: 44,
  hpFormula: "8d8 + 8",
  speeds: "9 m, trepar 9 m",
  abilities: { fue: 14, des: 15, con: 13, int: 7, sab: 12, car: 8 },
  skills: "Percepción +3, Sigilo +4, Supervivencia +3",
  senses: "Visión en la oscuridad 18 m; Percepción pasiva 13",
  languages: "Ninguno",
  cr: "2",
  xp: 450,
  pb: 2,
  traits: [
    { name: "Trepamuros", text: "Trepa superficies difíciles, techos incluidos, sin tirar." },
    { name: "Caminatelas", text: "Ignora las restricciones de movimiento por telarañas y sabe dónde está cualquier criatura en contacto con la misma tela." },
  ],
  actions: [
    { name: "Multiataque", text: "Un ataque de Mordisco y uno de Zarpazo." },
    { name: "Mordisco", text: "Ataque de arma: +4, alcance 1,5 m, 5 (1d6+2) perforante y 2 (1d4) veneno, y el objetivo queda Envenenado hasta el principio del siguiente turno del ettercap." },
    { name: "Zarpazo", text: "Ataque de arma: +4, alcance 1,5 m, 7 (2d4+2) cortante." },
    { name: "Hebra de Tela (recarga 5-6)", text: "Salvación de Destreza CD 12 a una criatura Grande o menor que vea a 9 m. Fallo: queda Restringida hasta que se destruya la tela (CA 10; 5 PG; vulnerable al fuego; inmune a contundente, veneno y psíquico)." },
  ],
  bonusActions: [
    { name: "Recoger Hilo", text: "Arrastra hasta 7,5 m en línea recta hacia sí a una criatura a 9 m que esté Restringida por su Hebra de Tela." },
  ],
  blurb: "Cazador con rasgos de araña que arrastra a sus presas a una guarida forrada de tela. Prefiere encapullarlas vivas y dejarlas ahí días.",
  habitat: "Bosque",
  treasure: "Utensilios",
};

export const GRICK: Monster = {
  slug: "grick",
  name: "Grick",
  nameEn: "Grick",
  size: "Mediano",
  type: "Aberración",
  alignment: "Sin alineamiento",
  ac: 14,
  initiative: 2,
  hp: 54,
  hpFormula: "12d8",
  speeds: "9 m, trepar 9 m",
  abilities: { fue: 14, des: 14, con: 11, int: 3, sab: 14, car: 5 },
  skills: "Sigilo +4",
  senses: "Visión en la oscuridad 18 m; Percepción pasiva 12",
  languages: "Ninguno",
  cr: "2",
  xp: 450,
  pb: 2,
  actions: [
    { name: "Multiataque", text: "Un ataque de Pico y uno de Tentáculos." },
    { name: "Pico", text: "Ataque de arma: +4, alcance 1,5 m, 9 (2d6+2) perforante." },
    { name: "Tentáculos", text: "Ataque de arma: +4, alcance 1,5 m, 7 (1d10+2) cortante. Si el objetivo es Mediano o menor, queda Apresado (escapar CD 12) por los cuatro tentáculos." },
  ],
  blurb: "Gusano con tentáculos que espera quieto entre las raíces y los derrubios. Lo único que delata su sitio son los huesos de lo anterior.",
  habitat: "Bosque, Underdark",
  treasure: "Cualquiera",
};

export const ARPIA: Monster = {
  slug: "arpia",
  name: "Arpía",
  nameEn: "Harpy",
  size: "Mediano",
  type: "Monstruosidad",
  alignment: "Caótico Malvado",
  ac: 11,
  initiative: 1,
  hp: 38,
  hpFormula: "7d8 + 7",
  speeds: "6 m, vuelo 12 m",
  abilities: { fue: 12, des: 13, con: 12, int: 7, sab: 10, car: 13 },
  senses: "Percepción pasiva 10",
  languages: "Común",
  cr: "1",
  xp: 200,
  pb: 2,
  actions: [
    { name: "Garra", text: "Ataque de arma: +3, alcance 1,5 m, 6 (2d4+1) cortante." },
    { name: "Canto Atrayente", text: "Canta una melodía mágica que dura mientras mantenga la Concentración. Salvación de Sabiduría CD 11 a cada Humanoide y Gigante en una emanación de 90 m al empezar el canto. Fallo: queda Encantado hasta que acabe el canto y repite la salvación al final de cada uno de sus turnos. Mientras esté Encantado está Incapacitado, ignora el canto de otras arpías y, si está a más de 1,5 m, se mueve hacia la arpía por el camino más directo sin evitar Ataques de Oportunidad; repite la salvación antes de entrar en terreno dañino y cada vez que sufra daño de otra fuente. Éxito: inmune al canto de ESA arpía durante 24 horas." },
  ],
  blurb: "Media mujer, media carroñera. No mata con las garras: canta hasta que vas tú solo a donde ella quiere.",
  habitat: "Costa, bosque, colina, montaña",
  treasure: "Cualquiera",
};

export const PERYTON: Monster = {
  slug: "peryton",
  name: "Peryton",
  nameEn: "Peryton",
  size: "Mediano",
  type: "Monstruosidad",
  alignment: "Caótico Malvado",
  ac: 13,
  initiative: 3,
  hp: 33,
  hpFormula: "6d8 + 6",
  speeds: "6 m, vuelo 18 m",
  abilities: { fue: 16, des: 12, con: 13, int: 9, sab: 12, car: 10 },
  skills: "Percepción +5, Sigilo +3",
  senses: "Percepción pasiva 15",
  languages: "Entiende común y élfico pero no habla",
  cr: "2",
  xp: 450,
  pb: 2,
  traits: [
    { name: "Sobrevuelo", text: "No provoca Ataques de Oportunidad al salir volando del alcance de un enemigo." },
  ],
  actions: [
    { name: "Multiataque", text: "Un ataque de Cornada y uno de Garras." },
    { name: "Cornada", text: "Ataque de arma: +5, alcance 1,5 m, 7 (1d8+3) perforante. Si el peryton se movió al menos 9 m en línea recta hacia el objetivo justo antes, sufre 9 (2d8) perforante adicional." },
    { name: "Garras", text: "Ataque de arma: +5, alcance 1,5 m, 8 (2d4+3) perforante. Si el ataque deja a 0 PG a un objetivo Humanoide, el peryton lo mata arrancándole el corazón." },
  ],
  blurb: "Cuerpo de ave grande y cabeza de ciervo con colmillos. Se lanza en picado, arranca el corazón y se lo lleva a su nido.",
  habitat: "Colina, montaña",
  treasure: "Armamento",
};

export const LOTE_12_MONSTERS: Monster[] = [
  MONTICULO_REPTANTE, SER_DEL_AGUA, LOBO_HUARGO, OSGO_ACECHADOR, DRIADE,
  SATIRO_JUERGUISTA, OSO_LECHUZA, ETTERCAP, GRICK, ARPIA, PERYTON,
];
