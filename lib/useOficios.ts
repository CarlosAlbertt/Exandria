"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import { MATERIALES, type Material, type Oficio } from "@/lib/materiales";
import { RECETAS, type Receta } from "@/data/recetas";

// Catálogos de oficio: los 369 materiales y las 32 recetas del código, más lo
// que el DM añada, guardado en `app_config` sin migración de esquema (mismo
// patrón que useBestiary/useAtlas/useDmStash). Dos claves independientes:
// "materiales_custom" y "recetas_custom".
//
// ⚠️ **`app_config` NO está en la publicación realtime.** Es una leccion ya
// pagada dos veces en este repo —`useBestiary` se suscribe a `app_config` y esa
// suscripción no entrega nunca—, así que aquí **no se suscribe a nada**: el
// estado local se actualiza en el acto al escribir (update optimista) y se
// vuelve a leer del servidor solo al montar. Fingir una suscripción que no
// entrega sería peor que no tenerla: haría creer que dos DMs se ven entre sí.

const KEY_MATERIALES = "materiales_custom";
const KEY_RECETAS = "recetas_custom";

export type MaterialCustom = Material & { custom: true };
export type RecetaCustom = Receta & { custom: true };

/** La clave de un material: el número es propio de cada oficio, no global. */
export function claveMaterial(m: { oficio: Oficio; n: number }): string {
  return `${m.oficio}:${m.n}`;
}

function parseArray<T>(value: string | null | undefined): T[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

/** Parte del catálogo del código y superpone los propios por (oficio, número). */
function mezclarMateriales(customs: Material[]): Material[] {
  const por = new Map<string, Material>();
  for (const m of MATERIALES) por.set(claveMaterial(m), m);
  for (const c of customs) por.set(claveMaterial(c), { ...c, custom: true } as MaterialCustom);
  return [...por.values()];
}

function mezclarRecetas(customs: Receta[]): Receta[] {
  const por = new Map<string, Receta>();
  for (const r of RECETAS) por.set(r.slug, r);
  for (const c of customs) por.set(c.slug, { ...c, custom: true } as RecetaCustom);
  return [...por.values()];
}

export function esCustom(x: unknown): boolean {
  return (x as { custom?: boolean } | null)?.custom === true;
}

export type Oficios = {
  materiales: Material[];
  recetas: Receta[];
  ready: boolean;
  error: string | null;
  guardarMaterial: (m: Material) => Promise<void>;
  borrarMaterial: (m: { oficio: Oficio; n: number }) => Promise<void>;
  guardarReceta: (r: Receta) => Promise<void>;
  borrarReceta: (slug: string) => Promise<void>;
};

export function useOficios(): Oficios {
  // Sin Supabase, los catálogos del código se conocen desde el primer render
  // (inicializador perezoso, no un efecto).
  const [customMat, setCustomMat] = useState<Material[]>([]);
  const [customRec, setCustomRec] = useState<Receta[]>([]);
  const [ready, setReady] = useState(() => !supabaseConfigured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabaseConfigured) return;
    const supabase = createClient();
    let vivo = true;
    (async () => {
      const { data } = await supabase
        .from("app_config")
        .select("key, value")
        .in("key", [KEY_MATERIALES, KEY_RECETAS]);
      if (!vivo) return;
      const filas = (data ?? []) as { key: string; value: string | null }[];
      setCustomMat(parseArray<Material>(filas.find((f) => f.key === KEY_MATERIALES)?.value));
      setCustomRec(parseArray<Receta>(filas.find((f) => f.key === KEY_RECETAS)?.value));
      setReady(true);
    })();
    return () => { vivo = false; };
  }, []);

  const materiales = useMemo(() => mezclarMateriales(customMat), [customMat]);
  const recetas = useMemo(() => mezclarRecetas(customRec), [customRec]);

  // Escribe el array entero: `app_config` guarda JSON en una columna de texto y
  // no admite parches parciales, así que toda mutación es read-modify-write
  // sobre lo que ya tenemos en memoria.
  const persistir = useCallback(async (key: string, valor: unknown[]) => {
    if (!supabaseConfigured) return;
    const { error: e } = await createClient()
      .from("app_config")
      .upsert({ key, value: JSON.stringify(valor), updated_at: new Date().toISOString() });
    // El estado local ya se ha movido (optimista). Si la escritura falla se
    // NOMBRA en vez de revertir en silencio: revertir dejaría al DM viendo
    // desaparecer lo que acaba de escribir sin saber por qué.
    setError(e?.message ?? null);
  }, []);

  const guardarMaterial = useCallback(async (m: Material) => {
    const siguiente = [...customMat.filter((x) => claveMaterial(x) !== claveMaterial(m)), m];
    setCustomMat(siguiente);
    await persistir(KEY_MATERIALES, siguiente);
  }, [customMat, persistir]);

  const borrarMaterial = useCallback(async (m: { oficio: Oficio; n: number }) => {
    const siguiente = customMat.filter((x) => claveMaterial(x) !== claveMaterial(m));
    setCustomMat(siguiente);
    await persistir(KEY_MATERIALES, siguiente);
  }, [customMat, persistir]);

  const guardarReceta = useCallback(async (r: Receta) => {
    const siguiente = [...customRec.filter((x) => x.slug !== r.slug), r];
    setCustomRec(siguiente);
    await persistir(KEY_RECETAS, siguiente);
  }, [customRec, persistir]);

  const borrarReceta = useCallback(async (slug: string) => {
    const siguiente = customRec.filter((x) => x.slug !== slug);
    setCustomRec(siguiente);
    await persistir(KEY_RECETAS, siguiente);
  }, [customRec, persistir]);

  return { materiales, recetas, ready, error, guardarMaterial, borrarMaterial, guardarReceta, borrarReceta };
}
