// Script de comprobación manual para data/bestiary (bestiario D&D 2024).
// Uso: npx tsx scripts/check-bestiary.ts
import { ALL_MONSTERS, searchMonsters, type Monster } from "../data/bestiary";
import { CR_XP } from "../data/encounters";
import { CENSO_TODOS } from "../data/bestiary/censo-manual";
import { pbForCr, CR_OPTIONS, mergeMonsters, conMonstruo, sinMonstruo, conDescubierto } from "../lib/useBestiary";

let failures = 0;

function check(label: string, condition: boolean) {
  if (condition) {
    console.log(`OK   ${label}`);
  } else {
    console.log(`FAIL ${label}`);
    failures++;
  }
}

// --- CR (string) -> valor numérico, para comparar contra tablas por rango ---
function crToNumber(cr: string): number {
  if (cr.includes("/")) {
    const [num, den] = cr.split("/").map(Number);
    return num / den;
  }
  return Number(cr);
}

// --- BC esperado según CR (tabla estándar 2024) ---
function expectedPb(cr: string): number {
  const n = crToNumber(cr);
  if (n <= 4) return 2;
  if (n <= 8) return 3;
  if (n <= 12) return 4;
  if (n <= 16) return 5;
  if (n <= 20) return 6;
  if (n <= 24) return 7;
  if (n <= 28) return 8;
  return 9;
}

const HP_FORMULA_RE = /^\d+d\d+( ?[+-] ?\d+)?$/;

check(`ALL_MONSTERS no está vacío (${ALL_MONSTERS.length} monstruos)`, ALL_MONSTERS.length > 0);

// --- Slugs únicos ---
const slugs = ALL_MONSTERS.map((m) => m.slug);
const uniqueSlugs = new Set(slugs);
check(
  `todos los slugs son únicos (${slugs.length} monstruos, ${uniqueSlugs.size} slugs)`,
  slugs.length === uniqueSlugs.size
);

for (const m of ALL_MONSTERS) {
  const tag = `${m.name} (${m.slug})`;

  // Las 6 características entre 1 y 30
  for (const key of ["fue", "des", "con", "int", "sab", "car"] as const) {
    const v = m.abilities[key];
    check(`${tag}: ${key} en rango 1-30 (${v})`, v >= 1 && v <= 30);
  }

  // xp coincide con la tabla CR_XP para su cr
  const expectedXp = CR_XP.find((c) => c.cr === m.cr)?.xp;
  check(
    `${tag}: xp (${m.xp}) coincide con CR_XP para CR ${m.cr} (${expectedXp})`,
    expectedXp !== undefined && m.xp === expectedXp
  );

  // pb coherente con el CR
  check(`${tag}: pb (${m.pb}) coherente con CR ${m.cr}`, m.pb === expectedPb(m.cr));

  // hpFormula parsea
  check(`${tag}: hpFormula parsea (${m.hpFormula})`, HP_FORMULA_RE.test(m.hpFormula));

  // ac en rango 5-25
  check(`${tag}: ac en rango 5-25 (${m.ac})`, m.ac >= 5 && m.ac <= 25);

  // blurb no vacío y <= 300 caracteres (fuerza concisión, evita prosa copiada)
  check(`${tag}: blurb no vacío`, m.blurb.length > 0);
  check(`${tag}: blurb <= 300 caracteres (${m.blurb.length})`, m.blurb.length <= 300);

  // al menos una acción
  check(`${tag}: tiene al menos 1 acción`, m.actions.length >= 1);
}

// --- lib/useBestiary: pbForCr y CR_OPTIONS (comprobaciones puras rápidas) ---
check(`pbForCr("1/4") === 2 (${pbForCr("1/4")})`, pbForCr("1/4") === 2);
check(`pbForCr("13") === 5 (${pbForCr("13")})`, pbForCr("13") === 5);
check(`CR_OPTIONS.length === CR_XP.length (${CR_OPTIONS.length} vs ${CR_XP.length})`, CR_OPTIONS.length === CR_XP.length);

// --- searchMonsters ---
// La comprobación que faltaba: el selector de combate recortaba a 10 y el DM
// no veía el resto del bestiario. Buscar NO recorta; cuántos caben lo decide
// quien pinta.
check(
  `búsqueda vacía devuelve el bestiario entero (${searchMonsters(ALL_MONSTERS, "").length} de ${ALL_MONSTERS.length})`,
  searchMonsters(ALL_MONSTERS, "").length === ALL_MONSTERS.length
);
check(
  "búsqueda vacía no recorta a 10",
  searchMonsters(ALL_MONSTERS, "").length > 10
);
check("solo espacios cuenta como búsqueda vacía", searchMonsters(ALL_MONSTERS, "   ").length === ALL_MONSTERS.length);
check("busca por nombre en español", searchMonsters(ALL_MONSTERS, ALL_MONSTERS[0].name).some((m) => m.slug === ALL_MONSTERS[0].slug));
check("busca por nombre en inglés", searchMonsters(ALL_MONSTERS, ALL_MONSTERS[0].nameEn).some((m) => m.slug === ALL_MONSTERS[0].slug));
check("no distingue mayúsculas", searchMonsters(ALL_MONSTERS, ALL_MONSTERS[0].name.toUpperCase()).length > 0);
check("una búsqueda sin coincidencias devuelve vacío", searchMonsters(ALL_MONSTERS, "zzzzznoexiste").length === 0);
check("filtra por CR", searchMonsters(ALL_MONSTERS, "", { cr: "0" }).every((m) => m.cr === "0"));
check("filtra por tipo", searchMonsters(ALL_MONSTERS, "", { type: ALL_MONSTERS[0].type }).every((m) => m.type === ALL_MONSTERS[0].type));

// Busca sobre la lista que se le pasa, no sobre ALL_MONSTERS: es lo que hace
// que el DM encuentre sus monstruos personalizados.
const inventado: Monster = { ...ALL_MONSTERS[0], slug: "bicho-inventado", name: "Bicho Inventado", nameEn: "Made Up Beast" };
check("busca sobre la lista recibida, no sobre ALL_MONSTERS", searchMonsters([...ALL_MONSTERS, inventado], "Bicho Inventado").some((m) => m.slug === "bicho-inventado"));
check("un personalizado no aparece si no está en la lista", searchMonsters(ALL_MONSTERS, "Bicho Inventado").length === 0);
check("con lista vacía no devuelve nada", searchMonsters([], "").length === 0);

// --- Las mutaciones del bestiario, como capa pura -------------------------
// Antes vivían dentro de funciones que escribían en Supabase y NO tocaban el
// estado local: el hook confiaba en una suscripción realtime a `app_config`,
// que no entrega nunca, así que el DM añadía un monstruo y no lo veía hasta
// recargar. Ahora la mezcla es pura y se comprueba aquí; la escritura es lo
// único que queda en el hook.
const bicho = (slug: string, name: string) => ({ ...ALL_MONSTERS[0], slug, name });

check("conMonstruo añade uno que no estaba",
  conMonstruo([], bicho("nuevo", "Nuevo")).length === 1);
check("conMonstruo SUSTITUYE por slug en vez de duplicar",
  conMonstruo([bicho("x", "Viejo")], bicho("x", "Nuevo")).length === 1);
check("y el que queda es el nuevo",
  conMonstruo([bicho("x", "Viejo")], bicho("x", "Nuevo"))[0].name === "Nuevo");
check("conMonstruo no muta el array que recibe", (() => {
  const antes = [bicho("x", "Viejo")];
  conMonstruo(antes, bicho("y", "Otro"));
  return antes.length === 1;
})());

check("sinMonstruo quita por slug",
  sinMonstruo([bicho("x", "X"), bicho("y", "Y")], "x").length === 1);
check("sinMonstruo con un slug que no está no rompe nada",
  sinMonstruo([bicho("x", "X")], "z").length === 1);
check("sinMonstruo no muta el array que recibe", (() => {
  const antes = [bicho("x", "X")];
  sinMonstruo(antes, "x");
  return antes.length === 1;
})());

check("conDescubierto marca", conDescubierto([], "orco", true).includes("orco"));
check("conDescubierto desmarca", conDescubierto(["orco"], "orco", false).length === 0);
check("marcar dos veces no duplica",
  conDescubierto(conDescubierto([], "orco", true), "orco", true).length === 1);
check("desmarcar algo que no estaba no rompe nada",
  conDescubierto(["orco"], "trasgo", false).length === 1);
check("conDescubierto no muta el array que recibe", (() => {
  const antes = ["orco"];
  conDescubierto(antes, "trasgo", true);
  return antes.length === 1;
})());

// mergeMonsters es lo que ve la pantalla: un personalizado con el slug de uno
// del manual lo SUSTITUYE, y queda marcado como personalizado.
check("mergeMonsters sin personalizados devuelve el bestiario entero",
  mergeMonsters([]).length === ALL_MONSTERS.length);
check("un personalizado nuevo suma uno",
  mergeMonsters([bicho("bicho-inventado", "Bicho")]).length === ALL_MONSTERS.length + 1);
check("un personalizado con el slug de uno del manual NO suma, sustituye",
  mergeMonsters([bicho(ALL_MONSTERS[0].slug, "Reescrito")]).length === ALL_MONSTERS.length);
check("y el que queda es el personalizado, marcado como tal", (() => {
  const m = mergeMonsters([bicho(ALL_MONSTERS[0].slug, "Reescrito")])
    .find((x) => x.slug === ALL_MONSTERS[0].slug);
  return m?.name === "Reescrito" && (m as { custom?: boolean }).custom === true;
})());
check("mergeMonsters ordena por nombre en español", (() => {
  const n = mergeMonsters([]).map((m) => m.name);
  return n.every((x, i) => i === 0 || n[i - 1].localeCompare(x, "es") <= 0);
})());

// --- El censo del manual ----------------------------------------------------
// `data/bestiary/censo-manual.ts` es la lista de trabajo: qué statblocks trae el
// libro, transcrita del apéndice B leyendo la página RENDERIZADA (la capa OCR
// entrelaza las columnas y escribe «Ciant» por «Giant», así que no vale).
//
// Lo que se comprueba NO es que estén todos —faltan cientos y eso es el plan—,
// sino que **todo lo extraído figure en el censo**. Un `nameEn` mal escrito
// dejaría un monstruo imposible de cruzar con el libro, y ese es justo el error
// que no se ve: la ficha se pinta perfecta y solo falla el día que alguien
// intenta saber si ya está extraído.
{
  const plano = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const censo = new Set(CENSO_TODOS.map(plano));
  for (const m of ALL_MONSTERS) {
    check(`«${m.nameEn}» figura en el censo del manual`, censo.has(plano(m.nameEn)));
  }
  check("el censo no tiene nombres repetidos",
    new Set(CENSO_TODOS.map(plano)).size === CENSO_TODOS.length);
  check("el censo no está vacío ni se ha quedado a medias", CENSO_TODOS.length > 400);

  const faltan = CENSO_TODOS.filter((n) => !ALL_MONSTERS.some((m) => plano(m.nameEn) === plano(n)));
  console.log(`\n(cobertura: ${ALL_MONSTERS.length} de ${CENSO_TODOS.length} del manual; faltan ${faltan.length})`);
}

console.log(failures === 0 ? "\nTodas las comprobaciones pasaron." : `\n${failures} comprobación(es) fallaron.`);
process.exit(failures === 0 ? 0 : 1);
