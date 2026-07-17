# Fase H — Subida de imágenes (Supabase Storage) · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** El DM sube imágenes desde la app (submapas de región, retratos de especie/linaje/clase, mapas de pueblo, arte de monstruo) a Supabase Storage, sin tocar código.

**Architecture:** Un bucket público `assets` con escritura restringida a DM por policy. Un helper `lib/storage.ts` (resize en canvas + upload) y un componente genérico `ImageUpload` alimentan 4 integraciones. Los overrides de arte y mapas de pueblo viven en `app_config` (JSON, realtime, sin migración), con el mismo patrón que `useDmStash`.

**Tech Stack:** Next.js 16, React 19, TypeScript, `@supabase/ssr` (Storage API), Tailwind v4.

**Verificación** (repo sin framework de tests): gates reales = `npx tsc --noEmit` + `npx next build` + `check-*.ts` existentes. Sin credenciales de Storage en dev, se verifica el fallback de URL manual + tipos/build. El único paso manual del usuario es crear el bucket (SQL en Task 1).

**Spec:** `docs/superpowers/specs/2026-07-17-fase-h-subida-imagenes-design.md`

**Convenciones del repo:** commits acaban con `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`; autor git `CarlosAlbertt` (no cambiar). Hooks de `app_config` usan canal realtime único por montaje (ver `useDmStash`). No hay tests unitarios: no añadir.

---

### Task 1: Helper de Storage + SQL del bucket

**Files:**
- Create: `lib/storage.ts`
- Create: `supabase/storage-assets.sql` (SQL del bucket; lo ejecuta el usuario)

- [ ] **Step 1: Crear `lib/storage.ts`**

```ts
"use client";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";

export const isStorageConfigured = supabaseConfigured;

const BUCKET = "assets";

// Redimensiona/comprime en cliente y devuelve un Blob JPEG.
async function shrink(file: File, maxWidth: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / bitmap.width);
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo procesar la imagen.");
  ctx.drawImage(bitmap, 0, 0, w, h);
  const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, "image/jpeg", 0.85));
  if (!blob) throw new Error("No se pudo comprimir la imagen.");
  return blob;
}

// Sube <folder>/<filename>.jpg y devuelve la URL pública. upsert para resubir.
export async function uploadImage(folder: string, filename: string, file: File, maxWidth: number): Promise<string> {
  if (!supabaseConfigured) throw new Error("Storage no configurado.");
  const supabase = createClient();
  const blob = await shrink(file, maxWidth);
  const path = `${folder}/${filename}.jpg`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { upsert: true, contentType: "image/jpeg" });
  if (error) throw new Error(`Error al subir: ${error.message}`);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  // Cache-bust para que la URL cambie tras un re-upload a la misma ruta.
  return `${data.publicUrl}?v=${Date.now()}`;
}
```

- [ ] **Step 2: Crear `supabase/storage-assets.sql` (paso manual del usuario)**

```sql
-- Fase H: bucket público 'assets' con escritura solo DM.
-- Ejecutar una vez en el SQL Editor de Supabase. is_dm() ya existe (schema.sql).

insert into storage.buckets (id, name, public)
values ('assets', 'assets', true)
on conflict (id) do update set public = true;

drop policy if exists "assets_select_public" on storage.objects;
create policy "assets_select_public" on storage.objects
  for select to public using (bucket_id = 'assets');

drop policy if exists "assets_insert_dm" on storage.objects;
create policy "assets_insert_dm" on storage.objects
  for insert to authenticated with check (bucket_id = 'assets' and public.is_dm());

drop policy if exists "assets_update_dm" on storage.objects;
create policy "assets_update_dm" on storage.objects
  for update to authenticated using (bucket_id = 'assets' and public.is_dm());

drop policy if exists "assets_delete_dm" on storage.objects;
create policy "assets_delete_dm" on storage.objects
  for delete to authenticated using (bucket_id = 'assets' and public.is_dm());
```

- [ ] **Step 3: Verificar**

Run: `npx tsc --noEmit` → sin errores.
Run: `npx next build` → build limpio.

- [ ] **Step 4: Commit**

```bash
git add lib/storage.ts supabase/storage-assets.sql
git commit -m "$(printf 'feat(storage): helper de subida + SQL del bucket assets\n\nCo-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>')"
```

---

### Task 2: Componente genérico `ImageUpload`

**Files:**
- Create: `components/ImageUpload.tsx`

- [ ] **Step 1: Crear `components/ImageUpload.tsx`**

```tsx
"use client";
import { useState } from "react";
import { uploadImage, isStorageConfigured } from "@/lib/storage";

type Props = {
  folder: string;
  filename: string;
  label?: string;
  currentUrl?: string;
  maxWidth?: number;
  onUploaded: (url: string) => void;
};

export default function ImageUpload({ folder, filename, label, currentUrl, maxWidth = 1600, onUploaded }: Props) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [manual, setManual] = useState("");

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true); setErr(null);
    try {
      const url = await uploadImage(folder, filename, file, maxWidth);
      onUploaded(url);
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Error al subir.");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  return (
    <div className="space-y-2">
      {label && <p className="eyebrow">{label}</p>}
      {currentUrl && (
        <div className="flex items-center gap-2">
          <img src={currentUrl} alt="" className="w-16 h-16 object-cover rounded-lg border border-[var(--color-line)]" />
          <button type="button" onClick={() => onUploaded("")} className="btn-ghost !py-1 !px-2 text-[12px]" style={{ color: "var(--color-ember)" }}>
            <i className="fas fa-xmark mr-1" />Quitar
          </button>
        </div>
      )}
      {isStorageConfigured ? (
        <label className="btn-ghost !py-1.5 !px-3 text-[13px] cursor-pointer inline-flex items-center">
          <i className={`fas ${busy ? "fa-spinner fa-spin" : "fa-upload"} mr-1.5`} />
          {busy ? "Subiendo…" : "Subir imagen"}
          <input type="file" accept="image/*" onChange={onPick} disabled={busy} className="hidden" />
        </label>
      ) : (
        <div className="flex gap-2">
          <input value={manual} onChange={(e) => setManual(e.target.value)} placeholder="Pega una URL de imagen"
            className="flex-1 bg-[var(--color-night)] rounded-lg px-3 py-1.5 font-ui text-[12px] border border-[var(--color-line)]" style={{ color: "var(--color-warm)" }} />
          <button type="button" onClick={() => manual.trim() && onUploaded(manual.trim())} className="btn-gold !py-1.5 !px-3 text-[12px]">Guardar</button>
        </div>
      )}
      {err && <p className="text-[12px]" style={{ color: "var(--color-ember)" }}><i className="fas fa-circle-info mr-1" />{err}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Verificar**

Run: `npx tsc --noEmit` → sin errores.
Run: `npx next build` → build limpio.

- [ ] **Step 3: Commit**

```bash
git add components/ImageUpload.tsx
git commit -m "$(printf 'feat(storage): componente ImageUpload con fallback a URL manual\n\nCo-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>')"
```

---

### Task 3: Integración 1 — campo `image` en el editor de región

**Files:**
- Modify: `app/dm/MapaPanel.tsx`

**Contexto:** El modelo de región ya tiene `image` (usado en `PinDragMap image={region.image || MAPS.taldorei}`, ~línea 208). Falta la UI. El formulario de región (`rForm`) está en ~líneas 159-175: campos name/capital/accent/feature/blurb + botones Guardar/Cancelar. `saveRegion` persiste al atlas (`atlas_defs`).

- [ ] **Step 1: Incluir `image` en el estado del formulario**

Localiza donde se inicializa `rForm` (busca `setRForm` y el estado inicial `rForm`) y donde `openEditRegion(r)` rellena el formulario. Asegura que `rForm` incluye `image: string` (inicial `""`; en `openEditRegion` = `r.image ?? ""`). Si `rForm` se tipa con un tipo explícito, añade `image: string` a ese tipo.

- [ ] **Step 2: Añadir `<ImageUpload>` al formulario de región**

Import al principio del archivo:
```tsx
import ImageUpload from "@/components/ImageUpload";
```
Insertar en el formulario (`rEditing && (...)`), justo **después** del `<textarea>` del blurb (~línea 170) y **antes** del `<div className="flex gap-2">` de los botones Guardar/Cancelar:
```tsx
<ImageUpload
  folder="maps"
  filename={`${continent}/${rEditing === "new" ? slugify(rForm.name || "region") : (rEditing as { slug: string }).slug}`}
  label="Submapa de la región"
  currentUrl={rForm.image}
  maxWidth={4000}
  onUploaded={(url) => setRForm({ ...rForm, image: url })}
/>
```
> `continent` ya está en scope (selector de continente). Si `slugify` no está
> importado, impórtalo de `@/lib/slug`. Si el nombre local del slug en edición
> difiere, usa el que el componente ya emplea para identificar la región en
> edición.

- [ ] **Step 3: Persistir `image` en `saveRegion`**

En `saveRegion`, donde se arma el objeto región para guardar en el atlas, incluir `image: rForm.image`. En el alta (`openNewRegion`/`newRegions`, ~línea 95) el campo ya nace `image: ""`; ahora debe tomar `rForm.image` al guardar. Verifica que editar una región existente conserva/actualiza `image`.

- [ ] **Step 4: Verificar**

Run: `npx tsc --noEmit` → sin errores.
Run: `npx next build` → build limpio.

- [ ] **Step 5: Commit**

```bash
git add app/dm/MapaPanel.tsx
git commit -m "$(printf 'feat(mapa): subir submapa de region desde el editor DM\n\nCo-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>')"
```

---

### Task 4: `useArt` + wiring de display en el creador

**Files:**
- Create: `lib/useArt.ts`
- Modify: `components/crear/ArtPanel.tsx` (si computa el path) o los sitios que lo llaman
- Modify: `app/crear/steps/SpeciesScene.tsx`, `app/crear/steps/ClassScene.tsx`

**Contexto:** Hoy las escenas del creador pasan un path local (`/species/<slug>.jpg`, `/classes/<slug>.jpg`) a `ArtPanel`/`PortraitFrame`, que caen a silueta/icono si no carga. `useArt` añade una capa de override desde `app_config.art_overrides` **por encima** del path local.

- [ ] **Step 1: Crear `lib/useArt.ts`** (patrón de `useDmStash`)

```ts
"use client";
import { useEffect, useState } from "react";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";

export type ArtKind = "species" | "lineage" | "class";
type ArtMap = Record<string, string>; // clave "<kind>/<slug>" -> url
const KEY = "art_overrides";

export async function saveArt(map: ArtMap) {
  if (!supabaseConfigured) return;
  await createClient().from("app_config").upsert({ key: KEY, value: JSON.stringify(map), updated_at: new Date().toISOString() });
}

export function useArt() {
  const [map, setMap] = useState<ArtMap>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!supabaseConfigured) { setReady(true); return; }
    const supabase = createClient();
    let mounted = true;
    const load = async () => {
      const { data } = await supabase.from("app_config").select("value").eq("key", KEY).maybeSingle();
      if (!mounted) return;
      try { setMap(data?.value ? (JSON.parse(data.value as string) as ArtMap) : {}); } catch { setMap({}); }
      setReady(true);
    };
    load();
    const ch = supabase
      .channel(`art_rt_${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "app_config", filter: `key=eq.${KEY}` }, () => load())
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(ch); };
  }, []);

  // URL de Storage si existe; si no, el path local. PortraitFrame cae a icono.
  const artSrc = (kind: ArtKind, slug: string, localFallback?: string): string | undefined =>
    map[`${kind}/${slug}`] || localFallback;

  return { artSrc, map, ready };
}
```

- [ ] **Step 2: Consumir `artSrc` en las escenas del creador**

En `app/crear/steps/SpeciesScene.tsx` y `app/crear/steps/ClassScene.tsx`: llamar `const { artSrc } = useArt();` y, donde hoy se calcula el `src` del arte (path local `/species/<slug>.jpg` o `/classes/<slug>.jpg`), envolverlo:
- Especie: `artSrc("species", species.slug, \`/species/${species.slug}.jpg\`)`
- Linaje (si se muestra su arte): `artSrc("lineage", lineageSlug, ...)`
- Clase: `artSrc("class", cls.slug, \`/classes/${cls.slug}.jpg\`)`

`ArtPanel`/`PortraitFrame` no cambian (siguen recibiendo `src`). Mantén el path local exacto que el componente usa hoy como `localFallback`.

- [ ] **Step 3: Verificar**

Run: `npx tsc --noEmit` → sin errores.
Run: `npx next build` → build limpio.

- [ ] **Step 4: Commit**

```bash
git add lib/useArt.ts app/crear/steps/SpeciesScene.tsx app/crear/steps/ClassScene.tsx components/crear/ArtPanel.tsx
git commit -m "$(printf 'feat(arte): overrides de retrato desde app_config en el creador\n\nCo-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>')"
```

---

### Task 5: Pestaña DM "Arte" — subir retratos de especie/linaje/clase

**Files:**
- Create: `app/dm/ArtePanel.tsx`
- Modify: `app/dm/DmDashboard.tsx`

**Contexto:** `DmDashboard.tsx` tiene un tipo `Tab` (línea 19) y un array de tabs (línea 32) + renders condicionales (líneas 40-49). Las especies vienen de `data/species.ts` (`SPECIES`, con `slug`, `name`, `region`, y `lineages`), las clases de `data/classes.ts` (`CLASSES`, `slug`, `name`).

- [ ] **Step 1: Crear `app/dm/ArtePanel.tsx`**

```tsx
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
```
> Ajusta los nombres de campo (`SPECIES`, `s.lineages`, `l.name`, `c.slug`) a los
> reales de `data/species.ts` / `data/classes.ts` si difieren; el `check` de tsc
> lo confirma. Si `lineages` no existe con ese nombre, usa el campo real.

- [ ] **Step 2: Registrar la pestaña en `DmDashboard.tsx`**

- Importar: `import ArtePanel from "./ArtePanel";`
- Añadir `"arte"` al tipo `Tab` (línea 19).
- Añadir al array de tabs (línea 32) la entrada: `["arte", "Arte", "fa-image"]`.
- Añadir el render (junto a las líneas 40-49): `{tab === "arte" && <ArtePanel />}`.

- [ ] **Step 3: Verificar**

Run: `npx tsc --noEmit` → sin errores (confirma los nombres de campo de species/classes).
Run: `npx next build` → build limpio.

- [ ] **Step 4: Commit**

```bash
git add app/dm/ArtePanel.tsx app/dm/DmDashboard.tsx
git commit -m "$(printf 'feat(arte): pestana DM Arte para subir retratos\n\nCo-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>')"
```

---

### Task 6: Mapas de pueblo data-driven

**Files:**
- Create: `lib/useTownMaps.ts`
- Modify: `data/townMaps.ts` (mantener defaults + export del tipo)
- Modify: los consumidores de `townMap()` (buscar con grep) — típicamente `components/RegionExplore.tsx`
- Modify: `app/dm/ArtePanel.tsx` (sección para añadir/editar mapas de pueblo)

**Contexto:** `data/townMaps.ts` es hoy un `Record<string,string>` estático (`TOWN_MAPS`) + `townMap(name)`. Se mantiene como defaults; `app_config.town_maps` (JSON) se superpone por nombre de POI.

- [ ] **Step 1: Crear `lib/useTownMaps.ts`** (patrón `useDmStash`)

```ts
"use client";
import { useEffect, useState } from "react";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import { TOWN_MAPS } from "@/data/townMaps";

type TownMap = Record<string, string>;
const KEY = "town_maps";

export async function saveTownMaps(map: TownMap) {
  if (!supabaseConfigured) return;
  await createClient().from("app_config").upsert({ key: KEY, value: JSON.stringify(map), updated_at: new Date().toISOString() });
}

export function useTownMaps() {
  const [overrides, setOverrides] = useState<TownMap>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!supabaseConfigured) { setReady(true); return; }
    const supabase = createClient();
    let mounted = true;
    const load = async () => {
      const { data } = await supabase.from("app_config").select("value").eq("key", KEY).maybeSingle();
      if (!mounted) return;
      try { setOverrides(data?.value ? (JSON.parse(data.value as string) as TownMap) : {}); } catch { setOverrides({}); }
      setReady(true);
    };
    load();
    const ch = supabase
      .channel(`townmaps_rt_${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "app_config", filter: `key=eq.${KEY}` }, () => load())
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(ch); };
  }, []);

  const merged: TownMap = { ...TOWN_MAPS, ...overrides };
  const townMap = (name: string): string | undefined => merged[name];
  return { townMap, merged, overrides, ready };
}
```

- [ ] **Step 2: Migrar los consumidores de `townMap()` al hook**

Run: `grep -rn "townMap\b" app components lib` (fuera de `data/townMaps.ts` y `lib/useTownMaps.ts`).
Para cada consumidor (p. ej. `components/RegionExplore.tsx`): sustituir el import de la función pura `townMap` de `@/data/townMaps` por `const { townMap } = useTownMaps();` (el componente ya es cliente; si no lo es, el que lo consume lo será). Mantener la firma `townMap(name)` idéntica para no tocar la lógica de llamada.

- [ ] **Step 3: Sección de mapas de pueblo en `ArtePanel.tsx`**

Añadir una `<section>` que lea `useTownMaps()` y liste los pueblos con `TOWN_MAPS` como base; cada fila = nombre + `ImageUpload folder="towns" filename={slugify(name)}` → `saveTownMaps({ ...overrides, [name]: url })`. Botón "Añadir pueblo" con input de nombre (el nombre debe ser el del POI exacto). Reusa el helper `row(...)` no aplica aquí (clave por nombre, no por slug); escribe filas simples con el mismo estilo `panel-raised`.

- [ ] **Step 4: Verificar**

Run: `npx tsc --noEmit` → sin errores.
Run: `npx next build` → build limpio.

- [ ] **Step 5: Commit**

```bash
git add lib/useTownMaps.ts data/townMaps.ts components/RegionExplore.tsx app/dm/ArtePanel.tsx
git commit -m "$(printf 'feat(mapas): mapas de pueblo data-driven desde Storage\n\nCo-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>')"
```
> Ajusta la lista de `git add` a los consumidores reales que devuelva el grep del Step 2.

---

### Task 7: Arte de monstruo

**Files:**
- Modify: el tipo `Monster` (buscar: `grep -rn "type Monster\|interface Monster" data lib`)
- Modify: `app/bestiario/BestiarioView.tsx` (formulario del DM + render del statblock)

**Contexto:** `CustomMonster = Monster & { custom: true }` (`lib/useBestiary.ts:16`); los custom se guardan en `app_config.custom_monsters`. El formulario "Añadir monstruo" vive en `BestiarioView.tsx`.

- [ ] **Step 1: Añadir `art?: string` al tipo `Monster`**

Localiza la definición de `Monster` y añade el campo opcional `art?: string;`. Al ser opcional, no rompe los 124 monstruos estáticos ni los checks.

- [ ] **Step 2: Campo de subida en el formulario del DM**

En el formulario "Añadir monstruo" de `BestiarioView.tsx`, añadir (import `ImageUpload` arriba):
```tsx
<ImageUpload folder="monsters" filename={/* slug del monstruo en el form */ slug || "monstruo"}
  label="Arte del monstruo" maxWidth={1600} currentUrl={form.art}
  onUploaded={(url) => setForm({ ...form, art: url })} />
```
Ajusta `form`/`setForm`/`slug` a los nombres reales del estado del formulario. Asegura que `art` se incluye en el objeto que se guarda en `custom_monsters`.

- [ ] **Step 3: Render del arte en el statblock**

Donde `BestiarioView.tsx` pinta el statblock de un monstruo, si `monster.art` existe, mostrar `<img src={monster.art} ... />` (encabezado del statblock, tamaño contenido, `object-cover`, borde del tema). Si no, nada (comportamiento actual).

- [ ] **Step 4: Verificar**

Run: `npx tsc --noEmit` → sin errores.
Run: `npx next build` → build limpio.
Run: `npx tsx scripts/check-bestiary.ts` → sigue verde (el campo es opcional).

- [ ] **Step 5: Commit**

```bash
git add data lib/useBestiary.ts app/bestiario/BestiarioView.tsx
git commit -m "$(printf 'feat(bestiario): arte de monstruo subible por el DM\n\nCo-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>')"
```
> Ajusta `git add` al archivo real del tipo `Monster`.

---

### Task 8: Documentación

**Files:**
- Modify: `HANDOFF.md`
- Modify: `C:\Users\carlo\Desktop\Exandria-Obsidian\Exandria\00 Meta\Historial de desarrollo.md`
- Modify: `C:\Users\carlo\Desktop\Exandria-Obsidian\Exandria\00 Meta\Pendientes.md`

- [ ] **Step 1: `HANDOFF.md`** — milestone `## RESUELTO (2026-07-17): Fase H — subida de imágenes 🖼️`: bucket `assets` + `lib/storage.ts` + `ImageUpload`; las 4 integraciones; overrides en `app_config` (`art_overrides`, `town_maps`) + `Monster.art`; NPC/battlemaps diferidos a E/I. Anotar el **paso manual pendiente**: ejecutar `supabase/storage-assets.sql` (crear bucket + policies), sin el cual la subida cae al fallback de URL manual.

- [ ] **Step 2: Vault** — `Historial de desarrollo.md`: hito `[!success]` de Fase H. `Pendientes.md`: marcar H hecha en la hoja de ruta; añadir a "pasos manuales" el bucket de Storage (`storage-assets.sql`) y la prueba en vivo (subir submapa/retrato/mapa de pueblo/arte de monstruo). Marcar el pendiente viejo de "Subir imágenes (especies y linajes)" como **desbloqueado por la pestaña Arte**.

- [ ] **Step 3: Commit de docs del repo**

```bash
git add HANDOFF.md docs/superpowers/specs/2026-07-17-fase-h-subida-imagenes-design.md docs/superpowers/plans/2026-07-17-fase-h-subida-imagenes.md
git commit -m "$(printf 'docs(storage): milestone Fase H y spec/plan\n\nCo-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>')"
```
> El vault de Obsidian está fuera del repo git; sus cambios no entran en el commit.

---

## Self-Review

- **Cobertura del spec**: infra (bucket+helper) → Task 1; `ImageUpload` → Task 2;
  integración 1 región → Task 3; `useArt`+display → Task 4; pestaña Arte
  (retratos) → Task 5; mapas de pueblo → Task 6; arte de monstruo → Task 7;
  docs+pasos manuales → Task 8. Diferidos NPC/battlemaps documentados como fuera
  de alcance. Sin huecos.
- **Placeholders**: los archivos nuevos llevan código completo. Las
  integraciones en archivos grandes (MapaPanel, DmDashboard, BestiarioView,
  escenas del creador) dan el snippet exacto a insertar + ancla de línea; el
  implementador ajusta nombres de campo reales (marcado explícitamente) y tsc lo
  verifica. No hay "TBD"/"igual que Task N".
- **Consistencia de tipos**: `art_overrides` clave `"<kind>/<slug>"` con
  `kind: "species"|"lineage"|"class"` = carpeta de Storage (`ImageUpload
  folder=kind filename=slug`), coherente entre Task 4 (`artSrc`/`saveArt`) y
  Task 5 (`setArt`). `uploadImage(folder, filename, file, maxWidth)` con la misma
  firma en `storage.ts` (Task 1) y `ImageUpload` (Task 2). `useTownMaps().townMap`
  conserva la firma de la función pura que reemplaza (Task 6). `Monster.art?`
  opcional, arrastrado por `CustomMonster` (Task 7).
