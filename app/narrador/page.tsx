"use client";

import { useEffect, useRef, useState } from "react";
import { getSpecies } from "@/data/species";
import { getClass } from "@/data/classes";

const BUILD_KEY = "taldorei.build.v1";
type Msg = { role: "user" | "assistant"; content: string };

export default function NarradorPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [character, setCharacter] = useState<string>("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(BUILD_KEY);
      if (raw) {
        const b = JSON.parse(raw);
        const sp = b.species ? getSpecies(b.species)?.name : null;
        const cl = b.cls ? getClass(b.cls)?.name : null;
        const parts = [b.name, sp, cl].filter(Boolean);
        if (parts.length) setCharacter(parts.join(", "));
      }
    } catch {}
  }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    setHint(null);
    try {
      const res = await fetch("/api/narrador", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, character }),
      });
      const data = await res.json();
      if (!res.ok) {
        setHint(data.error ?? "Error desconocido.");
        setMessages((m) => m.slice(0, -1));
        setInput(text);
      } else {
        setMessages((m) => [...m, { role: "assistant", content: data.reply || "…" }]);
      }
    } catch {
      setHint("No se pudo conectar con el servidor.");
      setMessages((m) => m.slice(0, -1));
      setInput(text);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <header className="text-center mb-6">
        <p className="eyebrow mb-3">Experimental · IA local (Ollama)</p>
        <h1 className="font-display text-3xl md:text-4xl font-extrabold gold-text">El Narrador</h1>
        <p className="font-ui text-[13px] mt-3" style={{ color: "var(--color-muted)" }}>
          Un DM con IA para narrar escenas e interpretar NPCs. {character ? <>Hablando como <span style={{ color: "var(--color-bronze)" }}>{character}</span>.</> : "Crea un personaje para dar contexto."}
        </p>
      </header>

      <div className="panel p-4 sm:p-6">
        <div className="min-h-[340px] max-h-[55vh] overflow-y-auto flex flex-col gap-3 pr-1 mb-4">
          {messages.length === 0 && !loading && (
            <div className="m-auto text-center py-10">
              <i className="fas fa-feather-pointed text-3xl mb-3" style={{ color: "var(--color-dim)" }} />
              <p className="prose-lore !text-[15px]" style={{ color: "var(--color-muted)" }}>
                Describe dónde empieza tu escena. Ej.: <em>«Entro en la taberna del Cuerno Astado en Emon.»</em>
              </p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`max-w-[85%] px-4 py-2.5 rounded-2xl ${m.role === "user" ? "self-end" : "self-start"}`}
              style={{
                background: m.role === "user" ? "var(--color-raised)" : "linear-gradient(160deg, var(--color-panel), var(--color-night))",
                border: `1px solid ${m.role === "user" ? "var(--color-line)" : "color-mix(in srgb, var(--color-bronze) 30%, var(--color-line))"}`,
              }}>
              <p className="eyebrow !text-[9px] mb-1" style={{ color: m.role === "user" ? "var(--color-arcane)" : "var(--color-bronze)" }}>
                {m.role === "user" ? "Tú" : "Narrador"}
              </p>
              <p className="font-body text-[15px] leading-relaxed whitespace-pre-wrap" style={{ color: "var(--color-warm)" }}>{m.content}</p>
            </div>
          ))}
          {loading && (
            <div className="self-start px-4 py-2.5 rounded-2xl panel-raised">
              <span className="pulse font-ui text-[13px]" style={{ color: "var(--color-muted)" }}>El narrador piensa…</span>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {hint && (
          <div className="mb-3 px-4 py-3 rounded-lg text-[13px]" style={{ background: "rgba(239,106,61,0.08)", border: "1px solid color-mix(in srgb, var(--color-ember) 40%, var(--color-line))", color: "var(--color-warm)" }}>
            <i className="fas fa-circle-info mr-2" style={{ color: "var(--color-ember)" }} />{hint}
          </div>
        )}

        <div className="flex gap-2">
          <input value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Escribe tu acción…" disabled={loading}
            className="flex-1 bg-[var(--color-night)] rounded-lg px-4 py-3 font-body text-[15px] outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)] transition-colors"
            style={{ color: "var(--color-warm)" }} />
          <button className="btn-gold" onClick={send} disabled={loading || !input.trim()}>
            <i className="fas fa-paper-plane" />
          </button>
        </div>
      </div>

      <p className="text-center text-[12px] mt-4" style={{ color: "var(--color-dim)" }}>
        Requiere <a href="https://ollama.com" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "var(--color-muted)" }}>Ollama</a> en local: <code className="font-ui">ollama run llama3.2</code>. Configurable con <code className="font-ui">OLLAMA_MODEL</code>.
      </p>
    </main>
  );
}
