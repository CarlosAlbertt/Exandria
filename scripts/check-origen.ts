// Gate 33: de dónde eres y qué sabes por serlo.
// Uso: npx tsx scripts/check-origen.ts
//
// Vigila el puente entre el SELECTOR de origen de /crear y el SABER inicial.
// Ese puente ya se rompió una vez sin que nada avisara: el desplegable "Tu
// región" solo salía en Tal'Dorei y `regionEntries()` solo recorría las
// regiones de Tal'Dorei, así que un personaje de Marquet elegía continente y
// se quedaba sin su entrada "Tu tierra" — con menos saber que uno de
// Tal'Dorei, y en silencio.
//
// La invariante que de verdad importa es la última: NINGUNA región que el
// selector ofrece puede quedarse sin entrada de saber detrás. Una elección que
// el juego acepta y luego no usa es exactamente el fallo que no se ve.
import { SABER } from "../data/saber";
import { regionesDeOrigen, todasLasRegionesDeOrigen } from "../data/atlas";
import { CONTINENTS, REGIONS_BY_CONTINENT, DETALLE_REGION } from "../data/world";
import { PLACES, HABITADOS } from "../data/saber";

let failures = 0;

function check(label: string, condition: boolean) {
  if (condition) {
    console.log(`OK   ${label}`);
  } else {
    console.log(`FAIL ${label}`);
    failures++;
  }
}

const regiones = todasLasRegionesDeOrigen();
const entradas = SABER.filter((e) => e.id.startsWith("reg:"));

// --- Cobertura: los cinco continentes habitados ofrecen origen --------------
for (const cont of HABITADOS) {
  check(`${cont} ofrece al menos una región de origen`, regionesDeOrigen(cont).length > 0);
}
// "Mares" no es un continente habitable: queda fuera del atlas y del selector.
check("Mares no ofrece regiones de origen", regionesDeOrigen("Mares").length === 0);
check(
  "el selector solo ofrece continentes conocidos",
  regiones.every((r) => (CONTINENTS as readonly string[]).includes(r.continente))
);

// --- Slugs: son la clave que se guarda en la ficha --------------------------
const slugs = regiones.map((r) => r.region.slug);
check(`ningún slug de región repetido (${slugs.length} regiones)`, new Set(slugs).size === slugs.length);
check("ningún slug vacío", slugs.every((s) => s.trim().length > 0));
// Las fichas ya creadas guardan estos ocho slugs. Si un refactor los cambia,
// esos personajes pierden su tierra sin que nada lo diga.
//
// Van ESCRITOS A MANO a propósito. La primera versión de este check los
// comparaba contra `REGIONS`, que es de donde el atlas los saca: los dos lados
// se movían juntos y la comprobación era verde por construcción. La prueba de
// mutación lo destapó — cambiar un slug en data/taldorei.ts no tumbaba nada.
// Una regla que no puede fallar no vigila nada.
const SLUGS_TALDOREI_CONGELADOS = [
  "costa-lucidiana",
  "sierras-alabastro",
  "llanuras-divisorias",
  "montanas-torrerrisco",
  "montanas-crestormentas",
  "peninsula-pleabruma",
  "expansion-verdante",
  "litoral-filofulgor",
];
check(
  "los slugs de Tal'Dorei no se mueven (fichas ya guardadas)",
  SLUGS_TALDOREI_CONGELADOS.every((s) => slugs.includes(s))
);
// Y al revés: que Tal'Dorei no gane ni pierda regiones sin que nadie se entere.
check(
  "Tal'Dorei sigue teniendo exactamente esas ocho regiones",
  regionesDeOrigen("Tal'Dorei").length === SLUGS_TALDOREI_CONGELADOS.length
);

// --- Cada región va archivada en SU continente ------------------------------
// `placeOf` mandaba todo `reg:` a Tal'Dorei a bulto; con regiones de los cinco
// continentes eso colaba las de Marquet o Issylra bajo Tal'Dorei en /reino.
const placeDe = new Map(entradas.map((e) => [e.id, e.place]));
check(
  "cada entrada de región se archiva en su continente",
  regiones.every(({ continente, region }) => placeDe.get(`reg:${region.slug}`) === continente)
);
check(
  "toda entrada de región cae en un continente conocido",
  entradas.every((e) => (PLACES as readonly string[]).includes(e.place))
);

// --- El puente: selector <-> saber ------------------------------------------
check(
  `toda región ofrecible tiene entrada de saber (${regiones.length} regiones, ${entradas.length} entradas)`,
  regiones.every((r) => placeDe.has(`reg:${r.region.slug}`))
);
check(
  "toda entrada de región corresponde a una región ofrecible",
  entradas.every((e) => slugs.includes(e.id.slice("reg:".length)))
);
check(
  "ninguna entrada de región llega vacía",
  entradas.every((e) => e.text.trim().length > 0 && e.title.trim().length > 0)
);
check(
  "toda entrada de región se entrega por ser de allí (ámbito región)",
  entradas.every((e) => e.scope.kind === "region")
);

// --- Ninguna tierra a medias -----------------------------------------------
// "Tu tierra" se compone con blurb + capital + rasgo. Las regiones sembradas
// salían con capital "—" y rasgo vacío, así que un personaje de Marquet leía
// media entrada y uno de Tal'Dorei la entera, sin que nada lo dijera.
check(
  "toda región de origen declara su rasgo",
  regiones.every(({ region }) => region.feature.trim().length > 0)
);
check(
  "toda región de origen tiene blurb propio",
  regiones.every(({ region }) => region.blurb.trim().length > 0)
);
// Las dos tablas se escriben a mano por separado: si se añade una región a
// REGIONS_BY_CONTINENT y se olvida su detalle, aquí salta.
for (const cont of ["Issylra", "Marquet", "Dientes Rotos"]) {
  check(
    `${cont}: cada región sembrada tiene capital y rasgo escritos`,
    (REGIONS_BY_CONTINENT[cont] ?? []).every((n) => !!DETALLE_REGION[n])
  );
}

console.log(failures ? `\n${failures} comprobación(es) fallida(s)` : "\nTodo en verde");
process.exit(failures ? 1 : 0);
