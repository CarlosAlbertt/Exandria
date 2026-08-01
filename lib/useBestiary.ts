"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import { ALL_MONSTERS, type Monster } from "@/data/bestiary";
import { CR_XP } from "@/data/encounters";

// Bestiario: monstruos estáticos (data/bestiary, extraídos del manual) +
// monstruos personalizados del DM, guardados en app_config sin migración de
// esquema. Dos claves independientes: "custom_monsters" (Monster[] completo,
// JSON) y "bestiary_discovered" (string[] de slugs visibles para jugadores). El
// hook no sabe ni le importa cuántos monstruos estáticos hay (124 hoy, más
// lotes después): siempre arranca de ALL_MONSTERS y superpone los
// personalizados por slug.
//
// ⚠️ **`app_config` NO está en la publicación realtime.** Aquí hubo una
// suscripción a `postgres_changes` sobre esas dos claves que **no entregaba
// nunca**, y como las mutaciones no tocaban el estado local, el DM añadía un
// monstruo y **no lo veía hasta recargar** — lo mismo al borrarlo y al marcarlo
// como descubierto, que es justo lo que hace que los jugadores lo vean. Se
// retiró la suscripción y las mutaciones pasaron a ser **optimistas**, como en
// `lib/useOficios.ts`. Es la misma lección por cuarta vez: si algo vive en
// `app_config`, se pinta en local y luego se persiste.

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
export function mergeMonsters(customs: Monster[]): Monster[] {
  const bySlug = new Map<string, Monster>();
  for (const m of ALL_MONSTERS) bySlug.set(m.slug, m);
  for (const c of customs) bySlug.set(c.slug, { ...c, custom: true } as CustomMonster);
  return [...bySlug.values()].sort((a, b) => a.name.localeCompare(b.name, "es"));
}

/* --------------------- Las mezclas, como capa pura --------------------- */
/* Se exportan para que `scripts/check-bestiary.ts` pueda comprobar que una */
/* mutación deja el array como debe, sin montar React ni Supabase.          */

/** Inserta o sustituye por slug. Devuelve un array nuevo. */
export function conMonstruo(customs: Monster[], m: Monster): Monster[] {
  const idx = customs.findIndex((c) => c.slug === m.slug);
  if (idx < 0) return [...customs, m];
  const next = [...customs];
  next[idx] = m;
  return next;
}

/** Quita por slug. Devuelve un array nuevo. */
export function sinMonstruo(customs: Monster[], slug: string): Monster[] {
  return customs.filter((c) => c.slug !== slug);
}

/** Marca o desmarca un slug como descubierto. Sin duplicados y sin mutar. */
export function conDescubierto(slugs: string[], slug: string, on: boolean): string[] {
  const set = new Set(slugs);
  if (on) set.add(slug);
  else set.delete(slug);
  return [...set];
}

export type Bestiary = {
  monsters: Monster[];
  discovered: Set<string>;
  ready: boolean;
  /**
   * Error del GUARDADO, que sí se sabe nombrar (Supabase devuelve el mensaje).
   * El de la carga no cabe aquí: no se distingue de «todavía no hay nada
   * guardado», y mentir sobre eso es peor que callar.
   */
  error: string | null;
  /**
   * Las tres mutaciones DEVUELVEN además el error, no solo lo dejan en `error`.
   * No es redundancia: quien marca un monstruo desde el combate compone su
   * propio aviso («añadido, pero no se pudo marcar…»), y con el error solo en
   * el estado del hook no podría distinguir su fallo del de otra pantalla.
   */
  guardarMonstruo: (m: Monster) => Promise<{ error: string | null }>;
  borrarMonstruo: (slug: string) => Promise<{ error: string | null }>;
  marcarDescubierto: (slug: string, on: boolean) => Promise<{ error: string | null }>;
};

export function useBestiary(): Bestiary {
  // Sin Supabase configurado, los monstruos estáticos se conocen desde el
  // primer render (inicializador perezoso de useState, no un efecto).
  const [customs, setCustoms] = useState<Monster[]>([]);
  const [discoveredSlugs, setDiscoveredSlugs] = useState<string[]>([]);
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
        .in("key", [KEY_CUSTOM, KEY_DISCOVERED]);
      if (!vivo) return;
      const filas = (data ?? []) as { key: string; value: string | null }[];
      setCustoms(parseCustoms(filas.find((f) => f.key === KEY_CUSTOM)?.value));
      setDiscoveredSlugs(parseDiscovered(filas.find((f) => f.key === KEY_DISCOVERED)?.value));
      setReady(true);
    })();
    return () => { vivo = false; };
  }, []);

  const monsters = useMemo(() => mergeMonsters(customs), [customs]);
  const discovered = useMemo(() => new Set(discoveredSlugs), [discoveredSlugs]);

  // Escribe el array entero: `app_config` guarda JSON en una columna de texto y
  // no admite parches parciales, así que toda mutación es read-modify-write
  // sobre lo que ya tenemos en memoria.
  const persistir = useCallback(async (key: string, valor: unknown[]): Promise<{ error: string | null }> => {
    if (!supabaseConfigured) return { error: "Supabase no configurado" };
    const { error: e } = await createClient()
      .from("app_config")
      .upsert({ key, value: JSON.stringify(valor), updated_at: new Date().toISOString() });
    // El estado local ya se ha movido (optimista). Si la escritura falla se
    // NOMBRA en vez de revertir en silencio: revertir dejaría al DM viendo
    // desaparecer lo que acaba de escribir sin saber por qué.
    const msg = e?.message ?? null;
    setError(msg);
    return { error: msg };
  }, []);

  const guardarMonstruo = useCallback(async (m: Monster) => {
    const siguiente = conMonstruo(customs, m);
    setCustoms(siguiente);
    return persistir(KEY_CUSTOM, siguiente);
  }, [customs, persistir]);

  const borrarMonstruo = useCallback(async (slug: string) => {
    const siguiente = sinMonstruo(customs, slug);
    setCustoms(siguiente);
    return persistir(KEY_CUSTOM, siguiente);
  }, [customs, persistir]);

  const marcarDescubierto = useCallback(async (slug: string, on: boolean) => {
    const siguiente = conDescubierto(discoveredSlugs, slug, on);
    setDiscoveredSlugs(siguiente);
    return persistir(KEY_DISCOVERED, siguiente);
  }, [discoveredSlugs, persistir]);

  return { monsters, discovered, ready, error, guardarMonstruo, borrarMonstruo, marcarDescubierto };
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
