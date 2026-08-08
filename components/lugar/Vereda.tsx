"use client";
import { FRANJAS, franjaVecina, profundidadDe, type Franja } from "@/data/bosque";
import { idFranja } from "@/data/lugares";

/**
 * La vereda del bosque: cuánto te has metido, y las dos direcciones DICHAS.
 *
 * ⚠️ **Un pueblo no necesita esto y el bosque sí.** Un pueblo es un sitio: llegas
 * y estás. El bosque es una profundidad, y con las tarjetas de «Adónde ir» eso no
 * se ve — desde la espesura salen **dos puertas gemelas**, una hacia dentro y otra
 * hacia fuera, y no hay forma de saber cuál es cuál sin leerse los blurbs. Aquí
 * las direcciones van con palabras («volver a la linde» / «adentrarse en el
 * corazón») y los tres hitos dicen dónde estás sin contar nada.
 *
 * ⚠️ **La profundidad sale del ORDEN de `FRANJAS`**, no de un número escrito
 * aparte. Un segundo sitio donde dijera «la espesura es la 2» se desincronizaría
 * en cuanto alguien metiera una franja en medio.
 *
 * Solo se mueve por donde el grafo deja: se le pasa `puedeIr` desde la pantalla,
 * que es la misma puerta que vigila `check-lugares`. La vereda es una lectura
 * cómoda del grafo, **no un atajo que se lo salte**.
 */
export default function Vereda({
  franja, salidaAlPueblo, onIr, puedeIr, yendo,
}: {
  franja: Franja;
  /** El nodo del pueblo por el que se sale, si desde aquí se sale. */
  salidaAlPueblo: { id: string; nombre: string } | null;
  onIr: (nodoId: string) => void;
  puedeIr: (nodoId: string) => boolean;
  yendo: string | null;
}) {
  const aqui = profundidadDe(franja);
  const dentro = franjaVecina(franja, "dentro");
  const fuera = franjaVecina(franja, "fuera");

  // Hacia fuera: la franja anterior si la hay, y si no el pueblo por el que se
  // entró. Desde la linde «volver» no es una franja, es salir del bosque.
  const atras = fuera
    ? { id: idFranja(fuera), texto: `Volver a ${FRANJAS.find((f) => f.key === fuera)!.label.toLowerCase()}` }
    : salidaAlPueblo
      ? { id: salidaAlPueblo.id, texto: `Salir a ${salidaAlPueblo.nombre}` }
      : null;
  const adelante = dentro
    ? { id: idFranja(dentro), texto: `Adentrarse en ${FRANJAS.find((f) => f.key === dentro)!.label.toLowerCase()}` }
    : null;

  const ocupado = yendo !== null;

  return (
    <div className="lug-vereda">
      <div className="raya" />
      <div className="lug-hitos">
        {FRANJAS.map((f, i) => {
          const n = i + 1;
          return (
            <div key={f.key} className={`lug-hito${n === aqui ? " aqui" : n < aqui ? " hecho" : ""}`}>
              <span className="punto">
                <i className={`fas ${n === aqui ? "fa-location-dot" : n < aqui ? "fa-check" : "fa-tree"}`} />
              </span>
              <span className="nm">{f.label}</span>
            </div>
          );
        })}
      </div>
      <div className="lug-pasos">
        {/* Los botones existen pero se deshabilitan si el grafo no lo permite,
            en vez de desaparecer: un hueco no explica por qué no puedes. */}
        <button className="lug-paso" disabled={!atras || ocupado || !puedeIr(atras.id)}
          onClick={() => atras && onIr(atras.id)}>
          <i className={`fas ${yendo && atras && yendo === atras.id ? "fa-spinner fa-spin" : "fa-arrow-left"} mr-2`} />
          {atras?.texto ?? "No hay por dónde salir"}
        </button>
        <button className="lug-paso dentro" disabled={!adelante || ocupado || !puedeIr(adelante.id)}
          onClick={() => adelante && onIr(adelante.id)}>
          {adelante?.texto ?? "No hay más adentro"}
          <i className={`fas ${yendo && adelante && yendo === adelante.id ? "fa-spinner fa-spin" : "fa-arrow-right"} ml-2`} />
        </button>
      </div>
    </div>
  );
}
