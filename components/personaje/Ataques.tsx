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

type ArmasProps = {
  play: PlayState;
  items: { name: string }[];
  abilities: { fue: number; des: number };
  prof: number;
  classWeapons: string[];
  sessionId: string | null;
  ownUserId?: string | null;
  onChange: (next: PlayState) => void;
  readOnly?: boolean;
};

// Armas únicas del inventario que existen en ARMAS (no repetir apiladas).
function armasDe(items: { name: string }[]): Arma[] {
  const armas = items.map((it) => armaDe(it.name)).filter((a): a is Arma => !!a);
  const vistas = new Set<string>();
  return armas.filter((a) => (vistas.has(a.nombre) ? false : (vistas.add(a.nombre), true)));
}

// Una fila por arma. `onAtacar` presente ⇒ botón de ataque.
function FilaArma({ arma, atk, onAtacar, accionGastada }: {
  arma: Arma; atk: Ataque; onAtacar?: () => void; accionGastada: boolean;
}) {
  return (
    <div className="panel-raised px-3 py-2 flex items-center justify-between gap-2">
      <div>
        <p className="font-ui text-[13px] font-bold" style={{ color: "var(--color-parch)" }}>{arma.nombre}</p>
        <p className="font-ui text-[11px]" style={{ color: "var(--color-dim)" }}>
          impacto {fmtMod(atk.modImpacto)} · daño {arma.dado}{atk.modDaño !== 0 ? fmtMod(atk.modDaño) : ""} {arma.tipo}
          {!atk.competente && " · no competente"}
        </p>
      </div>
      {onAtacar && (
        <button
          className="btn-gold !py-1 !px-3 text-[12px]"
          title={accionGastada ? "Ya gastaste la acción (desmárcala en el turno para volver a atacar)" : "Atacar (gasta la acción)"}
          onClick={onAtacar}
        >
          <i className="fas fa-khanda mr-1.5" />Atacar
        </button>
      )}
    </div>
  );
}

// Lista de ataques. Sin sesión / readOnly ⇒ lista informativa SIN objetivo ni
// suscripciones: importa que en el Panel DM › Grupo, montada N veces con
// sessionId=null, no abra N canales realtime inútiles. Con sesión delega en
// AtaquesInteractivo, que sí lee el tablero y las condiciones del objetivo.
export default function Ataques(props: ArmasProps) {
  const lista = armasDe(props.items);
  if (lista.length === 0) return null;

  const interactivo = !!props.sessionId && !props.readOnly;
  if (!interactivo) {
    const accionGastada = turnoDe(props.play).accion;
    return (
      <div className="mb-4">
        <p className="font-ui text-[12px] font-bold mb-1.5" style={{ color: "var(--color-parch)" }}>Ataques</p>
        <div className="space-y-1.5">
          {lista.map((arma) => (
            <FilaArma key={arma.nombre} arma={arma} atk={ataqueDe(arma, props.abilities, props.prof, props.classWeapons)} accionGastada={accionGastada} />
          ))}
        </div>
      </div>
    );
  }
  return <AtaquesInteractivo {...props} lista={lista} sessionId={props.sessionId as string} />;
}

// Camino interactivo (hay sesión): objetivo desde el tablero, alcance, ventaja
// combinada y crítico. Solo aquí se montan useBattle/useParty.
function AtaquesInteractivo({
  play, abilities, prof, classWeapons, sessionId, ownUserId, onChange, lista,
}: ArmasProps & { lista: Arma[]; sessionId: string }) {
  const [err, setErr] = useState<string | null>(null);
  const [targetId, setTargetId] = useState<number | null>(null);
  const { tokens, board } = useBattle();
  const { party } = useParty();

  const accionGastada = turnoDe(play).accion;

  const miFicha = tokens.find((t) => t.user_id != null && t.user_id === ownUserId) ?? null;
  const objetivos = tokens.filter((t) => !miFicha || t.id !== miFicha.id);
  const objetivo = targetId !== null ? tokens.find((t) => t.id === targetId) ?? null : null;

  const distancia = miFicha && objetivo ? distanciaMetros(miFicha, objetivo, board.cols, board.rows) : null;

  const condsObjetivo: string[] = objetivo?.user_id
    ? ((party.find((p) => p.user_id === objetivo.user_id)?.play_state as PlayState | undefined)?.conds ?? [])
    : [];

  const distanciaDe = (t: { x: number; y: number }): number | null =>
    miFicha ? distanciaMetros(miFicha, t, board.cols, board.rows) : null;

  async function atacar(arma: Arma, atk: Ataque) {
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
    const { error, result } = await publishRoll(sessionId, "attack", `Ataque: ${arma.nombre}${etiquetaObj}`, "1d20", { mod: atk.modImpacto, adv: adv ?? undefined });
    if (error) { setErr(error); return; }
    // Crítico: 20 natural o proximidad (cuerpo ≤1,5 m vs paralizado/inconsciente).
    const critNat = !!result && critState(result.formula, result.rolls) === "crit";
    const critProx = distancia !== null && critProximidad(arma, condsObjetivo, distancia);
    const crit = critNat || critProx;
    const { error: e2 } = await publishRoll(sessionId, "custom", `Daño: ${arma.nombre}${crit ? " (crítico)" : ""}`, formulaDaño(arma.dado, atk.modDaño, crit));
    if (e2) { setErr(e2); return; }
    onChange(gastar(play, "accion"));
  }

  return (
    <div className="mb-4">
      <p className="font-ui text-[12px] font-bold mb-1.5" style={{ color: "var(--color-parch)" }}>Ataques</p>

      {objetivos.length > 0 && (
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
          return <FilaArma key={arma.nombre} arma={arma} atk={atk} accionGastada={accionGastada} onAtacar={() => atacar(arma, atk)} />;
        })}
      </div>
      {err && <p className="text-[12px] mt-1 italic" style={{ color: "var(--color-ember)" }}>{err}</p>}
    </div>
  );
}
