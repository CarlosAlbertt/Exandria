"use client";
import { useState } from "react";
import EstadoVivo from "@/components/personaje/EstadoVivo";
import EconomiaTurno from "@/components/personaje/EconomiaTurno";
import Ataques, { type Objetivo } from "@/components/personaje/Ataques";
import Conjuros from "@/components/personaje/Conjuros";
import PozosClase from "@/components/personaje/PozosClase";
import { pozosDe } from "@/lib/recursos";
import { distanciaMetros } from "@/lib/tablero";
import type { Token, Board } from "@/lib/useBattle";
import type { FichaViva } from "@/lib/useFichaViva";
import type { PlayState } from "@/lib/recursos";

type Pestaña = "ataques" | "conjuros" | "rasgos";

// La columna derecha de la pantalla de combate: estado y turno SIEMPRE
// visibles, y las acciones en pestañas para que la lista no se desborde.
// Es el dueño del OBJETIVO, que comparten ataques y conjuros.
export default function PanelCombate({
  ficha, tokens, board, ownUserId, condsDe, sessionId, readOnly = false,
}: {
  ficha: FichaViva;
  tokens: Token[];
  board: Board;
  /** El user_id cuya ficha se está jugando (para localizar su token). */
  ownUserId: string | null;
  /** Condiciones de un token que sea jugador; PNJ o ilegible ⇒ []. */
  condsDe: (t: Token) => string[];
  sessionId: string | null;
  readOnly?: boolean;
}) {
  const [pestaña, setPestaña] = useState<Pestaña>("ataques");
  const [targetId, setTargetId] = useState<number | null>(null);

  const { play, derived, mechanics, clsSlug, level, items, velocidad, onPlayStateChange } = ficha;

  const miFicha = tokens.find((t) => t.user_id != null && t.user_id === ownUserId) ?? null;
  const objetivos = tokens.filter((t) => (!miFicha || t.id !== miFicha.id) && !t.dead);
  const token = targetId !== null ? tokens.find((t) => t.id === targetId) ?? null : null;

  const distanciaA = (t: Token): number | null =>
    miFicha ? distanciaMetros(miFicha, t, board.cols, board.rows) : null;

  const objetivo: Objetivo | null = token
    ? { label: token.label, distancia: distanciaA(token), conds: condsDe(token) }
    : null;

  const esConjurador = (mechanics?.caster ?? "none") !== "none";
  const tienePozos = !!clsSlug && pozosDe(clsSlug, level, play).length > 0;

  const tabs: { id: Pestaña; icon: string; label: string }[] = [
    { id: "ataques", icon: "khanda", label: "Ataques" },
    ...(esConjurador ? [{ id: "conjuros" as Pestaña, icon: "wand-sparkles", label: "Conjuros" }] : []),
    ...(tienePozos ? [{ id: "rasgos" as Pestaña, icon: "gem", label: "Rasgos" }] : []),
  ];
  // Si la pestaña abierta ya no existe (cambio de clase), cae en la primera.
  const activa = tabs.some((t) => t.id === pestaña) ? pestaña : "ataques";

  const cambia = (next: PlayState) => onPlayStateChange(next);

  return (
    <div className="space-y-3">
      {/* SIEMPRE VISIBLE: estado */}
      <section className="panel p-4">
        <p className="eyebrow mb-2"><i className="fas fa-heart-pulse mr-1.5" style={{ color: "var(--color-ember)" }} />Estado</p>
        <EstadoVivo play={play} maxHp={derived.maxHp} onChange={cambia} readOnly={readOnly} />
      </section>

      {/* SIEMPRE VISIBLE: turno */}
      <section className="panel p-4">
        <p className="eyebrow mb-2"><i className="fas fa-hourglass-half mr-1.5" style={{ color: "var(--color-bronze)" }} />Turno</p>
        <EconomiaTurno play={play} velocidad={velocidad} onChange={cambia} readOnly={readOnly} />
      </section>

      {/* ACCIONES: objetivo + pestañas */}
      <section className="panel p-4">
        <div className="panel-raised px-3 py-2 mb-3 flex items-center justify-between gap-2">
          <span className="font-ui text-[12px]" style={{ color: "var(--color-dim)" }}>Objetivo</span>
          {objetivos.length === 0 ? (
            <span className="font-ui text-[12px] italic" style={{ color: "var(--color-dim)" }}>sin fichas en el tablero</span>
          ) : (
            <select
              className="font-ui text-[12px] bg-transparent text-right"
              style={{ color: "var(--color-parch)" }}
              value={targetId ?? ""}
              onChange={(e) => setTargetId(e.target.value === "" ? null : Number(e.target.value))}
            >
              <option value="">Sin objetivo</option>
              {objetivos.map((t) => {
                const d = distanciaA(t);
                return <option key={t.id} value={t.id}>{t.label}{d !== null ? ` · ${d} m` : ""}</option>;
              })}
            </select>
          )}
        </div>

        <div className="flex gap-1 mb-3">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setPestaña(t.id)}
              className="font-ui text-[12px] px-3 py-1.5 rounded-md transition-colors"
              style={{
                background: activa === t.id ? "var(--color-bronze)" : "transparent",
                color: activa === t.id ? "var(--color-night)" : "var(--color-muted)",
                border: `1px solid var(--color-bronze-deep)`,
              }}
            >
              <i className={`fas fa-${t.icon} mr-1.5`} />{t.label}
            </button>
          ))}
        </div>

        {activa === "ataques" && (
          <Ataques
            play={play}
            items={items}
            abilities={{ fue: derived.abilities.fue.mod, des: derived.abilities.des.mod }}
            prof={derived.prof}
            classWeapons={mechanics?.weapons ?? []}
            sessionId={sessionId}
            objetivo={objetivo}
            onChange={cambia}
            readOnly={readOnly}
          />
        )}

        {activa === "conjuros" && (
          <Conjuros
            clsSlug={clsSlug}
            level={level}
            caster={mechanics?.caster ?? "none"}
            spellDc={derived.spellDc ?? 0}
            spellAttack={derived.spellAttack ?? 0}
            play={play}
            sessionId={sessionId}
            objetivo={objetivo}
            onChange={cambia}
            readOnly={readOnly}
          />
        )}

        {activa === "rasgos" && clsSlug && (
          <PozosClase clsSlug={clsSlug} level={level} play={play} onChange={cambia} readOnly={readOnly} />
        )}
      </section>
    </div>
  );
}
