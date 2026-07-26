"use client";
import { useState } from "react";
import { spellsForClass, spellById, type Spell } from "@/data/spells";
import {
  huecosDe, gastarHueco, devolverHueco, topePreparados, topeTrucos,
  cuentaTrucos, cuentaPreparados, preparar, despreparar, setConcentracion,
} from "@/lib/conjuros";
import { publishRoll, publishNote } from "@/lib/useDiceFeed";
import type { CasterKind } from "@/data/classdata/types";
import type { PlayState } from "@/lib/recursos";

// Panel de conjuros de la ficha (Fase O2), molde de PozosClase: chapas
// pulsables para los huecos (un toque gasta, un toque en una gastada la
// devuelve), la lista de preparados con su botón de lanzar, y un selector para
// preparar hasta el tope. Sin sesión (o en modo lectura del Panel DM) se ve
// todo pero no se lanza.
export default function Conjuros({
  clsSlug, level, caster, spellDc, spellAttack, play, sessionId, onChange, readOnly = false,
}: {
  clsSlug: string;
  level: number;
  caster: CasterKind;
  spellDc: number;
  spellAttack: number;
  play: PlayState;
  sessionId: string | null;
  onChange: (next: PlayState) => void;
  readOnly?: boolean;
}) {
  const [abierto, setAbierto] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [nivelPara, setNivelPara] = useState<string | null>(null); // id del conjuro cuyo nivel se está eligiendo

  if (caster === "none") return null;

  const huecos = huecosDe(caster, level, play);
  const capTrucos = topeTrucos(clsSlug, level);
  const capPrep = topePreparados(clsSlug, level);
  const catalogo = spellsForClass(clsSlug);

  const preparados = (play.preparados ?? [])
    .map((id) => spellById(id))
    .filter((s): s is Spell => !!s)
    .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name, "es"));
  const trucos = preparados.filter((s) => s.level === 0);
  const conjuros = preparados.filter((s) => s.level > 0);
  const concentrando = play.concentrando ? spellById(play.concentrando) : null;

  const puedeLanzar = !!sessionId && !readOnly;

  // Publica el conjuro: anuncio + las tiradas que traiga (ataque, daño, curación).
  async function lanzar(spell: Spell, nivelUsado: number) {
    if (!sessionId) return;
    setErr(null);
    // nivelUsado 0 en un conjuro de nivel ≥1 significa «lanzado como ritual»:
    // no gasta hueco. Se hace explícito para no depender de que huecosDe nunca
    // devuelva un nivel 0.
    const comoRitual = spell.level > 0 && nivelUsado === 0;
    const etiqueta = spell.level === 0
      ? `${spell.name} (truco)`
      : comoRitual
        ? `${spell.name} (ritual)`
        : `${spell.name} (nivel ${nivelUsado})`;

    // 1. Anuncio (con la CD si el conjuro pide salvación).
    const cd = spell.save ? ` · salvación de ${spell.save.toUpperCase()} CD ${spellDc}` : "";
    const { error: e0 } = await publishNote(sessionId, `Lanza ${etiqueta}${cd}`);
    if (e0) { setErr(e0); return; }

    // 2. Tirada de ataque de conjuro, si la tiene.
    if (spell.attack) {
      const { error } = await publishRoll(sessionId, "attack", `Conjuro: ${spell.name}`, "1d20", { mod: spellAttack });
      if (error) { setErr(error); return; }
    }
    // 3. Daño y/o curación, si los trae.
    if (spell.damage) {
      const { error } = await publishRoll(sessionId, "custom", `Daño: ${spell.name} (${spell.damage.type})`, spell.damage.dice);
      if (error) { setErr(error); return; }
    }
    if (spell.heal) {
      const { error } = await publishRoll(sessionId, "custom", `Curación: ${spell.name}`, spell.heal);
      if (error) { setErr(error); return; }
    }

    // 4. Gasto del hueco (los trucos no gastan) y concentración.
    let next = play;
    if (spell.level > 0 && !comoRitual) {
      const fila = huecos.find((h) => h.nivel === nivelUsado);
      if (fila) next = gastarHueco(next, nivelUsado, fila.max);
    }
    if (spell.concentration) next = setConcentracion(next, spell.id);
    onChange(next);
    setNivelPara(null);
  }

  // Niveles de hueco disponibles para lanzar ese conjuro (su nivel o superior).
  const nivelesPara = (spell: Spell) => huecos.filter((h) => h.nivel >= spell.level && h.quedan > 0);

  function BotonesLanzar({ spell }: { spell: Spell }) {
    if (!puedeLanzar) return null;
    // Trucos: directo, sin hueco.
    if (spell.level === 0) {
      return <button className="btn-gold !py-1 !px-3 text-[12px]" onClick={() => lanzar(spell, 0)}>Lanzar</button>;
    }
    const opciones = nivelesPara(spell);
    return (
      <span className="flex items-center gap-1.5">
        {spell.ritual && (
          <button
            className="panel-raised !py-1 !px-2 text-[11px] font-ui"
            style={{ color: "var(--color-muted)" }}
            title="Lanzar como ritual: tarda 10 minutos más, pero no gasta hueco"
            onClick={() => lanzar(spell, 0)}
          >
            Ritual
          </button>
        )}
        {opciones.length === 0 ? (
          <span className="font-ui text-[11px] italic" style={{ color: "var(--color-dim)" }}>sin huecos</span>
        ) : nivelPara === spell.id ? (
          <span className="flex items-center gap-1">
            {opciones.map((h) => (
              <button key={h.nivel} className="btn-gold !py-1 !px-2 text-[11px]" title={`Gastar un hueco de nivel ${h.nivel}`} onClick={() => lanzar(spell, h.nivel)}>
                nv{h.nivel}
              </button>
            ))}
            <button className="font-ui text-[11px] px-1" style={{ color: "var(--color-dim)" }} onClick={() => setNivelPara(null)}>✕</button>
          </span>
        ) : (
          <button
            className="btn-gold !py-1 !px-3 text-[12px]"
            title={opciones.length > 1 ? "Elegir el nivel del hueco (subir de nivel el conjuro)" : `Gastar un hueco de nivel ${opciones[0].nivel}`}
            onClick={() => (opciones.length > 1 ? setNivelPara(spell.id) : lanzar(spell, opciones[0].nivel))}
          >
            Lanzar
          </button>
        )}
      </span>
    );
  }

  function FilaConjuro({ spell }: { spell: Spell }) {
    return (
      <div className="panel-raised px-3 py-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-ui text-[13px] font-bold" style={{ color: "var(--color-parch)" }}>
            {spell.name}
            {spell.concentration && <i className="fas fa-brain ml-1.5 text-[10px]" style={{ color: "var(--color-arcane-bright)" }} title="Concentración" />}
            {spell.ritual && <i className="fas fa-book ml-1.5 text-[10px]" style={{ color: "var(--color-muted)" }} title="Ritual" />}
          </p>
          <p className="font-ui text-[11px]" style={{ color: "var(--color-dim)" }}>
            {spell.level === 0 ? "Truco" : `Nivel ${spell.level}`} · {spell.school} · {spell.time} · {spell.range}
          </p>
          <p className="font-ui text-[11px] mt-0.5" style={{ color: "var(--color-muted)" }}>{spell.desc}</p>
        </div>
        <span className="shrink-0 flex flex-col items-end gap-1">
          <BotonesLanzar spell={spell} />
          {!readOnly && (
            <button className="font-ui text-[10px]" style={{ color: "var(--color-dim)" }} title="Quitar de los preparados" onClick={() => onChange(despreparar(play, spell.id))}>
              quitar
            </button>
          )}
        </span>
      </div>
    );
  }

  return (
    <div className="mb-4 space-y-3">
      {/* Cabecera: CD, ataque y concentración */}
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <p className="font-ui text-[12px] font-bold" style={{ color: "var(--color-parch)" }}>Conjuros</p>
        <p className="font-ui text-[12px]" style={{ color: "var(--color-dim)" }}>
          CD {spellDc} · ataque {spellAttack >= 0 ? "+" : ""}{spellAttack}
        </p>
      </div>

      {concentrando && (
        <p className="font-ui text-[12px] flex items-center gap-2" style={{ color: "var(--color-arcane-bright)" }}>
          <i className="fas fa-brain" />Concentrado en {concentrando.name}
          {!readOnly && (
            <button className="font-ui text-[11px] underline" style={{ color: "var(--color-dim)" }} onClick={() => onChange(setConcentracion(play, null))}>
              soltar
            </button>
          )}
        </p>
      )}

      {/* Huecos por nivel */}
      {huecos.map((h) => (
        <div key={h.nivel}>
          <div className="flex items-baseline justify-between gap-2 flex-wrap">
            <p className="font-ui text-[13px] font-bold" style={{ color: "var(--color-parch)" }}>
              {caster === "pact" ? `Huecos de pacto (nivel ${h.nivel})` : `Huecos de nivel ${h.nivel}`}
            </p>
            <p className="font-ui text-[12px]" style={{ color: "var(--color-dim)" }}>
              {h.quedan} de {h.max} · recarga con descanso {caster === "pact" ? "corto" : "largo"}
            </p>
          </div>
          <div className="flex gap-1.5 mt-1.5 flex-wrap">
            {Array.from({ length: h.max }, (_, i) => {
              const usado = i < h.gastados;
              return (
                <button
                  key={i}
                  disabled={readOnly}
                  onClick={() => onChange(usado ? devolverHueco(play, h.nivel) : gastarHueco(play, h.nivel, h.max))}
                  title={usado ? "Devolver un hueco" : "Gastar un hueco"}
                  className="w-5 h-5 rounded-sm transition-colors disabled:cursor-default"
                  style={{ background: usado ? "transparent" : "var(--color-arcane-bright)", border: `2px solid var(--color-arcane-bright)` }}
                />
              );
            })}
          </div>
        </div>
      ))}

      {/* Trucos y conjuros preparados */}
      {trucos.length > 0 && (
        <div className="space-y-1.5">
          <p className="font-ui text-[12px] font-bold" style={{ color: "var(--color-parch)" }}>Trucos {capTrucos > 0 && `(${cuentaTrucos(play)}/${capTrucos})`}</p>
          {trucos.map((s) => <FilaConjuro key={s.id} spell={s} />)}
        </div>
      )}
      {conjuros.length > 0 && (
        <div className="space-y-1.5">
          <p className="font-ui text-[12px] font-bold" style={{ color: "var(--color-parch)" }}>Preparados ({cuentaPreparados(play)}/{capPrep})</p>
          {conjuros.map((s) => <FilaConjuro key={s.id} spell={s} />)}
        </div>
      )}
      {preparados.length === 0 && (
        <p className="font-ui text-[12px] italic" style={{ color: "var(--color-dim)" }}>No llevas ningún conjuro preparado todavía.</p>
      )}

      {/* Selector de preparados */}
      {!readOnly && (
        <div>
          <button className="font-ui text-[12px] underline" style={{ color: "var(--color-bronze-bright)" }} onClick={() => setAbierto((v) => !v)}>
            {abierto ? "Cerrar" : "Preparar conjuros"} · trucos {cuentaTrucos(play)}/{capTrucos} · conjuros {cuentaPreparados(play)}/{capPrep}
          </button>
          {abierto && (
            <div className="mt-2 space-y-1 max-h-[320px] overflow-y-auto pr-1">
              {catalogo.length === 0 && (
                <p className="font-ui text-[12px] italic" style={{ color: "var(--color-dim)" }}>
                  Todavía no hay conjuros de esta clase en la biblioteca.
                </p>
              )}
              {catalogo.map((s) => {
                const puesto = (play.preparados ?? []).includes(s.id);
                return (
                  <label key={s.id} className="panel-raised px-3 py-1.5 flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={puesto}
                      onChange={() => onChange(puesto ? despreparar(play, s.id) : preparar(play, s.id, capTrucos, capPrep))}
                    />
                    <span className="font-ui text-[12px]" style={{ color: "var(--color-parch)" }}>
                      {s.name} <span style={{ color: "var(--color-dim)" }}>· {s.level === 0 ? "truco" : `nv${s.level}`} · {s.school}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}

      {err && <p className="text-[12px] italic" style={{ color: "var(--color-ember)" }}>{err}</p>}
    </div>
  );
}
