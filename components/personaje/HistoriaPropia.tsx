"use client";

import { useEffect, useRef, useState } from "react";
import { loadActiveCharacter, saveCharacter } from "@/lib/character";

/** Tope de la columna, el mismo que el asistente de creación. */
const MAX = 12000;

/**
 * La historia del personaje, **editable después de haberlo creado**.
 *
 * Se separa del resto de la hoja a propósito. La ficha del jugador es de solo
 * lectura —las aptitudes, la clase y el equipo los mueve el DM—, pero **su
 * pasado es suyo**: casi nadie lo trae escrito el día que se sienta a crear el
 * personaje, y hasta ahora la única forma de escribirlo era volver al asistente
 * de creación entero.
 *
 * Escribe la MISMA columna (`lore`) que el paso de resumen de `/crear`, así que
 * lo que se escriba aquí es lo que el DM ve en Panel DM › Grupo.
 */
export default function HistoriaPropia({ userId }: { userId: string | null }) {
  const [id, setId] = useState<string | null>(null);
  const [texto, setTexto] = useState("");
  const [listo, setListo] = useState(false);
  const [estado, setEstado] = useState<"limpio" | "sucio" | "guardando" | "guardado" | "error">("limpio");
  const [error, setError] = useState<string | null>(null);
  // Lo último que se sabe que está en la base: con esto se decide si hay algo
  // que guardar, sin tener que confiar en un flag que se puede quedar colgado.
  const guardado = useRef("");

  useEffect(() => {
    if (!userId) { setListo(true); return; }
    let vivo = true;
    loadActiveCharacter(userId).then((row) => {
      if (!vivo) return;
      if (row) {
        setId(row.id);
        const t = typeof row.lore === "string" ? row.lore : "";
        setTexto(t);
        guardado.current = t;
      }
      setListo(true);
    });
    return () => { vivo = false; };
  }, [userId]);

  async function guardar() {
    if (!id || estado === "guardando") return;
    setEstado("guardando");
    setError(null);
    // Se captura ANTES de esperar: si se sigue escribiendo mientras guarda, lo
    // que quede en la base tiene que ser lo que se envió, no lo que hay ahora.
    const enviado = texto;
    const err = await saveCharacter(id, { lore: enviado });
    if (err) { setEstado("error"); setError(err); return; }
    guardado.current = enviado;
    // Si mientras guardaba siguió escribiendo, sigue habiendo cambios sin
    // guardar: no se puede decir «guardado» y quedarse tan ancho.
    setEstado(enviado === texto ? "guardado" : "sucio");
  }

  if (!listo) return null;
  // Sin ficha no hay historia que escribir. El asistente de creación ya la pide.
  if (!id) return null;

  const hayCambios = texto !== guardado.current;

  return (
    <section className="panel-raised p-6 mt-8">
      <div className="flex items-baseline justify-between gap-3 mb-1.5">
        <p className="eyebrow !mb-0">
          <i className="fas fa-feather-pointed mr-1.5" style={{ color: "var(--color-bronze)" }} />
          Historia del personaje
        </p>
        <span className="font-ui text-[11px]" style={{ color: "var(--color-dim)" }}>
          {texto.length}/{MAX}
        </span>
      </div>
      <p className="font-ui text-[13px] mb-3" style={{ color: "var(--color-muted)" }}>
        Su pasado, motivaciones, secretos… Puedes escribirla ahora o dejarla para más
        adelante, y cambiarla cuando quieras. La lee el DM en las fichas del grupo.
      </p>

      <textarea
        value={texto}
        onChange={(e) => { setTexto(e.target.value); setEstado("sucio"); }}
        rows={10}
        maxLength={MAX}
        placeholder="Nacido en las brumas de Pleabruma, juré no volver a…"
        className="w-full bg-[var(--color-night)] rounded-lg px-4 py-3 font-body text-[15px] leading-relaxed outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)] resize-y"
        style={{ color: "var(--color-warm)", minHeight: "180px" }}
      />

      <div className="flex items-center gap-3 mt-3">
        <button
          onClick={() => void guardar()}
          disabled={!hayCambios || estado === "guardando"}
          className="btn-gold !py-2 text-[13px] disabled:opacity-40"
        >
          <i className="fas fa-floppy-disk mr-2" />
          {estado === "guardando" ? "Guardando…" : "Guardar historia"}
        </button>

        {/* El estado se dice siempre: un botón que se apaga sin más se lee como
            que algo ha fallado. */}
        {estado === "guardado" && !hayCambios && (
          <span className="font-ui text-[12px]" style={{ color: "var(--color-verdant)" }}>
            <i className="fas fa-check mr-1.5" />Guardada.
          </span>
        )}
        {hayCambios && estado !== "guardando" && (
          <span className="font-ui text-[12px]" style={{ color: "var(--color-dim)" }}>
            Sin guardar.
          </span>
        )}
        {estado === "error" && (
          <span className="font-ui text-[12px]" style={{ color: "var(--color-ember)" }}>
            No se pudo guardar. {error}
          </span>
        )}
      </div>
    </section>
  );
}
