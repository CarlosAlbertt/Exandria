// Resolución PURA de qué sabe un personaje. Sin React ni Supabase: entra el
// contexto del PJ, sale si conoce una entrada. Mismo espíritu que lib/derive.ts.

import type { SaberEntry } from "@/data/saber";

export type SaberCtx = {
  isDm: boolean;
  originContinent: string | null;
  originRegion: string | null;   // slug de subregión (solo Tal'Dorei)
  deity: string | null;          // slug de pantheon
  skills: string[];              // pericias del PJ
  unlocked: string[];            // ids aprendidos por ESTE personaje
  revealed: string[];            // ids de secretos que el DM ha revelado
};

export const EMPTY_CTX: SaberCtx = {
  isDm: false, originContinent: null, originRegion: null, deity: null,
  skills: [], unlocked: [], revealed: [],
};

// ¿Conoce el personaje esta entrada?
//
// Reglas (en orden):
//  - el DM lo ve todo;
//  - lo APRENDIDO (unlocked) abre cualquier entrada — es la puerta común de las
//    cuatro vías de descubrimiento (tomos, misiones, DM a mano, tirada in situ);
//  - continente básico: lo sabe cualquiera ("un poco de los continentes");
//  - continente profundo: solo si es TU continente;
//  - región: solo si es TU subregión;
//  - deidad: solo si es TU deidad;
//  - erudito: si tienes la pericia (esta vía convive con el origen);
//  - secreto: solo si el DM lo ha revelado.
export function knows(entry: SaberEntry, ctx: SaberCtx): boolean {
  if (ctx.isDm) return true;
  if (ctx.unlocked.includes(entry.id)) return true;

  switch (entry.scope.kind) {
    case "continente":
      if (entry.depth === "basico") return true;
      return ctx.originContinent === entry.scope.continent;
    case "region":
      return ctx.originRegion === entry.scope.regionSlug;
    case "deidad":
      return ctx.deity === entry.scope.deitySlug;
    case "erudito":
      return ctx.skills.includes(entry.scope.skill);
    case "secreto":
      return ctx.revealed.includes(entry.id);
  }
}

// ¿Debe siquiera LISTARSE la entrada (aunque sea bloqueada)?
// Los secretos no revelados no se insinúan a los jugadores: ni su título. El
// resto sí se muestra con candado, para que se vea que hay mundo por descubrir.
export function isListed(entry: SaberEntry, ctx: SaberCtx): boolean {
  if (ctx.isDm) return true;
  if (entry.scope.kind === "secreto") return knows(entry, ctx);
  return true;
}

// Motivo del candado, para explicar al jugador qué le falta.
export function lockReason(entry: SaberEntry): string {
  switch (entry.scope.kind) {
    case "continente": return "Tierras que no son la tuya: se aprende viajando o leyendo.";
    case "region": return "No es tu tierra: alguien de allí, un tomo o un viaje te lo dirá.";
    case "deidad": return "No es tu fe: los templos y los tratados guardan estas cosas.";
    case "erudito": return `Conocimiento erudito · requiere ${entry.scope.skill}`;
    case "secreto": return "Aún por descubrir.";
  }
}
