"use client";
import type { SaberEntry, SaberPlace as Place } from "@/data/saber";
import { CATEGORIES, PLACE_ACCENT, PLACE_ICON } from "@/data/saber";
import { knows, type SaberCtx } from "@/lib/saber";
import SaberCategory from "./SaberCategory";

// Bloque de un LUGAR, teñido con su color. Si no sabes nada de esta tierra, el
// bloque sale igual pero sin tarjetas: un candado con el título puesto ya
// spoilea, así que solo se dice CUÁNTO falta, no el qué.
export default function SaberPlace({
  place, entries, ctx, open, onOpenChange, revealed, onToggle, onRevealMany, onHideMany,
}: {
  place: Place;
  entries: SaberEntry[];
  ctx: SaberCtx;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  revealed: string[];
  onToggle: (id: string) => void;
  onRevealMany: (ids: string[]) => void;
  onHideMany: (ids: string[]) => void;
}) {
  const accent = PLACE_ACCENT[place];
  const sabidas = entries.filter((e) => knows(e, ctx)).length;
  const listadas = entries.filter((e) => ctx.isDm || knows(e, ctx));
  const ids = entries.map((e) => e.id);
  const vacio = listadas.length === 0;

  return (
    <div className="mb-6 panel p-5" style={{ borderTop: `2px solid ${accent}` }}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button onClick={() => onOpenChange(!open)} className="flex items-center gap-3 min-w-0">
          <i className={`fas ${PLACE_ICON[place]}`} style={{ color: accent }} />
          <span className="font-display text-lg font-extrabold" style={{ color: "var(--color-parch)" }}>{place}</span>
          <span className="font-ui text-[12px]" style={{ color: "var(--color-dim)" }}>
            sabes {sabidas} de {entries.length}
          </span>
          <i className={`fas fa-chevron-${open ? "up" : "down"} text-[11px]`} style={{ color: "var(--color-dim)" }} />
        </button>
        {ctx.isDm && (
          <div className="flex gap-2">
            <button onClick={() => onRevealMany(ids)} className="btn-ghost !py-0.5 !px-2 text-[10px]">
              <i className="fas fa-eye mr-1" />Revelar el bloque
            </button>
            <button onClick={() => onHideMany(ids)} className="btn-ghost !py-0.5 !px-2 text-[10px]">
              <i className="fas fa-eye-slash mr-1" />Ocultarlo
            </button>
          </div>
        )}
      </div>

      {open && (
        <div className="mt-4">
          {vacio ? (
            <p className="font-ui text-[12px] italic" style={{ color: "var(--color-dim)" }}>
              <i className="fas fa-lock mr-1.5" />
              De estas tierras no sabes nada todavía · {entries.length} cosas por descubrir
            </p>
          ) : (
            CATEGORIES.map((c) => {
              const suyas = listadas.filter((e) => e.category === c);
              if (!suyas.length) return null;
              return (
                <SaberCategory
                  key={c}
                  category={c}
                  entries={suyas}
                  ctx={ctx}
                  accent={accent}
                  revealed={revealed}
                  onToggle={onToggle}
                  onRevealMany={onRevealMany}
                  onHideMany={onHideMany}
                  defaultOpen
                />
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
