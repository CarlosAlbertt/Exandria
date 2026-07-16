"use client";

// Barra de runas: las 6 runas SON los pasos y la navegación. Sustituye al
// círculo de invocación (retirado el 2026-07-16: repartía mal el espacio).
// Encendida = paso completo · resaltada = actual · apagada y deshabilitada =
// aún no alcanzable. `maxStep` es el último paso alcanzable (gate de page.tsx).
const GLYPHS = ["✦", "⚔", "◈", "⬢", "✧", "❖"];

export default function RuneBar({
  steps,
  current,
  maxStep,
  onGo,
}: {
  steps: readonly string[];
  current: number;
  maxStep: number;
  onGo: (step: number) => void;
}) {
  return (
    <nav className="rune-bar" aria-label="Pasos del creador">
      {steps.map((label, i) => {
        const state = i < current ? "done" : i === current ? "now" : "";
        return (
          <button
            key={label}
            type="button"
            className={`rune ${state}`}
            disabled={i > maxStep}
            onClick={() => onGo(i)}
            title={label}
            aria-current={i === current ? "step" : undefined}
          >
            <span className="rune-glyph" aria-hidden="true">{GLYPHS[i] ?? "•"}</span>
            <span className="rune-label">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
