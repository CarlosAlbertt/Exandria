// Comprobación manual de la lore de continentes y de la fusión del atlas.
// Uso: npx tsx scripts/check-lore.ts
import { SABER, PLACES, PLACE_ACCENT, CATEGORIES, continentBySlug, HABITADOS } from "../data/saber";
import { knows, type SaberCtx } from "../lib/saber";
import { CONTINENT_LORE } from "../data/continentes";
import { CALAMIDAD_RELATO, CALAMIDAD_LORE } from "../data/calamidad";
import { REGIONS_BY_CONTINENT, WORLD_POIS, CONTINENTS } from "../data/world";
import { seedAtlas, mergeAtlas, type AtlasDefs } from "../data/atlas";
import { PRIME_DEITIES, BETRAYER_GODS, LESSER_IDOLS } from "../data/pantheon";
import { slugify } from "../lib/slug";

let failures = 0;
function check(label: string, cond: boolean) {
  if (cond) console.log(`OK   ${label}`);
  else { console.log(`FAIL ${label}`); failures++; }
}

const base: SaberCtx = {
  isDm: false, originContinent: null, originRegion: null, deity: null, cls: null,
  skills: [], unlocked: [], revealed: [],
};

// --- Integridad del dataset ------------------------------------------------
const ids = SABER.map((e) => e.id);
check("ids del saber únicos", new Set(ids).size === ids.length);
check("ninguna entrada sin texto", SABER.every((e) => e.text.trim().length > 0));
check("lore de continentes enchufada al saber", SABER.filter((e) => e.id.startsWith("cl:")).length === CONTINENT_LORE.length);

const continentesValidos = new Set<string>(CONTINENTS);
check("todo `continent` de la lore es un continente real", CONTINENT_LORE.every((e) => continentesValidos.has(e.continent)));
check("todo tier erudito declara pericia", CONTINENT_LORE.every((e) => e.tier !== "erudito" || !!e.skill));

// Los `poi` citados tienen que existir como pin del mundo (si no, la tirada de
// saber in situ de /lugar nunca los encontraría).
const nombresPoi = new Set(WORLD_POIS.map((p) => p.name));
const poisHuerfanos = CONTINENT_LORE.filter((e) => e.poi && !nombresPoi.has(e.poi)).map((e) => `${e.id}→${e.poi}`);
check(`todos los poi citados existen en WORLD_POIS (${poisHuerfanos.join(", ") || "ninguno huérfano"})`, poisHuerfanos.length === 0);

// --- Reglas del saber por origen -------------------------------------------
for (const cont of ["Marquet", "Issylra", "Dientes Rotos"]) {
  const propias = SABER.filter((e) => e.scope.kind === "continente" && e.scope.continent === cont && e.depth === "profundo");
  check(`${cont}: tiene saber profundo de continente`, propias.length > 0);
  check(`${cont}: un forastero no lo sabe`, propias.every((e) => !knows(e, base)));
  check(`${cont}: quien es de allí lo sabe`, propias.every((e) => knows(e, { ...base, originContinent: cont })));
}

const eruditasHist = SABER.filter((e) => e.id.startsWith("cl:") && e.scope.kind === "erudito" && e.scope.skill === "Historia");
check("lo erudito de Historia existe", eruditasHist.length > 0);
check("sin Historia no se sabe", eruditasHist.every((e) => !knows(e, { ...base, originContinent: "Marquet" })));
check("con Historia sí", eruditasHist.every((e) => knows(e, { ...base, skills: ["Historia"] })));

const ocultas = SABER.filter((e) => e.id.startsWith("cl:") && e.scope.kind === "oculto");
check("las potencias/sociedades no se saben por origen", ocultas.every((e) => !knows(e, { ...base, originContinent: "Marquet", skills: ["Historia", "Arcanos", "Religión"] })));
check("se abren al desbloquearlas", ocultas.every((e) => knows(e, { ...base, unlocked: [e.id] })));

const secretas = SABER.filter((e) => e.id.startsWith("cl:") && e.scope.kind === "secreto");
check("los secretos solo si el DM los revela", secretas.every((e) => !knows(e, base) && knows(e, { ...base, revealed: [e.id] })));
check("el DM lo ve todo", SABER.filter((e) => e.id.startsWith("cl:")).every((e) => knows(e, { ...base, isDm: true })));

// --- El DM puede poner a la vista cualquier cosa, no solo secretos ----------
const unaHistoria = SABER.find((e) => e.scope.kind === "erudito" && e.scope.skill === "Historia")!;
check("revealed abre también lo erudito", !knows(unaHistoria, base) && knows(unaHistoria, { ...base, revealed: [unaHistoria.id] }));
const unaOculta = SABER.find((e) => e.scope.kind === "oculto")!;
check("revealed abre también lo oculto", !knows(unaOculta, base) && knows(unaOculta, { ...base, revealed: [unaOculta.id] }));
check("revelar una cosa no abre las demás", !knows(unaOculta, { ...base, revealed: [unaHistoria.id] }));

// --- Atlas: la semilla recoge las regiones nuevas ---------------------------
const semilla = seedAtlas();
for (const cont of ["Marquet", "Issylra", "Dientes Rotos"]) {
  const nombres = (semilla[cont]?.regions ?? []).map((r) => r.name);
  check(`${cont}: la semilla trae sus ${REGIONS_BY_CONTINENT[cont].length} regiones`, REGIONS_BY_CONTINENT[cont].every((n) => nombres.includes(n)));
}
const todosSlugs = Object.values(semilla).flatMap((c) => c.regions.map((r) => r.slug));
check("slugs de región únicos globalmente", new Set(todosSlugs).size === todosSlugs.length);

// --- mergeAtlas: suma sin pisar -------------------------------------------
// Atlas "viejo": el de antes de esta tanda, con una edición del DM encima.
const viejo: AtlasDefs = JSON.parse(JSON.stringify(semilla));
delete viejo["Marquet"].regions[viejo["Marquet"].regions.findIndex((r) => r.name === "Montañas Aggrad")];
viejo["Marquet"].regions = viejo["Marquet"].regions.filter(Boolean);
const rumedam = viejo["Marquet"].regions.find((r) => r.name === "Desierto Rumedam")!;
viejo["Marquet"].pois[rumedam.slug] = viejo["Marquet"].pois[rumedam.slug].filter((p) => p.name !== "Montañas Ascuacorona");
rumedam.blurb = "BLURB EDITADO POR EL DM";
rumedam.map = { x: 1, y: 2 };
viejo["Marquet"].pois[rumedam.slug].push({ name: "Pin inventado del DM", type: "ciudad", blurb: "", x: 50, y: 50 });

const { atlas: fusionado, changed } = mergeAtlas(viejo);
check("mergeAtlas detecta que hay cosas nuevas", changed);
const mq = fusionado["Marquet"];
check("recupera la región que faltaba", mq.regions.some((r) => r.name === "Montañas Aggrad"));
const rum2 = mq.regions.find((r) => r.name === "Desierto Rumedam")!;
check("respeta el blurb editado por el DM", rum2.blurb === "BLURB EDITADO POR EL DM");
check("respeta el pin movido por el DM", rum2.map.x === 1 && rum2.map.y === 2);
check("recupera el POI que faltaba", mq.pois[rum2.slug].some((p) => p.name === "Montañas Ascuacorona"));
check("no borra el POI inventado por el DM", mq.pois[rum2.slug].some((p) => p.name === "Pin inventado del DM"));
const slugsFusion = Object.values(fusionado).flatMap((c) => c.regions.map((r) => r.slug));
check("la fusión mantiene los slugs únicos", new Set(slugsFusion).size === slugsFusion.length);
const nombresPoiFusion = Object.values(mq.pois).flat().map((p) => p.name);
check("la fusión no duplica POIs", new Set(nombresPoiFusion).size === nombresPoiFusion.length);

// Fusionar dos veces no debe cambiar nada más (idempotente).
const segunda = mergeAtlas(fusionado);
check("mergeAtlas es idempotente", segunda.changed === false);

// --- Reparto por lugar y categoría -----------------------------------------
const lugaresValidos = new Set<string>(PLACES);
const categoriasValidas = new Set<string>(CATEGORIES);
check("toda entrada tiene un lugar válido", SABER.every((e) => lugaresValidos.has(e.place)));
check("toda entrada tiene una categoría válida", SABER.every((e) => categoriasValidas.has(e.category)));
check("todo lugar tiene color", PLACES.every((p) => !!PLACE_ACCENT[p]));
check("ningún lugar se queda vacío", PLACES.every((p) => SABER.some((e) => e.place === p)));

for (const cont of ["Marquet", "Issylra", "Dientes Rotos"]) {
  const suyas = SABER.filter((e) => e.id.startsWith(`cl:${cont.toLowerCase().replace(/ /g, "-")}:`));
  check(`${cont}: su lore va a su lugar`, suyas.length > 0 && suyas.every((e) => e.place === cont));
}
check("las deidades van a Exandria", SABER.filter((e) => e.id.startsWith("dei:")).every((e) => e.place === "Exandria" && e.category === "Fe"));
check("las facciones de Tal'Dorei van a Potencias", SABER.filter((e) => e.id.startsWith("fac:")).every((e) => e.place === "Tal'Dorei" && e.category === "Potencias"));
check("lo de Wildemount va a Wildemount", SABER.filter((e) => e.id.startsWith("wmreg:") || e.id.startsWith("wmfac:")).every((e) => e.place === "Wildemount"));
check("los secretos van a la categoría Secretos", SABER.filter((e) => e.scope.kind === "secreto").every((e) => e.category === "Secretos"));

// --- Exandria y la Calamidad -----------------------------------------------
check("el relato tiene cinco actos", CALAMIDAD_RELATO.length === 5);
check("ningún acto vacío", CALAMIDAD_RELATO.every((a) => a.title.trim() && a.body.trim()));
const cal = SABER.filter((e) => e.id.startsWith("cal:"));
check("la lore de la Calamidad entra en el saber", cal.length === CALAMIDAD_LORE.length && cal.length >= 12);
check("toda la Calamidad va al lugar Exandria", cal.every((e) => e.place === "Exandria"));
check("la Calamidad no se sabe por origen", cal.filter((e) => e.scope.kind !== "continente").every((e) => !knows(e, { ...base, originContinent: "Tal'Dorei" })));
const poisCal = CALAMIDAD_LORE.filter((e) => e.poi && !nombresPoi.has(e.poi)).map((e) => e.poi);
check(`los poi de la Calamidad existen (${poisCal.join(", ") || "ninguno huérfano"})`, poisCal.length === 0);

// --- Slugs de continente para /reino/[continente] --------------------------
check("los cinco continentes habitados resuelven por slug", HABITADOS.every((p) => continentBySlug(slugify(p)) === p));
check("un slug inventado no resuelve", continentBySlug("atlantida") === null);
check("Exandria y Mares no tienen página", continentBySlug("exandria") === null && continentBySlug("mares") === null);

// La sección abierta de la página de continente no puede salir vacía.
const ABIERTAS = ["Geografía", "Vida y lenguas"];
for (const p of HABITADOS) {
  check(`${p}: tiene lore abierta que enseñar`, SABER.some((e) => e.place === p && ABIERTAS.includes(e.category)));
}

// --- Panteón ---------------------------------------------------------------
const DIOSES = [...PRIME_DEITIES, ...BETRAYER_GODS, ...LESSER_IDOLS];
// 32, no 33: 12 primarias + 9 traidores + 11 ídolos. La cifra la fija el
// dataset, no al revés — si algún día se añade un ídolo, este check avisa.
check("el panteón suma 32 dioses", DIOSES.length === 32);
check("ningún slug de dios repetido", new Set(DIOSES.map((d) => d.slug)).size === DIOSES.length);
check("toda deidad tiene ficha completa", DIOSES.every((d) => d.name && d.epithet && d.province && d.symbol && d.alignment && d.domains.length > 0));
check("toda deidad tiene tres preceptos", DIOSES.every((d) => d.commandments.length === 3));
// El Luxon es la excepción a propósito: se le venera, pero no es un patrón de
// brujo — es una divinidad sin voluntad ni consciencia con la que pactar.
check("todo ídolo declara su patrón, salvo el Luxon", LESSER_IDOLS.every((d) => d.slug === "luxon" || !!d.patron));
check("cada dios lleva su bando", PRIME_DEITIES.every((d) => d.side === "prime") && BETRAYER_GODS.every((d) => d.side === "betrayer") && LESSER_IDOLS.every((d) => d.side === "idol"));

console.log(failures ? `\n${failures} comprobación(es) fallida(s)` : "\nTodo en verde");
process.exit(failures ? 1 : 0);
