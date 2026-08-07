// El Susurrado, el Zigurat y el Rey Cinéreo: las tres historias que se cruzan.
//
// No son tres temas sueltos. Thordak arrasó Tal'Dorei y dejó el reino sin
// ejército ni consejo justo cuando hacía falta mirar debajo de Piedrablanca; el
// Zigurat es el sitio por donde se coló lo que había debajo; y el Susurrado es
// quien se colaba. Se descubren por separado y encajan al final, que es la
// gracia de que sean `profundo`.
//
// ⚠️ **Redacción PROPIA.** La wiki de Critical Role se leyó para documentarse
// —los HECHOS son de la ambientación— pero de su prosa no se copia ni se
// traduce una línea, igual que con los blurbs del Monster Manual. Material de
// fans, no oficial.

import type { ContinentLoreEntry } from "@/data/continentes";

export const SUSURRADO_LORE: ContinentLoreEntry[] = [
  /* ======================= THORDAK, EL REY CINÉREO ====================== */
  {
    id: "thordak-marquet",
    continent: "Tal'Dorei",
    tier: "erudito",
    skill: "Historia",
    topic: "Thordak",
    title: "Antes de Tal'Dorei, Marquet",
    text:
      "Thordak no nació siendo el azote de Tal'Dorei: se hizo un nombre a medio mundo de " +
      "distancia. Todavía sin llegar a anciano, dominaba media Marquet desde las arenas del " +
      "sur con ejércitos de kobolds y siervos serpentinos. Se le fue la mano cuando quiso " +
      "Ank'Harel: dos semanas de asedio, su hueste deshecha y él huyendo herido hacia el " +
      "norte hasta caer al mar. Durante generaciones se dio por muerto, y esa fue su mejor " +
      "baza.",
  },
  {
    id: "thordak-opash",
    continent: "Tal'Dorei",
    tier: "oculto",
    topic: "Thordak",
    title: "Lo que le hicieron en la isla",
    text:
      "No murió. Medio ahogado y a punto de acabarse, lo recogió un nigromante llamado Opash, " +
      "que lo tuvo en su laboratorio de una isla del Lucidiano abriéndolo y cerrándolo durante " +
      "años. De aquello Thordak salió más fuerte que antes, y lo primero que hizo con esa " +
      "fuerza nueva fue matar a quien se la había dado. Lo segundo, y esto es lo que casi nadie " +
      "sabe, fue quedarse sus apuntes y seguir leyendo: le interesaba mucho un dragón negro " +
      "que había esquivado la muerte volviéndose dracoliche.",
  },
  {
    id: "thordak-byroden",
    continent: "Tal'Dorei",
    tier: "erudito",
    skill: "Historia",
    topic: "Thordak",
    title: "Las Charcas y lo que ardió allí",
    text:
      "Cuando la isla se le quedó pequeña volvió a cruzar el mar y empezó por la campiña de " +
      "Mornset. Arrasó cuanto rodeaba las Charcas del Claro, y con ello Puerto Udall y Byroden, " +
      "que quedó reducido a ceniza en una sola noche del 795. Las crónicas de Emon lo apuntan " +
      "como «el drake mayor del que hay registro», que es la forma que tienen los archiveros de " +
      "decir que no sabían qué era eso. Byroden se levantó otra vez sobre sus propias ruinas en " +
      "los años siguientes, y hoy es un pueblo entero — pero quien pasee por el cementerio verá " +
      "que hay una franja de lápidas todas con la misma fecha.",
  },
  {
    id: "thordak-ancla",
    continent: "Tal'Dorei",
    tier: "erudito",
    skill: "Arcanos",
    topic: "Thordak",
    title: "El ancla del alma",
    text:
      "Nadie pudo matarlo, así que se optó por guardarlo. Un círculo de magos —de esos que se " +
      "juntan una vez por siglo y solo para lo gordo— ató su esencia al Plano Elemental del " +
      "Fuego con un artefacto hecho del corazón cristalizado de un titán primordial: un rubí " +
      "de casi seis metros, elemental de arriba abajo. El ancla no podía sacarse de aquel " +
      "plano, y sin ella Thordak no podía salir. Costó tres vidas del grupo que lo intentó, y " +
      "durante décadas pareció que había valido la pena.",
  },
  {
    id: "thordak-locura",
    continent: "Tal'Dorei",
    tier: "oculto",
    topic: "Thordak",
    title: "El error del ancla",
    text:
      "La prisión funcionaba. El problema fue que también alimentaba. Encerrado, Thordak pasó " +
      "años bebiendo del cristal que lo retenía, y salió de allí más grande y más fuerte de lo " +
      "que había entrado — y sin cabeza. El ancla le comía la cordura al mismo ritmo que le " +
      "daba poder, y quien contaba con él para algo tenía prisa por sacarlo antes de que se le " +
      "olvidara para qué. Con el cristal intacto era prácticamente inmatable; roto, volvió a " +
      "ser un dragón. Grande, pero un dragón.",
  },
  {
    id: "thordak-conclave",
    continent: "Tal'Dorei",
    tier: "erudito",
    skill: "Historia",
    topic: "Thordak",
    title: "El Cónclave Cromático",
    text:
      "El trato lo cerró con una dragona verde que se estaba muriendo de una maldición y quería " +
      "una salida. Él dijo saber cómo; ella dijo saber cómo sacarlo. De ahí salió el Cónclave " +
      "Cromático: cuatro dragones ancianos que no se querían nada y que se pusieron de acuerdo " +
      "una sola vez. Fue suficiente. Cayeron sobre Emon y Westruun el mismo día, sin ultimátum " +
      "y sin exigencias, y Tal'Dorei se quedó sin capital, sin consejo y sin ejército en una " +
      "tarde.",
    poi: "Emon",
  },
  {
    id: "thordak-huevos",
    continent: "Tal'Dorei",
    tier: "secreto",
    topic: "Thordak",
    title: "Los huevos de la madriguera",
    text:
      "Bajo lo que quedaba del distrito alto de Emon, Thordak cavó y puso huevos. No hubo " +
      "pareja ni la hubo nunca: el ancla le había cambiado el cuerpo lo bastante como para " +
      "poder reproducirse solo. Es el detalle que menos se cuenta y el que más debería " +
      "preocupar, porque nadie llevó jamás la cuenta exacta de cuántos había ni de cuántos " +
      "salieron de allí.",
    poi: "Emon",
  },
  {
    id: "thordak-final",
    continent: "Tal'Dorei",
    tier: "erudito",
    skill: "Historia",
    topic: "Thordak",
    title: "Cómo se acabó",
    text:
      "Murió en Emon, en su propia madriguera, y no de un golpe limpio. Primero le astillaron " +
      "las escamas del pecho hasta dejar el cristal a la vista; luego el cristal se rompió, y " +
      "con él se le fue de golpe todo el tamaño que no era suyo. Encogido y sabiéndose muerto " +
      "intentó meterse bajo tierra, y allí abajo lo remataron. De la propia dragona verde que " +
      "lo había liberado fue la traición que empezó la caída: se cambió de bando a mitad de la " +
      "pelea, y cuando todo acabó se llevó el cadáver.",
    poi: "Emon",
  },

  /* ============================== EL ZIGURAT =========================== */
  {
    id: "zigurat-que-es",
    continent: "Tal'Dorei",
    tier: "erudito",
    skill: "Religión",
    topic: "El Zigurat",
    title: "Qué es un zigurat, en realidad",
    text:
      "No son ruinas de nadie: son templos, y son de Ioun. Se levantaron antes de la Calamidad, " +
      "cuando la Señora del Saber tenía culto abierto y no hacía falta esconder dónde se le " +
      "rezaba. Después de la Calamidad su fe quedó diezmada y perseguida por los devotos de sus " +
      "enemigos, así que sus lugares de culto se volvieron privados, y luego secretos, y luego " +
      "se olvidaron. Un zigurat abandonado no es un edificio vacío: es un sitio consagrado sin " +
      "nadie que lo vigile.",
  },
  {
    id: "zigurat-piedrablanca",
    continent: "Tal'Dorei",
    tier: "oculto",
    topic: "El Zigurat",
    title: "El que hay bajo Piedrablanca",
    text:
      "Hay uno muy hondo bajo Piedrablanca, y la única forma conocida de llegar es por túneles " +
      "excavados desde el castillo. Estuvo abandonado durante generaciones. Se sospecha que no " +
      "fue la ciudad lo que atrajo a quienes vinieron a tomarla, sino esto de debajo: eso y las " +
      "minas de piedra blanca, cuyo mineral se puede destilar en residuum puro con el " +
      "procedimiento adecuado. Un templo consagrado y un pozo de energía arcana en el mismo " +
      "sitio no es casualidad geológica.",
    poi: "Piedrablanca",
  },
  {
    id: "zigurat-orbe",
    continent: "Tal'Dorei",
    tier: "secreto",
    topic: "El Zigurat",
    title: "La esfera negra",
    text:
      "El ritual que se ofició allí abajo se interrumpió a media faena, y aun así funcionó a " +
      "medias: dejó flotando una esfera negra que se traga lo que la toca y apaga toda magia a " +
      "su alrededor. Quien lo estaba oficiando no sabía qué era ni para qué servía; solo que " +
      "era demasiado pronto. Con el tiempo esa misma propiedad de anular magia la volvió útil, " +
      "y la cámara acabó usándose como sala de consejo: es el único sitio de la ciudad donde " +
      "nadie puede escuchar por medios arcanos ni entrar con la cara de otro.",
    poi: "Piedrablanca",
  },
  {
    id: "zigurat-tres",
    continent: "Tal'Dorei",
    tier: "oculto",
    topic: "El Zigurat",
    title: "No es uno, son tres",
    text:
      "El de Piedrablanca no está solo. Hay otro bajo el salón de un gremio de cazadores en " +
      "Vasselheim, custodiado por una esfinge y todavía en uso como lo que es —el único que " +
      "sigue sirviendo a Ioun—, y un tercero perdido entre montañas de Marquet, donde se " +
      "ofició otro ritual cuando el de Piedrablanca ya se había estropeado. Tres templos de la " +
      "diosa del conocimiento, repartidos por tres continentes, y dos de ellos tomados.",
  },
  {
    id: "zigurat-porque",
    continent: "Tal'Dorei",
    tier: "secreto",
    topic: "El Zigurat",
    title: "Por qué precisamente los suyos",
    text:
      "La elección de los zigurats no fue de conveniencia, fue de significado. Ioun es la " +
      "diosa del saber que se comparte; el Susurrado es el patrón del saber que se guarda. Son " +
      "la misma cosa vuelta del revés. Corromper los templos de ella para hacerse un camino él " +
      "no era solo aprovechar un sitio consagrado que estaba a mano: era la parte del ritual " +
      "que le daba fuerza.",
  },

  /* ============================ EL SUSURRADO =========================== */
  {
    id: "susurrado-quien",
    continent: "Exandria",
    tier: "erudito",
    skill: "Religión",
    topic: "El Susurrado",
    title: "El Rey que no Muere",
    text:
      "Se le llama de muchas maneras y ninguna es su nombre: el Susurrado, el Archiliche, el " +
      "Rey que no Muere, el Señor de la Torre Podrida. Empezó siendo un mago mortal, y esa es " +
      "la parte que se le suele olvidar a quien lo teme. Su terreno es la nigromancia y los " +
      "secretos, y su símbolo —una mano seca con un ojo en la palma— se pinta poco y se " +
      "reconoce menos, que es exactamente como él lo quiere.",
  },
  {
    id: "susurrado-liche",
    continent: "Exandria",
    tier: "erudito",
    skill: "Historia",
    topic: "El Susurrado",
    title: "Un siglo antes de la Calamidad",
    text:
      "Alcanzó la lichdom un siglo antes de la Calamidad, juntó seguidores y muertos y se " +
      "marchó con todos ellos al Páramo Sombrío, donde tomó una ciudad y levantó su torre. " +
      "Desde allí aprendió a aprovechar el solsticio celeste —una confluencia de líneas de " +
      "energía— para abrir portales donde le convenía: golpeaba con precisión y se retiraba " +
      "antes de que nadie pudiera reunir tropas. A sus enemigos viejos los fue doblegando uno " +
      "a uno, y a los que no se doblegaban los mataba y los levantaba después, ya leales.",
  },
  {
    id: "susurrado-envidia",
    continent: "Exandria",
    tier: "oculto",
    topic: "El Susurrado",
    title: "Copió el camino de otra",
    text:
      "Su plan no fue original y él lo sabía. En el Páramo Sombrío tenía delante el ejemplo de " +
      "la Matriarca Cuervo: una maga mortal que había ocupado el puesto de un dios y se había " +
      "quedado con él. Le dio envidia, montó su propio culto y se dedicó a desenterrar el " +
      "ritual con el que ella lo había conseguido. Todo lo que ha hecho desde entonces —los " +
      "zigurats incluidos— es la misma receta, repetida con paciencia de muerto.",
  },
  {
    id: "susurrado-kas",
    continent: "Exandria",
    tier: "secreto",
    topic: "El Susurrado",
    title: "El teniente y la espada",
    text:
      "Tuvo un lugarteniente que había sido rival y aceptó el vampirismo a cambio de servirle. " +
      "El Susurrado le forjó una hoja y le metió dentro un pedazo de su propia conciencia, que " +
      "es la clase de regalo que solo hace quien se cree que no puede perder. Cuando por fin " +
      "intentó ascender, en lo alto de su torre y ya sitiado por un ejército, ganó el duelo " +
      "contra el campeón que subió a por él — y fue entonces, agotado, cuando su propio " +
      "teniente le clavó la espada que le había dado. Se destruyeron los dos. De él solo " +
      "quedaron una mano y un ojo.",
  },
  {
    id: "susurrado-remanentes",
    continent: "Exandria",
    tier: "oculto",
    topic: "El Susurrado",
    title: "Los Remanentes",
    text:
      "Una mano, un ojo y algo peor: la costumbre. Con los siglos pasó a ser una especie de " +
      "santo menor de los secretos que se codician, y ese culto de poca monta le fue devolviendo " +
      "poder. Sus fieles, repartidos por toda Exandria, se llaman los Remanentes y están " +
      "dispuestos a morir para abrirle el camino de vuelta. Parte de la ventaja es que no saben " +
      "casi nada: él los mantiene a oscuras, y ellos lo entienden como una señal de confianza.",
  },
  {
    id: "susurrado-trato",
    continent: "Tal'Dorei",
    tier: "secreto",
    topic: "El Susurrado",
    title: "Cómo llega, en la práctica",
    text:
      "No aparece con truenos. Aparece cuando alguien está desesperado y grita al vacío, y el " +
      "vacío contesta que puede ayudar. Así entró en Piedrablanca: una viuda a la que se le " +
      "murió el marido antes de llegar con la cura, unas indicaciones en sueños que ella " +
      "siguió sin preguntar, un viejo laboratorio al final del camino y, allí, lo que hacía " +
      "falta para devolverlo — a cambio de servicio. El muerto volvió atado a él. Ella también, " +
      "aunque tardó más en enterarse.",
    poi: "Piedrablanca",
  },
];
