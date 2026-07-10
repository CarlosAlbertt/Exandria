"use client";

import { useState } from "react";
import { useChronicle, type Quest } from "@/lib/useChronicle";
import { REGIONS } from "@/data/taldorei";
import { holidayFor } from "@/lib/gameDate";

const QUEST_BADGE: Record<Quest["status"], { icon: string; color: string; label: string }> = {
  activa: { icon: "fa-scroll", color: "var(--color-bronze)", label: "En curso" },
  completada: { icon: "fa-check", color: "var(--color-primitivo)", label: "Completada" },
  fallida: { icon: "fa-xmark", color: "var(--color-ember)", label: "Fallida" },
  oculta: { icon: "fa-eye-slash", color: "var(--color-dim)", label: "Oculta" },
};

const regionName = (slug: string | null) => (slug ? REGIONS.find((r) => r.slug === slug)?.name ?? null : null);

export default function CronicaView() {
  const { entries, quests, npcs, campaignDate, ready } = useChronicle();
  const [showClosed, setShowClosed] = useState(false);

  const holiday = campaignDate ? holidayFor(campaignDate) : null;
  const active = quests.filter((q) => q.status === "activa");
  const closed = quests.filter((q) => q.status === "completada" || q.status === "fallida");

  return (
    <main className="max-w-5xl mx-auto px-6 py-16">
      <header className="text-center mb-14 reveal">
        <p className="eyebrow mb-3">Registro de la campaña</p>
        <h1 className="font-display text-4xl md:text-5xl font-extrabold gold-text">La Crónica</h1>

        {ready && campaignDate && (
          <div className="mt-6 inline-flex flex-col items-center gap-3">
            <p className="font-display text-lg font-semibold" style={{ color: "var(--color-parch)" }}>
              <i className="fas fa-hourglass-half mr-2" style={{ color: "var(--color-bronze)" }} />
              Fecha en Exandria: <span style={{ color: "var(--color-bronze-bright)" }}>{campaignDate}</span>
            </p>
            {holiday && (
              <div className="panel-raised px-4 py-2.5 max-w-md" style={{ borderColor: "color-mix(in srgb, var(--color-divino) 40%, var(--color-line))" }}>
                <p className="font-ui text-[11px] font-bold uppercase tracking-wide mb-1" style={{ color: "var(--color-divino)" }}>
                  <i className="fas fa-star mr-1.5" />{holiday.name}
                </p>
                <p style={{ color: "var(--color-muted)", fontSize: "13px", lineHeight: 1.5 }}>{holiday.blurb}</p>
              </div>
            )}
          </div>
        )}
      </header>

      {/* DIARIO */}
      <section className="mb-20">
        <h2 className="font-display text-2xl font-bold mb-8 flex items-center gap-3" style={{ color: "var(--color-parch)" }}>
          <i className="fas fa-feather-pointed text-[var(--color-bronze)]" /> Diario de sesión
        </h2>
        {entries.length === 0 ? (
          <p className="prose-lore !text-[15px] italic" style={{ color: "var(--color-dim)" }}>
            El diario aún está en blanco… nadie ha escrito la primera página.
          </p>
        ) : (
          <div className="space-y-5">
            {entries.map((e) => (
              <article key={e.id} className="panel p-6">
                <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
                  {e.session_no != null && (
                    <p className="eyebrow" style={{ color: "var(--color-arcane)" }}>Sesión {e.session_no}</p>
                  )}
                  {e.game_date && (
                    <p className="font-ui text-[11px]" style={{ color: "var(--color-dim)" }}>
                      <i className="fas fa-calendar-days mr-1.5" />{e.game_date}
                    </p>
                  )}
                </div>
                <h3 className="font-display text-xl font-bold mb-3" style={{ color: "var(--color-bronze-bright)" }}>{e.title}</h3>
                <p className="prose-lore !text-[15px] whitespace-pre-wrap">{e.body}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* MISIONES */}
      <section className="mb-20">
        <h2 className="font-display text-2xl font-bold mb-8 flex items-center gap-3" style={{ color: "var(--color-parch)" }}>
          <i className="fas fa-map text-[var(--color-bronze)]" /> Misiones
        </h2>

        <p className="eyebrow mb-4" style={{ color: "var(--color-bronze)" }}>En curso</p>
        {active.length === 0 ? (
          <p className="prose-lore !text-[15px] italic mb-8" style={{ color: "var(--color-dim)" }}>
            No hay ninguna misión abierta por el momento.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            {active.map((q) => <QuestCard key={q.id} q={q} />)}
          </div>
        )}

        {closed.length > 0 && (
          <div>
            <button onClick={() => setShowClosed((v) => !v)} className="btn-ghost !py-2 !px-4 text-[12px] mb-4">
              <i className={`fas ${showClosed ? "fa-chevron-up" : "fa-chevron-down"} mr-2`} />
              {showClosed ? "Ocultar" : "Ver"} misiones cerradas ({closed.length})
            </button>
            {showClosed && (
              <div className="grid sm:grid-cols-2 gap-4">
                {closed.map((q) => <QuestCard key={q.id} q={q} />)}
              </div>
            )}
          </div>
        )}
      </section>

      {/* PNJ */}
      <section>
        <h2 className="font-display text-2xl font-bold mb-8 flex items-center gap-3" style={{ color: "var(--color-parch)" }}>
          <i className="fas fa-people-group text-[var(--color-bronze)]" /> PNJ conocidos
        </h2>
        {npcs.length === 0 ? (
          <p className="prose-lore !text-[15px] italic" style={{ color: "var(--color-dim)" }}>
            Aún no habéis cruzado palabra con nadie que merezca recordarse.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {npcs.map((n) => {
              const region = regionName(n.region);
              return (
                <div key={n.id} className="panel p-5">
                  <h3 className="font-display font-bold text-[15px] mb-1" style={{ color: "var(--color-bronze-bright)" }}>{n.name}</h3>
                  <p className="font-ui text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: "var(--color-dim)" }}>
                    {n.role}{region ? ` · ${region}` : ""}
                  </p>
                  {n.notes && <p style={{ color: "var(--color-muted)", fontSize: "13px", lineHeight: 1.5 }}>{n.notes}</p>}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

function QuestCard({ q }: { q: Quest }) {
  const badge = QUEST_BADGE[q.status];
  return (
    <div className="panel-raised p-5" style={{ borderColor: `color-mix(in srgb, ${badge.color} 30%, var(--color-line))` }}>
      <div className="flex items-center justify-between gap-3 mb-2">
        <h3 className="font-display font-bold text-[15px]" style={{ color: "var(--color-parch)" }}>{q.title}</h3>
        <span className="font-ui text-[11px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ color: badge.color, border: `1px solid ${badge.color}55` }}>
          <i className={`fas ${badge.icon} mr-1`} />{badge.label}
        </span>
      </div>
      {q.body && <p className="prose-lore !text-[14px] whitespace-pre-wrap">{q.body}</p>}
    </div>
  );
}
