"use client";

import { useEffect, useState } from "react";
import { loadActiveCharacter, tienePersonaje } from "@/lib/character";

/**
 * ¿Tiene este jugador una ficha hecha? Lo preguntan la barra, la portada y el
 * propio asistente para dejar de ofrecer «Crear personaje» cuando ya no toca.
 *
 * **La consulta se comparte entre todos los que preguntan.** La barra está en el
 * layout, así que sin esto habría un viaje a Supabase por componente y por
 * navegación. La promesa se guarda por usuario y se reutiliza.
 *
 * `listo` empieza en `false` y **mientras tanto se asume que NO hay ficha**: es
 * el lado seguro para esconder. Al revés, «Crear» parpadearía y desaparecería en
 * cada carga, que se lee como un fallo.
 */
const cache = new Map<string, Promise<boolean>>();

/** Olvida lo que se sabía de este usuario: se acaba de crear o archivar ficha. */
export function olvidarPersonaje(userId: string | null): void {
  if (userId) cache.delete(userId);
}

export function usePersonajeActivo(userId: string | null): { tiene: boolean; listo: boolean } {
  const [estado, setEstado] = useState<{ tiene: boolean; listo: boolean }>({ tiene: false, listo: false });

  useEffect(() => {
    if (!userId) { setEstado({ tiene: false, listo: true }); return; }
    let vivo = true;
    let p = cache.get(userId);
    if (!p) {
      p = loadActiveCharacter(userId).then((row) => tienePersonaje(row));
      cache.set(userId, p);
    }
    p.then((tiene) => { if (vivo) setEstado({ tiene, listo: true }); });
    return () => { vivo = false; };
  }, [userId]);

  return estado;
}
