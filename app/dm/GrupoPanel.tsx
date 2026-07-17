"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParty } from "@/lib/character";
import { getSpecies } from "@/data/species";
import { getClass } from "@/data/classes";
import { getBackground } from "@/data/backgrounds";
import { ABILITIES, fmtMod } from "@/data/rules";
import { xpForNext } from "@/data/leveling";
import { derive } from "@/lib/derive";
import { createClient } from "@/lib/supabase/client";

async function dmPatch(userId: string, patch: Record<string, unknown>) {
  await fetch("/api/dm/character", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, patch }) });
}

// Borra la tirada de aptitudes guardada del jugador (RLS solo permite al DM
// hacer delete en stat_rolls). Al no existir política de update, "resetear"
// es literalmente borrar la fila: el jugador podrá elegir método y tirar de nuevo.
async function resetStatRoll(uid: string) {
  if (!confirm("¿Resetear la tirada de aptitudes de este jugador? Podrá volver a elegir método y tirar.")) return;
  const { error } = await createClient().from("stat_rolls").delete().eq("user_id", uid);
  if (error) alert(error.message);
}

export default function GrupoPanel() {
  const { party, ready } = useParty();
  const [open, setOpen] = useState<string | null>(null);
  const [xpInput, setXpInput] = useState<Record<string, string>>({});
  const [allXp, setAllXp] = useState("");
  const [archivados, setArchivados] = useState<Record<string, { id: string; name: string }[]>>({});
  const [dmError, setDmError] = useState<string | null>(null);

  // Los archivados no vienen en useParty (que solo trae los activos), así que
  // se cargan aparte. No llevan Realtime propio: tras restaurar/borrar se
  // vuelve a llamar a mano en vez de recargar la página entera.
  async function loadArchivados() {
    const { data } = await createClient()
      .from("characters")
      .select("id, user_id, name, archived_at")
      .not("archived_at", "is", null);
    const by: Record<string, { id: string; name: string }[]> = {};
    for (const c of (data ?? []) as { id: string; user_id: string; name: string }[]) {
      (by[c.user_id] ??= []).push({ id: c.id, name: c.name });
    }
    setArchivados(by);
  }
  useEffect(() => { loadArchivados(); }, []);

  // Restaurar y borrar van con la SESIÓN del DM, no por la API con service_role.
  // Motivo (lo cazó la revisión de schema_v14): service_role salta la RLS pero
  // NO los triggers, y sin JWT `auth.uid()` es null → `is_dm()` da false →
  // `guard_desarchivar` rechazaría al propio DM. Con su sesión, la policy
  // («chars: actualizar lo propio», que lleva `or is_dm()`) le deja y el trigger
  // ve su auth.uid() real. Mismo patrón que «Resetear aptitudes».
  async function dmAction(action: "restore" | "destroy", characterId: string, userId: string) {
    const supabase = createClient();
    setDmError(null);

    if (action === "restore") {
      // El índice único parcial impide dos activos. Se comprueba antes para dar
      // un mensaje decente en vez de soltar el error de Postgres.
      const { data: activo } = await supabase.from("characters")
        .select("id").eq("user_id", userId).is("archived_at", null).maybeSingle();
      if (activo) {
        setDmError("Ese jugador ya tiene un personaje en juego. Retíralo antes de devolver este.");
        return;
      }
      const { error } = await supabase.from("characters").update({ archived_at: null }).eq("id", characterId);
      if (error) { setDmError(error.message); return; }
    } else {
      // La FK de stat_rolls es `on delete cascade`: la tirada se va con él.
      const { error } = await supabase.from("characters").delete().eq("id", characterId);
      if (error) { setDmError(error.message); return; }
    }
    loadArchivados();
  }

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
      {dmError && (
        <div className="panel p-3" style={{ border: "1px solid var(--color-ember)" }}>
          <p className="font-ui text-[13px]" style={{ color: "var(--color-ember)" }}>
            <i className="fas fa-triangle-exclamation mr-2" />{dmError}
          </p>
        </div>
      )}
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
        const skills = Array.from(new Set([...(bg?.skills ?? []), ...(Array.isArray(c.skills) ? c.skills : [])]));
        // Ficha derivada (lib/derive.ts): misma fuente de verdad que la hoja
        // interactiva del jugador, para que DM y jugador vean los mismos números.
        const d = derive({ ...c, skills });
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
              <button
                className="btn-ghost shrink-0"
                title="Borra su tirada de aptitudes guardada para que pueda elegir método y tirar de nuevo"
                onClick={() => resetStatRoll(c.user_id)}
              >
                <i className="fas fa-dice-d20 mr-2" />Resetear aptitudes
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

            {(archivados[c.user_id] ?? []).length > 0 && (
              <div className="mt-3">
                <p className="eyebrow mb-1.5">Retirados</p>
                {(archivados[c.user_id] ?? []).map((arch) => (
                  <div key={arch.id} className="flex items-center gap-2 mb-1.5">
                    <span className="font-ui text-[12px]" style={{ color: "var(--color-muted)" }}>{arch.name || "Sin nombre"}</span>
                    <button className="btn-ghost !py-1 !text-[11px]" onClick={() => dmAction("restore", arch.id, c.user_id)}>
                      <i className="fas fa-rotate-left mr-1" />Devolver a juego
                    </button>
                    <button
                      className="btn-ghost !py-1 !text-[11px]"
                      style={{ color: "var(--color-ember)" }}
                      onClick={() => { if (confirm(`¿Borrar a "${arch.name}" para siempre? Esto NO se puede deshacer.`)) dmAction("destroy", arch.id, c.user_id); }}
                    >
                      <i className="fas fa-trash mr-1" />Borrar
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Franja compacta: siempre visible, sin necesidad de desplegar la ficha */}
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <Stat icon="fa-shield" label="CA" value={d.ac} color="var(--color-arcane-bright)" />
              <Stat icon="fa-heart" label="PG máx" value={d.maxHp} color="var(--color-ember)" />
              <Stat icon="fa-bolt" label="Iniciativa" value={fmtMod(d.initiative)} color="var(--color-arcane)" />
              {typeof d.spellDc === "number" && <Stat icon="fa-wand-sparkles" label="CD" value={d.spellDc} color="var(--color-violet)" />}
            </div>

            {isOpen && (
              <div className="mt-5 pt-5 border-t border-[var(--color-line)]">
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-5">
                  {ABILITIES.map((a) => (
                    <div key={a.key} className="panel-raised py-2 text-center">
                      <p className="eyebrow !text-[9px] mb-0.5">{a.abbr}</p>
                      <p className="font-display text-xl font-extrabold" style={{ color: "var(--color-arcane-bright)" }}>{d.abilities[a.key].score}</p>
                      <p className="font-ui text-[10px] font-bold" style={{ color: "var(--color-muted)" }}>{fmtMod(d.abilities[a.key].mod)}</p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-4 mb-5">
                  <Stat icon="fa-heart" label="PG máx" value={d.maxHp} color="var(--color-ember)" />
                  <Stat icon="fa-shield-halved" label="Comp." value={fmtMod(d.prof)} color="var(--color-bronze)" />
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
