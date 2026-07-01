"use client";

import { useState } from "react";
import Link from "next/link";
import { REGIONS } from "@/data/taldorei";
import { useRegions } from "@/lib/useRegions";
import { useRole } from "@/components/SessionProvider";

export default function MapaPage() {
  const role = useRole();
  const { states, ready } = useRegions();
  const isDM = role === "dm";

  // Visibilidad por rol: el DM lo ve todo; el jugador solo lo conocido.
  const visible = REGIONS.filter((r) => isDM || states[r.slug]?.known);
  const [active, setActive] = useState<string>(REGIONS[0].slug);
  const region = REGIONS.find((r) => r.slug === active) ?? null;
  const activeState = region ? states[region.slug] : undefined;
  const activeExplored = isDM ? true : !!activeState?.explored;

  return (
    <main className="max-w-6xl mx-auto px-6 py-12">
      <header className="text-center mb-8">
        <p className="eyebrow mb-3">Atlas {isDM ? "· vista DM" : "interactivo"}</p>
        <h1 className="font-display text-4xl md:text-5xl font-extrabold gold-text">El mapa de Tal'Dorei</h1>
        <p className="prose-lore !text-[15px] max-w-xl mx-auto mt-4" style={{ color: "var(--color-muted)" }}>
          {isDM ? "Ves todas las regiones y su estado. Gestiona la exploración en el Panel DM." : "Solo aparecen las tierras que tu grupo conoce. Explora para revelar el resto."}
        </p>
      </header>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="panel relative overflow-hidden rounded-xl" style={{ aspectRatio: "4 / 3", backgroundImage: "image-set(url('/mapa.jpg') 1x), radial-gradient(ellipse at 30% 30%, #16323a, #0c161c 70%)", backgroundSize: "cover", backgroundPosition: "center" }}>
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.12]" preserveAspectRatio="none" viewBox="0 0 100 100">
            {Array.from({ length: 9 }).map((_, i) => (<line key={`v${i}`} x1={(i + 1) * 10} y1="0" x2={(i + 1) * 10} y2="100" stroke="var(--color-arcane)" strokeWidth="0.15" />))}
            {Array.from({ length: 9 }).map((_, i) => (<line key={`h${i}`} x1="0" y1={(i + 1) * 10} x2="100" y2={(i + 1) * 10} stroke="var(--color-arcane)" strokeWidth="0.15" />))}
          </svg>

          {visible.map((r) => {
            const st = states[r.slug];
            const explored = isDM ? !!st?.explored : !!st?.explored;
            const on = active === r.slug;
            return (
              <button key={r.slug} onClick={() => setActive(r.slug)} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${r.map.x}%`, top: `${r.map.y}%` }} aria-label={r.name}>
                <span className="block rounded-full transition-all" style={{
                  width: on ? 20 : 14, height: on ? 20 : 14,
                  background: explored ? r.accent : "var(--color-dim)",
                  opacity: explored ? 1 : 0.6,
                  boxShadow: `0 0 0 3px rgba(0,0,0,0.4), 0 0 ${on ? 22 : 12}px ${explored ? r.accent : "transparent"}`,
                  border: "2px solid rgba(255,255,255,0.55)",
                }} />
                <span className="absolute left-1/2 -translate-x-1/2 mt-1.5 whitespace-nowrap font-ui text-[11px] font-bold px-2 py-0.5 rounded transition-opacity"
                  style={{ background: "rgba(7,10,14,0.85)", color: on ? "var(--color-bronze-bright)" : "var(--color-warm)", opacity: on ? 1 : 0, borderBottom: `2px solid ${r.accent}` }}>
                  {r.name}{!explored && " · sin explorar"}
                </span>
              </button>
            );
          })}

          {ready && visible.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-center px-6">
              <p className="prose-lore !text-[15px]" style={{ color: "var(--color-muted)" }}>El mapa aún está por descubrir. Tu DM revelará las tierras a medida que avancéis.</p>
            </div>
          )}
        </div>

        <aside className="panel p-6 h-fit lg:sticky lg:top-24">
          {region && (isDM || activeState?.known) ? (
            <>
              <span className="inline-block w-3 h-3 rounded-full mb-3" style={{ background: region.accent, boxShadow: `0 0 12px ${region.accent}` }} />
              <div className="flex items-center gap-2 mb-1">
                <h2 className="font-display text-2xl font-bold" style={{ color: region.accent }}>{region.name}</h2>
                {!activeExplored && <span className="font-ui text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: "var(--color-dim)", border: "1px solid var(--color-line)" }}>SIN EXPLORAR</span>}
              </div>
              <p className="font-ui text-[11px] font-bold uppercase tracking-wide mb-4" style={{ color: "var(--color-dim)" }}>
                <i className="fas fa-chess-rook mr-1.5" />{region.capital} · {region.feature}
              </p>
              {activeExplored ? (
                <p className="prose-lore !text-[15px]">{region.blurb}</p>
              ) : (
                <p className="prose-lore !text-[15px] italic" style={{ color: "var(--color-muted)" }}>
                  Conoces el nombre de esta tierra, pero aún no la has pisado. Explórala para desvelar sus secretos.
                </p>
              )}
            </>
          ) : (
            <p className="prose-lore !text-[15px]" style={{ color: "var(--color-muted)" }}>Selecciona una región conocida.</p>
          )}

          <div className="mt-6 pt-5 border-t border-[var(--color-line)]">
            <p className="eyebrow mb-3">Regiones {isDM ? "" : "conocidas"}</p>
            <div className="flex flex-wrap gap-2">
              {visible.map((r) => (
                <button key={r.slug} onClick={() => setActive(r.slug)} className="chip" data-on={active === r.slug}>{r.name}</button>
              ))}
              {visible.length === 0 && <span className="text-sm italic" style={{ color: "var(--color-dim)" }}>Ninguna todavía.</span>}
            </div>
          </div>
          {isDM && <Link href="/dm" className="btn-ghost w-full !py-2 text-[12px] mt-5 inline-block text-center"><i className="fas fa-sliders mr-2" />Gestionar exploración</Link>}
        </aside>
      </div>
    </main>
  );
}
