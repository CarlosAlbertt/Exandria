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

  // 1. La oferta tiene que existir y seguir siendo oferta.
  const { data: quest } = await admin.from("quests").select("id, status, body").eq("id", id).maybeSingle();
  if (!quest) return Response.json({ error: "Ese encargo ya no existe." }, { status: 404 });
  if (quest.status !== "oferta") return Response.json({ error: "Ese encargo ya no está disponible." }, { status: 409 });

  // 2. Nombre del personaje activo → nota de quién lo aceptó (sin columna nueva).
  const { data: char } = await admin.from("characters").select("name").eq("user_id", user.id).is("archived_at", null).maybeSingle();
  const who = (char?.name as string)?.trim() || "El grupo";
  const note = `\n\n_Aceptado por ${who}._`;
  const nextBody = `${(quest.body as string) ?? ""}${note}`;

  // 3. Oferta → activa.
  const { error } = await admin.from("quests")
    .update({ status: "activa", body: nextBody, updated_at: new Date().toISOString() })
    .eq("id", id).eq("status", "oferta");
  if (error) return Response.json({ error: "No se pudo aceptar el encargo." }, { status: 500 });

  return Response.json({ ok: true });
}
