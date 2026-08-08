// Las conversaciones escritas, con tiradas y consecuencias.
//
// Cada PNJ que tenga `dialogo` en `location_npcs` habla por aquí: opciones con
// **CD escrita en la propia opción**, éxito y fracaso distintos, y etapas que se
// abren según cómo vaya la cosa. Lo que la IA no puede hacer es esto —repartir
// un objeto cuando toca y solo cuando toca—, y lo que esto no puede hacer es
// contestar a lo que no está previsto: por eso la caja de texto libre con IA se
// queda debajo, con el mismo `prompt` del PNJ.
//
// ⚠️ **La clave es estable y el id del PNJ no.** Los PNJ son filas que crea el
// DM; si borra y recrea a alguien, el id cambia. Por eso el árbol se ata por
// esta clave (`location_npcs.dialogo`, schema_v26) y no por `npc:42`.

import type { ArbolDialogo } from "@/lib/dialogo";

export const DIALOGOS: Record<string, ArbolDialogo> = {
  /* =========================== MIRNA, LA TABERNERA ======================= */
  // Tres etapas: te sirve, te habla, te cuenta lo suyo. Lo del 795 es lo
  // último y hay que ganárselo — está escrito en su `prompt` que no lo suelta.
  mirna: {
    inicio: "barra",
    etapas: {
      barra: {
        saludo:
          "Mirna deja de secar un vaso y te mira de arriba abajo sin ninguna prisa. " +
          "«Si vas a beber, siéntate. Si vas a preguntar, pide algo primero.»",
        opciones: [
          {
            texto: "Ponme lo que estén bebiendo los demás.",
            exito:
              "Te sirve una jarra sin decir nada y da media vuelta. A la tercera, vuelve. " +
              "«¿De dónde salís vosotros?»",
            siguiente: "charla",
            confianza: { exito: 5 },
          },
          {
            texto: "Buen local. ¿Lo llevas tú sola?",
            chequeo: { pericia: "Persuasión", cd: 12 },
            exito:
              "Se le escapa media sonrisa. «Sola desde hace doce años. Y no lo cambio.» " +
              "Te pone una jarra que no has pedido y no te la cobra.",
            fallo:
              "«Llevo la taberna, no una conversación.» Se va a la otra punta de la barra " +
              "y tarda un buen rato en volver.",
            premio: { tipo: "objeto", name: "Jarra de cerveza de Byroden", notes: "Tibia y honesta." },
            siguiente: "charla",
          },
          {
            texto: "Necesito saber quién ha pasado por aquí este mes.",
            chequeo: { pericia: "Intimidación", cd: 15 },
            exito:
              "Deja el trapo. «Dos tratantes de Kymal y un tipo que no dijo su nombre y pagó " +
              "en monedas viejas. Ese me dio mala espina.» Se acerca. «Y ahora bebe algo o vete.»",
            fallo:
              "Mirna se ríe en tu cara. «Chaval, aquí ha entrado gente peor que tú y también " +
              "pagó.» Un par de parroquianos se giran. Esa vía se cierra.",
            confianza: { fallo: -15 },
          },
          { texto: "Solo miraba. Gracias.", exito: "Asiente y sigue a lo suyo.", siguiente: null },
        ],
      },

      charla: {
        role: "Tabernera · te tiene medida",
        confianzaMin: 45,
        saludo:
          "«Otra vez por aquí.» Te sirve sin preguntar. «Contadme algo de fuera, que aquí " +
          "las noticias llegan cuando ya no sirven.»",
        opciones: [
          {
            texto: "¿Qué se cuenta por el pueblo?",
            exito:
              "«El alguacil lleva meses escribiendo a Emon y Emon no contesta. Y el escribano " +
              "anda raro, más de lo suyo. Yo no digo nada, yo sirvo.»",
            confianza: { exito: 5 },
          },
          {
            texto: "El pueblo es nuevo. ¿Qué pasó aquí?",
            chequeo: { pericia: "Perspicacia", cd: 14 },
            exito:
              "Se queda quieta un momento demasiado largo. «Ardió. En el 795. Lo levantaron " +
              "otra vez porque la gente es tonta y vuelve siempre al mismo sitio.» Se seca las " +
              "manos. «Pregúntale a Vell, en el cementerio. Él los enterró.»",
            fallo:
              "«Historia antigua.» Suelta un chiste malo sobre la cerveza y no vuelve al tema.",
            siguiente: "confidencia",
          },
          { texto: "Nada, gracias.", exito: "«Aquí estaré.»", siguiente: null },
        ],
      },

      confidencia: {
        role: "Tabernera · confía en ti",
        confianzaMin: 60,
        saludo:
          "Mirna te sirve, se sirve una a ella y se apoya en la barra. Es la primera vez que " +
          "la ves sentarse. «Preguntaste por el incendio.»",
        opciones: [
          {
            texto: "Escucho.",
            exito:
              "«Yo tenía nueve años. Mi madre me metió en el pozo del corral y puso la tapa. " +
              "Estuve ahí abajo hasta que dejó de oírse.» Bebe. «No me acuerdo del fuego. Me " +
              "acuerdo del silencio de después.» Te empuja la jarra. «Invita la casa. Siempre.»",
            premio: { tipo: "oro", cantidad: 0 },
            confianza: { exito: 15 },
          },
          {
            texto: "¿Y por qué te quedaste?",
            chequeo: { pericia: "Perspicacia", cd: 13 },
            exito:
              "«Porque alguien tiene que estar cuando vuelvan.» Se da cuenta de lo que ha " +
              "dicho y se corrige demasiado deprisa. «Cuando vuelvan los que se fueron, digo.»",
            fallo: "«Porque sí.» Se levanta y vuelve a la barra.",
          },
          {
            // La panadera no es un PNJ sembrado, así que su encargo llega por
            // donde llega todo en este pueblo: la tabernera. Y Mirna solo lo
            // suelta con confianza 60, que es esta etapa.
            texto: "¿Y la panadera? No ha dormido en semanas.",
            chequeo: { pericia: "Perspicacia", cd: 14 },
            exito:
              "Mirna deja la jarra. «Doce años sin poder tener un hijo y de pronto lo tiene.» " +
              "Mira a la puerta antes de seguir. «Y desde entonces su marido la mira raro y su " +
              "madre no se acuerda de ella. Pregúntale por el cuenco. Yo no he dicho nada.»",
            fallo:
              "«Duerme lo que puede, como todas.» Se acabó la confidencia por hoy: recoge las " +
              "jarras y se pone a fregar.",
            mision: "caldero-de-la-bruja",
            confianza: { exito: 10, fallo: -10 },
          },
          { texto: "Gracias por contármelo.", exito: "Asiente una sola vez.", siguiente: null },
        ],
      },
    },
  },

  /* ========================= VELL, EL SEPULTURERO ======================== */
  vell: {
    inicio: "tumbas",
    etapas: {
      tumbas: {
        saludo:
          "El sepulturero no levanta la vista de la pala. «Si buscáis a alguien, está aquí. " +
          "Si buscáis dónde meter a alguien, hablamos.»",
        opciones: [
          {
            texto: "Hay una fila entera con la misma fecha.",
            exito:
              "Clava la pala. «795. Cuarenta y uno el primer día, once más esa semana.» " +
              "Sigue cavando. «Los conté yo. Alguien tenía que contarlos.»",
            siguiente: "cuenta",
            confianza: { exito: 10 },
          },
          {
            texto: "¿Necesitas ayuda con algo?",
            chequeo: { pericia: "Persuasión", cd: 11 },
            exito:
              "Te mira por primera vez. «Hay una losa que no puedo yo solo. Lleva ahí desde " +
              "el invierno.» Señala con la barbilla. «Si me echáis una mano, os debo una.»",
            fallo: "«No.» Vuelve a la pala.",
            siguiente: "cuenta",
          },
          { texto: "Perdona la molestia.", exito: "Gruñe algo y sigue cavando.", siguiente: null },
        ],
      },

      cuenta: {
        role: "Sepulturero · te habla",
        confianzaMin: 50,
        saludo:
          "«Otra vez.» Deja la pala apoyada, que en él es una invitación. «Preguntad.»",
        opciones: [
          {
            texto: "¿Están todos los del incendio?",
            chequeo: { pericia: "Perspicacia", cd: 15 },
            exito:
              "Tarda en contestar. «No.» Señala tres lápidas al fondo, más limpias que las " +
              "demás. «Esas tres están vacías. Nunca aparecieron los cuerpos. Las puse igual " +
              "porque las familias necesitaban un sitio donde ir.»",
            fallo:
              "«Están los que traje.» Coge la pala. No hay más conversación por hoy.",
            siguiente: "vacias",
          },
          {
            texto: "¿Vive alguien más que estuviera aquí aquel día?",
            exito:
              "«La de la taberna. Y el viejo Odo, si ese día estaba sobrio, que lo dudo.» " +
              "Escupe a un lado. «Y yo. Ya está.»",
            confianza: { exito: 5 },
          },
          { texto: "Te dejo trabajar.", exito: "Asiente una vez y vuelve a la pala.", siguiente: null },
        ],
      },

      vacias: {
        role: "Sepulturero · te cuenta lo que no cuenta",
        confianzaMin: 65,
        saludo:
          "Vell os está esperando junto a las tres lápidas limpias. «He estado pensando en " +
          "lo que preguntasteis.»",
        opciones: [
          {
            texto: "¿Qué nombres son?",
            exito:
              "«Dos hermanos y una cría. Los Halbrook.» Pasa la mano por la piedra. «El " +
              "apellido os sonará. La de la taberna es la única que quedó.»",
            premio: { tipo: "saber", ids: [] },
            confianza: { exito: 10 },
          },
          {
            texto: "¿Y si alguien los movió?",
            chequeo: { pericia: "Investigación", cd: 16 },
            exito:
              "Vell se queda callado tanto rato que crees que no va a contestar. «La tierra " +
              "de esas tres está removida por debajo. Lo noté al cavar la de al lado.» Te " +
              "mira. «No se lo he dicho a nadie. Decidid vosotros qué hacéis con eso.»",
            fallo:
              "«Aquí no se mueve nada sin que yo lo sepa.» Se ofende de verdad, y esa " +
              "conversación no vuelve.",
            confianza: { exito: 15, fallo: -10 },
          },
          { texto: "Gracias, Vell.", exito: "«Id con cuidado.»", siguiente: null },
        ],
      },
    },
  },

  /* ===================== BRANNOC, EL ALGUACIL DE BYRODEN ================= */
  // Cuatro de las quince misiones salen de él, y es a propósito: es el único
  // que puede PAGAR. Las reparte por urgencia, no por dificultad — primero los
  // bancales, que es comer este invierno, y el zigurat cuando ya no puede
  // seguir fingiendo que no ha pasado nada.
  brannoc: {
    inicio: "mesa",
    etapas: {
      mesa: {
        saludo:
          "El alguacil no levanta la vista del libro de cuentas. «Si venís a denunciar algo, " +
          "poneos a la cola. Si venís a cobrar, no hay. Y si venís a trabajar, sentaos.»",
        opciones: [
          {
            texto: "Venimos a trabajar. ¿Qué hay?",
            exito:
              "Cierra el libro con las dos manos, que es lo más parecido a alegrarse que hace. " +
              "«Hay de todo. Empezad por lo que no puede esperar.»",
            siguiente: "encargos",
            confianza: { exito: 5 },
          },
          {
            texto: "¿Qué fue el temblor de esta madrugada?",
            chequeo: { pericia: "Perspicacia", cd: 12 },
            exito:
              "Se le va la mano al cuello un momento. «No lo sé. Y llevo desde las cuatro sin " +
              "saberlo, que es peor.» Baja la voz. «El agua sabe a metal y en el cementerio se " +
              "han torcido lápidas. Alguien tiene que ir a mirar.»",
            fallo:
              "«Un temblor. Pasan.» Vuelve al libro. «Byroden lleva en pie más de lo que " +
              "parece.» No dice nada más de eso hoy.",
            siguiente: "encargos",
            confianza: { exito: 10, fallo: -5 },
          },
          { texto: "Solo pasábamos.", exito: "«Pues seguid pasando.»", siguiente: null },
        ],
      },
      encargos: {
        saludo:
          "«Tres cosas. Los bancales del norte, que no se pueden sembrar. Un campamento en la " +
          "espesura que ya me ha costado ocho hombres. Y lo del bosque, que ni sé cómo se llama.»",
        opciones: [
          {
            texto: "Los bancales. ¿Qué sale de ahí?",
            exito:
              "«Algo que se tragó una mula delante de tres testigos. Y es semana de siembra.» " +
              "Empuja una bolsa por la mesa. «Setenta, y los pone el pueblo entero.»",
            mision: "ankhegs-de-los-campos",
            confianza: { exito: 5 },
          },
          {
            texto: "Cuéntanos lo del bosque.",
            chequeo: { pericia: "Persuasión", cd: 13 },
            exito:
              "«Salió algo del suelo en la linde y está ahí colgado, sin caerse. No pido que lo " +
              "arregléis. Pido que vayáis, lo miréis y volváis a contármelo.» Cuenta veinticinco " +
              "monedas. «La otra mitad al volver, si volvéis.»",
            fallo:
              "«Cuando sepa qué es, os lo cuento. Ahora mismo lo único que sé es que no se cae, " +
              "y eso no se lo digo a nadie que no me haya demostrado que aguanta el susto.»",
            mision: "zigurat-de-la-linde",
            siguiente: "confianza-alta",
            confianza: { exito: 15, fallo: -5 },
          },
          {
            texto: "Ocho hombres es mucha gente. ¿Qué campamento es ese?",
            chequeo: { pericia: "Investigación", cd: 14 },
            exito:
              "«Goblinoides, o eso creía yo cuando pagué.» Saca un mapa manoseado. «Volvió uno " +
              "de los ocho y solo repite que ahora hay más. A los otros siete no los mataron: los " +
              "cambiaron de sitio, dice.»",
            fallo:
              "«Un campamento. Como todos.» Se cierra en banda. «No os voy a mandar a que os pase " +
              "lo mismo sin saber con quién hablo.»",
            mision: "partida-que-no-volvio",
            confianza: { exito: 10, fallo: -10 },
          },
          { texto: "Volveremos.", exito: "«Aquí estaré. Aquí estoy siempre.»", siguiente: null },
        ],
      },
      "confianza-alta": {
        saludo:
          "«Ya que estáis, hay una cuarta cosa. Y esta no se habla en la plaza ni delante de mi " +
          "escribano.» Cierra la puerta.",
        confianzaMin: 60,
        opciones: [
          {
            texto: "Cierra la puerta y dilo.",
            chequeo: { pericia: "Perspicacia", cd: 13 },
            exito:
              "«Alguien ha visto algo verde con alas posarse en las copas del norte. Y han " +
              "desaparecido dos cabras y un perro.» Traga. «Este pueblo ardió una vez por un " +
              "dragón. Si se dice en voz alta, la mitad se va antes de que comprobemos nada.»",
            fallo:
              "Se lo piensa y se echa atrás. «Nada. Cosas de pastores.» Abre la puerta otra vez.",
            mision: "cria-en-el-nido",
            confianza: { exito: 10, fallo: -5 },
          },
          { texto: "Lo dejamos aquí.", exito: "«Mejor. Yo tampoco quería decirlo.»", siguiente: null },
        ],
      },
    },
  },

  /* ===================== PERRIN LISQUET, EL ESCRIBANO =================== */
  perrin: {
    inicio: "archivo",
    etapas: {
      archivo: {
        saludo:
          "El escribano os mira por encima de unas lentes atadas con cordel. «Si es una " +
          "propiedad, tercera estantería. Si es un nacimiento, cuarta. Si es un muerto, " +
          "eso está abajo y abajo no bajo.»",
        opciones: [
          {
            texto: "¿Por qué no bajas?",
            chequeo: { pericia: "Perspicacia", cd: 11 },
            exito:
              "«Porque hay medio palmo de agua desde el deshielo y porque algo se está comiendo " +
              "las actas.» Se quita las lentes. «Falta el estante entero de hace cuarenta años. " +
              "Papel roído. Y el agujero de la pared da al cementerio, no a la calle.»",
            fallo:
              "«Porque tengo sesenta y un años y las escaleras están mojadas.» Vuelve a lo suyo.",
            mision: "ratas-del-archivo",
            siguiente: "cuarenta",
            confianza: { exito: 10, fallo: -5 },
          },
          {
            texto: "Buscamos algo escrito sobre el bosque.",
            exito:
              "«Todo el mundo busca algo escrito sobre el bosque, y el bosque no escribe.» " +
              "Señala un montón. «Lo que hay son quejas de leñadores. Cuarenta años de quejas.»",
            siguiente: "cuarenta",
          },
          { texto: "Ya volveremos.", exito: "«Aquí sigo. Aquí sigo siempre.»", siguiente: null },
        ],
      },
      cuarenta: {
        saludo:
          "«Ya que estáis: hace cuarenta años hubo otro temblor como el de esta noche. Está " +
          "anotado. Lo anotó alguien y no lo volvió a leer nadie hasta hoy.»",
        opciones: [
          {
            texto: "Enséñanos esa anotación.",
            chequeo: { pericia: "Investigación", cd: 12 },
            exito:
              "Es una línea sola, con la misma letra apretada. «Temblor de madrugada. Sin daños. " +
              "El agua de los pozos con sabor.» Y debajo, otra mano: «igual que la otra vez».",
            fallo:
              "Rebusca veinte minutos y no la encuentra. «Estaba en el estante que se están " +
              "comiendo.» Os mira. «¿Entendéis ahora por qué me importa el estante?»",
            confianza: { exito: 5, fallo: -5 },
          },
          { texto: "Gracias, Perrin.", exito: "«A mandar. Con papel de por medio.»", siguiente: null },
        ],
      },
    },
  },

  /* ======================= SELA MARROW, LA SACRISTANA =================== */
  sela: {
    inicio: "nave",
    etapas: {
      nave: {
        saludo:
          "La sacristana está encendiendo velas que ya estaban encendidas. «Podéis rezar o " +
          "podéis ayudar. Rezar lo hace todo el mundo.»",
        opciones: [
          {
            texto: "Ayudamos. ¿Qué hace falta?",
            exito:
              "«La campana.» Señala arriba con la barbilla. «Tres semanas sin tocarse. El " +
              "último que subió bajó con el cuello lleno de picotazos y seis días de fiebre.»",
            siguiente: "campanario",
            confianza: { exito: 5 },
          },
          {
            texto: "¿Por qué hay tantas velas encendidas?",
            chequeo: { pericia: "Religión", cd: 12 },
            exito:
              "«Porque esta iglesia se reconstruyó antes que las casas.» Enciende otra. «Cuando " +
              "un pueblo hace eso, no es por fe. Es por miedo a que se vuelva a apagar.»",
            fallo: "«Porque se gastan.» Y sigue encendiendo velas.",
            siguiente: "campanario",
            confianza: { exito: 10, fallo: -5 },
          },
          { texto: "Volveremos en otro momento.", exito: "«La puerta no se cierra.»", siguiente: null },
        ],
      },
      campanario: {
        saludo:
          "«El día santo es dentro de nueve días y esa campana tiene que sonar. No me importa " +
          "cómo. Sí me importa una cosa, y la voy a decir dos veces.»",
        opciones: [
          {
            texto: "Subimos nosotros.",
            chequeo: { pericia: "Persuasión", cd: 11 },
            exito:
              "«Bien.» Os pone una mano en el hombro, corta. «Nada de fuego. La viga es la " +
              "original. Si arde el campanario, esta iglesia se quema por segunda vez en su " +
              "historia y esta vez con nombre y apellidos.»",
            fallo:
              "Os mira de arriba abajo. «¿Con esas manos? Volved cuando tengáis una cuerda.» " +
              "No cede hoy.",
            mision: "colmena-del-campanario",
            confianza: { exito: 10, fallo: -10 },
          },
          { texto: "Que suba otro.", exito: "«Ya. Eso dijeron los otros.»", siguiente: null },
        ],
      },
    },
  },

  /* ============================ WREN, LA CHIQUILLA ====================== */
  // La única que da una misión sin cobrar nada y sin que se la pidan: es una
  // cría, y lo que sabe lo sabe porque nadie la vigila.
  wren: {
    inicio: "tapia",
    etapas: {
      tapia: {
        saludo:
          "Una cría de unos once años, sentada en la tapia del cementerio, balanceando las " +
          "piernas. «Vosotros no sois de aquí. Lo sé porque miráis las cosas.»",
        opciones: [
          {
            texto: "¿Y tú qué miras?",
            chequeo: { pericia: "Perspicacia", cd: 10 },
            exito:
              "«Todo.» Se encoge de hombros. «Nadie mira a los críos, así que los críos miramos " +
              "a todos.» Baja la voz, encantada. «¿Queréis saber algo que no sabe ni el alguacil?»",
            fallo:
              "«Pájaros.» Y se queda mirando los pájaros hasta que os vais, que es su forma de " +
              "decir que no le habéis caído bien.",
            siguiente: "secreto",
            confianza: { exito: 10, fallo: -5 },
          },
          { texto: "Nada. Sigue con lo tuyo.", exito: "«Vale.» Vuelve a los pájaros.", siguiente: null },
        ],
      },
      secreto: {
        saludo:
          "«El pastor de las afueras dice que le entra un perro en el corral con la puerta " +
          "cerrada. Todos se ríen de él. Yo lo he visto.»",
        opciones: [
          {
            texto: "¿Qué viste exactamente?",
            chequeo: { pericia: "Percepción", cd: 12 },
            exito:
              "«Que aparece.» Junta las manos y las abre. «Así. Y las huellas empiezan en mitad " +
              "del barro, sin venir de ningún sitio.» Os mira muy seria. «No es mentira. Id.»",
            fallo:
              "«Un perro.» Se cierra. «Si vais a poner esa cara vosotros también, me lo quedo " +
              "para mí.»",
            mision: "perro-que-va-y-viene",
            confianza: { exito: 10, fallo: -10 },
          },
          { texto: "Te creemos.", exito: "«Ya sabía yo.» Sonríe de oreja a oreja.", siguiente: null },
        ],
      },
    },
  },

  /* ========================= ODO EL TORCIDO, PARROQUIANO ================ */
  odo: {
    inicio: "taburete",
    etapas: {
      taburete: {
        saludo:
          "El viejo levanta la jarra sin girarse. «Si vais a preguntar por el camino del " +
          "norte, la respuesta es no. Y si vais a invitarme, la respuesta es sí.»",
        opciones: [
          {
            texto: "Te invito. Habla del camino del norte.",
            exito:
              "Se bebe media jarra de un tirón. «Tres reses abiertas en el arcén y ninguna " +
              "comida.» Se limpia la boca. «Un lobo mata para comer. Eso de ahí no comió.»",
            siguiente: "reses",
            confianza: { exito: 10 },
          },
          {
            texto: "¿Tú qué fuiste antes de esto?",
            chequeo: { pericia: "Persuasión", cd: 13 },
            exito:
              "«Carretero. Treinta y un años haciendo esa ruta.» Mira la jarra. «Hasta que " +
              "dejó de valer la pena.» Es lo más honrado que dirá en toda la noche.",
            fallo: "«Un hombre con menos preguntas encima.» Y se calla una hora.",
            siguiente: "reses",
            confianza: { exito: 10, fallo: -10 },
          },
          { texto: "Buenas noches, Odo.", exito: "«Y que lo sean.»", siguiente: null },
        ],
      },
      reses: {
        saludo:
          "«Los carreteros ya no hacen la ruta de noche. Y sin ruta, este pueblo se queda sin " +
          "sal en dos semanas. Sin sal no se cura la carne. Y ya sabéis cómo acaba eso.»",
        opciones: [
          {
            texto: "Lo miramos nosotros. Cuéntanos qué buscar.",
            chequeo: { pericia: "Supervivencia", cd: 12 },
            exito:
              "«Huellas de lobo hay muchas. Buscad una más grande, con más peso.» Golpea la " +
              "barra con el dedo. «Y fijaos en que esa va DETRÁS de las otras. Algo los manda.»",
            fallo:
              "«Buscad lobos, digo yo.» Se encoge de hombros. «Yo llevaba un carro, no un arco.»",
            mision: "lobo-que-no-era-lobo",
            confianza: { exito: 10, fallo: -5 },
          },
          { texto: "Nos vamos a dormir.", exito: "«Yo me quedo un rato. Como siempre.»", siguiente: null },
        ],
      },
    },
  },

  /* ===================== HARN BRACAMADERA, EL LEÑADOR =================== */
  harn: {
    inicio: "leña",
    etapas: {
      leña: {
        saludo:
          "El leñador parte un tronco de un golpe y os habla sin dejar de trabajar. «Si venís " +
          "a comprar leña, está apilada. Si venís a hablar del bosque, dejadme que respire.»",
        opciones: [
          {
            texto: "Del bosque. ¿Qué pasa ahí dentro?",
            chequeo: { pericia: "Persuasión", cd: 12 },
            exito:
              "Clava el hacha y por fin os mira. «Que ya no está donde lo dejas.» Escupe. «Marcas " +
              "un tronco, andas cien pasos, vuelves y la marca sigue ahí. Lo que ha cambiado es " +
              "todo lo demás.»",
            fallo:
              "«Pasa que hay árboles.» Sigue partiendo leña. «Y que cada vez cuesta más traerlos.»",
            siguiente: "adentro",
            confianza: { exito: 10, fallo: -5 },
          },
          {
            texto: "Nos han hablado de un carro perdido.",
            exito:
              "«El de las telas.» Deja el hacha. «Hay un tramo de la linde donde las telarañas " +
              "no están puestas de cualquier manera. Forman pasillos. Y dentro hay un carro.»",
            siguiente: "telas",
          },
          { texto: "Te dejamos con la leña.", exito: "«Os lo agradezco.»", siguiente: null },
        ],
      },
      telas: {
        saludo:
          "«Ese carro lleva ahí desde antes del invierno. Y lo que me quita el sueño no es la " +
          "araña: es que dentro no hay muertos.»",
        opciones: [
          {
            texto: "¿Cómo que no hay muertos?",
            chequeo: { pericia: "Percepción", cd: 13 },
            exito:
              "«Hay ropa. Hay un diario mojado. Y hay marcas de que alguien salió de ahí por su " +
              "propio pie.» Se frota la nuca. «Hacia dentro, no hacia el camino.»",
            fallo:
              "«Yo no me acerqué a mirar, y vosotros tampoco deberíais.» No suelta más.",
            mision: "tela-ordenada",
            siguiente: "adentro",
            confianza: { exito: 10, fallo: -5 },
          },
          { texto: "Lo miraremos.", exito: "«Con dos, mejor que con uno.»", siguiente: null },
        ],
      },
      adentro: {
        saludo:
          "«Y hay otra cosa, y esta es del gremio, no mía. Entraron ocho a marcar árboles y " +
          "salieron cinco, a treinta kilómetros de donde tenían que salir.»",
        opciones: [
          {
            texto: "Faltan tres. ¿Dónde están?",
            chequeo: { pericia: "Supervivencia", cd: 13 },
            exito:
              "«Dos. El tercero volvió solo.» Traga. «Los dos están vivos, o lo estaban ayer. " +
              "Arrinconados en un hueco de roca, sin agua.» Os da un cordel. «Atadlo a un tronco. " +
              "Es lo único que funciona ahí dentro.»",
            fallo:
              "«Si lo supiera, estaría yo allí y no aquí partiendo leña.» Y se le nota que es " +
              "verdad y que le duele.",
            mision: "arboles-que-se-han-movido",
            confianza: { exito: 15, fallo: -5 },
          },
          {
            texto: "¿Hasta dónde habéis estado talando?",
            chequeo: { pericia: "Perspicacia", cd: 14 },
            exito:
              "Tarda en contestar. «Más allá del límite antiguo. Tres años ya.» Mira al suelo. " +
              "«Está marcado. Lo marcaron antes de que naciera mi abuelo, y el gremio decidió que " +
              "era una leyenda.»",
            fallo:
              "«Hasta donde nos dejan.» Corta la conversación con el hacha, literalmente.",
            confianza: { exito: 10, fallo: -10 },
          },
          { texto: "Vamos a por ellos.", exito: "«Traedlos. Da igual cómo.»", siguiente: null },
        ],
      },
    },
  },

  /* ======================= HERMANO ALDRIC, SACERDOTE ==================== */
  // Del Ent no habla como de un monstruo: habla como de una cuenta pendiente.
  // La misión que da es de nivel 10 y él lo sabe — por eso no la ofrece, la
  // avisa.
  aldric: {
    inicio: "altar",
    etapas: {
      altar: {
        saludo:
          "El sacerdote está de espaldas, ordenando el altar. «El Amanecer no promete que salga " +
          "bien. Solo promete que saldrá el sol. Con eso me llega para levantarme.»",
        opciones: [
          {
            texto: "¿Qué le preocupa a un sacerdote de Byroden?",
            chequeo: { pericia: "Religión", cd: 13 },
            exito:
              "Se gira. «Que llevo tres años oyendo lo mismo en confesión y no es un pecado: es " +
              "una cuenta.» Junta las manos. «Los leñadores han talado más allá del límite " +
              "antiguo. Y el bosque cuenta mejor que nosotros.»",
            fallo:
              "«Lo mismo que a cualquiera. El invierno, la cosecha, los que faltan.» Y sigue " +
              "ordenando el altar.",
            siguiente: "cuenta",
            confianza: { exito: 10, fallo: -5 },
          },
          { texto: "Que tenga buen día, hermano.", exito: "«Que salga el sol.»", siguiente: null },
        ],
      },
      cuenta: {
        saludo:
          "«Dos aserraderos han dejado de existir. No quemados: borrados. Y no ha quedado nada " +
          "que enterrar, que en mi oficio es la parte que más dice.»",
        confianzaMin: 55,
        opciones: [
          {
            texto: "¿Y qué se hace contra eso?",
            chequeo: { pericia: "Perspicacia", cd: 15 },
            exito:
              "«Devolver el límite a su sitio antes de que lo ponga él.» Os mira sin " +
              "parpadear. «Y si llega antes, ponerse en medio. Sabiendo lo que significa ponerse " +
              "en medio, que no lo digo por bonito.»",
            fallo:
              "«Rezar.» Sonríe sin ganas. «Ya sé que no os vale. A mí tampoco, y es mi oficio.»",
            mision: "el-ent-no-negocia",
            confianza: { exito: 15, fallo: -5 },
          },
          { texto: "Aún no estamos para eso.", exito: "«No. Aún no. Volved cuando lo estéis.»", siguiente: null },
        ],
      },
    },
  },

  /* ============================== ASHWEN, DRÍADE ======================== */
  ashwen: {
    inicio: "roble",
    etapas: {
      roble: {
        saludo:
          "No estaba y ahora está, con la espalda contra un roble que tiene su misma cara. " +
          "«Habéis entrado hablando. Casi nadie entra hablando.»",
        opciones: [
          {
            texto: "¿Prefieres que entremos callados?",
            chequeo: { pericia: "Naturaleza", cd: 12 },
            exito:
              "«Prefiero que entréis sabiendo dónde pisáis.» Ladea la cabeza. «Lo hacéis. Poco, " +
              "pero lo hacéis.» El roble cruje y suena a que se ríe.",
            fallo:
              "«Prefiero que no entréis.» Y el bosque se cierra un poco alrededor, que es todo " +
              "lo que va a decir.",
            siguiente: "encargo",
            confianza: { exito: 10, fallo: -10 },
          },
          { texto: "Nos vamos por donde vinimos.", exito: "«Buena idea.»", siguiente: null },
        ],
      },
      encargo: {
        saludo:
          "«Ya que estáis y ya que habláis: hay un vigía de Syngorn que lleva tres semanas sin " +
          "informar. Un búho. De los que hablan.»",
        opciones: [
          {
            texto: "¿Qué le ha pasado?",
            chequeo: { pericia: "Percepción", cd: 12 },
            exito:
              "«Un ala.» Señala hacia el sur con dos dedos. «Y una partida de goblins acampada " +
              "en su tramo, que es lo que de verdad hay que quitar de en medio.»",
            fallo:
              "«Si lo supiera no os lo estaría contando a vosotros.» Se queda mirando el sur.",
            mision: "vigia-de-syngorn",
            siguiente: "hondo",
            confianza: { exito: 10, fallo: -5 },
          },
          { texto: "Eso es cosa de Syngorn.", exito: "«Todo es cosa de alguien. Y aquí estamos.»", siguiente: null },
        ],
      },
      hondo: {
        saludo:
          "«Y hay un sitio, más adentro, donde ni los centauros entran. No por miedo: por " +
          "respeto a lo que ya estaba antes de que hubiera pacto que respetar.»",
        confianzaMin: 65,
        opciones: [
          {
            texto: "Queremos cruzar ese valle.",
            chequeo: { pericia: "Naturaleza", cd: 16 },
            exito:
              "«Entonces id al mediodía y ni un minuto después.» Marca la hora con la sombra de " +
              "una rama. «Una hora al día bajan a beber y el paso queda libre. El que caza " +
              "también lo sabe, y por eso caza a esa hora.»",
            fallo:
              "«Queréis muchas cosas.» El roble deja de crujir. «Volved cuando el bosque os " +
              "conozca mejor.»",
            mision: "lo-que-habia-antes-del-pacto",
            confianza: { exito: 10, fallo: -10 },
          },
          { texto: "Otro día.", exito: "«El valle no se mueve. Vosotros sí.»", siguiente: null },
        ],
      },
    },
  },

  /* ================== EL GUARDIÁN DE LA RAYA, CENTAURO ================== */
  // No da un encargo: da un permiso, y lo niega. La misión que sale de aquí es
  // cruzar de todas formas, que es lo que la hace legendaria.
  "guardian-raya": {
    inicio: "raya",
    etapas: {
      raya: {
        saludo:
          "El centauro está parado justo detrás de una línea de setas blancas que cruza el " +
          "bosque de lado a lado. No ha desenvainado. No hace falta. «Ahí os quedáis.»",
        opciones: [
          {
            texto: "Venimos a pedir permiso para cruzar.",
            exito:
              "«Lo habéis pedido.» Ni un músculo. «Y ahora lo habéis oído: no.» Señala la raya " +
              "con la barbilla. «Eso no es una frontera. Es un acuerdo. No admite excepciones y " +
              "yo llevo doscientos años sin hacer ninguna.»",
            siguiente: "negativa",
            confianza: { exito: 5 },
          },
          {
            texto: "¿Qué hay al otro lado?",
            chequeo: { pericia: "Historia", cd: 14 },
            exito:
              "«Lo de una edad anterior, que nunca se fue.» Por primera vez os mira de verdad. " +
              "«Y que nunca firmó nada, así que a eso el pacto no lo cubre. Ni a vosotros " +
              "delante de eso.»",
            fallo:
              "«Nada que os incumba.» Y el bosque se queda muy callado durante un rato largo.",
            siguiente: "negativa",
            confianza: { exito: 10, fallo: -5 },
          },
          { texto: "Nos damos la vuelta.", exito: "«Sabia decisión. Se agradece.»", siguiente: null },
        ],
      },
      negativa: {
        saludo:
          "«Ahora escuchad la parte que os interesa, porque la voy a decir una vez: si cruzáis, " +
          "vendré. Y si vengo, no vendré solo.»",
        opciones: [
          {
            texto: "Vamos a cruzar igual. Dinos cómo será.",
            chequeo: { pericia: "Intimidación", cd: 20 },
            exito:
              "Tarda mucho en contestar. «Tres rondas desde que el primero pise. Vendremos en " +
              "círculo, cerrando.» Levanta una mano. «Eso es todo lo que puedo daros: el aviso. " +
              "Y no atacaremos por la espalda, que a alguno de los míos le cuesta entender.»",
            fallo:
              "«Habéis dicho lo que ibais a hacer.» Da un paso atrás, al otro lado de la raya. " +
              "«Y yo ya no tengo nada que hablar con vosotros.»",
            mision: "guardia-del-pacto",
            confianza: { exito: 5, fallo: -20 },
          },
          { texto: "No merece la pena.", exito: "«Casi nunca la merece.»", siguiente: null },
        ],
      },
    },
  },
};

/** Las claves que el DM puede elegir en el panel. */
export const CLAVES_DIALOGO = Object.keys(DIALOGOS).sort();
