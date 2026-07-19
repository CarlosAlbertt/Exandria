"use client";
// Cliente del tablón: llama al endpoint /api/aceptar-encargo (service_role) que
// pasa una quest de 'oferta' a 'activa' (la escritura en quests es DM-only).

export type EncargoResult = { ok: true } | { ok: false; error: string };

export async function aceptarEncargo(id: number): Promise<EncargoResult> {
  try {
    const res = await fetch("/api/aceptar-encargo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error ?? "No se pudo aceptar el encargo." };
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo contactar con el servidor." };
  }
}
