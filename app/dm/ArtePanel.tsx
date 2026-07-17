"use client";
import { useState } from "react";
import { SPECIES } from "@/data/species";
import { CLASSES } from "@/data/classes";
import { useArt, saveArt, type ArtKind } from "@/lib/useArt";
import { useTownMaps, saveTownMaps } from "@/lib/useTownMaps";
import ImageUpload from "@/components/ImageUpload";
import { slugify } from "@/lib/slug";

export default function ArtePanel() {
  const { artSrc, map, ready } = useArt();
  const { merged: towns, overrides: townOverrides } = useTownMaps();
  const [saving, setSaving] = useState(false);
  const [newTown, setNewTown] = useState("");

  async function setTown(name: string, url: string) {
    setSaving(true);
    const next = { ...townOverrides };
    if (url) next[name] = url; else delete next[name];
    await saveTownMaps(next);
    setSaving(false);
  }

  async function setArt(kind: ArtKind, slug: string, url: string) {
    setSaving(true);
    const next = { ...map };
    if (url) next[`${kind}/${slug}`] = url; else delete next[`${kind}/${slug}`];
    await saveArt(next);
    setSaving(false);
  }

  if (!ready) return <p className="text-sm italic" style={{ color: "var(--color-dim)" }}>Cargando…</p>;

  const row = (kind: ArtKind, slug: string, name: string, folder: string, fallback?: string) => (
    <div key={`${kind}/${slug}`} className="panel-raised p-2.5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <img src={artSrc(kind, slug, fallback) || ""} alt="" onError={(e) => { (e.target as HTMLImageElement).style.visibility = "hidden"; }}
          className="w-10 h-10 object-cover rounded border border-[var(--color-line)] shrink-0" />
        <span className="font-ui text-[13px] font-semibold truncate" style={{ color: "var(--color-warm)" }}>{name}</span>
      </div>
      <ImageUpload folder={folder} filename={slug} maxWidth={1600} currentUrl={map[`${kind}/${slug}`]}
        onUploaded={(url) => setArt(kind, slug, url)} />
    </div>
  );

  return (
    <div className="space-y-6">
      {saving && <p className="eyebrow" style={{ color: "var(--color-bronze-bright)" }}>Guardando…</p>}
      <section>
        <p className="eyebrow mb-2">Clases ({CLASSES.length})</p>
        <div className="grid md:grid-cols-2 gap-2">
          {CLASSES.map((c) => row("class", c.slug, c.name, "class", `/classes/${c.slug}.jpg`))}
        </div>
      </section>
      <section>
        <p className="eyebrow mb-2">Especies ({SPECIES.length})</p>
        <div className="grid md:grid-cols-2 gap-2">
          {SPECIES.map((s) => row("species", s.slug, s.name, "species", `/species/${s.slug}.jpg`))}
        </div>
      </section>
      <section>
        <p className="eyebrow mb-2">Linajes</p>
        <div className="grid md:grid-cols-2 gap-2">
          {SPECIES.flatMap((s) => (s.lineages ?? []).map((l) => {
            const slug = slugify(l.name);
            return row("lineage", slug, `${s.name} · ${l.name}`, "lineage", `/species/lineages/${slug}.jpg`);
          }))}
        </div>
      </section>
      <section>
        <p className="eyebrow mb-2">Mapas de pueblo</p>
        <p className="font-ui text-[12px] mb-2" style={{ color: "var(--color-dim)" }}>
          La clave debe ser el nombre exacto del POI (p. ej. «Emon», «Syngorn»).
        </p>
        <div className="flex gap-2 mb-3">
          <input value={newTown} onChange={(e) => setNewTown(e.target.value)} placeholder="Nombre del pueblo/ciudad"
            className="flex-1 bg-[var(--color-night)] rounded-lg px-3 py-1.5 font-ui text-[12px] border border-[var(--color-line)]" style={{ color: "var(--color-warm)" }} />
          <button type="button" onClick={() => { if (newTown.trim() && !(newTown.trim() in towns)) setNewTown(newTown.trim()); }}
            className="btn-ghost !py-1.5 !px-3 text-[12px]" title="Escribe el nombre y sube su mapa abajo">Preparar</button>
        </div>
        <div className="grid md:grid-cols-2 gap-2">
          {Array.from(new Set([...Object.keys(towns), ...(newTown.trim() ? [newTown.trim()] : [])])).map((name) => (
            <div key={name} className="panel-raised p-2.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <img src={towns[name] || ""} alt="" onError={(e) => { (e.target as HTMLImageElement).style.visibility = "hidden"; }}
                  className="w-10 h-10 object-cover rounded border border-[var(--color-line)] shrink-0" />
                <span className="font-ui text-[13px] font-semibold truncate" style={{ color: "var(--color-warm)" }}>{name}</span>
              </div>
              <ImageUpload folder="towns" filename={slugify(name)} maxWidth={4000} currentUrl={townOverrides[name]}
                onUploaded={(url) => setTown(name, url)} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
