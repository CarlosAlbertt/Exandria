"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "@/components/SessionProvider";
import { useNpcChat, postNpcMessage, clearNpcChat } from "@/lib/useNpcChat";
import { narrar } from "@/lib/narrador";
import { TABERNERO } from "@/data/npcs";

const SCENE = "taberna";

export default function TabernaPage() {
  const session = useSession();
  const isDM = session?.role === "dm";
  const { messages } = useNpcChat(SCENE);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, busy]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput(""); setErr(null); setBusy(true);
    await postNpcMessage(SCENE, "user", session?.username ?? "Aventurero", text);

    // Construir el historial para la IA (incluye el turno recién enviado).
    const history = [
      ...messages.map((m) => ({ role: m.role, content: m.role === "user" ? `${m.author}: ${m.content}` : m.content })),
      { role: "user" as const, content: `${session?.username ?? "Aventurero"}: ${text}` },
    ];
    const r = await narrar({ messages: history, persona: TABERNERO.persona });
    if (!r.ok) setErr(r.error);
    else await postNpcMessage(SCENE, "assistant", TABERNERO.name, r.reply || "…");
    setBusy(false);
  }

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <header className="text-center mb-6">
        <p className="eyebrow mb-3">{TABERNERO.location}</p>
        <h1 className="font-display text-3xl md:text-4xl font-extrabold gold-text">La Taberna del Cuerno Astado</h1>
        <p className="font-ui text-[13px] mt-3" style={{ color: "var(--color-muted)" }}>
          Habláis con <span style={{ color: "var(--color-bronze)" }}>{TABERNERO.name}</span>, {TABERNERO.role.toLowerCase()}. La conversación es compartida por toda la mesa.
        </p>
      </header>

      <div className="panel p-4 sm:p-6">
        <div className="min-h-[360px] max-h-[58vh] overflow-y-auto flex flex-col gap-3 pr-1 mb-4">
          {messages.length === 0 && (
            <div className="m-auto text-center py-8 max-w-md">
              <i className="fas fa-beer-mug-empty text-3xl mb-3" style={{ color: "var(--color-dim)" }} />
              <p className="font-body text-[15px] italic" style={{ color: "var(--color-muted)" }}>{TABERNERO.greeting}</p>
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`max-w-[85%] px-4 py-2.5 rounded-2xl ${m.role === "user" ? "self-end" : "self-start"}`}
              style={{
                background: m.role === "user" ? "var(--color-raised)" : "linear-gradient(160deg, var(--color-panel), var(--color-night))",
                border: `1px solid ${m.role === "user" ? "var(--color-line)" : "color-mix(in srgb, var(--color-bronze) 30%, var(--color-line))"}`,
              }}>
              <p className="eyebrow !text-[9px] mb-1" style={{ color: m.role === "user" ? "var(--color-arcane)" : "var(--color-bronze)" }}>{m.author}</p>
              <p className="font-body text-[15px] leading-relaxed whitespace-pre-wrap" style={{ color: "var(--color-warm)" }}>{m.content}</p>
            </div>
          ))}
          {busy && (
            <div className="self-start px-4 py-2.5 rounded-2xl panel-raised">
              <span className="pulse font-ui text-[13px]" style={{ color: "var(--color-muted)" }}>{TABERNERO.name} responde…</span>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {err && (
          <div className="mb-3 px-4 py-3 rounded-lg text-[13px]" style={{ background: "rgba(239,106,61,0.08)", border: "1px solid color-mix(in srgb, var(--color-ember) 40%, var(--color-line))", color: "var(--color-warm)" }}>
            <i className="fas fa-circle-info mr-2" style={{ color: "var(--color-ember)" }} />{err}
          </div>
        )}

        <div className="flex gap-2">
          <input value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") send(); }}
            placeholder={`Háblale a ${TABERNERO.name.split(" ")[0]}…`} disabled={busy}
            className="flex-1 bg-[var(--color-night)] rounded-lg px-4 py-3 font-body text-[15px] outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)] transition-colors"
            style={{ color: "var(--color-warm)" }} />
          <button className="btn-gold" onClick={send} disabled={busy || !input.trim()}><i className="fas fa-paper-plane" /></button>
        </div>

        {isDM && (
          <button onClick={() => clearNpcChat(SCENE)} className="mt-3 font-ui text-[12px]" style={{ color: "var(--color-dim)" }}>
            <i className="fas fa-trash mr-1.5" />Vaciar conversación (DM)
          </button>
        )}
      </div>
    </main>
  );
}
