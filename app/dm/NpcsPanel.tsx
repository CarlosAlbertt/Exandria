"use client";
import { useEffect, useMemo, useState } from "react";
import { useAtlas } from "@/lib/useAtlas";
import { useNpcs, createNpc, updateNpc, deleteNpc, type LocationNpc } from "@/lib/useNpcs";
import { generarNpc } from "@/lib/generar";
import { listMemories, updateMemory, deleteMemory, type NpcMemory } from "@/lib/useNpcMemory";

const inputCls = "w-full bg-[var(--color-night)] rounded-lg px-3 py-1.5 font-body text-[14px] outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)]";

export default function NpcsPanel() {
  const { atlas } = useAtlas();
  const poiNames = useMemo(() => {
    const set = new Set<string>();
    for (const cont of Object.values(atlas)) for (const arr of Object.values(cont.pois ?? {})) for (const p of arr) set.add(p.name);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [atlas]);

  const [poi, setPoi] = useState("");
  const { npcs, ready, reload } = useNpcs(poi || null);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);

  async function onCreate() {
    if (!poi || !name.trim()) return;
    await createNpc(poi, name.trim(), role.trim());
    setName(""); setRole("");
    await reload();
  }

  async function onGenerate() {
    if (!poi || busy) return;
    setBusy(true); setMsg(null);
    const r = await generarNpc(name, poi);
    if (r.ok) {
      const id = await createNpc(poi, r.data.name, r.data.role);
      if (id != null) await updateNpc(id, { prompt: r.data.prompt });
      setName(""); setRole("");
      await reload();
    } else {
      setMsg(r.error); setOffline(!!r.offline);
    }
    setBusy(false);
  }

  return (
    <div className="panel p-6 space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-ui text-[11px] font-bold uppercase tracking-wide" style={{ color: "var(--color-dim)" }}>POI</span>
        <select value={poi} onChange={(e) => setPoi(e.target.value)} className="bg-[var(--color-night)] rounded-lg px-3 py-1.5 font-ui text-[13px] border border-[var(--color-line)]" style={{ color: "var(--color-warm)" }}>
          <option value="">— Elige un lugar —</option>
          {poiNames.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      {!poi ? <p className="text-sm italic" style={{ color: "var(--color-dim)" }}>Elige un POI para gestionar sus PNJs.</p> : (
        <>
          <div className="panel-raised p-3 flex flex-wrap items-end gap-2">
            <div className="flex-1 min-w-[140px]"><p className="eyebrow !text-[9px] mb-1">Nuevo PNJ en {poi}</p><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" className={inputCls} style={{ color: "var(--color-warm)" }} /></div>
            <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Rol (tabernero…)" className={inputCls} style={{ color: "var(--color-warm)", flex: "1 1 140px" }} />
            <button onClick={onGenerate} disabled={busy || offline} title="Genera un PNJ completo con la IA (usa el nombre como pista, opcional)" className="btn-ghost !py-1.5 !px-3 text-[13px] disabled:opacity-40"><i className={`fas ${busy ? "fa-spinner fa-spin" : "fa-wand-magic-sparkles"} mr-1.5`} />IA</button>
            <button onClick={onCreate} disabled={!name.trim() || busy} className="btn-gold !py-1.5 !px-3 text-[13px] disabled:opacity-40"><i className="fas fa-plus mr-1.5" />Crear</button>
          </div>
          {msg && <p className="text-[12px] italic" style={{ color: "var(--color-ember)" }}>{msg}</p>}
          {!ready ? <p className="text-sm italic" style={{ color: "var(--color-dim)" }}>Cargando…</p>
            : npcs.length === 0 ? <p className="text-sm italic" style={{ color: "var(--color-dim)" }}>Sin PNJs en {poi}.</p>
            : npcs.map((n) => <NpcEditor key={n.id} npc={n} onChange={reload} />)}
        </>
      )}
    </div>
  );
}

function NpcEditor({ npc, onChange }: { npc: LocationNpc; onChange: () => void }) {
  const [name, setName] = useState(npc.name);
  const [role, setRole] = useState(npc.role);
  const [prompt, setPrompt] = useState(npc.prompt);
  const [pub, setPub] = useState(npc.public);
  const [portrait, setPortrait] = useState(npc.portrait ?? "");

  async function save() { await updateNpc(npc.id, { name: name.trim() || "PNJ", role: role.trim(), prompt, public: pub, portrait: portrait.trim() || null }); await onChange(); }

  return (
    <div className="panel-raised p-4 space-y-2">
      <div className="flex flex-wrap gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} style={{ color: "var(--color-warm)", flex: "1 1 140px" }} />
        <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Rol" className={inputCls} style={{ color: "var(--color-warm)", flex: "1 1 120px" }} />
        <button onClick={() => { if (confirm(`¿Borrar a "${npc.name}"?`)) deleteNpc(npc.id).then(onChange); }} className="btn-ghost !py-1.5 !px-3 text-[12px]" style={{ color: "var(--color-ember)" }}><i className="fas fa-trash" /></button>
      </div>
      <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} placeholder="Personalidad, secretos, tono (para la IA)" className={`${inputCls} resize-none`} style={{ color: "var(--color-warm)" }} />
      <input value={portrait} onChange={(e) => setPortrait(e.target.value)} placeholder="URL de retrato (opcional)" className={inputCls} style={{ color: "var(--color-warm)" }} />
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 font-ui text-[12px]" style={{ color: "var(--color-warm)" }}><input type="checkbox" checked={pub} onChange={(e) => setPub(e.target.checked)} /> Visible para los jugadores</label>
        <button onClick={save} className="btn-gold !py-1.5 !px-3 text-[12px]"><i className="fas fa-check mr-1.5" />Guardar</button>
      </div>
      <MemoriesBlock npcRef={`npc:${npc.id}`} />
    </div>
  );
}

// Memorias que este NPC guarda de cada jugador (Fase M). El DM las lee, edita
// o borra ("olvida").
function MemoriesBlock({ npcRef }: { npcRef: string }) {
  const [mems, setMems] = useState<(NpcMemory & { username: string })[]>([]);
  const [open, setOpen] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const reload = () => listMemories(npcRef).then((rows) => {
    setMems(rows);
    setDrafts(Object.fromEntries(rows.map((r) => [r.user_id, r.summary])));
  });
  useEffect(() => { if (open) void reload(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [open, npcRef]);

  return (
    <div className="pt-2 border-t border-[var(--color-line)]">
      <button onClick={() => setOpen((o) => !o)} className="font-ui text-[12px] font-semibold flex items-center gap-2" style={{ color: "var(--color-arcane-bright)" }}>
        <i className={`fas ${open ? "fa-chevron-down" : "fa-chevron-right"}`} /><i className="fas fa-brain" />Memorias{mems.length ? ` (${mems.length})` : ""}
      </button>
      {open && (
        <div className="mt-2 space-y-2">
          {mems.length === 0 && <p className="text-[12px] italic" style={{ color: "var(--color-dim)" }}>Este NPC aún no recuerda a nadie.</p>}
          {mems.map((m) => (
            <div key={m.user_id} className="panel-raised p-2 space-y-1.5">
              <p className="font-ui text-[11px] font-bold" style={{ color: "var(--color-bronze-bright)" }}>{m.username}</p>
              <textarea value={drafts[m.user_id] ?? ""} onChange={(e) => setDrafts((d) => ({ ...d, [m.user_id]: e.target.value }))} rows={2}
                className={`${inputCls} resize-none`} style={{ color: "var(--color-warm)" }} />
              <div className="flex gap-2">
                <button onClick={() => updateMemory(npcRef, m.user_id, drafts[m.user_id] ?? "").then(reload)} className="btn-ghost !py-1 !px-2.5 text-[11px]"><i className="fas fa-check mr-1" />Guardar</button>
                <button onClick={() => { if (confirm("¿Que este NPC olvide a este jugador?")) deleteMemory(npcRef, m.user_id).then(reload); }} className="btn-ghost !py-1 !px-2.5 text-[11px]" style={{ color: "var(--color-ember)" }}><i className="fas fa-eraser mr-1" />Olvidar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
