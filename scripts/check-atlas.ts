// Script de comprobación manual para data/atlas.ts (seedAtlas).
// Uso: npx tsx scripts/check-atlas.ts
import fs from "node:fs";
import path from "node:path";
import { seedAtlas, mergeAtlas, TALDOREI_FIXES } from "../data/atlas";
import { REGIONS } from "../data/taldorei";
import { WORLD_POIS } from "../data/world";
import { POIS } from "../data/pois";

let failures = 0;

function check(label: string, condition: boolean) {
  if (condition) {
    console.log(`OK   ${label}`);
  } else {
    console.log(`FAIL ${label}`);
    failures++;
  }
}

const atlas = seedAtlas();
const continents = Object.keys(atlas);

// --- Exactamente 5 continentes, sin "Mares" ---
check("seedAtlas() produce 5 continentes", continents.length === 5);
check("Mares no está en el atlas", !continents.includes("Mares"));
for (const c of ["Tal'Dorei", "Issylra", "Wildemount", "Marquet", "Dientes Rotos"]) {
  check(`incluye ${c}`, continents.includes(c));
}

// --- Slugs globalmente únicos ---
const allSlugs: string[] = [];
for (const cont of continents) {
  for (const r of atlas[cont].regions) allSlugs.push(r.slug);
}
const uniqueSlugs = new Set(allSlugs);
check(
  `todos los slugs de región son únicos globalmente (${allSlugs.length} regiones, ${uniqueSlugs.size} slugs)`,
  allSlugs.length === uniqueSlugs.size
);

// --- Tal'Dorei conserva sus slugs originales ---
const taldoreiSlugs = atlas["Tal'Dorei"].regions.map((r) => r.slug);
const originalSlugs = REGIONS.map((r) => r.slug);
check(
  "los slugs originales de Tal'Dorei siguen presentes",
  originalSlugs.every((s) => taldoreiSlugs.includes(s))
);

// --- Cada POI de WORLD_POIS no-continente/región (fuera de Mares) cae en
// exactamente una región ---
const relevantWorldPois = WORLD_POIS.filter(
  (p) => p.type !== "continente" && p.type !== "region" && p.continent !== "Mares"
);
// Tal'Dorei no viene de WORLD_POIS (usa data/taldorei.ts / data/pois.ts), así
// que se excluye de este recuento: solo los continentes generados desde
// REGIONS_BY_CONTINENT reparten WORLD_POIS.
let totalAtlasPois = 0;
for (const cont of continents) {
  if (cont === "Tal'Dorei") continue;
  for (const slug of Object.keys(atlas[cont].pois)) totalAtlasPois += atlas[cont].pois[slug].length;
}
check(
  `todos los WORLD_POIS relevantes (${relevantWorldPois.length}) aparecen en el atlas (${totalAtlasPois} POIs repartidos)`,
  relevantWorldPois.length === totalAtlasPois
);

for (const p of relevantWorldPois) {
  const cont = atlas[p.continent];
  if (!cont) {
    check(`${p.name}: continente ${p.continent} existe en el atlas`, false);
    continue;
  }
  const region = cont.regions.find((r) => r.name === p.region);
  if (!region) {
    check(`${p.name}: región "${p.region}" existe en ${p.continent}`, false);
    continue;
  }
  const found = (cont.pois[region.slug] ?? []).some((poi) => poi.name === p.name);
  check(`${p.name} aparece en ${p.continent} / ${p.region}`, found);
}

// --- Cada ciudad/fortaleza de Tal'Dorei tiene su pin en el mapa mundial ---
// (va aquí, ANTES de la sección "TALDOREI_FIXES sobre un atlas VIEJO de
// verdad" de más abajo: esa sección muta `POIS` por referencia -- seedAtlas()
// asigna `pois: POIS` tal cual, sin copiar -- así que leer POIS después de
// ella vería nombres deshechos, p. ej. "Fuerte Daxio" vuelto "Fort Daxio".)
const nombresMundo = new Set(WORLD_POIS.filter((p) => p.continent === "Tal'Dorei").map((p) => p.name));
for (const lista of Object.values(POIS)) {
  for (const p of lista) {
    if (p.type !== "ciudad" && p.type !== "fortaleza") continue;
    check(`${p.name}: tiene pin en el mapa mundial`, nombresMundo.has(p.name));
  }
}

// --- Wildemount: las regiones mapeadas a archivo tienen image no vacía y el
// archivo existe físicamente en public/ ---
const wildemount = atlas["Wildemount"];
let wildemountWithImage = 0;
for (const r of wildemount.regions) {
  if (r.image) {
    wildemountWithImage++;
    const filePath = path.join(process.cwd(), "public", r.image);
    check(`Wildemount/${r.name}: archivo existe (${r.image})`, fs.existsSync(filePath));
  }
}
check("Wildemount: al menos una región tiene imagen mapeada", wildemountWithImage > 0);

// --- Dientes Rotos: la región "Dientes Rotos" recupera su blurb del WORLD_POI
// "Los Dientes Rotos" vía normalización de artículo inicial ---
const dientesRegion = atlas["Dientes Rotos"].regions.find((r) => r.name === "Dientes Rotos");
check("Dientes Rotos: región presente", !!dientesRegion);
check("Dientes Rotos: blurb no vacío (normalización de artículo)", !!dientesRegion && dientesRegion.blurb.length > 0);

// --- TALDOREI_FIXES es idempotente: aplicar mergeAtlas dos veces no cambia
// nada la segunda vez ---
const primera = mergeAtlas(seedAtlas());
const segunda = mergeAtlas(primera.atlas);
check("mergeAtlas es idempotente sobre una semilla nueva", segunda.changed === false);
check(
  "tras mergeAtlas, Emon está en Litoral de Filofulgor",
  (primera.atlas["Tal'Dorei"].pois["litoral-filofulgor"] ?? []).some((p) => p.name === "Emon")
);

// --- TALDOREI_FIXES sobre un atlas VIEJO de verdad ---
// Las dos comprobaciones de arriba parten de `seedAtlas()`, que ya trae los
// nombres nuevos: ninguna corrección llega a casar, así que no prueban nada de
// lo que las correcciones hacen. Aquí se reconstruye el estado ANTERIOR
// (deshaciendo cada fix sobre la semilla) y se comprueba el resultado real:
// el nombre viejo desaparece del continente entero y el nuevo aparece UNA vez.
// Esto es lo que caza el fantasma de un renombre dentro de la misma región.
const viejo = seedAtlas();
const contViejo = viejo["Tal'Dorei"];
for (const fix of TALDOREI_FIXES) {
  const destino = fix.aRegion ?? fix.deRegion;
  const nombreNuevo = fix.nombreNuevo ?? fix.nombre;
  const actual = (contViejo.pois[destino] ?? []).find((p) => p.name === nombreNuevo);
  if (!actual) continue;
  contViejo.pois[destino] = (contViejo.pois[destino] ?? []).filter((p) => p.name !== nombreNuevo);
  contViejo.pois[fix.deRegion] = [
    ...(contViejo.pois[fix.deRegion] ?? []),
    { ...actual, name: fix.nombre, x: fix.desdeX, y: fix.desdeY },
  ];
}
const corregido = mergeAtlas(viejo).atlas["Tal'Dorei"];
const todosLosPois = Object.values(corregido.pois).flat();
for (const fix of TALDOREI_FIXES) {
  const nombreNuevo = fix.nombreNuevo ?? fix.nombre;
  const destino = fix.aRegion ?? fix.deRegion;
  if (fix.nombreNuevo) {
    check(
      `TALDOREI_FIXES: "${fix.nombre}" ya no existe tras corregirlo`,
      !todosLosPois.some((p) => p.name === fix.nombre)
    );
  }
  check(
    `TALDOREI_FIXES: "${nombreNuevo}" aparece una sola vez`,
    todosLosPois.filter((p) => p.name === nombreNuevo).length === 1
  );
  check(
    `TALDOREI_FIXES: "${nombreNuevo}" acaba en ${destino}`,
    (corregido.pois[destino] ?? []).some((p) => p.name === nombreNuevo)
  );
}

// Una edición del DM manda sobre la corrección: si movió el pin, no se pisa.
const conEdicion = seedAtlas();
const lucidiana = conEdicion["Tal'Dorei"].pois["costa-lucidiana"] ?? [];
conEdicion["Tal'Dorei"].pois["costa-lucidiana"] = [
  ...lucidiana,
  { name: "Emon", type: "ciudad", blurb: "movido por el DM", x: 99, y: 99 },
];
const trasEdicion = mergeAtlas(conEdicion).atlas["Tal'Dorei"];
check(
  "TALDOREI_FIXES: un POI que el DM movió no se corrige ni se duplica",
  (trasEdicion.pois["costa-lucidiana"] ?? []).some((p) => p.name === "Emon" && p.x === 99) &&
    Object.values(trasEdicion.pois).flat().filter((p) => p.name === "Emon").length === 2
);

console.log(failures === 0 ? "\nTodas las comprobaciones pasaron." : `\n${failures} comprobación(es) fallaron.`);
process.exit(failures === 0 ? 0 : 1);
