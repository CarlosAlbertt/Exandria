"use client";
import { turnoDe, alternarRecurso, mover, movRestante, type Recurso } from "@/lib/turno";
import type { PlayState } from "@/lib/recursos";

// Economía del turno de combate: acción, adicional, reacción (chapas pulsables)
// y movimiento (contador en metros). Mismo contrato que EstadoVivo/PozosClase.
const RECURSOS: { key: Recurso; label: string; icon: string }[] = [
  { key: "accion", label: "Acción", icon: "bolt" },
  { key: "adicional", label: "Adicional", icon: "wand-sparkles" },
  { key: "reaccion", label: "Reacción", icon: "reply" },
];

export default function EconomiaTurno({
  play, velocidad, onChange, readOnly = false,
}: {
  play: PlayState;
  velocidad: number;
  onChange: (next: PlayState) => void;
  readOnly?: boolean;
}) {
  const t = turnoDe(play);
  const restante = movRestante(play, velocidad);

  return (
    <div className="mb-4">
      <p className="font-ui text-[12px] font-bold mb-1.5" style={{ color: "var(--color-parch)" }}>Turno</p>
      <div className="flex gap-1.5 flex-wrap mb-2">
        {RECURSOS.map((r) => {
          const gastada = t[r.key];
          return (
            <button
              key={r.key} disabled={readOnly}
              onClick={() => onChange(alternarRecurso(play, r.key))}
              title={gastada ? "Gastada — toca para recuperar" : "Libre — toca para gastar"}
              className="font-ui text-[11px] font-bold px-2.5 py-1 rounded-full transition-colors disabled:cursor-default flex items-center gap-1.5"
              style={{
                color: gastada ? "var(--color-dim)" : "var(--color-ink)",
                background: gastada ? "transparent" : "var(--color-primitivo)",
                border: `1px solid var(--color-${gastada ? "line" : "primitivo"})`,
              }}
            >
              <i className={`fas fa-${r.icon}`} />{r.label}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-2">
        <span className="font-ui text-[12px]" style={{ color: "var(--color-warm)" }}>
          <i className="fas fa-shoe-prints mr-1.5" style={{ color: "var(--color-primitivo)" }} />
          Movimiento: <strong style={{ color: "var(--color-parch)" }}>{restante}</strong> / {velocidad} m
        </span>
        {!readOnly && (
          <span className="flex gap-1">
            <button className="btn-ghost !py-0.5 !px-2 text-[12px]" onClick={() => onChange(mover(play, 1.5, velocidad))} title="Mover 1,5 m">−1,5</button>
            <button className="btn-ghost !py-0.5 !px-2 text-[12px]" onClick={() => onChange(mover(play, -1.5, velocidad))} title="Deshacer 1,5 m">+1,5</button>
          </span>
        )}
      </div>
    </div>
  );
}
