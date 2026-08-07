import { createClient, createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// Aceptar un encargo del tablón: pasa una quest de 'oferta' a 'activa'. La
// escritura en `quests` es DM-only por RLS, así que va por servidor con
// service_role, igual que /api/descanso. Anti-abuso: solo se acepta si sigue
// en 'oferta' (no se puede re-aceptar ni tocar misiones ya activas).
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "No autenticado." }, { status: 401 });
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return Response.json({ error: "Falta SUPABASE_SERVICE_ROLE_KEY." }, { status: 500 });

  let body: { id?: number };
  try { body = await req.json(); } catch { return Response.json({ error: "Petición inválida." }, { status: 400 }); }
  const id = body.id;
  if (typeof id !== "number") return Response.json({ error: "Encargo inválido." }, { status: 400 });

  const admin = createAdminClient();

  // 1. La oferta tiene que existir, seguir siendo oferta y no estar ya asignada
  //    a otra ficha (el DM puede reservarle un encargo a alguien concreto).
  const { data: quest } = await admin.from("quests").select("id, status, body, npc_id, assigned_character_id").eq("id", id).maybeSingle();
  if (!quest) return Response.json({ error: "Ese encargo ya no existe." }, { status: 404 });
  if (quest.status !== "oferta") return Response.json({ error: "Ese encargo ya no está disponible." }, { status: 409 });

  // 2. La ficha EN JUEGO de quien acepta.
  const { data: char } = await admin.from("characters").select("id, name").eq("user_id", user.id).is("archived_at", null).maybeSingle();
  if (quest.assigned_character_id && quest.assigned_character_id !== char?.id) {
    return Response.json({ error: "Ese encargo es de otro." }, { status: 403 });
  }

  // 3. Oferta → activa.
  //    Un encargo con `npc_id` es INDIVIDUAL (se aceptó hablando con un PNJ):
  //    se asigna a la ficha, que es lo que la RLS de la v24 usa para esconderlo
  //    de los demás. Uno del tablón sigue siendo del grupo y no se asigna.
  //
  //    ⚠️ Y por eso desaparece el «_Aceptado por X_» que se metía DENTRO del
  //    `body`: era un parche de texto a falta de columna donde apuntarlo, y
  //    reescribía la misión del DM cada vez. Ahora hay columna. Los encargos de
  //    tablón siguen sin ella, así que ahí se conserva la nota.
  const individual = quest.npc_id != null && char != null;
  const update: Record<string, unknown> = { status: "activa", updated_at: new Date().toISOString() };
  if (individual) {
    update.assigned_character_id = char!.id;
  } else {
    const who = (char?.name as string)?.trim() || "El grupo";
    update.body = `${(quest.body as string) ?? ""}\n\n_Aceptado por ${who}._`;
  }

  const { error } = await admin.from("quests").update(update).eq("id", id).eq("status", "oferta");
  if (error) return Response.json({ error: "No se pudo aceptar el encargo." }, { status: 500 });

  return Response.json({ ok: true });
}
