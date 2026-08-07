"use client";
import { useEffect, useState } from "react";
import { useNpcs, type LocationNpc } from "@/lib/useNpcs";
import NpcChat from "@/components/lugar/NpcChat";
import { useChronicle } from "@/lib/useChronicle";
import { useSession } from "@/components/SessionProvider";
import { loadActiveCharacter } from "@/lib/character";
import { aceptarEncargo, entregarMision } from "@/lib/encargo";
import { opcionesDeMision, type OpcionDialogo } from "@/lib/misiones";

export default function NpcSection({ poiName, ambient }: { poiName: string; ambient?: string }) {
  const { npcs, ready } = useNpcs(poiName);
  const { quests } = useChronicle();
  const session = useSession();
  const [openId, setOpenId] = useState<number | null>(null);
  const [fichaId, setFichaId] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  // La ficha EN JUEGO, como ya hacen SaberRoll, PosadaSection y ShopSection.
  // Sin ella no hay opciones de misión: el DM no tiene ficha.
  useEffect(() => {
    if (!session?.id) { setFichaId(null); return; }
    let on = true;
    loadActiveCharacter(session.id).then((c) => { if (on) setFichaId(c?.id ?? null); });
    return () => { on = false; };
  }, [session?.id]);

  if (!ready || npcs.length === 0) return null;
  const open = npcs.find((n) => n.id === openId) ?? null;

  // Las de misión salen de `lib/misiones.ts`, no de la IA. `useChronicle` es
  // realtime sobre `quests`, así que al aceptar o entregar la opción se
  // recalcula sola y no hay que refrescar nada a mano.
  const misionOpts = open ? opcionesDeMision(quests, open.id, fichaId) : [];

  async function accion(o: Extract<OpcionDialogo, { accion: "aceptar" | "entregar" }>) {
    if (!open) return;
    setAviso(null);
    const r = o.accion === "aceptar" ? await aceptarEncargo(o.questId) : await entregarMision(o.questId, open.id);
    setAviso(r.ok
      ? (o.accion === "aceptar" ? "Encargo aceptado. Lo tienes en la Crónica." : "Misión entregada.")
      : r.error);
  }

  return (
    <section className="mt-6">
      <p className="eyebrow mb-2"><i className="fas fa-comments mr-2" style={{ color: "var(--color-bronze)" }} />Gente del lugar</p>
      {!open ? (
        <div className="grid sm:grid-cols-2 gap-2">
          {npcs.map((n) => (
            <button key={n.id} onClick={() => { setOpenId(n.id); setAviso(null); }} className="panel-raised p-3 text-left flex items-center gap-3 hover:border-[var(--color-bronze)] transition-colors">
              {n.portrait && <img src={n.portrait} alt="" className="w-10 h-10 rounded-full object-cover border border-[var(--color-line)]" />}
              <span>
                <span className="block font-display font-extrabold text-[15px]" style={{ color: "var(--color-parch)" }}>{n.name}</span>
                {n.role && <span className="block font-ui text-[12px]" style={{ color: "var(--color-dim)" }}>{n.role}</span>}
              </span>
              {/* Que tiene algo que contarte: se ve desde la tarjeta, sin
                  entrar a hablar con los seis PNJ del sitio a ver cuál era. */}
              {opcionesDeMision(quests, n.id, fichaId).length > 0 && (
                <i className="fas fa-exclamation ml-auto shrink-0" title="Tiene algo para ti" style={{ color: "var(--color-bronze-bright)" }} />
              )}
            </button>
          ))}
        </div>
      ) : (
        <div className="panel-raised p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-display font-extrabold text-[17px] gold-text">{open.name}{open.role ? <span className="font-ui text-[12px] ml-2" style={{ color: "var(--color-dim)" }}>· {open.role}</span> : null}</p>
            <button onClick={() => { setOpenId(null); setAviso(null); }} className="btn-ghost !py-1 !px-2 text-[12px]"><i className="fas fa-arrow-left mr-1" />Volver</button>
          </div>
          {aviso && <p className="font-ui text-[12px]" style={{ color: "var(--color-bronze-bright)" }}>{aviso}</p>}
          <NpcChat persona={personaFor(open, ambient)} placeholder={`Habla con ${open.name}…`} empty={`Salúdale o pregúntale por el lugar.`} memoryRef={`npc:${open.id}`}
            conOpciones misionOpts={misionOpts} onMision={accion} />
        </div>
      )}
    </section>
  );
}

function personaFor(n: LocationNpc, ambient?: string): string {
  return `${n.prompt || `Eres ${n.name}${n.role ? `, ${n.role}` : ""}, un personaje del mundo de Exandria.`}\nResponde SIEMPRE en personaje, con brevedad, sin romper la ficción ni revelar que eres una IA.${ambient ? `\n${ambient}` : ""}`;
}
