// Bestiario D&D 2024 — LOTE 02. Monster Manual 2024, páginas 18-21 del libro
// (21-24 del PDF), leídas de la página renderizada.
//
// Convención de troceo y criterio: ver la cabecera de `lote-01.ts`.
// Distancias en metros (5 ft = 1,5 m). Blurbs y texto de rasgos y acciones son
// redacción propia y concisa; del manual no se copia prosa.
import type { Monster } from "./types";

export const ANKHEG: Monster = {
  slug: "ankheg",
  name: "Ankheg",
  nameEn: "Ankheg",
  size: "Grande",
  type: "Monstruosidad",
  alignment: "Sin alineamiento",
  ac: 14,
  initiative: 0,
  hp: 45,
  hpFormula: "6d10 + 12",
  speeds: "9 m, excavar 3 m",
  abilities: { fue: 17, des: 11, con: 14, int: 1, sab: 13, car: 6 },
  senses: "Visión en la oscuridad 18 m, sentido sísmico 18 m; Percepción pasiva 11",
  languages: "Ninguno",
  cr: "2",
  xp: 450,
  pb: 2,
  traits: [
    { name: "Tunelador", text: "Excava roca sólida a la mitad de su velocidad de excavar y deja tras de sí un túnel de 3 m de diámetro." },
  ],
  actions: [
    { name: "Mordisco", text: "Ataque cuerpo a cuerpo: +5 (con ventaja si el objetivo ya está Agarrado por el ankheg), alcance 1,5 m, 10 (2d6+3) cortante más 3 (1d6) de ácido. Si el objetivo es Grande o menor, queda Agarrado (CD 13 para escapar)." },
    { name: "Rociada de Ácido (Recarga 6)", text: "Salvación de Destreza CD 12 para cada criatura en una línea de 9 m de largo por 1,5 m de ancho. Fallo: 14 (4d6) de ácido. Éxito: la mitad." },
  ],
  blurb: "Insecto descomunal que excava justo bajo la superficie y sale de golpe para disolver a sus presas con enzimas.",
  habitat: "Bosque, pradera",
  treasure: "Ninguno",
};

export const ARCANALOTH: Monster = {
  slug: "arcanaloth",
  name: "Arcanaloth",
  nameEn: "Arcanaloth",
  size: "Mediano",
  type: "Infernal (yugoloth)",
  alignment: "Neutral Malvado",
  ac: 17,
  initiative: 5,
  hp: 175,
  hpFormula: "27d8 + 54",
  speeds: "9 m, vuelo 9 m (flotando)",
  abilities: { fue: 17, des: 12, con: 14, int: 20, sab: 16, car: 17 },
  saves: "Des +5, Con +6, Int +9, Sab +7",
  skills: "Arcanos +9, Engaño +7, Perspicacia +7, Percepción +7",
  resistances: "Frío, fuego, relámpago",
  immunities: "Ácido, veneno; Encantado, Envenenado",
  senses: "Visión verdadera 36 m; Percepción pasiva 17",
  languages: "Todos; telepatía 36 m",
  cr: "12",
  xp: 8400,
  pb: 4,
  traits: [
    { name: "Restauración Infernal", text: "Si muere fuera de Gehenna su cuerpo se deshace en icor y renace al instante allí con todos sus puntos de golpe." },
    { name: "Resistencia a la Magia", text: "Ventaja en las salvaciones contra conjuros y efectos mágicos." },
    { name: "Tomo de Almas", text: "Lleva un tomo mágico; mientras lo sostenga puede usar Zarpa Desterradora. El tomo tiene CA 17, 35 PG e inmunidad a necrótico, veneno y psíquico; recupera todos sus PG al final de cada turno, pero se deshace en polvo si llega a 0 o si muere el arcanaloth, que puede crear otro al terminar un descanso." },
  ],
  actions: [
    { name: "Multiataque", text: "Tres ataques de Estallido Infernal; puede cambiar uno por Zarpa Desterradora." },
    { name: "Estallido Infernal", text: "Ataque cuerpo a cuerpo o a distancia: +9, alcance 1,5 m o 36 m, 31 (4d12+5) necrótico." },
    { name: "Zarpa Desterradora (requiere el Tomo de Almas)", text: "Ataque cuerpo a cuerpo: +9, alcance 1,5 m, 10 (2d4+5) cortante más 19 (3d12) psíquico. Si es una criatura, salvación de Carisma CD 17; al fallar queda atrapada e Incapacitada en un semiplano dentro del tomo, y repite la salvación al final de cada turno suyo para salir. Si falla tres veces queda ligada al tomo y solo escapa si este llega a 0 PG." },
    { name: "Lanzamiento de Conjuros", text: "Lanza sin componentes materiales, con Inteligencia (CD 17). A voluntad: Alterar el Propio Aspecto, Detectar Magia, Identificar, Mano de Mago, Prestidigitación. 1/día cada uno: Contactar con Otro Plano, Detectar Pensamientos, Puerta Dimensional, Mente en Blanco." },
  ],
  bonusActions: [
    { name: "Teletransporte", text: "Se teletransporta hasta 9 m a un espacio libre que vea." },
  ],
  reactions: [
    { name: "Contraconjuro", text: "Lanza Contraconjuro como reacción al disparador de ese conjuro, con la misma aptitud de lanzamiento." },
  ],
  blurb: "Yugoloth de cabeza de chacal que acapara secretos y los usa para enredar a víctimas y villanos menores con promesas falsas.",
  habitat: "Planar (planos inferiores)",
  treasure: "Arcano",
};

export const ARCHIBRUJA: Monster = {
  slug: "archibruja",
  name: "Archibruja",
  nameEn: "Arch-hag",
  size: "Grande",
  type: "Feérico",
  alignment: "Neutral Malvado",
  ac: 20,
  initiative: 16,
  hp: 333,
  hpFormula: "29d10 + 174",
  speeds: "12 m",
  abilities: { fue: 24, des: 15, con: 23, int: 19, sab: 19, car: 25 },
  saves: "Fue +7, Des +9, Con +6, Int +4, Sab +11, Car +7",
  skills: "Engaño +14, Percepción +11, Persuasión +21",
  resistances: "Frío, fuego, psíquico",
  immunities: "Encantado, Agotamiento, Asustado",
  senses: "Visión verdadera 18 m; Percepción pasiva 21",
  languages: "Todos",
  cr: "21",
  xp: 33000,
  pb: 7,
  traits: [
    { name: "Magia de Aquelarre", text: "A 9 m o menos de al menos dos brujas aliadas puede lanzar sin componentes materiales, con Inteligencia (CD 19): Augurio, Encontrar Familiar, Identificar, Localizar Objeto, Videncia o Sirviente Invisible. Necesita un descanso largo para repetir el rasgo." },
    { name: "Resistencia Legendaria (4/día, 5 en su guarida)", text: "Si falla una salvación, puede optar por superarla." },
    { name: "Resistencia a la Magia", text: "Ventaja en las salvaciones contra conjuros y efectos mágicos." },
    { name: "Huida Rencorosa", text: "Al llegar a 0 PG solo muere si está a 9 m o menos de su anatema, la cosa que el DM elija como lo que más odia. Si no, queda a 1 PG y se teletransporta a un semiplano inofensivo del que no vuelve en 2d6 días. Al irse, toda criatura a 18 m queda maldita: desventaja en pruebas y salvaciones mientras dure, y la bruja sabe dónde está en cualquier punto del multiverso." },
  ],
  actions: [
    { name: "Multiataque", text: "Dos ataques de Zarpa Espectral y usa Ola Crepitante." },
    { name: "Zarpa Espectral", text: "Ataque cuerpo a cuerpo o a distancia: +14, alcance 3 m o 18 m, 17 (3d6+7) de fuerza. Si el objetivo es Grande o menor, queda Derribado." },
    { name: "Ola Crepitante", text: "Salvación de Destreza CD 22 para cada criatura en un cono de 18 m. Fallo: 32 (5d12) de relámpago. Éxito: la mitad. Falle o no, queda maldita hasta el final del siguiente turno de la bruja y no puede usar reacciones mientras dure." },
    { name: "Lanzamiento de Conjuros", text: "Lanza sin componentes materiales, con Carisma (CD 22). A voluntad: Detectar Pensamientos, Puerta Dimensional, Disipar Magia, Patrón Hipnótico. 2/día cada uno: Sugestión en Masa, Modificar Memoria, Cambio de Plano." },
  ],
  bonusActions: [
    { name: "Golpe de Bruja", text: "Toda criatura maldita por la bruja a 18 m o menos sufre 14 (4d6) de relámpago." },
  ],
  reactions: [
    { name: "Trabalenguas", text: "Lanza Contraconjuro como reacción al disparador de ese conjuro. Si el objetivo falla su salvación, queda maldito hasta el final de su siguiente turno: no puede lanzar conjuros con componente verbal y, al hablar, dice lo contrario de lo que quiere decir." },
  ],
  legendary: [
    { name: "Zarpazo de Bruja", text: "Hace un ataque de Zarpa Espectral." },
    { name: "Magia Maliciosa", text: "Usa Lanzamiento de Conjuros para lanzar Puerta Dimensional o Patrón Hipnótico. No puede repetirla hasta el inicio de su siguiente turno." },
  ],
  blurb: "Bruja inmortal que acapara secretos prohibidos y cierra tratos que doblan el destino. Solo puede morir si su anatema está cerca.",
  habitat: "Cualquiera",
  treasure: "Arcano",
};

export const LOTE_02_MONSTERS: Monster[] = [ANKHEG, ARCANALOTH, ARCHIBRUJA];
