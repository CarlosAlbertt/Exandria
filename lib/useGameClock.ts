"use client";

import { useEffect, useState } from "react";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import { gameMinFromMoment } from "@/lib/gameClock";

// Reloj de campaña: corre solo a razón de 10 s reales = 1 min de juego
// (10 min reales = 1 h de juego). Fuente única en app_config (clave
// campaign_clock, JSON en `value`), sincronizada por Realtime. La hora
// mostrada se deriva en el cliente con un tick de 1 s a partir de un
// "epoch" (instante real + minuto de juego correspondiente), sin escribir
// en la BD cada segundo.

export type CampaignClock = {
  epochRealMs: number; // Date.now() de referencia
  epochGameMin: number; // minuto de juego absoluto en ese instante
  running: boolean;
  msPerGameMin: number;
};

export const CLOCK_KEY = "campaign_clock";
export const MS_PER_GAME_MIN = 10000; // 10 s reales = 1 min de juego → 10 min reales = 1 h de juego

// Reloj por defecto (cuando la fila de app_config aún no existe): arranca
// corriendo, anclado a "ahora" = 836 PD, 1 de Horisal, 08:00.
function buildDefaultClock(): CampaignClock {
  const epochGameMin = gameMinFromMoment(836, 0, 1, 8, 0);
  return { epochRealMs: Date.now(), epochGameMin, running: true, msPerGameMin: MS_PER_GAME_MIN };
}

// Minuto de juego absoluto en el instante `nowMs`, dado un reloj. Pura:
// si está pausado devuelve el minuto congelado; si corre, extrapola desde
// el epoch. Redondeado hacia abajo a minuto entero.
export function currentGameMin(clock: CampaignClock, nowMs: number): number {
  if (!clock.running) return Math.floor(clock.epochGameMin);
  return Math.floor(clock.epochGameMin + (nowMs - clock.epochRealMs) / clock.msPerGameMin);
}

function parseClock(value: string | null | undefined): CampaignClock | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as CampaignClock;
  } catch {
    return null;
  }
}

// Hook de lectura: expone el reloj crudo (para controles DM) y el minuto
// de juego actual, recalculado cada segundo mientras corre.
export function useGameClock() {
  // Sin Supabase configurado, el reloj local (no persistido) y "listo" se
  // conocen desde el primer render: se calculan en el inicializador perezoso
  // de useState, no en un efecto (evita un setState síncrono innecesario).
  const [clock, setClock] = useState<CampaignClock | null>(() => (!supabaseConfigured ? buildDefaultClock() : null));
  const [ready, setReady] = useState(() => !supabaseConfigured);
  const [nowGameMin, setNowGameMin] = useState(0);

  // Efecto 1: carga inicial + Realtime. Si no existe la fila, persiste el
  // default para fijar el epoch desde el primer arranque (fire-and-forget).
  useEffect(() => {
    if (!supabaseConfigured) return;
    let mounted = true;
    const supabase = createClient();

    const load = () =>
      supabase
        .from("app_config")
        .select("value")
        .eq("key", CLOCK_KEY)
        .maybeSingle()
        .then(({ data }) => {
          if (!mounted) return;
          const parsed = parseClock(data?.value);
          if (parsed) {
            setClock(parsed);
            return;
          }
          const def = buildDefaultClock();
          setClock(def);
          // Fija el epoch la primera vez que se usa la app; no bloquea la UI.
          supabase
            .from("app_config")
            .upsert({ key: CLOCK_KEY, value: JSON.stringify(def), updated_at: new Date().toISOString() })
            .then(() => {});
        });

    load().then(() => {
      if (mounted) setReady(true);
    });

    const ch = supabase
      .channel(`campaign_clock_rt_${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "app_config", filter: `key=eq.${CLOCK_KEY}` },
        () => load()
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(ch);
    };
  }, []);

  // Efecto 2: sincroniza nowGameMin al montar y cada vez que cambia el reloj
  // (Realtime o mutación local) y, mientras corre, lo refresca cada segundo.
  // La forma "sincroniza ahora + suscribe (setInterval)" no dispara el aviso
  // de "setState síncrono en efecto".
  useEffect(() => {
    if (!clock) return;
    const sync = () => setNowGameMin(currentGameMin(clock, Date.now()));
    sync();
    if (!clock.running) return;
    const id = setInterval(sync, 1000);
    return () => clearInterval(id);
  }, [clock]);

  return { clock, nowGameMin, ready };
}

/* ------------------------------ Mutaciones ------------------------------ */
/* Solo el DM puede escribir (RLS de app_config); estas funciones no */
/* comprueban rol, se limitan a leer/actualizar y devolver { error }. El */
/* panel DM (único punto que las llama) ya está protegido por /dm. */

async function loadClock(): Promise<CampaignClock | null> {
  if (!supabaseConfigured) return null;
  const { data } = await createClient().from("app_config").select("value").eq("key", CLOCK_KEY).maybeSingle();
  return parseClock(data?.value);
}

async function writeClock(next: CampaignClock): Promise<{ error: string | null }> {
  if (!supabaseConfigured) return { error: "Supabase no configurado" };
  const { error } = await createClient()
    .from("app_config")
    .upsert({ key: CLOCK_KEY, value: JSON.stringify(next), updated_at: new Date().toISOString() });
  return { error: error?.message ?? null };
}

// Pausa o reanuda el reloj. Reancla el epoch al minuto de juego actual y a
// "ahora", y fija `running` al valor pedido. Al congelar-y-fijar en ambos
// casos es idempotente: reanudar un reloj que ya corre no lo rebobina.
export async function setClockRunning(running: boolean): Promise<{ error: string | null }> {
  if (!supabaseConfigured) return { error: "Supabase no configurado" };
  const cur = (await loadClock()) ?? buildDefaultClock();
  const now = Date.now();
  const next: CampaignClock = { ...cur, epochGameMin: currentGameMin(cur, now), epochRealMs: now, running };
  return writeClock(next);
}

// Avanza (o retrocede) el reloj `minutes` minutos de juego desde el minuto
// actual, sin cambiar si corre o está pausado.
export async function advanceGame(minutes: number): Promise<{ error: string | null }> {
  if (!supabaseConfigured) return { error: "Supabase no configurado" };
  const cur = (await loadClock()) ?? buildDefaultClock();
  const now = Date.now();
  const next: CampaignClock = { ...cur, epochGameMin: currentGameMin(cur, now) + minutes, epochRealMs: now };
  return writeClock(next);
}

// Fija la fecha/hora de juego a un minuto absoluto concreto (p. ej. desde
// gameMinFromMoment con los selects del panel DM). Conserva running.
export async function setGameDateTime(gameMinAbs: number): Promise<{ error: string | null }> {
  if (!supabaseConfigured) return { error: "Supabase no configurado" };
  const cur = (await loadClock()) ?? buildDefaultClock();
  const next: CampaignClock = { ...cur, epochGameMin: gameMinAbs, epochRealMs: Date.now() };
  return writeClock(next);
}
