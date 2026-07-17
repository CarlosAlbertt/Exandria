// Reglas de archivado, puras: sin React ni Supabase, para poder verificarlas
// con scripts/check-archive.ts. La BD las vuelve a garantizar por su cuenta
// (índice único parcial + triggers); esto es para que la UI sepa qué ofrecer y
// no deje al jugador chocar contra un error de Postgres.

// Un jugador tiene como mucho 3 personajes: 1 activo + 2 archivados.
export const MAX_CHARACTERS = 3;

// Lo mínimo para decidir: `archived_at` null = en juego.
export type CharSlot = { id: string; archived_at: string | null };

// Genéricas en `T`: quien llame con filas más ricas (nombre, clase, nivel —
// como `listCharacters`) recupera ESAS filas, no un CharSlot pelado. Sin esto,
// la UI tendría que hacer casts para pintar el nombre de un archivado.

// El personaje en juego, o null. La BD garantiza que hay como mucho uno
// (índice único parcial sobre user_id where archived_at is null).
export function activeOf<T extends CharSlot>(chars: T[]): T | null {
  return chars.find((c) => c.archived_at === null) ?? null;
}

export function archivedOf<T extends CharSlot>(chars: T[]): T[] {
  return chars.filter((c) => c.archived_at !== null);
}

// ¿Se puede crear uno nuevo? Solo si NO hay activo (porque /crear EDITA el
// activo cuando lo hay: para hacerte otro, primero archivas) y queda hueco.
export function canCreate(chars: CharSlot[]): boolean {
  return activeOf(chars) === null && chars.length < MAX_CHARACTERS;
}

// ¿Puede el DM devolver uno a juego? Solo si el jugador no tiene ya un activo:
// si lo tiene, el insert chocaría contra el índice único parcial. La UI del DM
// debe ofrecer archivar el activo primero en vez de dejar que reviente.
export function canRestore(chars: CharSlot[]): boolean {
  return activeOf(chars) === null;
}
