"use client";
import type { Poi } from "@/data/pois";

// Cada fase C–F sustituirá el cuerpo de su tarjeta. Hoy: placeholder.
export default function ServiceSections({ services }: { services?: Poi["services"] }) {
  if (!services) return null;
  const cards: { show: boolean; icon: string; title: string; fase: string; detail: string }[] = [
    { show: !!services.tablon, icon: "fa-scroll", title: "Tablón de misiones", fase: "Fase F", detail: "Encargos disponibles" },
  ].filter((c) => c.show);
  if (cards.length === 0) return null;
  return (
    <div className="grid sm:grid-cols-2 gap-3 mt-6">
      {cards.map((c) => (
        <div key={c.title} className="panel-raised p-4">
          <p className="font-display font-extrabold text-[15px] mb-1" style={{ color: "var(--color-parch)" }}>
            <i className={`fas ${c.icon} mr-2`} style={{ color: "var(--color-bronze)" }} />{c.title}
          </p>
          <p className="font-ui text-[12px]" style={{ color: "var(--color-warm)" }}>{c.detail}</p>
          <p className="font-ui text-[10px] mt-2" style={{ color: "var(--color-dim)" }}>Próximamente ({c.fase})</p>
        </div>
      ))}
    </div>
  );
}
