"use client";
import type { SaberEntry } from "@/data/saber";
import { lockReason } from "@/lib/saber";

// Una tarjeta de saber: lo que sabes, o el motivo por el que no. El punto de
// color es el del LUGAR al que pertenece (lo pasa el bloque padre).
export default function SaberCard({
  entry, open, accent, isDm, revealed, onToggle,
}: {
  entry: SaberEntry;
  open: boolean;
  accent: string;
  isDm: boolean;
  revealed: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="panel-raised p-4" style={{ borderLeft: `3px solid ${accent}` }}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-ui text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: "var(--color-dim)" }}>
            {entry.topic}
          </p>
          <p className="font-display font-extrabold text-[15px]" style={{ color: "var(--color-parch)" }}>
            {entry.title}
          </p>
        </div>
        {isDm && (
          <button
            onClick={onToggle}
            title={revealed ? "Ocultar al grupo" : "Revelar al grupo"}
            className="btn-ghost !py-1 !px-2 text-[11px] shrink-0"
            style={{ color: revealed ? "var(--color-primitivo)" : "var(--color-dim)" }}
          >
            <i className={`fas ${revealed ? "fa-eye" : "fa-eye-slash"} mr-1`} />
            {revealed ? "Visible" : "Oculto"}
          </button>
        )}
      </div>
      {open ? (
        <p className="prose-lore !text-[14px] !mb-0 mt-2 whitespace-pre-wrap">{entry.text}</p>
      ) : (
        <p className="font-ui text-[12px] italic mt-2 flex items-start gap-1.5" style={{ color: "var(--color-dim)" }}>
          <i className="fas fa-lock mt-0.5" />
          {lockReason(entry)}
        </p>
      )}
    </div>
  );
}
