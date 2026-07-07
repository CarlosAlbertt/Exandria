"use client";

import { useSession } from "@/components/SessionProvider";
import CharacterSheet from "@/components/CharacterSheet";

export default function PersonajePage() {
  const session = useSession();
  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <CharacterSheet targetUserId={session?.id ?? null} readOnly={false} saveMode="self" />
    </main>
  );
}
