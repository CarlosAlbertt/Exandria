"use client";

import { useState } from "react";

type Props = {
  src?: string;
  alt: string;
  size?: "sm" | "lg";
  /** icono Font Awesome de fallback, p. ej. "fa-dragon" */
  icon?: string;
};

/**
 * Marco de retrato. Si `src` existe y carga, muestra la imagen enmarcada.
 * Si no hay `src` o falla la carga, muestra un placeholder estilizado
 * (marco de bronce + icono). Pensado para que el usuario suelte
 * los .jpg más tarde sin romper el layout (igual que los mapas de pueblo).
 */
export default function PortraitFrame({ src, alt, size = "sm", icon }: Props) {
  const [failed, setFailed] = useState(false);
  const showImg = src && !failed;
  return (
    <div className={`portrait-frame portrait-${size}`} title={alt}>
      {showImg ? (
        <img src={src} alt={alt} onError={() => setFailed(true)} loading="lazy" />
      ) : (
        <span className="portrait-ph" aria-label={alt}>
          <i className={`fas ${icon ?? "fa-image"}`} />
        </span>
      )}
    </div>
  );
}
