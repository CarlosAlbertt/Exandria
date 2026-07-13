"use client";

import { useEffect, useState } from "react";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import { ALL_MONSTERS, type Monster } from "@/data/bestiary";
import { CR_XP } from "@/data/encounters";

// Bestiario: monstruos estáticos (data/bestiary, extraídos del manual) +
// monstruos personalizados del DM, guardados en app_config sin migración de
// esquema (mismo patrón que useAtlas/useDmStash). Dos claves independientes:
// "custom_monsters" (Monster[] completo, JSON) y "bestiary_discovered"
// (string[] de slugs visibles para jugadores). El hook no sabe ni le importa
// cuántos monstruos estáticos hay (124 hoy, más lotes después): siempre
// arranca de ALL_MONSTERS y superpone los personalizados por slug.

export type CustomMonster = Monster & { custom: true };

const KEY_CUSTOM = "custom_monsters";
const KEY_DISCOVERED = "bestiary_discovered";

function parseCustoms(value: string | null | undefined): Monster[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as Monster[]) : [];
  } catch {
    return [];
  }
}

function parseDiscovered(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

// Mezcla: parte de ALL_MONSTERS y superpone los personalizados por slug (un
// personalizado con el mismo slug que un estático lo sustituye; uno nuevo se
// añade). Orden alfabético por nombre ES.
function mergeMonsters(customs: Monster[]): Monster[] {
  const bySlug = new Map<string, Monster>();
  for (const m of ALL_MONSTERS) bySlug.set(m.slug, m);
  for (const c of customs) bySlug.set(c.slug, { ...c, custom: true } as CustomMonster);
  return [...bySlug.values()].sort((a, b) => a.name.localeCompare(b.name, "es"));
}

export function useBestiary(): { monsters: Monster[]; discovered: Set<string>; ready: boolean } {
  // Sin Supabase configurado, los monstruos estáticos se conocen desde el
  // primer render (inicializador perezoso de useState, no un efecto).
  const [monsters, setMonsters] = useState<Monster[]>(() => mergeMonsters([]));
  const [discovered, setDiscovered] = useState<Set<string>>(() => new Set());
  const [ready, setReady] = useState(() => !supabaseConfigured);

  useEffect(() => {
    if (!supabaseConfigured) return;
    const supabase = createClient();
    let mounted = true;

    const loadCustoms = () =>
      supabase
        .from("app_config")
        .select("value")
        .eq("key", KEY_CUSTOM)
        .maybeSingle()
        .then(({ data }) => { if (mounted) setMonsters(mergeMonsters(parseCustoms(data?.value))); });

    const loadDiscovered = () =>
      supabase
        .from("app_config")
        .select("value")
        .eq("key", KEY_DISCOVERED)
        .maybeSingle()
        .then(({ data }) => { if (mounted) setDiscovered(new Set(parseDiscovered(data?.value))); });

    Promise.all([loadCustoms(), loadDiscovered()]).then(() => { if (mounted) setReady(true); });

    const ch = supabase
      .channel(`bestiary_rt_${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "app_config", filter: `key=eq.${KEY_CUSTOM}` }, () => loadCustoms())
      .on("postgres_changes", { event: "*", schema: "public", table: "app_config", filter: `key=eq.${KEY_DISCOVERED}` }, () => loadDiscovered())
      .subscribe();

    return () => { mounted = false; supabase.removeChannel(ch); };
  }, []);

  return { monsters, discovered, ready };
}

/* ------------------------------ Mutaciones ------------------------------ */
/* Solo el DM puede escribir (RLS de app_config); estas funciones no */
/* comprueban rol, se limitan a leer/actualizar y devolver { error }. */

// Inserta o sustituye (por slug) un monstruo personalizado. Lee la fila
// actual primero (read-modify-write): app_config no soporta parches parciales
// de un JSON, así que hay que traer el array completo antes de reescribirlo.
export async function saveCustomMonster(m: Monster): Promise<{ error: string | null }> {
  if (!supabaseConfigured) return { error: "Supabase no configurado" };
  const supabase = createClient();
  const { data, error: readError } = await supabase.from("app_config").select("value").eq("key", KEY_CUSTOM).maybeSingle();
  if (readError) return { error: readError.message };
  const customs = parseCustoms(data?.value);
  const idx = customs.findIndex((c) => c.slug === m.slug);
  if (idx >= 0) customs[idx] = m;
  else customs.push(m);
  const { error } = await supabase
    .from("app_config")
    .upsert({ key: KEY_CUSTOM, value: JSON.stringify(customs), updated_at: new Date().toISOString() });
  return { error: error?.message ?? null };
}

export async function deleteCustomMonster(slug: string): Promise<{ error: string | null }> {
  if (!supabaseConfigured) return { error: "Supabase no configurado" };
  const supabase = createClient();
  const { data, error: readError } = await supabase.from("app_config").select("value").eq("key", KEY_CUSTOM).maybeSingle();
  if (readError) return { error: readError.message };
  const customs = parseCustoms(data?.value).filter((c) => c.slug !== slug);
  const { error } = await supabase
    .from("app_config")
    .upsert({ key: KEY_CUSTOM, value: JSON.stringify(customs), updated_at: new Date().toISOString() });
  return { error: error?.message ?? null };
}

// Marca (o desmarca) un slug como descubierto por los jugadores. Igual
// read-modify-write que saveCustomMonster, sobre el array de slugs.
export async function setDiscovered(slug: string, on: boolean): Promise<{ error: string | null }> {
  if (!supabaseConfigured) return { error: "Supabase no configurado" };
  const supabase = createClient();
  const { data, error: readError } = await supabase.from("app_config").select("value").eq("key", KEY_DISCOVERED).maybeSingle();
  if (readError) return { error: readError.message };
  const slugs = new Set(parseDiscovered(data?.value));
  if (on) slugs.add(slug);
  else slugs.delete(slug);
  const { error } = await supabase
    .from("app_config")
    .upsert({ key: KEY_DISCOVERED, value: JSON.stringify([...slugs]), updated_at: new Date().toISOString() });
  return { error: error?.message ?? null };
}

/* -------------------------------- CR / BC -------------------------------- */

// Bonificador de Competencia por tramo de CR (D&D 2024). Las fracciones
// ("1/8", "1/4", "1/2") cuentan como CR 0-4.
export function pbForCr(cr: string): number {
  const n = cr.includes("/") ? 0 : Number(cr);
  if (n <= 4) return 2;
  if (n <= 8) return 3;
  if (n <= 12) return 4;
  if (n <= 16) return 5;
  if (n <= 20) return 6;
  if (n <= 24) return 7;
  if (n <= 28) return 8;
  return 9;
}

// Opciones de CR para selects (DM), derivadas de CR_XP para no duplicar la
// lista ni desincronizarse si esta cambia.
export const CR_OPTIONS: string[] = CR_XP.map((c) => c.cr);
