"use client";
import { useState } from "react";
import { useChronicle } from "@/lib/useChronicle";
import { aceptarEncargo } from "@/lib/encargo";

// Tablón de misiones del POI: ofertas (status 'oferta') publicadas aquí por el
// DM. El jugador acepta → pasa a 'activa' (endpoint service_role) y aparece en
// /cronica para todo el grupo. Las quests vienen de useChronicle (realtime).
export default function TablonSection({ poiName }: { poiName: string }) {
  const { quests, ready } = useChronicle();
  const [busy, setBusy] = useState<number | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const ofertas = quests.filter((q) => q.status === "oferta" && q.poi_name === poiName);
  if (!ready || ofertas.length === 0) return null;

  async function accept(id: number) {
    if (busy != null) return;
    setBusy(id); setMsg(null);
    const r = await aceptarEncargo(id);
    if (r.ok) setMsg("Encargo aceptado. Lo tenéis en la Crónica.");
    else setMsg(r.error);
    setBusy(null);
  }

  return (
    <section className="mt-6">
      <p className="eyebrow mb-2"><i className="fas fa-scroll mr-2" style={{ color: "var(--color-bronze)" }} />Tablón de misiones</p>
      {msg && <p className="font-ui text-[12px] mb-2" style={{ color: "var(--color-bronze-bright)" }}>{msg}</p>}
      <div className="space-y-2">
        {ofertas.map((q) => (
          <div key={q.id} className="panel-raised p-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <p className="font-display font-extrabold text-[15px]" style={{ color: "var(--color-parch)" }}>{q.title}</p>
                {q.reward && <p className="font-ui text-[12px] mt-0.5" style={{ color: "var(--color-bronze)" }}><i className="fas fa-coins mr-1.5" />{q.reward}</p>}
              </div>
              <button onClick={() => accept(q.id)} disabled={busy != null} className="btn-gold !py-1.5 !px-3 text-[13px] disabled:opacity-40 shrink-0">
                <i className="fas fa-hand-fist mr-1.5" />Aceptar encargo
              </button>
            </div>
            {q.body && <p className="font-body text-[14px] leading-relaxed mt-2" style={{ color: "var(--color-warm)" }}>{q.body}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
