import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { continentBySlug, HABITADOS } from "@/data/saber";
import { slugify } from "@/lib/slug";
import ContinentePage from "@/components/reino/ContinentePage";

export function generateStaticParams() {
  return HABITADOS.map((p) => ({ continente: slugify(p) }));
}

export async function generateMetadata({ params }: { params: Promise<{ continente: string }> }): Promise<Metadata> {
  const place = continentBySlug((await params).continente);
  return place
    ? { title: place, description: `Geografía, gentes e historia de ${place}.` }
    : { title: "Tierra desconocida" };
}

export default async function Page({ params }: { params: Promise<{ continente: string }> }) {
  const place = continentBySlug((await params).continente);
  if (!place) notFound();
  return <ContinentePage place={place} />;
}
