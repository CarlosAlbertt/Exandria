"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/SessionProvider";
import { loadActiveCharacter, saveCharacter, createCharacter, listCharacters, type Build } from "@/lib/character";
import { canCreate, type CharSlot } from "@/lib/archive";
import { getSpecies, REGIONS, regionSpecies } from "@/data/species";
import { getClass } from "@/data/classes";
import { BACKGROUNDS, getBackground } from "@/data/backgrounds";
import RuneBar from "@/components/crear/RuneBar";
import { type RailOption } from "@/components/crear/OptionRail";
import SpeciesScene from "@/components/crear/steps/SpeciesScene";
import ClassScene from "@/components/crear/steps/ClassScene";
import BackgroundScene from "@/components/crear/steps/BackgroundScene";
import AbilitiesStep from "@/components/crear/steps/AbilitiesStep";
import SkillsScene from "@/components/crear/steps/SkillsScene";
import SummaryScene from "@/components/crear/steps/SummaryScene";
import {
  ABILITIES, AbilityKey, abilityMod, fmtMod,
  POINT_BUY_COST, POINT_BUY_BUDGET,
} from "@/data/rules";
import { ASSIGN_EMPTY, deriveAssign, isAssignComplete, loadStatRoll } from "@/lib/statRolls";

const EMPTY_SCORES: Record<AbilityKey, number> = { fue: 8, des: 8, con: 8, int: 8, sab: 8, car: 8 };
const NO_BONUS: Record<AbilityKey, number> = { fue: 0, des: 0, con: 0, int: 0, sab: 0, car: 0 };

const STEPS = ["Especie", "Clase", "Trasfondo", "Aptitudes", "Pericias", "Ficha"];
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
  // Seguro para empezar a persistir el borrador: solo tras haberlo LEÍDO (sin
  // sesión, del KEY; con sesión, tras la carga en nube). Sin esto, el efecto de
  // guardado se dispararía en el montaje con `b` vacío y pisaría un borrador a
  // medias antes de que la carga lo restaurase.
  const [draftReady, setDraftReady] = useState(false);
  // id de la ficha activa: sin él no se puede guardar (saveCharacter va por
  // id, no por user_id). Se rellena al cargar, o al crear la fila en el
  // primer guardado si no había ninguna activa.
  const [characterId, setCharacterId] = useState<string | null>(null);
  // Todos sus personajes: para saber si puede crear otro (límite de 3).
  const [slots, setSlots] = useState<CharSlot[]>([]);
  const [limitError, setLimitError] = useState<string | null>(null);

  // Sesión: si hay usuario, la ficha vive en la NUBE (fuente de verdad).
  const session = useSession();
  const userId = session?.id;
  const router = useRouter();
  const cloudLoaded = useRef(false);
  // Finalización en curso: evita que un doble clic en «Crear personaje» lance
  // dos createCharacter y gaste dos huecos. Ref y no estado porque onCreate la
  // lee de forma síncrona antes de que React re-renderice.
  const finalizing = useRef(false);

  // cargar / guardar en localStorage SOLO cuando NO hay sesión (modo demo).
  // Con sesión, localStorage es global del navegador y filtraría el personaje
  // de una cuenta a otra; la nube (por user_id) manda.
  useEffect(() => {
    if (!userId) {
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) setB((prev) => ({ ...prev, ...JSON.parse(raw) }));
      } catch {}
      setDraftReady(true); // sin sesión, el borrador ya está leído
    }
    setLoaded(true);
  }, [userId]);
  useEffect(() => {
    if (!draftReady) return;
    // Sin sesión: borrador en KEY. Con sesión y SIN personaje activo (creando
    // uno nuevo): borrador namespaceado por usuario, hasta que la fila se cree
    // al finalizar. Namespaceado para no filtrar el borrador de una cuenta a
    // otra en el mismo navegador. Con fila (editando), manda la nube.
    if (!userId) localStorage.setItem(KEY, JSON.stringify(b));
    else if (!characterId) localStorage.setItem(`${KEY}.${userId}`, JSON.stringify(b));
  }, [b, draftReady, userId, characterId]);

  useEffect(() => {
    if (!loaded || !userId || cloudLoaded.current) return;
    cloudLoaded.current = true;
    listCharacters(userId).then(setSlots);
    loadActiveCharacter(userId).then((row) => {
      if (!row) {
        // Sin personaje activo (nuevo, o acaba de archivar): restaura el
        // borrador de ESTE usuario si lo dejó a medias. La fila no se crea aquí.
        try {
          const raw = localStorage.getItem(`${KEY}.${userId}`);
          if (raw) setB((p) => ({ ...p, ...JSON.parse(raw) }));
        } catch {}
        setDraftReady(true); // ya leído el borrador: seguro persistir
        return;
      }
      setCharacterId(row.id);
      setDraftReady(true);
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
  // `assign` no se persiste: se deriva de `base` (la fuente de verdad), o si no
  // cuadra queda vacío y el jugador reasigna.
  useEffect(() => {
    if (!userId) return;
    loadStatRoll(userId).then((row) => {
      if (!row) return;
      setB((p) => ({
        ...p,
        statMethod: row.method,
        rolled: row.scores ?? [],
        assign: isAssignComplete(p.assign) ? p.assign : deriveAssign(p.base, row.scores ?? []),
      }));
    });
  }, [userId]);

  // La ficha (`base`) y la tirada (`rolled`) llegan de dos consultas distintas y
  // en cualquier orden. Cuando ya están las dos y `assign` sigue vacío, se
  // deriva. Solo rellena huecos: nunca pisa una asignación del jugador.
  useEffect(() => {
    if (!b.rolled.length || isAssignComplete(b.assign)) return;
    const derived = deriveAssign(b.base, b.rolled);
    if (isAssignComplete(derived)) setB((p) => ({ ...p, assign: derived }));
  }, [b.rolled, b.base, b.assign]);

  // Autoguardado con debounce en la nube. SOLO si ya existe fila, es decir,
  // editando un personaje ACTIVO. Un personaje NUEVO no se crea aquí: se crea al
  // pulsar «Crear personaje» al final (onCreate). Si se creara en el
  // autoguardado, con solo entrar en /crear se crearía un personaje vacío que
  // gasta un hueco y bloquea crear otro. El borrador del personaje nuevo vive
  // en localStorage hasta que se finaliza.
  useEffect(() => {
    if (!loaded || !userId || !cloudLoaded.current || !characterId) return;
    const t = setTimeout(() => {
      saveCharacter(characterId, {
        name: b.name, species: b.species, lineage: b.lineage, cls: b.cls, subclass: b.subclass,
        background: b.background, base: b.base, bonus: b.bonus, skills: b.skills, lore: b.lore,
      });
    }, 900);
    return () => clearTimeout(t);
  }, [loaded, userId, characterId, b.name, b.species, b.lineage, b.cls, b.subclass, b.background, b.base, b.bonus, b.skills, b.lore]);

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

  // «Empezar de nuevo» rehace el personaje, NO la tirada: `stat_rolls` es
  // inmutable en la BD (PK sin policy de update) y solo el DM puede borrarla.
  // Si limpiásemos statMethod/rolled aquí, el selector reaparecería y el insert
  // chocaría con la PK. La tirada es del jugador, no del personaje.
  function reset() {
    setB((p) => ({
      name: "", species: null, lineage: null, cls: null, subclass: null, background: null,
      base: { ...EMPTY_SCORES }, bonus: { ...NO_BONUS }, skills: [], lore: "", step: 0,
      statMethod: p.statMethod, rolled: p.rolled, assign: { ...ASSIGN_EMPTY },
    }));
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

  // Finaliza el personaje: es AQUÍ, al pulsar «Crear personaje» al final del
  // formulario, donde el personaje se crea de verdad (gasta un hueco) — no al
  // entrar en /crear ni al teclear. Si ya hay fila (editando un activo), solo
  // fija nivel 1. Si no, se crea ahora con todo el borrador.
  async function onCreate() {
    if (userId) {
      let id = characterId;
      if (!id) {
        if (finalizing.current) return; // guarda contra doble clic
        finalizing.current = true;
        const res = await createCharacter(userId);
        finalizing.current = false;
        if ("error" in res) { setLimitError(res.error); return; }
        id = res.id;
        setCharacterId(id);
      }
      await saveCharacter(id, {
        name: b.name, species: b.species, lineage: b.lineage, cls: b.cls, subclass: b.subclass,
        background: b.background, base: b.base, bonus: b.bonus, skills: b.skills, lore: b.lore, level: 1,
      });
      try { localStorage.removeItem(`${KEY}.${userId}`); } catch {}
    } else {
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

  return (
    <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-10">
      <header className="text-center mb-6">
        <p className="eyebrow mb-3">Forja de héroes · Reglas 2024</p>
        <h1 className="font-display text-3xl md:text-4xl font-extrabold gold-text">Crea tu personaje</h1>
      </header>

      {userId && !characterId && slots.length > 0 && !canCreate(slots) && (
        <div className="panel p-6 max-w-xl mx-auto text-center mb-6">
          <p className="font-display text-xl font-bold mb-2" style={{ color: "var(--color-ember)" }}>
            <i className="fas fa-triangle-exclamation mr-2" />Has llegado al límite
          </p>
          <p className="font-ui text-[13px]" style={{ color: "var(--color-muted)" }}>
            Tienes 3 personajes y ninguno en juego. Pide al DM que borre uno en
            Panel DM › Grupo para hacer sitio.
          </p>
        </div>
      )}
      {limitError && (
        <p className="font-ui text-[12px] font-bold text-center mb-4" style={{ color: "var(--color-ember)" }}>
          <i className="fas fa-circle-exclamation mr-1.5" />{limitError}
        </p>
      )}

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

      <RuneBar steps={STEPS} current={b.step} maxStep={maxStep} onGo={go} />

      {b.step === 0 && (
        <SpeciesScene
          options={speciesOptions}
          species={species}
          selected={b.species}
          lineage={b.lineage}
          onPick={pickSpecies}
          onLineage={(name) => set({ lineage: name })}
        />
      )}

      {b.step === 1 && (
        <ClassScene
          cls={cls}
          subclass={b.subclass}
          onPick={pickClass}
          onSubclass={(name) => set({ subclass: name })}
        />
      )}

      {b.step === 2 && (
        <BackgroundScene options={backgroundOptions} bg={bg} selected={b.background} onPick={pickBackground} />
      )}

      {b.step === 3 && (
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
      )}

      {b.step === 4 && <SkillsScene b={b} set={set} cls={cls} bgSkills={bgSkills} classPool={classPool} />}

      {b.step === 5 && (
        <SummaryScene b={b} set={set} finalScores={finalScores} hp={hp} allSkills={allSkills} onCopy={copySheet} onReset={reset} onCreate={onCreate} />
      )}

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
