"use client";

import type { Background } from "@/data/backgrounds";
import { ABILITIES } from "@/data/rules";
import OptionRail, { type RailOption } from "@/components/crear/OptionRail";

// Escena 2 — Trasfondo: lista | detalle. Sin panel de arte: backgrounds.ts no
// tiene campo `image` ni está previsto. Los 16 van en lista plana (no tienen
// grupo), así que OptionRail no muestra acordeón.
export default function BackgroundScene({
  options,
  bg,
  selected,
  onPick,
}: {
  options: RailOption[];
  bg?: Background;
  selected: string | null;
  onPick: (slug: string) => void;
}) {
  return (
    <div className="scene-2col">
      <OptionRail
        title="Trasfondos"
        options={options}
        selected={selected}
        onPick={onPick}
        searchPlaceholder="Buscar trasfondo…"
      />

      <div className="scene-detail">
        {!bg ? (
          <p className="font-ui text-[13px]" style={{ color: "var(--color-dim)" }}>
            Elige un trasfondo en la lista.
          </p>
        ) : (
          <>
            <h2 className="font-display text-3xl font-extrabold mb-2" style={{ color: "var(--color-bronze-bright)" }}>
              {bg.name}
            </h2>
            <p className="font-ui text-[14px] leading-relaxed mb-4" style={{ color: "var(--color-warm)" }}>{bg.blurb}</p>

            <div className="scene-boxes">
              <div className="panel p-4">
                <p className="eyebrow mb-1.5">Dote</p>
                <p className="font-ui text-[13px] mb-3" style={{ color: "var(--color-warm)" }}>{bg.feat}</p>
                <p className="eyebrow mb-1.5">Herramienta</p>
                <p className="font-ui text-[13px]" style={{ color: "var(--color-warm)" }}>{bg.tool}</p>
              </div>
              <div className="panel p-4">
                <p className="eyebrow mb-1.5">Pericias (fijas)</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {bg.skills.map((s) => <span key={s} className="chip" data-on>{s}</span>)}
                </div>
                <p className="eyebrow mb-1.5">Puedes repartir +3 entre</p>
                <div className="flex flex-wrap gap-2">
                  {bg.abilities.map((k) => (
                    <span key={k} className="chip">{ABILITIES.find((a) => a.key === k)?.name ?? k}</span>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
