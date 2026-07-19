"use client";
import { useState } from "react";
import { useNpcs, type LocationNpc } from "@/lib/useNpcs";
import NpcChat from "@/components/lugar/NpcChat";

export default function NpcSection({ poiName }: { poiName: string }) {
  const { npcs, ready } = useNpcs(poiName);
  const [openId, setOpenId] = useState<number | null>(null);
  if (!ready || npcs.length === 0) return null;
  const open = npcs.find((n) => n.id === openId) ?? null;

  return (
    <section className="mt-6">
      <p className="eyebrow mb-2"><i className="fas fa-comments mr-2" style={{ color: "var(--color-bronze)" }} />Gente del lugar</p>
      {!open ? (
        <div className="grid sm:grid-cols-2 gap-2">
          {npcs.map((n) => (
            <button key={n.id} onClick={() => setOpenId(n.id)} className="panel-raised p-3 text-left flex items-center gap-3 hover:border-[var(--color-bronze)] transition-colors">
              {n.portrait && <img src={n.portrait} alt="" className="w-10 h-10 rounded-full object-cover border border-[var(--color-line)]" />}
              <span>
                <span className="block font-display font-extrabold text-[15px]" style={{ color: "var(--color-parch)" }}>{n.name}</span>
                {n.role && <span className="block font-ui text-[12px]" style={{ color: "var(--color-dim)" }}>{n.role}</span>}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="panel-raised p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-display font-extrabold text-[17px] gold-text">{open.name}{open.role ? <span className="font-ui text-[12px] ml-2" style={{ color: "var(--color-dim)" }}>· {open.role}</span> : null}</p>
            <button onClick={() => setOpenId(null)} className="btn-ghost !py-1 !px-2 text-[12px]"><i className="fas fa-arrow-left mr-1" />Volver</button>
          </div>
          <NpcChat persona={personaFor(open)} placeholder={`Habla con ${open.name}…`} empty={`Salúdale o pregúntale por el lugar.`} />
        </div>
      )}
    </section>
  );
}

function personaFor(n: LocationNpc): string {
  return `${n.prompt || `Eres ${n.name}${n.role ? `, ${n.role}` : ""}, un personaje del mundo de Exandria.`}\nResponde SIEMPRE en personaje, con brevedad, sin romper la ficción ni revelar que eres una IA.`;
}
