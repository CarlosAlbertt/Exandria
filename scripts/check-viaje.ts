// Comprobación del viaje entre pueblos y de la ubicación por jugador.
// Uso: npx tsx scripts/check-viaje.ts
//
// ⚠️ No confundir con `check-lugares` (que se pueda ANDAR: el grafo del pueblo
// y del bosque) ni con `check-acceso` (quién ve qué ruta). Este vigila lo que
// pasa cuando **dos jugadores están en pueblos distintos**: que nadie se quede
// encerrado, que la región y el clima sean del sitio donde estás de verdad, y
// que el desfase de reloj no se quede huérfano.
//
// La pregunta de siempre: ¿qué rompo para que falle?
import {
  sitioVigente, ubicacionDeNodo, sanearSitio, type PoiUbicado,
} from "../lib/nodos";
import {
  destinosDesde, minutosDeViaje, duracionDeViaje,
  MINUTOS_MINIMOS_DE_VIAJE, MINUTOS_POR_UNIDAD_MAPA,
  type PoiViaje, type RegionViaje,
} from "../lib/viaje";
import { REGION_DEL_BOSQUE } from "../data/bosque";
import { seedAtlas } from "../data/atlas";
import { idPoi, idSub, idFranja } from "../data/lugares";

let failures = 0;
function check(label: string, cond: boolean) {
  if (cond) console.log(`OK   ${label}`);
  else { console.log(`FAIL ${label}`); failures++; }
}

/* ------------- LO QUE PUSO EL DM NO CADUCA, LO ANDADO SÍ --------------- */
// ⚠️ LA DISTINCIÓN QUE PIDIÓ EL USUARIO. Sin ella no se puede tener a uno en
// Emon y a otro en Byroden: en cuanto el DM moviera al grupo, el de Emon
// volvería solo. Y con ella mal puesta se reabre el agujero contrario, que ya
// se tapó una vez: quien se metió en la taberna se queda en un pueblo que el
// grupo ya abandonó.
const enTabernaAndando = { nodo: idSub("Byroden", "taberna"), desde: idPoi("Byroden") };
const enEmonPuestoPorDm = { nodo: idPoi("Emon"), desde: idPoi("Byroden"), puesto: "dm" as const };

check("lo andado vale mientras el grupo no se mueva", sitioVigente(enTabernaAndando, idPoi("Byroden")));
check("lo andado CADUCA si el grupo se muda", !sitioVigente(enTabernaAndando, idPoi("Emon")));
check("lo andado caduca sin ancla", !sitioVigente(enTabernaAndando, null));
check("lo que puso el DM vale con el ancla donde estaba", sitioVigente(enEmonPuestoPorDm, idPoi("Byroden")));
// LA GORDA de esta tanda: el DM te plantó en Emon y mueve al grupo a otro sitio.
// Tú sigues en Emon, que es lo que él decidió.
check("lo que puso el DM NO caduca al mover al grupo", sitioVigente(enEmonPuestoPorDm, idPoi("Westruun")));
check("lo que puso el DM vale incluso sin ancla", sitioVigente(enEmonPuestoPorDm, null));
// Un `puesto` con cualquier otro valor tiene que tratarse como «lo anduvo el
// jugador», que es el caso que caduca: si un valor raro contara como "dm", el
// sitio dejaría de caducar sin que nadie lo hubiera decidido.
const puestoRaro = { nodo: idPoi("Emon"), desde: idPoi("Byroden"), puesto: "jugador" } as unknown as Parameters<typeof sitioVigente>[0];
check("un `puesto` que no es 'dm' caduca como lo andado", !sitioVigente(puestoRaro, idPoi("Westruun")));

/* ------------- SIN SITIO NO HAY DESFASE, Y LO QUE SE LEE --------------- */
// ⚠️ LA INVARIANTE DE LA TANDA. Un desfase huérfano dejaría a alguien adelantado
// ocho horas **sentado en la misma plaza que los demás**, y eso no se lee como un
// fallo: se lee como que la app miente. Se comprueba aquí porque la regla salió
// de dentro de `useSitio` justo para eso — un hook no lo mira ningún gate, que
// es la lección que ya costó `puedeSembrar`.
const S_OK = { nodo: idPoi("Emon"), desde: idPoi("Byroden") };

check("con sitio, el desfase se respeta", sanearSitio(S_OK, 390).desfase === 390);
// LA GORDA: sin sitio, el desfase se tira.
check("SIN sitio, el desfase se ignora", sanearSitio(null, 390).desfase === 0);
check("y sin sitio tampoco hay sitio", sanearSitio(null, 390).sitio === null);
check("un desfase huérfano sobre basura tampoco cuela", sanearSitio("no soy un sitio", 999).desfase === 0);

// El desfase nunca es negativo: mandaría a alguien al pasado, con la crónica y
// el cupo del taller detrás.
check("un desfase negativo se queda en cero", sanearSitio(S_OK, -600).desfase === 0);
check("un desfase que no es número se queda en cero", sanearSitio(S_OK, "390").desfase === 0);
check("un desfase infinito se queda en cero", sanearSitio(S_OK, Number.POSITIVE_INFINITY).desfase === 0);
check("un desfase con decimales se trunca", sanearSitio(S_OK, 390.9).desfase === 390);
check("sin desfase guardado, cero", sanearSitio(S_OK, undefined).desfase === 0);

// Y lo que se lee del `sitio`, que es un jsonb con varias versiones detrás: una
// forma a medias no puede tumbar la pantalla, se cae al ancla.
check("un sitio sin nodo no vale", sanearSitio({ desde: idPoi("Byroden") }, 0).sitio === null);
check("un sitio sin desde no vale", sanearSitio({ nodo: idPoi("Emon") }, 0).sitio === null);
check("un sitio con nodo vacío no vale", sanearSitio({ nodo: "  ", desde: idPoi("Byroden") }, 0).sitio === null);
check("un sitio que no es objeto no vale", sanearSitio(42, 0).sitio === null);
check("un sitio bueno se lee entero", sanearSitio(S_OK, 0).sitio?.nodo === idPoi("Emon"));

// ⚠️ EL `puesto` SOLO CUELA SI DICE "dm". Si un valor raro colara, el sitio
// dejaría de caducar y alguien se quedaría solo en un pueblo que el grupo
// abandonó — el agujero que ya se tapó una vez.
check("puesto 'dm' se lee", sanearSitio({ ...S_OK, puesto: "dm" }, 0).sitio?.puesto === "dm");
check("un puesto que no es 'dm' NO se lee como dm", sanearSitio({ ...S_OK, puesto: "DM" }, 0).sitio?.puesto === undefined);
check("un puesto 'jugador' tampoco", sanearSitio({ ...S_OK, puesto: "jugador" }, 0).sitio?.puesto === undefined);
check("sin puesto, es lo que anduvo el jugador", sanearSitio(S_OK, 0).sitio?.puesto === undefined);
// Y lo que sale de `sanearSitio` tiene que casar con `sitioVigente`: leer un
// "dm" mal haría que el que caduca no caducara, o al revés.
const leidoDm = sanearSitio({ ...S_OK, puesto: "dm" }, 0).sitio!;
const leidoAndado = sanearSitio({ ...S_OK, puesto: "DM" }, 0).sitio!;
check("lo leído como dm no caduca", sitioVigente(leidoDm, idPoi("Westruun")));
check("lo leído con un puesto raro SÍ caduca", !sitioVigente(leidoAndado, idPoi("Westruun")));

/* ------------------ DÓNDE ESTÁ ESO, EN EL MUNDO ------------------------ */
// ⚠️ LO QUE EVITA QUE LA PANTALLA MIENTA. Byroden está en `peninsula-pleabruma`
// y Emon en `litoral-filofulgor`: si la región saliera del ancla del grupo, el
// que estuviera en Emon vería el clima y la región de Pleabruma y `poisOf` no
// encontraría Emon — sin tienda, sin posada, sin tablón y sin saber, en
// silencio. Cuatro cosas rotas y ninguna grita.
const POIS_TEST: PoiUbicado[] = [
  { name: "Byroden", continent: "Tal'Dorei", regionSlug: "peninsula-pleabruma" },
  { name: "Emon", continent: "Tal'Dorei", regionSlug: "litoral-filofulgor" },
  { name: "Puerto Ajeno", continent: "Wildemount", regionSlug: "otra-region" },
];
const REGIONES_TEST = [
  { continent: "Tal'Dorei", slug: "peninsula-pleabruma" },
  { continent: "Tal'Dorei", slug: "litoral-filofulgor" },
  { continent: "Tal'Dorei", slug: REGION_DEL_BOSQUE },
  { continent: "Wildemount", slug: "otra-region" },
];
const ub = (id: string) => ubicacionDeNodo(id, POIS_TEST, REGIONES_TEST, REGION_DEL_BOSQUE);

check("un pueblo resuelve su región", ub(idPoi("Byroden"))?.regionSlug === "peninsula-pleabruma");
check("y su continente", ub(idPoi("Byroden"))?.continent === "Tal'Dorei");
// LA QUE IMPORTA: Emon NO cae en la región de Byroden.
check("Emon resuelve SU región, no la del grupo", ub(idPoi("Emon"))?.regionSlug === "litoral-filofulgor");
check("Byroden y Emon no comparten región", ub(idPoi("Byroden"))?.regionSlug !== ub(idPoi("Emon"))?.regionSlug);
check("un sub-lugar resuelve la región de SU pueblo", ub(idSub("Byroden", "taberna"))?.regionSlug === "peninsula-pleabruma");
check("y trae el nombre del pueblo", ub(idSub("Byroden", "taberna"))?.poiName === "Byroden");
// El bosque no es de ningún POI: región escrita, pueblo nulo.
check("una franja cae en la región del bosque", ub(idFranja("linde"))?.regionSlug === REGION_DEL_BOSQUE);
check("una franja no es de ningún pueblo", ub(idFranja("linde"))?.poiName === null);
check("la franja saca su continente del atlas", ub(idFranja("corazon"))?.continent === "Tal'Dorei");
// Un POI de otro continente resuelve el suyo, no Tal'Dorei por defecto.
check("un POI de otro continente resuelve el suyo", ub(idPoi("Puerto Ajeno"))?.continent === "Wildemount");
// Y lo que no se puede resolver dice null en vez de inventarse un sitio.
check("un pueblo que el atlas no tiene dice null", ub(idPoi("Inventado")) === null);
check("un id que no es un nodo dice null", ub("basura") === null);
check("sin la región del bosque, la franja dice null",
  ubicacionDeNodo(idFranja("linde"), POIS_TEST, REGIONES_TEST, "region-que-no-existe") === null);

// La región del bosque tiene que EXISTIR en el atlas sembrado. Si alguien la
// renombra, el bosque se queda sin clima y sin nombre de región, y no salta nada.
const ATLAS = seedAtlas();
const slugsDelAtlas = new Set(Object.values(ATLAS).flatMap((c) => c.regions.map((r) => r.slug)));
check(`la región del bosque ("${REGION_DEL_BOSQUE}") existe en el atlas`, slugsDelAtlas.has(REGION_DEL_BOSQUE));
// Y los dos pueblos del ejemplo del usuario existen y están en regiones
// DISTINTAS de verdad, no solo en este caso de prueba.
const poisPlanos = Object.entries(ATLAS).flatMap(([cont, c]) =>
  Object.entries(c.pois).flatMap(([slug, ps]) => ps.map((p) => ({ name: p.name, continent: cont, regionSlug: slug }))));
const byrodenReal = poisPlanos.find((p) => p.name === "Byroden");
const emonReal = poisPlanos.find((p) => p.name === "Emon");
check("Byroden existe en el atlas", !!byrodenReal);
check("Emon existe en el atlas", !!emonReal);
check("Byroden y Emon están en regiones distintas en el atlas de verdad",
  !!byrodenReal && !!emonReal && byrodenReal.regionSlug !== emonReal.regionSlug);
// El nombre de POI es la clave con la que se resuelve, así que no puede haber
// dos. `comprobarContinente` ya lo exige por continente; aquí, en todo el mundo.
const repes = poisPlanos.map((p) => p.name).filter((n, i, a) => a.indexOf(n) !== i);
check(`ningún nombre de POI repetido en el mundo${repes.length ? ` (${repes.slice(0, 3).join(", ")})` : ""}`, repes.length === 0);

/* --------------------------- LO QUE CUESTA ----------------------------- */
check("un viaje nunca sale gratis", minutosDeViaje({ x: 10, y: 10 }, { x: 10, y: 10 }) >= MINUTOS_MINIMOS_DE_VIAJE);
check("ni negativo", minutosDeViaje({ x: 0, y: 0 }, { x: 90, y: 90 }) > 0);
check("da igual el orden", minutosDeViaje({ x: 4, y: 8 }, { x: 40, y: 2 }) === minutosDeViaje({ x: 40, y: 2 }, { x: 4, y: 8 }));
check("más lejos cuesta más", minutosDeViaje({ x: 0, y: 0 }, { x: 30, y: 0 }) > minutosDeViaje({ x: 0, y: 0 }, { x: 8, y: 0 }));
// Sin coordenadas se cobra el MÍNIMO, no cero: una región sin pin no puede
// volver el viaje gratis, que es el error hacia el lado malo.
check("sin coordenadas se cobra el mínimo", minutosDeViaje(undefined, { x: 1, y: 1 }) === MINUTOS_MINIMOS_DE_VIAJE);
check("sin ninguna de las dos, también", minutosDeViaje(undefined, undefined) === MINUTOS_MINIMOS_DE_VIAJE);
// Los viajes se redondean a media hora: es camino, no un cronómetro.
check("los viajes van a media hora justa", minutosDeViaje({ x: 0, y: 0 }, { x: 33, y: 21 }) % 30 === 0);
// Y el dial sigue siendo un dial: el ejemplo del usuario tiene que salir en una
// banda que se lea como una jornada de camino, no en cinco minutos ni en un mes.
const byrodenEmon = minutosDeViaje({ x: 48, y: 55 }, { x: 44, y: 50 });
check(`Byroden → Emon cuesta algo sensato (${duracionDeViaje(byrodenEmon)})`, byrodenEmon >= 240 && byrodenEmon <= 2880);
check("el dial de minutos por unidad es positivo", MINUTOS_POR_UNIDAD_MAPA > 0);

check("duracionDeViaje pinta horas y minutos", duracionDeViaje(390) === "6 h 30 min");
check("duracionDeViaje pinta días", duracionDeViaje(1680) === "1 d 4 h");
check("duracionDeViaje con horas justas no dice minutos", duracionDeViaje(240) === "4 h");
check("duracionDeViaje de cero se explica igual", duracionDeViaje(0) === "0 min");

/* ------------------------ ADÓNDE SE PUEDE IR --------------------------- */
const REGIONES: RegionViaje[] = [
  { slug: "peninsula-pleabruma", name: "Península de Pleabruma", map: { x: 48, y: 55 } },
  { slug: "litoral-filofulgor", name: "Litoral de Filofulgor", map: { x: 44, y: 50 } },
  { slug: "sierras-alabastro", name: "Sierras de Alabastro", map: { x: 50, y: 36 } },
];
const CANDIDATOS: PoiViaje[] = [
  { name: "Byroden", regionSlug: "peninsula-pleabruma" },
  { name: "Emon", regionSlug: "litoral-filofulgor" },
  { name: "Westruun", regionSlug: "sierras-alabastro" },
  { name: "Escondido", regionSlug: "sierras-alabastro" },
  { name: "De Otro Continente", regionSlug: "region-que-no-esta" },
];
const REVELADOS = new Set(["Emon", "Westruun"]);
const revelado = (_slug: string, name: string) => REVELADOS.has(name);
const enByroden = { poiName: "Byroden", regionSlug: "peninsula-pleabruma" };

const desdeByroden = destinosDesde({ desde: enByroden, candidatos: CANDIDATOS, regiones: REGIONES, revelado, anclaPoi: idPoi("Byroden").slice(4) });
const nombres = desdeByroden.map((d) => d.poiName);
check("desde Byroden se puede ir a Emon", nombres.includes("Emon"));
check("y a Westruun", nombres.includes("Westruun"));
check("NO se ofrece lo que el DM no ha revelado", !nombres.includes("Escondido"));
check("NO se viaja a donde ya estás", !nombres.includes("Byroden"));
check("un POI de una región que este continente no tiene se descarta", !nombres.includes("De Otro Continente"));
check("lo más cerca primero", desdeByroden[0].minutos <= desdeByroden[desdeByroden.length - 1].minutos);
check("cada destino trae el nombre de su región", desdeByroden.every((d) => d.regionName.trim().length > 0));
check("y lo que cuesta", desdeByroden.every((d) => d.minutos > 0));

// Del bosque y de dentro de la taberna NO se viaja: se sale primero.
check("no se viaja si no estás en la plaza de un pueblo",
  destinosDesde({ desde: null, candidatos: CANDIDATOS, regiones: REGIONES, revelado, anclaPoi: "Byroden" }).length === 0);

// ⚠️ LA ANTI-RATONERA, Y ES LA QUE MUERDE DE VERDAD.
// `poi_state` solo tiene fila para lo que el DM ha tocado, así que un pueblo sin
// fila NO está revelado. Si el DM revela Emon y NO Byroden, quien viaje a Emon
// se queda sin ningún destino y **encerrado**, con la única salida de que el DM
// se dé cuenta. Es el mismo fallo que `check-lugares` vigila con «todo nodo al
// que se puede entrar tiene por dónde salir», en la puerta nueva.
const enEmon = { poiName: "Emon", regionSlug: "litoral-filofulgor" };
const soloEmonRevelado = (_s: string, n: string) => n === "Emon";
const desdeEmon = destinosDesde({ desde: enEmon, candidatos: CANDIDATOS, regiones: REGIONES, revelado: soloEmonRevelado, anclaPoi: "Byroden" });
check("desde Emon SIEMPRE se puede volver con el grupo, aunque su pueblo no esté revelado",
  desdeEmon.some((d) => d.poiName === "Byroden"));
check("y viene marcado como el sitio del grupo", desdeEmon.find((d) => d.poiName === "Byroden")?.esElGrupo === true);
check("volver con el grupo sale primero en la lista", desdeEmon[0]?.esElGrupo === true);
check("estando fuera NUNCA te quedas sin salida", desdeEmon.length > 0);
// Sin nada revelado y sin ancla no hay a dónde ir, y eso es correcto: es el DM
// quien no ha abierto el mapa. Lo que no puede pasar es quedarse encerrado
// TENIENDO grupo al que volver.
const sinNada = destinosDesde({ desde: enEmon, candidatos: CANDIDATOS, regiones: REGIONES, revelado: () => false, anclaPoi: null });
check("sin ancla y sin nada revelado no hay destinos", sinNada.length === 0);
const soloVuelta = destinosDesde({ desde: enEmon, candidatos: CANDIDATOS, regiones: REGIONES, revelado: () => false, anclaPoi: "Byroden" });
check("pero con grupo al que volver, siempre queda la vuelta", soloVuelta.length === 1 && soloVuelta[0].poiName === "Byroden");
// Y estando YA con el grupo, el grupo no se ofrece como destino a sí mismo.
const desdeElAncla = destinosDesde({ desde: enByroden, candidatos: CANDIDATOS, regiones: REGIONES, revelado, anclaPoi: "Byroden" });
check("en el pueblo del grupo, el grupo no es un destino", !desdeElAncla.some((d) => d.esElGrupo));

console.log(`\nViaje: ${desdeByroden.length} destinos desde Byroden. Byroden → Emon, ${duracionDeViaje(byrodenEmon)}.`);
console.log(failures === 0 ? "Todas las comprobaciones pasaron." : `${failures} fallaron.`);
process.exit(failures === 0 ? 0 : 1);
