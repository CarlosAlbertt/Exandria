import { createClient } from "@/lib/supabase/server";

export type Role = "dm" | "player";
export type SessionProfile = { id: string; username: string; role: Role };

export const isConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Perfil + rol del usuario autenticado, o null. Seguro si falta config.
export async function getSessionProfile(): Promise<SessionProfile | null> {
  if (!isConfigured) return null;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile } = await supabase
      .from("profiles")
      .select("username, role")
      .eq("id", user.id)
      .single();
    return {
      id: user.id,
      username: profile?.username ?? user.email?.split("@")[0] ?? "jugador",
      role: (profile?.role as Role) ?? "player",
    };
  } catch {
    return null;
  }
}
