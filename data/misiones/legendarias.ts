// LEGENDARIAS. Grupo entero, nivel 8-10, y se muere gente.
//
// ⚠️ **Estas tres SE PASAN del presupuesto ALTO a propósito**, y el gate lo
// exige: una legendaria que cupiera en `alta` sería una promesa incumplida. Se
// anuncian como mortales en la mesa antes de empezar, y se juegan sabiendo que
// puede no volver todo el mundo.
//
// Presupuesto (`XP_BUDGET`) para SEIS jugadores:
//   nivel 8  → 6000 baja / 10200 moderada / 12600 alta
//   nivel 9  → 7800 / 12000 / 15600
//   nivel 10 → 9600 / 13800 / 18600
//
// Las tres usan el CORAZÓN del bosque, que es lo que se extrajo el 2026-08-08
// en `data/bestiary/lote-10.ts`: hasta ese día ninguna de estas tres se podía
// jugar, porque `jugablesDe("corazon")` devolvía un array vacío.
//
// **Regla de la casa para las tres**: se avisa. El corazón del bosque avisa
// siempre —la raya de setas blancas, los cascos en círculo, el olor a quemado—
// y ninguna empieza con una emboscada. Quien cruza la raya, la cruza sabiendo.

import type { Mision } from "./types";

export const LEGENDARIAS: Mision[] = [
  {
    slug: "guardia-del-pacto",
    titulo: "La raya de setas blancas",
    tamano: "legendaria",
    jugadores: 6,
    nivel: [8, 9],
    lugar: "franja:corazon",
    letal: true,
    gancho:
      "Hay una línea de setas blancas que cruza el bosque de lado a lado y que lleva ahí desde " +
      "antes de que existiera Tal'Dorei. Todo el mundo en Syngorn sabe que no se cruza sin " +
      "permiso. El grupo va a tener que cruzarla, porque lo que necesita está al otro lado, y " +
      "el permiso esta vez no se lo van a dar.",
    escenas: [
      {
        titulo: "1 · Pedirlo bien (y que no baste)",
        texto:
          "Se puede pedir permiso, y hay que dejar intentarlo. El guardián de la patrulla " +
          "escucha entero y dice que no: no por hostilidad, sino porque el pacto no admite " +
          "excepciones y él lleva doscientos años sin hacer ninguna. Persuasión CD 20 (una sola " +
          "tirada, todo el grupo, con ventaja si alguien lleva la bendición de un unicornio o " +
          "el favor de Syngorn) consigue una cosa y solo una: que la patrulla no ataque por " +
          "la espalda y dé un aviso antes.",
      },
      {
        titulo: "2 · Cruzar",
        texto:
          "En cuanto el primero pisa al otro lado, se oyen los cascos. Vienen en círculo, " +
          "cerrando, y tardan tres rondas en llegar. Esas tres rondas son todo lo que el grupo " +
          "tiene para elegir terreno, y hay que decírselo: aquí se coloca uno o se muere de " +
          "pie en campo abierto contra caballería.",
      },
      {
        titulo: "3 · Lo que baja de los árboles",
        texto:
          "Los centauros no vienen solos. Dos osos lechuza primigenios patrullan con ellos y " +
          "no obedecen a nadie: entran en la ronda 4, por detrás, y atacan a lo que tengan más " +
          "cerca sin distinguir de qué bando es. Un centauro alcanzado por un chillido es tan " +
          "válido como un personaje jugador, y usarlo es la única forma real de ganar esto.",
      },
      {
        titulo: "4 · La salida honrosa",
        texto:
          "Si el grupo deja fuera de combate al guardián que mandaba —sin matarlo— la patrulla " +
          "se retira entera al final del turno. Está escrito para que exista una victoria que " +
          "no sea un exterminio, porque matar a la guardia del pacto cierra el corazón del " +
          "bosque para toda la campaña.",
      },
    ],
    encuentros: [
      {
        nombre: "La patrulla del pacto",
        monstruos: [
          { name: "Centauro Guardián", n: 3 },
          { name: "Centauro Soldado", n: 6 },
          { name: "Oso Lechuza Primigenio", n: 2 },
        ],
        xp: 17200,
        nota:
          "⚠️ Por encima del presupuesto ALTO de nivel 9 (15600), que es el techo del rango. "
          + "Los guardianes ciegan con " +
          "Rayo de Sol y enmarañan con su Rastro Enmarañado: un personaje Apresado en campo " +
          "abierto contra seis lanzas es un personaje muerto. Los osos lechuza son fuego " +
          "amigo para todos. Se puede huir: la patrulla no persigue más allá de la raya de " +
          "setas, y cruzar de vuelta termina el combate.",
      },
    ],
    recompensa:
      "El paso. Nada más, y es lo que vale: a partir de aquí el corazón está abierto y las " +
      "otras dos legendarias existen. Si se resolvió sin matar al guardián, además, una tregua " +
      "hablada — no vuelven a atacar a este grupo mientras no talen ni saqueen.",
    siFalla:
      "El grupo despierta en la linde, desarmado, con las heridas curadas y sin nada de lo que " +
      "llevaba encima. Es lo que hace la patrulla con quien no mató. La humillación es el " +
      "castigo, y volver a intentarlo cuesta el doble: ahora saben cómo pelean.",
    body:
      "Cruzar la raya de setas blancas del corazón del bosque. Los guardianes del pacto no van a " +
      "dar permiso. Habrá que pasar de todas formas, y no todo el mundo va a volver.",
  },

  {
    slug: "lo-que-habia-antes-del-pacto",
    titulo: "Lo que había antes del pacto",
    tamano: "legendaria",
    jugadores: 6,
    nivel: [9, 10],
    lugar: "franja:corazon",
    letal: true,
    gancho:
      "En los claros hondos del corazón pasta algo que lleva ahí desde antes de que existiera " +
      "el pacto, y por eso el pacto no lo incluye: no lo firmó nadie por ellos. Los centauros " +
      "los rodean, no los cruzan. El grupo necesita atravesar ese valle, y hay una sola hora al " +
      "día en que se puede.",
    escenas: [
      {
        titulo: "1 · La hora buena",
        texto:
          "Naturaleza CD 17 observando un día entero: los grandes herbívoros se mueven al " +
          "mediodía hacia el agua y dejan el paso libre durante una hora. El depredador lo " +
          "sabe, y por eso caza a esa hora. La ventana es real y la trampa también.",
      },
      {
        titulo: "2 · El paso, con reloj",
        texto:
          "Atravesar el valle son seis rondas de movimiento. Cada ronda que alguien haga ruido " +
          "—correr con armadura pesada, un conjuro con componente verbal, una caída— adelanta " +
          "una ronda la llegada del tiranosaurio. El grupo puede cruzar entero sin pelear si " +
          "juega bien, y eso hay que dejarlo posible.",
      },
      {
        titulo: "3 · Los cíclopes de la ladera",
        texto:
          "Hay dos puestos de guardia en las laderas, con dos cíclopes que llevan siglos " +
          "cumpliendo una orden de alguien que ya no existe. No cazan y no bajan: tiran rocas " +
          "a lo que cruce el valle. Se pueden esquivar usando a los triceratops como cobertura " +
          "móvil, que es la jugada bonita de esta misión.",
      },
      {
        titulo: "4 · Si se rompe la ventana",
        texto:
          "En cuanto el tiranosaurio entra, los triceratops dejan de pastar y embisten a lo que " +
          "se mueva — incluidos los personajes y el propio tiranosaurio. Cuatro masas de " +
          "cuatro toneladas cargando en un valle cerrado es el combate, y no está pensado para " +
          "ganarse: está pensado para sobrevivirlo hasta el otro lado.",
      },
    ],
    encuentros: [
      {
        nombre: "El valle en estampida",
        monstruos: [
          { name: "Tiranosaurio Rex", n: 2 },
          { name: "Triceratops", n: 4 },
          { name: "Cíclope Centinela", n: 2 },
        ],
        xp: 19600,
        nota:
          "⚠️ Por encima del presupuesto ALTO de nivel 10 (18600), que es el techo del rango. "
          + "El mordisco del tiranosaurio " +
          "agarra y deja Apresado a un Grande o menor: un personaje en la boca es un personaje " +
          "que no juega y que se está muriendo. Los triceratops NO son enemigos del grupo, son " +
          "terreno que embiste. La condición de victoria es LLEGAR AL OTRO LADO, y hay que " +
          "anunciarla antes de tirar iniciativa: quien intente matarlo todo, muere.",
      },
    ],
    recompensa:
      "El paso al fondo del corazón, y lo que hay allí. Un colmillo de tiranosaurio es un " +
      "trofeo que abre puertas en Riscomartillo. Y del puesto de guardia de los cíclopes: la " +
      "orden escrita que siguen cumpliendo, firmada por alguien de antes de la Divergencia.",
    siFalla:
      "Los que caen no se recuperan: en un valle en estampida no queda cuerpo que llevarse. Los " +
      "supervivientes salen por donde entraron y la ventana del mediodía se cierra para " +
      "siempre — el tiranosaurio ha aprendido que por ahí pasa comida y ahora vigila el paso.",
    body:
      "Cruzar el valle hondo del corazón del bosque. Hay una hora al día en que se puede pasar. " +
      "Lo que vive ahí es más viejo que el pacto y no lo respeta. Riesgo de muerte real.",
  },

  {
    slug: "el-ent-no-negocia",
    titulo: "El Ent no negocia con quien ha talado",
    tamano: "legendaria",
    jugadores: 6,
    nivel: [10, 10],
    lugar: "franja:corazon",
    letal: true,
    gancho:
      "El gremio de leñadores ha talado más allá del límite antiguo durante tres años, y el " +
      "bosque ha terminado de contar. Lo que baja hacia Byroden no es una partida de bichos: " +
      "es el bosque en pie, y ya ha borrado dos aserraderos sin dejar nada que enterrar. " +
      "Alguien tiene que ponerse en medio, y ponerse en medio aquí significa exactamente eso.",
    escenas: [
      {
        titulo: "1 · La única salida que no es pelear",
        texto:
          "Se puede parar sin combate, y cuesta muchísimo: hay que llegar antes que ellos, " +
          "desmontar los aserraderos que quedan, devolver el límite antiguo a su sitio y tener " +
          "a alguien que hable silvano diciéndolo. Persuasión CD 22 con ventaja si se ha hecho " +
          "todo lo anterior. Si el grupo se lo gana, los ents dan media vuelta y esta misión no " +
          "se juega nunca. Es la mejor sesión posible y hay que dejarla ganar.",
      },
      {
        titulo: "2 · El terreno lo eligen ellos",
        texto:
          "Si hay pelea, es donde ellos quieran: un tramo de bosque cerrado donde cada árbol " +
          "puede levantarse. ⚠️ Un ent anima hasta dos árboles al día, y cada árbol animado usa " +
          "SU MISMO bloque. El combate empieza con tres y puede terminar con nueve. El fuego " +
          "es la única ventaja del grupo —son vulnerables— y el fuego en un bosque cerrado con " +
          "seis personajes dentro es su propia forma de morir.",
      },
      {
        titulo: "3 · El cíclope que va con ellos",
        texto:
          "Con los ents baja un cíclope centinela que lleva siglos sin bando y ha decidido que " +
          "este sí es el suyo. Tira rocas desde fuera del alcance de casi todo el mundo y su " +
          "Presciencia Limitada le quita el mejor ataque del grupo una vez cada combate. " +
          "Ignorarlo cuesta la partida.",
      },
      {
        titulo: "4 · Qué se está defendiendo de verdad",
        texto:
          "Si alguien pregunta —y hay que dar ocasión— la respuesta es simple: no defienden " +
          "árboles. Defienden que el límite exista. Un ent aceptará morir antes que retroceder " +
          "un metro de la línea, y por eso no hay retirada por su parte y sí por la del grupo.",
      },
    ],
    encuentros: [
      {
        nombre: "El bosque en pie",
        monstruos: [
          { name: "Ent", n: 3 },
          { name: "Árbol Despierto", n: 6 },
          { name: "Cíclope Centinela", n: 1 },
        ],
        xp: 20000,
        nota:
          "⚠️ Por encima del presupuesto ALTO de nivel 10 (18600), y es el combate más duro " +
          "escrito para esta campaña. Granizo de Corteza alcanza a 54 m: no hay línea trasera " +
          "segura. Los ents son Monstruo de Asedio y se llevan por delante cualquier cobertura " +
          "que el grupo construya. Retirarse es posible en cualquier momento y no los persiguen " +
          "más allá del límite antiguo — pero entonces el límite lo ponen ellos, y pasa por " +
          "donde estaba Byroden.",
      },
    ],
    recompensa:
      "Que Byroden siga existiendo. Materialmente: el gremio paga 2000 po que no tiene y tarda " +
      "años en pagar, y el pueblo entero le debe la vida al grupo. Si se resolvió hablando, " +
      "además, el límite antiguo queda marcado otra vez y el bosque no vuelve a bajar en toda " +
      "la campaña.",
    siFalla:
      "No hay «si falla» suave. Los ents llegan a los bancales del norte, después a las casas " +
      "del norte, y Byroden se despuebla por segunda vez en su historia — la primera fue el " +
      "fuego de un dragón. Los personajes que caigan aquí caen delante del pueblo entero " +
      "mirando, y eso es lo que se recuerda de ellos.",
    body:
      "El bosque ha terminado de contar los árboles que faltan y viene a cobrarlos. Dos " +
      "aserraderos ya no existen. Se busca a quien se ponga en medio entre lo que baja y " +
      "Byroden, sabiendo lo que eso significa.",
  },
];
