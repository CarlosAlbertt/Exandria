"use client";
import { useState } from "react";
import type { SaberEntry } from "@/data/saber";
import { knows, type SaberCtx } from "@/lib/saber";
import SaberCard from "./SaberCard";

// Subgrupo plegable dentro de un lugar. El DM tiene aquí el revelado en BLOQUE:
// actúa sobre las entradas de esta categoría EN ESTE LUGAR, no en todo el mundo.
export default function SaberCategory({
  category, entries, ctx, accent, revealed, onToggle, onRevealMany, onHideMany, defaultOpen = false,
}: {
  category: string;
  entries: SaberEntry[];
  ctx: SaberCtx;
  accent: string;
  revealed: string[];
  onToggle: (id: string) => void;
  onRevealMany: (ids: string[]) => void;
  onHideMany: (ids: string[]) => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const sabidas = entries.filter((e) => knows(e, ctx)).length;
  const ids = entries.map((e) => e.id);
  const todasVisibles = ids.every((id) => revealed.includes(id));

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 font-ui text-[12px] font-bold uppercase tracking-wide"
          style={{ color: accent }}
        >
          <i className={`fas fa-chevron-${open ? "down" : "right"} text-[10px]`} />
          {category}
          <span className="font-normal normal-case" style={{ color: "var(--color-dim)" }}>
            {sabidas}/{entries.length}
          </span>
        </button>
        {ctx.isDm && (
          <button
            onClick={() => (todasVisibles ? onHideMany(ids) : onRevealMany(ids))}
            className="btn-ghost !py-0.5 !px-2 text-[10px]"
          >
            <i className={`fas ${todasVisibles ? "fa-eye-slash" : "fa-eye"} mr-1`} />
            {todasVisibles ? "Ocultar todo" : "Revelar todo"}
          </button>
        )}
      </div>

      {open && (
        <div className="grid sm:grid-cols-2 gap-3 mt-3">
          {entries.map((e) => (
            <SaberCard
              key={e.id}
              entry={e}
              open={knows(e, ctx)}
              accent={accent}
              isDm={ctx.isDm}
              revealed={revealed.includes(e.id)}
              onToggle={() => onToggle(e.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
