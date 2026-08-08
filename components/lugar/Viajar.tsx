"use client";
import { useState } from "react";
import { regionsOf, poisOf } from "@/lib/useAtlas";
import type { AtlasDefs } from "@/data/atlas";
import { destinosDesde, duracionDeViaje, type Destino } from "@/lib/viaje";
import { usePois } from "@/lib/usePois";
import { idPoi } from "@/data/lugares";

/**
 * Irse a otro pueblo.
 *
 * ⚠️ **Esto NO es una salida del grafo, y por eso no está en `Salidas`.** Las
 * puertas de «Adónde ir» son aristas: la taberna, el cementerio, el bosque. Un
 * viaje no tiene arista — su permiso es que **el DM haya revelado el pin en el
 * mapa**—, y mezclarlos habría dejado a `check-lugares` tratando media docena de
 * pueblos como salidas de Byroden y reconstruyendo el grafo con cada pin.
 *
 * Toda la decisión de a dónde se puede ir y qué cuesta vive en `lib/viaje.ts`,
 * donde el gate la mira. Aquí solo se pinta y se pregunta.
 */
export default function Viajar({
  desde, continente, anclaPoi, atlas, onViajar, ocupado,
}: {
  /** Dónde estás, **solo si estás en la plaza de un pueblo**. */
  desde: { poiName: string; regionSlug: string } | null;
  continente: string | null;
  /** El pueblo donde el DM ha plantado al grupo: la vuelta a casa. */
  anclaPoi: string | null;
  atlas: AtlasDefs;
  onViajar: (nodoId: string, minutos: number) => Promise<void> | void;
  ocupado: boolean;
}) {
  const { states, keyOf, ready } = usePois();
  const [pendiente, setPendiente] = useState<Destino | null>(null);
  const [yendo, setYendo] = useState(false);

  if (!desde || !continente) return null;

  const regiones = regionsOf(atlas, continente);
  const candidatos = regiones.flatMap((r) =>
    poisOf(atlas, continente, r.slug).map((p) => ({ name: p.name, regionSlug: r.slug })));

  // ⚠️ **Falla cerrado**: `poi_state` solo tiene fila para lo que el DM ha
  // tocado, así que sin fila no está revelado. Misma dirección de error que
  // `continenteDescubierto` — en una niebla el fallo va hacia el lado de
  // esconder. Mientras las filas cargan tampoco se revela nada, para no
  // enseñar un destino y quitarlo medio segundo después.
  const revelado = (regionSlug: string, poiName: string) =>
    ready && !!states[keyOf(regionSlug, poiName)]?.revealed;

  const destinos = destinosDesde({ desde, candidatos, regiones, revelado, anclaPoi });

  // ⚠️ **Sin destinos la sección SE PINTA IGUAL, y antes devolvía `null`.**
  // Ese null fue un error mío y se notó a la primera: el jugador no podía
  // distinguir «no hay sitios abiertos» de «esto no existe» de «está roto», y
  // se puso a buscar un botón que no estaba. Un vacío explicado es información;
  // un vacío invisible es un fallo aparente.
  if (destinos.length === 0) {
    return (
      <section>
        <div className="lug-sect"><span className="lug-cinta">Ponerse en camino</span></div>
        <p className="lug-note" style={{ marginTop: 0 }}>
          {ready
            ? "Nadie ha abierto camino a ningún otro sitio todavía. El DM los abre desde Panel DM › Mapa y pueblos, con el ojo de cada pueblo."
            : "Mirando qué caminos hay abiertos…"}
        </p>
      </section>
    );
  }

  async function ir(d: Destino) {
    if (yendo) return;
    setYendo(true);
    await onViajar(idPoi(d.poiName), d.minutos);
    setYendo(false);
    setPendiente(null);
  }

  return (
    <section>
      <div className="lug-sect"><span className="lug-cinta">Ponerse en camino</span></div>
      <div className="lug-grid">
        {destinos.map((d) => (
          <button key={d.poiName} className="lug-puerta" disabled={ocupado || yendo}
            onClick={() => setPendiente(d)}>
            <span className="lug-lacre">
              <i className={`fas ${d.esElGrupo ? "fa-users" : "fa-route"}`} />
            </span>
            <span className={`lug-camino${d.esElGrupo ? " is-grupo" : ""}`}>
              <i className="fas fa-hourglass-half" />
              {duracionDeViaje(d.minutos)} de camino
            </span>
            <span className="t">{d.poiName}</span>
            <span className="s">
              {d.esElGrupo ? "Donde está el grupo. Volver con ellos." : d.regionName}
            </span>
          </button>
        ))}
      </div>

      {/* Se pregunta antes de irse: dejar el pueblo donde está el grupo no es lo
          mismo que cruzar la plaza, y un toque de más en el móvil no debería
          mandarte a otra región. */}
      {pendiente && (
        <div className="lug-confirmar" role="alertdialog">
          <p>
            {pendiente.esElGrupo
              ? <>Volver con el grupo a <b>{pendiente.poiName}</b>. Son <b>{duracionDeViaje(pendiente.minutos)}</b> de camino.</>
              : <>Ir a <b>{pendiente.poiName}</b>, en {pendiente.regionName}. Son <b>{duracionDeViaje(pendiente.minutos)}</b> de camino, y te separas del grupo.</>}
          </p>
          <button className="si" onClick={() => void ir(pendiente)} disabled={yendo}>
            <i className={`fas ${yendo ? "fa-spinner fa-spin" : "fa-person-walking"} mr-2`} />
            {yendo ? "De camino…" : "En marcha"}
          </button>
          <button className="no" onClick={() => setPendiente(null)} disabled={yendo}>Mejor no</button>
        </div>
      )}
    </section>
  );
}
