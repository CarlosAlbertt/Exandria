"use client";

import { useState } from "react";
import { useParty } from "@/lib/character";
import { useRollRequests, createRollRequest, closeRollRequest } from "@/lib/useRollRequests";
import DicePanel from "@/components/DicePanel";
import InitiativeTracker from "@/components/InitiativeTracker";

// Pestaña DM "Dados": pedir tiradas al grupo o a un jugador, gestionar las
// peticiones abiertas, ver el feed compartido (con tiradas privadas, por
// RLS) y la iniciativa en vivo.
export default function DadosPanel() {
  const { party } = useParty();
  const { requests } = useRollRequests();

  const [label, setLabel] = useState("");
  const [formula, setFormula] = useState("1d20");
  const [target, setTarget] = useState("all");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function create() {
    if (!label.trim() || busy) return;
    setBusy(true);
    setErr(null);
    const { error } = await createRollRequest(label.trim(), formula.trim(), target === "all" ? null : target);
    if (error) setErr(error);
    else { setLabel(""); setFormula("1d20"); setTarget("all"); }
    setBusy(false);
  }

  return (
    <div className="space-y-6">
      {/* COMPONER PETICIÓN */}
      <section className="panel p-5">
        <p className="eyebrow mb-3"><i className="fas fa-bell mr-1.5" style={{ color: "var(--color-bronze)" }} />Pedir tirada</p>
        <div className="grid sm:grid-cols-[1fr_140px_180px_auto] gap-2 items-end mb-1">
          <div>
            <label className="eyebrow !text-[9px] block mb-1">Etiqueta</label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ej.: Tirada de sigilo"
              className="w-full bg-[var(--color-night)] rounded-lg px-3 py-2 font-ui text-[13px] outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)] transition-colors"
              style={{ color: "var(--color-warm)" }}
            />
          </div>
          <div>
            <label className="eyebrow !text-[9px] block mb-1">Fórmula</label>
            <input
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              placeholder="1d20"
              className="w-full bg-[var(--color-night)] rounded-lg px-3 py-2 font-ui text-[13px] outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)] transition-colors"
              style={{ color: "var(--color-warm)" }}
            />
          </div>
          <div>
            <label className="eyebrow !text-[9px] block mb-1">Destino</label>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full bg-[var(--color-night)] rounded-lg px-3 py-2 font-ui text-[13px] outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)] transition-colors"
              style={{ color: "var(--color-warm)" }}
            >
              <option value="all">Todo el grupo</option>
              {party.map((p) => <option key={p.user_id} value={p.user_id}>{p.username}</option>)}
            </select>
          </div>
          <button className="btn-gold !py-2" onClick={create} disabled={busy || !label.trim()}>
            <i className="fas fa-paper-plane mr-2" />Pedir
          </button>
        </div>
        {err && <p className="text-[12px] mt-1 italic" style={{ color: "var(--color-ember)" }}>{err}</p>}

        {requests.length > 0 && (
          <div className="mt-4 space-y-1.5">
            {requests.map((r) => (
              <div key={r.id} className="panel-raised px-3 py-2 flex items-center justify-between gap-3 flex-wrap">
                <span className="font-ui text-[13px]" style={{ color: "var(--color-warm)" }}>
                  <strong style={{ color: "var(--color-bronze-bright)" }}>{r.label}</strong>{" "}
                  <span style={{ color: "var(--color-dim)" }}>
                    ({r.formula} · {r.target ? (party.find((p) => p.user_id === r.target)?.username ?? "jugador") : "grupo"})
                  </span>
                </span>
                <button className="btn-ghost !py-1 !px-2.5 text-[11px]" onClick={() => closeRollRequest(r.id)}>
                  <i className="fas fa-xmark mr-1.5" />Cerrar
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* INICIATIVA (con controles de DM: PNJ, turno, vaciar) */}
      <InitiativeTracker />

      {/* FEED + DADOS (el DM ve también las tiradas privadas, por RLS) */}
      <DicePanel />
    </div>
  );
}
