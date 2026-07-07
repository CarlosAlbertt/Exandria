# Nivel / XP por el DM — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** El DM gestiona XP y nivel de los jugadores desde el panel Grupo (individual y a todo el grupo); el nivel sube al cruzar umbral de XP; el jugador puede tirar su propia vida (única excepción a la hoja bloqueada).

**Architecture:** Next.js 16 + React 19 + TS + Supabase. XP en `characters.xp` (schema_v10). Progresión en `data/leveling.ts` (tabla 2024). El DM escribe vía la API `service_role` existente `/api/dm/character` (ampliada con `setLevel`/`addXp`). El jugador escribe solo `hp_rolls` en su propia fila (RLS lo permite).

**Tech Stack:** TypeScript, React 19 client components, Supabase (`lib/character`, `lib/supabase/server`), Tailwind v4.

---

## Notas para el ejecutor

- **Rama:** `dm-nivel-xp` (ya creada). No cambies de rama.
- **Next 16** (`AGENTS.md`): ante dudas de API lee `node_modules/next/dist/docs/`.
- **Sin test runner.** Verificación = `npx tsc --noEmit`, `npm run build`, `npm run lint` (sin errores nuevos; baseline ~22 en `lib/*` — nota: los hooks de `app_config`/realtime tienen `set-state-in-effect` por convención del repo, no es nuevo) + preview en **:3100** (el del usuario en :3000; no lo toques).
- **Commits:** autor configurado; termina con `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`. `git add` **solo los archivos de la tarea** (no `-A`; evita `next-env.d.ts`).
- **Fuente de verdad:** `docs/superpowers/specs/2026-07-07-dm-nivel-xp-design.md`.
- **Patrones:** `app/api/dm/character/route.ts` (ya soporta `addItems`/`addGold`), `components/LevelPanel.tsx` y `components/CharacterSheet.tsx` (estado actual), `app/dm/GrupoPanel.tsx` (lista de party).

---

## Task 1: schema_v10 + `xp` en character.ts

**Files:** Create `supabase/schema_v10.sql`; Modify `lib/character.ts`.

- [ ] **Step 1:** `supabase/schema_v10.sql`:
```sql
-- v10: puntos de experiencia.
alter table public.characters add column if not exists xp int not null default 0;
```

- [ ] **Step 2:** En `lib/character.ts`, añade `xp: number;` a `CharacterData` (junto a `level`/`gold`) y añade `xp` a la cadena `FIELDS`.

- [ ] **Step 3:** `npx tsc --noEmit` → exit 0.

- [ ] **Step 4:** Commit:
```bash
git add supabase/schema_v10.sql lib/character.ts
git commit -m "feat: schema_v10 (xp) + tipo en character

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Tabla XP en `data/leveling.ts`

**Files:** Modify `data/leveling.ts`.

- [ ] **Step 1:** Añade al final de `data/leveling.ts`:
```ts
/** XP mínima acumulada para cada nivel (1..20), D&D 2024. Índice = nivel. */
export const XP_THRESHOLDS = [
  0, 0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000,
  85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000,
];

/** Nivel (1..20) derivado de la XP acumulada. */
export function levelFromXp(xp: number): number {
  let lvl = 1;
  for (let l = 2; l <= 20; l++) if (xp >= XP_THRESHOLDS[l]) lvl = l;
  return lvl;
}

/** XP mínima del siguiente nivel (o la del 20 si ya es 20). Para la barra. */
export function xpForNext(level: number): number {
  return XP_THRESHOLDS[Math.min(20, level + 1)];
}
```

- [ ] **Step 2:** Verifica por lectura: `levelFromXp(0)=1`, `levelFromXp(300)=2`, `levelFromXp(2699)=2`, `levelFromXp(2700)=4`? No: 2700 es el umbral del nivel 4 en la tabla 2024 (nivel 3=900, nivel 4=2700). `levelFromXp(2700)=4`, `levelFromXp(6499)=4`, `levelFromXp(355000)=20`. `xpForNext(1)=300`, `xpForNext(20)=355000`. Luego `npx tsc --noEmit` → 0.

- [ ] **Step 3:** Commit:
```bash
git add data/leveling.ts
git commit -m "feat: tabla de XP 2024 (levelFromXp, xpForNext)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: API `/api/dm/character` — `setLevel` + `addXp`

**Files:** Modify `app/api/dm/character/route.ts`.

Lee el archivo actual. Ya extrae `{ addItems, addGold, ...direct }` del `patch` y construye `update`. Añade el manejo de `setLevel` y `addXp` **antes** de aplicar `update`.

- [ ] **Step 1:** Importa `levelFromXp` arriba: `import { levelFromXp } from "@/data/leveling";` (además del import existente de `@/lib/supabase/server`).

- [ ] **Step 2:** Cambia la desestructuración a incluir los nuevos modos y añade la lógica. Sustituye el bloque que hoy hace `const { addItems, addGold, ...direct } = ...` y el `if (Array.isArray(addItems) || typeof addGold === "number")` por:

```ts
  const { addItems, addGold, setLevel, addXp, ...direct } = patch as {
    addItems?: Item[]; addGold?: number; setLevel?: number; addXp?: number;
  } & Record<string, unknown>;
  const update: Record<string, unknown> = { ...direct };

  if (typeof setLevel === "number") {
    update.level = Math.max(1, Math.min(20, Math.floor(setLevel)));
  }

  if (Array.isArray(addItems) || typeof addGold === "number" || typeof addXp === "number") {
    const { data: row } = await admin.from("characters").select("items, gold, xp, level").eq("user_id", userId).maybeSingle();
    if (Array.isArray(addItems)) {
      const items: Item[] = Array.isArray(row?.items) ? [...(row!.items as Item[])] : [];
      for (const it of addItems) {
        const ex = items.find((x) => x.name === it.name);
        if (ex) ex.qty += it.qty ?? 1;
        else items.push({ id: crypto.randomUUID(), name: it.name, qty: it.qty ?? 1, notes: it.notes });
      }
      update.items = items;
    }
    if (typeof addGold === "number") update.gold = ((row?.gold as number) ?? 0) + addGold;
    if (typeof addXp === "number") {
      const newXp = Math.max(0, ((row?.xp as number) ?? 0) + addXp);
      update.xp = newXp;
      update.level = Math.max((row?.level as number) ?? 1, levelFromXp(newXp));
    }
  }
```

(Deja intactos: verificación de rol DM, `createAdminClient`, el `update.updated_at`, el `.update(update).eq("user_id", userId)` final y el `type Item`.)

- [ ] **Step 3:** `npx tsc --noEmit` → 0; `npm run build` → 0.

- [ ] **Step 4:** Commit:
```bash
git add app/api/dm/character/route.ts
git commit -m "feat: API DM soporta setLevel y addXp (nivel deriva de XP)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: LevelPanel — `canRollHp` + barra de XP

**Files:** Modify `components/LevelPanel.tsx`.

Lee el archivo. Hoy recibe `readOnly` y muestra los botones "Tirar" bajo `{!readOnly && ...}`. Cambios:

- [ ] **Step 1:** Añade props: `canRollHp?: boolean;` y `xp?: number;` al type `Props` y al destructuring (con defaults `canRollHp = false`, `xp = 0`).

- [ ] **Step 2:** Los botones "Tirar" de PG deben mostrarse cuando **`!readOnly || canRollHp`** (en vez de solo `!readOnly`). Sustituye esa condición en la sección "PG por nivel". El resto de controles de edición (nivel ±, ASI ±) siguen bajo `!readOnly`.

- [ ] **Step 3:** Añade una **barra de XP** en la cabecera (junto a PG máx / Comp.), importando `xpForNext` de `@/data/leveling`:
```tsx
// dentro del bloque de la cabecera, tras PG/Comp:
<div className="text-center">
  <p className="eyebrow !text-[9px]">XP</p>
  <p className="font-display font-extrabold" style={{ color: "var(--color-arcane)" }}>{xp}</p>
</div>
```
y bajo la fila de nivel, una barra fina:
```tsx
<div className="h-1.5 rounded-full overflow-hidden mt-2" style={{ background: "var(--color-raised)" }}>
  <div className="h-full rounded-full" style={{ width: `${Math.min(100, level >= 20 ? 100 : (xp / xpForNext(level)) * 100)}%`, background: "linear-gradient(90deg, var(--color-arcane-deep), var(--color-arcane))" }} />
</div>
<p className="font-ui text-[10px] mt-1" style={{ color: "var(--color-dim)" }}>{level >= 20 ? "Nivel máximo" : `${xp} / ${xpForNext(level)} XP`}</p>
```
(Colócalo donde encaje con el layout actual del panel; mantén el estilo.)

- [ ] **Step 4:** `npx tsc --noEmit` → 0; `npm run build` → 0.

- [ ] **Step 5:** Commit:
```bash
git add components/LevelPanel.tsx
git commit -m "feat: LevelPanel con barra de XP y tirada de PG para el dueño (canRollHp)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: CharacterSheet — tirar PG del dueño + pasar xp

**Files:** Modify `components/CharacterSheet.tsx`.

Lee el archivo. Hoy tiene estado `hpRolls`, handler `onRollHp`, `persistSheet` (no-op en readOnly), y carga `xp`? (no — añádelo). Cambios:

- [ ] **Step 1:** Cargar `xp`: añade estado `const [xp, setXp] = useState(0);`. En la carga cloud (`if (targetUserId) { const row = await loadCharacter(...) ... }`) añade `if (typeof row.xp === "number") setXp(row.xp);`. En la carga localStorage (rama `else`) no hace falta (XP es de campaña, sin sesión no aplica; deja 0).

- [ ] **Step 2:** `canRollHp`: añade `const canRollHp = !readOnly || saveMode === "self";`.

- [ ] **Step 3:** `onRollHp` debe persistir SOLO `hp_rolls` de inmediato, saltando el gate de readOnly. Sustituye el `onRollHp` actual por:
```ts
const onRollHp = (lv: number, val: number) => {
  setHpRolls((prev) => {
    const next = { ...prev, [String(lv)]: val };
    // persistir solo hp_rolls (excepción al bloqueo: el dueño tira su vida)
    if (targetUserId) {
      if (saveMode === "self") saveCharacter(targetUserId, { hp_rolls: next });
      else fetch("/api/dm/character", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: targetUserId, patch: { hp_rolls: next } }) });
    } else {
      try { const s = JSON.parse(localStorage.getItem(SHEET_KEY) ?? "{}"); localStorage.setItem(SHEET_KEY, JSON.stringify({ ...s, hp_rolls: next })); } catch {}
    }
    return next;
  });
};
```

- [ ] **Step 4:** Pasa las props nuevas a `LevelPanel`: en el JSX, `<LevelPanel ... hpRolls={hpRolls} onRollHp={canRollHp ? onRollHp : () => {}} readOnly={readOnly} canRollHp={canRollHp} xp={xp} />`. (Deja el resto de props como están.)

- [ ] **Step 5:** `npx tsc --noEmit` → 0; `npm run build` → 0.

- [ ] **Step 6:** Commit:
```bash
git add components/CharacterSheet.tsx
git commit -m "feat: el dueño de la hoja tira su PG (persiste solo hp_rolls) + XP en LevelPanel

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: Panel DM › Grupo — nivel/XP

**Files:** Modify `app/dm/GrupoPanel.tsx`.

Lee el archivo. Usa `useParty()` (miembros con `user_id`, `username`, y campos de `CharacterData` incluido `level`, `xp`). Añade controles del DM. Todas las llamadas usan un helper local:

- [ ] **Step 1:** Helper de llamada a la API (añádelo en el módulo del panel):
```ts
async function dmPatch(userId: string, patch: Record<string, unknown>) {
  await fetch("/api/dm/character", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, patch }) });
}
```

- [ ] **Step 2:** Por cada miembro, junto al botón "Editar hoja" existente, muestra **Nivel N** y **XP**, con:
  - `−`/`+` nivel: `onClick={() => dmPatch(m.user_id, { setLevel: (m.level ?? 1) - 1 })}` y `+1`. Acota 1..20 (deshabilita en extremos).
  - "Dar XP": un input numérico (estado local por fila, p. ej. un `Record<user_id, string>`), botón → `dmPatch(m.user_id, { addXp: Number(value) || 0 })`.
  - Barra de XP: `xpForNext` de `@/data/leveling` (importar). `level >= 20` → "Máx".
  Realtime de `useParty` refresca los valores tras la llamada.

- [ ] **Step 3:** Acciones de grupo (cabecera del panel):
  - **"Subir nivel a todos"** → `party.forEach(m => dmPatch(m.user_id, { setLevel: Math.min(20, (m.level ?? 1) + 1) }))`.
  - **"Dar XP a todos"** → input + `party.forEach(m => dmPatch(m.user_id, { addXp: n }))`.
  Usa `Promise.all` si prefieres esperar; el realtime confirmará.

Estilo: clases del tema (`panel`, `panel-raised`, `stat-btn`, `btn-gold`, `btn-ghost`, `chip`, `eyebrow`, tokens `var(--color-*)`). Importa `xpForNext` de `@/data/leveling` y `Link` ya está.

- [ ] **Step 4:** `npx tsc --noEmit` → 0; `npm run build` → 0. (El panel no se prueba en vivo sin sesión DM; verifica render/compilación.)

- [ ] **Step 5:** Commit:
```bash
git add app/dm/GrupoPanel.tsx
git commit -m "feat: Grupo — nivel y XP por jugador y a todo el grupo

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 7: Verificación final + HANDOFF

**Files:** Modify `HANDOFF.md`.

- [ ] **Step 1:** `npx tsc --noEmit` → 0; `npm run lint` → sin errores nuevos; `npm run build` → 0 (`/personaje`, `/dm`, `/api/dm/character` presentes).

- [ ] **Step 2:** Preview :3100: en `/personaje` (dueño/jugador) se ve **nivel + barra de XP** y el botón **Tirar** de PG (única acción); tirar cambia el total y persiste. Screenshot. Consola sin errores. (Control DM en Grupo requiere sesión DM; validado por build.)

- [ ] **Step 3:** `HANDOFF.md` — bloque bajo "RESUELTO": Nivel/XP por el DM (progresión ambas, control en Grupo individual y a todo el grupo, excepción de tirar PG del jugador). **PENDIENTE del usuario: ejecutar `supabase/schema_v10.sql`**.

- [ ] **Step 4:** Commit:
```bash
git add HANDOFF.md
git commit -m "docs: HANDOFF — Nivel/XP por el DM

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Cobertura del spec (autorrevisión)

- §1 schema_v10/xp → Task 1. §2 tabla XP → Task 2. §3 progresión → Task 3 (API) + Task 2 (funciones). §4 excepción tirar PG → Task 4 (`canRollHp`) + Task 5 (persistir hp_rolls). §5 API modos → Task 3. §6 panel Grupo → Task 6. §7 hoja jugador (barra XP) → Task 4 + Task 5. §8 verificación → Tasks + Task 7.
- Consistencia: `xp` (Task 1) usado en `levelFromXp`/`xpForNext` (Task 2), API `addXp` (Task 3), `LevelPanel` prop `xp`/`canRollHp` (Task 4), `CharacterSheet` (Task 5), `GrupoPanel` (Task 6). API modos `{ setLevel, addXp }` (Task 3) llamados igual desde `GrupoPanel.dmPatch` (Task 6). `onRollHp` persiste `{ hp_rolls }` (Task 5) aceptado por la API como patch directo (Task 3, va por `...direct`).
