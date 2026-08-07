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
import { idPoi, poiDeNodo, alAireLibre, TEMAS } from "@/data/lugares";
import ClockWidget from "@/components/ClockWidget";
import ShopSection from "@/components/lugar/ShopSection";
import PosadaSection from "@/components/lugar/PosadaSection";
import NpcSection from "@/components/lugar/NpcSection";
import TablonSection from "@/components/lugar/TablonSection";
import SaberRoll from "@/components/lugar/SaberRoll";
import ClimaEfectos from "@/components/lugar/ClimaEfectos";
import Salidas from "@/components/lugar/Salidas";

/**
 * `/lugar` — LA HOJA. Referencia literal:
 * `docs/bocetos/2026-08-07-lugar-con-arte.html`.
 *
 * La app entera es oscura —la mesa— y esta pantalla es **una hoja de pergamino
 * clara puesta encima**, a sangre y a todo ancho. Costó seis bocetos: lo oscuro
 * salía «muy oscuro» y lo claro sin arte dentro salía «muy soso». La lección
 * que se pagó: **lo que hace bonita la pantalla es la ilustración, no el
 * marco.** Esto es solo el marco, y por eso la cabecera es del tamaño que es.
 *
 * ⚠️ **La maqueta no cambia por sitio: cambia la piel.** Byroden y Emon pintan
 * exactamente esto mismo; lo único que cambia es la clase `tema-*` del `<main>`,
 * de donde salen cielo, silueta, metal y acento. No metas condicionales por
 * tema aquí: si un sitio necesita otra maqueta, no era un tema.
 *
 * ⚠️ **Tienda, posada, tablón y saber se quedan en la mesa oscura**, debajo de
 * la hoja y con su estilo de siempre. No están rediseñados —esta tanda no los
 * toca— y meterlos dentro del pergamino los dejaría ilegibles: son paneles
 * oscuros con texto claro. Debajo, sobre el fondo de la app, se leen bien.
 */
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

  // La ilustración de cabecera: la del pueblo la sigue poniendo TOWN_MAPS (ya
  // existía); la de un sitio concreto la pone el DM en el grafo. Sin ninguna
  // queda el cielo del tema con su silueta, que es un sitio sin dibujar.
  const img = nodo.imagen ?? (enElPueblo && poiName ? townMap(poiName) : undefined);

  // La capitular se come la primera letra de la prosa, así que hay que
  // repartir el texto. Un blurb de una palabra no la lleva: la capitular
  // sola, con el párrafo vacío al lado, se lee como un fallo de maquetación.
  const prosa = nodo.blurb.trim();
  const conCapital = prosa.length > 20;
  const capital = conCapital ? prosa.slice(0, 1) : "";
  const restoProsa = conCapital ? prosa.slice(1) : prosa;

  // Y el título parte la inicial para pintarla en rojo de rúbrica.
  const nombre = nodo.nombre.trim() || "Aquí";
  const inicial = nombre.slice(0, 1);
  const restoNombre = nombre.slice(1);

  // La línea de debajo del título: qué es este sitio. En el pueblo, su tipo
  // del atlas; en un sub-lugar, de qué pueblo es; en el bosque, la región,
  // que no es de nadie.
  const queEs = enElPueblo ? (poi?.type ?? "Lugar") : (poiName ?? "Expansión Verdante");

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
    <main className={`tema-${nodo.tema}`}>
      {/* ---------------------- LA CABECERA A SANGRE ---------------------- */}
      <div className="lug-arte">
        {img ? (
          <img src={img} alt="" />
        ) : (
          <svg className="lug-sil" viewBox="0 0 1200 300" preserveAspectRatio="none" aria-hidden="true">
            <path d={TEMAS[nodo.tema].silueta} fill="currentColor" />
          </svg>
        )}
        {/* La bruma muere en el color de la hoja: es lo que cose el arte al
            papel en vez de dejar un corte recto contra el texto. */}
        <div className="lug-bruma" />
        <div className="lug-titulo">
          <p className="lug-rubrica">
            {region ? `${region.name} · ${location?.continent}` : location?.continent}
          </p>
          <h1 className="lug-h1"><span className="ini">{inicial}</span>{restoNombre}</h1>
          <p className="lug-sub">{queEs} · {moment.dateStr}</p>
        </div>
      </div>

      {/* -------------------------- LA HOJA ------------------------------- */}
      <div className="lug-hoja lug-vell">
        <div className="lug-cenefa" />
        <div className="lug-dentro">
          <div className="lug-caja">
            <p className="lug-prosa">
              {conCapital && <span className="lug-capital"><span className="letra">{capital}</span></span>}
              {restoProsa}
            </p>
            <div className="lug-aparte">
              <h3>De un vistazo</h3>
              {/* El clima solo donde se ve el cielo. En la taberna sobra. */}
              {alAireLibre(nodo.id) && (
                <div className="lug-dato">
                  <i className={`fas ${weather.icon}`} />
                  <span>{weather.condition} · {weather.temp} · {moment.season}</span>
                </div>
              )}
              <div className="lug-dato"><i className="fas fa-hourglass-half" /><span>{moment.dateStr}</span></div>
              <div className="lug-dato">
                <i className="fas fa-moon" />
                <span>{moment.moonPhase}{moment.holiday ? ` · ${moment.holiday}` : ""}</span>
              </div>
              <div className="lug-dato">
                <i className={`fas ${nodo.icono}`} />
                <span>{queEs}{region ? ` · ${region.name}` : ""}</span>
              </div>
            </div>
          </div>

          {alAireLibre(nodo.id) && <ClimaEfectos weather={weather} />}

          <Salidas desde={nodo.id} salidas={salidasDe(nodo, index)} onIr={ir} yendo={yendo} />

          <NpcSection nodo={nodo} ambient={ambient} />
        </div>
      </div>

      {/* ------------------- LA MESA, DEBAJO DE LA HOJA -------------------
          Tienda, posada, tablón y saber siguen colgando del PUEBLO: no se
          han repartido por sub-lugares, y meterlos en la taberna sin
          decidirlo dejaría media plaza vacía sin avisar. Y siguen con el
          estilo oscuro de la app, que es por lo que van AQUÍ y no dentro
          del pergamino: son paneles oscuros con texto claro. */}
      {enElPueblo && poiName && location && (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
          <p className="eyebrow mb-3">
            <i className="fas fa-store mr-2" style={{ color: "var(--color-bronze)" }} />
            Asuntos de {poiName}
          </p>
          <ShopSection poiName={poiName} ambient={ambient} />
          <PosadaSection posada={!!poi?.services?.posada} />
          {poi?.services?.tablon && <TablonSection poiName={poiName} />}
          <SaberRoll poiName={poiName} regionSlug={location.regionSlug} continent={location.continent} />
        </div>
      )}
    </main>
  );
}
