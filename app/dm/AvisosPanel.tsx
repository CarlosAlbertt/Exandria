"use client";
// El probador de avisos. DM-only, como todo lo de este panel.
//
// ⚠️ **Por qué existe**: los avisos saltan en sitios que cuesta reproducir a
// mano —aceptar un encargo, cerrar un descanso largo, acertar una tirada de
// saber— y el estilo de SILEO sobre el tema oscuro hay que MIRARLO, no
// imaginarlo. Con esto se ven los diez en diez segundos.
//
// ⚠️ **Y por qué es DM-only y no un `window.__avisar`**: un jugador que pueda
// dispararse un «Encargo completado» falso tiene una forma muy tonta de
// confundir a su propia mesa. Además, el código de depuración colgado en
// `window` no se quita nunca.
//
// La lista sale de `TIPOS_AVISO`, así que **cuando alguien añada un tipo nuevo
// aparece aquí solo**. Si saliera de una lista escrita a mano, el probador se
// quedaría viejo sin que nadie lo notara — que es justo lo que le pasó al gate
// de `check-lugares` contando cabezas.
import { avisar } from "@/components/Avisos";
import { textoDe, TIPOS_AVISO, type Aviso } from "@/lib/avisos";

/**
 * Un ejemplar de cada tipo, con datos de mentira reconocibles.
 *
 * Los textos son de mentira A PROPÓSITO («Encargo de prueba», 42 po): si
 * alguien ve uno de estos en una partida de verdad, sabe al instante que salió
 * de aquí y no de la app.
 */
const MUESTRAS: Record<(typeof TIPOS_AVISO)[number], Aviso> = {
  "mision-aceptada": { tipo: "mision-aceptada", titulo: "Encargo de prueba", recompensa: "42 po" },
  "mision-ya-la-tenias": { tipo: "mision-ya-la-tenias", titulo: "Encargo de prueba" },
  "mision-completada": { tipo: "mision-completada", titulo: "Encargo de prueba", recompensa: "42 po y una jarra" },
  "mision-fallida": { tipo: "mision-fallida", titulo: "Encargo de prueba" },
  objeto: { tipo: "objeto", name: "Frasco de aceite", qty: 2 },
  oro: { tipo: "oro", cantidad: 42 },
  pista: { tipo: "pista", texto: "Las lápidas apuntan todas al mismo punto del bosque." },
  saber: { tipo: "saber", cuantas: 2 },
  nivel: { tipo: "nivel", nivel: 3 },
  descanso: { tipo: "descanso", largo: true },
};

export default function AvisosPanel() {
  return (
    <section className="panel p-5">
      <p className="eyebrow mb-3">
        <i className="fas fa-bell mr-1.5" style={{ color: "var(--color-bronze)" }} />Probador de avisos
      </p>
      <p className="font-ui text-[12px] mb-3" style={{ color: "var(--color-dim)" }}>
        Dispara cada aviso para ver cómo queda. Solo lo ves tú, y no toca nada:
        no crea misiones, no mueve oro y no escribe en ninguna ficha.
      </p>

      <div className="flex flex-wrap gap-1.5">
        {TIPOS_AVISO.map((t) => {
          const muestra = MUESTRAS[t];
          const { title, tono } = textoDe(muestra);
          return (
            <button
              key={t}
              onClick={() => avisar(muestra)}
              title={`${t} · ${tono}`}
              className="btn-ghost !py-1 !px-2.5 text-[11px]"
            >
              {title}
            </button>
          );
        })}

        {/* El caso que no se ve nunca en pruebas sueltas: varios a la vez. SILEO
            los apila, y apilados es como se ven de verdad al comprar algo (dos
            avisos) o al cerrar una misión con recompensa. */}
        <button
          onClick={() => { avisar({ tipo: "objeto", name: "Cuerda de cáñamo" }); avisar({ tipo: "oro", cantidad: -12 }); avisar({ tipo: "mision-completada", titulo: "Encargo de prueba", recompensa: "42 po" }); }}
          className="btn-gold !py-1 !px-2.5 text-[11px]"
        >
          <i className="fas fa-layer-group mr-1" />Tres a la vez
        </button>
      </div>
    </section>
  );
}
