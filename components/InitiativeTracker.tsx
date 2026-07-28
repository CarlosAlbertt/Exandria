"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useSession } from "@/components/SessionProvider";
import { useParty } from "@/lib/character";
import {
  useInitiative,
  setMyInitiative,
  addNpcInitiative,
  setActiveInitiative,
  clearInitiative,
  removeInitiativeRow,
  setNpcHp,
  setNpcConds,
  type InitiativeRow,
} from "@/lib/useInitiative";
import { publishRoll } from "@/lib/useDiceFeed";
import { derive } from "@/lib/derive";
import { pgActuales, CONDICIONES } from "@/lib/estado";
import { saludDe } from "@/lib/combate";
import type { PlayState } from "@/lib/recursos";

// Solo lo ve el DM, así que tampoco se descarga para los jugadores: el
// bestiario son ~25 KB comprimidos de estadísticas que un jugador jamás
// abre desde aquí, y /combate es justo la pantalla donde peor sienta la
// espera al empezar el combate.
const SelectorMonstruos = dynamic(() => import("@/components/combate/SelectorMonstruos"), { ssr: false });

type Props = {
  mod?: number;      // modificador de Destreza para "Tirar iniciativa" (derive().abilities.des.mod)
  hideEmpty?: boolean; // no renderizar nada si no hay ronda en curso (uso embebido en la hoja)
  /**
   * Si se pasa, cada fila (menos la tuya) es pulsable y elige objetivo. Recibe
   * el id de la fila, o null al deseleccionar tocando la ya elegida.
   */
  onSelect?: (id: number | null) => void;
  /** Fila elegida ahora mismo como objetivo. */
  selectedId?: number | null;
  /** Muestra los PG y las condiciones de los jugadores en cada fila. */
  conEstado?: boolean;
};

// Iniciativa en vivo, compartida por todo el grupo. RLS hace que las
// mutaciones de DM (PNJ/turno/vaciar) sean no-op silenciosas para
// jugadores, así que sus controles solo se muestran con role === "dm".
export default function InitiativeTracker({ mod = 0, hideEmpty = false, onSelect, selectedId = null, conEstado = false }: Props) {
  const session = useSession();
  const myId = session?.id ?? "";
  const isDM = session?.role === "dm";
  const { party } = useParty();
  const { rows, faltaMigracion } = useInitiative();

  // Estado de una fila. Dos orígenes distintos y una sola fuente de verdad por
  // combatiente: los JUGADORES lo llevan en characters.play_state; los PNJ, en
  // su propia fila de initiative (schema_v23). Nunca los dos.
  const estadoDe = (r: InitiativeRow): { hp: number; maxHp: number; conds: string[]; esPnj: boolean } | null => {
    if (r.is_npc) {
      // Un PNJ escrito a mano (sin monstruo detrás) no tiene PG que mostrar.
      if (r.hp_max === null || r.hp === null) return null;
      return { hp: r.hp, maxHp: r.hp_max, conds: r.conds, esPnj: true };
    }
    if (!r.user_id) return null;
    const p = party.find((x) => x.user_id === r.user_id);
    if (!p) return null;
    const play = (p.play_state as PlayState | undefined) ?? {};
    const maxHp = derive(p).maxHp;
    return { hp: pgActuales(play, maxHp), maxHp, conds: play.conds ?? [], esPnj: false };
  };

  const [rolling, setRolling] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [npcName, setNpcName] = useState("");
  const [npcValue, setNpcValue] = useState("");
  // Cuánto daño aplica el DM de un toque, por fila. Texto y no número: un
  // input vacío mientras se teclea no debe volverse NaN.
  const [daños, setDaños] = useState<Record<number, string>>({});
  const [condsAbiertas, setCondsAbiertas] = useState<Record<number, boolean>>({});
  const dañoDe = (id: number) => Math.max(1, Math.round(Number(daños[id] ?? "1") || 1));

  // Ninguna escritura de PNJ puede fallar en silencio. Hoy, con la schema_v23
  // sin ejecutar, TODAS devuelven 42703: si se tragara el error, el DM pulsaría
  // «−» y no pasaría nada, culpando al dato en vez de a la consulta.
  async function aplica(p: Promise<{ error: string | null }>) {
    const { error } = await p;
    setErr(error);
  }

  if (hideEmpty && rows.length === 0) return null;

  const nameFor = (r: InitiativeRow) => {
    if (r.is_npc) return r.npc_name ?? "PNJ";
    if (r.user_id === myId) return session?.username ?? "Tú";
    return party.find((p) => p.user_id === r.user_id)?.username ?? "Jugador";
  };

  async function rollInitiative() {
    if (!myId || rolling) return;
    setRolling(true);
    setErr(null);
    const { error, result } = await publishRoll(myId, "ability", "Iniciativa", "1d20", { mod });
    if (error || !result) {
      setErr(error ?? "No se pudo tirar la iniciativa.");
    } else {
      const { error: saveError } = await setMyInitiative(myId, result.total);
      if (saveError) setErr(saveError);
    }
    setRolling(false);
  }

  async function advanceTurn() {
    if (rows.length === 0) return;
    const curIdx = rows.findIndex((r) => r.active);
    const nextIdx = curIdx === -1 ? 0 : (curIdx + 1) % rows.length;
    await setActiveInitiative(rows[nextIdx].id);
  }

  async function addNpc() {
    const name = npcName.trim();
    const value = Number(npcValue);
    if (!name || npcValue.trim() === "" || Number.isNaN(value)) return;
    await addNpcInitiative(name, value);
    setNpcName("");
    setNpcValue("");
  }

  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
        <p className="eyebrow"><i className="fas fa-bolt mr-1.5" style={{ color: "var(--color-arcane)" }} />Iniciativa</p>
        <button className="btn-gold !py-1.5 !px-3 text-[12px]" onClick={rollInitiative} disabled={!myId || rolling}>
          <i className="fas fa-dice-d20 mr-1.5" />{rolling ? "Tirando…" : "Tirar iniciativa"}
        </button>
      </div>

      {err && <p className="text-[12px] mb-2 italic" style={{ color: "var(--color-ember)" }}>{err}</p>}

      {rows.length === 0 ? (
        <p className="font-ui text-[13px] text-center py-3" style={{ color: "var(--color-dim)" }}>Sin ronda de iniciativa en curso.</p>
      ) : (
        <div className="space-y-1.5 mb-1">
          {rows.map((r) => {
            // El estado de un PNJ se muestra siempre (es la razón de la fila);
            // el de un jugador solo si se ha pedido con `conEstado`, que es lo
            // que hace la pantalla de combate y no el panel del DM.
            const est = estadoDe(r);
            const mostrarEst = est && (est.esPnj || conEstado);
            const esMia = !r.is_npc && r.user_id === myId;
            const elegible = !!onSelect && !esMia;
            const elegida = selectedId === r.id;
            return (
              // Los controles del DM van FUERA de la fila pulsable: tocar «−» o
              // una condición no puede cambiarle el objetivo de paso.
              <div key={r.id}>
                <div
                  onClick={elegible ? () => onSelect!(elegida ? null : r.id) : undefined}
                  className={`panel-raised px-3 py-2 flex items-center justify-between gap-3 ${elegible ? "cursor-pointer" : ""}`}
                  style={
                    elegida
                      ? { borderColor: "var(--color-ember)", boxShadow: "0 0 0 1px var(--color-ember)" }
                      : r.active
                        ? { borderColor: "var(--color-bronze)", boxShadow: "0 0 0 1px var(--color-bronze), 0 0 20px -4px rgba(201,163,92,0.5)" }
                        : undefined
                  }
                >
                  <span className="min-w-0">
                    <span className="font-ui text-[13px] font-semibold flex items-center gap-2" style={{ color: r.active ? "var(--color-bronze-bright)" : "var(--color-warm)" }}>
                      {r.active && <i className="fas fa-play text-[10px]" style={{ color: "var(--color-bronze)" }} />}
                      {r.is_npc && <i className="fas fa-dragon text-[11px]" style={{ color: "var(--color-dim)" }} />}
                      {nameFor(r)}
                      {elegida && <i className="fas fa-crosshairs text-[11px]" style={{ color: "var(--color-ember)" }} title="Tu objetivo" />}
                    </span>
                    {mostrarEst && est && (
                      <span className="font-ui text-[11px] flex items-center gap-2 mt-0.5 flex-wrap" style={{ color: "var(--color-dim)" }}>
                        {/* El DM ve las cifras; los jugadores, la palabra. Un monstruo
                            con 3 PG de 13 se cuenta como "malherido" y nadie calcula. */}
                        {est.esPnj && !isDM ? (
                          <span style={{ color: est.hp === 0 ? "var(--color-ember)" : undefined }}>{saludDe(est.hp, est.maxHp)}</span>
                        ) : (
                          <span>PG {est.hp}/{est.maxHp}</span>
                        )}
                        {/* Las condiciones las ven TODOS: se ve que el goblin está en
                            el suelo, y hacen falta para entender la ventaja. */}
                        {est.conds.length > 0 && (
                          <span style={{ color: "var(--color-violet)" }}>{est.conds.join(" · ")}</span>
                        )}
                      </span>
                    )}
                  </span>
                  <span className="font-display font-extrabold text-[15px] shrink-0" style={{ color: "var(--color-arcane-bright)" }}>
                    {r.value ?? "—"}
                  </span>
                </div>

                {isDM && est && est.esPnj && (
                  <div className="px-3 py-1.5 mt-1 flex items-center gap-1.5 flex-wrap border border-[var(--color-line)] rounded-lg">
                    <input
                      type="number"
                      min={1}
                      value={daños[r.id] ?? "1"}
                      onChange={(e) => setDaños((d) => ({ ...d, [r.id]: e.target.value }))}
                      aria-label={`Daño o curación para ${nameFor(r)}`}
                      className="w-14 bg-[var(--color-night)] rounded-lg px-2 py-1 font-ui text-[11px] outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)] transition-colors"
                      style={{ color: "var(--color-warm)" }}
                    />
                    {/* setNpcHp acota a [0, hp_max] con acotarHp, así que aquí se
                        resta y se suma a pelo: el tope vive en la capa pura. */}
                    <button
                      className="btn-ghost !py-1 !px-2 text-[11px]"
                      style={{ color: "var(--color-ember)" }}
                      title="Aplicar daño"
                      onClick={() => aplica(setNpcHp(r.id, est.hp - dañoDe(r.id), est.maxHp))}
                    >
                      <i className="fas fa-minus" />
                    </button>
                    <button
                      className="btn-ghost !py-1 !px-2 text-[11px]"
                      title="Curar"
                      onClick={() => aplica(setNpcHp(r.id, est.hp + dañoDe(r.id), est.maxHp))}
                    >
                      <i className="fas fa-plus" />
                    </button>
                    <button
                      className="btn-ghost !py-1 !px-2 text-[11px]"
                      style={{ color: "var(--color-violet)" }}
                      onClick={() => setCondsAbiertas((c) => ({ ...c, [r.id]: !c[r.id] }))}
                    >
                      Condiciones{est.conds.length > 0 ? ` · ${est.conds.length}` : ""}
                    </button>
                    <button
                      className="btn-ghost !py-1 !px-2 text-[11px] ml-auto"
                      style={{ color: "var(--color-ember)" }}
                      title="Quitar de la iniciativa"
                      onClick={() => aplica(removeInitiativeRow(r.id))}
                    >
                      <i className="fas fa-xmark mr-1" />quitar
                    </button>

                    {condsAbiertas[r.id] && (
                      <div className="w-full flex flex-wrap gap-1 pt-1.5 mt-0.5 border-t border-[var(--color-line)]">
                        {CONDICIONES.map((c) => {
                          const activa = est.conds.includes(c.slug);
                          return (
                            <button
                              key={c.slug}
                              title={c.regla}
                              className="btn-ghost !py-0.5 !px-1.5 text-[10px]"
                              style={activa ? { color: "var(--color-violet)", borderColor: "var(--color-violet)" } : undefined}
                              onClick={() => aplica(setNpcConds(r.id, activa ? est.conds.filter((s) => s !== c.slug) : [...est.conds, c.slug]))}
                            >
                              <i className={`fas fa-${c.icon} mr-1`} />{c.name}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {isDM && (
        <div className="pt-3 mt-2 border-t border-[var(--color-line)] space-y-2">
          {faltaMigracion && (
            <p className="font-ui text-[11px] italic mb-2" style={{ color: "var(--color-ember)" }}>
              <i className="fas fa-triangle-exclamation mr-1.5" />
              Falta ejecutar <code>schema_v23</code>: los monstruos no guardarán PG ni condiciones todavía.
            </p>
          )}
          <SelectorMonstruos
            faltaMigracion={faltaMigracion}
            nombresExistentes={rows.filter((r) => r.is_npc).map((r) => r.npc_name ?? "")}
          />
          <div className="flex gap-2">
            <input
              value={npcName}
              onChange={(e) => setNpcName(e.target.value)}
              placeholder="Nombre del PNJ"
              className="flex-1 bg-[var(--color-night)] rounded-lg px-3 py-1.5 font-ui text-[12px] outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)] transition-colors"
              style={{ color: "var(--color-warm)" }}
            />
            <input
              type="number"
              value={npcValue}
              onChange={(e) => setNpcValue(e.target.value)}
              placeholder="Valor"
              className="w-20 bg-[var(--color-night)] rounded-lg px-3 py-1.5 font-ui text-[12px] outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)] transition-colors"
              style={{ color: "var(--color-warm)" }}
            />
            <button className="btn-ghost !py-1.5 !px-3 text-[12px]" onClick={addNpc} disabled={!npcName.trim() || npcValue.trim() === ""}>
              <i className="fas fa-plus mr-1.5" />PNJ
            </button>
          </div>
          <div className="flex gap-2">
            <button className="btn-gold flex-1 !py-1.5 text-[12px]" onClick={advanceTurn} disabled={rows.length === 0}>
              <i className="fas fa-forward mr-1.5" />Siguiente turno
            </button>
            <button
              className="btn-ghost !py-1.5 !px-3 text-[12px]"
              style={{ color: "var(--color-ember)" }}
              onClick={() => { if (confirm("¿Vaciar toda la iniciativa?")) clearInitiative(); }}
              disabled={rows.length === 0}
            >
              <i className="fas fa-trash mr-1.5" />Vaciar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
