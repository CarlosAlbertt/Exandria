"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/SessionProvider";
import { loadCharacter, saveCharacter } from "@/lib/character";
import { getSpecies, REGIONS, regionSpecies } from "@/data/species";
import { CLASSES, getClass, GROUP_LABEL } from "@/data/classes";
import { BACKGROUNDS, getBackground } from "@/data/backgrounds";
import InvocationCircle from "@/components/crear/InvocationCircle";
import OptionRail, { type RailOption } from "@/components/crear/OptionRail";
import Medallion from "@/components/crear/Medallion";
import AbilitiesStep from "@/components/crear/steps/AbilitiesStep";
import {
  ABILITIES, SKILLS, AbilityKey, abilityMod, fmtMod,
  POINT_BUY_COST, POINT_BUY_BUDGET,
} from "@/data/rules";
import { ASSIGN_EMPTY, isAssignComplete, loadStatRoll, type Assign, type StatMethod } from "@/lib/statRolls";

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
  statMethod: StatMethod | null;
  rolled: number[];   // los 6 valores (dados/array); vacío en point-buy
  assign: Assign;     // aptitud -> índice en `rolled`
};

const EMPTY_SCORES: Record<AbilityKey, number> = { fue: 8, des: 8, con: 8, int: 8, sab: 8, car: 8 };
const NO_BONUS: Record<AbilityKey, number> = { fue: 0, des: 0, con: 0, int: 0, sab: 0, car: 0 };

const STEPS = ["Especie", "Clase", "Trasfondo", "Aptitudes", "Pericias", "Resumen"];
const KEY = "taldorei.build.v1";

// Opciones del carril: derivadas de los datos estáticos, no cambian en tiempo
// de ejecución. `speciesOptions` recorre las regiones en orden para que las
// especies de una misma región queden CONSECUTIVAS (OptionRail agrupa rachas
// consecutivas de `group`).
const speciesOptions: RailOption[] = REGIONS.flatMap((r) =>
  regionSpecies(r.key).map((s) => ({
    slug: s.slug,
    name: s.name + (s.homebrew ? " · DM" : ""),
    sub: s.tagline,
    img: `/species/${s.slug}.jpg`,
    group: r.label,
  }))
);
const classOptions: RailOption[] = CLASSES.map((c) => ({
  slug: c.slug, name: c.name, sub: GROUP_LABEL[c.group], img: `/classes/${c.slug}.jpg`,
}));
const backgroundOptions: RailOption[] = BACKGROUNDS.map((g) => ({
  slug: g.slug, name: g.name, sub: g.feat,
}));

export default function CrearPage() {
  const [b, setB] = useState<Build>({
    name: "", species: null, lineage: null, cls: null, subclass: null,
    background: null, base: { ...EMPTY_SCORES }, bonus: { ...NO_BONUS }, skills: [], lore: "", step: 0,
    statMethod: null, rolled: [], assign: { ...ASSIGN_EMPTY },
  });
  const [loaded, setLoaded] = useState(false);

  // Sesión: si hay usuario, la ficha vive en la NUBE (fuente de verdad).
  const session = useSession();
  const userId = session?.id;
  const router = useRouter();
  const cloudLoaded = useRef(false);

  // cargar / guardar en localStorage SOLO cuando NO hay sesión (modo demo).
  // Con sesión, localStorage es global del navegador y filtraría el personaje
  // de una cuenta a otra; la nube (por user_id) manda.
  useEffect(() => {
    if (!userId) {
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) setB((prev) => ({ ...prev, ...JSON.parse(raw) }));
      } catch {}
    }
    setLoaded(true);
  }, [userId]);
  useEffect(() => {
    if (loaded && !userId) localStorage.setItem(KEY, JSON.stringify(b));
  }, [b, loaded, userId]);

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

  // Fase K: si el jugador YA tiene tirada registrada, el método queda fijado.
  useEffect(() => {
    if (!userId) return;
    loadStatRoll(userId).then((row) => {
      if (!row) return;
      setB((p) => ({ ...p, statMethod: row.method, rolled: row.scores ?? [] }));
    });
  }, [userId]);

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

  // Qué aptitudes puede mejorar el +3 del trasfondo (Fase K: AbilitiesStep).
  const canBonus = useMemo(() => {
    const out = {} as Record<AbilityKey, boolean>;
    ABILITIES.forEach((a) => (out[a.key] = !!bg?.abilities.includes(a.key)));
    return out;
  }, [bg]);

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
    setB({ name: "", species: null, lineage: null, cls: null, subclass: null, background: null, base: { ...EMPTY_SCORES }, bonus: { ...NO_BONUS }, skills: [], lore: "", step: 0, statMethod: null, rolled: [], assign: { ...ASSIGN_EMPTY } });
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

  // Finaliza el personaje: asegura nivel 1 y abre la hoja interactiva.
  function onCreate() {
    if (userId) saveCharacter(userId, { level: 1 });
    else {
      try {
        const prev = JSON.parse(localStorage.getItem("taldorei.sheet.v1") ?? "{}");
        localStorage.setItem("taldorei.sheet.v1", JSON.stringify({ ...prev, level: prev.level ?? 1 }));
      } catch {
        localStorage.setItem("taldorei.sheet.v1", JSON.stringify({ level: 1 }));
      }
    }
    router.push("/personaje");
  }

  // Cada paso debe completarse antes de poder avanzar (o saltar) más allá.
  const stepDone = [
    !!b.name.trim() && !!species && (!species.lineages || !!b.lineage),
    !!cls && !!b.subclass,
    !!bg,
    // Aptitudes: point-buy valida presupuesto; dados/array exigen asignar los
    // 6 valores. En ambos casos hay que repartir los +3 del trasfondo.
    (b.statMethod === "pointbuy"
      ? pointsSpent <= POINT_BUY_BUDGET
      : b.statMethod !== null && isAssignComplete(b.assign)) && bonusTotal(b.bonus) === 3,
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
      ? (!b.statMethod
          ? "Elige cómo obtienes tus aptitudes"
          : b.statMethod !== "pointbuy" && !isAssignComplete(b.assign)
          ? "Asigna los 6 valores a tus aptitudes"
          : bonusTotal(b.bonus) !== 3
          ? "Reparte los +3 del trasfondo"
          : null)
      : b.step === 4
      ? (cls && classSkills.length !== cls.skillCount ? `Elige tus pericias (${classSkills.length}/${cls.skillCount})` : null)
      : null;

  // Si el estado guardado apunta a un paso aún no alcanzable, retrocede.
  useEffect(() => {
    if (loaded && b.step > maxStep) setB((p) => ({ ...p, step: maxStep }));
  }, [loaded, b.step, maxStep]);

  const pickSpecies = (slug: string) => set({ species: slug, lineage: null });
  const pickClass = (slug: string) => set({ cls: slug, subclass: null, skills: [] });
  const pickBackground = (slug: string) => set({ background: slug, bonus: { ...NO_BONUS } });

  // Medallón central: retrato + nombre de la selección actual del paso.
  const medallionSrc =
    b.step === 0 ? (species?.image ?? null) :
    b.step === 1 ? (b.cls ? `/classes/${b.cls}.jpg` : null) :
    null;
  const medallionCaption =
    b.step === 0 ? (species?.name ?? null) :
    b.step === 1 ? (cls?.name ?? null) :
    b.step === 2 ? (bg?.name ?? null) :
    b.step === 5 ? (b.name.trim() || null) :
    (cls?.name ?? species?.name ?? null);

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <header className="text-center mb-6">
        <p className="eyebrow mb-3">Forja de héroes · Reglas 2024</p>
        <h1 className="font-display text-3xl md:text-4xl font-extrabold gold-text">Crea tu personaje</h1>
      </header>

      <div className="mb-6 max-w-md mx-auto">
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

      <div className="crear-grid">
        <InvocationCircle steps={STEPS} current={b.step} maxStep={maxStep} onGo={go}>
          <Medallion src={medallionSrc} caption={medallionCaption} />
        </InvocationCircle>

        <div>
          {b.step === 0 && (
            <>
              <OptionRail title="Especies de Exandria" options={speciesOptions} selected={b.species} onPick={pickSpecies} />
              {species?.lineages && (
                <LineagePicker lineages={species.lineages} value={b.lineage} onPick={(name) => set({ lineage: name })} />
              )}
            </>
          )}

          {b.step === 1 && (
            <>
              <OptionRail title="Clases" options={classOptions} selected={b.cls} onPick={pickClass} />
              {cls && (
                <SubclassPicker label={cls.subclassLabel} subclasses={cls.subclasses} value={b.subclass} onPick={(name) => set({ subclass: name })} />
              )}
            </>
          )}

          {b.step === 2 && (
            <OptionRail title="Trasfondos" options={backgroundOptions} selected={b.background} onPick={pickBackground} />
          )}

          {b.step === 3 && (
            <div className="p-3">
              <AbilitiesStep
                userId={userId}
                method={b.statMethod}
                rolled={b.rolled}
                assign={b.assign}
                base={b.base}
                bonus={b.bonus}
                canBonus={canBonus}
                onMethod={(m) => set({ statMethod: m, rolled: [], assign: { ...ASSIGN_EMPTY } })}
                onRolled={(scores) => set({ rolled: scores, assign: { ...ASSIGN_EMPTY } })}
                onAssign={(a) => set({ assign: a })}
                onBase={(k, v) => set({ base: { ...b.base, [k]: v } })}
                onBonus={(k, v) => set({ bonus: { ...b.bonus, [k]: v } })}
              />
            </div>
          )}

          {b.step === 4 && (
            <div className="p-3">
              <StepSkills b={b} set={set} cls={cls} bgSkills={bgSkills} classPool={classPool} />
            </div>
          )}

          {b.step === 5 && (
            <div className="p-3">
              <StepSummary b={b} set={set} finalScores={finalScores} hp={hp} allSkills={allSkills} onCopy={copySheet} onReset={reset} onCreate={onCreate} />
            </div>
          )}
        </div>
      </div>

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

/* ================== SUB-ELECCIÓN: LINAJE (bajo el carril de especies) ================== */
function LineagePicker({ lineages, value, onPick }: {
  lineages: { name: string; perk: string; homebrew?: boolean }[];
  value: string | null;
  onPick: (name: string) => void;
}) {
  return (
    <div className="mt-1 px-1">
      <div className="rail-group">Linaje *</div>
      {lineages.map((l) => (
        <button
          key={l.name}
          type="button"
          className={`rail-opt${value === l.name ? " sel" : ""}`}
          onClick={() => onPick(l.name)}
          aria-pressed={value === l.name}
        >
          <div className="rail-thumb"><span className="ph">✦</span></div>
          <span>
            <span className="rail-name">{l.name}{l.homebrew ? " · DM" : ""}</span>
            <br /><span className="rail-sub">{l.perk}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

/* ================== SUB-ELECCIÓN: SUBCLASE (bajo el carril de clases) ================== */
function SubclassPicker({ label, subclasses, value, onPick }: {
  label: string;
  subclasses: { name: string; blurb: string }[];
  value: string | null;
  onPick: (name: string) => void;
}) {
  return (
    <div className="mt-1 px-1">
      <div className="rail-group">{label} *</div>
      {subclasses.map((sc) => (
        <button
          key={sc.name}
          type="button"
          className={`rail-opt${value === sc.name ? " sel" : ""}`}
          onClick={() => onPick(sc.name)}
          aria-pressed={value === sc.name}
        >
          <div className="rail-thumb"><span className="ph">◈</span></div>
          <span>
            <span className="rail-name">{sc.name}</span>
            <br /><span className="rail-sub">{sc.blurb}</span>
          </span>
        </button>
      ))}
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
function StepSummary({ b, set, finalScores, hp, allSkills, onCopy, onReset, onCreate }:
  { b: Build; set: (p: Partial<Build>) => void; finalScores: Record<AbilityKey, number>; hp: number; allSkills: string[]; onCopy: () => void; onReset: () => void; onCreate: () => void }) {
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
        <button className="btn-gold" onClick={onCreate}><i className="fas fa-user-plus mr-2" />Crear personaje</button>
        <button className="btn-ghost" onClick={onCopy}><i className="fas fa-copy mr-2" />Copiar hoja</button>
        <Link href="/personaje" className="btn-ghost inline-block"><i className="fas fa-scroll mr-2" />Ir a la ficha</Link>
        <button className="btn-ghost" onClick={onReset}><i className="fas fa-rotate-left mr-2" />Empezar de nuevo</button>
      </div>
    </div>
  );
}

/* ============================ AUXILIARES ============================ */
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
