import { getSessionProfile } from "@/lib/auth";
import PortadaDm from "@/components/home/PortadaDm";
import PanelJugador from "@/components/home/PanelJugador";

export default async function HomePage() {
  const profile = await getSessionProfile();
  // Sin sesión el proxy ya manda a /login; si llegara aquí, la portada del
  // jugador es la más segura (no enseña rutas cerradas).
  return profile?.role === "dm" ? <PortadaDm /> : <PanelJugador />;
}
