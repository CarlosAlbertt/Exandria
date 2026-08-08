"use client";
import { useCallback, useEffect, useState } from "react";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import { useSession } from "@/components/SessionProvider";
import { loadActiveCharacter } from "@/lib/character";
// ⚠️ `sanearSitio` vive en `lib/nodos.ts`, que es NEUTRO, y no aquí dentro: una
// regla metida en un hook **no la puede mirar ningún gate**, que es exactamente
// por lo que `puedeSembrar` salió de `seedNpcs`. Y hace más falta todavía porque
// la misma invariante se aplica también en `/api/dm/character`.
import { sanearSitio, type Sitio } from "@/lib/nodos";
import { leerRevelados } from "@/lib/revelado";

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
  const [desfase, setDesfase] = useState(0);
  const [revelados, setRevelados] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  const cargar = useCallback(async () => {
    if (!supabaseConfigured || !userId) { setReady(true); return; }
    const c = await loadActiveCharacter(userId);
    setCharacterId(c?.id ?? null);
    const play = (c?.play_state as Record<string, unknown> | undefined) ?? {};
    // Lo que este personaje conoce por su cuenta. Se lee aquí porque el
    // `play_state` ya está cargado: una consulta aparte sería una segunda
    // lectura de la misma fila, y podrían discrepar.
    setRevelados(leerRevelados(play.revelados));
    // La invariante se aplica también al LEER, no solo al escribir: puede haber
    // quedado un desfase huérfano si el DM editó la ficha a mano.
    const saneado = sanearSitio(play.sitio, play.desfase);
    setSitio(saneado.sitio);
    setDesfase(saneado.desfase);
    setReady(true);
  }, [userId]);

  useEffect(() => { void cargar(); }, [cargar]);

  // Realtime sobre la propia ficha: si el DM planta al grupo en otro sitio y
  // limpia los `sitio` individuales, la pantalla se entera sola.
  useEffect(() => {
    if (!supabaseConfigured || !characterId) return;
    const supabase = createClient();
    const ch = supabase
      // ⚠️ **El sufijo aleatorio NO es decorativo, y su ausencia fue un fallo.**
      // Este hook era el ÚNICO del repo con el nombre de canal fijo, y colaba
      // mientras solo lo usaba `/lugar`. Al meterlo en `useRelojJugador` pasó a
      // vivir también en la barra de navegación, así que **cada página tenía dos
      // instancias suscribiéndose al MISMO topic**: el segundo `subscribe` choca
      // y, peor, el `removeChannel` de uno al desmontarse le cierra el topic al
      // otro — la pantalla del jugador deja de enterarse de que el DM lo ha
      // movido. Los otros cinco hooks del repo aleatorizan por esto mismo.
      .channel(`sitio_rt_${characterId}_${Math.random().toString(36).slice(2)}`)
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
  const escribir = useCallback(async (s: Sitio | null, nuevoDesfase: number) => {
    setSitio(s);
    setDesfase(s ? nuevoDesfase : 0);
    if (!supabaseConfigured || !characterId) return;
    const supabase = createClient();
    const { data } = await supabase.from("characters").select("play_state").eq("id", characterId).maybeSingle();
    const prev = (data?.play_state as Record<string, unknown>) ?? {};
    const next = { ...prev };
    if (s) {
      next.sitio = s;
      // ⚠️ LA INVARIANTE: sin sitio no hay desfase, y se escriben JUNTOS.
      // Volver con el grupo es volver a su hora. Si el desfase sobreviviera al
      // borrado del sitio, alguien se quedaría ocho horas adelantado **en la
      // misma plaza que los demás**, y eso no se lee como un fallo: se lee como
      // que la app miente.
      if (nuevoDesfase > 0) next.desfase = nuevoDesfase; else delete next.desfase;
    } else {
      delete next.sitio;
      delete next.desfase;
    }
    await supabase.from("characters")
      .update({ play_state: next, updated_at: new Date().toISOString() })
      .eq("id", characterId);
  }, [characterId]);

  /** Andar por el pueblo o por el bosque. No cuesta tiempo y no toca el desfase. */
  const mover = useCallback(async (nodoId: string | null, ancla: string | null) => {
    const s = nodoId && ancla ? { nodo: nodoId, desde: ancla } : null;
    await escribir(s, s ? desfase : 0);
  }, [escribir, desfase]);

  /**
   * Viajar a otro pueblo, que sí cuesta camino.
   *
   * ⚠️ **Volver a donde está el grupo BORRA el sitio y el desfase**, en vez de
   * apuntarse el camino de vuelta. Es deliberado y tiene un precio dicho: el
   * viaje de vuelta no se cobra. Se acepta porque la alternativa —dejar a
   * alguien desfasado estando ya con el grupo— es la que se lee como un fallo, y
   * porque es la misma decisión que hace que `mover` al ancla borre el sitio en
   * vez de fijarlo.
   *
   * El `desfase` se acumula desde ya, aunque **todavía no lo consuma nadie**: la
   * tanda que enciende el reloj por jugador solo tiene que cambiar quién lo lee.
   */
  const viajar = useCallback(async (nodoId: string, ancla: string | null, minutos: number) => {
    if (!ancla) return;
    if (nodoId === ancla) { await escribir(null, 0); return; }
    await escribir({ nodo: nodoId, desde: ancla }, desfase + Math.max(0, Math.floor(minutos)));
  }, [escribir, desfase]);

  return { sitio, desfase, revelados, characterId, ready, mover, viajar, recargar: cargar };
}
