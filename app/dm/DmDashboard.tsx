"use client";

import { useState } from "react";
import { REGIONS } from "@/data/taldorei";
import { useRegions, setRegion } from "@/lib/useRegions";
import { useLiveSession, updateLiveSession } from "@/lib/useLiveSession";
import { useGroupAction, resetGroup } from "@/lib/useGroupAction";
import { narrar } from "@/lib/narrador";
import MapaPanel from "./MapaPanel";
import GrupoPanel from "./GrupoPanel";
import BaulPanel from "./BaulPanel";
import AiConfigPanel from "./AiConfigPanel";

type Tab = "narracion" | "grupo" | "baul" | "regiones" | "mapa" | "usuarios";

export default function DmDashboard() {
  const [tab, setTab] = useState<Tab>("narracion");

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <header className="text-center mb-8">
        <p className="eyebrow mb-3"><i className="fas fa-crown mr-1.5" style={{ color: "var(--color-bronze)" }} />Director de Juego</p>
        <h1 className="font-display text-3xl md:text-4xl font-extrabold gold-text">Panel de control</h1>
      </header>

      <div className="flex justify-center gap-2 mb-8 flex-wrap">
        {([["narracion", "Narración", "fa-feather-pointed"], ["grupo", "Grupo", "fa-users-line"], ["baul", "Baúl", "fa-box-archive"], ["regiones", "Regiones", "fa-earth-americas"], ["mapa", "Mapa", "fa-map-location-dot"], ["usuarios", "Usuarios", "fa-users"]] as const).map(([id, label, icon]) => (
          <button key={id} onClick={() => setTab(id)} className="px-4 py-2 rounded-lg font-ui text-[13px] font-bold transition-colors"
            style={{ color: tab === id ? "var(--color-ink)" : "var(--color-muted)", background: tab === id ? "var(--color-bronze)" : "transparent", border: `1px solid ${tab === id ? "var(--color-bronze)" : "var(--color-line)"}` }}>
            <i className={`fas ${icon} mr-2`} />{label}
          </button>
        ))}
      </div>

      {tab === "narracion" && <NarracionPanel />}
      {tab === "grupo" && <GrupoPanel />}
      {tab === "baul" && <BaulPanel />}
      {tab === "regiones" && <RegionesPanel />}
      {tab === "mapa" && <MapaPanel />}
      {tab === "usuarios" && <UsuariosPanel />}
    </main>
  );
}

/* ---------------------------- NARRACIÓN ---------------------------- */
function NarracionPanel() {
  const { session } = useLiveSession();
  const { action, players } = useGroupAction();
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [text, setText] = useState("");
  const [target, setTarget] = useState<string>("all"); // 'all' o id de jugador
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function generate() {
    if (!prompt.trim() || busy) return;
    setBusy(true); setErr(null);
    await resetGroup();
    await updateLiveSession({ epic_mode: true, narrator_typing: true, title: title || "Narración", current_narration: "", target });
    const r = await narrar({ messages: [{ role: "user", content: prompt }] });
    if (!r.ok) { setErr(r.error); await updateLiveSession({ narrator_typing: false }); }
    else { setText(r.reply); await updateLiveSession({ current_narration: r.reply, narrator_typing: false, title: title || "Narración", target }); }
    setBusy(false);
  }

  async function broadcastManual() {
    if (!text.trim()) return;
    await resetGroup();
    await updateLiveSession({ epic_mode: true, narrator_typing: false, title: title || "Narración", current_narration: text, target });
  }
  async function stop() {
    await updateLiveSession({ epic_mode: false, narrator_typing: false });
    await resetGroup();
  }

  return (
    <div>
    <AiConfigPanel />
    <div className="grid lg:grid-cols-2 gap-6">
      <section className="panel p-6">
        <h2 className="font-display text-lg font-bold mb-4" style={{ color: "var(--color-parch)" }}>Narrar</h2>

        <label className="eyebrow block mb-1.5">Destino</label>
        <select value={target} onChange={(e) => setTarget(e.target.value)}
          className="w-full mb-4 bg-[var(--color-night)] rounded-lg px-3 py-2 font-ui text-[14px] outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)]" style={{ color: "var(--color-warm)" }}>
          <option value="all">Todo el grupo (con consenso)</option>
          {players.map((p) => <option key={p.id} value={p.id}>Visión individual · {p.username}</option>)}
        </select>

        <label className="eyebrow block mb-1.5">Título de la escena</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej.: La taberna del Cuerno Astado"
          className="w-full mb-4 bg-[var(--color-night)] rounded-lg px-3 py-2 font-body text-[15px] outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)]" style={{ color: "var(--color-warm)" }} />

        <label className="eyebrow block mb-1.5">Pídele a la IA que narre</label>
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} placeholder="Describe la escena que quieres que narre…"
          className="w-full mb-3 bg-[var(--color-night)] rounded-lg px-3 py-2 font-body text-[15px] outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)] resize-none" style={{ color: "var(--color-warm)" }} />
        <button className="btn-gold w-full mb-5" onClick={generate} disabled={busy || !prompt.trim()}>
          <i className="fas fa-wand-magic-sparkles mr-2" />{busy ? "Generando…" : "Generar y emitir"}
        </button>

        <label className="eyebrow block mb-1.5">…o narra a mano</label>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} placeholder="Escribe la narración directamente…"
          className="w-full mb-3 bg-[var(--color-night)] rounded-lg px-3 py-2 font-body text-[15px] outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)] resize-none" style={{ color: "var(--color-warm)" }} />
        <div className="flex gap-2">
          <button className="btn-ghost flex-1" onClick={broadcastManual} disabled={!text.trim()}><i className="fas fa-tower-broadcast mr-2" />Emitir texto</button>
          <button className="btn-ghost" onClick={stop} style={{ color: "var(--color-ember)" }}><i className="fas fa-stop mr-2" />Terminar</button>
        </div>
        {err && <p className="text-[13px] mt-3 italic" style={{ color: "var(--color-ember)" }}>{err}</p>}
      </section>

      <section className="panel p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold" style={{ color: "var(--color-parch)" }}>Estado en vivo</h2>
          <span className="font-ui text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ color: session.epic_mode ? "var(--color-primitivo)" : "var(--color-dim)", border: `1px solid ${session.epic_mode ? "var(--color-primitivo)" : "var(--color-line)"}55` }}>
            <i className={`fas fa-circle text-[7px] mr-1.5 ${session.epic_mode ? "pulse" : ""}`} />{session.epic_mode ? "EN DIRECTO" : "en espera"}
          </span>
        </div>
        {session.title && <p className="font-display font-bold mb-2 gold-text">{session.title}</p>}
        <div className="panel-raised p-4 min-h-[160px]">
          <p className="font-body text-[15px] leading-relaxed whitespace-pre-wrap" style={{ color: "var(--color-warm)" }}>
            {session.current_narration || <span style={{ color: "var(--color-dim)" }} className="italic">Lo que emitas aparecerá aquí y en la pantalla de todos los jugadores.</span>}
          </p>
        </div>

        <div className="mt-4">
          <p className="eyebrow mb-2"><i className="fas fa-users mr-1.5" style={{ color: "var(--color-bronze)" }} />Acción acordada del grupo</p>
          <div className="panel-raised p-4">
            {action.submitted ? (
              <p className="font-body text-[15px]" style={{ color: "var(--color-arcane-bright)" }}>“{action.submitted}”</p>
            ) : (
              <p className="font-body text-[14px] italic" style={{ color: "var(--color-dim)" }}>El grupo aún no ha enviado su respuesta.</p>
            )}
          </div>
        </div>
      </section>
    </div>
    </div>
  );
}

/* ---------------------------- REGIONES ---------------------------- */
function RegionesPanel() {
  const { states, ready } = useRegions();
  return (
    <div className="panel p-6">
      <h2 className="font-display text-lg font-bold mb-1" style={{ color: "var(--color-parch)" }}>Exploración del mapa</h2>
      <p className="text-sm mb-5" style={{ color: "var(--color-muted)" }}>Marca qué regiones conocen y han explorado los jugadores. Se actualiza en vivo para todos.</p>
      <div className="space-y-2">
        {REGIONS.map((r) => {
          const st = states[r.slug];
          return (
            <div key={r.slug} className="panel-raised p-4 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full" style={{ background: r.accent, boxShadow: `0 0 10px ${r.accent}` }} />
                <div>
                  <p className="font-display font-bold text-[15px]" style={{ color: "var(--color-parch)" }}>{r.name}</p>
                  <p className="font-ui text-[11px]" style={{ color: "var(--color-dim)" }}>{r.capital}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Toggle label="Conocida" on={!!st?.known} disabled={!ready} onClick={() => setRegion(r.slug, { known: !st?.known })} />
                <Toggle label="Explorada" on={!!st?.explored} disabled={!ready} onClick={() => setRegion(r.slug, { explored: !st?.explored, known: st?.explored ? st?.known : true })} accent />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Toggle({ label, on, onClick, disabled, accent }: { label: string; on: boolean; onClick: () => void; disabled?: boolean; accent?: boolean }) {
  const color = accent ? "var(--color-primitivo)" : "var(--color-arcane)";
  return (
    <button onClick={onClick} disabled={disabled} className="font-ui text-[12px] font-bold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
      style={{ color: on ? "var(--color-ink)" : "var(--color-muted)", background: on ? color : "transparent", border: `1px solid ${on ? color : "var(--color-line)"}` }}>
      <i className={`fas ${on ? "fa-eye" : "fa-eye-slash"} mr-1.5`} />{label}
    </button>
  );
}

/* ---------------------------- USUARIOS ---------------------------- */
function UsuariosPanel() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"player" | "dm">("player");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function create() {
    if (!username.trim() || password.length < 6 || busy) return;
    setBusy(true); setMsg(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim().toLowerCase(), password, role }),
      });
      const data = await res.json();
      if (!res.ok) setMsg({ ok: false, text: data.error ?? "Error" });
      else { setMsg({ ok: true, text: `Usuario "${data.username}" creado como ${role === "dm" ? "DM" : "jugador"}.` }); setUsername(""); setPassword(""); }
    } catch { setMsg({ ok: false, text: "No se pudo crear el usuario." }); }
    finally { setBusy(false); }
  }

  return (
    <div className="panel p-6 max-w-xl mx-auto">
      <h2 className="font-display text-lg font-bold mb-1" style={{ color: "var(--color-parch)" }}>Crear usuario</h2>
      <p className="text-sm mb-5" style={{ color: "var(--color-muted)" }}>Da de alta a tus jugadores. Iniciarán sesión con este usuario y contraseña.</p>
      <label className="eyebrow block mb-1.5">Usuario</label>
      <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="nombre de usuario"
        className="w-full mb-3 bg-[var(--color-night)] rounded-lg px-3 py-2 font-body text-[15px] outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)]" style={{ color: "var(--color-warm)" }} />
      <label className="eyebrow block mb-1.5">Contraseña (mín. 6)</label>
      <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="contraseña inicial"
        className="w-full mb-3 bg-[var(--color-night)] rounded-lg px-3 py-2 font-body text-[15px] outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)]" style={{ color: "var(--color-warm)" }} />
      <label className="eyebrow block mb-1.5">Rol</label>
      <div className="flex gap-2 mb-5">
        {(["player", "dm"] as const).map((rl) => (
          <button key={rl} onClick={() => setRole(rl)} className="flex-1 font-ui text-[13px] font-bold px-3 py-2 rounded-lg transition-colors"
            style={{ color: role === rl ? "var(--color-ink)" : "var(--color-muted)", background: role === rl ? "var(--color-bronze)" : "transparent", border: `1px solid ${role === rl ? "var(--color-bronze)" : "var(--color-line)"}` }}>
            <i className={`fas ${rl === "dm" ? "fa-crown" : "fa-user"} mr-1.5`} />{rl === "dm" ? "Director de Juego" : "Jugador"}
          </button>
        ))}
      </div>
      <button className="btn-gold w-full" onClick={create} disabled={busy || !username.trim() || password.length < 6}>
        <i className="fas fa-user-plus mr-2" />{busy ? "Creando…" : "Crear usuario"}
      </button>
      {msg && <p className="text-[13px] mt-4 text-center italic" style={{ color: msg.ok ? "var(--color-primitivo)" : "var(--color-ember)" }}>{msg.text}</p>}
    </div>
  );
}
