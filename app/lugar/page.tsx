"use client";
import { usePartyLocation } from "@/lib/usePartyLocation";
import { useAtlas, regionsOf, poisOf } from "@/lib/useAtlas";
import { useTownMaps } from "@/lib/useTownMaps";
import { useGameClock } from "@/lib/useGameClock";
import { momentFromGameMin } from "@/lib/gameClock";
import { weatherFor, ambientLine } from "@/lib/weather";
import { useClues } from "@/lib/useClues";
import { POI_ICON, POI_COLOR } from "@/data/pois";
import ClockWidget from "@/components/ClockWidget";
import ShopSection from "@/components/lugar/ShopSection";
import PosadaSection from "@/components/lugar/PosadaSection";
import NpcSection from "@/components/lugar/NpcSection";
import TablonSection from "@/components/lugar/TablonSection";
import SaberRoll from "@/components/lugar/SaberRoll";
import ClimaEfectos from "@/components/lugar/ClimaEfectos";

export default function LugarPage() {
  const { location, ready } = usePartyLocation();
  const { atlas } = useAtlas();
  const { townMap } = useTownMaps();
  const { nowGameMin } = useGameClock();
  const { clues } = useClues();

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
  const moment = momentFromGameMin(nowGameMin);
  const weather = weatherFor(location.continent, location.regionSlug, region?.name, moment);
  // Rumores por sembrar (pistas marcadas como rumor y aún no descubiertas): se
  // pasan a los NPCs IA para que los dejen caer con naturalidad. Filtramos a
  // los del lugar actual o sin lugar concreto.
  const rumores = clues
    .filter((c) => c.rumor && !c.discovered && (!c.lugar || c.lugar === poi.name))
    .map((c) => c.texto);
  const rumorLine = rumores.length
    ? `\n[Rumores que puedes dejar caer con naturalidad si la conversación lo permite, sin insistir: ${rumores.map((r) => `"${r}"`).join("; ")}.]`
    : "";
  const ambient = ambientLine(weather, moment.season) + rumorLine;

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <p className="eyebrow mb-2">{region ? `${region.name} · ${location.continent}` : location.continent}</p>
      <h1 className="font-display text-3xl md:text-4xl font-extrabold gold-text mb-2">
        <i className={`fas ${POI_ICON[poi.type]} mr-3`} style={{ color: POI_COLOR[poi.type] }} />{poi.name}
      </h1>
      <p className="font-body text-[15px] leading-relaxed mb-4" style={{ color: "var(--color-warm)" }}>{poi.blurb}</p>

      <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 mb-5 font-ui text-[12px]"
        style={{ color: "var(--color-warm)", border: "1px solid var(--color-line)", background: "var(--color-night)" }}>
        <i className={`fas ${weather.icon}`} style={{ color: "var(--color-bronze)" }} />
        <span className="font-semibold">{weather.condition}</span>
        <span style={{ color: "var(--color-dim)" }}>· {weather.temp} · {moment.season}</span>
      </div>

      <ClimaEfectos weather={weather} />

      {townImg && (
        <img src={townImg} alt={poi.name} loading="lazy" className="w-full rounded-xl border border-[var(--color-line)] mb-2" />
      )}

      <ShopSection poiName={poi.name} ambient={ambient} />
      <PosadaSection posada={!!poi.services?.posada} />
      <NpcSection poiName={poi.name} ambient={ambient} />
      {poi.services?.tablon && <TablonSection poiName={poi.name} />}
      <SaberRoll poiName={poi.name} regionSlug={location.regionSlug} continent={location.continent} />
    </main>
  );
}
