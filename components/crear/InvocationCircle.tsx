"use client";

// Círculo de invocación: dos aros + 6 runas (una por paso) + slot central.
// Las runas SON la navegación y el progreso: encendida = paso completo,
// resaltada = paso actual, apagada = pendiente. `maxStep` es el último paso
// alcanzable (gate de `page.tsx`): más allá, la runa se deshabilita.
const GLYPHS = ["✦", "⚔", "◈", "⬢", "✧", "❖"];

export default function InvocationCircle({
  steps,
  current,
  maxStep,
  onGo,
  children,
}: {
  steps: readonly string[];
  current: number;
  maxStep: number;
  onGo: (step: number) => void;
  children: React.ReactNode; // el medallón
}) {
  return (
    <div className="inv-scene">
      <div className="inv-circle">
        <div className="inv-ring-outer" />
        <div className="inv-ring-inner" />
        <div className="inv-medal-slot">{children}</div>

        {steps.map((label, i) => {
          const angle = (360 / steps.length) * i - 90; // arranca arriba
          const state = i < current ? "done" : i === current ? "now" : "";
          return (
            <button
              key={label}
              type="button"
              className={`inv-rune ${state}`}
              style={{ ["--a" as string]: `${angle}deg`, ["--r" as string]: "min(37vw, 150px)" } as React.CSSProperties}
              disabled={i > maxStep}
              onClick={() => onGo(i)}
              title={label}
              aria-label={label}
              aria-current={i === current ? "step" : undefined}
            >
              {GLYPHS[i] ?? "•"}
            </button>
          );
        })}
      </div>
    </div>
  );
}
