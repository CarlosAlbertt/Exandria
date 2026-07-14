import type { Metadata } from "next";
import "./globals.css";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import EpicOverlay from "@/components/EpicOverlay";
import DiceBoard from "@/components/DiceBoard";
import ErrorBoundary from "@/components/ErrorBoundary";
import { SessionProvider } from "@/components/SessionProvider";
import { getSessionProfile, isConfigured } from "@/lib/auth";

export const metadata: Metadata = {
  title: {
    default: "Exandria — Compañero de Campaña",
    template: "%s · Exandria",
  },
  description:
    "Compañero de campaña multijugador para D&D en el mundo de Exandria: creador de personaje, lore, mapa y narración en vivo. Campaña ambientada en Tal'Dorei.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const profile = await getSessionProfile();

  return (
    <html lang="es" className="h-full">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
        />
      </head>
      <body className="min-h-full flex flex-col">
        {!isConfigured && (
          <div className="w-full text-center py-2 px-4 font-ui text-[12px] font-semibold"
            style={{ background: "rgba(239,106,61,0.12)", color: "var(--color-ember)", borderBottom: "1px solid color-mix(in srgb, var(--color-ember) 40%, var(--color-line))" }}>
            <i className="fas fa-triangle-exclamation mr-1.5" />Supabase sin configurar — añade las credenciales en <code>.env.local</code> (ver <code>.env.example</code>).
          </div>
        )}
        {profile ? (
          <SessionProvider value={profile}>
            <SiteNav role={profile.role} username={profile.username} />
            <div className="flex-1">{children}</div>
            <SiteFooter />
            <ErrorBoundary>
              <EpicOverlay />
            </ErrorBoundary>
            <DiceBoard />
          </SessionProvider>
        ) : (
          <div className="flex-1">{children}</div>
        )}
      </body>
    </html>
  );
}
