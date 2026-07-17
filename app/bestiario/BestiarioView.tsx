"use client";

import { useMemo, useState } from "react";
import {
  useBestiary,
  saveCustomMonster, deleteCustomMonster, setDiscovered as setMonsterDiscovered,
  pbForCr, CR_OPTIONS,
} from "@/lib/useBestiary";
import { useRole } from "@/components/SessionProvider";
import { xpForCr } from "@/data/encounters";
import { slugify } from "@/lib/slug";
import ImageUpload from "@/components/ImageUpload";
import { ALL_MONSTERS, type Monster, type MonsterAbility } from "@/data/bestiary";

const inputCls = "w-full bg-[var(--color-night)] rounded-lg px-3 py-2 font-ui text-[13px] outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)] transition-colors";
const SIZES = ["Diminuto", "Pequeño", "Mediano", "Grande", "Enorme", "Gargantuesco"];
const ABILITY_KEYS = ["fue", "des", "con", "int", "sab", "car"] as const;
const ABILITY_LABELS: Record<(typeof ABILITY_KEYS)[number], string> = { fue: "FUE", des: "DES", con: "CON", int: "INT", sab: "SAB", car: "CAR" };
const HP_FORMULA_RE = /^\d+d\d+( ?[+-] ?\d+)?$/;

const mod = (score: number) => Math.floor((score - 10) / 2);
const fmtMod = (n: number) => (n >= 0 ? `+${n}` : `${n}`);
const isCustom = (m: Monster): boolean => (m as Monster & { custom?: boolean }).custom === true;

export default function BestiarioView() {
  const { monsters, discovered, ready } = useBestiary();
  const role = useRole();
  const isDM = role === "dm";

  const [query, setQuery] = useState("");
  const [crFilter, setCrFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [playerPreview, setPlayerPreview] = useState(false); // DM: "Solo descubiertos"
  const [selected, setSelected] = useState<Monster | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Monster | null>(null);

  const restrictToDiscovered = !isDM || playerPreview;

  const types = useMemo(
    () => [...new Set(monsters.map((m) => m.type))].sort((a, b) => a.localeCompare(b, "es")),
    [monsters]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return monsters.filter((m) => {
      if (restrictToDiscovered && !discovered.has(m.slug)) return false;
      const matchesQ = q.length === 0 || m.name.toLowerCase().includes(q) || m.nameEn.toLowerCase().includes(q);
      const matchesCr = !crFilter || m.cr === crFilter;
      const matchesType = !typeFilter || m.type === typeFilter;
      return matchesQ && matchesCr && matchesType;
    });
  }, [monsters, discovered, restrictToDiscovered, query, crFilter, typeFilter]);

  const headerCount = isDM ? monsters.length : monsters.filter((m) => discovered.has(m.slug)).length;

  function openCreate() { setEditing(null); setFormOpen(true); }
  function openEdit(m: Monster) { setEditing(m); setFormOpen(true); setSelected(null); }
  function closeForm() { setFormOpen(false); setEditing(null); }

  async function handleDelete(slug: string) {
    if (!confirm("¿Borrar este monstruo personalizado? Esta acción no se puede deshacer.")) return;
    const { error } = await deleteCustomMonster(slug);
    if (!error) setSelected(null);
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-16">
      <header className="text-center mb-10 reveal">
        <p className="eyebrow mb-3">Bestiario de Exandria</p>
        <h1 className="font-display text-4xl md:text-5xl font-extrabold gold-text">Criaturas conocidas</h1>
        <p className="font-ui text-[12px] mt-3" style={{ color: "var(--color-dim)" }}>
          {headerCount} criatura{headerCount === 1 ? "" : "s"}
        </p>
      </header>

      {/* TOOLBAR */}
      <div className="panel p-4 mb-8 flex flex-col md:flex-row gap-3 md:items-center">
        <div className="relative flex-1">
          <i className="fas fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-[12px]" style={{ color: "var(--color-dim)" }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre…"
            className={inputCls}
            style={{ color: "var(--color-warm)", paddingLeft: "34px" }}
          />
        </div>
        <select value={crFilter} onChange={(e) => setCrFilter(e.target.value)} className={`${inputCls} md:w-40`} style={{ color: "var(--color-warm)" }}>
          <option value="">Todos los CR</option>
          {CR_OPTIONS.map((cr) => <option key={cr} value={cr}>CR {cr}</option>)}
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={`${inputCls} md:w-48`} style={{ color: "var(--color-warm)" }}>
          <option value="">Todos los tipos</option>
          {types.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        {isDM && (
          <div className="flex gap-2 shrink-0">
            <button
              className="chip"
              data-on={playerPreview}
              onClick={() => setPlayerPreview((v) => !v)}
              title="Ver el bestiario como lo verían los jugadores"
            >
              <i className={`fas ${playerPreview ? "fa-eye" : "fa-eye-slash"} mr-1.5`} />Solo descubiertos
            </button>
            <button className="btn-gold !py-2 !px-4 text-[12px]" onClick={openCreate}>
              <i className="fas fa-plus mr-1.5" />Añadir monstruo
            </button>
          </div>
        )}
      </div>

      {!ready ? (
        <p className="text-center italic" style={{ color: "var(--color-dim)" }}>Cargando bestiario…</p>
      ) : filtered.length === 0 ? (
        <p className="text-center italic" style={{ color: "var(--color-dim)" }}>
          {monsters.length === 0 ? "El bestiario está vacío." : "Ninguna criatura coincide con la búsqueda."}
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m) => {
            const found = discovered.has(m.slug);
            const dim = isDM && !playerPreview && !found;
            return (
              <button
                key={m.slug}
                onClick={() => setSelected(m)}
                className="panel-raised p-4 text-left transition-colors hover:border-[var(--color-bronze)]"
                style={{ opacity: dim ? 0.55 : 1 }}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-display font-bold text-[15px]" style={{ color: "var(--color-bronze-bright)" }}>
                    {m.name}
                    {dim && <i className="fas fa-eye-slash ml-2 text-[11px]" style={{ color: "var(--color-dim)" }} title="No descubierto" />}
                  </h3>
                  <span className="font-ui text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ color: "var(--color-arcane-bright)", border: "1px solid var(--color-arcane)55" }}>
                    CR {m.cr}
                  </span>
                </div>
                <p className="font-ui text-[11px] italic mb-1.5" style={{ color: "var(--color-dim)" }}>{m.nameEn}</p>
                <p className="font-ui text-[11px] mb-2" style={{ color: "var(--color-muted)" }}>{m.size} · {m.type}</p>
                <p className="text-[13px]" style={{ color: "var(--color-warm)", lineHeight: 1.5 }}>{m.blurb}</p>
                {isDM && isCustom(m) && <span className="chip mt-2 inline-block" data-on="true">personalizado</span>}
              </button>
            );
          })}
        </div>
      )}

      {selected && (
        <StatblockModal
          monster={selected}
          isDM={isDM}
          discovered={discovered.has(selected.slug)}
          onClose={() => setSelected(null)}
          onEdit={() => openEdit(selected)}
          onDelete={() => handleDelete(selected.slug)}
        />
      )}

      {formOpen && (
        <MonsterForm
          editing={editing}
          onClose={closeForm}
        />
      )}
    </main>
  );
}

/* ------------------------------ STATBLOCK ------------------------------ */

function StatblockModal({
  monster, isDM, discovered, onClose, onEdit, onDelete,
}: {
  monster: Monster; isDM: boolean; discovered: boolean;
  onClose: () => void; onEdit: () => void; onDelete: () => void;
}) {
  const [busy, setBusy] = useState(false);

  async function toggleDiscovered() {
    setBusy(true);
    await setMonsterDiscovered(monster.slug, !discovered);
    setBusy(false);
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80" onClick={onClose}>
      <div className="panel max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 mb-1">
          <div>
            <h2 className="font-display text-2xl font-bold" style={{ color: "var(--color-bronze-bright)" }}>{monster.name}</h2>
            <p className="font-ui text-[11px] italic" style={{ color: "var(--color-dim)" }}>{monster.nameEn}</p>
          </div>
          <button className="btn-ghost !py-1.5 !px-3 text-[11px]" onClick={onClose} aria-label="Cerrar"><i className="fas fa-xmark" /></button>
        </div>
        <p className="font-ui text-[12px] italic mb-4" style={{ color: "var(--color-muted)" }}>
          {monster.size}, {monster.type} · {monster.alignment}
        </p>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <StatBox label="CA" value={String(monster.ac)} sub={fmtMod(monster.initiative) + " iniciativa"} />
          <StatBox label="PG" value={String(monster.hp)} sub={monster.hpFormula} />
          <StatBox label="Velocidad" value={monster.speeds} />
        </div>

        <div className="grid grid-cols-6 gap-1.5 mb-4">
          {ABILITY_KEYS.map((k) => (
            <div key={k} className="panel-raised text-center py-2">
              <p className="font-ui text-[10px] font-bold" style={{ color: "var(--color-dim)" }}>{ABILITY_LABELS[k]}</p>
              <p className="font-display font-bold text-[15px]" style={{ color: "var(--color-warm)" }}>{monster.abilities[k]}</p>
              <p className="font-ui text-[11px]" style={{ color: "var(--color-muted)" }}>{fmtMod(mod(monster.abilities[k]))}</p>
            </div>
          ))}
        </div>

        <div className="space-y-1 mb-4 text-[13px]" style={{ color: "var(--color-warm)" }}>
          {monster.saves && <p><strong style={{ color: "var(--color-bronze-bright)" }}>Salvaciones. </strong>{monster.saves}</p>}
          {monster.skills && <p><strong style={{ color: "var(--color-bronze-bright)" }}>Habilidades. </strong>{monster.skills}</p>}
          {monster.resistances && <p><strong style={{ color: "var(--color-bronze-bright)" }}>Resistencias. </strong>{monster.resistances}</p>}
          {monster.immunities && <p><strong style={{ color: "var(--color-bronze-bright)" }}>Inmunidades. </strong>{monster.immunities}</p>}
          {monster.vulnerabilities && <p><strong style={{ color: "var(--color-bronze-bright)" }}>Vulnerabilidades. </strong>{monster.vulnerabilities}</p>}
          {monster.gear && <p><strong style={{ color: "var(--color-bronze-bright)" }}>Equipo. </strong>{monster.gear}</p>}
          <p><strong style={{ color: "var(--color-bronze-bright)" }}>Sentidos. </strong>{monster.senses}</p>
          <p><strong style={{ color: "var(--color-bronze-bright)" }}>Idiomas. </strong>{monster.languages}</p>
          <p><strong style={{ color: "var(--color-bronze-bright)" }}>CR. </strong>{monster.cr} (XP {monster.xp}; BC {fmtMod(monster.pb)})</p>
          {monster.habitat && <p><strong style={{ color: "var(--color-bronze-bright)" }}>Hábitat. </strong>{monster.habitat}</p>}
          {monster.treasure && <p><strong style={{ color: "var(--color-bronze-bright)" }}>Tesoro. </strong>{monster.treasure}</p>}
        </div>

        {monster.image && (
          <img src={monster.image} alt={monster.name} loading="lazy"
            className="w-full max-h-72 object-cover rounded-lg border border-[var(--color-line)] mb-4" />
        )}
        <p className="text-[13px] italic mb-4" style={{ color: "var(--color-muted)" }}>{monster.blurb}</p>

        <AbilitySection title="Rasgos" items={monster.traits} />
        <AbilitySection title="Acciones" items={monster.actions} />
        <AbilitySection title="Acciones adicionales" items={monster.bonusActions} />
        <AbilitySection title="Reacciones" items={monster.reactions} />
        <AbilitySection title="Acciones legendarias" items={monster.legendary} />

        {isDM && (
          <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-[var(--color-line)]">
            <button className="btn-ghost !py-2 !px-3 text-[12px]" disabled={busy} onClick={toggleDiscovered}>
              <i className={`fas ${discovered ? "fa-eye-slash" : "fa-eye"} mr-1.5`} />{discovered ? "Marcar no descubierto" : "Marcar descubierto"}
            </button>
            {isCustom(monster) && (
              <>
                <button className="btn-ghost !py-2 !px-3 text-[12px]" onClick={onEdit}><i className="fas fa-pen mr-1.5" />Editar</button>
                <button className="btn-ghost !py-2 !px-3 text-[12px]" style={{ color: "var(--color-ember)" }} onClick={onDelete}>
                  <i className="fas fa-trash mr-1.5" />Borrar
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="panel-raised text-center py-2.5 px-2">
      <p className="font-ui text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--color-dim)" }}>{label}</p>
      <p className="font-display font-bold text-[16px]" style={{ color: "var(--color-warm)" }}>{value}</p>
      {sub && <p className="font-ui text-[11px]" style={{ color: "var(--color-muted)" }}>{sub}</p>}
    </div>
  );
}

function AbilitySection({ title, items }: { title: string; items?: MonsterAbility[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="mb-4">
      <p className="eyebrow mb-2">{title}</p>
      <div className="space-y-2">
        {items.map((a, i) => (
          <p key={i} className="text-[13px]" style={{ color: "var(--color-warm)", lineHeight: 1.5 }}>
            <strong style={{ color: "var(--color-bronze-bright)" }}>{a.name}. </strong>{a.text}
          </p>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------- FORM -------------------------------- */

type AbilityRow = { name: string; text: string };

type FormState = {
  name: string; nameEn: string; size: string; type: string; alignment: string;
  ac: string; initiative: string; hp: string; hpFormula: string; speeds: string;
  fue: string; des: string; con: string; int: string; sab: string; car: string;
  cr: string;
  saves: string; skills: string; resistances: string; immunities: string; vulnerabilities: string; gear: string;
  senses: string; languages: string;
  habitat: string; treasure: string;
  blurb: string;
  image: string;
  traits: AbilityRow[]; actions: AbilityRow[]; bonusActions: AbilityRow[]; reactions: AbilityRow[]; legendary: AbilityRow[];
};

const EMPTY_FORM: FormState = {
  name: "", nameEn: "", size: "Mediano", type: "", alignment: "",
  ac: "", initiative: "", hp: "", hpFormula: "", speeds: "",
  fue: "10", des: "10", con: "10", int: "10", sab: "10", car: "10",
  cr: CR_OPTIONS[0] ?? "0",
  saves: "", skills: "", resistances: "", immunities: "", vulnerabilities: "", gear: "",
  senses: "", languages: "—",
  habitat: "", treasure: "",
  blurb: "",
  image: "",
  traits: [], actions: [{ name: "", text: "" }], bonusActions: [], reactions: [], legendary: [],
};

function monsterToForm(m: Monster): FormState {
  return {
    name: m.name, nameEn: m.nameEn, size: m.size, type: m.type, alignment: m.alignment,
    ac: String(m.ac), initiative: String(m.initiative), hp: String(m.hp), hpFormula: m.hpFormula, speeds: m.speeds,
    fue: String(m.abilities.fue), des: String(m.abilities.des), con: String(m.abilities.con),
    int: String(m.abilities.int), sab: String(m.abilities.sab), car: String(m.abilities.car),
    cr: m.cr,
    saves: m.saves ?? "", skills: m.skills ?? "", resistances: m.resistances ?? "", immunities: m.immunities ?? "",
    vulnerabilities: m.vulnerabilities ?? "", gear: m.gear ?? "",
    senses: m.senses, languages: m.languages,
    habitat: m.habitat ?? "", treasure: m.treasure ?? "",
    blurb: m.blurb,
    image: m.image ?? "",
    traits: m.traits && m.traits.length ? m.traits : [],
    actions: m.actions && m.actions.length ? m.actions : [{ name: "", text: "" }],
    bonusActions: m.bonusActions && m.bonusActions.length ? m.bonusActions : [],
    reactions: m.reactions && m.reactions.length ? m.reactions : [],
    legendary: m.legendary && m.legendary.length ? m.legendary : [],
  };
}

function cleanRows(rows: AbilityRow[]): MonsterAbility[] {
  return rows.filter((r) => r.name.trim() && r.text.trim()).map((r) => ({ name: r.name.trim(), text: r.text.trim() }));
}

function validate(f: FormState): string | null {
  if (!f.name.trim()) return "Falta el nombre.";
  if (!f.size) return "Falta el tamaño.";
  if (!f.type.trim()) return "Falta el tipo.";
  if (!f.alignment.trim()) return "Falta el alineamiento.";

  const ac = Number(f.ac);
  if (!Number.isFinite(ac) || ac < 5 || ac > 25) return "CA fuera de rango (5-25).";
  const initiative = Number(f.initiative);
  if (!Number.isFinite(initiative)) return "Iniciativa inválida.";
  const hp = Number(f.hp);
  if (!Number.isFinite(hp) || hp <= 0) return "PG inválidos.";
  if (!HP_FORMULA_RE.test(f.hpFormula.trim())) return "Fórmula de PG inválida (ej.: 2d8+2).";
  if (!f.speeds.trim()) return "Faltan las velocidades.";

  for (const key of ABILITY_KEYS) {
    const v = Number(f[key]);
    if (!Number.isFinite(v) || v < 1 || v > 30) return `${ABILITY_LABELS[key]} fuera de rango (1-30).`;
  }

  if (!f.cr) return "Falta el CR.";
  if (!f.senses.trim()) return "Faltan los sentidos.";
  if (!f.languages.trim()) return "Faltan los idiomas.";
  if (!f.blurb.trim()) return "Falta la descripción.";
  if (f.blurb.length > 300) return "La descripción supera 300 caracteres.";
  if (cleanRows(f.actions).length < 1) return "Necesita al menos 1 acción.";
  return null;
}

function buildMonster(f: FormState, slug: string): Monster {
  const m: Monster = {
    slug,
    name: f.name.trim(),
    nameEn: f.nameEn.trim() || f.name.trim(),
    size: f.size,
    type: f.type.trim(),
    alignment: f.alignment.trim(),
    ac: Number(f.ac),
    initiative: Number(f.initiative),
    hp: Number(f.hp),
    hpFormula: f.hpFormula.trim(),
    speeds: f.speeds.trim(),
    abilities: {
      fue: Number(f.fue), des: Number(f.des), con: Number(f.con),
      int: Number(f.int), sab: Number(f.sab), car: Number(f.car),
    },
    senses: f.senses.trim(),
    languages: f.languages.trim(),
    cr: f.cr,
    xp: xpForCr(f.cr),
    pb: pbForCr(f.cr),
    actions: cleanRows(f.actions),
    blurb: f.blurb.trim(),
  };
  if (f.saves.trim()) m.saves = f.saves.trim();
  if (f.skills.trim()) m.skills = f.skills.trim();
  if (f.resistances.trim()) m.resistances = f.resistances.trim();
  if (f.immunities.trim()) m.immunities = f.immunities.trim();
  if (f.vulnerabilities.trim()) m.vulnerabilities = f.vulnerabilities.trim();
  if (f.gear.trim()) m.gear = f.gear.trim();
  if (f.habitat.trim()) m.habitat = f.habitat.trim();
  if (f.treasure.trim()) m.treasure = f.treasure.trim();
  if (f.image.trim()) m.image = f.image.trim();
  const traits = cleanRows(f.traits); if (traits.length) m.traits = traits;
  const bonusActions = cleanRows(f.bonusActions); if (bonusActions.length) m.bonusActions = bonusActions;
  const reactions = cleanRows(f.reactions); if (reactions.length) m.reactions = reactions;
  const legendary = cleanRows(f.legendary); if (legendary.length) m.legendary = legendary;
  return m;
}

function MonsterForm({ editing, onClose }: { editing: Monster | null; onClose: () => void }) {
  const [f, setF] = useState<FormState>(() => (editing ? monsterToForm(editing) : EMPTY_FORM));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const existingTypes = useMemo(
    () => [...new Set(ALL_MONSTERS.map((m) => m.type))].sort((a, b) => a.localeCompare(b, "es")),
    []
  );

  const slug = editing ? editing.slug : slugify(f.name);
  const collidesWithStatic = !editing && slug.length > 0 && ALL_MONSTERS.some((m) => m.slug === slug);
  const xpPreview = xpForCr(f.cr);
  const pbPreview = pbForCr(f.cr);

  function patch<K extends keyof FormState>(key: K, value: FormState[K]) {
    setF((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    const problem = validate(f);
    if (problem) { setErr(problem); return; }
    setBusy(true); setErr(null);
    const monster = buildMonster(f, slug);
    const { error } = await saveCustomMonster(monster);
    setBusy(false);
    if (error) setErr(error); else onClose();
  }

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/80" onClick={onClose}>
      <div className="panel max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="font-display text-xl font-bold" style={{ color: "var(--color-bronze-bright)" }}>
            {editing ? "Editar monstruo" : "Añadir monstruo"}
          </h2>
          <button className="btn-ghost !py-1.5 !px-3 text-[11px]" onClick={onClose} aria-label="Cerrar"><i className="fas fa-xmark" /></button>
        </div>

        <div className="grid sm:grid-cols-2 gap-2 mb-2">
          <input value={f.name} onChange={(e) => patch("name", e.target.value)} placeholder="Nombre (ES)" className={inputCls} style={{ color: "var(--color-warm)" }} />
          <input value={f.nameEn} onChange={(e) => patch("nameEn", e.target.value)} placeholder="Nombre original (EN, opcional)" className={inputCls} style={{ color: "var(--color-warm)" }} />
        </div>

        {collidesWithStatic && (
          <p className="text-[12px] italic mb-2" style={{ color: "var(--color-ember)" }}>
            <i className="fas fa-triangle-exclamation mr-1.5" />
            Ya existe un monstruo del manual con el slug «{slug}» ({ALL_MONSTERS.find((m) => m.slug === slug)?.name}). Al guardar, este monstruo personalizado lo sustituirá para todos.
          </p>
        )}

        <div className="grid sm:grid-cols-3 gap-2 mb-2">
          <select value={f.size} onChange={(e) => patch("size", e.target.value)} className={inputCls} style={{ color: "var(--color-warm)" }}>
            {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <input value={f.type} onChange={(e) => patch("type", e.target.value)} placeholder="Tipo (ej.: Dragón)" list="bestiario-types" className={inputCls} style={{ color: "var(--color-warm)" }} />
          <input value={f.alignment} onChange={(e) => patch("alignment", e.target.value)} placeholder="Alineamiento" className={inputCls} style={{ color: "var(--color-warm)" }} />
          <datalist id="bestiario-types">
            {existingTypes.map((t) => <option key={t} value={t} />)}
          </datalist>
        </div>

        <div className="grid sm:grid-cols-3 gap-2 mb-2">
          <input type="number" value={f.ac} onChange={(e) => patch("ac", e.target.value)} placeholder="CA" className={inputCls} style={{ color: "var(--color-warm)" }} />
          <input type="number" value={f.initiative} onChange={(e) => patch("initiative", e.target.value)} placeholder="Iniciativa (mod.)" className={inputCls} style={{ color: "var(--color-warm)" }} />
          <input type="number" value={f.hp} onChange={(e) => patch("hp", e.target.value)} placeholder="PG" className={inputCls} style={{ color: "var(--color-warm)" }} />
        </div>
        <div className="grid sm:grid-cols-2 gap-2 mb-2">
          <input value={f.hpFormula} onChange={(e) => patch("hpFormula", e.target.value)} placeholder="Fórmula de PG (ej.: 2d8+2)" className={inputCls} style={{ color: "var(--color-warm)" }} />
          <input value={f.speeds} onChange={(e) => patch("speeds", e.target.value)} placeholder="Velocidades (ej.: 9 m, vuelo 18 m)" className={inputCls} style={{ color: "var(--color-warm)" }} />
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-2">
          {ABILITY_KEYS.map((k) => (
            <div key={k}>
              <label className="font-ui text-[10px] font-bold block mb-1" style={{ color: "var(--color-dim)" }}>{ABILITY_LABELS[k]}</label>
              <input type="number" min={1} max={30} value={f[k]} onChange={(e) => patch(k, e.target.value)} className={inputCls} style={{ color: "var(--color-warm)" }} />
            </div>
          ))}
        </div>

        <div className="grid sm:grid-cols-[1fr_auto_auto] gap-2 items-end mb-3">
          <div>
            <label className="font-ui text-[10px] font-bold block mb-1" style={{ color: "var(--color-dim)" }}>CR</label>
            <select value={f.cr} onChange={(e) => patch("cr", e.target.value)} className={inputCls} style={{ color: "var(--color-warm)" }}>
              {CR_OPTIONS.map((cr) => <option key={cr} value={cr}>{cr}</option>)}
            </select>
          </div>
          <div className="panel-raised px-3 py-2 text-center">
            <p className="font-ui text-[10px] font-bold" style={{ color: "var(--color-dim)" }}>XP</p>
            <p className="font-ui text-[13px] font-bold" style={{ color: "var(--color-warm)" }}>{xpPreview}</p>
          </div>
          <div className="panel-raised px-3 py-2 text-center">
            <p className="font-ui text-[10px] font-bold" style={{ color: "var(--color-dim)" }}>BC</p>
            <p className="font-ui text-[13px] font-bold" style={{ color: "var(--color-warm)" }}>{fmtMod(pbPreview)}</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-2 mb-2">
          <input value={f.saves} onChange={(e) => patch("saves", e.target.value)} placeholder="Salvaciones (opcional)" className={inputCls} style={{ color: "var(--color-warm)" }} />
          <input value={f.skills} onChange={(e) => patch("skills", e.target.value)} placeholder="Habilidades (opcional)" className={inputCls} style={{ color: "var(--color-warm)" }} />
          <input value={f.resistances} onChange={(e) => patch("resistances", e.target.value)} placeholder="Resistencias (opcional)" className={inputCls} style={{ color: "var(--color-warm)" }} />
          <input value={f.immunities} onChange={(e) => patch("immunities", e.target.value)} placeholder="Inmunidades (opcional)" className={inputCls} style={{ color: "var(--color-warm)" }} />
          <input value={f.vulnerabilities} onChange={(e) => patch("vulnerabilities", e.target.value)} placeholder="Vulnerabilidades (opcional)" className={inputCls} style={{ color: "var(--color-warm)" }} />
          <input value={f.gear} onChange={(e) => patch("gear", e.target.value)} placeholder="Equipo (opcional)" className={inputCls} style={{ color: "var(--color-warm)" }} />
        </div>
        <div className="grid sm:grid-cols-2 gap-2 mb-2">
          <input value={f.senses} onChange={(e) => patch("senses", e.target.value)} placeholder="Sentidos" className={inputCls} style={{ color: "var(--color-warm)" }} />
          <input value={f.languages} onChange={(e) => patch("languages", e.target.value)} placeholder="Idiomas" className={inputCls} style={{ color: "var(--color-warm)" }} />
        </div>
        <div className="grid sm:grid-cols-2 gap-2 mb-3">
          <input value={f.habitat} onChange={(e) => patch("habitat", e.target.value)} placeholder="Hábitat (opcional)" className={inputCls} style={{ color: "var(--color-warm)" }} />
          <input value={f.treasure} onChange={(e) => patch("treasure", e.target.value)} placeholder="Tesoro (opcional)" className={inputCls} style={{ color: "var(--color-warm)" }} />
        </div>

        <textarea
          value={f.blurb} onChange={(e) => patch("blurb", e.target.value)} maxLength={300} rows={3}
          placeholder="Descripción breve (máx. 300 caracteres)…" className={`${inputCls} mb-1 resize-none`} style={{ color: "var(--color-warm)" }}
        />
        <p className="font-ui text-[10px] text-right mb-4" style={{ color: "var(--color-dim)" }}>{f.blurb.length}/300</p>

        <div className="mb-4">
          <ImageUpload folder="monsters" filename={slug || "monstruo"} label="Arte del monstruo (opcional)"
            maxWidth={1600} currentUrl={f.image} onUploaded={(url) => patch("image", url)} />
        </div>

        <AbilityListEditor label="Rasgos" rows={f.traits} onChange={(rows) => patch("traits", rows)} />
        <AbilityListEditor label="Acciones" rows={f.actions} onChange={(rows) => patch("actions", rows)} required />
        <AbilityListEditor label="Acciones adicionales" rows={f.bonusActions} onChange={(rows) => patch("bonusActions", rows)} />
        <AbilityListEditor label="Reacciones" rows={f.reactions} onChange={(rows) => patch("reactions", rows)} />
        <AbilityListEditor label="Acciones legendarias" rows={f.legendary} onChange={(rows) => patch("legendary", rows)} />

        <div className="flex gap-2 flex-wrap mt-4 pt-4 border-t border-[var(--color-line)]">
          <button className="btn-gold !py-2 !px-4 text-[12px]" onClick={save} disabled={busy}>
            <i className="fas fa-floppy-disk mr-1.5" />{editing ? "Guardar cambios" : "Guardar monstruo"}
          </button>
          <button className="btn-ghost !py-2 !px-4 text-[12px]" onClick={onClose}>
            <i className="fas fa-rotate-left mr-1.5" />Cancelar
          </button>
        </div>
        {err && <p className="text-[12px] mt-2 italic" style={{ color: "var(--color-ember)" }}>{err}</p>}
      </div>
    </div>
  );
}

function AbilityListEditor({
  label, rows, onChange, required,
}: {
  label: string; rows: AbilityRow[]; onChange: (rows: AbilityRow[]) => void; required?: boolean;
}) {
  function update(i: number, patch: Partial<AbilityRow>) {
    onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function remove(i: number) {
    onChange(rows.filter((_, idx) => idx !== i));
  }
  function add() {
    onChange([...rows, { name: "", text: "" }]);
  }

  return (
    <div className="mb-3">
      <p className="font-ui text-[11px] font-bold uppercase tracking-wide mb-1.5" style={{ color: "var(--color-dim)" }}>
        {label}{required && <span style={{ color: "var(--color-ember)" }}> *</span>}
      </p>
      <div className="space-y-1.5 mb-1.5">
        {rows.map((r, i) => (
          <div key={i} className="grid sm:grid-cols-[160px_1fr_auto] gap-1.5">
            <input value={r.name} onChange={(e) => update(i, { name: e.target.value })} placeholder="Nombre" className={inputCls} style={{ color: "var(--color-warm)" }} />
            <input value={r.text} onChange={(e) => update(i, { text: e.target.value })} placeholder="Texto (mecánica)" className={inputCls} style={{ color: "var(--color-warm)" }} />
            <button type="button" className="btn-ghost !py-1 !px-2 text-[11px]" style={{ color: "var(--color-ember)" }} onClick={() => remove(i)}>
              <i className="fas fa-trash" />
            </button>
          </div>
        ))}
        {rows.length === 0 && <p className="text-[12px] italic" style={{ color: "var(--color-dim)" }}>Ninguna entrada.</p>}
      </div>
      <button type="button" className="btn-ghost !py-1 !px-2.5 text-[11px]" onClick={add}>
        <i className="fas fa-plus mr-1" />Añadir
      </button>
    </div>
  );
}
