// Reglas del gate del atlas (POIs, submapas, ratios, nombres, coordenadas...),
// extraídas de scripts/check-taldorei.ts para que valgan igual en cualquier
// continente con submapas por región (Tal'Dorei, Wildemount...). Puro
// refactor: ni una regla nueva, ni una menos. Los textos de los `label` se
// conservan tal cual para que la salida de check-taldorei.ts no cambie.
import fs from "node:fs";
import path from "node:path";
import type { Region } from "@/data/taldorei";
import type { Poi } from "@/data/pois";

export type Hallazgo = { label: string; ok: boolean };

export type EntradaContinente = {
  nombre: string;
  regions: Region[];
  pois: Record<string, Poi[]>;
  ratios: Record<string, string>;
  /** mapas de pueblo que apuntan a POIs de ESTE continente */
  townMaps?: Record<string, string>;
  /** nombres de POI de OTROS continentes: poi_state indexa por nombre sin
   *  distinguir continente, así que la unicidad es global */
  nombresAjenos?: Set<string>;
  /** nombres retirados que ningún blurb puede citar */
  nombresRetirados?: string[];
  /** raíz de public/, para comprobar que los archivos existen */
  raizPublic: string;
};

// Ancho y alto de un JPEG leídos de su cabecera (marcadores SOF), sin
// dependencias. Se usa para verificar el ratio declarado contra el archivo real.
export function tamañoJpeg(ruta: string): { w: number; h: number } | null {
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

// Sustantivos comunes ingleses prohibidos en nombres de POI. Los nombres
// PROPIOS (Wittebak, Bronbog, Syngorn, T'Zarrm) pasan: la lista solo tiene
// sustantivos comunes que deberían haberse traducido.
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

/**
 * Todas las comprobaciones del atlas para un continente. Devuelve la lista de
 * Hallazgo; el llamante (scripts/check-*.ts) decide cómo imprimirlos.
 *
 * DECISIÓN — TOWN_MAPS (data/townMaps.ts) es una tabla GLOBAL, no separada
 * por continente: sus 6 mapas de pueblo son hoy todos de Tal'Dorei. Exigir
 * aquí "cada clave de townMaps es un POI de ESTE continente" reventaría en
 * Wildemount en cuanto se le pase esa misma tabla, porque ninguna de sus
 * claves es un POI de Wildemount.
 *
 * La solución NO es filtrar la tabla en el llamante antes de pasarla: filtrar
 * ("quédate solo con las claves que ya casan") suelta en silencio cualquier
 * clave que no case con NINGÚN continente — que es exactamente la fuga que
 * esta regla existe para cazar (un mapa de pueblo que apunta a un POI que ya
 * no existe en ningún sitio). En vez de eso, cada script check-*.ts pasa el
 * subconjunto de TOWN_MAPS que le pertenece por dueño, sin filtrar: hoy
 * check-taldorei.ts pasa la tabla TOWN_MAPS COMPLETA sin tocar (los 6 mapas
 * son suyos), así que la comprobación de huérfanos ya queda cubierta al
 * 100% ahí mismo. El día que Wildemount reciba su primer mapa de pueblo, esa
 * clave se AÑADE a la llamada de check-wildemount.ts y se QUITA de la que
 * recibe check-taldorei.ts — entre todos los scripts que llaman a
 * comprobarContinente con townMaps, la unión de las tablas que pasan debe
 * seguir siendo, sin huecos, TOWN_MAPS completa.
 */
export function comprobarContinente(c: EntradaContinente): Hallazgo[] {
  const hallazgos: Hallazgo[] = [];
  const check = (label: string, ok: boolean) => hallazgos.push({ label, ok });

  const { nombre, regions, pois, ratios, townMaps, nombresAjenos, nombresRetirados, raizPublic } = c;

  // --- Cada región tiene POIs, imagen y el archivo existe ---
  for (const r of regions) {
    const ps = pois[r.slug];
    check(`${r.name}: tiene entrada en POIS`, Array.isArray(ps));
    check(`${r.name}: no está vacía`, !!ps && ps.length > 0);
    check(`${r.name}: tiene image`, r.image.length > 0);
    if (r.image) {
      check(
        `${r.name}: el submapa existe (${r.image})`,
        fs.existsSync(path.join(raizPublic, r.image))
      );
    }
  }

  // --- El ratio declarado coincide con el aspecto REAL del JPG ---
  // Los pines se posicionan en % del contenedor, y el contenedor toma su forma
  // del ratio declarado; la imagen va con `object-contain`. Si la proporción
  // declarada no es la del archivo, la imagen queda con franjas dentro del
  // contenedor y TODOS los pines de esa región se desplazan respecto al
  // dibujo. Pasó con Llanuras Divisorias: la tabla decía 3300/2500 y el JPG
  // es 2000x1545.
  for (const r of regions) {
    const declarado = ratios[r.slug];
    check(`${r.name}: tiene entrada en REGION_RATIO`, !!declarado);
    if (!declarado || !r.image) continue;
    const tam = tamañoJpeg(path.join(raizPublic, r.image));
    check(`${r.name}: el submapa se puede leer`, !!tam);
    if (!tam) continue;
    const [a, b] = declarado.split("/").map((n) => Number(n.trim()));
    const desvio = Math.abs(a / b - tam.w / tam.h) / (tam.w / tam.h);
    check(
      `${r.name}: REGION_RATIO (${declarado}) cuadra con el JPG (${tam.w}x${tam.h}), desvío ${(desvio * 100).toFixed(1)}%`,
      desvio < 0.005
    );
  }

  // --- No hay regiones en pois que no estén en regions ---
  const slugsConocidos = new Set(regions.map((r) => r.slug));
  for (const slug of Object.keys(pois)) {
    check(`POIS["${slug}"] corresponde a una región de REGIONS`, slugsConocidos.has(slug));
  }

  // --- La capital de cada región existe como POI de ESA región ---
  // "—" es la ausencia declarada de capital (p.ej. Montañas Crestormentas).
  for (const r of regions) {
    if (r.capital === "—") continue;
    const nombres = (pois[r.slug] ?? []).map((p) => p.name);
    check(`${r.name}: su capital "${r.capital}" es un POI de la región`, nombres.includes(r.capital));
  }

  // --- Nombres de POI únicos en todo el continente (y contra nombresAjenos) ---
  // poi_state indexa por nombre: dos POIs con el mismo nombre se pisarían el
  // estado de revelado, tanto si están en regiones distintas del mismo
  // continente como en continentes distintos.
  const vistos = new Map<string, string>();
  for (const r of regions) {
    for (const p of pois[r.slug] ?? []) {
      const previo = vistos.get(p.name) ?? (nombresAjenos?.has(p.name) ? "otro continente" : undefined);
      check(`"${p.name}" no está repetido (${r.slug}${previo ? ` y ${previo}` : ""})`, !previo);
      if (!vistos.has(p.name)) vistos.set(p.name, r.slug);
    }
  }

  // --- Coordenadas: dentro de rango y sin repetirse en TODO el continente ---
  const posiciones = new Map<string, string>();
  for (const r of regions) {
    for (const p of pois[r.slug] ?? []) {
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
  for (const r of regions) {
    for (const p of pois[r.slug] ?? []) {
      const m = p.name.match(reIngles);
      check(`${p.name}: nombre en español${m ? ` (encontrado "${m[1]}")` : ""}`, !m);
    }
  }
  for (const r of regions) {
    const m = r.capital.match(reIngles);
    check(`capital de ${r.name} en español${m ? ` (encontrado "${m[1]}")` : ""}`, !m);
  }

  // --- Blurbs con sustancia: ni vacíos ni de una línea de relleno ---
  for (const r of regions) {
    for (const p of pois[r.slug] ?? []) {
      check(`${p.name}: blurb de al menos 40 caracteres (${p.blurb.length})`, p.blurb.length >= 40);
    }
  }

  // --- Ningún blurb menciona un nombre que ya se corrigió ---
  // Renombrar un POI no toca los blurbs que lo citaban: "Vega del Mooren" se
  // quedó describiendo "el río Anclado", la mistraducción que acababa de irse
  // del nombre. Un texto que se queda mintiendo se arregla, no se deja ahí.
  for (const r of regions) {
    for (const p of pois[r.slug] ?? []) {
      for (const viejo of nombresRetirados ?? []) {
        check(`${p.name}: su blurb no cita "${viejo}"`, !p.blurb.includes(viejo));
      }
    }
  }

  // --- townMaps apunta a POIs vivos de este continente y a archivos que existen ---
  const todosLosNombres = new Set(vistos.keys());
  for (const [nombrePoi, ruta] of Object.entries(townMaps ?? {})) {
    check(`TOWN_MAPS["${nombrePoi}"] es un POI de ${nombre}`, todosLosNombres.has(nombrePoi));
    check(
      `TOWN_MAPS["${nombrePoi}"]: el archivo existe (${ruta})`,
      fs.existsSync(path.join(raizPublic, ruta))
    );
  }

  return hallazgos;
}
