"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "@/components/SessionProvider";
import CharacterSheet from "@/components/CharacterSheet";
import DicePanel from "@/components/DicePanel";

function PersonajeInner() {
  const session = useSession();
  const role = session?.role ?? "player";
  const wantUser = useSearchParams().get("user");

  // El DM edita la hoja de otro jugador vía ?user=<id>.
  if (role === "dm" && wantUser) {
    return <CharacterSheet targetUserId={wantUser} readOnly={false} saveMode="dm" />;
  }
  // Hoja propia: editable solo si eres DM; el jugador la ve en solo lectura.
  return <CharacterSheet targetUserId={session?.id ?? null} readOnly={role !== "dm"} saveMode="self" />;
}

export default function PersonajePage() {
  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <Suspense fallback={null}>
        <PersonajeInner />
      </Suspense>

      {/* Dados del grupo: feed compartido, dado rápido, fórmula libre y
          peticiones del DM. Siempre visible en /personaje: DicePanel actúa
          sobre el usuario de la sesión, así que es seguro también cuando el
          DM edita la hoja de otro jugador (?user=). */}
      <section className="mt-10 max-w-3xl mx-auto">
        <p className="eyebrow mb-3"><i className="fas fa-dice-d20 mr-1.5" style={{ color: "var(--color-bronze)" }} />Dados del grupo</p>
        <DicePanel />
      </section>
    </main>
  );
}
