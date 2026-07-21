"use client";
import { useMemo, useState } from "react";
import { PRIME_DEITIES, BETRAYER_GODS, LESSER_IDOLS, type Deity, type DeitySide } from "@/data/pantheon";
import DeityCard from "./DeityCard";

const inputCls = "bg-[var(--color-night)] rounded-lg px-3 py-1.5 font-ui text-[13px] outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)] transition-colors max-w-xs";

// Los tres bandos, cada uno con su color: quién defendió el mundo, quién lo
// vendió, y quién nunca llegó a tener trono.
const BANDOS: { side: DeitySide; title: string; accent: string; icon: string; blurb: string; deities: Deity[] }[] = [
  {
    side: "prime",
    title: "Deidades Primarias",
    accent: "var(--color-divino)",
    icon: "fa-sun",
    blurb: "Los dioses que se pusieron delante de los mortales cuando los primordiales quisieron borrarlos. Ganaron la Calamidad y se marcharon del mundo por su propia mano.",
    deities: PRIME_DEITIES,
  },
  {
    side: "betrayer",
    title: "Dioses Traidores",
    accent: "var(--color-ember)",
    icon: "fa-skull",
    blurb: "Los que calcularon que el negocio estaba del lado de los titanes. Están desterrados, no muertos, y sus cultos siguen encontrando quien los escuche.",
    deities: BETRAYER_GODS,
  },
  {
    side: "idol",
    title: "Ídolos Menores",
    accent: "var(--color-violet)",
    icon: "fa-hand-sparkles",
    blurb: "Entidades sin trono en el panteón: archifeéricos, señores demonio, cosas viejas que duermen. No son dioses, pero conceden poder al que sabe pedirlo.",
    deities: LESSER_IDOLS,
  },
];

export default function PanteonBrowser() {
  const [q, setQ] = useState("");
  const [side, setSide] = useState<DeitySide | "all">("all");

  const bloques = useMemo(() => {
    const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    const needle = norm(q.trim());
    return BANDOS
      .filter((b) => side === "all" || b.side === side)
      .map((b) => ({
        ...b,
        deities: needle
          ? b.deities.filter((d) => norm(`${d.name} ${d.epithet} ${d.province}`).includes(needle))
          : b.deities,
      }))
      .filter((b) => b.deities.length > 0);
  }, [q, side]);

  const total = bloques.reduce((n, b) => n + b.deities.length, 0);

  return (
    <>
      <div className="flex items-center gap-3 flex-wrap mb-8">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre, epíteto o esfera…"
          className={inputCls}
        />
        {([["all", "Todos"], ["prime", "Primarias"], ["betrayer", "Traidores"], ["idol", "Ídolos"]] as const).map(([v, label]) => (
          <button
            key={v}
            onClick={() => setSide(v as DeitySide | "all")}
            className="btn-ghost !py-1 !px-2.5 text-[11px]"
            style={side === v ? { color: "var(--color-bronze-bright)", borderColor: "var(--color-bronze)" } : undefined}
          >
            {label}
          </button>
        ))}
        <span className="font-ui text-[12px]" style={{ color: "var(--color-dim)" }}>{total} de 32</span>
      </div>

      {bloques.length === 0 && (
        <p className="font-ui text-[13px] italic" style={{ color: "var(--color-dim)" }}>
          Ningún dios responde a ese nombre.
        </p>
      )}

      {bloques.map((b) => (
        <section key={b.side} className="mb-12">
          <h2 className="font-display text-xl font-extrabold flex items-center gap-3 mb-2" style={{ color: b.accent }}>
            <i className={`fas ${b.icon}`} /> {b.title}
            <span className="font-ui text-[12px] font-normal" style={{ color: "var(--color-dim)" }}>{b.deities.length}</span>
          </h2>
          <p className="prose-lore !text-[14px] mb-5 max-w-2xl">{b.blurb}</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {b.deities.map((d) => <DeityCard key={d.slug} deity={d} accent={b.accent} />)}
          </div>
        </section>
      ))}
    </>
  );
}
