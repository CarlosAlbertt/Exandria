"use client";
import { useState } from "react";
import { useLugares, saveLugares } from "@/lib/useLugares";
import { poiDeNodo, ENTRADAS_AL_BOSQUE, TEMAS, esTema, type NodosOverride, type TemaLugar } from "@/data/lugares";
import { claveDePlantilla, plantillaDe } from "@/data/npcTemplates";
import { seedNpcs } from "@/lib/useNpcs";

const inputCls = "w-full bg-[var(--color-night)] rounded-lg px-3 py-1.5 font-body text-[14px] outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)]";

/**
 * Los sitios por los que anda el grupo: nombre, descripción e IMAGEN.
 *
 * La imagen es la razón de ser de este panel — las hace el usuario y las pega
 * aquí, **sin que nadie despliegue**. Es el mismo trato que `ArtePanel` y
 * `TOWN_MAPS` ya tenían con los mapas de pueblo.
 *
 * ⚠️ Solo se listan los sitios y las franjas, **no los pueblos**: la imagen de
 * un pueblo la sigue poniendo `Arte`, y ofrecer los dos sitios para lo mismo
 * dejaría al DM sin saber cuál gana.
 */
export default function LugaresPanel() {
  const { nodos, override, ready, setOverride } = useLugares();
  const [borrador, setBorrador] = useState<NodosOverride | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const ov = borrador ?? override;
  const editables = nodos.filter((n) => !n.id.startsWith("poi:"));

  function set(id: string, campo: "nombre" | "blurb" | "imagen", valor: string) {
    setBorrador({ ...ov, [id]: { ...ov[id], [campo]: valor } });
    setMsg(null);
  }

  /**
   * La PIEL del sitio. Va aparte de `set` porque no es texto libre: un valor
   * que no sea uno de los temas dibujados dejaría la hoja sin ninguno de sus
   * tokens. `construirNodos` lo filtra igualmente, pero aquí no hay por qué
   * dejar escribirlo.
   *
   * En blanco = **la que traiga de fábrica**, que para un sub-lugar es la de su
   * pueblo. Es lo mismo que hacen los otros campos de este panel.
   */
  function setTema(id: string, valor: string) {
    const tema: TemaLugar | "" = esTema(valor) ? valor : "";
    setBorrador({ ...ov, [id]: { ...ov[id], tema: tema || undefined } });
    setMsg(null);
  }

  async function guardar() {
    if (!borrador) return;
    // Se limpian los campos vacíos: un `imagen: ""` guardado pisaría la semilla
    // con nada y el nodo se quedaría sin la suya para siempre.
    const limpio: NodosOverride = {};
    for (const [id, campos] of Object.entries(borrador)) {
      const c = Object.fromEntries(Object.entries(campos).filter(([, v]) => typeof v === "string" && v.trim() !== ""));
      if (Object.keys(c).length > 0) limpio[id] = c;
    }
    await saveLugares(limpio);
    setOverride(limpio);
    setBorrador(null);
    setMsg("Guardado. Los jugadores lo verán al entrar en el lugar.");
  }

  if (!ready) return <div className="panel p-6"><p className="text-sm italic" style={{ color: "var(--color-dim)" }}>Cargando…</p></div>;

  return (
    <div className="panel p-6 space-y-4">
      <div>
        <p className="eyebrow mb-1"><i className="fas fa-signs-post mr-1.5" style={{ color: "var(--color-bronze)" }} />Sitios y zonas</p>
        <p className="font-ui text-[12px]" style={{ color: "var(--color-dim)" }}>
          Los sitios a los que se entra desde un pueblo y las zonas del bosque. Pega la URL de
          una imagen y pasa a ser la tarjeta que ve el jugador; sin imagen sale el icono.
          Lo que dejes en blanco se queda como viene de fábrica.
        </p>
      </div>

      {msg && <p className="font-ui text-[12px]" style={{ color: "var(--color-bronze-bright)" }}>{msg}</p>}

      <div className="space-y-3">
        {editables.map((n) => {
          const poi = poiDeNodo(n.id);
          return (
            <div key={n.id} className="panel-raised p-4 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <i className={`fas ${n.icono}`} style={{ color: "var(--color-bronze)" }} />
                <strong className="font-ui text-[13px]" style={{ color: "var(--color-parch)" }}>{n.nombre}</strong>
                <span className="font-ui text-[11px]" style={{ color: "var(--color-dim)" }}>
                  {poi ? poi : "Expansión Verdante"} · {n.id}
                </span>
              </div>
              <input value={ov[n.id]?.nombre ?? ""} onChange={(e) => set(n.id, "nombre", e.target.value)}
                placeholder={`Nombre (por defecto: ${n.nombre})`} className={inputCls} style={{ color: "var(--color-warm)" }} />
              <textarea value={ov[n.id]?.blurb ?? ""} onChange={(e) => set(n.id, "blurb", e.target.value)} rows={2}
                placeholder="Descripción propia (opcional)" className={`${inputCls} resize-none`} style={{ color: "var(--color-warm)" }} />
              <div className="flex gap-2 items-start">
                <input value={ov[n.id]?.imagen ?? ""} onChange={(e) => set(n.id, "imagen", e.target.value)}
                  placeholder="URL de la imagen de la tarjeta" className={inputCls} style={{ color: "var(--color-warm)" }} />
                {(ov[n.id]?.imagen || n.imagen) && (
                  <img src={ov[n.id]?.imagen || n.imagen} alt="" className="w-20 h-14 object-cover rounded-lg border border-[var(--color-line)] shrink-0" />
                )}
              </div>
              {/* La piel del sitio. `n.tema` ya viene resuelto —del pueblo o de
                  la semilla—, así que el desplegable en blanco enseña cuál se
                  está usando en vez de dejar al DM adivinando. */}
              <label className="flex items-center gap-2 flex-wrap">
                <span className="font-ui text-[11px]" style={{ color: "var(--color-dim)" }}>Tema</span>
                <select value={ov[n.id]?.tema ?? ""} onChange={(e) => setTema(n.id, e.target.value)}
                  className={`${inputCls} !w-auto`} style={{ color: "var(--color-warm)" }}>
                  <option value="">De fábrica ({TEMAS[n.tema].label})</option>
                  {Object.entries(TEMAS).map(([clave, t]) => (
                    <option key={clave} value={clave}>{t.label}</option>
                  ))}
                </select>
              </label>
              <Sembrar nodoId={n.id} poiSugerido={poi} />
            </div>
          );
        })}
        {editables.length === 0 && (
          <p className="text-sm italic" style={{ color: "var(--color-dim)" }}>
            Ningún sitio todavía. Byroden trae los suyos de fábrica; el resto se añaden en código.
          </p>
        )}
      </div>

      <button onClick={guardar} disabled={!borrador} className="btn-gold !py-2 !px-4 text-[12px] disabled:opacity-40">
        <i className="fas fa-floppy-disk mr-1.5" />Guardar cambios
      </button>
    </div>
  );
}

/**
 * «Sembrar gente»: mete la plantilla escrita de este sitio en `location_npcs`.
 *
 * ⚠️ **No pisa lo que ya haya.** El DM tiene PNJ creados a mano y un botón que
 * los duplicara le metería desconocidos en su pueblo sin forma cómoda de
 * deshacerlo. Si hay alguien, `seedNpcs` se niega y lo dice.
 *
 * Un sitio sin plantilla **deshabilita el botón explicándose**, igual que el de
 * «Semilla» de las tiendas con un tipo inventado: si no, no pasaría nada al
 * pulsarlo y el DM no sabría si el fallo era suyo.
 */
function Sembrar({ nodoId, poiSugerido }: { nodoId: string; poiSugerido: string | null }) {
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<string | null>(null);

  const clave = claveDePlantilla(nodoId);
  const plantilla = clave ? plantillaDe(clave) : [];
  // Una franja no es de ningún pueblo, así que se cuelga del primero que la
  // toca solo para que el DM la encuentre en el panel de PNJs, que lista por
  // POI. En pantalla los coloca el `venue`, no esto.
  const poi = poiSugerido ?? ENTRADAS_AL_BOSQUE[0]?.poi ?? null;

  async function sembrar() {
    if (!poi || busy) return;
    setBusy(true); setRes(null);
    const r = await seedNpcs(poi, nodoId, plantilla);
    setRes(r.ok ? `Sembrados ${r.creados}. Ya se puede hablar con ellos.` : r.error);
    setBusy(false);
  }

  return (
    <div className="flex items-center gap-2 flex-wrap pt-1">
      <button onClick={sembrar} disabled={busy || plantilla.length === 0 || !poi}
        title={plantilla.length === 0 ? "Este sitio no trae gente escrita: créala en Panel DM › PNJs" : `Mete ${plantilla.length} PNJ escritos, con su personalidad para la IA`}
        className="btn-ghost !py-1.5 !px-3 text-[12px] disabled:opacity-40">
        <i className={`fas ${busy ? "fa-spinner fa-spin" : "fa-user-plus"} mr-1.5`} />
        {plantilla.length === 0 ? "Sin gente escrita para este sitio" : `Sembrar gente (${plantilla.length})`}
      </button>
      {plantilla.length > 0 && (
        <span className="font-ui text-[11px]" style={{ color: "var(--color-dim)" }}>
          {plantilla.map((t) => `${t.name} (${t.role})`).join(" · ")}
        </span>
      )}
      {res && <span className="font-ui text-[11px] w-full" style={{ color: "var(--color-bronze-bright)" }}>{res}</span>}
    </div>
  );
}
