// Cronología ampliada de Exandria y Wildemount (Explorer's Guide to Wildemount,
// cap. 1). Los años, nombres y hechos son datos de la ambientación; el texto
// de cada hito es un resumen propio en español, no una traducción del libro.
// Herramienta de fans no oficial.

import type { Era } from "./taldorei";

export type HistoryEra = Era & {
  /** Continente al que pertenece el hito, para poder filtrar en la UI. */
  continent?: string;
};

export const HISTORY_TIMELINE: HistoryEra[] = [
  {
    year: "La Fundación",
    title: "Dioses, primordiales y los primeros pueblos",
    text: "Cuando los dioses llegaron a un mundo aún informe, encontraron a los primordiales ya despiertos y enzarzados en darle forma a su manera. Para tener aliados en la contienda, dieron vida a los primeros elfos, enanos y humanos, y pronto se dividieron entre sí: unos jurarían proteger a estos pueblos jóvenes, otros preferirían someterlos. Tras dispersar a los primordiales derrotados, sus fieles alzaron en Othanzia la ciudad de Vasselheim, la Ciudad del Alba, que todavía hoy resiste como el asentamiento continuo más antiguo de Exandria.",
  },
  {
    year: "Era de los Arcanos",
    title: "El vértigo del poder mortal",
    text: "Sin primordiales que combatir, los mortales volcaron su ambición en la magia arcana y levantaron ciudades que flotaban sobre el suelo, desafiando límites que antes parecían reservados a los dioses. Archimagos como Vecna o Halas Lutagran se convirtieron en figuras casi legendarias en vida, y una hechicera mortal llegó incluso a derrotar al antiguo dios de la muerte y ocupar su trono. La soberbia de la era encontró su punto de quiebre cuando el archimago Vespin Chloras rompió los sellos que mantenían presos a los Dioses Traidores.",
  },
  {
    year: "La Calamidad",
    title: "La guerra que partió el mundo",
    text: "Libres de nuevo, los Traidores alzaron en Xhorhas la fortaleza de Ghor Dranas y lanzaron un asalto directo contra Vasselheim, obligando a las Deidades Primarias a descender en persona al campo de batalla. La región de Wynandir se llevó la peor parte de la devastación, y se calcula que murieron dos de cada tres habitantes de Exandria antes de que la contienda terminara. Cuando por fin cesaron los combates, Ghor Dranas no era más que cenizas y ruina.",
  },
  {
    year: "La Divergencia · año 0 PD",
    title: "El exilio que salvó el mundo",
    text: "Para impedir que una guerra semejante volviera a repetirse, las Deidades Primarias aceptaron exiliarse tras un sello conocido como la Puerta Divina, renunciando a pisar de nuevo el Plano Material. Desde entonces solo alcanzan Exandria a través de sus fieles, signos y milagros indirectos. Este momento marca el año cero del calendario que hoy usan la mayoría de los pueblos civilizados: todo se cuenta en años PD, Post-Divergencia.",
  },
  {
    year: "Post-Divergencia temprana",
    title: "El clan Grimgolir y la fundación de Uthodurn",
    continent: "Wildemount",
    text: "Un clan de enanos conocido como Grimgolir había sobrevivido a la Calamidad refugiado bajo tierra, en las profundidades de las Flotket Alps. Al salir de sus túneles, acogieron a un grupo de elfos desplazados desde el bosque de Molaesmyr y juntos levantaron la ciudad subterránea de Uthodurn. Ese pacto entre enanos y elfos definiría el carácter multiétnico de la región durante siglos.",
  },
  {
    year: "Post-Divergencia temprana",
    title: "El Dominio Julous en el valle Marrow",
    continent: "Wildemount",
    text: "En el valle Marrow, al oeste de Wynandir, distintos asentamientos humanos terminaron por unificarse bajo una sola bandera en torno a la naciente ciudad de Zadash. Aquella confederación tomó el nombre de Dominio Julous y se convirtió, durante generaciones, en la potencia dominante de la región. Su independencia sería relativamente breve: acabaría absorbida por un imperio que crecía al norte.",
  },
  {
    year: "539 PD",
    title: "Manfried Dwendal, primer emperador",
    continent: "Wildemount",
    text: "Al norte, los colonos zemnianos habían fundado los asentamientos de Icehaven e Yrrosa antes de levantar Rexxentrum, que pronto se convertiría en su capital. En el año 539 PD, Manfried Dwendal se coronó como primer emperador, dando origen a la dinastía que gobierna la región hasta hoy. Su ascenso marcó el inicio de la expansión imperial sobre los territorios vecinos.",
  },
  {
    year: "544 PD",
    title: "La Amonestación",
    continent: "Wildemount",
    text: "Apenas cinco años después de la coronación de Manfried, el joven imperio emprendió una purga religiosa conocida como la Amonestación. El culto quedó restringido a un puñado de deidades consideradas seguras para el orden imperial, mientras el resto —Melora, Corellon, Sehanine y otras— pasaron a practicarse en secreto o directamente se prohibieron. La medida sigue marcando la vida religiosa del Imperio Dwendaliano tres siglos después.",
  },
  {
    year: "Post-Divergencia",
    title: "La Guerra Marrow",
    continent: "Wildemount",
    text: "El apetito expansionista imperial chocó finalmente con el Dominio Julous en una contienda breve pero decisiva, conocida como la Guerra Marrow, que se prolongó poco más de dieciséis meses. Con la absorción del Dominio, el emperador zemniano pasó a titularse rey, y el territorio unificado adoptó el nombre de Imperio Dwendaliano. Zadash, antigua capital del Dominio, conservó su peso como segunda ciudad del reino.",
  },
  {
    year: "Post-Divergencia",
    title: "La Medianoche Carmesí y la Asamblea Cerberus",
    continent: "Wildemount",
    text: "Ya bajo el nuevo imperio, un duelo mágico entre casas nobles rivales de Rexxentrum degeneró en una noche de destrucción que la crónica popular bautizó como la Víspera de la Medianoche Carmesí. Para evitar que la nobleza volviera a poner en jaque la capital con su propia magia, la Corona reunió a sus magos más poderosos bajo mando directo. Nació así la Asamblea Cerberus, el cuerpo arcano que desde entonces sirve —y vigila— al trono.",
  },
  {
    year: "~400 PD",
    title: "Marquesianos, Ki'Nau y el sello de Uk'otoa",
    continent: "Wildemount",
    text: "Hacia el año 400 PD, colonos marquesianos cruzaron el mar y se asentaron en las Islas Swavain, donde forjaron una alianza con el pueblo isleño de los Ki'Nau bajo la bendición de su guardián, Uk'otoa. Con el tiempo, una secta corrompida por la influencia de Zehir logró sellar a la propia deidad bajo el océano Lucidiano para frenar su poder creciente. De aquel asentamiento marquesiano nacería más tarde el puerto de Damali y, con él, el Concordato Clovis que hoy rige la Costa de la Casa de Fieras.",
  },
  {
    year: "585 PD",
    title: "La Corrupción de Molaesmyr",
    continent: "Wildemount",
    text: "En el año 585 PD, una plaga de origen incierto comenzó a pudrir el gran bosque de Savalirwood, corrompiendo también a los elfos de Molaesmyr que llevaban generaciones habitándolo. Quienes lograron escapar a tiempo buscaron refugio en dos destinos muy distintos: la ciudad feérica de Bysaes Tyl y la subterránea Uthodurn, en las Tierras Salvajes Grises. La herida que dejó la corrupción en el bosque nunca ha terminado de sanar.",
  },
  {
    year: "790 PD",
    title: "La coronación de Bertrand Dwendal",
    continent: "Wildemount",
    text: "En el año 790 PD asciende al trono el rey Bertrand Dwendal, que ronda ya los sesenta y ocho años de edad en la actualidad de la campaña. Su reinado ha profundizado el aislacionismo del Imperio y el control estricto sobre el culto religioso heredado de la Amonestación. Es también bajo su corona cuando estalla la actual Guerra de la Ceniza y la Luz.",
  },
  {
    year: "815 PD",
    title: "El Cónclave Cromático y la caída de Draconia",
    continent: "Wildemount",
    text: "En el año 815 PD, una alianza de razas rebeldes conocida como el Cónclave Cromático asaltó y destruyó Draconia, el bastión dracónico que dominaba Xhorhas desde tiempos inmemoriales. Con la caída de la fortaleza, los ravenitas que llevaban generaciones sometidos a los dracónidos recuperaron por fin su libertad. El vacío de poder que dejó Draconia abriría la puerta a una nueva era para los pueblos de Xhorhas.",
  },
  {
    year: "815 PD",
    title: "El Luxon y el nacimiento de la Dinastía Kryn",
    continent: "Wildemount",
    text: "En paralelo a la caída de Draconia, buena parte de los drow de Xhorhas rompieron con Lolth, hastiados de su crueldad, y volcaron su fe en el Luxon, la luz primigenia sin consciencia propia. Sobre las ruinas mismas de Ghor Dranas fundaron Rosohna, capital de la nueva Dinastía Kryn, bajo el gobierno de la Reina Brillante Leylas Kryn. El culto al Luxon y a sus balizas se convertiría en la seña de identidad de todo el pueblo kryn.",
  },
  {
    year: "835 PD",
    title: "La Guerra de la Ceniza y la Luz",
    continent: "Wildemount",
    text: "La paz entre el Imperio Dwendaliano y la Dinastía Kryn se rompió en 835 PD cuando espías imperiales lograron robar dos de las balizas sagradas del Luxon. En represalia, los Kryn atacaron las Salas de la Erudición de Zadash, y el conflicto se extendió pronto a ambos lados de las Ashkeeper Peaks. Una quinta baliza permanece, mientras tanto, bajo la custodia —y el interés propio— de la Asamblea Cerberus.",
  },
  {
    year: "Actualidad · 836 PD",
    title: "Un imperio en guerra",
    continent: "Wildemount",
    text: "Hacia 836 PD la guerra entre el Imperio y los Kryn sigue plenamente activa, sin que ninguno de los dos bandos haya logrado una ventaja decisiva. El rey Bertrand Dwendal mantiene el aislacionismo tradicional de su corona incluso en tiempos de conflicto abierto. Mientras tanto, lejos de los campos de batalla, la Myriad —la mayor organización criminal de la región— prospera aprovechando el caos y la atención dividida de ambos gobiernos.",
  },
];
