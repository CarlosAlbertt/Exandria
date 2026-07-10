"use client";

import { useState } from "react";
import {
  useChronicle,
  saveJournalEntry, deleteJournalEntry,
  saveQuest, deleteQuest,
  saveNpc, deleteNpc,
  type JournalEntry, type Quest, type NpcMet,
} from "@/lib/useChronicle";
import { REGIONS } from "@/data/taldorei";

const QUEST_LABEL: Record<Quest["status"], string> = {
  activa: "En curso", completada: "Completada", fallida: "Fallida", oculta: "Oculta",
};
const QUEST_COLOR: Record<Quest["status"], string> = {
  activa: "var(--color-bronze)", completada: "var(--color-primitivo)", fallida: "var(--color-ember)", oculta: "var(--color-dim)",
};

const inputCls = "w-full bg-[var(--color-night)] rounded-lg px-3 py-2 font-ui text-[13px] outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)] transition-colors";

// Pestaña DM "Crónica": tres listas gestionadas (diario, misiones, PNJ). El
// hook useChronicle ya trae todo (RLS: el DM ve también borradores y
// ocultos). La fecha narrativa ya no se edita aquí: la controla el reloj de
// campaña (pestaña "Tiempo").
export default function CronicaPanel() {
  const { entries, quests, npcs } = useChronicle();

  return (
    <div className="space-y-6">
      <FechaNota />
      <DiarioSection entries={entries} />
      <MisionesSection quests={quests} />
      <PnjSection npcs={npcs} />
    </div>
  );
}

/* ------------------------------ FECHA ------------------------------ */
function FechaNota() {
  return (
    <section className="panel p-5">
      <p className="text-[13px]" style={{ color: "var(--color-muted)" }}>
        <i className="fas fa-clock mr-1.5" style={{ color: "var(--color-bronze)" }} />
        La fecha ahora se controla en la pestaña Tiempo.
      </p>
    </section>
  );
}

/* ------------------------------ DIARIO ------------------------------ */
const EMPTY_ENTRY = { session_no: "", title: "", game_date: "", body: "" };

function DiarioSection({ entries }: { entries: JournalEntry[] }) {
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_ENTRY);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function edit(e: JournalEntry) {
    setEditing(e.id);
    setForm({ session_no: e.session_no != null ? String(e.session_no) : "", title: e.title, game_date: e.game_date ?? "", body: e.body });
    setErr(null);
  }
  function reset() { setEditing(null); setForm(EMPTY_ENTRY); }

  async function save(visible: boolean) {
    if (!form.title.trim() || busy) return;
    setBusy(true); setErr(null);
    const patch = {
      ...(editing != null ? { id: editing } : {}),
      session_no: form.session_no.trim() ? Number(form.session_no) : null,
      title: form.title.trim(),
      game_date: form.game_date.trim() || null,
      body: form.body,
      visible,
    };
    const { error } = await saveJournalEntry(patch);
    setBusy(false);
    if (error) setErr(error); else reset();
  }

  async function toggleVisible(e: JournalEntry) {
    const { error } = await saveJournalEntry({ id: e.id, visible: !e.visible });
    if (error) setErr(error);
  }

  async function remove(id: number) {
    if (!confirm("¿Borrar esta entrada del diario?")) return;
    const { error } = await deleteJournalEntry(id);
    if (error) setErr(error);
    if (editing === id) reset();
  }

  return (
    <section className="panel p-5">
      <p className="eyebrow mb-3"><i className="fas fa-feather-pointed mr-1.5" style={{ color: "var(--color-bronze)" }} />Diario de sesión</p>

      <div className="space-y-2 mb-4">
        {entries.map((e) => (
          <div key={e.id} className="panel-raised px-3 py-2.5 flex items-center justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {e.session_no != null && <span className="font-ui text-[11px]" style={{ color: "var(--color-arcane)" }}>Sesión {e.session_no}</span>}
                <strong className="font-ui text-[13px]" style={{ color: "var(--color-bronze-bright)" }}>{e.title}</strong>
                <span className="font-ui text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: e.visible ? "var(--color-primitivo)" : "var(--color-dim)", border: `1px solid ${e.visible ? "var(--color-primitivo)" : "var(--color-line)"}` }}>
                  {e.visible ? "publicado" : "borrador"}
                </span>
              </div>
              {e.game_date && <span className="font-ui text-[11px]" style={{ color: "var(--color-dim)" }}>{e.game_date}</span>}
            </div>
            <div className="flex gap-1.5 shrink-0">
              <button className="btn-ghost !py-1 !px-2.5 text-[11px]" onClick={() => edit(e)}><i className="fas fa-pen mr-1" />Editar</button>
              <button className="btn-ghost !py-1 !px-2.5 text-[11px]" onClick={() => toggleVisible(e)}>
                <i className={`fas ${e.visible ? "fa-eye-slash" : "fa-eye"} mr-1`} />{e.visible ? "Ocultar" : "Publicar"}
              </button>
              <button className="btn-ghost !py-1 !px-2.5 text-[11px]" style={{ color: "var(--color-ember)" }} onClick={() => remove(e.id)}><i className="fas fa-trash mr-1" />Borrar</button>
            </div>
          </div>
        ))}
        {entries.length === 0 && <p className="text-[13px] italic" style={{ color: "var(--color-dim)" }}>Sin entradas todavía.</p>}
      </div>

      <div className="panel-raised p-4">
        <div className="grid sm:grid-cols-2 gap-2 mb-2">
          <input type="number" value={form.session_no} onChange={(ev) => setForm((f) => ({ ...f, session_no: ev.target.value }))}
            placeholder="Nº de sesión (opcional)" className={inputCls} style={{ color: "var(--color-warm)" }} />
          <input value={form.game_date} onChange={(ev) => setForm((f) => ({ ...f, game_date: ev.target.value }))}
            placeholder="12 de Sydenstar, 836 PD" className={inputCls} style={{ color: "var(--color-warm)" }} />
        </div>
        <input value={form.title} onChange={(ev) => setForm((f) => ({ ...f, title: ev.target.value }))}
          placeholder="Título de la entrada" className={`${inputCls} mb-2`} style={{ color: "var(--color-warm)" }} />
        <textarea value={form.body} onChange={(ev) => setForm((f) => ({ ...f, body: ev.target.value }))} rows={6}
          placeholder="Qué ocurrió en la sesión…" className={`${inputCls} mb-3 resize-none`} style={{ color: "var(--color-warm)" }} />
        <div className="flex gap-2 flex-wrap">
          <button className="btn-ghost !py-2 !px-4 text-[12px]" onClick={() => save(false)} disabled={busy || !form.title.trim()}>
            <i className="fas fa-file-pen mr-1.5" />Guardar borrador
          </button>
          <button className="btn-gold !py-2 !px-4 text-[12px]" onClick={() => save(true)} disabled={busy || !form.title.trim()}>
            <i className="fas fa-check mr-1.5" />{editing != null ? "Guardar cambios" : "Publicar"}
          </button>
          {editing != null && <button className="btn-ghost !py-2 !px-4 text-[12px]" onClick={reset}><i className="fas fa-xmark mr-1.5" />Cancelar</button>}
        </div>
        {err && <p className="text-[12px] mt-2 italic" style={{ color: "var(--color-ember)" }}>{err}</p>}
      </div>
    </section>
  );
}

/* ------------------------------ MISIONES ------------------------------ */
const EMPTY_QUEST = { title: "", body: "", status: "activa" as Quest["status"] };

function MisionesSection({ quests }: { quests: Quest[] }) {
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_QUEST);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function edit(q: Quest) {
    setEditing(q.id);
    setForm({ title: q.title, body: q.body, status: q.status });
    setErr(null);
  }
  function reset() { setEditing(null); setForm(EMPTY_QUEST); }

  async function save() {
    if (!form.title.trim() || busy) return;
    setBusy(true); setErr(null);
    const patch = { ...(editing != null ? { id: editing } : {}), title: form.title.trim(), body: form.body, status: form.status };
    const { error } = await saveQuest(patch);
    setBusy(false);
    if (error) setErr(error); else reset();
  }

  async function remove(id: number) {
    if (!confirm("¿Borrar esta misión?")) return;
    const { error } = await deleteQuest(id);
    if (error) setErr(error);
    if (editing === id) reset();
  }

  return (
    <section className="panel p-5">
      <p className="eyebrow mb-3"><i className="fas fa-map mr-1.5" style={{ color: "var(--color-bronze)" }} />Misiones</p>

      <div className="space-y-2 mb-4">
        {quests.map((q) => (
          <div key={q.id} className="panel-raised px-3 py-2.5 flex items-center justify-between gap-3 flex-wrap">
            <div className="min-w-0 flex items-center gap-2 flex-wrap">
              <strong className="font-ui text-[13px]" style={{ color: "var(--color-parch)" }}>{q.title}</strong>
              <span className="font-ui text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: QUEST_COLOR[q.status], border: `1px solid ${QUEST_COLOR[q.status]}55` }}>
                {QUEST_LABEL[q.status]}
              </span>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <button className="btn-ghost !py-1 !px-2.5 text-[11px]" onClick={() => edit(q)}><i className="fas fa-pen mr-1" />Editar</button>
              <button className="btn-ghost !py-1 !px-2.5 text-[11px]" style={{ color: "var(--color-ember)" }} onClick={() => remove(q.id)}><i className="fas fa-trash mr-1" />Borrar</button>
            </div>
          </div>
        ))}
        {quests.length === 0 && <p className="text-[13px] italic" style={{ color: "var(--color-dim)" }}>Sin misiones todavía.</p>}
      </div>

      <div className="panel-raised p-4">
        <div className="grid sm:grid-cols-[1fr_160px] gap-2 mb-2">
          <input value={form.title} onChange={(ev) => setForm((f) => ({ ...f, title: ev.target.value }))}
            placeholder="Título de la misión" className={inputCls} style={{ color: "var(--color-warm)" }} />
          <select value={form.status} onChange={(ev) => setForm((f) => ({ ...f, status: ev.target.value as Quest["status"] }))}
            className={inputCls} style={{ color: "var(--color-warm)" }}>
            {(Object.keys(QUEST_LABEL) as Quest["status"][]).map((s) => <option key={s} value={s}>{QUEST_LABEL[s]}</option>)}
          </select>
        </div>
        <textarea value={form.body} onChange={(ev) => setForm((f) => ({ ...f, body: ev.target.value }))} rows={3}
          placeholder="Detalles de la misión…" className={`${inputCls} mb-3 resize-none`} style={{ color: "var(--color-warm)" }} />
        <div className="flex gap-2 flex-wrap">
          <button className="btn-gold !py-2 !px-4 text-[12px]" onClick={save} disabled={busy || !form.title.trim()}>
            <i className="fas fa-floppy-disk mr-1.5" />{editing != null ? "Guardar cambios" : "Añadir misión"}
          </button>
          {editing != null && <button className="btn-ghost !py-2 !px-4 text-[12px]" onClick={reset}><i className="fas fa-xmark mr-1.5" />Cancelar</button>}
        </div>
        {err && <p className="text-[12px] mt-2 italic" style={{ color: "var(--color-ember)" }}>{err}</p>}
      </div>
    </section>
  );
}

/* -------------------------------- PNJ -------------------------------- */
const EMPTY_NPC = { name: "", role: "", notes: "", region: "", visible: true };

function PnjSection({ npcs }: { npcs: NpcMet[] }) {
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_NPC);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function edit(n: NpcMet) {
    setEditing(n.id);
    setForm({ name: n.name, role: n.role, notes: n.notes, region: n.region ?? "", visible: n.visible });
    setErr(null);
  }
  function reset() { setEditing(null); setForm(EMPTY_NPC); }

  async function save() {
    if (!form.name.trim() || busy) return;
    setBusy(true); setErr(null);
    const patch = {
      ...(editing != null ? { id: editing } : {}),
      name: form.name.trim(), role: form.role.trim(), notes: form.notes,
      region: form.region || null, visible: form.visible,
    };
    const { error } = await saveNpc(patch);
    setBusy(false);
    if (error) setErr(error); else reset();
  }

  async function remove(id: number) {
    if (!confirm("¿Borrar este PNJ?")) return;
    const { error } = await deleteNpc(id);
    if (error) setErr(error);
    if (editing === id) reset();
  }

  return (
    <section className="panel p-5">
      <p className="eyebrow mb-3"><i className="fas fa-people-group mr-1.5" style={{ color: "var(--color-bronze)" }} />PNJ conocidos</p>

      <div className="space-y-2 mb-4">
        {npcs.map((n) => {
          const region = n.region ? REGIONS.find((r) => r.slug === n.region)?.name : null;
          return (
            <div key={n.id} className="panel-raised px-3 py-2.5 flex items-center justify-between gap-3 flex-wrap">
              <div className="min-w-0 flex items-center gap-2 flex-wrap">
                <strong className="font-ui text-[13px]" style={{ color: "var(--color-bronze-bright)" }}>{n.name}</strong>
                <span className="font-ui text-[11px]" style={{ color: "var(--color-dim)" }}>{n.role}{region ? ` · ${region}` : ""}</span>
                <span className="font-ui text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: n.visible ? "var(--color-primitivo)" : "var(--color-dim)", border: `1px solid ${n.visible ? "var(--color-primitivo)" : "var(--color-line)"}` }}>
                  {n.visible ? "visible" : "oculto"}
                </span>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button className="btn-ghost !py-1 !px-2.5 text-[11px]" onClick={() => edit(n)}><i className="fas fa-pen mr-1" />Editar</button>
                <button className="btn-ghost !py-1 !px-2.5 text-[11px]" style={{ color: "var(--color-ember)" }} onClick={() => remove(n.id)}><i className="fas fa-trash mr-1" />Borrar</button>
              </div>
            </div>
          );
        })}
        {npcs.length === 0 && <p className="text-[13px] italic" style={{ color: "var(--color-dim)" }}>Sin PNJ todavía.</p>}
      </div>

      <div className="panel-raised p-4">
        <div className="grid sm:grid-cols-2 gap-2 mb-2">
          <input value={form.name} onChange={(ev) => setForm((f) => ({ ...f, name: ev.target.value }))}
            placeholder="Nombre" className={inputCls} style={{ color: "var(--color-warm)" }} />
          <input value={form.role} onChange={(ev) => setForm((f) => ({ ...f, role: ev.target.value }))}
            placeholder="Rol (ej.: tabernero)" className={inputCls} style={{ color: "var(--color-warm)" }} />
        </div>
        <textarea value={form.notes} onChange={(ev) => setForm((f) => ({ ...f, notes: ev.target.value }))} rows={2}
          placeholder="Notas…" className={`${inputCls} mb-2 resize-none`} style={{ color: "var(--color-warm)" }} />
        <div className="grid sm:grid-cols-[1fr_auto] gap-2 items-center mb-3">
          <select value={form.region} onChange={(ev) => setForm((f) => ({ ...f, region: ev.target.value }))}
            className={inputCls} style={{ color: "var(--color-warm)" }}>
            <option value="">— sin región —</option>
            {REGIONS.map((r) => <option key={r.slug} value={r.slug}>{r.name}</option>)}
          </select>
          <button
            className="font-ui text-[12px] font-bold px-3 py-2 rounded-lg transition-colors whitespace-nowrap"
            onClick={() => setForm((f) => ({ ...f, visible: !f.visible }))}
            style={{ color: form.visible ? "var(--color-ink)" : "var(--color-muted)", background: form.visible ? "var(--color-primitivo)" : "transparent", border: `1px solid ${form.visible ? "var(--color-primitivo)" : "var(--color-line)"}` }}
          >
            <i className={`fas ${form.visible ? "fa-eye" : "fa-eye-slash"} mr-1.5`} />{form.visible ? "Visible" : "Oculto"}
          </button>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button className="btn-gold !py-2 !px-4 text-[12px]" onClick={save} disabled={busy || !form.name.trim()}>
            <i className="fas fa-floppy-disk mr-1.5" />{editing != null ? "Guardar cambios" : "Añadir PNJ"}
          </button>
          {editing != null && <button className="btn-ghost !py-2 !px-4 text-[12px]" onClick={reset}><i className="fas fa-xmark mr-1.5" />Cancelar</button>}
        </div>
        {err && <p className="text-[12px] mt-2 italic" style={{ color: "var(--color-ember)" }}>{err}</p>}
      </div>
    </section>
  );
}
