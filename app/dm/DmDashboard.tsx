"use client";

import { useState } from "react";
import { useAtlas, regionsOf } from "@/lib/useAtlas";
import { CONTINENTS } from "@/data/world";
import { useRegions, setRegion } from "@/lib/useRegions";
import { useWorldPois } from "@/lib/useWorldPois";
import { continenteDescubierto, conocerRegionDescubreContinente } from "@/lib/niebla";
import { useLiveSession, updateLiveSession } from "@/lib/useLiveSession";
import { useGroupAction, resetGroup } from "@/lib/useGroupAction";
import { narrar } from "@/lib/narrador";
import MapaPanel from "./MapaPanel";
import GrupoPanel from "./GrupoPanel";
import ArtePanel from "./ArtePanel";
import TiendasPanel from "./TiendasPanel";
import NpcsPanel from "./NpcsPanel";
import BaulPanel from "./BaulPanel";
import AiConfigPanel from "./AiConfigPanel";
import DadosPanel from "./DadosPanel";
import CronicaPanel from "./CronicaPanel";
import EncuentrosPanel from "./EncuentrosPanel";
import RelojPanel from "./RelojPanel";
import LugaresPanel from "./LugaresPanel";
import ResumenPanel from "./ResumenPanel";

type Tab =
  | "resumen" | "narracion" | "grupo" | "baul" | "regiones" | "mapa" | "usuarios"
  | "dados" | "cronica" | "mesa" | "tiempo" | "arte" | "tiendas" | "pnjs" | "lugares";

/**
 * El panel del DM, por FAMILIAS y no por lista.
 *
 * ⚠️ **Antes eran catorce chips en una fila que envolvía**, todos del mismo
 * tamaño y del mismo peso, dentro de un `max-w-5xl`. Dos problemas de verdad, y
 * ninguno era estético:
 *
 * 1. **Catorce cosas iguales no se leen: se rastrean.** «Mesa», «Tiempo» y
 *    «Lugares» no dicen nada por sí solos, y para encontrar el interruptor que
 *    deja viajar a un jugador había que saberse de memoria que vive dentro de
 *    Mapa. Agrupadas en cinco familias, la pregunta «¿dónde estaba eso?» tiene
 *    respuesta antes de abrir nada.
 * 2. **El ancho.** `max-w-5xl` son 1024 px para pantallas que tienen el doble, y
 *    dentro hay tablas de POIs, fichas de personaje enteras y listas de tiendas.
 *    Todo iba comprimido en una columna estrecha con hueco negro a los lados.
 *
 * Y se añade la **portada** (`ResumenPanel`), que es lo que de verdad faltaba: un
 * sitio que conteste «¿qué está pasando ahora?» sin abrir cinco pestañas.
 *
 * El orden de las familias es el de una sesión de verdad: primero lo que usas
 * jugando, luego el grupo, luego el mundo, y los ajustes al final.
 */
const FAMILIAS: { titulo: string; icono: string; tabs: [Tab, string, string, string][] }[] = [
  {
    titulo: "En la mesa", icono: "fa-dice",
    tabs: [
      ["resumen", "Resumen", "fa-gauge-high", "Qué está pasando ahora mismo"],
      ["narracion", "Narración", "fa-feather-pointed", "Emitir escena a los jugadores"],
      ["dados", "Dados", "fa-dice-d20", "Pedir tiradas y ver las que salen"],
      ["mesa", "Combate", "fa-chess", "Encuentros y el tablero"],
      ["tiempo", "Reloj", "fa-clock", "Hora, fecha y descansos"],
    ],
  },
  {
    titulo: "El grupo", icono: "fa-users-line",
    tabs: [
      ["grupo", "Jugadores", "fa-users-line", "Fichas, XP, nivel y dónde está cada uno"],
      ["baul", "Baúl", "fa-box-archive", "Dar objetos y documentos"],
      ["cronica", "Crónica", "fa-book-open", "Misiones, pistas y diario"],
    ],
  },
  {
    titulo: "El mundo", icono: "fa-earth-americas",
    tabs: [
      ["mapa", "Mapa y pueblos", "fa-map-location-dot", "Plantar al grupo y abrir pueblos al viaje"],
      ["regiones", "Exploración", "fa-compass", "Qué continentes y regiones conocen"],
      ["lugares", "Sitios", "fa-signs-post", "Sub-lugares, temas e imágenes"],
      ["tiendas", "Tiendas", "fa-store", "Inventario de los comercios"],
      ["pnjs", "PNJs", "fa-comments", "Gente con la que se puede hablar"],
    ],
  },
  {
    titulo: "Ajustes", icono: "fa-sliders",
    tabs: [
      ["arte", "Arte", "fa-image", "Imágenes de pueblos y del mundo"],
      ["usuarios", "Usuarios", "fa-user-plus", "Dar de alta jugadores"],
    ],
  },
];

const TODAS = FAMILIAS.flatMap((f) => f.tabs);

export default function DmDashboard() {
  const [tab, setTab] = useState<Tab>("resumen");
  const actual = TODAS.find(([id]) => id === tab);

  return (
    <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-8">
      <header className="flex items-end justify-between gap-4 flex-wrap mb-6">
        <div>
          <p className="eyebrow mb-2"><i className="fas fa-crown mr-1.5" style={{ color: "var(--color-bronze)" }} />Director de Juego</p>
          <h1 className="font-display text-3xl md:text-4xl font-extrabold gold-text">{actual?.[1] ?? "Panel de control"}</h1>
          {actual && <p className="font-ui text-[13px] mt-1.5" style={{ color: "var(--color-muted)" }}>{actual[3]}</p>}
        </div>
      </header>

      {/* En escritorio la navegación va a un lado y NO encima: así el panel
          abierto empieza arriba del todo y se ve entero sin hacer scroll por
          debajo de catorce botones. En móvil se apila, que es lo único que
          cabe. */}
      <div className="lg:flex lg:items-start lg:gap-6">
        <nav className="lg:w-56 lg:shrink-0 mb-6 lg:mb-0 lg:sticky lg:top-20">
          {FAMILIAS.map((fam) => (
            <div key={fam.titulo} className="mb-4">
              <p className="eyebrow !text-[9px] mb-2 px-1">
                <i className={`fas ${fam.icono} mr-1.5`} style={{ color: "var(--color-bronze-deep)" }} />{fam.titulo}
              </p>
              <div className="flex lg:flex-col gap-1.5 flex-wrap">
                {fam.tabs.map(([id, label, icon]) => {
                  const on = tab === id;
                  return (
                    <button key={id} onClick={() => setTab(id)}
                      aria-current={on ? "page" : undefined}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg font-ui text-[13px] font-bold transition-colors text-left lg:w-full"
                      style={{
                        color: on ? "var(--color-ink)" : "var(--color-muted)",
                        background: on ? "var(--color-bronze)" : "transparent",
                        border: `1px solid ${on ? "var(--color-bronze)" : "var(--color-line)"}`,
                      }}>
                      <i className={`fas ${icon} w-4 text-center`} />{label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="min-w-0 flex-1">
          {tab === "resumen" && <ResumenPanel onIr={(t) => setTab(t as Tab)} />}
          {tab === "narracion" && <NarracionPanel />}
          {tab === "grupo" && <GrupoPanel />}
          {tab === "baul" && <BaulPanel />}
          {tab === "dados" && <DadosPanel />}
          {tab === "cronica" && <CronicaPanel />}
          {tab === "mesa" && <EncuentrosPanel />}
          {tab === "tiempo" && <RelojPanel />}
          {tab === "regiones" && <RegionesPanel />}
          {tab === "mapa" && <MapaPanel />}
          {tab === "arte" && <ArtePanel />}
          {tab === "tiendas" && <TiendasPanel />}
          {tab === "pnjs" && <NpcsPanel />}
          {tab === "lugares" && <LugaresPanel />}
          {tab === "usuarios" && <UsuariosPanel />}
        </div>
      </div>
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
const LAND_CONTINENTS = CONTINENTS.filter((c) => c !== "Mares");

function RegionesPanel() {
  const { atlas, ready: atlasReady } = useAtlas();
  const { states, ready: regionsReady } = useRegions();
  // Los pines de continente viven en `world_pois` (app_config), y su `revealed`
  // es lo que levanta la niebla de /mapa y lo que deja ver la tierra en /reino.
  // El interruptor vive aquí y no en Panel DM › Mapa porque este panel ya es el
  // sitio donde se decide qué ve el grupo del mundo: continente y luego región,
  // en la misma pantalla.
  const { pois, ready: poisReady, save: savePois } = useWorldPois();
  const ready = atlasReady && regionsReady && poisReady;

  const pinDe = (cont: string) => pois.find((p) => p.type === "continente" && p.continent === cont);
  const revelarContinente = (cont: string, on: boolean) => {
    const pin = pinDe(cont);
    if (!pin) return;
    savePois(pois.map((p) => (p.id === pin.id ? { ...p, revealed: on } : p)));
  };
  // Una región conocida bajo un continente con niebla es inalcanzable: el
  // jugador no puede entrar en el continente para verla. Así que conocerla lo
  // descubre. Es el mismo escalón que ya hace «Explorada» al poner «Conocida».
  const conocerRegion = (cont: string, slug: string, known: boolean, explored?: boolean) => {
    void setRegion(slug, explored === undefined ? { known } : { explored, known });
    if (conocerRegionDescubreContinente(known)) revelarContinente(cont, true);
  };

  return (
    <div className="panel p-6">
      <h2 className="font-display text-lg font-bold mb-1" style={{ color: "var(--color-parch)" }}>Exploración del mapa</h2>
      <p className="text-sm mb-5" style={{ color: "var(--color-muted)" }}>
        Marca qué continentes han descubierto los jugadores y qué regiones conocen y han explorado.
        <strong style={{ color: "var(--color-warm)" }}> Un continente sin descubrir sale bajo niebla</strong>, y sus regiones no se
        alcanzan aunque estén marcadas — por eso conocer una región descubre su continente.
      </p>
      <div className="space-y-6">
        {LAND_CONTINENTS.map((cont) => {
          const regions = regionsOf(atlas, cont);
          if (regions.length === 0) return null;
          const pin = pinDe(cont);
          const descubierto = continenteDescubierto(pin);
          // Sin pin no hay nada que revelar, y además la niebla de /mapa falla
          // ABIERTA en ese caso: se dice aquí en vez de dejar un hueco mudo.
          const ocultasBajoNiebla = descubierto ? 0 : regions.filter((r) => states[r.slug]?.known).length;
          return (
            <div key={cont}>
              <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
                <p className="eyebrow !mb-0">{cont}</p>
                {pin ? (
                  <div className="flex items-center gap-2">
                    {ocultasBajoNiebla > 0 && (
                      <span className="font-ui text-[11px]" style={{ color: "var(--color-ember)" }}>
                        <i className="fas fa-triangle-exclamation mr-1" />
                        {ocultasBajoNiebla} {ocultasBajoNiebla === 1 ? "región conocida" : "regiones conocidas"} bajo niebla
                      </span>
                    )}
                    <Toggle label="Descubierto" on={descubierto} disabled={!ready}
                      onClick={() => revelarContinente(cont, !descubierto)} accent />
                  </div>
                ) : (
                  <span className="font-ui text-[11px]" style={{ color: "var(--color-ember)" }}>
                    <i className="fas fa-triangle-exclamation mr-1" />sin pin en el mapa: se ve siempre
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {regions.map((r) => {
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
                        <Toggle label="Conocida" on={!!st?.known} disabled={!ready} onClick={() => conocerRegion(cont, r.slug, !st?.known)} />
                        <Toggle label="Explorada" on={!!st?.explored} disabled={!ready} onClick={() => conocerRegion(cont, r.slug, st?.explored ? !!st?.known : true, !st?.explored)} accent />
                      </div>
                    </div>
                  );
                })}
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
