"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { loadCharacter, saveCharacter, type Item, type CharacterData } from "@/lib/character";
import type { Asi } from "@/lib/character";
import { getSpecies } from "@/data/species";
import { getClass } from "@/data/classes";
import { getBackground } from "@/data/backgrounds";
import { ABILITIES, AbilityKey, abilityMod, fmtMod } from "@/data/rules";
import { maxHp, proficiencyBonus, reachedAsiLevels } from "@/data/leveling";
import { CATALOG, ItemCat } from "@/data/equipment";
import LevelPanel, { asiTotals } from "@/components/LevelPanel";
import Paperdoll from "@/components/Paperdoll";
import PortraitFrame from "@/components/PortraitFrame";

const BUILD_KEY = "taldorei.build.v1";
const SHEET_KEY = "taldorei.sheet.v1";

const EMPTY_SCORES: Record<AbilityKey, number> = { fue: 8, des: 8, con: 8, int: 8, sab: 8, car: 8 };
const NO_BONUS: Record<AbilityKey, number> = { fue: 0, des: 0, con: 0, int: 0, sab: 0, car: 0 };

type Build = {
  name: string;
  species: string | null;
  lineage: string | null;
  cls: string | null;
  subclass: string | null;
  background: string | null;
  base: Record<AbilityKey, number>;
  bonus: Record<AbilityKey, number>;
};

const EMPTY_BUILD: Build = {
  name: "", species: null, lineage: null, cls: null, subclass: null, background: null,
  base: { ...EMPTY_SCORES }, bonus: { ...NO_BONUS },
};

/* --- helpers de inventario --- */
function removeOne(items: Item[], id: string): Item[] {
  const out: Item[] = [];
  for (const it of items) {
    if (it.id === id) {
      if (it.qty > 1) out.push({ ...it, qty: it.qty - 1 });
    } else out.push(it);
  }
  return out;
}
function addBack(items: Item[], item: Item): Item[] {
  const idx = items.findIndex((i) => i.name === item.name);
  if (idx >= 0) {
    const next = [...items];
    next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
    return next;
  }
  return [...items, { id: crypto.randomUUID(), name: item.name, qty: 1, notes: item.notes }];
}

type CharacterSheetProps = {
  targetUserId: string | null; // whose sheet (null = no session → localStorage)
  readOnly: boolean;
  saveMode: "self" | "dm";     // self = saveCharacter; dm = POST /api/dm/character
};

export default function CharacterSheet({ targetUserId, readOnly, saveMode }: CharacterSheetProps) {
  const [build, setBuild] = useState<Build>({ ...EMPTY_BUILD });
  const [level, setLevel] = useState(1);
  const [gold, setGold] = useState(0);
  const [asi, setAsi] = useState<Asi>({});
  const [items, setItems] = useState<Item[]>([]);
  const [equipment, setEquipment] = useState<Record<string, Item>>({});
  const [hpRolls, setHpRolls] = useState<Record<string, number>>({});
  const [ac, setAc] = useState<number | null>(null); // CA: sesión-only (no se persiste)
  const [pickingSlot, setPickingSlot] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const [cat, setCat] = useState<ItemCat>("Aventura");
  const [custom, setCustom] = useState("");

  // Carga: por targetUserId (nube/API), si no hay sesión → localStorage.
  useEffect(() => {
    let done = false;
    (async () => {
      if (targetUserId) {
        const row = await loadCharacter(targetUserId);
        if (!done && row) {
          setBuild({
            name: row.name ?? "",
            species: row.species ?? null,
            lineage: row.lineage ?? null,
            cls: row.cls ?? null,
            subclass: row.subclass ?? null,
            background: row.background ?? null,
            base: row.base && Object.keys(row.base).length ? row.base : { ...EMPTY_SCORES },
            bonus: row.bonus && Object.keys(row.bonus).length ? row.bonus : { ...NO_BONUS },
          });
          if (typeof row.level === "number") setLevel(row.level);
          if (typeof row.gold === "number") setGold(row.gold);
          if (row.asi) setAsi(row.asi);
          if (Array.isArray(row.items)) setItems(row.items);
          if (row.equipment) setEquipment(row.equipment);
          if (row.hp_rolls) setHpRolls(row.hp_rolls);
        }
      } else {
        try {
          const b = localStorage.getItem(BUILD_KEY);
          if (b) {
            const parsed = JSON.parse(b) as Partial<Build>;
            setBuild((prev) => ({
              ...prev,
              name: parsed.name ?? prev.name,
              species: parsed.species ?? prev.species,
              lineage: parsed.lineage ?? prev.lineage,
              cls: parsed.cls ?? prev.cls,
              subclass: parsed.subclass ?? prev.subclass,
              background: parsed.background ?? prev.background,
              base: parsed.base && Object.keys(parsed.base).length ? parsed.base : prev.base,
              bonus: parsed.bonus && Object.keys(parsed.bonus).length ? parsed.bonus : prev.bonus,
            }));
          }
          const s = localStorage.getItem(SHEET_KEY);
          if (s) {
            const sheet = JSON.parse(s) as { level?: number; gold?: number; asi?: Asi; items?: Item[]; equipment?: Record<string, Item>; hp_rolls?: Record<string, number> };
            if (typeof sheet.level === "number") setLevel(sheet.level);
            if (typeof sheet.gold === "number") setGold(sheet.gold);
            if (sheet.asi) setAsi(sheet.asi);
            if (Array.isArray(sheet.items)) setItems(sheet.items);
            if (sheet.equipment) setEquipment(sheet.equipment);
            if (sheet.hp_rolls) setHpRolls(sheet.hp_rolls);
          }
        } catch {}
      }
      if (!done) setLoaded(true);
    })();
    return () => { done = true; };
  }, [targetUserId]);

  // Adaptador de guardado: readOnly no guarda; sin sesión → localStorage;
  // con sesión → saveCharacter (self) o POST /api/dm/character (dm).
  async function persistSheet(patch: Partial<CharacterData>) {
    if (readOnly || !targetUserId) {
      if (!readOnly && !targetUserId) { try { localStorage.setItem(SHEET_KEY, JSON.stringify({ level, gold, asi, items, equipment, hp_rolls: hpRolls })); } catch {} }
      return;
    }
    if (saveMode === "self") { await saveCharacter(targetUserId, patch); return; }
    await fetch("/api/dm/character", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: targetUserId, patch }) });
  }

  // Guardado de la ficha (nivel, oro, asi, items, equipo, tiradas PG). No toca los campos de build.
  useEffect(() => {
    if (!loaded) return;
    if (readOnly) return;
    const t = setTimeout(() => { persistSheet({ level, gold, asi, items, equipment, hp_rolls: hpRolls }); }, 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, gold, asi, items, equipment, hpRolls, loaded, readOnly, targetUserId, saveMode]);

  /* --- datos derivados --- */
  const species = build.species ? getSpecies(build.species) : undefined;
  const cls = build.cls ? getClass(build.cls) : undefined;
  const bg = build.background ? getBackground(build.background) : undefined;

  const preAsi = useMemo(() => {
    const out = {} as Record<AbilityKey, number>;
    ABILITIES.forEach((a) => (out[a.key] = (build.base[a.key] ?? 8) + (build.bonus[a.key] ?? 0)));
    return out;
  }, [build.base, build.bonus]);

  const totals = useMemo(() => asiTotals(asi), [asi]);
  const finalScores = useMemo(() => {
    const out = {} as Record<AbilityKey, number>;
    ABILITIES.forEach((a) => (out[a.key] = preAsi[a.key] + (totals[a.key] ?? 0)));
    return out;
  }, [preAsi, totals]);
  const mods = useMemo(() => {
    const out = {} as Record<AbilityKey, number>;
    ABILITIES.forEach((a) => (out[a.key] = abilityMod(finalScores[a.key])));
    return out;
  }, [finalScores]);

  const hitDie = cls?.hitDie ?? 8;
  const hp = useMemo(() => maxHp(hitDie, level, mods.con), [hitDie, level, mods.con]);
  const prof = proficiencyBonus(level);
  const cap = Math.max(10, 20 + 2 * mods.fue);
  const used = useMemo(() => items.reduce((s, i) => s + i.qty, 0), [items]);
  const full = used >= cap;
  const defaultAc = 10 + mods.des;
  const acValue = ac ?? defaultAc;

  /* --- handlers de nivel / asi --- */
  const onLevel = (n: number) => {
    const lvl = Math.max(1, Math.min(20, n));
    setLevel(lvl);
    setAsi((prev) => {
      const valid = new Set(reachedAsiLevels(build.cls, lvl).map(String));
      const next: Asi = {};
      for (const k of Object.keys(prev)) if (valid.has(k)) next[k] = prev[k];
      return next;
    });
  };

  const onAsi = (levelKey: string, key: AbilityKey, delta: number) => {
    setAsi((prev) => {
      const milestone = { ...(prev[levelKey] ?? {}) };
      const cur = milestone[key] ?? 0;
      const nextVal = Math.max(0, cur + delta);
      // suma del hito ≤ 2
      const sumOthers = (Object.entries(milestone) as [AbilityKey, number][])
        .reduce((s, [k, v]) => s + (k === key ? 0 : v ?? 0), 0);
      if (nextVal + sumOthers > 2) return prev;
      // puntuación final ≤ 20
      if (delta > 0 && finalScores[key] >= 20) return prev;
      if (nextVal === 0) delete milestone[key];
      else milestone[key] = nextVal;
      return { ...prev, [levelKey]: milestone };
    });
  };

  const onRollHp = (lv: number, val: number) => setHpRolls((r) => ({ ...r, [String(lv)]: val }));

  /* --- oro --- */
  const setGoldClamped = (n: number) => setGold(Math.max(0, Math.floor(n) || 0));

  /* --- inventario --- */
  const addItem = (name: string) => {
    const n = name.trim();
    if (!n || full) return;
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.name === n);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return next;
      }
      return [...prev, { id: crypto.randomUUID(), name: n, qty: 1 }];
    });
  };
  const changeQty = (id: string, delta: number) => {
    if (delta > 0 && full) return;
    setItems((prev) => prev.flatMap((i) => {
      if (i.id !== id) return [i];
      const q = i.qty + delta;
      return q <= 0 ? [] : [{ ...i, qty: q }];
    }));
  };
  const setNotes = (id: string, notes: string) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, notes } : i)));

  /* --- equipar / retirar --- */
  const onSlotClick = (slotId: string) => {
    if (readOnly) return;
    const equipped = equipment[slotId];
    if (equipped) {
      // retirar → vuelve al inventario
      setItems((prev) => addBack(prev, equipped));
      setEquipment((prev) => {
        const next = { ...prev };
        delete next[slotId];
        return next;
      });
      if (pickingSlot === slotId) setPickingSlot(null);
    } else {
      setPickingSlot((p) => (p === slotId ? null : slotId));
    }
  };

  const equipInto = (slotId: string, item: Item) => {
    const prevEquipped = equipment[slotId];
    setItems((prev) => {
      let next = removeOne(prev, item.id);
      if (prevEquipped) next = addBack(next, prevEquipped);
      return next;
    });
    setEquipment((prev) => ({ ...prev, [slotId]: { id: item.id, name: item.name, qty: 1, notes: item.notes } }));
    setPickingSlot(null);
  };

  const onItemClick = (item: Item) => {
    if (pickingSlot) equipInto(pickingSlot, item);
  };

  /* --- estado vacío --- */
  if (loaded && !build.species && !build.cls) {
    return (
      <main className="max-w-3xl mx-auto px-6 py-24 text-center">
        <i className="fas fa-hat-wizard text-4xl mb-4" style={{ color: "var(--color-dim)" }} />
        <h1 className="font-display text-2xl font-bold mb-3" style={{ color: "var(--color-parch)" }}>Aún no hay personaje</h1>
        <p className="prose-lore !text-[15px] mb-6" style={{ color: "var(--color-muted)" }}>
          Crea un personaje para abrir su hoja interactiva: nivel, aptitudes, oro, inventario y equipo.
        </p>
        <Link href="/crear" className="btn-gold"><i className="fas fa-hat-wizard mr-2" />Crear personaje</Link>
      </main>
    );
  }

  return (
    <>
      {/* HEADER / IDENTIDAD */}
      <header className="panel p-5 mb-6 flex items-center gap-4 flex-wrap">
        <PortraitFrame src={species ? `/species/${species.slug}.jpg` : undefined} alt={build.name || "Personaje"} size="lg" icon="fa-user" />
        <div className="min-w-0">
          <p className="eyebrow mb-1">Hoja del héroe · Nivel {level}</p>
          <h1 className="font-display text-3xl md:text-4xl font-extrabold gold-text">{build.name || "Personaje sin nombre"}</h1>
          <p className="font-ui text-[13px] font-semibold mt-2" style={{ color: "var(--color-muted)" }}>
            {[species?.name, build.lineage, cls?.name, build.subclass, bg?.name].filter(Boolean).join(" · ") || "—"}
          </p>
        </div>
      </header>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">
        <div className="space-y-6">
          {/* NIVEL + ASI */}
          <LevelPanel level={level} onLevel={onLevel} clsSlug={build.cls} hitDie={hitDie} preAsi={preAsi} asi={asi} onAsi={onAsi} hpRolls={hpRolls} onRollHp={readOnly ? () => {} : onRollHp} readOnly={readOnly} />

          {/* APTITUDES */}
          <section className="panel p-5">
            <p className="eyebrow mb-3">Aptitudes</p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {ABILITIES.map((a) => (
                <div key={a.key} className="panel-raised py-3 text-center">
                  <p className="eyebrow mb-1">{a.abbr}</p>
                  <p className="font-display text-2xl font-extrabold" style={{ color: "var(--color-arcane-bright)" }}>{finalScores[a.key]}</p>
                  <p className="font-ui text-[11px] font-bold" style={{ color: "var(--color-muted)" }}>{fmtMod(mods[a.key])}</p>
                </div>
              ))}
            </div>
          </section>

          {/* DERIVADOS */}
          <section className="panel p-5">
            <p className="eyebrow mb-3">Estadísticas derivadas</p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <Derived icon="fa-heart" label="PG máx" value={hp} color="var(--color-ember)" />
              <Derived icon="fa-shield-halved" label="Competencia" value={fmtMod(prof)} color="var(--color-bronze)" />
              <Derived icon="fa-bolt" label="Iniciativa" value={fmtMod(mods.des)} color="var(--color-arcane)" />
              <Derived icon="fa-shoe-prints" label="Velocidad" value={species ? `${species.speed} m` : "—"} color="var(--color-primitivo)" />
              <div className="panel-raised py-3 px-2 text-center flex flex-col items-center">
                <i className="fas fa-shield text-lg mb-1" style={{ color: "var(--color-arcane-bright)" }} />
                <p className="eyebrow !text-[9px] mb-1">CA</p>
                {readOnly ? (
                  <p className="font-display text-xl font-extrabold" style={{ color: "var(--color-parch)" }}>{acValue}</p>
                ) : (
                  <input
                    type="number"
                    value={acValue}
                    onChange={(e) => setAc(e.target.value === "" ? null : Math.max(0, Math.floor(Number(e.target.value)) || 0))}
                    className="w-16 text-center bg-[var(--color-night)] rounded-lg px-2 py-1 font-display text-xl font-extrabold outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)]"
                    style={{ color: "var(--color-parch)" }}
                  />
                )}
              </div>
            </div>
            <p className="text-[11px] mt-2 italic" style={{ color: "var(--color-dim)" }}>CA por defecto 10 {fmtMod(mods.des)} (DES). Editable; no se guarda entre sesiones.</p>
          </section>

          {/* ORO */}
          <section className="panel p-5">
            <p className="eyebrow mb-3">Oro</p>
            <div className="flex items-center gap-3">
              {readOnly ? (
                <span className="font-display text-xl font-extrabold" style={{ color: "var(--color-bronze-bright)" }}>{gold}</span>
              ) : (
                <>
                  <button className="stat-btn" onClick={() => setGoldClamped(gold - 1)} disabled={gold <= 0}>−</button>
                  <input
                    type="number"
                    value={gold}
                    onChange={(e) => setGoldClamped(Number(e.target.value))}
                    className="w-28 text-center bg-[var(--color-night)] rounded-lg px-3 py-2 font-display text-xl font-extrabold outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)]"
                    style={{ color: "var(--color-bronze-bright)" }}
                  />
                  <button className="stat-btn" onClick={() => setGoldClamped(gold + 1)}>+</button>
                  <div className="flex gap-1.5 ml-2">
                    {[10, 50, 100].map((n) => (
                      <button key={n} className="btn-ghost !py-1.5 !px-2.5 text-[12px]" onClick={() => setGoldClamped(gold + n)}>+{n}</button>
                    ))}
                  </div>
                </>
              )}
              <span className="font-ui text-[13px] ml-1" style={{ color: "var(--color-muted)" }}>po</span>
            </div>
          </section>

          {/* INVENTARIO */}
          <section className="panel p-5">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <p className="eyebrow">Inventario</p>
              <p className="font-ui text-[13px] font-semibold">
                <span style={{ color: full ? "var(--color-ember)" : "var(--color-arcane-bright)" }}>{used}</span>
                <span style={{ color: "var(--color-dim)" }}>/{cap} huecos</span>
              </p>
            </div>

            {pickingSlot && (
              <div className="panel-raised p-3 mb-4 flex items-center justify-between gap-3" style={{ borderColor: "var(--color-bronze)" }}>
                <span className="font-ui text-[13px] font-semibold" style={{ color: "var(--color-bronze-bright)" }}>
                  <i className="fas fa-hand-pointer mr-2" />Elige un objeto para equipar en: <strong>{pickingSlot}</strong>
                </span>
                <button className="btn-ghost !py-1.5 !px-3 text-[12px]" onClick={() => setPickingSlot(null)}>Cancelar</button>
              </div>
            )}

            {/* añadir */}
            {!readOnly && (
              <>
                <div className="flex gap-2 mb-3">
                  <input value={custom} onChange={(e) => setCustom(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { addItem(custom); setCustom(""); } }}
                    placeholder="Objeto personalizado…"
                    className="flex-1 bg-[var(--color-night)] rounded-lg px-3 py-2 font-ui text-[13px] outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)] transition-colors"
                    style={{ color: "var(--color-warm)" }} />
                  <button className="stat-btn !w-9 !h-9" onClick={() => { addItem(custom); setCustom(""); }} disabled={full || !custom.trim()}>+</button>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {(Object.keys(CATALOG) as ItemCat[]).map((c) => (
                    <button key={c} className="chip" data-on={cat === c} onClick={() => setCat(c)}>{c}</button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {CATALOG[cat].map((it) => (
                    <button key={it} onClick={() => addItem(it)} disabled={full}
                      className="chip disabled:opacity-40" title="Añadir">
                      {it} <i className="fas fa-plus text-[9px] ml-0.5" style={{ color: "var(--color-bronze)" }} />
                    </button>
                  ))}
                </div>
              </>
            )}

            {full && <p className="text-[12px] mb-3 text-center italic" style={{ color: "var(--color-ember)" }}>Inventario lleno. Aumenta tu Fuerza para más huecos.</p>}
            {!pickingSlot && items.length > 0 && (
              <p className="text-[11px] mb-3 italic" style={{ color: "var(--color-dim)" }}>
                <i className="fas fa-circle-info mr-1" />Para equipar, pulsa un hueco del equipo (derecha) y luego el objeto.
              </p>
            )}

            {/* filas de objetos */}
            {items.length === 0 ? (
              <p className="font-ui text-[13px] text-center py-4" style={{ color: "var(--color-dim)" }}>Sin objetos todavía.</p>
            ) : (
              <div className="space-y-2">
                {items.map((it) => (
                  <div key={it.id}
                    className="panel-raised p-3"
                    data-pick={!!pickingSlot}
                    style={pickingSlot ? { borderColor: "var(--color-bronze)", cursor: "pointer" } : undefined}
                    onClick={pickingSlot ? () => onItemClick(it) : undefined}>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-ui text-[14px] font-semibold flex-1 min-w-0" style={{ color: "var(--color-warm)" }}>{it.name}</span>
                      {!readOnly && (
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button className="stat-btn !w-7 !h-7" onClick={() => changeQty(it.id, -1)}>−</button>
                          <span className="font-ui font-bold w-6 text-center" style={{ color: "var(--color-parch)" }}>{it.qty}</span>
                          <button className="stat-btn !w-7 !h-7" onClick={() => changeQty(it.id, +1)} disabled={full}>+</button>
                        </div>
                      )}
                      {readOnly && (
                        <span className="font-ui font-bold w-6 text-center" style={{ color: "var(--color-parch)" }}>×{it.qty}</span>
                      )}
                      {pickingSlot && (
                        <span className="font-ui text-[12px] font-bold" style={{ color: "var(--color-bronze-bright)" }}>
                          <i className="fas fa-hand-pointer mr-1" />Equipar aquí
                        </span>
                      )}
                    </div>
                    {readOnly ? (
                      it.notes ? <p className="w-full mt-2 font-ui text-[12px]" style={{ color: "var(--color-muted)" }}>{it.notes}</p> : null
                    ) : (
                      <input
                        value={it.notes ?? ""}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setNotes(it.id, e.target.value)}
                        placeholder="Notas…"
                        className="w-full mt-2 bg-[var(--color-night)] rounded-lg px-3 py-1.5 font-ui text-[12px] outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)] transition-colors"
                        style={{ color: "var(--color-muted)" }} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* PAPERDOLL */}
        <div className="lg:sticky lg:top-24">
          <Paperdoll
            equipment={equipment}
            mods={mods}
            portrait={species ? `/species/${species.slug}.jpg` : undefined}
            portraitAlt={build.name || "Personaje"}
            onSlotClick={onSlotClick}
          />
        </div>
      </div>
    </>
  );
}

function Derived({ icon, label, value, color }: { icon: string; label: string; value: string | number; color: string }) {
  return (
    <div className="panel-raised py-3 px-2 text-center flex flex-col items-center">
      <i className={`fas ${icon} text-lg mb-1`} style={{ color }} />
      <p className="eyebrow !text-[9px] mb-1">{label}</p>
      <p className="font-display text-xl font-extrabold" style={{ color: "var(--color-parch)" }}>{value}</p>
    </div>
  );
}
