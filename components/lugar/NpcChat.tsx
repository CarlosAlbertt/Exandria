"use client";
import { useEffect, useRef, useState } from "react";
import { narrar, type Msg } from "@/lib/narrador";

// Chat IA reutilizable (tendero, PNJ…). persona = personalidad/contexto para
// el system prompt; la IA responde en personaje.
export default function NpcChat({ persona, placeholder = "Escribe…", empty = "Salúdale." }: { persona: string; placeholder?: string; empty?: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next); setInput(""); setLoading(true);
    const r = await narrar({ messages: next, persona });
    setMessages((m) => [...m, { role: "assistant", content: r.ok ? (r.reply || "…") : "(No responde ahora mismo.)" }]);
    setLoading(false);
  }

  return (
    <div className="space-y-2">
      <div className="max-h-[220px] overflow-y-auto flex flex-col gap-2 pr-1">
        {messages.length === 0 && <p className="text-sm italic" style={{ color: "var(--color-dim)" }}>{empty}</p>}
        {messages.map((m, i) => (
          <div key={i} className={`max-w-[85%] px-3 py-2 rounded-2xl ${m.role === "user" ? "self-end" : "self-start"}`} style={{ background: m.role === "user" ? "var(--color-raised)" : "var(--color-night)", border: "1px solid var(--color-line)" }}>
            <p className="font-body text-[14px] whitespace-pre-wrap" style={{ color: "var(--color-warm)" }}>{m.content}</p>
          </div>
        ))}
        {loading && <p className="pulse font-ui text-[12px] self-start" style={{ color: "var(--color-muted)" }}>…</p>}
        <div ref={endRef} />
      </div>
      <div className="flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); send(); } }} placeholder={placeholder} disabled={loading}
          className="flex-1 bg-[var(--color-night)] rounded-lg px-3 py-2 font-body text-[14px] outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)]" style={{ color: "var(--color-warm)" }} />
        <button onClick={send} disabled={loading || !input.trim()} className="btn-gold !px-3"><i className="fas fa-paper-plane" /></button>
      </div>
    </div>
  );
}
