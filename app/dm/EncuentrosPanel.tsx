"use client";

import { useEffect, useMemo, useState } from "react";
import { useParty } from "@/lib/character";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import { CR_XP, partyBudget, xpForCr, verdict, type Difficulty } from "@/data/encounters";
import { REGIONS } from "@/data/taldorei";

type Row = { id: string; cr: string; count: number };

const DIFF_LABEL: Record<Difficulty, string> = { baja: "Baja", moderada: "Moderada", alta: "Alta" };
const DIFF_COLOR: Record<Difficulty, string> = {
  baja: "var(--color-primitivo)",
  moderada: "var(--color-bronze)",
  alta: "var(--color-ember)",
};
const VERDICT_COLOR: Record<Difficulty | "mortal", string> = { ...DIFF_COLOR, mortal: "var(--color-violet)" };
const VERDICT_LABEL: Record<Difficulty | "mortal", string> = { ...DIFF_LABEL, mortal: "Mortal" };

const inputCls = "w-full bg-[var(--color-night)] rounded-lg px-3 py-2 font-ui text-[13px] outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)] transition-colors";

// El DM edita/entrega XP en la hoja de cualquier jugador. Mismo camino que
// GrupoPanel: service_role en el servidor, salta la RLS de escritura propia.
async function dmPatch(userId: string, patch: Record<string, unknown>) {
  await fetch("/api/dm/character", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, patch }) });
}

// Pestaña DM "Mesa": calculadora de encuentros (presupuesto de XP del grupo
// vs. monstruos puestos en la mesa) y notas privadas del DM por región/PJ.
export default function EncuentrosPanel() {
  const { party } = useParty();

  const levels = useMemo(() => party.map((p) => p.level ?? 1), [party]);
  const budgets = useMemo<Record<Difficulty, number>>(() => ({
    baja: partyBudget(levels, "baja"),
    moderada: partyBudget(levels, "moderada"),
    alta: partyBudget(levels, "alta"),
  }), [levels]);

  const [rows, setRows] = useState<Row[]>([{ id: crypto.randomUUID(), cr: "1", count: 1 }]);
  const totalMonsterXp = rows.reduce((sum, r) => sum + xpForCr(r.cr) * r.count, 0);
  const result = verdict(totalMonsterXp, budgets);

  function addRow() {
    setRows((prev) => [...prev, { id: crypto.randomUUID(), cr: "1", count: 1 }]);
  }
  function removeRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }
  function updateRow(id: string, patch: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  async function repartirXp() {
    if (party.length === 0 || totalMonsterXp <= 0) return;
    const perPlayer = Math.floor(totalMonsterXp / party.length);
    if (perPlayer <= 0) return;
    if (!confirm(`¿Repartir ${perPlayer} XP a cada uno de los ${party.length} jugadores?`)) return;
    await Promise.all(party.map((p) => dmPatch(p.user_id, { addXp: perPlayer })));
  }

  return (
    <div className="space-y-6">
      {/* RESUMEN DEL GRUPO */}
      <section className="panel p-5">
        <p className="eyebrow mb-3"><i className="fas fa-users-line mr-1.5" style={{ color: "var(--color-bronze)" }} />Grupo</p>
        {party.length === 0 ? (
          <p className="text-[13px] italic" style={{ color: "var(--color-dim)" }}>Aún no hay fichas de jugador.</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 mb-4">
              {party.map((p) => (
                <span key={p.user_id} className="chip" data-on>
                  {p.name || p.username} · Nv.{p.level ?? 1}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(DIFF_LABEL) as Difficulty[]).map((d) => (
                <div key={d} className="panel-raised py-2.5 text-center">
                  <p className="eyebrow !text-[9px] mb-1">{DIFF_LABEL[d]}</p>
                  <p className="font-display text-lg font-extrabold" style={{ color: DIFF_COLOR[d] }}>{budgets[d].toLocaleString("es-ES")}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* MONSTRUOS EN LA MESA */}
      <section className="panel p-5">
        <p className="eyebrow mb-3"><i className="fas fa-dragon mr-1.5" style={{ color: "var(--color-bronze)" }} />Monstruos</p>
        <div className="space-y-2 mb-3">
          {rows.map((r) => {
            const xp = xpForCr(r.cr) * r.count;
            return (
              <div key={r.id} className="grid sm:grid-cols-[140px_100px_1fr_auto] gap-2 items-center">
                <select value={r.cr} onChange={(e) => updateRow(r.id, { cr: e.target.value })} className={inputCls} style={{ color: "var(--color-warm)" }}>
                  {CR_XP.map((c) => <option key={c.cr} value={c.cr}>CR {c.cr} ({c.xp} XP)</option>)}
                </select>
                <input
                  type="number" min={0} value={r.count}
                  onChange={(e) => updateRow(r.id, { count: Math.max(0, Number(e.target.value) || 0) })}
                  className={inputCls} style={{ color: "var(--color-warm)" }}
                />
                <p className="font-ui text-[13px]" style={{ color: "var(--color-muted)" }}>{xp.toLocaleString("es-ES")} XP</p>
                <button className="btn-ghost !py-1.5 !px-2.5 text-[11px]" style={{ color: "var(--color-ember)" }} onClick={() => removeRow(r.id)}>
                  <i className="fas fa-trash" />
                </button>
              </div>
            );
          })}
        </div>
        <button className="btn-ghost !py-2 !px-4 text-[12px] mb-4" onClick={addRow}>
          <i className="fas fa-plus mr-1.5" />Añadir monstruo
        </button>

        <div className="panel-raised p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow !text-[9px] mb-1">XP total de monstruos</p>
            <p className="font-display text-xl font-extrabold gold-text">{totalMonsterXp.toLocaleString("es-ES")}</p>
          </div>
          <div>
            <p className="eyebrow !text-[9px] mb-1">Veredicto</p>
            <p className="font-display text-xl font-extrabold" style={{ color: VERDICT_COLOR[result] }}>{VERDICT_LABEL[result]}</p>
          </div>
          <button className="btn-gold" onClick={repartirXp} disabled={party.length === 0 || totalMonsterXp <= 0}>
            <i className="fas fa-star mr-2" />Repartir XP
          </button>
        </div>
      </section>

      {/* NOTAS PRIVADAS DEL DM */}
      <NotasDmSection />
    </div>
  );
}

/* ------------------------------ NOTAS DM ------------------------------ */
function NotasDmSection() {
  const { party } = useParty();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [scope, setScope] = useState("general");
  const [text, setText] = useState("");
  const [saved, setSaved] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!supabaseConfigured) return;
    createClient().from("app_config").select("value").eq("key", "dm_notes").maybeSingle()
      .then(({ data }) => {
        let parsed: Record<string, string> = {};
        try { parsed = data?.value ? JSON.parse(data.value) : {}; } catch { parsed = {}; }
        setNotes(parsed);
      });
  }, []);

  // Reinicia el borrador cuando cambia el ámbito seleccionado o llegan las
  // notas cargadas del servidor. Ajuste durante el render (no en un efecto),
  // siguiendo el patrón recomendado por React para sincronizar con props/estado
  // que cambian de identidad.
  const [prevScope, setPrevScope] = useState(scope);
  const [prevNotesRef, setPrevNotesRef] = useState(notes);
  if (scope !== prevScope || notes !== prevNotesRef) {
    setPrevScope(scope);
    setPrevNotesRef(notes);
    const v = notes[scope] ?? "";
    setText(v);
    setSaved(v);
  }

  async function save() {
    setBusy(true); setMsg(null);
    const merged = { ...notes, [scope]: text };
    const { error } = await createClient().from("app_config").upsert({ key: "dm_notes", value: JSON.stringify(merged), updated_at: new Date().toISOString() });
    setBusy(false);
    if (error) setMsg({ ok: false, text: error.message });
    else { setNotes(merged); setSaved(text); setMsg({ ok: true, text: "Notas guardadas." }); }
  }

  const dirty = text !== saved;

  return (
    <section className="panel p-5">
      <p className="eyebrow mb-1"><i className="fas fa-note-sticky mr-1.5" style={{ color: "var(--color-bronze)" }} />Notas del DM</p>
      <p className="text-[13px] mb-3" style={{ color: "var(--color-muted)" }}>
        Notas privadas por región o personaje. Solo tú deberías verlas desde este panel.
      </p>
      <select value={scope} onChange={(e) => setScope(e.target.value)} className={`${inputCls} mb-2`} style={{ color: "var(--color-warm)" }}>
        <option value="general">General</option>
        <optgroup label="Regiones">
          {REGIONS.map((r) => <option key={r.slug} value={`region:${r.slug}`}>{r.name}</option>)}
        </optgroup>
        {party.length > 0 && (
          <optgroup label="Personajes">
            {party.map((p) => <option key={p.user_id} value={`pj:${p.user_id}`}>{p.name || p.username}</option>)}
          </optgroup>
        )}
      </select>
      <textarea
        value={text} onChange={(e) => setText(e.target.value)} rows={6}
        placeholder="Escribe aquí lo que solo el DM debe saber…"
        className={`${inputCls} mb-3 resize-none`} style={{ color: "var(--color-warm)" }}
      />
      <button className="btn-gold !py-2 !px-4 text-[12px]" onClick={save} disabled={busy || !dirty}>
        <i className="fas fa-floppy-disk mr-1.5" />Guardar
      </button>
      {msg && <p className="text-[12px] mt-2 italic" style={{ color: msg.ok ? "var(--color-primitivo)" : "var(--color-ember)" }}>{msg.text}</p>}
    </section>
  );
}
