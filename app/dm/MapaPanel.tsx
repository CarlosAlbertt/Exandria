"use client";

import { useState } from "react";
import { MAPS, REGION_RATIO, type Region } from "@/data/taldorei";
import { POI_ICON, POI_COLOR, type Poi, type PoiType } from "@/data/pois";
import { CONTINENTS } from "@/data/world";
import { useAtlas, regionsOf, poisOf } from "@/lib/useAtlas";
import type { AtlasDefs } from "@/data/atlas";
import { useRegions, setRegionPin } from "@/lib/useRegions";
import { usePois, setPoiPos, setPoiRevealed } from "@/lib/usePois";
import { slugify } from "@/lib/slug";
import PinDragMap, { type DragMarker } from "@/components/PinDragMap";

// Continentes con regiones editables (todos menos "Mares", que no tiene).
const LAND_CONTINENTS = CONTINENTS.filter((c) => c !== "Mares");

const POI_TYPES = Object.keys(POI_ICON) as PoiType[];
const ACCENTS = ["--color-bronze", "--color-arcane", "--color-divino", "--color-marcial", "--color-violet", "--color-primitivo", "--color-ember", "--color-arcane-deep"];

type RForm = { name: string; capital: string; feature: string; accent: string; blurb: string };
const EMPTY_R: RForm = { name: "", capital: "", feature: "", accent: "var(--color-bronze)", blurb: "" };
type PForm = { name: string; type: PoiType; blurb: string };
const EMPTY_P: PForm = { name: "", type: "ciudad", blurb: "" };

const inputCls = "w-full bg-[var(--color-night)] rounded-lg px-3 py-1.5 font-body text-[14px] outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)]";

// Slugs de región únicos GLOBALMENTE (poi_state/region_state van por slug, y el
// atlas los comparte entre continentes). Si el slug natural ya existe en
// cualquier continente, se prefija con la inicial del continente (igual que en
// seedAtlas); si aun así choca, se numera.
function allRegionSlugs(atlas: AtlasDefs): Set<string> {
  const s = new Set<string>();
  for (const cont of Object.keys(atlas)) for (const r of atlas[cont]?.regions ?? []) s.add(r.slug);
  return s;
}
function uniqueRegionSlug(name: string, continent: string, atlas: AtlasDefs): string {
  const used = allRegionSlugs(atlas);
  const base = slugify(name);
  const candidate = used.has(base) ? `${continent[0].toLowerCase()}-${base}` : base;
  let final = candidate;
  let i = 2;
  while (used.has(final)) { final = `${candidate}-${i}`; i++; }
  return final;
}

export default function MapaPanel() {
  const [continent, setContinent] = useState<string>(LAND_CONTINENTS[0]);
  const [sub, setSub] = useState<"regiones" | "pois">("regiones");
  const [regionSlug, setRegionSlug] = useState<string>("");
  const [rEditing, setREditing] = useState<Region | "new" | null>(null);
  const [rForm, setRForm] = useState<RForm>(EMPTY_R);
  const [pEditing, setPEditing] = useState<Poi | "new" | null>(null);
  const [pForm, setPForm] = useState<PForm>(EMPTY_P);
  const [activeId, setActiveId] = useState<string | null>(null); // pin resaltado
  const spread = () => ({ x: 44 + Math.random() * 12, y: 44 + Math.random() * 12 });

  const { atlas, save } = useAtlas();
  const { states: regionStates } = useRegions();
  const { states: poiStates, keyOf } = usePois();

  const regions = regionsOf(atlas, continent);
  const region = regions.find((r) => r.slug === regionSlug) ?? regions[0];
  const contData = atlas[continent] ?? { regions: [], pois: {} };
  const pois: Poi[] = region ? poisOf(atlas, continent, region.slug) : [];

  const selectContinent = (c: string) => {
    setContinent(c);
    setActiveId(null);
    setREditing(null);
    setPEditing(null);
    const rs = regionsOf(atlas, c);
    setRegionSlug(rs[0]?.slug ?? "");
  };

  // --- Regiones del continente elegido ---
  const regionMarkers: DragMarker[] = regions.map((r) => {
    const st = regionStates[r.slug];
    return { id: r.slug, x: st?.pin_x ?? r.map.x, y: st?.pin_y ?? r.map.y, label: r.name, color: r.accent };
  });
  const poiMarkers: DragMarker[] = region ? pois.map((p) => {
    const st = poiStates[keyOf(region.slug, p.name)];
    return { id: p.name, x: st?.x ?? p.x, y: st?.y ?? p.y, label: p.name, color: POI_COLOR[p.type], icon: POI_ICON[p.type] };
  }) : [];

  // Region CRUD (persiste en atlas[continent])
  const openNewRegion = () => { setRForm(EMPTY_R); setREditing("new"); };
  const openEditRegion = (r: Region) => { setRForm({ name: r.name, capital: r.capital, feature: r.feature, accent: r.accent, blurb: r.blurb }); setREditing(r); };
  const saveRegion = () => {
    if (!rForm.name.trim()) return;
    const base = { name: rForm.name.trim(), capital: rForm.capital.trim() || "—", feature: rForm.feature.trim(), accent: rForm.accent, blurb: rForm.blurb.trim() };
    if (rEditing === "new") {
      const slug = uniqueRegionSlug(rForm.name, continent, atlas);
      const newRegions = [...contData.regions, { slug, image: "", map: spread(), ...base }];
      save({ ...atlas, [continent]: { regions: newRegions, pois: { ...contData.pois, [slug]: [] } } });
      setRegionSlug(slug);
    } else if (rEditing) {
      const newRegions = contData.regions.map((r) => (r.slug === rEditing.slug ? { ...r, ...base } : r));
      save({ ...atlas, [continent]: { regions: newRegions, pois: contData.pois } });
    }
    setREditing(null);
  };
  const deleteRegion = (slug: string) => {
    const newRegions = contData.regions.filter((r) => r.slug !== slug);
    const p = { ...contData.pois }; delete p[slug];
    save({ ...atlas, [continent]: { regions: newRegions, pois: p } });
    if (regionSlug === slug) setRegionSlug(newRegions[0]?.slug ?? "");
  };

  // POI CRUD (para la región activa, persiste en atlas[continent].pois)
  const openNewPoi = () => { setPForm(EMPTY_P); setPEditing("new"); };
  const openEditPoi = (p: Poi) => { setPForm({ name: p.name, type: p.type, blurb: p.blurb }); setPEditing(p); };
  const savePoi = () => {
    if (!region || !pForm.name.trim()) return;
    const cur = contData.pois[region.slug] ?? [];
    let arr: Poi[];
    if (pEditing === "new") {
      arr = [...cur, { name: pForm.name.trim(), type: pForm.type, blurb: pForm.blurb.trim(), ...spread() }];
    } else if (pEditing) {
      arr = cur.map((p) => (p.name === pEditing.name ? { ...p, name: pForm.name.trim(), type: pForm.type, blurb: pForm.blurb.trim() } : p));
    } else return;
    save({ ...atlas, [continent]: { regions: contData.regions, pois: { ...contData.pois, [region.slug]: arr } } });
    setPEditing(null);
  };
  const deletePoi = (name: string) => {
    if (!region) return;
    const arr = (contData.pois[region.slug] ?? []).filter((p) => p.name !== name);
    save({ ...atlas, [continent]: { regions: contData.regions, pois: { ...contData.pois, [region.slug]: arr } } });
  };

  const tabStyle = (on: boolean) => ({ color: on ? "var(--color-ink)" : "var(--color-muted)", background: on ? "var(--color-bronze)" : "transparent", border: `1px solid ${on ? "var(--color-bronze)" : "var(--color-line)"}` });
  const cls = "px-3 py-1.5 rounded-lg font-ui text-[12px] font-bold transition-colors";

  return (
    <div className="panel p-6">
      <div className="flex gap-2 mb-3 flex-wrap items-center">
        <span className="font-ui text-[11px] font-bold uppercase tracking-wide mr-1" style={{ color: "var(--color-dim)" }}>Continente</span>
        {LAND_CONTINENTS.map((c) => (
          <button key={c} onClick={() => selectContinent(c)} className={cls} style={tabStyle(continent === c)}>{c}</button>
        ))}
      </div>
      <div className="flex gap-2 mb-5 flex-wrap items-center">
        <button onClick={() => setSub("regiones")} className={cls} style={tabStyle(sub === "regiones")}><i className="fas fa-draw-polygon mr-1.5" />Regiones</button>
        <button onClick={() => setSub("pois")} className={cls} style={tabStyle(sub === "pois")}><i className="fas fa-location-dot mr-1.5" />POIs por región</button>
      </div>

      {/* ---------------- REGIONES DEL CONTINENTE ---------------- */}
      {sub === "regiones" && (
        <>
          <p className="text-sm mb-4" style={{ color: "var(--color-muted)" }}>Arrastra cada región de {continent} a su lugar sobre el mapa. Añade, edita o borra regiones con el panel derecho.</p>
          <div className="grid lg:grid-cols-[1fr_320px] gap-5">
            <PinDragMap image={MAPS.taldorei} ratio="2560 / 1707" markers={regionMarkers} onMove={(id, x, y) => setRegionPin(id, x, y)} activeId={activeId} onSelect={setActiveId} />
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="eyebrow">Regiones ({regions.length})</p>
                <button onClick={openNewRegion} className="btn-gold !py-1.5 !px-3 text-[12px]"><i className="fas fa-plus mr-1.5" />Añadir</button>
              </div>
              {rEditing && (
                <div className="panel-raised p-3 mb-4 space-y-2">
                  <p className="eyebrow" style={{ color: "var(--color-bronze-bright)" }}>{rEditing === "new" ? "Nueva región" : `Editar: ${rEditing.name}`}</p>
                  <input value={rForm.name} onChange={(e) => setRForm({ ...rForm, name: e.target.value })} placeholder="Nombre" className={inputCls} style={{ color: "var(--color-warm)" }} />
                  <div className="flex gap-2">
                    <input value={rForm.capital} onChange={(e) => setRForm({ ...rForm, capital: e.target.value })} placeholder="Capital" className={inputCls} style={{ color: "var(--color-warm)" }} />
                    <select value={rForm.accent} onChange={(e) => setRForm({ ...rForm, accent: e.target.value })} className="bg-[var(--color-night)] rounded-lg px-2 py-1.5 font-ui text-[13px] border border-[var(--color-line)]" style={{ color: "var(--color-warm)" }}>
                      {ACCENTS.map((a) => <option key={a} value={`var(${a})`}>{a.replace("--color-", "")}</option>)}
                    </select>
                  </div>
                  <input value={rForm.feature} onChange={(e) => setRForm({ ...rForm, feature: e.target.value })} placeholder="Rasgo (p. ej. Forjas enanas)" className={inputCls} style={{ color: "var(--color-warm)" }} />
                  <textarea value={rForm.blurb} onChange={(e) => setRForm({ ...rForm, blurb: e.target.value })} rows={3} placeholder="Descripción" className={`${inputCls} resize-none`} style={{ color: "var(--color-warm)" }} />
                  <div className="flex gap-2">
                    <button onClick={saveRegion} disabled={!rForm.name.trim()} className="btn-gold flex-1 !py-1.5 text-[13px] disabled:opacity-40"><i className="fas fa-check mr-1.5" />Guardar</button>
                    <button onClick={() => setREditing(null)} className="btn-ghost !py-1.5 !px-3 text-[13px]">Cancelar</button>
                  </div>
                </div>
              )}
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {regions.map((r) => (
                  <div key={r.slug} onClick={() => setActiveId(r.slug)} className="panel-raised p-2.5 flex items-center justify-between gap-2 cursor-pointer" style={{ borderColor: activeId === r.slug ? "var(--color-bronze)" : undefined }}>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ background: r.accent }} />
                      <span className="font-ui text-[13px] font-semibold truncate" style={{ color: "var(--color-warm)" }}>{r.name}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => { setRegionSlug(r.slug); setSub("pois"); }} title="Ver POIs" className="btn-ghost !p-0 w-7 h-7 text-[11px]"><i className="fas fa-location-dot" /></button>
                      <button onClick={() => openEditRegion(r)} title="Editar" className="btn-ghost !p-0 w-7 h-7 text-[11px]"><i className="fas fa-pen" /></button>
                      <button onClick={() => { if (confirm(`¿Borrar región "${r.name}" y sus POIs?`)) deleteRegion(r.slug); }} title="Borrar" className="btn-ghost !p-0 w-7 h-7 text-[11px]" style={{ color: "var(--color-ember)" }}><i className="fas fa-trash" /></button>
                    </div>
                  </div>
                ))}
                {regions.length === 0 && <p className="text-sm italic" style={{ color: "var(--color-dim)" }}>Sin regiones en {continent}. Pulsa «Añadir».</p>}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ---------------- POIs POR REGIÓN ---------------- */}
      {sub === "pois" && (
        region ? (
          <>
            <div className="flex flex-wrap gap-2 mb-4">
              {regions.map((r) => (
                <button key={r.slug} onClick={() => setRegionSlug(r.slug)} className="chip" data-on={region.slug === r.slug}>{r.name}</button>
              ))}
            </div>
            <div className="grid lg:grid-cols-[1fr_320px] gap-5">
              <PinDragMap image={region.image || MAPS.taldorei} ratio={REGION_RATIO[region.slug] ?? "3300 / 2550"} markers={poiMarkers} onMove={(id, x, y) => setPoiPos(region.slug, id, x, y)} activeId={activeId} onSelect={setActiveId} />
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="eyebrow">POIs de {region.name} ({pois.filter((p) => poiStates[keyOf(region.slug, p.name)]?.revealed).length}/{pois.length})</p>
                  <button onClick={openNewPoi} className="btn-gold !py-1.5 !px-3 text-[12px]"><i className="fas fa-plus mr-1.5" />Añadir</button>
                </div>
                {pEditing && (
                  <div className="panel-raised p-3 mb-4 space-y-2">
                    <p className="eyebrow" style={{ color: "var(--color-bronze-bright)" }}>{pEditing === "new" ? "Nuevo POI" : `Editar: ${pEditing.name}`}</p>
                    <input value={pForm.name} onChange={(e) => setPForm({ ...pForm, name: e.target.value })} placeholder="Nombre" className={inputCls} style={{ color: "var(--color-warm)" }} />
                    <select value={pForm.type} onChange={(e) => setPForm({ ...pForm, type: e.target.value as PoiType })} className="w-full bg-[var(--color-night)] rounded-lg px-2 py-1.5 font-ui text-[13px] border border-[var(--color-line)]" style={{ color: "var(--color-warm)" }}>
                      {POI_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <textarea value={pForm.blurb} onChange={(e) => setPForm({ ...pForm, blurb: e.target.value })} rows={3} placeholder="Descripción" className={`${inputCls} resize-none`} style={{ color: "var(--color-warm)" }} />
                    <div className="flex gap-2">
                      <button onClick={savePoi} disabled={!pForm.name.trim()} className="btn-gold flex-1 !py-1.5 text-[13px] disabled:opacity-40"><i className="fas fa-check mr-1.5" />Guardar</button>
                      <button onClick={() => setPEditing(null)} className="btn-ghost !py-1.5 !px-3 text-[13px]">Cancelar</button>
                    </div>
                    <p className="font-ui text-[11px]" style={{ color: "var(--color-dim)" }}>Los POIs nuevos aparecen en el centro; arrástralos a su sitio.</p>
                  </div>
                )}
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {pois.map((p) => {
                    const on = !!poiStates[keyOf(region.slug, p.name)]?.revealed;
                    return (
                      <div key={p.name} onClick={() => setActiveId(p.name)} className="panel-raised p-2.5 flex items-center justify-between gap-2 cursor-pointer" style={{ borderColor: activeId === p.name ? "var(--color-bronze)" : undefined }}>
                        <div className="flex items-center gap-2 min-w-0">
                          <i className={`fas ${POI_ICON[p.type]} shrink-0`} style={{ color: POI_COLOR[p.type], fontSize: 12 }} />
                          <span className="font-ui text-[13px] font-semibold truncate" style={{ color: "var(--color-warm)" }}>{p.name}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => setPoiRevealed(region.slug, p.name, !on)} title={on ? "Visible" : "Oculto"} className="font-ui text-[11px] font-bold px-2 py-1 rounded-lg transition-colors"
                            style={{ color: on ? "var(--color-ink)" : "var(--color-muted)", background: on ? "var(--color-primitivo)" : "transparent", border: `1px solid ${on ? "var(--color-primitivo)" : "var(--color-line)"}` }}>
                            <i className={`fas ${on ? "fa-eye" : "fa-eye-slash"}`} />
                          </button>
                          <button onClick={() => openEditPoi(p)} title="Editar" className="btn-ghost !p-0 w-7 h-7 text-[11px]"><i className="fas fa-pen" /></button>
                          <button onClick={() => { if (confirm(`¿Borrar "${p.name}"?`)) deletePoi(p.name); }} title="Borrar" className="btn-ghost !p-0 w-7 h-7 text-[11px]" style={{ color: "var(--color-ember)" }}><i className="fas fa-trash" /></button>
                        </div>
                      </div>
                    );
                  })}
                  {pois.length === 0 && <p className="text-sm italic" style={{ color: "var(--color-dim)" }}>Sin POIs. Pulsa «Añadir».</p>}
                </div>
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm italic" style={{ color: "var(--color-dim)" }}>
            {continent} no tiene regiones todavía. Crea una en la pestaña «Regiones» primero.
          </p>
        )
      )}
    </div>
  );
}
