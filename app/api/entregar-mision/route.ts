import { createClient, createAdminClient } from "@/lib/supabase/server";
import { motivoNoEntregable, RESPUESTA_NO_ENTREGABLE } from "@/lib/misiones";

export const runtime = "nodejs";

// Entregar una misión individual hablando con el PNJ que la encargó: pasa de
// 'activa' a 'completada' y reparte su `unlock_lore`. La escritura en `quests`
// es DM-only por RLS, así que va por servidor con service_role, igual que
// /api/aceptar-encargo (schema_v17) y /api/descanso.
//
// ⚠️ Esto es la PUERTA, no el escaparate. `opcionesDeMision` en lib/misiones.ts
// decide qué opción se le ENSEÑA al jugador, pero se evalúa en su navegador:
// las cuatro condiciones se vuelven a comprobar aquí contra la base de datos.
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "No autenticado." }, { status: 401 });
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return Response.json({ error: "Falta SUPABASE_SERVICE_ROLE_KEY." }, { status: 500 });

  let body: { id?: number; npcId?: number };
  try { body = await req.json(); } catch { return Response.json({ error: "Petición inválida." }, { status: 400 }); }
  const { id, npcId } = body;
  if (typeof id !== "number" || typeof npcId !== "number") return Response.json({ error: "Misión inválida." }, { status: 400 });

  const admin = createAdminClient();

  // 1. La ficha EN JUEGO de quien llama. Sin ella no hay nada que entregar: el
  //    DM no tiene ficha y quien dejó el asistente a medias tampoco.
  const { data: char } = await admin.from("characters")
    .select("id").eq("user_id", user.id).is("archived_at", null).maybeSingle();
  if (!char) return Response.json({ error: "No tienes un personaje en juego." }, { status: 400 });

  // 2. La misión tiene que existir, seguir activa, ser DE ESTE PNJ y estar
  //    asignada a esta ficha. Las cuatro, o se podría cerrar el encargo de otro
  //    jugador, o el del herrero hablando con el tabernero.
  const { data: quest } = await admin.from("quests")
    .select("id, status, npc_id, assigned_character_id, unlock_lore").eq("id", id).maybeSingle();
  if (!quest) return Response.json({ error: "Esa misión ya no existe." }, { status: 404 });

  //    ⚠️ Las tres condiciones ya NO se escriben aquí: son `motivoNoEntregable`
  //    en `lib/misiones.ts`, el mismo criterio con el que `opcionesDeMision`
  //    decide si enseñar la opción. Antes eran dos copias y solo una la miraba
  //    el gate, así que podían separarse en silencio y dejar al jugador viendo
  //    una opción que el servidor le negaba.
  const motivo = motivoNoEntregable(quest, npcId, char.id);
  if (motivo) return Response.json({ error: RESPUESTA_NO_ENTREGABLE[motivo].error }, { status: RESPUESTA_NO_ENTREGABLE[motivo].status });

  // 3. Activa → completada. El `eq("status", "activa")` del propio update es el
  //    anti-abuso: dos pulsaciones seguidas no la completan dos veces.
  const { data: done, error } = await admin.from("quests")
    .update({ status: "completada", updated_at: new Date().toISOString() })
    .eq("id", id).eq("status", "activa").select("id");
  if (error) return Response.json({ error: "No se pudo entregar la misión." }, { status: 500 });
  if (!done || done.length === 0) return Response.json({ error: "Esa misión ya no está en curso." }, { status: 409 });

  // 4. El saber que reparte. Una misión INDIVIDUAL solo se lo enseña a SU
  //    dueño: repartirlo al grupo delataría la misión secreta que la RLS de la
  //    v24 acaba de esconder. Las de grupo las sigue cerrando el DM desde Panel
  //    DM › Crónica, que es donde se reparte a todos.
  const lore = Array.isArray(quest.unlock_lore) ? (quest.unlock_lore as string[]) : [];
  if (lore.length > 0) {
    const { data: row } = await admin.from("characters").select("lore_unlocked").eq("id", char.id).maybeSingle();
    const prev: string[] = Array.isArray(row?.lore_unlocked) ? (row!.lore_unlocked as string[]) : [];
    await admin.from("characters")
      .update({ lore_unlocked: Array.from(new Set([...prev, ...lore])), updated_at: new Date().toISOString() })
      .eq("id", char.id);
  }

  return Response.json({ ok: true, lore: lore.length });
}
