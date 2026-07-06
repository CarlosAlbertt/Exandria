"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

export type Chapter = {
  key: string;
  label: string;
  /** contenido de la página izquierda (índice/opciones o panel único) */
  left: ReactNode;
  /** contenido de la página derecha (detalle); si falta, izquierda ocupa todo */
  right?: ReactNode;
};

type Props = {
  chapters: Chapter[];
  activeKey: string;
  /** capítulos alcanzables; el resto salen bloqueados */
  unlockedKeys: string[];
  onSelect: (key: string) => void;
  /** en móvil, si true muestra la página derecha (detalle) en vez de la izquierda */
  mobileShowRight?: boolean;
};

/**
 * Carcasa del tomo del creador de personaje. Presentacional: pinta las
 * pestañas de capítulo, el lomo y las dos páginas, y anima el giro 3D al
 * cambiar de capítulo. No conoce la lógica de personaje.
 */
export default function CharacterBook({ chapters, activeKey, unlockedKeys, onSelect, mobileShowRight }: Props) {
  const [turning, setTurning] = useState(false);
  const prev = useRef(activeKey);

  useEffect(() => {
    if (prev.current !== activeKey) {
      prev.current = activeKey;
      setTurning(true);
      const t = setTimeout(() => setTurning(false), 520);
      return () => clearTimeout(t);
    }
  }, [activeKey]);

  const ch = chapters.find((c) => c.key === activeKey) ?? chapters[0];
  const hasRight = !!ch.right;

  return (
    <div className="tome">
      <div className="tome-tabs" role="tablist" aria-label="Capítulos">
        {chapters.map((c) => {
          const locked = !unlockedKeys.includes(c.key);
          return (
            <button
              key={c.key}
              role="tab"
              className="tome-tab"
              data-active={c.key === activeKey}
              data-locked={locked}
              disabled={locked}
              aria-selected={c.key === activeKey}
              onClick={() => !locked && onSelect(c.key)}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      <div className={`tome-page left ${mobileShowRight && hasRight ? "mobile-hidden" : ""}`}>
        {ch.left}
      </div>
      {hasRight && <div className="tome-spine" />}
      {hasRight && (
        <div className={`tome-page right ${turning ? "turning" : ""} ${mobileShowRight ? "" : "mobile-hidden"}`}>
          {ch.right}
        </div>
      )}
    </div>
  );
}
