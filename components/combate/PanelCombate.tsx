"use client";
import { useState } from "react";
import EstadoVivo from "@/components/personaje/EstadoVivo";
import EconomiaTurno from "@/components/personaje/EconomiaTurno";
import Ataques, { type Objetivo } from "@/components/personaje/Ataques";
import Conjuros from "@/components/personaje/Conjuros";
import PozosClase from "@/components/personaje/PozosClase";
import { pozosDe, referenciasDe } from "@/lib/recursos";
import { ataquesPorAccion } from "@/lib/ataque";
import { armaDe } from "@/data/weapons";
import type { FichaViva } from "@/lib/useFichaViva";
import type { PlayState } from "@/lib/recursos";

type Pestaña = "ataques" | "conjuros" | "rasgos";

// La columna de acciones de la pantalla de combate: estado y turno SIEMPRE
// visibles, y lo que se hace en el turno en pestañas para que no se desborde.
//
// El OBJETIVO ya no se elige aquí: se elige tocando una fila de la iniciativa,
// y la página lo pasa ya resuelto. Aquí solo se muestra y se puede soltar.
export default function PanelCombate({
  ficha, objetivo, objetivosDisponibles, onSoltarObjetivo, sessionId, readOnly = false,
}: {
  ficha: FichaViva;
  objetivo: Objetivo | null;
  /** Todos los combatientes apuntables (para los conjuros de varias instancias). */
  objetivosDisponibles: Objetivo[];
  onSoltarObjetivo: () => void;
  sessionId: string | null;
  readOnly?: boolean;
}) {
  const [pestaña, setPestaña] = useState<Pestaña>("ataques");

  const { play, derived, mechanics, clsSlug, level, items, velocidad, onPlayStateChange } = ficha;

  const esConjurador = (mechanics?.caster ?? "none") !== "none";
  // «Rasgos» no es solo pozos que se gastan: también las columnas de REFERENCIA
  // (dado de ataque furtivo del pícaro, trucos y preparados del mago…).
  const tienePozos = !!clsSlug && (pozosDe(clsSlug, level, play).length > 0 || referenciasDe(clsSlug, level).length > 0);
  const tieneArmas = items.some((it) => !!armaDe(it.name));
  const maxAtaques = clsSlug ? ataquesPorAccion(clsSlug, level) : 1;

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
          {objetivo ? (
            <span className="flex items-center gap-2">
              <span className="font-ui text-[12px] font-bold" style={{ color: "var(--color-ember)" }}>
                <i className="fas fa-crosshairs mr-1.5" />{objetivo.label}
              </span>
              <button className="font-ui text-[11px]" style={{ color: "var(--color-dim)" }} onClick={onSoltarObjetivo}>
                soltar
              </button>
            </span>
          ) : (
            <span className="font-ui text-[12px] italic" style={{ color: "var(--color-dim)" }}>
              toca a alguien en la iniciativa
            </span>
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

        {activa === "ataques" && !tieneArmas && (
          <p className="font-ui text-[12px] italic" style={{ color: "var(--color-dim)" }}>
            No llevas ningún arma del catálogo en el inventario.
          </p>
        )}
        {activa === "ataques" && tieneArmas && (
          <Ataques
            play={play}
            items={items}
            abilities={{ fue: derived.abilities.fue.mod, des: derived.abilities.des.mod }}
            prof={derived.prof}
            classWeapons={mechanics?.weapons ?? []}
            sessionId={sessionId}
            objetivo={objetivo}
            maxAtaques={maxAtaques}
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
            objetivosDisponibles={objetivosDisponibles}
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
