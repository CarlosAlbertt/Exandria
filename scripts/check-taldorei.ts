// Comprobación manual del atlas de Tal'Dorei (data/taldorei.ts + data/pois.ts).
// Uso: npx tsx scripts/check-taldorei.ts
import fs from "node:fs";
import path from "node:path";
import { REGIONS, REGION_RATIO } from "../data/taldorei";
import { POIS } from "../data/pois";
import { TOWN_MAPS } from "../data/townMaps";

let failures = 0;
function check(label: string, cond: boolean) {
  if (cond) console.log(`OK   ${label}`);
  else { console.log(`FAIL ${label}`); failures++; }
}

// Ancho y alto de un JPEG leídos de su cabecera (marcadores SOF), sin
// dependencias. Se usa para verificar REGION_RATIO contra el archivo real.
function tamañoJpeg(ruta: string): { w: number; h: number } | null {
  const buf = fs.readFileSync(ruta);
  let i = 2;
  while (i < buf.length - 9) {
    if (buf[i] !== 0xff) { i++; continue; }
    const marca = buf[i + 1];
    const esSOF = marca >= 0xc0 && marca <= 0xcf && marca !== 0xc4 && marca !== 0xc8 && marca !== 0xcc;
    if (esSOF) return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
    i += 2 + buf.readUInt16BE(i + 2);
  }
  return null;
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

// --- REGION_RATIO coincide con el aspecto REAL del JPG ---
// Los pines se posicionan en % del contenedor, y el contenedor toma su forma de
// REGION_RATIO; la imagen va con `object-contain`. Si la proporción declarada no
// es la del archivo, la imagen queda con franjas dentro del contenedor y TODOS
// los pines de esa región se desplazan respecto al dibujo. Pasó con Llanuras
// Divisorias: la tabla decía 3300/2500 y el JPG es 2000x1545.
for (const r of REGIONS) {
  const declarado = REGION_RATIO[r.slug];
  check(`${r.name}: tiene entrada en REGION_RATIO`, !!declarado);
  if (!declarado || !r.image) continue;
  const tam = tamañoJpeg(path.join(process.cwd(), "public", r.image));
  check(`${r.name}: el submapa se puede leer`, !!tam);
  if (!tam) continue;
  const [a, b] = declarado.split("/").map((n) => Number(n.trim()));
  const desvio = Math.abs(a / b - tam.w / tam.h) / (tam.w / tam.h);
  check(
    `${r.name}: REGION_RATIO (${declarado}) cuadra con el JPG (${tam.w}x${tam.h}), desvío ${(desvio * 100).toFixed(1)}%`,
    desvio < 0.005
  );
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

// --- Ningún blurb menciona un nombre que ya se corrigió ---
// Renombrar un POI no toca los blurbs que lo citaban: "Vega del Mooren" se
// quedó describiendo "el río Anclado", la mistraducción que acababa de irse
// del nombre. Un texto que se queda mintiendo se arregla, no se deja ahí.
const NOMBRES_RETIRADOS = ["Anclado", "Cerrofauces", "Fort Daxio"];
for (const r of REGIONS) {
  for (const p of POIS[r.slug] ?? []) {
    for (const viejo of NOMBRES_RETIRADOS) {
      check(`${p.name}: su blurb no cita "${viejo}"`, !p.blurb.includes(viejo));
    }
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
