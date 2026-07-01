"use client";

import Link from "next/link";
import { REGIONS } from "@/data/taldorei";
import { useRegions } from "@/lib/useRegions";
import { useRole } from "@/components/SessionProvider";

// Lista de regiones del lore, filtrada por lo que el grupo conoce/exploró.
export default function ReinoRegions() {
  const role = useRole();
  const { states } = useRegions();
  const isDM = role === "dm";
  const visible = REGIONS.filter((r) => isDM || states[r.slug]?.known);

  return (
    <section className="mb-20">
      <div className="flex items-center justify-between mb-8">
        <h2 className="font-display text-2xl font-bold flex items-center gap-3" style={{ color: "var(--color-parch)" }}>
          <i className="fas fa-compass text-[var(--color-bronze)]" /> {isDM ? "Las ocho regiones" : "Regiones conocidas"}
        </h2>
        <Link href="/mapa" className="btn-ghost !py-2 !px-4 text-[12px]">Ver en el mapa →</Link>
      </div>

      {visible.length === 0 ? (
        <div className="panel p-8 text-center">
          <p className="prose-lore !text-[15px]" style={{ color: "var(--color-muted)" }}>
            Aún no conocéis ninguna región. Tu DM las irá revelando conforme avance la campaña.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {visible.map((r) => {
            const explored = isDM ? true : !!states[r.slug]?.explored;
            return (
              <div key={r.slug} className="panel p-6" style={{ borderColor: "var(--color-line)" }}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ background: r.accent, boxShadow: `0 0 10px ${r.accent}` }} />
                  <h3 className="font-display text-lg font-bold" style={{ color: r.accent }}>{r.name}</h3>
                  {!explored && <span className="font-ui text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: "var(--color-dim)", border: "1px solid var(--color-line)" }}>SIN EXPLORAR</span>}
                </div>
                <p className="font-ui text-[11px] font-bold uppercase tracking-wide mb-3" style={{ color: "var(--color-dim)" }}>
                  <i className="fas fa-chess-rook mr-1.5" />{r.capital} · {r.feature}
                </p>
                {explored ? (
                  <p className="prose-lore !text-[15px] !mb-0">{r.blurb}</p>
                ) : (
                  <p className="prose-lore !text-[15px] !mb-0 italic" style={{ color: "var(--color-muted)" }}>Tierra conocida de oídas. Explórala para desvelar su historia.</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
