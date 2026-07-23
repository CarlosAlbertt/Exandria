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
  // Estado de juego (Fase O1): usos gastados de los pozos de clase. La Fase O2
  // reutilizará esta misma columna para huecos de conjuro y preparados.
  play_state: Record<string, unknown>;
};

// Columnas de la ficha, en una lista para poder QUITAR las que la base no
// tenga. Sin `id`/`user_id`, que los pone cada consulta.
const FIELD_LIST = [
  "name", "species", "lineage", "cls", "subclass", "background", "base", "bonus",
  "skills", "inventory", "items", "equipment", "asi", "hp_rolls", "level", "xp",
  "gold", "lore", "origin_continent", "origin_region", "deity", "lore_unlocked",
  "play_state",
] as const;
const FIELDS = FIELD_LIST.join(", ");

// Nombre de la columna que Postgres dice que falta ("column characters.lore
// does not exist" → "lore"). Devuelve null si el mensaje no es de ese tipo.
function missingColumn(message: string): string | null {
  return message.match(/column \w+\.(\w+) does not exist/)?.[1] ?? null;
}

// Reintento tolerante a migraciones a medias.
//
// Si falta UNA columna, Postgres tumba la consulta ENTERA (código 42703). Antes
// eso devolvía null y la hoja lo leía como «no tienes personaje»: el personaje
// parecía borrado estando intacto. Ahora se quita del `select` la columna que
// el propio error nombra y se reintenta, hasta que la consulta pase o no quede
// nada que quitar. Se degrada perdiendo campos, no la ficha entera.
//
// El primer intento va con TODO, así que una base al día no paga nada. Y el
// aviso por consola dice exactamente qué falta, que es lo que costó ver la vez
// que pasó (una `characters` sin `lore`, de una v4 que no llegó a correr).
async function selectTolerante<T>(
  run: (fields: string) => Promise<{ data: T; error: { code?: string; message: string } | null }>,
  que: string,
): Promise<{ data: T | null; error: { message: string } | null }> {
  const campos = [...FIELD_LIST] as string[];
  // Como mucho, una vuelta por columna: sin esto, un error 42703 que no nombre
  // ninguna columna conocida daría un bucle infinito.
  for (let intento = 0; intento <= FIELD_LIST.length; intento++) {
    const { data, error } = await run(campos.join(", "));
    if (!error) return { data, error: null };
    if (error.code !== "42703") return { data: null, error };

    const falta = missingColumn(error.message);
    const i = falta ? campos.indexOf(falta) : -1;
    if (i === -1) return { data: null, error };

    campos.splice(i, 1);
    console.error(
      `[Exandria] La tabla 'characters' no tiene la columna '${falta}'. ` +
      `Ejecuta supabase/schema_v21_reparar_characters.sql en el SQL Editor. ` +
      `Mientras tanto se carga ${que} sin ese campo.`
    );
  }
  return { data: null, error: { message: "No se pudo construir una consulta válida para 'characters'." } };
}

// Expuestos SOLO para scripts/check-ficha.ts: el reintento es lógica pura y
// merece comprobación, pero no es API de este módulo. No usar en la app.
export const __selectToleranteParaTests = selectTolerante;
export const __FIELD_LIST = FIELD_LIST;

// La ficha activa del jugador, con su id. null si no tiene ninguna en juego
// (p. ej. acaba de archivar la suya y aún no se ha hecho otra).
export async function loadActiveCharacter(userId: string): Promise<(Partial<CharacterData> & { id: string }) | null> {
  if (!supabaseConfigured || !userId) return null;
  const supabase = createClient();
  // El `select` va con una lista de columnas dinámica, así que el cliente
  // tipado no puede inferir la forma: se acota a mano al mínimo que se usa.
  type Fila = (Partial<CharacterData> & { id: string }) | null;
  type Resultado = { data: Fila; error: { code?: string; message: string } | null };
  const query = (fields: string) => supabase
    .from("characters")
    .select(`id, ${fields}`)
    .eq("user_id", userId)
    .is("archived_at", null)
    .maybeSingle() as unknown as Promise<Resultado>;

  const { data, error } = await selectTolerante((fields) => query(fields), "la ficha");

  if (error) {
    console.error("[Exandria] No se pudo cargar la ficha activa:", error.message);
    return null;
  }
  if (!data) return null;
  const row = data;
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
// Devuelve el error en español, o null si fue bien. Antes se descartaba, y eso
// dejaba un agujero feo: si el guardado del creador fallaba (una migración sin
// ejecutar basta), la fila se quedaba VACÍA pero el hueco ya gastado, y el
// jugador acababa en «Aún no hay personaje» sin ninguna pista. Quien llame
// puede seguir ignorando el retorno, pero el creador ya no lo hace.
export async function saveCharacter(characterId: string, patch: Partial<CharacterData>): Promise<string | null> {
  if (!supabaseConfigured || !characterId) return null;
  const { error } = await createClient()
    .from("characters")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", characterId);
  if (error) console.error("[Exandria] No se pudo guardar la ficha:", error.message);
  return error ? humanDbError(error) : null;
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
  // 42703 = columna inexistente: siempre es una migración de supabase/ sin
  // ejecutar. Se dice así para no mandar a nadie a leer un mensaje de Postgres.
  if (error.code === "42703") {
    return `La base de datos no tiene una columna que la app necesita (${error.message}). Falta ejecutar alguna migración de supabase/ en el SQL Editor.`;
  }
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
      // Solo los que están EN JUEGO: sin este filtro, los archivados
      // reaparecerían en la iniciativa, los dados y la crónica.
      // Misma red de seguridad que loadActiveCharacter: con una migración a
      // medias, la columna que falta tumbaba la consulta entera y el DM veía el
      // grupo VACÍO, sin pista de por qué.
      const cargarChars = (fields: string) =>
        supabase.from("characters").select(`user_id, ${fields}`).is("archived_at", null) as unknown as
          Promise<{ data: unknown[]; error: { code?: string; message: string } | null }>;

      const [chars, profs] = await Promise.all([
        selectTolerante(cargarChars, "el grupo"),
        supabase.from("profiles").select("id, username, role"),
      ]);
      if (chars.error) console.error("[Exandria] No se pudo cargar el grupo:", chars.error.message);
      if (!mounted) return;
      const names: Record<string, string> = {};
      const roles: Record<string, string> = {};
      for (const p of (profs.data ?? []) as { id: string; username: string; role: string }[]) { names[p.id] = p.username; roles[p.id] = p.role; }
      // `as unknown` primero: con la lista de columnas dinámica, el cliente
      // tipado infiere un ParserError y no deja convertir directamente.
      const rows = ((chars.data ?? []) as unknown as (CharacterData & { user_id: string })[])
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
