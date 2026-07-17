import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSessionProfile } from "@/lib/auth";
import NarradorClient from "./NarradorClient";

export const metadata: Metadata = { title: "El Narrador" };

export default async function NarradorPage() {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "dm") redirect("/");
  return <NarradorClient />;
}
