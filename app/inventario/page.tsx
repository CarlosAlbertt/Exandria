"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "@/components/SessionProvider";
import { loadCharacter, saveCharacter } from "@/lib/character";
import { getSpecies } from "@/data/species";
import { getClass } from "@/data/classes";
import { abilityMod, fmtMod } from "@/data/rules";
import { CATALOG, STARTER_KIT, ItemCat } from "@/data/equipment";

const BUILD_KEY = "taldorei.build.v1";
const INV_KEY = "taldorei.inventory.v1";
const BASE_SLOTS = 20;
const MIN_SLOTS = 10;

type Build = {
  name?: string; species?: string | null; lineage?: string | null;
  cls?: string | null; subclass?: string | null;
  base?: Record<string, number>; bonus?: Record<string, number>;
};

export default function InventarioPage() {
  const [build, setBuild] = useState<Build | null>(null);
  const [items, setItems] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [cat, setCat] = useState<ItemCat>("Aventura");
  const [custom, setCustom] = useState("");

  const session = useSession();
  const userId = session?.id;
  const cloud = useRef(false);

  // Carga: nube si hay sesión, si no localStorage.
  useEffect(() => {
    let done = false;
    (async () => {
      if (userId) {
        const row = await loadCharacter(userId);
        if (!done && row) {
          cloud.current = true;
          setBuild({ name: row.name, species: row.species, lineage: row.lineage, cls: row.cls, subclass: row.subclass, base: row.base, bonus: row.bonus });
          if (Array.isArray(row.inventory)) setItems(row.inventory);
        }
      }
      if (!done && !cloud.current) {
        try {
          const b = localStorage.getItem(BUILD_KEY);
          if (b) setBuild(JSON.parse(b));
          const i = localStorage.getItem(INV_KEY);
          if (i) setItems(JSON.parse(i));
        } catch {}
      }
      if (!done) setLoaded(true);
    })();
    return () => { done = true; };
  }, [userId]);

  // Guardado del inventario: nube si hay sesión, si no localStorage.
  useEffect(() => {
    if (!loaded) return;
    if (userId && cloud.current) {
      const t = setTimeout(() => saveCharacter(userId, { inventory: items }), 700);
      return () => clearTimeout(t);
    }
    localStorage.setItem(INV_KEY, JSON.stringify(items));
  }, [items, loaded, userId]);

  const strScore = (build?.base?.fue ?? 10) + (build?.bonus?.fue ?? 0);
  const strMod = abilityMod(strScore);
  const capacity = Math.max(MIN_SLOTS, BASE_SLOTS + 2 * strMod);
  const used = items.length;
  const full = used >= capacity;

  const species = build?.species ? getSpecies(build.species) : undefined;
  const cls = build?.cls ? getClass(build.cls) : undefined;

  const add = (name: string) => {
    const n = name.trim();
    if (!n || full) return;
    setItems((prev) => [...prev, n]);
  };
  const removeAt = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));
  const clear = () => setItems([]);
  const addStarter = () => {
    setItems((prev) => {
      const room = capacity - prev.length;
      return [...prev, ...STARTER_KIT.slice(0, Math.max(0, room))];
    });
  };

  const slots = useMemo(() => Array.from({ length: capacity }), [capacity]);

  if (loaded && !build?.species && !build?.cls) {
    return (
      <main className="max-w-3xl mx-auto px-6 py-24 text-center">
        <i className="fas fa-box-open text-4xl mb-4" style={{ color: "var(--color-dim)" }} />
        <h1 className="font-display text-2xl font-bold mb-3" style={{ color: "var(--color-parch)" }}>Aún no hay personaje</h1>
        <p className="prose-lore !text-[15px] mb-6" style={{ color: "var(--color-muted)" }}>
          Crea un personaje para abrir su inventario. Los huecos dependen de su Fuerza.
        </p>
        <Link href="/crear" className="btn-gold"><i className="fas fa-hat-wizard mr-2" />Crear personaje</Link>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <header className="text-center mb-8">
        <p className="eyebrow mb-3">Equipo y carga</p>
        <h1 className="font-display text-3xl md:text-4xl font-extrabold gold-text">Inventario</h1>
        {build && (
          <p className="font-ui text-[13px] font-semibold mt-3" style={{ color: "var(--color-muted)" }}>
            {build.name || "Personaje"} · {species?.name ?? "—"} · {cls?.name ?? "—"}
          </p>
        )}
      </header>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        {/* SLOTS */}
        <section>
          <div className="panel p-4 mb-5 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="eyebrow !text-[9px]">Huecos</p>
                <p className="font-display text-2xl font-extrabold" style={{ color: full ? "var(--color-ember)" : "var(--color-arcane-bright)" }}>{used}/{capacity}</p>
              </div>
              <div className="h-10 w-px" style={{ background: "var(--color-line)" }} />
              <p className="font-ui text-[12px]" style={{ color: "var(--color-muted)" }}>
                Base {BASE_SLOTS} <span style={{ color: "var(--color-bronze)" }}>+ {2 * strMod}</span> por Fuerza<br />
                <span style={{ color: "var(--color-dim)" }}>FUE {strScore} ({fmtMod(strMod)})</span>
              </p>
            </div>
            <div className="flex gap-2">
              <button className="btn-ghost !py-2 !px-3 text-[12px]" onClick={addStarter} disabled={full}><i className="fas fa-box mr-1.5" />Kit básico</button>
              <button className="btn-ghost !py-2 !px-3 text-[12px]" onClick={clear} disabled={!used}><i className="fas fa-trash mr-1.5" />Vaciar</button>
            </div>
          </div>

          {/* barra de carga */}
          <div className="h-2 rounded-full overflow-hidden mb-5" style={{ background: "var(--color-raised)" }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, (used / capacity) * 100)}%`, background: full ? "var(--color-ember)" : "linear-gradient(90deg, var(--color-arcane-deep), var(--color-arcane))" }} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {slots.map((_, i) => {
              const item = items[i];
              return item ? (
                <button key={i} onClick={() => removeAt(i)}
                  className="panel-raised p-3 text-left group relative h-[58px] flex items-center"
                  style={{ borderColor: "color-mix(in srgb, var(--color-bronze) 30%, var(--color-line))" }}
                  title="Quitar">
                  <span className="font-ui text-[13px] font-semibold leading-tight pr-4" style={{ color: "var(--color-warm)" }}>{item}</span>
                  <i className="fas fa-xmark absolute top-2 right-2 text-[11px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--color-ember)" }} />
                </button>
              ) : (
                <div key={i} className="rounded-xl h-[58px] flex items-center justify-center"
                  style={{ border: "1px dashed var(--color-line)", color: "var(--color-dim)" }}>
                  <i className="fas fa-plus text-[11px] opacity-40" />
                </div>
              );
            })}
          </div>
        </section>

        {/* CATÁLOGO */}
        <aside className="panel p-5 h-fit lg:sticky lg:top-24">
          <p className="eyebrow mb-3">Añadir objeto</p>
          <div className="flex gap-2 mb-3">
            <input value={custom} onChange={(e) => setCustom(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { add(custom); setCustom(""); } }}
              placeholder="Objeto personalizado…"
              className="flex-1 bg-[var(--color-night)] rounded-lg px-3 py-2 font-ui text-[13px] outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)] transition-colors"
              style={{ color: "var(--color-warm)" }} />
            <button className="stat-btn !w-9 !h-9" onClick={() => { add(custom); setCustom(""); }} disabled={full || !custom.trim()}>+</button>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-4">
            {(Object.keys(CATALOG) as ItemCat[]).map((c) => (
              <button key={c} className="chip" data-on={cat === c} onClick={() => setCat(c)}>{c}</button>
            ))}
          </div>

          <div className="flex flex-col gap-1.5 max-h-[340px] overflow-y-auto pr-1">
            {CATALOG[cat].map((it) => (
              <button key={it} onClick={() => add(it)} disabled={full}
                className="flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors hover:bg-[var(--color-raised)] disabled:opacity-40"
                style={{ border: "1px solid var(--color-line)" }}>
                <span className="font-ui text-[13px]" style={{ color: "var(--color-warm)" }}>{it}</span>
                <i className="fas fa-plus text-[11px]" style={{ color: "var(--color-bronze)" }} />
              </button>
            ))}
          </div>

          {full && <p className="text-[12px] mt-3 text-center italic" style={{ color: "var(--color-ember)" }}>Inventario lleno. Aumenta tu Fuerza para más huecos.</p>}
        </aside>
      </div>
    </main>
  );
}
