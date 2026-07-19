"use client";
import { usePartyLocation } from "@/lib/usePartyLocation";
import { useAtlas, regionsOf, poisOf } from "@/lib/useAtlas";
import { useTownMaps } from "@/lib/useTownMaps";
import { POI_ICON, POI_COLOR } from "@/data/pois";
import ClockWidget from "@/components/ClockWidget";
import ServiceSections from "@/components/lugar/ServiceSections";

export default function LugarPage() {
  const { location, ready } = usePartyLocation();
  const { atlas } = useAtlas();
  const { townMap } = useTownMaps();

  if (!ready) {
    return <main className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center"><p className="pulse font-ui text-[13px]" style={{ color: "var(--color-muted)" }}>Cargando…</p></main>;
  }

  const region = location ? regionsOf(atlas, location.continent).find((r) => r.slug === location.regionSlug) : undefined;
  const poi = location && region ? poisOf(atlas, location.continent, location.regionSlug).find((p) => p.name === location.poiName) : undefined;

  // De camino: sin ubicación o POI no encontrado en el atlas.
  if (!location || !poi) {
    return (
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center">
        <i className="fas fa-route text-4xl mb-4" style={{ color: "var(--color-dim)" }} />
        <h1 className="font-display text-3xl font-extrabold gold-text mb-2">De camino…</h1>
        <p className="font-ui text-[14px] mb-6" style={{ color: "var(--color-muted)" }}>
          {region ? <>El grupo viaja por <span style={{ color: "var(--color-bronze)" }}>{region.name}</span>.</> : "El grupo está de viaje, sin un lugar fijo."}
        </p>
        <div className="flex justify-center"><ClockWidget /></div>
      </main>
    );
  }

  const townImg = townMap(poi.name);

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <p className="eyebrow mb-2">{region ? `${region.name} · ${location.continent}` : location.continent}</p>
      <h1 className="font-display text-3xl md:text-4xl font-extrabold gold-text mb-2">
        <i className={`fas ${POI_ICON[poi.type]} mr-3`} style={{ color: POI_COLOR[poi.type] }} />{poi.name}
      </h1>
      <p className="font-body text-[15px] leading-relaxed mb-5" style={{ color: "var(--color-warm)" }}>{poi.blurb}</p>

      {townImg && (
        <img src={townImg} alt={poi.name} loading="lazy" className="w-full rounded-xl border border-[var(--color-line)] mb-2" />
      )}

      <ServiceSections services={poi.services} />
    </main>
  );
}
