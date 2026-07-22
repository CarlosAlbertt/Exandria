import { createClient, createAdminClient } from "@/lib/supabase/server";
import { recargar, type PlayState } from "@/lib/recursos";

export const runtime = "nodejs";

// Precios fijos del descanso (po). Corto es gratis; largo según la cama.
const PRECIO = { corto: 0, comun: 5, habitacion: 20 } as const;
const CLOCK_KEY = "campaign_clock";
const LAST_LONG_KEY = "last_long_rest";
const MS_PER_GAME_MIN = 10000;
const MIN_ENTRE_LARGOS = 1200; // 20 h de juego

type Clock = { epochRealMs: number; epochGameMin: number; running: boolean; msPerGameMin: number };

function nowGameMin(c: Clock, now: number): number {
  return c.running ? Math.floor(c.epochGameMin + (now - c.epochRealMs) / c.msPerGameMin) : Math.floor(c.epochGameMin);
}

// El descanso del jugador necesita escribir el reloj (app_config, RLS DM-only):
// se hace en el servidor con service_role, igual que /api/dm/character.
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "No autenticado." }, { status: 401 });
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return Response.json({ error: "Falta SUPABASE_SERVICE_ROLE_KEY." }, { status: 500 });

  let body: { kind?: "corto" | "largo"; room?: "comun" | "habitacion" };
  try { body = await req.json(); } catch { return Response.json({ error: "Petición inválida." }, { status: 400 }); }
  const kind = body.kind;
  if (kind !== "corto" && kind !== "largo") return Response.json({ error: "Tipo de descanso inválido." }, { status: 400 });
  const room = body.room === "habitacion" ? "habitacion" : "comun";
  const coste = kind === "corto" ? PRECIO.corto : PRECIO[room];

  const admin = createAdminClient();

  // 1. Ficha activa del jugador.
  const { data: char } = await admin.from("characters").select("id, gold, cls, level, play_state").eq("user_id", user.id).is("archived_at", null).maybeSingle();
  if (!char) return Response.json({ error: "No tienes un personaje en juego." }, { status: 400 });
  const gold = (char.gold as number) ?? 0;
  if (gold < coste) return Response.json({ error: "No tienes oro suficiente para descansar aquí." }, { status: 400 });

  // 2. Reloj actual.
  const { data: clockRow } = await admin.from("app_config").select("value").eq("key", CLOCK_KEY).maybeSingle();
  let clock: Clock;
  try { clock = JSON.parse((clockRow?.value as string) || ""); } catch {
    return Response.json({ error: "El reloj de campaña no está inicializado." }, { status: 400 });
  }
  const now = Date.now();
  const gameMin = nowGameMin(clock, now);

  // 3. Anti-abuso del descanso largo.
  if (kind === "largo") {
    const { data: lastRow } = await admin.from("app_config").select("value").eq("key", LAST_LONG_KEY).maybeSingle();
    const last = Number(lastRow?.value ?? NaN);
    if (Number.isFinite(last) && gameMin - last < MIN_ENTRE_LARGOS) {
      return Response.json({ error: "El grupo ya ha descansado hace poco; espera al menos un día." }, { status: 400 });
    }
  }

  // 4. Cobra + avanza el reloj + recarga los pozos de usos de la clase.
  const minutos = kind === "corto" ? 60 : 480;
  const nextClock: Clock = { ...clock, epochGameMin: gameMin + minutos, epochRealMs: now };
  const prevPlayState = (char.play_state as PlayState) ?? {};
  // Ficha a medio crear (sin clase todavía): no falla, deja el play_state tal cual.
  const nextPlayState = char.cls
    ? recargar(prevPlayState, char.cls as string, (char.level as number) ?? 1, kind)
    : prevPlayState;
  const charUpdate: Record<string, unknown> = { updated_at: new Date().toISOString(), play_state: nextPlayState };
  if (coste > 0) charUpdate.gold = gold - coste;
  await admin.from("characters").update(charUpdate).eq("id", char.id);
  await admin.from("app_config").upsert({ key: CLOCK_KEY, value: JSON.stringify(nextClock), updated_at: new Date().toISOString() });
  if (kind === "largo") {
    await admin.from("app_config").upsert({ key: LAST_LONG_KEY, value: String(gameMin + minutos), updated_at: new Date().toISOString() });
  }

  return Response.json({ ok: true, gold: gold - coste, play_state: nextPlayState });
}
