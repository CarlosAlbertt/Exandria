"use client";
// Cliente del descanso: llama al endpoint /api/descanso (service_role) que cobra
// el oro, avanza el reloj de campaña y recarga los pozos de usos de la clase.

import type { PlayState } from "@/lib/recursos";

export const PRECIO_DESCANSO = { corto: 0, comun: 5, habitacion: 20 } as const;

export type DescansoResult = { ok: true; gold: number; play_state: PlayState } | { ok: false; error: string };

export async function descansar(kind: "corto" | "largo", room?: "comun" | "habitacion"): Promise<DescansoResult> {
  try {
    const res = await fetch("/api/descanso", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, room }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error ?? "No se pudo descansar." };
    return { ok: true, gold: data.gold as number, play_state: (data.play_state as PlayState) ?? {} };
  } catch {
    return { ok: false, error: "No se pudo contactar con el servidor." };
  }
}
