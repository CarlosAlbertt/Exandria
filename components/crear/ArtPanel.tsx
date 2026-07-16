"use client";

import { useEffect, useState } from "react";

// Panel de arte vertical (el arte de clase es 659×1025). Si hay imagen, el
// retrato; si no, la SILUETA RÚNICA — nunca un hueco vacío. Hereda la silueta
// del antiguo Medallion, pero sin recortar en círculo.
//
// Hoy: public/classes tiene 11 de 13 (faltan bardo y paladin) y public/species
// está vacío. El panel se reserva igualmente: en cuanto se suelte el .jpg
// aparece solo, sin tocar código.
export default function ArtPanel({
  src,
  alt,
  tint,
}: {
  src?: string | null;
  alt?: string | null;
  tint?: string | null;
}) {
  const [failed, setFailed] = useState(false);

  // Al cambiar de clase/especie cambia `src`. Sin este reset, un fallo de carga
  // anterior dejaría `failed` en true para siempre y una imagen nueva y válida
  // mostraría la silueta en lugar del arte real.
  useEffect(() => {
    setFailed(false);
  }, [src]);

  const showImg = !!src && !failed;

  return (
    <div className="art-panel">
      {showImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src as string} alt={alt ?? ""} onError={() => setFailed(true)} />
      ) : (
        <div
          className="art-silo"
          style={tint ? ({ ["--tint" as string]: tint } as React.CSSProperties) : undefined}
        />
      )}
    </div>
  );
}
