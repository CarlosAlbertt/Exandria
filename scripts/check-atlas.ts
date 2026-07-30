// Script de comprobación manual para data/atlas.ts (seedAtlas).
// Uso: npx tsx scripts/check-atlas.ts
import fs from "node:fs";
import path from "node:path";
import { seedAtlas, mergeAtlas, ATLAS_FIXES } from "../data/atlas";
import { REGIONS } from "../data/taldorei";
import { WORLD_POIS } from "../data/world";
import { POIS } from "../data/pois";
import { WILDEMOUNT_POIS, WILDEMOUNT_REGIONS } from "../data/wildemount";

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
// Tal'Dorei y Wildemount se excluyen igual que "Mares": sus pines de mundo NO
// se reparten por región desde WORLD_POIS (los dos tienen datos propios en
// data/taldorei.ts + data/pois.ts y data/wildemount.ts respectivamente), así
// que contarlos aquí compara dos cosas distintas. El filtro llevaba
// excluyendo a Tal'Dorei de facto solo porque no tenía ni un pin propio;
// Wildemount se suma explícitamente desde que dejó de derivar sus POIs de
// WORLD_POIS (ver data/wildemount.ts).
const relevantWorldPois = WORLD_POIS.filter(
  (p) =>
    p.type !== "continente" &&
    p.type !== "region" &&
    p.continent !== "Mares" &&
    p.continent !== "Tal'Dorei" &&
    p.continent !== "Wildemount"
);
// Tal'Dorei y Wildemount no vienen de WORLD_POIS (usan sus propios archivos de
// datos), así que se excluyen de este recuento: solo los continentes
// generados desde REGIONS_BY_CONTINENT reparten WORLD_POIS.
let totalAtlasPois = 0;
for (const cont of continents) {
  if (cont === "Tal'Dorei" || cont === "Wildemount") continue;
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
const pinesTaldorei = WORLD_POIS.filter((p) => p.continent === "Tal'Dorei" && p.type !== "continente");
const nombresMundo = new Set(pinesTaldorei.map((p) => p.name));
for (const lista of Object.values(POIS)) {
  for (const p of lista) {
    if (p.type !== "ciudad" && p.type !== "fortaleza") continue;
    check(`${p.name}: tiene pin en el mapa mundial`, nombresMundo.has(p.name));
  }
}
// …y al revés: ningún pin de mundo apunta a una región que no existe.
const nombresDeRegion = new Set(REGIONS.map((r) => r.name));
for (const p of pinesTaldorei) {
  check(`pin de mundo "${p.name}": su región "${p.region}" existe`, nombresDeRegion.has(p.region));
}

// --- Cada ciudad/fortaleza de Wildemount tiene su pin en el mapa mundial ---
const pinesWildemount = WORLD_POIS.filter((p) => p.continent === "Wildemount" && p.type !== "continente");
const nombresMundoWildemount = new Set(pinesWildemount.map((p) => p.name));
for (const lista of Object.values(WILDEMOUNT_POIS)) {
  for (const p of lista) {
    if (p.type !== "ciudad" && p.type !== "fortaleza") continue;
    check(`${p.name}: tiene pin en el mapa mundial`, nombresMundoWildemount.has(p.name));
  }
}
// …y al revés: ningún pin de mundo de Wildemount apunta a una región que no existe.
const nombresDeRegionWildemount = new Set(WILDEMOUNT_REGIONS.map((r) => r.name));
for (const p of pinesWildemount) {
  check(`pin de mundo "${p.name}": su región "${p.region}" existe`, nombresDeRegionWildemount.has(p.region));
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

// --- ATLAS_FIXES es idempotente: aplicar mergeAtlas dos veces no cambia
// nada la segunda vez ---
const primera = mergeAtlas(seedAtlas());
const segunda = mergeAtlas(primera.atlas);
check("mergeAtlas es idempotente sobre una semilla nueva", segunda.changed === false);
check(
  "tras mergeAtlas, Emon está en Litoral de Filofulgor",
  (primera.atlas["Tal'Dorei"].pois["litoral-filofulgor"] ?? []).some((p) => p.name === "Emon")
);

// --- ATLAS_FIXES sobre un atlas VIEJO de verdad, por continente ---
// Las dos comprobaciones de arriba parten de `seedAtlas()`, que ya trae los
// nombres nuevos: ninguna corrección llega a casar, así que no prueban nada de
// lo que las correcciones hacen. Aquí se reconstruye el estado ANTERIOR
// (deshaciendo cada fix sobre la semilla) y se comprueba el resultado real:
// el nombre viejo desaparece del continente entero y el nuevo aparece UNA vez.
// Esto es lo que caza el fantasma de un renombre dentro de la misma región.
// Se repite para los dos continentes con ATLAS_FIXES: Tal'Dorei y Wildemount.
// OJO: `seedAtlas()` devuelve los CONTINENTES_PROPIOS con sus `pois` **por
// referencia** (`pois: POIS` / `pois: WILDEMOUNT_POIS`, sin copiar). Escribir
// en `contViejo.pois` mutaría el módulo de datos en memoria y envenenaría
// cualquier comprobación posterior (se vio: "Fuerte Daxio" volviendo a
// llamarse "Fort Daxio"). Se copia antes de tocar nada.
for (const contName of ["Tal'Dorei", "Wildemount"] as const) {
  const fixesDeEsteContinente = ATLAS_FIXES.filter((f) => f.continente === contName);

  const viejo = seedAtlas();
  const contViejo = viejo[contName];
  contViejo.pois = Object.fromEntries(
    Object.entries(contViejo.pois).map(([slug, lista]) => [slug, [...lista]])
  );
  for (const fix of fixesDeEsteContinente) {
    if (fix.borrar) {
      // Deshacer un borrado: reinsertar el POI en su región/posición vieja.
      contViejo.pois[fix.deRegion] = [
        ...(contViejo.pois[fix.deRegion] ?? []),
        { name: fix.nombre, type: "natural", blurb: "reconstruido para el test", x: fix.desdeX, y: fix.desdeY },
      ];
      continue;
    }
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
  const corregido = mergeAtlas(viejo).atlas[contName];
  const todosLosPois = Object.values(corregido.pois).flat();
  for (const fix of fixesDeEsteContinente) {
    if (fix.borrar) {
      check(
        `ATLAS_FIXES[${contName}]: "${fix.nombre}" borrado no aparece en ninguna región`,
        !todosLosPois.some((p) => p.name === fix.nombre)
      );
      continue;
    }
    const nombreNuevo = fix.nombreNuevo ?? fix.nombre;
    const destino = fix.aRegion ?? fix.deRegion;
    if (fix.nombreNuevo) {
      check(
        `ATLAS_FIXES[${contName}]: "${fix.nombre}" ya no existe tras corregirlo`,
        !todosLosPois.some((p) => p.name === fix.nombre)
      );
    }
    check(
      `ATLAS_FIXES[${contName}]: "${nombreNuevo}" aparece una sola vez`,
      todosLosPois.filter((p) => p.name === nombreNuevo).length === 1
    );
    check(
      `ATLAS_FIXES[${contName}]: "${nombreNuevo}" acaba en ${destino}`,
      (corregido.pois[destino] ?? []).some((p) => p.name === nombreNuevo)
    );
  }
}

// Una edición del DM manda sobre la corrección: si movió el pin, no se pisa.
const conEdicion = seedAtlas();
const contEdicion = conEdicion["Tal'Dorei"];
contEdicion.pois = Object.fromEntries(
  Object.entries(contEdicion.pois).map(([slug, lista]) => [slug, [...lista]])
);
contEdicion.pois["costa-lucidiana"] = [
  ...(contEdicion.pois["costa-lucidiana"] ?? []),
  { name: "Emon", type: "ciudad", blurb: "movido por el DM", x: 99, y: 99 },
];
const trasEdicion = mergeAtlas(conEdicion).atlas["Tal'Dorei"];
check(
  "ATLAS_FIXES: un POI que el DM movió no se corrige ni se duplica",
  (trasEdicion.pois["costa-lucidiana"] ?? []).some((p) => p.name === "Emon" && p.x === 99) &&
    Object.values(trasEdicion.pois).flat().filter((p) => p.name === "Emon").length === 2
);

// Cierre: este script simula atlas viejos y ediciones del DM, y `seedAtlas()`
// entrega `data/pois.ts` / `data/wildemount.ts` por referencia. Si alguna
// simulación se olvida de copiar, deja el módulo tocado en memoria y las
// comprobaciones de después mienten. Esto lo detecta para los dos.
check(
  "el script no ha mutado data/pois.ts (Fuerte Daxio sigue en Torrerrisco)",
  (POIS["montanas-torrerrisco"] ?? []).some((p) => p.name === "Fuerte Daxio")
);
check(
  "el script no ha mutado data/wildemount.ts (Montañas Cyrios sigue en Imperio Dwendaliano)",
  (WILDEMOUNT_POIS["imperio-dwendaliano"] ?? []).some((p) => p.name === "Montañas Cyrios" && p.x === 8 && p.y === 85)
);
check(
  "el script no ha mutado data/wildemount.ts (Valle del Tuétano no reaparece como POI)",
  !Object.values(WILDEMOUNT_POIS).flat().some((p) => p.name === "Valle del Tuétano")
);

console.log(failures === 0 ? "\nTodas las comprobaciones pasaron." : `\n${failures} comprobación(es) fallaron.`);
process.exit(failures === 0 ? 0 : 1);
