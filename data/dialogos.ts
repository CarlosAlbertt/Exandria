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
//
// ⚠️ **ESTE ARCHIVO SE REESCRIBIÓ ENTERO EL 2026-08-09.** Antes tenía once
// árboles escritos contra los PNJ de `npcTemplates.ts` —Mirna, Vell, Brannoc,
// Harn…— que **no existen en la partida**: eran gente inventada en el repo, y
// los árboles colgaban de nadie. El reparto de verdad son cinco personas, que
// el usuario dictó: Silas, Garrick, Elara, Cora y Yorick. A esos cinco se les
// dan las misiones IMPORTANTES; lo secundario lo reparten cinco PNJ nuevos.
//
// ⚠️ **La niebla devora-mentes está RESUELTA** —la cerraron los aventureros— y
// por eso aquí se menciona como pasado reciente y nunca como amenaza abierta.
// El pueblo acaba de salir de una y no se ha repuesto, que es distinto.

import type { ArbolDialogo } from "@/lib/dialogo";

export const DIALOGOS: Record<string, ArbolDialogo> = {
  /* ===================== SILAS TRUMBLE, ALCALDE ========================= */
  // No contrata: te quita de encima. La única misión que da es la que le deja
  // seguir negando —que nadie diga la palabra «dragón» en la plaza— y por eso
  // va detrás de Intimidación, que es lo único que le mueve.
  silas: {
    inicio: "despacho",
    etapas: {
      despacho: {
        saludo:
          "El alcalde os recibe de pie, sin invitaros a sentaros, dándole vueltas al anillo de " +
          "sello. «Aventureros. Qué bien. Mirad, si venís por lo de la niebla, eso ya está " +
          "cerrado y el pueblo necesita pasar página. Hablad con Garrick.»",
        opciones: [
          {
            texto: "No venimos por la niebla. Venimos por el temblor de esta madrugada.",
            exito:
              "Se le va la mano al anillo. «Un asentamiento del terreno. Pasa.» Mira a la " +
              "puerta. «Y si en la plaza alguien dice otra cosa, os agradecería que no le " +
              "siguierais la corriente.»",
            siguiente: "presion",
            confianza: { exito: 5 },
          },
          {
            texto: "¿Cuánto está dispuesto a gastar el ayuntamiento?",
            chequeo: { pericia: "Persuasión", cd: 14 },
            exito:
              "«Lo justo.» Abre un cajón, lo cierra, lo vuelve a abrir. «El tesoro del pueblo " +
              "es para el pueblo, no para… expediciones.» Saca una bolsa pequeña. «Esto es mío. " +
              "Y no ha salido de aquí.»",
            fallo:
              "«El presupuesto está comprometido hasta la primavera.» Sonríe con toda la boca y " +
              "con ningún ojo. «Hablad con el comandante Garrick. Él tiene… recursos.»",
            siguiente: "presion",
            confianza: { exito: 10, fallo: -5 },
          },
          { texto: "No le molestamos más.", exito: "«Faltaría más. Y bajad la voz al salir.»", siguiente: null },
        ],
      },
      presion: {
        saludo:
          "«Escuchadme bien, y esto no lo he dicho.» Se seca la frente con un pañuelo que ya " +
          "está empapado. «Hay una cosa que no puede saberse. Si se sabe, la mitad del pueblo " +
          "hace las maletas antes del jueves.»",
        opciones: [
          {
            texto: "Suéltalo de una vez.",
            chequeo: { pericia: "Intimidación", cd: 13 },
            exito:
              "«Han visto algo verde y con alas posarse en las copas del norte.» Lo dice de " +
              "corrido, para acabar antes. «Y han desaparecido dos cabras y un perro. Este " +
              "pueblo ya ardió una vez por… por uno de esos. No pienso ser el alcalde que lo " +
              "anuncie.» Empuja la bolsa. «Id, miradlo, y volved a mí. A mí, no a Garrick.»",
            fallo:
              "«Nada. Rumores de pastores.» Se recompone el chaleco. «Este pueblo funciona con " +
              "calma, y la calma es un bien público.»",
            mision: "cria-en-el-nido",
            confianza: { exito: 10, fallo: -10 },
          },
          {
            texto: "¿Por qué no se lo cuenta a Garrick?",
            chequeo: { pericia: "Perspicacia", cd: 12 },
            exito:
              "«Porque Garrick declararía la cuarentena antes de comer.» Baja la voz. «Y una " +
              "cuarentena en temporada de madera es este pueblo cerrado hasta el deshielo. " +
              "No es cobardía. Son las cuentas.» Casi suena honesto.",
            fallo: "«Garrick tiene sus competencias y yo las mías.» Y ahí se acabó.",
            confianza: { exito: 5, fallo: -5 },
          },
          { texto: "Lo pensaremos.", exito: "«Pensadlo en voz baja, os lo ruego.»", siguiente: null },
        ],
      },
    },
  },

  /* ============== GARRICK VANCE, COMANDANTE DE LA GUARDIA =============== */
  // El que sí reparte trabajo de verdad. Da las dos misiones gordas del pueblo,
  // y las da a cambio de honestidad: sus dos opciones buenas se abren
  // diciéndole la verdad a la cara, no engatusándolo.
  garrick: {
    inicio: "cuerpo-de-guardia",
    etapas: {
      "cuerpo-de-guardia": {
        saludo:
          "El semiorco os mira sin levantarse de la mesa donde está limpiando una ballesta. La " +
          "cicatriz de la quemadura le tira de medio rostro al hablar. «Forasteros. Decid lo " +
          "que venís a decir y decidlo entero. Si me lo adornáis, os acompaño a la puerta.»",
        opciones: [
          {
            texto: "Venimos a trabajar. Y no sabemos en qué nos metemos.",
            exito:
              "Deja la ballesta. «Eso último es lo primero honrado que oigo esta semana.» " +
              "Señala un taburete con la barbilla. «Sentaos.»",
            siguiente: "trabajo",
            confianza: { exito: 15 },
          },
          {
            texto: "Esa cicatriz no es de una pelea de taberna.",
            chequeo: { pericia: "Perspicacia", cd: 13 },
            exito:
              "Ni se la toca. «795. Yo tenía diecinueve años y estaba en el tejado equivocado.» " +
              "Vuelve a la ballesta. «Los que me la hicieron ya no están. El que la mandó, " +
              "tampoco. Y aun así aquí seguimos todos con la misma cara de susto.»",
            fallo:
              "«No.» Un silencio muy largo. «Y no es asunto vuestro.» Tarda en volver a hablaros.",
            siguiente: "trabajo",
            confianza: { exito: 10, fallo: -10 },
          },
          { texto: "Volveremos en otro momento.", exito: "«Aquí estaré. No me muevo nunca.»", siguiente: null },
        ],
      },
      trabajo: {
        saludo:
          "«Dos cosas me quitan el sueño, y ninguna es la que le quita el sueño al alcalde.» " +
          "Extiende un mapa mal dibujado sobre la mesa. «Una está al norte. La otra me ha " +
          "costado ocho hombres.»",
        opciones: [
          {
            texto: "Lo del norte. El temblor.",
            chequeo: { pericia: "Persuasión", cd: 12 },
            exito:
              "«Salió algo del suelo en la linde y no se cae.» Golpea el mapa con dos dedos. " +
              "«El alcalde dice que es un asentamiento del terreno. Un asentamiento del terreno " +
              "no deja las lápidas del cementerio torcidas hacia el norte.» Os mira. «Id, " +
              "miradlo y volved. No quiero heroicidades, quiero un informe.»",
            fallo:
              "«Aún no.» Enrolla el mapa. «No mando a gente que no conozco a un sitio que no " +
              "conozco yo. Volved cuando os haya visto trabajar.»",
            mision: "zigurat-de-la-linde",
            confianza: { exito: 10, fallo: -5 },
          },
          {
            texto: "Ocho hombres. Cuéntanos qué pasó.",
            chequeo: { pericia: "Perspicacia", cd: 14 },
            exito:
              "«Pagué a ocho mercenarios para limpiar un campamento goblinoide en la espesura. " +
              "Volvió uno.» Aprieta la mandíbula. «Y no repite que los mataron. Repite que los " +
              "CAMBIARON DE SITIO.» Escupe al suelo. «Mis guardias son buena gente con una " +
              "lanza y nada más. No los voy a mandar a eso.»",
            fallo:
              "«Pasó lo que pasa.» Se levanta y da por terminada esa parte de la conversación.",
            mision: "partida-que-no-volvio",
            siguiente: "armeria",
            confianza: { exito: 15, fallo: -5 },
          },
          {
            texto: "¿Qué opinas del alcalde?",
            exito:
              "«Que es un hombre decente.» Pausa. «Y que los burócratas nos van a matar a " +
              "todos. Las dos cosas caben en la misma frase, ya lo iréis viendo.»",
            confianza: { exito: 5 },
          },
          { texto: "Nos ponemos con ello.", exito: "«Ya me contaréis. Enteros, a ser posible.»", siguiente: null },
        ],
      },
      armeria: {
        saludo:
          "«Ya que os habéis ganado que os hable claro, os enseño lo único que puedo daros.» " +
          "Aparta una lona: media docena de lanzas, dos ballestas y aceite.",
        confianzaMin: 65,
        opciones: [
          {
            texto: "Aceptamos lo que puedas dar.",
            chequeo: { pericia: "Persuasión", cd: 11 },
            exito:
              "«Coged aceite. Arde, y casi todo lo que hay ahí fuera odia el fuego.» Os pone " +
              "dos frascos en la mano sin ceremonia. «No os puedo dar un ejército. Puedo daros " +
              "esto y dos guardias para vigilar un punto. Elegid bien el punto.»",
            fallo:
              "«Todavía no.» Vuelve a echar la lona. «El material del pueblo se le da a quien " +
              "lo devuelve.»",
            premio: { tipo: "objeto", name: "Frasco de aceite", qty: 2, notes: "De la armería de Byroden. Garrick lo apuntó en su lista." },
            confianza: { exito: 5, fallo: -5 },
          },
          { texto: "No hace falta.", exito: "«Eso lo dice todo el mundo hasta que hace falta.»", siguiente: null },
        ],
      },
    },
  },

  /* ============ ELARA TEJE-RAÍCES, SACERDOTISA (Y SU FACHADA) ============ */
  // ⚠️ **NO HAY FORMA DE DESTAPARLA HABLANDO, Y ES A PROPÓSITO.** Decisión del
  // usuario, 2026-08-09: ninguna tirada, ningún «casi», ninguna grieta. Su
  // árbol es té, dulzura y metáforas de raíces de principio a fin.
  //
  // La única misión que da existe para QUITÁRSELOS DE ENCIMA: los manda al
  // campanario, que está en la torre y no en la nave, y así pasan la tarde
  // lejos del altar. El jugador lee un encargo piadoso; la mesa, con el tiempo,
  // leerá otra cosa.
  //
  // ⚠️ `scripts/check-dialogos.ts` PROHÍBE vocabulario oscuro en este árbol.
  // Si alguien —yo el primero— le escribe alguna vez «ritual», «Susurrado» o
  // «sacrificio» en la boca, el gate falla. Su tapadera es una regla, no un
  // estilo.
  elara: {
    inicio: "nave",
    etapas: {
      nave: {
        saludo:
          "La anciana elfa deja la escoba apoyada en un banco y os sonríe con toda la cara. " +
          "«Pasad, pasad, que fuera hace un aire que corta. Hay té. Siempre hay té.»",
        opciones: [
          {
            texto: "Aceptamos el té.",
            exito:
              "Os sirve sin preguntar cómo lo queréis y acierta igual. «La raíz sabe dónde " +
              "está el agua antes que el árbol», dice, y se ríe sola de su propio dicho. Se " +
              "está bien aquí.",
            siguiente: "te",
            confianza: { exito: 10 },
          },
          {
            texto: "El pueblo viene de pasar algo muy feo.",
            exito:
              "Le cambia la cara, pero no a miedo: a pena. «Sí.» Os pone una mano en el brazo. " +
              "«Y lo peor ya pasó, criaturas. Ahora toca lo lento: enterrar bien, dormir mal " +
              "unos meses y volver a plantar.»",
            siguiente: "te",
            confianza: { exito: 5 },
          },
          { texto: "Solo veníamos a ver la iglesia.", exito: "«Está para eso. Y para menos, también.»", siguiente: null },
        ],
      },
      te: {
        saludo:
          "«Sentaos donde queráis, menos ahí, que la madera está podrida y os vais al suelo.» " +
          "Señala vagamente hacia el fondo de la nave y se sienta ella junto a la puerta.",
        opciones: [
          {
            texto: "¿Podemos ayudar en algo?",
            exito:
              "Se le ilumina la cara. «Pues mirad, sí. La campana.» Señala la torre. «Tres " +
              "semanas muda. Subió el chico de los Halloran y bajó con el cuello lleno de " +
              "picotazos y seis días de fiebre.» Junta las manos. «Y el día santo es dentro de " +
              "nueve. Un pueblo que acaba de pasar lo que ha pasado necesita oír su campana.»",
            mision: "colmena-del-campanario",
            confianza: { exito: 10 },
          },
          {
            texto: "¿Y esa puerta del fondo?",
            exito:
              "«La sacristía, cariño. Cuatro velas viejas y una gotera.» Se levanta a rellenar " +
              "las tazas, que no estaban vacías. «Si os aburrís de verdad, os la enseño otro " +
              "día. No hay nada, os lo aviso.»",
            confianza: { exito: 5 },
          },
          {
            texto: "Nos han dicho que la Madre Salvaje no se venera mucho por aquí.",
            exito:
              "«Poco, poco. Aquí la gente reza a lo que trae cosecha.» Sonríe. «Yo llevo " +
              "ciento cuarenta años sirviéndola y os digo una cosa: le da igual. Ella no " +
              "cuenta fieles, cuenta raíces.»",
            confianza: { exito: 5 },
          },
          { texto: "Gracias por el té.", exito: "«Volved cuando queráis. La puerta no se cierra.»", siguiente: null },
        ],
      },
    },
  },

  /* ==================== CORA MANO DE MALTA, TABERNERA =================== */
  // Lo que le faltaba, escrito aquí: enana de brazos como jamones, tercera
  // generación detrás de la misma barra, sorda de un oído de una explosión de
  // alambique. Cobra por adelantado a los forasteros y fía a los del pueblo,
  // y las dos cosas le parecen justicia. No cotillea gratis: cotillea a cambio
  // de que le compres algo, que es distinto.
  cora: {
    inicio: "barra",
    etapas: {
      barra: {
        saludo:
          "La tabernera llena tres jarras a la vez sin mirar y os grita desde la otra punta de " +
          "la barra, más alto de lo necesario. «¡Los forasteros pagan por delante! ¡No es " +
          "personal, es aritmética!»",
        opciones: [
          {
            texto: "Pagamos por delante. Y otra para ti.",
            exito:
              "Cobra, sirve, se sirve, y se apoya en la barra con los codos. «Ahora sí.» Se " +
              "señala la oreja izquierda. «Habladme por este lado, que del otro llevo sorda " +
              "desde que un alambique decidió volar en el 823.»",
            siguiente: "cotilleo",
            confianza: { exito: 15 },
          },
          {
            texto: "¿Qué se cuenta en el pueblo?",
            chequeo: { pericia: "Persuasión", cd: 12 },
            exito:
              "«Se cuenta que ya no se cuenta nada, que es lo que quiere el alcalde.» Baja la " +
              "voz un poco, que en ella sigue siendo alto. «Y se cuenta que la ruta del norte " +
              "está cortada. Eso a mí me toca el bolsillo.»",
            fallo:
              "«Se cuenta que hay quien pregunta mucho y bebe poco.» Se va a atender a otro.",
            siguiente: "cotilleo",
            confianza: { exito: 10, fallo: -5 },
          },
          { texto: "Solo estamos de paso.", exito: "«Todos estáis de paso hasta que no.»", siguiente: null },
        ],
      },
      cotilleo: {
        saludo:
          "«Mirad, yo aquí veo entrar a todo el mundo dos veces: cuando le va bien y cuando le " +
          "va mal. Y ahora mismo hay dos que me preocupan.»",
        opciones: [
          {
            texto: "¿Qué pasa con la ruta del norte?",
            chequeo: { pericia: "Supervivencia", cd: 12 },
            exito:
              "«Tres reses abiertas en el arcén y ninguna comida.» Golpea la barra. «Un lobo " +
              "mata para comer. Eso no comió.» Os mira de reojo. «Si vais, buscad una huella " +
              "más grande y con más peso, y fijaos en que va DETRÁS de las otras. Algo los " +
              "manda. Y sin esa ruta este pueblo se queda sin sal en dos semanas.»",
            fallo:
              "«Lobos, dicen.» Se encoge de hombros. «Yo sirvo cerveza, no rastreo bichos.»",
            mision: "lobo-que-no-era-lobo",
            confianza: { exito: 10, fallo: -5 },
          },
          {
            texto: "¿Y la otra persona que te preocupa?",
            chequeo: { pericia: "Perspicacia", cd: 14 },
            exito:
              "Deja el trapo. «La panadera. Doce años sin poder tener un crío y de pronto lo " +
              "tiene.» Mira hacia la puerta. «Y desde entonces su marido la mira raro y su " +
              "madre no se acuerda de ella.» Muy bajo, por fin. «Preguntadle por el cuenco. Yo " +
              "no he dicho nada y no me metáis en esto.»",
            fallo:
              "«Cosas mías.» Recoge jarras y se pone a fregar, que es su forma de colgar el " +
              "teléfono.",
            mision: "caldero-de-la-bruja",
            confianza: { exito: 15, fallo: -10 },
          },
          { texto: "Otra ronda y nos callamos.", exito: "«Eso es música.»", siguiente: null },
        ],
      },
    },
  },

  /* ======================= EL VIEJO YORICK, SEPULTURERO ================= */
  // Cobra en favores raros, no en oro: su misión se abre cantándole a una
  // lápida, que es exactamente lo que pediste que hiciera.
  yorick: {
    inicio: "jardin",
    etapas: {
      jardin: {
        saludo:
          "El sepulturero está apoyado en la pala, hablando con una lápida. Se gira a medias. " +
          "«Un momento, que Petra estaba terminando.» Pausa. Asiente a nadie. «Ya. Decidme.»",
        opciones: [
          {
            texto: "¿Petra tiene algo que contar?",
            exito:
              "«Petra ya no está, como los demás.» Sonríe y le falta un diente. «Se fueron " +
              "ayer. Todos. Recogieron sus cosas —es una forma de hablar, no tienen cosas— y " +
              "tiraron hacia el sur.» Se rasca la nuca. «Ni siquiera la muerte quiere ser " +
              "olvidada, ¿sabéis?»",
            siguiente: "favor",
            confianza: { exito: 10 },
          },
          {
            texto: "Hay una fila entera de lápidas con la misma fecha.",
            chequeo: { pericia: "Religión", cd: 11 },
            exito:
              "«795.» Clava la pala. «Cuarenta y uno el primer día, once esa semana. Los conté " +
              "yo, que alguien tenía que.» Señala al norte con el mentón. «Y esta madrugada se " +
              "han torcido. Todas. Hacia allá. Preguntadle al soldado de la cara quemada, que " +
              "ese sí se lo cree.»",
            fallo:
              "«Gente muerta.» Vuelve a cavar. «Ya me diréis qué esperabais en un cementerio.»",
            siguiente: "favor",
            confianza: { exito: 10, fallo: -5 },
          },
          { texto: "Te dejamos con ellos.", exito: "«Con ellos me dejáis siempre.»", siguiente: null },
        ],
      },
      favor: {
        saludo:
          "«Yo no cobro en monedas, que aquí abajo no valen.» Da unos golpecitos con la bota " +
          "en una lápida pequeña, sin nombre. «Cobro en favores. Y os voy a pedir uno tonto.»",
        opciones: [
          {
            texto: "Pide.",
            chequeo: { pericia: "Interpretación", cd: 12 },
            exito:
              "«Cantadle algo a esta. Cualquier cosa. Lleva sin nombre desde antes que yo.» " +
              "Escucha con los ojos cerrados y al acabar aplaude dos veces, despacio. «Bien. " +
              "Ahora lo raro: al pastor de las afueras le entra un perro en el corral con la " +
              "puerta cerrada. Todos se ríen. Yo he visto las huellas: empiezan en mitad del " +
              "barro y no vienen de ningún sitio.»",
            fallo:
              "«Ay.» Hace una mueca. «No, no. Así no. Volved cuando sepáis cantar o cuando " +
              "traigáis vino, que es lo mismo pero al revés.»",
            mision: "perro-que-va-y-viene",
            confianza: { exito: 15, fallo: -5 },
          },
          {
            texto: "¿Por qué se fueron al sur y no al norte?",
            chequeo: { pericia: "Perspicacia", cd: 15 },
            exito:
              "Se queda muy quieto, y por un momento no parece loco en absoluto. «Porque de lo " +
              "del norte se huye.» Vuelve a sonreír. «Lo de la niebla les daba igual, ¿eh? Eso " +
              "asustaba a los vivos. Esto otro asusta a los míos.»",
            fallo:
              "«Al sur hace mejor tiempo.» Y se ríe él solo un rato largo.",
            confianza: { exito: 10, fallo: -5 },
          },
          { texto: "Gracias, Yorick.", exito: "«A mandar. Y traed vino la próxima.»", siguiente: null },
        ],
      },
    },
  },

  /* ======================= NESSA QUILL, ESCRIBANA ======================= */
  nessa: {
    inicio: "archivo",
    etapas: {
      archivo: {
        saludo:
          "La escribana os mira por encima de unas lentes atadas con cordel, sin dejar de " +
          "copiar. «Propiedades, tercera estantería. Nacimientos, cuarta. Muertes, abajo. Y " +
          "abajo no bajo.»",
        opciones: [
          {
            texto: "¿Por qué no bajas?",
            chequeo: { pericia: "Perspicacia", cd: 11 },
            exito:
              "«Porque hay medio palmo de agua desde el deshielo y porque algo se está comiendo " +
              "las actas.» Deja la pluma. «Falta el estante entero de hace cuarenta años. Y el " +
              "agujero de la pared da al cementerio, no a la calle.»",
            fallo:
              "«Porque tengo sesenta y un años y las escaleras están mojadas.» Sigue copiando.",
            mision: "ratas-del-archivo",
            siguiente: "cuarenta",
            confianza: { exito: 10, fallo: -5 },
          },
          {
            texto: "Buscamos algo escrito sobre el temblor.",
            exito:
              "«Todo el mundo busca algo escrito, y luego nadie lo lee.» Señala un montón con " +
              "la pluma. «Hay algo. Pero está justo en el estante que se están comiendo.»",
            siguiente: "cuarenta",
          },
          { texto: "Volveremos.", exito: "«Aquí sigo. Aquí sigo siempre.»", siguiente: null },
        ],
      },
      cuarenta: {
        saludo:
          "«Y ya que estáis: esto no es la primera vez. Hace cuarenta años hubo otro temblor " +
          "igual. Está anotado. Lo anotó alguien y no volvió a leerlo nadie hasta hoy.»",
        opciones: [
          {
            texto: "Enséñanos esa anotación.",
            chequeo: { pericia: "Investigación", cd: 12 },
            exito:
              "Es una línea sola. «Temblor de madrugada. Sin daños. El agua de los pozos con " +
              "sabor.» Y debajo, con otra letra y otra tinta: «igual que la otra vez».",
            fallo:
              "Rebusca veinte minutos y no la encuentra. «Estaba en el estante que se están " +
              "comiendo.» Os mira. «¿Entendéis ahora por qué me importa el estante?»",
            confianza: { exito: 5, fallo: -5 },
          },
          { texto: "Gracias, Nessa.", exito: "«A mandar. Con papel de por medio.»", siguiente: null },
        ],
      },
    },
  },

  /* ==================== MAELA TERRONES, LABRADORA ======================= */
  maela: {
    inicio: "bancales",
    etapas: {
      bancales: {
        saludo:
          "Una mujer con las botas hasta las rodillas de barro os corta el paso en el camino " +
          "de los bancales. «Por aquí no. Y no es por antipatía, es porque el suelo se mueve.»",
        opciones: [
          {
            texto: "¿Cómo que se mueve?",
            exito:
              "«Como lo oís.» Señala una hondonada de tierra removida. «El martes se tragó una " +
              "mula delante de tres testigos. Y es semana de siembra, así que o se limpia esto " +
              "o el invierno lo pasamos contando granos.»",
            siguiente: "trato",
            confianza: { exito: 10 },
          },
          {
            texto: "Enséñanos las huellas.",
            chequeo: { pericia: "Naturaleza", cd: 12 },
            exito:
              "Hay tres bocas de túnel, no una, y todas apuntan al bosque. «Subieron después " +
              "del temblor», dice ella, que no es tonta. «Antes del temblor esto era tierra.»",
            fallo:
              "«Huellas.» Se encoge de hombros. «Yo siembro, no leo el suelo como un libro.»",
            siguiente: "trato",
            confianza: { exito: 5, fallo: -5 },
          },
          { texto: "Buscaremos otro camino.", exito: "«Buscadlo. Y con cuidado.»", siguiente: null },
        ],
      },
      trato: {
        saludo:
          "«El ayuntamiento no paga esto, ya se lo pedí. Así que lo paga el pueblo, que somos " +
          "nosotros, que somos menos ricos y más rápidos.»",
        opciones: [
          {
            texto: "¿Cuánto y para cuándo?",
            chequeo: { pericia: "Persuasión", cd: 11 },
            exito:
              "«Setenta, juntados entre todos, y para ayer.» Escupe en la mano y la tiende. " +
              "«Un consejo gratis: no bajéis a los túneles. Cebadlos arriba con una cabra y " +
              "esperad. Cuesta un día y una cabra, y os deja elegir dónde peleáis.»",
            fallo:
              "«Lo que se pueda, cuando se pueda.» No se fía todavía y no suelta la cifra.",
            mision: "ankhegs-de-los-campos",
            confianza: { exito: 10, fallo: -5 },
          },
          { texto: "Lo hablamos y volvemos.", exito: "«Hablad rápido. La siembra no espera.»", siguiente: null },
        ],
      },
    },
  },

  /* ================= BRAM HACHASECA, CAPATAZ DE LA TALA ================= */
  // Tres misiones, y la tercera es la legendaria del Ent. No la ofrece como
  // encargo: la confiesa. Es el culpable y lo sabe.
  bram: {
    inicio: "leñera",
    etapas: {
      leñera: {
        saludo:
          "El capataz parte un tronco de un golpe y os habla sin dejar de trabajar. «Si venís " +
          "a comprar leña, está apilada. Si venís a hablar del bosque, dejadme que respire.»",
        opciones: [
          {
            texto: "Del bosque. ¿Qué pasa ahí dentro?",
            chequeo: { pericia: "Persuasión", cd: 12 },
            exito:
              "Clava el hacha y por fin os mira. «Que ya no está donde lo dejas.» Escupe. " +
              "«Marcas un tronco, andas cien pasos, vuelves, y la marca sigue ahí. Lo que ha " +
              "cambiado es todo lo demás.»",
            fallo:
              "«Pasa que hay árboles.» Sigue partiendo leña. «Y que cada vez cuesta más " +
              "traerlos.»",
            siguiente: "adentro",
            confianza: { exito: 10, fallo: -5 },
          },
          {
            texto: "Nos han hablado de un carro perdido entre telarañas.",
            exito:
              "«El de las telas.» Deja el hacha. «Hay un tramo de la linde donde las telarañas " +
              "no están puestas de cualquier manera: forman pasillos. Y dentro hay un carro que " +
              "lleva ahí desde antes del invierno.»",
            siguiente: "telas",
          },
          { texto: "Te dejamos con la leña.", exito: "«Os lo agradezco.»", siguiente: null },
        ],
      },
      telas: {
        saludo:
          "«Y lo que me quita el sueño de ese carro no es la araña. Es que dentro no hay " +
          "muertos.»",
        opciones: [
          {
            texto: "¿Cómo que no hay muertos?",
            chequeo: { pericia: "Percepción", cd: 13 },
            exito:
              "«Hay ropa. Hay un diario mojado. Y hay marcas de que alguien salió de ahí por su " +
              "propio pie.» Se frota la nuca. «Hacia dentro. No hacia el camino.»",
            fallo: "«Yo no me acerqué a mirar, y vosotros tampoco deberíais.» No suelta más.",
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
              "«Dos. El tercero volvió solo y no habla.» Traga. «Los dos están vivos, o lo " +
              "estaban ayer. Arrinconados en un hueco de roca, sin agua.» Os da un cordel. " +
              "«Atadlo a un tronco. Es lo único que funciona ahí dentro.»",
            fallo:
              "«Si lo supiera estaría yo allí y no aquí partiendo leña.» Y se le nota que es " +
              "verdad, y que le duele.",
            mision: "arboles-que-se-han-movido",
            siguiente: "confesion",
            confianza: { exito: 15, fallo: -5 },
          },
          { texto: "Vamos a por ellos.", exito: "«Traedlos. Da igual cómo.»", siguiente: null },
        ],
      },
      confesion: {
        saludo:
          "Deja el hacha en el suelo, que es la primera vez que la suelta. «Ya que vais a " +
          "entrar de todas formas, os debo una verdad. Y me va a costar el puesto.»",
        confianzaMin: 70,
        opciones: [
          {
            texto: "Dila.",
            chequeo: { pericia: "Perspicacia", cd: 14 },
            exito:
              "«Llevamos tres años talando más allá del límite antiguo.» Mira al suelo. «Está " +
              "marcado. Lo marcaron antes de que naciera mi abuelo y el gremio decidió que era " +
              "una leyenda.» Se pasa la mano por la cara. «Dos aserraderos han dejado de " +
              "existir este mes. No quemados. Borrados. Y no ha quedado nada que enterrar.»",
            fallo:
              "«Nada.» Recoge el hacha. «Olvidadlo. Hablo demasiado cuando estoy cansado.»",
            mision: "el-ent-no-negocia",
            confianza: { exito: 10, fallo: -10 },
          },
          { texto: "No queremos saberlo.", exito: "«Ojalá pudiera yo elegir eso.»", siguiente: null },
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
              "«Un ala.» Señala al sur con dos dedos. «Y una partida de goblins acampada en su " +
              "tramo, que es lo que de verdad hay que quitar de en medio.»",
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

/**
 * Los PNJ que existen DE VERDAD en la partida, dictados por el usuario el
 * 2026-08-09.
 *
 * ⚠️ Va escrito a mano y aparte del resto: `check-dialogos` lo usa para exigir
 * que estos cinco tengan siempre su árbol. Si saliera de `DIALOGOS`, borrar a
 * Elara no rompería nada — y borrar a Elara sí que rompe la campaña.
 */
export const PNJ_REALES = ["silas", "garrick", "elara", "cora", "yorick"] as const;

/**
 * Lo que Elara NUNCA dice.
 *
 * Su tapadera es una regla del juego, no una cuestión de estilo: es la líder
 * local del culto y **no se la puede destapar hablando** (decisión del usuario:
 * ninguna tirada, ningún «casi»). Una palabra de estas en su boca la delata sin
 * que nadie lo haya decidido en la mesa.
 */
export const PALABRAS_PROHIBIDAS_ELARA = [
  "ritual", "susurrado", "sacrificio", "nigroman", "culto", "sótano",
  "pasadizo", "cripta", "altar", "muerto",
] as const;
