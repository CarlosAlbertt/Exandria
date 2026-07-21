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

export type SaberEntry = {
  id: string;
  scope: SaberScope;
  // basico = lo sabe cualquiera; profundo = solo quien tiene el vínculo.
  depth: "basico" | "profundo";
  topic: string;
  title: string;
  text: string;
  poi?: string; // lugar ligado (para la tirada de saber in situ)
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
function continentEntries(): SaberEntry[] {
  const out: SaberEntry[] = [];
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
function regionEntries(): SaberEntry[] {
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
function deityEntries(): SaberEntry[] {
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
function factionEntries(): SaberEntry[] {
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
function wildemountEntries(): SaberEntry[] {
  const out: SaberEntry[] = [];
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

function continentLoreEntries(): SaberEntry[] {
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
function historyEntries(): SaberEntry[] {
  const out: SaberEntry[] = [];
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
function moonEntries(): SaberEntry[] {
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
function planeEntries(): SaberEntry[] {
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
function curatedEntries(): SaberEntry[] {
  const out: SaberEntry[] = [];
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

export const SABER: SaberEntry[] = [
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
];

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
