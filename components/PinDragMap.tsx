"use client";

import { useEffect, useRef, useState } from "react";

export type DragMarker = { id: string; x: number; y: number; label: string; color: string; icon?: string };

// Mapa con marcadores arrastrables (modo edición del DM). Llama onMove al soltar.
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
    <div ref={ref} className="relative rounded-lg overflow-hidden select-none touch-none" style={{ aspectRatio: ratio, backgroundImage: `url('${image}')`, backgroundSize: "cover", backgroundPosition: "center", border: "1px solid var(--color-gold-line)" }}>
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
      <span className="absolute top-2 left-2 font-ui text-[10px] font-bold px-2 py-1 rounded" style={{ background: "rgba(7,10,14,0.8)", color: "var(--color-muted)" }}>
        <i className="fas fa-up-down-left-right mr-1" />Arrastra los pines
      </span>
    </div>
  );
}
