"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "@/components/SessionProvider";
import { loadCharacter, saveCharacter } from "@/lib/character";
import { getSpecies, REGIONS, regionSpecies } from "@/data/species";
import { CLASSES, getClass, GROUP_LABEL } from "@/data/classes";
import { BACKGROUNDS, getBackground } from "@/data/backgrounds";
import PortraitFrame from "@/components/PortraitFrame";
import CharacterBook, { type Chapter } from "@/components/CharacterBook";
import {
  ABILITIES, SKILLS, AbilityKey, abilityMod, fmtMod,
  POINT_BUY_COST, POINT_BUY_BUDGET, POINT_BUY_MIN, POINT_BUY_MAX,
} from "@/data/rules";

type Build = {
  name: string;
  species: string | null;
  lineage: string | null;
  cls: string | null;
  subclass: string | null;
  background: string | null;
  base: Record<AbilityKey, number>;
  bonus: Record<AbilityKey, number>;
  skills: string[];
  lore: string;
  step: number;
};

const EMPTY_SCORES: Record<AbilityKey, number> = { fue: 8, des: 8, con: 8, int: 8, sab: 8, car: 8 };
const NO_BONUS: Record<AbilityKey, number> = { fue: 0, des: 0, con: 0, int: 0, sab: 0, car: 0 };

const STEPS = ["Especie", "Clase", "Trasfondo", "Aptitudes", "Pericias", "Resumen"];
const KEY = "taldorei.build.v1";

const CHAPTERS = [
  { key: "razas", label: "Razas", step: 0 },
  { key: "clases", label: "Clases", step: 1 },
  { key: "trasfondos", label: "Trasfondos", step: 2 },
  { key: "aptitudes", label: "Aptitudes", step: 3 },
  { key: "pericias", label: "Pericias", step: 4 },
  { key: "ficha", label: "Ficha", step: 5 },
] as const;

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function CrearPage() {
  const [b, setB] = useState<Build>({
    name: "", species: null, lineage: null, cls: null, subclass: null,
    background: null, base: { ...EMPTY_SCORES }, bonus: { ...NO_BONUS }, skills: [], lore: "", step: 0,
  });
  const [loaded, setLoaded] = useState(false);
  const [mobileShowRight, setMobileShowRight] = useState(false);

  // cargar / guardar
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setB((prev) => ({ ...prev, ...JSON.parse(raw) }));
    } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) localStorage.setItem(KEY, JSON.stringify(b));
  }, [b, loaded]);

  // Sincronización con Supabase (si hay sesión): la ficha vive en la nube.
  const session = useSession();
  const userId = session?.id;
  const cloudLoaded = useRef(false);

  useEffect(() => {
    if (!loaded || !userId || cloudLoaded.current) return;
    cloudLoaded.current = true;
    loadCharacter(userId).then((row) => {
      if (!row) return;
      setB((p) => ({
        ...p,
        name: row.name ?? p.name,
        species: row.species ?? p.species,
        lineage: row.lineage ?? p.lineage,
        cls: row.cls ?? p.cls,
        subclass: row.subclass ?? p.subclass,
        background: row.background ?? p.background,
        base: row.base && Object.keys(row.base).length ? row.base : p.base,
        bonus: row.bonus && Object.keys(row.bonus).length ? row.bonus : p.bonus,
        skills: Array.isArray(row.skills) ? row.skills : p.skills,
        lore: row.lore ?? p.lore,
      }));
    });
  }, [loaded, userId]);

  useEffect(() => {
    if (!loaded || !userId || !cloudLoaded.current) return;
    const t = setTimeout(() => {
      saveCharacter(userId, {
        name: b.name, species: b.species, lineage: b.lineage, cls: b.cls, subclass: b.subclass,
        background: b.background, base: b.base, bonus: b.bonus, skills: b.skills, lore: b.lore,
      });
    }, 900);
    return () => clearTimeout(t);
  }, [loaded, userId, b.name, b.species, b.lineage, b.cls, b.subclass, b.background, b.base, b.bonus, b.skills, b.lore]);

  const species = b.species ? getSpecies(b.species) : undefined;
  const cls = b.cls ? getClass(b.cls) : undefined;
  const bg = b.background ? getBackground(b.background) : undefined;

  const pointsSpent = useMemo(
    () => ABILITIES.reduce((sum, a) => sum + (POINT_BUY_COST[b.base[a.key]] ?? 0), 0),
    [b.base]
  );
  const finalScores = useMemo(() => {
    const out = {} as Record<AbilityKey, number>;
    ABILITIES.forEach((a) => (out[a.key] = b.base[a.key] + (b.bonus[a.key] ?? 0)));
    return out;
  }, [b.base, b.bonus]);

  const conMod = abilityMod(finalScores.con);
  const hp = cls ? cls.hitDie + conMod : 0;

  const set = (patch: Partial<Build>) => setB((p) => ({ ...p, ...patch }));

  // pericias del trasfondo (fijas) + de clase (elegidas)
  const bgSkills = bg?.skills ?? [];
  const classPool = (cls?.skillList ?? []).filter((s) => !bgSkills.includes(s));
  const classSkills = b.skills;
  const allSkills = useMemo(() => Array.from(new Set([...bgSkills, ...classSkills])), [bgSkills, classSkills]);

  function reset() {
    setB({ name: "", species: null, lineage: null, cls: null, subclass: null, background: null, base: { ...EMPTY_SCORES }, bonus: { ...NO_BONUS }, skills: [], lore: "", step: 0 });
  }

  function copySheet() {
    const lines = [
      `${b.name || "Personaje sin nombre"}`,
      `${species?.name ?? "—"}${b.lineage ? ` (${b.lineage})` : ""} · ${cls?.name ?? "—"}${b.subclass ? ` (${b.subclass})` : ""} · ${bg?.name ?? "—"}`,
      ``,
      `PG ${hp || "—"}   Competencia +2`,
      ABILITIES.map((a) => `${a.abbr} ${finalScores[a.key]} (${fmtMod(abilityMod(finalScores[a.key]))})`).join("   "),
      ``,
      `Pericias: ${allSkills.join(", ") || "—"}`,
      ...(b.lore.trim() ? [``, `Historia:`, b.lore.trim()] : []),
    ];
    navigator.clipboard?.writeText(lines.join("\n"));
  }

  // Cada paso debe completarse antes de poder avanzar (o saltar) más allá.
  const stepDone = [
    !!b.name.trim() && !!species && (!species.lineages || !!b.lineage),
    !!cls && !!b.subclass,
    !!bg,
    pointsSpent <= POINT_BUY_BUDGET && bonusTotal(b.bonus) === 3,
    !!cls && classSkills.length === cls.skillCount,
    true,
  ];
  const firstIncomplete = stepDone.findIndex((d) => !d);
  const maxStep = firstIncomplete === -1 ? STEPS.length - 1 : firstIncomplete;
  const canNext = stepDone[b.step];

  // Solo se puede navegar a pasos ya alcanzables (todos los anteriores completos).
  const go = (step: number) => {
    const target = Math.max(0, Math.min(STEPS.length - 1, step));
    if (target > maxStep) return;
    set({ step: target });
  };

  // Qué falta en el paso actual (aviso junto al botón Siguiente).
  const missing =
    b.step === 0
      ? (!b.name.trim() ? "Ponle un nombre a tu héroe" : !species ? "Elige una especie" : species.lineages && !b.lineage ? "Elige un linaje" : null)
      : b.step === 1
      ? (!cls ? "Elige una clase" : !b.subclass ? `Elige ${cls.subclassLabel.toLowerCase()}` : null)
      : b.step === 2
      ? (!bg ? "Elige un trasfondo" : null)
      : b.step === 3
      ? (bonusTotal(b.bonus) !== 3 ? "Reparte los +3 del trasfondo" : null)
      : b.step === 4
      ? (cls && classSkills.length !== cls.skillCount ? `Elige tus pericias (${classSkills.length}/${cls.skillCount})` : null)
      : null;

  // Si el estado guardado apunta a un paso aún no alcanzable, retrocede.
  useEffect(() => {
    if (loaded && b.step > maxStep) setB((p) => ({ ...p, step: maxStep }));
  }, [loaded, b.step, maxStep]);

  const pickSpecies = (slug: string) => { set({ species: slug, lineage: null }); setMobileShowRight(true); };
  const pickClass = (slug: string) => { set({ cls: slug, subclass: null, skills: [] }); setMobileShowRight(true); };
  const pickBackground = (slug: string) => { set({ background: slug, bonus: { ...NO_BONUS } }); setMobileShowRight(true); };

  const activeKey = CHAPTERS.find((c) => c.step === b.step)?.key ?? "razas";
  const unlockedKeys = CHAPTERS.filter((c) => c.step <= maxStep).map((c) => c.key);
  const onSelectChapter = (key: string) => { const c = CHAPTERS.find((x) => x.key === key); if (c) { go(c.step); setMobileShowRight(false); } };

  const chapters: Chapter[] = [
    { key: "razas", label: "Razas", left: <RazasIndex b={b} set={set} onPickSpecies={pickSpecies} />, right: <RazaDetalle b={b} set={set} /> },
    { key: "clases", label: "Clases", left: <ClasesIndex b={b} onPickClass={pickClass} />, right: <ClaseDetalle b={b} set={set} /> },
    { key: "trasfondos", label: "Trasfondos", left: <TrasfondosIndex b={b} onPickBackground={pickBackground} />, right: <TrasfondoDetalle b={b} /> },
    { key: "aptitudes", label: "Aptitudes", left: <div className="tome-dark-inset"><StepAbilities b={b} set={set} pointsSpent={pointsSpent} finalScores={finalScores} /></div> },
    { key: "pericias", label: "Pericias", left: <div className="tome-dark-inset"><StepSkills b={b} set={set} cls={cls} bgSkills={bgSkills} classPool={classPool} /></div> },
    { key: "ficha", label: "Ficha", left: <div className="tome-dark-inset"><StepSummary b={b} set={set} finalScores={finalScores} hp={hp} allSkills={allSkills} onCopy={copySheet} onReset={reset} /></div> },
  ];

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <header className="text-center mb-6">
        <p className="eyebrow mb-3">Forja de héroes · Reglas 2024</p>
        <h1 className="font-display text-3xl md:text-4xl font-extrabold gold-text">Crea tu personaje</h1>
      </header>

      <div className="only-narrow justify-center mb-3">
        {activeKey === "razas" || activeKey === "clases" || activeKey === "trasfondos" ? (
          <button className="btn-ghost" onClick={() => setMobileShowRight((v) => !v)}>
            <i className={`fas ${mobileShowRight ? "fa-list" : "fa-eye"} mr-2`} />{mobileShowRight ? "Ver lista" : "Ver detalle"}
          </button>
        ) : null}
      </div>

      <CharacterBook chapters={chapters} activeKey={activeKey} unlockedKeys={unlockedKeys} onSelect={onSelectChapter} mobileShowRight={mobileShowRight} />

      <div className="flex items-center justify-between gap-3 mt-6 flex-wrap">
        <button className="btn-ghost" onClick={() => go(b.step - 1)} disabled={b.step === 0}>
          <i className="fas fa-arrow-left mr-2" />Atrás
        </button>
        <div className="flex items-center gap-3">
          {missing && (
            <span className="font-ui text-[12px] font-semibold" style={{ color: "var(--color-ember)" }}>
              <i className="fas fa-circle-exclamation mr-1.5" />{missing}
            </span>
          )}
          {b.step < STEPS.length - 1 ? (
            <button className="btn-gold" onClick={() => go(b.step + 1)} disabled={!canNext}>
              Siguiente<i className="fas fa-arrow-right ml-2" />
            </button>
          ) : (
            <button className="btn-gold" onClick={copySheet}><i className="fas fa-copy mr-2" />Copiar hoja</button>
          )}
        </div>
      </div>
    </main>
  );
}

function bonusTotal(bonus: Record<AbilityKey, number>) {
  return ABILITIES.reduce((s, a) => s + (bonus[a.key] ?? 0), 0);
}

/* ============================ CAPÍTULO: RAZAS ============================ */
function RazasIndex({ b, set, onPickSpecies }: { b: Build; set: (p: Partial<Build>) => void; onPickSpecies: (slug: string) => void }) {
  return (
    <div>
      <div className="mb-4">
        <label className="tome-region" htmlFor="hero-name">Nombre de tu héroe *</label>
        <input
          id="hero-name"
          value={b.name}
          onChange={(e) => set({ name: e.target.value })}
          placeholder="Ej.: Vex'ahlia, Grog, Percival…"
          maxLength={40}
          className="w-full rounded-lg px-3 py-2 font-display text-lg font-bold outline-none"
          style={{ background: "rgba(120,80,35,0.10)", color: "var(--paper-ink)", border: `1px solid ${b.name.trim() ? "var(--paper-line)" : "var(--color-ember)"}` }}
        />
      </div>
      <h2 className="tome-detail-name" style={{ marginTop: 0 }}>✦ Razas de Exandria</h2>
      {REGIONS.map((r) => {
        const list = regionSpecies(r.key);
        if (!list.length) return null;
        return (
          <div key={r.key} className="mb-2">
            <p className="tome-region">{r.label}</p>
            {list.map((s) => (
              <button key={s.slug} className="tome-opt" data-sel={b.species === s.slug} onClick={() => onPickSpecies(s.slug)}>
                <PortraitFrame src={`/species/${s.slug}.jpg`} alt={s.name} size="sm" icon="fa-dragon" />
                <span className="tome-opt-txt">
                  <span className="tome-opt-name">{s.name}{s.homebrew && <span className="tome-dm">DM</span>}</span>
                  <span className="tome-opt-tag">{s.tagline}</span>
                </span>
              </button>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function RazaDetalle({ b, set }: { b: Build; set: (p: Partial<Build>) => void }) {
  const s = b.species ? getSpecies(b.species) : undefined;
  if (!s) return <p className="tome-opt-tag">Elige una raza en la página izquierda.</p>;
  return (
    <div>
      <PortraitFrame src={`/species/${s.slug}.jpg`} alt={s.name} size="lg" icon="fa-dragon" />
      <p className="tome-detail-name">{s.name}</p>
      <p className="tome-region">{REGIONS.find((r) => r.key === s.region)?.label}{s.homebrew ? " · a criterio del DM" : ""}</p>
      <p style={{ fontSize: 14, lineHeight: 1.55, color: "var(--paper-ink)" }}>{s.blurb}</p>
      <p style={{ fontSize: 13, fontStyle: "italic", color: "var(--paper-ink-soft)", margin: "8px 0" }}>{s.origin}</p>
      <p className="tome-region">Rasgos</p>
      <ul>{s.traits.map((t) => <li key={t} style={{ fontSize: 13, color: "var(--paper-ink)", margin: "3px 0" }}>◆ {t}</li>)}</ul>
      {s.lineages && (
        <>
          <p className="tome-region">Linaje *</p>
          {s.lineages.map((l) => (
            <button key={l.name} className="tome-opt" data-sel={b.lineage === l.name} onClick={() => set({ lineage: l.name })}>
              <PortraitFrame src={`/species/lineages/${slugify(l.name)}.jpg`} alt={l.name} size="sm" icon="fa-star" />
              <span className="tome-opt-txt">
                <span className="tome-opt-name">{l.name}{l.homebrew && <span className="tome-dm">DM</span>}</span>
                <span className="tome-opt-tag">{l.perk}</span>
              </span>
            </button>
          ))}
        </>
      )}
    </div>
  );
}

/* ============================ CAPÍTULO: CLASES ============================ */
function ClasesIndex({ b, onPickClass }: { b: Build; onPickClass: (slug: string) => void }) {
  return (
    <div>
      <h2 className="tome-detail-name" style={{ marginTop: 0 }}>✦ Clases</h2>
      {CLASSES.map((c) => (
        <button key={c.slug} className="tome-opt" data-sel={b.cls === c.slug} onClick={() => onPickClass(c.slug)}>
          <PortraitFrame src={`/classes/${c.slug}.jpg`} alt={c.name} size="sm" icon="fa-hat-wizard" />
          <span className="tome-opt-txt">
            <span className="tome-opt-name">{c.name}</span>
            <span className="tome-opt-tag">{c.tagline}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

function ClaseDetalle({ b, set }: { b: Build; set: (p: Partial<Build>) => void }) {
  const cls = b.cls ? getClass(b.cls) : undefined;
  if (!cls) return <p className="tome-opt-tag">Elige una clase en la página izquierda.</p>;
  return (
    <div>
      <PortraitFrame src={`/classes/${cls.slug}.jpg`} alt={cls.name} size="lg" icon="fa-hat-wizard" />
      <p className="tome-detail-name">{cls.name}</p>
      <p className="tome-region">{GROUP_LABEL[cls.group]}</p>
      <p style={{ fontSize: 14, lineHeight: 1.55, color: "var(--paper-ink)" }}>{cls.blurb}</p>
      <ul style={{ margin: "8px 0" }}>
        <li style={{ fontSize: 13, color: "var(--paper-ink)", margin: "3px 0" }}>◆ Dado de golpe: d{cls.hitDie}</li>
        <li style={{ fontSize: 13, color: "var(--paper-ink)", margin: "3px 0" }}>◆ Aptitud principal: {cls.primary.map((p) => ABILITIES.find((a) => a.key === p)!.abbr).join(" / ")}</li>
        <li style={{ fontSize: 13, color: "var(--paper-ink)", margin: "3px 0" }}>◆ Salvaciones: {cls.saves.map((p) => ABILITIES.find((a) => a.key === p)!.abbr).join(" / ")}</li>
      </ul>
      <p className="tome-region">{cls.subclassLabel} *</p>
      {cls.subclasses.map((sc) => (
        <button key={sc.name} className="tome-opt" data-sel={b.subclass === sc.name} onClick={() => set({ subclass: sc.name })}>
          <span className="tome-opt-txt">
            <span className="tome-opt-name">{sc.name}</span>
            <span className="tome-opt-tag">{sc.blurb}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

/* ============================ CAPÍTULO: TRASFONDOS ============================ */
function TrasfondosIndex({ b, onPickBackground }: { b: Build; onPickBackground: (slug: string) => void }) {
  return (
    <div>
      <h2 className="tome-detail-name" style={{ marginTop: 0 }}>✦ Trasfondos</h2>
      {BACKGROUNDS.map((g) => (
        <button key={g.slug} className="tome-opt" data-sel={b.background === g.slug} onClick={() => onPickBackground(g.slug)}>
          <PortraitFrame alt={g.name} size="sm" icon="fa-scroll" />
          <span className="tome-opt-txt">
            <span className="tome-opt-name">{g.name}</span>
            <span className="tome-opt-tag">{g.feat}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

function TrasfondoDetalle({ b }: { b: Build }) {
  const bg = b.background ? getBackground(b.background) : undefined;
  if (!bg) return <p className="tome-opt-tag">Elige un trasfondo en la página izquierda.</p>;
  return (
    <div>
      <p className="tome-detail-name" style={{ marginTop: 0 }}>{bg.name}</p>
      <p style={{ fontSize: 14, lineHeight: 1.55, color: "var(--paper-ink)" }}>{bg.blurb}</p>
      <p className="tome-region">Pericias</p>
      <p style={{ fontSize: 13, color: "var(--paper-ink)" }}>{bg.skills.join(", ")}</p>
      <p className="tome-region">Herramienta</p>
      <p style={{ fontSize: 13, color: "var(--paper-ink)" }}>{bg.tool}</p>
      <p className="tome-region">Dote</p>
      <p style={{ fontSize: 13, color: "var(--paper-ink)" }}>{bg.feat}</p>
    </div>
  );
}

/* ============================ PASO 4: APTITUDES ============================ */
function StepAbilities({ b, set, pointsSpent, finalScores }:
  { b: Build; set: (p: Partial<Build>) => void; pointsSpent: number; finalScores: Record<AbilityKey, number> }) {
  const bg = b.background ? getBackground(b.background) : undefined;
  const remaining = POINT_BUY_BUDGET - pointsSpent;
  const totalBonus = bonusTotal(b.bonus);

  const setBase = (k: AbilityKey, v: number) => {
    if (v < POINT_BUY_MIN || v > POINT_BUY_MAX) return;
    const cost = (POINT_BUY_COST[v] ?? 0) - (POINT_BUY_COST[b.base[k]] ?? 0);
    if (pointsSpent + cost > POINT_BUY_BUDGET) return;
    set({ base: { ...b.base, [k]: v } });
  };
  const setBonus = (k: AbilityKey, v: number) => {
    if (v < 0 || v > 2) return;
    const next = { ...b.bonus, [k]: v };
    if (bonusTotal(next) > 3) return;
    set({ bonus: next });
  };

  return (
    <div>
      <h2 className="font-display text-xl font-bold mb-1" style={{ color: "var(--color-parch)" }}>Reparte tus aptitudes</h2>
      <p className="text-sm mb-4" style={{ color: "var(--color-muted)" }}>
        Compra de puntos (27): valores 8–15. Después suma <strong>+3 de tu trasfondo</strong> (máx. +2 a una aptitud).
      </p>
      <div className="flex flex-wrap gap-3 mb-6">
        <span className="chip" data-on={remaining >= 0}>Puntos restantes: {remaining}</span>
        <span className="chip" data-on={totalBonus === 3}>Bonus de trasfondo: {totalBonus}/3</span>
      </div>

      <div className="space-y-3">
        {ABILITIES.map((a) => {
          const canBonus = bg?.abilities.includes(a.key);
          return (
            <div key={a.key} className="panel-raised p-4 flex items-center gap-3 flex-wrap">
              <div className="w-32">
                <p className="font-display font-bold" style={{ color: "var(--color-parch)" }}>{a.name}</p>
                <p className="font-ui text-[11px]" style={{ color: "var(--color-dim)" }}>{a.abbr}</p>
              </div>
              {/* base stepper */}
              <div className="flex items-center gap-2">
                <button className="stat-btn" onClick={() => setBase(a.key, b.base[a.key] - 1)} disabled={b.base[a.key] <= POINT_BUY_MIN}>−</button>
                <span className="font-ui font-extrabold text-lg w-7 text-center" style={{ color: "var(--color-warm)" }}>{b.base[a.key]}</span>
                <button className="stat-btn" onClick={() => setBase(a.key, b.base[a.key] + 1)} disabled={b.base[a.key] >= POINT_BUY_MAX}>+</button>
              </div>
              {/* bonus */}
              <div className="flex items-center gap-2">
                <span className="font-ui text-[11px] font-bold" style={{ color: canBonus ? "var(--color-bronze)" : "var(--color-dim)" }}>trasfondo</span>
                <button className="stat-btn" onClick={() => setBonus(a.key, (b.bonus[a.key] ?? 0) - 1)} disabled={!canBonus || (b.bonus[a.key] ?? 0) <= 0}>−</button>
                <span className="font-ui font-bold w-6 text-center" style={{ color: "var(--color-bronze-bright)" }}>+{b.bonus[a.key] ?? 0}</span>
                <button className="stat-btn" onClick={() => setBonus(a.key, (b.bonus[a.key] ?? 0) + 1)} disabled={!canBonus || totalBonus >= 3 || (b.bonus[a.key] ?? 0) >= 2}>+</button>
              </div>
              {/* total */}
              <div className="ml-auto text-right">
                <p className="font-display text-2xl font-extrabold" style={{ color: "var(--color-arcane-bright)" }}>{finalScores[a.key]}</p>
                <p className="font-ui text-[11px] font-bold" style={{ color: "var(--color-muted)" }}>{fmtMod(abilityMod(finalScores[a.key]))}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================ PASO 5: PERICIAS ============================ */
function StepSkills({ b, set, cls, bgSkills, classPool }:
  { b: Build; set: (p: Partial<Build>) => void; cls: ReturnType<typeof getClass>; bgSkills: string[]; classPool: string[] }) {
  const need = cls?.skillCount ?? 0;
  const toggle = (s: string) => {
    const has = b.skills.includes(s);
    if (has) set({ skills: b.skills.filter((x) => x !== s) });
    else if (b.skills.length < need) set({ skills: [...b.skills, s] });
  };
  if (!cls) return <Empty msg="Elige primero una clase." />;
  return (
    <div>
      <h2 className="font-display text-xl font-bold mb-1" style={{ color: "var(--color-parch)" }}>Escoge tus pericias</h2>
      <p className="text-sm mb-4" style={{ color: "var(--color-muted)" }}>
        Tu clase otorga <strong>{need}</strong> pericias a elección. Tu trasfondo añade {bgSkills.length}.
      </p>
      <span className="chip mb-6 inline-block" data-on={b.skills.length === need}>Elegidas: {b.skills.length}/{need}</span>

      {bgSkills.length > 0 && (
        <div className="mb-6">
          <p className="eyebrow mb-2">Del trasfondo (fijas)</p>
          <div className="flex flex-wrap gap-2">
            {bgSkills.map((s) => <span key={s} className="chip" data-on><i className="fas fa-lock text-[9px] mr-1" />{s}</span>)}
          </div>
        </div>
      )}

      <p className="eyebrow mb-2">De la clase ({cls.name})</p>
      <div className="flex flex-wrap gap-2">
        {classPool.map((s) => {
          const on = b.skills.includes(s);
          const ab = SKILLS.find((x) => x.name === s)?.ability;
          return (
            <button key={s} className="chip" data-on={on} onClick={() => toggle(s)}
              disabled={!on && b.skills.length >= need}
              style={{ opacity: !on && b.skills.length >= need ? 0.4 : 1 }}>
              {s} <span className="opacity-60">{ABILITIES.find((a) => a.key === ab)?.abbr}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============================ PASO 6: RESUMEN ============================ */
function StepSummary({ b, set, finalScores, hp, allSkills, onCopy, onReset }:
  { b: Build; set: (p: Partial<Build>) => void; finalScores: Record<AbilityKey, number>; hp: number; allSkills: string[]; onCopy: () => void; onReset: () => void }) {
  const species = b.species ? getSpecies(b.species) : undefined;
  const cls = b.cls ? getClass(b.cls) : undefined;
  const bg = b.background ? getBackground(b.background) : undefined;
  return (
    <div>
      <h2 className="font-display text-xl font-bold mb-1" style={{ color: "var(--color-parch)" }}>Tu héroe está listo</h2>
      <p className="text-sm mb-6" style={{ color: "var(--color-muted)" }}>Revisa la ficha y cópiala para tu mesa.</p>
      <div className="panel p-6">
        <p className="font-display text-2xl font-extrabold gold-text mb-1">{b.name || "Personaje sin nombre"}</p>
        <p className="font-ui text-[13px] font-semibold mb-5" style={{ color: "var(--color-muted)" }}>
          {species?.name}{b.lineage ? ` · ${b.lineage}` : ""} · {cls?.name}{b.subclass ? ` · ${b.subclass}` : ""} · {bg?.name}
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-6">
          {ABILITIES.map((a) => (
            <div key={a.key} className="panel-raised py-3 text-center">
              <p className="eyebrow mb-1">{a.abbr}</p>
              <p className="font-display text-2xl font-extrabold" style={{ color: "var(--color-arcane-bright)" }}>{finalScores[a.key]}</p>
              <p className="font-ui text-[11px] font-bold" style={{ color: "var(--color-muted)" }}>{fmtMod(abilityMod(finalScores[a.key]))}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-4 mb-6">
          <Stat icon="fa-heart" label="Puntos de golpe" value={hp || "—"} color="var(--color-ember)" />
          <Stat icon="fa-shield-halved" label="Competencia" value="+2" color="var(--color-bronze)" />
          <Stat icon="fa-dice-d20" label="Dado de golpe" value={cls ? `d${cls.hitDie}` : "—"} color="var(--color-arcane)" />
        </div>
        <p className="eyebrow mb-2">Pericias</p>
        <div className="flex flex-wrap gap-2">
          {allSkills.length ? allSkills.map((s) => <span key={s} className="chip" data-on>{s}</span>) : <span className="text-sm" style={{ color: "var(--color-dim)" }}>—</span>}
        </div>
      </div>
      <div className="panel p-6 mt-5">
        <label className="eyebrow block mb-1.5" htmlFor="hero-lore">
          <i className="fas fa-feather-pointed mr-1.5" style={{ color: "var(--color-bronze)" }} />Historia del personaje
        </label>
        <p className="text-[13px] mb-3" style={{ color: "var(--color-muted)" }}>Su pasado, motivaciones, secretos… (opcional). Lo verá el DM en las fichas del grupo.</p>
        <textarea
          id="hero-lore"
          value={b.lore}
          onChange={(e) => set({ lore: e.target.value })}
          rows={10}
          maxLength={12000}
          placeholder="Nacido en las brumas de Pleabruma, juré no volver a…"
          className="w-full bg-[var(--color-night)] rounded-lg px-4 py-3 font-body text-[15px] leading-relaxed outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)] resize-y"
          style={{ color: "var(--color-warm)", minHeight: "180px" }}
        />
        <p className="text-right text-[11px] mt-1" style={{ color: "var(--color-dim)" }}>{b.lore.length}/12000</p>
      </div>

      <div className="flex flex-wrap gap-3 mt-5">
        <button className="btn-gold" onClick={onCopy}><i className="fas fa-copy mr-2" />Copiar hoja</button>
        <Link href="/inventario" className="btn-ghost inline-block"><i className="fas fa-bag-shopping mr-2" />Ir al inventario</Link>
        <button className="btn-ghost" onClick={onReset}><i className="fas fa-rotate-left mr-2" />Empezar de nuevo</button>
      </div>
    </div>
  );
}

/* ============================ AUXILIARES ============================ */
function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="eyebrow mb-1">{label}</p>
      <p className="font-ui text-[13px] font-semibold" style={{ color: "var(--color-warm)" }}>{value}</p>
    </div>
  );
}
function Stat({ icon, label, value, color }: { icon: string; label: string; value: string | number; color: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <i className={`fas ${icon} text-lg`} style={{ color }} />
      <div>
        <p className="eyebrow !text-[9px]">{label}</p>
        <p className="font-display font-extrabold" style={{ color: "var(--color-parch)" }}>{value}</p>
      </div>
    </div>
  );
}
function Empty({ msg }: { msg: string }) {
  return <div className="panel p-8 text-center" style={{ color: "var(--color-dim)" }}><i className="fas fa-triangle-exclamation mr-2" />{msg}</div>;
}
