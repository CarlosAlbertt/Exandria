"use client";

import { useEffect, type ReactNode } from "react";

// Carcasa de ventana emergente del creador: fondo, cierre por Esc / clic fuera
// / aspa, y cabecera con antetítulo + título. El CUERPO lo pone quien la usa
// (la lista de linajes, los rasgos por nivel de una subclase…), así la misma
// carcasa sirve para elegir y para describir sin duplicar estilos.
export default function Modal({
  eyebrow,
  title,
  onClose,
  children,
}: {
  eyebrow?: string;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="cls-modal-back" onClick={onClose} role="presentation">
      <div className="cls-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}>
        <button type="button" className="cls-modal-x" onClick={onClose} aria-label="Cerrar">
          <i className="fas fa-xmark" />
        </button>
        {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
        <h3 className="font-display text-2xl font-extrabold mb-2" style={{ color: "var(--color-bronze-bright)" }}>{title}</h3>
        {children}
      </div>
    </div>
  );
}
