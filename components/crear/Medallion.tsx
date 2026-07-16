"use client";

import { useEffect, useState } from "react";

// Medallón central del círculo de invocación.
// `src`: ruta de la imagen (p. ej. "/classes/mago.jpg"). Si no hay src, o la
// imagen falla al cargar, cae a una SILUETA RÚNICA generativa tintada con
// `tint` — no un hueco vacío (hoy las 36 especies no tienen arte).
export default function Medallion({
  src,
  caption,
  tint,
}: {
  src?: string | null;
  caption?: string | null;
  tint?: string | null;
}) {
  const [failed, setFailed] = useState(false);

  // Si el usuario cambia de clase/especie, `src` cambia. Sin este reset,
  // un fallo de carga anterior dejaría `failed` en true para siempre y una
  // imagen nueva y válida mostraría la silueta en lugar del arte real.
  useEffect(() => {
    setFailed(false);
  }, [src]);

  const showImg = !!src && !failed;

  return (
    <div className="medallion">
      {showImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src as string} alt={caption ?? ""} onError={() => setFailed(true)} />
      ) : (
        <div
          className="medallion-silo"
          style={tint ? ({ ["--tint" as string]: tint } as React.CSSProperties) : undefined}
        />
      )}
      {caption && <div className="medallion-cap">{caption}</div>}
    </div>
  );
}
