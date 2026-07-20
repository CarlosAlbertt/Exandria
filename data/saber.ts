// Saber por origen: qué sabe cada personaje y qué le queda por descubrir.
//
// PRINCIPIO: la lore base NO se escribe otra vez a mano. Se DERIVA de los datos
// que ya existen — pantheon.ts (33 deidades), taldorei.ts (REGIONS) y world.ts
// (continentes). Solo la capa curada (erudito por pericia + secretos del DM)
// vive escrita a mano, en loreTiers.ts.
//
// Cada personaje arranca sabiendo: lo básico de los continentes (poco), su
// continente a fondo, su subregión y su deidad. El resto se descubre jugando.

import { PRIME_DEITIES, BETRAYER_GODS, LESSER_IDOLS, type Deity } from "@/data/pantheon";
import { REGIONS } from "@/data/taldorei";
import { WORLD_POIS } from "@/data/world";
import { LORE_TIERS, type LoreSkill } from "@/data/loreTiers";

export type SaberScope =
  | { kind: "continente"; continent: string }
  | { kind: "region"; regionSlug: string }
  | { kind: "deidad"; deitySlug: string }
  | { kind: "erudito"; skill: LoreSkill }
  | { kind: "secreto" };

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
    scope: { kind: "deidad" as const, deitySlug: d.slug },
    depth: "profundo" as const,
    topic: "Tu fe",
    title: d.name,
    text: deityText(d),
  }));
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
    case "deidad": return "Panteón";
    case "erudito": return `Erudito · ${scope.skill}`;
    case "secreto": return "Secretos";
  }
}
