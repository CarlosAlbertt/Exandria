"use client";

import { useMemo, useState } from "react";
import { useCadaveres } from "@/lib/useCadaveres";
import { esDespiezable, despieceDe, piezasDe } from "@/data/despiece";
import { ALL_MONSTERS } from "@/data/bestiary";
import { DADO_PIEZAS, cdDespiece } from "@/lib/extraccion";
import { seedAtlas } from "@/data/atlas";
import { FRANJAS } from "@/data/bosque";
import { idPoi, idFranja } from "@/data/lugares";

// Los cadáveres que el grupo tiene a mano para despiezar.
//
// ⚠️ **Esto existe porque la mesa no siempre pasa por la app.** Muchos combates
// se juegan en la mesa y `/combate` no se entera, así que el DM necesita poder
// poner un cadáver a mano. Llenarlo solo al derrotar un monstruo es un extra;
// esto es el requisito.
//
// Solo se ofrecen los monstruos que `data/despiece.ts` empareja: uno sin tabla
// no suelta nada, y ofrecerlo sería prometer algo que no va a pasar.
export default function CadaveresPanel() {
  const { cadaveres, ready, error, añadir, quitar } = useCadaveres();
  const [slug, setSlug] = useState("");
  const [lugar, setLugar] = useState("");
  const [piezas, setPiezas] = useState(2);

  // Solo los despiezables, por nombre. Con 175 monstruos y 23 emparejados, una
  // lista de todos sería casi toda inútil.
  const opciones = useMemo(
    () => ALL_MONSTERS.filter((m) => esDespiezable(m.slug)).sort((a, b) => a.name.localeCompare(b.name)),
    [],
  );

  // Los sitios donde puede haber un cadáver: los pueblos del atlas y las tres
  // franjas del bosque. Se componen con los mismos helpers que el resto de la
  // app (`idPoi`, `idFranja`) para que el id case con el nodo de `/lugar`; a
  // mano se escribiría mal una vez de cada diez y el cadáver no saldría nunca.
  const lugares = useMemo(() => {
    const pois = Object.values(seedAtlas()).flatMap((c) =>
      Object.values(c.pois).flat().map((p) => ({ id: idPoi(p.name), label: p.name })));
    const franjas = FRANJAS.map((f) => ({ id: idFranja(f.key), label: `Bosque · ${f.label}` }));
    return [...pois, ...franjas];
  }, []);

  const porNombre = useMemo(() => new Map(ALL_MONSTERS.map((m) => [m.slug, m])), []);
  const etiquetaLugar = useMemo(() => new Map(lugares.map((l) => [l.id, l.label])), [lugares]);

  const elegido = slug ? porNombre.get(slug) : null;

  const inputCls = "w-full bg-[var(--color-night)] rounded-lg px-2 py-1.5 font-ui text-[13px] border border-[var(--color-line)]";

  return (
    <section className="space-y-5">
      <div>
        <p className="eyebrow mb-1"><i className="fas fa-hand-scissors mr-2" style={{ color: "var(--color-bronze)" }} />Cadáveres a mano</p>
        <p className="font-ui text-[12px]" style={{ color: "var(--color-muted)" }}>
          Lo que el grupo puede despiezar ahora mismo. Se ve desde el sitio donde lo pongas.
          Cuando se le acaban las piezas desaparece solo.
        </p>
      </div>

      {error && (
        <p className="font-ui text-[12px]" style={{ color: "var(--color-ember)" }}>
          No se pudo guardar: {error}
        </p>
      )}

      <div className="panel-raised p-4 space-y-2">
        <p className="eyebrow !text-[9px]">Poner un cadáver</p>
        <select value={slug} onChange={(e) => setSlug(e.target.value)} className={inputCls} style={{ color: "var(--color-warm)" }}>
          <option value="">— Qué han matado —</option>
          {opciones.map((m) => <option key={m.slug} value={m.slug}>{m.name} (CR {m.cr})</option>)}
        </select>

        <select value={lugar} onChange={(e) => setLugar(e.target.value)} className={inputCls} style={{ color: "var(--color-warm)" }}>
          <option value="">— Dónde está —</option>
          {lugares.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
        </select>

        <label className="flex items-center gap-2 font-ui text-[12px]" style={{ color: "var(--color-warm)" }}>
          Piezas
          <input type="number" min={1} max={DADO_PIEZAS} value={piezas}
            onChange={(e) => setPiezas(Math.max(1, Math.min(DADO_PIEZAS, Number(e.target.value) || 1)))}
            className="w-16 bg-[var(--color-night)] rounded-lg px-2 py-1 border border-[var(--color-line)]" />
          <span style={{ color: "var(--color-dim)" }}>1d4 — tíralo tú o pon lo que quieras</span>
        </label>

        {/* Lo que va a soltar, ANTES de ponerlo. Sin esto el DM tiene que
            acordarse de memoria de qué da cada bicho. */}
        {elegido && (
          <p className="font-ui text-[11px]" style={{ color: "var(--color-dim)" }}>
            Suelta: {despieceDe(elegido).join(", ")} · tabla de {piezasDe(elegido.cr, elegido.size)} ·
            {" "}CD {cdDespiece(elegido.cr)}
          </p>
        )}

        <button
          onClick={() => { if (slug && lugar) { void añadir({ slug, lugar, restantes: piezas }); setSlug(""); } }}
          disabled={!slug || !lugar}
          className="btn-gold !py-1.5 !px-3 text-[13px] disabled:opacity-40">
          <i className="fas fa-plus mr-1.5" />Poner
        </button>
      </div>

      <div className="space-y-2">
        {!ready && <p className="font-ui text-[12px]" style={{ color: "var(--color-dim)" }}>Cargando…</p>}
        {ready && cadaveres.length === 0 && (
          // ⚠️ El vacío se EXPLICA. Un vacío mudo no se distingue de algo roto,
          // que es la lección que ya costó una vez con «Ponerse en camino».
          <p className="font-ui text-[13px] italic" style={{ color: "var(--color-dim)" }}>
            No hay ningún cadáver a mano. Los jugadores con Extracción de Componentes no verán nada que despiezar.
          </p>
        )}
        {cadaveres.map((c) => {
          const m = porNombre.get(c.slug);
          return (
            <div key={c.id} className="panel-raised p-2.5 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="font-ui text-[13px] font-semibold truncate" style={{ color: "var(--color-warm)" }}>
                  {m?.name ?? c.slug}
                </p>
                <p className="font-ui text-[11px]" style={{ color: "var(--color-dim)" }}>
                  {etiquetaLugar.get(c.lugar) ?? c.lugar} · le quedan {c.restantes}
                </p>
              </div>
              <button onClick={() => void quitar(c.id)} title="Retirar el cadáver"
                className="btn-ghost !p-0 w-7 h-7 text-[11px]" style={{ color: "var(--color-ember)" }}>
                <i className="fas fa-trash" />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
