# Fase B — Modo ubicación "Estás en…" · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** El grupo tiene una ubicación actual que fija el DM; los jugadores la ven en el nav y abren `/lugar` para saber qué hay allí (con secciones de servicio placeholder para las fases C–F).

**Architecture:** La ubicación vive en `app_config.party_location` (JSON) con un hook de **mutación optimista** (app_config no dispara realtime). El DM la fija desde el editor de mapa (botón por POI). Un widget en el nav enlaza a `/lugar`, que resuelve el POI desde el atlas y muestra cabecera + mapa de pueblo + secciones de servicio. El `Poi` del atlas gana un campo `services?` opcional editable por el DM.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, `@supabase/ssr`, Tailwind v4.

**Verificación** (repo sin tests unitarios): gates = `npx tsc --noEmit` + `npx next build`. Sin sesión en dev, se verifica el fallback de `/lugar` ("De camino…") y que el build pasa; el flujo DM lo prueba el usuario.

**Spec:** `docs/superpowers/specs/2026-07-17-fase-b-modo-ubicacion-design.md`

**Convenciones:** commits acaban con `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`; autor git `CarlosAlbertt` (no cambiar). `app_config` NO dispara realtime → mutaciones **optimistas** (ver `lib/useArt.ts`). Sin tests unitarios: no añadir.

---

### Task 1: Hook `usePartyLocation` (app_config, optimista)

**Files:**
- Create: `lib/usePartyLocation.ts`

- [ ] **Step 1: Crear `lib/usePartyLocation.ts`** (patrón `useArt`, mutación optimista)

```ts
"use client";
import { useEffect, useState } from "react";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";

export type PartyLocation = { continent: string; regionSlug: string; poiName: string };
const KEY = "party_location";

async function save(loc: PartyLocation | null) {
  if (!supabaseConfigured) return;
  await createClient().from("app_config").upsert({
    key: KEY,
    value: loc ? JSON.stringify(loc) : "",
    updated_at: new Date().toISOString(),
  });
}

export function usePartyLocation() {
  const [location, setLoc] = useState<PartyLocation | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!supabaseConfigured) { setReady(true); return; }
    const supabase = createClient();
    let mounted = true;
    const load = async () => {
      const { data } = await supabase.from("app_config").select("value").eq("key", KEY).maybeSingle();
      if (!mounted) return;
      try {
        const raw = data?.value as string | undefined;
        setLoc(raw ? (JSON.parse(raw) as PartyLocation) : null);
      } catch { setLoc(null); }
      setReady(true);
    };
    load();
    const ch = supabase
      .channel(`party_loc_rt_${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "app_config", filter: `key=eq.${KEY}` }, () => load())
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(ch); };
  }, []);

  // Optimista: app_config no dispara realtime (ver useArt).
  const setLocation = (loc: PartyLocation | null) => {
    setLoc(loc);
    void save(loc);
  };

  return { location, ready, setLocation };
}
```

- [ ] **Step 2: Verificar** — `npx tsc --noEmit` (sin errores) y `npx next build` (limpio).

- [ ] **Step 3: Commit**

```bash
git add lib/usePartyLocation.ts
git commit -m "$(printf 'feat(lugar): hook usePartyLocation (app_config, optimista)\n\nCo-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>')"
```

---

### Task 2: `Poi.services?` + editor de servicios en el POI del DM

**Files:**
- Modify: `data/pois.ts`
- Modify: `app/dm/MapaPanel.tsx`

**Contexto:** `Poi` = `{ name, type, blurb, x, y }` (`data/pois.ts:7`). El editor de POIs del DM usa `PForm` (`MapaPanel.tsx:21`, `EMPTY_P:22`), `openEditPoi` (línea 115), `savePoi` (116-127) y el form JSX (224-238).

- [ ] **Step 1: Añadir `services?` al tipo `Poi`**

En `data/pois.ts`, ampliar el tipo:
```ts
export type Poi = {
  name: string;
  type: PoiType;
  blurb: string;
  x: number;
  y: number;
  services?: {
    tienda?: string[];   // ids de tienda (Fase C)
    posada?: boolean;    // descanso (Fase D)
    npcs?: string[];     // ids de NPC (Fase E)
    tablon?: boolean;    // tablón de misiones (Fase F)
  };
};
```
Opcional → no rompe los `POIS` existentes ni el atlas.

- [ ] **Step 2: Ampliar `PForm` y `EMPTY_P` en `MapaPanel.tsx`**

```ts
type PForm = { name: string; type: PoiType; blurb: string; posada: boolean; tablon: boolean; tienda: string; npcs: string };
const EMPTY_P: PForm = { name: "", type: "ciudad", blurb: "", posada: false, tablon: false, tienda: "", npcs: "" };
```

- [ ] **Step 3: `openEditPoi` rellena los servicios**

Reemplazar `openEditPoi` (línea 115):
```ts
  const openEditPoi = (p: Poi) => {
    setPForm({
      name: p.name, type: p.type, blurb: p.blurb,
      posada: p.services?.posada ?? false,
      tablon: p.services?.tablon ?? false,
      tienda: (p.services?.tienda ?? []).join(", "),
      npcs: (p.services?.npcs ?? []).join(", "),
    });
    setPEditing(p);
  };
```

- [ ] **Step 4: `savePoi` persiste los servicios**

En `savePoi` (líneas 116-127), construir el objeto `services` y adjuntarlo. Reemplazar el cuerpo por:
```ts
  const savePoi = () => {
    if (!region || !pForm.name.trim()) return;
    const cur = contData.pois[region.slug] ?? [];
    const splitIds = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);
    const services: Poi["services"] = {};
    if (pForm.posada) services.posada = true;
    if (pForm.tablon) services.tablon = true;
    const tienda = splitIds(pForm.tienda); if (tienda.length) services.tienda = tienda;
    const npcs = splitIds(pForm.npcs); if (npcs.length) services.npcs = npcs;
    const hasServices = Object.keys(services).length > 0;
    const fields = { name: pForm.name.trim(), type: pForm.type, blurb: pForm.blurb.trim(), ...(hasServices ? { services } : {}) };
    let arr: Poi[];
    if (pEditing === "new") {
      arr = [...cur, { ...fields, ...spread() }];
    } else if (pEditing) {
      arr = cur.map((p) => (p.name === pEditing.name ? { ...p, ...fields, services: hasServices ? services : undefined } : p));
    } else return;
    save({ ...atlas, [continent]: { regions: contData.regions, pois: { ...contData.pois, [region.slug]: arr } } });
    setPEditing(null);
  };
```

- [ ] **Step 5: Controles de servicio en el form JSX del POI**

Insertar en el editor de POI (`pEditing && (...)`), **después** del `<textarea>` del blurb (línea 231) y **antes** del `<div className="flex gap-2">` de Guardar/Cancelar (línea 232):
```tsx
<div className="space-y-1.5">
  <p className="eyebrow !text-[9px]">Servicios (para /lugar)</p>
  <label className="flex items-center gap-2 font-ui text-[12px]" style={{ color: "var(--color-warm)" }}>
    <input type="checkbox" checked={pForm.posada} onChange={(e) => setPForm({ ...pForm, posada: e.target.checked })} /> Posada (descanso)
  </label>
  <label className="flex items-center gap-2 font-ui text-[12px]" style={{ color: "var(--color-warm)" }}>
    <input type="checkbox" checked={pForm.tablon} onChange={(e) => setPForm({ ...pForm, tablon: e.target.checked })} /> Tablón de misiones
  </label>
  <input value={pForm.tienda} onChange={(e) => setPForm({ ...pForm, tienda: e.target.value })} placeholder="Tiendas (ids, coma)" className={inputCls} style={{ color: "var(--color-warm)" }} />
  <input value={pForm.npcs} onChange={(e) => setPForm({ ...pForm, npcs: e.target.value })} placeholder="NPCs (ids, coma)" className={inputCls} style={{ color: "var(--color-warm)" }} />
</div>
```

- [ ] **Step 6: Verificar** — `npx tsc --noEmit` + `npx next build` limpios.

- [ ] **Step 7: Commit**

```bash
git add data/pois.ts app/dm/MapaPanel.tsx
git commit -m "$(printf 'feat(lugar): servicios por POI editables por el DM\n\nCo-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>')"
```

---

### Task 3: DM fija la ubicación desde el editor de mapa

**Files:**
- Modify: `app/dm/MapaPanel.tsx`

**Contexto:** La lista de POIs de la sub-pestaña «POIs por región» está en `MapaPanel.tsx:240-258`. Cada POI tiene botones ojo/editar/borrar (líneas 248-255). `continent`, `region` y `p.name` están en scope.

- [ ] **Step 1: Importar y usar el hook**

Al principio del archivo, junto a los otros imports:
```tsx
import { usePartyLocation } from "@/lib/usePartyLocation";
```
Dentro del componente `MapaPanel`, junto a los demás hooks (p. ej. tras `const { atlas, save } = useAtlas();`):
```tsx
const { location: partyLoc, setLocation: setPartyLoc } = usePartyLocation();
```

- [ ] **Step 2: Botón "El grupo está aquí" por POI**

En la fila de cada POI (dentro del `<div className="flex items-center gap-1 shrink-0">`, línea 248), **antes** del botón de editar, añadir:
```tsx
<button
  onClick={() => setPartyLoc({ continent, regionSlug: region.slug, poiName: p.name })}
  title="El grupo está aquí"
  className="font-ui text-[11px] font-bold px-2 py-1 rounded-lg transition-colors"
  style={{
    color: partyLoc?.poiName === p.name && partyLoc?.regionSlug === region.slug ? "var(--color-ink)" : "var(--color-muted)",
    background: partyLoc?.poiName === p.name && partyLoc?.regionSlug === region.slug ? "var(--color-bronze)" : "transparent",
    border: `1px solid ${partyLoc?.poiName === p.name && partyLoc?.regionSlug === region.slug ? "var(--color-bronze)" : "var(--color-line)"}`,
  }}
>
  <i className="fas fa-location-crosshairs" />
</button>
```

- [ ] **Step 3: Botón global "El grupo viaja (sin lugar)"**

En la cabecera de la lista de POIs (`<div className="flex items-center justify-between mb-3">`, línea 220), junto al botón «Añadir», añadir un botón que limpie la ubicación (solo visible si hay ubicación):
```tsx
{partyLoc && (
  <button onClick={() => setPartyLoc(null)} className="btn-ghost !py-1.5 !px-3 text-[12px]" title="El grupo deja de estar en un lugar">
    <i className="fas fa-route mr-1.5" />El grupo viaja
  </button>
)}
```
Ajusta el layout de la cabecera si hace falta para que quepan «Añadir» y este botón (p. ej. un `flex gap-2`).

- [ ] **Step 4: Verificar** — `npx tsc --noEmit` + `npx next build` limpios.

- [ ] **Step 5: Commit**

```bash
git add app/dm/MapaPanel.tsx
git commit -m "$(printf 'feat(lugar): el DM fija la ubicacion del grupo desde el editor\n\nCo-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>')"
```

---

### Task 4: Widget de ubicación en el nav

**Files:**
- Create: `components/PartyLocationWidget.tsx`
- Modify: `components/SiteNav.tsx`

**Contexto:** `SiteNav.tsx` monta `<ClockWidget compact />` en el nav de escritorio (~línea 58) y en el móvil (~línea 84). `SiteNav` ya es `"use client"`.

- [ ] **Step 1: Crear `components/PartyLocationWidget.tsx`**

```tsx
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
```

- [ ] **Step 2: Montar en `SiteNav.tsx`**

Importar arriba:
```tsx
import PartyLocationWidget from "@/components/PartyLocationWidget";
```
En el bloque de escritorio, junto a `<ClockWidget compact />` (~línea 58), añadir **antes** de él:
```tsx
<PartyLocationWidget />
```
En el bloque móvil, junto al `<ClockWidget compact />` (~línea 84), añadir igualmente:
```tsx
<PartyLocationWidget />
```

- [ ] **Step 3: Verificar** — `npx tsc --noEmit` + `npx next build` limpios.

- [ ] **Step 4: Commit**

```bash
git add components/PartyLocationWidget.tsx components/SiteNav.tsx
git commit -m "$(printf 'feat(lugar): widget de ubicacion del grupo en el nav\n\nCo-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>')"
```

---

### Task 5: Página `/lugar` + secciones de servicio

**Files:**
- Create: `components/lugar/ServiceSections.tsx`
- Create: `app/lugar/page.tsx`

**Contexto:** `useAtlas` exporta `regionsOf(atlas, continent)` y `poisOf(atlas, continent, regionSlug)` (usados en `MapaPanel.tsx:7,63,66`). `useTownMaps().townMap(name)` da la imagen del pueblo. `POI_ICON`/`POI_COLOR` en `@/data/pois`. `ClockWidget` acepta la variante grande sin props (usada en `RelojPanel`).

- [ ] **Step 1: Crear `components/lugar/ServiceSections.tsx`** (placeholders C–F)

```tsx
"use client";
import type { Poi } from "@/data/pois";

// Cada fase C–F sustituirá el cuerpo de su tarjeta. Hoy: placeholder.
export default function ServiceSections({ services }: { services?: Poi["services"] }) {
  if (!services) return null;
  const cards: { show: boolean; icon: string; title: string; fase: string; detail: string }[] = [
    { show: !!services.tienda?.length, icon: "fa-store", title: "Tienda", fase: "Fase C", detail: `${services.tienda?.length ?? 0} comercio(s)` },
    { show: !!services.posada, icon: "fa-bed", title: "Posada", fase: "Fase D", detail: "Descanso disponible" },
    { show: !!services.npcs?.length, icon: "fa-comments", title: "Gente del lugar", fase: "Fase E", detail: `${services.npcs?.length ?? 0} PNJ` },
    { show: !!services.tablon, icon: "fa-scroll", title: "Tablón de misiones", fase: "Fase F", detail: "Encargos disponibles" },
  ].filter((c) => c.show);
  if (cards.length === 0) return null;
  return (
    <div className="grid sm:grid-cols-2 gap-3 mt-6">
      {cards.map((c) => (
        <div key={c.title} className="panel-raised p-4">
          <p className="font-display font-extrabold text-[15px] mb-1" style={{ color: "var(--color-parch)" }}>
            <i className={`fas ${c.icon} mr-2`} style={{ color: "var(--color-bronze)" }} />{c.title}
          </p>
          <p className="font-ui text-[12px]" style={{ color: "var(--color-warm)" }}>{c.detail}</p>
          <p className="font-ui text-[10px] mt-2" style={{ color: "var(--color-dim)" }}>Próximamente ({c.fase})</p>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Crear `app/lugar/page.tsx`**

```tsx
"use client";
import { usePartyLocation } from "@/lib/usePartyLocation";
import { useAtlas, regionsOf, poisOf } from "@/lib/useAtlas";
import { useTownMaps } from "@/lib/useTownMaps";
import { POI_ICON, POI_COLOR } from "@/data/pois";
import ClockWidget from "@/components/ClockWidget";
import ServiceSections from "@/components/lugar/ServiceSections";

export default function LugarPage() {
  const { location, ready } = usePartyLocation();
  const { atlas } = useAtlas();
  const { townMap } = useTownMaps();

  if (!ready) {
    return <main className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center"><p className="pulse font-ui text-[13px]" style={{ color: "var(--color-muted)" }}>Cargando…</p></main>;
  }

  const region = location ? regionsOf(atlas, location.continent).find((r) => r.slug === location.regionSlug) : undefined;
  const poi = location && region ? poisOf(atlas, location.continent, location.regionSlug).find((p) => p.name === location.poiName) : undefined;

  // De camino: sin ubicación o POI no encontrado en el atlas.
  if (!location || !poi) {
    return (
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center">
        <i className="fas fa-route text-4xl mb-4" style={{ color: "var(--color-dim)" }} />
        <h1 className="font-display text-3xl font-extrabold gold-text mb-2">De camino…</h1>
        <p className="font-ui text-[14px] mb-6" style={{ color: "var(--color-muted)" }}>
          {region ? <>El grupo viaja por <span style={{ color: "var(--color-bronze)" }}>{region.name}</span>.</> : "El grupo está de viaje, sin un lugar fijo."}
        </p>
        <div className="flex justify-center"><ClockWidget /></div>
      </main>
    );
  }

  const townImg = townMap(poi.name);

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <p className="eyebrow mb-2">{region ? `${region.name} · ${location.continent}` : location.continent}</p>
      <h1 className="font-display text-3xl md:text-4xl font-extrabold gold-text mb-2">
        <i className={`fas ${POI_ICON[poi.type]} mr-3`} style={{ color: POI_COLOR[poi.type] }} />{poi.name}
      </h1>
      <p className="font-body text-[15px] leading-relaxed mb-5" style={{ color: "var(--color-warm)" }}>{poi.blurb}</p>

      {townImg && (
        <img src={townImg} alt={poi.name} loading="lazy" className="w-full rounded-xl border border-[var(--color-line)] mb-2" />
      )}

      <ServiceSections services={poi.services} />
    </main>
  );
}
```

- [ ] **Step 3: Verificar** — `npx tsc --noEmit` + `npx next build` limpios. Confirmar que aparece la ruta `/lugar` en la tabla del build.

- [ ] **Step 4: Commit**

```bash
git add app/lugar/page.tsx components/lugar/ServiceSections.tsx
git commit -m "$(printf 'feat(lugar): pagina /lugar con cabecera, mapa y servicios placeholder\n\nCo-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>')"
```

---

### Task 6: Documentación

**Files:**
- Modify: `HANDOFF.md`
- Modify: `C:\Users\carlo\Desktop\Exandria-Obsidian\Exandria\00 Meta\Historial de desarrollo.md`
- Modify: `C:\Users\carlo\Desktop\Exandria-Obsidian\Exandria\00 Meta\Pendientes.md`

- [ ] **Step 1: `HANDOFF.md`** — milestone `## RESUELTO (2026-07-17): Fase B — modo ubicación 📍`: `party_location` (app_config, optimista) + editor DM (botón por POI + "El grupo viaja") + widget nav + `/lugar` (cabecera POI, mapa de pueblo, "De camino…") + `Poi.services?` con editor y **secciones placeholder** para C–F. Sin migración. Anotar prueba en vivo del usuario.

- [ ] **Step 2: Vault** — `Historial de desarrollo.md`: hito `[!success]` de Fase B. `Pendientes.md`: marcar B hecha en la hoja de ruta; añadir prueba en vivo (fijar ubicación, ver widget y `/lugar`, marcar servicios); apuntar que C–F ya tienen dónde engancharse (`/lugar` + `Poi.services`).

- [ ] **Step 3: Commit de docs del repo**

```bash
git add HANDOFF.md docs/superpowers/specs/2026-07-17-fase-b-modo-ubicacion-design.md docs/superpowers/plans/2026-07-17-fase-b-modo-ubicacion.md
git commit -m "$(printf 'docs(lugar): milestone Fase B y spec/plan\n\nCo-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>')"
```
> El vault de Obsidian está fuera del repo git; sus cambios no entran en el commit.

---

## Self-Review

- **Cobertura del spec**: `party_location`+hook optimista → Task 1; `Poi.services?`
  + editor DM → Task 2; DM fija ubicación (botón POI + "viaja") → Task 3; widget
  nav → Task 4; `/lugar` + "De camino…" + secciones placeholder → Task 5; docs →
  Task 6. Sin huecos. Servicios reales C–F fuera de alcance (documentado).
- **Placeholders**: código completo en archivos nuevos (hook, widget,
  ServiceSections, `/lugar`). Integraciones en `MapaPanel`/`SiteNav` con snippet
  exacto + ancla de línea; tsc verifica los nombres (`region`, `continent`,
  `partyLoc`).
- **Consistencia de tipos**: `PartyLocation = { continent, regionSlug, poiName }`
  usado igual en el hook (Task 1), el editor (Task 3), el widget (Task 4) y
  `/lugar` (Task 5). `Poi["services"]` (Task 2) consumido por `ServiceSections`
  y el editor con los mismos campos (`tienda[]`, `posada`, `npcs[]`, `tablon`).
  `usePartyLocation()` → `{ location, ready, setLocation }` estable en todos los
  consumidores. `regionsOf`/`poisOf` con las firmas reales de `useAtlas`.
