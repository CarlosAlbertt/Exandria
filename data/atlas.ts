// Atlas por continente: generaliza el modelo de Tal'Dorei (region/POI) a los
// cinco continentes habitados de Exandria (todos menos "Mares", que se queda
// como pines planos/etiquetas). `seedAtlas` construye los datos por defecto a
// partir de `data/world.ts` (WORLD_POIS) la primera vez que se necesitan;
// después el DM los edita y persiste en `app_config` (ver lib/useAtlas.ts).

import { REGIONS, type Region } from "@/data/taldorei";
import { POIS, type Poi, type PoiType } from "@/data/pois";
import { WILDEMOUNT_REGIONS, WILDEMOUNT_POIS } from "@/data/wildemount";
import { REGIONS_BY_CONTINENT, CONTINENT_VIEW, WORLD_POIS, type WorldType } from "@/data/world";
import { slugify } from "@/lib/slug";

export type ContinentAtlas = { regions: Region[]; pois: Record<string, Poi[]> }; // pois keyed por region.slug
export type AtlasDefs = Record<string, ContinentAtlas>; // key = nombre de continente

// Continentes con datos propios (regiones y POIs escritos a mano, no
// derivados de WORLD_POIS). Los demás siguen saliendo de REGIONS_BY_CONTINENT.
const CONTINENTES_PROPIOS: Record<string, () => ContinentAtlas> = {
  "Tal'Dorei": () => ({ regions: REGIONS, pois: POIS }),
  "Wildemount": () => ({ regions: WILDEMOUNT_REGIONS, pois: WILDEMOUNT_POIS }),
};

// Continentes generados a partir de REGIONS_BY_CONTINENT (los CONTINENTES_PROPIOS
// se siembran aparte, con sus datos propios). "Mares" queda fuera del atlas.
const GENERATED_CONTINENTS = ["Issylra", "Marquet", "Dientes Rotos"] as const;

// Paleta de acentos para las regiones nuevas (misma lista que ACCENTS en
// app/dm/MapaPanel.tsx), rotada por índice dentro de cada continente.
const ACCENTS = [
  "var(--color-bronze)",
  "var(--color-arcane)",
  "var(--color-divino)",
  "var(--color-marcial)",
  "var(--color-violet)",
  "var(--color-primitivo)",
  "var(--color-ember)",
  "var(--color-arcane-deep)",
];

// Traducción WorldType → PoiType (los POIs del atlas usan el tipo de
// data/pois.ts, más reducido que el del mundo). Lo no mapeado cae en "ciudad".
const WORLDTYPE_TO_POITYPE: Partial<Record<WorldType, PoiType>> = {
  capital: "ciudad",
  ciudad: "ciudad",
  pueblo: "ciudad",
  fortaleza: "fortaleza",
  ruina: "ruina",
  natural: "natural",
  peligro: "peligro",
};
function toPoiType(t: WorldType): PoiType {
  return WORLDTYPE_TO_POITYPE[t] ?? "ciudad";
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

// Deriva un slug de región único GLOBALMENTE frente a `usedSlugs` (todos los
// slugs ya presentes en el atlas, de cualquier continente). Si el slug natural
// choca, se prefija con la inicial del continente; si aun así choca, se numera.
// NO muta `usedSlugs`: el llamante añade el resultado si lo va a conservar.
// Fuente de verdad compartida por seedAtlas y el editor DM (app/dm/MapaPanel).
export function uniqueRegionSlug(name: string, cont: string, usedSlugs: Set<string>): string {
  const base = slugify(name);
  const candidate = usedSlugs.has(base) ? `${cont[0].toLowerCase()}-${base}` : base;
  let finalSlug = candidate;
  let suffix = 2;
  while (usedSlugs.has(finalSlug)) {
    finalSlug = `${candidate}-${suffix}`;
    suffix++;
  }
  return finalSlug;
}

// Normaliza un nombre para comparar sin el artículo inicial ("Los"/"Las"/"La"/
// "El"). Permite que la región "Dientes Rotos" case con el WORLD_POI
// "Los Dientes Rotos" en la búsqueda de blurb (solo como respaldo).
function stripArticle(name: string): string {
  return name.replace(/^(los|las|la|el)\s+/i, "").toLowerCase();
}

// Posición del pin por defecto cuando no hay WORLD_POIS de tipo "region" con
// ese nombre: un spread dentro de CONTINENT_VIEW[cont].box, repartido entre
// las regiones del continente para no amontonarlas.
function fallbackMapPos(cont: string, idx: number, total: number): { x: number; y: number } {
  const view = CONTINENT_VIEW[cont];
  const box = view.box;
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const spreadX = total > 1 ? (idx - (total - 1) / 2) * (box.w / (total + 1)) : 0;
  const spreadY = total > 1 ? ((idx % 2 === 0 ? -1 : 1) * box.h) / 6 : 0;
  return { x: clamp(cx + spreadX, 0, 100), y: clamp(cy + spreadY, 0, 100) };
}

// Siembra las regiones y POIs de un continente generado (todos menos
// Tal'Dorei), asegurando slugs globalmente únicos vía `usedSlugs`.
function seedContinent(cont: string, usedSlugs: Set<string>): ContinentAtlas {
  const names = REGIONS_BY_CONTINENT[cont] ?? [];
  const regions: Region[] = [];
  const pois: Record<string, Poi[]> = {};

  names.forEach((name, idx) => {
    const finalSlug = uniqueRegionSlug(name, cont, usedSlugs);
    usedSlugs.add(finalSlug);

    const accent = ACCENTS[idx % ACCENTS.length];

    // Prioridad: coincidencia exacta de nombre; si no, coincidencia sin
    // artículo inicial (p. ej. región "Dientes Rotos" ↔ "Los Dientes Rotos").
    const isRegionEntry = (p: (typeof WORLD_POIS)[number]) => p.type === "region" || p.type === "continente";
    const worldMatch =
      WORLD_POIS.find((p) => isRegionEntry(p) && p.name === name) ??
      WORLD_POIS.find((p) => isRegionEntry(p) && stripArticle(p.name) === stripArticle(name));
    const blurb = worldMatch?.blurb ?? "";

    const map = worldMatch ? { x: worldMatch.x, y: worldMatch.y } : fallbackMapPos(cont, idx, names.length);

    regions.push({ slug: finalSlug, name, capital: "—", accent, feature: "", blurb, image: "", map });

    pois[finalSlug] = WORLD_POIS.filter(
      (p) => p.continent === cont && p.region === name && p.type !== "continente" && p.type !== "region"
    ).map((p): Poi => ({ name: p.name, type: toPoiType(p.type), blurb: p.blurb, x: p.x, y: p.y }));
  });

  return { regions, pois };
}

// Construye el atlas completo (5 continentes, sin "Mares"). Si se pasa
// `taldoreiOverride` (los taldorei_defs guardados por el usuario) se usa tal
// cual para no perder ediciones ya hechas; si no, los defaults de
// data/taldorei.ts / data/pois.ts. Los demás CONTINENTES_PROPIOS (Wildemount)
// siempre parten de sus propios datos por defecto: solo Tal'Dorei tiene hoy
// un mecanismo de override desde el DM.
export function seedAtlas(taldoreiOverride?: { regions: Region[]; pois: Record<string, Poi[]> }): AtlasDefs {
  const atlas: AtlasDefs = {};
  for (const [nombre, build] of Object.entries(CONTINENTES_PROPIOS)) {
    atlas[nombre] = nombre === "Tal'Dorei" && taldoreiOverride ? taldoreiOverride : build();
  }

  const usedSlugs = new Set<string>(
    Object.values(atlas).flatMap((c) => c.regions.map((r) => r.slug))
  );

  for (const cont of GENERATED_CONTINENTS) {
    atlas[cont] = seedContinent(cont, usedSlugs);
  }

  return atlas;
}

// Correcciones puntuales sobre POIs que ya viajaron a un `atlas_defs`
// sembrado. `mergeAtlas` solo SUMA POIs nuevos: sin esto, mover Emon de
// región, renombrar el Lago Mooren o recolocar los POIs heredados de
// Wildemount no llegaría nunca a la mesa. Cada corrección se aplica SOLO si
// el POI sigue exactamente como estaba (mismo nombre, misma región, mismas
// x/y de plantilla). Si el DM ya lo movió o lo renombró, se salta y su
// edición manda. Idempotente: aplicada una vez, la segunda no encuentra nada
// que casar. `continente` filtra qué CONTINENTES_PROPIOS la aplica; `borrar`
// quita el POI sin reinsertarlo (el Valle del Tuétano deja de ser POI de
// Wildemount y pasa a ser región).
export type AtlasFix = {
  continente: string;    // nombre del continente (clave de CONTINENTES_PROPIOS)
  nombre: string;        // nombre tal y como está guardado
  deRegion: string;      // slug de región donde estaba
  desdeX: number;        // x de plantilla que tenía
  desdeY: number;        // y de plantilla que tenía
  aRegion?: string;      // slug de región nueva (si cambia)
  nombreNuevo?: string;  // nombre nuevo (si cambia)
  tipoNuevo?: PoiType;   // tipo nuevo (si cambia)
  x?: number;            // posición nueva
  y?: number;
  borrar?: boolean;      // el POI desaparece (sin reinsertar en ningún lado)
};

export const ATLAS_FIXES: AtlasFix[] = [
  // --- Tal'Dorei ---
  { continente: "Tal'Dorei", nombre: "Emon", deRegion: "costa-lucidiana", desdeX: 40, desdeY: 40, aRegion: "litoral-filofulgor", x: 50, y: 39 },
  { continente: "Tal'Dorei", nombre: "Zephrah", deRegion: "montanas-crestormentas", desdeX: 45, desdeY: 22, aRegion: "costa-lucidiana", x: 21, y: 55 },
  { continente: "Tal'Dorei", nombre: "Lyrengorn", deRegion: "montanas-crestormentas", desdeX: 50, desdeY: 30, aRegion: "montanas-torrerrisco", x: 63, y: 12 },
  { continente: "Tal'Dorei", nombre: "Abismo de Cerrofauces", deRegion: "peninsula-pleabruma", desdeX: 50, desdeY: 78, aRegion: "montanas-crestormentas", nombreNuevo: "Garganta Cenicienta", x: 55, y: 47 },
  { continente: "Tal'Dorei", nombre: "Lago Anclado", deRegion: "costa-lucidiana", desdeX: 48, desdeY: 74, nombreNuevo: "Lago Mooren", x: 60, y: 26 },
  { continente: "Tal'Dorei", nombre: "Rivera del río Anclado", deRegion: "sierras-alabastro", desdeX: 40, desdeY: 74, nombreNuevo: "Vega del Mooren", x: 53, y: 90 },
  { continente: "Tal'Dorei", nombre: "Fort Daxio", deRegion: "montanas-torrerrisco", desdeX: 30, desdeY: 30, nombreNuevo: "Fuerte Daxio", x: 25, y: 65 },
  { continente: "Tal'Dorei", nombre: "Bahía de las Dagas", deRegion: "litoral-filofulgor", desdeX: 45, desdeY: 40, tipoNuevo: "natural", x: 46, y: 63 },
  { continente: "Tal'Dorei", nombre: "Montañas Puntormenta", deRegion: "peninsula-pleabruma", desdeX: 62, desdeY: 30, tipoNuevo: "natural", x: 61, y: 8 },
  { continente: "Tal'Dorei", nombre: "Caverna del Axioma", deRegion: "montanas-crestormentas", desdeX: 70, desdeY: 40, tipoNuevo: "cueva", x: 34, y: 38 },
  { continente: "Tal'Dorei", nombre: "Cavernas Cienocristal", deRegion: "litoral-filofulgor", desdeX: 30, desdeY: 55, tipoNuevo: "cueva", x: 32, y: 27 },

  // --- Wildemount ---
  // Los 25 POIs que la Task A3 recolocó en data/wildemount.ts ya habían
  // viajado al atlas guardado con las coordenadas del mapa del MUNDO (las de
  // WORLD_POIS, sacadas de `git show master:data/world.ts`) porque
  // `seedContinent` los repartía desde ahí antes de que Wildemount tuviera
  // datos propios. `desdeX`/`desdeY` son esas coordenadas de mundo; `x`/`y`
  // son las de región que dejó data/wildemount.ts.
  { continente: "Wildemount", nombre: "Montañas Cyrios", deRegion: "imperio-dwendaliano", desdeX: 75, desdeY: 33, x: 8, y: 85 },
  { continente: "Wildemount", nombre: "Rexxentrum", deRegion: "imperio-dwendaliano", desdeX: 80, desdeY: 20, x: 80, y: 61 },
  { continente: "Wildemount", nombre: "Zadash", deRegion: "imperio-dwendaliano", desdeX: 79, desdeY: 25, aRegion: "valle-del-tuetano", x: 42, y: 48 },
  { continente: "Wildemount", nombre: "Trostenwald", deRegion: "imperio-dwendaliano", desdeX: 76, desdeY: 30, aRegion: "valle-del-tuetano", x: 45, y: 89 },
  { continente: "Wildemount", nombre: "Bladegarden", deRegion: "imperio-dwendaliano", desdeX: 82, desdeY: 30, aRegion: "valle-del-tuetano", x: 75, y: 23 },
  { continente: "Wildemount", nombre: "Hupperdook", deRegion: "imperio-dwendaliano", desdeX: 78, desdeY: 27, aRegion: "valle-del-tuetano", x: 57, y: 10 },
  { continente: "Wildemount", nombre: "Talonstadt", deRegion: "imperio-dwendaliano", desdeX: 84, desdeY: 31, aRegion: "valle-del-tuetano", x: 73, y: 47 },
  { continente: "Wildemount", nombre: "Valle del Tuétano", deRegion: "imperio-dwendaliano", desdeX: 81, desdeY: 29, borrar: true },
  { continente: "Wildemount", nombre: "Uthodurn", deRegion: "yermos-grisaceos", desdeX: 83, desdeY: 11, x: 60, y: 46 },
  { continente: "Wildemount", nombre: "Shadycreek Run", deRegion: "yermos-grisaceos", desdeX: 80, desdeY: 12, x: 34, y: 96 },
  { continente: "Wildemount", nombre: "Aldea Palebank", deRegion: "yermos-grisaceos", desdeX: 88, desdeY: 9, aRegion: "eiselcross", x: 97, y: 82 },
  { continente: "Wildemount", nombre: "Rosohna", deRegion: "xhorhas", desdeX: 90, desdeY: 20, x: 81, y: 41 },
  { continente: "Wildemount", nombre: "Bazzoxan", deRegion: "xhorhas", desdeX: 91, desdeY: 13, x: 75, y: 28 },
  { continente: "Wildemount", nombre: "Asarius", deRegion: "xhorhas", desdeX: 86, desdeY: 17, x: 36, y: 37 },
  { continente: "Wildemount", nombre: "Cordillera Penumbra", deRegion: "xhorhas", desdeX: 90, desdeY: 13, x: 91, y: 48 },
  { continente: "Wildemount", nombre: "Urzin", deRegion: "xhorhas", desdeX: 93, desdeY: 24, x: 34, y: 12 },
  { continente: "Wildemount", nombre: "Jigow", deRegion: "xhorhas", desdeX: 95, desdeY: 28, x: 58, y: 13 },
  { continente: "Wildemount", nombre: "Puerto Damali", deRegion: "costa-del-serrallo", desdeX: 76, desdeY: 45, x: 35, y: 6 },
  { continente: "Wildemount", nombre: "Nicodranas", deRegion: "costa-del-serrallo", desdeX: 72, desdeY: 42, x: 80, y: 48 },
  { continente: "Wildemount", nombre: "Gwardan", deRegion: "costa-del-serrallo", desdeX: 70, desdeY: 37, aRegion: "costa-del-serrallo-norte", x: 55, y: 62 },
  { continente: "Wildemount", nombre: "Feolinn", deRegion: "costa-del-serrallo", desdeX: 78, desdeY: 48, x: 59, y: 23 },
  { continente: "Wildemount", nombre: "Othe", deRegion: "costa-del-serrallo", desdeX: 74, desdeY: 47, aRegion: "costa-del-serrallo-norte", x: 97, y: 94 },
  { continente: "Wildemount", nombre: "Puerto Zoon", deRegion: "costa-del-serrallo", desdeX: 77, desdeY: 47, x: 63, y: 41 },
  { continente: "Wildemount", nombre: "Tussoa", deRegion: "costa-del-serrallo", desdeX: 71, desdeY: 49, aRegion: "costa-del-serrallo-norte", x: 71, y: 89 },
  { continente: "Wildemount", nombre: "Vesrah", deRegion: "costa-del-serrallo", desdeX: 69, desdeY: 46, x: 92, y: 70 },
];

// --- FUSIÓN CON LO YA GUARDADO ---------------------------------------------
// `seedAtlas` solo corre la PRIMERA vez (ver lib/useAtlas.ts): en cuanto existe
// `atlas_defs` en app_config, ampliar data/world.ts no llegaba nunca a la mesa.
// `mergeAtlas` arregla eso SUMANDO lo que falta y sin tocar nada de lo que el DM
// ya tiene: regiones nuevas por nombre y POIs nuevos por nombre. No renombra, no
// reposiciona y no borra — si el DM movió un pin o le cambió el blurb, se queda
// como está. Un POI que ya exista en CUALQUIER región del continente cuenta como
// presente (si el DM lo movió de región, no se duplica).
export function mergeAtlas(stored: AtlasDefs): { atlas: AtlasDefs; changed: boolean } {
  const atlas: AtlasDefs = { ...stored };
  let changed = false;

  const usedSlugs = new Set<string>(
    Object.values(stored).flatMap((c) => (c?.regions ?? []).map((r) => r.slug))
  );

  // POIs por defecto de Tal'Dorei: van keyed por slug de región, no por nombre.
  const addPois = (cont: ContinentAtlas, slug: string, incoming: Poi[]) => {
    const known = new Set(Object.values(cont.pois).flat().map((p) => p.name));
    const nuevos = incoming.filter((p) => !known.has(p.name));
    if (!nuevos.length) return;
    cont.pois = { ...cont.pois, [slug]: [...(cont.pois[slug] ?? []), ...nuevos] };
    changed = true;
  };

  const propiosNames = Object.keys(CONTINENTES_PROPIOS);

  for (const contName of [...GENERATED_CONTINENTS, ...propiosNames]) {
    const prev = stored[contName];
    const esPropio = propiosNames.includes(contName);
    // Continente que no estaba guardado (p. ej. atlas viejo): se siembra entero.
    if (!prev) {
      atlas[contName] = esPropio
        ? CONTINENTES_PROPIOS[contName]()
        : seedContinent(contName, usedSlugs);
      changed = true;
      continue;
    }

    const cont: ContinentAtlas = { regions: [...prev.regions], pois: { ...prev.pois } };
    atlas[contName] = cont;

    if (esPropio) {
      const { regions: defRegions, pois: defPois } = CONTINENTES_PROPIOS[contName]();
      for (const r of defRegions) {
        if (!cont.regions.some((x) => x.slug === r.slug || x.name === r.name)) {
          cont.regions.push(r);
          usedSlugs.add(r.slug);
          changed = true;
        }
        const slug = cont.regions.find((x) => x.name === r.name)?.slug ?? r.slug;
        addPois(cont, slug, defPois[r.slug] ?? []);
      }

      // ATLAS_FIXES filtra por continente: cada CONTINENTES_PROPIOS aplica
      // solo las suyas. Un continente sin correcciones (ninguna entrada con
      // su `continente`) simplemente no entra nunca al `if (idx === -1)`.
      for (const fix of ATLAS_FIXES) {
        if (fix.continente !== contName) continue;
        const origen = cont.pois[fix.deRegion];
        if (!origen) continue;
        const idx = origen.findIndex(
          (p) => p.name === fix.nombre && p.x === fix.desdeX && p.y === fix.desdeY
        );
        if (idx === -1) continue; // el DM lo tocó, o ya se corrigió: no se pisa

        // `origen` viene de un `{...prev.pois}`: el objeto está copiado, los
        // arrays NO. Copiar antes de tocar, o se muta el `stored` del llamante.
        const origenCopia = [...origen];
        const [poi] = origenCopia.splice(idx, 1);

        if (fix.borrar) {
          cont.pois = { ...cont.pois, [fix.deRegion]: origenCopia };
          changed = true;
          continue;
        }

        const corregido: Poi = {
          ...poi,
          name: fix.nombreNuevo ?? poi.name,
          type: fix.tipoNuevo ?? poi.type,
          x: fix.x ?? poi.x,
          y: fix.y ?? poi.y,
        };
        const destino = fix.aRegion ?? fix.deRegion;
        // Si la corrección NO cambia de región, la lista de destino tiene que
        // partir de `origenCopia` (ya sin el POI viejo). Partir de
        // `cont.pois[destino]` dejaría el original dentro: en un renombre, el
        // filtro por nombre no lo alcanza —el nombre ya es otro— y el DM
        // acabaría con dos pines, uno con el nombre retirado.
        const base = destino === fix.deRegion ? origenCopia : (cont.pois[destino] ?? []);
        cont.pois = {
          ...cont.pois,
          [fix.deRegion]: origenCopia,
          [destino]: [...base.filter((p) => p.name !== corregido.name), corregido],
        };
        changed = true;
      }
      continue;
    }

    const semilla = seedContinent(contName, new Set(usedSlugs));
    for (const región of semilla.regions) {
      const existente = cont.regions.find((x) => x.name === región.name);
      if (existente) {
        addPois(cont, existente.slug, semilla.pois[región.slug] ?? []);
        continue;
      }
      // Región nueva: slug único frente a TODO lo que ya hay guardado.
      const slug = uniqueRegionSlug(región.name, contName, usedSlugs);
      usedSlugs.add(slug);
      cont.regions.push({ ...región, slug });
      cont.pois = { ...cont.pois, [slug]: semilla.pois[región.slug] ?? [] };
      changed = true;
    }
  }

  return { atlas, changed };
}
