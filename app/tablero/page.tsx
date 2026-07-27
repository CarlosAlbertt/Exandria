"use client";
import { useSession } from "@/components/SessionProvider";
import { useBattle, moveToken, type Token } from "@/lib/useBattle";
import { useFichaViva } from "@/lib/useFichaViva";
import { useParty } from "@/lib/character";
import BattleBoard from "@/components/tablero/BattleBoard";
import PanelCombate from "@/components/tablero/PanelCombate";
import InitiativeTracker from "@/components/InitiativeTracker";
import DiceFeedStrip from "@/components/tablero/DiceFeedStrip";
import type { PlayState } from "@/lib/recursos";

// La pantalla de combate del jugador: iniciativa arriba, tablero a la
// izquierda, estado/turno/acciones a la derecha y la tira de tiradas abajo.
// Funciona SIN combate activo: sin rejilla se puede igualmente curar, preparar
// conjuros o gastar un pozo (si no, no habría dónde hacerlo entre escenas).
export default function TableroPage() {
  const session = useSession();
  const isDM = session?.role === "dm";
  const { tokens, board, ready, missing } = useBattle();
  const ficha = useFichaViva(session?.id ?? null, "self");
  const { party } = useParty();

  const condsDe = (t: Token): string[] =>
    t.user_id
      ? ((party.find((p) => p.user_id === t.user_id)?.play_state as PlayState | undefined)?.conds ?? [])
      : [];

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <header className="text-center mb-5">
        <p className="eyebrow mb-2"><i className="fas fa-chess-board mr-1.5" style={{ color: "var(--color-bronze)" }} />Campo de batalla</p>
        <h1 className="font-display text-3xl md:text-4xl font-extrabold gold-text">Tablero</h1>
      </header>

      {/* Sin `hideEmpty`: aquí SIEMPRE se ve, así que un jugador puede tirar
          iniciativa y abrir la ronda él mismo. En la hoja iba con hideEmpty y
          por eso no aparecía hasta que el DM creaba la primera fila. */}
      <div className="mb-4">
        <InitiativeTracker mod={ficha.derived.abilities.des.mod} />
      </div>

      <div className="grid lg:grid-cols-[1.7fr_1fr] gap-5 items-start">
        <div>
          {!ready ? (
            <p className="text-center text-sm py-10" style={{ color: "var(--color-dim)" }}>Cargando…</p>
          ) : missing ? (
            <p className="text-center text-sm italic py-10" style={{ color: "var(--color-ember)" }}>
              El tablero no está listo{isDM ? ": ejecuta supabase/schema_v22.sql en Supabase." : "."}
            </p>
          ) : !board.active ? (
            <div className="panel p-8 text-center">
              <i className="fas fa-peace text-3xl mb-3" style={{ color: "var(--color-dim)" }} />
              <p className="font-ui text-[13px]" style={{ color: "var(--color-dim)" }}>
                No hay combate en curso. Puedes seguir curándote, preparando conjuros y gastando rasgos.
              </p>
            </div>
          ) : (
            <>
              <BattleBoard
                tokens={tokens}
                board={board}
                canMove={(t: Token) => !!session && t.user_id === session.id}
                onMove={(id, x, y) => { void moveToken(id, x, y); }}
              />
              <p className="text-[12px] mt-2 text-center italic" style={{ color: "var(--color-dim)" }}>
                Arrastra tu ficha. Toca una ficha para ver a qué distancia está.
              </p>
            </>
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
              tokens={tokens}
              board={board}
              ownUserId={session?.id ?? null}
              condsDe={condsDe}
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
