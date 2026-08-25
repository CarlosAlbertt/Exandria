"use client";
// EL CATÁLOGO DE MISIONES PREPARADAS, en el Panel DM.
//
// ⚠️ **Por qué existe.** Las quince misiones de `data/misiones/` vivían solo en
// el repo: para sacar una en mesa había que esperar a que un jugador hablara con
// el PNJ correcto, acertara la tirada y aceptara. Si el grupo no pasaba por la
// taberna, el contenido no existía. Esto es la puerta de atrás del DM.
//
// ⚠️ **NO sustituye al diálogo, lo complementa.** Lo normal sigue siendo que la
// misión salga hablando con alguien —ahí está la gracia—; esto es para cuando la
// mesa se desvía, para retomar una que se perdió, o para preparar la sesión
// antes de empezar.
//
// La escritura va por `saveQuest` (cliente) y no por `/api/mision-dialogo`: esa
// ruta está pensada para el JUGADOR —resuelve su ficha, comprueba idempotencia
// contra lo suyo y usa `service_role` porque el jugador no puede escribir en
// `quests`—. El DM sí puede: la RLS de la v12 le deja gestionar la tabla. Meter
// al DM por la ruta del jugador obligaría a inventarle una ficha.
import { useMemo, useState } from "react";
import { MISIONES, TAMANO_LABEL, TAMANOS, type Mision, type Tamano } from "@/data/misiones";
import { useChronicle, saveQuest } from "@/lib/useChronicle";
import { useParty } from "@/lib/character";
import { avisar } from "@/components/Avisos";

const inputCls = "bg-[var(--color-night)] rounded-lg px-2 py-1 font-ui text-[11px] outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)] transition-colors";

/** El color de cada tamaño. Se lee de un vistazo si algo es para uno o para seis. */
const TAMANO_COLOR: Record<Tamano, string> = {
  solitaria: "var(--color-dim)",
  pareja: "var(--color-arcane)",
  trio: "var(--color-bronze)",
  grupo: "var(--color-bronze-bright)",
  legendaria: "var(--color-ember)",
};

export default function CatalogoPanel() {
  const { quests } = useChronicle();
  const { party } = useParty();
  const [filtro, setFiltro] = useState<Tamano | "">("");
  const [abierta, setAbierta] = useState<string | null>(null);
  const [asignar, setAsignar] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Ya abiertas: se cruzan por TÍTULO, que es lo que hace única a una misión del
  // catálogo. Sin esto el DM abre la misma dos veces y el grupo la ve duplicada
  // en la Crónica — el mismo fallo que `/api/mision-dialogo` ya evita del lado
  // del jugador. Aquí NO se bloquea, se avisa: el DM puede querer dos copias de
  // un encargo repetible, y no soy quién para impedírselo.
  const yaAbiertas = useMemo(() => new Set(quests.map((q) => q.title)), [quests]);

  const lista = filtro ? MISIONES.filter((m) => m.tamano === filtro) : MISIONES;

  async function abrir(m: Mision) {
    if (busy) return;
    setBusy(m.slug); setErr(null);
    const ficha = asignar[m.slug] || "";
    const { error } = await saveQuest({
      title: m.titulo,
      body: m.body,
      reward: m.recompensa,
      status: "activa",
      // Una franja del bosque no es un pin del mapa: dejar `poi_name` apuntando
      // a `franja:linde` pintaría un marcador que el mapa no sabe colocar.
      poi_name: m.lugar.startsWith("franja:") ? null : m.lugar,
      unlock_lore: [],
      assigned_character_id: ficha || null,
      npc_id: null,
    });
    setBusy(null);
    if (error) { setErr(error); return; }
    avisar({ tipo: "mision-aceptada", titulo: m.titulo, recompensa: m.recompensa });
  }

  return (
    <section className="panel p-5">
      <p className="eyebrow mb-3">
        <i className="fas fa-scroll mr-1.5" style={{ color: "var(--color-bronze)" }} />
        Catálogo de misiones preparadas
      </p>
      <p className="font-ui text-[12px] mb-3" style={{ color: "var(--color-dim)" }}>
        Las {MISIONES.length} que están escritas en el repo. Lo normal es que salgan hablando con
        un PNJ; esto es para sacarlas a mano cuando la mesa se desvía.
      </p>

      {err && <p className="font-ui text-[12px] mb-2" style={{ color: "var(--color-ember)" }}>{err}</p>}

      <div className="flex flex-wrap gap-1.5 mb-4">
        <button onClick={() => setFiltro("")}
          className={`btn-ghost !py-1 !px-2.5 text-[11px] ${filtro === "" ? "!border-[var(--color-bronze)]" : ""}`}>
          Todas ({MISIONES.length})
        </button>
        {TAMANOS.map((t) => {
          const n = MISIONES.filter((m) => m.tamano === t).length;
          return (
            <button key={t} onClick={() => setFiltro(t)}
              className={`btn-ghost !py-1 !px-2.5 text-[11px] ${filtro === t ? "!border-[var(--color-bronze)]" : ""}`}
              style={{ color: TAMANO_COLOR[t] }}>
              {TAMANO_LABEL[t]} ({n})
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        {lista.map((m) => {
          const ya = yaAbiertas.has(m.titulo);
          const desplegada = abierta === m.slug;
          return (
            <div key={m.slug} className="panel-raised px-3 py-2.5">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <button onClick={() => setAbierta(desplegada ? null : m.slug)}
                  className="min-w-0 text-left flex items-center gap-2 flex-wrap">
                  <i className={`fas fa-chevron-${desplegada ? "down" : "right"} text-[10px]`} style={{ color: "var(--color-dim)" }} />
                  <strong className="font-ui text-[13px]" style={{ color: "var(--color-parch)" }}>{m.titulo}</strong>
                  <span className="font-ui text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ color: TAMANO_COLOR[m.tamano], border: `1px solid ${TAMANO_COLOR[m.tamano]}55` }}>
                    {TAMANO_LABEL[m.tamano]}
                  </span>
                  <span className="font-ui text-[11px]" style={{ color: "var(--color-dim)" }}>
                    nivel {m.nivel[0] === m.nivel[1] ? m.nivel[0] : `${m.nivel[0]}-${m.nivel[1]}`} · {m.jugadores} jug.
                  </span>
                  {m.letal && (
                    <span className="font-ui text-[10px] font-bold" style={{ color: "var(--color-ember)" }}>
                      <i className="fas fa-skull mr-1" />se puede morir
                    </span>
                  )}
                  {ya && (
                    <span className="font-ui text-[11px]" style={{ color: "var(--color-primitivo)" }}>
                      <i className="fas fa-check mr-1" />ya está abierta
                    </span>
                  )}
                </button>

                <div className="flex items-center gap-1.5 shrink-0">
                  <select value={asignar[m.slug] ?? ""} onChange={(e) => setAsignar((a) => ({ ...a, [m.slug]: e.target.value }))}
                    className={inputCls} style={{ color: "var(--color-warm)" }}
                    title="A quién se le asigna. Sin elegir, es del grupo entero.">
                    <option value="">Del grupo</option>
                    {party.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <button onClick={() => abrir(m)} disabled={busy !== null}
                    className="btn-gold !py-1 !px-2.5 text-[11px] disabled:opacity-40"
                    title={ya ? "Ya hay una misión con este título en la Crónica: abrirla otra vez la duplica" : "Crea la misión en la Crónica"}>
                    <i className={`fas ${busy === m.slug ? "fa-spinner fa-spin" : "fa-plus"} mr-1`} />
                    {ya ? "Abrir otra vez" : "Abrir"}
                  </button>
                </div>
              </div>

              {desplegada && <Ficha m={m} />}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** La misión desplegada: lo que el DM necesita para dirigirla sin abrir el repo. */
function Ficha({ m }: { m: Mision }) {
  return (
    <div className="mt-3 pt-3 space-y-3" style={{ borderTop: "1px solid var(--color-line)" }}>
      <p className="font-ui text-[11px]" style={{ color: "var(--color-dim)" }}>
        <i className="fas fa-location-dot mr-1" />{m.lugar}
        {m.encargante ? <> · <i className="fas fa-user mr-1" />{m.encargante}</> : null}
      </p>

      <div>
        <p className="eyebrow !text-[9px] mb-1">El gancho</p>
        <p className="font-body text-[14px]" style={{ color: "var(--color-warm)" }}>{m.gancho}</p>
      </div>

      <div>
        <p className="eyebrow !text-[9px] mb-1">Escenas ({m.escenas.length})</p>
        <div className="space-y-2">
          {m.escenas.map((e) => (
            <details key={e.titulo}>
              <summary className="font-ui text-[12px] cursor-pointer" style={{ color: "var(--color-bronze)" }}>{e.titulo}</summary>
              <p className="font-body text-[13px] mt-1 whitespace-pre-line" style={{ color: "var(--color-muted)" }}>{e.texto}</p>
            </details>
          ))}
        </div>
      </div>

      <div>
        <p className="eyebrow !text-[9px] mb-1">Combates</p>
        {m.encuentros.map((e) => (
          <div key={e.nombre} className="mb-2">
            <p className="font-ui text-[12px]" style={{ color: "var(--color-parch)" }}>
              {e.nombre} — <strong style={{ color: m.letal ? "var(--color-ember)" : "var(--color-bronze-bright)" }}>{e.xp} XP</strong>
            </p>
            <p className="font-ui text-[11px]" style={{ color: "var(--color-dim)" }}>
              {e.monstruos.map((x) => `${x.n}× ${x.name}`).join(" · ")}
            </p>
            <p className="font-body text-[13px]" style={{ color: "var(--color-muted)" }}>{e.nota}</p>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <p className="eyebrow !text-[9px] mb-1">Recompensa</p>
          <p className="font-body text-[13px]" style={{ color: "var(--color-warm)" }}>{m.recompensa}</p>
        </div>
        <div>
          <p className="eyebrow !text-[9px] mb-1">Si sale mal</p>
          <p className="font-body text-[13px]" style={{ color: "var(--color-muted)" }}>{m.siFalla}</p>
        </div>
      </div>
    </div>
  );
}
