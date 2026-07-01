"use client";

import { useState } from "react";
import { REGIONS } from "@/data/taldorei";

export default function MapaPage() {
  const [active, setActive] = useState<string | null>(REGIONS[0].slug);
  const region = REGIONS.find((r) => r.slug === active) ?? null;

  return (
    <main className="max-w-6xl mx-auto px-6 py-12">
      <header className="text-center mb-8">
        <p className="eyebrow mb-3">Atlas interactivo</p>
        <h1 className="font-display text-4xl md:text-5xl font-extrabold gold-text">El mapa de Tal'Dorei</h1>
        <p className="prose-lore !text-[15px] max-w-xl mx-auto mt-4" style={{ color: "var(--color-muted)" }}>
          Pulsa cada enclave para conocer la región. <span style={{ color: "var(--color-dim)" }}>
          (Coloca tu imagen del mapa en <code className="font-ui">public/mapa.jpg</code> y se mostrará aquí.)</span>
        </p>
      </header>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        {/* LIENZO DEL MAPA */}
        <div
          className="panel relative overflow-hidden rounded-xl"
          style={{
            aspectRatio: "4 / 3",
            backgroundImage:
              "image-set(url('/mapa.jpg') 1x), radial-gradient(ellipse at 30% 30%, #16323a, #0c161c 70%)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* rejilla decorativa de carta */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.12]" preserveAspectRatio="none" viewBox="0 0 100 100">
            {Array.from({ length: 9 }).map((_, i) => (
              <line key={`v${i}`} x1={(i + 1) * 10} y1="0" x2={(i + 1) * 10} y2="100" stroke="var(--color-arcane)" strokeWidth="0.15" />
            ))}
            {Array.from({ length: 9 }).map((_, i) => (
              <line key={`h${i}`} x1="0" y1={(i + 1) * 10} x2="100" y2={(i + 1) * 10} stroke="var(--color-arcane)" strokeWidth="0.15" />
            ))}
          </svg>

          {/* PINS */}
          {REGIONS.map((r) => {
            const on = active === r.slug;
            return (
              <button
                key={r.slug}
                onClick={() => setActive(r.slug)}
                className="absolute -translate-x-1/2 -translate-y-1/2 group"
                style={{ left: `${r.map.x}%`, top: `${r.map.y}%` }}
                aria-label={r.name}
              >
                <span
                  className="block rounded-full transition-all"
                  style={{
                    width: on ? 20 : 14,
                    height: on ? 20 : 14,
                    background: r.accent,
                    boxShadow: `0 0 0 3px rgba(0,0,0,0.4), 0 0 ${on ? 22 : 12}px ${r.accent}`,
                    border: "2px solid rgba(255,255,255,0.55)",
                  }}
                />
                <span
                  className="absolute left-1/2 -translate-x-1/2 mt-1.5 whitespace-nowrap font-ui text-[11px] font-bold px-2 py-0.5 rounded transition-opacity"
                  style={{
                    background: "rgba(7,10,14,0.85)",
                    color: on ? "var(--color-bronze-bright)" : "var(--color-warm)",
                    opacity: on ? 1 : 0,
                    borderBottom: `2px solid ${r.accent}`,
                  }}
                >
                  {r.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* PANEL DE REGIÓN */}
        <aside className="panel p-6 h-fit lg:sticky lg:top-24">
          {region && (
            <>
              <span className="inline-block w-3 h-3 rounded-full mb-3" style={{ background: region.accent, boxShadow: `0 0 12px ${region.accent}` }} />
              <h2 className="font-display text-2xl font-bold mb-1" style={{ color: region.accent }}>{region.name}</h2>
              <p className="font-ui text-[11px] font-bold uppercase tracking-wide mb-4" style={{ color: "var(--color-dim)" }}>
                <i className="fas fa-chess-rook mr-1.5" />{region.capital} · {region.feature}
              </p>
              <p className="prose-lore !text-[15px]">{region.blurb}</p>
            </>
          )}

          <div className="mt-6 pt-5 border-t border-[var(--color-line)]">
            <p className="eyebrow mb-3">Saltar a región</p>
            <div className="flex flex-wrap gap-2">
              {REGIONS.map((r) => (
                <button key={r.slug} onClick={() => setActive(r.slug)} className="chip" data-on={active === r.slug}>
                  {r.name}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
