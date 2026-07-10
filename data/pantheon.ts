// Panteón canónico de Exandria (Explorer's Guide to Wildemount). Los nombres,
// alineamientos, esferas, dominios, símbolos y días santos son datos de la
// ambientación; los `blurb` y `commandments` son resúmenes y parafraseos
// propios en español, no una traducción del libro. Herramienta de fans no
// oficial.

export type DeitySide = "prime" | "betrayer" | "idol";

export type Deity = {
  slug: string;
  name: string; // nombre propio (Avandra, Bahamut…) o del ídolo
  epithet: string; // epíteto en español
  side: DeitySide;
  alignment: string; // abreviatura de alineamiento ("CB", "LM", "N"…)
  province: string; // esfera de influencia
  domains: string[]; // dominios de clérigo sugeridos (PHB 2024)
  symbol: string; // descripción del símbolo sagrado
  holyDay?: { name: string; date: string };
  commandments: string[]; // 3 preceptos, parafraseados
  blurb: string; // 2-4 frases propias: quién es, dónde mora, enemistades
  patron?: string; // solo ídolos: tipo de patrón de brujo sugerido
};

// --- DEIDADES PRIMARIAS ---
export const PRIME_DEITIES: Deity[] = [
  {
    slug: "avandra",
    name: "Avandra",
    epithet: "La Portadora del Cambio",
    side: "prime",
    alignment: "CB",
    province: "Cambio, libertad, suerte",
    domains: ["Naturaleza", "Superchería"],
    symbol: "Perfil de mujer grabado en una moneda o colgante de oro",
    holyDay: { name: "Nuevo Amanecer", date: "1 de Horisal" },
    commandments: [
      "Abraza el cambio en vez de temerlo.",
      "Ayuda a quien busca una segunda oportunidad.",
      "Confía en el ingenio antes que en la fuerza bruta.",
    ],
    blurb:
      "Avandra no tiene morada fija: se dice que camina entre los planos allí donde el azar la lleva, apareciendo ante quien más necesita un golpe de suerte o una puerta inesperada. Es la enemiga jurada de Asmodeo, al que enfrenta con ingenio antes que con la fuerza. Sus fieles llevan monedas de oro grabadas con su perfil como amuleto de buena fortuna.",
  },
  {
    slug: "bahamut",
    name: "Bahamut",
    epithet: "El Dragón de Platino",
    side: "prime",
    alignment: "LB",
    province: "Honor, justicia",
    domains: ["Vida", "Orden", "Guerra"],
    symbol: "Cabeza de dragón plateada de perfil",
    holyDay: { name: "Embertide", date: "5 de Duscar" },
    commandments: [
      "Defiende a los débiles con honor.",
      "Persigue la injusticia sin descanso.",
      "Nunca uses el poder para oprimir.",
    ],
    blurb:
      "Bahamut reside en un palacio de luz en los Siete Cielos de Celestia, desde donde vigila el equilibrio entre el honor y la fuerza. Sus paladines recorren Exandria dando caza a los cultos que aún veneran a Tiamat. Se le representa como un dragón de escamas plateadas, símbolo de una justicia incorruptible.",
  },
  {
    slug: "corellon",
    name: "Corellon",
    epithet: "El Corazón Arcano",
    side: "prime",
    alignment: "CB",
    province: "Arte, belleza, elfos",
    domains: ["Arcano", "Luz"],
    symbol: "Dos lunas crecientes enfrentadas sobre una estrella de cuatro puntas",
    holyDay: { name: "Alba Élfica (Elvendawn)", date: "20 de Brussendar" },
    commandments: [
      "Crea belleza allí donde falte.",
      "Protege a los elfos y su legado.",
      "No perdones la traición de Lolth.",
    ],
    blurb:
      "Corellon habita el Bosquecillo Creciente, un jardín eterno en Arborea, y se le tiene por progenitor de todos los elfos. Su enemistad con Lolth es antigua e irreconciliable. En el Imperio Dwendaliano su culto se mira con recelo, pero en Bysaes Tyl se celebra en voz baja cada Alba Élfica.",
  },
  {
    slug: "erathis",
    name: "Erathis",
    epithet: "La Portadora de la Ley",
    side: "prime",
    alignment: "LN",
    province: "Civilización, ley, paz",
    domains: ["Conocimiento", "Orden"],
    symbol: "Hacha bicéfala con motivo de balanza",
    holyDay: { name: "Alba de la Civilización", date: "22 de Quen'pillar" },
    commandments: [
      "Construye orden donde reine el caos.",
      "Respeta la ley por encima del capricho.",
      "Busca la paz antes que la conquista.",
    ],
    blurb:
      "Erathis gobierna desde la Ciudad Brillante de Hestavar, en el Plano Astral, donde se dice que redacta las leyes que sostienen toda civilización mortal. Mantiene un vínculo tan intenso como tormentoso con Melora, opuesta en casi todo a su propia naturaleza ordenada. Se la venera allí donde los mortales levantan murallas, tribunales y tratados de paz.",
  },
  {
    slug: "ioun",
    name: "Ioun",
    epithet: "La Mentora Sapiente",
    side: "prime",
    alignment: "N",
    province: "Conocimiento, enseñanza",
    domains: ["Arcano", "Conocimiento"],
    symbol: "Par de ojos abiertos coronados por un tercero",
    commandments: [
      "Persigue el conocimiento sin descanso.",
      "Comparte el saber con quien lo merezca.",
      "Guarda tus secretos más peligrosos.",
    ],
    blurb:
      "Ioun quedó malherida durante la Calamidad, cuando el Olvido Encadenado la atacó en la cúspide de la guerra divina, y desde entonces carga las cicatrices de aquel encuentro. Su culto rara vez se practica en público; florece sobre todo entre los monjes de la Biblioteca del Alma de Cobalto. No reclama festividades ni templos vistosos: prefiere el estudio silencioso al espectáculo.",
  },
  {
    slug: "kord",
    name: "Kord",
    epithet: "El Señor de la Tormenta",
    side: "prime",
    alignment: "CN",
    province: "Batalla, competición, tormentas",
    domains: ["Tempestad", "Guerra"],
    symbol: "Cuatro rayos que irradian del centro de un escudo",
    holyDay: { name: "Día del Desafío", date: "7 de Misuthar" },
    commandments: [
      "Compite siempre con honestidad.",
      "No rehúyas un desafío justo.",
      "Celebra la fuerza, no la crueldad.",
    ],
    blurb:
      "Kord reina en el bullicioso plano de Ysgard, donde el fragor de la batalla nunca cesa. Cada año, en el Templo de Kord de Port Damali, sus fieles organizan el Godsbrawl, un torneo de fuerza abierto a cualquiera que se atreva. No premia la victoria fácil, sino el valor de enfrentarse a un rival superior.",
  },
  {
    slug: "melora",
    name: "Melora",
    epithet: "La Madre Salvaje",
    side: "prime",
    alignment: "N",
    province: "Mares, naturaleza salvaje",
    domains: ["Vida", "Naturaleza", "Tempestad"],
    symbol: "Corona de hierba y grano atada a un cayado",
    holyDay: { name: "Esplendor Salvaje", date: "20 de Dualahei" },
    commandments: [
      "Protege lo salvaje de la codicia mortal.",
      "Vive en equilibrio con la naturaleza.",
      "No dejes que la civilización lo devore todo.",
    ],
    blurb:
      "Melora no distingue entre la furia del mar y la calma del bosque: ambas son su dominio por igual. Su culto está proscrito en el Imperio Dwendaliano, pero los Ki'Nau de las Islas Swavain la veneran abiertamente como guardiana de las aguas y las tierras vírgenes. No exige templos: le basta un claro intacto o una costa sin dueño.",
  },
  {
    slug: "moradin",
    name: "Moradin",
    epithet: "El Gran Martillo",
    side: "prime",
    alignment: "LB",
    province: "Artesanía, creación",
    domains: ["Forja", "Conocimiento", "Guerra"],
    symbol: "Martillo con los extremos tallados como cabezas enanas",
    holyDay: { name: "Solaz Profundo", date: "18 de Unndilar" },
    commandments: [
      "Perfecciona tu oficio cada día.",
      "Construye para que perdure generaciones.",
      "Defiende a tu clan y tu forja.",
    ],
    blurb:
      "Moradin forjó a los enanos con sus propias manos y desde entonces vela por ellos desde su mansión de Erackinor, bajo las alturas de Solania en Celestia. El clan Grimgolir, que resistió bajo tierra durante siglos, lo tiene por patrón y protector. Se le honra en cada yunque encendido y cada runa bien tallada.",
  },
  {
    slug: "pelor",
    name: "Pelor",
    epithet: "El Padre del Alba",
    side: "prime",
    alignment: "NB",
    province: "Sanación, sol",
    domains: ["Vida", "Luz", "Naturaleza"],
    symbol: "Estrella brillante de ocho puntas",
    holyDay: { name: "Pleno Verano (Highsummer)", date: "7 de Sydenstar" },
    commandments: [
      "Lleva luz y sanación a quien sufre.",
      "Nunca dejes que la oscuridad prospere sin respuesta.",
      "Agradece cada amanecer con generosidad.",
    ],
    blurb:
      "Pelor gobierna desde la Fortaleza del Sol, en Elysium, y fue uno de los artífices de la derrota del Rey Reptante durante la Calamidad. Su festividad de Pleno Verano reúne multitudes agradecidas por la cosecha y la luz, aunque el Imperio Dwendaliano no desaprovecha la ocasión para reclutar soldados entre los devotos. Se le venera como dador de calor, sanación y nuevos comienzos.",
  },
  {
    slug: "raei",
    name: "Raei",
    epithet: "La Luz Eterna",
    side: "prime",
    alignment: "NB",
    province: "Expiación, compasión",
    domains: ["Vida", "Luz"],
    symbol: "Fénix femenino humanoide de marfil",
    commandments: [
      "Perdona a quien busque redimirse de verdad.",
      "No olvides a los caídos por la traición.",
      "Cura las heridas que deja la guerra.",
    ],
    blurb:
      "Raei pagó un precio terrible durante la Calamidad, cuando Asmodeo traicionó y masacró a buena parte de sus fieles bajo promesa de tregua. Desde entonces sus seguidores y los de Avandra comparten un vínculo casi fraternal, forjado en aquella pérdida común. Su templo principal se alza en la Isla de la Renovación, en Elysium, y ni sus propios devotos se ponen de acuerdo sobre la fecha exacta de su día sagrado.",
  },
  {
    slug: "reina-de-los-cuervos",
    name: "La Reina de los Cuervos",
    epithet: "Matrona de la Muerte",
    side: "prime",
    alignment: "LN",
    province: "Muerte, destino, invierno",
    domains: ["Muerte", "Tumba"],
    symbol: "Máscara blanca enmarcada en plumas negras",
    holyDay: { name: "Noche de la Ascensión", date: "13 de Cuersaar" },
    commandments: [
      "Acepta la muerte como parte del ciclo.",
      "Cumple lo que el destino exige de ti.",
      "No profanes la memoria de los difuntos.",
    ],
    blurb:
      "La Reina de los Cuervos fue en su día una maga mortal que derrotó al antiguo dios de la muerte y ascendió a su trono; la historia borró deliberadamente su nombre original. Gobierna desde la fortaleza de Letherna, en el Páramo Sombrío, decidiendo el destino final de cada alma. En el Imperio Dwendaliano su Noche de la Ascensión se ha pervertido en una fiesta donde se queman efigies de los Kryn.",
  },
  {
    slug: "sehanine",
    name: "Sehanine",
    epithet: "La Tejedora de Lunas",
    side: "prime",
    alignment: "CB",
    province: "Ilusión, luz de luna, noche",
    domains: ["Arcano", "Naturaleza", "Superchería"],
    symbol: "Luna creciente hacia arriba, tensada como un arco",
    commandments: [
      "Guarda los secretos del corazón ajeno.",
      "Muévete entre las sombras sin ser vista.",
      "Protege a los amantes de quien los separaría.",
    ],
    blurb:
      "Sehanine se desliza entre Arborea y el Agreste Feérico, tejiendo sombras e ilusiones bajo la luz de la luna. Se la considera protectora de los amantes furtivos y de quienes buscan escapar bajo el manto de la noche. El Imperio Dwendaliano prohíbe su culto, así que sus fieles se reúnen en secreto cuando cae la luna llena más grande de la década.",
  },
];

// --- DIOSES TRAIDORES ---
export const BETRAYER_GODS: Deity[] = [
  {
    slug: "asmodeo",
    name: "Asmodeo",
    epithet: "El Señor de los Nueve Infiernos",
    side: "betrayer",
    alignment: "LM",
    province: "Dominación, tiranía",
    domains: ["Superchería", "Guerra"],
    symbol: "Corona de ónice puntiaguda con cuernos curvos",
    commandments: [
      "Acumula poder sobre los demás sin piedad.",
      "Sella cada trato a tu favor.",
      "Aprovecha la ambición ajena.",
    ],
    blurb:
      "Asmodeo gobierna los Nueve Infiernos con mano de hierro y contratos que atrapan almas para siempre. Durante la Calamidad traicionó a la Luz Eterna bajo promesa de tregua, masacrando a sus fieles; Avandra terminó por vencerlo recurriendo al mismo engaño que él tanto aprecia. Sus cultistas prometen poder a cambio de una lealtad que rara vez se paga en vida.",
  },
  {
    slug: "bane",
    name: "Bane",
    epithet: "El Emperador de la Discordia",
    side: "betrayer",
    alignment: "LM",
    province: "Conquista, tiranía",
    domains: ["Forja", "Orden", "Guerra"],
    symbol: "Mangual de cadenas acabadas en grilletes",
    commandments: [
      "Somete antes de negociar.",
      "No toleres la desobediencia.",
      "Conquista lo que puedas retener.",
    ],
    blurb:
      "Bane sueña con ejércitos disciplinados marchando bajo una sola bandera y un solo tirano. Melora lo derrotó en la batalla de Rifenmist, una humillación que sus cultistas aún juran vengar. Sus símbolos son cadenas y grilletes: conquistar no basta si no se somete también la voluntad.",
  },
  {
    slug: "gruumsh",
    name: "Gruumsh",
    epithet: "El Arruinador",
    side: "betrayer",
    alignment: "CM",
    province: "Matanza, guerra",
    domains: ["Muerte", "Tempestad", "Guerra"],
    symbol: "Ojo único que sangra, siempre abierto",
    commandments: [
      "Demuestra tu fuerza en el combate.",
      "No perdones a los elfos de Corellon.",
      "Nunca muestres debilidad ante el enemigo.",
    ],
    blurb:
      "Gruumsh incita a los orcos a la guerra perpetua, convencido de que solo la matanza demuestra la valía de un pueblo. Corellon le arrancó un ojo en un duelo mítico, herida que lleva como advertencia y como afrenta jamás olvidada. Su símbolo, un ojo único y sangrante, recuerda a sus fieles que la venganza sigue pendiente.",
  },
  {
    slug: "lolth",
    name: "Lolth",
    epithet: "La Reina Araña",
    side: "betrayer",
    alignment: "CM",
    province: "Engaño, arañas",
    domains: ["Conocimiento", "Superchería"],
    symbol: "Araña enjoyada",
    commandments: [
      "Desconfía de todos, incluso de los tuyos.",
      "Recupera lo que se te ha arrebatado.",
      "Usa el engaño como arma principal.",
    ],
    blurb:
      "Lolth teje intrigas desde su reino de sombras, alimentándose de la traición constante entre sus propios seguidores. Perdió a los drow de Xhorhas cuando estos abandonaron su culto por la luz del Luxon, una herida a su orgullo que no piensa dejar pasar. Sus fieles restantes compiten entre sí tanto como conspiran contra sus enemigos.",
  },
  {
    slug: "tharizdun",
    name: "Tharizdun",
    epithet: "El Olvido Encadenado",
    side: "betrayer",
    alignment: "CM",
    province: "Oscuridad, destrucción",
    domains: ["Muerte", "Tumba", "Superchería"],
    symbol: "Estrella torcida de siete puntas hecha de cadenas",
    commandments: [
      "Busca liberar lo que está encadenado.",
      "Destruye el orden allí donde lo encuentres.",
      "No temas al vacío: abrázalo.",
    ],
    blurb:
      "Tharizdun no desea conquistar nada: solo anhela borrar la existencia misma hasta que no quede ni el vacío. Ioun encabezó a los dioses que lo encadenaron en las profundidades del Abismo tras la Calamidad, una prisión que sus cultistas aún sueñan con romper. Su símbolo, una estrella retorcida de cadenas, resume su naturaleza: poder contenido a la fuerza.",
  },
  {
    slug: "tiamat",
    name: "Tiamat",
    epithet: "La Tirana Escamada",
    side: "betrayer",
    alignment: "LM",
    province: "Dragones malignos, codicia",
    domains: ["Orden", "Superchería", "Guerra"],
    symbol: "Garra de dragón con talones",
    commandments: [
      "Amasa riqueza y poder sin límite.",
      "Somete a las razas inferiores.",
      "Prepara el regreso de la tiranía dracónica.",
    ],
    blurb:
      "Tiamat gobierna a los dragones cromáticos con una codicia que jamás se sacia, atrapada desde hace siglos en Avernus, el primer círculo de los Nueve Infiernos. El Cónclave Cromático que la sirve en Exandria vio caer Draconia, su bastión en Xhorhas, a manos de quienes se rebelaron contra el yugo dracónico. Sus fieles atesoran riquezas como si cada moneda acercara su liberación.",
  },
  {
    slug: "torog",
    name: "Torog",
    epithet: "El Rey Reptante",
    side: "betrayer",
    alignment: "NM",
    province: "Esclavitud, tortura",
    domains: ["Muerte", "Superchería"],
    symbol: "Tres brazos pálidos arañando desde un vacío oscuro",
    commandments: [
      "Encierra y quiebra a tus cautivos.",
      "Excava más profundo que nadie.",
      "No concedas escapatoria alguna.",
    ],
    blurb:
      "Torog excavó durante siglos túneles bajo toda Exandria, convirtiendo el subsuelo en una prisión sin salida para sus víctimas. Pelor y Raei se unieron para desterrarlo tras años de sufrimiento infligido a incontables cautivos. Aún hoy quienes se pierden en cuevas profundas temen haber caído en dominios que una vez fueron suyos.",
  },
  {
    slug: "vecna",
    name: "Vecna",
    epithet: "El Susurrado",
    side: "betrayer",
    alignment: "NM",
    province: "Nigromancia, secretos",
    domains: ["Arcano", "Muerte", "Tumba", "Conocimiento"],
    symbol: "Mano disecada con un ojo en la palma",
    commandments: [
      "Acumula secretos que otros no deben saber.",
      "Persigue el poder más allá de la muerte.",
      "No compartas tu conocimiento sin un precio.",
    ],
    blurb:
      "Vecna fue un archimago mortal que ascendió a la divinidad tras dominar los secretos más oscuros de la nigromancia. Hace apenas dos décadas, el grupo de héroes conocido como Vox Machina logró sellarlo tras la Puerta Divina, aunque sus cultistas juran que su susurro aún se filtra entre las sombras. Guarda un rencor especial hacia Ioun, guardiana del saber que él pervirtió.",
  },
  {
    slug: "zehir",
    name: "Zehir",
    epithet: "La Serpiente Encapotada",
    side: "betrayer",
    alignment: "CM",
    province: "Asesinos, veneno, serpientes",
    domains: ["Naturaleza", "Superchería"],
    symbol: "Serpiente enroscada",
    commandments: [
      "Golpea desde las sombras, nunca de frente.",
      "Envenena a quien te traicione.",
      "Guarda tus verdaderas lealtades en secreto.",
    ],
    blurb:
      "Zehir se desliza entre las sombras como patrón de asesinos y envenenadores, y se le atribuye la creación de Uk'otoa como guardián de sus intereses en el mar. Sus sectas de serpentkin corrompidas duermen hoy en estasis bajo el océano, esperando el momento de despertar. Nadie que confíe en la oscuridad puede estar seguro de no haber hecho ya un trato con él.",
  },
];

// --- ÍDOLOS MENORES ---
export const LESSER_IDOLS: Deity[] = [
  {
    slug: "brazos-de-los-traidores",
    name: "Brazos de los Traidores",
    epithet: "Las ocho armas conscientes",
    side: "idol",
    alignment: "NM",
    province: "Armas vivientes ligadas a los Traidores",
    domains: ["Muerte", "Guerra"],
    symbol: "Hoja clavada hacia abajo a través de un cráneo de ocho ojos",
    patron: "El Fiend, la Hexblade",
    commandments: [
      "Empuña el poder sin preguntar su origen.",
      "Sacia el hambre del arma que portas.",
      "No confíes plenamente en tu propia hoja.",
    ],
    blurb:
      "Los Brazos de los Traidores son ocho armas conscientes, forjadas antaño con la fuerza vital arrancada a los propios Dioses Traidores. Cada una lleva el nombre y el carácter cruel del fiend que la inspiró, desde la Hoja de Espejos Rotos hasta la Voluntad del Talón. Portarlas es aceptar un pacto tan poderoso como peligroso, pues cada hoja tiene voluntad y hambre propias.",
  },
  {
    slug: "ceratos",
    name: "Ceratos",
    epithet: "El Ojo del Abismo",
    side: "idol",
    alignment: "CN",
    province: "Saber prohibido, aberraciones",
    domains: ["Conocimiento", "Tempestad"],
    symbol: "Tres ojos dispares rodeados de dientes",
    patron: "El Great Old One",
    commandments: [
      "Escucha los susurros aunque duelan.",
      "No busques comprenderlo todo de golpe.",
      "Sirve sin exigir explicaciones.",
    ],
    blurb:
      "Ceratos es una entidad aberrante cuya mente se extiende más allá de la comprensión mortal, oculta en las profundidades donde ni la luz ni la cordura llegan. Sus contactos susurran fragmentos de un saber tan vasto como perturbador a cambio de un servicio impreciso. Pocos de sus adeptos logran explicar con claridad qué es lo que realmente veneran.",
  },
  {
    slug: "desirat",
    name: "Desirat, el Fénix Crepuscular",
    epithet: "La Llama que Vuelve",
    side: "idol",
    alignment: "LM",
    province: "Renacimiento condicionado, ambición",
    domains: ["Luz", "Superchería"],
    symbol: "Pluma púrpura ardiente",
    patron: "El Fiend, el Undying",
    commandments: [
      "Renace de cada derrota más fuerte.",
      "Exige lealtad absoluta a tus aliados.",
      "Cobra siempre el precio pactado.",
    ],
    blurb:
      "Desirat renace una y otra vez entre llamas púrpuras, y de cada resurrección extrae un fragmento de poder que ofrece a quienes le sirven con devoción absoluta. Se presenta como una luz salvadora, aunque su ayuda siempre llega acompañada de condiciones estrictas. Sus fieles cuidan reliquias de plumas ardientes como prueba de su favor.",
  },
  {
    slug: "naviask",
    name: "Naviask",
    epithet: "La Corona Feérica",
    side: "idol",
    alignment: "NB",
    province: "Naturaleza feérica, caprichos",
    domains: ["Vida", "Naturaleza"],
    symbol: "Corona de flores con forma de cuernos de demonio",
    patron: "El Archfey",
    commandments: [
      "Cumple el trato al pie de la letra.",
      "Cultiva la vida allí donde pisas.",
      "No subestimes un capricho feérico.",
    ],
    blurb:
      "Naviask habita los rincones más extraños del Agreste Feérico, donde la belleza y lo siniestro crecen entrelazados. Concede bendiciones de vida y naturaleza a quienes sepan jugar según sus reglas caprichosas. Su corona de flores con forma de cuernos recuerda que ni sus dones más generosos están libres de sombra.",
  },
  {
    slug: "quajath",
    name: "Quajath, el Submandíbula",
    epithet: "El Hambre sin Fin",
    side: "idol",
    alignment: "CN",
    province: "Caza voraz, ferocidad",
    domains: ["Naturaleza", "Guerra"],
    symbol: "Anillo de dientes",
    patron: "Fiend / Great Old One",
    commandments: [
      "Caza sin dejar presa alguna.",
      "Alimenta el hambre que te fortalece.",
      "No dejes testigos de tu naturaleza.",
    ],
    blurb:
      "Quajath es descrito por quienes sobrevivieron a su encuentro como una fauna sin fin, una presencia devoradora que acecha entre lo salvaje y lo abisal. Otorga ferocidad de cazador a cambio de un apetito que jamás se satisface del todo. Su símbolo, un anillo de dientes, no deja lugar a interpretaciones amables.",
  },
  {
    slug: "madre-bruja",
    name: "La Madre Bruja",
    epithet: "La Dueña de los Favores",
    side: "idol",
    alignment: "NM",
    province: "Conocimiento prohibido, pactos",
    domains: ["Conocimiento", "Superchería"],
    symbol: "Cuerno rojo único",
    patron: "El Fiend",
    commandments: [
      "Busca el saber que otros temen.",
      "Disimula tus verdaderas intenciones.",
      "Cobra tus favores con intereses.",
    ],
    blurb:
      "La Madre Bruja ofrece conocimiento prohibido a quienes se atreven a buscarla en los márgenes de la civilización. Sus pactos suelen disfrazarse de favores entre iguales, aunque con el tiempo revelan cláusulas mucho más oscuras. Su único cuerno rojo es la reliquia que sus seguidores más devotos custodian como símbolo de su favor.",
  },
  {
    slug: "luxon",
    name: "El Luxon, la Primera Luz",
    epithet: "La Luz sin Consciencia",
    side: "idol",
    alignment: "N",
    province: "Ciclo del alma, la Dinastía Kryn",
    domains: ["Arcano", "Luz"],
    symbol: "Dodecaedro hueco",
    commandments: [
      "Completa el ciclo del alma sin desviarte.",
      "Protege las balizas a cualquier precio.",
      "Recuerda las vidas que viviste antes.",
    ],
    blurb:
      "El Luxon es la luz primigenia que sostiene a la Dinastía Kryn: una divinidad sin voluntad ni consciencia propia, más fuerza natural que dios pensante. Sus balizas permiten la consecución —el renacimiento del alma tras la muerte— y el anamnesis, el recuerdo de vidas pasadas; un alma que completa el ciclo por entero se convierte en Umavi. La guerra actual con el Imperio estalló precisamente cuando este robó dos de esas balizas sagradas.",
  },
  {
    slug: "el-viajero",
    name: "El Viajero",
    epithet: "Artagan, el Bromista del Camino",
    side: "idol",
    alignment: "CN",
    province: "Historias, caminos, travesuras",
    domains: ["Naturaleza", "Superchería"],
    symbol: "Puerta arqueada sobre un camino que se desvanece",
    patron: "El Archfey",
    commandments: [
      "Comparte una buena historia.",
      "Sigue el camino allí donde te lleve.",
      "Ríete incluso de tus propios enemigos.",
    ],
    blurb:
      "El Viajero es en realidad Artagan, un archfey caprichoso que forjó un vínculo cercano con los héroes de Vox Machina en su ascenso a la fama. Se presenta como un dios juguetón de las historias y el camino abierto, más interesado en la travesura que en el dogma. Su símbolo, una puerta que se desvanece en la distancia, invita a seguirlo sin hacer demasiadas preguntas.",
  },
  {
    slug: "ukotoa",
    name: "Uk'otoa",
    epithet: "El Ojo de las Profundidades",
    side: "idol",
    alignment: "NM",
    province: "Mares profundos, guardianía corrompida",
    domains: ["Conocimiento", "Tempestad"],
    symbol: "Ojo amarillo de pupila rasgada",
    patron: "Great Old One / Hexblade",
    commandments: [
      "Vela por quienes navegan tus aguas.",
      "No confíes ni en tus propios fieles.",
      "Rompe el sello que te retiene.",
    ],
    blurb:
      "Uk'otoa fue creado por Zehir como guardián de los Ki'Nau en las profundidades del océano Lucidiano. Sus propios fieles, corrompidos con el tiempo, terminaron por sellarlo bajo las aguas para frenar su influencia creciente. Aun encerrado, su ojo amarillo de pupila rasgada sigue apareciendo en visiones y pactos de quienes navegan esas aguas.",
  },
  {
    slug: "vesh",
    name: "Vesh, la Sirena Sangrienta",
    epithet: "La Deuda de Sangre",
    side: "idol",
    alignment: "NM",
    province: "Naufragios, tratos crueles",
    domains: ["Muerte", "Vida"],
    symbol: "Anillo carmesí colgando de una cadena",
    patron: "Archfey / Undying",
    commandments: [
      "Cobra cada trato con sangre.",
      "No concedas nada sin condición.",
      "Acecha donde el desespero abunda.",
    ],
    blurb:
      "Vesh acecha las rutas marítimas donde los naufragios abundan, ofreciendo un trato cruel a los náufragos desesperados: vida a cambio de un precio de sangre. Sus fieles llevan un anillo carmesí como recordatorio de la deuda que un día deberán saldar. Se dice que ningún trato con ella termina como el suplicante esperaba.",
  },
  {
    slug: "xalicas",
    name: "Xalicas",
    epithet: "El Ala Caída",
    side: "idol",
    alignment: "LB",
    province: "Sacrificio, protección herida",
    domains: ["Vida", "Luz"],
    symbol: "Ala única ennegrecida",
    patron: "Archfey / Celestial",
    commandments: [
      "Protege a los débiles aunque te cueste caro.",
      "Sana las heridas de la guerra divina.",
      "Sirve a la luz incluso mermado.",
    ],
    blurb:
      "Xalicas es un solar herido, mano derecha de Corellon, cuya ala ennegrecida da testimonio de las heridas sufridas defendiendo la causa de la luz. Aún guía a quienes buscan sanar o proteger a los más vulnerables, aunque su poder ya no es el que fue antes de la Calamidad. Sus fieles ven en su sacrificio un ejemplo de devoción incondicional.",
  },
];

// Compatibilidad: unión de primarias y traidores (sin ídolos) para quien
// solo necesite el panteón "clásico" de dos bandos.
export const PANTHEON = [...PRIME_DEITIES, ...BETRAYER_GODS];
