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
      <Suspense fallback={null}>
        <PersonajeInner />
      </Suspense>
    </main>
  );
}
