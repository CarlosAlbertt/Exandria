"use client";
import Link from "next/link";
import { useMiUbicacion } from "@/lib/useMiUbicacion";
import { useRelojJugador } from "@/lib/useRelojJugador";
import { momentFromGameMin } from "@/lib/gameClock";
import { weatherFor, esDuro } from "@/lib/weather";
import { poiDeNodo } from "@/data/lugares";

/**
 * El pin de la barra de arriba: DÓNDE ESTÁS TÚ.
 *
 * ⚠️ **Pintaba el ancla del GRUPO, y era un fallo de verdad.** Con la posición
 * por jugador, a quien el DM había movido a Syngorn le seguía diciendo
 * «Byroden» —con un pin de ubicación y enlazando a `/lugar`— y al entrar estaba
 * en Syngorn. La barra y la pantalla se contradecían sobre dónde estaba.
 *
 * Ahora sale de `useMiUbicacion`, que es **la misma fuente que usa `/lugar`**: no
 * pueden discrepar porque no hay dos cálculos. Y el clima es el de la región
 * donde estás, no la del grupo — un jugador en Emon no ve el tiempo de Pleabruma.
 *
 * El DM no tiene ficha, así que cae en el ancla del grupo: justo lo que le sirve.
 */
export default function PartyLocationWidget() {
  const { nodo, ubicacion, location } = useMiUbicacion();
  const { nowGameMin } = useRelojJugador();

  if (!ubicacion) return null;

  const weather = weatherFor(ubicacion.continent, ubicacion.regionSlug, undefined, momentFromGameMin(nowGameMin));
  const duro = esDuro(weather);

  // Lo que se lee en la chapa. Dentro de un sub-lugar se enseña el SITIO, que es
  // dónde estás de verdad; el pueblo va en el title, que es donde cabe.
  const etiqueta = nodo?.nombre ?? ubicacion.poiName ?? "De camino";
  const poi = nodo ? poiDeNodo(nodo.id) : null;
  const conElGrupo = !!location && ubicacion.poiName === location.poiName;

  return (
    <Link href="/lugar"
      title={`${etiqueta}${poi && poi !== etiqueta ? ` · ${poi}` : ""}${conElGrupo ? "" : " · te has separado del grupo"} · ${weather.condition} (${weather.temp})${duro ? " · el tiempo aprieta" : ""}`}
      className="flex items-center gap-1.5 font-ui text-[12px] font-semibold px-2.5 py-1 rounded-full transition-colors"
      style={{
        // Separado del grupo: el pin cambia de color. Es la señal de que lo que
        // ves en pantalla no es lo que ven tus compañeros.
        color: conElGrupo ? "var(--color-bronze-bright)" : "var(--color-arcane-bright)",
        border: `1px solid color-mix(in srgb, ${conElGrupo ? "var(--color-bronze)" : "var(--color-arcane)"} 45%, transparent)`,
      }}>
      <i className={`fas ${conElGrupo ? "fa-location-dot" : "fa-person-walking-arrow-right"}`} />
      <span className="truncate max-w-[120px]">{etiqueta}</span>
      {/* Clima duro: el icono avisa en color de alarma. */}
      <i className={`fas ${weather.icon}`} style={{ color: duro ? "var(--color-ember)" : "var(--color-bronze)" }} />
    </Link>
  );
}
