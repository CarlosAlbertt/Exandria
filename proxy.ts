import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy-session";

// Next 16: el antiguo "middleware" se llama ahora "proxy".
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // `dice-box` excluido: son assets públicos de @3d-dice/dice-box (.json/.wasm/
  // texturas) que no deben pasar por el auth-proxy (si no, se redirigen a
  // /login sin sesión y añaden un round-trip de auth innecesario con sesión).
  matcher: ["/((?!_next/static|_next/image|favicon.ico|dice-box|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
