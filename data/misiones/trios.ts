// MISIONES PARA TRES. El tamaño raro: ya se puede aguantar un frente, pero no
// se puede perder a nadie.
//
// Presupuesto (`XP_BUDGET`) para TRES jugadores: nivel 3 → 450 baja / 675
// moderada / 1200 alta. Nivel 4 → 750 / 1125 / 1500.
//
// Las cuatro tienen una salida que no es pelear, y no por blandura: con tres
// personas, un combate que sale mal no se recupera con acciones de ayuda, y el
// grupo entero se queda sin sesión.

import type { Mision } from "./types";

export const TRIOS: Mision[] = [
  {
    slug: "cria-en-el-nido",
    titulo: "La cría del nido alto",
    tamano: "trio",
    jugadores: 3,
    nivel: [3, 4],
    lugar: "franja:linde",
    gancho:
      "Alguien ha visto algo verde y con alas posarse en las copas del norte, y esa misma " +
      "semana han desaparecido dos cabras y un perro. En Byroden la palabra «dragón» todavía no " +
      "se ha dicho en voz alta, y el alguacil quiere que siga sin decirse.",
    escenas: [
      {
        titulo: "1 · Lo que no se puede decir en la plaza",
        texto:
          "El encargo se da a puerta cerrada. Byroden ardió una vez por un dragón y el pueblo " +
          "no aguantaría el rumor: la mitad se iría antes de comprobar nada. Condición del " +
          "encargo: se va, se mira y NO se cuenta.",
      },
      {
        titulo: "2 · El nido",
        texto:
          "En un pino partido, a doce metros, hay un nido hecho con cosas robadas — no solo " +
          "presas: una olla, un arnés, una campana. La cría lleva semanas coleccionando. " +
          "Percepción CD 13 desde abajo: hay huesos de cabra, pero también el mango de un hacha " +
          "de leñador.",
      },
      {
        titulo: "3 · Los que ya estaban trabajando para ella",
        texto:
          "Una cría de dragón verde manipula desde el primer día. Ya tiene cuatro goblins " +
          "llevándole comida a cambio de no comérselos. Si el grupo se los quita —Intimidar CD " +
          "13, o matarlos— pierde a sus proveedores y baja a cazar ella, que es cuando " +
          "empieza el combate de verdad.",
      },
    ],
    encuentros: [
      {
        nombre: "El nido y sus proveedores",
        monstruos: [
          { name: "Cría de Dragón Verde", n: 1 },
          { name: "Goblin Guerrero", n: 4 },
        ],
        xp: 650,
        nota:
          "Moderado para tres a nivel 3 (450 / 675 / 1200). El aliento venenoso en cono de 4,5 m " +
          "pilla a dos si van juntos: sepáralos o pierdes a alguien. La cría HABLA y prefiere " +
          "un trato a una pelea — ofrece marcharse a cambio de algo brillante y de que no se " +
          "diga dónde estaba. Cumple el trato. Vuelve en dos niveles, más grande.",
      },
    ],
    recompensa:
      "60 po del ayuntamiento y el contenido del nido (35 po en objetos robados, y el hacha, que " +
      "tiene un nombre grabado). Si la dejaron marcharse: se lo deberá, y una cría de dragón " +
      "verde que te debe algo es peor y mejor que una muerta.",
    siFalla:
      "La cría se instala. En un mes deja de robar cabras y empieza a cobrar peaje en el camino " +
      "del norte con goblins de recaudadores. Byroden lo aguanta callado, porque la alternativa " +
      "es admitir en voz alta que hay otro dragón.",
    body:
      "Encargo discreto del ayuntamiento de Byroden: ir al norte de la linde, comprobar qué se " +
      "ha posado en las copas y volver sin contarlo en la plaza. Se paga el silencio aparte.",
  },

  {
    slug: "arboles-que-se-han-movido",
    titulo: "El camino que ya no está donde lo dejaste",
    tamano: "trio",
    jugadores: 3,
    nivel: [3, 4],
    lugar: "franja:espesura",
    gancho:
      "Una partida de leñadores entró a marcar árboles y salió tres días después, a treinta " +
      "kilómetros de donde debía, sin herramientas y sin dos de los suyos. Juran que el camino " +
      "se movió. El gremio paga por recuperar a los dos, o por saber.",
    escenas: [
      {
        titulo: "1 · Marcar y volver a mirar",
        texto:
          "Cualquiera puede comprobarlo: se marca un tronco, se anda cien pasos y se vuelve. La " +
          "marca sigue ahí; lo que ha cambiado es todo lo demás. Supervivencia CD 15 para no " +
          "perderse, y con desventaja si nadie ha atado una cuerda.",
      },
      {
        titulo: "2 · Por qué se mueven",
        texto:
          "No es magia de nadie: son los propios árboles. Naturaleza CD 14 — han cerrado el " +
          "paso a propósito y llevan haciéndolo desde que empezaron las talas. Los dos " +
          "leñadores perdidos están vivos, arrinconados en un hueco de roca, sin agua desde " +
          "ayer.",
      },
      {
        titulo: "3 · Hablar con un árbol",
        texto:
          "Un Árbol Despierto no negocia con quien lleva un hacha a la vista. Guardar las armas " +
          "y hablar (Persuasión CD 15, ventaja si alguien tiene Naturaleza o habla silvano) " +
          "termina la misión sin combate: devuelven a los leñadores y abren el camino a cambio " +
          "de que la tala se pare en el límite antiguo, que está marcado y que el gremio ha " +
          "estado ignorando.",
      },
    ],
    encuentros: [
      {
        nombre: "El bosque cerrando el paso",
        monstruos: [
          { name: "Árbol Despierto", n: 2 },
          { name: "Arbusto Despierto", n: 4 },
        ],
        xp: 940,
        nota:
          "Duro para tres a nivel 3, por debajo de alta (1200). ⚠️ Este combate es el CASTIGO " +
          "por no haber hablado, y hay que dejar claro en mesa que había otra puerta. Los " +
          "árboles no persiguen fuera de su tramo y no rematan: dejan inconsciente y empujan " +
          "hacia fuera del bosque. Es un bosque defendiéndose, no un monstruo cazando.",
      },
    ],
    recompensa:
      "80 po del gremio por los dos leñadores vivos (40 si vuelven solo con la noticia). Si se " +
      "resolvió hablando: el bosque deja pasar a estos tres siempre, y eso vale más que el oro " +
      "en toda la línea de misiones de la espesura.",
    siFalla:
      "Los dos leñadores mueren de sed en el hueco de roca. El gremio culpa al bosque, contrata " +
      "a cazadores de verdad y empieza una tala de represalia — que es exactamente lo que " +
      "despierta a lo que hay más adentro.",
    body:
      "El gremio de leñadores paga por encontrar a dos hombres perdidos en la espesura y por " +
      "explicar por qué el camino de vuelta no estaba donde lo dejaron. Tres personas, no más: " +
      "una partida grande se pierde igual y come el doble.",
  },

  {
    slug: "caldero-de-la-bruja",
    titulo: "El trato que hizo la panadera",
    tamano: "trio",
    jugadores: 3,
    nivel: [4, 5],
    lugar: "franja:espesura",
    gancho:
      "La panadera de Byroden tuvo un hijo después de doce años sin poder tenerlo, y desde " +
      "entonces no duerme. Pide, sin explicar por qué, que alguien vaya a la espesura y " +
      "«recupere lo que dejé en un cuenco». Paga con todo lo que tiene.",
    escenas: [
      {
        titulo: "1 · Lo que no cuenta",
        texto:
          "Perspicacia CD 13 para sacarle la verdad: hizo un trato. Dio algo a cambio del hijo " +
          "y ahora la cosa que se lo dio ha empezado a pedir el pago. No sabe qué dio — esa es " +
          "la parte que le da miedo — solo que desde entonces su marido no la reconoce del todo " +
          "y que su madre la ha borrado de sus recuerdos.",
      },
      {
        titulo: "2 · Encontrar el sitio",
        texto:
          "El claro del caldero se encuentra siguiendo el olor, que es dulce y equivocado. " +
          "Supervivencia CD 14. Por el camino hay tres cuencos más, en tres claros, cada uno " +
          "con el trato de otra persona dentro. Ninguno es de Byroden.",
      },
      {
        titulo: "3 · Negociar con quien siempre gana",
        texto:
          "La bruja verde recibe con educación. Ofrece devolver lo que se llevó a cambio de " +
          "otra cosa —siempre algo que parece no costar nada: un recuerdo, un nombre, la " +
          "primera nevada que alguien vea—. ⚠️ Si el grupo acepta, la misión se cierra sin " +
          "pelea y la deuda pasa a un personaje jugador. Es la mejor resolución posible y la " +
          "peor idea, y las dos cosas a la vez es el sentido de este PNJ.",
      },
    ],
    encuentros: [
      {
        nombre: "Si se rompe el trato en su claro",
        monstruos: [
          { name: "Bruja Verde", n: 1 },
          { name: "Plaga de Enredaderas", n: 4 },
        ],
        xp: 1100,
        nota:
          "Moderado para tres a nivel 4 (750 / 1125 / 1500). No pelea de frente: se hace " +
          "invisible, se va y vuelve. Si baja de la mitad de sus PG desaparece del todo y " +
          "cumple una amenaza concreta contra alguien de Byroden en la sesión siguiente. " +
          "Matarla en su primer combate no debería ser posible, y no pasa nada.",
      },
    ],
    recompensa:
      "Lo que la panadera tiene: 40 po, y su horno abierto para siempre. Del claro: tres cuencos " +
      "con tres tratos ajenos dentro, que son tres ganchos a tres PNJ que aún no existen. Y si " +
      "alguien aceptó un trato propio, una deuda con nombre.",
    siFalla:
      "La bruja cobra. El niño sigue vivo y sano — eso nunca falla — pero la panadera deja de " +
      "reconocer a su propio hijo, y él a ella. Se queda en el pueblo, atendida por vecinos, " +
      "como recordatorio permanente de lo que costó no llegar a tiempo.",
    descubrimiento: {
      pericia: "Perspicacia", cd: 14,
      texto:
        "En un claro hay un cuenco de barro, limpio, puesto con cuidado sobre una piedra plana. " +
        "Dentro no hay nada. Y a diez pasos hay otro igual, y más allá un tercero: alguien ha " +
        "estado pagando aquí, y no en monedas.",
    },
    body:
      "La panadera de Byroden paga todo lo que tiene por que tres personas vayan a la espesura y " +
      "recuperen «lo que dejó en un cuenco». No dice qué dejó. Pide que no se le pregunte.",
  },

  {
    slug: "ankhegs-de-los-campos",
    titulo: "Lo que sale del suelo en los bancales",
    tamano: "trio",
    jugadores: 3,
    nivel: [3, 4],
    lugar: "Byroden",
    encargante: "El alguacil de Byroden",
    gancho:
      "Desde el temblor, la tierra de los bancales del norte está removida y ya se ha tragado a " +
      "una mula entera delante de tres testigos. Es temporada de siembra: si no se limpian esos " +
      "campos esta semana, Byroden pasa el invierno con lo que tenga guardado.",
    escenas: [
      {
        titulo: "1 · Los bancales",
        texto:
          "Cuatro terrazas de labranza pegadas a la linde. Supervivencia CD 12: hay tres bocas " +
          "de túnel, no una, y todas apuntan hacia el bosque — subieron desde allí después del " +
          "temblor. Este encargo y «Lo que subió del suelo» son el mismo suceso visto desde el " +
          "pueblo.",
      },
      {
        titulo: "2 · Cazar o esperar",
        texto:
          "Se pueden buscar los túneles (peligroso: se pelea en espacio cerrado y sin " +
          "retirada) o cebarlos en superficie con un animal y una espera larga. Cebarlos da " +
          "elegir el terreno y empezar el combate con una ronda de ventaja: es la opción " +
          "buena, cuesta un día y una cabra, y hay que dejar que la mesa la encuentre.",
      },
    ],
    encuentros: [
      {
        nombre: "Los dos de los bancales",
        monstruos: [{ name: "Ankheg", n: 2 }],
        xp: 900,
        nota:
          "Entre moderado y alto para tres a nivel 3 (450 / 675 / 1200). Emergen, agarran y se " +
          "hunden con la presa: el peligro real es que se lleven a un personaje bajo tierra, no " +
          "el daño. Un personaje agarrado y arrastrado a un túnel tiene dos rondas antes de que " +
          "esto se ponga muy serio, y el resto tiene que decidir rápido. En espacio cerrado, la " +
          "Rociada de Ácido pilla a los tres en línea.",
      },
    ],
    recompensa:
      "70 po del común del pueblo (lo juntan entre todos, y eso se nota en cómo los tratan " +
      "después). Los caparazones valen 30 po más a un armero de Emon, y quien sepa trabajarlos " +
      "puede sacar una coraza ligera.",
    siFalla:
      "Los bancales del norte no se siembran. Byroden entra en invierno con déficit, sube el " +
      "precio del grano y aparecen dos misiones nuevas que nadie quería: comprar fuera y " +
      "escoltar la compra.",
    descubrimiento: {
      pericia: "Supervivencia", cd: 12,
      texto:
        "La tierra de los bancales del norte está removida en tres sitios, y no por el arado: " +
        "son bocas de túnel, del ancho de un hombre, y las tres apuntan hacia el bosque. La de " +
        "en medio tiene arreos de mula alrededor.",
    },
    body:
      "Byroden paga por limpiar de bichos los bancales del norte antes de la siembra. Ya se han " +
      "tragado una mula. Hace falta gente que sepa pelear con el suelo moviéndose.",
  },
];
