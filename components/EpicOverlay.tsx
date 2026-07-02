"use client";

import { useEffect, useState } from "react";
import { useLiveSession, updateLiveSession } from "@/lib/useLiveSession";
import { resetGroup } from "@/lib/useGroupAction";
import { useSession } from "@/components/SessionProvider";
import GroupConsensus from "@/components/GroupConsensus";
import Emblem from "@/components/Emblem";

// Pantalla narrativa épica. Se muestra a TODOS (o a un jugador, si es visión).
export default function EpicOverlay() {
  const session = useSession();
  const { session: live } = useLiveSession();
  const [shown, setShown] = useState("");

  const role = session?.role ?? "player";
  const myId = session?.id ?? "";
  const targeted = live.target && live.target !== "all";
  const isForMe = !targeted || live.target === myId;

  // Efecto máquina de escribir.
  useEffect(() => {
    const full = live.current_narration ?? "";
    if (!live.epic_mode) { setShown(""); return; }
    setShown("");
    let i = 0;
    const id = setInterval(() => {
      i += 3;
      setShown(full.slice(0, i));
      if (i >= full.length) { setShown(full); clearInterval(id); }
    }, 12);
    return () => clearInterval(id);
  }, [live.current_narration, live.epic_mode]);

  if (!live.epic_mode) return null;
  // Visión individual dirigida a otro: no la ve este usuario (salvo el DM).
  if (targeted && !isForMe && role !== "dm") return null;

  const isVision = !!targeted;
  const fullDone = shown === (live.current_narration ?? "");

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center px-6 py-12 overflow-y-auto"
      style={{ background: isVision
        ? "radial-gradient(ellipse at 50% 30%, #1a1430 0%, #0a0710 70%, #000 100%)"
        : "radial-gradient(ellipse at 50% 30%, #11202a 0%, #070a0e 70%, #000 100%)" }}>
      <div className="absolute inset-0 pointer-events-none opacity-30"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")" }} />

      <div className="reveal relative max-w-3xl text-center my-auto w-full">
        <div className="flex justify-center mb-5 pulse"><Emblem size={56} /></div>
        {isVision && role === "dm" && (
          <p className="eyebrow mb-2" style={{ color: "var(--color-violet)" }}>Visión individual</p>
        )}
        {isVision && isForMe && role !== "dm" && (
          <p className="eyebrow mb-2" style={{ color: "var(--color-violet)" }}>Una visión solo para ti…</p>
        )}
        {live.title && <h2 className="font-display text-2xl md:text-3xl font-extrabold gold-text mb-5">{live.title}</h2>}
        <p className="font-body text-xl md:text-2xl leading-relaxed whitespace-pre-wrap" style={{ color: "var(--color-parch)" }}>
          {shown}
          {live.narrator_typing && fullDone && <span className="pulse" style={{ color: "var(--color-bronze)" }}> ▋</span>}
        </p>
        {live.narrator_typing && !live.current_narration && (
          <p className="font-ui text-sm mt-4 pulse" style={{ color: "var(--color-muted)" }}>El narrador prepara la escena…</p>
        )}

        {/* Recuadro de consenso del GRUPO: solo en narración grupal, para jugadores */}
        {!isVision && role !== "dm" && fullDone && (
          <div className="mt-10"><GroupConsensus /></div>
        )}
        {!isVision && role === "dm" && fullDone && (
          <p className="font-ui text-[12px] mt-8 tracking-widest uppercase" style={{ color: "var(--color-dim)" }}>
            Los jugadores acuerdan su acción…
          </p>
        )}
      </div>

      {role === "dm" && (
        <button onClick={async () => { await updateLiveSession({ epic_mode: false, narrator_typing: false }); await resetGroup(); }}
          className="fixed top-5 right-5 btn-ghost !py-2 !px-4 text-[12px]">
          <i className="fas fa-xmark mr-1.5" />Terminar escena
        </button>
      )}
    </div>
  );
}
