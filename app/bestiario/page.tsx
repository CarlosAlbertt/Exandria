import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSessionProfile } from "@/lib/auth";
import BestiarioView from "./BestiarioView";

export const metadata: Metadata = {
  title: "Bestiario",
  description: "Bestiario de Exandria: monstruos del manual y criaturas personalizadas del DM, con buscador y estadísticas completas.",
};

export default async function BestiarioPage() {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");
  return <BestiarioView />;
}
