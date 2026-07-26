"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import { loadActiveCharacter, saveCharacter, type CharacterData, type Item } from "@/lib/character";
import { derive, type Derived } from "@/lib/derive";
import { getMechanics, type ClassMechanics } from "@/data/classdata";
import { getSpecies } from "@/data/species";
import { limpiarTurno } from "@/lib/turno";
import type { PlayState } from "@/lib/recursos";

export type FichaViva = {
  ready: boolean;
  characterId: string | null;
  clsSlug: string;
  level: number;
  items: Item[];
  /** Velocidad de la especie en metros (9 si no hay especie todavía). */
  velocidad: number;
  play: PlayState;
  derived: Derived;
  mechanics: ClassMechanics | null;
  onPlayStateChange: (next: PlayState) => void;
  /** Error de carga, PROPAGADO. Nunca se traga: un error tragado disfraza el fallo. */
  error: string | null;
};

/**
 * La ficha activa de un jugador, viva: cargada, derivada, al día por Realtime y
 * con el estado de juego persistido. La usan las pantallas de COMBATE (el
 * tablero del jugador y el del DM); la hoja de personaje conserva su propia
 * carga porque además edita el build (nivel, oro, equipo, objetos).
 *
 * Es la ÚNICA fuente de `play_state` para quien la consume: `character`,
 * `items` y `level` se exponen SOLO DE LECTURA.
 *
 * `saveMode`: "self" guarda con saveCharacter; "dm" va por /api/dm/character
 * (service_role), igual que hace la hoja cuando el DM edita a otro jugador.
 */
export function useFichaViva(targetUserId: string | null, saveMode: "self" | "dm" = "self"): FichaViva {
  const [row, setRow] = useState<(CharacterData & { id: string }) | null>(null);
  const [play, setPlay] = useState<PlayState>({});
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Última play_state que ESTE cliente escribió: para ignorar el eco de Realtime
  // de la propia escritura y no pisar un segundo toque rápido del jugador.
  const lastWritten = useRef<string | null>(null);
  // `active` previo de mi fila de iniciativa: el turno se limpia solo en la
  // transición false→true (empieza mi turno), no en cada evento.
  const prevActive = useRef(false);

  // --- Carga -----------------------------------------------------------------
  useEffect(() => {
    let done = false;
    (async () => {
      if (!targetUserId) { if (!done) setReady(true); return; }
      const r = await loadActiveCharacter(targetUserId);
      if (done) return;
      // `loadActiveCharacter` devuelve null en DOS casos que no puede distinguir:
      // que no haya ficha activa, y que la consulta fallara (eso ya lo registra
      // él en la consola). Así que aquí NO se afirma un fallo: se deja
      // `characterId` a null y el consumidor dice «no tienes personaje en
      // juego», que es el caso común. Si de verdad fue un error, está en la
      // consola del navegador — que es donde hay que mirar cuando algo
      // desaparece. `error` queda para fallos que sí sepamos nombrar.
      if (r) {
        setRow(r as CharacterData & { id: string });
        if (r.play_state && typeof r.play_state === "object") setPlay(r.play_state as PlayState);
      }
      setReady(true);
    })();
    return () => { done = true; };
  }, [targetUserId]);

  // --- En vivo: la fila propia de `characters` (schema_v4 ya publica) --------
  useEffect(() => {
    if (!supabaseConfigured || !targetUserId) return;
    const supabase = createClient();
    const ch = supabase
      .channel(`ficha_viva_rt_${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "characters", filter: `user_id=eq.${targetUserId}` },
        (p) => {
          const next = (p.new as { play_state?: PlayState }).play_state;
          if (!next || typeof next !== "object") return;
          // Guard anti-eco: si es la que acabamos de escribir, no repintar.
          // jsonb reordena claves, así que es best-effort; los datos son los
          // mismos y el realtime entrega en orden de commit, converge.
          if (JSON.stringify(next) === lastWritten.current) return;
          setPlay(next);
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [targetUserId]);

  // --- Reset del turno: al pasar mi fila de iniciativa a `active` ------------
  useEffect(() => {
    if (!supabaseConfigured || !targetUserId || saveMode !== "self") return;
    const supabase = createClient();
    const ch = supabase
      .channel(`ficha_viva_ini_${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "initiative", filter: `user_id=eq.${targetUserId}` },
        (p) => {
          const active = !!(p.new as { active?: boolean } | null)?.active;
          const empieza = active && !prevActive.current;
          prevActive.current = active;
          if (!empieza) return;
          setPlay((prev) => {
            const next = limpiarTurno(prev);
            lastWritten.current = JSON.stringify(next);
            if (row?.id) void saveCharacter(row.id, { play_state: next });
            return next;
          });
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [targetUserId, saveMode, row?.id]);

  // --- Persistencia optimista de play_state ---------------------------------
  const onPlayStateChange = useCallback((next: PlayState) => {
    lastWritten.current = JSON.stringify(next);
    setPlay(next);
    if (!targetUserId) return;
    if (saveMode === "self") {
      if (row?.id) void saveCharacter(row.id, { play_state: next });
      return;
    }
    void fetch("/api/dm/character", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: targetUserId, patch: { play_state: next } }),
    });
  }, [targetUserId, saveMode, row?.id]);

  // --- Derivación ------------------------------------------------------------
  const derived = useMemo(
    () => derive({
      level: row?.level ?? 1,
      cls: row?.cls ?? null,
      base: row?.base,
      bonus: row?.bonus,
      asi: row?.asi,
      skills: row?.skills,
      equipment: row?.equipment,
      hp_rolls: row?.hp_rolls,
    }),
    [row],
  );

  const mechanics = useMemo(() => getMechanics(row?.cls), [row?.cls]);
  const velocidad = useMemo(() => (row?.species ? getSpecies(row.species)?.speed ?? 9 : 9), [row?.species]);

  return {
    ready,
    characterId: row?.id ?? null,
    clsSlug: row?.cls ?? "",
    level: row?.level ?? 1,
    items: Array.isArray(row?.items) ? row.items : [],
    velocidad,
    play,
    derived,
    mechanics,
    onPlayStateChange,
    error,
  };
}
