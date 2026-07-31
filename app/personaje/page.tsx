"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "@/components/SessionProvider";
import CharacterSheet from "@/components/CharacterSheet";

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
      {/* Aquí vivía «Dados del grupo» (DicePanel). Se retiró: el dado de valor
          libre se aparca, y las PETICIONES DE TIRADA del DM —que eran el único
          consumidor de `useRollRequests` del lado del jugador— se mudaron a
          `components/PeticionesTirada.tsx`, montado en el layout. Ganan con la
          mudanza: antes había que estar en esta página para enterarse de que te
          habían pedido algo. El DicePanel del Panel DM se queda donde estaba. */}
      <Suspense fallback={null}>
        <PersonajeInner />
      </Suspense>
    </main>
  );
}
