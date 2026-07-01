"use client";

import { useState } from "react";
import { useSession } from "@/components/SessionProvider";
import { useGroupAction, setDraft, setMyReady, submitAction } from "@/lib/useGroupAction";

// Recuadro de acción del GRUPO con consenso: todos deben marcar "listo" antes
// de poder enviar la acción acordada al DM.
export default function GroupConsensus() {
  const session = useSession();
  const myId = session?.id ?? "";
  const { action, ready, players } = useGroupAction();
  const [sending, setSending] = useState(false);

  const mine = !!ready[myId];
  const readyCount = players.filter((p) => ready[p.id]).length;
  const allReady = players.length > 0 && players.every((p) => ready[p.id]);

  // Si ya se envió una acción en esta narración, mostrar confirmación.
  if (action.submitted) {
    return (
      <div className="panel p-5 max-w-xl mx-auto text-left">
        <p className="eyebrow mb-2" style={{ color: "var(--color-primitivo)" }}><i className="fas fa-check mr-1.5" />Acción enviada al DM</p>
        <p className="font-body text-[15px]" style={{ color: "var(--color-warm)" }}>{action.submitted}</p>
        <p className="font-ui text-[12px] mt-3" style={{ color: "var(--color-dim)" }}>Esperando la respuesta del Director de Juego…</p>
      </div>
    );
  }

  return (
    <div className="panel p-5 max-w-xl mx-auto text-left">
      <p className="eyebrow mb-3"><i className="fas fa-users mr-1.5" style={{ color: "var(--color-bronze)" }} />¿Qué hace el grupo?</p>

      <textarea
        value={action.draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={3}
        placeholder="Acordad y escribid aquí la acción del grupo…"
        className="w-full mb-3 bg-[var(--color-night)] rounded-lg px-3 py-2 font-body text-[15px] outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)] resize-none"
        style={{ color: "var(--color-warm)" }}
      />

      {/* Estado de "listos" */}
      <div className="flex flex-wrap gap-2 mb-4">
        {players.map((p) => (
          <span key={p.id} className="font-ui text-[11px] font-bold px-2.5 py-1 rounded-full"
            style={{ color: ready[p.id] ? "var(--color-primitivo)" : "var(--color-dim)", border: `1px solid ${ready[p.id] ? "var(--color-primitivo)" : "var(--color-line)"}55` }}>
            <i className={`fas ${ready[p.id] ? "fa-check" : "fa-hourglass-half"} mr-1`} />{p.username}
          </span>
        ))}
        {players.length === 0 && <span className="font-ui text-[12px]" style={{ color: "var(--color-dim)" }}>Sin jugadores registrados.</span>}
      </div>

      <div className="flex items-center gap-2">
        <button onClick={() => setMyReady(myId, !mine)} className="btn-ghost flex-1 !py-2.5"
          style={{ color: mine ? "var(--color-primitivo)" : "var(--color-warm)", borderColor: mine ? "var(--color-primitivo)" : "var(--color-line)" }}>
          <i className={`fas ${mine ? "fa-check-double" : "fa-hand"} mr-2`} />{mine ? "Estás listo" : "Marcar listo"}
        </button>
        <button
          disabled={!allReady || !action.draft.trim() || sending}
          onClick={async () => { setSending(true); await submitAction(action.draft.trim()); setSending(false); }}
          className="btn-gold flex-1 !py-2.5">
          <i className="fas fa-paper-plane mr-2" />Enviar ({readyCount}/{players.length})
        </button>
      </div>
      {!allReady && players.length > 0 && (
        <p className="font-ui text-[11px] mt-2 text-center" style={{ color: "var(--color-dim)" }}>
          Todos deben marcar "listo" para poder enviar.
        </p>
      )}
    </div>
  );
}
