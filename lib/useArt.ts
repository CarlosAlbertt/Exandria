"use client";
import { useEffect, useState } from "react";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";

export type ArtKind = "species" | "lineage" | "class";
type ArtMap = Record<string, string>; // clave "<kind>/<slug>" -> url
const KEY = "art_overrides";

export async function saveArt(map: ArtMap) {
  if (!supabaseConfigured) return;
  await createClient().from("app_config").upsert({ key: KEY, value: JSON.stringify(map), updated_at: new Date().toISOString() });
}

export function useArt() {
  const [map, setMap] = useState<ArtMap>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!supabaseConfigured) { setReady(true); return; }
    const supabase = createClient();
    let mounted = true;
    const load = async () => {
      const { data } = await supabase.from("app_config").select("value").eq("key", KEY).maybeSingle();
      if (!mounted) return;
      try { setMap(data?.value ? (JSON.parse(data.value as string) as ArtMap) : {}); } catch { setMap({}); }
      setReady(true);
    };
    load();
    const ch = supabase
      .channel(`art_rt_${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "app_config", filter: `key=eq.${KEY}` }, () => load())
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(ch); };
  }, []);

  // URL de Storage si existe; si no, el path local. PortraitFrame cae a icono.
  const artSrc = (kind: ArtKind, slug: string, localFallback?: string): string | undefined =>
    map[`${kind}/${slug}`] || localFallback;

  // Mutación OPTIMISTA: app_config no está en la publicación realtime, así que
  // la subscripción de arriba no dispara tras escribir. Actualizamos el estado
  // local al instante y persistimos; url vacía = borrar el override.
  const updateArt = (kind: ArtKind, slug: string, url: string) => {
    const key = `${kind}/${slug}`;
    setMap((prev) => {
      const next = { ...prev };
      if (url) next[key] = url; else delete next[key];
      void saveArt(next);
      return next;
    });
  };

  return { artSrc, map, ready, updateArt };
}
