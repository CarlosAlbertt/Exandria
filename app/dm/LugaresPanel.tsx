"use client";
import { useState } from "react";
import { useLugares, saveLugares } from "@/lib/useLugares";
import { poiDeNodo, type NodosOverride } from "@/data/lugares";

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
