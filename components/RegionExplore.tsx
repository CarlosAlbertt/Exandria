"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { REGION_RATIO } from "@/data/taldorei";
import { POI_ICON, POI_COLOR, type Poi } from "@/data/pois";
import { useTownMaps } from "@/lib/useTownMaps";
import { usePois } from "@/lib/usePois";
import { useRole } from "@/components/SessionProvider";

// Visor a pantalla completa del mapa de una región con sus puntos de interés.
export default function RegionExplore({
  slug, name, image, accent, pois: basePois, onClose,
}: { slug: string; name: string; image: string; accent: string; pois: Poi[]; onClose: () => void }) {
  const isDM = useRole() === "dm";
  const { townMap } = useTownMaps();
  const { states, keyOf } = usePois();
  const [sel, setSel] = useState<Poi | null>(null);
  const [townOpen, setTownOpen] = useState<{ name: string; image: string } | null>(null);
  const ratio = REGION_RATIO[slug] ?? "3300 / 2550";

  // Los pines van en % del MAPA, no del hueco que lo contiene. Si se posicionan
  // sobre el contenedor, en cuanto el alto disponible no da para el aspecto del
  // mapa la imagen se encoge y se centra dentro (`object-contain`) mientras los
  // pines siguen usando el contenedor entero: se separan del dibujo, y la
  // separación crece al abrirse la ficha. Por eso se mide el rectángulo REAL de
  // la imagen y los pines se pintan sobre esa capa.
  const marcoRef = useRef<HTMLDivElement>(null);
  const mapaRef = useRef<HTMLElement>(null);
  const [caja, setCaja] = useState({ left: 0, top: 0, width: 0, height: 0 });

  const medir = useCallback(() => {
    const marco = marcoRef.current;
    const mapa = mapaRef.current;
    if (!marco || !mapa) return;
    const m = marco.getBoundingClientRect();
    const i = mapa.getBoundingClientRect();
    setCaja({ left: i.left - m.left, top: i.top - m.top, width: i.width, height: i.height });
  }, []);

  useEffect(() => {
    medir();
    const ro = new ResizeObserver(medir);
    if (marcoRef.current) ro.observe(marcoRef.current);
    if (mapaRef.current) ro.observe(mapaRef.current);
    window.addEventListener("resize", medir);
    return () => { ro.disconnect(); window.removeEventListener("resize", medir); };
  }, [medir, image]);

  // POIs con posición guardada; jugadores solo ven los revelados.
  const pois = basePois
    .map((p) => {
      const st = states[keyOf(slug, p.name)];
      return { ...p, x: st?.x ?? p.x, y: st?.y ?? p.y, revealed: isDM || !!st?.revealed };
    })
    .filter((p) => p.revealed);

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
      <div className="flex-1 min-h-0 flex items-center justify-center p-4">
        <div ref={marcoRef} className="relative flex items-center justify-center" style={{ width: "min(100%, 1200px)", height: "100%" }}>
          {image ? (
            // `max-w/max-h` con ancho y alto automáticos: la imagen conserva su
            // proporción y su caja ES el dibujo, sin franjas dentro.
            <img
              ref={mapaRef as React.RefObject<HTMLImageElement>}
              src={image}
              alt={`Mapa de ${name}`}
              onLoad={medir}
              className="block max-w-full max-h-full rounded-lg"
              style={{ border: "1px solid var(--color-bronze-deep)" }}
            />
          ) : (
            <div
              ref={mapaRef as React.RefObject<HTMLDivElement>}
              className="flex items-center justify-center rounded-lg max-w-full max-h-full"
              style={{ aspectRatio: ratio, width: "100%", border: "1px dashed var(--color-line)", background: "rgba(0,0,0,0.3)" }}
            >
              <span className="font-ui text-[12px]" style={{ color: "var(--color-dim)" }}><i className="fas fa-image mr-1.5" />Región sin mapa propio</span>
            </div>
          )}
          {/* Capa de pines recortada al rectángulo real del mapa. */}
          <div className="absolute pointer-events-none" style={{ left: caja.left, top: caja.top, width: caja.width, height: caja.height }}>
          {pois.map((p) => {
            const on = sel?.name === p.name;
            const color = POI_COLOR[p.type];
            return (
              <button key={p.name} onClick={() => setSel(p)} className="absolute -translate-x-1/2 -translate-y-1/2 group pointer-events-auto" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
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
      </div>

      {/* Ficha del POI seleccionado.
          El pie tiene ALTURA FIJA y siempre está presente, con el aviso dentro
          cuando no hay nada elegido. Si cambiara de alto al seleccionar, el
          mapa —que ocupa el hueco que sobra y tiene `aspectRatio` fijo— se
          recolocaría y encogería, y el pin se movería justo debajo del dedo que
          acababa de pulsarlo. Un blurb largo hace scroll aquí dentro; el mapa
          no se entera. */}
      <div className="border-t border-[var(--color-line)] bg-[var(--color-ink)]/90 backdrop-blur px-5 h-[140px] sm:h-[116px] overflow-y-auto">
        {sel ? (
          <div className="max-w-3xl mx-auto flex items-start gap-4 py-4">
            <span className="flex items-center justify-center rounded-lg shrink-0" style={{ width: 44, height: 44, border: `1px solid ${POI_COLOR[sel.type]}`, background: "rgba(0,0,0,0.3)" }}>
              <i className={`fas ${POI_ICON[sel.type]}`} style={{ color: POI_COLOR[sel.type] }} />
            </span>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="font-display font-bold text-lg" style={{ color: "var(--color-parch)" }}>{sel.name}</h3>
                <span className="eyebrow !text-[9px]" style={{ color: POI_COLOR[sel.type] }}>{sel.type}</span>
              </div>
              <p className="font-body text-[15px]" style={{ color: "var(--color-warm)" }}>{sel.blurb}</p>
              {townMap(sel.name) && (
                <button className="btn-gold !py-1.5 !px-3 text-[12px] mt-2" onClick={() => setTownOpen({ name: sel.name, image: townMap(sel.name)! })}>
                  <i className="fas fa-map-location-dot mr-1.5" />Ver mapa del pueblo
                </button>
              )}
            </div>
            <button className="font-ui text-[12px]" style={{ color: "var(--color-dim)" }} onClick={() => setSel(null)}><i className="fas fa-xmark" /></button>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-center">
            <span className="font-ui text-[12px]" style={{ color: "var(--color-dim)" }}>
              {pois.length > 0 ? "Pulsa un punto para ver el detalle." : "Esta región aún no tiene puntos de interés."}
            </span>
          </div>
        )}
      </div>

      {/* Visor del mapa del pueblo */}
      {townOpen && (
        <div className="fixed inset-0 z-[140] flex flex-col bg-black/95" onClick={() => setTownOpen(null)}>
          <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--color-line)]">
            <h2 className="font-display text-xl font-bold" style={{ color: "var(--color-bronze-bright)" }}><i className="fas fa-map-location-dot mr-2" />{townOpen.name}</h2>
            <button className="btn-ghost !py-2 !px-4 text-[12px]" onClick={() => setTownOpen(null)}><i className="fas fa-xmark mr-1.5" />Cerrar</button>
          </div>
          <div className="flex-1 flex items-center justify-center p-4 overflow-auto" onClick={(e) => e.stopPropagation()}>
            <img src={townOpen.image} alt={`Mapa de ${townOpen.name}`} className="max-w-full max-h-full object-contain rounded-lg" style={{ border: "1px solid var(--color-bronze-deep)" }} />
          </div>
        </div>
      )}
    </div>
  );
}
