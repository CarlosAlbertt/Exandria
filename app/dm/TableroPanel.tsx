"use client";
import { useState } from "react";
import { useBattle, moveToken, addNpcToken, removeToken, clearTokens, setBoardConfig, poblarDesdeIniciativa } from "@/lib/useBattle";
import { useInitiative } from "@/lib/useInitiative";
import { useParty } from "@/lib/character";
import BattleBoard from "@/components/tablero/BattleBoard";

export default function TableroPanel() {
  const { tokens, board, ready, missing } = useBattle();
  const { rows } = useInitiative();
  const { party } = useParty();
  const [npc, setNpc] = useState("");
  const [bg, setBg] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const nombre = (userId: string) => party.find((p) => p.user_id === userId)?.username ?? "Jugador";

  async function run(fn: () => Promise<{ error: string | null }>) {
    setErr(null);
    const { error } = await fn();
    if (error) setErr(error);
  }

  if (missing) {
    return <p className="text-sm italic" style={{ color: "var(--color-ember)" }}>Ejecuta <code>supabase/schema_v22.sql</code> en Supabase para activar el tablero.</p>;
  }
  if (!ready) return <p className="text-sm" style={{ color: "var(--color-dim)" }}>Cargando…</p>;

  return (
    <div className="space-y-5">
      {/* Config */}
      <div className="panel p-4 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="eyebrow"><i className="fas fa-chess-board mr-1.5" style={{ color: "var(--color-bronze)" }} />Tablero</p>
          <button className="btn-gold !py-1.5 !px-3 text-[12px]" onClick={() => run(() => setBoardConfig({ active: !board.active }))}>
            <i className={`fas fa-${board.active ? "pause" : "play"} mr-1.5`} />{board.active ? "En curso — pausar" : "Iniciar combate"}
          </button>
        </div>
        <div className="flex gap-2 flex-wrap items-end">
          <label className="flex flex-col gap-1 text-[11px]" style={{ color: "var(--color-dim)" }}>Fondo (URL)
            <input value={bg} onChange={(e) => setBg(e.target.value)} placeholder="/maps/pueblos/emon.jpg" className="w-56 bg-[var(--color-night)] rounded-lg px-2 py-1 font-ui text-sm outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)]" />
          </label>
          <button className="btn-ghost !py-1.5 !px-3 text-[12px]" onClick={() => run(() => setBoardConfig({ bg_url: bg.trim() || null }))}>Fijar fondo</button>
          <label className="flex flex-col gap-1 text-[11px]" style={{ color: "var(--color-dim)" }}>Cols
            <input type="number" value={board.cols} onChange={(e) => run(() => setBoardConfig({ cols: Math.max(4, Math.min(40, Number(e.target.value) || 20)) }))} className="w-16 bg-[var(--color-night)] rounded-lg px-2 py-1 font-ui text-sm outline-none border border-[var(--color-line)]" />
          </label>
          <label className="flex flex-col gap-1 text-[11px]" style={{ color: "var(--color-dim)" }}>Filas
            <input type="number" value={board.rows} onChange={(e) => run(() => setBoardConfig({ rows: Math.max(4, Math.min(30, Number(e.target.value) || 12)) }))} className="w-16 bg-[var(--color-night)] rounded-lg px-2 py-1 font-ui text-sm outline-none border border-[var(--color-line)]" />
          </label>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button className="btn-ghost !py-1.5 !px-3 text-[12px]" onClick={() => run(() => poblarDesdeIniciativa(rows, nombre))}><i className="fas fa-users mr-1.5" />Poblar desde iniciativa</button>
          <input value={npc} onChange={(e) => setNpc(e.target.value)} placeholder="Nombre de PNJ" className="bg-[var(--color-night)] rounded-lg px-2 py-1 font-ui text-sm outline-none border border-[var(--color-line)]" />
          <button className="btn-ghost !py-1.5 !px-3 text-[12px]" onClick={() => { if (npc.trim()) { run(() => addNpcToken(npc.trim())); setNpc(""); } }}><i className="fas fa-plus mr-1.5" />Añadir PNJ</button>
          <button className="btn-ghost !py-1.5 !px-3 text-[12px]" onClick={() => run(() => clearTokens())}><i className="fas fa-trash mr-1.5" />Vaciar</button>
        </div>
        {err && <p className="text-[12px] italic" style={{ color: "var(--color-ember)" }}>{err}</p>}
      </div>

      {/* Tablero */}
      <BattleBoard tokens={tokens} board={board} canMove={() => true} onMove={(id, x, y) => { void moveToken(id, x, y); }} />

      {/* Lista de fichas para borrar una */}
      {tokens.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tokens.map((t) => (
            <span key={t.id} className="font-ui text-[12px] px-2 py-1 rounded-lg flex items-center gap-2" style={{ border: "1px solid var(--color-line)", color: "var(--color-warm)" }}>
              <span className="w-3 h-3 rounded-full" style={{ background: t.color }} />{t.label}
              <button onClick={() => run(() => removeToken(t.id))} title="Borrar ficha"><i className="fas fa-xmark" style={{ color: "var(--color-dim)" }} /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
