"use client";

import type { Species } from "@/data/species";
import { REGIONS } from "@/data/species";
import OptionRail, { type RailOption } from "@/components/crear/OptionRail";
import ArtPanel from "@/components/crear/ArtPanel";

// Escena 0 — Especie: acordeón por región | retrato | detalle + linaje.
// El acordeón se queda (36 especies en 7 regiones) pero más grande y legible.
// El retrato se reserva aunque public/species esté vacío hoy: va a haber arte.
export default function SpeciesScene({
  options,
  species,
  selected,
  lineage,
  onPick,
  onLineage,
}: {
  options: RailOption[];
  species?: Species;
  selected: string | null;
  lineage: string | null;
  onPick: (slug: string) => void;
  onLineage: (name: string) => void;
}) {
  const region = species ? REGIONS.find((r) => r.key === species.region)?.label : null;

  return (
    <div className="scene-3col">
      <OptionRail
        title="Especies de Exandria"
        options={options}
        selected={selected}
        onPick={onPick}
        searchPlaceholder="Buscar especie…"
      />

      <ArtPanel src={species?.image ?? null} alt={species?.name ?? null} />

      <div className="scene-detail">
        {!species ? (
          <p className="font-ui text-[13px]" style={{ color: "var(--color-dim)" }}>
            Elige una especie en la lista.
          </p>
        ) : (
          <>
            <p className="eyebrow mb-1">{region}{species.homebrew ? " · a criterio del DM" : ""}</p>
            <h2 className="font-display text-3xl font-extrabold mb-1" style={{ color: "var(--color-bronze-bright)" }}>
              {species.name}
            </h2>
            <p className="font-ui text-[13px] italic mb-3" style={{ color: "var(--color-muted)" }}>{species.tagline}</p>
            <p className="font-ui text-[14px] leading-relaxed mb-3" style={{ color: "var(--color-warm)" }}>{species.blurb}</p>

            <p className="eyebrow mb-1">Origen</p>
            <p className="font-ui text-[13px] leading-relaxed mb-4" style={{ color: "var(--color-muted)" }}>{species.origin}</p>

            <div className="flex gap-6 mb-4">
              <div><p className="eyebrow !text-[9px]">Tamaño</p><p className="font-display font-extrabold" style={{ color: "var(--color-parch)" }}>{species.size}</p></div>
              <div><p className="eyebrow !text-[9px]">Velocidad</p><p className="font-display font-extrabold" style={{ color: "var(--color-parch)" }}>{species.speed} m</p></div>
            </div>

            <p className="eyebrow mb-1.5">Rasgos</p>
            <ul className="space-y-1 mb-4">
              {species.traits.map((t) => (
                <li key={t} className="font-ui text-[13px] leading-snug" style={{ color: "var(--color-warm)" }}>
                  <span style={{ color: "var(--color-bronze)" }}>◆ </span>{t}
                </li>
              ))}
            </ul>

            {species.lineages && (
              <>
                <p className="eyebrow mb-1.5">Linaje *</p>
                {species.lineages.map((l) => (
                  <button
                    key={l.name}
                    type="button"
                    className={`pick-row${lineage === l.name ? " sel" : ""}`}
                    onClick={() => onLineage(l.name)}
                    aria-pressed={lineage === l.name}
                  >
                    <span className="pick-row-name">{l.name}{l.homebrew ? " · DM" : ""}</span>
                    <span className="pick-row-sub">{l.perk}</span>
                  </button>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
