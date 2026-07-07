"use client";

import { useState } from "react";
import { useParty } from "@/lib/character";
import { useDmStash, saveStash, type StashType, type StashEntry } from "@/lib/useDmStash";

const TYPES: { id: StashType; label: string; icon: string }[] = [
  { id: "magico", label: "Mágico", icon: "fa-wand-sparkles" },
  { id: "normal", label: "Normal", icon: "fa-box" },
  { id: "oro", label: "Oro", icon: "fa-coins" },
];

function typeMeta(t: StashType) {
  if (t === "magico") return { label: "Mágico", color: "var(--color-arcane)", icon: "fa-wand-sparkles" };
  if (t === "oro") return { label: "Oro", color: "var(--color-bronze)", icon: "fa-coins" };
  return { label: "Normal", color: "var(--color-muted)", icon: "fa-box" };
}

export default function BaulPanel() {
  const { party, ready } = useParty();
  const { stash } = useDmStash();

  const [name, setName] = useState("");
  const [type, setType] = useState<StashType>("normal");
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");

  // Estado por entrada: jugadores seleccionados, "quitar al entregar" y flag de ocupado.
  const [picks, setPicks] = useState<Record<string, string[]>>({});
  const [removeOnDeliver, setRemoveOnDeliver] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<Record<string, string>>({});

  function add() {
    if (!name.trim()) return;
    const entry: StashEntry = {
      id: crypto.randomUUID(),
      name: name.trim(),
      type,
      qty: Math.max(1, qty),
      notes: notes.trim() || undefined,
    };
    void saveStash([...stash, entry]);
    setName(""); setType("normal"); setQty(1); setNotes("");
  }

  function togglePick(entryId: string, userId: string) {
    setPicks((prev) => {
      const cur = prev[entryId] ?? [];
      return { ...prev, [entryId]: cur.includes(userId) ? cur.filter((u) => u !== userId) : [...cur, userId] };
    });
  }

  async function deliver(entry: StashEntry) {
    const targets = picks[entry.id] ?? [];
    if (targets.length === 0 || busy) return;
    setBusy(entry.id);
    setMsg((m) => ({ ...m, [entry.id]: "" }));
    try {
      for (const userId of targets) {
        const patch = entry.type === "oro"
          ? { addGold: entry.qty }
          : { addItems: [{ name: entry.name, qty: entry.qty, notes: entry.notes }] };
        const res = await fetch("/api/dm/character", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, patch }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Error al entregar.");
        }
      }
      if (removeOnDeliver[entry.id]) {
        await saveStash(stash.filter((e) => e.id !== entry.id));
        setPicks((p) => { const n = { ...p }; delete n[entry.id]; return n; });
      }
      setMsg((m) => ({ ...m, [entry.id]: `Entregado a ${targets.length} jugador${targets.length === 1 ? "" : "es"}.` }));
    } catch (e) {
      setMsg((m) => ({ ...m, [entry.id]: e instanceof Error ? e.message : "Error al entregar." }));
    } finally {
      setBusy(null);
    }
  }

  function remove(entry: StashEntry) {
    void saveStash(stash.filter((e) => e.id !== entry.id));
  }

  const inputCls = "w-full bg-[var(--color-night)] rounded-lg px-3 py-2 font-body text-[15px] outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)]";

  return (
    <div className="space-y-6">
      <header className="text-center">
        <p className="eyebrow mb-2"><i className="fas fa-box-archive mr-1.5" style={{ color: "var(--color-bronze)" }} />El baúl del director</p>
        <h2 className="font-display text-2xl md:text-3xl font-extrabold gold-text">El Baúl del Dungeon Master</h2>
      </header>

      {/* Añadir entrada */}
      <section className="panel p-6">
        <h3 className="font-display text-lg font-bold mb-4" style={{ color: "var(--color-parch)" }}>Añadir entrada</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="eyebrow block mb-1.5">Nombre</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej.: Espada larga +1 / Poción de curación"
              className={inputCls} style={{ color: "var(--color-warm)" }} />
          </div>
          <div>
            <label className="eyebrow block mb-1.5">Cantidad</label>
            <input type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
              className={inputCls} style={{ color: "var(--color-warm)" }} />
          </div>
        </div>

        <label className="eyebrow block mb-1.5 mt-4">Tipo</label>
        <div className="flex gap-2 flex-wrap mb-4">
          {TYPES.map((t) => (
            <button key={t.id} onClick={() => setType(t.id)} className="chip" data-on={type === t.id}>
              <i className={`fas ${t.icon} mr-1.5`} />{t.label}
            </button>
          ))}
        </div>

        <label className="eyebrow block mb-1.5">Notas (opcional)</label>
        <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Detalles, procedencia, requisitos de sintonía…"
          className={`${inputCls} mb-4`} style={{ color: "var(--color-warm)" }} />

        <button className="btn-gold w-full" onClick={add} disabled={!name.trim()}>
          <i className="fas fa-plus mr-2" />Añadir al baúl
        </button>
      </section>

      {/* Lista */}
      {stash.length === 0 ? (
        <div className="panel p-10 text-center">
          <i className="fas fa-box-open text-3xl mb-3" style={{ color: "var(--color-dim)" }} />
          <p className="prose-lore !text-[15px]" style={{ color: "var(--color-muted)" }}>El baúl está vacío. Añade objetos u oro para repartirlos entre tus jugadores.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {stash.map((entry) => {
            const meta = typeMeta(entry.type);
            const targets = picks[entry.id] ?? [];
            const isBusy = busy === entry.id;
            return (
              <div key={entry.id} className="panel p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-ui text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ color: meta.color, border: `1px solid ${meta.color}55` }}>
                        <i className={`fas ${meta.icon} mr-1`} />{meta.label}
                      </span>
                      <h4 className="font-display text-lg font-bold" style={{ color: "var(--color-parch)" }}>{entry.name}</h4>
                      <span className="font-ui text-[12px] font-bold px-2 py-0.5 rounded-full" style={{ color: "var(--color-primitivo)", border: "1px solid var(--color-primitivo)55" }}>×{entry.qty}</span>
                    </div>
                    {entry.notes && <p className="font-body text-[13px] mt-1 italic" style={{ color: "var(--color-muted)" }}>{entry.notes}</p>}
                  </div>
                  <button className="btn-ghost" onClick={() => remove(entry)} style={{ color: "var(--color-ember)" }}>
                    <i className="fas fa-trash mr-2" />Borrar
                  </button>
                </div>

                <div className="mt-4 pt-4 border-t border-[var(--color-line)]">
                  <p className="eyebrow mb-2">Entregar a</p>
                  {ready && party.length === 0 ? (
                    <p className="text-sm italic" style={{ color: "var(--color-dim)" }}>Aún no hay jugadores con ficha.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {party.map((m) => (
                        <button key={m.user_id} onClick={() => togglePick(entry.id, m.user_id)} className="chip" data-on={targets.includes(m.user_id)}>
                          <i className="fas fa-user mr-1.5" />{m.username}
                        </button>
                      ))}
                    </div>
                  )}

                  <label className="flex items-center gap-2 mb-3 cursor-pointer font-ui text-[13px]" style={{ color: "var(--color-muted)" }}>
                    <input type="checkbox" checked={!!removeOnDeliver[entry.id]}
                      onChange={(e) => setRemoveOnDeliver((r) => ({ ...r, [entry.id]: e.target.checked }))}
                      className="accent-[var(--color-bronze)]" />
                    Quitar del baúl al entregar
                  </label>

                  <div className="flex items-center gap-3 flex-wrap">
                    <button className="btn-gold" onClick={() => deliver(entry)} disabled={targets.length === 0 || isBusy}>
                      <i className="fas fa-hand-holding-heart mr-2" />{isBusy ? "Entregando…" : "Entregar"}
                    </button>
                    {msg[entry.id] && <span className="font-ui text-[13px] italic" style={{ color: "var(--color-primitivo)" }}>{msg[entry.id]}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
