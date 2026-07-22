import { createClient, createAdminClient } from "@/lib/supabase/server";
import { levelFromXp } from "@/data/leveling";

export const runtime = "nodejs";

type ItemDoc = { titulo: string; texto: string; imagen?: string; unlockLore?: string[] };
type Item = { id: string; name: string; qty: number; notes?: string; doc?: ItemDoc };

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
  const { addItems, addGold, setLevel, addXp, unlockLore, setUses, ...direct } = patch as {
    addItems?: Item[]; addGold?: number; setLevel?: number; addXp?: number; unlockLore?: string[];
    setUses?: { key: string; gastados: number };
  } & Record<string, unknown>;
  const update: Record<string, unknown> = { ...direct };

  if (typeof setLevel === "number") {
    update.level = Math.max(1, Math.min(20, Math.floor(setLevel)));
  }

  if (Array.isArray(addItems) || typeof addGold === "number" || typeof addXp === "number" || Array.isArray(unlockLore) || (setUses && typeof setUses.key === "string")) {
    // Solo el personaje EN JUEGO. Desde schema_v14 hay varias filas por jugador
    // (activo + archivados), así que sin este filtro `maybeSingle()` reventaría
    // en cuanto alguien archivara algo. Se trae play_state para poder fusionar
    // el ajuste de setUses sin pisar el resto del jsonb (donde la Fase O2
    // guardará los conjuros).
    const { data: row } = await admin.from("characters").select("items, gold, xp, level, lore_unlocked, play_state").eq("user_id", userId).is("archived_at", null).maybeSingle();
    if (Array.isArray(addItems)) {
      const items: Item[] = Array.isArray(row?.items) ? [...(row!.items as Item[])] : [];
      for (const it of addItems) {
        // Un documento es único (una carta concreta): nunca se fusiona por
        // nombre, siempre entra como objeto propio. El resto sí apila.
        const ex = it.doc ? undefined : items.find((x) => x.name === it.name && !x.doc);
        if (ex) ex.qty += it.qty ?? 1;
        else items.push({ id: crypto.randomUUID(), name: it.name, qty: it.qty ?? 1, notes: it.notes, doc: it.doc });
      }
      update.items = items;
    }
    // Enseñar saber: une los ids nuevos a lo que el personaje ya sabía.
    if (Array.isArray(unlockLore)) {
      const prev: string[] = Array.isArray(row?.lore_unlocked) ? (row!.lore_unlocked as string[]) : [];
      update.lore_unlocked = Array.from(new Set([...prev, ...unlockLore]));
    }
    if (typeof addGold === "number") update.gold = ((row?.gold as number) ?? 0) + addGold;
    if (typeof addXp === "number") {
      const newXp = Math.max(0, ((row?.xp as number) ?? 0) + addXp);
      update.xp = newXp;
      update.level = Math.max((row?.level as number) ?? 1, levelFromXp(newXp));
    }
    // El DM ajusta un pozo a mano: devolver una furia, vaciar el foco.
    if (setUses && typeof setUses.key === "string") {
      const prevPlay = (row?.play_state as Record<string, unknown>) ?? {};
      const prevUsos = (prevPlay.usos as Record<string, number>) ?? {};
      update.play_state = { ...prevPlay, usos: { ...prevUsos, [setUses.key]: Math.max(0, Math.floor(setUses.gastados)) } };
    }
  }

  update.updated_at = new Date().toISOString();
  // Acotado al personaje en juego: sin el filtro, dar XP u objetos se los daría
  // también a los archivados del jugador (hay varias filas por user_id desde
  // schema_v14).
  const { error } = await admin.from("characters").update(update).eq("user_id", userId).is("archived_at", null);
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ ok: true });
}
