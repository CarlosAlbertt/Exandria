"use client";
import { useEffect, useState } from "react";
import { useParty } from "@/lib/character";
import { useLiveSession } from "@/lib/useLiveSession";
import { usePartyLocation } from "@/lib/usePartyLocation";
import { useGameClock } from "@/lib/useGameClock";
import { momentFromGameMin } from "@/lib/gameClock";
import { useLugares } from "@/lib/useLugares";
import { usePois } from "@/lib/usePois";
import { useAtlas, regionsOf } from "@/lib/useAtlas";
import { useAllNpcs } from "@/lib/useNpcs";
import { sanearSitio, sitioVigente, indexar, nodoDelJugador } from "@/lib/nodos";
import { idPoi, poiDeNodo, type Nodo } from "@/data/lugares";
import { duracionDeViaje } from "@/lib/viaje";
import { pgActuales } from "@/lib/estado";
import { derive } from "@/lib/derive";
import { CONTINENTS } from "@/data/world";
import type { PlayState } from "@/lib/recursos";

/**
 * La PORTADA del panel, y no existía.
 *
 * ⚠️ **Es la pieza que faltaba, no una decoración.** El panel tenía catorce
 * pestañas planas y **ninguna respondía a «¿qué está pasando ahora mismo?»**: para
 * saber si estabas en directo mirabas Narración, la hora en Tiempo, dónde está el
 * grupo en Mapa, quién se ha ido por su cuenta en Grupo, y si alguien tiene un
 * pueblo revelado, otra vez en Mapa. Cinco pestañas para una pregunta.
 *
 * Aquí no se edita NADA a propósito: es un tablero de lectura con enlaces a
 * donde se toca. Un panel que además edita se convierte en una decimoquinta
 * pestaña, y el problema era justamente que había catorce.
 */
export default function ResumenPanel({ onIr }: { onIr: (tab: string) => void }) {
  const { party, ready: partyReady } = useParty();
  const { session } = useLiveSession();
  const { location } = usePartyLocation();
  const { nowGameMin, ready: relojReady } = useGameClock();
  const { nodos, ready: nodosReady } = useLugares();
  const { states: poiStates, ready: poisReady } = usePois();
  const { atlas } = useAtlas();
  const { npcs, ready: npcsReady } = useAllNpcs();

  const moment = momentFromGameMin(nowGameMin);
  const index = indexar(nodos);
  const ancla = location ? idPoi(location.poiName) : null;

  // Cuántos pueblos ha abierto el DM. Es el número que decide si los jugadores
  // pueden viajar, y hasta ahora no se veía en ninguna parte: estaba repartido
  // en ojitos dentro de la lista de Mapa.
  const revelados = Object.values(poiStates).filter((s) => s.revealed).length;
  const totalPois = CONTINENTS.filter((c) => c !== "Mares")
    .flatMap((c) => regionsOf(atlas, c).map((r) => (atlas[c]?.pois[r.slug] ?? []).length))
    .reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-5">
      {/* ---------------- LA TIRA DE ESTADO ---------------- */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Ficha
          icono={session.epic_mode ? "fa-tower-broadcast" : "fa-circle-pause"}
          color={session.epic_mode ? "var(--color-primitivo)" : "var(--color-dim)"}
          rotulo="La sesión"
          valor={session.epic_mode ? "En directo" : "En espera"}
          pie={session.title || "Nada emitido"}
          onClick={() => onIr("narracion")}
        />
        <Ficha
          icono="fa-clock" color="var(--color-bronze)"
          rotulo="La hora del grupo"
          valor={relojReady ? `${String(moment.hour).padStart(2, "0")}:${String(moment.minute).padStart(2, "0")}` : "…"}
          pie={relojReady ? `${moment.dateStr} · ${moment.season}` : "cargando"}
          onClick={() => onIr("tiempo")}
        />
        <Ficha
          icono="fa-map-pin" color="var(--color-arcane)"
          rotulo="El ancla del grupo"
          valor={location?.poiName ?? "De viaje"}
          pie={location ? `${location.regionSlug} · ${location.continent}` : "sin sitio fijo"}
          onClick={() => onIr("mapa")}
        />
        <Ficha
          icono="fa-eye" color={revelados === 0 ? "var(--color-ember)" : "var(--color-verdant)"}
          rotulo="Pueblos abiertos"
          valor={poisReady ? `${revelados} de ${totalPois}` : "…"}
          // ⚠️ El aviso que le faltaba al DM. Sin ningún pueblo revelado, la
          // sección «Ponerse en camino» de /lugar no le sale a NADIE, y no hay
          // forma de saber por qué desde la pantalla del jugador.
          pie={revelados === 0 ? "Nadie puede viajar todavía" : "Los jugadores pueden viajar ahí"}
          onClick={() => onIr("mapa")}
        />
      </div>

      {/* ---------------- DÓNDE ESTÁ CADA UNO ---------------- */}
      <section className="panel p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <div>
            <p className="eyebrow !mb-1"><i className="fas fa-people-group mr-1.5" style={{ color: "var(--color-bronze)" }} />Dónde está cada uno</p>
            <p className="font-ui text-[12px]" style={{ color: "var(--color-dim)" }}>
              Quién sigue con el grupo y quién anda por su cuenta. Lo estaba repartido entre Grupo y Mapa.
            </p>
          </div>
          <button className="btn-ghost !py-1.5 !px-3 text-[12px]" onClick={() => onIr("grupo")}>
            <i className="fas fa-arrow-right mr-1.5" />Mover a alguien
          </button>
        </div>

        {!partyReady || !nodosReady ? (
          <p className="text-sm italic" style={{ color: "var(--color-dim)" }}>Cargando…</p>
        ) : party.length === 0 ? (
          <p className="text-sm italic" style={{ color: "var(--color-dim)" }}>Nadie tiene personaje en juego.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {party.map((c) => {
              const play = (c.play_state as PlayState) ?? {};
              const { sitio, desfase } = sanearSitio(play.sitio, play.desfase);
              const nodo = nodoDelJugador(sitio, ancla, index);
              const suyo = !!sitio && sitioVigente(sitio, ancla);
              const d = derive(c as Parameters<typeof derive>[0]);
              const pg = pgActuales(play, d.maxHp);
              return (
                <div key={c.user_id} className="panel-raised p-4">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="font-display font-extrabold text-[15px]" style={{ color: "var(--color-parch)" }}>{c.name || "Sin nombre"}</p>
                    <span className="font-ui text-[11px] font-bold" style={{ color: pg <= d.maxHp / 4 ? "var(--color-ember)" : "var(--color-muted)" }}>
                      <i className="fas fa-heart mr-1" />{pg}/{d.maxHp}
                    </span>
                  </div>
                  <p className="font-ui text-[12px] flex items-start gap-2" style={{ color: suyo ? "var(--color-arcane-bright)" : "var(--color-muted)" }}>
                    <i className={`fas ${suyo ? "fa-person-walking-arrow-right" : "fa-users"} mt-0.5`} />
                    <span>
                      {nombreDeNodo(nodo, nodos)}
                      {suyo && (
                        <span className="block" style={{ color: "var(--color-dim)" }}>
                          {sitio?.puesto === "dm" ? "lo pusiste tú" : "se fue solo"}
                          {desfase > 0 ? ` · ${duracionDeViaje(desfase)} de camino` : ""}
                        </span>
                      )}
                    </span>
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ---------------- LO QUE ESTÁ A CERO ----------------
          Un tablero solo sirve si dice lo que FALTA. Estos tres huecos son
          silenciosos: nada en la app avisa de ellos y el DM se los encuentra
          en mitad de una sesión. */}
      <section className="panel p-6">
        <p className="eyebrow mb-1"><i className="fas fa-triangle-exclamation mr-1.5" style={{ color: "var(--color-ember)" }} />Lo que está a cero</p>
        <p className="font-ui text-[12px] mb-4" style={{ color: "var(--color-dim)" }}>
          Huecos que no dan ningún error, pero que en mitad de una sesión se notan.
        </p>
        <div className="space-y-2">
          <Hueco
            mal={revelados === 0}
            malTexto="Ningún pueblo revelado: la sección de viajar no le aparece a nadie."
            bienTexto={`${revelados} pueblos abiertos al viaje.`}
            accion="Ir a Mapa" onClick={() => onIr("mapa")}
          />
          <Hueco
            mal={npcsReady && npcs.length === 0}
            malTexto="No hay ningún PNJ creado: los sitios están vacíos de gente."
            bienTexto={`${npcs.length} PNJ repartidos por el mundo.`}
            accion="Ir a PNJs" onClick={() => onIr("pnjs")}
          />
          <Hueco
            mal={!location}
            malTexto="El grupo no está plantado en ningún sitio: /lugar les dice «de camino»."
            bienTexto={`El grupo está en ${location?.poiName}.`}
            accion="Ir a Mapa" onClick={() => onIr("mapa")}
          />
        </div>
      </section>
    </div>
  );
}

/** El nombre legible de donde está alguien. */
function nombreDeNodo(nodo: Nodo | null, nodos: Nodo[]): string {
  if (!nodo) return "De camino, sin sitio fijo";
  if (nodo.id.startsWith("poi:")) return nodo.nombre;
  const poi = poiDeNodo(nodo.id);
  const suelto = nodos.find((n) => n.id === nodo.id);
  const nombre = suelto?.nombre ?? nodo.nombre;
  return poi ? `${nombre} — ${poi}` : `${nombre} (Expansión Verdante)`;
}

function Ficha({
  icono, color, rotulo, valor, pie, onClick,
}: {
  icono: string; color: string; rotulo: string; valor: string; pie: string; onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="panel p-4 text-left transition-colors hover:border-[var(--color-bronze)]">
      <p className="eyebrow !mb-2"><i className={`fas ${icono} mr-1.5`} style={{ color }} />{rotulo}</p>
      <p className="font-display text-[22px] font-extrabold leading-tight" style={{ color: "var(--color-parch)" }}>{valor}</p>
      <p className="font-ui text-[11px] mt-1" style={{ color: "var(--color-dim)" }}>{pie}</p>
    </button>
  );
}

function Hueco({
  mal, malTexto, bienTexto, accion, onClick,
}: {
  mal: boolean; malTexto: string; bienTexto: string; accion: string; onClick: () => void;
}) {
  return (
    <div className="panel-raised p-3 flex items-center justify-between gap-3 flex-wrap">
      <p className="font-ui text-[13px] flex items-center gap-2" style={{ color: mal ? "var(--color-ember)" : "var(--color-muted)" }}>
        <i className={`fas ${mal ? "fa-circle-exclamation" : "fa-circle-check"}`} />
        {mal ? malTexto : bienTexto}
      </p>
      {mal && <button className="btn-ghost !py-1 !px-2.5 text-[11px]" onClick={onClick}>{accion}</button>}
    </div>
  );
}
