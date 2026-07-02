"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { REGIONS, MAPS } from "@/data/taldorei";
import { WORLD_POIS, WORLD_SLUG, WORLD_ICON, WORLD_COLOR, CONTINENT_VIEW, type WorldPoi } from "@/data/world";
import { useRegions } from "@/lib/useRegions";
import { usePois } from "@/lib/usePois";
import { useRole } from "@/components/SessionProvider";
import RegionExplore from "@/components/RegionExplore";

// Aspecto del mapa de Exandria (2560x1707) para que los pines cuadren.
const MAP_RATIO = "2560 / 1707";

type Sel = { kind: "poi"; poi: WorldPoi } | { kind: "region"; slug: string } | null;

export default function MapaPage() {
  const role = useRole();
  const { states } = useRegions();
  const { states: poiStates, keyOf } = usePois();
  const isDM = role === "dm";

  const [focus, setFocus] = useState<string | null>(null); // continente enfocado (null = mundo)
  const [sel, setSel] = useState<Sel>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [exploreSlug, setExploreSlug] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (fullscreen) setFullscreen(false);
      else if (focus) { setFocus(null); setSel(null); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen, focus]);

  // --- helpers de descubrimiento ---
  const continentPins = WORLD_POIS.filter((p) => p.type === "continente");
  const pinForField = (field: string) => continentPins.find((p) => p.continent === field);
  const revealedByPlayers = (name: string) => !!poiStates[keyOf(WORLD_SLUG, name)]?.revealed;
  const isRevealed = (name: string) => isDM || revealedByPlayers(name);
  const continentDiscovered = (field: string) => { const cp = pinForField(field); return cp ? isRevealed(cp.name) : true; };

  // --- zoom ---
  const view = focus ? CONTINENT_VIEW[focus] : null;
  const S = view ? view.scale : 1;
  const invScale = 1 / S;
  const layerTransform = view ? `translate(${50 - S * view.cx}%, ${50 - S * view.cy}%) scale(${S})` : "none";

  const focusLabel = focus ? (pinForField(focus)?.name ?? focus) : null;
  const selRegionSlug = sel?.kind === "region" ? sel.slug : null;

  const openContinent = (field: string) => { setFocus(field); setSel(null); };
  const backToWorld = () => { setFocus(null); setSel(null); };

  // --- pines a dibujar según el nivel ---
  const worldPins = [
    ...continentPins.filter((cp) => continentDiscovered(cp.continent)),
    ...WORLD_POIS.filter((p) => p.continent === "Mares"),
  ];
  const continentPois = focus && focus !== "Tal'Dorei"
    ? WORLD_POIS.filter((p) => p.continent === focus && p.type !== "continente" && isRevealed(p.name))
    : [];
  const taldoreiRegions = REGIONS.filter((r) => isDM || states[r.slug]?.known);

  // Info de la región de Tal'Dorei seleccionada
  const selRegion = REGIONS.find((r) => r.slug === selRegionSlug) ?? null;
  const selRegionState = selRegion ? states[selRegion.slug] : undefined;
  const selRegionExplored = isDM || !!selRegionState?.explored;

  function renderWorldPoi(p: WorldPoi) {
    const isCont = p.type === "continente";
    const big = isCont;
    const alwaysLabel = isCont || p.type === "region" || p.type === "capital";
    const color = WORLD_COLOR[p.type];
    const st = poiStates[keyOf(WORLD_SLUG, p.name)];
    const selected = sel?.kind === "poi" && sel.poi.name === p.name;
    const onClick = isCont ? () => openContinent(p.continent) : () => setSel({ kind: "poi", poi: p });
    return (
      <button key={p.name} onClick={onClick} className="absolute -translate-x-1/2 -translate-y-1/2 group z-10"
        style={{ left: `${st?.x ?? p.x}%`, top: `${st?.y ?? p.y}%` }} title={isCont ? `Abrir ${p.name}` : p.name}>
        <span className="flex flex-col items-center" style={{ transform: `scale(${invScale})` }}>
          <span className="flex items-center justify-center rounded-full transition-transform group-hover:scale-110"
            style={{ width: big ? 24 : 15, height: big ? 24 : 15, background: "rgba(7,10,14,0.82)", border: `2px solid ${color}`, boxShadow: `0 0 ${selected ? 16 : 8}px ${color}` }}>
            <i className={`fas ${WORLD_ICON[p.type]}`} style={{ color, fontSize: big ? 12 : 9 }} />
          </span>
          <span className={`mt-1 whitespace-nowrap font-ui font-bold px-1.5 py-0.5 rounded transition-opacity ${alwaysLabel || selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
            style={{ fontSize: big ? 12 : 10, background: "rgba(7,10,14,0.9)", color: alwaysLabel ? "var(--color-bronze-bright)" : "var(--color-warm)" }}>
            {p.name}{isCont ? " ›" : ""}
          </span>
        </span>
      </button>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-12">
      <header className="text-center mb-8">
        <p className="eyebrow mb-3">Atlas {isDM ? "· vista DM" : "interactivo"}</p>
        <h1 className="font-display text-4xl md:text-5xl font-extrabold gold-text">{focus ? focusLabel : "El mapa de Exandria"}</h1>
        <p className="prose-lore !text-[15px] max-w-xl mx-auto mt-4" style={{ color: "var(--color-muted)" }}>
          {focus
            ? "Clic en una región o ciudad para ver su información. Pulsa «Volver a Exandria» para alejar."
            : isDM ? "Ves todo el mundo. Clic en un continente para explorarlo. Revela tierras en el Panel DM." : "Clic en un continente descubierto para adentrarte. La niebla oculta lo que aún no habéis hallado."}
        </p>
      </header>

      {fullscreen && (
        <div className="fixed inset-0 z-[80]" style={{ background: "rgba(7,10,14,0.96)" }} onClick={() => setFullscreen(false)} />
      )}

      <div className="grid lg:grid-cols-[1fr_340px] gap-6">
        {/* MAPA */}
        <div
          className={fullscreen
            ? "panel fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[90] overflow-hidden rounded-xl"
            : "panel relative overflow-hidden rounded-xl"}
          style={{ aspectRatio: MAP_RATIO, ...(fullscreen ? { width: "min(98vw, calc(95vh * 2560 / 1707))", maxHeight: "95vh" } : {}) }}>

          {/* Capa transformable: imagen + niebla + pines (zoom conjunto) */}
          <div className="absolute inset-0 transition-transform duration-500 ease-out"
            style={{ backgroundImage: `url('${MAPS.taldorei}')`, backgroundSize: "cover", backgroundPosition: "center", transform: layerTransform, transformOrigin: "0 0" }}>
            <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: "inset 0 0 90px 20px rgba(7,10,14,0.55)" }} />

            {/* NIEBLA sobre continentes no revelados a los jugadores. Los jugadores
                la ven opaca; el DM la ve translúcida ("oculto") y clic-a-través. */}
            {!focus && Object.entries(CONTINENT_VIEW).map(([field, v]) => {
              const cp = pinForField(field);
              if (!cp || revealedByPlayers(cp.name)) return null;
              return (
                <div key={`fog-${field}`} className={`absolute flex items-center justify-center ${isDM ? "pointer-events-none" : ""}`}
                  style={{ left: `${v.box.x}%`, top: `${v.box.y}%`, width: `${v.box.w}%`, height: `${v.box.h}%`,
                    background: isDM
                      ? "radial-gradient(ellipse at center, rgba(30,36,46,0.5), rgba(12,15,20,0.35) 70%)"
                      : "radial-gradient(ellipse at center, rgba(30,36,46,0.94), rgba(12,15,20,0.8) 70%)",
                    backdropFilter: `blur(${isDM ? 2 : 6}px)`, WebkitBackdropFilter: `blur(${isDM ? 2 : 6}px)`,
                    borderRadius: "40%", border: isDM ? "1px dashed rgba(255,255,255,0.15)" : "none" }}>
                  <span className="font-display font-bold flex flex-col items-center" style={{ color: "var(--color-dim)", fontSize: isDM ? 12 : 22, letterSpacing: "0.2em", transform: `scale(${invScale})` }}>
                    {isDM ? <><i className="fas fa-eye-slash mb-1" />oculto</> : "?"}
                  </span>
                </div>
              );
            })}

            {/* Pines del MUNDO (continentes + océanos) */}
            {!focus && worldPins.map(renderWorldPoi)}

            {/* Pines del CONTINENTE enfocado */}
            {focus && focus !== "Tal'Dorei" && continentPois.map(renderWorldPoi)}

            {/* Tal'Dorei enfocado: sus 8 regiones */}
            {focus === "Tal'Dorei" && taldoreiRegions.map((r) => {
              const st = states[r.slug];
              const explored = !!st?.explored;
              const on = selRegionSlug === r.slug;
              return (
                <button key={r.slug} onClick={() => setSel({ kind: "region", slug: r.slug })}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group z-10" style={{ left: `${st?.pin_x ?? r.map.x}%`, top: `${st?.pin_y ?? r.map.y}%` }} aria-label={r.name}>
                  <span className="flex flex-col items-center" style={{ transform: `scale(${invScale})` }}>
                    <span className="block rounded-full transition-all group-hover:scale-110" style={{
                      width: on ? 20 : 14, height: on ? 20 : 14,
                      background: explored ? r.accent : "rgba(20,25,32,0.9)",
                      boxShadow: `0 0 0 3px rgba(0,0,0,0.55), 0 0 ${on ? 20 : 10}px ${explored ? r.accent : "rgba(0,0,0,0.4)"}`,
                      border: `2px solid ${explored ? "rgba(255,255,255,0.7)" : "var(--color-dim)"}`,
                    }} />
                    <span className="mt-1 whitespace-nowrap font-ui text-[10px] font-bold px-1.5 py-0.5 rounded"
                      style={{ background: "rgba(7,10,14,0.9)", color: on ? "var(--color-bronze-bright)" : "var(--color-warm)", borderBottom: `2px solid ${r.accent}` }}>
                      {r.name}{!explored && " · sin explorar"}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Controles (fuera de la capa transformada) */}
          {focus && (
            <button onClick={backToWorld} className="absolute top-3 left-3 z-20 btn-ghost !py-1.5 !px-3 text-[12px]">
              <i className="fas fa-arrow-left mr-1.5" />Volver a Exandria
            </button>
          )}
          <button onClick={() => setFullscreen((f) => !f)} className="absolute top-3 right-3 z-20 btn-ghost !py-1.5 !px-3 text-[12px]" title={fullscreen ? "Salir (Esc)" : "Pantalla completa"}>
            <i className={`fas ${fullscreen ? "fa-compress" : "fa-expand"} mr-1.5`} />{fullscreen ? "Salir" : "Pantalla completa"}
          </button>
        </div>

        {/* PANEL LATERAL */}
        <aside className="panel p-6 h-fit lg:sticky lg:top-24">
          {sel?.kind === "region" && selRegion ? (
            <>
              {selRegionExplored ? (
                <button onClick={() => setExploreSlug(selRegion.slug)} className="block w-full mb-4 rounded-lg overflow-hidden group relative" style={{ aspectRatio: "4 / 3", border: "1px solid var(--color-line)" }}>
                  <img src={selRegion.image} alt={`Mapa de ${selRegion.name}`} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(7,10,14,0.55)" }}>
                    <span className="btn-gold !py-2 !px-4 text-[12px]"><i className="fas fa-map-location-dot mr-2" />Explorar la zona</span>
                  </span>
                </button>
              ) : (
                <div className="w-full mb-4 rounded-lg flex items-center justify-center" style={{ aspectRatio: "4 / 3", border: "1px dashed var(--color-line)", background: "rgba(0,0,0,0.3)" }}>
                  <span className="font-ui text-[12px]" style={{ color: "var(--color-dim)" }}><i className="fas fa-lock mr-1.5" />Mapa por revelar</span>
                </div>
              )}
              <span className="inline-block w-3 h-3 rounded-full mb-2" style={{ background: selRegion.accent, boxShadow: `0 0 12px ${selRegion.accent}` }} />
              <h2 className="font-display text-2xl font-bold mb-1" style={{ color: selRegion.accent }}>{selRegion.name}</h2>
              <p className="font-ui text-[11px] font-bold uppercase tracking-wide mb-4" style={{ color: "var(--color-dim)" }}>
                <i className="fas fa-chess-rook mr-1.5" />{selRegion.capital} · {selRegion.feature}
              </p>
              <p className="prose-lore !text-[15px]">{selRegionExplored ? selRegion.blurb : "Conoces el nombre de esta tierra, pero aún no la has pisado. Explórala para desvelar su mapa."}</p>
            </>
          ) : sel?.kind === "poi" ? (
            <>
              <p className="eyebrow mb-2" style={{ color: WORLD_COLOR[sel.poi.type] }}>
                <i className={`fas ${WORLD_ICON[sel.poi.type]} mr-1.5`} />{sel.poi.type}
              </p>
              <h2 className="font-display text-2xl font-bold mb-3" style={{ color: "var(--color-parch)" }}>{sel.poi.name}</h2>
              <p className="prose-lore !text-[15px]">{sel.poi.blurb}</p>
            </>
          ) : focus ? (
            <>
              <p className="eyebrow mb-2" style={{ color: "var(--color-gold)" }}><i className="fas fa-earth-americas mr-1.5" />Continente</p>
              <h2 className="font-display text-2xl font-bold mb-3" style={{ color: "var(--color-parch)" }}>{focusLabel}</h2>
              <p className="prose-lore !text-[15px] mb-4">{pinForField(focus)?.blurb}</p>
              <p className="eyebrow mb-3">{focus === "Tal'Dorei" ? "Regiones" : "Lugares"}</p>
              <div className="flex flex-wrap gap-2">
                {focus === "Tal'Dorei"
                  ? (taldoreiRegions.length ? taldoreiRegions.map((r) => (
                      <button key={r.slug} onClick={() => setSel({ kind: "region", slug: r.slug })} className="chip" data-on={selRegionSlug === r.slug}>{r.name}</button>
                    )) : <span className="text-sm italic" style={{ color: "var(--color-dim)" }}>Nada revelado todavía.</span>)
                  : (continentPois.length ? continentPois.map((p) => (
                      <button key={p.name} onClick={() => setSel({ kind: "poi", poi: p })} className="chip"><i className={`fas ${WORLD_ICON[p.type]} mr-1.5`} style={{ color: WORLD_COLOR[p.type] }} />{p.name}</button>
                    )) : <span className="text-sm italic" style={{ color: "var(--color-dim)" }}>Nada revelado todavía.</span>)}
              </div>
            </>
          ) : (
            <>
              <p className="eyebrow mb-2" style={{ color: "var(--color-gold)" }}><i className="fas fa-earth-americas mr-1.5" />Exandria</p>
              <h2 className="font-display text-2xl font-bold mb-3" style={{ color: "var(--color-parch)" }}>El mundo</h2>
              <p className="prose-lore !text-[15px] mb-4">Cinco masas de tierra bajo dos lunas. Clic en un continente para adentrarte en sus regiones y ciudades.</p>
              <p className="eyebrow mb-3">Continentes {isDM ? "" : "descubiertos"}</p>
              <div className="flex flex-wrap gap-2">
                {continentPins.filter((cp) => continentDiscovered(cp.continent)).map((cp) => (
                  <button key={cp.name} onClick={() => openContinent(cp.continent)} className="chip">{cp.name}</button>
                ))}
                {continentPins.every((cp) => !continentDiscovered(cp.continent)) && <span className="text-sm italic" style={{ color: "var(--color-dim)" }}>Ninguno todavía.</span>}
              </div>
            </>
          )}
          {isDM && <Link href="/dm" className="btn-ghost w-full !py-2 text-[12px] mt-6 inline-block text-center"><i className="fas fa-sliders mr-2" />Gestionar exploración</Link>}
        </aside>
      </div>

      {/* VISOR de región de Tal'Dorei con puntos de interés */}
      {exploreSlug && (() => {
        const r = REGIONS.find((x) => x.slug === exploreSlug)!;
        return <RegionExplore slug={r.slug} name={r.name} image={r.image} accent={r.accent} onClose={() => setExploreSlug(null)} />;
      })()}
    </main>
  );
}
