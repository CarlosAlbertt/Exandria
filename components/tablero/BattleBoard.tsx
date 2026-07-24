"use client";
import { useEffect, useRef, useState } from "react";
import { distanciaMetros } from "@/lib/tablero";
import type { Token, Board } from "@/lib/useBattle";

// Tablero: rejilla cols×rows sobre fondo opcional, con fichas posicionadas por %.
// Arrastre solo de las fichas que `canMove` permite (optimista: se ve al instante,
// persiste por onMove). Al seleccionar una ficha, muestra la distancia a las demás.
export default function BattleBoard({
  tokens, board, canMove, onMove, onSelect,
}: {
  tokens: Token[];
  board: Board;
  canMove: (t: Token) => boolean;
  onMove: (id: number, x: number, y: number) => void;
  onSelect?: (id: number | null) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<Record<number, { x: number; y: number }>>({});
  const [dragId, setDragId] = useState<number | null>(null);
  const [sel, setSel] = useState<number | null>(null);
  const moved = useRef(false);

  // Sincroniza posiciones locales con las props salvo mientras se arrastra.
  useEffect(() => {
    if (dragId !== null) return;
    setPos(Object.fromEntries(tokens.map((t) => [t.id, { x: t.x, y: t.y }])));
  }, [tokens, dragId]);

  useEffect(() => {
    if (dragId === null) return;
    const move = (e: PointerEvent) => {
      const el = ref.current;
      if (!el) return;
      moved.current = true;
      const r = el.getBoundingClientRect();
      const x = Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100));
      const y = Math.max(0, Math.min(100, ((e.clientY - r.top) / r.height) * 100));
      setPos((p) => ({ ...p, [dragId]: { x, y } }));
    };
    const up = () => {
      const p = pos[dragId];
      if (p && moved.current) onMove(dragId, p.x, p.y);
      setDragId(null);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  }, [dragId, pos, onMove]);

  const selectToken = (id: number) => {
    const next = sel === id ? null : id;
    setSel(next);
    onSelect?.(next);
  };

  const selPos = sel !== null ? pos[sel] : undefined;

  // Líneas de la rejilla.
  const vlines = Array.from({ length: board.cols - 1 }, (_, i) => ((i + 1) / board.cols) * 100);
  const hlines = Array.from({ length: board.rows - 1 }, (_, i) => ((i + 1) / board.rows) * 100);

  return (
    <div
      ref={ref}
      className="relative w-full rounded-lg overflow-hidden select-none touch-none"
      style={{ aspectRatio: `${board.cols} / ${board.rows}`, background: board.bg_url ? undefined : "var(--color-night)", border: "1px solid var(--color-bronze-deep)" }}
      onClick={(e) => { if (e.target === e.currentTarget) selectToken(-1); }}
    >
      {board.bg_url && <img src={board.bg_url} alt="Tablero" className="absolute inset-0 w-full h-full object-cover" />}

      {/* Rejilla */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
        {vlines.map((x) => <line key={`v${x}`} x1={x} y1={0} x2={x} y2={100} stroke="var(--color-line)" strokeWidth={0.15} opacity={0.5} />)}
        {hlines.map((y) => <line key={`h${y}`} x1={0} y1={y} x2={100} y2={y} stroke="var(--color-line)" strokeWidth={0.15} opacity={0.5} />)}
      </svg>

      {/* Fichas */}
      {tokens.map((t) => {
        const p = pos[t.id] ?? { x: t.x, y: t.y };
        const movable = canMove(t);
        const dist = sel !== null && sel !== t.id && selPos ? distanciaMetros(selPos, p, board.cols, board.rows) : null;
        return (
          <div
            key={t.id}
            className="absolute flex flex-col items-center"
            style={{ left: `${p.x}%`, top: `${p.y}%`, transform: "translate(-50%,-50%)", cursor: movable ? "grab" : "pointer", opacity: t.dead ? 0.4 : 1, zIndex: sel === t.id ? 20 : 10 }}
            onPointerDown={(e) => { if (movable) { e.preventDefault(); moved.current = false; setDragId(t.id); } }}
            onClick={(e) => { e.stopPropagation(); if (!moved.current) selectToken(t.id); }}
          >
            <div
              className="rounded-full flex items-center justify-center font-ui font-bold text-[11px] shadow-md"
              style={{ width: 28, height: 28, background: t.color, color: "var(--color-ink)", border: sel === t.id ? "2px solid var(--color-parch)" : "2px solid rgba(0,0,0,0.4)" }}
              title={t.label}
            >
              {t.icon ? <i className={`fas fa-${t.icon}`} /> : t.label.slice(0, 2).toUpperCase()}
            </div>
            <span className="font-ui text-[9px] font-bold mt-0.5 px-1 rounded whitespace-nowrap" style={{ background: "rgba(7,10,14,0.7)", color: "var(--color-parch)" }}>
              {t.label}{dist !== null ? ` · ${dist} m` : ""}
            </span>
          </div>
        );
      })}
    </div>
  );
}
