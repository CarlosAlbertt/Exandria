"use client";

import { useState } from "react";
import { REGIONS, MAPS, REGION_RATIO } from "@/data/taldorei";
import { poisFor, POI_ICON, POI_COLOR } from "@/data/pois";
import { WORLD_ICON, WORLD_COLOR, CONTINENT_VIEW, CONTINENTS, REGIONS_BY_CONTINENT, type WorldType } from "@/data/world";
import { useRegions, setRegionPin } from "@/lib/useRegions";
import { usePois, setPoiPos, setPoiRevealed } from "@/lib/usePois";
import { useWorldPois, saveWorldPois, newWorldPoi, type WorldPoiRow } from "@/lib/useWorldPois";
import PinDragMap, { type DragMarker } from "@/components/PinDragMap";

const WORLD_TYPES = Object.keys(WORLD_ICON) as WorldType[];
type EditForm = { name: string; type: WorldType; continent: string; region: string; icon: string; blurb: string };
const EMPTY_FORM: EditForm = { name: "", type: "ciudad", continent: "Tal'Dorei", region: "", icon: "", blurb: "" };

export default function MapaPanel() {
  const [mode, setMode] = useState<"continente" | "region" | "mundo">("mundo");
  const [regionSlug, setRegionSlug] = useState(REGIONS[0].slug);
  const [worldFocus, setWorldFocus] = useState<string | null>("__all__");
  const [editing, setEditing] = useState<WorldPoiRow | "new" | null>(null);
  const [form, setForm] = useState<EditForm>(EMPTY_FORM);
  const { states: regionStates } = useRegions();
  const { states: poiStates, keyOf } = usePois();
  const { pois: worldPois } = useWorldPois();

  // --- Continente: pines de región de Tal'Dorei ---
  const regionMarkers: DragMarker[] = REGIONS.map((r) => {
    const st = regionStates[r.slug];
    return { id: r.slug, x: st?.pin_x ?? r.map.x, y: st?.pin_y ?? r.map.y, label: r.name, color: r.accent };
  });

  // --- Región: POIs ---
  const region = REGIONS.find((r) => r.slug === regionSlug)!;
  const pois = poisFor(regionSlug);
  const poiMarkers: DragMarker[] = pois.map((p) => {
    const st = poiStates[keyOf(regionSlug, p.name)];
    return { id: p.name, x: st?.x ?? p.x, y: st?.y ?? p.y, label: p.name, color: POI_COLOR[p.type], icon: POI_ICON[p.type] };
  });

  // --- Mundo: jerarquía + edición ---
  const continentPins = worldPois.filter((p) => p.type === "continente");
  const pinNameOf = (field: string) => continentPins.find((p) => p.continent === field)?.name ?? field;
  const worldLevel = worldPois.filter((p) => p.type === "continente" || p.continent === "Mares");
  const mundoPois = worldFocus === "__all__"
    ? worldPois
    : worldFocus
      ? worldPois.filter((p) => p.continent === worldFocus && p.type !== "continente")
      : worldLevel;
  const worldMarkers: DragMarker[] = mundoPois.map((p) => ({ id: p.id, x: p.x, y: p.y, label: p.name, color: WORLD_COLOR[p.type], icon: p.icon || WORLD_ICON[p.type] }));
  const worldRevealed = mundoPois.filter((p) => p.revealed).length;

  const focusCont = worldFocus && worldFocus !== "__all__" ? worldFocus : "Tal'Dorei";
  const openNew = () => { setForm({ ...EMPTY_FORM, continent: focusCont }); setEditing("new"); };
  const openEdit = (p: WorldPoiRow) => { setForm({ name: p.name, type: p.type, continent: p.continent, region: p.region ?? "", icon: p.icon ?? "", blurb: p.blurb }); setEditing(p); };
  const saveForm = async () => {
    if (!form.name.trim()) return;
    const base = { name: form.name.trim(), type: form.type, continent: form.continent, region: form.region.trim(), icon: form.icon.trim() || null, blurb: form.blurb.trim() };
    if (editing === "new") {
      const v = CONTINENT_VIEW[form.continent];
      await saveWorldPois([...worldPois, newWorldPoi({ ...base, x: v?.cx ?? 50, y: v?.cy ?? 50, revealed: false })]);
    } else if (editing) {
      await saveWorldPois(worldPois.map((p) => (p.id === editing.id ? { ...p, ...base } : p)));
    }
    setEditing(null);
  };
  const moveWorld = (id: string, x: number, y: number) => saveWorldPois(worldPois.map((p) => (p.id === id ? { ...p, x, y } : p)));
  const toggleReveal = (id: string) => saveWorldPois(worldPois.map((p) => (p.id === id ? { ...p, revealed: !p.revealed } : p)));
  const removeWorld = (id: string) => saveWorldPois(worldPois.filter((p) => p.id !== id));

  return (
    <div className="panel p-6">
      {(() => {
        const tabStyle = (on: boolean) => ({ color: on ? "var(--color-ink)" : "var(--color-muted)", background: on ? "var(--color-bronze)" : "transparent", border: `1px solid ${on ? "var(--color-bronze)" : "var(--color-line)"}` });
        const cls = "px-3 py-1.5 rounded-lg font-ui text-[12px] font-bold transition-colors";
        return (
          <div className="flex gap-2 mb-5 flex-wrap items-center">
            {(["__all__", ...CONTINENTS] as const).map((t) => {
              const on = mode === "mundo" && worldFocus === t;
              return (
                <button key={t} onClick={() => { setMode("mundo"); setWorldFocus(t); setEditing(null); }} className={cls} style={tabStyle(on)}>
                  {t === "__all__" ? <><i className="fas fa-list mr-1.5" />Todos</> : pinNameOf(t)}
                </button>
              );
            })}
            <span className="mx-1" style={{ color: "var(--color-line)" }}>|</span>
            <button onClick={() => setMode("continente")} className={cls} style={tabStyle(mode === "continente")}>Regiones Tal'Dorei</button>
            <button onClick={() => setMode("region")} className={cls} style={tabStyle(mode === "region")}>POIs por región</button>
          </div>
        );
      })()}

      {mode === "continente" && (
        <>
          <p className="text-sm mb-4" style={{ color: "var(--color-muted)" }}>Arrastra cada región de Tal'Dorei a su lugar exacto sobre el mapa. Se guarda al soltar y se aplica para todos.</p>
          <div className="max-w-2xl mx-auto">
            <PinDragMap image={MAPS.taldorei} ratio="2560 / 1707" markers={regionMarkers} onMove={(id, x, y) => setRegionPin(id, x, y)} />
          </div>
        </>
      )}

      {mode === "region" && (
        <>
          <div className="flex flex-wrap gap-2 mb-4">
            {REGIONS.map((r) => (
              <button key={r.slug} onClick={() => setRegionSlug(r.slug)} className="chip" data-on={regionSlug === r.slug}>{r.name}</button>
            ))}
          </div>
          <div className="grid lg:grid-cols-[1fr_300px] gap-5">
            <PinDragMap image={region.image} ratio={REGION_RATIO[regionSlug] ?? "3300 / 2550"} markers={poiMarkers}
              onMove={(id, x, y) => setPoiPos(regionSlug, id, x, y)} />
            <div>
              <p className="eyebrow mb-3">Revelar puntos ({pois.filter((p) => poiStates[keyOf(regionSlug, p.name)]?.revealed).length}/{pois.length})</p>
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {pois.map((p) => {
                  const on = !!poiStates[keyOf(regionSlug, p.name)]?.revealed;
                  return (
                    <div key={p.name} className="panel-raised p-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <i className={`fas ${POI_ICON[p.type]} shrink-0`} style={{ color: POI_COLOR[p.type], fontSize: 12 }} />
                        <span className="font-ui text-[13px] font-semibold truncate" style={{ color: "var(--color-warm)" }}>{p.name}</span>
                      </div>
                      <button onClick={() => setPoiRevealed(regionSlug, p.name, !on)} className="font-ui text-[11px] font-bold px-2.5 py-1 rounded-lg shrink-0 transition-colors"
                        style={{ color: on ? "var(--color-ink)" : "var(--color-muted)", background: on ? "var(--color-primitivo)" : "transparent", border: `1px solid ${on ? "var(--color-primitivo)" : "var(--color-line)"}` }}>
                        <i className={`fas ${on ? "fa-eye" : "fa-eye-slash"} mr-1`} />{on ? "Visible" : "Oculto"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {mode === "mundo" && (
        <>
          <p className="text-sm mb-4" style={{ color: "var(--color-muted)" }}>
            {worldFocus === "__all__"
              ? "Todos los pines de Exandria: continentes, regiones, ciudades y pueblos. Añade, edita, borra, mueve o revela cualquiera."
              : worldFocus
                ? `Regiones y lugares de ${pinNameOf(worldFocus)}. Arrastra cada pin a su sitio, edítalo o revélalo. Usa «Ampliar» para más precisión.`
                : "Nivel mundial: solo continentes y mares/océanos. Entra en un continente (arriba) o pulsa «Todos» para editar cualquier pin."}
          </p>

          <div className="grid lg:grid-cols-[1fr_340px] gap-5">
            <PinDragMap image={MAPS.taldorei} ratio="2560 / 1707" markers={worldMarkers} onMove={moveWorld} />
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="eyebrow">Lugares ({worldRevealed}/{mundoPois.length} visibles)</p>
                <button onClick={openNew} className="btn-gold !py-1.5 !px-3 text-[12px]"><i className="fas fa-plus mr-1.5" />Añadir</button>
              </div>

              {/* Formulario de añadir/editar */}
              {editing && (
                <div className="panel-raised p-3 mb-4 space-y-2">
                  <p className="eyebrow" style={{ color: "var(--color-bronze-bright)" }}>{editing === "new" ? "Nuevo pin" : `Editar: ${editing.name}`}</p>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nombre"
                    className="w-full bg-[var(--color-night)] rounded-lg px-3 py-1.5 font-body text-[14px] outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)]" style={{ color: "var(--color-warm)" }} />
                  <div className="flex gap-2">
                    <select value={form.continent} onChange={(e) => setForm({ ...form, continent: e.target.value })}
                      className="flex-1 bg-[var(--color-night)] rounded-lg px-2 py-1.5 font-ui text-[13px] outline-none border border-[var(--color-line)]" style={{ color: "var(--color-warm)" }}>
                      {CONTINENTS.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as WorldType })}
                      className="flex-1 bg-[var(--color-night)] rounded-lg px-2 py-1.5 font-ui text-[13px] outline-none border border-[var(--color-line)]" style={{ color: "var(--color-warm)" }}>
                      {WORLD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} placeholder="Región (dentro del continente)" list="mapa-regiones"
                    className="w-full bg-[var(--color-night)] rounded-lg px-3 py-1.5 font-ui text-[13px] outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)]" style={{ color: "var(--color-warm)" }} />
                  <datalist id="mapa-regiones">
                    {(REGIONS_BY_CONTINENT[form.continent] ?? []).map((r) => <option key={r} value={r} />)}
                  </datalist>
                  <div className="flex gap-2 items-center">
                    <i className={`fas ${form.icon.trim() || WORLD_ICON[form.type]}`} style={{ color: WORLD_COLOR[form.type], width: 18, textAlign: "center" }} />
                    <input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="Icono opcional (p. ej. fa-dragon)"
                      className="flex-1 bg-[var(--color-night)] rounded-lg px-3 py-1.5 font-ui text-[13px] outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)]" style={{ color: "var(--color-warm)" }} />
                  </div>
                  <textarea value={form.blurb} onChange={(e) => setForm({ ...form, blurb: e.target.value })} rows={3} placeholder="Descripción"
                    className="w-full bg-[var(--color-night)] rounded-lg px-3 py-1.5 font-body text-[14px] outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)] resize-none" style={{ color: "var(--color-warm)" }} />
                  <div className="flex gap-2">
                    <button onClick={saveForm} disabled={!form.name.trim()} className="btn-gold flex-1 !py-1.5 text-[13px] disabled:opacity-40"><i className="fas fa-check mr-1.5" />Guardar</button>
                    <button onClick={() => setEditing(null)} className="btn-ghost !py-1.5 !px-3 text-[13px]">Cancelar</button>
                  </div>
                  <p className="font-ui text-[11px]" style={{ color: "var(--color-dim)" }}>Los pines nuevos aparecen en el centro del continente; arrástralos a su sitio.</p>
                </div>
              )}

              {worldFocus === "Tal'Dorei" ? (
                <p className="text-sm italic mb-2" style={{ color: "var(--color-dim)" }}>Los mapas de región y sus POIs de Tal'Dorei están en las pestañas «Regiones Tal'Dorei» y «POIs por región». Aquí puedes añadir ciudades/pueblos de Tal'Dorei como pines del mundo.</p>
              ) : null}

              {mundoPois.length === 0 ? (
                <p className="text-sm italic" style={{ color: "var(--color-dim)" }}>Sin lugares en este nivel todavía. Pulsa «Añadir».</p>
              ) : (
                <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
                  {Array.from(new Set(mundoPois.map((p) => p.region || "—"))).map((reg) => (
                    <div key={reg}>
                      <p className="font-ui text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: "var(--color-dim)" }}>{reg}{worldFocus === "__all__" ? "" : ""}</p>
                      <div className="space-y-2">
                        {mundoPois.filter((p) => (p.region || "—") === reg).map((p) => (
                          <div key={p.id} className="panel-raised p-2.5 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <i className={`fas ${p.icon || WORLD_ICON[p.type]} shrink-0`} style={{ color: WORLD_COLOR[p.type], fontSize: 12 }} />
                              <span className="font-ui text-[13px] font-semibold truncate" style={{ color: "var(--color-warm)" }}>{p.name}</span>
                              {worldFocus === "__all__" && <span className="font-ui text-[10px] shrink-0" style={{ color: "var(--color-dim)" }}>· {p.continent}</span>}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button onClick={() => toggleReveal(p.id)} title={p.revealed ? "Visible" : "Oculto"}
                                className="font-ui text-[11px] font-bold px-2 py-1 rounded-lg transition-colors"
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
