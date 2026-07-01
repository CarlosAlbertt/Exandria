"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SPECIES, getSpecies } from "@/data/species";
import { CLASSES, getClass, GROUP_ACCENT, GROUP_LABEL } from "@/data/classes";
import { BACKGROUNDS, getBackground } from "@/data/backgrounds";
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
  step: number;
};

const EMPTY_SCORES: Record<AbilityKey, number> = { fue: 8, des: 8, con: 8, int: 8, sab: 8, car: 8 };
const NO_BONUS: Record<AbilityKey, number> = { fue: 0, des: 0, con: 0, int: 0, sab: 0, car: 0 };

const STEPS = ["Especie", "Clase", "Trasfondo", "Aptitudes", "Pericias", "Resumen"];
const KEY = "taldorei.build.v1";

export default function CrearPage() {
  const [b, setB] = useState<Build>({
    name: "", species: null, lineage: null, cls: null, subclass: null,
    background: null, base: { ...EMPTY_SCORES }, bonus: { ...NO_BONUS }, skills: [], step: 0,
  });
  const [loaded, setLoaded] = useState(false);

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
    setB({ name: "", species: null, lineage: null, cls: null, subclass: null, background: null, base: { ...EMPTY_SCORES }, bonus: { ...NO_BONUS }, skills: [], step: 0 });
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

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <header className="text-center mb-8">
        <p className="eyebrow mb-3">Forja de héroes · Reglas 2024</p>
        <h1 className="font-display text-3xl md:text-4xl font-extrabold gold-text">Crea tu personaje</h1>
      </header>

      {/* PROGRESO */}
      <ol className="flex items-center justify-center gap-1 sm:gap-2 mb-10 flex-wrap">
        {STEPS.map((s, i) => {
          const done = stepDone[i] && i < b.step;
          const cur = i === b.step;
          const locked = i > maxStep;
          return (
            <li key={s} className="flex items-center">
              <button
                onClick={() => go(i)}
                disabled={locked}
                title={locked ? "Completa los pasos anteriores" : undefined}
                className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg font-ui text-[12px] font-bold transition-colors disabled:cursor-not-allowed"
                style={{
                  color: cur ? "var(--color-ink)" : done ? "var(--color-bronze-bright)" : "var(--color-dim)",
                  background: cur ? "var(--color-bronze)" : "transparent",
                  border: `1px solid ${cur || done ? "var(--color-bronze)" : "var(--color-line)"}`,
                  opacity: locked ? 0.45 : 1,
                }}
              >
                {locked ? <i className="fas fa-lock text-[9px]" /> : done ? <i className="fas fa-check text-[10px]" /> : <span className="hidden sm:inline">{i + 1}.</span>} {s}
              </button>
              {i < STEPS.length - 1 && <span className="w-3 sm:w-5 h-px" style={{ background: "var(--color-line)" }} />}
            </li>
          );
        })}
      </ol>

      <div className="grid lg:grid-cols-[1fr_300px] gap-8">
        {/* CONTENIDO DEL PASO */}
        <section className="reveal" key={b.step}>
          {b.step === 0 && <StepSpecies b={b} set={set} />}
          {b.step === 1 && <StepClass b={b} set={set} />}
          {b.step === 2 && <StepBackground b={b} set={set} />}
          {b.step === 3 && <StepAbilities b={b} set={set} pointsSpent={pointsSpent} finalScores={finalScores} />}
          {b.step === 4 && <StepSkills b={b} set={set} cls={cls} bgSkills={bgSkills} classPool={classPool} />}
          {b.step === 5 && <StepSummary b={b} finalScores={finalScores} hp={hp} allSkills={allSkills} onCopy={copySheet} onReset={reset} />}

          {/* NAV */}
          <div className="flex items-center justify-between gap-3 mt-8 flex-wrap">
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
        </section>

        {/* HOJA EN VIVO */}
        <aside className="lg:sticky lg:top-24 h-fit">
          <LiveSheet b={b} set={set} species={species} cls={cls} bg={bg} finalScores={finalScores} hp={hp} allSkills={allSkills} onReset={reset} />
        </aside>
      </div>
    </main>
  );
}

function bonusTotal(bonus: Record<AbilityKey, number>) {
  return ABILITIES.reduce((s, a) => s + (bonus[a.key] ?? 0), 0);
}

/* ============================ PASO 1: ESPECIE ============================ */
function StepSpecies({ b, set }: { b: Build; set: (p: Partial<Build>) => void }) {
  const species = b.species ? getSpecies(b.species) : undefined;
  const needsLineage = !!species?.lineages && !b.lineage;
  return (
    <div>
      {/* Nombre del héroe (obligatorio) */}
      <div className="panel-raised p-5 mb-6" style={{ borderColor: !b.name.trim() ? "color-mix(in srgb, var(--color-ember) 45%, var(--color-line))" : "var(--color-line)" }}>
        <label className="eyebrow block mb-2" htmlFor="hero-name">
          <i className="fas fa-signature mr-1.5" style={{ color: "var(--color-bronze)" }} />Nombre de tu héroe <span style={{ color: "var(--color-ember)" }}>*</span>
        </label>
        <input
          id="hero-name"
          value={b.name}
          onChange={(e) => set({ name: e.target.value })}
          placeholder="Ej.: Vex'ahlia, Grog, Percival…"
          maxLength={40}
          className="w-full bg-[var(--color-night)] rounded-lg px-4 py-2.5 font-display text-lg font-bold outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)] transition-colors"
          style={{ color: "var(--color-parch)" }}
        />
      </div>

      <h2 className="font-display text-xl font-bold mb-1" style={{ color: "var(--color-parch)" }}>Elige tu especie</h2>
      <p className="text-sm mb-6" style={{ color: "var(--color-muted)" }}>Define tu herencia, tamaño y rasgos innatos.</p>
      <div className="grid sm:grid-cols-2 gap-4">
        {SPECIES.map((s) => (
          <button key={s.slug} className="pick-card p-5 text-left" data-selected={b.species === s.slug}
            style={{ ["--accent" as string]: "var(--color-arcane)", ["--glow" as string]: "rgba(69,199,189,0.3)" }}
            onClick={() => set({ species: s.slug, lineage: null })}>
            <div className="flex items-center justify-between gap-2 mb-1">
              <h3 className="font-display text-lg font-bold" style={{ color: "var(--color-parch)" }}>{s.name}</h3>
              <span className="font-ui text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                style={{ color: s.lineages ? "var(--color-bronze)" : "var(--color-dim)", border: `1px solid ${s.lineages ? "var(--color-bronze)" : "var(--color-line)"}55` }}>
                {s.lineages ? `${s.lineages.length} linajes` : "linaje único"}
              </span>
            </div>
            <p className="font-ui text-[11px] font-semibold tracking-wide mb-2" style={{ color: "var(--color-arcane)" }}>
              {s.size} · {s.speed} m · {s.tagline}
            </p>
            <p style={{ color: "var(--color-muted)", fontSize: "13.5px", lineHeight: 1.5 }}>{s.blurb}</p>
          </button>
        ))}
      </div>

      {species && (
        <div className="panel-raised p-5 mt-6">
          <p className="eyebrow mb-3">Rasgos de {species.name}</p>
          <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 mb-4">
            {species.traits.map((t) => (
              <li key={t} className="flex gap-2 text-[14px]" style={{ color: "var(--color-warm)" }}>
                <i className="fas fa-gem text-[10px] mt-1.5" style={{ color: "var(--color-arcane)" }} />{t}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Subraza / linaje: panel propio y obligatorio */}
      {species?.lineages && (
        <div className="panel-raised p-5 mt-4" style={{ borderColor: needsLineage ? "color-mix(in srgb, var(--color-ember) 45%, var(--color-line))" : "color-mix(in srgb, var(--color-primitivo) 40%, var(--color-line))" }}>
          <p className="eyebrow mb-3">
            <i className={`fas ${needsLineage ? "fa-circle-exclamation" : "fa-check"} mr-1.5`} style={{ color: needsLineage ? "var(--color-ember)" : "var(--color-primitivo)" }} />
            Elige el linaje de tu {species.name.toLowerCase()} <span style={{ color: "var(--color-ember)" }}>*</span>
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {species.lineages.map((l) => (
              <button key={l.name} className="pick-card p-4 text-left" data-selected={b.lineage === l.name}
                style={{ ["--accent" as string]: "var(--color-bronze)", ["--glow" as string]: "rgba(201,163,92,0.3)" }}
                onClick={() => set({ lineage: l.name })}>
                <p className="font-display font-bold text-[15px] mb-1" style={{ color: "var(--color-parch)" }}>{l.name}</p>
                <p style={{ color: "var(--color-muted)", fontSize: "13px", lineHeight: 1.45 }}>{l.perk}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================ PASO 2: CLASE ============================ */
function StepClass({ b, set }: { b: Build; set: (p: Partial<Build>) => void }) {
  const cls = b.cls ? getClass(b.cls) : undefined;
  return (
    <div>
      <h2 className="font-display text-xl font-bold mb-1" style={{ color: "var(--color-parch)" }}>Elige tu clase</h2>
      <p className="text-sm mb-6" style={{ color: "var(--color-muted)" }}>Tu vocación: cómo luchas, lanzas magia y creces.</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CLASSES.map((c) => {
          const accent = GROUP_ACCENT[c.group];
          return (
            <button key={c.slug} className="pick-card p-5 text-left" data-selected={b.cls === c.slug}
              style={{ ["--accent" as string]: accent, ["--glow" as string]: "rgba(224,132,60,0.25)" }}
              onClick={() => set({ cls: c.slug, subclass: null, skills: [] })}>
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-display text-lg font-bold" style={{ color: "var(--color-parch)" }}>{c.name}</h3>
                <span className="font-ui text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: accent, border: `1px solid ${accent}55` }}>{GROUP_LABEL[c.group]}</span>
              </div>
              <p className="font-ui text-[11px] font-semibold mb-2" style={{ color: accent }}>d{c.hitDie} · {c.tagline}</p>
              <p style={{ color: "var(--color-muted)", fontSize: "13.5px", lineHeight: 1.5 }}>{c.blurb}</p>
            </button>
          );
        })}
      </div>

      {cls && (
        <div className="panel-raised p-5 mt-6" style={{ ["--accent" as string]: GROUP_ACCENT[cls.group] }}>
          <div className="grid sm:grid-cols-3 gap-3 mb-5">
            <Fact label="Dado de golpe" value={`d${cls.hitDie}`} />
            <Fact label="Aptitud principal" value={cls.primary.map((p) => ABILITIES.find((a) => a.key === p)!.abbr).join(" / ")} />
            <Fact label="Salvaciones" value={cls.saves.map((p) => ABILITIES.find((a) => a.key === p)!.abbr).join(" / ")} />
          </div>
          <p className="eyebrow mb-2">{cls.subclassLabel}</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {cls.subclasses.map((sc) => (
              <button key={sc.name} className="pick-card p-4 text-left" data-selected={b.subclass === sc.name}
                style={{ ["--accent" as string]: GROUP_ACCENT[cls.group], ["--glow" as string]: "rgba(106,169,240,0.25)" }}
                onClick={() => set({ subclass: sc.name })}>
                <p className="font-display font-bold text-[15px] mb-1" style={{ color: "var(--color-parch)" }}>{sc.name}</p>
                <p style={{ color: "var(--color-muted)", fontSize: "13px", lineHeight: 1.45 }}>{sc.blurb}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================ PASO 3: TRASFONDO ============================ */
function StepBackground({ b, set }: { b: Build; set: (p: Partial<Build>) => void }) {
  const bg = b.background ? getBackground(b.background) : undefined;
  return (
    <div>
      <h2 className="font-display text-xl font-bold mb-1" style={{ color: "var(--color-parch)" }}>Elige tu trasfondo</h2>
      <p className="text-sm mb-6" style={{ color: "var(--color-muted)" }}>Tu pasado otorga aptitudes, una dote de origen, pericias y herramientas.</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {BACKGROUNDS.map((g) => (
          <button key={g.slug} className="pick-card p-5 text-left" data-selected={b.background === g.slug}
            style={{ ["--accent" as string]: "var(--color-bronze)", ["--glow" as string]: "rgba(201,163,92,0.3)" }}
            onClick={() => set({ background: g.slug, bonus: { ...NO_BONUS } })}>
            <h3 className="font-display text-lg font-bold mb-1" style={{ color: "var(--color-parch)" }}>{g.name}</h3>
            <p className="font-ui text-[11px] font-semibold mb-2" style={{ color: "var(--color-bronze)" }}>
              <i className="fas fa-star mr-1" />{g.feat}
            </p>
            <p style={{ color: "var(--color-muted)", fontSize: "13.5px", lineHeight: 1.5 }}>{g.blurb}</p>
          </button>
        ))}
      </div>
      {bg && (
        <div className="panel-raised p-5 mt-6 grid sm:grid-cols-3 gap-3">
          <Fact label="Pericias" value={bg.skills.join(", ")} />
          <Fact label="Herramienta" value={bg.tool} />
          <Fact label="Dote de origen" value={bg.feat} />
        </div>
      )}
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
function StepSummary({ b, finalScores, hp, allSkills, onCopy, onReset }:
  { b: Build; finalScores: Record<AbilityKey, number>; hp: number; allSkills: string[]; onCopy: () => void; onReset: () => void }) {
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
      <div className="flex flex-wrap gap-3 mt-5">
        <button className="btn-gold" onClick={onCopy}><i className="fas fa-copy mr-2" />Copiar hoja</button>
        <Link href="/inventario" className="btn-ghost inline-block"><i className="fas fa-bag-shopping mr-2" />Ir al inventario</Link>
        <button className="btn-ghost" onClick={onReset}><i className="fas fa-rotate-left mr-2" />Empezar de nuevo</button>
      </div>
    </div>
  );
}

/* ============================ HOJA EN VIVO ============================ */
function LiveSheet({ b, set, species, cls, bg, finalScores, hp, allSkills, onReset }: any) {
  return (
    <div className="panel p-5">
      <input
        value={b.name}
        onChange={(e) => set({ name: e.target.value })}
        placeholder="Nombre del personaje"
        className="w-full bg-transparent font-display text-lg font-bold mb-1 outline-none border-b border-[var(--color-line)] focus:border-[var(--color-bronze)] pb-1 transition-colors"
        style={{ color: "var(--color-parch)" }}
      />
      <p className="font-ui text-[12px] font-semibold mb-4" style={{ color: "var(--color-muted)" }}>
        {species?.name ?? "—"} · {cls?.name ?? "—"} · {bg?.name ?? "—"}
      </p>
      <div className="grid grid-cols-3 gap-1.5 mb-4">
        {ABILITIES.map((a) => (
          <div key={a.key} className="panel-raised py-2 text-center">
            <p className="eyebrow !text-[9px] mb-0.5">{a.abbr}</p>
            <p className="font-display text-lg font-extrabold" style={{ color: "var(--color-warm)" }}>{finalScores[a.key]}</p>
            <p className="font-ui text-[10px] font-bold" style={{ color: "var(--color-dim)" }}>{fmtMod(abilityMod(finalScores[a.key]))}</p>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-center mb-4">
        <div><p className="eyebrow !text-[9px]">PG</p><p className="font-display font-extrabold" style={{ color: "var(--color-ember)" }}>{hp || "—"}</p></div>
        <div><p className="eyebrow !text-[9px]">Comp.</p><p className="font-display font-extrabold" style={{ color: "var(--color-bronze)" }}>+2</p></div>
        <div><p className="eyebrow !text-[9px]">Pericias</p><p className="font-display font-extrabold" style={{ color: "var(--color-arcane)" }}>{allSkills.length}</p></div>
      </div>
      <button className="btn-ghost w-full !py-2 text-[12px]" onClick={onReset}><i className="fas fa-rotate-left mr-2" />Reiniciar</button>
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
