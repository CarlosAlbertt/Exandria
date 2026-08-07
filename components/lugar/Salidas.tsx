"use client";
import type { Nodo } from "@/data/lugares";
import { etiquetaDeSalida } from "@/data/lugares";

/**
 * Las puertas: adónde se puede ir desde aquí.
 *
 * Cada una es una tarjeta de la hoja con su **sello de lacre** y el canto
 * trenzado a la izquierda, como en `docs/bocetos/2026-08-07-lugar-con-arte.html`.
 *
 * ⚠️ **Ya no llevan miniatura, y es a propósito.** Antes se pintaba aquí la
 * `imagen` del nodo, o un recuadro con el icono cuando no había. La ilustración
 * de un sitio pasa a verse **al entrar en él**, a sangre y a todo ancho; en una
 * lista de seis competía consigo misma y obligaba a inventar un hueco para los
 * sitios sin dibujar. El icono va ahora en el lacre, que siempre está.
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
    <section>
      <div className="lug-sect"><span className="lug-cinta">Adónde ir</span></div>
      <div className="lug-grid">
        {salidas.map((n) => {
          // La misma puerta contada desde los dos lados: la franja se llama «La
          // linde» cuando ya estás dentro, pero desde Byroden es «El bosque».
          const etq = etiquetaDeSalida(desde, n.id);
          const nombre = etq?.nombre ?? n.nombre;
          const blurb = etq?.blurb ?? n.blurb;
          return (
            <button
              key={n.id}
              onClick={() => onIr(n.id)}
              disabled={yendo !== null}
              className="lug-puerta"
            >
              <span className="lug-lacre">
                <i className={`fas ${yendo === n.id ? "fa-spinner fa-spin" : n.icono}`} />
              </span>
              <span className="t">{nombre}</span>
              <span className="s">{blurb}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
