"use client";
import { useState } from "react";
import { useSession } from "@/components/SessionProvider";
import { useInitiative, type InitiativeRow } from "@/lib/useInitiative";
import { useParty } from "@/lib/character";
import { useFichaViva } from "@/lib/useFichaViva";
import InitiativeTracker from "@/components/InitiativeTracker";
import PanelCombate from "@/components/combate/PanelCombate";
import DiceFeedStrip from "@/components/combate/DiceFeedStrip";
import type { Objetivo } from "@/components/personaje/Ataques";
import type { PlayState } from "@/lib/recursos";

// La pantalla de combate. A la izquierda, los combatientes (la iniciativa, que
// ya tiene una fila por cada uno): tocas a alguien y es tu objetivo. A la
// derecha, tu estado, tu turno y lo que puedes hacer. Abajo, las últimas
// tiradas.
//
// HAY COMBATE si la iniciativa tiene filas; vaciarla lo termina. Sin combate el
// panel derecho sigue entero: entre escenas hay que poder curarse, preparar
// conjuros y gastar rasgos.
export default function CombatePage() {
  const session = useSession();
  const { rows } = useInitiative();
  const { party } = useParty();
  const ficha = useFichaViva(session?.id ?? null, "self");
  const [targetId, setTargetId] = useState<number | null>(null);

  const nombreDe = (r: InitiativeRow): string => {
    if (r.is_npc) return r.npc_name ?? "PNJ";
    return party.find((p) => p.user_id === r.user_id)?.username ?? "jugador";
  };
  // Condiciones del objetivo, de donde toque: un PNJ las lleva en su propia
  // fila de iniciativa (schema_v23) y un jugador en su play_state. Con esto,
  // las reglas de G4 muerden también contra monstruos — un goblin derribado da
  // ventaja a quien le pega de cerca y desventaja a quien le dispara.
  const condsDe = (r: InitiativeRow): string[] => {
    if (r.is_npc) return r.conds;
    if (!r.user_id) return [];
    return (party.find((p) => p.user_id === r.user_id)?.play_state as PlayState | undefined)?.conds ?? [];
  };

  const comoObjetivo = (r: InitiativeRow): Objetivo => ({ id: r.id, label: nombreDe(r), conds: condsDe(r) });
  // Todos menos tú: el objetivo es para atacar; curarse se hace desde Estado.
  const objetivosDisponibles: Objetivo[] = rows
    .filter((r) => r.is_npc || r.user_id !== session?.id)
    .map(comoObjetivo);
  const fila = targetId !== null ? rows.find((r) => r.id === targetId) ?? null : null;
  const objetivo: Objetivo | null = fila ? comoObjetivo(fila) : null;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <header className="text-center mb-5">
        <p className="eyebrow mb-2"><i className="fas fa-khanda mr-1.5" style={{ color: "var(--color-bronze)" }} />Campo de batalla</p>
        <h1 className="font-display text-3xl md:text-4xl font-extrabold gold-text">Combate</h1>
      </header>

      <div className="grid lg:grid-cols-[1.2fr_1fr] gap-5 items-start">
        <div className="space-y-3">
          <InitiativeTracker
            mod={ficha.derived.abilities.des.mod}
            conEstado
            onSelect={setTargetId}
            selectedId={targetId}
          />
          {rows.length > 0 && (
            <p className="font-ui text-[11px] text-center italic" style={{ color: "var(--color-dim)" }}>
              Toca a un combatiente para apuntarle. Vaciar la iniciativa termina el combate.
            </p>
          )}
        </div>

        <div>
          {!ficha.ready ? (
            <p className="text-center text-sm py-10" style={{ color: "var(--color-dim)" }}>Cargando tu ficha…</p>
          ) : ficha.error ? (
            <p className="text-center text-sm italic py-10" style={{ color: "var(--color-ember)" }}>{ficha.error}</p>
          ) : !ficha.characterId ? (
            <div className="panel p-6 text-center">
              <i className="fas fa-hat-wizard text-2xl mb-2" style={{ color: "var(--color-dim)" }} />
              <p className="font-ui text-[13px]" style={{ color: "var(--color-dim)" }}>
                No tienes un personaje en juego.
              </p>
            </div>
          ) : (
            <PanelCombate
              ficha={ficha}
              objetivo={objetivo}
              objetivosDisponibles={objetivosDisponibles}
              onSoltarObjetivo={() => setTargetId(null)}
              sessionId={session?.id ?? null}
            />
          )}
        </div>
      </div>

      <div className="mt-5">
        <DiceFeedStrip />
      </div>
    </main>
  );
}
