"use client";
import { useEffect, useMemo, useState } from "react";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import { useAtlas, regionsOf, poisOf } from "@/lib/useAtlas";
import { construirNodos, type Nodo, type NodosOverride } from "@/data/lugares";
import { POI_ICON } from "@/data/pois";
import { CONTINENTS } from "@/data/world";

const KEY = "lugares_override";

export async function saveLugares(ov: NodosOverride) {
  if (!supabaseConfigured) return;
  await createClient().from("app_config").upsert({ key: KEY, value: JSON.stringify(ov), updated_at: new Date().toISOString() });
}

/**
 * El grafo de sitios: semilla del código + lo que el DM haya cambiado encima.
 *
 * Calcado de `useTownMaps`, y por la misma razón: **el DM tiene que poder
 * añadir una herrería o pegar una imagen sin que nadie despliegue**. Es la
 * lección de las tiendas — «para que existiera una pescadería había que
 * desplegar».
 *
 * ⚠️ `app_config` **NO está en la publicación realtime**, lección pagada cinco
 * veces ya. Aquí no hay suscripción a propósito: se carga una vez y `saveLugares`
 * hace el update optimista desde el panel del DM. Los jugadores lo verán al
 * entrar, que es cuando importa — nadie edita el mapa a mitad de escena.
 */
export function useLugares() {
  const { atlas } = useAtlas();
  const [override, setOverride] = useState<NodosOverride>({});
  const [ready, setReady] = useState(!supabaseConfigured);

  useEffect(() => {
    if (!supabaseConfigured) return;
    let mounted = true;
    void createClient().from("app_config").select("value").eq("key", KEY).maybeSingle()
      .then(({ data }) => {
        if (!mounted) return;
        try { setOverride(data?.value ? (JSON.parse(data.value as string) as NodosOverride) : {}); }
        catch { setOverride({}); }
        setReady(true);
      });
    return () => { mounted = false; };
  }, []);

  // Los POI salen del ATLAS y no de una lista propia: escribirlos otra vez aquí
  // sería una segunda fuente que se desincroniza del mapa en cuanto el DM
  // añada un pueblo. Es el fallo que ya tuvo `regionEntries()`.
  const nodos: Nodo[] = useMemo(() => {
    const pois: { name: string; blurb: string; icono: string }[] = [];
    for (const cont of CONTINENTS) {
      for (const r of regionsOf(atlas, cont)) {
        for (const p of poisOf(atlas, cont, r.slug)) {
          pois.push({ name: p.name, blurb: p.blurb, icono: POI_ICON[p.type] ?? "fa-location-dot" });
        }
      }
    }
    return construirNodos(pois, override);
  }, [atlas, override]);

  return { nodos, override, ready, setOverride };
}
