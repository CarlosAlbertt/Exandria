"use client";
import { useState } from "react";
import { usePartyLocation } from "@/lib/usePartyLocation";
import { useAtlas, regionsOf, poisOf, poisPlanos, regionesPlanas } from "@/lib/useAtlas";
import { useTownMaps } from "@/lib/useTownMaps";
import { useRelojJugador } from "@/lib/useRelojJugador";
import { momentFromGameMin } from "@/lib/gameClock";
import { weatherFor, ambientLine } from "@/lib/weather";
import { useClues } from "@/lib/useClues";
import { useLugares } from "@/lib/useLugares";
import { useSitio } from "@/lib/useSitio";
import { indexar, nodoDelJugador, salidasDe, puedeIr, ubicacionDeNodo } from "@/lib/nodos";
import { idPoi, alAireLibre, TEMAS } from "@/data/lugares";
import { REGION_DEL_BOSQUE } from "@/data/bosque";
import ClockWidget from "@/components/ClockWidget";
import ShopSection from "@/components/lugar/ShopSection";
import PosadaSection from "@/components/lugar/PosadaSection";
import NpcSection from "@/components/lugar/NpcSection";
import TablonSection from "@/components/lugar/TablonSection";
import SaberRoll from "@/components/lugar/SaberRoll";
import ClimaEfectos from "@/components/lugar/ClimaEfectos";
import Salidas from "@/components/lugar/Salidas";
import Viajar from "@/components/lugar/Viajar";
import ErrorBoundary from "@/components/ErrorBoundary";
import { duracionDeViaje } from "@/lib/viaje";

/**
 * Una sección que se ha caído, dicha con nombre y con el mensaje.
 *
 * El resto del sitio sigue jugable. Y el mensaje se enseña porque hasta ahora un
 * throw solo existía en la consola del jugador: quien se lo encuentra es
 * exactamente quien no va a abrir las herramientas de desarrollo.
 */
function SeccionRota({ que, mensaje }: { que: string; mensaje: string }) {
  return (
    <p className="lug-note" style={{ borderLeftColor: "var(--acento)" }}>
      No se ha podido cargar {que}. El resto del sitio sigue funcionando.
      {mensaje ? <><br /><span style={{ fontFamily: "var(--font-body)", fontStyle: "italic" }}>{mensaje}</span></> : null}
    </p>
  );
}

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
  const { sitio, desfase, ready: sitioReady, mover, viajar } = useSitio();
  const { townMap } = useTownMaps();
  const { nowGameMin } = useRelojJugador();
  const { clues } = useClues();
  const [yendo, setYendo] = useState<string | null>(null);

  if (!ready || !nodosReady || !sitioReady) {
    return <main className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center"><p className="pulse font-ui text-[13px]" style={{ color: "var(--color-muted)" }}>Cargando…</p></main>;
  }

  // El ANCLA es donde el DM ha plantado al grupo; el SITIO es donde está este
  // jugador —porque se movió, o porque el DM lo puso ahí—. Sin sitio propio se
  // está en el ancla, que es lo que hace que quien no se haya movido nunca vea
  // exactamente lo de siempre.
  const index = indexar(nodos);
  const ancla = location ? idPoi(location.poiName) : null;
  const nodo = nodoDelJugador(sitio, ancla, index);

  // De camino: sin ubicación, o el POI del ancla no está en el atlas.
  if (!nodo) {
    const regionDelGrupo = location ? regionsOf(atlas, location.continent).find((r) => r.slug === location.regionSlug) : undefined;
    return (
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center">
        <i className="fas fa-route text-4xl mb-4" style={{ color: "var(--color-dim)" }} />
        <h1 className="font-display text-3xl font-extrabold gold-text mb-2">De camino…</h1>
        <p className="font-ui text-[14px] mb-6" style={{ color: "var(--color-muted)" }}>
          {regionDelGrupo ? <>El grupo viaja por <span style={{ color: "var(--color-bronze)" }}>{regionDelGrupo.name}</span>.</> : "El grupo está de viaje, sin un lugar fijo."}
        </p>
        <div className="flex justify-center"><ClockWidget /></div>
      </main>
    );
  }

  // ⚠️ **DÓNDE ESTÁ ESTE JUGADOR, RESUELTO — no heredado del grupo.**
  //
  // Antes el continente y la región salían de `location`, que es el ancla, y eso
  // valía mientras todos estuvieran en el mismo pueblo. En cuanto uno está en
  // Emon y otro en Byroden se rompen cuatro cosas a la vez y ninguna grita:
  // Byroden está en `peninsula-pleabruma` y Emon en `litoral-filofulgor`, así que
  // el de Emon vería el clima y la región de Pleabruma, y `poisOf` no
  // encontraría Emon — sin tienda, sin posada, sin tablón y sin tirada de saber.
  //
  // Se cae al ancla si no se puede resolver: es lo peor que debería pasar.
  const ubicacion = ubicacionDeNodo(nodo.id, poisPlanos(atlas), regionesPlanas(atlas), REGION_DEL_BOSQUE) ?? location;
  const region = ubicacion ? regionsOf(atlas, ubicacion.continent).find((r) => r.slug === ubicacion.regionSlug) : undefined;

  // El POI del que cuelga este nodo. Una franja del bosque no cuelga de
  // ninguno: ahí no hay tienda, ni posada, ni tablón, ni tirada de saber.
  const poiName = ubicacion?.poiName ?? null;
  const poi = poiName && ubicacion
    ? poisOf(atlas, ubicacion.continent, ubicacion.regionSlug).find((p) => p.name === poiName)
    : undefined;
  const enElPueblo = nodo.id === idPoi(poiName ?? "");

  const moment = momentFromGameMin(nowGameMin);
  const weather = weatherFor(ubicacion?.continent ?? "Tal'Dorei", ubicacion?.regionSlug ?? "", region?.name, moment);
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
            {/* ⚠️ `?.` y no acceso directo. `construirNodos` pone siempre un tema
                válido y `aplicarOverride` filtra el del DM, así que esto no
                debería poder fallar — pero `TEMAS[algo-raro]` sería `undefined` y
                `.silueta` **tumbaría la página entera**, y el tema acaba
                viniendo de un JSON de `app_config` escrito a mano. La cabecera
                sin silueta es un degradado; la página caída no es nada. */}
            <path d={TEMAS[nodo.tema]?.silueta ?? ""} fill="currentColor" />
          </svg>
        )}
        {/* La bruma muere en el color de la hoja: es lo que cose el arte al
            papel en vez de dejar un corte recto contra el texto. */}
        <div className="lug-bruma" />
        <div className="lug-titulo">
          <p className="lug-rubrica">
            {region ? `${region.name} · ${ubicacion?.continent}` : ubicacion?.continent}
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
              {/* El camino que llevas hecho por tu cuenta.
                  ⚠️ Se enseña como CAMINO ANDADO y no como una hora distinta, y
                  eso es deliberado: el desfase se guarda desde ya pero **el
                  reloj todavía no lo consume nadie**. Pintarlo como «vas 6 h 30
                  adelantado» mientras el reloj de la barra dice otra cosa sería
                  la app contradiciéndose a sí misma. */}
              {desfase > 0 && (
                <div className="lug-dato">
                  <i className="fas fa-person-walking" />
                  <span>{duracionDeViaje(desfase)} de camino por tu cuenta</span>
                </div>
              )}
            </div>
          </div>

          {alAireLibre(nodo.id) && <ClimaEfectos weather={weather} />}

          {/* ⚠️ Cada sección va en su propia red, y no es paranoia: estas cuatro
              leen datos que el DM escribe a mano (tiendas, PNJ, saber, el JSON
              de sitios), y **un throw en cualquiera dejaba la pantalla del
              jugador en blanco entera**. Aislada, se cae solo la sección y el
              resto del sitio sigue jugable. El mensaje se enseña a propósito:
              el error vivía únicamente en la consola del jugador, que es quien
              no la va a abrir nunca. */}
          <ErrorBoundary fallback={(m) => <SeccionRota que="las salidas" mensaje={m} />}>
            <Salidas desde={nodo.id} salidas={salidasDe(nodo, index)} onIr={ir} yendo={yendo} />
          </ErrorBoundary>

          {/* Viajar va APARTE de las salidas a propósito: no es una arista del
              grafo, es que el DM haya revelado el pin. Solo desde la plaza de un
              pueblo — de la taberna se sale primero y del bosque se vuelve
              andando por las franjas. */}
          <ErrorBoundary fallback={(m) => <SeccionRota que="ponerse en camino" mensaje={m} />}>
            <Viajar
              desde={enElPueblo && poiName && ubicacion ? { poiName, regionSlug: ubicacion.regionSlug } : null}
              continente={ubicacion?.continent ?? null}
              anclaPoi={location?.poiName ?? null}
              atlas={atlas}
              ocupado={yendo !== null}
              onViajar={(nodoId, minutos) => viajar(nodoId, ancla, minutos)}
            />
          </ErrorBoundary>

          <ErrorBoundary fallback={(m) => <SeccionRota que="la gente del lugar" mensaje={m} />}>
            <NpcSection nodo={nodo} ambient={ambient} />
          </ErrorBoundary>
        </div>
      </div>

      {/* ------------------- LA MESA, DEBAJO DE LA HOJA -------------------
          Tienda, posada, tablón y saber siguen colgando del PUEBLO: no se
          han repartido por sub-lugares, y meterlos en la taberna sin
          decidirlo dejaría media plaza vacía sin avisar. Y siguen con el
          estilo oscuro de la app, que es por lo que van AQUÍ y no dentro
          del pergamino: son paneles oscuros con texto claro. */}
      {enElPueblo && poiName && ubicacion && (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
          <p className="eyebrow mb-3">
            <i className="fas fa-store mr-2" style={{ color: "var(--color-bronze)" }} />
            Asuntos de {poiName}
          </p>
          <ErrorBoundary fallback={(m) => <SeccionRota que="las tiendas" mensaje={m} />}>
            <ShopSection poiName={poiName} ambient={ambient} />
          </ErrorBoundary>
          <PosadaSection posada={!!poi?.services?.posada} />
          {poi?.services?.tablon && (
            <ErrorBoundary fallback={(m) => <SeccionRota que="el tablón" mensaje={m} />}>
              <TablonSection poiName={poiName} />
            </ErrorBoundary>
          )}
          {/* La tirada de saber va con la región DONDE ESTÁS: el saber de
              Pleabruma no es el del Litoral, y con el ancla del grupo un jugador
              en Emon habría estado tirando por la región de sus compañeros. */}
          <ErrorBoundary fallback={(m) => <SeccionRota que="la tirada de saber" mensaje={m} />}>
            <SaberRoll poiName={poiName} regionSlug={ubicacion.regionSlug} continent={ubicacion.continent} />
          </ErrorBoundary>
        </div>
      )}
    </main>
  );
}
