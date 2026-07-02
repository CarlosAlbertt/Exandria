"use client";

import { useState } from "react";
import { REGIONS, MAPS, REGION_RATIO } from "@/data/taldorei";
import { poisFor, POI_ICON, POI_COLOR } from "@/data/pois";
import { WORLD_POIS, WORLD_SLUG, WORLD_ICON, WORLD_COLOR, worldByContinent } from "@/data/world";
import { useRegions, setRegionPin } from "@/lib/useRegions";
import { usePois, setPoiPos, setPoiRevealed } from "@/lib/usePois";
import PinDragMap, { type DragMarker } from "@/components/PinDragMap";

export default function MapaPanel() {
  const [mode, setMode] = useState<"continente" | "region" | "mundo">("continente");
  const [regionSlug, setRegionSlug] = useState(REGIONS[0].slug);
  const { states: regionStates } = useRegions();
  const { states: poiStates, keyOf } = usePois();

  // --- Continente: pines de región ---
  const regionMarkers: DragMarker[] = REGIONS.map((r) => {
    const st = regionStates[r.slug];
    return { id: r.slug, x: st?.pin_x ?? r.map.x, y: st?.pin_y ?? r.map.y, label: r.name, color: r.accent };
  });

  // --- Mundo: pines de todos los continentes/ciudades sobre el mapa mundial ---
  const worldMarkers: DragMarker[] = WORLD_POIS.map((p) => {
    const st = poiStates[keyOf(WORLD_SLUG, p.name)];
    return { id: p.name, x: st?.x ?? p.x, y: st?.y ?? p.y, label: p.name, color: WORLD_COLOR[p.type], icon: WORLD_ICON[p.type] };
  });
  const worldRevealed = WORLD_POIS.filter((p) => poiStates[keyOf(WORLD_SLUG, p.name)]?.revealed).length;

  // --- Región: POIs ---
  const region = REGIONS.find((r) => r.slug === regionSlug)!;
  const pois = poisFor(regionSlug);
  const poiMarkers: DragMarker[] = pois.map((p) => {
    const st = poiStates[keyOf(regionSlug, p.name)];
    return { id: p.name, x: st?.x ?? p.x, y: st?.y ?? p.y, label: p.name, color: POI_COLOR[p.type], icon: POI_ICON[p.type] };
  });

  return (
    <div className="panel p-6">
      <div className="flex gap-2 mb-5">
        {(["continente", "region", "mundo"] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)} className="px-4 py-2 rounded-lg font-ui text-[13px] font-bold transition-colors"
            style={{ color: mode === m ? "var(--color-ink)" : "var(--color-muted)", background: mode === m ? "var(--color-bronze)" : "transparent", border: `1px solid ${mode === m ? "var(--color-bronze)" : "var(--color-line)"}` }}>
            {m === "continente" ? "Pines de Tal'Dorei" : m === "region" ? "POIs por región" : "Mundo (Exandria)"}
          </button>
        ))}
      </div>

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
          <p className="text-sm mb-4" style={{ color: "var(--color-muted)" }}>Todos los continentes, regiones y ciudades de Exandria. Arrastra cada pin a su lugar exacto y revélalos a los jugadores uno a uno. Posiciones y visibilidad se guardan para todos.</p>
          <div className="grid lg:grid-cols-[1fr_320px] gap-5">
            <PinDragMap image={MAPS.taldorei} ratio="2560 / 1707" markers={worldMarkers} onMove={(id, x, y) => setPoiPos(WORLD_SLUG, id, x, y)} />
            <div>
              <p className="eyebrow mb-3">Revelar lugares ({worldRevealed}/{WORLD_POIS.length})</p>
              <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
                {worldByContinent().map(({ continent, items }) => (
                  <div key={continent}>
                    <p className="font-ui text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: "var(--color-dim)" }}>{continent}</p>
                    <div className="space-y-2">
                      {items.map((p) => {
                        const on = !!poiStates[keyOf(WORLD_SLUG, p.name)]?.revealed;
                        return (
                          <div key={p.name} className="panel-raised p-2.5 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <i className={`fas ${WORLD_ICON[p.type]} shrink-0`} style={{ color: WORLD_COLOR[p.type], fontSize: 12 }} />
                              <span className="font-ui text-[13px] font-semibold truncate" style={{ color: "var(--color-warm)" }}>{p.name}</span>
                            </div>
                            <button onClick={() => setPoiRevealed(WORLD_SLUG, p.name, !on)} className="font-ui text-[11px] font-bold px-2.5 py-1 rounded-lg shrink-0 transition-colors"
                              style={{ color: on ? "var(--color-ink)" : "var(--color-muted)", background: on ? "var(--color-primitivo)" : "transparent", border: `1px solid ${on ? "var(--color-primitivo)" : "var(--color-line)"}` }}>
                              <i className={`fas ${on ? "fa-eye" : "fa-eye-slash"} mr-1`} />{on ? "Visible" : "Oculto"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
