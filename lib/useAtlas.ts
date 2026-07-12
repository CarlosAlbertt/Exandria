"use client";

import { useEffect, useState } from "react";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import { seedAtlas, type AtlasDefs } from "@/data/atlas";
import type { Region } from "@/data/taldorei";
import type { Poi } from "@/data/pois";

// Definiciones EDITABLES del atlas (regiones + POIs de los 5 continentes) en
// app_config (JSON), sin migración de esquema. Generaliza useTaldorei: la
// posición/known/explored de regiones sigue en region_state y la de POIs
// (posición/revelado) en poi_state, indexados por slug (único globalmente).
const KEY = "atlas_defs";
// Clave antigua de Tal'Dorei en solitario: si el usuario ya tenía ediciones
// ahí y todavía no existe atlas_defs, se leen una vez para no perderlas.
const OLD_TALDOREI_KEY = "taldorei_defs";

type TaldoreiOverride = { regions: Region[]; pois: Record<string, Poi[]> };

function parseAtlas(value: string | null | undefined): AtlasDefs | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as AtlasDefs;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function parseTaldoreiOverride(value: string | null | undefined): TaldoreiOverride | undefined {
  if (!value) return undefined;
  try {
    const d = JSON.parse(value) as TaldoreiOverride;
    return d && Array.isArray(d.regions) && d.pois ? d : undefined;
  } catch {
    return undefined;
  }
}

export function useAtlas() {
  // Sin Supabase configurado, el atlas sembrado se conoce desde el primer
  // render (inicializador perezoso de useState, no un efecto).
  const [atlas, setAtlas] = useState<AtlasDefs>(() => (!supabaseConfigured ? seedAtlas() : ({} as AtlasDefs)));
  const [ready, setReady] = useState(() => !supabaseConfigured);

  useEffect(() => {
    if (!supabaseConfigured) return;
    const supabase = createClient();
    let mounted = true;

    const load = async () => {
      const { data } = await supabase.from("app_config").select("value").eq("key", KEY).maybeSingle();
      if (!mounted) return;
      const parsed = parseAtlas(data?.value);
      if (parsed) {
        setAtlas(parsed);
        setReady(true);
        return;
      }

      // No existe atlas_defs todavía: sembrar, intentando preservar los
      // taldorei_defs viejos si el usuario ya había editado Tal'Dorei.
      const { data: old } = await supabase.from("app_config").select("value").eq("key", OLD_TALDOREI_KEY).maybeSingle();
      if (!mounted) return;
      const override = parseTaldoreiOverride(old?.value);
      const seeded = seedAtlas(override);
      setAtlas(seeded);
      setReady(true);
      void persist(seeded);
    };
    load();

    const ch = supabase
      .channel(`atlas_rt_${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "app_config", filter: `key=eq.${KEY}` }, () => load())
      .subscribe();

    return () => { mounted = false; supabase.removeChannel(ch); };
  }, []);

  // Guardado optimista (app_config no tiene Realtime local instantáneo para
  // quien escribe, así que sin esto el cambio "volvía" a su sitio) + upsert.
  const save = (next: AtlasDefs) => { setAtlas(next); void persist(next); };

  return { atlas, ready, save };
}

async function persist(d: AtlasDefs) {
  if (!supabaseConfigured) return;
  await createClient().from("app_config").upsert({ key: KEY, value: JSON.stringify(d), updated_at: new Date().toISOString() });
}

export function regionsOf(atlas: AtlasDefs, cont: string): Region[] {
  return atlas[cont]?.regions ?? [];
}

export function poisOf(atlas: AtlasDefs, cont: string, slug: string): Poi[] {
  return atlas[cont]?.pois[slug] ?? [];
}
