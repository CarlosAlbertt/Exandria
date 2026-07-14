"use client";

import { useMemo, useState } from "react";
import { useSession } from "@/components/SessionProvider";
import { useParty } from "@/lib/character";
import { useDiceFeed, publishRoll } from "@/lib/useDiceFeed";
import { useRollRequests } from "@/lib/useRollRequests";
import { parseFormula, fmtRoll, critState } from "@/lib/dice";

const QUICK_DICE = [4, 6, 8, 10, 12, 20, 100];

// HH:MM local, sin depender de Intl (evita diferencias de configuración regional).
function fmtTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// Panel de dados compartido: feed en vivo, tirador rápido, fórmula libre y
// peticiones de tirada del DM. Usable por jugadores y por el DM (con toggle
// de tirada privada).
export default function DicePanel() {
  const session = useSession();
  const myId = session?.id ?? "";
  const isDM = session?.role === "dm";
  const { party } = useParty();
  const { rolls } = useDiceFeed();
  const { requests } = useRollRequests();

  const [formula, setFormula] = useState("");
  const [priv, setPriv] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // useParty excluye al DM, así que un id desconocido que no es el mío solo
  // puede ser el DM (todos los demás usuarios tienen su ficha en party).
  const nameFor = (userId: string) => {
    if (userId === myId) return session?.username ?? "Tú";
    return party.find((p) => p.user_id === userId)?.username ?? "Director de Juego";
  };

  // Solo peticiones dirigidas al grupo o a mí.
  const myRequests = useMemo(
    () => requests.filter((r) => r.target === null || r.target === myId),
    [requests, myId]
  );

  const parsedFormula = formula.trim() ? parseFormula(formula.trim()) : null;
  const formulaInvalid = !!formula.trim() && !parsedFormula;

  async function rollQuick(die: number) {
    if (!myId || busy) return;
    setBusy(true);
    setErr(null);
    const { error } = await publishRoll(myId, "custom", "dado rápido", `1d${die}`, isDM ? { priv } : undefined);
    if (error) setErr(error);
    setBusy(false);
  }

  async function rollFormula() {
    if (!myId || !parsedFormula || busy) return;
    setBusy(true);
    setErr(null);
    const { error } = await publishRoll(myId, "custom", "tirada libre", formula.trim(), isDM ? { priv } : undefined);
    if (error) setErr(error);
    else setFormula("");
    setBusy(false);
  }

  async function answerRequest(reqId: number, label: string, reqFormula: string) {
    if (!myId) return;
    setErr(null);
    const { error } = await publishRoll(myId, "requested", label, reqFormula, { requestId: reqId, ...(isDM ? { priv } : {}) });
    if (error) setErr(error);
  }

  return (
    <div className="space-y-4">
      {/* PETICIONES ABIERTAS */}
      {myRequests.length > 0 && (
        <div className="space-y-2">
          {myRequests.map((r) => (
            <div key={r.id} className="panel-raised p-3 flex items-center justify-between gap-3 flex-wrap" style={{ borderColor: "var(--color-bronze)" }}>
              <span className="font-ui text-[13px] font-bold" style={{ color: "var(--color-bronze-bright)" }}>
                <i className="fas fa-bell mr-2" />{r.label}{" "}
                <span className="font-ui text-[11px] font-normal" style={{ color: "var(--color-dim)" }}>({r.formula})</span>
              </span>
              <button className="btn-gold !py-1.5 !px-3 text-[12px]" onClick={() => answerRequest(r.id, r.label, r.formula)}>
                <i className="fas fa-dice mr-1.5" />Tirar
              </button>
            </div>
          ))}
        </div>
      )}

      {/* TIRADOR RÁPIDO Y FÓRMULA LIBRE */}
      <section className="panel p-4">
        <p className="eyebrow mb-3"><i className="fas fa-dice-d20 mr-1.5" style={{ color: "var(--color-bronze)" }} />Dado rápido</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {QUICK_DICE.map((die) => (
            <button key={die} className="btn-ghost !py-1.5 !px-3 text-[13px]" onClick={() => rollQuick(die)}>d{die}</button>
          ))}
        </div>

        <p className="eyebrow mb-1.5">Fórmula libre</p>
        <div className="flex gap-2">
          <input
            value={formula}
            onChange={(e) => setFormula(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") rollFormula(); }}
            placeholder="p. ej. 2d6+3"
            className="flex-1 bg-[var(--color-night)] rounded-lg px-3 py-2 font-ui text-[13px] outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)] transition-colors"
            style={{ color: "var(--color-warm)" }}
          />
          <button className="btn-gold !py-2 !px-3" onClick={rollFormula} disabled={!parsedFormula || busy}>
            <i className="fas fa-dice mr-1.5" />Tirar
          </button>
        </div>
        {formulaInvalid && (
          <p className="text-[12px] mt-1.5 italic" style={{ color: "var(--color-ember)" }}>
            Fórmula no válida. Usa el formato XdY(+/-Z), p. ej. 2d6+3.
          </p>
        )}

        {isDM && (
          <label className="flex items-center gap-2 mt-3 font-ui text-[12px] font-semibold cursor-pointer select-none" style={{ color: "var(--color-muted)" }}>
            <input type="checkbox" checked={priv} onChange={(e) => setPriv(e.target.checked)} />
            <i className="fas fa-lock" style={{ color: "var(--color-dim)" }} />Tirada privada (solo tú)
          </label>
        )}
        {err && <p className="text-[12px] mt-2 italic" style={{ color: "var(--color-ember)" }}>{err}</p>}
      </section>

      {/* FEED */}
      <section className="panel p-4">
        <p className="eyebrow mb-3"><i className="fas fa-scroll mr-1.5" style={{ color: "var(--color-bronze)" }} />Tiradas recientes</p>
        {rolls.length === 0 ? (
          <p className="font-ui text-[13px] text-center py-4" style={{ color: "var(--color-dim)" }}>Nadie ha tirado dados todavía.</p>
        ) : (
          <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
            {rolls.map((r) => {
              // No se guarda el modificador aparte: se reconstruye a partir de
              // rolls/total (total = suma(rolls) + modificador) para reutilizar
              // fmtRoll tal cual sin duplicar su lógica de formateo.
              const modifier = r.total - r.rolls.reduce((a, b) => a + b, 0);
              const breakdown = fmtRoll({ formula: r.formula, rolls: r.rolls, modifier, total: r.total });
              const crit = critState(r.formula, r.rolls);
              return (
                <div
                  key={r.id}
                  className={`panel-raised px-3 py-2 flex items-center justify-between gap-3 flex-wrap dice-entry ${
                    crit === "crit" ? "dice-crit" : crit === "fumble" ? "dice-fumble" : ""
                  }`}
                >
                  <div className="min-w-0">
                    <span className="font-ui text-[12px] font-bold" style={{ color: "var(--color-arcane-bright)" }}>{nameFor(r.user_id)}</span>
                    <span className="font-ui text-[12px] mx-1.5" style={{ color: "var(--color-dim)" }}>·</span>
                    <span className="font-ui text-[12px]" style={{ color: "var(--color-warm)" }}>{r.label}</span>
                    {r.private && <i className="fas fa-lock ml-1.5 text-[10px]" style={{ color: "var(--color-dim)" }} title="Tirada privada" />}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {crit === "crit" && (
                      <span className="font-ui text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "var(--color-bronze)", color: "var(--color-night)" }}>¡CRÍTICO!</span>
                    )}
                    {crit === "fumble" && (
                      <span className="font-ui text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "var(--color-ember)", color: "var(--color-night)" }}>PIFIA</span>
                    )}
                    <span className="font-ui text-[13px] font-bold" style={{ color: "var(--color-bronze-bright)" }}>{breakdown}</span>
                    <span className="font-ui text-[10px]" style={{ color: "var(--color-dim)" }}>{fmtTime(r.created_at)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
