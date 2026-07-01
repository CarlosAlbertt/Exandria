"use client";

import { useState } from "react";
import Link from "next/link";
import { REGIONS, MAPS } from "@/data/taldorei";
import { useRegions } from "@/lib/useRegions";
import { useRole } from "@/components/SessionProvider";

// Aspecto del mapa de Tal'Dorei (2550x3300) para que los pines cuadren.
const MAP_RATIO = "2550 / 3300";

export default function MapaPage() {
  const role = useRole();
  const { states, ready } = useRegions();
  const isDM = role === "dm";
  const [lightbox, setLightbox] = useState<string | null>(null);

  const visible = REGIONS.filter((r) => isDM || states[r.slug]?.known);
  const [active, setActive] = useState<string>(REGIONS[0].slug);
  const region = REGIONS.find((r) => r.slug === active) ?? null;
  const activeState = region ? states[region.slug] : undefined;
  const activeKnown = isDM || !!activeState?.known;
  const activeExplored = isDM || !!activeState?.explored;

  return (
    <main className="max-w-6xl mx-auto px-6 py-12">
      <header className="text-center mb-8">
        <p className="eyebrow mb-3">Atlas {isDM ? "· vista DM" : "interactivo"}</p>
        <h1 className="font-display text-4xl md:text-5xl font-extrabold gold-text">El mapa de Tal'Dorei</h1>
        <p className="prose-lore !text-[15px] max-w-xl mx-auto mt-4" style={{ color: "var(--color-muted)" }}>
          {isDM ? "Ves todo el continente y el estado de cada región. Gestiona la exploración en el Panel DM." : "Solo aparecen las tierras que tu grupo conoce. Explora para revelar el resto."}
        </p>
      </header>

      <div className="grid lg:grid-cols-[1fr_340px] gap-6">
        {/* MAPA */}
        <div className="panel relative overflow-hidden rounded-xl" style={{ aspectRatio: MAP_RATIO, backgroundImage: `url('${MAPS.taldorei}')`, backgroundSize: "cover", backgroundPosition: "center" }}>
          <div className="absolute inset-0" style={{ boxShadow: "inset 0 0 90px 20px rgba(7,10,14,0.55)" }} />

          {visible.map((r) => {
            const st = states[r.slug];
            const explored = isDM ? !!st?.explored : !!st?.explored;
            const on = active === r.slug;
            return (
              <button key={r.slug} onClick={() => setActive(r.slug)} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${r.map.x}%`, top: `${r.map.y}%` }} aria-label={r.name}>
                <span className="block rounded-full transition-all" style={{
                  width: on ? 22 : 15, height: on ? 22 : 15,
                  background: explored ? r.accent : "rgba(20,25,32,0.9)",
                  boxShadow: `0 0 0 3px rgba(0,0,0,0.55), 0 0 ${on ? 24 : 12}px ${explored ? r.accent : "rgba(0,0,0,0.4)"}`,
                  border: `2px solid ${explored ? "rgba(255,255,255,0.7)" : "var(--color-dim)"}`,
                }} />
                <span className="absolute left-1/2 -translate-x-1/2 mt-1.5 whitespace-nowrap font-ui text-[11px] font-bold px-2 py-0.5 rounded transition-opacity"
                  style={{ background: "rgba(7,10,14,0.9)", color: on ? "var(--color-bronze-bright)" : "var(--color-warm)", opacity: on ? 1 : 0, borderBottom: `2px solid ${r.accent}` }}>
                  {r.name}{!explored && " · sin explorar"}
                </span>
              </button>
            );
          })}

          {ready && visible.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-center px-6">
              <p className="prose-lore !text-[15px] px-6 py-4 rounded-lg" style={{ color: "var(--color-warm)", background: "rgba(7,10,14,0.7)" }}>El mapa aún está por descubrir. Tu DM revelará las tierras a medida que avancéis.</p>
            </div>
          )}
        </div>

        {/* PANEL */}
        <aside className="panel p-6 h-fit lg:sticky lg:top-24">
          {region && activeKnown ? (
            <>
              {/* Miniatura del mapa de la región (si explorada / DM) */}
              {activeExplored ? (
                <button onClick={() => setLightbox(region.image)} className="block w-full mb-4 rounded-lg overflow-hidden group relative" style={{ aspectRatio: "4 / 3", border: "1px solid var(--color-line)" }}>
                  <img src={region.image} alt={`Mapa de ${region.name}`} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  <span className="absolute bottom-2 right-2 font-ui text-[10px] font-bold px-2 py-1 rounded" style={{ background: "rgba(7,10,14,0.8)", color: "var(--color-bronze-bright)" }}>
                    <i className="fas fa-expand mr-1" />Ampliar
                  </span>
                </button>
              ) : (
                <div className="w-full mb-4 rounded-lg flex items-center justify-center" style={{ aspectRatio: "4 / 3", border: "1px dashed var(--color-line)", background: "rgba(0,0,0,0.3)" }}>
                  <span className="font-ui text-[12px]" style={{ color: "var(--color-dim)" }}><i className="fas fa-lock mr-1.5" />Mapa por revelar</span>
                </div>
              )}

              <span className="inline-block w-3 h-3 rounded-full mb-2" style={{ background: region.accent, boxShadow: `0 0 12px ${region.accent}` }} />
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h2 className="font-display text-2xl font-bold" style={{ color: region.accent }}>{region.name}</h2>
                {!activeExplored && <span className="font-ui text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: "var(--color-dim)", border: "1px solid var(--color-line)" }}>SIN EXPLORAR</span>}
              </div>
              <p className="font-ui text-[11px] font-bold uppercase tracking-wide mb-4" style={{ color: "var(--color-dim)" }}>
                <i className="fas fa-chess-rook mr-1.5" />{region.capital} · {region.feature}
              </p>
              <p className="prose-lore !text-[15px]">{activeExplored ? region.blurb : "Conoces el nombre de esta tierra, pero aún no la has pisado. Explórala para desvelar su mapa y sus secretos."}</p>
            </>
          ) : (
            <p className="prose-lore !text-[15px]" style={{ color: "var(--color-muted)" }}>Selecciona una región conocida en el mapa.</p>
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

      {/* LIGHTBOX mapa región */}
      {lightbox && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/85" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="Mapa de región" className="max-w-full max-h-full rounded-lg" style={{ border: "1px solid var(--color-gold-line)" }} />
          <button className="fixed top-5 right-5 btn-ghost !py-2 !px-4 text-[12px]" onClick={() => setLightbox(null)}><i className="fas fa-xmark mr-1.5" />Cerrar</button>
        </div>
      )}
    </main>
  );
}
