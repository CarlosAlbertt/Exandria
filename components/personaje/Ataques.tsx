"use client";
import { useState } from "react";
import { armaDe, type Arma } from "@/data/weapons";
import { ataqueDe, type Ataque } from "@/lib/ataque";
import { gastar, turnoDe } from "@/lib/turno";
import { ventajaDe } from "@/lib/estado";
import { useBattle } from "@/lib/useBattle";
import { useParty } from "@/lib/character";
import { distanciaMetros } from "@/lib/tablero";
import { ventajaAtacante, combinar, enAlcance, critProximidad, formulaDaño } from "@/lib/targeting";
import { publishRoll } from "@/lib/useDiceFeed";
import { critState } from "@/lib/dice";
import { fmtMod } from "@/data/rules";
import type { PlayState } from "@/lib/recursos";

// Lista de ataques con las armas del inventario que existen en la tabla ARMAS.
// Cada una tira impacto (d20 + mod, con la ventaja combinada de G1 + la del
// objetivo) y daño (dado + mod, doblado en crítico), y marca la acción gastada.
// El objetivo se elige de un desplegable con las fichas del tablero (useBattle);
// la distancia se mide desde la ficha propia. Sin objetivo/ficha ⇒ comportamiento
// G2 exacto (solo ventaja propia, sin bloqueo de alcance). Las condiciones del
// objetivo solo se leen si es un JUGADOR legible por useParty; PNJ ⇒ el DM juzga.
export default function Ataques({
  play, items, abilities, prof, classWeapons, sessionId, ownUserId, onChange, readOnly = false,
}: {
  play: PlayState;
  items: { name: string }[];
  abilities: { fue: number; des: number };
  prof: number;
  classWeapons: string[];
  sessionId: string | null;
  ownUserId?: string | null;
  onChange: (next: PlayState) => void;
  readOnly?: boolean;
}) {
  const [err, setErr] = useState<string | null>(null);
  const [targetId, setTargetId] = useState<number | null>(null);
  const { tokens, board } = useBattle();
  const { party } = useParty();

  const armas = items.map((it) => armaDe(it.name)).filter((a): a is NonNullable<typeof a> => !!a);
  // Únicas por nombre (no listar dos veces la misma arma apilada).
  const vistas = new Set<string>();
  const lista = armas.filter((a) => (vistas.has(a.nombre) ? false : (vistas.add(a.nombre), true)));
  if (lista.length === 0) return null;

  const accionGastada = turnoDe(play).accion;

  // Ficha propia en el tablero y objetivos posibles (las demás).
  const miFicha = tokens.find((t) => t.user_id != null && t.user_id === ownUserId) ?? null;
  const objetivos = tokens.filter((t) => !miFicha || t.id !== miFicha.id);
  const objetivo = targetId !== null ? tokens.find((t) => t.id === targetId) ?? null : null;

  const distancia = miFicha && objetivo
    ? distanciaMetros(miFicha, objetivo, board.cols, board.rows)
    : null;

  // Condiciones del objetivo: solo si es un jugador legible por useParty.
  const condsObjetivo: string[] = objetivo?.user_id
    ? ((party.find((p) => p.user_id === objetivo.user_id)?.play_state as PlayState | undefined)?.conds ?? [])
    : [];

  const distanciaDe = (t: { x: number; y: number }): number | null =>
    miFicha ? distanciaMetros(miFicha, t, board.cols, board.rows) : null;

  async function atacar(arma: Arma, atk: Ataque) {
    if (!sessionId || readOnly) return;
    setErr(null);

    // Alcance (bloqueo duro): solo cuando hay distancia medida.
    if (distancia !== null && !enAlcance(arma, distancia)) {
      setErr(`Fuera de alcance (${distancia} m).`);
      return;
    }

    // Ventaja combinada: la propia (G1) + la del objetivo (si hay distancia).
    const advObjetivo = distancia !== null ? ventajaAtacante(condsObjetivo, distancia) : { adv: false, dis: false };
    const adv = combinar(ventajaDe(play, "ataque"), advObjetivo);

    const etiquetaObj = objetivo ? ` → ${objetivo.label}` : "";
    const { error, result } = await publishRoll(
      sessionId, "attack", `Ataque: ${arma.nombre}${etiquetaObj}`, "1d20",
      { mod: atk.modImpacto, adv: adv ?? undefined },
    );
    if (error) { setErr(error); return; }

    // Crítico: 20 natural (por la tirada) o proximidad (cuerpo ≤1,5 m vs
    // paralizado/inconsciente). No se acumula: un único doblado.
    const critNat = !!result && critState(result.formula, result.rolls) === "crit";
    const critProx = distancia !== null && critProximidad(arma, condsObjetivo, distancia);
    const crit = critNat || critProx;

    const { error: e2 } = await publishRoll(
      sessionId, "custom", `Daño: ${arma.nombre}${crit ? " (crítico)" : ""}`,
      formulaDaño(arma.dado, atk.modDaño, crit),
    );
    if (e2) { setErr(e2); return; }
    onChange(gastar(play, "accion"));
  }

  return (
    <div className="mb-4">
      <p className="font-ui text-[12px] font-bold mb-1.5" style={{ color: "var(--color-parch)" }}>Ataques</p>

      {sessionId && !readOnly && objetivos.length > 0 && (
        <select
          className="w-full mb-2 panel-raised px-3 py-1.5 font-ui text-[12px] bg-transparent"
          style={{ color: "var(--color-parch)" }}
          value={targetId ?? ""}
          onChange={(e) => setTargetId(e.target.value === "" ? null : Number(e.target.value))}
        >
          <option value="">Sin objetivo</option>
          {objetivos.map((t) => {
            const d = distanciaDe(t);
            return <option key={t.id} value={t.id}>{t.label}{d !== null ? ` · ${d} m` : ""}</option>;
          })}
        </select>
      )}

      <div className="space-y-1.5">
        {lista.map((arma) => {
          const atk = ataqueDe(arma, abilities, prof, classWeapons);
          return (
            <div key={arma.nombre} className="panel-raised px-3 py-2 flex items-center justify-between gap-2">
              <div>
                <p className="font-ui text-[13px] font-bold" style={{ color: "var(--color-parch)" }}>{arma.nombre}</p>
                <p className="font-ui text-[11px]" style={{ color: "var(--color-dim)" }}>
                  impacto {fmtMod(atk.modImpacto)} · daño {arma.dado}{atk.modDaño !== 0 ? fmtMod(atk.modDaño) : ""} {arma.tipo}
                  {!atk.competente && " · no competente"}
                </p>
              </div>
              {sessionId && !readOnly && (
                <button
                  className="btn-gold !py-1 !px-3 text-[12px]"
                  title={accionGastada ? "Ya gastaste la acción (desmárcala en el turno para volver a atacar)" : "Atacar (gasta la acción)"}
                  onClick={() => atacar(arma, atk)}
                >
                  <i className="fas fa-khanda mr-1.5" />Atacar
                </button>
              )}
            </div>
          );
        })}
      </div>
      {err && <p className="text-[12px] mt-1 italic" style={{ color: "var(--color-ember)" }}>{err}</p>}
    </div>
  );
}
