"use client";
import { useState } from "react";
import { usePartyLocation } from "@/lib/usePartyLocation";
import { useAtlas, regionsOf, poisOf } from "@/lib/useAtlas";
import { useTownMaps } from "@/lib/useTownMaps";
import { useGameClock } from "@/lib/useGameClock";
import { momentFromGameMin } from "@/lib/gameClock";
import { weatherFor, ambientLine } from "@/lib/weather";
import { useClues } from "@/lib/useClues";
import { useLugares } from "@/lib/useLugares";
import { useSitio } from "@/lib/useSitio";
import { indexar, nodoDelJugador, salidasDe, puedeIr } from "@/lib/nodos";
import { idPoi, poiDeNodo, alAireLibre } from "@/data/lugares";
import ClockWidget from "@/components/ClockWidget";
import ShopSection from "@/components/lugar/ShopSection";
import PosadaSection from "@/components/lugar/PosadaSection";
import NpcSection from "@/components/lugar/NpcSection";
import TablonSection from "@/components/lugar/TablonSection";
import SaberRoll from "@/components/lugar/SaberRoll";
import ClimaEfectos from "@/components/lugar/ClimaEfectos";
import Salidas from "@/components/lugar/Salidas";

export default function LugarPage() {
  const { location, ready } = usePartyLocation();
  const { atlas } = useAtlas();
  const { nodos, ready: nodosReady } = useLugares();
  const { sitio, ready: sitioReady, mover } = useSitio();
  const { townMap } = useTownMaps();
  const { nowGameMin } = useGameClock();
  const { clues } = useClues();
  const [yendo, setYendo] = useState<string | null>(null);

  if (!ready || !nodosReady || !sitioReady) {
    return <main className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center"><p className="pulse font-ui text-[13px]" style={{ color: "var(--color-muted)" }}>Cargando…</p></main>;
  }

  const region = location ? regionsOf(atlas, location.continent).find((r) => r.slug === location.regionSlug) : undefined;

  // El ANCLA es donde el DM ha plantado al grupo; el SITIO es donde se ha ido
  // este jugador por su cuenta. Sin sitio propio se está en el ancla, que es lo
  // que hace que quien no se haya movido nunca vea exactamente lo de siempre.
  const index = indexar(nodos);
  const ancla = location ? idPoi(location.poiName) : null;
  const nodo = nodoDelJugador(sitio, ancla, index);

  // De camino: sin ubicación, o el POI del ancla no está en el atlas.
  if (!nodo) {
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

  // El POI del que cuelga este nodo. Una franja del bosque no cuelga de
  // ninguno: ahí no hay tienda, ni posada, ni tablón, ni tirada de saber.
  const poiName = poiDeNodo(nodo.id);
  const poi = poiName && location
    ? poisOf(atlas, location.continent, location.regionSlug).find((p) => p.name === poiName)
    : undefined;
  const enElPueblo = nodo.id === idPoi(poiName ?? "");

  const moment = momentFromGameMin(nowGameMin);
  const weather = weatherFor(location?.continent ?? "Tal'Dorei", location?.regionSlug ?? "", region?.name, moment);
  const rumores = clues
    .filter((c) => c.rumor && !c.discovered && (!c.lugar || c.lugar === poiName))
    .map((c) => c.texto);
  const rumorLine = rumores.length
    ? `\n[Rumores que puedes dejar caer con naturalidad si la conversación lo permite, sin insistir: ${rumores.map((r) => `"${r}"`).join("; ")}.]`
    : "";
  // El ambiente que lee la IA lleva DÓNDE estás, no solo qué tiempo hace: el
  // tabernero y el sepulturero no hablan igual, y el prompt del PNJ no tiene
  // por qué repetir el sitio en el que está puesto.
  const ambient = `${ambientLine(weather, moment.season)}\n[Estáis en: ${nodo.nombre}. ${nodo.blurb}]${rumorLine}`;

  // La imagen del nodo: la del pueblo la sigue poniendo TOWN_MAPS (ya existía);
  // la de un sitio concreto la pone el DM en el grafo.
  const img = nodo.imagen ?? (enElPueblo && poiName ? townMap(poiName) : undefined);

  async function ir(id: string) {
    if (yendo || !nodo) return;
    // La misma regla que vigila el gate, aplicada antes de moverse: sin arista
    // no se va. Es filtro de interfaz, no puerta — moverse solo escribe en la
    // ficha propia y el grafo entero ya viaja en el bundle.
    if (!puedeIr(nodo.id, id, index)) return;
    setYendo(id);
    // Volver al pueblo es volver al ancla: se borra el sitio propio en vez de
    // fijarlo, para que el DM pueda seguir moviendo al grupo sin que el jugador
    // se quede clavado en un pueblo que ya abandonaron.
    await mover(id === ancla ? null : id, ancla);
    setYendo(null);
  }

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <p className="eyebrow mb-2">
        {region ? `${region.name} · ${location?.continent}` : location?.continent}
        {!enElPueblo && poiName ? ` · ${poiName}` : ""}
      </p>
      <h1 className="font-display text-3xl md:text-4xl font-extrabold gold-text mb-2">
        <i className={`fas ${nodo.icono} mr-3`} style={{ color: "var(--color-bronze)" }} />{nodo.nombre}
      </h1>
      <p className="font-body text-[15px] leading-relaxed mb-4" style={{ color: "var(--color-warm)" }}>{nodo.blurb}</p>

      {/* El clima solo donde se ve el cielo. En la taberna sobra. */}
      {alAireLibre(nodo.id) && (
        <>
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 mb-5 font-ui text-[12px]"
            style={{ color: "var(--color-warm)", border: "1px solid var(--color-line)", background: "var(--color-night)" }}>
            <i className={`fas ${weather.icon}`} style={{ color: "var(--color-bronze)" }} />
            <span className="font-semibold">{weather.condition}</span>
            <span style={{ color: "var(--color-dim)" }}>· {weather.temp} · {moment.season}</span>
          </div>
          <ClimaEfectos weather={weather} />
        </>
      )}

      {img && <img src={img} alt={nodo.nombre} loading="lazy" className="w-full rounded-xl border border-[var(--color-line)] mb-2" />}

      <Salidas desde={nodo.id} salidas={salidasDe(nodo, index)} onIr={ir} yendo={yendo} />

      {/* Tienda, posada, tablón y saber siguen colgando del PUEBLO: no se han
          repartido por sub-lugares en esta tanda, y meterlos en la taberna sin
          decidirlo dejaría media plaza vacía sin avisar. */}
      {enElPueblo && poiName && location && (
        <>
          <ShopSection poiName={poiName} ambient={ambient} />
          <PosadaSection posada={!!poi?.services?.posada} />
        </>
      )}

      <NpcSection nodo={nodo} ambient={ambient} />

      {enElPueblo && poiName && location && (
        <>
          {poi?.services?.tablon && <TablonSection poiName={poiName} />}
          <SaberRoll poiName={poiName} regionSlug={location.regionSlug} continent={location.continent} />
        </>
      )}
    </main>
  );
}
