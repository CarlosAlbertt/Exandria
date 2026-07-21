// Resolución PURA de qué sabe un personaje. Sin React ni Supabase: entra el
// contexto del PJ, sale si conoce una entrada. Mismo espíritu que lib/derive.ts.

import type { SaberEntry } from "@/data/saber";

export type SaberCtx = {
  isDm: boolean;
  originContinent: string | null;
  originRegion: string | null;   // slug de subregión (solo Tal'Dorei)
  deity: string | null;          // slug de pantheon
  cls: string | null;            // slug de clase (para el saber del panteón)
  skills: string[];              // pericias del PJ
  unlocked: string[];            // ids aprendidos por ESTE personaje
  revealed: string[];            // ids de secretos que el DM ha revelado
};

export const EMPTY_CTX: SaberCtx = {
  isDm: false, originContinent: null, originRegion: null, deity: null, cls: null,
  skills: [], unlocked: [], revealed: [],
};

// Quién conoce el panteón. Los dioses existen para todos, pero saber de ellos
// es oficio: los primarios los estudian las clases de fe; los Traidores y los
// Ídolos Menores, solo las más versadas (y el brujo, que trata con patrones).
const PANTEON_PRIME = ["clerigo", "paladin", "druida"];
const PANTEON_TRAIDOR = ["clerigo", "paladin"];
const PANTEON_IDOLO = ["clerigo", "paladin", "brujo"];

function conoceElPanteon(cls: string | null, side: "prime" | "betrayer" | "idol"): boolean {
  if (!cls) return false;
  if (side === "prime") return PANTEON_PRIME.includes(cls);
  if (side === "betrayer") return PANTEON_TRAIDOR.includes(cls);
  return PANTEON_IDOLO.includes(cls);
}

// ¿Conoce el personaje esta entrada?
//
// Reglas (en orden):
//  - el DM lo ve todo;
//  - lo APRENDIDO (unlocked) abre cualquier entrada — es la puerta común de las
//    cuatro vías de descubrimiento (tomos, misiones, DM a mano, tirada in situ);
//  - lo REVELADO (revealed) también abre cualquier entrada — es el DM poniendo
//    a la vista de todo el grupo una entrada suelta o una categoría entera;
//  - continente básico: lo sabe cualquiera ("un poco de los continentes");
//  - continente profundo: solo si es TU continente;
//  - región: solo si es TU subregión;
//  - deidad: solo si es TU deidad;
//  - erudito: si tienes la pericia (esta vía convive con el origen);
//  - secreto: solo si el DM lo ha revelado (cubierto arriba por `revealed`).
export function knows(entry: SaberEntry, ctx: SaberCtx): boolean {
  if (ctx.isDm) return true;
  if (ctx.unlocked.includes(entry.id)) return true;
  // Lo que el DM ha puesto a la vista del grupo abre CUALQUIER entrada, no solo
  // los secretos: es lo que permite revelar una categoría entera de golpe.
  if (ctx.revealed.includes(entry.id)) return true;

  switch (entry.scope.kind) {
    case "continente":
      if (entry.depth === "basico") return true;
      return ctx.originContinent === entry.scope.continent;
    case "region":
      return ctx.originRegion === entry.scope.regionSlug;
    case "deidad":
      // Tu deidad siempre; del resto, solo quien tiene el oficio.
      return ctx.deity === entry.scope.deitySlug || conoceElPanteon(ctx.cls, entry.scope.side);
    case "erudito":
      return ctx.skills.includes(entry.scope.skill);
    case "secreto":
      // Inalcanzable por la vía normal: `revealed` ya se comprueba arriba para
      // CUALQUIER entrada. Se deja explícito por si alguien reordena las
      // comprobaciones de más arriba y esta vuelve a ser necesaria.
      return ctx.revealed.includes(entry.id);
    case "oculto":
      return false; // solo por descubrimiento (ya cubierto por `unlocked` arriba)
  }
}

// ¿Debe siquiera LISTARSE la entrada?
//
// NO se listan las que no se conocen: un candado con el título puesto ya
// spoilea (ver "La Garra Carmesí" en una tarjeta bloqueada revela que la
// facción existe). El jugador ve lo que sabe y un CONTADOR de lo que le falta;
// el DM lo ve todo.
export function isListed(entry: SaberEntry, ctx: SaberCtx): boolean {
  return ctx.isDm || knows(entry, ctx);
}

// Motivo del candado, para explicar al jugador qué le falta.
export function lockReason(entry: SaberEntry): string {
  switch (entry.scope.kind) {
    case "continente": return "Tierras que no son la tuya: se aprende viajando o leyendo.";
    case "region": return "No es tu tierra: alguien de allí, un tomo o un viaje te lo dirá.";
    case "deidad": return "No es tu fe: los templos y los tratados guardan estas cosas.";
    case "erudito": return `Conocimiento erudito · requiere ${entry.scope.skill}`;
    case "secreto": return "Aún por descubrir.";
    case "oculto": return "Solo se aprende jugando: tomos, misiones o quien lo sepa.";
  }
}
