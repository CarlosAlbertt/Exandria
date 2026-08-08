"use client";
import { FRANJAS, type Franja } from "@/data/bosque";

/**
 * «Lo que se ve venir»: el TONO de la franja.
 *
 * ⚠️ **No es la tabla de encuentros, y ahí está la gracia.** El jugador necesita
 * saber qué clase de sitio es antes de meterse, pero la `nota` de cada bicho en
 * `ENCUENTROS_VERDANTE` está escrita **para el DM** y enseñársela sería contarle
 * qué va a salir. Un rastro dice lo que un guarda forestal te diría: rodadas de
 * carro, tela ordenada, una raya de setas blancas.
 */
export default function RastrosBosque({ franja }: { franja: Franja }) {
  const rastros = FRANJAS.find((f) => f.key === franja)?.rastros ?? [];
  if (rastros.length === 0) return null;

  return (
    <section>
      <div className="lug-sect"><span className="lug-cinta">Lo que se ve venir</span></div>
      <div className="lug-rastros">
        {rastros.map((r) => (
          <div key={r.titulo} className="lug-rastro">
            <i className={`fas ${r.icono}`} />
            <b>{r.titulo}</b>
            <span>{r.texto}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
