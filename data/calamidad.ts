// La Calamidad: el acontecimiento que explica el mapa actual de Exandria.
// Dos capas, según el spec del 2026-07-21:
//   - CALAMIDAD_RELATO: relato corrido, ABIERTO a todo el mundo. Es lo que
//     cualquiera ha oído contar; sustituye a HISTORIA_BREVE en /reino.
//   - CALAMIDAD_LORE: el detalle, con candado por pericia o descubrimiento.
// Redacción propia; nombres y hechos de la ambientación. Fans, no oficial.

import type { ContinentLoreEntry } from "@/data/continentes";

export type Acto = { title: string; body: string };

export const CALAMIDAD_RELATO: Acto[] = [
  {
    title: "La Fundación",
    body: "Los dioses hicieron el mundo y se lo encontraron ocupado. Antes que ellos ya estaban los primordiales: titanes de fuego, tierra, agua y aire que no pensaban ceder ni un palmo. Unos dioses se pusieron delante de las criaturas recién creadas para defenderlas, y a esos se los llamó los Primarios; otros calcularon que el negocio estaba del lado de los titanes, y se ganaron el nombre de Traidores. Ganaron los primeros, y los Traidores acabaron encerrados fuera del mundo.",
  },
  {
    title: "La Era de los Arcanos",
    body: "Vinieron siglos de magia sin nadie que la frenara. Se levantaron ciudades enteras que volaban: Avalir, Aeor, Zemniaz, Kethesk. Una maga llegó a destruir al dios de la muerte y a quedarse con su puesto, y así nació la Matriarca Cuervo. Aquello quedó apuntado en más cabezas de la cuenta, porque demostraba que el sitio de un dios podía cambiar de dueño.",
  },
  {
    title: "Vespin Chloras",
    body: "Vespin Chloras era un archimago que quería ese mismo poder y no tuvo la paciencia de buscárselo. Rompió las prisiones planarias y soltó a los Dioses Traidores, convencido de que le pagarían el favor. Ellos levantaron Ghor Dranas en Xhorhas y trabajaron en silencio el tiempo que hizo falta. Cuando por fin dieron el golpe, cayeron sobre Vasselheim sin aviso: veinte días de batalla y, detrás, el mundo entero en guerra.",
  },
  {
    title: "Dos siglos de guerra",
    body: "Lolth cayó la primera y sus drow se metieron bajo tierra para no volver a salir. Corellon le sacó un ojo a Gruumsh, y de aquella sangre salieron los orcos y los centauros. El continente de Domunas reventó en pedazos. Gruumsh quemó Marquet de punta a punta y hundió una ciudad entera bajo el mar. Los mortales aprendieron a fabricar armas capaces de matar dioses, y los dioses pararon de matarse el tiempo justo de ponerse de acuerdo y derribar Aeor; el cielo estuvo cargado de ceniza más de cien años.",
  },
  {
    title: "La Divergencia",
    body: "Ghor Dranas cayó y los Traidores volvieron al destierro. Los Primarios miraron lo que quedaba del mundo y decidieron marcharse ellos también, levantando la Puerta Divina a su espalda para no poder volver. Ese año es el 0 del calendario que se usa hoy. De cada tres personas sobrevivió una, y en pie quedó Vasselheim, y poco más.",
  },
];

export const CALAMIDAD_LORE: ContinentLoreEntry[] = [
  {
    id: "ritual-siembra",
    continent: "Exandria",
    tier: "erudito",
    skill: "Arcanos",
    topic: "Arcanos · La Calamidad",
    title: "El Ritual de Siembra",
    text: "En plena Era de los Arcanos, una maga reunió poder suficiente para destruir al dios de la muerte y ocupar su puesto. Salió bien: el trono cambió de dueño y la Matriarca Cuervo quedó donde antes había otro. El problema no fue lo que hizo ella, sino lo que enseñó — que un mortal podía matar a un dios y quedarse con el sitio. Todo lo que vino después cuelga de ahí.",
  },
  {
    id: "vespin-chloras",
    continent: "Exandria",
    tier: "erudito",
    skill: "Historia",
    topic: "Historia · La Calamidad",
    title: "Vespin Chloras",
    text: "Archimago de la Era de los Arcanos que se propuso repetir aquella hazaña por la vía corta. Rompió las prisiones planarias donde los Primarios habían encerrado a los Dioses Traidores, contando con que el poder que buscaba le vendría de la mano de ellos. No hay noticia de que llegara a disfrutarlo.",
  },
  {
    id: "ghor-dranas",
    continent: "Exandria",
    tier: "erudito",
    skill: "Historia",
    topic: "Historia · La Calamidad",
    title: "Ghor Dranas",
    text: "Lo primero que hicieron los Traidores al verse sueltos fue levantarse una capital, y la tuvieron en pie en cuestión de horas: Ghor Dranas, en las tierras que hoy son Xhorhas. Desde allí prepararon la guerra sin que nadie fuera de sus muros se enterase de nada. Sobre sus ruinas se alza hoy Rosohna.",
  },
  {
    id: "asalto-vasselheim",
    continent: "Exandria",
    tier: "erudito",
    skill: "Historia",
    topic: "Historia · La Calamidad",
    title: "El asalto a Vasselheim",
    text: "El primer golpe de la guerra cayó sobre Vasselheim sin previo aviso. La ciudad aguantó veinte días, y aguantó porque los Primarios bajaron a defenderla en persona. Aquello destapó el juego: desde ese día no quedó rincón del mundo fuera de la guerra.",
    poi: "Vasselheim",
  },
  {
    id: "ciudades-voladoras",
    continent: "Exandria",
    tier: "erudito",
    skill: "Arcanos",
    topic: "Arcanos · La Calamidad",
    title: "Las ciudades que volaban",
    text: "Avalir, Aeor, Zemniaz, Kethesk: la Era de los Arcanos llegó a tener ciudades enteras en el aire, y ninguna sobrevivió. Aeor fue la última en caer y también la que más lejos llegó, porque allí se fabricaron armas pensadas expresamente para matar dioses. Los dos bandos divinos dejaron de matarse el tiempo justo de derribarla entre todos, unos cincuenta años antes del final.",
  },
  {
    id: "trono-archicorazon",
    continent: "Exandria",
    tier: "erudito",
    skill: "Historia",
    topic: "Historia · La Calamidad",
    title: "El Trono del Archicorazón",
    text: "Es el sitio donde Corellon y Gruumsh se encontraron cara a cara y el primero le sacó un ojo al segundo. De la sangre que empapó aquella tierra salieron los primeros orcos, y de los señores de los caballos que cayeron en la misma batalla, los centauros. Pocos campos de batalla han dejado descendencia.",
  },
  {
    id: "vestigios",
    continent: "Exandria",
    tier: "erudito",
    skill: "Historia",
    topic: "Historia · La Calamidad",
    title: "Los Vestigios de la Divergencia",
    text: "Cuando quedó claro que aquella guerra no se ganaba con acero corriente, dioses y archimagos se pusieron a forjar. De ahí salieron los Vestigios: armas y reliquias que sobrevivieron a sus dueños y llevan siglos durmiendo. Uno permanece mudo hasta que da con la mano adecuada; entonces despierta por partes, y cada parte hay que ganársela.",
  },
  {
    id: "puerta-divina",
    continent: "Exandria",
    tier: "erudito",
    skill: "Religión",
    topic: "Religión · La Calamidad",
    title: "La Puerta Divina",
    text: "La levantaron los propios Primarios al acabar la guerra, y no contra los Traidores: contra ellos mismos. Es la barrera que impide a un dios volver a pisar el mundo, y llevan ocho siglos respetándola. Desde entonces un dios solo puede obrar aquí a través de quien le reza.",
  },
  {
    id: "sarenrae",
    continent: "Exandria",
    tier: "erudito",
    skill: "Religión",
    topic: "Religión · La Calamidad",
    title: "El nombre que se borró",
    text: "Sarenrae sostenía que hasta lo más corrompido puede redimirse, y se empeñó en demostrarlo con Asmodeus. Él le siguió el juego el tiempo necesario y después aniquiló a sus fieles de un solo golpe. Los sacerdotes que quedaron decidieron que aquella idea era demasiado cara y borraron su nombre de los registros. Ocho siglos después vuelve a oírse, poco a poco.",
  },
  {
    id: "ioun",
    continent: "Exandria",
    tier: "erudito",
    skill: "Religión",
    topic: "Religión · La Calamidad",
    title: "La herida de Ioun",
    text: "Tharizdun la alcanzó y estuvo cerca de matarla; su templo mayor se hundió bajo tierra con casi todo lo que guardaba. Ioun sobrevivió, pero su culto nunca volvió a ser lo que era. El Alma de Cobalto nació justamente para seguir haciendo su trabajo: reunir lo que se sabe antes de que se pierda otra vez.",
  },
  {
    id: "mapa-roto",
    continent: "Exandria",
    tier: "erudito",
    skill: "Naturaleza",
    topic: "Naturaleza · La Calamidad",
    title: "Cómo cambió el mapa",
    text: "El mapa de antes de la guerra no se parece al de ahora. El puente de tierra que unía Tal'Dorei con Wildemount se vino abajo y en su sitio quedó el Canal de Cizalla. La Costa del Serrallo se la repartieron el mar y la jungla. Las Sierras de Alabastro se llenaron de piedrablanca, y Xhorhas, que era bosque, dejó de serlo.",
  },
  {
    id: "lo-perdido",
    continent: "Exandria",
    tier: "erudito",
    skill: "Arcanos",
    topic: "Arcanos · La Calamidad",
    title: "Lo que se perdió para siempre",
    text: "De cada tres personas sobrevivió una, y de los archivos quedó menos todavía. Parte ardió sola, con las ciudades que los guardaban. Otra parte la quemaron a propósito los que quedaron, para que nadie volviera a construir lo que había llevado a todo aquello. Por eso hay tramos enteros de la Era de los Arcanos de los que solo se conservan nombres.",
  },
  {
    id: "aeor",
    continent: "Exandria",
    tier: "secreto",
    topic: "Secretos · La Calamidad",
    title: "Aeor sigue ahí",
    text: "A Aeor no la borraron del mundo: la tiraron al suelo. Lo que queda de ella está bajo el hielo de Eiselcross, a trozos pero entera, con sus armas todavía dentro. Y no todo lo que anda por sus pasillos se ha quedado quieto estos ocho siglos.",
  },
  {
    id: "alyxian",
    continent: "Exandria",
    tier: "secreto",
    topic: "Secretos · La Calamidad",
    title: "El campeón que no murió",
    text: "Alyxian se puso delante de la lanza de Gruumsh y salvó lo que se pudo salvar de Marquet. Las crónicas lo dan por muerto en ese golpe, y no lo estuvo. Acabó en un lugar que no es del todo este mundo, y seguía allí siglos más tarde — que es bastante peor destino que el que le cantan los himnos.",
  },
];
