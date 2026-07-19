"use client";
import Link from "next/link";
import { usePartyLocation } from "@/lib/usePartyLocation";
import { useGameClock } from "@/lib/useGameClock";
import { momentFromGameMin } from "@/lib/gameClock";
import { weatherFor } from "@/lib/weather";

export default function PartyLocationWidget() {
  const { location } = usePartyLocation();
  const { nowGameMin } = useGameClock();
  if (!location) return null;
  const weather = weatherFor(location.continent, location.regionSlug, undefined, momentFromGameMin(nowGameMin));
  return (
    <Link href="/lugar" title={`Ubicación del grupo · ${weather.condition} (${weather.temp})`} className="flex items-center gap-1.5 font-ui text-[12px] font-semibold px-2.5 py-1 rounded-full transition-colors"
      style={{ color: "var(--color-bronze-bright)", border: "1px solid color-mix(in srgb, var(--color-bronze) 45%, transparent)" }}>
      <i className="fas fa-location-dot" />
      <span className="truncate max-w-[120px]">{location.poiName}</span>
      <i className={`fas ${weather.icon}`} style={{ color: "var(--color-bronze)" }} />
    </Link>
  );
}
