"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Emblem from "@/components/Emblem";

const LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/reino", label: "Reino" },
  { href: "/crear", label: "Crear" },
  { href: "/inventario", label: "Inventario" },
  { href: "/mapa", label: "Mapa" },
  { href: "/narrador", label: "Narrador" },
];

export default function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const active = (h: string) => (h === "/" ? pathname === "/" : pathname.startsWith(h));

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-line)] backdrop-blur-md bg-[var(--color-ink)]/85">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <Emblem size={36} />
          <span className="font-display text-lg font-bold gold-text leading-none tracking-wide">Tal'Dorei</span>
        </Link>

        <ul className="hidden md:flex items-center gap-1">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="relative font-ui text-[12px] font-semibold tracking-wide px-3.5 py-2 rounded-lg transition-colors"
                style={{ color: active(l.href) ? "var(--color-bronze-bright)" : "var(--color-muted)" }}
              >
                {l.label}
                {active(l.href) && <span className="absolute left-3.5 right-3.5 -bottom-px h-0.5 rounded bg-[var(--color-bronze)]" />}
              </Link>
            </li>
          ))}
          <li className="ml-2">
            <Link href="/crear" className="btn-gold !py-2 !px-4 inline-block">Empezar</Link>
          </li>
        </ul>

        <button
          className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg border border-[var(--color-line)]"
          style={{ color: "var(--color-bronze)" }}
          aria-label="Menú" aria-expanded={open} onClick={() => setOpen((v) => !v)}
        >
          <i className={`fas ${open ? "fa-xmark" : "fa-bars"}`} />
        </button>
      </nav>

      {open && (
        <div className="md:hidden border-t border-[var(--color-line)] px-4 py-3 bg-[var(--color-night)]/95">
          <ul className="flex flex-col gap-1">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} onClick={() => setOpen(false)}
                  className="block font-ui text-sm font-semibold px-3 py-3 rounded-lg"
                  style={{ color: active(l.href) ? "var(--color-bronze-bright)" : "var(--color-warm)" }}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
