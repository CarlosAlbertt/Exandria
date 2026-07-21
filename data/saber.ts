// Saber por origen: qué sabe cada personaje y qué le queda por descubrir.
//
// PRINCIPIO: la lore base NO se escribe otra vez a mano. Se DERIVA de los datos
// que ya existen — pantheon.ts (33 deidades), taldorei.ts (REGIONS) y world.ts
// (continentes). Solo la capa curada (erudito por pericia + secretos del DM)
// vive escrita a mano, en loreTiers.ts.
//
// Cada personaje arranca sabiendo: lo básico de los continentes (poco), su
// continente a fondo, su subregión y su deidad. El resto se descubre jugando.

import { PRIME_DEITIES, BETRAYER_GODS, LESSER_IDOLS, type Deity, type DeitySide } from "@/data/pantheon";
import { REGIONS, FACTIONS, HISTORY } from "@/data/taldorei";
import { HISTORY_TIMELINE } from "@/data/history";
import { WORLD_POIS } from "@/data/world";
import { PLANES, MOONS } from "@/data/cosmology";
import { WILDEMOUNT_REGIONS, WILDEMOUNT_FACTIONS, LANGUAGES, DAILY_LIFE } from "@/data/wildemount";
import { LORE_TIERS, type LoreSkill } from "@/data/loreTiers";
import { CONTINENT_LORE, type ContinentLoreEntry } from "@/data/continentes";

export type SaberScope =
  | { kind: "continente"; continent: string }
  | { kind: "region"; regionSlug: string }
  // Las deidades llevan su bando: tu deidad siempre la conoces; del resto solo
  // saben las clases de fe (y los traidores/ídolos, solo las más versadas).
  | { kind: "deidad"; deitySlug: string; side: DeitySide }
  | { kind: "erudito"; skill: LoreSkill }
  | { kind: "secreto" }
  // Solo por descubrimiento: facciones, sociedades, saber de otras tierras.
  // No se deduce de quién eres; hay que ganárselo jugando.
  | { kind: "oculto" };

export const PLACES = ["Exandria", "Tal'Dorei", "Marquet", "Issylra", "Wildemount", "Dientes Rotos"] as const;
export type SaberPlace = (typeof PLACES)[number];

export const CATEGORIES = ["Geografía", "Historia", "Fe", "Potencias", "Vida y lenguas", "Cosmos", "Secretos"] as const;
export type SaberCategory = (typeof CATEGORIES)[number];

// Color por LUGAR (no por categoría): de un vistazo sabes de qué tierra hablas.
// Mismas variables que WORLD_COLOR; los acentos son datos en este proyecto
// (precedente: Region.accent en data/taldorei.ts).
export const PLACE_ACCENT: Record<SaberPlace, string> = {
  "Exandria": "var(--color-gold)",
  "Tal'Dorei": "var(--color-bronze-bright)",
  "Marquet": "var(--color-ember)",
  "Issylra": "var(--color-arcane)",
  "Wildemount": "var(--color-violet)",
  "Dientes Rotos": "var(--color-primitivo)",
};

export const PLACE_ICON: Record<SaberPlace, string> = {
  "Exandria": "fa-globe",
  "Tal'Dorei": "fa-tree",
  "Marquet": "fa-sun",
  "Issylra": "fa-snowflake",
  "Wildemount": "fa-mountain",
  "Dientes Rotos": "fa-water",
};

export type SaberEntry = {
  id: string;
  scope: SaberScope;
  // basico = lo sabe cualquiera; profundo = solo quien tiene el vínculo.
  depth: "basico" | "profundo";
  topic: string;
  title: string;
  text: string;
  poi?: string; // lugar ligado (para la tirada de saber in situ)
  /** tierra a la que pertenece; "Exandria" = lo que no es de ningún continente */
  place: SaberPlace;
  /** eje transversal al ámbito, para agrupar dentro de cada lugar */
  category: SaberCategory;
};

// Primera frase de un texto (para la versión "un poco" de los continentes).
function firstSentence(text: string): string {
  const m = text.match(/^[^.]+\./);
  return m ? m[0] : text;
}

export const ALL_DEITIES: Deity[] = [...PRIME_DEITIES, ...BETRAYER_GODS, ...LESSER_IDOLS];

function deityText(d: Deity): string {
  const partes = [
    `${d.name}, ${d.epithet}. Esfera: ${d.province}.`,
    d.blurb,
    `Símbolo sagrado: ${d.symbol}.`,
    d.commandments.length ? `Preceptos: ${d.commandments.join(" ")}` : "",
    d.holyDay ? `Día santo: ${d.holyDay.name} (${d.holyDay.date}).` : "",
  ];
  return partes.filter(Boolean).join("\n\n");
}

// --- CONTINENTES: básico para todos, profundo para quien es de allí ---------
function continentEntries(): Omit<SaberEntry, "place" | "category">[] {
  const out: Omit<SaberEntry, "place" | "category">[] = [];
  for (const p of WORLD_POIS.filter((w) => w.type === "continente")) {
    out.push({
      id: `cont:${p.continent}:basico`,
      scope: { kind: "continente", continent: p.continent },
      depth: "basico",
      topic: "Continentes",
      title: p.name,
      text: firstSentence(p.blurb),
    });
    out.push({
      id: `cont:${p.continent}:profundo`,
      scope: { kind: "continente", continent: p.continent },
      depth: "profundo",
      topic: "Tu continente",
      title: `${p.name} — a fondo`,
      text: p.blurb,
    });
  }
  return out;
}

// --- SUBREGIONES DE TAL'DOREI: solo la tuya (o descubierta) -----------------
function regionEntries(): Omit<SaberEntry, "place" | "category">[] {
  return REGIONS.map((r) => ({
    id: `reg:${r.slug}`,
    scope: { kind: "region" as const, regionSlug: r.slug },
    depth: "profundo" as const,
    topic: "Tu tierra",
    title: r.name,
    text: [
      r.blurb,
      r.capital && r.capital !== "—" ? `Plaza principal: ${r.capital}.` : "",
      r.feature ? `Se la conoce por: ${r.feature.toLowerCase()}.` : "",
    ].filter(Boolean).join(" "),
  }));
}

// --- DEIDADES: solo la tuya (o descubierta) ---------------------------------
function deityEntries(): Omit<SaberEntry, "place" | "category">[] {
  return ALL_DEITIES.map((d) => ({
    id: `dei:${d.slug}`,
    scope: { kind: "deidad" as const, deitySlug: d.slug, side: d.side },
    depth: "profundo" as const,
    topic: d.side === "prime" ? "Panteón" : d.side === "betrayer" ? "Dioses Traidores" : "Ídolos Menores",
    title: d.name,
    text: deityText(d),
  }));
}

// --- FACCIONES Y SOCIEDADES: no se saben de nacimiento, se descubren --------
function factionEntries(): Omit<SaberEntry, "place" | "category">[] {
  return FACTIONS.map((f) => ({
    id: `fac:${slugKey(f.name)}`,
    scope: { kind: "oculto" as const },
    depth: "profundo" as const,
    topic: "Facciones de Tal'Dorei",
    title: f.name,
    text: f.blurb,
  }));
}

// --- WILDEMOUNT: sus regiones las conoce quien es de allí; el resto, no -----
function wildemountEntries(): Omit<SaberEntry, "place" | "category">[] {
  const out: Omit<SaberEntry, "place" | "category">[] = [];
  for (const r of WILDEMOUNT_REGIONS) {
    out.push({
      id: `wmreg:${r.slug}`,
      scope: { kind: "continente", continent: "Wildemount" },
      depth: "profundo",
      topic: "Wildemount",
      title: r.name,
      text: [r.blurb, r.capital && r.capital !== "—" ? `Plaza principal: ${r.capital}.` : "", r.feature ? `Se la conoce por: ${r.feature.toLowerCase()}.` : ""].filter(Boolean).join(" "),
    });
  }
  for (const f of WILDEMOUNT_FACTIONS) {
    out.push({ id: `wmfac:${slugKey(f.name)}`, scope: { kind: "oculto" }, depth: "profundo", topic: "Potencias de Wildemount", title: f.name, text: f.blurb });
  }
  for (const l of LANGUAGES) {
    out.push({ id: `lang:${slugKey(l.name)}`, scope: { kind: "oculto" }, depth: "profundo", topic: "Lenguas", title: l.name, text: l.blurb });
  }
  for (const d of DAILY_LIFE) {
    out.push({ id: `vida:${slugKey(d.title)}`, scope: { kind: "oculto" }, depth: "profundo", topic: "Vida cotidiana", title: d.title, text: d.body });
  }
  return out;
}

// --- MARQUET, ISSYLRA Y LOS DIENTES ROTOS ----------------------------------
// Igual que Wildemount: lo de tu continente lo sabes por ser de allí, lo
// erudito por pericia, y las potencias/sociedades hay que descubrirlas.
function scopeOfContinentLore(e: ContinentLoreEntry): SaberScope {
  switch (e.tier) {
    case "continente": return { kind: "continente", continent: e.continent };
    case "erudito": return { kind: "erudito", skill: e.skill ?? "Historia" };
    case "secreto": return { kind: "secreto" };
    case "oculto": return { kind: "oculto" };
  }
}

function continentLoreEntries(): Omit<SaberEntry, "place" | "category">[] {
  return CONTINENT_LORE.map((e) => ({
    id: `cl:${slugKey(e.continent)}:${e.id}`,
    scope: scopeOfContinentLore(e),
    depth: "profundo" as const,
    topic: e.topic,
    title: e.title,
    text: e.text,
    poi: e.poi,
  }));
}

// --- HISTORIA DETALLADA: la breve la sabe todo el mundo; el detalle, no -----
function historyEntries(): Omit<SaberEntry, "place" | "category">[] {
  const out: Omit<SaberEntry, "place" | "category">[] = [];
  for (const e of HISTORY) {
    out.push({ id: `hist:${slugKey(e.year + e.title)}`, scope: { kind: "erudito", skill: "Historia" }, depth: "profundo", topic: `Historia · ${e.year}`, title: e.title, text: e.text });
  }
  for (const e of HISTORY_TIMELINE) {
    out.push({ id: `crono:${slugKey(e.year + e.title)}`, scope: { kind: "erudito", skill: "Historia" }, depth: "profundo", topic: `Cronología · ${e.year}`, title: e.title, text: e.text });
  }
  return out;
}

// --- LUNAS: que hay dos se ve desde cualquier parte (entrada común de
// loreTiers); lo que se sabe DE ellas ya no, se descubre. -------------------
function moonEntries(): Omit<SaberEntry, "place" | "category">[] {
  return MOONS.map((m) => ({
    id: `luna:${slugKey(m.name)}`,
    scope: { kind: "oculto" as const },
    depth: "profundo" as const,
    topic: "Las lunas",
    title: m.name,
    text: m.blurb,
  }));
}

// --- PLANOS: cosa de arcanistas --------------------------------------------
function planeEntries(): Omit<SaberEntry, "place" | "category">[] {
  return PLANES.map((p) => ({
    id: `plano:${slugKey(p.name)}`,
    scope: { kind: "erudito" as const, skill: "Arcanos" as const },
    depth: "profundo" as const,
    topic: "Planos de existencia",
    title: p.name,
    text: p.blurb,
  }));
}

// Clave estable a partir de un nombre (sin acentos ni signos).
function slugKey(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(new RegExp("[̀-ͯ]", "g"), "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// --- CAPA CURADA: erudito (por pericia) y secreto (lo revela el DM) ---------
function curatedEntries(): Omit<SaberEntry, "place" | "category">[] {
  const out: Omit<SaberEntry, "place" | "category">[] = [];
  for (const e of LORE_TIERS) {
    if (e.tier === "erudito" && e.unlockSkill) {
      out.push({ id: e.id, scope: { kind: "erudito", skill: e.unlockSkill }, depth: "profundo", topic: e.topic, title: e.title, text: e.text });
    } else if (e.tier === "secreto") {
      out.push({ id: e.id, scope: { kind: "secreto" }, depth: "profundo", topic: e.topic, title: e.title, text: e.text });
    } else {
      // Las "comun" del dataset viejo pasan a saber básico de continente-mundo.
      out.push({ id: e.id, scope: { kind: "continente", continent: "Tal'Dorei" }, depth: "basico", topic: e.topic, title: e.title, text: e.text });
    }
  }
  return out;
}

// El lugar sale del ORIGEN de la entrada (su prefijo de id o su ámbito). Lo que
// no es de ningún continente —panteón, eras, lunas, planos— cae en "Exandria",
// que hace de cajón del mundo.
function placeOf(e: Omit<SaberEntry, "place" | "category">): SaberPlace {
  if (e.scope.kind === "continente" && (PLACES as readonly string[]).includes(e.scope.continent)) {
    return e.scope.continent as SaberPlace;
  }
  if (e.id.startsWith("reg:") || e.id.startsWith("fac:")) return "Tal'Dorei";
  if (e.id.startsWith("wm") || e.id.startsWith("lang:") || e.id.startsWith("vida:")) return "Wildemount";
  if (e.id.startsWith("cl:")) {
    const found = PLACES.find((p) => e.id.startsWith(`cl:${slugKey(p)}:`));
    if (found) return found;
  }
  return "Exandria";
}

// La categoría cruza el ámbito: un secreto de Marquet es "Secretos" de Marquet.
function categoryOf(e: Omit<SaberEntry, "place" | "category">): SaberCategory {
  if (e.scope.kind === "secreto") return "Secretos";
  if (e.scope.kind === "deidad") return "Fe";
  if (e.id.startsWith("lang:") || e.id.startsWith("vida:")) return "Vida y lenguas";
  if (e.id.startsWith("luna:") || e.id.startsWith("plano:")) return "Cosmos";
  if (e.id.startsWith("hist:") || e.id.startsWith("crono:")) return "Historia";
  if (e.scope.kind === "erudito") {
    if (e.scope.skill === "Historia") return "Historia";
    if (e.scope.skill === "Religión") return "Fe";
    if (e.scope.skill === "Arcanos") return "Cosmos";
    return "Geografía"; // Naturaleza
  }
  if (e.scope.kind === "oculto") {
    return e.topic.startsWith("Lenguas") || e.topic.startsWith("Vida") ? "Vida y lenguas" : "Potencias";
  }
  return "Geografía";
}

function tag(entries: Omit<SaberEntry, "place" | "category">[]): SaberEntry[] {
  return entries.map((e) => ({ ...e, place: placeOf(e), category: categoryOf(e) }));
}

export const SABER: SaberEntry[] = tag([
  ...continentEntries(),
  ...regionEntries(),
  ...deityEntries(),
  ...factionEntries(),
  ...wildemountEntries(),
  ...continentLoreEntries(),
  ...historyEntries(),
  ...moonEntries(),
  ...planeEntries(),
  ...curatedEntries(),
]);

export function saberById(id: string): SaberEntry | undefined {
  return SABER.find((e) => e.id === id);
}

// Etiqueta legible del grupo al que pertenece una entrada (para la UI).
export function scopeLabel(scope: SaberScope): string {
  switch (scope.kind) {
    case "continente": return "Continentes";
    case "region": return "Regiones";
    case "deidad": return scope.side === "prime" ? "Panteón" : scope.side === "betrayer" ? "Dioses Traidores" : "Ídolos Menores";
    case "erudito": return `Erudito · ${scope.skill}`;
    case "secreto": return "Secretos";
    case "oculto": return "Por descubrir";
  }
}
