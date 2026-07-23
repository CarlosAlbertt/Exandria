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
import LorePicker from "@/components/LorePicker";
import PozosClase from "@/components/personaje/PozosClase";
import EstadoVivo from "@/components/personaje/EstadoVivo";
import { pgActuales } from "@/lib/estado";
import type { PlayState } from "@/lib/recursos";

const YA_TIENE_ACTIVO = "Ese jugador ya tiene un personaje en juego. Retíralo antes de devolver este.";

async function dmPatch(userId: string, patch: Record<string, unknown>) {
  await fetch("/api/dm/character", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, patch }) });
}

// El DM ajusta un pozo a mano (devolver una furia, vaciar el foco): se manda
// solo la clave que cambió (setUses), no todo el play_state — el endpoint la
// fusiona con el resto del jsonb (donde la Fase O2 guardará los conjuros).
function dmSetUses(userId: string, prevPlay: PlayState, next: PlayState) {
  const prevUsos = prevPlay.usos ?? {};
  const nextUsos = next.usos ?? {};
  const key = Object.keys(nextUsos).find((k) => (nextUsos[k] ?? 0) !== (prevUsos[k] ?? 0));
  if (!key) return;
  dmPatch(userId, { setUses: { key, gastados: nextUsos[key] } });
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
  const [nombres, setNombres] = useState<Record<string, string>>({});
  const [dmError, setDmError] = useState<string | null>(null);

  // Los archivados no vienen en useParty (que solo trae los activos), así que
  // se cargan aparte. No llevan Realtime propio: tras restaurar/borrar se
  // vuelve a llamar a mano en vez de recargar la página entera.
  //
  // Se trae también `profiles` porque un jugador que archivó su único personaje
  // NO está en `party` (useParty filtra por archived_at) y aun así hay que
  // pintarlo: sin su username el DM no sabría de quién son esos retirados.
  // Se excluye al DM igual que hace useParty (roles[...] !== "dm"): sus propias
  // fichas no salen en «Todo el grupo», así que tampoco deben salir sus
  // retirados — si no, el DM se vería a sí mismo como un jugador más.
  async function loadArchivados() {
    const supabase = createClient();
    const [chars, profs] = await Promise.all([
      supabase.from("characters").select("id, user_id, name, archived_at").not("archived_at", "is", null),
      supabase.from("profiles").select("id, username, role"),
    ]);
    const names: Record<string, string> = {};
    const roles: Record<string, string> = {};
    for (const p of (profs.data ?? []) as { id: string; username: string; role: string }[]) {
      names[p.id] = p.username;
      roles[p.id] = p.role;
    }
    const by: Record<string, { id: string; name: string }[]> = {};
    for (const c of (chars.data ?? []) as { id: string; user_id: string; name: string }[]) {
      if (roles[c.user_id] === "dm") continue;
      (by[c.user_id] ??= []).push({ id: c.id, name: c.name });
    }
    setNombres(names);
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
        setDmError(YA_TIENE_ACTIVO);
        return;
      }
      const { error } = await supabase.from("characters").update({ archived_at: null }).eq("id", characterId);
      // 23505 = unique_violation: el jugador se creó uno entre el select de
      // arriba y este update (ventana minúscula, pero el índice único parcial
      // lo para). Se traduce por código, no por texto, igual que lib/character.ts.
      if (error) { setDmError(error.code === "23505" ? YA_TIENE_ACTIVO : error.message); return; }
    } else {
      // La FK de stat_rolls es `on delete cascade`: la tirada se va con él.
      const { error } = await supabase.from("characters").delete().eq("id", characterId);
      if (error) { setDmError(error.message); return; }
    }
    loadArchivados();
  }

  // Los que tienen retirados pero NO salen en `party`: archivaron su único
  // personaje y no se han hecho otro.
  const sinActivo = Object.keys(archivados).filter((uid) => !party.some((c) => c.user_id === uid));

  // El vacío solo es vacío de verdad si tampoco hay retirados: si un jugador
  // archivó su único personaje, party está vacía pero SÍ hay algo que gestionar.
  if (ready && party.length === 0 && Object.keys(archivados).length === 0) {
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

            <EnsenarSaber userId={c.user_id} nombre={c.username} />

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
              <Stat icon="fa-heart" label="PG" value={`${pgActuales((c.play_state as PlayState) ?? {}, d.maxHp)} / ${d.maxHp}`} color="var(--color-ember)" />
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
                  <Stat icon="fa-heart" label="PG" value={`${pgActuales((c.play_state as PlayState) ?? {}, d.maxHp)} / ${d.maxHp}`} color="var(--color-ember)" />
                  <Stat icon="fa-shield-halved" label="Comp." value={fmtMod(d.prof)} color="var(--color-bronze)" />
                  <Stat icon="fa-dice-d20" label="Dado" value={cls ? `d${cls.hitDie}` : "—"} color="var(--color-arcane)" />
                  <Stat icon="fa-bag-shopping" label="Objetos" value={Array.isArray(c.inventory) ? c.inventory.length : 0} color="var(--color-primitivo)" />
                </div>

                <p className="eyebrow mb-2">Estado de combate</p>
                <EstadoVivo
                  play={(c.play_state as PlayState) ?? {}}
                  maxHp={d.maxHp}
                  onChange={(next) => dmPatch(c.user_id, { play_state: next })}
                />

                {c.cls && (
                  <>
                    <p className="eyebrow mb-2">Pozos de clase</p>
                    <PozosClase
                      clsSlug={c.cls}
                      level={c.level ?? 1}
                      play={(c.play_state as PlayState) ?? {}}
                      onChange={(next) => dmSetUses(c.user_id, (c.play_state as PlayState) ?? {}, next)}
                    />
                  </>
                )}

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

      {/* Jugadores que archivaron su único personaje: no están en `party`
          (useParty filtra los archivados), así que sin esto desaparecerían del
          panel y el DM no podría ni devolverles el personaje ni borrárselo —
          y con 3 archivados el jugador se quedaba sin poder crear, atascado. */}
      {sinActivo.length > 0 && (
        <div className="panel p-5">
          <p className="eyebrow mb-3">
            <i className="fas fa-user-slash mr-1.5" style={{ color: "var(--color-dim)" }} />Jugadores sin personaje en juego
          </p>
          {sinActivo.map((uid) => (
            <div key={uid} className="mb-4 last:mb-0">
              <span className="font-ui text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ color: "var(--color-arcane)", border: "1px solid var(--color-arcane)55" }}>
                <i className="fas fa-user mr-1" />{nombres[uid] ?? "jugador"}
              </span>
              <div className="mt-2">
                <p className="eyebrow mb-1.5">Retirados</p>
                {(archivados[uid] ?? []).map((arch) => (
                  <div key={arch.id} className="flex items-center gap-2 mb-1.5">
                    <span className="font-ui text-[12px]" style={{ color: "var(--color-muted)" }}>{arch.name || "Sin nombre"}</span>
                    <button className="btn-ghost !py-1 !text-[11px]" onClick={() => dmAction("restore", arch.id, uid)}>
                      <i className="fas fa-rotate-left mr-1" />Devolver a juego
                    </button>
                    <button
                      className="btn-ghost !py-1 !text-[11px]"
                      style={{ color: "var(--color-ember)" }}
                      onClick={() => { if (confirm(`¿Borrar a "${arch.name}" para siempre? Esto NO se puede deshacer.`)) dmAction("destroy", arch.id, uid); }}
                    >
                      <i className="fas fa-trash mr-1" />Borrar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Enseñar saber a mano: la vía de escape del DM para cualquier situación de
// mesa ("eso tu personaje lo sabría"). Va por /api/dm/character (service_role).
function EnsenarSaber({ userId, nombre }: { userId: string; nombre: string }) {
  const [ids, setIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function give() {
    if (ids.length === 0 || busy) return;
    setBusy(true); setMsg(null);
    await dmPatch(userId, { unlockLore: ids });
    setMsg(`${nombre} ha aprendido ${ids.length} entrada${ids.length === 1 ? "" : "s"}.`);
    setIds([]);
    setBusy(false);
  }

  return (
    <div className="mt-4 pt-3 border-t border-[var(--color-line)] space-y-2">
      <LorePicker value={ids} onChange={setIds} label="Enseñar saber" />
      {ids.length > 0 && (
        <button className="btn-gold !py-1.5 !px-3 text-[12px]" onClick={give} disabled={busy}>
          <i className="fas fa-graduation-cap mr-1.5" />Enseñar {ids.length} a {nombre}
        </button>
      )}
      {msg && <p className="font-ui text-[12px] italic" style={{ color: "var(--color-primitivo)" }}>{msg}</p>}
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
