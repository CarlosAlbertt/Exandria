"use client";
import { pozosDe, referenciasDe, gastar, devolver, type PlayState } from "@/lib/recursos";

// Los pozos de usos de la clase, con puntos pulsables. Un toque gasta; un toque
// en un punto ya gastado lo devuelve (para deshacer un error de mesa sin tener
// que llamar al DM).
export default function PozosClase({
  clsSlug, level, play, onChange, readOnly = false,
}: {
  clsSlug: string;
  level: number;
  play: PlayState;
  onChange: (next: PlayState) => void;
  readOnly?: boolean;
}) {
  const pozos = pozosDe(clsSlug, level, play);
  const refs = referenciasDe(clsSlug, level);
  if (!pozos.length && !refs.length) return null;

  return (
    <div className="mb-4 space-y-3">
      {pozos.map((p) => (
        <div key={p.key}>
          <div className="flex items-baseline justify-between gap-2 flex-wrap">
            <p className="font-ui text-[13px] font-bold" style={{ color: "var(--color-parch)" }}>{p.name}</p>
            <p className="font-ui text-[12px]" style={{ color: "var(--color-dim)" }}>
              {p.ilimitado ? "sin límite" : `${p.quedan} de ${p.max}`} · recarga con descanso {p.recharge}
            </p>
          </div>
          {p.ilimitado ? (
            <p className="font-ui text-[12px] italic mt-1" style={{ color: "var(--color-primitivo)" }}>
              <i className="fas fa-infinity mr-1.5" />Ya no necesitas contarlos.
            </p>
          ) : (
            <div className="flex gap-1.5 mt-1.5 flex-wrap">
              {Array.from({ length: p.max }, (_, i) => {
                const usado = i < p.gastados;
                return (
                  <button
                    key={i}
                    disabled={readOnly}
                    onClick={() => onChange(usado ? devolver(play, p.key) : gastar(play, p.key, p.max))}
                    title={usado ? "Devolver un uso" : "Gastar un uso"}
                    className="w-5 h-5 rounded-full transition-colors disabled:cursor-default"
                    style={{
                      background: usado ? "transparent" : "var(--color-bronze)",
                      border: `2px solid var(--color-bronze${usado ? "-deep" : ""})`,
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
      ))}

      {refs.length > 0 && (
        <p className="font-ui text-[12px]" style={{ color: "var(--color-muted)" }}>
          {refs.map((r) => `${r.name} ${r.value}`).join(" · ")}
        </p>
      )}
    </div>
  );
}
