"use client";
import { useEffect, useState } from "react";
import { useSession } from "@/components/SessionProvider";
import { loadActiveCharacter } from "@/lib/character";
import { useLoreRevealed } from "@/lib/useLoreRevealed";
import { SABER, scopeLabel, type SaberEntry } from "@/data/saber";
import { knows, isListed, lockReason, EMPTY_CTX, type SaberCtx } from "@/lib/saber";

// "Saber del mundo": lo que TU personaje sabe. De salida conoces lo básico de
// los continentes, tu continente a fondo, tu región y tu deidad; las pericias
// abren además la capa erudita. Lo demás se descubre jugando (tomos, misiones,
// el DM, o una tirada in situ) y entra por `lore_unlocked`.
export default function SaberSection() {
  const session = useSession();
  const isDm = session?.role === "dm";
  const { revealed, toggle } = useLoreRevealed();
  const [ctx, setCtx] = useState<SaberCtx>({ ...EMPTY_CTX });
  const [onlyKnown, setOnlyKnown] = useState(false);

  useEffect(() => {
    let on = true;
    (async () => {
      if (!session?.id) return;
      const c = isDm ? null : await loadActiveCharacter(session.id);
      if (!on) return;
      setCtx({
        isDm,
        originContinent: c?.origin_continent ?? null,
        originRegion: c?.origin_region ?? null,
        deity: c?.deity ?? null,
        skills: c?.skills ?? [],
        unlocked: Array.isArray(c?.lore_unlocked) ? c!.lore_unlocked : [],
        revealed: [],
      });
    })();
    return () => { on = false; };
  }, [session?.id, isDm]);

  // `revealed` viene del hook (realtime); se compone aquí para no recargar la ficha.
  const full: SaberCtx = { ...ctx, isDm, revealed };

  const listed = SABER.filter((e) => isListed(e, full));
  const visible = onlyKnown ? listed.filter((e) => knows(e, full)) : listed;
  const groups = new Map<string, SaberEntry[]>();
  for (const e of visible) {
    const g = scopeLabel(e.scope);
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g)!.push(e);
  }
  const known = listed.filter((e) => knows(e, full)).length;

  return (
    <section className="mb-20 reveal">
      <h2 className="font-display text-2xl font-bold mb-3 flex items-center gap-3" style={{ color: "var(--color-parch)" }}>
        <i className="fas fa-book-skull text-[var(--color-arcane)]" /> Saber del mundo
      </h2>
      <p className="prose-lore !text-[15px] mb-4 max-w-2xl">
        Sabes lo que tu personaje sabría: algo de los continentes, tu tierra y tu fe. Lo demás se gana
        leyendo, viajando y jugando.
      </p>

      <div className="flex items-center gap-3 flex-wrap mb-6">
        <span className="font-ui text-[12px]" style={{ color: "var(--color-dim)" }}>
          Conoces <strong style={{ color: "var(--color-bronze-bright)" }}>{known}</strong> de {listed.length} entradas
        </span>
        <button onClick={() => setOnlyKnown((v) => !v)} className="btn-ghost !py-1 !px-2.5 text-[11px]">
          <i className={`fas ${onlyKnown ? "fa-eye" : "fa-filter"} mr-1`} />{onlyKnown ? "Ver todo" : "Solo lo que sé"}
        </button>
      </div>

      {[...groups.entries()].map(([group, entries]) => (
        <div key={group} className="mb-8">
          <p className="eyebrow mb-3" style={{ color: "var(--color-bronze)" }}>{group}</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {entries.map((e) => {
              const open = knows(e, full);
              const isRevealed = revealed.includes(e.id);
              return (
                <div key={e.id} className="panel-raised p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-ui text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: "var(--color-dim)" }}>{e.topic}</p>
                      <p className="font-display font-extrabold text-[15px]" style={{ color: "var(--color-parch)" }}>{e.title}</p>
                    </div>
                    {isDm && e.scope.kind === "secreto" && (
                      <button onClick={() => toggle(e.id)} title={isRevealed ? "Ocultar a los jugadores" : "Revelar a los jugadores"}
                        className="btn-ghost !py-1 !px-2 text-[11px] shrink-0" style={{ color: isRevealed ? "var(--color-primitivo)" : "var(--color-dim)" }}>
                        <i className={`fas ${isRevealed ? "fa-eye" : "fa-eye-slash"} mr-1`} />{isRevealed ? "Visible" : "Oculto"}
                      </button>
                    )}
                  </div>
                  {open ? (
                    <p className="prose-lore !text-[14px] !mb-0 mt-2 whitespace-pre-wrap">{e.text}</p>
                  ) : (
                    <p className="font-ui text-[12px] italic mt-2 flex items-start gap-1.5" style={{ color: "var(--color-dim)" }}>
                      <i className="fas fa-lock mt-0.5" />{lockReason(e)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}
