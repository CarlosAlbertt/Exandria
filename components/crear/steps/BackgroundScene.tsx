"use client";

import type { Background } from "@/data/backgrounds";
import { ABILITIES } from "@/data/rules";
import OptionRail, { type RailOption } from "@/components/crear/OptionRail";
import { CONTINENTS } from "@/data/world";
import { REGIONS } from "@/data/taldorei";
import { ALL_DEITIES } from "@/data/saber";

// Escena 2 — Trasfondo: lista | detalle. Sin panel de arte: backgrounds.ts no
// tiene campo `image` ni está previsto. Los 16 van en lista plana (no tienen
// grupo), así que OptionRail no muestra acordeón.
// Aquí se piden también ORIGEN y FE (saber por origen): de dónde eres marca lo
// que sabes del mundo de salida. Ambos opcionales; sin ellos, sabes lo básico.
// Van en este paso y no en una runa nueva para no tocar el gate de 6 pasos.
export default function BackgroundScene({
  options,
  bg,
  selected,
  onPick,
  originContinent,
  originRegion,
  deity,
  onOrigin,
}: {
  options: RailOption[];
  bg?: Background;
  selected: string | null;
  onPick: (slug: string) => void;
  originContinent: string | null;
  originRegion: string | null;
  deity: string | null;
  onOrigin: (patch: { originContinent?: string | null; originRegion?: string | null; deity?: string | null }) => void;
}) {
  const selectCls = "w-full bg-[var(--color-night)] rounded-lg px-3 py-2 font-ui text-[13px] outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)]";
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

        {/* ORIGEN Y FE — marcan lo que tu personaje sabe del mundo */}
        <div className="panel p-4 mt-4">
          <p className="eyebrow mb-1.5">Origen y fe <span style={{ color: "var(--color-dim)" }}>· opcional</span></p>
          <p className="font-ui text-[12px] mb-3" style={{ color: "var(--color-muted)" }}>
            De dónde eres y en qué crees deciden lo que sabes del mundo al empezar. El resto se descubre jugando.
          </p>

          <div className="grid sm:grid-cols-2 gap-2">
            <div>
              <label className="eyebrow !text-[9px] block mb-1">Continente de origen</label>
              <select value={originContinent ?? ""} className={selectCls} style={{ color: "var(--color-warm)" }}
                onChange={(e) => {
                  const v = e.target.value || null;
                  // Cambiar de continente invalida la subregión (solo Tal'Dorei tiene).
                  onOrigin({ originContinent: v, originRegion: v === "Tal'Dorei" ? originRegion : null });
                }}>
                <option value="">— sin definir —</option>
                {CONTINENTS.filter((c) => c !== "Mares").map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {originContinent === "Tal'Dorei" && (
              <div>
                <label className="eyebrow !text-[9px] block mb-1">Tu región</label>
                <select value={originRegion ?? ""} className={selectCls} style={{ color: "var(--color-warm)" }}
                  onChange={(e) => onOrigin({ originRegion: e.target.value || null })}>
                  <option value="">— sin definir —</option>
                  {REGIONS.map((r) => <option key={r.slug} value={r.slug}>{r.name}</option>)}
                </select>
              </div>
            )}

            <div>
              <label className="eyebrow !text-[9px] block mb-1">Deidad</label>
              <select value={deity ?? ""} className={selectCls} style={{ color: "var(--color-warm)" }}
                onChange={(e) => onOrigin({ deity: e.target.value || null })}>
                <option value="">— sin fe —</option>
                {ALL_DEITIES.map((d) => <option key={d.slug} value={d.slug}>{d.name} · {d.epithet}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
