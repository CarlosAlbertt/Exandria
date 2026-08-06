// Bestiario D&D 2024 — LOTE 01. Fuente: Monster Manual 2024, páginas 16-17 del
// libro (19-20 del PDF), leídas de la página RENDERIZADA.
//
// ⚠️ **Cambio de convención, y va explicado**: los trozos anteriores van por CR
// (`cr-0`, `cr-12`, `cr-14`, `cr-18`). A partir de aquí van por LOTE DE
// EXTRACCIÓN, en orden de página. El motivo es que el manual está ordenado
// ALFABÉTICAMENTE: trocear por CR obligaría a recorrer las mismas 366 páginas
// una vez por cada rango, y cada página cuesta una lectura visual porque la
// capa OCR entrelaza las dos columnas y destroza las cabeceras («Basrrrsr» por
// «Basilisk»). Por lote, cada página se lee UNA vez y el avance se sabe con
// mirar hasta qué página llegó el último lote.
//
// Datos mecánicos = hechos de juego. Los `blurb` y el texto de rasgos y
// acciones son redacción PROPIA y concisa: del manual no se copia ni se traduce
// prosa. Distancias en metros (5 ft = 1,5 m).
import type { Monster } from "./types";

// Los objetos animados comparten entrada en el manual y las mismas
// inmunidades: son objetos, no criaturas.
const INMUNIDADES_OBJETO =
  "Veneno, Psíquico; Encantado, Ensordecido, Agotamiento, Asustado, Paralizado, Petrificado, Envenenado";

export const ARMADURA_ANIMADA: Monster = {
  slug: "armadura-animada",
  name: "Armadura Animada",
  nameEn: "Animated Armor",
  size: "Mediano",
  type: "Constructo",
  alignment: "Sin alineamiento",
  ac: 18,
  initiative: 2,
  hp: 33,
  hpFormula: "6d8 + 6",
  speeds: "7,5 m",
  abilities: { fue: 14, des: 11, con: 13, int: 1, sab: 3, car: 1 },
  immunities: INMUNIDADES_OBJETO,
  senses: "Visión ciega 18 m; Percepción pasiva 6",
  languages: "Ninguno",
  cr: "1",
  xp: 200,
  pb: 2,
  actions: [
    { name: "Multiataque", text: "Hace dos ataques de Golpe." },
    { name: "Golpe", text: "Ataque cuerpo a cuerpo: +4, alcance 1,5 m, 5 (1d6+2) contundente." },
  ],
  blurb: "Arnés vacío que se mueve solo, con andares rígidos o pausados. Suele confundirse con un soldado hasta que ataca.",
  habitat: "Urbano",
  treasure: "Ninguno",
};

export const ALFOMBRA_ASFIXIANTE: Monster = {
  slug: "alfombra-asfixiante",
  name: "Alfombra Asfixiante",
  nameEn: "Animated Rug of Smothering",
  size: "Grande",
  type: "Constructo",
  alignment: "Sin alineamiento",
  ac: 12,
  initiative: 4,
  hp: 27,
  hpFormula: "5d10",
  speeds: "3 m",
  abilities: { fue: 17, des: 14, con: 10, int: 1, sab: 3, car: 1 },
  immunities: INMUNIDADES_OBJETO,
  senses: "Visión ciega 18 m; Percepción pasiva 6",
  languages: "Ninguno",
  cr: "2",
  xp: 450,
  pb: 2,
  actions: [
    {
      name: "Asfixiar",
      text: "Ataque cuerpo a cuerpo: +5, alcance 1,5 m, 10 (2d6+3) contundente. Contra un objetivo Mediano o menor puede, en vez de dañar, dejarlo Agarrado (CD 13 para escapar); mientras dure, el objetivo queda Cegado y Apresado, se asfixia y sufre 10 (2d6+3) contundente al inicio de cada uno de sus turnos. Solo puede asfixiar a uno a la vez. Mientras agarra no puede repetir esta acción, reduce a la mitad el daño que recibe (redondeando hacia abajo) y el objetivo sufre ese mismo daño.",
    },
  ],
  blurb: "Tapiz que ataca a quien lo pisa, o que se hace pasar por un objeto mágico hasta que alguien dice la palabra de mando.",
  habitat: "Urbano",
  treasure: "Ninguno",
};

// ⚠️ La Escoba Animada y la Espada Voladora Animada salen en estas mismas
// páginas y NO están aquí: ya estaban en `cr-14.ts`. Las extraje sin mirar y el
// gate de slugs únicos las cazó. **Antes de escribir un monstruo hay que
// cruzarlo con `ALL_MONSTERS`**, no solo con el censo del manual.
export const LOTE_01_MONSTERS: Monster[] = [
  ARMADURA_ANIMADA,
  ALFOMBRA_ASFIXIANTE,
];
