"use client";

import { useEffect, useState } from "react";
import { useLiveSession, updateLiveSession } from "@/lib/useLiveSession";
import Emblem from "@/components/Emblem";
import type { Role } from "@/lib/auth";

// Pantalla narrativa épica. Se muestra a TODOS cuando el DM activa epic_mode.
export default function EpicOverlay({ role }: { role: Role }) {
  const { session } = useLiveSession();
  const [shown, setShown] = useState("");

  // Efecto máquina de escribir sobre la narración actual.
  useEffect(() => {
    const full = session.current_narration ?? "";
    if (!session.epic_mode) { setShown(""); return; }
    setShown("");
    let i = 0;
    const id = setInterval(() => {
      i += 2;
      setShown(full.slice(0, i));
      if (i >= full.length) clearInterval(id);
    }, 18);
    return () => clearInterval(id);
  }, [session.current_narration, session.epic_mode]);

  if (!session.epic_mode) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-6 py-16"
      style={{ background: "radial-gradient(ellipse at 50% 30%, #11202a 0%, #070a0e 70%, #000 100%)" }}>
      <div className="absolute inset-0 pointer-events-none opacity-30"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")" }} />

      <div className="reveal relative max-w-3xl text-center">
        <div className="flex justify-center mb-6 pulse"><Emblem size={64} /></div>
        {session.title && (
          <h2 className="font-display text-2xl md:text-3xl font-extrabold gold-text mb-6">{session.title}</h2>
        )}
        <p className="font-body text-xl md:text-2xl leading-relaxed whitespace-pre-wrap"
          style={{ color: "var(--color-parch)" }}>
          {shown}
          {session.narrator_typing && shown === (session.current_narration ?? "") && (
            <span className="pulse" style={{ color: "var(--color-bronze)" }}> ▋</span>
          )}
        </p>
        {session.narrator_typing && !session.current_narration && (
          <p className="font-ui text-sm mt-4 pulse" style={{ color: "var(--color-muted)" }}>El narrador prepara la escena…</p>
        )}
      </div>

      {role === "dm" && (
        <button onClick={() => updateLiveSession({ epic_mode: false })}
          className="absolute top-5 right-5 btn-ghost !py-2 !px-4 text-[12px]">
          <i className="fas fa-xmark mr-1.5" />Cerrar para todos
        </button>
      )}
      {role !== "dm" && (
        <p className="absolute bottom-6 font-ui text-[11px] tracking-widest uppercase" style={{ color: "var(--color-dim)" }}>
          El Director de Juego está narrando
        </p>
      )}
    </div>
  );
}
