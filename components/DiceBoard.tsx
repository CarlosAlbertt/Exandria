"use client";

import { useEffect, useRef, useState } from "react";
import { initDiceBox, setBoardListener, type DiceBoardEvent } from "@/lib/diceBox";

// Mesa de dados: overlay centrado que aparece al tirar. El canvas físico de
// dice-box vive dentro de la mesa de fieltro (#dice-board-canvas), que tiene un
// tamaño fijo → los dados se ven grandes. Se muestra al empezar la tirada y,
// al reposar los dados, enseña el total y se cierra sola (o al hacer clic).
// El canvas se inicializa una vez con la mesa ya dimensionada (opacidad 0, no
// display:none) para que dice-box calcule bien el tamaño del lienzo.
export default function DiceBoard() {
  const [visible, setVisible] = useState(false);
  const [total, setTotal] = useState<number | null>(null);
  const [label, setLabel] = useState<string | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    void initDiceBox("#dice-board-canvas");
    setBoardListener((e: DiceBoardEvent) => {
      if (hideTimer.current) { clearTimeout(hideTimer.current); hideTimer.current = null; }
      setVisible(true);
      setLabel(e.label);
      if (e.rolling) {
        setTotal(null);
      } else {
        setTotal(e.total);
        hideTimer.current = setTimeout(() => setVisible(false), 2600);
      }
    });
    return () => {
      setBoardListener(null);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  function dismiss() {
    if (hideTimer.current) { clearTimeout(hideTimer.current); hideTimer.current = null; }
    setVisible(false);
  }

  return (
    <div
      className={`fixed inset-0 z-[60] flex items-center justify-center transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      aria-hidden={!visible}
      onClick={dismiss}
    >
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }} />

      <div className="dice-table relative" onClick={(e) => e.stopPropagation()}>
        <div id="dice-board-canvas" className="absolute inset-0 rounded-[12px] overflow-hidden" />

        {label && (
          <div
            className="absolute top-3 left-1/2 -translate-x-1/2 z-[2] font-ui text-[12px] font-bold px-3 py-1 rounded-full pointer-events-none"
            style={{
              color: "var(--color-warm)",
              background: "rgba(0,0,0,0.4)",
              border: "1px solid color-mix(in srgb, var(--color-bronze) 40%, transparent)",
            }}
          >
            {label}
          </div>
        )}

        {total !== null && (
          <div
            className="dice-total-pop absolute bottom-3 left-1/2 -translate-x-1/2 z-[2] font-bold pointer-events-none"
            style={{ fontSize: 42, color: "var(--color-bronze-bright)", textShadow: "0 2px 10px rgba(0,0,0,0.7)" }}
          >
            {total}
          </div>
        )}
      </div>
    </div>
  );
}
