"use client";
import Link from "next/link";
import { usePartyLocation } from "@/lib/usePartyLocation";

export default function PartyLocationWidget() {
  const { location } = usePartyLocation();
  if (!location) return null;
  return (
    <Link href="/lugar" title="Ubicación del grupo" className="flex items-center gap-1.5 font-ui text-[12px] font-semibold px-2.5 py-1 rounded-full transition-colors"
      style={{ color: "var(--color-bronze-bright)", border: "1px solid color-mix(in srgb, var(--color-bronze) 45%, transparent)" }}>
      <i className="fas fa-location-dot" />
      <span className="truncate max-w-[120px]">{location.poiName}</span>
    </Link>
  );
}
