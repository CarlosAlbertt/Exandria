// Tintas, agujas y pigmentos del **Tatuaje Rúnico** (`data/rules.ts`).
// Pieles grabadas con poder: un tatuaje mágico no exige sintonización, pero
// duele.
//
// Sexto y último catálogo del mismo tipo. **Numeración propia**, de 1 a 25.
// El DM los pasó numerados del 51 al 75; aquí van renumerados desde 1, en el
// mismo orden.
//
// Varias entradas **no son tinta sino herramienta o consumible de taller**
// (agujas, púas, cera de transferir, anestésico, sellador). Van marcadas con
// `herramienta`: una receta las necesita a mano, pero no son el pigmento.
//
// **Todavía sin mecánica**: ni CD, ni receta, ni qué tatuaje sale de qué tinta.

export type MaterialTatuaje = {
  /** Número de catálogo, estable. */
  n: number;
  name: string;
  blurb: string;
  /** Utillaje o consumible de taller, no el pigmento en sí. */
  herramienta?: true;
};

export const MATERIALES_TATUAJE: MaterialTatuaje[] = [
  { n: 1, name: "Tinta de Kraken del Lucidian", blurb: "La base negra por excelencia. Nunca pierde intensidad; se usa para los bordes de las runas de protección." },
  { n: 2, name: "Púa de Mantícora", herramienta: true, blurb: "La aguja perfecta: hueca, afiladísima, y canaliza fluidos mágicos sin corroerse." },
  { n: 3, name: "Ceniza de Hueso de Hechicero", blurb: "Se mezcla con la tinta para tatuajes que almacenan conjuros de evocación." },
  { n: 4, name: "Polvo de Rubí de Pyrah", blurb: "Disuelto en ácidos suaves da tinta roja permanente. Tatuajes de resistencia al fuego." },
  { n: 5, name: "Agujas de Colmillo de Araña de Fase", herramienta: true, blurb: "Inyectan la tinta en el plano etéreo de la criatura: el tatuaje queda invisible hasta que se activa." },
  { n: 6, name: "Sangre de Cambion", blurb: "Tinta infernal. Los tatuajes hechos con ella queman al activarse, pero dan visión diabólica o fuerza impía." },
  { n: 7, name: "Extracto de Sombra del Páramo", blurb: "Tinta negra humeante, para tatuar paso brumoso o las marcas de los gremios de ladrones." },
  { n: 8, name: "Savia de Árbol de Hierro", blurb: "Astringente que endurece la piel tatuada: es la base de los tatuajes de barrera, que dan CA temporal." },
  { n: 9, name: "Oro Líquido Fundido estabilizado", blurb: "Tatuajes divinos: brilla bajo la piel, para runas de curación o de luz en clérigos y paladines." },
  { n: 10, name: "Polvo de Hada para pigmento", blurb: "Pigmento iridiscente. Los tatuajes cambian de color según las emociones de quien los lleva." },
  { n: 11, name: "Veneno de Basilisco Diluido", blurb: "Se inyecta en tatuajes defensivos: quien toque el tatuaje con malas intenciones se paraliza." },
  { n: 12, name: "Rocío de la Luna Catha", herramienta: true, blurb: "Disolvente mágico que limpia tatuajes fallidos o maldecidos sin arrancar la piel." },
  { n: 13, name: "Agujas de Cristal Dunamántico", herramienta: true, blurb: "Creadas por los Umbrales. Tatuajes dolorosísimos que dan usos de suerte —repetir dados— alterando el destino." },
  { n: 14, name: "Resina de Rifenmist", herramienta: true, blurb: "Anestésico imprescindible para tatuar cuello, cara o pecho sin que el portador entre en shock por el dolor mágico." },
  { n: 15, name: "Tinta de Camuflaje del Desierto", blurb: "De Ank'Harel. El tatuaje se expande un rato por el cuerpo y vuelve al portador del color del entorno." },
  { n: 16, name: "Escama de Sirena Triturada", blurb: "Pigmento verde o azul brillante, para tatuajes de respiración acuática." },
  { n: 17, name: "Aceite de Gólem", herramienta: true, blurb: "Sella el tatuaje recién hecho en segundos y cura la piel al momento, para poder usar la magia ya." },
  { n: 18, name: "Sangre de Grifo", blurb: "Tinta dorada y rojiza. Tatuajes de agilidad, salto o caída de pluma." },
  { n: 19, name: "Carbón de Madera Fulminada", blurb: "Madera quemada por un rayo. Ideal para tatuar conjuros de relámpago que destellan bajo la piel." },
  { n: 20, name: "Cera de Abeja Gigante", herramienta: true, blurb: "Transfiere los planos y plantillas rúnicas complejas del pergamino a la piel antes de pinchar." },
  { n: 21, name: "Tinta del Vacío", blurb: "De seres del Underdark profundo. Tatuajes que dan resistencia psíquica y que a veces le susurran al portador." },
  { n: 22, name: "Púa de Puercoespín Feérico", herramienta: true, blurb: "Aguja que no duele nada, pero inyecta recuerdos felices artificiales durante la sesión." },
  { n: 23, name: "Fragmentos de Espejo Maldito", blurb: "Molidos como purpurina letal: el tatuaje devuelve el daño radiante o psíquico a quien ataque al portador." },
  { n: 24, name: "Esencia de Elemental de Tierra", blurb: "Tinta marrón y densa. Tatuajes que suben el aguante: PG máximos temporales." },
  { n: 25, name: "Agujas de Plata de Whitestone", herramienta: true, blurb: "Necesarias para tatuar runas de exorcismo o de protección contra no-muertos en guerreros de primera línea." },
];

/** Las que son utillaje o consumible de taller, no pigmento. */
export const TATUAJE_HERRAMIENTAS: MaterialTatuaje[] =
  MATERIALES_TATUAJE.filter((m) => m.herramienta);

/** Busca por número de catálogo de tatuaje (1-25). */
export function tatuajePorN(n: number): MaterialTatuaje | undefined {
  return MATERIALES_TATUAJE.find((m) => m.n === n);
}
