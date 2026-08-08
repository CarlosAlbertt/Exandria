// MISIONES MENORES: uno o dos jugadores. Para la sesión que empieza tarde, para
// el que llega solo, o para el que se ha separado del grupo.
//
// Presupuesto (`XP_BUDGET`, nivel 2): UN jugador 100 baja / 150 moderada / 200
// alta. DOS jugadores, el doble. A nivel 3: 150/225/400 por cabeza.
//
// ⚠️ **Aquí la muerte es un accidente de diseño, no un riesgo aceptado.** Un
// personaje solo a nivel 2 no tiene a nadie que lo estabilice: todo lo que hay
// escrito abajo tiene salida a pie, y los bichos no persiguen fuera de su sitio.
// Si quitas eso, quitas la misión.

import type { Mision } from "./types";

export const MENORES: Mision[] = [
  {
    slug: "ratas-del-archivo",
    titulo: "Algo se come el archivo",
    tamano: "solitaria",
    jugadores: 1,
    nivel: [2, 3],
    lugar: "Byroden",
    encargante: "El alguacil de Byroden",
    gancho:
      "El archivo del ayuntamiento lleva un mes perdiendo papel. Al principio parecía humedad; " +
      "ahora faltan actas enteras y se oye correr algo entre las estanterías de abajo. El " +
      "alguacil no quiere gastar en esto y contrata a quien esté a mano.",
    escenas: [
      {
        titulo: "1 · El sótano",
        texto:
          "Dos plantas de registros, la de abajo con medio palmo de agua estancada desde el " +
          "deshielo. Investigación CD 12: el papel no está roído al azar — falta justo el " +
          "estante de las actas de hace cuarenta años, y el agujero de la pared por el que " +
          "entran da al cementerio, no a la calle.",
      },
      {
        titulo: "2 · El nido",
        texto:
          "Detrás del estante caído, un hueco con nido. Quien entre agachado pelea con " +
          "desventaja de espacio; quien tire el estante primero (Atletismo CD 12) pelea de pie.",
      },
    ],
    encuentros: [
      {
        nombre: "El nido bajo el estante",
        monstruos: [
          { name: "Rata Gigante", n: 4 },
          { name: "Enjambre de Ratas", n: 1 },
        ],
        xp: 150,
        nota:
          "Moderado para uno a nivel 2. El enjambre entra en la ronda 2 por el agujero. Si el " +
          "jugador cae, las ratas no rematan: comen papel, no gente. Se despierta con 1 PG y " +
          "el trabajo sin hacer.",
      },
    ],
    recompensa:
      "10 po y acceso libre al archivo. Entre lo que queda del estante roído: el acta del " +
      "temblor de hace cuarenta años, que nadie había vuelto a leer. Engancha con «Lo que subió " +
      "del suelo».",
    siFalla:
      "El agujero sigue ahí y en dos semanas falta también el registro de propiedades. Medio " +
      "pueblo deja de poder demostrar de quién es su casa, y eso es una trama de pleitos para " +
      "todo el invierno.",
    body:
      "El ayuntamiento de Byroden paga a quien limpie lo que se está comiendo el archivo del " +
      "sótano. Pagan poco y lo dicen de antemano.",
  },

  {
    slug: "perro-que-va-y-viene",
    titulo: "El perro que va y viene",
    tamano: "solitaria",
    jugadores: 1,
    nivel: [2, 3],
    lugar: "franja:linde",
    gancho:
      "A un pastor de las afueras le falta media docena de ovejas y jura que el perro que se " +
      "las lleva «aparece dentro del corral con la puerta cerrada». El pueblo se ríe de él. " +
      "Tiene razón.",
    escenas: [
      {
        titulo: "1 · El corral",
        texto:
          "Naturaleza CD 12: las huellas empiezan y terminan en mitad del barro, sin camino de " +
          "entrada ni de salida. Arcanos CD 13: eso no es un perro, es un perro parpadeante, y " +
          "en la linde el velo con el Feywild está fino.",
      },
      {
        titulo: "2 · Esperar o seguir",
        texto:
          "Dos formas de resolverlo, y las dos valen. ESPERAR de noche en el corral: aparecen " +
          "dos y hay pelea. SEGUIRLOS al bosque de día: se llega a la madriguera, y con comida " +
          "y Manejo de Animales CD 14 se los convence de cazar en otro lado. Sin pelea y con la " +
          "misma paga.",
      },
    ],
    encuentros: [
      {
        nombre: "Los dos del corral",
        monstruos: [{ name: "Perro Parpadeante", n: 2 }],
        xp: 100,
        nota:
          "Bajo para uno a nivel 2. Parpadean cada ronda: la mitad del tiempo no están donde " +
          "les pegas. No matan — muerden, cogen una oveja y se van. Si el jugador cae, se " +
          "despierta al amanecer con una oveja menos y sin heridas graves.",
      },
    ],
    recompensa:
      "15 po del pastor, o una oveja y su silencio si se resolvió sin matar. Quien los convenza " +
      "en vez de matarlos se gana que aparezcan una vez más, en el peor momento de otra misión, " +
      "de su lado.",
    siFalla: "El pastor pierde el rebaño y se va del pueblo. Una casa vacía más en Byroden.",
    body:
      "Un pastor de las afueras de Byroden paga por saber qué se le lleva las ovejas de un " +
      "corral cerrado. Dice que el perro aparece dentro. Nadie le cree.",
  },

  {
    slug: "colmena-del-campanario",
    titulo: "Lo que vive en el campanario",
    tamano: "solitaria",
    jugadores: 1,
    nivel: [2, 3],
    lugar: "Byroden",
    encargante: "La sacerdotisa de Byroden",
    gancho:
      "La campana de la iglesia lleva tres semanas sin tocarse porque el último que subió bajó " +
      "con el cuello lleno de picotazos y una fiebre que le duró seis días. La sacerdotisa " +
      "quiere su campana de vuelta antes del día santo.",
    escenas: [
      {
        titulo: "1 · La subida",
        texto:
          "Escalera de mano, trampilla y oscuridad. Percepción CD 13 antes de abrir: se oye un " +
          "zumbido bajo y constante. Quien abra la trampilla sin avisar pelea sorprendido.",
      },
      {
        titulo: "2 · Fuego, no",
        texto:
          "La solución obvia —quemarlas— prende la viga y con la viga arde el campanario. Si el " +
          "jugador tira fuego ahí dentro, la iglesia de Byroden se quema por segunda vez en su " +
          "historia y el pueblo no lo olvida. Merece decirlo en voz alta antes de tirar.",
      },
    ],
    encuentros: [
      {
        nombre: "Las del campanario",
        monstruos: [{ name: "Estirge", n: 6 }],
        xp: 150,
        nota:
          "Moderado para uno a nivel 2. Se pegan y chupan; una vez saciadas se sueltan y se " +
          "van, así que el combate se acaba solo si el jugador aguanta. Espacio estrecho: nadie " +
          "puede rodear a nadie.",
      },
    ],
    recompensa:
      "12 po de la limosna y un frasco de agua bendita. La sacerdotisa se acuerda de quién " +
      "subió: cuenta como un favor cobrable en cualquier misión posterior de Byroden.",
    siFalla:
      "El día santo pasa sin campana. En un pueblo que se reconstruyó empezando por la iglesia, " +
      "eso se lee como un mal presagio y la gente empieza a hablar de irse.",
    body:
      "La iglesia de Byroden paga a quien limpie el campanario. El último que subió bajó con " +
      "fiebre. Se pide expresamente que no se use fuego.",
  },

  {
    slug: "lobo-que-no-era-lobo",
    titulo: "El lobo que no era un lobo",
    tamano: "pareja",
    jugadores: 2,
    nivel: [2, 3],
    lugar: "franja:linde",
    gancho:
      "Han aparecido tres reses abiertas en el camino del norte y ninguna comida. Un lobo mata " +
      "para comer; esto no ha comido. Los carreteros se niegan a hacer la ruta de noche y " +
      "Byroden se está quedando sin sal.",
    escenas: [
      {
        titulo: "1 · El rastro",
        texto:
          "Supervivencia CD 13: hay huellas de lobo, sí, pero también una más grande y con más " +
          "peso, y esa va DETRÁS de las otras, no delante. Algo los está dirigiendo.",
      },
      {
        titulo: "2 · La emboscada, al revés",
        texto:
          "El huargo caza como caza siempre: manda a los lobos de frente y entra él por el " +
          "flanco. Si los jugadores lo saben por el rastro, pueden preparar el terreno y " +
          "empezar con ventaja el primer turno; si no, empiezan rodeados.",
      },
    ],
    encuentros: [
      {
        nombre: "La manada dirigida",
        monstruos: [
          { name: "Huargo", n: 1 },
          { name: "Lobo", n: 4 },
        ],
        xp: 300,
        nota:
          "Moderado para dos a nivel 2 (baja 200 / moderada 300 / alta 400). El huargo HABLA, y " +
          "eso es lo que convierte la misión en algo más: si le va mal, negocia. Sabe quién le " +
          "manda y lo vende sin dudar por su vida.",
      },
    ],
    recompensa:
      "30 po de los carreteros, a repartir. Si dejan vivo al huargo: el nombre del goblinoide " +
      "que baja de la espesura dando órdenes — el mismo que se llevó una esfera en «Lo que subió " +
      "del suelo».",
    siFalla:
      "La ruta del norte queda cerrada un mes. Sube el precio de todo en Byroden y aparece un " +
      "contrabandista dispuesto a traer sal por el bosque, que es una misión nueva y peor.",
    body:
      "Los carreteros de Byroden pagan por limpiar el camino del norte. Tres reses muertas y " +
      "ninguna devorada. Buscan a dos personas, no a un ejército.",
  },

  {
    slug: "tela-ordenada",
    titulo: "Donde la tela tiene un orden",
    tamano: "pareja",
    jugadores: 2,
    nivel: [3, 4],
    lugar: "franja:linde",
    gancho:
      "Un leñador señala un tramo de la linde donde las telarañas no están puestas al azar: " +
      "forman pasillos. Dice que hay un carro dentro, y que el carro lleva ahí desde antes del " +
      "invierno.",
    escenas: [
      {
        titulo: "1 · Los pasillos",
        texto:
          "Naturaleza CD 13: la tela está tendida para conducir a algo hasta un punto, no para " +
          "atrapar donde caiga. Quien siga los pasillos llega al claro; quien los corte para " +
          "atajar avisa a todo lo que vive ahí y empieza el combate una ronda antes.",
      },
      {
        titulo: "2 · El carro",
        texto:
          "En el centro, un carro volcado y envuelto. Dentro no hay cadáveres: hay ropa, un " +
          "diario mojado y las marcas de que alguien salió de ahí por su propio pie hacia el " +
          "bosque. La araña no se los comió. Se fueron.",
      },
    ],
    encuentros: [
      {
        nombre: "Las que tejen el pasillo",
        monstruos: [
          { name: "Araña Lobo Gigante", n: 6 },
          { name: "Araña", n: 4 },
        ],
        xp: 340,
        nota:
          "Por debajo de moderado para dos a nivel 3 (baja 300 / moderada 450 / alta 800), y " +
          "así se quiere: lo caro aquí es el terreno. Cada casilla de tela cuesta el doble de " +
          "movimiento y una salvación de Fuerza CD 12 para no quedar Apresado. Las arañas lobo " +
          "no tejen: cazan a la carrera y usan la tela de los demás como trampa.",
      },
    ],
    recompensa:
      "El contenido del carro: 45 po en género de mercería, y el diario. El diario lo escribió " +
      "alguien que llevaba semanas oyendo una voz y que se metió en el bosque por su propio pie. " +
      "Es un cabo suelto deliberado.",
    siFalla:
      "El carro se queda ahí y la tela sigue creciendo hacia el camino. En un mes, los pasillos " +
      "llegan a la vereda por la que se entra al bosque desde Byroden.",
    body:
      "Un leñador paga por que alguien mire un tramo de la linde donde las telarañas forman " +
      "pasillos. Dice que hay un carro dentro. Trabajo para dos.",
  },

  {
    slug: "vigia-de-syngorn",
    titulo: "El búho que decide quién pasa",
    tamano: "pareja",
    jugadores: 2,
    nivel: [2, 3],
    lugar: "franja:linde",
    gancho:
      "Syngorn ha dejado de recibir los informes de uno de sus vigías de la linde. No mandan a " +
      "un destacamento por un búho: mandan a quien esté cerca y sea barato.",
    escenas: [
      {
        titulo: "1 · Encontrar al vigía",
        texto:
          "El búho gigante está vivo, herido en un ala y de muy mal humor. HABLA. Lo primero " +
          "que hace es examinar a quien llega: si no le gusta lo que ve, no cuenta nada " +
          "(Persuasión CD 14, con ventaja para elfos o para quien traiga comida).",
      },
      {
        titulo: "2 · Quién le disparó",
        texto:
          "Le disparó una partida de goblins que sube y baja del bosque desde hace semanas, y " +
          "están acampados a media hora. El búho no pide venganza; pide que le quiten el " +
          "campamento de su tramo para poder volver a su trabajo.",
      },
    ],
    encuentros: [
      {
        nombre: "El campamento del claro",
        monstruos: [
          { name: "Goblin Guerrero", n: 4 },
          { name: "Búho Gigante", n: 1 },
        ],
        xp: 250,
        nota:
          "Bajo-moderado para dos a nivel 2. ⚠️ El búho gigante cuenta en el presupuesto pero " +
          "está DE PARTE de los jugadores si se lo han ganado: entra en la ronda 2 desde arriba " +
          "y se lleva a un goblin. Si no se lo ganaron, mira desde una rama y no hace nada — y " +
          "entonces son 200 XP contra dos, que sigue siendo jugable.",
      },
    ],
    recompensa:
      "25 po de la bolsa diplomática de Syngorn y, lo que importa, un vigía que te reconoce: " +
      "cualquier grupo que lleve a uno de estos dos entra en la linde sin que el bosque avise " +
      "de su llegada. Ventaja en el primer chequeo de sigilo de cada entrada al bosque.",
    siFalla:
      "Syngorn manda a los suyos, encuentra el campamento y saca la conclusión de que Byroden no " +
      "controla su propia linde. Las relaciones entre el pueblo y la ciudad élfica empeoran, y " +
      "eso se nota en los precios y en los permisos.",
    body:
      "Syngorn paga por saber qué le ha pasado a su vigía del tramo sur de la linde. Es un búho, " +
      "habla, y lleva tres semanas sin informar.",
  },
];
