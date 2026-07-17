"use client";
import { useState } from "react";
import { SPECIES } from "@/data/species";
import { CLASSES } from "@/data/classes";
import { useArt, saveArt, type ArtKind } from "@/lib/useArt";
import ImageUpload from "@/components/ImageUpload";
import { slugify } from "@/lib/slug";

export default function ArtePanel() {
  const { artSrc, map, ready } = useArt();
  const [saving, setSaving] = useState(false);

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
    </div>
  );
}
