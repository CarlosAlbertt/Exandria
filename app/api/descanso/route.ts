import { createClient, createAdminClient } from "@/lib/supabase/server";
import { recargar, type PlayState } from "@/lib/recursos";
import { recargarHuecos } from "@/lib/conjuros";
import { getMechanics } from "@/data/classdata";
import { planDescanso, puedeDescansarLargo } from "@/lib/tiempoDescanso";
import { sanearSitio, sitioVigente } from "@/lib/nodos";

export const runtime = "nodejs";

// Precios fijos del descanso (po). Corto es gratis; largo según la cama.
const PRECIO = { corto: 0, comun: 5, habitacion: 20 } as const;
const CLOCK_KEY = "campaign_clock";
const LOC_KEY = "party_location";
/**
 * Cuándo movió un descanso el reloj compartido por última vez.
 *
 * ⚠️ **Sustituye a `last_long_rest`, y no es un renombrado.** Aquella clave era
 * el FRENO del descanso largo, y era **del grupo**: si uno descansaba, a los
 * demás les decía «el grupo ya ha descansado hace poco». El freno se ha ido a la
 * ficha (`play_state.ultimoLargo`). Esta clave hace otra cosa: **desduplicar el
 * avance del reloj** cuando descansan varios juntos.
 */
const ULTIMO_AVANCE_KEY = "ultimo_avance_descanso";
const MS_PER_GAME_MIN = 10000;

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

  // 3. ¿Está con el grupo, o se ha ido por su cuenta?
  //
  // ⚠️ De esto depende A QUIÉN le pasa el tiempo, así que se resuelve con las
  // MISMAS reglas que usa la pantalla del jugador (`sanearSitio` y
  // `sitioVigente`, de `lib/nodos.ts`). Repetir la condición aquí a mano habría
  // sido una segunda lectura del mismo estado, y el día que divergieran el
  // servidor y la pantalla no estarían de acuerdo sobre dónde está alguien.
  const prevPlayState = (char.play_state as PlayState) ?? {};
  const { data: locRow } = await admin.from("app_config").select("value").eq("key", LOC_KEY).maybeSingle();
  let ancla: string | null = null;
  try {
    const loc = JSON.parse((locRow?.value as string) || "") as { poiName?: string };
    if (loc?.poiName) ancla = `poi:${loc.poiName}`;
  } catch { /* sin ancla: nadie tiene sitio vigente, así que todos con el grupo */ }
  const { sitio, desfase } = sanearSitio(prevPlayState.sitio, prevPlayState.desfase);
  const conElGrupo = !sitio || !sitioVigente(sitio, ancla);

  // 4. Anti-abuso del descanso largo, POR FICHA.
  //
  // Antes vivía en `app_config.last_long_rest`, del grupo, y con la posición por
  // jugador eso pasó a estar mal: quien se iba solo a Emon no podía descansar
  // porque sus compañeros habían descansado en Byroden.
  const ahoraPropio = gameMin + desfase;
  if (kind === "largo") {
    const permiso = puedeDescansarLargo(prevPlayState.ultimoLargo, ahoraPropio);
    if (!permiso.ok) return Response.json({ error: permiso.error }, { status: 400 });
  }

  // 5. A quién le avanza el tiempo. La decisión vive en `lib/tiempoDescanso.ts`,
  //    donde el gate la mira; aquí solo se aplica.
  const { data: avanceRow } = await admin.from("app_config").select("value").eq("key", ULTIMO_AVANCE_KEY).maybeSingle();
  const ultimoAvanceRaw = Number(avanceRow?.value ?? NaN);
  const plan = planDescanso({
    kind,
    conElGrupo,
    desfase,
    ahoraCompartido: gameMin,
    ultimoAvanceGrupo: Number.isFinite(ultimoAvanceRaw) ? ultimoAvanceRaw : null,
  });

  // 6. Cobra + recarga los pozos de usos de la clase.
  //
  // Ficha a medio crear (sin clase todavía): no falla, deja el play_state tal cual.
  // Los pozos de usos (O1) y los huecos de conjuro (O2) se recargan en la misma
  // pasada: el descanso largo lo devuelve todo; el corto, solo los pozos de
  // descanso corto y los huecos de pacto del brujo.
  const recargado = char.cls
    ? recargarHuecos(
        recargar(prevPlayState, char.cls as string, (char.level as number) ?? 1, kind),
        getMechanics(char.cls as string)?.caster ?? "none",
        kind,
      )
    : prevPlayState;

  // El tiempo propio, y la invariante: **sin sitio no hay desfase**. Con el
  // grupo el plan devuelve 0 y la clave se borra en vez de guardarse a cero.
  const nextPlayState: PlayState = { ...recargado };
  if (plan.desfase > 0) nextPlayState.desfase = plan.desfase;
  else delete nextPlayState.desfase;
  if (kind === "largo") nextPlayState.ultimoLargo = plan.ahoraPropioDespues;

  const charUpdate: Record<string, unknown> = { updated_at: new Date().toISOString(), play_state: nextPlayState };
  if (coste > 0) charUpdate.gold = gold - coste;
  await admin.from("characters").update(charUpdate).eq("id", char.id);

  // 7. El reloj COMPARTIDO solo si descansó con el grupo, y solo si no lo movió
  //    ya otro por el mismo descanso — cinco jugadores echándose la misma noche
  //    se comían cuarenta horas entre todos.
  if (plan.avanceCompartido > 0) {
    const nextClock: Clock = { ...clock, epochGameMin: gameMin + plan.avanceCompartido, epochRealMs: now };
    await admin.from("app_config").upsert({ key: CLOCK_KEY, value: JSON.stringify(nextClock), updated_at: new Date().toISOString() });
    await admin.from("app_config").upsert({ key: ULTIMO_AVANCE_KEY, value: String(gameMin + plan.avanceCompartido), updated_at: new Date().toISOString() });
  }

  return Response.json({ ok: true, gold: gold - coste, play_state: nextPlayState, conElGrupo, desfase: plan.desfase });
}
