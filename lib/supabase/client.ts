import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_URL, SUPABASE_PUBLIC_KEY, SUPABASE_CONFIGURED } from "@/lib/supabase/env";

// Cliente Supabase para componentes de cliente ("use client").
export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);
}

// ¿Hay credenciales configuradas? (para degradar con elegancia)
export const supabaseConfigured = SUPABASE_CONFIGURED;
