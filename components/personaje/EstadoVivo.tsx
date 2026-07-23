"use client";
import { useState } from "react";
import {
  CONDICIONES, AGOTAMIENTO,
  pgActuales, pgTemp, estaAbajo, aplicarDaño, curar, setTemp,
  marcarMuerte, desmarcarMuerte, resultadoMuerte,
  alternarCondicion, setAgotamiento,
} from "@/lib/estado";
import type { PlayState } from "@/lib/recursos";

// Estado de combate de la ficha: PG actuales/temporales, salvaciones de muerte,
// condiciones y agotamiento. Puro de estado: recibe `play` y emite el siguiente
// por `onChange` (guardado optimista, mismo contrato que PozosClase).
export default function EstadoVivo({
  play, maxHp, onChange, readOnly = false,
}: {
  play: PlayState;
  maxHp: number;
  onChange: (next: PlayState) => void;
  readOnly?: boolean;
}) {
  const [dmg, setDmg] = useState("");
  const hp = pgActuales(play, maxHp);
  const temp = pgTemp(play);
  const abajo = estaAbajo(play, maxHp);
  const ratio = maxHp > 0 ? hp / maxHp : 0;
  const veredicto = resultadoMuerte(play);
  const nivelAgot = play.agotamiento ?? 0;

  const num = () => Math.max(0, Math.floor(Number(dmg) || 0));
  const barColor = ratio > 0.5 ? "var(--color-primitivo)" : ratio > 0.25 ? "var(--color-divino)" : "var(--color-ember)";

  return (
    <div className="mb-4 space-y-4">
      {/* --- PG --- */}
      <div>
        <div className="flex items-baseline justify-between gap-2 mb-1.5">
          <p className="font-ui text-[13px] font-bold" style={{ color: "var(--color-parch)" }}>
            <i className="fas fa-heart mr-1.5" style={{ color: "var(--color-ember)" }} />Puntos de golpe
          </p>
          <p className="font-display text-lg font-extrabold" style={{ color: abajo ? "var(--color-ember)" : "var(--color-parch)" }}>
            {hp} <span className="text-[13px]" style={{ color: "var(--color-dim)" }}>/ {maxHp}</span>
            {temp > 0 && <span className="ml-2 text-[13px]" style={{ color: "var(--color-arcane)" }}><i className="fas fa-shield-halved mr-1" />{temp}</span>}
          </p>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "var(--color-night)" }}>
          <div className="h-full transition-all" style={{ width: `${Math.round(ratio * 100)}%`, background: barColor }} />
        </div>
        {abajo && <p className="font-ui text-[12px] italic mt-1" style={{ color: "var(--color-ember)" }}><i className="fas fa-skull mr-1.5" />Caído — tira salvaciones de muerte.</p>}

        {!readOnly && (
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <input
              type="number" value={dmg} onChange={(e) => setDmg(e.target.value)} placeholder="0"
              className="w-16 text-center bg-[var(--color-night)] rounded-lg px-2 py-1 font-ui text-sm outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)]"
            />
            <button className="btn-ghost !py-1 !px-3 text-[12px]" onClick={() => { onChange(aplicarDaño(play, num(), maxHp)); setDmg(""); }}>
              <i className="fas fa-heart-crack mr-1.5" style={{ color: "var(--color-ember)" }} />Daño
            </button>
            <button className="btn-ghost !py-1 !px-3 text-[12px]" onClick={() => { onChange(curar(play, num(), maxHp)); setDmg(""); }}>
              <i className="fas fa-heart-circle-plus mr-1.5" style={{ color: "var(--color-primitivo)" }} />Curar
            </button>
            <button className="btn-ghost !py-1 !px-3 text-[12px]" onClick={() => { onChange(setTemp(play, num())); setDmg(""); }}>
              <i className="fas fa-shield-halved mr-1.5" style={{ color: "var(--color-arcane)" }} />Temp.
            </button>
          </div>
        )}
      </div>

      {/* --- Salvaciones de muerte (solo a 0 PG) --- */}
      {abajo && (
        <div>
          <p className="font-ui text-[12px] font-bold mb-1.5" style={{ color: "var(--color-parch)" }}>Salvaciones de muerte</p>
          <div className="flex items-center gap-4 flex-wrap">
            <MuerteFila label="Éxitos" tipo="ok" color="var(--color-primitivo)" n={play.muerte?.ok ?? 0} play={play} onChange={onChange} readOnly={readOnly} />
            <MuerteFila label="Fallos" tipo="fail" color="var(--color-ember)" n={play.muerte?.fail ?? 0} play={play} onChange={onChange} readOnly={readOnly} />
          </div>
          {veredicto === "estable" && <p className="font-ui text-[12px] mt-1.5" style={{ color: "var(--color-primitivo)" }}>Estable.</p>}
          {veredicto === "muerto" && <p className="font-ui text-[12px] mt-1.5" style={{ color: "var(--color-ember)" }}>Ha caído.</p>}
        </div>
      )}

      {/* --- Condiciones --- */}
      <div>
        <p className="font-ui text-[12px] font-bold mb-1.5" style={{ color: "var(--color-parch)" }}>Condiciones</p>
        <div className="flex gap-1.5 flex-wrap">
          {CONDICIONES.map((c) => {
            const activa = (play.conds ?? []).includes(c.slug);
            return (
              <button
                key={c.slug} disabled={readOnly} title={c.regla}
                onClick={() => onChange(alternarCondicion(play, c.slug))}
                className="font-ui text-[11px] font-bold px-2 py-1 rounded-full transition-colors disabled:cursor-default flex items-center gap-1.5"
                style={{
                  color: activa ? "var(--color-ink)" : "var(--color-muted)",
                  background: activa ? "var(--color-ember)" : "transparent",
                  border: `1px solid var(--color-${activa ? "ember" : "line"})`,
                }}
              >
                <i className={`fas fa-${c.icon}`} />{c.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* --- Agotamiento --- */}
      <div>
        <p className="font-ui text-[12px] font-bold mb-1.5" style={{ color: "var(--color-parch)" }}>Agotamiento</p>
        <div className="flex gap-1.5">
          {[0, 1, 2, 3, 4, 5, 6].map((n) => (
            <button
              key={n} disabled={readOnly}
              onClick={() => onChange(setAgotamiento(play, n))}
              className="w-7 h-7 rounded-md font-ui text-[12px] font-bold transition-colors disabled:cursor-default"
              style={{
                color: n <= nivelAgot && n > 0 ? "var(--color-ink)" : "var(--color-muted)",
                background: n <= nivelAgot && n > 0 ? "var(--color-ember)" : "transparent",
                border: `1px solid var(--color-${n === nivelAgot ? "bronze" : "line"})`,
              }}
            >{n}</button>
          ))}
        </div>
        <p className="font-ui text-[12px] italic mt-1" style={{ color: nivelAgot === 6 ? "var(--color-ember)" : "var(--color-dim)" }}>{AGOTAMIENTO[nivelAgot]}</p>
      </div>
    </div>
  );
}

// Una fila de 3 casillas pulsables de salvación de muerte (éxitos o fallos).
function MuerteFila({
  label, tipo, color, n, play, onChange, readOnly,
}: {
  label: string; tipo: "ok" | "fail"; color: string; n: number;
  play: PlayState; onChange: (p: PlayState) => void; readOnly: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="font-ui text-[11px]" style={{ color: "var(--color-dim)" }}>{label}</span>
      {[0, 1, 2].map((i) => {
        const marcado = i < n;
        return (
          <button
            key={i} disabled={readOnly}
            onClick={() => onChange(marcado ? desmarcarMuerte(play, tipo) : marcarMuerte(play, tipo))}
            className="w-5 h-5 rounded-full transition-colors disabled:cursor-default"
            style={{ background: marcado ? color : "transparent", border: `2px solid ${color}` }}
          />
        );
      })}
    </div>
  );
}
