"use client";
import { useEffect, useState } from "react";
import { useSession } from "@/components/SessionProvider";
import { loadActiveCharacter } from "@/lib/character";
import { descansar, PRECIO_DESCANSO } from "@/lib/descanso";

export default function PosadaSection({ posada }: { posada: boolean }) {
  const session = useSession();
  const [gold, setGold] = useState<number | null>(null);
  const [room, setRoom] = useState<"comun" | "habitacion">("comun");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let on = true;
    (async () => {
      if (!session?.id) return;
      const c = await loadActiveCharacter(session.id);
      if (on) setGold(c ? c.gold ?? 0 : null);
    })();
    return () => { on = false; };
  }, [session?.id]);

  if (!posada) return null;

  async function rest(kind: "corto" | "largo") {
    if (busy) return;
    const coste = kind === "corto" ? 0 : PRECIO_DESCANSO[room];
    if (kind === "largo" && !confirm(`¿Descansar la noche (${coste} po)? Avanza el reloj 8 horas.`)) return;
    setBusy(true); setMsg(null);
    const r = await descansar(kind, kind === "largo" ? room : undefined);
    if (r.ok) { setGold(r.gold); setMsg(kind === "corto" ? "Descanso corto: +1 h." : `Pasáis la noche. +8 h${coste ? `, -${coste} po` : ""}.`); }
    else setMsg(r.error);
    setBusy(false);
  }

  return (
    <section className="mt-6">
      <p className="eyebrow mb-2"><i className="fas fa-bed mr-2" style={{ color: "var(--color-bronze)" }} />Posada{gold !== null ? <span className="ml-2" style={{ color: "var(--color-bronze-bright)" }}>· {gold} po</span> : null}</p>
      <div className="panel-raised p-4 space-y-3">
        {msg && <p className="font-ui text-[12px]" style={{ color: "var(--color-bronze-bright)" }}>{msg}</p>}
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => rest("corto")} disabled={busy} className="btn-ghost !py-1.5 !px-3 text-[13px] disabled:opacity-40"><i className="fas fa-mug-hot mr-1.5" />Descanso corto (+1 h, gratis)</button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={room} onChange={(e) => setRoom(e.target.value as "comun" | "habitacion")} className="bg-[var(--color-night)] rounded-lg px-2 py-1.5 font-ui text-[13px] border border-[var(--color-line)]" style={{ color: "var(--color-warm)" }}>
            <option value="comun">Cama común — {PRECIO_DESCANSO.comun} po</option>
            <option value="habitacion">Habitación — {PRECIO_DESCANSO.habitacion} po</option>
          </select>
          <button onClick={() => rest("largo")} disabled={busy} className="btn-gold !py-1.5 !px-3 text-[13px] disabled:opacity-40"><i className="fas fa-moon mr-1.5" />Descanso largo (+8 h)</button>
        </div>
      </div>
    </section>
  );
}
