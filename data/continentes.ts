// Lore de los continentes que hasta ahora solo existían como pines en el mapa:
// Marquet, Issylra y Los Dientes Rotos. Complementa data/wildemount.ts (que
// cubre el suyo) sin tocar data/taldorei.ts.
//
// Resúmenes ORIGINALES en español, convención del proyecto: los nombres y los
// hechos son de la ambientación de Critical Role; la redacción es propia y no
// reproduce el texto de ningún libro. Herramienta de fans no oficial.
//
// Cada entrada declara su `tier`, que data/saber.ts traduce a un ámbito del
// saber por origen:
//   continente → lo sabe a fondo quien es de allí (o quien lo descubra)
//   historia / arcano / religioso → erudito, se abre con la pericia
//   oculto     → no se deduce de quién eres: hay que ganárselo jugando
//   secreto    → lo revela el DM

import type { LoreSkill } from "@/data/loreTiers";

export type ContinentLoreTier = "continente" | "erudito" | "oculto" | "secreto";

export type ContinentLoreEntry = {
  /** sufijo único dentro del continente; el id final lo compone saber.ts */
  id: string;
  continent: string;
  tier: ContinentLoreTier;
  /** solo en tier "erudito" */
  skill?: LoreSkill;
  topic: string;
  title: string;
  text: string;
  /** lugar ligado, para la tirada de saber in situ de /lugar */
  poi?: string;
};

// ---------------------------------------------------------------- MARQUET --
export const MARQUET_LORE: ContinentLoreEntry[] = [
  {
    id: "geografia",
    continent: "Marquet",
    tier: "continente",
    topic: "Marquet",
    title: "Un continente que no es solo arena",
    text: "Fuera de Marquet todo el mundo habla de desiertos, pero la arena cubre apenas un tercio del continente. El resto son junglas espesas, cañones polvorientos, sierras interminables y valles altos donde se cultiva. El Rumedam ocupa el centro-norte; su hermano menor, las Arenas Panagrip, queda al sureste. Las Montañas Aggrad cierran el norte de costa a costa, y las Kaal parten el sur en dos.",
  },
  {
    id: "regiones",
    continent: "Marquet",
    tier: "continente",
    topic: "Marquet",
    title: "Cinco tierras y ningún rey",
    text: "Marquet no tiene un gobierno común. Ank'Harel manda en el Rumedam y en los oasis que la rodean. El Quórum Chandei rige las Tierras Salvajes de Oderan desde Jrusar. La Corte de la Senda Lúcida gobierna las junglas de Aeshanadoor. El Trono Estratos domina las Tierras Altas Taladas por la fuerza de las armas. Y en el Valle Hellcatch la República de Bassur gobierna sobre el papel, mientras cada aldea se las arregla como puede.",
  },
  {
    id: "gentes",
    continent: "Marquet",
    tier: "continente",
    topic: "Marquet",
    title: "Gentes de Marquet",
    text: "La gente de aquí tiende a tener el pelo y la piel más oscuros que la de tierras más al norte. En Ank'Harel mandan los humanos, pero en Jrusar se cruzan por la misma calle paquidanos, kataris, medianos, goliats, elfos, orcos, gnomos, genasi y eisfuura. En el desierto corren historias sobre los goblins Duneburrow que se cuentan hasta en la otra punta del mundo.",
  },
  {
    id: "lengua-cultura",
    continent: "Marquet",
    tier: "continente",
    topic: "Marquet",
    title: "Lengua y costumbre",
    text: "El marquesiano se habla en todo el continente, y el común se entiende con más o menos soltura según el sitio. Los mercaderes visten linos claros con ribetes de oro y púrpura. Se juega al Gambito de Ord, se sazona con fusaka y se bebe Piel de Sandkheg, un licor que se saca de la bilis del bicho que le da nombre y que no todo el mundo aguanta. Hay una canción antibélica vieja, «Que la espada críe herrumbre», que en ciertos círculos significa bastante más de lo que dice la letra.",
  },
  {
    id: "colonos",
    continent: "Marquet",
    tier: "erudito",
    skill: "Historia",
    topic: "Historia · Marquet",
    title: "La huella marquesiana en el mundo",
    text: "Tres o cuatro siglos después de la Divergencia, Marquet exportó algo más que especias. Un mercader llamado Abdar ayudó a pagar la construcción de Emon, y un distrito entero de la ciudad todavía lleva su nombre. Hacia el año 400 PD una nave de exploración marquesiana llegó a las Islas Swavain y fundó Damali en lo que hoy es la Costa del Serrallo: de aquella colonia salió, con el tiempo, el Cónclave de Clovis. Por eso el marquesiano es la lengua de la buena sociedad —y de los piratas— en aquella costa.",
  },
  {
    id: "gruumsh-alyxian",
    continent: "Marquet",
    tier: "erudito",
    skill: "Historia",
    topic: "Historia · Marquet",
    title: "El golpe que hizo el desierto",
    text: "Antes de la Calamidad, Marquet era verde de costa a costa: llanuras fértiles y jungla densa. Ya avanzada la guerra de los dioses, Gruumsh el Arruinador marchó en persona sobre una ciudad de elfos y orcos fieles a Corellon, la joya del noreste del continente, y alzó su lanza para asestar un golpe que habría esterilizado la tierra entera. Un campeón llamado Alyxian, bendecido por tres dioses a lo largo de la Calamidad, se interpuso. Lo consiguió a medias: el continente sobrevivió, pero un tercio de él se borró del mapa. La ceniza que cayó después formó el Desierto Rumedam, se alzaron las cordilleras que hoy separan unas regiones de otras, y la ciudad se hundió bajo las aguas.",
    poi: "Cael Morrow",
  },
  {
    id: "cael-morrow",
    continent: "Marquet",
    tier: "erudito",
    skill: "Historia",
    topic: "Historia · Marquet",
    title: "Cael Morrow, la Ciudad Ahogada",
    text: "El nombre significa literalmente «ciudad ahogada» en un dialecto marquesiano del norte, y es lo único que quedó de aquella joya del continente: ruinas sumergidas donde nadie baja por gusto.",
    poi: "Cael Morrow",
  },
  {
    id: "jmon-ankharel",
    continent: "Marquet",
    tier: "erudito",
    skill: "Historia",
    topic: "Historia · Marquet",
    title: "Cómo nació Ank'Harel",
    text: "Los supervivientes se echaron a andar en busca de comida y agua. Quienes cruzaron el Rumedam encontraron, justo donde había golpeado Gruumsh, un oasis. Cavaron pozos, montaron una parada de caravanas y aquello creció hasta ser un pueblo, y luego un nido de bandidos. Entonces apareció una figura de la que nadie sabía nada, J'mon Sa Ord, puso orden y coronó la ciudad: Ank'Harel, a comienzos del siglo V PD. Sigue gobernándola. También sigue siendo, cuando le conviene mostrarlo, un dragón de bronce.",
    poi: "Ank'Harel",
  },
  {
    id: "thordak",
    continent: "Marquet",
    tier: "erudito",
    skill: "Historia",
    topic: "Historia · Marquet",
    title: "Thordak y el asedio de dos semanas",
    text: "Durante siglos el dragón rojo Thordak dominó media Marquet desde las Arenas Escaldaviento, con ejércitos de kóbolds y criaturas serpentinas. Atacó Ank'Harel cuando la ciudad tenía cien o ciento cincuenta años. Dos semanas después sus huestes estaban rotas y él, herido, huyó hacia el norte sobre el océano; lo derribaron en pleno vuelo y cayó al mar. Se le dio por muerto casi dos siglos, hasta que reapareció sobre Emon.",
    poi: "Arenas Escaldaviento",
  },
  {
    id: "guerra-apice",
    continent: "Marquet",
    tier: "oculto",
    topic: "Potencias de Marquet",
    title: "La Guerra Ápice",
    text: "Hacia el año 823 PD estalló una guerra entre el Trono Estratos y la Corte de la Senda Lúcida que arrastró a media Marquet. Años de combates para terminar en tablas y una tregua incómoda; desde entonces ambas potencias se dedican a reconstruir y a mirarse de reojo. Veinte años después las tensiones siguen ahí, apenas tapadas.",
  },
  {
    id: "jmon-sa-ord",
    continent: "Marquet",
    tier: "oculto",
    topic: "Potencias de Marquet",
    title: "J'mon Sa Ord",
    text: "Soberano de Ank'Harel desde su fundación, hace cuatro siglos largos. Cambia de forma y de nombre según le conviene, no da explicaciones a nadie y ha mantenido a la ciudad neutral y próspera mientras el resto del continente se despedazaba.",
    poi: "Ank'Harel",
  },
  {
    id: "quorum-chandei",
    continent: "Marquet",
    tier: "oculto",
    topic: "Potencias de Marquet",
    title: "El Quórum Chandei",
    text: "El consejo que gobierna Jrusar y, con ella, las Tierras Salvajes de Oderan. Manda sobre la ciudad de las cinco agujas y sobre las rutas de las Sendas Honradas, que es tanto como decir sobre el comercio del noroeste.",
    poi: "Jrusar",
  },
  {
    id: "corte-senda-lucida",
    continent: "Marquet",
    tier: "oculto",
    topic: "Potencias de Marquet",
    title: "La Corte de la Senda Lúcida",
    text: "Consejo que rige las junglas de Aeshanadoor. Nació de una sociedad de orcos eruditos y mantiene esa vocación: Yios, su capital, es el techo académico del continente.",
    poi: "Yios",
  },
  {
    id: "trono-estratos",
    continent: "Marquet",
    tier: "oculto",
    topic: "Potencias de Marquet",
    title: "El Trono Estratos",
    text: "El puño militar de las Tierras Altas Taladas, con sede en Sruwargas, en lo más alto. Gobierna valles fértiles y una población rural, y no tiene reparo en recordarle a nadie quién tiene el ejército.",
    poi: "Sruwargas",
  },
  {
    id: "republica-bassur",
    continent: "Marquet",
    tier: "oculto",
    topic: "Potencias de Marquet",
    title: "La República de Bassur",
    text: "Con sede en Gujjar-Serai, la Ciudad Verde, gobierna nominalmente todo el Valle Hellcatch. En la práctica, cada ciudad y cada banda del valle hace lo que le da la gana, empezando por Bassuras.",
    poi: "Gujjar-Serai",
  },
  {
    id: "boveda-shumas",
    continent: "Marquet",
    tier: "secreto",
    topic: "Secretos de Marquet",
    title: "La Bóveda de Shumas",
    text: "Un santuario escondido en las Montañas Aggrad que perteneció a una misma fe desde el principio de la Era de los Arcanos. Poco antes de la Calamidad, los adoradores de la Serpiente Encapotada lo tomaron a sangre y fuego. Lo que guardaba nunca salió de allí.",
    poi: "Bóveda de Shumas",
  },
  {
    id: "ascuacorona",
    continent: "Marquet",
    tier: "secreto",
    topic: "Secretos de Marquet",
    title: "El zigurat de las Ascuacorona",
    text: "Dentro del anillo de agujas de las Montañas Ascuacorona hubo un zigurat que servía de puerta al Páramo de las Sombras. No era el único de su clase, y quien construyó uno rara vez se conforma con eso.",
    poi: "Montañas Ascuacorona",
  },
  {
    id: "zehir-ukotoa",
    continent: "Marquet",
    tier: "secreto",
    topic: "Secretos de Marquet",
    title: "La secta que desterró a Uk'otoa",
    text: "Poco después de que J'mon Sa Ord fuera coronado, una secta marquesiana de adoradores de Zehir logró desterrar a Uk'otoa, la criatura que guardaba a los Ki'Nau. Tras aquello llegó una oleada de colonos marquesianos a la Costa del Serrallo. Nadie dice en voz alta que las dos cosas estén relacionadas.",
  },
];

// ---------------------------------------------------------------- ISSYLRA --
export const ISSYLRA_LORE: ContinentLoreEntry[] = [
  {
    id: "geografia",
    continent: "Issylra",
    tier: "continente",
    topic: "Issylra",
    title: "Un continente enorme y casi vacío",
    text: "Issylra es vastísimo y la mayor parte sigue siendo monte sin domar. Lo poco desarrollado está en Othanzia, en torno a Vasselheim. Alrededor de la ciudad se extiende el Bosque Vesper, una taiga oscura que hacia el norte se rinde en la Tundra Thorain. Al suroeste quedan las Sunderpeak, y más allá el Monte Puente Ascendente, el más alto de toda Exandria. En el centro, el Valle Demithore; al oeste, las Utesspire, que llevan siglos impidiendo que Othanzia se expanda a costa de las repúblicas menores.",
  },
  {
    id: "clima",
    continent: "Issylra",
    tier: "continente",
    topic: "Issylra",
    title: "El frío manda",
    text: "Issylra está más al norte que Tal'Dorei y se nota: nieve, o cielo encapotado y frío, casi todo el año. Con ese clima y esas distancias la comida es un asunto serio. Las culturas de aquí giran en torno a la caza, a no desperdiciar nada y a marcar el paso de las estaciones. De vez en cuando se celebran banquetes enormes en honor de las Deidades Primordiales, y comerse un año entero de reservas en una noche tiene su propio sentido.",
  },
  {
    id: "sociedad",
    continent: "Issylra",
    tier: "continente",
    topic: "Issylra",
    title: "Un continente de extremos",
    text: "En otros sitios la fe sube y baja; aquí no hay término medio. Othanzia lo mide todo por los dioses. Las sociedades de fuera de su alcance viven volcadas en los espíritus de la naturaleza y miran la teocracia con desconfianza. La gente de Issylra es notablemente pálida, cosa que se nota en cuanto pisa un puerto del sur.",
  },
  {
    id: "vasselheim",
    continent: "Issylra",
    tier: "continente",
    topic: "Issylra",
    title: "Vasselheim, la Ciudad de la Semilla",
    text: "Se levanta sobre una aguja de roca a veinte o treinta millas de la costa y se la tiene por la cuna de la civilización. Sobrevivió a la Calamidad cuando casi nada lo hizo. Es sede de las grandes órdenes de fe, de la Caza Gris y de una de las dos cabeceras de la Biblioteca del Alma de Cobalto: la Bóveda Cobalto, cuyo Alto Curador comparte el mando de la orden con el de Rexxentrum.",
    poi: "Vasselheim",
  },
  {
    id: "cuna",
    continent: "Issylra",
    tier: "erudito",
    skill: "Historia",
    topic: "Historia · Issylra",
    title: "Donde empezó todo",
    text: "Se acepta que la civilización de Exandria nació aquí, y por eso Issylra sigue siendo el centro religioso e histórico del mundo. Los humanos, los gnomos de las rocas y los tieflings tienen aquí su origen: gnomos y tieflings cruzaron el Mar de Ozmit hacia Tal'Dorei durante la Era de los Arcanos, y los humanos navegaron siglos después de la Divergencia.",
  },
  {
    id: "recelo-arcano",
    continent: "Issylra",
    tier: "erudito",
    skill: "Arcanos",
    topic: "Arcanos · Issylra",
    title: "Por qué aquí se desconfía de la magia",
    text: "La mayoría de las ciudades voladoras de la Era de los Arcanos salió de Issylra. Cuando llegó la Calamidad, el continente pagó ese honor con creces. Ocho siglos después el recelo hacia la magia arcana sigue vivo, y en Othanzia no es una manía de viejos: es política.",
  },
  {
    id: "pyrah",
    continent: "Issylra",
    tier: "erudito",
    skill: "Arcanos",
    topic: "Arcanos · Issylra",
    title: "El desgarrón de las Sunderpeak",
    text: "Arriba del todo, en las Sunderpeak, hay un valle-caldera con una brecha abierta al Plano Elemental del Fuego. De ella nació la Arboleda Cendrosa, y de vigilarla se encarga la aldea ashari de Pyrah, que quedó arrasada cuando Thordak escapó por ese mismo boquete.",
    poi: "Pyrah",
  },
  {
    id: "thomara",
    continent: "Issylra",
    tier: "erudito",
    skill: "Historia",
    topic: "Historia · Issylra",
    title: "Las Criptas de Thomara y el Titán de Tierra",
    text: "En las Montañas Zenwick hubo una ciudad-bóveda enana construida dentro del cuerpo de un Titán de Tierra caído. Cuando Vecna animó al titán, la montaña se abrió sola y el gigante echó a andar hacia Vasselheim con la ciudad dentro. En la roca quedó un tajo que se ve desde muy lejos.",
    poi: "Criptas de Thomara",
  },
  {
    id: "marrowglade",
    continent: "Issylra",
    tier: "erudito",
    skill: "Religión",
    topic: "Religión · Issylra",
    title: "Lo que hay bajo la Laguna Marrowglade",
    text: "A unas horas al suroeste de Vasselheim, un lago pequeño rodeado de ciénaga guarda bajo el agua templos consagrados a la Matriarca Cuervo, de antes de que la zona se hundiera. Siguen ahí.",
    poi: "Laguna Marrowglade",
  },
  {
    id: "hishari",
    continent: "Issylra",
    tier: "oculto",
    topic: "Historias de Issylra",
    title: "Lo que pasó en Hishari",
    text: "Hishari nació como comuna en torno a un líder carismático que fue derivando hacia un culto elemental cada vez más cerrado. Hacia el 823 PD alguien encontró la aldea entera arrasada. Desde entonces se usa como aviso: así acaban estas cosas.",
    poi: "Hishari",
  },
  {
    id: "valle-cegado",
    continent: "Issylra",
    tier: "oculto",
    topic: "Historias de Issylra",
    title: "El Valle Cegado",
    text: "Un valle de las Zenwick cuyas aguas curan por sí solas. Suena bien hasta que uno cae en la cuenta de lo que eso le hace a un ecosistema: allí las bestias no aprenden a tener miedo, porque las heridas no las matan.",
    poi: "Valle Cegado",
  },
  {
    id: "core-anvil",
    continent: "Issylra",
    tier: "secreto",
    topic: "Secretos de Issylra",
    title: "El Yunque Primigenio",
    text: "Bajo la isla volcánica de Scaldseat, frente a Shorecomb, hay una fragua capaz de dar forma a materiales que ninguna herrería mortal podría siquiera calentar. Se ha usado al menos una vez para forjar lo necesario para matar a un dios.",
    poi: "Yunque Primigenio",
  },
  {
    id: "umamu-portal",
    continent: "Issylra",
    tier: "secreto",
    topic: "Secretos de Issylra",
    title: "El portal del Lago Umamu",
    text: "En el fondo del Lago Umamu, en el Alcance Caramarin, hay un paso oculto tras una cascada que no comunica con ningún punto de Exandria. Al otro lado están las cavernas bajo la superficie de Ruidus. En la orilla del lago se pudre un pueblo abandonado, Ria'Doin.",
    poi: "Lago Umamu",
  },
];

// -------------------------------------------------------- DIENTES ROTOS ----
export const DIENTES_ROTOS_LORE: ContinentLoreEntry[] = [
  {
    id: "geografia",
    continent: "Dientes Rotos",
    tier: "continente",
    topic: "Los Dientes Rotos",
    title: "Cuarenta y tres islas que no se están quietas",
    text: "El archipiélago va desde islotes de una milla sobre un arrecife hasta islas capaces de sostener ciudades enteras, como Ruukva. Lo aísla del mundo la Cortina del Necio, un banco de niebla perpetuo que se ha tragado más barcos de los que nadie ha contado. Y las islas se mueven: la energía elemental que quedó de la destrucción del continente las va desplazando, de modo que cualquier carta náutica caduca sola.",
  },
  {
    id: "sociedades",
    continent: "Dientes Rotos",
    tier: "continente",
    topic: "Los Dientes Rotos",
    title: "Dos formas de vivir aquí, y no se llevan bien",
    text: "El archipiélago se reparte entre dos sociedades enfrentadas. La Hueste Osendada agrupa un montón de tribus de pescadores aislacionistas que buscan la iluminación en los sueños y en las pesadillas. La Asamblea Wanderman es lo contrario: capitalismo sin freno envuelto en un discurso de honor y hermandad. En los años previos al 812 PD la tensión entre ambas ya se había vuelto violenta.",
  },
  {
    id: "tiempo",
    continent: "Dientes Rotos",
    tier: "continente",
    topic: "Los Dientes Rotos",
    title: "Aquí el tiempo no cuenta igual",
    text: "Un año local viene a ser tres años y cuatro meses del calendario exandriano. No es una manera de hablar: los propios espíritus de las islas llevan la cuenta a su modo, y quien vive aquí acaba llevándola con ellos. Conviene preguntar dos veces cuando alguien de las islas te dice su edad.",
  },
  {
    id: "fauna",
    continent: "Dientes Rotos",
    tier: "continente",
    topic: "Los Dientes Rotos",
    title: "Lo que vuela, nada y repta por las islas",
    text: "Ballenas del cielo —Fauces de Nube— cruzando por encima de los arrecifes, galapas, dolabos (pixies reptiles diminutos), serpientes de arrecife, sapos negros gigantes, cecilias de basalto, medusas comezelos y ospreza de pesadilla. Y aguantan historias, difíciles de confirmar, de que aquí sobreviven dinosaurios de los tiempos de los titanes primordiales.",
  },
  {
    id: "hueste-osendada",
    continent: "Dientes Rotos",
    tier: "oculto",
    topic: "Sociedades de los Dientes Rotos",
    title: "La Hueste Osendada",
    text: "Una sociedad enorme hecha de tribus pescadoras que se cierran a lo de fuera y buscan la iluminación adorando sueños y pesadillas. Su mayor presencia está en Kalutha, donde la cultura aishio trabaja el acero de aflicción para hacer amuletos raito con encantamientos de protección. Lo que hay detrás de los sueños de los que llevan siglos bebiendo es una pregunta que ellos mismos prefieren no hacerse.",
    poi: "Kalutha",
  },
  {
    id: "asamblea-wanderman",
    continent: "Dientes Rotos",
    tier: "oculto",
    topic: "Sociedades de los Dientes Rotos",
    title: "La Asamblea Wanderman",
    text: "Empezó siendo una compañía comercial de la Costa del Serrallo que naufragó aquí por culpa de un huracán. Lo que quedó es una sociedad ferozmente capitalista que jura por el honor y la hermandad mientras exprime lo que puede. Sus barcos son, eso sí, la manera más fiable de ir de una isla a otra si llevas con qué pagar.",
  },
  {
    id: "domunas",
    continent: "Dientes Rotos",
    tier: "erudito",
    skill: "Historia",
    topic: "Historia · Los Dientes Rotos",
    title: "Antes fueron un continente: Domunas",
    text: "Las islas son los restos de Domunas, un continente que existió hasta la Calamidad. Ya en la Fundación, el Padre del Alba y la Madre Salvaje derrotaron allí a los dos mayores primordiales de la tierra —Rau'shan, Emperador del Fuego, y Ka'Mort, Emperatriz de la Tierra— y los sellaron bajo el Monte Ygora. Sobre esa montaña creció después Cathmoíra, ciudad hermana de la voladora Avalir.",
    poi: "Monte Ygora",
  },
  {
    id: "avalir",
    continent: "Dientes Rotos",
    tier: "erudito",
    skill: "Historia",
    topic: "Historia · Los Dientes Rotos",
    title: "La noche que Domunas se rompió",
    text: "Avalir debía acoplarse a Cathmoíra para el Reabastecimiento, el rito en el que la ciudad voladora vertía en la tierra el éter mágico que había ido almacenando. La víspera, el archimago Vespin Chloras liberó a los Dioses Traidores de sus prisiones planarias. Asmodeus planeó corromper el Reabastecimiento para soltar de paso a los dos primordiales sellados bajo el Ygora. El Círculo de Latón lo impidió y los primordiales acabaron desterrados de Exandria; pero al aterrizar Avalir se desató una explosión mágica que hizo pedazos el continente. De ahí el nombre que les quedó a las islas.",
    poi: "Monte Ygora",
  },
  {
    id: "energia-elemental",
    continent: "Dientes Rotos",
    tier: "erudito",
    skill: "Arcanos",
    topic: "Arcanos · Los Dientes Rotos",
    title: "La energía que quedó suelta",
    text: "Lo que mueve las islas y tuerce la magia de la zona es la energía residual de los dos titanes primordiales destruidos allí. Fuera del archipiélago se cuenta de otra manera —magia elemental acumulada en Domunas, sin más—, porque muy pocos saben lo del rito y sus consecuencias. No llega a la intensidad de los desgarrones que custodian los ashari, pero no se ha ido ni se irá.",
  },
  {
    id: "evontravir",
    continent: "Dientes Rotos",
    tier: "secreto",
    topic: "Secretos de los Dientes Rotos",
    title: "Evontra'vir, el Gran Árbol",
    text: "En la isla de Kalutha arraiga un espíritu-árbol antiquísimo al que se conoció como Evontra'vir y hoy se llama el Gran Árbol de la Atrofia. Responde preguntas que nadie más responde, y reparte esquirlas de poder a quien considera. Cobra por ello, aunque no siempre en algo que puedas contar.",
    poi: "Kalutha",
  },
  {
    id: "chynes-maw",
    continent: "Dientes Rotos",
    tier: "secreto",
    topic: "Secretos de los Dientes Rotos",
    title: "Las Fauces de Chynes",
    text: "En el cráter del Pico Athos, en la isla de Igthuldus, descansaba en la lava una chispa de Rau'shan, el Emperador del Fuego. Que un primordial fuera desterrado no significa que no quedara nada suyo detrás.",
    poi: "Pico Athos",
  },
  {
    id: "aislamiento",
    continent: "Dientes Rotos",
    tier: "oculto",
    topic: "Sociedades de los Dientes Rotos",
    title: "Nadie ha conseguido abrirlas",
    text: "Más de una potencia moderna ha intentado establecer contacto estable con los Dientes Rotos y meter a sus habitantes en los asuntos del resto del mundo. No ha funcionado ninguna vez. Entre la Cortina del Necio, las islas que se mueven y unos vecinos que no quieren visitas, el archipiélago sigue tan aparte como siempre.",
    poi: "Cortina del Necio",
  },
];

export const CONTINENT_LORE: ContinentLoreEntry[] = [
  ...MARQUET_LORE,
  ...ISSYLRA_LORE,
  ...DIENTES_ROTOS_LORE,
];
