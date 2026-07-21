"use client";
import { useState } from "react";
import type { Deity } from "@/data/pantheon";

// Ficha de un dios. Plegada enseña lo que sabría cualquiera de vista —nombre,
// epíteto, esfera—; desplegada, todo lo que el libro de un templo diría de él.
export default function DeityCard({ deity, accent }: { deity: Deity; accent: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="panel-raised p-4" style={{ borderLeft: `3px solid ${accent}` }}>
      <button onClick={() => setOpen((v) => !v)} className="w-full text-left">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-display font-extrabold text-[16px]" style={{ color: "var(--color-parch)" }}>{deity.name}</p>
            <p className="font-ui text-[12px] italic" style={{ color: accent }}>{deity.epithet}</p>
          </div>
          <i className={`fas fa-chevron-${open ? "up" : "down"} text-[11px] mt-1 shrink-0`} style={{ color: "var(--color-dim)" }} />
        </div>
        <div className="flex items-center gap-2 flex-wrap mt-2">
          <span className="font-ui text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: accent, border: `1px solid ${accent}` }}>{deity.alignment}</span>
          <span className="font-ui text-[11px]" style={{ color: "var(--color-muted)" }}>{deity.province}</span>
        </div>
      </button>

      {open && (
        <div className="mt-3 pt-3 space-y-3" style={{ borderTop: "1px solid var(--color-line)" }}>
          <p className="prose-lore !text-[14px] !mb-0">{deity.blurb}</p>

          <Dato label="Dominios">{deity.domains.join(" · ")}</Dato>
          <Dato label="Símbolo sagrado">{deity.symbol}</Dato>
          {deity.holyDay && <Dato label="Día santo">{deity.holyDay.name} — {deity.holyDay.date}</Dato>}
          {deity.patron && <Dato label="Patrón de brujo">{deity.patron}</Dato>}

          <div>
            <p className="font-ui text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: "var(--color-dim)" }}>Preceptos</p>
            <ul className="space-y-1">
              {deity.commandments.map((c) => (
                <li key={c} className="prose-lore !text-[14px] !mb-0 flex gap-2">
                  <span style={{ color: accent }}>•</span>{c}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function Dato({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-ui text-[10px] font-bold uppercase tracking-wide mb-0.5" style={{ color: "var(--color-dim)" }}>{label}</p>
      <p className="font-ui text-[13px]" style={{ color: "var(--color-warm)" }}>{children}</p>
    </div>
  );
}
