# Fase L — Control de acceso por rol 🔒

**Fecha**: 2026-07-17
**Estado**: diseño aprobado, pendiente de plan

## Objetivo

Una sola app "separada pero conjunta": el jugador solo ve lo suyo; el DM lo ve y
lo controla todo. El gating es **en servidor** (redirect), no solo ocultar
botones en el nav.

En la práctica, casi todas las superficies ya están gateadas (`/dm`, las APIs de
DM/admin). El único hueco real es **`/narrador`**, hoy accesible a cualquier
usuario logueado. Esta fase lo cierra y deja documentada la regla de acceso por
rol para las rutas futuras.

## Decisión de producto

`/narrador` es hoy un **narrador IA personal del jugador** (usa el build del
personaje como contexto: "Hablando como \<personaje\>"). Se cierra a **DM-only**
siguiendo la guía. Los jugadores pierden esa herramienta; su chat IA sigue
disponible en la **Taberna** (`/taberna`, NPC Garda vía `/api/ia`), que no se
toca. Decisión confirmada por el usuario el 2026-07-17.

## Cambios

### 1. Gatear `/narrador` en servidor

`app/narrador/page.tsx` es hoy un **client component** (`"use client"`), así que
no puede llamar `getSessionProfile()` (server-only). Se parte en dos, igual que
`/dm` → `DmDashboard`:

- **`app/narrador/page.tsx`** pasa a **server component**:
  ```ts
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
- **`app/narrador/NarradorClient.tsx`** (nuevo): el contenido cliente actual tal
  cual (`"use client"` + toda la lógica de chat/modelo/localStorage). Sin cambios
  de comportamiento; solo se muda de archivo y se exporta como `NarradorClient`.

El gate real es de servidor: un jugador que navegue a `/narrador` recibe
`redirect("/")` antes de que se renderice nada del cliente.

### 2. `SiteNav` — sacar `/narrador` del nav de jugador

Hoy `/narrador` está en `BASE_LINKS` (visible a todos). Se mueve a los enlaces
DM-only, junto a `/dm`:

```ts
// BASE_LINKS: quitar la entrada { href: "/narrador", label: "Narrador" }
const DM_LINKS = [
  { href: "/narrador", label: "Narrador" },
  { href: "/dm", label: "Panel DM" },
];
const links = role === "dm" ? [...BASE_LINKS, ...DM_LINKS] : BASE_LINKS;
```

`SiteNav` ya recibe `role`, así que no hace falta más fontanería. Ocultar el
enlace es cosmético; la garantía es el redirect de servidor del punto 1.

### 3. Auditoría de superficies

Tabla de acceso por rol (regla nueva: **toda ruta que se cree declara aquí su
rol**). Se verifica que lo marcado como "ya gateado" sigue siéndolo; no se espera
cambio de código en esas filas.

| Superficie | Jugador | DM | Estado |
|---|---|---|---|
| `/`, `/reino`, `/crear`, `/personaje`, `/mapa`, `/taberna`, `/cronica`, `/bestiario` | ✅ | ✅ | sin gate (correcto) |
| `/inventario` (redirige a `/personaje`) | ✅ | ✅ | sin gate (correcto) |
| `/narrador` | ❌ | ✅ | **se cierra en esta fase** |
| `/dm` | ❌ | ✅ | ya gateado (`app/dm/page.tsx`) |
| `/api/dm/character`, `/api/admin/users` | ❌ | ✅ | ya verifican DM / service_role |
| `/api/ia` | ✅ autenticado | ✅ | **se queda así** (Taberna/NPCs lo usan) |

## Fuera de alcance (YAGNI)

- **No** gatear `/api/ia`: la Taberna (jugadores) lo usa; cerrarlo rompería el
  chat de NPC. La guía lo mantiene como "autenticado".
- **No** tocar RLS. La nota conocida de `dm_notes` legible por consola de un
  jugador sigue aceptada (juego de confianza; ver HANDOFF milestone 2026-07-10).
- **No** tocar los otros 2 clones del repo en disco (`Downloads\exandria-repo`,
  `C:\Users\carlo\Exandria`). Limpieza aparte, decisión del usuario.

## Verificación

- `npx tsc --noEmit` y `next build` limpios.
- Navegador: `/narrador` **sin sesión** redirige a `/login`.
- El nav de jugador **no** muestra "Narrador"; el nav de DM sí.
- Prueba de rol jugador logueado → `/narrador` redirige a `/` — **requiere
  sesión de jugador, solo el usuario puede ejercitarla** (sin credenciales
  Supabase en dev).
- Sin migración de Supabase.

> ⚠️ Al verificar en navegador: si se edita `proxy.ts`, arrancar el dev server
> **después** del cambio (Next 16 no recoge el matcher en caliente). En esta
> fase no se toca `proxy.ts`, pero la trampa aplica si se necesitara.
