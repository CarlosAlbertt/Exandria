"use client";

import { useEffect, useState } from "react";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";

export type InitiativeRow = {
  id: number;
  user_id: string | null;
  is_npc: boolean;
  npc_name: string | null;
  value: number | null;
  active: boolean;
  /** Qué monstruo del bestiario es. `null` en jugadores y en PNJ escritos a mano. */
  monster_slug: string | null;
  /** PG del PNJ. `null` en jugadores: los suyos viven en `characters.play_state`. */
  hp: number | null;
  hp_max: number | null;
  /** Condiciones del PNJ. Las de los jugadores siguen en `play_state`. */
  conds: string[];
};

const INI_FIELDS = "id, user_id, is_npc, npc_name, value, active, monster_slug, hp, hp_max, conds";
// Las seis columnas de la schema_v11, que existen desde siempre.
const INI_FIELDS_BASE = "id, user_id, is_npc, npc_name, value, active";

// Una fila leída sin las columnas de la v23 tiene que seguir siendo una
// InitiativeRow válida: se rellenan los huecos con los mismos valores que
// tendría una fila de jugador.
function normaliza(row: Record<string, unknown>): InitiativeRow {
  return {
    id: row.id as number,
    user_id: (row.user_id as string | null) ?? null,
    is_npc: Boolean(row.is_npc),
    npc_name: (row.npc_name as string | null) ?? null,
    value: (row.value as number | null) ?? null,
    active: Boolean(row.active),
    monster_slug: (row.monster_slug as string | null) ?? null,
    hp: (row.hp as number | null) ?? null,
    hp_max: (row.hp_max as number | null) ?? null,
    conds: Array.isArray(row.conds) ? (row.conds as string[]) : [],
  };
}

// Iniciativa en vivo: todas las filas (jugadores + PNJ), orden descendente
// por valor (nulos al final). Se recarga entera ante cualquier cambio: es
// una tabla pequeña y así el orden con nulos y los borrados masivos quedan
// siempre correctos (igual que useParty en lib/character.ts).
//
// TOLERANTE A LA schema_v23: si las cuatro columnas nuevas no existen todavía,
// Postgres devuelve 42703 y tumba la consulta ENTERA. Sin este reintento, el
// combate desaparecería de la pantalla y la app diría "Sin ronda de iniciativa
// en curso" — culpando al dato en vez de a la migración, que es exactamente el
// bug del 2026-07-22 con otra cara. Aquí basta una lista base fija (y no leer
// del error qué columna falta, como hace selectTolerante en lib/character.ts)
// porque las cuatro llegan juntas en una sola migración: o están las cuatro o
// no está ninguna.
export function useInitiative() {
  const [rows, setRows] = useState<InitiativeRow[]>([]);
  const [ready, setReady] = useState(() => !supabaseConfigured);
  const [faltaMigracion, setFaltaMigracion] = useState(false);

  useEffect(() => {
    if (!supabaseConfigured) return;
    const supabase = createClient();
    let mounted = true;

    const load = async () => {
      const pide = (fields: string) =>
        supabase.from("initiative").select(fields).order("value", { ascending: false, nullsFirst: false });

      let { data, error } = await pide(INI_FIELDS);

      if (error?.code === "42703") {
        console.warn("[initiative] faltan las columnas de schema_v23; se lee sin ellas:", error.message);
        const base = await pide(INI_FIELDS_BASE);
        data = base.data;
        error = base.error;
        if (mounted) setFaltaMigracion(true);
      } else if (mounted) {
        setFaltaMigracion(false);
      }

      if (!mounted) return;
      // Un error que no sea 42703 se deja ver en consola en vez de tragarse:
      // si la iniciativa se vacía sola, hay que poder sospechar de la consulta
      // antes que del dato.
      if (error) console.error("[initiative] no se pudo leer la iniciativa:", error.message);
      if (data) setRows((data as unknown as Record<string, unknown>[]).map(normaliza));
      setReady(true);
    };
    load();

    const ch = supabase
      .channel(`initiative_rt_${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "initiative" }, () => load())
      .subscribe();

    return () => { mounted = false; supabase.removeChannel(ch); };
  }, []);

  return { rows, ready, faltaMigracion };
}

// Guarda la iniciativa propia: como hay un índice único parcial sobre
// user_id (no una restricción unique "de verdad"), upsert con onConflict no
// es fiable aquí — se busca la fila propia y se actualiza, o se inserta.
export async function setMyInitiative(userId: string, value: number): Promise<{ error: string | null }> {
  if (!supabaseConfigured) return { error: "Supabase no configurado" };
  const supabase = createClient();
  const { data } = await supabase.from("initiative").select("id").eq("user_id", userId).maybeSingle();

  if (data) {
    const { error } = await supabase
      .from("initiative")
      .update({ value, updated_at: new Date().toISOString() })
      .eq("id", data.id);
    return { error: error?.message ?? null };
  }

  const { error } = await supabase.from("initiative").insert({ user_id: userId, value, is_npc: false });
  return { error: error?.message ?? null };
}

// Añade un PNJ a la iniciativa (solo el DM, por RLS).
export async function addNpcInitiative(name: string, value: number): Promise<{ error: string | null }> {
  if (!supabaseConfigured) return { error: "Supabase no configurado" };
  const { error } = await createClient().from("initiative").insert({ is_npc: true, npc_name: name, value });
  return { error: error?.message ?? null };
}

// Marca una fila como activa (turno actual) y desactiva el resto.
export async function setActiveInitiative(id: number): Promise<{ error: string | null }> {
  if (!supabaseConfigured) return { error: "Supabase no configurado" };
  const supabase = createClient();
  const { error: e1 } = await supabase
    .from("initiative")
    .update({ active: false, updated_at: new Date().toISOString() })
    .neq("id", -1);
  if (e1) return { error: e1.message };

  const { error: e2 } = await supabase
    .from("initiative")
    .update({ active: true, updated_at: new Date().toISOString() })
    .eq("id", id);
  return { error: e2?.message ?? null };
}

// Vacía la iniciativa por completo (solo el DM, por RLS).
export async function clearInitiative(): Promise<{ error: string | null }> {
  if (!supabaseConfigured) return { error: "Supabase no configurado" };
  const { error } = await createClient().from("initiative").delete().neq("id", -1);
  return { error: error?.message ?? null };
}

/* ---------------------------- Monstruos (DM) ---------------------------- */

/** Una fila de monstruo a punto de insertarse. La iniciativa ya viene tirada. */
export type NuevoMonstruo = {
  nombre: string;
  slug: string;
  hp: number;
  valor: number;
};

// Añade una tanda de monstruos de golpe (solo el DM, por RLS). Un único
// insert para que las filas aparezcan juntas en el realtime de todos.
export async function addMonstersInitiative(filas: NuevoMonstruo[]): Promise<{ error: string | null }> {
  if (!supabaseConfigured) return { error: "Supabase no configurado" };
  if (filas.length === 0) return { error: null };
  const { error } = await createClient().from("initiative").insert(
    filas.map((f) => ({
      is_npc: true,
      npc_name: f.nombre,
      monster_slug: f.slug,
      hp: f.hp,
      hp_max: f.hp,
      value: f.valor,
      conds: [],
    }))
  );
  return { error: error?.message ?? null };
}

// PG de un PNJ. Se acota entre 0 y hp_max aquí mismo para que ninguna vía
// (botón, teclado) pueda dejar la fila con PG negativos o por encima del tope.
export async function setNpcHp(id: number, hp: number, hpMax: number): Promise<{ error: string | null }> {
  if (!supabaseConfigured) return { error: "Supabase no configurado" };
  const acotado = Math.max(0, Math.min(Math.round(hp), hpMax));
  const { error } = await createClient()
    .from("initiative")
    .update({ hp: acotado, updated_at: new Date().toISOString() })
    .eq("id", id);
  return { error: error?.message ?? null };
}

// Condiciones de un PNJ: se escribe la lista entera (read-modify-write lo hace
// quien llama, que ya tiene la fila en memoria por el hook).
export async function setNpcConds(id: number, conds: string[]): Promise<{ error: string | null }> {
  if (!supabaseConfigured) return { error: "Supabase no configurado" };
  const { error } = await createClient()
    .from("initiative")
    .update({ conds, updated_at: new Date().toISOString() })
    .eq("id", id);
  return { error: error?.message ?? null };
}

// Quita una sola fila (solo el DM, por RLS). Complementa a clearInitiative,
// que las vacía todas y termina el combate.
export async function removeInitiativeRow(id: number): Promise<{ error: string | null }> {
  if (!supabaseConfigured) return { error: "Supabase no configurado" };
  const { error } = await createClient().from("initiative").delete().eq("id", id);
  return { error: error?.message ?? null };
}
