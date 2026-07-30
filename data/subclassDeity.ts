// Subclases que implican una fe concreta de Exandria. Si el jugador elige una
// de estas, la deidad del personaje queda PREDEFINIDA (se puede cambiar luego
// en el paso de Trasfondo): no tiene sentido ser un Alma del Luxon sin venerar
// al Luxon, ni un Invocador de Ecos ajeno a la Matriarca de Cuervos.
//
// La clave es el nombre EXACTO de la subclase en data/classes.ts; el valor, el
// slug de data/pantheon.ts. Solo se mapea lo que la propia mecánica o el saber
// de la subclase nombra de forma explícita — las que solo CAZAN a los fieles de
// un dios (p. ej. el Cazador de Malicia contra Lolth) no se mapean.
import { ALL_DEITIES } from "@/data/saber";

export const SUBCLASS_DEITY: Record<string, string> = {
  // Dunamancia y las balizas del Luxon (Dinastía Kryn)
  "Alma del Luxon": "luxon",
  "Juramento de la Luz Primigenia": "luxon",
  // La Matriarca de Cuervos: muerte, destino y almas
  "Tradición del Invocador de Ecos (Nigromante)": "reina-de-los-cuervos",
  "Camino del Hilo del Destino": "reina-de-los-cuervos",
  // El Forjador (All-Hammer) de Kraghammer
  "Dominio de la Forja Ancestral": "moradin",
  // Fuego solar contra los muertos vivientes
  "Juramento del Alba": "pelor",
  // Pactos con entidades concretas
  "Patrón del Leviatán Sellado": "ukotoa",
  "Patrón de la Tejedora": "lolth",
  // Artagan, el archifey de la Expansión Verdante
  "Alma Feérica": "el-viajero",
  // El clima extremo de los Ashari, guardianes de lo primigenio
  "Círculo de la Tormenta Primigenia": "melora",
};

/** Slug de deidad que impone una subclase, o null si es de fe libre. */
export function deityForSubclass(subclase: string | null): string | null {
  if (!subclase) return null;
  return SUBCLASS_DEITY[subclase] ?? null;
}

/** Nombre y epíteto de esa deidad, para enseñarlo al jugador. */
export function deityLabel(slug: string | null): string | null {
  if (!slug) return null;
  const d = ALL_DEITIES.find((x) => x.slug === slug);
  return d ? `${d.name} · ${d.epithet}` : null;
}
