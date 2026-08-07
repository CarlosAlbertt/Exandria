"use client";
import { useCallback, useEffect, useState } from "react";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import { useSession } from "@/components/SessionProvider";
import { loadActiveCharacter } from "@/lib/character";
import type { Sitio } from "@/lib/nodos";

/**
 * Lee el `sitio` de un `play_state` que puede traer cualquier cosa.
 *
 * Tolerante a propósito: es un `jsonb` que ha pasado por varias versiones de la
 * app, y una forma vieja o a medias **no puede tumbar la pantalla del jugador**
 * — se cae al ancla, que es lo peor que debería pasar.
 */
function leerSitio(raw: unknown): Sitio | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.nodo !== "string" || typeof o.desde !== "string") return null;
  return { nodo: o.nodo, desde: o.desde };
}

/**
 * Dónde está ESTE jugador, por su cuenta.
 *
 * Vive en `characters.play_state.sitio`, y las tres razones importan:
 * 1. Es literalmente estado de juego, que es lo que esa columna guarda.
 * 2. Va **por ficha**, que es la granularidad que se pidió: uno puede estar en
 *    la taberna y otro en el cementerio a la vez.
 * 3. ⚠️ **`characters` SÍ está en la publicación realtime y `app_config` NO.**
 *    Esa lección va pagada cinco veces en este repo. Aquí no hace falta update
 *    optimista y el DM ve moverse a la gente en vivo.
 *
 * Sin `sitio` el jugador está donde diga `party_location`, que sigue siendo del
 * DM: quien no se haya movido nunca ve exactamente lo de antes de esta tanda.
 */
export function useSitio() {
  const session = useSession();
  const userId = session?.id ?? null;
  const [characterId, setCharacterId] = useState<string | null>(null);
  const [sitio, setSitio] = useState<Sitio | null>(null);
  const [ready, setReady] = useState(false);

  const cargar = useCallback(async () => {
    if (!supabaseConfigured || !userId) { setReady(true); return; }
    const c = await loadActiveCharacter(userId);
    setCharacterId(c?.id ?? null);
    const play = (c?.play_state as Record<string, unknown> | undefined) ?? {};
    setSitio(leerSitio(play.sitio));
    setReady(true);
  }, [userId]);

  useEffect(() => { void cargar(); }, [cargar]);

  // Realtime sobre la propia ficha: si el DM planta al grupo en otro sitio y
  // limpia los `sitio` individuales, la pantalla se entera sola.
  useEffect(() => {
    if (!supabaseConfigured || !characterId) return;
    const supabase = createClient();
    const ch = supabase
      .channel(`sitio_rt_${characterId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "characters", filter: `id=eq.${characterId}` }, () => { void cargar(); })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [characterId, cargar]);

  /**
   * Moverse. Optimista en pantalla y persistido detrás.
   *
   * ⚠️ **Se RELEE `play_state` antes de escribir y se fusiona.** Ahí viven
   * también los PG, las condiciones y los usos de clase: escribir el objeto que
   * esta pantalla tenía en memoria borraría lo que el combate hubiera movido
   * mientras el jugador andaba por el pueblo. Es exactamente lo que ya hace el
   * cupo del caldero, y por lo mismo.
   */
  const mover = useCallback(async (nodoId: string | null, ancla: string | null) => {
    const s = nodoId && ancla ? { nodo: nodoId, desde: ancla } : null;
    setSitio(s);
    if (!supabaseConfigured || !characterId) return;
    const supabase = createClient();
    const { data } = await supabase.from("characters").select("play_state").eq("id", characterId).maybeSingle();
    const prev = (data?.play_state as Record<string, unknown>) ?? {};
    const next = { ...prev };
    if (s) next.sitio = s; else delete next.sitio;
    await supabase.from("characters")
      .update({ play_state: next, updated_at: new Date().toISOString() })
      .eq("id", characterId);
  }, [characterId]);

  return { sitio, characterId, ready, mover, recargar: cargar };
}
