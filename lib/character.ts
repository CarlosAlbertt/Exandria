"use client";

import { useEffect, useState } from "react";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import type { AbilityKey } from "@/data/rules";
import type { Assign, StatMethod } from "@/lib/statRolls";
import type { CharSlot } from "@/lib/archive";

// Documento in-game legible (Fase M): carta, contrato, página de diario, mapa…
// Vive dentro del item (jsonb), sin migración. El jugador lo abre en un visor.
// unlockLore: ids de entradas de saber que este tomo ENSEÑA al leerlo.
export type ItemDoc = { titulo: string; texto: string; imagen?: string; unlockLore?: string[] };
export type Item = { id: string; name: string; qty: number; notes?: string; doc?: ItemDoc };

export type Asi = Record<string, Partial<Record<AbilityKey, number>>>;

// Estado del creador de personaje EN CURSO (el borrador de /crear: qué se ha
// elegido y por qué paso va). Distinto de `CharacterData`, que es la ficha ya
// guardada: `Build` tiene `step`/`statMethod`/`rolled`/`assign`, que solo
// existen mientras se construye, y le faltan los campos de juego (nivel,
// inventario, oro…) que solo aparecen una vez creado el personaje.
export type Build = {
  name: string;
  species: string | null;
  lineage: string | null;
  cls: string | null;
  subclass: string | null;
  background: string | null;
  base: Record<AbilityKey, number>;
  bonus: Record<AbilityKey, number>;
  skills: string[];
  lore: string;
  // Origen y fe (saber por origen). Opcionales: sin ellos sabes solo lo básico.
  originContinent: string | null;
  originRegion: string | null;
  deity: string | null;
  step: number;
  statMethod: StatMethod | null;
  rolled: number[];   // los 6 valores (dados/array); vacío en point-buy
  assign: Assign;     // aptitud -> índice en `rolled`
};

export type CharacterData = {
  name: string;
  species: string | null;
  lineage: string | null;
  cls: string | null;
  subclass: string | null;
  background: string | null;
  base: Record<AbilityKey, number>;
  bonus: Record<AbilityKey, number>;
  skills: string[];
  inventory: string[];        // legado (text[]); ya no se escribe
  items: Item[];              // inventario enriquecido
  equipment: Record<string, Item>;
  asi: Asi;
  hp_rolls: Record<string, number>;
  level: number;
  xp: number;
  gold: number;
  lore: string;
  // Saber por origen (schema_v19): de dónde es y en qué cree, y lo que ha
  // aprendido jugando. origin_region solo aplica a Tal'Dorei; deity null = sin fe.
  origin_continent: string | null;
  origin_region: string | null;
  deity: string | null;
  lore_unlocked: string[];
};

const FIELDS =
  "name, species, lineage, cls, subclass, background, base, bonus, skills, inventory, items, equipment, asi, hp_rolls, level, xp, gold, lore, origin_continent, origin_region, deity, lore_unlocked";

// La ficha activa del jugador, con su id. null si no tiene ninguna en juego
// (p. ej. acaba de archivar la suya y aún no se ha hecho otra).
export async function loadActiveCharacter(userId: string): Promise<(Partial<CharacterData> & { id: string }) | null> {
  if (!supabaseConfigured || !userId) return null;
  const { data } = await createClient()
    .from("characters")
    .select(`id, ${FIELDS}`)
    .eq("user_id", userId)
    .is("archived_at", null)
    .maybeSingle();
  if (!data) return null;
  const row = data as Partial<CharacterData> & { id: string };
  if ((!row.items || row.items.length === 0) && Array.isArray(row.inventory) && row.inventory.length) {
    row.items = row.inventory.map((name, i) => ({ id: `legacy-${i}`, name, qty: 1 }));
  }
  return row;
}

// Todos los personajes del jugador (activo + archivados), para la lista de
// /personaje y para las reglas de lib/archive.ts.
export async function listCharacters(userId: string): Promise<(CharSlot & { name: string; cls: string | null; level: number })[]> {
  if (!supabaseConfigured || !userId) return [];
  const { data } = await createClient()
    .from("characters")
    .select("id, archived_at, name, cls, level")
    .eq("user_id", userId)
    .order("archived_at", { ascending: true, nullsFirst: true });
  return (data ?? []) as (CharSlot & { name: string; cls: string | null; level: number })[];
}

// Crea un personaje nuevo y devuelve su id, o un mensaje de error.
// El trigger de la BD rechaza el cuarto y el índice único el segundo activo:
// aquí no se comprueba nada, se traduce lo que diga la BD.
export async function createCharacter(userId: string): Promise<{ id: string } | { error: string }> {
  if (!supabaseConfigured || !userId) return { error: "Supabase no configurado" };
  const { data, error } = await createClient()
    .from("characters")
    .insert({ user_id: userId })
    .select("id")
    .single();
  if (error) return { error: humanDbError(error) };
  return { id: (data as { id: string }).id };
}

// Guarda la ficha POR ID. Ya no puede ser un upsert por user_id: el índice
// único nuevo es PARCIAL (where archived_at is null) y un upsert necesita un
// índice único que case con su target.
export async function saveCharacter(characterId: string, patch: Partial<CharacterData>) {
  if (!supabaseConfigured || !characterId) return;
  await createClient()
    .from("characters")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", characterId);
}

// Retira un personaje del juego. El viaje de vuelta lo hace solo el DM (lo
// garantiza un trigger, no el cliente).
export async function archiveCharacter(characterId: string): Promise<string | null> {
  if (!supabaseConfigured || !characterId) return "Supabase no configurado";
  const { error } = await createClient()
    .from("characters")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", characterId);
  return error ? humanDbError(error) : null;
}

// Los errores de los triggers (guard_limite_personajes, guard_desarchivar) ya
// llegan en español listos para el jugador: RAISE EXCEPTION en schema_v14.sql
// pone el texto final, así que aquí no hay nada que traducir, se reenvía tal
// cual. El único caso que SÍ hace falta traducir es el índice único parcial
// (characters_un_activo): ese lo dispara Postgres, no un trigger nuestro, y su
// mensaje es el genérico "duplicate key value violates unique constraint...".
// Para ese distinguimos por CÓDIGO (23505 = unique_violation), no por texto:
// un código de Postgres no cambia si alguien retoca la redacción del mensaje
// o el locale del servidor, un regex sobre el texto sí. Con un solo índice
// único parcial en la tabla, el código basta — no hace falta mirar además qué
// índice fue (eso sería sobre-ingeniería mientras solo haya uno).
function humanDbError(error: { message: string; code: string }): string {
  if (error.code === "23505") return "Ya tienes un personaje en juego. Retíralo antes de crear otro.";
  return error.message;
}

// --- Vista del DM: todas las fichas del grupo con su username ---
export type PartyMember = CharacterData & { user_id: string; username: string };

export function useParty() {
  const [party, setParty] = useState<PartyMember[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!supabaseConfigured) { setReady(true); return; }
    const supabase = createClient();
    let mounted = true;

    const load = async () => {
      const [chars, profs] = await Promise.all([
        // Solo los que están EN JUEGO: sin este filtro, los archivados
        // reaparecerían en la iniciativa, los dados y la crónica.
        supabase.from("characters").select(`user_id, ${FIELDS}`).is("archived_at", null),
        supabase.from("profiles").select("id, username, role"),
      ]);
      if (!mounted) return;
      const names: Record<string, string> = {};
      const roles: Record<string, string> = {};
      for (const p of (profs.data ?? []) as { id: string; username: string; role: string }[]) { names[p.id] = p.username; roles[p.id] = p.role; }
      const rows = ((chars.data ?? []) as (CharacterData & { user_id: string })[])
        .filter((c) => roles[c.user_id] !== "dm")
        .map((c) => ({ ...c, username: names[c.user_id] ?? "jugador" }));
      setParty(rows);
      setReady(true);
    };
    load();

    // Sufijo aleatorio: supabase-js reutiliza el canal si el nombre coincide y
    // lanza si se añaden callbacks tras subscribe() — con varios useParty
    // montados a la vez (p. ej. pestaña Dados) el nombre fijo rompía la página.
    const ch = supabase
      .channel(`characters_rt_${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "characters" }, () => load())
      .subscribe();

    return () => { mounted = false; supabase.removeChannel(ch); };
  }, []);

  return { party, ready };
}
