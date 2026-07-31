"use client";

import { useMemo, useState } from "react";
import { useRole } from "@/components/SessionProvider";
import { useParty } from "@/lib/character";
import { useOficios, esCustom, claveMaterial } from "@/lib/useOficios";
import { OFICIOS_ORDEN, OFICIO_LABEL, type Material, type Oficio } from "@/lib/materiales";
import { POCIONES, RAREZA_LABEL, RAREZA_ORDEN, type Pocion, type Rareza } from "@/data/pociones";
import { produceNombre, produceRareza, type Receta } from "@/data/recetas";
import { idReceta } from "@/lib/recetario";

/**
 * La pantalla de máster de los oficios: **todo junto**, buscable, filtrable y
 * manipulable. Los 369 materiales, las 25 pociones y las recetas.
 *
 * Existe porque hasta ahora todo eso **solo vivía dentro de archivos de código**:
 * para saber qué hay había que abrir `data/alquimia.ts` en un editor. El
 * precedente es `/bestiario`, que ya es buscador + filtros sobre datos del
 * código y además deja al DM añadir los suyos.
 *
 * DM-only: no está en `RUTAS_JUGADOR`. El jugador ve su libro de recetas en el
 * taller, no el catálogo entero — la gracia del oficio es descubrirlo.
 */

const inputCls = "w-full bg-[var(--color-night)] rounded-lg px-3 py-2 font-ui text-[13px] outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)] transition-colors";

type Pestana = "materiales" | "pociones" | "recetas";

// Mismo helper local que GrupoPanel y EncuentrosPanel: service_role en el
// servidor, salta la RLS de escritura propia.
async function dmPatch(userId: string, patch: Record<string, unknown>) {
  await fetch("/api/dm/character", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, patch }),
  });
}

export default function OficiosPage() {
  const role = useRole();
  const cat = useOficios();

  const [pestana, setPestana] = useState<Pestana>("materiales");
  const [query, setQuery] = useState("");
  const [fOficio, setFOficio] = useState<"" | Oficio>("");
  const [fCategoria, setFCategoria] = useState("");
  const [fRareza, setFRareza] = useState<"" | Rareza>("");
  const [fHerramienta, setFHerramienta] = useState(false);
  const [fRiesgo, setFRiesgo] = useState(false);

  const [verMaterial, setVerMaterial] = useState<Material | null>(null);
  const [verPocion, setVerPocion] = useState<Pocion | null>(null);
  const [verReceta, setVerReceta] = useState<Receta | null>(null);
  const [editando, setEditando] = useState<Material | null | "nuevo">(null);

  // Las categorías dependen del oficio elegido: solo alquimia, cocina y forja
  // reparten por categoría, así que con «todos los oficios» el selector mezcla
  // «flora» con «temple» y no significa nada. Se sacan de los datos, no de una
  // lista escrita a mano que podría desincronizarse.
  const categorias = useMemo(() => {
    const de = fOficio ? cat.materiales.filter((m) => m.oficio === fOficio) : cat.materiales;
    return [...new Set(de.map((m) => m.category).filter((c): c is string => !!c))].sort((a, b) => a.localeCompare(b, "es"));
  }, [cat.materiales, fOficio]);

  const materialesFiltrados = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cat.materiales.filter((m) => {
      if (fOficio && m.oficio !== fOficio) return false;
      if (fCategoria && m.category !== fCategoria) return false;
      if (fHerramienta && !m.herramienta) return false;
      if (fRiesgo && !m.riesgo) return false;
      if (!q) return true;
      return m.name.toLowerCase().includes(q) || m.blurb.toLowerCase().includes(q);
    });
  }, [cat.materiales, query, fOficio, fCategoria, fHerramienta, fRiesgo]);

  const pocionesFiltradas = useMemo(() => {
    const q = query.trim().toLowerCase();
    return POCIONES.filter((p) => {
      if (fRareza && p.rareza !== fRareza) return false;
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || p.nameEn.toLowerCase().includes(q) || p.blurb.toLowerCase().includes(q);
    });
  }, [query, fRareza]);

  const recetasFiltradas = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cat.recetas.filter((r) => {
      if (fOficio && r.oficio !== fOficio) return false;
      if (fRareza && produceRareza(r) !== fRareza) return false;
      if (!q) return true;
      return produceNombre(r).toLowerCase().includes(q) || r.slug.includes(q);
    });
  }, [cat.recetas, query, fOficio, fRareza]);

  if (role !== "dm") {
    // La puerta de verdad es el proxy (`lib/acceso.ts`); esto es solo para que
    // no parpadee contenido si alguien llega aquí de otra forma.
    return (
      <main className="max-w-3xl mx-auto px-6 py-24 text-center">
        <p className="font-ui text-[13px]" style={{ color: "var(--color-dim)" }}>Esta pantalla es del máster.</p>
      </main>
    );
  }

  const cuenta =
    pestana === "materiales" ? materialesFiltrados.length
    : pestana === "pociones" ? pocionesFiltradas.length
    : recetasFiltradas.length;

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <header className="text-center mb-8 reveal">
        <p className="eyebrow mb-3">Catálogos de oficio</p>
        <h1 className="font-display text-4xl md:text-5xl font-extrabold gold-text">Oficios</h1>
        <p className="font-ui text-[12px] mt-3" style={{ color: "var(--color-dim)" }}>
          {cat.materiales.length} materiales · {POCIONES.length} pociones · {cat.recetas.length} recetas
        </p>
      </header>

      {cat.error && (
        <p className="panel p-3 mb-4 font-ui text-[12px]" style={{ color: "var(--color-ember)" }}>
          <i className="fas fa-triangle-exclamation mr-1.5" />No se pudo guardar: {cat.error}
        </p>
      )}

      {/* PESTAÑAS */}
      <div className="flex flex-wrap gap-2 justify-center mb-4">
        {(["materiales", "pociones", "recetas"] as Pestana[]).map((p) => (
          <button key={p} className="chip" data-on={pestana === p} onClick={() => { setPestana(p); setFCategoria(""); }}>
            {p === "materiales" ? "Materiales" : p === "pociones" ? "Pociones" : "Recetas"}
          </button>
        ))}
      </div>

      {/* BARRA DE BÚSQUEDA Y FILTROS */}
      <div className="panel p-4 mb-8 flex flex-col lg:flex-row gap-3 lg:items-center">
        <div className="relative flex-1">
          <i className="fas fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-[12px]" style={{ color: "var(--color-dim)" }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre o descripción…"
            className={inputCls}
            style={{ color: "var(--color-warm)", paddingLeft: "34px" }}
          />
        </div>

        {pestana !== "pociones" && (
          <select value={fOficio} onChange={(e) => { setFOficio(e.target.value as "" | Oficio); setFCategoria(""); }}
            className={`${inputCls} lg:w-44`} style={{ color: "var(--color-warm)" }}>
            <option value="">Todos los oficios</option>
            {OFICIOS_ORDEN.map((o) => <option key={o} value={o}>{OFICIO_LABEL[o]}</option>)}
          </select>
        )}

        {pestana === "materiales" && categorias.length > 0 && (
          <select value={fCategoria} onChange={(e) => setFCategoria(e.target.value)}
            className={`${inputCls} lg:w-44`} style={{ color: "var(--color-warm)" }}>
            <option value="">Todas las categorías</option>
            {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        )}

        {pestana !== "materiales" && (
          <select value={fRareza} onChange={(e) => setFRareza(e.target.value as "" | Rareza)}
            className={`${inputCls} lg:w-44`} style={{ color: "var(--color-warm)" }}>
            <option value="">Todas las rarezas</option>
            {RAREZA_ORDEN.map((r) => <option key={r} value={r}>{RAREZA_LABEL[r]}</option>)}
          </select>
        )}

        {pestana === "materiales" && (
          <div className="flex gap-2 shrink-0">
            <button className="chip" data-on={fHerramienta} onClick={() => setFHerramienta((v) => !v)}
              title="Cinceles, agujas, pinzas y paños: se exigen a mano pero no se gastan">
              <i className="fas fa-screwdriver-wrench mr-1.5" />Herramienta
            </button>
            <button className="chip" data-on={fRiesgo} onClick={() => setFRiesgo((v) => !v)}
              title="Los que traen contrapartida explícita (destilación)">
              <i className="fas fa-skull-crossbones mr-1.5" />Con riesgo
            </button>
            <button className="btn-gold !py-2 !px-4 text-[12px]" onClick={() => setEditando("nuevo")}>
              <i className="fas fa-plus mr-1.5" />Añadir
            </button>
          </div>
        )}
      </div>

      <p className="font-ui text-[11px] mb-3" style={{ color: "var(--color-dim)" }}>{cuenta} resultado{cuenta === 1 ? "" : "s"}</p>

      {!cat.ready ? (
        <p className="text-center italic" style={{ color: "var(--color-dim)" }}>Abriendo los catálogos…</p>
      ) : cuenta === 0 ? (
        <p className="text-center italic" style={{ color: "var(--color-dim)" }}>Nada coincide con la búsqueda.</p>
      ) : pestana === "materiales" ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {materialesFiltrados.map((m) => (
            <button key={claveMaterial(m)} onClick={() => setVerMaterial(m)}
              className="panel-raised p-3 text-left transition-colors hover:border-[var(--color-bronze)]">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-display font-bold text-[14px]" style={{ color: "var(--color-bronze-bright)" }}>{m.name}</h3>
                <span className="font-ui text-[10px] whitespace-nowrap" style={{ color: "var(--color-dim)" }}>#{m.n}</span>
              </div>
              <p className="font-ui text-[10px] mb-1.5" style={{ color: "var(--color-muted)" }}>
                {OFICIO_LABEL[m.oficio]}{m.category ? ` · ${m.category}` : ""}
              </p>
              <p className="text-[12px]" style={{ color: "var(--color-warm)", lineHeight: 1.45 }}>{m.blurb}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {m.herramienta && <span className="chip" data-on>herramienta</span>}
                {m.riesgo && <span className="chip" data-on>riesgo</span>}
                {m.mecanica && <span className="chip" data-on>regla</span>}
                {esCustom(m) && <span className="chip" data-on>propio</span>}
              </div>
            </button>
          ))}
        </div>
      ) : pestana === "pociones" ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {pocionesFiltradas.map((p) => (
            <button key={p.slug} onClick={() => setVerPocion(p)}
              className="panel-raised p-3 text-left transition-colors hover:border-[var(--color-bronze)]">
              <h3 className="font-display font-bold text-[14px] mb-0.5" style={{ color: "var(--color-bronze-bright)" }}>{p.name}</h3>
              <p className="font-ui text-[10px] italic mb-1.5" style={{ color: "var(--color-dim)" }}>{p.nameEn}</p>
              <p className="font-ui text-[10px] mb-1.5" style={{ color: "var(--color-muted)" }}>{RAREZA_LABEL[p.rareza]}</p>
              <p className="text-[12px]" style={{ color: "var(--color-warm)", lineHeight: 1.45 }}>{p.blurb}</p>
              {p.variantes && <span className="chip mt-2 inline-block" data-on>{p.variantes.length} variantes</span>}
            </button>
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {recetasFiltradas.map((r) => {
            const rareza = produceRareza(r);
            return (
              <button key={r.slug} onClick={() => setVerReceta(r)}
                className="panel-raised p-3 text-left transition-colors hover:border-[var(--color-bronze)]">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-display font-bold text-[14px]" style={{ color: "var(--color-bronze-bright)" }}>{produceNombre(r)}</h3>
                  <span className="font-ui text-[10px] font-bold whitespace-nowrap px-2 py-0.5 rounded-full"
                    style={{ color: "var(--color-arcane-bright)", border: "1px solid var(--color-arcane)55" }}>CD {r.cd}</span>
                </div>
                <p className="font-ui text-[10px] mb-1.5" style={{ color: "var(--color-muted)" }}>
                  {OFICIO_LABEL[r.oficio]}{rareza && rareza !== "variable" ? ` · ${RAREZA_LABEL[rareza]}` : ""}
                </p>
                <p className="text-[12px]" style={{ color: "var(--color-warm)" }}>
                  {r.materiales.length} ingrediente{r.materiales.length === 1 ? "" : "s"}
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {r.inicial && <span className="chip" data-on>inicial</span>}
                  {esCustom(r) && <span className="chip" data-on>propia</span>}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {verMaterial && (
        <DetalleMaterial
          material={verMaterial}
          onClose={() => setVerMaterial(null)}
          onEditar={() => { setEditando(verMaterial); setVerMaterial(null); }}
          onBorrar={async () => { await cat.borrarMaterial(verMaterial); setVerMaterial(null); }}
        />
      )}
      {verPocion && <DetallePocion pocion={verPocion} onClose={() => setVerPocion(null)} />}
      {verReceta && (
        <DetalleReceta
          receta={verReceta}
          materiales={cat.materiales}
          onClose={() => setVerReceta(null)}
          onBorrar={async () => { await cat.borrarReceta(verReceta.slug); setVerReceta(null); }}
        />
      )}
      {editando && (
        <FormularioMaterial
          editando={editando === "nuevo" ? null : editando}
          materiales={cat.materiales}
          onGuardar={async (m) => { await cat.guardarMaterial(m); setEditando(null); }}
          onClose={() => setEditando(null)}
        />
      )}
    </main>
  );
}

/* ------------------------------- ENTREGAR ------------------------------- */

/**
 * Dar algo a un jugador desde aquí. Usa la fontanería que ya existía
 * (`addItems` y `unlockLore` de `/api/dm/character`), que además apila por
 * nombre, así que dos entregas del mismo material no dejan dos filas.
 */
function Entregar({ que, hacer }: { que: string; hacer: (userId: string, cantidad: number) => Promise<void> }) {
  const { party } = useParty();
  const [userId, setUserId] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function dar() {
    if (!userId || busy) return;
    setBusy(true); setMsg(null);
    await hacer(userId, Math.max(1, Math.floor(cantidad)));
    setMsg(`Entregado a ${party.find((p) => p.user_id === userId)?.username ?? "el jugador"}.`);
    setBusy(false);
  }

  return (
    <div className="mt-4 pt-3 border-t border-[var(--color-line)] space-y-2">
      <p className="eyebrow !text-[9px]">Entregar {que}</p>
      <div className="flex flex-wrap gap-2 items-center">
        <select value={userId} onChange={(e) => setUserId(e.target.value)}
          className={`${inputCls} flex-1 min-w-[10rem]`} style={{ color: "var(--color-warm)" }}>
          <option value="">— elegir jugador —</option>
          {party.map((p) => <option key={p.user_id} value={p.user_id}>{p.username}</option>)}
        </select>
        {que === "material" && (
          <input type="number" min={1} value={cantidad}
            onChange={(e) => setCantidad(Number(e.target.value) || 1)}
            className={`${inputCls} w-20`} style={{ color: "var(--color-warm)" }} />
        )}
        <button className="btn-gold !py-2 !px-3 text-[12px] disabled:opacity-40" onClick={dar} disabled={!userId || busy}>
          <i className="fas fa-hand-holding mr-1.5" />Dar
        </button>
      </div>
      {msg && <p className="font-ui text-[12px] italic" style={{ color: "var(--color-primitivo)" }}>{msg}</p>}
    </div>
  );
}

/* -------------------------------- MODALES -------------------------------- */

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <div className="panel-raised max-w-lg w-full max-h-[85vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function DetalleMaterial({
  material, onClose, onEditar, onBorrar,
}: { material: Material; onClose: () => void; onEditar: () => void; onBorrar: () => Promise<void> }) {
  return (
    <Modal onClose={onClose}>
      <div className="flex items-start justify-between gap-3 mb-1">
        <h2 className="font-display text-2xl font-bold" style={{ color: "var(--color-bronze-bright)" }}>{material.name}</h2>
        <button className="btn-ghost !py-1 !px-2" onClick={onClose}><i className="fas fa-xmark" /></button>
      </div>
      <p className="font-ui text-[11px] mb-4" style={{ color: "var(--color-muted)" }}>
        {OFICIO_LABEL[material.oficio]} · nº {material.n}{material.category ? ` · ${material.category}` : ""}
      </p>
      <p className="text-[14px] mb-3" style={{ color: "var(--color-warm)", lineHeight: 1.6 }}>{material.blurb}</p>

      {material.herramienta && (
        <p className="font-ui text-[12px] mb-2" style={{ color: "var(--color-violet)" }}>
          <i className="fas fa-screwdriver-wrench mr-1.5" />Herramienta: una receta la exige a mano, pero <strong>no la gasta</strong>.
        </p>
      )}
      {material.riesgo && (
        <p className="font-ui text-[12px] mb-2" style={{ color: "var(--color-ember)" }}>
          <i className="fas fa-skull-crossbones mr-1.5" />Trae contrapartida.
        </p>
      )}
      {material.mecanica && (
        <div className="panel p-3 mb-2">
          <p className="eyebrow !text-[9px] mb-1">Regla</p>
          <p className="text-[13px]" style={{ color: "var(--color-warm)" }}>{material.mecanica}</p>
          {/* Dicho aquí y no escondido: el campo existe pero nadie lo lee. */}
          <p className="font-ui text-[11px] mt-2 italic" style={{ color: "var(--color-dim)" }}>
            Todavía sin conectar: forjar con este material no cambia nada en la ficha.
          </p>
        </div>
      )}

      <Entregar que="material" hacer={(userId, cantidad) => dmPatch(userId, { addItems: [{ name: material.name, qty: cantidad }] })} />

      {esCustom(material) && (
        <div className="flex gap-2 mt-4 pt-3 border-t border-[var(--color-line)]">
          <button className="btn-ghost !py-1.5 !px-3 text-[12px]" onClick={onEditar}>
            <i className="fas fa-pen mr-1.5" />Editar
          </button>
          <button className="btn-ghost !py-1.5 !px-3 text-[12px]" style={{ color: "var(--color-ember)" }}
            onClick={() => { if (confirm("¿Borrar este material propio? No se puede deshacer.")) void onBorrar(); }}>
            <i className="fas fa-trash mr-1.5" />Borrar
          </button>
        </div>
      )}
    </Modal>
  );
}

function DetallePocion({ pocion, onClose }: { pocion: Pocion; onClose: () => void }) {
  return (
    <Modal onClose={onClose}>
      <div className="flex items-start justify-between gap-3 mb-1">
        <h2 className="font-display text-2xl font-bold" style={{ color: "var(--color-bronze-bright)" }}>{pocion.name}</h2>
        <button className="btn-ghost !py-1 !px-2" onClick={onClose}><i className="fas fa-xmark" /></button>
      </div>
      <p className="font-ui text-[11px] italic mb-1" style={{ color: "var(--color-dim)" }}>{pocion.nameEn}</p>
      <p className="font-ui text-[11px] mb-4" style={{ color: "var(--color-muted)" }}>
        {RAREZA_LABEL[pocion.rareza]} · {pocion.source}
      </p>
      <p className="text-[14px] mb-3" style={{ color: "var(--color-warm)", lineHeight: 1.6 }}>{pocion.blurb}</p>
      <div className="panel p-3 mb-3">
        <p className="eyebrow !text-[9px] mb-1">Efecto</p>
        <p className="text-[13px]" style={{ color: "var(--color-warm)", whiteSpace: "pre-wrap" }}>{pocion.effect}</p>
      </div>

      {pocion.variantes && (
        <div className="space-y-2 mb-2">
          <p className="eyebrow !text-[9px]">Variantes</p>
          {pocion.variantes.map((v) => (
            <div key={v.name} className="panel p-2.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-ui text-[13px] font-bold" style={{ color: "var(--color-bronze-bright)" }}>{v.name}</span>
                <span className="font-ui text-[10px]" style={{ color: "var(--color-muted)" }}>{RAREZA_LABEL[v.rareza]}</span>
              </div>
              <p className="text-[12px] mt-1" style={{ color: "var(--color-warm)" }}>{v.detalle}</p>
            </div>
          ))}
        </div>
      )}

      {/* Se entrega la poción hecha, sin pasar por el caldero: es el atajo del
          DM para el botín, no una forma de saltarse el oficio del jugador. */}
      <Entregar que="poción" hacer={(userId) => dmPatch(userId, { addItems: [{ name: pocion.name, qty: 1 }] })} />
    </Modal>
  );
}

function DetalleReceta({
  receta, materiales, onClose, onBorrar,
}: { receta: Receta; materiales: Material[]; onClose: () => void; onBorrar: () => Promise<void> }) {
  const rareza = produceRareza(receta);
  const nombreDe = (n: number) =>
    materiales.find((m) => m.oficio === receta.oficio && m.n === n)?.name ?? `nº ${n} (no existe)`;

  return (
    <Modal onClose={onClose}>
      <div className="flex items-start justify-between gap-3 mb-1">
        <h2 className="font-display text-2xl font-bold" style={{ color: "var(--color-bronze-bright)" }}>{produceNombre(receta)}</h2>
        <button className="btn-ghost !py-1 !px-2" onClick={onClose}><i className="fas fa-xmark" /></button>
      </div>
      <p className="font-ui text-[11px] mb-4" style={{ color: "var(--color-muted)" }}>
        {OFICIO_LABEL[receta.oficio]} · CD {receta.cd}
        {rareza && rareza !== "variable" ? ` · ${RAREZA_LABEL[rareza]}` : ""}
      </p>

      <p className="eyebrow !text-[9px] mb-2">Lleva</p>
      <ul className="space-y-1 mb-3">
        {receta.materiales.map((m) => (
          <li key={m.n} className="flex justify-between gap-3 font-ui text-[13px]">
            <span style={{ color: "var(--color-warm)" }}>{nombreDe(m.n)}</span>
            <span style={{ color: "var(--color-muted)" }}>×{m.qty}</span>
          </li>
        ))}
        {(receta.herramientas ?? []).map((n) => (
          <li key={`h-${n}`} className="flex justify-between gap-3 font-ui text-[13px]">
            <span style={{ color: "var(--color-warm)" }}>
              {nombreDe(n)} <span className="text-[10px] italic" style={{ color: "var(--color-dim)" }}>(no se gasta)</span>
            </span>
            <span style={{ color: "var(--color-muted)" }}>a mano</span>
          </li>
        ))}
      </ul>

      <p className="font-ui text-[12px] mb-2" style={{ color: "var(--color-dim)" }}>
        Al fallar la tirada, los materiales se pierden igual.
      </p>

      <Entregar que="receta" hacer={(userId) => dmPatch(userId, { unlockLore: [idReceta(receta.slug)] })} />

      {esCustom(receta) && (
        <div className="flex gap-2 mt-4 pt-3 border-t border-[var(--color-line)]">
          <button className="btn-ghost !py-1.5 !px-3 text-[12px]" style={{ color: "var(--color-ember)" }}
            onClick={() => { if (confirm("¿Borrar esta receta propia? No se puede deshacer.")) void onBorrar(); }}>
            <i className="fas fa-trash mr-1.5" />Borrar
          </button>
        </div>
      )}
    </Modal>
  );
}

/* ------------------------------ FORMULARIO ------------------------------ */

function FormularioMaterial({
  editando, materiales, onGuardar, onClose,
}: {
  editando: Material | null;
  materiales: Material[];
  onGuardar: (m: Material) => Promise<void>;
  onClose: () => void;
}) {
  const [oficio, setOficio] = useState<Oficio>(editando?.oficio ?? "alquimia");
  const [n, setN] = useState<number>(editando?.n ?? 0);
  const [name, setName] = useState(editando?.name ?? "");
  const [blurb, setBlurb] = useState(editando?.blurb ?? "");
  const [category, setCategory] = useState(editando?.category ?? "");
  const [herramienta, setHerramienta] = useState(!!editando?.herramienta);
  const [riesgo, setRiesgo] = useState(!!editando?.riesgo);
  const [mecanica, setMecanica] = useState(editando?.mecanica ?? "");
  const [busy, setBusy] = useState(false);

  // El siguiente número libre de ese oficio, para no tener que ir a mirarlo.
  const siguienteN = useMemo(() => {
    const usados = materiales.filter((m) => m.oficio === oficio).map((m) => m.n);
    return usados.length ? Math.max(...usados) + 1 : 1;
  }, [materiales, oficio]);

  const numero = n || siguienteN;

  // Un nombre repetido entre catálogos rompería el índice: `materialPorNombre`
  // dejaría de ser determinista y un objeto de la bolsa no sabría de qué oficio
  // es. Es el mismo invariante que vigila el gate, comprobado aquí en vivo.
  const choca = materiales.some(
    (m) => m.name.trim().toLowerCase() === name.trim().toLowerCase() && !(m.oficio === oficio && m.n === numero)
  );
  const ocupado = !editando && materiales.some((m) => m.oficio === oficio && m.n === numero);
  const valido = name.trim().length > 0 && blurb.trim().length > 0 && !choca;

  async function guardar() {
    if (!valido || busy) return;
    setBusy(true);
    await onGuardar({
      oficio, n: numero, name: name.trim(), blurb: blurb.trim(),
      ...(category.trim() ? { category: category.trim() } : {}),
      ...(herramienta ? { herramienta: true as const } : {}),
      ...(riesgo ? { riesgo: true as const } : {}),
      ...(mecanica.trim() ? { mecanica: mecanica.trim() } : {}),
    });
    setBusy(false);
  }

  return (
    <Modal onClose={onClose}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <h2 className="font-display text-2xl font-bold" style={{ color: "var(--color-bronze-bright)" }}>
          {editando ? "Editar material" : "Material propio"}
        </h2>
        <button className="btn-ghost !py-1 !px-2" onClick={onClose}><i className="fas fa-xmark" /></button>
      </div>

      <div className="space-y-3">
        <div className="flex gap-2">
          <select value={oficio} onChange={(e) => setOficio(e.target.value as Oficio)}
            className={inputCls} style={{ color: "var(--color-warm)" }} disabled={!!editando}>
            {OFICIOS_ORDEN.map((o) => <option key={o} value={o}>{OFICIO_LABEL[o]}</option>)}
          </select>
          <input type="number" min={1} value={numero} onChange={(e) => setN(Number(e.target.value) || 0)}
            className={`${inputCls} w-28`} style={{ color: "var(--color-warm)" }} disabled={!!editando} />
        </div>
        {ocupado && (
          <p className="font-ui text-[11px]" style={{ color: "var(--color-ember)" }}>
            El nº {numero} de {OFICIO_LABEL[oficio]} ya existe: al guardar lo <strong>sustituirás</strong>.
          </p>
        )}

        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre"
          className={inputCls} style={{ color: "var(--color-warm)" }} />
        {choca && (
          <p className="font-ui text-[11px]" style={{ color: "var(--color-ember)" }}>
            Ya hay un material con ese nombre. Tienen que ser únicos entre los seis catálogos:
            si se repite, la app no sabría de cuál tirar.
          </p>
        )}

        <textarea value={blurb} onChange={(e) => setBlurb(e.target.value)} placeholder="Qué es y cómo se reconoce" rows={3}
          className={inputCls} style={{ color: "var(--color-warm)" }} />
        <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Categoría (opcional)"
          className={inputCls} style={{ color: "var(--color-warm)" }} />

        <div className="flex flex-wrap gap-2">
          <button className="chip" data-on={herramienta} onClick={() => setHerramienta((v) => !v)}>
            <i className="fas fa-screwdriver-wrench mr-1.5" />Herramienta (no se gasta)
          </button>
          <button className="chip" data-on={riesgo} onClick={() => setRiesgo((v) => !v)}>
            <i className="fas fa-skull-crossbones mr-1.5" />Con riesgo
          </button>
        </div>

        <textarea value={mecanica} onChange={(e) => setMecanica(e.target.value)} rows={2}
          placeholder="Regla, si la trae (hoy no se aplica sola)"
          className={inputCls} style={{ color: "var(--color-warm)" }} />

        <button className="btn-gold w-full !py-2.5 text-[13px] disabled:opacity-40" onClick={guardar} disabled={!valido || busy}>
          <i className="fas fa-floppy-disk mr-1.5" />{busy ? "Guardando…" : "Guardar"}
        </button>
        <p className="font-ui text-[11px]" style={{ color: "var(--color-dim)" }}>
          Se guarda en la configuración de la campaña, no en el código: no hace falta desplegar.
          Otro DM lo verá al recargar.
        </p>
      </div>
    </Modal>
  );
}
