"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import { conCadaver, sinCadaver, gastarPiezaDe, type Cadaver } from "@/lib/extraccion";

// La lista de cadáveres despiezables que el DM mantiene a mano.
//
// ⚠️ **Requisito del DM, y manda sobre lo demás: la mesa no siempre pasa por la
// app.** Muchos combates se juegan en la mesa y `/combate` no se entera, así que
// NO vale con que los cadáveres aparezcan solos al derrotar un monstruo. El DM
// tiene que poder escribir «aquí hay un tal cosa recién muerto», quitarlo, y que
// los jugadores del sitio lo vean.
//
// ⚠️ **`app_config` NO está en la publicación `supabase_realtime`.** Una
// suscripción `postgres_changes` sobre esta tabla **no dispara nunca**. Es la
// trampa que ya mordió cuatro veces —la última con el bestiario el 2026-08-01, y
// era un fallo de cara al usuario, no teoría: el DM añadía algo y no lo veía
// hasta recargar—. Por eso aquí **no hay suscripción** y toda mutación es
// OPTIMISTA: se pinta en local al instante y se persiste en paralelo.
//
// Las reglas de qué le pasa a la lista viven en `lib/extraccion.ts`, que es
// neutro y lo mira `scripts/check-despiece.ts`. Aquí solo se va y se viene de la
// base de datos: una regla escrita en este fichero no la miraría ningún gate.

const KEY = "cadaveres";

function parse(value: string | null | undefined): Cadaver[] {
  if (!value) return [];
  try {
    const v = JSON.parse(value);
    return Array.isArray(v) ? (v as Cadaver[]) : [];
  } catch {
    // Un JSON roto se lee como lista vacía y NO revienta la pantalla: el
    // despiece es opcional, y tirar `/lugar` entera por un campo mal escrito
    // sería mucho peor que quedarse sin cadáveres.
    return [];
  }
}

export type Cadaveres = {
  cadaveres: Cadaver[];
  ready: boolean;
  error: string | null;
  añadir: (c: Omit<Cadaver, "id">) => Promise<void>;
  quitar: (id: string) => Promise<void>;
  /** Gasta una pieza. Si llega a cero, el cadáver desaparece de la lista. */
  gastar: (id: string) => Promise<void>;
};

export function useCadaveres(): Cadaveres {
  const [cadaveres, setCadaveres] = useState<Cadaver[]>([]);
  const [ready, setReady] = useState(() => !supabaseConfigured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabaseConfigured) return;
    let vivo = true;
    (async () => {
      const { data } = await createClient()
        .from("app_config").select("value").eq("key", KEY).maybeSingle();
      if (!vivo) return;
      setCadaveres(parse((data as { value: string | null } | null)?.value));
      setReady(true);
    })();
    return () => { vivo = false; };
  }, []);

  // Escribe el array entero: `app_config` guarda JSON en texto y no admite
  // parches parciales, así que toda mutación es read-modify-write sobre lo que
  // ya tenemos en memoria.
  const persistir = useCallback(async (lista: Cadaver[]) => {
    if (!supabaseConfigured) return;
    const { error: e } = await createClient()
      .from("app_config")
      .upsert({ key: KEY, value: JSON.stringify(lista), updated_at: new Date().toISOString() });
    // El estado local ya se movió. Si la escritura falla se NOMBRA en vez de
    // revertir en silencio: revertir dejaría al DM viendo desaparecer lo que
    // acaba de escribir sin saber por qué.
    setError(e?.message ?? null);
  }, []);

  const añadir = useCallback(async (c: Omit<Cadaver, "id">) => {
    // El id se compone aquí y no en la base: `app_config` es un blob JSON, no
    // hay secuencia que pedir. Hora + azar basta para que dos cadáveres del
    // mismo bicho en el mismo sitio no colisionen.
    const nuevo: Cadaver = { ...c, id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}` };
    let siguiente: Cadaver[] = [];
    setCadaveres((prev) => (siguiente = conCadaver(prev, nuevo)));
    await persistir(siguiente);
  }, [persistir]);

  const quitar = useCallback(async (id: string) => {
    let siguiente: Cadaver[] = [];
    setCadaveres((prev) => (siguiente = sinCadaver(prev, id)));
    await persistir(siguiente);
  }, [persistir]);

  const gastar = useCallback(async (id: string) => {
    let siguiente: Cadaver[] = [];
    setCadaveres((prev) => (siguiente = gastarPiezaDe(prev, id)));
    await persistir(siguiente);
  }, [persistir]);

  return { cadaveres, ready, error, añadir, quitar, gastar };
}
