import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSessionProfile } from "@/lib/auth";
import DmDashboard from "./DmDashboard";

export const metadata: Metadata = { title: "Panel DM" };

export default async function DmPage() {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "dm") redirect("/");
  return <DmDashboard />;
}
