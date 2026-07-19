"use client";
import { useEffect, useState } from "react";
import { useSession } from "@/components/SessionProvider";
import { loadActiveCharacter } from "@/lib/character";
import { useLoreRevealed } from "@/lib/useLoreRevealed";
import { LORE_TIERS, LORE_TIER_LABEL, type LoreEntry } from "@/data/loreTiers";

// "Saber del mundo": la lore por niveles. Común para todos; erudito si el PJ
// tiene la pericia; secreto si el DM lo ha revelado. El DM lo ve todo y puede
// revelar/ocultar los secretos in situ.
export default function SaberSection() {
  const session = useSession();
  const isDm = session?.role === "dm";
  const { revealed, toggle } = useLoreRevealed();
  const [skills, setSkills] = useState<string[]>([]);

  useEffect(() => {
    let on = true;
    (async () => {
      if (!session?.id || isDm) return;
      const c = await loadActiveCharacter(session.id);
      if (on && c?.skills) setSkills(c.skills);
    })();
    return () => { on = false; };
  }, [session?.id, isDm]);

  const hasSkill = (s?: string) => !!s && skills.includes(s);
  // ¿Puede el visor ver el CONTENIDO de esta entrada?
  const canRead = (e: LoreEntry): boolean => {
    if (isDm) return true;
    if (e.tier === "comun") return true;
    if (e.tier === "erudito") return hasSkill(e.unlockSkill);
    return revealed.includes(e.id); // secreto
  };

  const comun = LORE_TIERS.filter((e) => e.tier === "comun");
  const erudito = LORE_TIERS.filter((e) => e.tier === "erudito");
  const secreto = LORE_TIERS.filter((e) => e.tier === "secreto");
  // Los secretos aún no revelados no se listan a los jugadores (ni su título).
  const secretoVisible = isDm ? secreto : secreto.filter((e) => revealed.includes(e.id));

  return (
    <section className="mb-20 reveal">
      <h2 className="font-display text-2xl font-bold mb-3 flex items-center gap-3" style={{ color: "var(--color-parch)" }}>
        <i className="fas fa-book-skull text-[var(--color-arcane)]" /> Saber del mundo
      </h2>
      <p className="prose-lore !text-[15px] mb-8 max-w-2xl">
        No todos saben lo mismo. Lo <strong>común</strong> lo conoce cualquiera; lo <strong>erudito</strong> se abre a quien
        tiene el estudio (tus pericias); lo <strong>secreto</strong> solo sale a la luz jugando.
      </p>

      <TierBlock label={LORE_TIER_LABEL.comun} icon="fa-users" color="var(--color-primitivo)"
        entries={comun} canRead={canRead} />
      <TierBlock label={LORE_TIER_LABEL.erudito} icon="fa-graduation-cap" color="var(--color-arcane)"
        entries={erudito} canRead={canRead} lockedNote={(e) => `Conocimiento erudito · requiere ${e.unlockSkill}`} />
      {(secretoVisible.length > 0 || isDm) && (
        <TierBlock label={LORE_TIER_LABEL.secreto} icon="fa-user-secret" color="var(--color-ember)"
          entries={secretoVisible} canRead={canRead}
          dmToggle={isDm ? { revealed, toggle } : undefined} />
      )}
    </section>
  );
}

function TierBlock({ label, icon, color, entries, canRead, lockedNote, dmToggle }: {
  label: string; icon: string; color: string; entries: LoreEntry[];
  canRead: (e: LoreEntry) => boolean;
  lockedNote?: (e: LoreEntry) => string;
  dmToggle?: { revealed: string[]; toggle: (id: string) => void };
}) {
  if (entries.length === 0) return null;
  return (
    <div className="mb-8">
      <p className="eyebrow mb-3" style={{ color }}><i className={`fas ${icon} mr-1.5`} />{label}</p>
      <div className="grid sm:grid-cols-2 gap-3">
        {entries.map((e) => {
          const open = canRead(e);
          const isRevealed = dmToggle?.revealed.includes(e.id);
          return (
            <div key={e.id} className="panel-raised p-4" style={{ borderColor: open ? undefined : "var(--color-line)" }}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-ui text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: "var(--color-dim)" }}>{e.topic}</p>
                  <p className="font-display font-extrabold text-[15px]" style={{ color: "var(--color-parch)" }}>{e.title}</p>
                </div>
                {dmToggle && (
                  <button onClick={() => dmToggle.toggle(e.id)} title={isRevealed ? "Ocultar a los jugadores" : "Revelar a los jugadores"}
                    className="btn-ghost !py-1 !px-2 text-[11px] shrink-0" style={{ color: isRevealed ? "var(--color-primitivo)" : "var(--color-dim)" }}>
                    <i className={`fas ${isRevealed ? "fa-eye" : "fa-eye-slash"} mr-1`} />{isRevealed ? "Visible" : "Oculto"}
                  </button>
                )}
              </div>
              {open ? (
                <p className="prose-lore !text-[14px] !mb-0 mt-2">{e.text}</p>
              ) : (
                <p className="font-ui text-[12px] italic mt-2 flex items-center gap-1.5" style={{ color: "var(--color-dim)" }}>
                  <i className="fas fa-lock" />{lockedNote ? lockedNote(e) : "Aún por descubrir"}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
