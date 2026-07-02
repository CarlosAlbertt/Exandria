"use client";

import { useState } from "react";
import { useSession } from "@/components/SessionProvider";
import { useGroupAction, setDraft, setMyReady, submitAction, claimSpeaker, releaseSpeaker } from "@/lib/useGroupAction";

// Acción del GRUPO con un PORTAVOZ único: solo quien tiene la palabra redacta y
// envía; el resto ve el borrador y marca "de acuerdo". Así no envían todos cosas
// distintas.
export default function GroupConsensus() {
  const session = useSession();
  const myId = session?.id ?? "";
  const myName = session?.username ?? "Tú";
  const { action, ready, players } = useGroupAction();
  const [sending, setSending] = useState(false);

  const speaker = action.speaker;
  const iAmSpeaker = speaker === myId;
  const speakerName = players.find((p) => p.id === speaker)?.username ?? "un jugador";

  // Confirmación tras enviar
  if (action.submitted) {
    return (
      <div className="panel p-5 max-w-xl mx-auto text-left">
        <p className="eyebrow mb-2" style={{ color: "var(--color-primitivo)" }}><i className="fas fa-check mr-1.5" />Acción enviada al DM</p>
        <p className="font-body text-[15px]" style={{ color: "var(--color-warm)" }}>{action.submitted}</p>
        <p className="font-ui text-[12px] mt-3" style={{ color: "var(--color-dim)" }}>Esperando la respuesta del Director de Juego…</p>
      </div>
    );
  }

  // Nadie tiene la palabra → invitar a tomarla
  if (!speaker) {
    return (
      <div className="panel p-5 max-w-xl mx-auto text-center">
        <p className="eyebrow mb-3"><i className="fas fa-users mr-1.5" style={{ color: "var(--color-bronze)" }} />¿Quién habla por el grupo?</p>
        <p className="font-ui text-[13px] mb-4" style={{ color: "var(--color-muted)" }}>Un jugador toma la palabra, redacta la acción del grupo y la envía. Los demás dan su acuerdo.</p>
        <button className="btn-gold" onClick={() => claimSpeaker(myId)}><i className="fas fa-hand mr-2" />Tomar la palabra</button>
      </div>
    );
  }

  // "Listos" de los que NO son portavoz
  const others = players.filter((p) => p.id !== speaker);
  const allReady = others.length === 0 || others.every((p) => ready[p.id]);
  const readyCount = others.filter((p) => ready[p.id]).length;
  const mine = !!ready[myId];

  // Vista del PORTAVOZ: redacta y envía
  if (iAmSpeaker) {
    return (
      <div className="panel p-5 max-w-xl mx-auto text-left">
        <div className="flex items-center justify-between mb-3">
          <p className="eyebrow"><i className="fas fa-microphone mr-1.5" style={{ color: "var(--color-bronze)" }} />Tienes la palabra</p>
          <button className="font-ui text-[11px] font-bold" style={{ color: "var(--color-dim)" }} onClick={releaseSpeaker}>Soltar la palabra</button>
        </div>
        <textarea value={action.draft} onChange={(e) => setDraft(e.target.value)} rows={3}
          placeholder="Escribe la acción del grupo…"
          className="w-full mb-3 bg-[var(--color-night)] rounded-lg px-3 py-2 font-body text-[15px] outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)] resize-none"
          style={{ color: "var(--color-warm)" }} />
        <div className="flex flex-wrap gap-2 mb-4">
          {others.map((p) => (
            <span key={p.id} className="font-ui text-[11px] font-bold px-2.5 py-1 rounded-full"
              style={{ color: ready[p.id] ? "var(--color-primitivo)" : "var(--color-dim)", border: `1px solid ${ready[p.id] ? "var(--color-primitivo)" : "var(--color-line)"}55` }}>
              <i className={`fas ${ready[p.id] ? "fa-check" : "fa-hourglass-half"} mr-1`} />{p.username}
            </span>
          ))}
          {others.length === 0 && <span className="font-ui text-[12px]" style={{ color: "var(--color-dim)" }}>Sin más jugadores.</span>}
        </div>
        <button disabled={!allReady || !action.draft.trim() || sending}
          onClick={async () => { setSending(true); await submitAction(action.draft.trim()); setSending(false); }}
          className="btn-gold w-full">
          <i className="fas fa-paper-plane mr-2" />Enviar al DM ({readyCount}/{others.length} de acuerdo)
        </button>
        {!allReady && others.length > 0 && (
          <p className="font-ui text-[11px] mt-2 text-center" style={{ color: "var(--color-dim)" }}>Espera a que todos den su acuerdo.</p>
        )}
      </div>
    );
  }

  // Vista del RESTO: ve el borrador y marca acuerdo
  return (
    <div className="panel p-5 max-w-xl mx-auto text-left">
      <p className="eyebrow mb-3"><i className="fas fa-comment-dots mr-1.5" style={{ color: "var(--color-arcane)" }} />
        <span style={{ color: "var(--color-bronze-bright)" }}>{speakerName}</span> lleva la palabra</p>
      <div className="panel-raised p-3 mb-4 min-h-[64px]">
        <p className="font-body text-[15px] whitespace-pre-wrap" style={{ color: "var(--color-warm)" }}>
          {action.draft || <span className="italic" style={{ color: "var(--color-dim)" }}>Redactando la acción del grupo…</span>}
        </p>
      </div>
      <button onClick={() => setMyReady(myId, !mine)} className="btn-ghost w-full !py-2.5"
        style={{ color: mine ? "var(--color-primitivo)" : "var(--color-warm)", borderColor: mine ? "var(--color-primitivo)" : "var(--color-line)" }}>
        <i className={`fas ${mine ? "fa-check-double" : "fa-thumbs-up"} mr-2`} />{mine ? "Estás de acuerdo" : "Estoy de acuerdo"}
      </button>
      <p className="font-ui text-[11px] mt-2 text-center" style={{ color: "var(--color-dim)" }}>{myName}: cuando todos estéis de acuerdo, {speakerName} enviará la acción.</p>
    </div>
  );
}
