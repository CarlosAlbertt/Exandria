// Comprobación manual del atlas de Wildemount (data/wildemount.ts).
// Las reglas viven en lib/continente.ts (comunes a cualquier continente); este
// script solo arma la EntradaContinente de Wildemount y la imprime. Calcado
// de scripts/check-taldorei.ts adelgazado, con dos diferencias: nombresAjenos
// (Wildemount es el segundo continente con datos propios, así que la
// unicidad de nombres frente a Tal'Dorei y los generados hay que declararla
// a mano) y sin townMaps (Wildemount no tiene mapas de pueblo).
// Uso: npx tsx scripts/check-wildemount.ts
import path from "node:path";
import { WILDEMOUNT_REGIONS, WILDEMOUNT_POIS } from "../data/wildemount";
import { REGION_RATIO } from "../data/regionRatio";
import { seedAtlas } from "../data/atlas";
import { comprobarContinente } from "../lib/continente";

// nombresAjenos: todos los nombres de POI de los OTROS continentes del atlas
// (Tal'Dorei, Issylra, Marquet, Dientes Rotos). poi_state indexa por nombre
// sin distinguir continente, así que la unicidad de nombres es GLOBAL.
const atlas = seedAtlas();
const nombresAjenos = new Set<string>();
for (const [nombreContinente, cont] of Object.entries(atlas)) {
  if (nombreContinente === "Wildemount") continue;
  for (const lista of Object.values(cont.pois)) {
    for (const p of lista) nombresAjenos.add(p.name);
  }
}

const hallazgos = comprobarContinente({
  nombre: "Wildemount",
  regions: WILDEMOUNT_REGIONS,
  pois: WILDEMOUNT_POIS,
  ratios: REGION_RATIO,
  nombresAjenos,
  raizPublic: path.join(process.cwd(), "public"),
});

let failures = 0;
for (const h of hallazgos) {
  if (h.ok) console.log(`OK   ${h.label}`);
  else { console.log(`FAIL ${h.label}`); failures++; }
}

console.log(failures === 0 ? "\nTodas las comprobaciones pasaron." : `\n${failures} comprobación(es) fallaron.`);
process.exit(failures === 0 ? 0 : 1);
