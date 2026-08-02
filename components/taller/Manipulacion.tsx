"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  puntoEchar, puntoPipeta, puntoCocer, totalManipulacion,
  PIPETA, COCER, type Punto,
} from "@/lib/manipulacion";

/**
 * Las tres fases del caldero: **echar**, **dosificar con la pipeta** y **cocer**.
 *
 * La manipulación **no sustituye la tirada de pericia: la modifica**, con tope
 * ±3 (`totalManipulacion`). Toda la aritmética vive en `lib/manipulacion.ts`,
 * que es capa pura y la que mira el gate; aquí solo se recogen las manos.
 *
 * **Cuando algo se mueve solo hay un botón rojo que lo para**, con la acción
 * escrita dentro, y **`espacio` hace lo mismo**: nunca hay que adivinar qué se
 * pulsa. Con `prefers-reduced-motion` nada se mueve y el jugador va directo a
 * «preparar sin manipular», que siempre está.
 */

type Fase = "echar" | "pipeta" | "cocer" | "listo";

/** Ciclos por segundo del cursor que va y viene. */
const VELOCIDAD = { pipeta: 0.55, cocer: 0.75 };

/** Posición 0–1 de un cursor que rebota, a partir del tiempo transcurrido. */
function vaiven(msTranscurridos: number, ciclosPorSegundo: number): number {
  const t = (msTranscurridos / 1000) * ciclosPorSegundo;
  const f = t % 2;
  return f <= 1 ? f : 2 - f;
}

export default function Manipulacion({
  ordenReceta, nombres, onListo, onCancelar, reducido,
}: {
  /** Los `n` de la receta, en el orden que pide. */
  ordenReceta: number[];
  /** Cómo se llama cada `n`, para poder decirlo en los botones. */
  nombres: Record<number, string>;
  /** El jugador ha terminado las tres fases: aquí va el bono acotado. */
  onListo: (bono: number, puntos: Punto[]) => void;
  onCancelar: () => void;
  /** El usuario prefiere que nada se mueva. */
  reducido: boolean;
}) {
  const [fase, setFase] = useState<Fase>("echar");
  const [echado, setEchado] = useState<number[]>([]);
  const [puntos, setPuntos] = useState<Punto[]>([]);
  const [pos, setPos] = useState(0.5);
  const inicio = useRef<number>(0);
  const raf = useRef<number | null>(null);

  const enMovimiento = fase === "pipeta" || fase === "cocer";

  // El cursor va y viene mientras la fase esté viva. Se para en cuanto la fase
  // cambia: sin esto, el bucle seguiría corriendo tras desmontar.
  useEffect(() => {
    if (!enMovimiento || reducido) return;
    inicio.current = performance.now();
    const paso = (ahora: number) => {
      setPos(vaiven(ahora - inicio.current, fase === "pipeta" ? VELOCIDAD.pipeta : VELOCIDAD.cocer));
      raf.current = requestAnimationFrame(paso);
    };
    raf.current = requestAnimationFrame(paso);
    return () => { if (raf.current !== null) cancelAnimationFrame(raf.current); raf.current = null; };
  }, [fase, enMovimiento, reducido]);

  const anotar = useCallback((p: Punto) => {
    setPuntos((prev) => {
      const next = [...prev, p];
      if (next.length === 3) onListo(totalManipulacion(next), next);
      return next;
    });
  }, [onListo]);

  /** Parar lo que se mueve: el botón rojo y `espacio` hacen esto mismo. */
  const parar = useCallback(() => {
    if (fase === "pipeta") { anotar(puntoPipeta(pos)); setFase("cocer"); return; }
    if (fase === "cocer") { anotar(puntoCocer(pos)); setFase("listo"); }
  }, [fase, pos, anotar]);

  useEffect(() => {
    if (!enMovimiento) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      e.preventDefault(); // si no, la página hace scroll bajo el caldero
      parar();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enMovimiento, parar]);

  function echar(n: number) {
    const next = [...echado, n];
    setEchado(next);
    if (next.length === ordenReceta.length) {
      anotar(puntoEchar(next, ordenReceta));
      setFase("pipeta");
    }
  }

  // Lo que queda por echar: la receta menos lo ya echado, quitando **una
  // ocurrencia por cada uno** (una receta puede pedir dos veces el mismo `n`).
  // Se ofrecen ordenados por nombre, NO en el orden de la receta: si los
  // botones salieran ya ordenados, no habría orden que acertar.
  const restantes = (() => {
    const quedan = [...ordenReceta];
    for (const n of echado) {
      const i = quedan.indexOf(n);
      if (i >= 0) quedan.splice(i, 1);
    }
    return quedan.sort((a, b) => (nombres[a] ?? `${a}`).localeCompare(nombres[b] ?? `${b}`, "es"));
  })();

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

      {/* ------------------------------ 1 · Echar ------------------------------ */}
      {fase === "echar" && (
        <>
          <p className="font-ui text-[12px] mb-1" style={{ color: "var(--color-warm)" }}>
            <strong>1 · Echar.</strong> Al caldero, en el orden que pide la receta.
          </p>
          <p className="font-ui text-[11px] mb-3" style={{ color: "var(--color-dim)" }}>
            Todo en orden, +1. Alguno fuera de sitio, −1. Van {echado.length} de {ordenReceta.length}.
          </p>
          <div className="flex flex-wrap gap-2">
            {restantes.map((n, i) => (
              <button key={`${n}-${i}`} type="button" onClick={() => echar(n)}
                className="panel px-3 py-2 font-ui text-[12px] hover:border-[var(--color-bronze)] transition-colors"
                style={{ color: "var(--color-warm)" }}>
                {nombres[n] ?? `Material ${n}`}
              </button>
            ))}
          </div>
        </>
      )}

      {/* ----------------------------- 2 · Pipeta ----------------------------- */}
      {fase === "pipeta" && (
        <>
          <p className="font-ui text-[12px] mb-1" style={{ color: "var(--color-warm)" }}>
            <strong>2 · Pipeta.</strong> Párala dentro de la banda verde.
          </p>
          <p className="font-ui text-[11px] mb-1" style={{ color: "var(--color-dim)" }}>
            En el centro, +1. Dentro de la banda, 0. Fuera, −1.
          </p>
          <div className="manip-banda">
            <span className="manip-cursor" style={{ left: `${(reducido ? 0.5 : pos) * 100}%` }} />
          </div>
        </>
      )}

      {/* ------------------------------ 3 · Cocer ------------------------------ */}
      {fase === "cocer" && (
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
            <path d={arco(COCER.banda[0], COCER.banda[1])} fill="none" stroke="var(--color-bronze-deep)" strokeWidth="9" strokeLinecap="butt" opacity="0.7" />
            <path d={arco(COCER.centro[0], COCER.centro[1])} fill="none" stroke="var(--color-verdant)" strokeWidth="9" strokeLinecap="butt" />
            <line x1="60" y1="46" x2={aguja(reducido ? 0.5 : pos).x} y2={aguja(reducido ? 0.5 : pos).y}
              stroke="var(--color-bronze-bright)" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="60" cy="46" r="4" fill="var(--color-bronze)" />
          </svg>
        </>
      )}

      {/* --------------------------- El botón rojo --------------------------- */}
      {enMovimiento && (
        <div className="flex gap-2 mt-3">
          <button type="button" className="manip-parar" onClick={parar}>
            <i className="fas fa-stop mr-2" />
            {fase === "pipeta" ? "SOLTAR LA PIPETA" : "PARAR LA AGUJA"}
            <span className="ml-2 font-normal opacity-80">(o espacio)</span>
          </button>
        </div>
      )}

      {/* Lo que llevas sacado, siempre a la vista. */}
      {puntos.length > 0 && (
        <div className="flex items-center gap-2 mt-3 font-ui text-[11px]" style={{ color: "var(--color-muted)" }}>
          Llevas:
          {puntos.map((p, i) => (
            <span key={i} className={`manip-punto ${p > 0 ? "is-bien" : p < 0 ? "is-mal" : ""}`}>
              {p > 0 ? `+${p}` : p}
            </span>
          ))}
          <span>→ total {fmt(totalManipulacion(puntos))}</span>
        </div>
      )}
    </div>
  );
}

function fmt(n: number): string {
  return n > 0 ? `+${n}` : `${n}`;
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
