"use client";
import { useMemo } from "react";
import { usePartyLocation } from "@/lib/usePartyLocation";
import { useAtlas, poisPlanos, regionesPlanas } from "@/lib/useAtlas";
import { useLugares } from "@/lib/useLugares";
import { useSitio } from "@/lib/useSitio";
import { indexar, nodoDelJugador, ubicacionDeNodo } from "@/lib/nodos";
import { idPoi } from "@/data/lugares";
import { REGION_DEL_BOSQUE } from "@/data/bosque";

/**
 * DÓNDE ESTOY YO. Una sola respuesta, para toda la app.
 *
 * ⚠️ **Existe por un fallo real, y merece la pena contarlo.** La posición pasó a
 * ser por jugador, pero `PartyLocationWidget` —el pin de la barra de arriba, en
 * TODAS las páginas— seguía pintando `party_location`, que es **el ancla del
 * grupo**. Un jugador al que el DM había movido a Syngorn veía «Byroden» arriba,
 * con un pin de ubicación y enlazando a `/lugar`… y al entrar estaba en Syngorn.
 * La barra y la pantalla decían cosas distintas sobre dónde estaba.
 *
 * La causa de fondo no era el widget: era que **la resolución de «dónde estoy»
 * vivía dentro de `/lugar`**, así que cualquier otro sitio que quisiera saberlo
 * tenía que volver a calcularlo — o inventárselo, que es lo que pasó. Aquí se
 * calcula UNA vez y la usan los dos.
 *
 * El DM no tiene ficha, así que no tiene `sitio`: para él cae en el ancla del
 * grupo, que es exactamente lo que quiere ver.
 */
export function useMiUbicacion() {
  const { location } = usePartyLocation();
  const { atlas } = useAtlas();
  const { nodos, ready: nodosReady } = useLugares();
  const { sitio, desfase, ready: sitioReady, mover, viajar } = useSitio();

  const index = useMemo(() => indexar(nodos), [nodos]);
  const ancla = location ? idPoi(location.poiName) : null;
  const nodo = nodoDelJugador(sitio, ancla, index);

  // Se cae al ancla si el nodo no se puede situar en el atlas: es lo peor que
  // debería pasar, y sigue siendo un sitio conocido.
  const ubicacion = useMemo(
    () => (nodo
      ? ubicacionDeNodo(nodo.id, poisPlanos(atlas), regionesPlanas(atlas), REGION_DEL_BOSQUE) ?? location
      : location),
    [nodo, atlas, location],
  );

  return {
    /** El ancla del GRUPO. Solo para lo que de verdad hable del grupo. */
    location,
    ancla,
    /** El nodo donde estoy: pueblo, sub-lugar o franja. */
    nodo,
    /** Continente, región y pueblo resueltos en el atlas. */
    ubicacion,
    /** ¿Estoy en la plaza del pueblo, y no dentro de un sitio ni en el bosque? */
    enElPueblo: !!nodo && !!ubicacion?.poiName && nodo.id === idPoi(ubicacion.poiName),
    index,
    nodos,
    atlas,
    sitio,
    desfase,
    mover,
    viajar,
    ready: nodosReady && sitioReady,
  };
}
