"use client";

import { useState } from "react";
import {
  ABILITIES, abilityMod, fmtMod,
  POINT_BUY_COST, POINT_BUY_BUDGET, POINT_BUY_MIN, POINT_BUY_MAX,
  type AbilityKey,
} from "@/data/rules";
import { STANDARD_ARRAY, dropLowest, saveStatRoll, type Assign, type StatMethod } from "@/lib/statRolls";
import { rollVisual } from "@/lib/diceBox";
import { roll as rollFallback } from "@/lib/dice";

// Paso de Aptitudes (Fase K). El método se elige UNA vez: al confirmarlo se
// inserta en `stat_rolls` (inmutable en la BD — PK sin policy de UPDATE; solo
// el DM puede borrar la fila para resetear la tirada). Por eso en cada acción
// de elección llamamos SIEMPRE primero a `onMethod(m)` y, si procede, después
// a `onRolled(scores)`: el padre (page.tsx) fija el método y limpia `assign`
// en un único sitio, sin ambigüedad sobre el orden.
//
// Las reglas de guardas (presupuesto de compra de puntos, +2 máx./+3 total de
// bonus) viven AQUÍ (movidas desde el antiguo capítulo de page.tsx). `onBase`
// y `onBonus` que recibe este componente desde page.tsx son setters directos
// sin validar: toda la validación pasa por `setBaseGuarded`/`setBonusGuarded`.
export default function AbilitiesStep({
  userId, method, rolled, assign, base, bonus, canBonus,
  onMethod, onRolled, onAssign, onBase, onBonus,
}: {
  userId?: string;
  method: StatMethod | null;
  rolled: number[];
  assign: Assign;
  base: Record<AbilityKey, number>;
  bonus: Record<AbilityKey, number>;
  canBonus: Record<AbilityKey, boolean>;
  onMethod: (m: StatMethod) => void;
  onRolled: (scores: number[]) => void;
  onAssign: (a: Assign) => void;
  onBase: (k: AbilityKey, v: number) => void;
  onBonus: (k: AbilityKey, v: number) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0); // tirada N de 6 en curso (0 = ninguna)
  const [error, setError] = useState<string | null>(null);

  const pointsSpent = ABILITIES.reduce((sum, a) => sum + (POINT_BUY_COST[base[a.key]] ?? 0), 0);
  const remaining = POINT_BUY_BUDGET - pointsSpent;
  const totalBonus = ABILITIES.reduce((s, a) => s + (bonus[a.key] ?? 0), 0);
  const assignedCount = (Object.keys(assign) as AbilityKey[]).filter((k) => assign[k] !== null).length;

  const setBaseGuarded = (k: AbilityKey, v: number) => {
    if (v < POINT_BUY_MIN || v > POINT_BUY_MAX) return;
    const cost = (POINT_BUY_COST[v] ?? 0) - (POINT_BUY_COST[base[k]] ?? 0);
    if (pointsSpent + cost > POINT_BUY_BUDGET) return;
    onBase(k, v);
  };
  const setBonusGuarded = (k: AbilityKey, v: number) => {
    if (v < 0 || v > 2) return;
    const next = { ...bonus, [k]: v };
    const nextTotal = ABILITIES.reduce((s, a) => s + (next[a.key] ?? 0), 0);
    if (nextTotal > 3) return;
    onBonus(k, v);
  };

  async function pickDados() {
    if (!userId || busy) return;
    setBusy(true);
    setError(null);
    onMethod("dados");
    const scores: number[] = [];
    for (let i = 0; i < 6; i++) {
      setProgress(i + 1);
      const r = await rollVisual("4d6", { label: `Aptitud ${i + 1} de 6` });
      const dice = r ? r.rolls : (rollFallback("4d6")?.rolls ?? []);
      scores.push(dropLowest(dice));
    }
    onRolled(scores);
    const err = await saveStatRoll(userId, "dados", scores);
    if (err) setError(err);
    setProgress(0);
    setBusy(false);
  }

  async function pickArray() {
    if (busy) return;
    setBusy(true);
    setError(null);
    onMethod("array");
    onRolled([...STANDARD_ARRAY]);
    if (userId) {
      const err = await saveStatRoll(userId, "array", STANDARD_ARRAY);
      if (err) setError(err);
    }
    setBusy(false);
  }

  async function pickPointbuy() {
    if (busy) return;
    setBusy(true);
    setError(null);
    onMethod("pointbuy");
    if (userId) {
      const err = await saveStatRoll(userId, "pointbuy", []);
      if (err) setError(err);
    }
    setBusy(false);
  }

  // Índice -> valor para los selects de dados/array (los valores pueden
  // repetirse, p. ej. dos 13, por eso `assign` guarda índices, no valores).
  function assignIndex(k: AbilityKey, raw: string) {
    if (raw === "") { onAssign({ ...assign, [k]: null }); return; }
    const idx = parseInt(raw, 10);
    onAssign({ ...assign, [k]: idx });
    onBase(k, rolled[idx]);
  }

  /* -------------------------- A. Tirada en curso -------------------------- */
  if (busy && progress > 0) {
    return (
      <div className="panel p-8 text-center">
        <p className="eyebrow mb-3">Tirando 4d6, descartando el menor</p>
        <p className="font-display text-3xl font-extrabold gold-text mb-2">Tirada {progress} de 6</p>
        <p className="text-sm" style={{ color: "var(--color-muted)" }}>
          Lanza el dado en el tablero para continuar.
        </p>
      </div>
    );
  }

  /* --------------------------- B. Elegir método --------------------------- */
  if (!method) {
    return (
      <div>
        <h2 className="font-display text-xl font-bold mb-2" style={{ color: "var(--color-parch)" }}>
          ¿Cómo obtienes tus aptitudes?
        </h2>
        <p className="font-ui text-[12px] font-bold mb-5" style={{ color: "var(--color-ember)" }}>
          <i className="fas fa-triangle-exclamation mr-1.5" />
          Solo puedes elegir una vez: la tirada no se puede repetir.
        </p>

        <div className="grid sm:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={pickDados}
            disabled={!userId || busy}
            className="pick-card p-5 text-left disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            style={{ ["--accent" as string]: "var(--color-ember)", ["--glow" as string]: "rgba(239,106,61,0.3)" }}
          >
            <i className="fas fa-dice-d6 text-2xl mb-3" style={{ color: "var(--color-ember)" }} />
            <h3 className="font-display font-bold mb-1" style={{ color: "var(--color-parch)" }}>Tirar 4d6</h3>
            <p className="text-sm" style={{ color: "var(--color-muted)" }}>
              4d6 descartando el menor, seis veces, con los dados físicos.
            </p>
            {!userId && (
              <p className="font-ui text-[11px] font-bold mt-3" style={{ color: "var(--color-ember)" }}>
                Los dados necesitan sesión iniciada
              </p>
            )}
          </button>

          <button
            type="button"
            onClick={pickArray}
            disabled={busy}
            className="pick-card p-5 text-left disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ ["--accent" as string]: "var(--color-arcane)", ["--glow" as string]: "rgba(69,199,189,0.3)" }}
          >
            <i className="fas fa-list-ol text-2xl mb-3" style={{ color: "var(--color-arcane)" }} />
            <h3 className="font-display font-bold mb-1" style={{ color: "var(--color-parch)" }}>Array estándar</h3>
            <p className="text-sm" style={{ color: "var(--color-muted)" }}>
              15 / 14 / 13 / 12 / 10 / 8 — repártelos como quieras.
            </p>
          </button>

          <button
            type="button"
            onClick={pickPointbuy}
            disabled={busy}
            className="pick-card p-5 text-left disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ ["--accent" as string]: "var(--color-bronze)", ["--glow" as string]: "rgba(201,163,92,0.35)" }}
          >
            <i className="fas fa-coins text-2xl mb-3" style={{ color: "var(--color-bronze)" }} />
            <h3 className="font-display font-bold mb-1" style={{ color: "var(--color-parch)" }}>Compra de puntos</h3>
            <p className="text-sm" style={{ color: "var(--color-muted)" }}>
              27 puntos, valores entre 8 y 15. El sistema clásico.
            </p>
          </button>
        </div>

        {error && (
          <p className="font-ui text-[12px] font-bold mt-4" style={{ color: "var(--color-ember)" }}>
            <i className="fas fa-circle-exclamation mr-1.5" />{error}
          </p>
        )}
      </div>
    );
  }

  /* ------------------------- C/D/E/F/G. Método fijo ------------------------ */
  const isPointbuy = method === "pointbuy";
  const sortedPool = [...rolled].sort((a, b) => b - a);

  return (
    <div>
      <h2 className="font-display text-xl font-bold mb-1" style={{ color: "var(--color-parch)" }}>
        Reparte tus aptitudes
      </h2>
      <p className="text-sm mb-4" style={{ color: "var(--color-muted)" }}>
        {isPointbuy
          ? <>Compra de puntos (27): valores 8–15.</>
          : <>Método: <strong>{method === "dados" ? "Tirada de dados (4d6)" : "Array estándar"}</strong>. Asigna cada valor a una aptitud.</>
        } Después suma <strong>+3 de tu trasfondo</strong> (máx. +2 a una aptitud).
      </p>

      <div className="flex flex-wrap gap-3 mb-6">
        {isPointbuy ? (
          <span className="chip" data-on={remaining >= 0}>Puntos restantes: {remaining}</span>
        ) : (
          <span className="chip" data-on={assignedCount === 6}>
            Tus valores: {sortedPool.join(", ")} — asignados {assignedCount}/6
          </span>
        )}
        <span className="chip" data-on={totalBonus === 3}>Bonus de trasfondo: {totalBonus}/3</span>
      </div>

      {error && (
        <p className="font-ui text-[12px] font-bold mb-4" style={{ color: "var(--color-ember)" }}>
          <i className="fas fa-circle-exclamation mr-1.5" />{error}
        </p>
      )}

      <div className="space-y-3">
        {ABILITIES.map((a) => {
          const bonusable = canBonus[a.key];
          const total = base[a.key] + (bonus[a.key] ?? 0);
          const shown = isPointbuy || assign[a.key] !== null;

          // Índices disponibles para esta aptitud: los no usados por OTRA
          // aptitud (el propio índice actual siempre reaparece en la lista).
          const usedByOthers = new Set(
            (Object.keys(assign) as AbilityKey[])
              .filter((kk) => kk !== a.key)
              .map((kk) => assign[kk])
              .filter((v): v is number => v !== null)
          );
          const options = rolled.map((v, idx) => ({ v, idx })).filter(({ idx }) => !usedByOthers.has(idx));

          return (
            <div key={a.key} className="panel-raised p-4 flex items-center gap-3 flex-wrap">
              <div className="w-32">
                <p className="font-display font-bold" style={{ color: "var(--color-parch)" }}>{a.name}</p>
                <p className="font-ui text-[11px]" style={{ color: "var(--color-dim)" }}>{a.abbr}</p>
              </div>

              {/* control de valor base: stepper (point-buy) o select (dados/array) */}
              {isPointbuy ? (
                <div className="flex items-center gap-2">
                  <button className="stat-btn" onClick={() => setBaseGuarded(a.key, base[a.key] - 1)} disabled={base[a.key] <= POINT_BUY_MIN}>−</button>
                  <span className="font-ui font-extrabold text-lg w-7 text-center" style={{ color: "var(--color-warm)" }}>{base[a.key]}</span>
                  <button className="stat-btn" onClick={() => setBaseGuarded(a.key, base[a.key] + 1)} disabled={base[a.key] >= POINT_BUY_MAX}>+</button>
                </div>
              ) : (
                <select
                  value={assign[a.key] ?? ""}
                  onChange={(e) => assignIndex(a.key, e.target.value)}
                  className="bg-[var(--color-night)] rounded-lg px-2 py-1.5 font-ui text-[13px] border border-[var(--color-line)]"
                  style={{ color: "var(--color-warm)" }}
                >
                  <option value="">— sin asignar —</option>
                  {options.map(({ v, idx }) => (
                    <option key={idx} value={idx}>{v}</option>
                  ))}
                </select>
              )}

              {/* bonus de trasfondo */}
              <div className="flex items-center gap-2">
                <span className="font-ui text-[11px] font-bold" style={{ color: bonusable ? "var(--color-bronze)" : "var(--color-dim)" }}>trasfondo</span>
                <button className="stat-btn" onClick={() => setBonusGuarded(a.key, (bonus[a.key] ?? 0) - 1)} disabled={!bonusable || (bonus[a.key] ?? 0) <= 0}>−</button>
                <span className="font-ui font-bold w-6 text-center" style={{ color: "var(--color-bronze-bright)" }}>+{bonus[a.key] ?? 0}</span>
                <button className="stat-btn" onClick={() => setBonusGuarded(a.key, (bonus[a.key] ?? 0) + 1)} disabled={!bonusable || totalBonus >= 3 || (bonus[a.key] ?? 0) >= 2}>+</button>
              </div>

              {/* total final */}
              <div className="ml-auto text-right">
                <p className="font-display text-2xl font-extrabold" style={{ color: "var(--color-arcane-bright)" }}>{shown ? total : "—"}</p>
                <p className="font-ui text-[11px] font-bold" style={{ color: "var(--color-muted)" }}>{shown ? fmtMod(abilityMod(total)) : ""}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
