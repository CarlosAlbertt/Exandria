import { createClient, createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Item = { id: string; name: string; qty: number; notes?: string };

// El DM edita/entrega en la hoja de cualquier jugador. Usa service_role en el
// servidor para saltar la RLS (que solo permite escribir la fila propia).
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "No autenticado." }, { status: 401 });
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "dm") return Response.json({ error: "Solo el DM." }, { status: 403 });
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return Response.json({ error: "Falta SUPABASE_SERVICE_ROLE_KEY." }, { status: 500 });

  let body: { userId?: string; patch?: Record<string, unknown> };
  try { body = await req.json(); } catch { return Response.json({ error: "Petición inválida." }, { status: 400 }); }
  const userId = body.userId;
  const patch = body.patch ?? {};
  if (!userId) return Response.json({ error: "Falta userId." }, { status: 400 });

  const admin = createAdminClient();
  const { addItems, addGold, ...direct } = patch as { addItems?: Item[]; addGold?: number } & Record<string, unknown>;
  const update: Record<string, unknown> = { ...direct };

  if (Array.isArray(addItems) || typeof addGold === "number") {
    const { data: row } = await admin.from("characters").select("items, gold").eq("user_id", userId).maybeSingle();
    const items: Item[] = Array.isArray(row?.items) ? [...(row!.items as Item[])] : [];
    if (Array.isArray(addItems)) {
      for (const it of addItems) {
        const ex = items.find((x) => x.name === it.name);
        if (ex) ex.qty += it.qty ?? 1;
        else items.push({ id: crypto.randomUUID(), name: it.name, qty: it.qty ?? 1, notes: it.notes });
      }
      update.items = items;
    }
    if (typeof addGold === "number") update.gold = ((row?.gold as number) ?? 0) + addGold;
  }

  update.updated_at = new Date().toISOString();
  const { error } = await admin.from("characters").update(update).eq("user_id", userId);
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ ok: true });
}
