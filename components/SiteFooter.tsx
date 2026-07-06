import Link from "next/link";
import Emblem from "@/components/Emblem";

export default function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-[var(--color-line)]">
      <div className="max-w-6xl mx-auto px-6 py-12 text-center">
        <div className="flex justify-center mb-3"><Emblem size={40} /></div>
        <p className="font-display text-xl font-bold gold-text mb-1">Exandria</p>
        <p className="eyebrow mb-6">Compañero de Campaña · Exandria</p>
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-6">
          {[
            { href: "/reino", label: "El Reino" },
            { href: "/crear", label: "Crear Personaje" },
            { href: "/inventario", label: "Inventario" },
            { href: "/mapa", label: "Mapa" },
            { href: "/narrador", label: "Narrador" },
          ].map((l) => (
            <Link key={l.href} href={l.href}
              className="font-ui text-[12px] font-semibold tracking-wide transition-colors"
              style={{ color: "var(--color-muted)" }}>
              {l.label}
            </Link>
          ))}
        </div>
        <p className="text-sm italic" style={{ color: "var(--color-dim)" }}>
          Herramienta de fans no oficial · Reglas D&D 2024 · Ambientación Tal'Dorei
        </p>
      </div>
    </footer>
  );
}
