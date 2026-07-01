// Credenciales públicas de Supabase. Acepta tanto el nombre nuevo (publishable)
// como el clásico (anon) para la clave de cliente — Supabase renombró "anon"
// a "publishable" en el panel.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  "";
export const SUPABASE_CONFIGURED = !!SUPABASE_URL && !!SUPABASE_PUBLIC_KEY;
