import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSessionProfile } from "@/lib/auth";
import CronicaView from "./CronicaView";

export const metadata: Metadata = {
  title: "Crónica",
  description: "Diario de sesión, misiones y PNJ conocidos por el grupo en la campaña de Tal'Dorei.",
};

export default async function CronicaPage() {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");
  return <CronicaView />;
}
