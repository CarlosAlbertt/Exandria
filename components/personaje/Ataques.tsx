"use client";
import { useState } from "react";
import { armaDe, type Arma } from "@/data/weapons";
import { ataqueDe, type Ataque } from "@/lib/ataque";
import { gastar, gastarAtaque, ataquesRestantes, turnoDe } from "@/lib/turno";
import { ventajaDe } from "@/lib/estado";
import { ventajaAtacante, combinar, enAlcance, critProximidad, formulaDaño } from "@/lib/targeting";
import { publishRoll } from "@/lib/useDiceFeed";
import { critState } from "@/lib/dice";
import { fmtMod } from "@/data/rules";
import type { PlayState } from "@/lib/recursos";

/** El objetivo elegido en el tablero, ya resuelto por el padre. */
export type Objetivo = {
  /** id de la ficha del tablero, para distinguir objetivos repetidos por nombre. */
  id: number;
  label: string;
  /** Distancia en metros desde la ficha propia, o null si no se puede medir. */
  distancia: number | null;
  /** Condiciones del objetivo si es un jugador legible; PNJ ⇒ vacío. */
  conds: string[];
};

/** Cómo se paga el ataque: con la acción de Atacar, o con la acción adicional. */
type Modo = "accion" | "adicional";

// Lista de ataques con las armas del inventario que existen en la tabla ARMAS.
// Tira impacto (d20 + mod, con la ventaja combinada de G1 + la del objetivo) y
// daño (dado + mod, doblado en crítico).
//
// MULTIATAQUE: la acción de Atacar da N golpes (`maxAtaques`). El PRIMERO paga
// la acción; los siguientes solo gastan ataque. Se resuelven UNO A UNO para
// poder cambiar de objetivo entre golpe y golpe — si el primero cae, rediriges.
//
// OTRA MANO: con un arma ligera cuerpo a cuerpo se puede atacar además con la
// ACCIÓN ADICIONAL (luchar con dos armas). Ese golpe NO suma el modificador de
// característica al daño, salvo estilo de combate — y los estilos no están
// modelados, así que se aplica la regla base: mejor quedarse corto que pasarse.
//
// El OBJETIVO lo elige el padre (PanelCombate) y lo comparte con los conjuros.
export default function Ataques({
  play, items, abilities, prof, classWeapons, sessionId, objetivo, maxAtaques = 1, onChange, readOnly = false,
}: {
  play: PlayState;
  items: { name: string }[];
  abilities: { fue: number; des: number };
  prof: number;
  classWeapons: string[];
  sessionId: string | null;
  objetivo?: Objetivo | null;
  /** Ataques que da la acción de Atacar (de ataquesPorAccion). */
  maxAtaques?: number;
  onChange: (next: PlayState) => void;
  readOnly?: boolean;
}) {
  const [err, setErr] = useState<string | null>(null);

  const armas = items.map((it) => armaDe(it.name)).filter((a): a is Arma => !!a);
  // Únicas por nombre (no listar dos veces la misma arma apilada).
  const vistas = new Set<string>();
  const lista = armas.filter((a) => (vistas.has(a.nombre) ? false : (vistas.add(a.nombre), true)));
  if (lista.length === 0) return null;

  const t = turnoDe(play);
  const restantes = ataquesRestantes(play, maxAtaques);
  const puedeAtacar = !!sessionId && !readOnly;
  const distancia = objetivo?.distancia ?? null;
  const condsObjetivo = objetivo?.conds ?? [];
  // Luchar con dos armas exige una arma LIGERA cuerpo a cuerpo EN CADA MANO, así
  // que se cuentan sobre `armas` (sin deduplicar): dos dagas valen, una no.
  const hayDosLigeras = armas.filter((a) => a.ligera && a.alcance === "cuerpo").length >= 2;

  async function atacar(arma: Arma, atk: Ataque, modo: Modo) {
    if (!sessionId || readOnly) return;
    setErr(null);

    // Economía: ¿queda con qué pagar este golpe?
    if (modo === "accion" && restantes <= 0) {
      setErr("No te quedan ataques este turno.");
      return;
    }
    if (modo === "adicional" && t.adicional) {
      setErr("Ya has gastado la acción adicional.");
      return;
    }

    // Alcance (bloqueo duro): solo cuando hay distancia medida.
    if (distancia !== null && !enAlcance(arma, distancia)) {
      setErr(`Fuera de alcance (${distancia} m).`);
      return;
    }

    // Ventaja combinada: la propia (G1) + la del objetivo (si hay distancia).
    const advObjetivo = distancia !== null ? ventajaAtacante(condsObjetivo, distancia) : { adv: false, dis: false };
    const adv = combinar(ventajaDe(play, "ataque"), advObjetivo);

    const etiquetaObj = objetivo ? ` → ${objetivo.label}` : "";
    const cual = modo === "adicional"
      ? " (otra mano)"
      : maxAtaques > 1 ? ` (${t.ataquesUsados + 1} de ${maxAtaques})` : "";
    const { error, result } = await publishRoll(
      sessionId, "attack", `Ataque: ${arma.nombre}${etiquetaObj}${cual}`, "1d20",
      { mod: atk.modImpacto, adv: adv ?? undefined },
    );
    if (error) { setErr(error); return; }

    // Crítico: 20 natural o proximidad (≤1,5 m vs paralizado/inconsciente).
    const critNat = !!result && critState(result.formula, result.rolls) === "crit";
    const critProx = distancia !== null && critProximidad(condsObjetivo, distancia);
    const crit = critNat || critProx;

    // El golpe de la otra mano no suma el modificador al daño (regla base).
    const modDaño = modo === "adicional" ? 0 : atk.modDaño;
    const { error: e2 } = await publishRoll(
      sessionId, "custom", `Daño: ${arma.nombre}${crit ? " (crítico)" : ""}${modo === "adicional" ? " (otra mano)" : ""}`,
      formulaDaño(arma.dado, modDaño, crit),
    );
    if (e2) { setErr(e2); return; }

    // Gasto: la acción de Atacar se paga UNA vez, en el primer golpe.
    let next = play;
    if (modo === "adicional") {
      next = gastar(next, "adicional");
    } else {
      if (turnoDe(next).ataquesUsados === 0) next = gastar(next, "accion");
      next = gastarAtaque(next, maxAtaques);
    }
    onChange(next);
  }

  return (
    <div className="mb-4">
      {maxAtaques > 1 && (
        <p className="font-ui text-[11px] mb-2" style={{ color: restantes > 0 ? "var(--color-bronze-bright)" : "var(--color-dim)" }}>
          <i className="fas fa-khanda mr-1.5" />
          {restantes > 0 ? `Ataque ${t.ataquesUsados + 1} de ${maxAtaques}` : "Sin ataques este turno"}
          <span style={{ color: "var(--color-dim)" }}> · cambia de objetivo entre golpe y golpe</span>
        </p>
      )}

      <div className="space-y-1.5">
        {lista.map((arma) => {
          const atk = ataqueDe(arma, abilities, prof, classWeapons);
          const esLigera = !!arma.ligera && arma.alcance === "cuerpo";
          return (
            <div key={arma.nombre} className="panel-raised px-3 py-2 flex items-center justify-between gap-2">
              <div>
                <p className="font-ui text-[13px] font-bold" style={{ color: "var(--color-parch)" }}>{arma.nombre}</p>
                <p className="font-ui text-[11px]" style={{ color: "var(--color-dim)" }}>
                  impacto {fmtMod(atk.modImpacto)} · daño {arma.dado}{atk.modDaño !== 0 ? fmtMod(atk.modDaño) : ""} {arma.tipo}
                  {!atk.competente && " · no competente"}
                  {esLigera && " · ligera"}
                </p>
              </div>
              {puedeAtacar && (
                <span className="shrink-0 flex items-center gap-1.5">
                  <button
                    className="btn-gold !py-1 !px-3 text-[12px] disabled:opacity-40"
                    disabled={restantes <= 0}
                    title={restantes <= 0 ? "No te quedan ataques este turno" : "Atacar (gasta un ataque de la acción)"}
                    onClick={() => atacar(arma, atk, "accion")}
                  >
                    <i className="fas fa-khanda mr-1.5" />Atacar
                  </button>
                  {esLigera && hayDosLigeras && (
                    <button
                      className="panel-raised !py-1 !px-2 text-[11px] font-ui disabled:opacity-40"
                      style={{ color: "var(--color-muted)" }}
                      disabled={t.adicional}
                      title={t.adicional ? "Ya has gastado la acción adicional" : "Atacar con la otra mano: gasta la acción adicional y no suma el modificador al daño"}
                      onClick={() => atacar(arma, atk, "adicional")}
                    >
                      Otra mano
                    </button>
                  )}
                </span>
              )}
            </div>
          );
        })}
      </div>
      {err && <p className="text-[12px] mt-1 italic" style={{ color: "var(--color-ember)" }}>{err}</p>}
    </div>
  );
}
