"use client";
import type { Nodo } from "@/data/lugares";
import { etiquetaDeSalida } from "@/data/lugares";

/**
 * Las tarjetas a las que se puede ir desde aquí.
 *
 * La imagen la pone el DM y puede no estar: sin ella la tarjeta sigue siendo
 * una tarjeta, con su icono y su descripción. **No se deja un hueco roto ni un
 * marco vacío** — el sitio existe aunque nadie le haya dibujado nada todavía.
 */
export default function Salidas({
  desde, salidas, onIr, yendo,
}: {
  desde: string;
  salidas: Nodo[];
  onIr: (id: string) => void;
  yendo: string | null;
}) {
  if (salidas.length === 0) return null;

  return (
    <section className="mt-6">
      <p className="eyebrow mb-2"><i className="fas fa-compass mr-2" style={{ color: "var(--color-bronze)" }} />Adónde ir</p>
      <div className="grid sm:grid-cols-2 gap-3">
        {salidas.map((n) => {
          // La misma puerta contada desde los dos lados: la franja se llama «La
          // linde» cuando ya estás dentro, pero desde Byroden es «El bosque».
          const etq = etiquetaDeSalida(desde, n.id);
          const nombre = etq?.nombre ?? n.nombre;
          const blurb = etq?.blurb ?? n.blurb;
          const ocupado = yendo !== null;
          return (
            <button
              key={n.id}
              onClick={() => onIr(n.id)}
              disabled={ocupado}
              className="panel-raised text-left overflow-hidden hover:border-[var(--color-bronze)] transition-colors disabled:opacity-40 flex flex-col"
            >
              {n.imagen ? (
                <img src={n.imagen} alt="" loading="lazy" className="w-full h-28 object-cover border-b border-[var(--color-line)]" />
              ) : (
                <div className="w-full h-28 flex items-center justify-center border-b border-[var(--color-line)]" style={{ background: "var(--color-night)" }}>
                  <i className={`fas ${n.icono} text-3xl`} style={{ color: "var(--color-bronze)", opacity: 0.55 }} />
                </div>
              )}
              <span className="p-3">
                <span className="flex items-center gap-2 font-display font-extrabold text-[15px]" style={{ color: "var(--color-parch)" }}>
                  <i className={`fas ${n.icono}`} style={{ color: "var(--color-bronze)" }} />
                  {nombre}
                  {yendo === n.id && <i className="fas fa-spinner fa-spin ml-auto text-[12px]" style={{ color: "var(--color-bronze)" }} />}
                </span>
                <span className="block font-body text-[13px] leading-relaxed mt-1" style={{ color: "var(--color-muted)" }}>{blurb}</span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
