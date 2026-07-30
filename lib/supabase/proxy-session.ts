import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_URL, SUPABASE_PUBLIC_KEY } from "@/lib/supabase/env";
import { puedeVer, RUTA_CERRADA } from "@/lib/acceso";

// Refresca la sesión de Supabase en cada request y protege rutas privadas.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = SUPABASE_URL;
  const key = SUPABASE_PUBLIC_KEY;
  // Sin credenciales: no hacemos nada (la app degrada con avisos).
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  // `/api/` y `/_next/` con barra: sin ella, una página futura llamada
  // `app/apiario/` se saltaría la puerta entera. La última alternativa deja
  // pasar los ficheros de `public/` que el `matcher` de proxy.ts no excluye
  // por extensión (un .woff2, un robots.txt): si no, al jugador se le serviría
  // el HTML de /cerrado en vez del fichero.
  const isPublic =
    path === "/login" ||
    path === "/api" ||
    path.startsWith("/api/") ||
    path.startsWith("/_next/") ||
    path === "/favicon.ico" ||
    /\.[a-z0-9]+$/i.test(path);

  // No autenticado en ruta privada -> a /login
  if (!user && !isPublic) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/login";
    return NextResponse.redirect(redirect);
  }
  // Autenticado visitando /login -> al inicio
  if (user && path === "/login") {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/";
    return NextResponse.redirect(redirect);
  }

  // Puerta por rol. El orden importa por coste: las rutas del jugador pasan
  // sin consultar `profiles`, así que el camino habitual no paga ningún
  // round-trip extra. Solo las rutas cerradas consultan el rol.
  if (user && !isPublic && !puedeVer("player", path)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role !== "dm") {
      const cerrado = request.nextUrl.clone();
      cerrado.pathname = RUTA_CERRADA;
      // `rewrite` conserva la URL escrita y no ensucia el historial. Hay que
      // arrastrar las cookies que `setAll` puso en `response`: a diferencia de
      // un redirect, el rewrite no vuelve a pasar por el proxy, así que si se
      // pierden la sesión refrescada se tira.
      const res = NextResponse.rewrite(cerrado);
      response.cookies.getAll().forEach((c) => res.cookies.set(c));
      return res;
    }
  }

  return response;
}
