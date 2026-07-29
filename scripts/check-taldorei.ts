// Comprobación manual del atlas de Tal'Dorei (data/taldorei.ts + data/pois.ts).
// Las reglas viven en lib/continente.ts (comunes a cualquier continente); este
// script solo arma la EntradaContinente de Tal'Dorei y la imprime.
// Uso: npx tsx scripts/check-taldorei.ts
import path from "node:path";
import { REGIONS } from "../data/taldorei";
import { REGION_RATIO } from "../data/regionRatio";
import { POIS } from "../data/pois";
import { TOWN_MAPS } from "../data/townMaps";
import { comprobarContinente } from "../lib/continente";

// Los 6 mapas de pueblo de TOWN_MAPS son, hoy, todos de Tal'Dorei: se pasa la
// tabla completa sin filtrar para que la comprobación de huérfanos (ver
// comentario de decisión en lib/continente.ts) quede cubierta al 100% aquí.
// Cuando Wildemount tenga su primer mapa de pueblo, esa clave se muda a la
// llamada de check-wildemount.ts y sale de esta.
const hallazgos = comprobarContinente({
  nombre: "Tal'Dorei",
  regions: REGIONS,
  pois: POIS,
  ratios: REGION_RATIO,
  townMaps: TOWN_MAPS,
  nombresRetirados: ["Anclado", "Cerrofauces", "Fort Daxio"],
  raizPublic: path.join(process.cwd(), "public"),
});

let failures = 0;
for (const h of hallazgos) {
  if (h.ok) console.log(`OK   ${h.label}`);
  else { console.log(`FAIL ${h.label}`); failures++; }
}

console.log(failures === 0 ? "\nTodas las comprobaciones pasaron." : `\n${failures} comprobación(es) fallaron.`);
process.exit(failures === 0 ? 0 : 1);
