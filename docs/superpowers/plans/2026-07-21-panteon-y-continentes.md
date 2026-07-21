# Panteón propio y una página por continente — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dar al panteón una página propia y abierta (`/panteon`, con botón en el navbar y los dioses separados por bando), y una página de lore por continente (`/reino/[continente]`) con la geografía abierta y el resto gateado por el saber.

**Architecture:** Dos superficies nuevas que **presentan datos que ya existen**, sin escribir lore nueva ni tocar `data/pantheon.ts`. `/panteon` es un navegador cliente sobre los tres arrays de `data/pantheon.ts`, con tarjetas desplegables. `/reino/[continente]` es una ruta dinámica sobre los cinco continentes habitados que combina el atlas (regiones y POIs, editable por el DM) con las entradas de `SABER` de ese lugar, abriendo las categorías de geografía y cultura y dejando el resto con candado.

**Tech Stack:** Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · TypeScript · Supabase.

**Spec:** `docs/superpowers/specs/2026-07-21-panteon-y-continentes-design.md`

**Rama:** `panteon-continentes`, partiendo de `master`.

---

## Sobre los tests en este repo

No hay framework de tests. El gate real es `npx tsc --noEmit` + `npx next build`,
y lo puro se verifica con `scripts/check-lore.ts` (55 comprobaciones en verde
ahora mismo). Ciclo: **añadir la comprobación → verla fallar → implementar →
verla pasar → commit**.

Comando: `npx tsx scripts/check-lore.ts`

---

## Estructura de archivos

| Archivo | Responsabilidad |
|---|---|
| `data/saber.ts` (modificar) | `continentBySlug(slug)`: resuelve el slug de URL a un `SaberPlace`. |
| `components/panteon/DeityCard.tsx` (crear) | Ficha desplegable de un dios. |
| `components/panteon/PanteonBrowser.tsx` (crear) | Buscador + filtro de bando + los tres bloques. |
| `app/panteon/page.tsx` (crear) | Ruta y metadata. |
| `components/SiteNav.tsx` (modificar) | Botón «Panteón». |
| `components/reino/ContinenteGeografia.tsx` (crear) | Regiones y POIs del atlas, agrupados por tipo. |
| `components/reino/ContinentePage.tsx` (crear) | Orquestador de la página de continente. |
| `app/reino/[continente]/page.tsx` (crear) | Ruta dinámica, `generateStaticParams`, `notFound`. |
| `components/ReinoRegions.tsx` (modificar) | Las tarjetas de continente enlazan a su página. |
| `scripts/check-lore.ts` (modificar) | Comprobaciones nuevas. |

---

### Task 1: `continentBySlug` y las comprobaciones

**Files:**
- Modify: `data/saber.ts`
- Modify: `scripts/check-lore.ts`

- [ ] **Step 1: Escribir las comprobaciones que fallan**

Añadir a `scripts/check-lore.ts` (los imports, arriba con los demás: `continentBySlug`, `HABITADOS` de `../data/saber`; y `PRIME_DEITIES`, `BETRAYER_GODS`, `LESSER_IDOLS` de `../data/pantheon`):

```ts
// --- Slugs de continente para /reino/[continente] --------------------------
check("los cinco continentes habitados resuelven por slug", HABITADOS.every((p) => continentBySlug(slugify(p)) === p));
check("un slug inventado no resuelve", continentBySlug("atlantida") === null);
check("Exandria y Mares no tienen página", continentBySlug("exandria") === null && continentBySlug("mares") === null);

// La sección abierta de la página de continente no puede salir vacía.
const ABIERTAS = ["Geografía", "Vida y lenguas"];
for (const p of HABITADOS) {
  check(`${p}: tiene lore abierta que enseñar`, SABER.some((e) => e.place === p && ABIERTAS.includes(e.category)));
}

// --- Panteón ---------------------------------------------------------------
const DIOSES = [...PRIME_DEITIES, ...BETRAYER_GODS, ...LESSER_IDOLS];
check("el panteón suma 33 dioses", DIOSES.length === 33);
check("ningún slug de dios repetido", new Set(DIOSES.map((d) => d.slug)).size === DIOSES.length);
check("toda deidad tiene ficha completa", DIOSES.every((d) => d.name && d.epithet && d.province && d.symbol && d.alignment && d.domains.length > 0));
check("toda deidad tiene tres preceptos", DIOSES.every((d) => d.commandments.length === 3));
check("todo ídolo declara su tipo de patrón", LESSER_IDOLS.every((d) => !!d.patron));
check("cada dios lleva su bando", PRIME_DEITIES.every((d) => d.side === "prime") && BETRAYER_GODS.every((d) => d.side === "betrayer") && LESSER_IDOLS.every((d) => d.side === "idol"));
```

`slugify` viene de `../lib/slug`; añádelo al import si no está.

- [ ] **Step 2: Verla fallar**

Run: `npx tsx scripts/check-lore.ts`
Expected: error de compilación — `continentBySlug` y `HABITADOS` no existen.

- [ ] **Step 3: Implementar en `data/saber.ts`**

Junto a `PLACES` / `PLACE_ACCENT`:

```ts
// Los cinco continentes con página propia (`/reino/[continente]`). "Exandria"
// queda fuera: es el cajón del mundo, y su contenido ya vive en la sección de
// la Calamidad de /reino.
export const HABITADOS = PLACES.filter((p) => p !== "Exandria") as readonly SaberPlace[];

// slug de URL → continente. Devuelve null para lo que no tiene página, para que
// la ruta pueda llamar a notFound().
export function continentBySlug(slug: string): SaberPlace | null {
  return HABITADOS.find((p) => slugify(p) === slug) ?? null;
}
```

Añadir el import de `slugify` (`import { slugify } from "@/lib/slug";`) si no está ya.

- [ ] **Step 4: Verla pasar**

Run: `npx tsx scripts/check-lore.ts` → `Todo en verde` (55 previas + 14 nuevas = 69).
Run: `npx tsc --noEmit` → sin salida.

- [ ] **Step 5: Commit**

```bash
git add data/saber.ts scripts/check-lore.ts
git commit -m "feat(saber): resolver continentes por slug de URL"
```

---

### Task 2: la página del panteón

**Files:**
- Create: `components/panteon/DeityCard.tsx`
- Create: `components/panteon/PanteonBrowser.tsx`
- Create: `app/panteon/page.tsx`
- Modify: `components/SiteNav.tsx`

- [ ] **Step 1: `DeityCard.tsx`**

```tsx
"use client";
import { useState } from "react";
import type { Deity } from "@/data/pantheon";

// Ficha de un dios. Plegada enseña lo que sabría cualquiera de vista —nombre,
// epíteto, esfera—; desplegada, todo lo que el libro de un templo diría de él.
export default function DeityCard({ deity, accent }: { deity: Deity; accent: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="panel-raised p-4" style={{ borderLeft: `3px solid ${accent}` }}>
      <button onClick={() => setOpen((v) => !v)} className="w-full text-left">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-display font-extrabold text-[16px]" style={{ color: "var(--color-parch)" }}>{deity.name}</p>
            <p className="font-ui text-[12px] italic" style={{ color: accent }}>{deity.epithet}</p>
          </div>
          <i className={`fas fa-chevron-${open ? "up" : "down"} text-[11px] mt-1 shrink-0`} style={{ color: "var(--color-dim)" }} />
        </div>
        <div className="flex items-center gap-2 flex-wrap mt-2">
          <span className="font-ui text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: accent, border: `1px solid ${accent}` }}>{deity.alignment}</span>
          <span className="font-ui text-[11px]" style={{ color: "var(--color-muted)" }}>{deity.province}</span>
        </div>
      </button>

      {open && (
        <div className="mt-3 pt-3 space-y-3" style={{ borderTop: "1px solid var(--color-line)" }}>
          <p className="prose-lore !text-[14px] !mb-0">{deity.blurb}</p>

          <Dato label="Dominios">{deity.domains.join(" · ")}</Dato>
          <Dato label="Símbolo sagrado">{deity.symbol}</Dato>
          {deity.holyDay && <Dato label="Día santo">{deity.holyDay.name} — {deity.holyDay.date}</Dato>}
          {deity.patron && <Dato label="Patrón de brujo">{deity.patron}</Dato>}

          <div>
            <p className="font-ui text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: "var(--color-dim)" }}>Preceptos</p>
            <ul className="space-y-1">
              {deity.commandments.map((c) => (
                <li key={c} className="prose-lore !text-[14px] !mb-0 flex gap-2">
                  <span style={{ color: accent }}>•</span>{c}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function Dato({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-ui text-[10px] font-bold uppercase tracking-wide mb-0.5" style={{ color: "var(--color-dim)" }}>{label}</p>
      <p className="font-ui text-[13px]" style={{ color: "var(--color-warm)" }}>{children}</p>
    </div>
  );
}
```

- [ ] **Step 2: `PanteonBrowser.tsx`**

```tsx
"use client";
import { useMemo, useState } from "react";
import { PRIME_DEITIES, BETRAYER_GODS, LESSER_IDOLS, type Deity, type DeitySide } from "@/data/pantheon";
import DeityCard from "./DeityCard";

// Los tres bandos, cada uno con su color: quién defendió el mundo, quién lo
// vendió, y quién nunca llegó a tener trono.
const BANDOS: { side: DeitySide; title: string; accent: string; icon: string; blurb: string; deities: Deity[] }[] = [
  {
    side: "prime",
    title: "Deidades Primarias",
    accent: "var(--color-divino)",
    icon: "fa-sun",
    blurb: "Los dioses que se pusieron delante de los mortales cuando los primordiales quisieron borrarlos. Ganaron la Calamidad y se marcharon del mundo por su propia mano.",
    deities: PRIME_DEITIES,
  },
  {
    side: "betrayer",
    title: "Dioses Traidores",
    accent: "var(--color-ember)",
    icon: "fa-skull",
    blurb: "Los que calcularon que el negocio estaba del lado de los titanes. Están desterrados, no muertos, y sus cultos siguen encontrando quien los escuche.",
    deities: BETRAYER_GODS,
  },
  {
    side: "idol",
    title: "Ídolos Menores",
    accent: "var(--color-violet)",
    icon: "fa-hand-sparkles",
    blurb: "Entidades sin trono en el panteón: archifeéricos, señores demonio, cosas viejas que duermen. No son dioses, pero conceden poder al que sabe pedirlo.",
    deities: LESSER_IDOLS,
  },
];

export default function PanteonBrowser() {
  const [q, setQ] = useState("");
  const [side, setSide] = useState<DeitySide | "all">("all");

  const bloques = useMemo(() => {
    const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    const needle = norm(q.trim());
    return BANDOS
      .filter((b) => side === "all" || b.side === side)
      .map((b) => ({
        ...b,
        deities: needle
          ? b.deities.filter((d) => norm(`${d.name} ${d.epithet} ${d.province}`).includes(needle))
          : b.deities,
      }))
      .filter((b) => b.deities.length > 0);
  }, [q, side]);

  const total = bloques.reduce((n, b) => n + b.deities.length, 0);

  return (
    <>
      <div className="flex items-center gap-3 flex-wrap mb-8">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre, epíteto o esfera…"
          className={inputCls}
        />
        {([["all", "Todos"], ["prime", "Primarias"], ["betrayer", "Traidores"], ["idol", "Ídolos"]] as const).map(([v, label]) => (
          <button
            key={v}
            onClick={() => setSide(v as DeitySide | "all")}
            className="btn-ghost !py-1 !px-2.5 text-[11px]"
            style={side === v ? { color: "var(--color-bronze-bright)", borderColor: "var(--color-bronze)" } : undefined}
          >
            {label}
          </button>
        ))}
        <span className="font-ui text-[12px]" style={{ color: "var(--color-dim)" }}>{total} de 33</span>
      </div>

      {bloques.length === 0 && (
        <p className="font-ui text-[13px] italic" style={{ color: "var(--color-dim)" }}>
          Ningún dios responde a ese nombre.
        </p>
      )}

      {bloques.map((b) => (
        <section key={b.side} className="mb-12">
          <h2 className="font-display text-xl font-extrabold flex items-center gap-3 mb-2" style={{ color: b.accent }}>
            <i className={`fas ${b.icon}`} /> {b.title}
            <span className="font-ui text-[12px] font-normal" style={{ color: "var(--color-dim)" }}>{b.deities.length}</span>
          </h2>
          <p className="prose-lore !text-[14px] mb-5 max-w-2xl">{b.blurb}</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {b.deities.map((d) => <DeityCard key={d.slug} deity={d} accent={b.accent} />)}
          </div>
        </section>
      ))}
    </>
  );
}
```

El repo **no** tiene clase `input-field` en `globals.css`: el patrón es una
constante local con las clases de Tailwind (ver `app/dm/CronicaPanel.tsx:25`).
Declara arriba del componente, antes de `export default`:

```ts
const inputCls = "bg-[var(--color-night)] rounded-lg px-3 py-1.5 font-ui text-[13px] outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)] transition-colors max-w-xs";
```

- [ ] **Step 3: `app/panteon/page.tsx`**

```tsx
import type { Metadata } from "next";
import PanteonBrowser from "@/components/panteon/PanteonBrowser";

export const metadata: Metadata = {
  title: "El Panteón de Exandria",
  description: "Los dioses de Exandria: Primarios, Traidores e Ídolos Menores, con sus esferas, símbolos y preceptos.",
};

// A diferencia de /reino, esta página NO va gateada por el saber: que los
// dioses existen y cómo se llaman no es secreto en Exandria. Es un catálogo de
// consulta, decidido así con el usuario (spec del 2026-07-21).
export default function PanteonPage() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-16">
      <header className="text-center mb-14 reveal">
        <p className="eyebrow mb-3">Compendio del mundo</p>
        <h1 className="font-display text-4xl md:text-5xl font-extrabold gold-text">El Panteón</h1>
        <p className="prose-lore lead max-w-2xl mx-auto mt-5">
          Treinta y tres nombres. Doce que defendieron el mundo, nueve que lo vendieron y doce que
          nunca tuvieron trono pero siguen repartiendo poder. Tras la Divergencia ninguno puede pisar
          Exandria: solo hablan a través de quien les reza.
        </p>
      </header>
      <PanteonBrowser />
    </main>
  );
}
```

- [ ] **Step 4: el botón del navbar**

En `components/SiteNav.tsx`, en `BASE_LINKS`, tras la entrada de «Reino»:

```ts
  { href: "/panteon", label: "Panteón" },
```

El menú móvil itera la misma lista, así que no hay que tocarlo.

- [ ] **Step 5: Verificar**

Run: `npx tsc --noEmit` → sin salida.
Run: `npx next build` → build limpio, con `/panteon` en la lista de rutas.

- [ ] **Step 6: Commit**

```bash
git add components/panteon app/panteon components/SiteNav.tsx
git commit -m "feat(panteon): pagina propia con los dioses separados por bando"
```

---

### Task 3: la página de continente

**Files:**
- Create: `components/reino/ContinenteGeografia.tsx`
- Create: `components/reino/ContinentePage.tsx`
- Create: `app/reino/[continente]/page.tsx`

- [ ] **Step 1: `ContinenteGeografia.tsx`**

```tsx
"use client";
import { useAtlas, regionsOf, poisOf } from "@/lib/useAtlas";
import { POI_ICON, POI_COLOR, type PoiType } from "@/data/pois";

// Geografía ABIERTA: las regiones y los lugares de un continente. Sale del
// atlas (no de data/world.ts) para que refleje lo que el DM haya editado.
// Los POIs van agrupados por tipo, que leído de corrido es más útil que una
// lista suelta de treinta nombres.
const ORDEN: PoiType[] = ["ciudad", "fortaleza", "ruina", "natural", "peligro"];
const TITULO: Record<string, string> = {
  ciudad: "Ciudades y aldeas",
  fortaleza: "Fortalezas",
  ruina: "Ruinas",
  natural: "Parajes",
  peligro: "Peligros",
};

export default function ContinenteGeografia({ continent, accent }: { continent: string; accent: string }) {
  const { atlas, ready } = useAtlas();
  const regiones = regionsOf(atlas, continent);

  if (!ready) return <p className="font-ui text-[13px]" style={{ color: "var(--color-dim)" }}>Cargando el atlas…</p>;
  if (!regiones.length) return <p className="font-ui text-[13px] italic" style={{ color: "var(--color-dim)" }}>Este continente aún no tiene regiones en el atlas.</p>;

  return (
    <div className="space-y-6">
      {regiones.map((r) => {
        const pois = poisOf(atlas, continent, r.slug);
        return (
          <div key={r.slug} className="panel p-5" style={{ borderLeft: `3px solid ${r.accent || accent}` }}>
            <h3 className="font-display text-lg font-extrabold mb-1" style={{ color: "var(--color-parch)" }}>{r.name}</h3>
            {r.blurb && <p className="prose-lore !text-[14px] mb-4">{r.blurb}</p>}

            {ORDEN.map((tipo) => {
              const suyos = pois.filter((p) => p.type === tipo);
              if (!suyos.length) return null;
              return (
                <div key={tipo} className="mb-3">
                  <p className="font-ui text-[10px] font-bold uppercase tracking-wide mb-1.5" style={{ color: "var(--color-dim)" }}>
                    {TITULO[tipo]}
                  </p>
                  <ul className="space-y-1.5">
                    {suyos.map((p) => (
                      <li key={p.name} className="flex gap-2">
                        <i className={`fas ${POI_ICON[p.type]} text-[11px] mt-1 shrink-0`} style={{ color: POI_COLOR[p.type] }} />
                        <span className="prose-lore !text-[14px] !mb-0">
                          <strong style={{ color: "var(--color-parch)" }}>{p.name}</strong>
                          {p.blurb ? ` — ${p.blurb}` : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
```

**Comprueba antes** los nombres reales de los exports de `data/pois.ts`
(`POI_ICON`/`POI_COLOR` y los valores de `PoiType`). Si difieren, ajusta el
import y el array `ORDEN`/`TITULO` a los tipos reales. **No inventes tipos.**

- [ ] **Step 2: `ContinentePage.tsx`**

```tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/components/SessionProvider";
import { loadActiveCharacter } from "@/lib/character";
import { useLoreRevealed } from "@/lib/useLoreRevealed";
import { SABER, CATEGORIES, PLACE_ACCENT, PLACE_ICON, type SaberPlace } from "@/data/saber";
import { WORLD_POIS } from "@/data/world";
import { knows, EMPTY_CTX, type SaberCtx } from "@/lib/saber";
import SaberCategory from "./SaberCategory";
import SaberCard from "./SaberCard";
import ContinenteGeografia from "./ContinenteGeografia";

// Categorías que se leen SIN candado en la página de un continente: geografía y
// costumbres se compran en cualquier puerto. Lo demás (historia profunda,
// potencias, fe, secretos) sigue el saber por origen.
const ABIERTAS: string[] = ["Geografía", "Vida y lenguas"];

export default function ContinentePage({ place }: { place: SaberPlace }) {
  const session = useSession();
  const isDm = session?.role === "dm";
  const { revealed, toggle, revealMany, hideMany } = useLoreRevealed();
  const [ctx, setCtx] = useState<SaberCtx>({ ...EMPTY_CTX });

  useEffect(() => {
    let on = true;
    (async () => {
      if (!session?.id) return;
      const c = isDm ? null : await loadActiveCharacter(session.id);
      if (!on) return;
      setCtx({
        isDm,
        originContinent: c?.origin_continent ?? null,
        originRegion: c?.origin_region ?? null,
        deity: c?.deity ?? null,
        cls: c?.cls ?? null,
        skills: c?.skills ?? [],
        unlocked: Array.isArray(c?.lore_unlocked) ? c!.lore_unlocked : [],
        revealed: [],
      });
    })();
    return () => { on = false; };
  }, [session?.id, isDm]);

  const full: SaberCtx = { ...ctx, isDm, revealed };
  const accent = PLACE_ACCENT[place];
  const suyas = SABER.filter((e) => e.place === place);
  const abiertas = suyas.filter((e) => ABIERTAS.includes(e.category));
  const cabecera = WORLD_POIS.find((p) => p.type === "continente" && p.continent === place);

  return (
    <main className="max-w-5xl mx-auto px-6 py-16">
      <Link href="/reino" className="font-ui text-[12px]" style={{ color: "var(--color-dim)" }}>← El Mundo de Exandria</Link>

      <header className="mb-12 mt-4 reveal">
        <div className="flex items-center gap-4">
          <i className={`fas ${PLACE_ICON[place]} text-3xl`} style={{ color: accent }} />
          <h1 className="font-display text-4xl md:text-5xl font-extrabold" style={{ color: "var(--color-parch)" }}>{place}</h1>
        </div>
        {cabecera && <p className="prose-lore lead max-w-3xl mt-4">{cabecera.blurb}</p>}
      </header>

      <section className="mb-16">
        <h2 className="font-display text-2xl font-bold mb-6 flex items-center gap-3" style={{ color: "var(--color-parch)" }}>
          <i className="fas fa-map" style={{ color: accent }} /> Geografía
        </h2>
        <ContinenteGeografia continent={place} accent={accent} />
      </section>

      {abiertas.length > 0 && (
        <section className="mb-16">
          <h2 className="font-display text-2xl font-bold mb-6 flex items-center gap-3" style={{ color: "var(--color-parch)" }}>
            <i className="fas fa-people-group" style={{ color: accent }} /> La tierra y su gente
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {abiertas.map((e) => (
              <SaberCard key={e.id} entry={e} open accent={accent} isDm={false} revealed={false} onToggle={() => {}} />
            ))}
          </div>
        </section>
      )}

      <section className="mb-20">
        <h2 className="font-display text-2xl font-bold mb-2 flex items-center gap-3" style={{ color: "var(--color-parch)" }}>
          <i className="fas fa-book-skull" style={{ color: accent }} /> Lo que hay que ganarse
        </h2>
        <p className="prose-lore !text-[14px] mb-6 max-w-2xl">
          Historia, potencias, fe y secretos de esta tierra. Se abren estudiando, viajando o
          descubriéndolos en la mesa.
        </p>
        {CATEGORIES.filter((c) => !ABIERTAS.includes(c)).map((c) => {
          const entries = suyas.filter((e) => e.category === c && (isDm || knows(e, full)));
          if (!entries.length) return null;
          return (
            <SaberCategory
              key={c}
              category={c}
              entries={entries}
              ctx={full}
              accent={accent}
              revealed={revealed}
              onToggle={toggle}
              onRevealMany={revealMany}
              onHideMany={hideMany}
              defaultOpen
            />
          );
        })}
      </section>
    </main>
  );
}
```

**Nota sobre `SaberCard` con `isDm={false}`** en la sección abierta: es
deliberado. Esas entradas se leen sin candado y **sin** el interruptor de revelar
del DM, porque no hay nada que revelar — ya las ve todo el mundo.

- [ ] **Step 3: `app/reino/[continente]/page.tsx`**

```tsx
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
```

**Aviso de Next 16**: `params` es una promesa y hay que esperarla. Si al
compilar la firma no cuadra, consulta `node_modules/next/dist/docs/` como manda
`AGENTS.md` — **no** improvises un tipo `any`.

- [ ] **Step 4: Verificar**

Run: `npx tsc --noEmit` → sin salida.
Run: `npx next build` → build limpio, con `/reino/[continente]` en la lista de rutas.

- [ ] **Step 5: Commit**

```bash
git add components/reino/ContinenteGeografia.tsx components/reino/ContinentePage.tsx app/reino
git commit -m "feat(reino): pagina propia por continente"
```

---

### Task 4: enlazar las páginas desde `/reino`

**Files:**
- Modify: `components/ReinoRegions.tsx`

- [ ] **Step 1: Implementar**

Cada tarjeta de continente pasa a ser un enlace a su página. El `continent` del
pin es el nombre canónico (`Dientes Rotos`), distinto del `name` del pin
(`Los Dientes Rotos`): **el slug se deriva de `c.continent`, no de `c.name`**.

Sustituir el `<div key={c.id} className="panel p-6" …>` por:

```tsx
            <Link
              key={c.id}
              href={continentBySlug(slugify(c.continent)) ? `/reino/${slugify(c.continent)}` : "/mapa"}
              className="panel p-6 block transition-transform hover:-translate-y-0.5"
              style={{ borderColor: "var(--color-line)" }}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ background: "var(--color-bronze)", boxShadow: "0 0 10px var(--color-bronze)" }} />
                <h3 className="font-display text-lg font-bold" style={{ color: "var(--color-bronze-bright)" }}>{c.name}</h3>
              </div>
              <p className="prose-lore !text-[15px] !mb-0">{c.blurb}</p>
              <p className="font-ui text-[11px] mt-3" style={{ color: "var(--color-dim)" }}>Leer sobre esta tierra →</p>
            </Link>
```

Añadir los imports `import { continentBySlug } from "@/data/saber";` y
`import { slugify } from "@/lib/slug";`.

> **De paso**: el punto de color usaba `var(--color-gold)`, que **no existe** en
> `globals.css` (el alias legacy es `--gold`), así que el punto salía sin fondo.
> Se cambia a `var(--color-bronze)`. Es una mejora en código que ya estamos
> tocando, no un refactor aparte.

- [ ] **Step 2: Verificar**

Run: `npx tsc --noEmit` → sin salida.
Run: `npx next build` → build limpio.

- [ ] **Step 3: Commit**

```bash
git add components/ReinoRegions.tsx
git commit -m "feat(reino): las tarjetas de continente llevan a su pagina"
```

---

### Task 5: gate final, documentación y merge

**Files:**
- Modify: `HANDOFF.md`

- [ ] **Step 1: Pasar el gate completo**

Run: `npx tsx scripts/check-lore.ts` → `Todo en verde` (69 comprobaciones).
Run: `npx tsc --noEmit` → sin salida.
Run: `npx next build` → build limpio.

- [ ] **Step 2: Prueba en vivo**

Levantar el preview y comprobar en el navegador: `/panteon` muestra los tres
bloques con sus colores, el buscador filtra, y una tarjeta se despliega con la
ficha entera; `/reino/marquet` muestra cabecera, geografía con regiones y POIs
agrupados, la sección abierta sin candados y la gateada con ellos; y las
tarjetas de `/reino` llevan a su página.

- [ ] **Step 3: Documentar**

Añadir a `HANDOFF.md`, encima del bloque RESUELTO más reciente, una sección
`## RESUELTO (2026-07-21): panteón propio y una página por continente 🕯️🗺️`
con: la ruta `/panteon` y su decisión de no gatearla (y su consecuencia), los
componentes nuevos, la ruta `/reino/[continente]` y el reparto abierto/gateado,
`continentBySlug`/`HABITADOS`, y la verificación. Actualizar el bloque de
arranque rápido.

- [ ] **Step 4: Commit y merge**

```bash
git add HANDOFF.md
git commit -m "docs(handoff): panteon propio y pagina por continente"
git checkout master
git merge --no-ff panteon-continentes
git push origin master
```

---

## Autorrevisión del plan

**Cobertura del spec:**

| Requisito del spec | Task |
|---|---|
| `continentBySlug` / `HABITADOS` | 1 |
| `/panteon` con tres bandos y color | 2 |
| Ficha completa por dios, desplegable | 2 |
| Buscador y filtro de bando | 2 |
| Botón «Panteón» en el navbar | 2 |
| `/reino/[continente]` + `generateStaticParams` + `notFound` | 3 |
| Geografía abierta desde el atlas | 3 |
| Sección abierta (Geografía + Vida y lenguas) | 3 |
| Sección gateada (resto de categorías) | 3 |
| Enlaces desde `ReinoRegions` respetando la niebla | 4 |
| Verificación y documentación | 5 |

**Consistencia de tipos:** `continentBySlug` devuelve `SaberPlace | null` en la
Task 1 y así se consume en las Tasks 3 y 4. `HABITADOS` es
`readonly SaberPlace[]` y se usa en `generateStaticParams`. `DeityCard` recibe
`{ deity: Deity; accent: string }` en la Task 2 y así lo llama `PanteonBrowser`.
`ContinenteGeografia` recibe `{ continent: string; accent: string }` y así lo
llama `ContinentePage`. `SaberCard` y `SaberCategory` se consumen con las firmas
que ya tienen desde la tanda anterior, sin modificarlas.

**Dos verificaciones que el implementador DEBE hacer antes de escribir**: que la
clase `input-field` existe (Task 2) y que los exports reales de `data/pois.ts`
son `POI_ICON`/`POI_COLOR` con esos valores de `PoiType` (Task 3). El plan lo
avisa en ambos sitios.
