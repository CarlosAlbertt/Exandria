"use client";
import { useCallback, useEffect, useState } from "react";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";

// `venue` (schema_v25): id del nodo donde está, o null = el pueblo entero.
// NULL es lo que hace que la migración no esconda a nadie: los PNJ que ya
// existían siguen saliendo donde salían.
export type LocationNpc = { id: number; poi_name: string; name: string; role: string; prompt: string; public: boolean; portrait: string | null; venue: string | null };

export function useNpcs(poiName: string | null) {
  const [npcs, setNpcs] = useState<LocationNpc[]>([]);
  const [ready, setReady] = useState(false);

  const load = useCallback(async () => {
    if (!supabaseConfigured || !poiName) { setNpcs([]); setReady(true); return; }
    const { data } = await createClient().from("location_npcs").select("*").eq("poi_name", poiName).order("id");
    setNpcs((data ?? []) as LocationNpc[]);
    setReady(true);
  }, [poiName]);

  useEffect(() => {
    if (!supabaseConfigured) { setReady(true); return; }
    let mounted = true;
    const supabase = createClient();
    const run = async () => { if (mounted) await load(); };
    run();
    const ch = supabase
      .channel(`npcs_rt_${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "location_npcs" }, () => { void load(); })
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(ch); };
  }, [load]);

  return { npcs, ready, reload: load };
}

/**
 * TODOS los PNJ de lugar, de todos los POI.
 *
 * `useNpcs` pide un POI y devuelve vacío sin él, que es lo que quiere el editor
 * del Panel DM. Esto hace falta donde no hay un lugar de referencia: la Crónica
 * lista **PNJ conocidos** en otra tabla (`npcs_met`), y sin esto el DM tenía que
 * reescribir a mano gente que ya había creado en Panel DM › PNJs.
 */
export function useAllNpcs() {
  const [npcs, setNpcs] = useState<LocationNpc[]>([]);
  const [ready, setReady] = useState(false);

  const load = useCallback(async () => {
    if (!supabaseConfigured) { setNpcs([]); setReady(true); return; }
    const { data } = await createClient().from("location_npcs").select("*").order("name");
    setNpcs((data ?? []) as LocationNpc[]);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!supabaseConfigured) { setReady(true); return; }
    let mounted = true;
    const supabase = createClient();
    void (async () => { if (mounted) await load(); })();
    const ch = supabase
      .channel(`npcs_all_rt_${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "location_npcs" }, () => { void load(); })
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(ch); };
  }, [load]);

  return { npcs, ready, reload: load };
}

export async function createNpc(poiName: string, name: string, role: string): Promise<number | null> {
  if (!supabaseConfigured) return null;
  const { data } = await createClient().from("location_npcs").insert({ poi_name: poiName, name, role }).select("id").single();
  return data ? (data as { id: number }).id : null;
}
export async function updateNpc(id: number, patch: Partial<Pick<LocationNpc, "name" | "role" | "prompt" | "public" | "portrait" | "venue">>) {
  if (!supabaseConfigured) return;
  await createClient().from("location_npcs").update(patch).eq("id", id);
}
/**
 * Siembra la plantilla de un sitio, **sin pisar lo que ya haya**.
 *
 * ⚠️ El guardia no es un detalle: el DM ya tiene PNJ creados a mano, y un botón
 * que los duplicara le metería once desconocidos en su pueblo sin forma cómoda
 * de deshacerlo. Si en ese sitio hay alguien, **no se siembra y se dice**.
 *
 * `poiName` es el pueblo desde el que se siembra, y va también en los PNJ de
 * las franjas del bosque —que no son de ningún pueblo— **para que el DM los
 * encuentre en Panel DM › PNJs**, que lista por POI. `npcsDeNodo` los coloca
 * por `venue`, así que en pantalla salen en el bosque igual.
 */
export async function seedNpcs(
  poiName: string, nodoId: string, plantilla: { name: string; role: string; prompt: string; publico?: boolean }[],
): Promise<{ ok: true; creados: number } | { ok: false; error: string }> {
  if (!supabaseConfigured) return { ok: false, error: "Supabase no configurado." };
  if (plantilla.length === 0) return { ok: false, error: "Este sitio no tiene plantilla." };
  const supabase = createClient();

  const { data: yaHay, error: errLeer } = await supabase
    .from("location_npcs").select("id").eq("venue", nodoId).limit(1);
  if (errLeer) return { ok: false, error: errLeer.message };
  if (yaHay && yaHay.length > 0) return { ok: false, error: "Ya hay alguien en este sitio; no se siembra encima." };

  const { error } = await supabase.from("location_npcs").insert(
    plantilla.map((t) => ({
      poi_name: poiName, name: t.name, role: t.role, prompt: t.prompt,
      public: t.publico ?? true, venue: nodoId,
    })),
  );
  if (error) return { ok: false, error: error.message };
  return { ok: true, creados: plantilla.length };
}

export async function deleteNpc(id: number) {
  if (!supabaseConfigured) return;
  await createClient().from("location_npcs").delete().eq("id", id);
}
