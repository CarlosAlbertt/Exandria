import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getMision } from "@/data/misiones";

export const runtime = "nodejs";

// Abrir una misión del CATÁLOGO porque un PNJ la ha dado en conversación.
//
// ⚠️ **Esto no es `/api/aceptar-encargo`.** Aquella pasa de `oferta` a `activa`
// una fila que el DM ya había creado a mano. Aquí la fila **no existe todavía**:
// la misión estaba escrita en `data/misiones/` y el jugador acaba de sacarla
// hablando con alguien, así que hay que crearla.
//
// La escritura en `quests` es DM-only por RLS, así que va por servidor con
// service_role, igual que `/api/descanso` y `/api/aceptar-encargo`.
//
// ⚠️ **El texto lo pone SIEMPRE el catálogo, nunca el cliente.** Del cuerpo de
// la petición solo se acepta el slug y el PNJ; título, cuerpo, recompensa y
// lugar se leen del servidor. Si el cliente pudiera mandar el texto, cualquiera
// con la consola abierta se escribiría misiones a medida — y con la recompensa
// que quisiera.
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "No autenticado." }, { status: 401 });
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json({ error: "Falta SUPABASE_SERVICE_ROLE_KEY." }, { status: 500 });
  }

  let body: { slug?: string; npcId?: number };
  try { body = await req.json(); } catch { return Response.json({ error: "Petición inválida." }, { status: 400 }); }

  const mision = getMision(body.slug);
  if (!mision) return Response.json({ error: "Esa misión no existe." }, { status: 404 });

  const admin = createAdminClient();

  // La ficha EN JUEGO de quien habla. Sin ficha no hay misión individual: el DM
  // no tiene, y quien dejó la creación a medias tampoco.
  const { data: char } = await admin
    .from("characters").select("id").eq("user_id", user.id).is("archived_at", null).maybeSingle();
  if (!char) return Response.json({ error: "No tienes ninguna ficha en juego." }, { status: 403 });

  // ⚠️ IDEMPOTENTE. Un jugador puede repetir la conversación —o darle dos veces
  // al botón, que es lo que pasa de verdad— y sin esto tendría la misma misión
  // dos veces en la Crónica, con dos filas que se completan por separado.
  // Se cruza por TÍTULO, que es lo que hace única a la misión del catálogo, y
  // contra las suyas y las del grupo (una misión de grupo ya abierta tampoco se
  // duplica porque la saque otro jugador hablando con el mismo PNJ).
  const { data: yaEsta } = await admin
    .from("quests").select("id, status")
    .eq("title", mision.titulo)
    .or(`assigned_character_id.eq.${char.id},assigned_character_id.is.null`)
    .maybeSingle();
  if (yaEsta) return Response.json({ ok: true, id: yaEsta.id, yaLaTenias: true });

  // Las de grupo y las legendarias NO se asignan a una ficha: son del grupo, y
  // asignarlas las escondería del resto por la RLS de la v24. Las demás sí.
  const delGrupo = mision.tamano === "grupo" || mision.tamano === "legendaria";

  const { data: creada, error } = await admin.from("quests").insert({
    title: mision.titulo,
    body: mision.body,
    reward: mision.recompensa,
    status: "activa",
    // El lugar solo si es un POI del mapa: una franja del bosque no es un pin y
    // dejaría `poi_name` apuntando a algo que el mapa no sabe pintar.
    poi_name: mision.lugar.startsWith("franja:") ? null : mision.lugar,
    assigned_character_id: delGrupo ? null : char.id,
    npc_id: typeof body.npcId === "number" ? body.npcId : null,
  }).select("id").single();

  if (error) return Response.json({ error: "No se pudo abrir la misión." }, { status: 500 });

  return Response.json({ ok: true, id: creada.id, titulo: mision.titulo, recompensa: mision.recompensa });
}
