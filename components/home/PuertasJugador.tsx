"use client";

import Link from "next/link";
import { PUERTAS_JUGADOR, puedeVerAhora } from "@/lib/acceso";
import { useSession } from "@/components/SessionProvider";
import { usePersonajeActivo } from "@/lib/usePersonajeActivo";

/**
 * Las puertas de la portada del jugador.
 *
 * Se separa de `PanelJugador` —que es de servidor— **solo por esto**: hay que
 * preguntar si ya tiene ficha para dejar de ofrecerle «Crear personaje». La
 * lista y los textos siguen viviendo en `lib/acceso.ts`, con el gate detrás.
 *
 * Mientras la consulta no vuelve se asume que **no** hay ficha, así que «Crear»
 * se ve un instante y desaparece. Es el lado correcto: al revés, un jugador
 * nuevo se quedaría sin la puerta que necesita justo al entrar por primera vez.
 */
export default function PuertasJugador() {
  const { tiene } = usePersonajeActivo(useSession()?.id ?? null);
  const puertas = PUERTAS_JUGADOR.filter((c) => puedeVerAhora("player", c.href, tiene));

  return (
    <div className="grid sm:grid-cols-2 gap-5">
      {puertas.map((c) => (
        <Link key={c.href} href={c.href} className="pick-card p-7 block"
          style={{ ["--accent" as string]: c.accent, ["--glow" as string]: "rgba(69,199,189,0.3)" }}>
          <i className={`fas ${c.icon} text-3xl mb-4`} style={{ color: c.accent }} />
          <h3 className="font-display text-xl font-bold mb-2" style={{ color: "var(--color-parch)" }}>{c.label}</h3>
          <p style={{ color: "var(--color-muted)", fontSize: "15px", lineHeight: 1.6 }}>{c.text}</p>
          <span className="mt-4 inline-flex items-center gap-2 font-ui text-[12px] font-bold tracking-wide" style={{ color: c.accent }}>
            Entrar <i className="fas fa-arrow-right-long" />
          </span>
        </Link>
      ))}
    </div>
  );
}
