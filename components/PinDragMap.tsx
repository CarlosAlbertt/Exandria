"use client";

import type * as React from "react";
import { useEffect, useRef, useState } from "react";

export type DragMarker = { id: string; x: number; y: number; label: string; color: string; icon?: string };

// Mapa con marcadores arrastrables (modo edición del DM). Llama onMove al soltar.
// Botón "Ampliar": abre el mapa a casi todo el viewport. Estando ampliado, el DM
// puede acercar/alejar (+/-, rueda) y arrastrar el mapa para desplazarse; el
// arrastre de pines sigue funcionando porque las posiciones se calculan sobre el
// rect real de la capa (que ya refleja el zoom).
export default function PinDragMap({
  image, ratio, markers, onMove, activeId, onSelect,
}: {
  image: string;
  ratio: string;
  markers: DragMarker[];
  onMove: (id: string, x: number, y: number) => void;
  activeId?: string | null;
  onSelect?: (id: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null); // capa con imagen + pines (referencia del arrastre)
  const [pos, setPos] = useState<Record<string, { x: number; y: number }>>({});
  const [dragId, setDragId] = useState<string | null>(null);
  const [full, setFull] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const panFrom = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  // Ratio "W / H" -> numeros para encuadrar en pantalla completa.
  const [rw, rh] = ratio.split("/").map((s) => parseFloat(s.trim()) || 1);

  const clampPan = (x: number, y: number, z: number) => { const m = (z - 1) * 50; return { x: Math.max(-m, Math.min(m, x)), y: Math.max(-m, Math.min(m, y)) }; };
  const zoomIn = () => setZoom((z) => Math.min(6, +(z * 1.3).toFixed(2)));
  const zoomOut = () => setZoom((z) => { const n = Math.max(1, +(z / 1.3).toFixed(2)); setPan((p) => clampPan(p.x, p.y, n)); return n; });
  const resetZoom = () => { setZoom(1); setPan({ x: 0, y: 0 }); };
  const closeFull = () => { setFull(false); resetZoom(); };

  useEffect(() => {
    if (!full) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeFull(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [full]);

  // Sincroniza posiciones locales con las props salvo mientras se arrastra un pin.
  useEffect(() => {
    if (dragId) return;
    setPos(Object.fromEntries(markers.map((m) => [m.id, { x: m.x, y: m.y }])));
  }, [markers, dragId]);

  // Arrastre de un PIN
  useEffect(() => {
    if (!dragId) return;
    const move = (e: PointerEvent) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const x = Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100));
      const y = Math.max(0, Math.min(100, ((e.clientY - r.top) / r.height) * 100));
      setPos((p) => ({ ...p, [dragId]: { x, y } }));
    };
    const up = () => {
      const p = pos[dragId];
      if (p) onMove(dragId, p.x, p.y);
      setDragId(null);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  }, [dragId, pos, onMove]);

  // Arrastre para DESPLAZAR el mapa (solo ampliado y con zoom > 1; en zona vacía)
  const startPan = (e: React.PointerEvent) => {
    if (!full || zoom <= 1) return;
    panFrom.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
    const move = (ev: PointerEvent) => {
      if (!panFrom.current || !ref.current) return;
      const r = ref.current.getBoundingClientRect();
      const w = r.width / zoom, h = r.height / zoom;
      const dx = ((ev.clientX - panFrom.current.x) / w) * 100;
      const dy = ((ev.clientY - panFrom.current.y) / h) * 100;
      setPan(clampPan(panFrom.current.px + dx, panFrom.current.py + dy, zoom));
    };
    const up = () => { panFrom.current = null; window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <>
      {full && <div className="fixed inset-0 z-[80]" style={{ background: "rgba(7,10,14,0.96)" }} onClick={closeFull} />}
      <div
        className={full
          ? "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[90] overflow-hidden rounded-lg select-none touch-none"
          : "relative rounded-lg overflow-hidden select-none touch-none"}
        style={{ aspectRatio: ratio, border: "1px solid var(--color-gold-line)", ...(full ? { width: `min(96vw, calc(92vh * ${rw} / ${rh}))`, maxHeight: "92vh" } : {}) }}
        onWheel={full ? (e) => { if (e.deltaY < 0) zoomIn(); else zoomOut(); } : undefined}>

        {/* Capa imagen + pines (referencia del arrastre; recibe el zoom) */}
        <div ref={ref} onPointerDown={startPan}
          className={`absolute inset-0 ${full && zoom > 1 ? "cursor-grab active:cursor-grabbing" : ""}`}
          style={{ backgroundImage: `url('${image}')`, backgroundSize: "cover", backgroundPosition: "center",
            transform: full ? `translate(${pan.x}%, ${pan.y}%) scale(${zoom})` : "none", transformOrigin: "center",
            transition: panFrom.current ? "none" : "transform 0.15s ease-out" }}>
          {markers.map((m) => {
            const p = pos[m.id] ?? { x: m.x, y: m.y };
            const on = activeId === m.id || dragId === m.id;
            return (
              <button
                key={m.id}
                onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); setDragId(m.id); onSelect?.(m.id); }}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing"
                style={{ left: `${p.x}%`, top: `${p.y}%`, zIndex: on ? 50 : 10 }}
              >
                <span className="flex items-center justify-center rounded-full transition-transform" style={{
                  width: on ? 30 : 22, height: on ? 30 : 22, background: "rgba(7,10,14,0.85)",
                  border: `2px solid ${on ? "var(--color-bronze-bright)" : m.color}`, boxShadow: `0 0 ${on ? 18 : 8}px ${m.color}`,
                }}>
                  {m.icon ? <i className={`fas ${m.icon}`} style={{ color: m.color, fontSize: 11 }} /> : <span className="w-2 h-2 rounded-full" style={{ background: m.color }} />}
                </span>
                <span className="absolute left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap font-ui text-[10px] font-bold px-1.5 py-0.5 rounded pointer-events-none" style={{ background: "rgba(7,10,14,0.9)", color: on ? "var(--color-bronze-bright)" : "var(--color-warm)", zIndex: on ? 51 : 1 }}>
                  {m.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Controles (fuera de la capa, no se escalan) */}
        <span className="absolute top-2 left-2 font-ui text-[10px] font-bold px-2 py-1 rounded pointer-events-none z-20" style={{ background: "rgba(7,10,14,0.8)", color: "var(--color-muted)" }}>
          <i className="fas fa-up-down-left-right mr-1" />Arrastra los pines
        </span>
        <button onClick={() => (full ? closeFull() : setFull(true))} className="absolute top-2 right-2 z-20 btn-ghost !py-1.5 !px-3 text-[11px]" title={full ? "Salir (Esc)" : "Ampliar mapa"}>
          <i className={`fas ${full ? "fa-compress" : "fa-expand"} mr-1.5`} />{full ? "Salir" : "Ampliar"}
        </button>

        {full && (
          <div className="absolute bottom-3 right-3 z-20 flex flex-col items-center gap-1">
            <button onClick={zoomIn} className="btn-ghost !p-0 w-9 h-9" title="Acercar"><i className="fas fa-plus" /></button>
            <button onClick={zoomOut} disabled={zoom <= 1} className="btn-ghost !p-0 w-9 h-9 disabled:opacity-40" title="Alejar"><i className="fas fa-minus" /></button>
            <button onClick={resetZoom} disabled={zoom <= 1} className="btn-ghost !p-0 w-9 h-9 disabled:opacity-40" title="Restablecer"><i className="fas fa-expand" /></button>
            <span className="font-ui text-[10px] font-bold mt-0.5" style={{ color: "var(--color-muted)" }}>{Math.round(zoom * 100)}%</span>
          </div>
        )}
      </div>
    </>
  );
}
