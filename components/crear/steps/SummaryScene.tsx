"use client";

import Link from "next/link";
import { getSpecies } from "@/data/species";
import { getClass } from "@/data/classes";
import { getBackground } from "@/data/backgrounds";
import { ABILITIES, abilityMod, fmtMod, type AbilityKey } from "@/data/rules";
import type { Build } from "@/app/crear/page";

// Escena 6 — Ficha: hoja del héroe y su historia en paralelo. Antes vivían
// apiladas (panel + panel con mt-5) en el carril de 280px; a lo ancho caben
// una junto a otra. Los botones de acción se quedan fuera de la rejilla,
// a lo ancho, debajo de ambos paneles.
export default function SummaryScene({
  b, set, finalScores, hp, allSkills, onCopy, onReset, onCreate,
}: {
  b: Build;
  set: (p: Partial<Build>) => void;
  finalScores: Record<AbilityKey, number>;
  hp: number;
  allSkills: string[];
  onCopy: () => void;
  onReset: () => void;
  onCreate: () => void;
}) {
  const species = b.species ? getSpecies(b.species) : undefined;
  const cls = b.cls ? getClass(b.cls) : undefined;
  const bg = b.background ? getBackground(b.background) : undefined;
  return (
    <div>
      <h2 className="font-display text-xl font-bold mb-1" style={{ color: "var(--color-parch)" }}>Tu héroe está listo</h2>
      <p className="text-sm mb-6" style={{ color: "var(--color-muted)" }}>Revisa la ficha y cópiala para tu mesa.</p>

      <div className="scene-boxes">
        <div className="panel p-6">
          <p className="font-display text-2xl font-extrabold gold-text mb-1">{b.name || "Personaje sin nombre"}</p>
          <p className="font-ui text-[13px] font-semibold mb-5" style={{ color: "var(--color-muted)" }}>
            {species?.name}{b.lineage ? ` · ${b.lineage}` : ""} · {cls?.name}{b.subclass ? ` · ${b.subclass}` : ""} · {bg?.name}
          </p>
          <div className="grid grid-cols-6 gap-2 mb-6">
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

        <div className="panel p-6">
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
