# Los monstruos del bestiario entran al combate — Plan de implementación (FASE 1)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que una fila PNJ de la iniciativa **sepa qué monstruo es** — con sus PG y sus condiciones en la propia fila — para que el DM deje de llevar la vida en papel y las reglas de G4 muerdan contra monstruos.

**Architecture:** Cuatro columnas opcionales en `initiative` (`schema_v23`), una capa pura nueva (`lib/combate.ts`) con su script de comprobación, mutaciones nuevas en `lib/useInitiative.ts`, y todo el UI dentro de `components/InitiativeTracker.tsx`, que ya es la lista de combatientes de `/combate` y el mando del DM en Panel DM › Dados. **Una sola fuente de verdad por combatiente**: los jugadores siguen con sus PG y condiciones en `characters.play_state`; las columnas nuevas son **solo para PNJ**.

**Tech Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Supabase (Postgres + RLS + Realtime) · Tailwind v4. **No hay tests**: el gate es `npx tsc --noEmit` + `npx next build` + los `scripts/check-*.ts` ejecutados con `npx tsx`.

---

## Antes de empezar: lee esto

**Spec:** `docs/superpowers/specs/2026-07-28-monstruos-al-combate-design.md`. Este plan implementa **solo la fase 1**. La fase 2 (la «arena») está **bloqueada** hasta que el usuario juegue una sesión con la fase 1 — no la empieces aunque el spec la describa.

**Convenciones del repo que este plan asume:**
- Rama de trabajo: `monstruos-al-combate`. Un commit por tarea.
- Los commits acaban con el trailer `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- Si el mensaje de commit lleva backticks, usa `git commit -F -` con heredoc — si no, bash ejecuta lo que haya dentro.
- **Nunca `git add -A`**: añade a mano los archivos que has tocado. Cada tarea dice cuáles.
- Los textos de cara al usuario van en **español**. Las descripciones son redacción propia; los datos mecánicos y los nombres son hechos de la ambientación.
- `AGENTS.md`: este Next.js 16 tiene cambios rompedores. Ante cualquier duda de API, lee `node_modules/next/dist/docs/`, no tires de memoria.

**Tres trampas que este plan evita a propósito** (son lecciones caras del proyecto, no teoría):

1. **El error tragado.** `lib/useInitiative.ts:31` hace `const { data } = await supabase…` y **descarta el error**. Con las columnas nuevas en el `select` y `schema_v23` sin ejecutar, Postgres tumba la consulta entera, `data` viene `null`, `rows` se queda vacío y la pantalla dice **«Sin ronda de iniciativa en curso»**. Es decir: el combate entero desaparece y la app culpa al dato en vez de a la migración. **La Tarea 3 lo arregla antes de añadir ninguna columna al `select`.**
2. **El código y la migración aterrizan juntos.** No mergees a `master` hasta que el usuario confirme que ha ejecutado `schema_v23` (Vercel despliega solo al pushear a `master`). La tolerancia de la Tarea 3 es la red de seguridad, no el plan A.
3. **Sobre-aplicar es peor que quedarse corto.** La app no compara la CA, no resuelve los ataques del monstruo y no tira su iniciativa por él más allá de lo que dice este plan. Si te ves añadiendo una regla que no está aquí, se ha colado de alcance.

---

## Estructura de archivos

| Archivo | Qué hace | Acción |
|---|---|---|
| `supabase/schema_v23.sql` | Las cuatro columnas nuevas de `initiative`. Idempotente, solo añade. | **Crear** |
| `lib/combate.ts` | Capa **pura**: `saludDe` (PG → palabra) y `nombresNumerados`. Sin React ni Supabase. | **Crear** |
| `scripts/check-combate.ts` | Verifica `lib/combate.ts`. El gate pasa de 19 a 20 scripts. | **Crear** |
| `lib/useInitiative.ts` | Tipo de fila, `select` tolerante, y las mutaciones de monstruo. | **Modificar** |
| `components/InitiativeTracker.tsx` | Selector de monstruos del DM + estado del monstruo en cada fila. | **Modificar** |
| `app/combate/page.tsx` | `condsDe` deja de devolver `[]` para PNJ ⇒ G4 muerde contra monstruos. | **Modificar** |
| `HANDOFF.md` | Sección RESUELTO + migraciones al día. | **Modificar** |
| Vault Obsidian | `Migraciones.md`, `Modelo de datos.md`, `Pendientes.md`, `Historial de desarrollo.md`. | **Modificar** |

**Por qué todo el UI cabe en `InitiativeTracker.tsx` y no en componentes nuevos:** ese archivo ya es *la lista de combatientes* y ya tiene la sección de mandos del DM. Partirlo obligaría a repartir `useInitiative`/`useParty` entre padres e hijos por props sin ganar nada. Está en 195 líneas; con esta tarea ronda las 330, que sigue siendo un archivo que se lee de una sentada. Si pasara de ~400, entonces sí tocaría partir el selector a `components/combate/SelectorMonstruos.tsx`.

---

### Task 1: La migración `schema_v23`

**Files:**
- Create: `supabase/schema_v23.sql`

> **Esta tarea escribe el archivo, NO lo ejecuta.** Las migraciones las corre el usuario a mano en Supabase. Al terminar la tarea, díselo explícitamente.

- [ ] **Step 1: Crear el archivo de migración**

Crea `supabase/schema_v23.sql` con exactamente esto:

```sql
-- schema_v23 — Los monstruos del bestiario entran al combate (FASE 1)
--
-- `initiative` gana cuatro columnas OPCIONALES. Ninguna toca las filas de
-- jugador que ya existan: los jugadores siguen llevando sus PG y sus
-- condiciones en `characters.play_state`, que es su única fuente de verdad.
-- Estas columnas son SOLO para los PNJ.
--
-- Idempotente y solo añade, como todas. Se puede reejecutar sin miedo.

alter table public.initiative add column if not exists monster_slug text;
alter table public.initiative add column if not exists hp int;
alter table public.initiative add column if not exists hp_max int;
alter table public.initiative add column if not exists conds text[] not null default '{}';

-- RLS: las políticas de `initiative` (schema_v11) ya dicen lo que hace falta
-- —el DM escribe, todos leen— y NO cambian. Realtime tampoco: la tabla ya
-- está en la publicación `supabase_realtime` desde la v11.
```

- [ ] **Step 2: Comprobar que el SQL no rompe el gate**

El archivo `.sql` no entra en la compilación, pero conviene confirmar que no has tocado nada más:

```bash
git status --short
```

Esperado: solo `?? supabase/schema_v23.sql`.

- [ ] **Step 3: Commit**

```bash
git add supabase/schema_v23.sql
git commit -F - <<'EOF'
feat(combate): schema_v23 — la iniciativa guarda qué monstruo es cada PNJ

Cuatro columnas opcionales en initiative: monster_slug, hp, hp_max y conds.
Solo para PNJ; los jugadores siguen con sus PG y condiciones en
characters.play_state, que es su unica fuente de verdad.

Idempotente y solo anade. Las politicas RLS de la v11 ya sirven y no
cambian, y la tabla ya estaba en la publicacion de realtime.

PENDIENTE de ejecutar por el usuario en Supabase.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

- [ ] **Step 4: Avisar al usuario**

Dile, con estas palabras o parecidas: *«`supabase/schema_v23.sql` está escrita pero **sin ejecutar**. Ejecútala en el SQL editor de Supabase antes de que esto llegue a `master`. La app degrada si falta (Tarea 3), pero el plan A es ejecutarla.»*

---

### Task 2: `lib/combate.ts` — la capa pura, con su script primero

**Files:**
- Create: `scripts/check-combate.ts`
- Create: `lib/combate.ts`

> **La capa pura y su script van primero, la UI después.** Es la convención del repo y la razón por la que el gate caza cosas: una regla que vive en un componente escapa al gate (el botón de «dos armas» nació muerto justo por eso).

- [ ] **Step 1: Escribir el script de comprobación (que fallará)**

Crea `scripts/check-combate.ts`:

```ts
// Comprobación manual del combate contra monstruos. Uso: npx tsx scripts/check-combate.ts
import { saludDe, nombresNumerados } from "../lib/combate";

let failures = 0;
function check(label: string, cond: boolean) {
  if (cond) console.log(`OK   ${label}`);
  else { console.log(`FAIL ${label}`); failures++; }
}

// --- saludDe: los cinco tramos y sus bordes exactos ---
check("PG completos ⇒ intacto", saludDe(13, 13) === "intacto");
check("hp por encima del máximo ⇒ intacto", saludDe(99, 13) === "intacto");
check("justo por debajo del máximo ⇒ herido", saludDe(12, 13) === "herido");
check("exactamente la mitad ⇒ herido", saludDe(10, 20) === "herido");
check("justo por debajo de la mitad ⇒ malherido", saludDe(9, 20) === "malherido");
check("exactamente un cuarto ⇒ malherido", saludDe(5, 20) === "malherido");
check("justo por debajo del cuarto ⇒ al borde", saludDe(4, 20) === "al borde");
check("1 PG ⇒ al borde", saludDe(1, 20) === "al borde");
check("0 PG ⇒ fuera de combate", saludDe(0, 20) === "fuera de combate");
check("PG negativos ⇒ fuera de combate", saludDe(-7, 20) === "fuera de combate");

// hpMax raro no debe romper ni devolver NaN/undefined
check("hpMax 0 con vida ⇒ intacto", saludDe(3, 0) === "intacto");
check("hpMax 0 sin vida ⇒ fuera de combate", saludDe(0, 0) === "fuera de combate");
check("hpMax negativo no rompe", saludDe(0, -5) === "fuera de combate");

// La palabra siempre es una de las cinco, nunca undefined
const PALABRAS = ["intacto", "herido", "malherido", "al borde", "fuera de combate"];
let todasValidas = true;
for (let max = 1; max <= 30; max++) {
  for (let hp = -2; hp <= max + 2; hp++) {
    if (!PALABRAS.includes(saludDe(hp, max))) todasValidas = false;
  }
}
check("saludDe siempre devuelve una de las cinco palabras", todasValidas);

// El jugador NUNCA debe poder deducir el número: la palabra no lleva dígitos
check("la palabra no contiene números", PALABRAS.every((p) => !/\d/.test(p)));

// --- nombresNumerados ---
check("n=1 no añade el sufijo", JSON.stringify(nombresNumerados("Goblin", 1)) === JSON.stringify(["Goblin"]));
check("n=4 numera del 1 al 4", JSON.stringify(nombresNumerados("Goblin", 4)) === JSON.stringify(["Goblin 1", "Goblin 2", "Goblin 3", "Goblin 4"]));
check("n=0 no crea filas", nombresNumerados("Goblin", 0).length === 0);
check("n negativo no crea filas", nombresNumerados("Goblin", -3).length === 0);
check("recorta espacios del nombre", JSON.stringify(nombresNumerados("  Ogro  ", 1)) === JSON.stringify(["Ogro"]));
check("nombres únicos dentro de la tanda", new Set(nombresNumerados("Lobo", 6)).size === 6);
check("respeta nombres con espacios", nombresNumerados("Lobo huargo", 2)[1] === "Lobo huargo 2");

console.log(failures === 0 ? "\nTodo en verde" : `\n${failures} fallo(s)`);
process.exit(failures === 0 ? 0 : 1);
```

- [ ] **Step 2: Ejecutarlo para verificar que falla**

```bash
npx tsx scripts/check-combate.ts
```

Esperado: **FALLA** con un error de módulo no encontrado, del estilo `Cannot find module '../lib/combate'`. Si pasa en verde, algo va mal: el archivo `lib/combate.ts` no debería existir todavía.

- [ ] **Step 3: Escribir la implementación mínima**

Crea `lib/combate.ts`:

```ts
// Capa pura del combate contra monstruos: sin React, sin Supabase, sin estado.
// Solo funciones que transforman datos, verificadas por scripts/check-combate.ts.
//
// No fusiona `play_state` ni lo toca: los PG y las condiciones de un MONSTRUO
// viven en su fila de `initiative` (schema_v23), no en una ficha. Los de un
// jugador siguen en `play_state` y los llevan lib/estado.ts y lib/recursos.ts.

/**
 * Cómo se le cuenta a un jugador la salud de un monstruo: en palabras, nunca
 * el número. Mantiene la tensión de la mesa — nadie calcula «le quedan 3».
 * El DM sí ve las cifras exactas (eso lo decide el componente, no esto).
 */
export type Salud = "intacto" | "herido" | "malherido" | "al borde" | "fuera de combate";

/**
 * Tramos (del spec): 100 % intacto · ≥50 % herido · ≥25 % malherido ·
 * >0 al borde · 0 fuera de combate.
 *
 * `hpMax` <= 0 no debería pasar (todo monstruo del bestiario trae `hp`), pero
 * un personalizado del DM mal metido no puede tumbar la pantalla de combate:
 * se responde por si hay vida o no, sin dividir por cero.
 */
export function saludDe(hp: number, hpMax: number): Salud {
  if (hpMax <= 0) return hp > 0 ? "intacto" : "fuera de combate";
  const vivos = Math.max(0, Math.min(hp, hpMax));
  if (vivos <= 0) return "fuera de combate";
  const parte = vivos / hpMax;
  if (parte >= 1) return "intacto";
  if (parte >= 0.5) return "herido";
  if (parte >= 0.25) return "malherido";
  return "al borde";
}

/**
 * Nombres de una tanda de monstruos idénticos. Uno solo se queda con su
 * nombre a secas («Goblin»); varios se numeran («Goblin 1»… «Goblin 4») para
 * que el DM pueda decir a cuál le pegas.
 */
export function nombresNumerados(nombre: string, n: number): string[] {
  const base = nombre.trim();
  if (n <= 0) return [];
  if (n === 1) return [base];
  return Array.from({ length: n }, (_, i) => `${base} ${i + 1}`);
}
```

- [ ] **Step 4: Ejecutar el script para verificar que pasa**

```bash
npx tsx scripts/check-combate.ts
```

Esperado: 21 líneas `OK` y `Todo en verde`, con código de salida 0.

- [ ] **Step 5: Gate completo**

```bash
npx tsc --noEmit
```

Esperado: sin salida (limpio).

- [ ] **Step 6: Commit**

```bash
git add lib/combate.ts scripts/check-combate.ts
git commit -F - <<'EOF'
feat(combate): capa pura de salud de monstruo y nombres de tanda

saludDe traduce los PG de un monstruo a una palabra (intacto, herido,
malherido, al borde, fuera de combate) para que el jugador no vea el
numero y no pueda calcular "le quedan 3". El DM si vera las cifras.

nombresNumerados nombra una tanda de bichos identicos: uno se queda
"Goblin", varios pasan a "Goblin 1".."Goblin 4".

Capa pura y su script primero, la UI despues: una regla que vive en un
componente escapa al gate. 21 comprobaciones, incluidos los bordes
exactos de cada tramo y un hpMax de 0 o negativo.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

### Task 3: `useInitiative` — leer las columnas nuevas sin que un error las esconda

**Files:**
- Modify: `lib/useInitiative.ts` (el archivo entero; hoy tiene 101 líneas)

> **Esta es la tarea delicada del plan.** Hoy `useInitiative` descarta el error del `select`. En cuanto añadas columnas que quizá no existan, ese error silencioso se convierte en «no hay combate». Se arregla **en la misma tarea** que introduce las columnas, nunca después.

- [ ] **Step 1: Ampliar el tipo de fila y el `select`, con reintento tolerante**

En `lib/useInitiative.ts`, sustituye el bloque que va desde `export type InitiativeRow` hasta el final de la función `useInitiative` (líneas 6–50) por esto:

```ts
export type InitiativeRow = {
  id: number;
  user_id: string | null;
  is_npc: boolean;
  npc_name: string | null;
  value: number | null;
  active: boolean;
  /** Qué monstruo del bestiario es. `null` en jugadores y en PNJ escritos a mano. */
  monster_slug: string | null;
  /** PG del PNJ. `null` en jugadores: los suyos viven en `characters.play_state`. */
  hp: number | null;
  hp_max: number | null;
  /** Condiciones del PNJ. Las de los jugadores siguen en `play_state`. */
  conds: string[];
};

const INI_FIELDS = "id, user_id, is_npc, npc_name, value, active, monster_slug, hp, hp_max, conds";
// Las seis columnas de la schema_v11, que existen desde siempre.
const INI_FIELDS_BASE = "id, user_id, is_npc, npc_name, value, active";

// Una fila leída sin las columnas de la v23 tiene que seguir siendo una
// InitiativeRow válida: se rellenan los huecos con los mismos valores que
// tendría una fila de jugador.
function normaliza(row: Record<string, unknown>): InitiativeRow {
  return {
    id: row.id as number,
    user_id: (row.user_id as string | null) ?? null,
    is_npc: Boolean(row.is_npc),
    npc_name: (row.npc_name as string | null) ?? null,
    value: (row.value as number | null) ?? null,
    active: Boolean(row.active),
    monster_slug: (row.monster_slug as string | null) ?? null,
    hp: (row.hp as number | null) ?? null,
    hp_max: (row.hp_max as number | null) ?? null,
    conds: Array.isArray(row.conds) ? (row.conds as string[]) : [],
  };
}

// Iniciativa en vivo: todas las filas (jugadores + PNJ), orden descendente
// por valor (nulos al final). Se recarga entera ante cualquier cambio: es
// una tabla pequeña y así el orden con nulos y los borrados masivos quedan
// siempre correctos (igual que useParty en lib/character.ts).
//
// TOLERANTE A LA schema_v23: si las cuatro columnas nuevas no existen todavía,
// Postgres devuelve 42703 y tumba la consulta ENTERA. Sin este reintento, el
// combate desaparecería de la pantalla y la app diría "Sin ronda de iniciativa
// en curso" — culpando al dato en vez de a la migración, que es exactamente el
// bug del 2026-07-22 con otra cara. Aquí basta una lista base fija (y no leer
// del error qué columna falta, como hace selectTolerante en lib/character.ts)
// porque las cuatro llegan juntas en una sola migración: o están las cuatro o
// no está ninguna.
export function useInitiative() {
  const [rows, setRows] = useState<InitiativeRow[]>([]);
  const [ready, setReady] = useState(() => !supabaseConfigured);
  const [faltaMigracion, setFaltaMigracion] = useState(false);

  useEffect(() => {
    if (!supabaseConfigured) return;
    const supabase = createClient();
    let mounted = true;

    const load = async () => {
      const pide = (fields: string) =>
        supabase.from("initiative").select(fields).order("value", { ascending: false, nullsFirst: false });

      let { data, error } = await pide(INI_FIELDS);

      if (error?.code === "42703") {
        console.warn("[initiative] faltan las columnas de schema_v23; se lee sin ellas:", error.message);
        const base = await pide(INI_FIELDS_BASE);
        data = base.data;
        error = base.error;
        if (mounted) setFaltaMigracion(true);
      } else if (mounted) {
        setFaltaMigracion(false);
      }

      if (!mounted) return;
      // Un error que no sea 42703 se deja ver en consola en vez de tragarse:
      // si la iniciativa se vacía sola, hay que poder sospechar de la consulta
      // antes que del dato.
      if (error) console.error("[initiative] no se pudo leer la iniciativa:", error.message);
      if (data) setRows((data as unknown as Record<string, unknown>[]).map(normaliza));
      setReady(true);
    };
    load();

    const ch = supabase
      .channel(`initiative_rt_${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "initiative" }, () => load())
      .subscribe();

    return () => { mounted = false; supabase.removeChannel(ch); };
  }, []);

  return { rows, ready, faltaMigracion };
}
```

- [ ] **Step 2: Añadir las mutaciones de monstruo**

En el mismo archivo, **al final**, después de `clearInitiative`, añade:

```ts
/* ---------------------------- Monstruos (DM) ---------------------------- */

/** Una fila de monstruo a punto de insertarse. La iniciativa ya viene tirada. */
export type NuevoMonstruo = {
  nombre: string;
  slug: string;
  hp: number;
  valor: number;
};

// Añade una tanda de monstruos de golpe (solo el DM, por RLS). Un único
// insert para que las filas aparezcan juntas en el realtime de todos.
export async function addMonstersInitiative(filas: NuevoMonstruo[]): Promise<{ error: string | null }> {
  if (!supabaseConfigured) return { error: "Supabase no configurado" };
  if (filas.length === 0) return { error: null };
  const { error } = await createClient().from("initiative").insert(
    filas.map((f) => ({
      is_npc: true,
      npc_name: f.nombre,
      monster_slug: f.slug,
      hp: f.hp,
      hp_max: f.hp,
      value: f.valor,
      conds: [],
    }))
  );
  return { error: error?.message ?? null };
}

// PG de un PNJ. Se acota entre 0 y hp_max aquí mismo para que ninguna vía
// (botón, teclado) pueda dejar la fila con PG negativos o por encima del tope.
export async function setNpcHp(id: number, hp: number, hpMax: number): Promise<{ error: string | null }> {
  if (!supabaseConfigured) return { error: "Supabase no configurado" };
  const acotado = Math.max(0, Math.min(Math.round(hp), hpMax));
  const { error } = await createClient()
    .from("initiative")
    .update({ hp: acotado, updated_at: new Date().toISOString() })
    .eq("id", id);
  return { error: error?.message ?? null };
}

// Condiciones de un PNJ: se escribe la lista entera (read-modify-write lo hace
// quien llama, que ya tiene la fila en memoria por el hook).
export async function setNpcConds(id: number, conds: string[]): Promise<{ error: string | null }> {
  if (!supabaseConfigured) return { error: "Supabase no configurado" };
  const { error } = await createClient()
    .from("initiative")
    .update({ conds, updated_at: new Date().toISOString() })
    .eq("id", id);
  return { error: error?.message ?? null };
}

// Quita una sola fila (solo el DM, por RLS). Complementa a clearInitiative,
// que las vacía todas y termina el combate.
export async function removeInitiativeRow(id: number): Promise<{ error: string | null }> {
  if (!supabaseConfigured) return { error: "Supabase no configurado" };
  const { error } = await createClient().from("initiative").delete().eq("id", id);
  return { error: error?.message ?? null };
}
```

- [ ] **Step 3: Gate**

```bash
npx tsc --noEmit
```

Esperado: sin salida. Si `tsc` se queja del destructuring `let { data, error }` reasignado, comprueba que has usado `let` y no `const`.

```bash
npx next build
```

Esperado: `✓ Compiled successfully`.

- [ ] **Step 4: Commit**

```bash
git add lib/useInitiative.ts
git commit -F - <<'EOF'
feat(combate): la iniciativa lee y escribe el estado de los monstruos

InitiativeRow gana monster_slug, hp, hp_max y conds, y con ellas las
mutaciones del DM: anadir una tanda de golpe, fijar PG (acotados entre 0
y el maximo en la propia funcion), fijar condiciones y quitar una fila.

Y el arreglo que tenia que ir en esta misma tarea: el hook descartaba el
error del select. Con columnas que quiza no existan, un 42703 tumba la
consulta entera y la pantalla habria dicho "Sin ronda de iniciativa en
curso" — culpando al dato en vez de a la migracion, el bug del 22 de
julio con otra cara. Ahora reintenta con las seis columnas de la v11,
expone faltaMigracion y cualquier otro error se ve en consola.

La lista base fija basta aqui (a diferencia de selectTolerante, que lee
del error que columna falta) porque las cuatro columnas llegan juntas en
una sola migracion: o estan las cuatro o no esta ninguna.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

### Task 4: El selector de monstruos del DM

**Files:**
- Modify: `components/InitiativeTracker.tsx` (imports, estado local, la función `addMonsters`, y el bloque `isDM`)

- [ ] **Step 1: Ampliar los imports**

En `components/InitiativeTracker.tsx`, sustituye el bloque de imports (líneas 1–17) por:

```tsx
"use client";

import { useMemo, useState } from "react";
import { useSession } from "@/components/SessionProvider";
import { useParty } from "@/lib/character";
import {
  useInitiative,
  setMyInitiative,
  addNpcInitiative,
  addMonstersInitiative,
  setActiveInitiative,
  clearInitiative,
  removeInitiativeRow,
  setNpcHp,
  setNpcConds,
  type InitiativeRow,
} from "@/lib/useInitiative";
import { useBestiary, setDiscovered } from "@/lib/useBestiary";
import { publishRoll } from "@/lib/useDiceFeed";
import { derive } from "@/lib/derive";
import { pgActuales, CONDICIONES } from "@/lib/estado";
import { saludDe, nombresNumerados } from "@/lib/combate";
import { d20Check } from "@/lib/dice";
import type { PlayState } from "@/lib/recursos";
```

- [ ] **Step 2: Añadir el estado local del selector**

Dentro del componente, justo después de `const [npcValue, setNpcValue] = useState("");` (línea 57 del original), añade:

```tsx
  // Selector de monstruos del bestiario (solo DM). `monsters` ya incluye los
  // personalizados del DM, así que el buscador los encuentra igual.
  const { monsters } = useBestiary();
  const [busqueda, setBusqueda] = useState("");
  const [slugSel, setSlugSel] = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [individual, setIndividual] = useState(false);
  const [anadiendo, setAnadiendo] = useState(false);

  // Diez coincidencias como mucho: es un desplegable, no el bestiario entero.
  const sugerencias = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (q.length === 0) return monsters.slice(0, 10);
    return monsters
      .filter((m) => m.name.toLowerCase().includes(q) || m.nameEn.toLowerCase().includes(q))
      .slice(0, 10);
  }, [monsters, busqueda]);

  const monstruoSel = monsters.find((m) => m.slug === slugSel) ?? null;
```

- [ ] **Step 3: Escribir `addMonsters`**

Justo después de la función `addNpc` (líneas 88–95 del original), añade:

```tsx
  // Añade una TANDA: un monstruo y una cantidad. Cada tanda tira su propia
  // iniciativa con el modificador de ESE monstruo, así que un jefe añadido
  // aparte nunca comparte turno con sus esbirros — sale gratis, sin ninguna
  // opción que marcar.
  async function addMonsters() {
    if (!monstruoSel || anadiendo) return;
    const n = Math.max(1, Math.min(20, Math.round(Number(cantidad) || 1)));
    setAnadiendo(true);
    setErr(null);

    const nombres = nombresNumerados(monstruoSel.name, n);
    // Sin "iniciativa individual", una sola tirada para toda la tanda: los
    // bichos idénticos van juntos y la lista se queda corta, que es como se
    // juega en la mesa.
    const comun = d20Check(monstruoSel.initiative).total;
    const filas = nombres.map((nombre) => ({
      nombre,
      slug: monstruoSel.slug,
      hp: monstruoSel.hp,
      valor: individual ? d20Check(monstruoSel.initiative).total : comun,
    }));

    const { error } = await addMonstersInitiative(filas);
    if (error) {
      setErr(error);
    } else {
      // Si os lo habéis peleado, lo habéis visto: queda descubierto en
      // /bestiario para los jugadores. Un fallo aquí no debe deshacer las
      // filas ya creadas, así que solo se avisa.
      const { error: descError } = await setDiscovered(monstruoSel.slug, true);
      if (descError) setErr(`Añadido, pero no se pudo marcar como descubierto: ${descError}`);
      setBusqueda("");
      setSlugSel("");
      setCantidad("1");
    }
    setAnadiendo(false);
  }
```

- [ ] **Step 4: Pintar el selector en el bloque del DM**

Dentro del bloque `{isDM && (`, **antes** del `<div className="flex gap-2">` que contiene los inputs del PNJ a mano, inserta:

```tsx
          <div className="space-y-2 pb-2 mb-1 border-b border-[var(--color-line)]">
            <p className="font-ui text-[11px] uppercase tracking-wider" style={{ color: "var(--color-dim)" }}>
              <i className="fas fa-dragon mr-1.5" />Del bestiario
            </p>
            <input
              value={busqueda}
              onChange={(e) => { setBusqueda(e.target.value); setSlugSel(""); }}
              placeholder="Buscar monstruo…"
              className="w-full bg-[var(--color-night)] rounded-lg px-3 py-1.5 font-ui text-[12px] outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)] transition-colors"
              style={{ color: "var(--color-warm)" }}
            />
            {!monstruoSel && sugerencias.length > 0 && (
              <div className="max-h-40 overflow-y-auto space-y-1">
                {sugerencias.map((m) => (
                  <button
                    key={m.slug}
                    onClick={() => { setSlugSel(m.slug); setBusqueda(m.name); }}
                    className="w-full text-left panel-raised px-2.5 py-1.5 font-ui text-[12px] hover:border-[var(--color-bronze)] transition-colors"
                    style={{ color: "var(--color-warm)" }}
                  >
                    {m.name}
                    <span className="ml-2 text-[10px]" style={{ color: "var(--color-dim)" }}>
                      CR {m.cr} · {m.hp} PG · ini {m.initiative >= 0 ? `+${m.initiative}` : m.initiative}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {monstruoSel && (
              <div className="flex gap-2 items-center flex-wrap">
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  className="w-16 bg-[var(--color-night)] rounded-lg px-3 py-1.5 font-ui text-[12px] outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)] transition-colors"
                  style={{ color: "var(--color-warm)" }}
                />
                <label className="font-ui text-[11px] flex items-center gap-1.5 cursor-pointer" style={{ color: "var(--color-dim)" }}>
                  <input type="checkbox" checked={individual} onChange={(e) => setIndividual(e.target.checked)} />
                  Iniciativa individual
                </label>
                <button className="btn-gold !py-1.5 !px-3 text-[12px] ml-auto" onClick={addMonsters} disabled={anadiendo}>
                  <i className="fas fa-plus mr-1.5" />{anadiendo ? "Añadiendo…" : "Añadir"}
                </button>
              </div>
            )}
          </div>
```

- [ ] **Step 5: Gate**

```bash
npx tsc --noEmit && npx next build
```

Esperado: `tsc` sin salida y `✓ Compiled successfully`.

- [ ] **Step 6: Commit**

```bash
git add components/InitiativeTracker.tsx
git commit -F - <<'EOF'
feat(combate): el DM anade monstruos del bestiario a la iniciativa

Buscador sobre useBestiary (que ya incluye los personalizados del DM),
cantidad e interruptor de iniciativa individual, junto al "anadir PNJ" a
mano de siempre, que se queda para lo que no este en el bestiario.

Los monstruos entran POR TANDAS y cada tanda tira su propia iniciativa
con el modificador de ese monstruo. Asi, anadir "4 goblins" y luego "1
ogro" son dos tandas y el ogro tiene su turno aparte automaticamente: un
jefe nunca comparte iniciativa con sus esbirros, y no hace falta marcar
ninguna opcion para conseguirlo. Dentro de una tanda, una sola tirada
salvo que se pida individual.

Anadir un monstruo lo marca como descubierto en /bestiario: si os lo
habeis peleado, lo habeis visto.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

### Task 5: La fila del monstruo — PG para el DM, palabras para el jugador

**Files:**
- Modify: `components/InitiativeTracker.tsx` (la función `estadoDe` y el `rows.map`)

- [ ] **Step 1: Que `estadoDe` sepa de monstruos**

Sustituye la función `estadoDe` (líneas 45–52 del original) por:

```tsx
  // Estado de una fila. Dos orígenes distintos y una sola fuente de verdad
  // por combatiente: los JUGADORES lo llevan en characters.play_state; los
  // PNJ, en su propia fila de initiative (schema_v23). Nunca los dos.
  const estadoDe = (r: InitiativeRow): { hp: number; maxHp: number; conds: string[]; esPnj: boolean } | null => {
    if (r.is_npc) {
      // Un PNJ escrito a mano (sin monstruo detrás) no tiene PG que mostrar.
      if (r.hp_max === null || r.hp === null) return null;
      return { hp: r.hp, maxHp: r.hp_max, conds: r.conds, esPnj: true };
    }
    if (!r.user_id) return null;
    const p = party.find((x) => x.user_id === r.user_id);
    if (!p) return null;
    const play = (p.play_state as PlayState | undefined) ?? {};
    const maxHp = derive(p).maxHp;
    return { hp: pgActuales(play, maxHp), maxHp, conds: play.conds ?? [], esPnj: false };
  };
```

- [ ] **Step 2: Pintar el estado según quién mira**

Dentro del `rows.map`, sustituye el bloque `{est && ( … )}` (líneas 137–144 del original) por:

```tsx
                  {est && (
                    <span className="font-ui text-[11px] flex items-center gap-2 mt-0.5 flex-wrap" style={{ color: "var(--color-dim)" }}>
                      {/* El DM ve las cifras; los jugadores, la palabra. Un monstruo
                          con 3 PG de 13 se cuenta como "malherido" y nadie calcula. */}
                      {est.esPnj && !isDM ? (
                        <span style={{ color: est.hp === 0 ? "var(--color-ember)" : undefined }}>{saludDe(est.hp, est.maxHp)}</span>
                      ) : (
                        <span>PG {est.hp}/{est.maxHp}</span>
                      )}
                      {/* Las condiciones las ven TODOS: se ve que el goblin está en
                          el suelo, y hacen falta para entender la ventaja. */}
                      {est.conds.length > 0 && (
                        <span style={{ color: "var(--color-violet)" }}>{est.conds.join(" · ")}</span>
                      )}
                    </span>
                  )}
```

- [ ] **Step 3: Mandos del DM en la fila del monstruo**

Dentro del `rows.map`, justo **después** del `<span className="font-display font-extrabold text-[15px] shrink-0" …>` que pinta el valor de iniciativa (líneas 146–148 del original), y aún dentro del `<div key={r.id}>`, no puede ir: el `div` es un `flex` de dos hijos. Sustituye el `<div key={r.id}>` **entero** para envolver la fila y sus mandos:

Localiza la apertura:

```tsx
              <div
                key={r.id}
                onClick={elegible ? () => onSelect!(elegida ? null : r.id) : undefined}
```

y cámbiala por:

```tsx
              <div key={r.id}>
              <div
                onClick={elegible ? () => onSelect!(elegida ? null : r.id) : undefined}
```

Después, localiza el cierre de esa fila (el `</div>` que va justo antes de `);` al final del `rows.map`) y sustitúyelo por:

```tsx
              </div>
              {/* Mandos del DM sobre un monstruo: daño, curación, condiciones y
                  quitar la fila. Fuera del div pulsable, para que tocar un botón
                  no cambie de objetivo sin querer. */}
              {isDM && est?.esPnj && (
                <div className="flex items-center gap-1.5 flex-wrap px-3 pt-1.5">
                  <button
                    className="btn-ghost !py-1 !px-2 text-[11px]"
                    style={{ color: "var(--color-ember)" }}
                    onClick={() => setNpcHp(r.id, est.hp - dañoDe(r.id), est.maxHp)}
                    title="Aplicar daño"
                  >
                    <i className="fas fa-minus" />
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={daños[r.id] ?? "1"}
                    onChange={(e) => setDaños((d) => ({ ...d, [r.id]: e.target.value }))}
                    className="w-14 bg-[var(--color-night)] rounded-lg px-2 py-1 font-ui text-[11px] text-center outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)] transition-colors"
                    style={{ color: "var(--color-warm)" }}
                  />
                  <button
                    className="btn-ghost !py-1 !px-2 text-[11px]"
                    style={{ color: "var(--color-verdant)" }}
                    onClick={() => setNpcHp(r.id, est.hp + dañoDe(r.id), est.maxHp)}
                    title="Curar"
                  >
                    <i className="fas fa-plus" />
                  </button>
                  <button
                    className="btn-ghost !py-1 !px-2 text-[11px]"
                    onClick={() => setCondsAbiertas((c) => ({ ...c, [r.id]: !c[r.id] }))}
                  >
                    <i className="fas fa-hand-sparkles mr-1" />Condiciones
                  </button>
                  <button
                    className="btn-ghost !py-1 !px-2 text-[11px] ml-auto"
                    style={{ color: "var(--color-ember)" }}
                    onClick={() => removeInitiativeRow(r.id)}
                    title="Quitar de la iniciativa"
                  >
                    <i className="fas fa-xmark" />
                  </button>
                </div>
              )}
              {isDM && est?.esPnj && condsAbiertas[r.id] && (
                <div className="flex flex-wrap gap-1 px-3 pt-1.5">
                  {CONDICIONES.map((c) => {
                    const puesta = est.conds.includes(c.slug);
                    return (
                      <button
                        key={c.slug}
                        title={c.regla}
                        onClick={() =>
                          setNpcConds(
                            r.id,
                            puesta ? est.conds.filter((x) => x !== c.slug) : [...est.conds, c.slug]
                          )
                        }
                        className="px-2 py-0.5 rounded-full font-ui text-[10px] border transition-colors"
                        style={{
                          borderColor: puesta ? "var(--color-violet)" : "var(--color-line)",
                          color: puesta ? "var(--color-violet)" : "var(--color-dim)",
                        }}
                      >
                        {c.slug}
                      </button>
                    );
                  })}
                </div>
              )}
              </div>
```

- [ ] **Step 4: Añadir el estado local que usan esos mandos**

Junto al resto de `useState` del componente (después de `const [anadiendo, setAnadiendo] = useState(false);`), añade:

```tsx
  // Cuánto daño aplica el DM de un toque, por fila. Texto y no número: un
  // input vacío mientras se teclea no debe volverse NaN.
  const [daños, setDaños] = useState<Record<number, string>>({});
  const [condsAbiertas, setCondsAbiertas] = useState<Record<number, boolean>>({});
  const dañoDe = (id: number) => Math.max(1, Math.round(Number(daños[id] ?? "1") || 1));
```

- [ ] **Step 5: Gate**

```bash
npx tsc --noEmit && npx next build
```

Esperado: `tsc` sin salida y `✓ Compiled successfully`. Si `tsc` se queja de que `est` puede ser `null` dentro de los mandos, comprueba que has escrito `est?.esPnj` en la condición y que usas `est.hp` **dentro** del bloque ya guardado.

- [ ] **Step 6: Verificar que no se ha roto el otro montaje**

`InitiativeTracker` se monta en dos sitios: `app/combate/page.tsx:56` (con `conEstado`) y `app/dm/DadosPanel.tsx:96` (sin props). Comprueba que el segundo sigue compilando sin cambios:

```bash
grep -n "InitiativeTracker" app/dm/DadosPanel.tsx
```

Esperado: la línea 96 con `<InitiativeTracker />` **sin props nuevas**. Todas las que has añadido son opcionales o internas.

- [ ] **Step 7: Commit**

```bash
git add components/InitiativeTracker.tsx
git commit -F - <<'EOF'
feat(combate): la fila del monstruo muestra su estado y el DM lo lleva

estadoDe deja de devolver null para los PNJ y lee los PG y condiciones de
su fila (schema_v23). Dos origenes, una sola fuente de verdad por
combatiente: los jugadores en play_state, los PNJ en initiative.

Quien mira decide que ve: el DM las cifras exactas (11/13) y los
jugadores la palabra que devuelve saludDe ("malherido"), que no lleva
digitos justo para que nadie calcule "le quedan 3". Las condiciones las
ven todos: se ve que el goblin esta en el suelo, y hacen falta para
entender de donde sale la ventaja.

El DM gana en la fila del monstruo dano, curacion, las 14 condiciones y
quitar la fila. Van FUERA del div pulsable para que tocar un boton no
cambie de objetivo sin querer.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

### Task 6: G4 empieza a funcionar contra monstruos

**Files:**
- Modify: `app/combate/page.tsx:32-37`

> Esta tarea es de tres líneas y es **la razón de fondo de toda la losa**. Hasta ahora `condsDe` devolvía `[]` para los PNJ, así que un goblin derribado no daba ventaja a nadie: la regla existía en `lib/targeting.ts` y no se aplicaba nunca contra un monstruo.

- [ ] **Step 1: Leer las condiciones del PNJ de su fila**

En `app/combate/page.tsx`, sustituye:

```tsx
  // Condiciones del objetivo: solo si es un jugador legible. Los PNJ no tienen
  // ficha (sus PG y condiciones llegan en la losa siguiente).
  const condsDe = (r: InitiativeRow): string[] =>
    r.is_npc || !r.user_id
      ? []
      : ((party.find((p) => p.user_id === r.user_id)?.play_state as PlayState | undefined)?.conds ?? []);
```

por:

```tsx
  // Condiciones del objetivo, de donde toque: un PNJ las lleva en su propia
  // fila de iniciativa (schema_v23) y un jugador en su play_state. Con esto,
  // las reglas de G4 muerden también contra monstruos — un goblin derribado da
  // ventaja a quien le pega de cerca y desventaja a quien le dispara.
  const condsDe = (r: InitiativeRow): string[] => {
    if (r.is_npc) return r.conds;
    if (!r.user_id) return [];
    return (party.find((p) => p.user_id === r.user_id)?.play_state as PlayState | undefined)?.conds ?? [];
  };
```

- [ ] **Step 2: Gate completo, incluida la no regresión**

```bash
npx tsc --noEmit && npx next build
```

Esperado: `tsc` sin salida y `✓ Compiled successfully`.

Ahora los 20 scripts (los 19 de siempre + `check-combate`):

```bash
for f in scripts/check-*.ts; do npx tsx "$f" > /dev/null 2>&1 && echo "VERDE $f" || echo "ROJO  $f"; done
```

Esperado: **20 líneas `VERDE`**, ninguna `ROJO`. Presta especial atención a `check-targeting` y `check-estado`: si alguno se pone rojo, has tocado una regla sin querer y eso es alcance colado.

- [ ] **Step 3: Commit**

```bash
git add app/combate/page.tsx
git commit -F - <<'EOF'
fix(combate): las reglas de G4 muerden contra los monstruos

condsDe devolvia [] para todos los PNJ porque no habia donde guardarles
condiciones. Con la fila de initiative ya poblada (schema_v23), lee las
del monstruo: un goblin derribado da ventaja a quien le pega con un arma
de cuerpo y desventaja a quien le dispara, y uno paralizado o
inconsciente da critico automatico en cuerpo a cuerpo.

La regla estaba escrita en lib/targeting.ts desde G4 y no se aplicaba
nunca contra un monstruo. Cero reglas nuevas: solo deja de faltarle el
dato.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

### Task 7: Documentación — HANDOFF y vault

**Files:**
- Modify: `HANDOFF.md`
- Modify: `C:\Users\carlo\Desktop\Exandria-Obsidian\Exandria\20 Arquitectura\Migraciones.md`
- Modify: `C:\Users\carlo\Desktop\Exandria-Obsidian\Exandria\20 Arquitectura\Modelo de datos.md`
- Modify: `C:\Users\carlo\Desktop\Exandria-Obsidian\Exandria\00 Meta\Pendientes.md`
- Modify: `C:\Users\carlo\Desktop\Exandria-Obsidian\Exandria\00 Meta\Historial de desarrollo.md`

- [ ] **Step 1: Sección RESUELTO en `HANDOFF.md`**

Añade una sección nueva **justo antes** de `## RESUELTO (2026-07-26): fuera el tablero…`, siguiendo el molde de las demás: qué se hizo, las trampas cazadas, qué queda fuera a propósito, la verificación, y **la prueba del usuario**. La prueba del usuario, copiada del spec, es:

> Añadir 4 goblins ⇒ salen «Goblin 1..4» compartiendo iniciativa; añadir un ogro aparte ⇒ tiene la suya; con «iniciativa individual», los 4 goblins salen desperdigados; el DM baja PG a un goblin y **el jugador ve «malherido»**, no el número; marcarle **derribado** y atacarle con un arma de cuerpo ⇒ **ventaja**, y con un arco ⇒ **desventaja**; y que el goblin aparezca **descubierto** en `/bestiario` para los jugadores.

Añade además una prueba que el spec no trae y que este plan sí necesita:

> Con `schema_v23` **sin ejecutar**, `/combate` sigue mostrando la iniciativa de siempre (sin PG de monstruo) en vez de quedarse vacía, y la consola del navegador dice qué falta.

- [ ] **Step 2: Actualizar el estado de las migraciones en `HANDOFF.md`**

En la sección `## Migraciones Supabase`, añade `schema_v23.sql` al final de la lista con su descripción, y **actualiza el aviso de la cabecera**: deja de ser «v1–v22 al día» y pasa a decir si la v23 está ejecutada o pendiente (**pregúntaselo al usuario, no lo supongas**).

En la sección `## Scripts de comprobación`, añade `check-combate` a la tabla con su recuento (21) y cambia «Son 19» por «Son 20».

- [ ] **Step 3: Vault**

- `Migraciones.md`: fila nueva de `schema_v23.sql` en la tabla, con las cuatro columnas y para qué son.
- `Modelo de datos.md`: `initiative` gana las cuatro columnas, con la nota de que `hp`/`hp_max`/`conds` son **solo de PNJ** y por qué (una sola fuente de verdad por combatiente).
- `Pendientes.md`: el bloque `[!todo] schema_v23 — PENDIENTE de escribir y ejecutar` pasa a **escrita**, pendiente solo de ejecutar (o ejecutada, según lo que diga el usuario). La fase 2 sigue bloqueada: no toques ese aviso.
- `Historial de desarrollo.md`: entrada nueva con el porqué de la losa (que las reglas de G4 no llegaban a los monstruos) y la decisión de las tandas.

- [ ] **Step 4: Commit**

```bash
git add HANDOFF.md
git commit -F - <<'EOF'
docs(combate): HANDOFF y vault con los monstruos en la iniciativa

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

(El vault no está en el repo: se guarda solo, no lleva commit.)

---

### Task 8: Cierre — merge solo cuando la migración esté ejecutada

- [ ] **Step 1: Confirmar con el usuario que `schema_v23` está ejecutada**

**Pregúntaselo explícitamente.** Si dice que no, **no mergees**: el código y la migración aterrizan juntos, y `master` despliega solo a producción.

- [ ] **Step 2: Gate final sobre la rama**

```bash
npx tsc --noEmit && npx next build
```

```bash
for f in scripts/check-*.ts; do npx tsx "$f" > /dev/null 2>&1 && echo "VERDE $f" || echo "ROJO  $f"; done
```

Esperado: build limpio y 20 `VERDE`.

- [ ] **Step 3: Merge y push**

```bash
git checkout master
git merge --no-ff monstruos-al-combate -m "Merge monstruos-al-combate — los monstruos del bestiario entran al combate

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
git push origin master
git branch -d monstruos-al-combate
```

- [ ] **Step 4: Recordarle al usuario lo que toca ahora**

**Jugar una sesión.** La fase 2 (la «arena») sigue bloqueada hasta entonces, y ahora hay siete features sin probar en vez de seis.

---

## Qué NO entra en este plan (del spec, a propósito)

- **Que la app resuelva los ataques del monstruo** (sus `actions` con sus tiradas). El DM las lee del bestiario y las tira a mano. Otra losa.
- **Conocimiento por jugador**: el descubrimiento es **de grupo**, como ya era.
- **CA visible para los jugadores**: la app nunca ha comparado la CA y sigue sin hacerlo.
- **Iniciativa automática de los jugadores**: cada uno tira la suya.
- **Gestión de encuentros guardados**: entra el botón de quitar una fila, y nada más.
- **Toda la fase 2 (la arena)**: retratos, bandos, menú de consola, caja de narración. **Bloqueada hasta jugar.**

## Autorrevisión (hecha al escribir el plan)

**Cobertura del spec**, sección por sección:

| Sección del spec | Tarea |
|---|---|
| Migración `schema_v23` (4 columnas) | Task 1 |
| `saludDe` + `nombresNumerados` + `check-combate` | Task 2 |
| Buscador, cantidad, interruptor individual, botón Añadir | Task 4 |
| Tandas con su propia tirada (el jefe no comparte con los esbirros) | Task 4, `addMonsters` |
| Filas con `is_npc`, nombre numerado, `monster_slug`, `value`, `hp = hp_max` | Task 3 (`addMonstersInitiative`) + Task 4 |
| Añadir marca como descubierto | Task 4 |
| El DM ve `11/13`, el jugador «malherido» | Task 5 |
| Condiciones visibles por todos; el DM las marca | Task 5 |
| Botón de quitar por fila | Task 5 |
| Las reglas de G4 muerden contra monstruos | Task 6 |
| Verificación y prueba del usuario | Tasks 2, 6, 7 |

**Hueco del spec que este plan cubre de más, y por qué:** el spec da por hecho que la migración estará ejecutada cuando el código corra. `useInitiative` traga el error del `select`, así que ese supuesto convertía «falta la v23» en «no hay combate» — el bug del 22 de julio con otra cara. Es la Tarea 3, y no es alcance colado: es la condición para que las columnas se puedan leer sin riesgo.

**Dos cuentas del spec que este plan corrige:** dice que el gate son «10 scripts» y que pasa a 11. Son **19** y pasan a **20** (recuento del 2026-07-28, todos en verde; ver la sección «Scripts de comprobación» del HANDOFF).

**Consistencia de tipos:** `InitiativeRow` (Task 3) se usa en `estadoDe` (Task 5) y `condsDe` (Task 6) con los mismos nombres de campo (`hp`, `hp_max`, `conds`, `monster_slug`). `NuevoMonstruo` (Task 3) tiene las cuatro claves que construye `addMonsters` (Task 4): `nombre`, `slug`, `hp`, `valor`. `saludDe`/`nombresNumerados` (Task 2) se llaman con esas firmas exactas en las Tasks 4 y 5. `setNpcHp` toma `(id, hp, hpMax)` en Task 3 y se llama con tres argumentos en Task 5.
