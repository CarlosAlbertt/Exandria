// LA MISIÓN DEL ZIGURAT DE LA LINDE — la preparada a fondo.
//
// ⚠️ **Es un CUARTO zigurat, y eso es canon nuevo de esta campaña.** Decidido
// por el usuario el 2026-08-08. `data/susurrado.ts` (`zigurat-tres`) dice que
// hay tres —Piedrablanca, Vasselheim y uno perdido en Marquet—, y **no se
// contradice**: esa entrada cuenta lo que se SABE, y de este nadie sabía nada
// porque llevaba enterrado desde antes de la Calamidad. Si algún día lo abren,
// la entrada de la lore se queda corta, no falsa.
//
// ⚠️ **A nivel 2 esta misión NO se resuelve, y está escrita para eso.** El
// grupo no puede abrir la puerta, no puede tumbar lo que hay dentro y no debe
// poder. Lo que gana es: saber qué es, sacar a los que quedan vivos, y que el
// pueblo tenga un mes de margen. El zigurat se queda ahí flotando, que es el
// motor de campaña — como el de Piedrablanca, que estuvo décadas debajo de una
// ciudad sin que nadie preguntara.
//
// Presupuesto con SEIS jugadores a nivel 2: 600 baja / 900 moderada / 1200 alta
// (`XP_BUDGET` de `data/encounters.ts`). Los tres combates van a 750, 1100 y
// 1000: uno moderado, uno al filo de lo alto y un clímax duro pero no letal.
// Ninguno se pasa de 1200, y el gate lo comprueba.

import type { Mision } from "./types";

export const ZIGURAT_LINDE: Mision = {
  slug: "zigurat-de-la-linde",
  titulo: "Lo que subió del suelo",
  tamano: "grupo",
  jugadores: 6,
  nivel: [2, 3],
  lugar: "franja:linde",
  encargante: "El alguacil de Byroden",
  gancho:
    "El temblor se sintió en Byroden a las cuatro de la mañana: un golpe seco, uno solo, y " +
    "después el silencio de los pájaros. Al amanecer el agua de los pozos sabe a metal y en " +
    "el cementerio hay lápidas de la franja vieja —esas que llevan todas la misma fecha— que " +
    "se han torcido hacia el norte, como si algo hubiera tirado del suelo desde el bosque. " +
    "El alguacil no pide que se arregle nada: pide que alguien vaya a mirar y vuelva a " +
    "contarlo, y paga por adelantado la mitad porque sabe que si no, no va nadie.",

  escenas: [
    {
      titulo: "1 · Byroden, de mañana",
      texto:
        "Antes de salir hay tres cosas que se pueden averiguar sin pisar el bosque, y las tres " +
        "cambian cómo se juega el resto.\n\n" +
        "· EN LA TABERNA (Persuasión o pagar rondas, CD 12): dos leñadores que iban de camino " +
        "al norte volvieron sin carro. Cuentan que la linde «se ha levantado» y que oyeron " +
        "cantar, aunque no saben decir en qué idioma. Uno de los dos no ha vuelto a hablar.\n\n" +
        "· EN LA IGLESIA (Religión CD 13): la sacerdotisa no reconoce el símbolo que le " +
        "describen los leñadores —un ojo abierto dentro de un triángulo— porque en Byroden no " +
        "se rinde culto a esa diosa desde antes de la Calamidad. Sabe que es de una deidad del " +
        "saber, y que sus templos se construían escalonados. Si alguien tiene la pericia, ata " +
        "la palabra: zigurat.\n\n" +
        "· EN EL CEMENTERIO (Investigación CD 12): las lápidas torcidas no se han movido al " +
        "azar. Todas apuntan al mismo punto del bosque. Quien mida bien el ángulo llega " +
        "derecho al cráter y se ahorra la escena 2.\n\n" +
        "· EN EL AYUNTAMIENTO: el alguacil enseña el registro. Hace cuarenta años hubo otro " +
        "temblor igual, se anotó, y no pasó nada más. Alguien lo anotó y nadie volvió a " +
        "leerlo. Es la primera pista de que esto lleva subiendo mucho tiempo, despacio.",
    },
    {
      titulo: "2 · La linde, donde el camino se acaba",
      texto:
        "Dos horas de bosque por la vereda de siempre y aparece lo que no estaba: un claro que " +
        "no existía, de unos cuarenta metros, con los árboles caídos hacia fuera en círculo " +
        "perfecto — no talados, empujados. La tierra está vuelta del revés y huele a raíz " +
        "partida y a piedra mojada.\n\n" +
        "En el centro, sobre un cráter, hay un zigurat de siete escalones, unos quince metros " +
        "de alto, de piedra gris con vetas claras. **Flota a tres metros del fondo del " +
        "cráter.** No lo sostiene nada. Gira sobre sí mismo tan despacio que hay que mirarlo " +
        "un minuto entero para estar seguro de que gira.\n\n" +
        "Debajo, colgando de las raíces del cráter, hay cosas que subieron con él: cerámica " +
        "rota, un tramo de escalera que no lleva a ninguna parte y dos cadáveres muy secos, " +
        "vestidos de una forma que nadie del pueblo reconocería.\n\n" +
        "· Arcanos CD 14: no hay conjuro de levitación. Lo que hay es AUSENCIA — el zigurat no " +
        "cae porque el suelo, debajo de él, ha dejado de tirar. El efecto tiene el tamaño " +
        "exacto del edificio, ni un palmo más.\n" +
        "· Naturaleza CD 12: el círculo de árboles caídos hacia fuera dice que subió de golpe, " +
        "esta noche, y no que lleve tiempo asomando.",
    },
    {
      titulo: "3 · Lo que subió con él  →  COMBATE 1",
      texto:
        "El cráter está vivo. Lo que llevaba siglos bajo tierra ha salido a la superficie con " +
        "el edificio y no tiene ninguna intención de volver a bajar.\n\n" +
        "Empieza en cuanto alguien pise el borde del cráter o intente bajar a los cadáveres. " +
        "El ankheg estaba justo debajo y sale por detrás del grupo, no de frente; las plagas " +
        "de agujas ya están en el borde, quietas, y no se distinguen de la maleza hasta que se " +
        "mueven (Percepción pasiva 14 para verlas antes).\n\n" +
        "TERRENO: el fondo del cráter es tierra suelta — coste doble de movimiento — y todo el " +
        "que caiga dentro queda a tres metros por debajo del edificio flotante, que es donde " +
        "el DM quiere que llegue el susto de la escena 5.",
    },
    {
      titulo: "4 · La escalera y la puerta que no se abre",
      texto:
        "Se puede subir. La cara sur tiene los siete escalones intactos y una rampa de tierra " +
        "levantada que llega hasta el tercero; de ahí arriba hay que trepar (Atletismo CD 12, " +
        "o cuerda y una hora).\n\n" +
        "Arriba, una puerta de piedra sin bisagras, con el ojo dentro del triángulo grabado en " +
        "el centro y **siete huecos redondos** alrededor, del tamaño de un puño. Cinco están " +
        "vacíos. Dos tienen dentro una esfera de piedra pulida, y las dos giran despacio en el " +
        "mismo sentido que el edificio.\n\n" +
        "· Religión CD 13: es un sello de Ioun, la diosa del saber compartido. Los sellos de " +
        "Ioun no se fuerzan: se responden. Se abren cuando se le devuelve algo que sabía y " +
        "perdió.\n" +
        "· Arcanos CD 16: las cinco esferas que faltan no se han robado hace poco; los huecos " +
        "están gastados por dentro, de siglos de tener algo dentro. **Alguien las sacó antes " +
        "de que esto se enterrara.**\n\n" +
        "⚠️ **A nivel 2 la puerta NO se abre, y no hay tirada que la abra.** Si el grupo " +
        "insiste con fuerza bruta, la piedra aguanta (CA 17, resistencia a todo, 60 PG por " +
        "tramo) y el ruido adelanta el combate 2. Que no se abra es la misión: se van sabiendo " +
        "que hacen falta cinco esferas y que hay al menos dos por ahí.",
    },
    {
      titulo: "5 · Los que llegaron antes  →  COMBATE 2",
      texto:
        "No son los primeros. En la cara norte hay cuerdas, cuñas metidas en las juntas y una " +
        "hoguera de anoche todavía tibia: una partida de saqueo goblinoide bajó de la espesura " +
        "en cuanto se oyó el golpe, y llevan desde el amanecer intentando entrar por donde no " +
        "se entra.\n\n" +
        "Se puede evitar el combate. Hablan común mal y respetan lo que les asuste (Intimidar " +
        "CD 15 con ventaja si han visto morir al ankheg, Engaño CD 14 si alguien se hace pasar " +
        "por enviado de quien manda dentro). Si se negocia, cambian información por marcharse: " +
        "**una de las dos esferas de la puerta se la llevó su jefe hace dos horas hacia la " +
        "espesura** — es decir, el grupo llega tarde y quedan cuatro huecos, no cinco.\n\n" +
        "Si se pelea, es el combate más duro del día. Los hobgoblins mandan desde atrás y los " +
        "goblins se lanzan; en cuanto caen dos hobgoblins, el resto huye hacia el bosque, y " +
        "quien huye vuelve la semana que viene con más.",
    },
    {
      titulo: "6 · Los que siguen de servicio  →  COMBATE 3",
      texto:
        "Cuando el grupo lleva un rato arriba —o en cuanto alguien toca una de las dos esferas " +
        "que quedan— el edificio responde. Se abren tres nichos en la cara este y sale lo que " +
        "guardaba el templo desde el día que lo enterraron: armaduras vacías que siguen " +
        "montando guardia, y el servicio del templo, que sigue barriendo un suelo que ya no " +
        "existe.\n\n" +
        "No persiguen. **Defienden el escalón séptimo y nada más**: quien baje de ahí deja de " +
        "ser objetivo al final del turno siguiente. Esto es a propósito — a nivel 2 el grupo " +
        "tiene que poder retirarse escaleras abajo, y el DM tiene que saberlo antes de tirar " +
        "iniciativa.\n\n" +
        "Si el grupo aguanta y las destruye, entre los restos hay una placa de bronce con " +
        "cinco nombres grabados. Son los cinco que se llevaron las esferas.",
    },
    {
      titulo: "7 · El susurro (SECRETO, no lo enseñes salvo que se lo ganen)",
      texto:
        "Quien se quede solo arriba, o quien caiga al fondo del cráter y pase un turno entero " +
        "inconsciente, oye una voz. No viene del zigurat: viene de debajo, del agujero que ha " +
        "dejado al subir.\n\n" +
        "Es educada. Sabe el nombre del que la oye. No pide nada en esta sesión: se ofrece a " +
        "decirle dónde está una de las cinco esferas, gratis, «para empezar». Y acierta.\n\n" +
        "⚠️ Engancha con `susurrado-trato` de `data/susurrado.ts` — así es como llega, en la " +
        "práctica. Si el DM quiere abrir esa puerta, esta es. Si no, la voz no vuelve a hablar " +
        "y queda como una noche rara. **No la reveles a todo el grupo**: es una misión " +
        "individual (`assigned_character_id`) para el que la oyó.",
    },
    {
      titulo: "8 · Cerrar la sesión sin cerrar la trama",
      texto:
        "El grupo vuelve a Byroden y cuenta lo que ha visto. Lo que consigue de verdad:\n\n" +
        "· El pueblo sabe que aquello no baja ni ataca, y deja de hacer las maletas.\n" +
        "· El alguacil manda cerrar la vereda del norte y pone dos vigías. Eso son dos PNJ " +
        "nuevos en la linde y una excusa permanente para volver.\n" +
        "· Queda escrito lo que falta: **cinco esferas, cinco nombres, y una de ellas se la " +
        "acaba de llevar un jefe goblinoide hacia la espesura.** Ahí está la siguiente misión, " +
        "y ya es de nivel 3-4.\n\n" +
        "Lo que NO consigue: entrar. Y conviene decirlo en la mesa sin disimular — que la " +
        "puerta no se abre hoy no es que hayan fallado, es la forma del sitio.",
    },
  ],

  encuentros: [
    {
      nombre: "COMBATE 1 · La tierra vomitada",
      monstruos: [
        { name: "Ankheg", n: 1 },
        { name: "Plaga de Agujas", n: 6 },
      ],
      xp: 750,
      nota:
        "Moderado para seis a nivel 2 (baja 600 / moderada 900 / alta 1200). El ankheg emerge " +
        "por detrás en la ronda 2, no en la 1: si sale de salida con su Rociada de Ácido puede " +
        "tumbar a dos personajes de nivel 2 antes de que actúen. Las plagas de agujas no " +
        "persiguen fuera del cráter — el que se retira, se salva, y eso enseña la lección del " +
        "sitio.",
    },
    {
      nombre: "COMBATE 2 · Los que llegaron antes",
      monstruos: [
        { name: "Goblin Guerrero", n: 12 },
        { name: "Hobgoblin Guerrero", n: 5 },
      ],
      xp: 1100,
      nota:
        "Al filo de lo alto (1200). Se puede EVITAR entero hablando, y esa es la opción " +
        "buena: doce goblins más cinco hobgoblins contra un nivel 2 mata a alguien si el " +
        "grupo se deja rodear en campo abierto. Juégalos en oleadas de seis desde la cara " +
        "norte y con los hobgoblins disparando desde la rampa. Huyen al caer dos hobgoblins.",
    },
    {
      nombre: "COMBATE 3 · Los que siguen de servicio",
      monstruos: [
        { name: "Armadura Animada", n: 3 },
        { name: "Espada Voladora Animada", n: 4 },
        { name: "Escoba Animada", n: 4 },
      ],
      xp: 1000,
      nota:
        "Clímax, por debajo de lo alto (1200) a propósito, porque llega con el grupo ya " +
        "gastado. Regla del sitio: no bajan del séptimo escalón y dejan de perseguir a quien " +
        "baje. Las escobas no atacan a nadie que no haya tocado una esfera — barren, estorban " +
        "y ocupan casillas. Si el grupo huye, las armaduras vuelven a sus nichos y el combate " +
        "se puede repetir otro día igual.",
    },
  ],

  recompensa:
    "50 po del ayuntamiento (25 por adelantado) y la comida pagada en la taberna mientras el " +
    "asunto siga abierto. De los cadáveres del cráter: un colgante de plata con el ojo y el " +
    "triángulo (no es mágico; abre conversaciones con cualquier clérigo de Ioun) y un diario " +
    "en un idioma que nadie en Byroden lee. De las armaduras: la placa de bronce con los cinco " +
    "nombres. Y si negociaron con los goblinoides, el nombre de su jefe y hacia dónde tiró.",

  siFalla:
    "Si el grupo huye o cae, nadie muere en el bosque: los saqueadores rematan y saquean, pero " +
    "arrastran a los inconscientes hasta la linde para pedir rescate al pueblo (20 po por " +
    "cabeza, que Byroden paga a regañadientes). Lo que se pierde es el TIEMPO: en dos semanas " +
    "los goblinoides han sacado la segunda esfera y hay cinco huecos vacíos en la puerta. Que " +
    "el zigurat esté abierto cuando el grupo vuelva es un final perfectamente válido, y mucho " +
    "peor que perder una pelea.",

  // Se encuentra sola si alguien mira los árboles al entrar: no hacen falta ni
  // el alguacil ni el temblor. Es la más fácil de las seis a propósito — es la
  // que arrastra la campaña, y no puede depender de que el grupo pase por el
  // ayuntamiento.
  descubrimiento: {
    pericia: "Percepción", cd: 12,
    texto:
      "Los árboles del claro no están talados: están tumbados hacia fuera, en círculo, " +
      "empujados desde el centro. Y desde donde estáis se ve algo gris entre las copas que " +
      "no debería estar a esa altura.",
  },

  body:
    "El alguacil de Byroden paga por saber qué ha salido del suelo en la linde del bosque, al " +
    "norte del pueblo. Lo que se sabe: hubo un temblor de madrugada, el agua de los pozos sabe " +
    "a metal y los pájaros se han ido. Hay que ir, mirar y volver a contarlo. Nadie ha pedido " +
    "que se arregle nada.",
};
