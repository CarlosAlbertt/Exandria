"use client";

import { ABILITIES, AbilityKey, abilityMod, fmtMod } from "@/data/rules";
import { reachedAsiLevels, proficiencyBonus, rollHitDie, maxHpFromRolls, xpForNext } from "@/data/leveling";
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
  hpRolls: Record<string, number>;
  onRollHp: (level: number, value: number) => void;
  readOnly?: boolean;
  canRollHp?: boolean;
  xp?: number;
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

export default function LevelPanel({ level, onLevel, clsSlug, hitDie, preAsi, asi, onAsi, hpRolls, onRollHp, readOnly = false, canRollHp = false, xp = 0 }: Props) {
  const hitos = reachedAsiLevels(clsSlug, level);
  const totals = asiTotals(asi);
  const conTotal = preAsi.con + totals.con;
  const hp = maxHpFromRolls(hitDie, level, abilityMod(conTotal), hpRolls);
  const prof = proficiencyBonus(level);

  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <p className="eyebrow">Nivel</p>
          {!readOnly && (
            <button className="stat-btn" onClick={() => onLevel(Math.max(1, level - 1))} disabled={level <= 1}>−</button>
          )}
          <span className="font-display text-2xl font-extrabold w-10 text-center" style={{ color: "var(--color-arcane-bright)" }}>{level}</span>
          {!readOnly && (
            <button className="stat-btn" onClick={() => onLevel(Math.min(20, level + 1))} disabled={level >= 20}>+</button>
          )}
        </div>
        <div className="flex gap-5">
          <div className="text-center"><p className="eyebrow !text-[9px]">PG máx</p><p className="font-display font-extrabold" style={{ color: "var(--color-ember)" }}>{hp}</p></div>
          <div className="text-center"><p className="eyebrow !text-[9px]">Comp.</p><p className="font-display font-extrabold" style={{ color: "var(--color-bronze)" }}>{fmtMod(prof)}</p></div>
          <div className="text-center"><p className="eyebrow !text-[9px]">XP</p><p className="font-display font-extrabold" style={{ color: "var(--color-arcane)" }}>{xp}</p></div>
        </div>
      </div>

      <div className="h-1.5 rounded-full overflow-hidden mt-2" style={{ background: "var(--color-raised)" }}>
        <div className="h-full rounded-full" style={{ width: `${level >= 20 ? 100 : Math.min(100, (xp / xpForNext(level)) * 100)}%`, background: "linear-gradient(90deg, var(--color-arcane-deep), var(--color-arcane))" }} />
      </div>
      <p className="font-ui text-[10px] mt-1" style={{ color: "var(--color-dim)" }}>{level >= 20 ? "Nivel máximo" : `${xp} / ${xpForNext(level)} XP`}</p>

      <div className="mb-4">
        <p className="eyebrow mb-2">PG por nivel</p>
        <div className="space-y-1.5">
          <div className="panel-raised px-3 py-1.5 flex items-center justify-between">
            <span className="font-ui text-[12px] font-bold" style={{ color: "var(--color-muted)" }}>Nivel 1</span>
            <span className="font-ui text-[12px]" style={{ color: "var(--color-primitivo)" }}>máx</span>
          </div>
          {Array.from({ length: Math.max(0, level - 1) }, (_, i) => i + 2).map((lv) => {
            const raw = hpRolls[String(lv)];
            const has = typeof raw === "number";
            return (
              <div key={lv} className="panel-raised px-3 py-1.5 flex items-center justify-between gap-2">
                <span className="font-ui text-[12px] font-bold" style={{ color: "var(--color-muted)" }}>Nivel {lv}</span>
                <span className="font-ui text-[12px]" style={{ color: has ? "var(--color-bronze-bright)" : "var(--color-dim)" }}>
                  {has ? `d${hitDie} = ${raw}` : "— media"}
                </span>
                {(!readOnly || canRollHp) && (
                  <button className="stat-btn !w-auto !h-7 !px-2 flex items-center gap-1" onClick={() => onRollHp(lv, rollHitDie(hitDie))}>
                    <i className="fa-solid fa-dice-d20" aria-hidden="true"></i>
                    <span className="font-ui text-[11px] font-bold">Tirar</span>
                  </button>
                )}
              </div>
            );
          })}
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
                        {!readOnly && (
                          <button className="stat-btn !w-7 !h-7" onClick={() => onAsi(String(lv), a.key, -1)} disabled={cur <= 0}>−</button>
                        )}
                        <span className="font-ui font-bold w-5 text-center" style={{ color: "var(--color-bronze-bright)" }}>+{cur}</span>
                        {!readOnly && (
                          <button className="stat-btn !w-7 !h-7" onClick={() => onAsi(String(lv), a.key, +1)} disabled={!canInc}>+</button>
                        )}
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
