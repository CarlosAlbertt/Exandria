"use client";
import Link from "next/link";
import { usePartyLocation } from "@/lib/usePartyLocation";
import { useGameClock } from "@/lib/useGameClock";
import { momentFromGameMin } from "@/lib/gameClock";
import { weatherFor, esDuro } from "@/lib/weather";

export default function PartyLocationWidget() {
  const { location } = usePartyLocation();
  const { nowGameMin } = useGameClock();
  if (!location) return null;
  const weather = weatherFor(location.continent, location.regionSlug, undefined, momentFromGameMin(nowGameMin));
  const duro = esDuro(weather);
  return (
    <Link href="/lugar"
      title={`Ubicación del grupo · ${weather.condition} (${weather.temp})${duro ? " · el tiempo aprieta" : ""}`}
      className="flex items-center gap-1.5 font-ui text-[12px] font-semibold px-2.5 py-1 rounded-full transition-colors"
      style={{ color: "var(--color-bronze-bright)", border: "1px solid color-mix(in srgb, var(--color-bronze) 45%, transparent)" }}>
      <i className="fas fa-location-dot" />
      <span className="truncate max-w-[120px]">{location.poiName}</span>
      {/* Clima duro: el icono avisa en color de alarma. */}
      <i className={`fas ${weather.icon}`} style={{ color: duro ? "var(--color-ember)" : "var(--color-bronze)" }} />
    </Link>
  );
}
