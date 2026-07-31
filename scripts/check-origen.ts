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
import { CONTINENTS } from "../data/world";
import { PLACES, HABITADOS } from "../data/saber";
import { REGIONS } from "../data/taldorei";

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
// Las fichas ya creadas guardan estos ocho. Si un refactor los cambia, esos
// personajes pierden su tierra sin que nada lo diga: aquí se entera.
check(
  "los slugs de Tal'Dorei no se mueven (fichas ya guardadas)",
  REGIONS.every((r) => slugs.includes(r.slug))
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

console.log(failures ? `\n${failures} comprobación(es) fallida(s)` : "\nTodo en verde");
process.exit(failures ? 1 : 0);
