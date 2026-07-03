"use client";

import { useState } from "react";
import { REGIONS, MAPS, REGION_RATIO, type Region } from "@/data/taldorei";
import { POI_ICON, POI_COLOR, type Poi, type PoiType } from "@/data/pois";
import { WORLD_ICON, WORLD_COLOR, CONTINENT_VIEW, CONTINENTS, REGIONS_BY_CONTINENT, type WorldType } from "@/data/world";
import { useRegions, setRegionPin } from "@/lib/useRegions";
import { usePois, setPoiPos, setPoiRevealed } from "@/lib/usePois";
import { useWorldPois, newWorldPoi, type WorldPoiRow } from "@/lib/useWorldPois";
import { useTaldorei, slugify } from "@/lib/useTaldorei";
import PinDragMap, { type DragMarker } from "@/components/PinDragMap";

const WORLD_TYPES = Object.keys(WORLD_ICON) as WorldType[];
const POI_TYPES = Object.keys(POI_ICON) as PoiType[];
const ACCENTS = ["--color-bronze", "--color-arcane", "--color-divino", "--color-marcial", "--color-violet", "--color-primitivo", "--color-ember", "--color-arcane-deep"];

type EditForm = { name: string; type: WorldType; continent: string; region: string; icon: string; blurb: string };
const EMPTY_FORM: EditForm = { name: "", type: "ciudad", continent: "Tal'Dorei", region: "", icon: "", blurb: "" };
type RForm = { name: string; capital: string; feature: string; accent: string; blurb: string };
const EMPTY_R: RForm = { name: "", capital: "", feature: "", accent: "var(--color-bronze)", blurb: "" };
type PForm = { name: string; type: PoiType; blurb: string };
const EMPTY_P: PForm = { name: "", type: "ciudad", blurb: "" };

const inputCls = "w-full bg-[var(--color-night)] rounded-lg px-3 py-1.5 font-body text-[14px] outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)]";

export default function MapaPanel() {
  const [mode, setMode] = useState<"continente" | "region" | "mundo">("mundo");
  const [regionSlug, setRegionSlug] = useState(REGIONS[0].slug);
  const [worldFocus, setWorldFocus] = useState<string | null>("__all__");
  const [editing, setEditing] = useState<WorldPoiRow | "new" | null>(null);
  const [form, setForm] = useState<EditForm>(EMPTY_FORM);
  const [rEditing, setREditing] = useState<Region | "new" | null>(null);
  const [rForm, setRForm] = useState<RForm>(EMPTY_R);
  const [pEditing, setPEditing] = useState<Poi | "new" | null>(null);
  const [pForm, setPForm] = useState<PForm>(EMPTY_P);

  const { states: regionStates } = useRegions();
  const { states: poiStates, keyOf } = usePois();
  const { pois: worldPois, save } = useWorldPois();
  const { regions: talRegions, poisByRegion, save: saveTal } = useTaldorei();

  // --- Tal'Dorei: regiones ---
  const regionMarkers: DragMarker[] = talRegions.map((r) => {
    const st = regionStates[r.slug];
    return { id: r.slug, x: st?.pin_x ?? r.map.x, y: st?.pin_y ?? r.map.y, label: r.name, color: r.accent };
  });
  const region = talRegions.find((r) => r.slug === regionSlug) ?? talRegions[0];
  const pois: Poi[] = (region && poisByRegion[region.slug]) || [];
  const poiMarkers: DragMarker[] = region ? pois.map((p) => {
    const st = poiStates[keyOf(region.slug, p.name)];
    return { id: p.name, x: st?.x ?? p.x, y: st?.y ?? p.y, label: p.name, color: POI_COLOR[p.type], icon: POI_ICON[p.type] };
  }) : [];

  // Region CRUD
  const openNewRegion = () => { setRForm(EMPTY_R); setREditing("new"); };
  const openEditRegion = (r: Region) => { setRForm({ name: r.name, capital: r.capital, feature: r.feature, accent: r.accent, blurb: r.blurb }); setREditing(r); };
  const saveRegion = () => {
    if (!rForm.name.trim()) return;
    const base = { name: rForm.name.trim(), capital: rForm.capital.trim() || "—", feature: rForm.feature.trim(), accent: rForm.accent, blurb: rForm.blurb.trim() };
    let regions: Region[];
    if (rEditing === "new") {
      const slug = slugify(rForm.name);
      regions = [...talRegions, { slug, image: "", map: { x: 50, y: 50 }, ...base }];
      saveTal({ regions, pois: { ...poisByRegion, [slug]: [] } });
    } else if (rEditing) {
      regions = talRegions.map((r) => (r.slug === rEditing.slug ? { ...r, ...base } : r));
      saveTal({ regions, pois: poisByRegion });
    }
    setREditing(null);
  };
  const deleteRegion = (slug: string) => {
    const regions = talRegions.filter((r) => r.slug !== slug);
    const p = { ...poisByRegion }; delete p[slug];
    saveTal({ regions, pois: p });
    if (regionSlug === slug && regions[0]) setRegionSlug(regions[0].slug);
  };

  // POI CRUD (para la región activa)
  const openNewPoi = () => { setPForm(EMPTY_P); setPEditing("new"); };
  const openEditPoi = (p: Poi) => { setPForm({ name: p.name, type: p.type, blurb: p.blurb }); setPEditing(p); };
  const savePoi = () => {
    if (!region || !pForm.name.trim()) return;
    const cur = poisByRegion[region.slug] ?? [];
    let arr: Poi[];
    if (pEditing === "new") {
      arr = [...cur, { name: pForm.name.trim(), type: pForm.type, blurb: pForm.blurb.trim(), x: 50, y: 50 }];
    } else if (pEditing) {
      arr = cur.map((p) => (p.name === pEditing.name ? { ...p, name: pForm.name.trim(), type: pForm.type, blurb: pForm.blurb.trim() } : p));
    } else return;
    saveTal({ regions: talRegions, pois: { ...poisByRegion, [region.slug]: arr } });
    setPEditing(null);
  };
  const deletePoi = (name: string) => {
    if (!region) return;
    const arr = (poisByRegion[region.slug] ?? []).filter((p) => p.name !== name);
    saveTal({ regions: talRegions, pois: { ...poisByRegion, [region.slug]: arr } });
  };

  // --- Mundo ---
  const continentPins = worldPois.filter((p) => p.type === "continente");
  const pinNameOf = (field: string) => continentPins.find((p) => p.continent === field)?.name ?? field;
  const worldLevel = worldPois.filter((p) => p.type === "continente" || p.continent === "Mares");
  const mundoPois = worldFocus === "__all__" ? worldPois : worldFocus ? worldPois.filter((p) => p.continent === worldFocus && p.type !== "continente") : worldLevel;
  const worldMarkers: DragMarker[] = mundoPois.map((p) => ({ id: p.id, x: p.x, y: p.y, label: p.name, color: WORLD_COLOR[p.type], icon: p.icon || WORLD_ICON[p.type] }));
  const worldRevealed = mundoPois.filter((p) => p.revealed).length;
  const focusCont = worldFocus && worldFocus !== "__all__" ? worldFocus : "Tal'Dorei";
  const openNew = () => { setForm({ ...EMPTY_FORM, continent: focusCont }); setEditing("new"); };
  const openEdit = (p: WorldPoiRow) => { setForm({ name: p.name, type: p.type, continent: p.continent, region: p.region ?? "", icon: p.icon ?? "", blurb: p.blurb }); setEditing(p); };
  const saveForm = () => {
    if (!form.name.trim()) return;
    const base = { name: form.name.trim(), type: form.type, continent: form.continent, region: form.region.trim(), icon: form.icon.trim() || null, blurb: form.blurb.trim() };
    if (editing === "new") { const v = CONTINENT_VIEW[form.continent]; save([...worldPois, newWorldPoi({ ...base, x: v?.cx ?? 50, y: v?.cy ?? 50, revealed: false })]); }
    else if (editing) save(worldPois.map((p) => (p.id === editing.id ? { ...p, ...base } : p)));
    setEditing(null);
  };
  const moveWorld = (id: string, x: number, y: number) => save(worldPois.map((p) => (p.id === id ? { ...p, x, y } : p)));
  const toggleReveal = (id: string) => save(worldPois.map((p) => (p.id === id ? { ...p, revealed: !p.revealed } : p)));
  const removeWorld = (id: string) => save(worldPois.filter((p) => p.id !== id));

  const tabStyle = (on: boolean) => ({ color: on ? "var(--color-ink)" : "var(--color-muted)", background: on ? "var(--color-bronze)" : "transparent", border: `1px solid ${on ? "var(--color-bronze)" : "var(--color-line)"}` });
  const cls = "px-3 py-1.5 rounded-lg font-ui text-[12px] font-bold transition-colors";

  return (
    <div className="panel p-6">
      <div className="flex gap-2 mb-5 flex-wrap items-center">
        {(["__all__", ...CONTINENTS] as const).map((t) => (
          <button key={t} onClick={() => { setMode("mundo"); setWorldFocus(t); setEditing(null); }} className={cls} style={tabStyle(mode === "mundo" && worldFocus === t)}>
            {t === "__all__" ? <><i className="fas fa-list mr-1.5" />Todos</> : pinNameOf(t)}
          </button>
        ))}
        <span className="mx-1" style={{ color: "var(--color-line)" }}>|</span>
        <button onClick={() => setMode("continente")} className={cls} style={tabStyle(mode === "continente")}>Regiones Tal'Dorei</button>
        <button onClick={() => setMode("region")} className={cls} style={tabStyle(mode === "region")}>POIs por región</button>
      </div>

      {/* ---------------- REGIONES TAL'DOREI ---------------- */}
      {mode === "continente" && (
        <>
          <p className="text-sm mb-4" style={{ color: "var(--color-muted)" }}>Arrastra cada región a su lugar sobre el mapa. Añade, edita o borra regiones con el panel derecho.</p>
          <div className="grid lg:grid-cols-[1fr_320px] gap-5">
            <PinDragMap image={MAPS.taldorei} ratio="2560 / 1707" markers={regionMarkers} onMove={(id, x, y) => setRegionPin(id, x, y)} />
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="eyebrow">Regiones ({talRegions.length})</p>
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
                {talRegions.map((r) => (
                  <div key={r.slug} className="panel-raised p-2.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ background: r.accent }} />
                      <span className="font-ui text-[13px] font-semibold truncate" style={{ color: "var(--color-warm)" }}>{r.name}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => { setRegionSlug(r.slug); setMode("region"); }} title="Ver POIs" className="btn-ghost !p-0 w-7 h-7 text-[11px]"><i className="fas fa-location-dot" /></button>
                      <button onClick={() => openEditRegion(r)} title="Editar" className="btn-ghost !p-0 w-7 h-7 text-[11px]"><i className="fas fa-pen" /></button>
                      <button onClick={() => { if (confirm(`¿Borrar región "${r.name}" y sus POIs?`)) deleteRegion(r.slug); }} title="Borrar" className="btn-ghost !p-0 w-7 h-7 text-[11px]" style={{ color: "var(--color-ember)" }}><i className="fas fa-trash" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ---------------- POIs POR REGIÓN ---------------- */}
      {mode === "region" && region && (
        <>
          <div className="flex flex-wrap gap-2 mb-4">
            {talRegions.map((r) => (
              <button key={r.slug} onClick={() => setRegionSlug(r.slug)} className="chip" data-on={region.slug === r.slug}>{r.name}</button>
            ))}
          </div>
          <div className="grid lg:grid-cols-[1fr_320px] gap-5">
            <PinDragMap image={region.image || MAPS.taldorei} ratio={REGION_RATIO[region.slug] ?? "3300 / 2550"} markers={poiMarkers} onMove={(id, x, y) => setPoiPos(region.slug, id, x, y)} />
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
                    <div key={p.name} className="panel-raised p-2.5 flex items-center justify-between gap-2">
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
      )}

      {/* ---------------- MUNDO ---------------- */}
      {mode === "mundo" && (
        <>
          <p className="text-sm mb-4" style={{ color: "var(--color-muted)" }}>
            {worldFocus === "__all__"
              ? "Todos los pines de Exandria. Añade, edita, borra, mueve o revela cualquiera."
              : `Lugares de ${pinNameOf(worldFocus || "")}. Arrastra, edita o revela. Usa «Ampliar» para más precisión.`}
          </p>
          <div className="grid lg:grid-cols-[1fr_340px] gap-5">
            <PinDragMap image={MAPS.taldorei} ratio="2560 / 1707" markers={worldMarkers} onMove={moveWorld} />
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="eyebrow">Lugares ({worldRevealed}/{mundoPois.length} visibles)</p>
                <button onClick={openNew} className="btn-gold !py-1.5 !px-3 text-[12px]"><i className="fas fa-plus mr-1.5" />Añadir</button>
              </div>
              {editing && (
                <div className="panel-raised p-3 mb-4 space-y-2">
                  <p className="eyebrow" style={{ color: "var(--color-bronze-bright)" }}>{editing === "new" ? "Nuevo pin" : `Editar: ${editing.name}`}</p>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nombre" className={inputCls} style={{ color: "var(--color-warm)" }} />
                  <div className="flex gap-2">
                    <select value={form.continent} onChange={(e) => setForm({ ...form, continent: e.target.value })} className="flex-1 bg-[var(--color-night)] rounded-lg px-2 py-1.5 font-ui text-[13px] border border-[var(--color-line)]" style={{ color: "var(--color-warm)" }}>
                      {CONTINENTS.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as WorldType })} className="flex-1 bg-[var(--color-night)] rounded-lg px-2 py-1.5 font-ui text-[13px] border border-[var(--color-line)]" style={{ color: "var(--color-warm)" }}>
                      {WORLD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} placeholder="Región (dentro del continente)" list="mapa-regiones" className={inputCls} style={{ color: "var(--color-warm)" }} />
                  <datalist id="mapa-regiones">{(REGIONS_BY_CONTINENT[form.continent] ?? []).map((r) => <option key={r} value={r} />)}</datalist>
                  <div className="flex gap-2 items-center">
                    <i className={`fas ${form.icon.trim() || WORLD_ICON[form.type]}`} style={{ color: WORLD_COLOR[form.type], width: 18, textAlign: "center" }} />
                    <input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="Icono opcional (fa-dragon)" className={inputCls} style={{ color: "var(--color-warm)" }} />
                  </div>
                  <textarea value={form.blurb} onChange={(e) => setForm({ ...form, blurb: e.target.value })} rows={3} placeholder="Descripción" className={`${inputCls} resize-none`} style={{ color: "var(--color-warm)" }} />
                  <div className="flex gap-2">
                    <button onClick={saveForm} disabled={!form.name.trim()} className="btn-gold flex-1 !py-1.5 text-[13px] disabled:opacity-40"><i className="fas fa-check mr-1.5" />Guardar</button>
                    <button onClick={() => setEditing(null)} className="btn-ghost !py-1.5 !px-3 text-[13px]">Cancelar</button>
                  </div>
                </div>
              )}
              {mundoPois.length === 0 ? (
                <p className="text-sm italic" style={{ color: "var(--color-dim)" }}>Sin lugares. Pulsa «Añadir».</p>
              ) : (
                <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
                  {Array.from(new Set(mundoPois.map((p) => p.region || "—"))).map((reg) => (
                    <div key={reg}>
                      <p className="font-ui text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: "var(--color-dim)" }}>{reg}</p>
                      <div className="space-y-2">
                        {mundoPois.filter((p) => (p.region || "—") === reg).map((p) => (
                          <div key={p.id} className="panel-raised p-2.5 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <i className={`fas ${p.icon || WORLD_ICON[p.type]} shrink-0`} style={{ color: WORLD_COLOR[p.type], fontSize: 12 }} />
                              <span className="font-ui text-[13px] font-semibold truncate" style={{ color: "var(--color-warm)" }}>{p.name}</span>
                              {worldFocus === "__all__" && <span className="font-ui text-[10px] shrink-0" style={{ color: "var(--color-dim)" }}>· {p.continent}</span>}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button onClick={() => toggleReveal(p.id)} title={p.revealed ? "Visible" : "Oculto"} className="font-ui text-[11px] font-bold px-2 py-1 rounded-lg transition-colors"
                                style={{ color: p.revealed ? "var(--color-ink)" : "var(--color-muted)", background: p.revealed ? "var(--color-primitivo)" : "transparent", border: `1px solid ${p.revealed ? "var(--color-primitivo)" : "var(--color-line)"}` }}>
                                <i className={`fas ${p.revealed ? "fa-eye" : "fa-eye-slash"}`} />
                              </button>
                              <button onClick={() => openEdit(p)} title="Editar" className="btn-ghost !p-0 w-7 h-7 text-[11px]"><i className="fas fa-pen" /></button>
                              <button onClick={() => { if (confirm(`¿Borrar "${p.name}"?`)) removeWorld(p.id); }} title="Borrar" className="btn-ghost !p-0 w-7 h-7 text-[11px]" style={{ color: "var(--color-ember)" }}><i className="fas fa-trash" /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
