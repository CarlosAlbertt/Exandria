"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { puntoPipeta, puntoCocer, PIPETA, COCER, type Punto } from "@/lib/manipulacion";

/**
 * Las dos fases que se juegan **con el tiempo**: dosificar con la **pipeta** y
 * **cocer**. La primera fase, echar los materiales, la lleva el propio caldero
 * (`Caldero.tsx`), porque se juega **arrastrando los huecos a la olla** y el
 * blanco del arrastre es el dibujo, no este panel.
 *
 * La manipulación **no sustituye la tirada de pericia: la modifica**, con tope
 * ±3. Toda la aritmética vive en `lib/manipulacion.ts`, que es capa pura y la
 * que mira el gate; aquí solo se recogen las manos.
 *
 * **Cuando algo se mueve solo hay un botón rojo que lo para**, con la acción
 * escrita dentro, y **`espacio` hace lo mismo**: nunca hay que adivinar qué se
 * pulsa. Con `prefers-reduced-motion` nada se mueve y el cursor se queda quieto
 * en el centro, que es el punto bueno: quien no puede jugar con animaciones no
 * sale castigado por ello.
 */

type Fase = "pipeta" | "cocer";

/** Ciclos por segundo del cursor que va y viene. */
const VELOCIDAD: Record<Fase, number> = { pipeta: 0.55, cocer: 0.75 };

/** Posición 0–1 de un cursor que rebota, a partir del tiempo transcurrido. */
function vaiven(msTranscurridos: number, ciclosPorSegundo: number): number {
  const t = (msTranscurridos / 1000) * ciclosPorSegundo;
  const f = t % 2;
  return f <= 1 ? f : 2 - f;
}

export default function Manipulacion({
  yaSacado, onListo, onCancelar, reducido,
}: {
  /** Lo que sacó la fase de echar, para tenerlo siempre a la vista. */
  yaSacado: Punto[];
  /** Las dos fases de aquí, en orden. */
  onListo: (puntos: Punto[]) => void;
  onCancelar: () => void;
  /** El usuario prefiere que nada se mueva. */
  reducido: boolean;
}) {
  const [fase, setFase] = useState<Fase>("pipeta");
  const [puntos, setPuntos] = useState<Punto[]>([]);
  const [pos, setPos] = useState(0.5);
  const inicio = useRef<number>(0);
  const raf = useRef<number | null>(null);

  // El cursor va y viene mientras la fase esté viva. Se para al cambiar de fase:
  // sin esto, el bucle seguiría corriendo tras desmontar.
  useEffect(() => {
    if (reducido) return;
    inicio.current = performance.now();
    const paso = (ahora: number) => {
      setPos(vaiven(ahora - inicio.current, VELOCIDAD[fase]));
      raf.current = requestAnimationFrame(paso);
    };
    raf.current = requestAnimationFrame(paso);
    return () => { if (raf.current !== null) cancelAnimationFrame(raf.current); raf.current = null; };
  }, [fase, reducido]);

  /** Parar lo que se mueve: el botón rojo y `espacio` hacen esto mismo. */
  const parar = useCallback(() => {
    const p = fase === "pipeta" ? puntoPipeta(pos) : puntoCocer(pos);
    setPuntos((prev) => {
      const next = [...prev, p];
      if (next.length === 2) onListo(next);
      return next;
    });
    if (fase === "pipeta") setFase("cocer");
  }, [fase, pos, onListo]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      e.preventDefault(); // si no, la página hace scroll bajo el caldero
      parar();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [parar]);

  const cursor = reducido ? 0.5 : pos;
  const punta = aguja(cursor);

  return (
    <div className="panel-raised p-4 mt-4">
      <div className="flex items-baseline justify-between mb-3">
        <p className="eyebrow !mb-0">
          <i className="fas fa-hand-sparkles mr-2" style={{ color: "var(--color-bronze)" }} />
          Manipulación
        </p>
        <button type="button" onClick={onCancelar}
          className="font-ui text-[11px] underline" style={{ color: "var(--color-dim)" }}>
          dejarlo
        </button>
      </div>

      {fase === "pipeta" ? (
        <>
          <p className="font-ui text-[12px] mb-1" style={{ color: "var(--color-warm)" }}>
            <strong>2 · Pipeta.</strong> Párala dentro de la banda verde.
          </p>
          <p className="font-ui text-[11px] mb-1" style={{ color: "var(--color-dim)" }}>
            En el centro, +1. Dentro de la banda, 0. Fuera, −1.
          </p>
          <div className="manip-banda">
            <span className="manip-cursor" style={{ left: `${cursor * 100}%` }} />
          </div>
        </>
      ) : (
        <>
          <p className="font-ui text-[12px] mb-1" style={{ color: "var(--color-warm)" }}>
            <strong>3 · Cocer.</strong> Para la aguja en el sector claro.
          </p>
          <p className="font-ui text-[11px] mb-1" style={{ color: "var(--color-dim)" }}>
            Clavarla, +1. Dentro del arco, 0. Pasarse, −1.
          </p>
          <svg viewBox="0 0 120 54" className="w-full" style={{ maxWidth: 220, margin: "4px auto 0", display: "block" }}
            role="img" aria-label="Aguja de cocción">
            <path d="M10,46 A50,50 0 0 1 110,46" fill="none" stroke="var(--color-line)" strokeWidth="9" strokeLinecap="round" />
            <path d={arco(COCER.banda[0], COCER.banda[1])} fill="none" stroke="var(--color-bronze-deep)" strokeWidth="9" opacity="0.7" />
            <path d={arco(COCER.centro[0], COCER.centro[1])} fill="none" stroke="var(--color-verdant)" strokeWidth="9" />
            <line x1="60" y1="46" x2={punta.x} y2={punta.y} stroke="var(--color-bronze-bright)" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="60" cy="46" r="4" fill="var(--color-bronze)" />
          </svg>
        </>
      )}

      <div className="flex gap-2 mt-3">
        <button type="button" className="manip-parar" onClick={parar}>
          <i className="fas fa-stop mr-2" />
          {fase === "pipeta" ? "SOLTAR LA PIPETA" : "PARAR LA AGUJA"}
          <span className="ml-2 font-normal opacity-80">(o espacio)</span>
        </button>
      </div>

      <div className="flex items-center gap-2 mt-3 font-ui text-[11px]" style={{ color: "var(--color-muted)" }}>
        Llevas:
        {[...yaSacado, ...puntos].map((p, i) => (
          <span key={i} className={`manip-punto ${p > 0 ? "is-bien" : p < 0 ? "is-mal" : ""}`}>
            {p > 0 ? `+${p}` : p}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Punta de la aguja para una posición 0–1 sobre el semicírculo. */
function aguja(p: number): { x: number; y: number } {
  const ang = Math.PI * (1 - Math.min(1, Math.max(0, p)));
  return { x: 60 + Math.cos(ang) * 40, y: 46 - Math.sin(ang) * 40 };
}

/** Trozo de arco entre dos posiciones 0–1, para pintar los sectores. */
function arco(desde: number, hasta: number): string {
  const p = (v: number) => {
    const ang = Math.PI * (1 - v);
    return `${(60 + Math.cos(ang) * 50).toFixed(2)},${(46 - Math.sin(ang) * 50).toFixed(2)}`;
  };
  return `M${p(desde)} A50,50 0 0 1 ${p(hasta)}`;
}
