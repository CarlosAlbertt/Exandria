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
};

/** Las claves que el DM puede elegir en el panel. */
export const CLAVES_DIALOGO = Object.keys(DIALOGOS).sort();
