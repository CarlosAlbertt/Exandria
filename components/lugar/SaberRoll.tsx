"use client";
import { useEffect, useState } from "react";
import { useSession } from "@/components/SessionProvider";
import { loadActiveCharacter, saveCharacter, type CharacterData } from "@/lib/character";
import { derive } from "@/lib/derive";
import { rollVisual } from "@/lib/diceBox";
import { roll as rollFallback } from "@/lib/dice";
import { loadLoreRoll, saveLoreRoll, unlockCount } from "@/lib/loreRolls";
import { SABER, saberById } from "@/data/saber";

// "¿Qué sé de esto?": tirada de saber al visitar un lugar. Una sola por lugar y
// personaje (schema_v19). Por tramos de total desbloquea entradas ligadas a
// este sitio que el PJ aún no conozca.
const SABER_SKILLS = ["Historia", "Arcanos", "Religión"] as const;

export default function SaberRoll({ poiName, regionSlug, continent }: { poiName: string; regionSlug: string; continent: string }) {
  const session = useSession();
  const [char, setChar] = useState<(Partial<CharacterData> & { id: string }) | null>(null);
  const [prev, setPrev] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let on = true;
    (async () => {
      if (!session?.id) return;
      const c = await loadActiveCharacter(session.id);
      if (!on || !c) return;
      setChar(c);
      const t = await loadLoreRoll(c.id, poiName);
      if (on) setPrev(t);
    })();
    return () => { on = false; };
  }, [session?.id, poiName]);

  if (!char) return null;

  const unlocked: string[] = Array.isArray(char.lore_unlocked) ? char.lore_unlocked : [];
  // Lo que este lugar puede enseñar: su región, su continente a fondo y lo que
  // esté explícitamente ligado al POI. Solo lo que aún no se sepa.
  const candidates = [
    `reg:${regionSlug}`,
    `cont:${continent}:profundo`,
    ...SABER.filter((e) => e.poi === poiName).map((e) => e.id),
  ].filter((id, i, arr) => arr.indexOf(id) === i && saberById(id) && !unlocked.includes(id));

  const skills = derive(char).skills;

  async function tirar(skillName: string) {
    if (busy || !char) return;
    const s = skills.find((x) => x.name === skillName);
    const mod = s?.mod ?? 0;
    setBusy(true); setMsg(null);
    const r = await rollVisual("1d20", { mod, check: true, label: `${skillName} · ${poiName}` });
    const total = r ? r.total : ((rollFallback("1d20")?.total ?? 0) + mod);

    const n = unlockCount(total);
    const learned = candidates.slice(0, n);
    await saveLoreRoll(char.id, poiName, total);
    if (learned.length > 0) {
      const next = [...unlocked, ...learned];
      await saveCharacter(char.id, { lore_unlocked: next });
      setChar({ ...char, lore_unlocked: next });
    }
    setPrev(total);
    setMsg(
      learned.length > 0
        ? `${total}: recuerdas ${learned.map((id) => saberById(id)?.title).filter(Boolean).join(", ")}. Lo tienes en El Mundo de Exandria.`
        : `${total}: no te viene nada a la memoria sobre este lugar.`
    );
    setBusy(false);
  }

  return (
    <section className="mt-6">
      <p className="eyebrow mb-2"><i className="fas fa-brain mr-2" style={{ color: "var(--color-bronze)" }} />¿Qué sé de esto?</p>
      <div className="panel-raised p-4 space-y-3">
        {msg && <p className="font-ui text-[13px]" style={{ color: "var(--color-bronze-bright)" }}>{msg}</p>}

        {prev !== null ? (
          <p className="font-ui text-[13px]" style={{ color: "var(--color-muted)" }}>
            Ya rebuscaste en tu memoria sobre {poiName} (sacaste <strong style={{ color: "var(--color-bronze-bright)" }}>{prev}</strong>).
            Lo que no recordaste tendrás que averiguarlo de otro modo.
          </p>
        ) : candidates.length === 0 ? (
          <p className="font-ui text-[13px]" style={{ color: "var(--color-muted)" }}>
            Ya sabes cuanto hay que saber de este lugar.
          </p>
        ) : (
          <>
            <p className="font-ui text-[12px]" style={{ color: "var(--color-muted)" }}>
              Una sola tirada por lugar. Cuanto más saques, más recuerdas (10, 15 y 20).
            </p>
            <div className="flex flex-wrap gap-2">
              {SABER_SKILLS.map((name) => {
                const s = skills.find((x) => x.name === name);
                const mod = s?.mod ?? 0;
                return (
                  <button key={name} onClick={() => tirar(name)} disabled={busy}
                    className="btn-ghost !py-1.5 !px-3 text-[13px] disabled:opacity-40">
                    <i className="fas fa-dice-d20 mr-1.5" />{name} {mod >= 0 ? `+${mod}` : mod}
                    {s?.proficient && <i className="fas fa-star ml-1.5 text-[9px]" style={{ color: "var(--color-bronze)" }} />}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
