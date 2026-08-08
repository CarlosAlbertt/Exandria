// Quién fue quién: los seres y las personas que salen cuando alguien pregunta
// por qué Tal'Dorei es como es.
//
// ⚠️ **NO es la cronología** (`data/history.ts`, que va por años) **ni el hilo de
// Thordak** (`data/susurrado.ts`, que va por temas). Aquí el sujeto es SIEMPRE
// alguien: la rebelde que fundó el reino, los reyes a los que echó, la cosa que
// congeló el continente, los tres dragones que acompañaban a Thordak, los que
// tomaron Piedrablanca y los que mandan hoy. Si una entrada se puede contar sin
// nombrar a nadie, no es de este archivo.
//
// **Dos reglas de voz, heredadas de `susurrado.ts` y pedidas expresamente:**
//
// 1. **Sin fechas.** Esto es lo que se cuenta, no una tabla cronológica — para
//    los años ya está `HISTORY_TIMELINE`. Y hay motivo de fondo: las fuentes
//    publicadas **no se ponen de acuerdo** en cuándo cayó el Cónclave Cromático
//    (ver el aviso en `data/history.ts`). Escribir «hace una generación» no
//    envejece mal ni obliga a elegir bando en esa discusión.
// 2. **Los héroes que mataron a los dragones NO se nombran.** Se les cita por lo
//    que hicieron —«los que la recuperaron», «quien lo remató»— igual que hace
//    `thordak-final`. Nombrarlos convertiría en dato de consulta lo que el grupo
//    debería descubrir en la mesa, y el saber de esta app existe para lo
//    contrario.
//
// ⚠️ **Redacción PROPIA.** Se leyó la wiki de Critical Role para documentarse
// —los HECHOS son de la ambientación— pero de su prosa no se copia ni se traduce
// una línea, igual que con los blurbs del Monster Manual. Material de fans, no
// oficial.
//
// Todas las entradas caen en `profundo` al pasar por `data/saber.ts`: nadie nace
// sabiendo esto, y el reparto de `tier` es el mismo criterio que en
// `susurrado.ts` — erudito lo que estudia un historiador, oculto lo que hay que
// ganarse jugando, secreto lo que decide soltar el DM.

import type { ContinentLoreEntry } from "@/data/continentes";

export const FIGURAS_LORE: ContinentLoreEntry[] = [
  /* ===================== LA FUNDACIÓN: ZAN Y LOS DRASSIG ================= */
  {
    id: "drassig-reyes",
    continent: "Tal'Dorei",
    tier: "erudito",
    skill: "Historia",
    topic: "La fundación",
    title: "Los reyes que hubo antes",
    text:
      "Antes de que estas tierras se llamaran Tal'Dorei se llamaban Gwessar, y las mandaba una " +
      "dinastía humana que fue empeorando con cada heredero. El último de ellos gobernaba ya " +
      "sin más argumento que el miedo: hostigó a los elfos del oeste, quemó lo que no se le " +
      "sometía y partió el país en bandos. La guerra que salió de ahí duró tanto que la gente " +
      "dejó de contarla por batallas y empezó a contarla por generaciones.",
  },
  {
    id: "drassig-pacto",
    continent: "Tal'Dorei",
    tier: "oculto",
    topic: "La fundación",
    title: "Con qué pagaban su suerte",
    text:
      "Aquella casa no aguantó tanto solo por sus ejércitos. En algún punto de su decadencia " +
      "cerraron un trato con algo de los infiernos, y de ahí les venían las victorias que no " +
      "se explicaban y los herederos que sobrevivían a lo que no se sobrevive. El pacto se " +
      "rompió cuando se rompió la línea de sangre, no antes: por eso la guerra no terminó con " +
      "una rendición, sino con un exterminio.",
  },
  {
    id: "zan-quien",
    continent: "Tal'Dorei",
    tier: "erudito",
    skill: "Historia",
    topic: "Zan Tal'Dorei",
    title: "La rebelde que dio nombre al reino",
    text:
      "Salió de Syngorn, no de ninguna corte: una humana criada entre elfos que empezó mandando " +
      "a un puñado de partidas sueltas y acabó mandándolas todas. Su fama no venía de ganar " +
      "batallas grandes, sino de no perder nunca a la gente que llevaba detrás. Cuando la guerra " +
      "terminó, el reino que se levantó sobre las cenizas tomó su apellido, y así se llama " +
      "todavía.",
    poi: "Syngorn",
  },
  {
    id: "zan-emboscada",
    continent: "Tal'Dorei",
    tier: "erudito",
    skill: "Historia",
    topic: "Zan Tal'Dorei",
    title: "Lo que pasó en el bosque",
    text:
      "El golpe que le dio la guerra fue una emboscada, y fue en la Expansión Verdante. " +
      "Metió al ejército real entre los árboles fingiendo una retirada y allí dentro, donde los " +
      "caballos no sirven y las formaciones se deshacen, lo desmontó entero. El príncipe que lo " +
      "mandaba murió en ese bosque. Los elfos que hoy patrullan la espesura no lo cuentan como " +
      "una victoria humana: lo cuentan como la vez que el bosque dejó entrar a un ejército y no " +
      "lo dejó salir.",
    poi: "Syngorn",
  },
  {
    id: "zan-corona",
    continent: "Tal'Dorei",
    tier: "oculto",
    topic: "Zan Tal'Dorei",
    title: "Una corona con condiciones",
    text:
      "No se coronó sola ni por derecho de conquista. Fueron los señores del bosque quienes la " +
      "proclamaron Soberana, y lo hicieron a cambio de algo: que el reino nuevo no mandara " +
      "dentro de sus fronteras. De ese reparto vienen dos cosas que siguen vivas — que Syngorn " +
      "trate con Emon de igual a igual en vez de obedecerla, y que el trono de Tal'Dorei naciera " +
      "ya debiéndole un favor a los elfos.",
  },

  /* ========================= EL INVIERNO Y SU SEÑOR ====================== */
  {
    id: "errevon-invierno",
    continent: "Tal'Dorei",
    tier: "erudito",
    skill: "Historia",
    topic: "Errevon",
    title: "Los años sin verano",
    text:
      "Hubo un tiempo en que el invierno se quedó. No fue una mala racha de cosechas: fue el " +
      "continente entero bajo el hielo durante años, con los caminos cerrados, los puertos " +
      "helados y las ciudades comiéndose las reservas del año siguiente. Quien lo trajo se hacía " +
      "llamar el Señor de la Escarcha, y gobernó desde el frío lo que quedaba en pie. Que la " +
      "fiesta de la Cima del Invierno se siga celebrando cada año tiene que ver con esto: se " +
      "celebra que aquello acabó.",
  },
  {
    id: "errevon-skysunder",
    continent: "Tal'Dorei",
    tier: "oculto",
    topic: "Errevon",
    title: "Quién le abrió la puerta",
    text:
      "No llegó por su propio pie. Un dragón blanco anciano vio la ocasión de tener un mundo a " +
      "su medida y le abrió el paso desde un plano de hielo, contando con que un continente " +
      "congelado sería tan suyo como del recién llegado. La alianza duró lo que duran estas " +
      "cosas. Lo que sacó al Señor de la Escarcha de aquí no fue un héroe suelto: fueron el " +
      "trono, Syngorn y las casas enanas poniéndose de acuerdo una vez, que en tres siglos ha " +
      "pasado dos.",
    poi: "Riscomartillo",
  },

  /* ================= LOS OTROS TRES DEL CÓNCLAVE CROMÁTICO ============== */
  {
    id: "conclave-umbrasyl",
    continent: "Tal'Dorei",
    tier: "erudito",
    skill: "Historia",
    topic: "El Cónclave Cromático",
    title: "El negro, que quería dejar de huir",
    text:
      "El segundo del Cónclave era un dragón negro anciano al que llevaban siglos dando caza, y " +
      "lo que buscaba no era un reino: era un sitio donde no tener que mirar atrás. Se quedó con " +
      "la ciudad de las llanuras y la exprimió con método —tributo semanal en oro y en gente, " +
      "recogido por los bárbaros a los que había puesto de capataces—, que es peor que arrasarla " +
      "y dura más. Cayó el primero de los cuatro.",
  },
  {
    id: "conclave-vorugal",
    continent: "Tal'Dorei",
    tier: "erudito",
    skill: "Historia",
    topic: "El Cónclave Cromático",
    title: "El blanco, que solo cazaba",
    text:
      "El blanco no conspiraba ni negociaba: cazaba. Se le dio el norte helado y con eso le " +
      "bastaba, hasta que le tocó tirar abajo la ciudad flotante de los dracónidos, al otro lado " +
      "del mar. Le rompió las piedras que la mantenían en el aire y la dejó caer al barranco " +
      "entera. Después se instaló sobre las ruinas y puso a trabajar a los supervivientes. " +
      "Cuando murió, los que estaban abajo pasaron a ser más que sus antiguos amos, y esa cuenta " +
      "se saldó sin ayuda de nadie.",
  },
  {
    id: "conclave-raishan",
    continent: "Tal'Dorei",
    tier: "oculto",
    topic: "El Cónclave Cromático",
    title: "La verde, que nunca estuvo en el Cónclave",
    text:
      "La dragona verde enferma que montó la alianza no era un miembro más: era la única que " +
      "estaba usando a los otros tres. Entró para tener cerca al Rey Cinéreo el tiempo justo " +
      "—necesitaba algo de él para curarse la maldición que la mataba—, aguantó a su lado toda " +
      "la campaña fingiendo lealtad y se cambió de bando exactamente en el momento en que dejó " +
      "de necesitarlo. Es la única de los cuatro que salió de aquello por su propio pie, con el " +
      "cadáver a cuestas.",
  },
  {
    id: "conclave-raishan-hoy",
    continent: "Tal'Dorei",
    tier: "secreto",
    topic: "El Cónclave Cromático",
    title: "Y sigue por ahí",
    text:
      "Nadie ha traído nunca su cabeza. Lo que se sabe de ella es que llevaba generaciones " +
      "viviendo entre gente sin que se notara, porque puede parecer cualquier cosa que convenga: " +
      "una anciana en un mercado, una consejera de alguien importante, una viajera educada que " +
      "hace preguntas. Cualquier trato que alguien recuerde haber cerrado con una desconocida " +
      "demasiado bien informada es, técnicamente, sospechoso.",
  },

  /* ========================== LOS DE PIEDRABLANCA ======================= */
  {
    id: "briarwood-toma",
    continent: "Tal'Dorei",
    tier: "oculto",
    topic: "Piedrablanca",
    title: "La pareja que llegó de visita",
    text:
      "A Piedrablanca la perdió su propia cortesía. Llegaron dos nobles de fuera con maneras " +
      "impecables, se les abrieron las puertas de la casa que gobernaba la ciudad, y una noche " +
      "esa casa dejó de existir: mataron a la familia entera menos a los dos hijos que " +
      "escaparon. Luego se instalaron a gobernar como si nada, y durante años nadie de fuera " +
      "preguntó demasiado, porque la ciudad seguía enviando su mineral puntualmente.",
    poi: "Piedrablanca",
  },
  {
    id: "briarwood-delilah",
    continent: "Tal'Dorei",
    tier: "secreto",
    topic: "Piedrablanca",
    title: "Ella era la que trabajaba",
    text:
      "De los dos, el que daba miedo era él —un muerto que no se quedó muerto, con la fuerza y " +
      "el hambre que eso trae—, pero el que importaba era ella. Nigromante, y la que le había " +
      "devuelto a él de la tumba con un libro que no debería haber abierto. No tomaron la ciudad " +
      "por la ciudad: la tomaron por lo que hay enterrado debajo, y ella llevaba dentro una voz " +
      "que le iba diciendo qué hacer con ello. Ninguno de los dos era el que mandaba de verdad.",
    poi: "Piedrablanca",
  },

  /* ====================== QUIÉN MANDA HOY, EN 836 PD ==================== */
  {
    id: "consejo-hoy",
    continent: "Tal'Dorei",
    tier: "erudito",
    skill: "Historia",
    topic: "El Consejo de Tal'Dorei",
    title: "Del trono a la mesa",
    text:
      "Tal'Dorei tuvo soberanos hasta que el último abdicó, y no lo hizo por gusto: lo hizo " +
      "después de que su capital ardiera y de que quedara claro que una sola corona no había " +
      "sabido verlo venir. Lo que gobierna desde entonces es un consejo con sede en Emon, y la " +
      "gente todavía discute si eso es una república de verdad o una corte con más sillas. La " +
      "diferencia se nota en que hoy las decisiones tardan meses y antes tardaban una tarde.",
    poi: "Emon",
  },
  {
    id: "consejo-caras",
    continent: "Tal'Dorei",
    tier: "oculto",
    topic: "El Consejo de Tal'Dorei",
    title: "Las caras de la mesa",
    text:
      "Entre los que se sientan hay una archimaga que lleva media vida arreglando desastres " +
      "arcanos ajenos y es la que de verdad sostiene la defensa de la ciudad; un embajador " +
      "élfico de Syngorn, correctísimo y con su propia agenda, que además tiene familia metida " +
      "en todo esto; y una descendiente directa de la fundadora, que ocupa su asiento por " +
      "apellido y lo sabe. También hay sillas honorarias que casi nunca se ocupan: son de gente " +
      "a la que el reino le debe demasiado como para retirarles el sitio.",
    poi: "Emon",
  },
  {
    id: "camara-piedrablanca",
    continent: "Tal'Dorei",
    tier: "oculto",
    topic: "Piedrablanca",
    title: "Quién la gobierna ahora",
    text:
      "La ciudad volvió a manos de los que sobrevivieron a aquella noche y hoy la lleva una " +
      "cámara de siete, no una corona: los dos que la recuperaron se sientan en ella, pero con " +
      "voz, no con la última palabra. Es la ciudad de Tal'Dorei que más ha cambiado en una " +
      "generación —tiene guardia propia, tratos propios y una industria que no le debe nada a " +
      "Emon—, y la que peor lleva que le digan lo que tiene que hacer.",
    poi: "Piedrablanca",
  },
  {
    id: "zephrah-voz",
    continent: "Tal'Dorei",
    tier: "oculto",
    topic: "Los Ashari",
    title: "La Voz de la Tempestad",
    text:
      "El enclave del aire, en las montañas del oeste, lo dirige hoy alguien que antes de " +
      "heredar el puesto se pasó años fuera metida en lo peor que le ha pasado al continente. " +
      "Eso se nota en cómo trata a los de fuera: los Ashari llevan siglos guardando sus portales " +
      "sin explicarle nada a nadie, y desde que ella manda hablan con Emon y con Piedrablanca " +
      "como no lo habían hecho nunca. A los cuatro enclaves no les hace la misma gracia.",
    poi: "Zephrah",
  },
];
