// Comprobación manual del atlas de Tal'Dorei (data/taldorei.ts + data/pois.ts).
// Uso: npx tsx scripts/check-taldorei.ts
import fs from "node:fs";
import path from "node:path";
import { REGIONS } from "../data/taldorei";
import { POIS } from "../data/pois";
import { TOWN_MAPS } from "../data/townMaps";

let failures = 0;
function check(label: string, cond: boolean) {
  if (cond) console.log(`OK   ${label}`);
  else { console.log(`FAIL ${label}`); failures++; }
}

// --- Cada región tiene POIs, imagen y el archivo existe ---
for (const r of REGIONS) {
  const pois = POIS[r.slug];
  check(`${r.name}: tiene entrada en POIS`, Array.isArray(pois));
  check(`${r.name}: no está vacía`, !!pois && pois.length > 0);
  check(`${r.name}: tiene image`, r.image.length > 0);
  if (r.image) {
    check(
      `${r.name}: el submapa existe (${r.image})`,
      fs.existsSync(path.join(process.cwd(), "public", r.image))
    );
  }
}

// --- No hay regiones en POIS que no estén en REGIONS ---
const slugsConocidos = new Set(REGIONS.map((r) => r.slug));
for (const slug of Object.keys(POIS)) {
  check(`POIS["${slug}"] corresponde a una región de REGIONS`, slugsConocidos.has(slug));
}

// --- La capital de cada región existe como POI de ESA región ---
// "—" es la ausencia declarada de capital (Montañas Crestormentas).
for (const r of REGIONS) {
  if (r.capital === "—") continue;
  const nombres = (POIS[r.slug] ?? []).map((p) => p.name);
  check(`${r.name}: su capital "${r.capital}" es un POI de la región`, nombres.includes(r.capital));
}

// --- Nombres de POI únicos en todo el continente ---
// poi_state indexa por nombre: dos POIs con el mismo nombre se pisarían el
// estado de revelado aunque estén en regiones distintas.
const vistos = new Map<string, string>();
for (const r of REGIONS) {
  for (const p of POIS[r.slug] ?? []) {
    const previo = vistos.get(p.name);
    check(`"${p.name}" no está repetido (${r.slug}${previo ? ` y ${previo}` : ""})`, !previo);
    if (!previo) vistos.set(p.name, r.slug);
  }
}

// --- Coordenadas: dentro de rango y sin repetirse en TODO el continente ---
const posiciones = new Map<string, string>();
for (const r of REGIONS) {
  for (const p of POIS[r.slug] ?? []) {
    check(`${p.name}: x en [2,98] (${p.x})`, p.x >= 2 && p.x <= 98);
    check(`${p.name}: y en [2,98] (${p.y})`, p.y >= 2 && p.y <= 98);
    const clave = `${p.x},${p.y}`;
    const previo = posiciones.get(clave);
    check(
      `${p.name}: posición ${clave} sin repetir${previo ? ` (choca con ${previo})` : ""}`,
      !previo
    );
    if (!previo) posiciones.set(clave, `${p.name} [${r.slug}]`);
  }
}

// --- Todos los nombres en español: sustantivos comunes ingleses prohibidos ---
// Los nombres PROPIOS (Wittebak, Bronbog, Syngorn, T'Zarrm) pasan: la lista
// solo tiene sustantivos comunes que deberían haberse traducido.
const PALABRAS_INGLESAS = [
  "Fort", "Village", "City", "Town", "Port", "Keep", "Outpost",
  "Mount", "Mountain", "Mountains", "Hills", "Peaks", "Ridge", "Valley",
  "Bay", "Sea", "Ocean", "Lake", "River", "Falls", "Reef", "Isle", "Island",
  "Wood", "Woods", "Forest", "Pines", "Grove", "Thicket", "Timberland",
  "Marsh", "Marshlands", "Swamp", "Gorge", "Basin", "Cavern", "Cave", "Tomb",
  "Fields", "Waters", "Depths", "Bluffs", "Channel", "Crossroads", "Roadway",
  "Path", "Trail", "Countryside", "Shoreline", "Range", "Barrow", "Narrows",
];
const reIngles = new RegExp(`\\b(${PALABRAS_INGLESAS.join("|")})\\b`, "i");
for (const r of REGIONS) {
  for (const p of POIS[r.slug] ?? []) {
    const m = p.name.match(reIngles);
    check(`${p.name}: nombre en español${m ? ` (encontrado "${m[1]}")` : ""}`, !m);
  }
}
for (const r of REGIONS) {
  const m = r.capital.match(reIngles);
  check(`capital de ${r.name} en español${m ? ` (encontrado "${m[1]}")` : ""}`, !m);
}

// --- Blurbs con sustancia: ni vacíos ni de una línea de relleno ---
for (const r of REGIONS) {
  for (const p of POIS[r.slug] ?? []) {
    check(`${p.name}: blurb de al menos 40 caracteres (${p.blurb.length})`, p.blurb.length >= 40);
  }
}

// --- TOWN_MAPS apunta a POIs vivos y a archivos que existen ---
const todosLosNombres = new Set(vistos.keys());
for (const [nombre, ruta] of Object.entries(TOWN_MAPS)) {
  check(`TOWN_MAPS["${nombre}"] es un POI de Tal'Dorei`, todosLosNombres.has(nombre));
  check(
    `TOWN_MAPS["${nombre}"]: el archivo existe (${ruta})`,
    fs.existsSync(path.join(process.cwd(), "public", ruta))
  );
}

console.log(failures === 0 ? "\nTodas las comprobaciones pasaron." : `\n${failures} comprobación(es) fallaron.`);
process.exit(failures === 0 ? 0 : 1);
