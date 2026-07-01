"use client";

import { useState } from "react";
import { REGION_RATIO } from "@/data/taldorei";
import { poisFor, POI_ICON, POI_COLOR, type Poi } from "@/data/pois";

// Visor a pantalla completa del mapa de una región con sus puntos de interés.
export default function RegionExplore({
  slug, name, image, accent, onClose,
}: { slug: string; name: string; image: string; accent: string; onClose: () => void }) {
  const pois = poisFor(slug);
  const [sel, setSel] = useState<Poi | null>(null);
  const ratio = REGION_RATIO[slug] ?? "3300 / 2550";

  return (
    <div className="fixed inset-0 z-[130] flex flex-col bg-black/90">
      {/* Cabecera */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--color-line)] bg-[var(--color-ink)]/80 backdrop-blur">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full" style={{ background: accent, boxShadow: `0 0 12px ${accent}` }} />
          <h2 className="font-display text-xl font-bold" style={{ color: accent }}>{name}</h2>
          <span className="eyebrow hidden sm:inline">{pois.length} puntos de interés</span>
        </div>
        <button className="btn-ghost !py-2 !px-4 text-[12px]" onClick={onClose}><i className="fas fa-xmark mr-1.5" />Cerrar</button>
      </div>

      {/* Mapa + pins */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
        <div className="relative" style={{ aspectRatio: ratio, maxWidth: "100%", maxHeight: "100%", width: "min(100%, 1200px)" }}>
          <img src={image} alt={`Mapa de ${name}`} className="absolute inset-0 w-full h-full object-contain rounded-lg" style={{ border: "1px solid var(--color-gold-line)" }} />
          {pois.map((p) => {
            const on = sel?.name === p.name;
            const color = POI_COLOR[p.type];
            return (
              <button key={p.name} onClick={() => setSel(p)} className="absolute -translate-x-1/2 -translate-y-1/2 group" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
                <span className="flex items-center justify-center rounded-full transition-all" style={{
                  width: on ? 30 : 24, height: on ? 30 : 24, background: "rgba(7,10,14,0.85)",
                  border: `2px solid ${color}`, boxShadow: `0 0 ${on ? 18 : 8}px ${color}`,
                }}>
                  <i className={`fas ${POI_ICON[p.type]}`} style={{ color, fontSize: on ? 13 : 11 }} />
                </span>
                <span className="absolute left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap font-ui text-[10px] font-bold px-1.5 py-0.5 rounded transition-opacity"
                  style={{ background: "rgba(7,10,14,0.9)", color: "var(--color-warm)", opacity: on ? 1 : 0 }}>
                  {p.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Ficha del POI seleccionado */}
      {sel && (
        <div className="border-t border-[var(--color-line)] bg-[var(--color-ink)]/90 backdrop-blur px-5 py-4">
          <div className="max-w-3xl mx-auto flex items-start gap-4">
            <span className="flex items-center justify-center rounded-lg shrink-0" style={{ width: 44, height: 44, border: `1px solid ${POI_COLOR[sel.type]}`, background: "rgba(0,0,0,0.3)" }}>
              <i className={`fas ${POI_ICON[sel.type]}`} style={{ color: POI_COLOR[sel.type] }} />
            </span>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="font-display font-bold text-lg" style={{ color: "var(--color-parch)" }}>{sel.name}</h3>
                <span className="eyebrow !text-[9px]" style={{ color: POI_COLOR[sel.type] }}>{sel.type}</span>
              </div>
              <p className="font-body text-[15px]" style={{ color: "var(--color-warm)" }}>{sel.blurb}</p>
            </div>
            <button className="font-ui text-[12px]" style={{ color: "var(--color-dim)" }} onClick={() => setSel(null)}><i className="fas fa-xmark" /></button>
          </div>
        </div>
      )}
      {!sel && pois.length > 0 && (
        <div className="border-t border-[var(--color-line)] px-5 py-2 text-center">
          <span className="font-ui text-[12px]" style={{ color: "var(--color-dim)" }}>Pulsa un punto para ver el detalle.</span>
        </div>
      )}
    </div>
  );
}
