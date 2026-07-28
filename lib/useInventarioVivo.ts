"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import { loadActiveCharacter, saveCharacter, type CharacterData, type Item } from "@/lib/character";
import { derive, type Derived } from "@/lib/derive";
import { ABILITIES, type AbilityKey } from "@/data/rules";

/**
 * Espera antes de guardar, en ms. Es EL MISMO número que usa la hoja
 * (components/CharacterSheet.tsx, el efecto de guardado): al arrastrar objetos
 * o toquetear cantidades se disparan muchos cambios seguidos y no tiene sentido
 * mandar un UPDATE por cada uno. Si aquí fuera distinto, las dos pantallas
 * escribirían con ritmos distintos sobre las mismas columnas y ganaría la lenta
 * por accidente; se copia a propósito.
 */
const GUARDADO_MS = 700;

const SIN_EQUIPO: Record<string, Item> = {};

export type InventarioVivo = {
  ready: boolean;
  /** id de la ficha en juego. `null` con `ready` = no hay personaje que enseñar. */
  characterId: string | null;
  /** La fila cargada, SOLO DE LECTURA: nombre, especie, oro, nivel… para la cabecera. */
  character: (Partial<CharacterData> & { id: string }) | null;
  items: Item[];
  equipment: Record<string, Item>;
  /** Modificadores de aptitud ya calculados: la bolsa necesita `mods.fue` para los huecos. */
  mods: Record<AbilityKey, number>;
  derived: Derived;
  setItems: Dispatch<SetStateAction<Item[]>>;
  setEquipment: Dispatch<SetStateAction<Record<string, Item>>>;
  /**
   * Error que sepamos NOMBRAR: hoy, solo los del GUARDADO (que sí se conocen —
   * `saveCharacter` devuelve el mensaje y la API del DM también).
   *
   * El de la CARGA no cabe aquí, igual que en `useFichaViva`:
   * `loadActiveCharacter` devuelve `null` en dos casos que no distingue —que no
   * haya ficha en juego y que la consulta fallara— y él mismo deja el fallo en
   * la consola. Así que aquí no se inventa un mensaje que le mentiría a quien
   * simplemente no tiene personaje: se deja `characterId` a `null` y la pantalla
   * dice «no tienes un personaje en juego», que es el caso común. Confundir
   * «falta una columna» con «no tienes personaje» es exactamente el fallo que
   * costó la migración de reparación del 2026-07-22; la consola del navegador es
   * donde hay que mirar cuando una bolsa desaparece.
   */
  error: string | null;
};

/**
 * La bolsa viva de un jugador: cargada, derivada, al día por Realtime y
 * persistida. La usa la pantalla de INVENTARIO.
 *
 * Es hermana de `useFichaViva`, no la misma: aquélla es la única fuente de
 * `play_state` y expone `items` de solo lectura, así que no sirve para editar
 * la bolsa. Ésta manda sobre `items` y `equipment` —que son COLUMNAS de
 * `characters`, no parte de `play_state`— y no toca `play_state` para nada. Las
 * dos pueden convivir montadas en pantallas distintas sin pisarse: escriben
 * columnas disjuntas.
 *
 * El guardado imita a propósito el de la hoja (mismo debounce, mismo
 * `saveCharacter` para "self", misma POST a /api/dm/character para "dm"), para
 * que dos pantallas que escriben las mismas columnas lo hagan por el mismo
 * camino. Lo único que cambia es el TAMAÑO del parche: la hoja manda el lote
 * entero (nivel, oro, asi, items, equipo, tiradas de PG) y aquí van solo `items`
 * y `equipment`. Es a posta: un parche estrecho no puede pisar el oro que acabe
 * de cambiar la tienda.
 *
 * `saveMode`: "self" guarda con saveCharacter; "dm" va por /api/dm/character
 * (service_role), igual que la hoja cuando el DM edita a otro jugador.
 */
export function useInventarioVivo(
  targetUserId: string | null,
  saveMode: "self" | "dm" = "self",
): InventarioVivo {
  const [row, setRow] = useState<(Partial<CharacterData> & { id: string }) | null>(null);
  const [items, setItemsState] = useState<Item[]>([]);
  const [equipment, setEquipmentState] = useState<Record<string, Item>>(SIN_EQUIPO);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Vivo o no: hay `setState` después de `await` (guardar) y de la carga, y en
  // React 19 el montaje doble de desarrollo desmonta y remonta de verdad.
  const montado = useRef(true);
  useEffect(() => {
    montado.current = true;
    return () => { montado.current = false; };
  }, []);

  // Último {items, equipment} que ESTE cliente escribió: para ignorar el eco de
  // Realtime de la propia escritura y no pisar un segundo toque rápido.
  const lastWritten = useRef<string | null>(null);

  // ¿Hay un cambio DEL JUGADOR pendiente de guardar? Sin esto, el efecto de
  // guardado dispararía también al terminar la carga y al recibir un cambio del
  // DM, reescribiendo lo que se acaba de leer: ruido inútil y, si alguien
  // escribió entre medias, una pisada. Solo lo levantan los `setItems`/
  // `setEquipment` que se exponen; la carga y el Realtime usan los crudos.
  const sucio = useRef(false);

  const setItems = useCallback<Dispatch<SetStateAction<Item[]>>>((next) => {
    sucio.current = true;
    setItemsState(next);
  }, []);

  const setEquipment = useCallback<Dispatch<SetStateAction<Record<string, Item>>>>((next) => {
    sucio.current = true;
    setEquipmentState(next);
  }, []);

  // --- Carga -----------------------------------------------------------------
  useEffect(() => {
    let done = false;
    (async () => {
      if (!targetUserId) { if (!done) setReady(true); return; }
      const r = await loadActiveCharacter(targetUserId);
      if (done) return;
      // Ojo: `r === null` NO significa «falló». Ver el comentario de `error`.
      if (r) {
        setRow(r);
        if (Array.isArray(r.items)) setItemsState(r.items);
        if (r.equipment && typeof r.equipment === "object") setEquipmentState(r.equipment);
      }
      setReady(true);
    })();
    return () => { done = true; };
  }, [targetUserId]);

  // --- En vivo: la fila propia de `characters` (schema_v4 ya publica) --------
  // Para que el botín que reparte el DM aparezca en la bolsa sin recargar.
  useEffect(() => {
    if (!supabaseConfigured || !targetUserId) return;
    const supabase = createClient();
    // Sufijo aleatorio por montaje: supabase-js reutiliza el canal si el nombre
    // coincide y lanza si se le añaden callbacks después de subscribe(), y en
    // desarrollo React monta dos veces. Es lo que hacen el resto de hooks.
    const ch = supabase
      .channel(`inventario_vivo_rt_${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "characters", filter: `user_id=eq.${targetUserId}` },
        (p) => {
          const fila = p.new as { items?: Item[] | null; equipment?: Record<string, Item> | null };
          // Si el evento no trae las columnas de la bolsa, no hay nada que
          // aplicar. Sin esta salida, un UPDATE de otra columna la vaciaría.
          if (!Array.isArray(fila.items) && !fila.equipment) return;
          const nextItems = Array.isArray(fila.items) ? fila.items : [];
          const nextEquipment = fila.equipment && typeof fila.equipment === "object" ? fila.equipment : {};
          // Guard anti-eco: si es lo que acabamos de escribir, no repintar.
          // jsonb reordena claves, así que es best-effort; los datos son los
          // mismos y el realtime entrega en orden de commit, converge.
          if (JSON.stringify({ items: nextItems, equipment: nextEquipment }) === lastWritten.current) return;
          setItemsState(nextItems);
          setEquipmentState(nextEquipment);
        },
      )
      .subscribe((status, err) => {
        // Un canal caído no rompe la pantalla (la bolsa cargada sigue ahí) pero
        // deja de llegar el botín del DM sin que se note. Que quede dicho.
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error("[Exandria] La bolsa se ha quedado sin conexión en vivo:", status, err?.message ?? "");
        }
      });
    return () => { supabase.removeChannel(ch); };
  }, [targetUserId]);

  // --- Guardado --------------------------------------------------------------
  // Sacado de `row` a una constante suelta a propósito: si el efecto de guardado
  // dependiera del objeto entero, se rearmaría con cualquier cambio de la fila.
  const characterId = row?.id ?? null;

  const persistir = useCallback(async (patch: Pick<CharacterData, "items" | "equipment">) => {
    if (!targetUserId) return;

    if (saveMode === "self") {
      if (!characterId) return;
      const err = await saveCharacter(characterId, patch);
      if (!montado.current) return;
      // `saveCharacter` ya ha dejado el detalle en consola; aquí se NOMBRA para
      // el jugador, que si no vería su bolsa «guardada» y mañana vacía.
      setError(err);
      return;
    }

    try {
      const res = await fetch("/api/dm/character", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: targetUserId, patch }),
      });
      if (!res.ok) {
        const cuerpo = (await res.json().catch(() => null)) as { error?: string } | null;
        const msg = cuerpo?.error ?? `El servidor respondió ${res.status}.`;
        console.error("[Exandria] No se pudo guardar la bolsa:", msg);
        if (montado.current) setError(msg);
        return;
      }
      if (montado.current) setError(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[Exandria] No se pudo guardar la bolsa:", msg);
      if (montado.current) setError(`No se pudo guardar la bolsa: ${msg}`);
    }
  }, [targetUserId, saveMode, characterId]);

  // Mismo mecanismo que la hoja: un efecto con debounce sobre el estado, no una
  // llamada dentro de cada handler. Así los handlers de la pantalla se quedan
  // puros (calculan la bolsa siguiente y ya) y ninguno puede olvidarse de
  // guardar.
  useEffect(() => {
    if (!ready || !sucio.current) return;
    const t = setTimeout(() => {
      sucio.current = false;
      lastWritten.current = JSON.stringify({ items, equipment });
      void persistir({ items, equipment });
    }, GUARDADO_MS);
    return () => clearTimeout(t);
  }, [items, equipment, ready, persistir]);

  // --- Derivación ------------------------------------------------------------
  // Con el `equipment` VIVO, no con el de la fila cargada: al equipar una
  // coraza la CA tiene que moverse en la misma pantalla.
  const derived = useMemo(
    () => derive({
      level: row?.level ?? 1,
      cls: row?.cls ?? null,
      base: row?.base,
      bonus: row?.bonus,
      asi: row?.asi,
      skills: row?.skills,
      equipment,
      hp_rolls: row?.hp_rolls,
    }),
    [row, equipment],
  );

  const mods = useMemo(() => {
    const out = {} as Record<AbilityKey, number>;
    for (const a of ABILITIES) out[a.key] = derived.abilities[a.key].mod;
    return out;
  }, [derived]);

  return {
    ready,
    characterId,
    character: row,
    items,
    equipment,
    mods,
    derived,
    setItems,
    setEquipment,
    error,
  };
}
