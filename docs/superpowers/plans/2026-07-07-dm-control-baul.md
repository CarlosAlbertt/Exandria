# Control del DM (hoja bloqueada, dados de PG, Baúl) — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bloquear la hoja `/personaje` para jugadores (solo el DM edita, vía `?user=`), añadir tiradas de PG por nivel con dados, achicar el retrato, y añadir "El Baúl del Dungeon Master" para entregar objetos/oro a jugadores.

**Architecture:** Next.js 16 + React 19 + TS + Supabase. Escrituras del DM sobre hojas ajenas y entrega del baúl van por una ruta API con `service_role` (`/api/dm/character`) que verifica rol DM (patrón de `app/api/admin/users`). El baúl se guarda como JSON en `app_config` (patrón de `lib/useTaldorei.ts`). La hoja se extrae a `components/CharacterSheet.tsx` con `readOnly`/`saveMode`.

**Tech Stack:** TypeScript, React 19 client components, Supabase (`lib/supabase/{client,server}`, `lib/auth`, `lib/character`), Tailwind v4.

---

## Notas para el ejecutor

- **Rama:** `dm-control-baul` (ya creada). No cambies de rama.
- **Next 16** (`AGENTS.md`): ante dudas de API lee `node_modules/next/dist/docs/`. Rutas API = `route.ts` con `export async function POST`. Usa `useSearchParams` de `next/navigation` para `?user=`.
- **Sin test runner.** Verificación = `npx tsc --noEmit`, `npm run build`, `npm run lint` (sin errores nuevos; baseline ~22 en `lib/*`) + preview en **:3100** (el del usuario en :3000; no lo toques).
- **Commits:** autor configurado; termina cada mensaje con `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`. `git add` **solo los archivos de la tarea** (no `git add -A`).
- **Fuente de verdad:** `docs/superpowers/specs/2026-07-07-dm-control-baul-design.md`.
- **Patrones a imitar:** `app/api/admin/users/route.ts` (service_role + verificación DM), `lib/useTaldorei.ts` (app_config load/save/realtime), `app/personaje/page.tsx` y `components/LevelPanel.tsx` (estado y estilo actuales).

---

## Task 1: schema_v9 + `hp_rolls` en character.ts

**Files:** Create `supabase/schema_v9.sql`; Modify `lib/character.ts`.

- [ ] **Step 1: Migración**

`supabase/schema_v9.sql`:
```sql
-- v9: tiradas de PG por nivel.
alter table public.characters add column if not exists hp_rolls jsonb not null default '{}'::jsonb;
```

- [ ] **Step 2: Tipo + FIELDS**

En `lib/character.ts`: en `CharacterData` añade `hp_rolls: Record<string, number>;` (junto a `level`/`gold`). En `FIELDS` añade `hp_rolls` a la lista de columnas. No cambies `loadCharacter`/`saveCharacter` (el campo viaja como los demás).

- [ ] **Step 3: Verificar** `npx tsc --noEmit` → exit 0.

- [ ] **Step 4: Commit**
```bash
git add supabase/schema_v9.sql lib/character.ts
git commit -m "feat: schema_v9 (hp_rolls) + tipo en character

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Dados de PG (`data/leveling.ts`)

**Files:** Modify `data/leveling.ts`.

- [ ] **Step 1: Añadir funciones** al final de `data/leveling.ts`:

```ts
/** Tira un dado de PG (1..hitDie). */
export function rollHitDie(hitDie: number): number {
  return 1 + Math.floor(Math.random() * hitDie);
}

/**
 * PG máx a partir de las tiradas guardadas.
 * Nivel 1 = dado máx + CON. Niveles 2..N: (tirada guardada o media dado/2+1) + CON.
 * `rolls` = mapa nivel(str)→dado bruto (sin CON).
 */
export function maxHpFromRolls(hitDie: number, level: number, conMod: number, rolls: Record<string, number>): number {
  const l = Math.max(1, Math.min(20, level));
  let hp = hitDie + conMod;
  for (let lv = 2; lv <= l; lv++) {
    const raw = rolls[String(lv)];
    const base = typeof raw === "number" ? raw : Math.floor(hitDie / 2) + 1;
    hp += base + conMod;
  }
  return Math.max(1, hp);
}
```

- [ ] **Step 2: Verificar por lectura**: `rollHitDie(8)`∈[1,8]; `maxHpFromRolls(10,1,2,{})=12`; `maxHpFromRolls(10,2,2,{"2":8})=12+8+2=22`; `maxHpFromRolls(10,2,2,{})=12+(6+2)=20` (media). Luego `npx tsc --noEmit` → 0.

- [ ] **Step 3: Commit**
```bash
git add data/leveling.ts
git commit -m "feat: rollHitDie + maxHpFromRolls (dados de PG por nivel)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: LevelPanel — PG por nivel con dados + readOnly

**Files:** Modify `components/LevelPanel.tsx`.

Amplía `LevelPanel` (lee el archivo actual primero) para:
- Aceptar dos props nuevas: `hpRolls: Record<string, number>`, `onRollHp: (level: number, value: number) => void`, y `readOnly?: boolean`.
- Sustituir el cálculo de PG por `maxHpFromRolls(hitDie, level, abilityMod(conTotal), hpRolls)` (importa `maxHpFromRolls`, `rollHitDie` de `@/data/leveling`).
- Añadir, bajo la cabecera, una sección **"PG por nivel"**: nivel 1 = "máx (fijo)"; para cada nivel `lv` de 2..`level`, una fila con: etiqueta `Nivel lv`, el valor guardado `hpRolls[lv]` (o "— media" si falta), y un botón **"Tirar"** (`fa-dice-d20`) que llama `onRollHp(lv, rollHitDie(hitDie))`. Si `readOnly`, oculta los botones "Tirar" y el resto de steppers (nivel ±, ASI ±); muestra solo valores.
- En `readOnly`, deshabilita/oculta los botones `−`/`+` de nivel y de ASI (envuelve sus `onClick` para no hacer nada, o no los renderices; preferible no renderizar los botones y dejar el número).

Mantén `asiTotals` export y la lógica de hitos.

- [ ] **Step 1: Implementar** los cambios anteriores.
- [ ] **Step 2: Verificar** `npx tsc --noEmit` → 0; `npm run build` → 0.
- [ ] **Step 3: Commit**
```bash
git add components/LevelPanel.tsx
git commit -m "feat: LevelPanel con tiradas de PG por nivel y modo readOnly

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Extraer `components/CharacterSheet.tsx`

**Files:** Create `components/CharacterSheet.tsx`; Modify `app/personaje/page.tsx` (temporalmente para usarlo — se ajusta del todo en Task 6).

Objetivo: mover TODO el estado y la UI de `app/personaje/page.tsx` a un componente reutilizable, parametrizado por de quién es la hoja, si es solo lectura, y cómo guarda.

- [ ] **Step 1: Crear `CharacterSheet`** con esta firma y comportamiento:

```tsx
"use client";
// ...imports (los mismos que usa hoy app/personaje/page.tsx) + LevelPanel(onRollHp), maxHpFromRolls
type Props = {
  targetUserId: string | null; // de quién es la hoja (null = sin sesión, usa localStorage)
  readOnly: boolean;
  saveMode: "self" | "dm";     // self = saveCharacter propio; dm = POST /api/dm/character
};
export default function CharacterSheet({ targetUserId, readOnly, saveMode }: Props) { /* ... */ }
```

Traslada desde `app/personaje/page.tsx`:
- Todo el estado (`build`, `level`, `gold`, `asi`, `items`, `equipment`, `ac`, `pickingSlot`, `loaded`, `cat`, `custom`) y helpers (`removeOne`, `addBack`), derivados (`preAsi`, `totals`, `finalScores`, `mods`, `hitDie`, `hp`, `prof`, `cap`, `used`), handlers (`onLevel`, `onAsi`, `changeQty`, `addItem`, `setNotes`, `onSlotClick`, `equipInto`, `onItemClick`, `setGoldClamped`) y el JSX de paneles.
- Añade estado `hp_rolls` (`useState<Record<string,number>>({})`) cargado/guardado como los demás campos; handler `onRollHp(lv, val)` → `setHpRolls(r => ({ ...r, [String(lv)]: val }))`. Pasa `hpRolls`/`onRollHp` a `LevelPanel`.
- **Carga:** usa `targetUserId` en vez de `useSession().id` para `loadCharacter(targetUserId)`. Fallback a `localStorage` solo cuando `targetUserId` es null.
- **Guardado (adaptador):**

```ts
async function persistSheet(patch: Partial<CharacterData>) {
  if (readOnly || !targetUserId) return;
  if (saveMode === "self") { await saveCharacter(targetUserId, patch); return; }
  await fetch("/api/dm/character", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: targetUserId, patch }) });
}
```
El `useEffect` de autoguardado (debounce 700ms) llama `persistSheet({ level, gold, asi, items, equipment, hp_rolls })`. Si `readOnly`, no registra el efecto (o retorna al principio).
- **readOnly** se propaga: pasa `readOnly` a `LevelPanel`; oculta/deshabilita en los paneles los controles de edición (añadir objeto, ±cantidad, notas, equipar/retirar en `onSlotClick`, stepper de oro, CA input). En lectura, `onSlotClick` no hace nada y no se muestran los botones de añadir/±.
- **Imagen pequeña:** ver Task 6 (se ajusta el tamaño del retrato de identidad al integrar). Por ahora deja el `PortraitFrame` como está; Task 6 lo cambia.

- [ ] **Step 2: Adaptar `app/personaje/page.tsx`** temporalmente a un wrapper mínimo que use la hoja propia editable (para no romper build): 

```tsx
"use client";
import { useSession } from "@/components/SessionProvider";
import CharacterSheet from "@/components/CharacterSheet";
export default function PersonajePage() {
  const session = useSession();
  return <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12"><CharacterSheet targetUserId={session?.id ?? null} readOnly={false} saveMode="self" /></main>;
}
```
(La lógica fina de permisos/`?user=`/imagen va en Task 6.)

- [ ] **Step 3: Verificar** `npx tsc --noEmit` → 0; `npm run build` → 0. Preview en :3100 `/personaje` sigue funcionando como antes (crear, nivel, equipar). 
- [ ] **Step 4: Commit**
```bash
git add components/CharacterSheet.tsx app/personaje/page.tsx
git commit -m "refactor: extraer CharacterSheet (readOnly/saveMode) desde /personaje

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: API `app/api/dm/character/route.ts`

**Files:** Create `app/api/dm/character/route.ts`.

- [ ] **Step 1: Crear la ruta** (imita `app/api/admin/users/route.ts`):

```ts
import { createClient, createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Item = { id: string; name: string; qty: number; notes?: string };

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "No autenticado." }, { status: 401 });
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "dm") return Response.json({ error: "Solo el DM." }, { status: 403 });
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return Response.json({ error: "Falta SUPABASE_SERVICE_ROLE_KEY." }, { status: 500 });

  let body: { userId?: string; patch?: Record<string, unknown> };
  try { body = await req.json(); } catch { return Response.json({ error: "Petición inválida." }, { status: 400 }); }
  const userId = body.userId;
  const patch = body.patch ?? {};
  if (!userId) return Response.json({ error: "Falta userId." }, { status: 400 });

  const admin = createAdminClient();
  const { addItems, addGold, ...direct } = patch as { addItems?: Item[]; addGold?: number } & Record<string, unknown>;
  const update: Record<string, unknown> = { ...direct };

  if (Array.isArray(addItems) || typeof addGold === "number") {
    const { data: row } = await admin.from("characters").select("items, gold").eq("user_id", userId).maybeSingle();
    const items: Item[] = Array.isArray(row?.items) ? [...(row!.items as Item[])] : [];
    if (Array.isArray(addItems)) {
      for (const it of addItems) {
        const ex = items.find((x) => x.name === it.name);
        if (ex) ex.qty += it.qty ?? 1;
        else items.push({ id: crypto.randomUUID(), name: it.name, qty: it.qty ?? 1, notes: it.notes });
      }
      update.items = items;
    }
    if (typeof addGold === "number") update.gold = ((row?.gold as number) ?? 0) + addGold;
  }

  update.updated_at = new Date().toISOString();
  const { error } = await admin.from("characters").update(update).eq("user_id", userId);
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ ok: true });
}
```

Nota: comprueba que `lib/supabase/server` exporta `createAdminClient` (lo usa la ruta de admin). Si el nombre difiere, úsalo tal cual esté ahí.

- [ ] **Step 2: Verificar** `npx tsc --noEmit` → 0; `npm run build` → 0 (la ruta compila).
- [ ] **Step 3: Commit**
```bash
git add app/api/dm/character/route.ts
git commit -m "feat: API DM service_role para editar/entregar en hojas ajenas

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: `/personaje` — permisos, `?user=`, imagen pequeña

**Files:** Modify `app/personaje/page.tsx`, `components/CharacterSheet.tsx`.

- [ ] **Step 1: Permisos y `?user=`** en `app/personaje/page.tsx`:

```tsx
"use client";
import { useSearchParams } from "next/navigation";
import { useSession } from "@/components/SessionProvider";
import CharacterSheet from "@/components/CharacterSheet";

export default function PersonajePage() {
  const session = useSession();
  const role = session?.role ?? "player";
  const params = useSearchParams();
  const wantUser = params.get("user");
  // DM editando la hoja de otro jugador
  if (role === "dm" && wantUser) {
    return <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12"><CharacterSheet targetUserId={wantUser} readOnly={false} saveMode="dm" /></main>;
  }
  // Hoja propia: editable solo si eres DM; jugador = solo lectura
  return <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12"><CharacterSheet targetUserId={session?.id ?? null} readOnly={role !== "dm"} saveMode="self" /></main>;
}
```

Comprueba cómo expone el rol `components/SessionProvider.tsx` (hay `useSession()`; si el rol se obtiene con otro hook, úsalo). `useSearchParams` requiere que la página esté bajo un `Suspense` en algunos casos de Next 16 — si el build se queja, envuelve el contenido en `<Suspense>` o marca la ruta como dinámica según indique `node_modules/next/dist/docs/`.

- [ ] **Step 2: Imagen pequeña** en `components/CharacterSheet.tsx`: el `PortraitFrame` del panel de **identidad** pasa de `size="lg"` a un tamaño compacto. Añade en `components/PortraitFrame.tsx` un tamaño `md` (o usa un contenedor de ~80px). En `PortraitFrame.tsx`, en el tipo `size` añade `"md"` y en el CSS (`app/globals.css`) añade `.portrait-md { width: 84px; height: 84px; }`. Usa `size="md"` en la identidad. El muñeco (`Paperdoll`) conserva su `PortraitFrame size="lg"`.

- [ ] **Step 3: Verificar** `npx tsc --noEmit` → 0; `npm run build` → 0. Preview :3100:
  - `/personaje` como jugador (rol player) → sin botones de edición (nivel/ASI/oro/objetos/equipar bloqueados), retrato pequeño.
  - `/personaje?user=<id>` como DM → editable; tirar PG cambia el total.
  (Para forzar rol en local: según `SessionProvider`; si no hay sesión, `targetUserId` null usa localStorage y `readOnly` = player.)

- [ ] **Step 4: Commit**
```bash
git add app/personaje/page.tsx components/CharacterSheet.tsx components/PortraitFrame.tsx app/globals.css
git commit -m "feat: /personaje solo-lectura para jugadores, edición DM por ?user=, retrato compacto

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 7: El Baúl del DM

**Files:** Create `lib/useDmStash.ts`, `app/dm/BaulPanel.tsx`; Modify `app/dm/DmDashboard.tsx`, `app/dm/GrupoPanel.tsx`.

- [ ] **Step 1: Hook `lib/useDmStash.ts`** (imita `lib/useTaldorei.ts`): carga/guarda `StashEntry[]` en `app_config` key `"dm_stash"` con realtime.

```ts
"use client";
import { useEffect, useState } from "react";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";

export type StashType = "magico" | "normal" | "oro";
export type StashEntry = { id: string; name: string; type: StashType; qty: number; notes?: string };
const KEY = "dm_stash";

export async function saveStash(entries: StashEntry[]) {
  if (!supabaseConfigured) return;
  await createClient().from("app_config").upsert({ key: KEY, value: JSON.stringify(entries), updated_at: new Date().toISOString() });
}

export function useDmStash() {
  const [stash, setStash] = useState<StashEntry[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!supabaseConfigured) { setReady(true); return; }
    const supabase = createClient(); let mounted = true;
    const load = async () => {
      const { data } = await supabase.from("app_config").select("value").eq("key", KEY).maybeSingle();
      if (!mounted) return;
      try { setStash(data?.value ? JSON.parse(data.value as string) : []); } catch { setStash([]); }
      setReady(true);
    };
    load();
    const ch = supabase.channel("dm_stash_rt").on("postgres_changes", { event: "*", schema: "public", table: "app_config", filter: `key=eq.${KEY}` }, () => load()).subscribe();
    return () => { mounted = false; supabase.removeChannel(ch); };
  }, []);
  return { stash, ready };
}
```

(Verifica la forma exacta de `supabase.from(...).select(...).maybeSingle()` y del canal contra `lib/useTaldorei.ts`; ajústalo si difiere.)

- [ ] **Step 2: `app/dm/BaulPanel.tsx`** — panel con:
  - `useDmStash()` + `useParty()` (excluye DM; ya lo hace `useParty`).
  - **Añadir entrada**: inputs nombre, chips tipo (`magico`/`normal`/`oro`), cantidad, notas; botón "Añadir" → `saveStash([...stash, { id: crypto.randomUUID(), name, type, qty, notes }])`.
  - **Lista** de entradas (nombre, tipo, cantidad, notas) con borrar (`saveStash(stash.filter(...))`).
  - **Entregar**: por entrada, checkboxes de jugadores (de `party`, con `user_id`) + checkbox "quitar del baúl al entregar" + botón "Entregar" → por cada jugador seleccionado:
    - `oro`: `fetch("/api/dm/character", { method:"POST", body: JSON.stringify({ userId, patch: { addGold: qty } }) })`.
    - objeto: `... patch: { addItems: [{ name, qty, notes }] } ...`.
    - si "quitar al entregar": `saveStash(stash.filter(e => e.id !== entry.id))` tras entregar.
  - Usa clases del tema (`panel`, `panel-raised`, `chip`, `btn-gold`, `btn-ghost`, `eyebrow`, `stat-btn`).

- [ ] **Step 3: Pestaña en `DmDashboard`** — en `app/dm/DmDashboard.tsx`: `type Tab` += `"baul"`; añade `["baul", "Baúl", "fa-box-archive"]` al array de pestañas; import `BaulPanel`; `{tab === "baul" && <BaulPanel />}`.

- [ ] **Step 4: Botón "Editar hoja" en `GrupoPanel`** — en `app/dm/GrupoPanel.tsx`, por cada miembro del grupo, un enlace `Link href={\`/personaje?user=${m.user_id}\`}` con clase `btn-ghost` y texto "Editar hoja" (icono `fa-pen-to-square`). (Importa `Link` de `next/link` si falta.)

- [ ] **Step 5: Verificar** `npx tsc --noEmit` → 0; `npm run build` → 0. Preview :3100 (como DM si es posible; si no, al menos que el panel Baúl renderice el formulario y la lista sin errores de consola). `preview_console_logs` sin errores.

- [ ] **Step 6: Commit**
```bash
git add lib/useDmStash.ts app/dm/BaulPanel.tsx app/dm/DmDashboard.tsx app/dm/GrupoPanel.tsx
git commit -m "feat: El Baúl del Dungeon Master (stash en app_config + entrega a jugadores)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 8: Verificación final + HANDOFF

**Files:** Modify `HANDOFF.md`.

- [ ] **Step 1: Puertas** `npx tsc --noEmit` → 0; `npm run lint` → sin errores nuevos; `npm run build` → 0 (`/personaje`, `/api/dm/character` y `/dm` presentes).
- [ ] **Step 2: Repaso visual** (:3100): hoja jugador solo-lectura, `?user=` editable, tirar PG, retrato pequeño, pestaña Baúl (añadir/entregar). Screenshots. Consola sin errores.
- [ ] **Step 3: HANDOFF** — bloque nuevo bajo "RESUELTO": hoja bloqueada para jugadores + edición DM por `?user=`, dados de PG, y El Baúl del DM. **PENDIENTE del usuario: ejecutar `supabase/schema_v9.sql`**. Requiere `SUPABASE_SERVICE_ROLE_KEY` en el servidor (ya lo usa la creación de usuarios).
- [ ] **Step 4: Commit**
```bash
git add HANDOFF.md
git commit -m "docs: HANDOFF — control DM (hoja bloqueada, dados de PG, Baúl)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Cobertura del spec (autorrevisión)

- §1 schema_v9/hp_rolls → Task 1. §2 dados → Task 2 + Task 3 (UI). §3 CharacterSheet → Task 4. §4 permisos/`?user=`/imagen → Task 6. §5 API service_role → Task 5. §6 Baúl → Task 7. §7 botón Editar hoja → Task 7 Step 4. §8 archivos → Tasks. §9 verificación → Tasks + Task 8.
- Consistencia: `hp_rolls` (Task 1) usado en `maxHpFromRolls` (Task 2), `LevelPanel`/`CharacterSheet` (Tasks 3,4); `CharacterSheet` props `targetUserId/readOnly/saveMode` (Task 4) usados en `/personaje` (Task 6); `/api/dm/character` `{ userId, patch:{ addItems?, addGold?, ...direct } }` (Task 5) llamado igual desde `CharacterSheet.persistSheet` y `BaulPanel` (Tasks 4,7); `StashEntry`/`useDmStash` (Task 7).
```
