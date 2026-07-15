"use client";

import { useEffect, useRef, useState } from "react";
import {
  setBoardListener,
  triggerThrow,
  type DiceBoardEvent,
  type DiceBoardPhase,
} from "@/lib/diceBox";

// Overlay de tirada estilo Baldur's Gate: aparece SOLO cuando hace falta una
// tirada, el jugador pulsa para lanzar el dado, sale el resultado y se cierra.
// El canvas físico (#dice-board-canvas) está siempre montado y dimensionado
// (nunca display:none) para que dice-box calcule bien el lienzo; el overlay se
// muestra/oculta con opacidad. Se inicializa una vez al montar.
export default function DiceBoard() {
  const [phase, setPhase] = useState<DiceBoardPhase>("hidden");
  const [label, setLabel] = useState<string | null>(null);
  const [mod, setMod] = useState(0);
  const [total, setTotal] = useState<number | null>(null);
  const [crit, setCrit] = useState<"crit" | "fumble" | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // No se inicializa dice-box aquí: arranca de forma perezosa en la primera
    // tirada (rollVisual). El canvas #dice-board-canvas sí se monta abajo.
    setBoardListener((e: DiceBoardEvent) => {
      if (hideTimer.current) { clearTimeout(hideTimer.current); hideTimer.current = null; }
      setPhase(e.phase);
      setLabel(e.label);
      setMod(e.mod);
      setTotal(e.total);
      setCrit(e.crit);
      if (e.phase === "result") {
        hideTimer.current = setTimeout(() => setPhase("hidden"), 2000);
      }
    });
    return () => {
      setBoardListener(null);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  function onOverlayClick() {
    if (phase === "ready") {
      triggerThrow();
    } else if (phase === "result") {
      if (hideTimer.current) { clearTimeout(hideTimer.current); hideTimer.current = null; }
      setPhase("hidden");
    }
  }

  const open = phase === "ready" || phase === "rolling" || phase === "result";
  const modStr = mod === 0 ? "" : mod > 0 ? `+${mod}` : `${mod}`;

  return (
    <div
      className={`dice-overlay${open ? " is-open" : ""}`}
      aria-hidden={!open}
      onClick={onOverlayClick}
    >
      <div className="dice-overlay-backdrop" />

      <div className="dice-stage">
        <div id="dice-board-canvas" className="dice-stage-canvas" />

        {phase === "ready" && (
          <>
            <i className="fas fa-dice-d20 dice-die-icon" aria-hidden />
            <div className="dice-prompt">
              {label && <div className="dice-prompt-label">{label}</div>}
              <div className="dice-prompt-cta">
                <span>Pulsa para tirar</span>
                {modStr && <span className="dice-prompt-mod">{modStr}</span>}
              </div>
            </div>
          </>
        )}

        {phase === "result" && total !== null && (
          <div className={`dice-result${crit === "crit" ? " is-crit" : crit === "fumble" ? " is-fumble" : ""}`}>
            {label && <div className="dice-result-label">{label}</div>}
            <div className="dice-result-total">{total}</div>
            {crit === "crit" && <div className="dice-result-badge">¡CRÍTICO!</div>}
            {crit === "fumble" && <div className="dice-result-badge is-fumble">PIFIA</div>}
          </div>
        )}
      </div>
    </div>
  );
}
