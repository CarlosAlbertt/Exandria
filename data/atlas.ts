// Atlas por continente: generaliza el modelo de Tal'Dorei (region/POI) a los
// cinco continentes habitados de Exandria (todos menos "Mares", que se queda
// como pines planos/etiquetas). `seedAtlas` construye los datos por defecto a
// partir de `data/world.ts` (WORLD_POIS) la primera vez que se necesitan;
// después el DM los edita y persiste en `app_config` (ver lib/useAtlas.ts).

import { REGIONS, type Region } from "@/data/taldorei";
import { POIS, type Poi, type PoiType } from "@/data/pois";
import { REGIONS_BY_CONTINENT, CONTINENT_VIEW, WORLD_POIS, type WorldType } from "@/data/world";
import { slugify } from "@/lib/slug";

export type ContinentAtlas = { regions: Region[]; pois: Record<string, Poi[]> }; // pois keyed por region.slug
export type AtlasDefs = Record<string, ContinentAtlas>; // key = nombre de continente

// Continentes generados a partir de REGIONS_BY_CONTINENT (Tal'Dorei se siembra
// aparte, con sus datos propios). "Mares" queda fuera del atlas.
const GENERATED_CONTINENTS = ["Issylra", "Wildemount", "Marquet", "Dientes Rotos"] as const;

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

// Mapa explícito nombre de región → archivo real en public/maps/wildemount/
// (los nombres de archivo están en inglés; hay 8 archivos pero solo 4
// regiones de Wildemount en REGIONS_BY_CONTINENT, así que la mitad de los
// archivos quedan sin usar de momento — eiselcross, blightshore,
// menagerie_coast_north y marrow_valley o zemni_fields, el que no se elija).
const WILDEMOUNT_IMAGES: Record<string, string> = {
  "Imperio Dwendaliano": "/maps/wildemount/zemni_fields.jpg", // Rexxentrum está en los Zemni Fields
  "Xhorhas": "/maps/wildemount/xhorhas.jpg", // coincidencia directa de nombre
  "Costa del Serrallo": "/maps/wildemount/menagerie_coast_south.jpg", // litoral sur de la Costa del Serrallo
  "Yermos Grisáceos": "/maps/wildemount/greying_wildlands.jpg", // traducción directa
};

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
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
    let slug = slugify(name);
    if (usedSlugs.has(slug)) {
      slug = `${cont[0].toLowerCase()}-${slug}`;
    }
    // Por si el prefijo también colisionara (no ocurre con los datos
    // actuales, pero mantiene la unicidad garantizada ante nuevos datos).
    let finalSlug = slug;
    let suffix = 2;
    while (usedSlugs.has(finalSlug)) {
      finalSlug = `${slug}-${suffix}`;
      suffix++;
    }
    usedSlugs.add(finalSlug);

    const accent = ACCENTS[idx % ACCENTS.length];

    // Prioridad: coincidencia exacta de nombre; si no, coincidencia sin
    // artículo inicial (p. ej. región "Dientes Rotos" ↔ "Los Dientes Rotos").
    const isRegionEntry = (p: (typeof WORLD_POIS)[number]) => p.type === "region" || p.type === "continente";
    const worldMatch =
      WORLD_POIS.find((p) => isRegionEntry(p) && p.name === name) ??
      WORLD_POIS.find((p) => isRegionEntry(p) && stripArticle(p.name) === stripArticle(name));
    const blurb = worldMatch?.blurb ?? "";

    const image = cont === "Wildemount" ? (WILDEMOUNT_IMAGES[name] ?? "") : "";

    const map = worldMatch ? { x: worldMatch.x, y: worldMatch.y } : fallbackMapPos(cont, idx, names.length);

    regions.push({ slug: finalSlug, name, capital: "—", accent, feature: "", blurb, image, map });

    pois[finalSlug] = WORLD_POIS.filter(
      (p) => p.continent === cont && p.region === name && p.type !== "continente" && p.type !== "region"
    ).map((p): Poi => ({ name: p.name, type: toPoiType(p.type), blurb: p.blurb, x: p.x, y: p.y }));
  });

  return { regions, pois };
}

// Construye el atlas completo (5 continentes, sin "Mares"). Si se pasa
// `taldoreiOverride` (los taldorei_defs guardados por el usuario) se usa tal
// cual para no perder ediciones ya hechas; si no, los defaults de
// data/taldorei.ts / data/pois.ts.
export function seedAtlas(taldoreiOverride?: { regions: Region[]; pois: Record<string, Poi[]> }): AtlasDefs {
  const taldoreiRegions = taldoreiOverride?.regions ?? REGIONS;
  const taldoreiPois = taldoreiOverride?.pois ?? POIS;

  const usedSlugs = new Set<string>(taldoreiRegions.map((r) => r.slug));

  const atlas: AtlasDefs = {
    "Tal'Dorei": { regions: taldoreiRegions, pois: taldoreiPois },
  };

  for (const cont of GENERATED_CONTINENTS) {
    atlas[cont] = seedContinent(cont, usedSlugs);
  }

  return atlas;
}
