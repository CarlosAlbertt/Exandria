"use client";

import { ABILITIES, AbilityKey, abilityMod, fmtMod } from "@/data/rules";
import { reachedAsiLevels, proficiencyBonus, maxHp } from "@/data/leveling";
import type { Asi } from "@/lib/character";

type Props = {
  level: number;
  onLevel: (n: number) => void;
  clsSlug: string | null;
  hitDie: number;
  /** base + trasfondo (sin ASI) por aptitud */
  preAsi: Record<AbilityKey, number>;
  asi: Asi;
  onAsi: (levelKey: string, key: AbilityKey, delta: number) => void;
};

/** Suma del reparto ASI de un hito. */
function sumAsi(a: Partial<Record<AbilityKey, number>> | undefined): number {
  if (!a) return 0;
  return (Object.values(a) as number[]).reduce((s, v) => s + (v ?? 0), 0);
}

/** Total ASI acumulado por aptitud a lo largo de todos los hitos. */
export function asiTotals(asi: Asi): Record<AbilityKey, number> {
  const out = { fue: 0, des: 0, con: 0, int: 0, sab: 0, car: 0 } as Record<AbilityKey, number>;
  for (const lvl of Object.keys(asi)) {
    for (const k of Object.keys(asi[lvl]) as AbilityKey[]) out[k] += asi[lvl][k] ?? 0;
  }
  return out;
}

export default function LevelPanel({ level, onLevel, clsSlug, hitDie, preAsi, asi, onAsi }: Props) {
  const hitos = reachedAsiLevels(clsSlug, level);
  const totals = asiTotals(asi);
  const conTotal = preAsi.con + totals.con;
  const hp = maxHp(hitDie, level, abilityMod(conTotal));
  const prof = proficiencyBonus(level);

  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <p className="eyebrow">Nivel</p>
          <button className="stat-btn" onClick={() => onLevel(Math.max(1, level - 1))} disabled={level <= 1}>−</button>
          <span className="font-display text-2xl font-extrabold w-10 text-center" style={{ color: "var(--color-arcane-bright)" }}>{level}</span>
          <button className="stat-btn" onClick={() => onLevel(Math.min(20, level + 1))} disabled={level >= 20}>+</button>
        </div>
        <div className="flex gap-5">
          <div className="text-center"><p className="eyebrow !text-[9px]">PG máx</p><p className="font-display font-extrabold" style={{ color: "var(--color-ember)" }}>{hp}</p></div>
          <div className="text-center"><p className="eyebrow !text-[9px]">Comp.</p><p className="font-display font-extrabold" style={{ color: "var(--color-bronze)" }}>{fmtMod(prof)}</p></div>
        </div>
      </div>

      {hitos.length === 0 ? (
        <p className="font-ui text-[13px]" style={{ color: "var(--color-dim)" }}>Aún sin mejoras de característica (primera en el nivel {reachedAsiLevels(clsSlug, 20)[0] ?? 4}).</p>
      ) : (
        <div className="space-y-3">
          {hitos.map((lv) => {
            const spent = sumAsi(asi[String(lv)]);
            return (
              <div key={lv} className="panel-raised p-3">
                <p className="eyebrow mb-2">Mejora de nivel {lv} · <span style={{ color: spent === 2 ? "var(--color-primitivo)" : "var(--color-ember)" }}>{spent}/2</span></p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ABILITIES.map((a) => {
                    const cur = asi[String(lv)]?.[a.key] ?? 0;
                    const total = preAsi[a.key] + totals[a.key];
                    const canInc = spent < 2 && total < 20;
                    return (
                      <div key={a.key} className="flex items-center gap-1.5">
                        <span className="font-ui text-[11px] font-bold w-8" style={{ color: "var(--color-muted)" }}>{a.abbr}</span>
                        <button className="stat-btn !w-7 !h-7" onClick={() => onAsi(String(lv), a.key, -1)} disabled={cur <= 0}>−</button>
                        <span className="font-ui font-bold w-5 text-center" style={{ color: "var(--color-bronze-bright)" }}>+{cur}</span>
                        <button className="stat-btn !w-7 !h-7" onClick={() => onAsi(String(lv), a.key, +1)} disabled={!canInc}>+</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
