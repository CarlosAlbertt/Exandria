# Fase L — Control de acceso por rol · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cerrar `/narrador` a DM-only con gate de servidor y sacarlo del nav de jugador, dejando la regla de acceso por rol documentada.

**Architecture:** `/narrador` es hoy un client component sin gate. Se parte en un server component que comprueba el rol (`getSessionProfile()` → `redirect`) y un client component con la lógica de chat intacta, igual que `/dm` → `DmDashboard`. `SiteNav` mueve el enlace a la lista DM-only.

**Tech Stack:** Next.js 16 (App Router, server/client components), TypeScript, Supabase Auth (`lib/auth.ts`).

**Verificación** (este repo no tiene framework de tests unitarios): los gates reales son `npx tsc --noEmit`, `next build`, y comprobación en navegador del redirect. Se usan esos en vez de TDD.

**Spec:** `docs/superpowers/specs/2026-07-17-fase-l-acceso-por-rol-design.md`

---

### Task 1: Partir `/narrador` en gate de servidor + cliente

**Files:**
- Create: `app/narrador/NarradorClient.tsx`
- Modify (rewrite): `app/narrador/page.tsx`

Referencia del patrón: `app/dm/page.tsx` (server gate) + `app/dm/DmDashboard.tsx` (cliente).

- [ ] **Step 1: Crear `app/narrador/NarradorClient.tsx` con el contenido cliente actual**

Copiar **íntegro** el contenido actual de `app/narrador/page.tsx` a
`app/narrador/NarradorClient.tsx`, cambiando **solo** el nombre del componente
exportado de `NarradorPage` a `NarradorClient`. Mantiene `"use client"` en la
primera línea y toda la lógica (estado, `send()`, modelos, localStorage, JSX) sin
tocar. Cabecera resultante:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { narrar } from "@/lib/narrador";
import { getSpecies } from "@/data/species";
import { getClass } from "@/data/classes";

const BUILD_KEY = "taldorei.build.v1";
const MODEL_KEY = "taldorei.model";
type Msg = { role: "user" | "assistant"; content: string };

const MODELS = [
  { id: "qwen2.5:14b", label: "Qwen 2.5 14B — mejor español (recomendado)" },
  { id: "gpt-oss:20b", label: "GPT-OSS 20B — el más potente (más lento)" },
  { id: "mistral-nemo", label: "Mistral Nemo 12B — narrativo" },
  { id: "llama3.1:8b", label: "Llama 3.1 8B — rápido y ligero" },
  { id: "llama3.2", label: "Llama 3.2 — el más rápido" },
];

export default function NarradorClient() {
  // ...resto idéntico al cuerpo actual de NarradorPage...
}
```

> El cuerpo (líneas 21–138 del `page.tsx` actual) va tal cual. No se cambia
> ninguna línea de lógica ni de JSX; solo el nombre de la función.

- [ ] **Step 2: Reescribir `app/narrador/page.tsx` como server component con gate**

Reemplazar el archivo entero por:

```tsx
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
```

- [ ] **Step 3: Verificar tipos y build**

Run: `npx tsc --noEmit`
Expected: sin errores.

Run: `next build`
Expected: build limpio; `/narrador` compila como ruta dinámica (usa
`getSessionProfile`, que lee cookies).

- [ ] **Step 4: Commit**

```bash
git add app/narrador/page.tsx app/narrador/NarradorClient.tsx
git commit -m "feat(acceso): /narrador pasa a DM-only con gate de servidor"
```

---

### Task 2: Sacar `/narrador` del nav de jugador en `SiteNav`

**Files:**
- Modify: `components/SiteNav.tsx:11-28`

- [ ] **Step 1: Quitar `/narrador` de `BASE_LINKS`**

En `components/SiteNav.tsx`, borrar la línea del array `BASE_LINKS`:

```tsx
  { href: "/narrador", label: "Narrador" },
```

`BASE_LINKS` queda: Inicio, Reino, Crónica, Bestiario, Crear, Inventario, Mapa.

- [ ] **Step 2: Añadir `DM_LINKS` y componer `links`**

Reemplazar la línea actual:

```tsx
  const links = role === "dm" ? [...BASE_LINKS, { href: "/dm", label: "Panel DM" }] : BASE_LINKS;
```

por:

```tsx
  const DM_LINKS = [
    { href: "/narrador", label: "Narrador" },
    { href: "/dm", label: "Panel DM" },
  ];
  const links = role === "dm" ? [...BASE_LINKS, ...DM_LINKS] : BASE_LINKS;
```

Así el DM ve Narrador + Panel DM al final; el jugador no ve ninguno de los dos.

- [ ] **Step 3: Verificar tipos y build**

Run: `npx tsc --noEmit`
Expected: sin errores.

Run: `next build`
Expected: build limpio.

- [ ] **Step 4: Commit**

```bash
git add components/SiteNav.tsx
git commit -m "feat(acceso): Narrador fuera del nav de jugador (solo DM)"
```

---

### Task 3: Verificación en navegador + documentación

**Files:**
- Modify: `HANDOFF.md` (añadir milestone Fase L)
- Modify: `C:\Users\carlo\Desktop\Exandria-Obsidian\Exandria\00 Meta\Historial de desarrollo.md` (hito)
- Modify: `C:\Users\carlo\Desktop\Exandria-Obsidian\Exandria\00 Meta\Pendientes.md` (marcar L hecha / auditoría)

- [ ] **Step 1: Arrancar dev server y comprobar redirect sin sesión**

Arrancar el dev server (`preview_start` con la config del proyecto). En el
navegador, navegar a `/narrador` **sin sesión iniciada**.
Expected: redirige a `/login` (gate de servidor, no render del cliente).

> No se toca `proxy.ts` en esta fase, así que no aplica la trampa del matcher en
> caliente; aun así, si se hubiera tocado, reiniciar el server tras el cambio.

- [ ] **Step 2: Comprobar el nav (sesión de jugador — solo el usuario puede)**

Con sesión de **jugador**: el nav **no** muestra "Narrador"; navegar a mano a
`/narrador` redirige a `/`. Con sesión de **DM**: el nav muestra "Narrador" y
"Panel DM", y `/narrador` abre.

> Requiere credenciales Supabase / sesión real, no disponibles en dev. Anotar
> como pendiente de prueba del usuario; el redirect sin sesión (Step 1) sí se
> verifica aquí.

- [ ] **Step 3: Actualizar `HANDOFF.md`**

Añadir un milestone `## RESUELTO (2026-07-17): Fase L — control de acceso por
rol 🔒` describiendo: `/narrador` cerrado a DM-only (server gate + fuera del nav),
auditoría de superficies (tabla de la spec), `/api/ia` intacto, sin migración.
Anotar la prueba pendiente del usuario (rol jugador logueado → redirect).

- [ ] **Step 4: Actualizar el vault de Obsidian**

En `Historial de desarrollo.md`: añadir el hito `[!success]` de Fase L.
En `Pendientes.md`: marcar Fase L como hecha en la hoja de ruta y añadir la
prueba en vivo pendiente (rol jugador → `/narrador` redirige). Enlazar a la nota
de funcionalidad si existe.

- [ ] **Step 5: Commit de documentación del repo**

```bash
git add HANDOFF.md docs/superpowers/specs/2026-07-17-fase-l-acceso-por-rol-design.md docs/superpowers/plans/2026-07-17-fase-l-acceso-por-rol.md
git commit -m "docs(acceso): milestone Fase L y spec/plan"
```

> El vault de Obsidian está fuera del repo git; sus cambios no entran en el
> commit.

---

## Self-Review

- **Cobertura del spec**: (1) gate servidor `/narrador` → Task 1. (2) `SiteNav`
  fuera del nav de jugador → Task 2. (3) auditoría de superficies → documentada
  en la spec + milestone (Task 3); el resto ya estaba gateado, sin cambio de
  código como dice el spec. (4) `/api/ia` intacto → explícito, no se toca.
  (5) verificación tsc/build/navegador + sin migración → Task 1/2/3. Sin huecos.
- **Placeholders**: el cuerpo del cliente se copia íntegro (Task 1 Step 1 remite
  a las líneas exactas para no duplicar 120 líneas de JSX que no cambian —
  aceptable porque es copia literal, no lógica nueva). Resto con código completo.
- **Consistencia de tipos**: `getSessionProfile()` → `SessionProfile | null` con
  `.role: "dm" | "player"` (de `lib/auth.ts`), usado igual que en `app/dm/
  page.tsx`. Componente `NarradorClient` default export, importado como tal.
