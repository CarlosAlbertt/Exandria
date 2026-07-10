"use client";

import { useState } from "react";
import { useSession } from "@/components/SessionProvider";
import { useParty } from "@/lib/character";
import {
  useInitiative,
  setMyInitiative,
  addNpcInitiative,
  setActiveInitiative,
  clearInitiative,
  type InitiativeRow,
} from "@/lib/useInitiative";
import { publishRoll } from "@/lib/useDiceFeed";

type Props = {
  mod?: number;      // modificador de Destreza para "Tirar iniciativa" (derive().abilities.des.mod)
  hideEmpty?: boolean; // no renderizar nada si no hay ronda en curso (uso embebido en la hoja)
};

// Iniciativa en vivo, compartida por todo el grupo. RLS hace que las
// mutaciones de DM (PNJ/turno/vaciar) sean no-op silenciosas para
// jugadores, así que sus controles solo se muestran con role === "dm".
export default function InitiativeTracker({ mod = 0, hideEmpty = false }: Props) {
  const session = useSession();
  const myId = session?.id ?? "";
  const isDM = session?.role === "dm";
  const { party } = useParty();
  const { rows } = useInitiative();

  const [rolling, setRolling] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [npcName, setNpcName] = useState("");
  const [npcValue, setNpcValue] = useState("");

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
          {rows.map((r) => (
            <div
              key={r.id}
              className="panel-raised px-3 py-2 flex items-center justify-between gap-3"
              style={r.active ? { borderColor: "var(--color-bronze)", boxShadow: "0 0 0 1px var(--color-bronze), 0 0 20px -4px rgba(201,163,92,0.5)" } : undefined}
            >
              <span className="font-ui text-[13px] font-semibold flex items-center gap-2" style={{ color: r.active ? "var(--color-bronze-bright)" : "var(--color-warm)" }}>
                {r.active && <i className="fas fa-play text-[10px]" style={{ color: "var(--color-bronze)" }} />}
                {r.is_npc && <i className="fas fa-dragon text-[11px]" style={{ color: "var(--color-dim)" }} />}
                {nameFor(r)}
              </span>
              <span className="font-display font-extrabold text-[15px]" style={{ color: "var(--color-arcane-bright)" }}>
                {r.value ?? "—"}
              </span>
            </div>
          ))}
        </div>
      )}

      {isDM && (
        <div className="pt-3 mt-2 border-t border-[var(--color-line)] space-y-2">
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
