"use client";
import { useDiceFeed, esNota } from "@/lib/useDiceFeed";
import { useParty } from "@/lib/character";
import { fmtRoll, critState } from "@/lib/dice";

// Las últimas tiradas del grupo, en una línea, para ver el resultado sin salir
// del tablero. El panel completo (dado rápido, fórmula libre, peticiones del
// DM) sigue en /personaje.
export default function DiceFeedStrip({ limit = 6 }: { limit?: number }) {
  const { rolls } = useDiceFeed();
  const { party } = useParty();
  const nameFor = (id: string) => party.find((p) => p.user_id === id)?.username ?? "alguien";

  if (rolls.length === 0) return null;

  return (
    <section className="panel p-3">
      <p className="eyebrow mb-2"><i className="fas fa-dice-d20 mr-1.5" style={{ color: "var(--color-bronze)" }} />Últimas tiradas</p>
      <div className="space-y-1">
        {rolls.slice(0, limit).map((r) => {
          const nota = esNota(r);
          const modifier = r.total - r.rolls.reduce((a, b) => a + b, 0);
          const crit = nota ? null : critState(r.formula, r.rolls);
          return (
            <div key={r.id} className="flex items-center justify-between gap-3 text-[12px]">
              <span className="min-w-0 truncate">
                <span className="font-ui font-bold" style={{ color: "var(--color-arcane-bright)" }}>{nameFor(r.user_id)}</span>
                <span className="font-ui mx-1.5" style={{ color: "var(--color-dim)" }}>·</span>
                <span className="font-ui" style={{ color: "var(--color-warm)" }}>{r.label}</span>
              </span>
              <span className="shrink-0 flex items-center gap-2">
                {crit === "crit" && <span className="font-ui text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "var(--color-bronze)", color: "var(--color-night)" }}>¡CRÍTICO!</span>}
                {crit === "fumble" && <span className="font-ui text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "var(--color-ember)", color: "var(--color-night)" }}>PIFIA</span>}
                {nota ? (
                  <span className="font-ui text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "var(--color-arcane)", color: "var(--color-night)" }}>CONJURO</span>
                ) : (
                  <span className="font-ui font-bold" style={{ color: "var(--color-bronze-bright)" }}>
                    {fmtRoll({ formula: r.formula, rolls: r.rolls, modifier, total: r.total })}
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
