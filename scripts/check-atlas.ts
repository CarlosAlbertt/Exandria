// Script de comprobación manual para data/atlas.ts (seedAtlas).
// Uso: npx tsx scripts/check-atlas.ts
import fs from "node:fs";
import path from "node:path";
import { seedAtlas } from "../data/atlas";
import { REGIONS } from "../data/taldorei";
import { WORLD_POIS } from "../data/world";

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

console.log(failures === 0 ? "\nTodas las comprobaciones pasaron." : `\n${failures} comprobación(es) fallaron.`);
process.exit(failures === 0 ? 0 : 1);
