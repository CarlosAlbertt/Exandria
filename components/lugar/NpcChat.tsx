"use client";
import { useEffect, useRef, useState } from "react";
import { narrar, type Msg } from "@/lib/narrador";
import { useSession } from "@/components/SessionProvider";
import { loadMemory, saveMemory } from "@/lib/useNpcMemory";

// Chat IA reutilizable (tendero, PNJ…). persona = personalidad/contexto para
// el system prompt; la IA responde en personaje.
// memoryRef (opcional, Fase M): si se pasa, el NPC recuerda entre visitas —
// carga el resumen del jugador al abrir (se inyecta al prompt) y, al cerrar
// (desmontar) con conversación, la IA la resume y persiste.
export default function NpcChat({ persona, placeholder = "Escribe…", empty = "Salúdale.", memoryRef }: { persona: string; placeholder?: string; empty?: string; memoryRef?: string }) {
  const session = useSession();
  const userId = session?.id ?? null;
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [memory, setMemory] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  // Refs con los valores vivos para el guardado en el desmontaje (cleanup).
  const msgsRef = useRef<Msg[]>([]);
  const memRef = useRef("");
  msgsRef.current = messages;
  memRef.current = memory;

  // Carga el recuerdo del jugador con este NPC.
  useEffect(() => {
    if (!memoryRef || !userId) return;
    let on = true;
    loadMemory(memoryRef, userId).then((s) => { if (on) setMemory(s); });
    return () => { on = false; };
  }, [memoryRef, userId]);

  // Al cerrar (desmontar): si hubo conversación, resumir + guardar (sin await).
  useEffect(() => {
    return () => {
      if (!memoryRef || !userId) return;
      const convo = msgsRef.current;
      if (!convo.some((m) => m.role === "user")) return;
      const transcript = convo.map((m) => `${m.role === "user" ? "Aventurero" : "NPC"}: ${m.content}`).join("\n");
      const prev = memRef.current;
      const sumPersona =
        "Eres un archivador silencioso. Resume en 2-3 frases y en tercera persona lo relevante de " +
        "esta conversación para que el NPC lo recuerde la próxima vez (quién es el aventurero, qué " +
        "pidió o prometió, el tono). Si hay un resumen previo, intégralo sin repetir. Responde SOLO " +
        "con el resumen, sin preámbulos.";
      const prompt = `${prev ? `Resumen previo: ${prev}\n\n` : ""}Conversación:\n${transcript}`;
      void narrar({ messages: [{ role: "user", content: prompt }], persona: sumPersona }).then((r) => {
        if (r.ok && r.reply.trim()) void saveMemory(memoryRef, userId, r.reply.trim());
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memoryRef, userId]);

  const effectivePersona = memory ? `${persona}\n\nRecuerdas de encuentros pasados con este aventurero: ${memory}` : persona;

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next); setInput(""); setLoading(true);
    const r = await narrar({ messages: next, persona: effectivePersona });
    setMessages((m) => [...m, { role: "assistant", content: r.ok ? (r.reply || "…") : "(No responde ahora mismo.)" }]);
    setLoading(false);
  }

  return (
    <div className="space-y-2">
      <div className="max-h-[220px] overflow-y-auto flex flex-col gap-2 pr-1">
        {messages.length === 0 && <p className="text-sm italic" style={{ color: "var(--color-dim)" }}>{empty}{memory ? " Os recuerda." : ""}</p>}
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
