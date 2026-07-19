"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import Emblem from "@/components/Emblem";
import ClockWidget from "@/components/ClockWidget";
import PartyLocationWidget from "@/components/PartyLocationWidget";
import { createClient } from "@/lib/supabase/client";
import type { Role } from "@/lib/auth";

const BASE_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/reino", label: "Reino" },
  { href: "/cronica", label: "Crónica" },
  { href: "/bestiario", label: "Bestiario" },
  { href: "/crear", label: "Crear" },
  { href: "/inventario", label: "Inventario" },
  { href: "/mapa", label: "Mapa" },
];

export default function SiteNav({ role, username }: { role: Role; username: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const active = (h: string) => (h === "/" ? pathname === "/" : pathname.startsWith(h));

  const DM_LINKS = [
    { href: "/narrador", label: "Narrador" },
    { href: "/dm", label: "Panel DM" },
  ];
  const links = role === "dm" ? [...BASE_LINKS, ...DM_LINKS] : BASE_LINKS;

  async function logout() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-line)] backdrop-blur-md bg-[var(--color-ink)]/85">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
        <Link href="/" className="flex items-center gap-3 shrink-0" onClick={() => setOpen(false)}>
          <Emblem size={36} />
          <span className="font-display text-lg font-bold gold-text leading-none tracking-wide hidden sm:inline">Exandria</span>
        </Link>

        <ul className="hidden md:flex items-center gap-0.5">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href}
                className="relative font-ui text-[12px] font-semibold tracking-wide px-3 py-2 rounded-lg transition-colors"
                style={{ color: active(l.href) ? "var(--color-bronze-bright)" : "var(--color-muted)" }}>
                {l.label}
                {active(l.href) && <span className="absolute left-3 right-3 -bottom-px h-0.5 rounded bg-[var(--color-bronze)]" />}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden md:flex items-center gap-3 shrink-0">
          <PartyLocationWidget />
          <ClockWidget compact />
          <span className="font-ui text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ color: role === "dm" ? "var(--color-bronze-bright)" : "var(--color-arcane)", border: `1px solid ${role === "dm" ? "var(--color-bronze)" : "var(--color-arcane)"}55` }}>
            <i className={`fas ${role === "dm" ? "fa-crown" : "fa-user"} mr-1`} />{username}
          </span>
          <button onClick={logout} className="font-ui text-[12px] font-semibold transition-colors" style={{ color: "var(--color-dim)" }} title="Cerrar sesión">
            <i className="fas fa-right-from-bracket" />
          </button>
        </div>

        <button className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg border border-[var(--color-line)]"
          style={{ color: "var(--color-bronze)" }} aria-label="Menú" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          <i className={`fas ${open ? "fa-xmark" : "fa-bars"}`} />
        </button>
      </nav>

      {open && (
        <div className="md:hidden border-t border-[var(--color-line)] px-4 py-3 bg-[var(--color-night)]/95">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="font-ui text-[12px] font-bold" style={{ color: role === "dm" ? "var(--color-bronze-bright)" : "var(--color-arcane)" }}>
              <i className={`fas ${role === "dm" ? "fa-crown" : "fa-user"} mr-1`} />{username}
            </span>
            <button onClick={logout} className="font-ui text-[12px] font-semibold" style={{ color: "var(--color-dim)" }}>
              Salir <i className="fas fa-right-from-bracket ml-1" />
            </button>
          </div>
          <div className="mb-2 px-1 flex items-center gap-2">
            <PartyLocationWidget />
            <ClockWidget compact />
          </div>
          <ul className="flex flex-col gap-1">
            {links.map((l) => (
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
