"use client";

import { useEffect, useRef, useState } from "react";
import { initDiceBox, setBoardListener, type DiceBoardEvent } from "@/lib/diceBox";

const COLLAPSE_KEY = "exandria:diceTrayCollapsed";

// Bandeja de dados acoplada (abajo a la derecha), plegable con una flecha.
// Los dados ruedan aquí, en la propia web (sin overlay a pantalla completa).
// El canvas físico (#dice-board-canvas) tiene altura fija: al plegar, el
// cuerpo colapsa con overflow:hidden pero el canvas conserva su tamaño, así
// dice-box no re-dimensiona el lienzo. Se auto-despliega al tirar.
export default function DiceBoard() {
  const [collapsed, setCollapsed] = useState(false);
  const [last, setLast] = useState<{ total: number | null; label: string | null } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === "1");
    }
    void initDiceBox("#dice-board-canvas");
    setBoardListener((e: DiceBoardEvent) => {
      setCollapsed(false); // al tirar, despliega para que se vean los dados
      setLast({ total: e.rolling ? null : e.total, label: e.label });
    });
    return () => setBoardListener(null);
  }, []);

  const toggle = useRef((next: boolean) => {
    setCollapsed(next);
    if (typeof window !== "undefined") window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
  }).current;

  return (
    <div className="dice-tray" data-collapsed={collapsed}>
      <div className="dice-tray-head" onClick={() => toggle(!collapsed)}>
        <span className="font-ui text-[12px] font-bold" style={{ color: "var(--color-bronze-bright)" }}>
          <i className="fas fa-dice-d20 mr-1.5" />Dados
        </span>
        <span className="font-ui text-[11px] flex-1 mx-2 truncate" style={{ color: "var(--color-dim)" }}>
          {last && last.total !== null ? `${last.label ? last.label + ": " : ""}${last.total}` : ""}
        </span>
        <button
          type="button"
          aria-label={collapsed ? "Mostrar dados" : "Ocultar dados"}
          className="shrink-0 w-6 h-6 grid place-items-center rounded"
          style={{ color: "var(--color-muted)" }}
        >
          <i className={`fas ${collapsed ? "fa-chevron-up" : "fa-chevron-down"} text-[12px]`} />
        </button>
      </div>

      <div className="dice-tray-body">
        <div id="dice-board-canvas" className="dice-tray-canvas" />
      </div>
    </div>
  );
}
