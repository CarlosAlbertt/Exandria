"use client";
import { useSession } from "@/components/SessionProvider";
import { useBattle, moveToken, type Token } from "@/lib/useBattle";
import BattleBoard from "@/components/tablero/BattleBoard";

export default function TableroPage() {
  const session = useSession();
  const isDM = session?.role === "dm";
  const { tokens, board, ready, missing } = useBattle();

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <header className="text-center mb-6">
        <p className="eyebrow mb-3"><i className="fas fa-chess-board mr-1.5" style={{ color: "var(--color-bronze)" }} />Campo de batalla</p>
        <h1 className="font-display text-3xl md:text-4xl font-extrabold gold-text">Tablero</h1>
      </header>

      {!ready ? (
        <p className="text-center text-sm" style={{ color: "var(--color-dim)" }}>Cargando…</p>
      ) : missing ? (
        <p className="text-center text-sm italic" style={{ color: "var(--color-ember)" }}>
          El tablero no está listo{isDM ? ": ejecuta supabase/schema_v22.sql en Supabase." : "."}
        </p>
      ) : !board.active ? (
        <p className="text-center text-sm italic" style={{ color: "var(--color-dim)" }}>
          <i className="fas fa-peace mr-1.5" />No hay combate en curso.
        </p>
      ) : (
        <>
          <BattleBoard
            tokens={tokens}
            board={board}
            canMove={(t: Token) => !!session && t.user_id === session.id}
            onMove={(id, x, y) => { void moveToken(id, x, y); }}
          />
          <p className="text-[12px] mt-3 text-center italic" style={{ color: "var(--color-dim)" }}>
            Arrastra tu ficha. Toca una ficha para ver a qué distancia está.
          </p>
        </>
      )}
    </main>
  );
}
