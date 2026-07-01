// Crea usuarios (solo el DM). Usa la service_role key en el servidor.
import { createClient, createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const DOMAIN = "@taldorei.local";

export async function POST(req: Request) {
  // 1) El llamante debe ser DM.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "No autenticado." }, { status: 401 });
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "dm") return Response.json({ error: "Solo el DM puede crear usuarios." }, { status: 403 });

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json({ error: "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor." }, { status: 500 });
  }

  // 2) Validar entrada.
  let body: { username?: string; password?: string; role?: string };
  try { body = await req.json(); } catch { return Response.json({ error: "Petición inválida." }, { status: 400 }); }
  const username = (body.username ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  const role = body.role === "dm" ? "dm" : "player";
  if (!/^[a-z0-9_]{3,20}$/.test(username)) return Response.json({ error: "Usuario inválido (3-20, letras/números/_)." }, { status: 400 });
  if (password.length < 6) return Response.json({ error: "La contraseña debe tener al menos 6 caracteres." }, { status: 400 });

  // 3) Crear con service_role.
  const admin = createAdminClient();
  const { data: created, error } = await admin.auth.admin.createUser({
    email: `${username}${DOMAIN}`,
    password,
    email_confirm: true,
  });
  if (error || !created?.user) {
    return Response.json({ error: error?.message ?? "No se pudo crear el usuario." }, { status: 400 });
  }

  // 4) Asegurar el perfil con el rol elegido (el trigger crea 'player' por defecto).
  await admin.from("profiles").upsert({ id: created.user.id, username, role });

  return Response.json({ ok: true, username, role });
}
