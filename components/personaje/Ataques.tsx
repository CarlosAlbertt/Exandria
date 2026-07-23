"use client";
import { useState } from "react";
import { armaDe } from "@/data/weapons";
import { ataqueDe } from "@/lib/ataque";
import { gastar, turnoDe } from "@/lib/turno";
import { ventajaDe } from "@/lib/estado";
import { publishRoll } from "@/lib/useDiceFeed";
import { fmtMod } from "@/data/rules";
import type { PlayState } from "@/lib/recursos";

// Lista de ataques con las armas del inventario que existen en la tabla ARMAS.
// Cada una tira impacto (d20 + mod, con la ventaja de G1) y daño (dado + mod), y
// marca la acción gastada. Sin sesión no hay tirada (solo se listan los números).
// `items` solo necesita `.name` (se desacopla de Item para que el panel DM pueda
// pasarle el inventario del jugador sin castear al tipo completo).
export default function Ataques({
  play, items, abilities, prof, classWeapons, sessionId, onChange, readOnly = false,
}: {
  play: PlayState;
  items: { name: string }[];
  abilities: { fue: number; des: number };
  prof: number;
  classWeapons: string[];
  sessionId: string | null;
  onChange: (next: PlayState) => void;
  readOnly?: boolean;
}) {
  const [err, setErr] = useState<string | null>(null);
  const armas = items.map((it) => armaDe(it.name)).filter((a): a is NonNullable<typeof a> => !!a);
  // Únicas por nombre (no listar dos veces la misma arma apilada).
  const vistas = new Set<string>();
  const lista = armas.filter((a) => (vistas.has(a.nombre) ? false : (vistas.add(a.nombre), true)));
  if (lista.length === 0) return null;

  const accionGastada = turnoDe(play).accion;

  async function atacar(nombre: string, modImpacto: number, dadoDaño: string, modDaño: number) {
    if (!sessionId || readOnly) return;
    setErr(null);
    const { error } = await publishRoll(sessionId, "attack", `Ataque: ${nombre}`, "1d20", { mod: modImpacto, adv: ventajaDe(play, "ataque") ?? undefined });
    if (error) { setErr(error); return; }
    const formulaDaño = `${dadoDaño}${modDaño >= 0 ? "+" : ""}${modDaño}`;
    const { error: e2 } = await publishRoll(sessionId, "custom", `Daño: ${nombre}`, formulaDaño);
    if (e2) { setErr(e2); return; }
    onChange(gastar(play, "accion"));
  }

  return (
    <div className="mb-4">
      <p className="font-ui text-[12px] font-bold mb-1.5" style={{ color: "var(--color-parch)" }}>Ataques</p>
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
                  onClick={() => atacar(arma.nombre, atk.modImpacto, atk.dadoDaño, atk.modDaño)}
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
