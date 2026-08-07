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

// Entregar una misión individual al PNJ que la encargó (schema_v24). Se manda
// también el `npcId` para que el servidor pueda comprobar que se la estás
// entregando a QUIEN te la dio, y no a cualquiera que pase por ahí.
export async function entregarMision(id: number, npcId: number): Promise<EncargoResult> {
  try {
    const res = await fetch("/api/entregar-mision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, npcId }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error ?? "No se pudo entregar la misión." };
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo contactar con el servidor." };
  }
}
