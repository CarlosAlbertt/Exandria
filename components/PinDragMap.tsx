"use client";

import { useEffect, useRef, useState } from "react";

export type DragMarker = { id: string; x: number; y: number; label: string; color: string; icon?: string };

// Mapa con marcadores arrastrables (modo edición del DM). Llama onMove al soltar.
// Botón de ampliar: abre el mapa a tamaño casi completo del viewport (el arrastre
// sigue funcionando porque las posiciones se calculan sobre el rect real).
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
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<Record<string, { x: number; y: number }>>({});
  const [dragId, setDragId] = useState<string | null>(null);
  const [full, setFull] = useState(false);

  // Ratio "W / H" -> numeros para encuadrar en pantalla completa.
  const [rw, rh] = ratio.split("/").map((s) => parseFloat(s.trim()) || 1);

  useEffect(() => {
    if (!full) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setFull(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [full]);

  // Sincroniza posiciones locales con las props salvo mientras se arrastra.
  useEffect(() => {
    if (dragId) return;
    setPos(Object.fromEntries(markers.map((m) => [m.id, { x: m.x, y: m.y }])));
  }, [markers, dragId]);

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

  return (
    <>
      {full && <div className="fixed inset-0 z-[80]" style={{ background: "rgba(7,10,14,0.96)" }} onClick={() => setFull(false)} />}
      <div
        ref={ref}
        className={full
          ? "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[90] overflow-hidden rounded-lg select-none touch-none"
          : "relative rounded-lg overflow-hidden select-none touch-none"}
        style={{
          aspectRatio: ratio, backgroundImage: `url('${image}')`, backgroundSize: "cover", backgroundPosition: "center",
          border: "1px solid var(--color-gold-line)",
          ...(full ? { width: `min(96vw, calc(92vh * ${rw} / ${rh}))`, maxHeight: "92vh" } : {}),
        }}>
        {markers.map((m) => {
          const p = pos[m.id] ?? { x: m.x, y: m.y };
          const on = activeId === m.id || dragId === m.id;
          return (
            <button
              key={m.id}
              onPointerDown={(e) => { e.preventDefault(); setDragId(m.id); onSelect?.(m.id); }}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing"
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
            >
              <span className="flex items-center justify-center rounded-full transition-transform" style={{
                width: on ? 28 : 22, height: on ? 28 : 22, background: "rgba(7,10,14,0.85)",
                border: `2px solid ${m.color}`, boxShadow: `0 0 ${on ? 16 : 8}px ${m.color}`,
              }}>
                {m.icon ? <i className={`fas ${m.icon}`} style={{ color: m.color, fontSize: 11 }} /> : <span className="w-2 h-2 rounded-full" style={{ background: m.color }} />}
              </span>
              <span className="absolute left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap font-ui text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "rgba(7,10,14,0.9)", color: on ? "var(--color-bronze-bright)" : "var(--color-warm)" }}>
                {m.label}
              </span>
            </button>
          );
        })}
        <span className="absolute top-2 left-2 font-ui text-[10px] font-bold px-2 py-1 rounded pointer-events-none" style={{ background: "rgba(7,10,14,0.8)", color: "var(--color-muted)" }}>
          <i className="fas fa-up-down-left-right mr-1" />Arrastra los pines
        </span>
        <button onClick={() => setFull((f) => !f)} className="absolute top-2 right-2 btn-ghost !py-1.5 !px-3 text-[11px]" title={full ? "Salir (Esc)" : "Ampliar mapa"}>
          <i className={`fas ${full ? "fa-compress" : "fa-expand"} mr-1.5`} />{full ? "Salir" : "Ampliar"}
        </button>
      </div>
    </>
  );
}
