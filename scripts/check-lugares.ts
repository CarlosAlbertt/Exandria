// Comprobación del grafo de lugares. Uso: npx tsx scripts/check-lugares.ts
//
// ⚠️ No confundir con `check-acceso` (quién ve qué RUTA) ni con `check-lore`
// (el saber). Este vigila que **se pueda andar**: que ninguna tarjeta lleve a
// ninguna parte, que de ningún sitio se pueda no salir, y que moverse tenga
// efecto.
//
// La pregunta de siempre: ¿qué rompo para que falle?
import fs from "node:fs";
import path from "node:path";
import {
  construirNodos, SUB_LUGARES, ENTRADAS_AL_BOSQUE,
  idPoi, idSub, idFranja, poiDeNodo, alAireLibre, etiquetaDeSalida,
  TEMAS, TEMA_POR_POI, TEMA_DEFECTO, esTema, temaDePoi, type TemaLugar,
} from "../data/lugares";
import { indexar, nodoDelJugador, salidasDe, puedeIr, npcsDeNodo, sitioVigente, puedeSembrar } from "../lib/nodos";
import { FRANJAS } from "../data/bosque";
import { NPC_TEMPLATES, plantillaDe, claveDePlantilla } from "../data/npcTemplates";

let failures = 0;
function check(label: string, cond: boolean) {
  if (cond) console.log(`OK   ${label}`);
  else { console.log(`FAIL ${label}`); failures++; }
}

// POIs de mentira, escritos a mano: el grafo se construye desde fuera a
// propósito, así que el gate puede probarlo sin arrastrar el atlas entero.
const POIS = [
  { name: "Byroden", blurb: "Pueblo humilde.", icono: "fa-city" },
  { name: "Emon", blurb: "La capital.", icono: "fa-city" },
];
const NODOS = construirNodos(POIS);
const IX = indexar(NODOS);

/* --------------------- LO QUE PIDIÓ EL USUARIO, LITERAL ---------------- */
// ⚠️ Las cinco van ESCRITAS A MANO. Si salieran de SUB_LUGARES, las dos
// mitades se moverían juntas y borrar el cementerio no rompería nada. Es la
// lección de `check-origen` y `check-tiendas`, y van seis veces.
const BYRODEN_ESPERADO = [
  "sub:Byroden/taberna",
  "sub:Byroden/iglesia",
  "sub:Byroden/cementerio",
  "sub:Byroden/ayuntamiento",
  "franja:linde",
];
const byroden = IX.get("poi:Byroden");
check("Byroden existe como nodo", !!byroden);
for (const s of BYRODEN_ESPERADO) {
  check(`desde Byroden se puede ir a "${s}"`, !!byroden?.salidas.includes(s));
}
check("Byroden no ofrece nada más que esas cinco", byroden?.salidas.length === BYRODEN_ESPERADO.length);

/* ------------------------ EL GRAFO NO SE ROMPE ------------------------- */
// LA GORDA: una salida a un id que no existe es una tarjeta que el jugador
// pulsa y no le lleva a ninguna parte.
for (const n of NODOS) {
  for (const s of n.salidas) {
    check(`la salida "${s}" de "${n.id}" apunta a un nodo real`, IX.has(s));
  }
}

// NADA DE RATONERAS. La invariante NO es «todo nodo tiene salidas» —un pueblo
// sin sub-lugares no tiene adónde llevarte y no pasa nada, porque es el ancla
// donde el DM te planta y de ahí no te has movido—. La que muerde es: **todo
// nodo al que se puede ENTRAR tiene que tener por dónde salir**. Si no, el
// jugador pulsa una tarjeta y se queda encerrado sin más botón que recargar.
const alcanzables = new Set(NODOS.flatMap((n) => n.salidas));
for (const id of alcanzables) {
  const n = IX.get(id);
  check(`se puede salir de "${id}", donde se puede entrar`, !n || n.salidas.length > 0);
}
check("un pueblo sin sub-lugares no es una ratonera (no se entra en él)",
  !alcanzables.has("poi:Emon") && IX.get("poi:Emon")?.salidas.length === 0);

// Nadie se ofrece a sí mismo, y nada repetido: dos tarjetas iguales en la misma
// pantalla se leen como un fallo.
for (const n of NODOS) {
  check(`"${n.id}" no se ofrece a sí mismo`, !n.salidas.includes(n.id));
  check(`"${n.id}" no repite salidas`, new Set(n.salidas).size === n.salidas.length);
}

check("ningún id de nodo repetido", new Set(NODOS.map((n) => n.id)).size === NODOS.length);
check("todo nodo tiene nombre e icono", NODOS.every((n) => n.nombre.trim() && n.icono.trim()));
// El blurb solo se exige a lo que escribimos nosotros. El de un nodo `poi:`
// viene del atlas y lo redacta el DM: puede ser de tres palabras y no es un
// fallo. Exigírselo obligaría a reescribir el mapa entero para estrenar esto.
check("los sitios y las franjas traen descripción escrita",
  NODOS.filter((n) => !n.id.startsWith("poi:")).every((n) => n.blurb.trim().length > 15));

// Se vuelve por donde se entró: de cada sub-lugar, a su pueblo.
for (const [poi, subs] of Object.entries(SUB_LUGARES)) {
  if (!POIS.some((p) => p.name === poi)) continue;
  for (const s of subs) {
    check(`"${s.slug}" de ${poi} vuelve al pueblo`, !!IX.get(idSub(poi, s.slug))?.salidas.includes(idPoi(poi)));
  }
}

// Un pueblo que el atlas NO tiene no se inventa: si el DM borra Emon del mapa,
// sus sub-lugares no pueden quedarse flotando.
const sinEmon = construirNodos([POIS[0]]);
check("un POI que no está en el atlas no genera nodos", !sinEmon.some((n) => n.id.includes("Emon")));

/* ------------------------------ EL BOSQUE ------------------------------ */
// Las tres franjas encadenadas: sin esto no se puede llegar al corazón.
FRANJAS.forEach((f, i) => {
  const n = IX.get(idFranja(f.key));
  check(`la franja "${f.key}" es un nodo`, !!n);
  if (i > 0) check(`"${f.key}" se puede volver a "${FRANJAS[i - 1].key}"`, !!n?.salidas.includes(idFranja(FRANJAS[i - 1].key)));
  if (i < FRANJAS.length - 1) check(`"${f.key}" lleva a "${FRANJAS[i + 1].key}"`, !!n?.salidas.includes(idFranja(FRANJAS[i + 1].key)));
});
check("desde la linde se vuelve a Byroden", !!IX.get(idFranja("linde"))?.salidas.includes(idPoi("Byroden")));
check("desde el corazón NO se sale directo al pueblo", !IX.get(idFranja("corazon"))?.salidas.includes(idPoi("Byroden")));

// Se llega al corazón andando: la razón de ser de las tres franjas.
let cursor = "poi:Byroden";
const camino = [cursor];
for (const paso of [idFranja("linde"), idFranja("espesura"), idFranja("corazon")]) {
  check(`se puede ir de "${cursor}" a "${paso}"`, puedeIr(cursor, paso, IX));
  cursor = paso; camino.push(paso);
}
check("Byroden → linde → espesura → corazón, andando", camino.length === 4);

// La misma puerta, contada desde los dos lados.
const etq = etiquetaDeSalida("poi:Byroden", idFranja("linde"));
check("desde Byroden la franja se llama 'El bosque'", etq?.nombre === "El bosque");
check("desde dentro se llama por su franja", IX.get(idFranja("linde"))?.nombre === FRANJAS[0].label);
check("una salida normal no tiene etiqueta propia", etiquetaDeSalida("poi:Byroden", idSub("Byroden", "taberna")) === null);
check("las entradas al bosque apuntan a franjas reales",
  ENTRADAS_AL_BOSQUE.every((e) => FRANJAS.some((f) => f.key === e.franja)));

/* -------------------------------- EL TEMA ------------------------------ */
// ⚠️ LO QUE MUERDE AQUÍ: **un tema que no existe no da ningún error.** La clase
// `tema-loquesea` del `<main>` no casa con ninguna regla, así que la hoja se
// queda SIN LOS QUINCE TOKENS: `var(--hoja)` no resuelve, el fondo se vuelve
// transparente y asoma la app oscura por debajo, con la tinta parda encima. Se
// lee fatal y no salta nada. Por eso se declara y se vigila.

// 1. Todo nodo tiene un tema, y es uno de los dibujados.
for (const n of NODOS) {
  check(`"${n.id}" declara un tema que existe (${n.tema})`, esTema(n.tema));
}

// 2. Cada sitio con la piel que le toca. Escrito a mano: si saliera de
//    TEMA_POR_POI, cambiarle el tema a Emon movería las dos mitades a la vez y
//    no rompería nada. Es la lección de `check-origen`, y van siete.
check("Byroden es del valle", IX.get(idPoi("Byroden"))?.tema === "valle");
check("Emon es una ciudadela", IX.get(idPoi("Emon"))?.tema === "ciudadela");
for (const f of FRANJAS) {
  check(`la franja "${f.key}" es bosque`, IX.get(idFranja(f.key))?.tema === "bosque");
}
// Un sub-lugar HEREDA la del pueblo: la taberna de Byroden es del valle porque
// Byroden lo es, y no hay que repetirlo en las cuatro semillas.
check("la taberna de Byroden hereda el valle", IX.get(idSub("Byroden", "taberna"))?.tema === "valle");
// Y si la semilla declara la suya, gana. Sin este caso la herencia sería la
// única rama viva y `SubSemilla.tema` no serviría para nada sin que se notara.
const conSubTema = construirNodos(POIS, {});
check("hay algún sub-lugar y todos con tema", conSubTema.filter((n) => n.id.startsWith("sub:")).every((n) => esTema(n.tema)));
const soloEmon = construirNodos([{ name: "Emon", blurb: "La capital.", icono: "fa-city" }]);
check("un pueblo sin sub-lugares también lleva su tema", soloEmon[0]?.tema === "ciudadela");

// 3. Los mapas ESCRITOS A MANO. Aquí TypeScript ya obliga al tipo, pero un
//    `TEMAS` al que se le quite una entrada dejaría a `TEMA_POR_POI` apuntando
//    a un tema que ya no se dibuja, y eso sí compila.
for (const [poi, t] of Object.entries(TEMA_POR_POI)) {
  check(`el tema de ${poi} ("${t}") es uno de los dibujados`, esTema(t));
}
for (const [poi, subs] of Object.entries(SUB_LUGARES)) {
  for (const s of subs) {
    if (s.tema === undefined) continue; // sin declarar hereda, y eso ya se probó
    check(`el tema propio de "${s.slug}" (${poi}) existe`, esTema(s.tema));
  }
}
check("el tema de defecto existe", esTema(TEMA_DEFECTO));
check("un pueblo sin tema escrito cae en el de defecto", temaDePoi("Pueblo Inventado") === TEMA_DEFECTO);

// 4. `esTema` es el seto, así que se prueba por donde se cuela la gente. Los
//    tres primeros son los que de verdad pasan: el DM escribe en un JSON.
check("esTema rechaza un tema con un espacio detrás", !esTema("valle "));
check("esTema rechaza el tema en mayúsculas", !esTema("VALLE"));
check("esTema rechaza un tema mal escrito", !esTema("ciudadella"));
check("esTema rechaza la cadena vacía", !esTema(""));
check("esTema rechaza lo que no es cadena", !esTema(null) && !esTema(undefined) && !esTema(7));
// Y no se cuela por la cadena de prototipos: `"toString" in TEMAS` es TRUE con
// el operador `in`, y con él este seto habría dejado pasar `tema: "toString"`.
check("esTema no acepta un método heredado de Object", !esTema("toString") && !esTema("constructor"));
for (const t of Object.keys(TEMAS)) {
  check(`esTema acepta "${t}"`, esTema(t));
}

// 5. Todo tema dibujado está DIBUJADO DE VERDAD: su regla en el CSS y sus
//    quince tokens. Sin esto, añadir un tema al registro y olvidarse del CSS
//    deja un sitio que se pinta sin colores y el gate en verde.
const CSS = fs.readFileSync(path.join(process.cwd(), "app", "globals.css"), "utf8");
const TOKENS = [
  "hoja", "hoja-2", "hoja-3",
  "tinta", "tinta-2", "tinta-3",
  "acento", "acento-2",
  "metal", "metal-claro", "metal-hondo",
  "natura",
  "cielo-1", "cielo-2", "cielo-3",
];
for (const t of Object.keys(TEMAS) as TemaLugar[]) {
  // `[^}]*` basta porque un bloque de tema no anida llaves, y así da igual que
  // el working copy vaya en CRLF: no hay regex multilínea de por medio.
  const bloque = new RegExp(`\\.tema-${t}\\s*\\{([^}]*)\\}`).exec(CSS)?.[1];
  check(`el tema "${t}" tiene su regla .tema-${t} en globals.css`, !!bloque);
  for (const tok of TOKENS) {
    check(`.tema-${t} define --${tok}`, !!bloque?.includes(`--${tok}:`));
  }
}

// 6. La silueta del horizonte. Es lo único del tema que no es un color, y se
//    pinta cuando el sitio NO tiene ilustración: un `d` vacío deja la cabecera
//    como una franja de degradado, que es justo lo que el usuario llamó «soso».
for (const [t, def] of Object.entries(TEMAS)) {
  check(`el tema "${t}" tiene nombre para el panel del DM`, def.label.trim().length > 2);
  check(`la silueta de "${t}" es un trazado cerrado`, /^M/.test(def.silueta) && /[zZ]$/.test(def.silueta));
  check(`la silueta de "${t}" tiene forma de verdad`, def.silueta.length > 60);
}

/* ------------------------------ IDS Y AYUDAS --------------------------- */
check("poiDeNodo lee el POI de un nodo de pueblo", poiDeNodo("poi:Byroden") === "Byroden");
check("poiDeNodo lee el POI de un sub-lugar", poiDeNodo("sub:Byroden/taberna") === "Byroden");
check("poiDeNodo dice null en una franja", poiDeNodo("franja:linde") === null);
check("el pueblo está al aire libre", alAireLibre("poi:Byroden"));
check("el bosque está al aire libre", alAireLibre("franja:espesura"));
check("la taberna NO está al aire libre", !alAireLibre("sub:Byroden/taberna"));

/* --------------------- DÓNDE ESTÁ CADA JUGADOR ------------------------- */
const enTab = { nodo: idSub("Byroden", "taberna"), desde: idPoi("Byroden") };
// Sin `sitio` se está donde el grupo: lo que hace que la migración no rompa a
// quien nunca se haya movido.
check("sin sitio propio, se está donde el grupo", nodoDelJugador(null, "poi:Byroden", IX)?.id === "poi:Byroden");
// Y con `sitio` se está ahí: si esto falla, moverse deja de tener efecto y no
// salta nada en pantalla.
check("con sitio propio, manda el sitio", nodoDelJugador(enTab, "poi:Byroden", IX)?.id === enTab.nodo);
// Un sitio que el DM borró cae al ancla, no deja al jugador en la nada.
check("un sitio que ya no existe cae al ancla",
  nodoDelJugador({ nodo: "sub:Byroden/pescaderia", desde: idPoi("Byroden") }, "poi:Byroden", IX)?.id === "poi:Byroden");
check("sin sitio y sin ancla, en ningún sitio", nodoDelJugador(null, null, IX) === null);
check("un ancla que no existe tampoco inventa", nodoDelJugador(null, "poi:Inventado", IX) === null);

// ⚠️ LA QUE EVITA QUEDARSE SOLO EN UN PUEBLO VACÍO. El DM planta al grupo en
// Emon; quien se había metido en la taberna de Byroden tiene que salir con
// todos, no quedarse allí. Caduca por el `desde`, sin que el DM limpie nada.
check("si el grupo se muda, el sitio propio CADUCA",
  nodoDelJugador(enTab, "poi:Emon", IX)?.id === "poi:Emon");
check("sitioVigente: mismo ancla, sigue valiendo", sitioVigente(enTab, idPoi("Byroden")));
check("sitioVigente: otro ancla, caduca", !sitioVigente(enTab, idPoi("Emon")));
check("sitioVigente: sin ancla, caduca", !sitioVigente(enTab, null));

// salidasDe filtra las rotas en vez de pintar tarjetas muertas.
check("salidasDe resuelve las cinco de Byroden", salidasDe(byroden!, IX).length === 5);
check("salidasDe de null es vacío", salidasDe(null, IX).length === 0);
const roto = { id: "poi:Roto", nombre: "Roto", icono: "fa-x", blurb: "un nodo con una salida rota aqui", tema: "valle" as const, salidas: ["poi:Byroden", "sub:Byroden/no-existe"] };
check("salidasDe descarta la salida rota", salidasDe(roto, IX).length === 1);

// puedeIr no deja saltar de un sitio a otro sin pasar por en medio.
check("no se salta de la taberna al cementerio", !puedeIr(idSub("Byroden", "taberna"), idSub("Byroden", "cementerio"), IX));
check("no se entra al bosque desde la taberna", !puedeIr(idSub("Byroden", "taberna"), idFranja("linde"), IX));
check("no se va a un nodo inexistente", !puedeIr("poi:Byroden", "sub:Byroden/pescaderia", IX));
check("sin origen no se va a ningún sitio", !puedeIr(null, "poi:Byroden", IX));

/* ------------------------- LOS PNJ DE CADA SITIO ----------------------- */
const NPCS = [
  { poi_name: "Byroden", venue: null, nombre: "alguacil en la plaza" },
  { poi_name: "Byroden", venue: "sub:Byroden/taberna", nombre: "tabernero" },
  { poi_name: "Byroden", venue: "sub:Byroden/cementerio", nombre: "sepulturero" },
  { poi_name: "Emon", venue: null, nombre: "otro pueblo" },
];
// ⚠️ La que sostiene la migración: `venue` nulo sigue saliendo en el pueblo.
const enPlaza = npcsDeNodo(NPCS, IX.get("poi:Byroden")!);
check("en el pueblo salen los PNJ sin venue", enPlaza.length === 1 && enPlaza[0].nombre === "alguacil en la plaza");
check("en el pueblo NO salen los de un sub-lugar", !enPlaza.some((n) => n.venue));
check("en el pueblo no salen los de OTRO pueblo", !enPlaza.some((n) => n.poi_name === "Emon"));

const enTaberna = npcsDeNodo(NPCS, IX.get(idSub("Byroden", "taberna"))!);
check("en la taberna sale el tabernero", enTaberna.length === 1 && enTaberna[0].nombre === "tabernero");
check("en la taberna NO sale el sepulturero", !enTaberna.some((n) => n.nombre === "sepulturero"));
check("en un sitio sin nadie no sale nadie", npcsDeNodo(NPCS, IX.get(idFranja("corazon"))!).length === 0);
check("npcsDeNodo sin nodo devuelve vacío", npcsDeNodo(NPCS, null).length === 0);

// Un `venue` que no es ningún nodo deja al PNJ SIN PANTALLA en la que salir, y
// en silencio. Es el mismo fallo que `check-despiece` cazó con el nombre mal
// escrito, así que aquí se declara y se vigila.
const venuesUsados = NPCS.map((n) => n.venue).filter(Boolean) as string[];
for (const v of venuesUsados) {
  check(`el venue "${v}" es un nodo real`, IX.has(v));
}

/* ------------------------ LOS OVERRIDES DEL DM ------------------------- */
// ⚠️ El override lleva `id` A PROPÓSITO, y por eso hay un cast. El tipo lo
// prohíbe (`Partial<Omit<Nodo,"id">>`), pero **esto no viene del tipo: viene de
// un JSON de `app_config` que escribe el DM**, y ahí TypeScript no llega. Sin
// el `id` en el caso de prueba la comprobación de abajo era VERDE POR
// CONSTRUCCIÓN — no había nada que ignorar. Lo destapó la mutación.
const conOverride = construirNodos(POIS, {
  "sub:Byroden/taberna": {
    nombre: "El Cuerno Torcido",
    imagen: "https://x/t.jpg",
    id: "sub:Byroden/otra-cosa",
  } as unknown as Partial<Omit<(typeof NODOS)[number], "id">>,
});
const ixOv = indexar(conOverride);
const tab = ixOv.get(idSub("Byroden", "taberna"));
check("el DM puede renombrar un sitio", tab?.nombre === "El Cuerno Torcido");
check("el DM puede ponerle imagen", tab?.imagen === "https://x/t.jpg");
check("lo que el DM no toca se queda como estaba", !!tab?.blurb && tab.blurb.includes("Vigas bajas"));
// Si el id se pudiera pisar, la salida de Byroden apuntaría a un nodo que ya no
// existe con ese nombre: la tarjeta de la taberna dejaría de llevar a la taberna.
check("el override NO puede cambiar el id", tab?.id === idSub("Byroden", "taberna"));
check("y el nodo renombrado no aparece con el id inventado", !ixOv.has("sub:Byroden/otra-cosa"));
check("las salidas de Byroden siguen resolviendo con override",
  salidasDe(ixOv.get(idPoi("Byroden"))!, ixOv).length === BYRODEN_ESPERADO.length);

// ⚠️ EL TEMA DEL DM, que es el segundo campo que este JSON no puede pisar a
// ciegas. Cambiar la piel de un sitio desde el panel tiene que funcionar…
const ixTema = indexar(construirNodos(POIS, {
  "sub:Byroden/cementerio": { tema: "yermo" },
}));
check("el DM puede cambiarle el tema a un sitio", ixTema.get(idSub("Byroden", "cementerio"))?.tema === "yermo");

// …y un tema inventado tiene que IGNORARSE, no colarse. Este es el que muerde:
// `tema: "ceniza"` no casa con ninguna regla de `globals.css`, así que la hoja
// se queda sin los quince tokens —fondo transparente con la app oscura debajo y
// la tinta parda encima— y **no da ningún error**. Se queda el de la semilla,
// que es no hacer caso al DM pero sigue siendo legible.
const ixMalTema = indexar(construirNodos(POIS, {
  "sub:Byroden/taberna": { tema: "ceniza" } as unknown as Partial<Omit<(typeof NODOS)[number], "id">>,
  "poi:Emon": { tema: "" } as unknown as Partial<Omit<(typeof NODOS)[number], "id">>,
}));
check("un tema inventado del DM se ignora", ixMalTema.get(idSub("Byroden", "taberna"))?.tema === "valle");
check("un tema vacío del DM se ignora", ixMalTema.get(idPoi("Emon"))?.tema === "ciudadela");
check("y después del override sigue habiendo tema en todos",
  Array.from(ixMalTema.values()).every((n) => esTema(n.tema)));

/* ---------------------- LA GENTE QUE SE SIEMBRA ------------------------ */
// ⚠️ La plantilla se busca por SLUG de sitio (`taberna`) y no por id entero,
// para que sirva en cualquier pueblo; una franja se busca por su id, porque no
// hay más que una de cada. Si `claveDePlantilla` y `NPC_TEMPLATES` dejan de
// hablar el mismo idioma, **el botón «Sembrar» sale deshabilitado en un sitio
// que sí tiene gente escrita** y nadie se entera de por qué.
check("la clave de un sub-lugar es su slug", claveDePlantilla(idSub("Byroden", "taberna")) === "taberna");
check("la clave de una franja es su id entero", claveDePlantilla(idFranja("linde")) === "franja:linde");
check("un pueblo no tiene plantilla propia", claveDePlantilla(idPoi("Byroden")) === null);

// Los sitios de Byroden y las tres franjas traen gente. Escrito a mano: si
// saliera de NPC_TEMPLATES, quedarse sin sepulturero no rompería nada.
//
// ⚠️ **Aquí se contaban CABEZAS —«trae DOS»— y era un calco del reparto
// inventado que tenía el repo, no una decisión de diseño.** Al entrar el elenco
// real (2026-08-09) la comprobación empezó a fallar por sitios que están
// perfectamente poblados: la iglesia tiene una sacerdotisa y el cementerio un
// sepulturero, y no hacen falta dos de cada para que el sitio funcione. Lo que
// de verdad hay que vigilar es que **esté QUIEN tiene que estar**: perder a
// Elara o a Garrick rompe la campaña, y un recuento no lo habría notado
// mientras alguien pusiera a otro cualquiera en su lugar.
const IMPRESCINDIBLES: Record<string, string[]> = {
  taberna: ["Cora Mano de Malta"],
  iglesia: ["Elara Teje-Raíces"],
  cementerio: ["Viejo Yorick"],
  ayuntamiento: ["Silas Trumble", "Garrick Vance"],
};
for (const clave of ["taberna", "iglesia", "cementerio", "ayuntamiento"]) {
  check(`"${clave}" trae gente escrita`, plantillaDe(clave).length > 0);
  const nombres = plantillaDe(clave).map((t) => t.name);
  for (const quien of IMPRESCINDIBLES[clave]) {
    check(`"${clave}" sigue trayendo a ${quien}`, nombres.includes(quien));
  }
}
for (const f of ["franja:linde", "franja:espesura", "franja:corazon"]) {
  check(`"${f}" trae a alguien`, plantillaDe(f).length >= 1);
}

// Toda plantilla apunta a un sitio que EXISTE. Una escrita para un sitio que
// nadie tiene deja gente que no se puede sembrar desde ninguna pantalla.
const clavesDeNodos = new Set(NODOS.map((n) => claveDePlantilla(n.id)).filter(Boolean) as string[]);
for (const clave of Object.keys(NPC_TEMPLATES)) {
  check(`la plantilla "${clave}" corresponde a un sitio real`, clavesDeNodos.has(clave));
}

// El `prompt` es lo ÚNICO que la IA lee de un PNJ (`personaFor` lo compone con
// el ambiente). Uno de una línea da un PNJ que contesta cualquier cosa, así que
// se exige cuerpo — es el mismo criterio que el texto de las entradas de saber.
for (const [clave, gente] of Object.entries(NPC_TEMPLATES)) {
  for (const t of gente) {
    check(`"${t.name}" (${clave}) tiene nombre y oficio`, t.name.trim().length > 2 && t.role.trim().length > 2);
    check(`"${t.name}" tiene personalidad de verdad para la IA`, t.prompt.trim().length >= 250);
    check(`"${t.name}" habla en segunda persona, como el resto de personas`, /^Eres /.test(t.prompt.trim()));
  }
}

// ⚠️ EL GUARDIA ANTI-DUPLICADO. Vivía dentro de `seedNpcs`, pegado a la
// consulta de Supabase, **donde ningún gate llegaba** — y es lo único que
// impide que un botón le meta al DM once desconocidos encima de los PNJ que ya
// creó a mano. Se sacó a `lib/nodos.ts` justo para poder mirarlo aquí.
check("con el sitio vacío, se siembra", puedeSembrar(0, 2).ok);
check("con alguien ya dentro, NO se siembra", !puedeSembrar(1, 2).ok);
check("y lo dice en vez de callarse", puedeSembrar(1, 2).ok === false && !!(puedeSembrar(1, 2) as { error: string }).error);
check("sin plantilla no se siembra", !puedeSembrar(0, 0).ok);
check("sin plantilla Y con gente, tampoco", !puedeSembrar(3, 0).ok);

// Nombres únicos en todo el pueblo: dos «Mirna» en Byroden y el DM no sabe a
// cuál está editando en el panel.
const nombres = Object.values(NPC_TEMPLATES).flat().map((t) => t.name);
check(`ningún nombre repetido entre plantillas`, new Set(nombres).size === nombres.length);

console.log(`\nGrafo: ${NODOS.length} nodos y ${NODOS.reduce((n, x) => n + x.salidas.length, 0)} salidas.`);
console.log(`Gente escrita: ${nombres.length} PNJ en ${Object.keys(NPC_TEMPLATES).length} sitios.`);
console.log(failures === 0 ? "Todas las comprobaciones pasaron." : `${failures} fallaron.`);
process.exit(failures === 0 ? 0 : 1);
