"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ForjaSvg from "@/components/taller/ForjaSvg";
import { useInventarioVivo } from "@/lib/useInventarioVivo";
import { recetasDeArena, recetasSabidas, sabeOficio } from "@/lib/recetario";
import {
  CALDEAR, TEMPLAR, GOLPES, TOLERANCIA_GOLPE,
  puntoCaldear, puntoMartillar, puntoTemplar, tramoDeCalor,
} from "@/lib/forjado";
import { totalManipulacion, type Punto } from "@/lib/manipulacion";
import type { ModoDm } from "@/lib/tallerDm";

/**
 * El taller de **Forja**.
 *
 * ⚠️ **Hoy no hay nada que forjar.** Las 32 recetas del repo son todas de
 * alquimia: no existe catálogo de armas, armaduras ni piezas, y eso lo dicta el
 * DM — no se rellena a ojo. Así que esta pantalla trae la fragua y las tres
 * fases **jugables**, y dice en voz alta que lo que falta es el qué, no el cómo.
 *
 * Se construye igual la cáscara porque es lo que costó tres tandas de silencio
 * en alquimia: cuando lleguen las piezas, lo único que falta es la lista.
 *
 * Las tres fases son las del boceto aprobado: **caldear** con el fuelle hasta el
 * rojo cereza, **martillar** tres golpes a compás y **templar** a tiempo. La
 * aritmética entera vive en `lib/forjado.ts`, que es capa pura y la que mira el
 * gate (`scripts/check-forjado.ts`); aquí solo se recogen las manos.
 */

type Fase = "quieto" | "caldear" | "martillar" | "templar" | "hecho";

/** Ciclos por segundo de los cursores que van y vienen. */
const VELOCIDAD = { caldear: 0.42, templar: 0.7 };
/** Milisegundos entre golpe y golpe del compás. */
const COMPAS_MS = 900;

function vaiven(ms: number, ciclosPorSegundo: number): number {
  const t = (ms / 1000) * ciclosPorSegundo;
  const f = t % 2;
  return f <= 1 ? f : 2 - f;
}

export default function Fragua({ userId, dm }: { userId: string | null; dm: ModoDm | null }) {
  // La ficha se lee por el MISMO camino que el caldero. Si la fragua se
  // inventara el suyo, el día que forje de verdad tocaría la bolsa de otra
  // manera que el resto de la app.
  const inv = useInventarioVivo(userId, "self");
  const skills: string[] = useMemo(
    () => (Array.isArray(inv.character?.skills) ? inv.character!.skills as string[] : []),
    [inv.character],
  );
  const lore: string[] = useMemo(
    () => (Array.isArray(inv.character?.lore_unlocked) ? inv.character!.lore_unlocked as string[] : []),
    [inv.character],
  );
  const [fase, setFase] = useState<Fase>("quieto");
  const [pos, setPos] = useState(0);
  const [calor, setCalor] = useState(0);
  const [puntos, setPuntos] = useState<Punto[]>([]);
  const [golpes, setGolpes] = useState<number[]>([]);
  const [reducido, setReducido] = useState(false);
  const inicio = useRef(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    setReducido(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  const libro = useMemo(
    () => (dm ? recetasDeArena("forja") : recetasSabidas("forja", skills, lore)),
    [dm, skills, lore],
  );
  const tieneOficio = sabeOficio(skills, "forja");

  const moviendo = fase === "caldear" || fase === "templar";

  useEffect(() => {
    if (!moviendo || reducido) return;
    inicio.current = performance.now();
    const paso = (ahora: number) => {
      const p = vaiven(ahora - inicio.current, fase === "caldear" ? VELOCIDAD.caldear : VELOCIDAD.templar);
      setPos(p);
      if (fase === "caldear") setCalor(p);
      raf.current = requestAnimationFrame(paso);
    };
    raf.current = requestAnimationFrame(paso);
    return () => { if (raf.current !== null) cancelAnimationFrame(raf.current); raf.current = null; };
  }, [fase, moviendo, reducido]);

  // El compás del martillo arranca al entrar en la fase, y los desvíos se miden
  // contra él. `inicio` se reusa: es el mismo reloj para las tres fases.
  useEffect(() => {
    if (fase !== "martillar") return;
    inicio.current = performance.now();
    setGolpes([]);
  }, [fase]);

  const anotar = useCallback((p: Punto, siguiente: Fase) => {
    setPuntos((prev) => [...prev, p]);
    setFase(siguiente);
  }, []);

  /** El botón rojo y `espacio` hacen lo mismo, siempre. */
  const actuar = useCallback(() => {
    const p = reducido ? 0.5 : pos;
    if (fase === "caldear") { setCalor(p); anotar(puntoCaldear(p), "martillar"); return; }
    if (fase === "templar") { anotar(puntoTemplar(p), "hecho"); return; }
    if (fase !== "martillar") return;

    // Un golpe: se mide cuánto se ha desviado del compás, en fracción de compás.
    // La distancia se toma al pulso MÁS CERCANO (por delante o por detrás), que
    // es lo que hace que adelantarse cueste lo mismo que retrasarse.
    const t = performance.now() - inicio.current;
    const f = (t % COMPAS_MS) / COMPAS_MS;
    const desvio = Math.min(f, 1 - f);
    const next = [...golpes, desvio];
    setGolpes(next);
    if (next.length >= GOLPES) anotar(puntoMartillar(next), "templar");
  }, [fase, pos, golpes, reducido, anotar]);

  useEffect(() => {
    if (fase === "quieto" || fase === "hecho") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      e.preventDefault();
      actuar();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fase, actuar]);

  function empezar() {
    setPuntos([]); setGolpes([]); setCalor(0); setPos(0); setFase("caldear");
  }
  function parar() {
    setFase("quieto"); setPuntos([]); setGolpes([]); setCalor(0);
  }

  const tramo = tramoDeCalor(calor);
  const cursor = reducido ? 0.5 : pos;
  const bono = totalManipulacion(puntos);

  const etiquetaBoton = fase === "caldear" ? "PARAR EL FUELLE"
    : fase === "martillar" ? `GOLPEAR (${golpes.length + 1} de ${GOLPES})`
      : "AL AGUA";

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* ------------------------------ EL LIBRO ------------------------------ */}
      <section>
        <p className="eyebrow mb-3">
          <i className="fas fa-book mr-2" style={{ color: "var(--color-bronze)" }} />
          {dm ? "El recetario entero" : "Tu libro de forja"}
        </p>
        <div className="panel-raised p-4">
          <p className="font-ui text-[13px] italic" style={{ color: "var(--color-dim)" }}>
            {libro.length === 0
              ? "No hay nada que forjar todavía. Las piezas —armas, armaduras, herrajes— las dicta el DM, y hasta que existan la fragua enciende pero no produce."
              : `${libro.length} pieza${libro.length === 1 ? "" : "s"}.`}
          </p>
          {!dm && !tieneOficio && (
            <p className="font-ui text-[12px] mt-3" style={{ color: "var(--color-muted)" }}>
              Además te falta la pericia de oficio <strong>Forja</strong>, que se elige al crear el
              personaje o al llegar a nivel 7.
            </p>
          )}
        </div>
      </section>

      {/* ------------------------------ LA FRAGUA ----------------------------- */}
      <section>
        <p className="eyebrow mb-3">
          <i className="fas fa-hammer mr-2" style={{ color: "var(--color-ember)" }} />
          La fragua
        </p>

        <div className="panel-raised p-4">
          <ForjaSvg
            calor={calor}
            fuelle={fase === "caldear" || fase === "martillar"}
            martillando={fase === "martillar"}
            templando={fase === "templar"}
          />

          {/* ------------------------------ Caldear ---------------------------- */}
          {fase === "caldear" && (
            <>
              <p className="font-ui text-[12px] mt-3 mb-1" style={{ color: "var(--color-warm)" }}>
                <strong>1 · Caldear.</strong> Para el fuelle en el <strong>rojo cereza</strong>.
              </p>
              <div className="forja-escala">
                <span className="forja-banda" style={{
                  left: `${CALDEAR.centro[0] * 100}%`,
                  width: `${(CALDEAR.centro[1] - CALDEAR.centro[0]) * 100}%`,
                }} />
                <span className="manip-cursor" style={{ left: `${cursor * 100}%` }} />
              </div>
              <p className="font-ui text-[10.5px] mt-1" style={{ color: "var(--color-dim)" }}>
                frío · rojo oscuro · <strong style={{ color: tramo.color }}>{tramo.nombre}</strong> · naranja · blanco
              </p>
            </>
          )}

          {/* ----------------------------- Martillar --------------------------- */}
          {fase === "martillar" && (
            <>
              <p className="font-ui text-[12px] mt-3 mb-1" style={{ color: "var(--color-warm)" }}>
                <strong>2 · Martillar.</strong> Tres golpes <strong>a compás</strong>.
              </p>
              <p className="font-ui text-[11px] mb-2" style={{ color: "var(--color-dim)" }}>
                Los tres a tiempo, +1. Dos, 0. Uno o ninguno, −1.
              </p>
              <div className="flex gap-2 justify-center">
                {Array.from({ length: GOLPES }, (_, i) => {
                  const dado = golpes[i];
                  const bien = typeof dado === "number" && dado <= TOLERANCIA_GOLPE;
                  return (
                    <span key={i}
                      className={`forja-golpe${dado === undefined ? "" : bien ? " is-bien" : " is-mal"}${i === golpes.length ? " is-ahora" : ""}`}>
                      {dado === undefined ? i + 1 : bien ? "✓" : "✗"}
                    </span>
                  );
                })}
              </div>
            </>
          )}

          {/* ------------------------------ Templar ---------------------------- */}
          {fase === "templar" && (
            <>
              <p className="font-ui text-[12px] mt-3 mb-1" style={{ color: "var(--color-warm)" }}>
                <strong>3 · Templar.</strong> Al agua <strong>a tiempo</strong>.
              </p>
              <p className="font-ui text-[11px] mb-1" style={{ color: "var(--color-dim)" }}>
                Muy pronto queda blanda; muy tarde se raja.
              </p>
              <div className="forja-escala is-temple">
                <span className="forja-banda" style={{
                  left: `${TEMPLAR.centro[0] * 100}%`,
                  width: `${(TEMPLAR.centro[1] - TEMPLAR.centro[0]) * 100}%`,
                }} />
                <span className="manip-cursor" style={{ left: `${cursor * 100}%` }} />
              </div>
            </>
          )}

          {/* --------------------------- El botón rojo -------------------------- */}
          {fase !== "quieto" && fase !== "hecho" && (
            <div className="flex gap-2 mt-4">
              <button type="button" className="manip-parar" onClick={actuar}>
                <i className="fas fa-hammer mr-2" />
                {etiquetaBoton}
                <span className="ml-2 font-normal opacity-80">(o espacio)</span>
              </button>
              <button type="button" onClick={parar}
                className="panel px-3 font-ui text-[12px] font-bold" style={{ color: "var(--color-muted)" }}>
                dejarlo
              </button>
            </div>
          )}

          {/* ----------------------------- El arranque -------------------------- */}
          {fase === "quieto" && (
            <>
              <p className="font-ui text-[12px] mt-3 text-center" style={{ color: "var(--color-muted)" }}>
                {dm
                  ? "Caja de arena: las tres fases son de verdad, pero no hay pieza que salga de aquí."
                  : "Caldear, martillar y templar. La manipulación modifica la tirada, con tope ±3."}
              </p>
              <button type="button" onClick={empezar} className="btn-gold w-full !py-2.5 text-[13px] mt-3">
                <i className="fas fa-fire mr-2" />
                Probar las tres fases
              </button>
            </>
          )}

          {/* ----------------------------- El resultado ------------------------- */}
          {fase === "hecho" && (
            <>
              <div className="flex items-center gap-2 justify-center mt-4 font-ui text-[12px]"
                style={{ color: "var(--color-muted)" }}>
                {puntos.map((p, i) => (
                  <span key={i} className={`manip-punto ${p > 0 ? "is-bien" : p < 0 ? "is-mal" : ""}`}>
                    {p > 0 ? `+${p}` : p}
                  </span>
                ))}
                <span>→ manipulación <strong style={{ color: "var(--color-bronze-bright)" }}>
                  {bono > 0 ? `+${bono}` : bono}
                </strong></span>
              </div>
              <p className="font-ui text-[11px] mt-3 text-center" style={{ color: "var(--color-dim)" }}>
                Eso es lo que le sumaría a tu tirada de Forja. No hay pieza que fabricar todavía.
              </p>
              <button type="button" onClick={empezar} className="btn-gold w-full !py-2.5 text-[13px] mt-3">
                Otra vez
              </button>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
