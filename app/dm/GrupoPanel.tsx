"use client";

import { useState } from "react";
import Link from "next/link";
import { useParty } from "@/lib/character";
import { getSpecies } from "@/data/species";
import { getClass } from "@/data/classes";
import { getBackground } from "@/data/backgrounds";
import { ABILITIES, abilityMod, fmtMod, AbilityKey } from "@/data/rules";
import { xpForNext } from "@/data/leveling";

async function dmPatch(userId: string, patch: Record<string, unknown>) {
  await fetch("/api/dm/character", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, patch }) });
}

export default function GrupoPanel() {
  const { party, ready } = useParty();
  const [open, setOpen] = useState<string | null>(null);
  const [xpInput, setXpInput] = useState<Record<string, string>>({});
  const [allXp, setAllXp] = useState("");

  if (ready && party.length === 0) {
    return (
      <div className="panel p-10 text-center">
        <i className="fas fa-users-slash text-3xl mb-3" style={{ color: "var(--color-dim)" }} />
        <p className="prose-lore !text-[15px]" style={{ color: "var(--color-muted)" }}>Aún no hay fichas. Tus jugadores las crean en «Crear personaje» y aparecerán aquí.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="panel p-4 flex flex-wrap items-center justify-between gap-3">
        <p className="eyebrow"><i className="fas fa-users mr-1.5" style={{ color: "var(--color-bronze)" }} />Todo el grupo</p>
        <div className="flex flex-wrap items-center gap-2">
          <button className="btn-ghost" onClick={() => party.forEach((c) => dmPatch(c.user_id, { setLevel: Math.min(20, (c.level ?? 1) + 1) }))}>
            <i className="fas fa-arrow-up mr-2" />Subir nivel a todos
          </button>
          <input
            type="number"
            min={1}
            value={allXp}
            onChange={(e) => setAllXp(e.target.value)}
            placeholder="XP"
            className="w-20 px-2 py-1.5 rounded-lg font-ui text-[13px] bg-transparent"
            style={{ border: "1px solid var(--color-line)", color: "var(--color-parch)" }}
          />
          <button
            className="btn-gold"
            onClick={() => {
              const n = Number(allXp) || 0;
              if (n <= 0) return;
              party.forEach((c) => dmPatch(c.user_id, { addXp: n }));
              setAllXp("");
            }}
          >
            <i className="fas fa-star mr-2" />Dar XP a todos
          </button>
        </div>
      </div>

      {party.map((c) => {
        const sp = c.species ? getSpecies(c.species) : undefined;
        const cls = c.cls ? getClass(c.cls) : undefined;
        const bg = c.background ? getBackground(c.background) : undefined;
        const finalScores = {} as Record<AbilityKey, number>;
        ABILITIES.forEach((a) => (finalScores[a.key] = (c.base?.[a.key] ?? 10) + (c.bonus?.[a.key] ?? 0)));
        const conMod = abilityMod(finalScores.con);
        const hp = cls ? cls.hitDie + conMod : 0;
        const skills = Array.from(new Set([...(bg?.skills ?? []), ...(Array.isArray(c.skills) ? c.skills : [])]));
        const isOpen = open === c.user_id;

        return (
          <div key={c.user_id} className="panel p-5">
            <div className="flex items-center justify-between gap-3">
              <button className="flex-1 min-w-0 flex items-center justify-between gap-3 text-left" onClick={() => setOpen(isOpen ? null : c.user_id)}>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-ui text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ color: "var(--color-arcane)", border: "1px solid var(--color-arcane)55" }}>
                      <i className="fas fa-user mr-1" />{c.username}
                    </span>
                    <h3 className="font-display text-xl font-bold gold-text">{c.name || "Sin nombre"}</h3>
                  </div>
                  <p className="font-ui text-[12px] font-semibold mt-1" style={{ color: "var(--color-muted)" }}>
                    {sp?.name ?? "—"}{c.lineage ? ` · ${c.lineage}` : ""} · {cls?.name ?? "—"}{c.subclass ? ` · ${c.subclass}` : ""} · {bg?.name ?? "—"}
                  </p>
                </div>
                <i className={`fas fa-chevron-${isOpen ? "up" : "down"}`} style={{ color: "var(--color-dim)" }} />
              </button>
              <Link href={`/personaje?user=${c.user_id}`} className="btn-ghost shrink-0">
                <i className="fas fa-pen-to-square mr-2" />Editar hoja
              </Link>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
              <div className="flex items-center gap-2">
                <p className="eyebrow !text-[9px]">Nivel</p>
                <button
                  className="stat-btn"
                  disabled={(c.level ?? 1) <= 1}
                  onClick={() => dmPatch(c.user_id, { setLevel: Math.max(1, (c.level ?? 1) - 1) })}
                  aria-label="Bajar nivel"
                >
                  <i className="fas fa-minus" />
                </button>
                <span className="font-display text-xl font-extrabold w-7 text-center" style={{ color: "var(--color-arcane-bright)" }}>{c.level ?? 1}</span>
                <button
                  className="stat-btn"
                  disabled={(c.level ?? 1) >= 20}
                  onClick={() => dmPatch(c.user_id, { setLevel: Math.min(20, (c.level ?? 1) + 1) })}
                  aria-label="Subir nivel"
                >
                  <i className="fas fa-plus" />
                </button>
              </div>

              <div className="min-w-[140px]">
                <p className="eyebrow !text-[9px] mb-1">
                  XP {c.xp ?? 0} / {(c.level ?? 1) >= 20 ? "Máx" : xpForNext(c.level ?? 1)}
                </p>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-line)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(c.level ?? 1) >= 20 ? 100 : Math.min(100, ((c.xp ?? 0) / (xpForNext(c.level ?? 1) || 1)) * 100)}%`,
                      background: "var(--color-bronze)",
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={xpInput[c.user_id] ?? ""}
                  onChange={(e) => setXpInput((prev) => ({ ...prev, [c.user_id]: e.target.value }))}
                  placeholder="XP"
                  className="w-20 px-2 py-1.5 rounded-lg font-ui text-[13px] bg-transparent"
                  style={{ border: "1px solid var(--color-line)", color: "var(--color-parch)" }}
                />
                <button
                  className="btn-gold"
                  onClick={() => {
                    const n = Number(xpInput[c.user_id]) || 0;
                    if (n <= 0) return;
                    dmPatch(c.user_id, { addXp: n });
                    setXpInput((prev) => ({ ...prev, [c.user_id]: "" }));
                  }}
                >
                  <i className="fas fa-star mr-2" />Dar XP
                </button>
              </div>
            </div>

            {isOpen && (
              <div className="mt-5 pt-5 border-t border-[var(--color-line)]">
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-5">
                  {ABILITIES.map((a) => (
                    <div key={a.key} className="panel-raised py-2 text-center">
                      <p className="eyebrow !text-[9px] mb-0.5">{a.abbr}</p>
                      <p className="font-display text-xl font-extrabold" style={{ color: "var(--color-arcane-bright)" }}>{finalScores[a.key]}</p>
                      <p className="font-ui text-[10px] font-bold" style={{ color: "var(--color-muted)" }}>{fmtMod(abilityMod(finalScores[a.key]))}</p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-4 mb-5">
                  <Stat icon="fa-heart" label="PG" value={hp || "—"} color="var(--color-ember)" />
                  <Stat icon="fa-shield-halved" label="Comp." value="+2" color="var(--color-bronze)" />
                  <Stat icon="fa-dice-d20" label="Dado" value={cls ? `d${cls.hitDie}` : "—"} color="var(--color-arcane)" />
                  <Stat icon="fa-bag-shopping" label="Objetos" value={Array.isArray(c.inventory) ? c.inventory.length : 0} color="var(--color-primitivo)" />
                </div>

                <p className="eyebrow mb-2">Pericias</p>
                <div className="flex flex-wrap gap-2 mb-5">
                  {skills.length ? skills.map((s) => <span key={s} className="chip" data-on>{s}</span>) : <span className="text-sm" style={{ color: "var(--color-dim)" }}>—</span>}
                </div>

                {Array.isArray(c.inventory) && c.inventory.length > 0 && (
                  <>
                    <p className="eyebrow mb-2">Inventario</p>
                    <div className="flex flex-wrap gap-2 mb-5">
                      {c.inventory.map((it, i) => <span key={i} className="font-ui text-[12px] px-2.5 py-1 rounded-lg" style={{ color: "var(--color-warm)", border: "1px solid var(--color-line)" }}>{it}</span>)}
                    </div>
                  </>
                )}

                <p className="eyebrow mb-2"><i className="fas fa-feather-pointed mr-1.5" style={{ color: "var(--color-bronze)" }} />Historia</p>
                {c.lore?.trim() ? (
                  <p className="prose-lore !text-[15px] whitespace-pre-wrap" style={{ color: "var(--color-warm)" }}>{c.lore}</p>
                ) : (
                  <p className="text-sm italic" style={{ color: "var(--color-dim)" }}>Sin historia escrita.</p>
                )}
              </div>
            )}
          </div>
        );
      })}
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
