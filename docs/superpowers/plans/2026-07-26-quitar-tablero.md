# Fuera el tablero: la iniciativa es el combate — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Retirar el tablero de batalla y poner en su sitio `/combate`, donde el objetivo se elige tocando una fila de la iniciativa y las reglas que antes medían distancia se deducen del arma.

**Architecture:** Primero se cambian las reglas puras (de metros a un booleano `cuerpoACuerpo`) y su consumidor, para que el árbol siga compilando. Después `InitiativeTracker` gana selección y estado opcionales —en vez de escribir una lista nueva—, se monta la pantalla `/combate`, y solo al final se borra el tablero. **Sin migración**; las tablas `battle_tokens`/`battle_board` se dejan muertas, no se borran.

**Tech Stack:** TypeScript · Next.js 16 (App Router) · React 19 · Supabase Realtime. No hay framework de test: el gate son `npx tsx scripts/check-*.ts`, `npx tsc --noEmit` y `npx next build`.

**Spec:** `docs/superpowers/specs/2026-07-26-quitar-tablero-design.md`

**Rama:** `quitar-tablero` (creada, con el spec comiteado). Trabajar desde `C:\Users\carlo\Downloads\dnd-campaign-app`. Si `git` dice «not a git repository», hacer `cd` al repo primero. Los heredoc de commit necesitan el **bash tool** (el shell por defecto es PowerShell). **Nunca `git add -A`.**

> **El árbol compila después de cada tarea.** Está ordenado a propósito para eso:
> las reglas y su consumidor cambian juntos (Tarea 1), el `Objetivo` no pierde
> `distancia` hasta que nadie la usa (Tarea 3), y los borrados van al final
> (Tarea 4).

---

## File Structure

- **Modify** `lib/targeting.ts` — `distanciaM: number` → `cuerpoACuerpo: boolean`; se elimina `enAlcance`.
- **Modify** `scripts/check-targeting.ts` — comprobaciones adaptadas.
- **Modify** `components/personaje/Ataques.tsx` — deduce `cuerpoACuerpo` del arma; fuera el bloqueo de alcance.
- **Modify** `components/InitiativeTracker.tsx` — selección de objetivo y estado de los jugadores, ambos opcionales.
- **Create** `app/combate/page.tsx` — la pantalla nueva (dueña del objetivo).
- **Modify** `components/tablero/PanelCombate.tsx` → **movido a** `components/combate/PanelCombate.tsx` — recibe el objetivo ya resuelto.
- **Move** `components/tablero/DiceFeedStrip.tsx` → `components/combate/DiceFeedStrip.tsx`.
- **Delete** `app/tablero/page.tsx`, `components/tablero/BattleBoard.tsx`, `lib/useBattle.ts`, `lib/tablero.ts`, `scripts/check-tablero.ts`, `app/dm/TableroPanel.tsx`.
- **Modify** `components/SiteNav.tsx` (enlace) y `app/dm/DmDashboard.tsx` (pestaña).
- **Modify** `HANDOFF.md` + vault — documentación (Tarea 5).

---

## Task 1: Las reglas dejan de medir

**Files:**
- Modify: `scripts/check-targeting.ts`
- Modify: `lib/targeting.ts`
- Modify: `components/personaje/Ataques.tsx`

- [ ] **Step 1: Adapta `scripts/check-targeting.ts` (el test que falla)**

Cambia la línea del import:

```ts
import {
  ventajaAtacante, combinar, enAlcance, autoFallaSalvacion,
  ventajaSalvacion, critProximidad, formulaDaño,
} from "../lib/targeting";
```

por (sin `enAlcance`):

```ts
import {
  ventajaAtacante, combinar, autoFallaSalvacion,
  ventajaSalvacion, critProximidad, formulaDaño,
} from "../lib/targeting";
```

Sustituye el bloque de `ventajaAtacante` (todas sus comprobaciones, que hoy pasan metros) por:

```ts
// --- ventajaAtacante -----------------------------------------------------
// Ya no se mide: `cuerpoACuerpo` se deduce del arma (true = arma de cuerpo).
for (const s of ["cegado", "paralizado", "petrificado", "restringido", "aturdido", "inconsciente"]) {
  const v = ventajaAtacante([s], true);
  check(`${s}: atacante con ventaja (cuerpo)`, v.adv === true && v.dis === false);
  const vd = ventajaAtacante([s], false);
  check(`${s}: atacante con ventaja también a distancia`, vd.adv === true && vd.dis === false);
}
check("apresado NO da ventaja al atacante", (() => { const v = ventajaAtacante(["apresado"], true); return !v.adv && !v.dis; })());
check("sin condiciones: ni ventaja ni desventaja", (() => { const v = ventajaAtacante([], true); return !v.adv && !v.dis; })());
check("derribado, arma de cuerpo: ventaja", (() => { const v = ventajaAtacante(["derribado"], true); return v.adv && !v.dis; })());
check("derribado, arma a distancia: desventaja", (() => { const v = ventajaAtacante(["derribado"], false); return !v.adv && v.dis; })());
check("cegado + derribado a distancia: ambas caras", (() => { const v = ventajaAtacante(["cegado", "derribado"], false); return v.adv && v.dis; })());
```

**Borra entero** el bloque `// --- enAlcance ---` con sus cuatro comprobaciones.

Sustituye el bloque de `critProximidad` por:

```ts
// --- critProximidad ------------------------------------------------------
check("paralizado, arma de cuerpo: crítico", critProximidad(["paralizado"], true) === true);
check("inconsciente, arma de cuerpo: crítico", critProximidad(["inconsciente"], true) === true);
check("paralizado, arma a distancia: NO crítico", critProximidad(["paralizado"], false) === false);
check("cegado, arma de cuerpo: NO crítico (condición no aplica)", critProximidad(["cegado"], true) === false);
check("sin condiciones: NO crítico", critProximidad([], true) === false);
```

Si el archivo importa `ARMAS` de `../data/weapons` y tras estos cambios ya no lo usa, **borra también ese import** (si sigue usándose en otras comprobaciones, déjalo).

- [ ] **Step 2: Ejecuta el script y comprueba que FALLA**

Run: `npx tsx scripts/check-targeting.ts`
Expected: falla (las firmas todavía piden metros, o `enAlcance` sigue exportado y el import ya no cuadra).

- [ ] **Step 3: Cambia `lib/targeting.ts`**

Sustituye la función `ventajaAtacante` entera por:

```ts
/**
 * Ventaja/desventaja que gana EL ATACANTE por la condición del objetivo.
 * `cuerpoACuerpo` se DEDUCE DEL ARMA (una daga se usa en cuerpo a cuerpo, un
 * arco dispara), así que no hace falta medir nada sobre un tablero.
 * Devuelve flags crudos: la anulación 2024 se aplica una sola vez en `combinar`.
 */
export function ventajaAtacante(
  condsObjetivo: string[],
  cuerpoACuerpo: boolean,
): { adv: boolean; dis: boolean } {
  const c = new Set(condsObjetivo);
  let adv = false;
  let dis = false;
  // Atacar a estos objetivos es con ventaja (RAW 2024), se esté cerca o lejos:
  for (const s of ["cegado", "paralizado", "petrificado", "restringido", "aturdido", "inconsciente"])
    if (c.has(s)) adv = true;
  // Derribado: ventaja cuerpo a cuerpo, desventaja a distancia.
  if (c.has("derribado")) { if (cuerpoACuerpo) adv = true; else dis = true; }
  // apresado (grappled) NO da ventaja al atacante.
  return { adv, dis };
}
```

**Borra entera** la función `enAlcance` con su comentario.

Sustituye la función `critProximidad` entera por:

```ts
/**
 * ¿El ataque es crítico por proximidad? Con un arma de CUERPO A CUERPO contra un
 * objetivo paralizado o inconsciente (RAW 2024: cualquier ataque que acierte a
 * ≤1,5 m, y con un arma de cuerpo estás ahí por definición). El 20 natural va
 * aparte, vía dice.critState.
 */
export function critProximidad(condsObjetivo: string[], cuerpoACuerpo: boolean): boolean {
  if (!cuerpoACuerpo) return false;
  const c = new Set(condsObjetivo);
  return c.has("paralizado") || c.has("inconsciente");
}
```

Si tras borrar `enAlcance` el import de `Arma` queda sin usar, bórralo también.

> **Consecuencia asumida, ya decidida en el spec**: se pierde el matiz de que un
> arma a distancia disparada a quemarropa también daría crítico. Es el precio de
> no medir, y va a favor de **quedarse corto antes que pasarse**.

- [ ] **Step 4: Adapta `components/personaje/Ataques.tsx`**

Cambia el import de targeting:

```ts
import { ventajaAtacante, combinar, enAlcance, critProximidad, formulaDaño } from "@/lib/targeting";
```

por:

```ts
import { ventajaAtacante, combinar, critProximidad, formulaDaño } from "@/lib/targeting";
```

Dentro del componente, **borra** esta línea:

```tsx
  const distancia = objetivo?.distancia ?? null;
```

Dentro de `atacar`, **borra** el bloque del bloqueo de alcance entero:

```tsx
    // Alcance (bloqueo duro): solo cuando hay distancia medida.
    if (distancia !== null && !enAlcance(arma, distancia)) {
      setErr(`Fuera de alcance (${distancia} m).`);
      return;
    }
```

Y sustituye las dos líneas de la ventaja:

```tsx
    // Ventaja combinada: la propia (G1) + la del objetivo (si hay distancia).
    const advObjetivo = distancia !== null ? ventajaAtacante(condsObjetivo, distancia) : { adv: false, dis: false };
    const adv = combinar(ventajaDe(play, "ataque"), advObjetivo);
```

por:

```tsx
    // Con un arma de cuerpo estás en cuerpo a cuerpo por definición; con una de
    // distancia, no. Ya no hace falta medir.
    const cuerpoACuerpo = arma.alcance === "cuerpo";
    // Ventaja combinada: la propia (G1) + la del objetivo (solo si hay objetivo).
    const advObjetivo = objetivo ? ventajaAtacante(condsObjetivo, cuerpoACuerpo) : { adv: false, dis: false };
    const adv = combinar(ventajaDe(play, "ataque"), advObjetivo);
```

Y sustituye la línea del crítico por proximidad:

```tsx
    const critProx = distancia !== null && critProximidad(condsObjetivo, distancia);
```

por:

```tsx
    const critProx = !!objetivo && critProximidad(condsObjetivo, cuerpoACuerpo);
```

- [ ] **Step 5: Ejecuta el script y comprueba que PASA**

Run: `npx tsx scripts/check-targeting.ts`
Expected: `Todo en verde`. Si algo falla, corrige la **implementación**, nunca las comprobaciones.

- [ ] **Step 6: Tipos y regresión**

Run: `npx tsc --noEmit && npx tsx scripts/check-ataque.ts && npx tsx scripts/check-estado.ts`
Expected: `tsc` limpio (el `Objetivo` sigue teniendo `distancia`, aunque ya no se use: se quita en la Tarea 3) y los dos scripts en verde.

- [ ] **Step 7: Commit**

```bash
git add lib/targeting.ts scripts/check-targeting.ts components/personaje/Ataques.tsx
git commit -F - <<'EOF'
refactor(combate): las reglas se deducen del arma en vez de medir

ventajaAtacante y critProximidad cambian el parámetro de metros por un booleano
cuerpoACuerpo, que sale del arma: una daga se usa en cuerpo a cuerpo y un arco
dispara, así que no hace falta un tablero para saberlo. Derribado sigue dando
ventaja de cerca y desventaja de lejos, ahora de forma más directa.

enAlcance se elimina: sin rejilla no hay nada que bloquear, y declarar un
absurdo lo corta el DM, igual que la app tampoco compara la CA.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 2: `InitiativeTracker` gana selección y estado

**Files:**
- Modify: `components/InitiativeTracker.tsx`

En vez de escribir una lista de combatientes nueva, se extiende la que ya existe: ya pinta las filas ordenadas, marca de quién es el turno, distingue PNJ y trae los mandos del DM. Las props nuevas son **opcionales**, así que su montaje en Panel DM › Dados sigue igual.

- [ ] **Step 1: Añade las props**

Sustituye el bloque `type Props` entero por:

```tsx
type Props = {
  mod?: number;      // modificador de Destreza para "Tirar iniciativa" (derive().abilities.des.mod)
  hideEmpty?: boolean; // no renderizar nada si no hay ronda en curso (uso embebido en la hoja)
  /**
   * Si se pasa, cada fila (menos la tuya) es pulsable y elige objetivo. Recibe
   * el id de la fila, o null al deseleccionar tocando la ya elegida.
   */
  onSelect?: (id: number | null) => void;
  /** Fila elegida ahora mismo como objetivo. */
  selectedId?: number | null;
  /** Muestra los PG y las condiciones de los jugadores en cada fila. */
  conEstado?: boolean;
};
```

Y la firma del componente:

```tsx
export default function InitiativeTracker({ mod = 0, hideEmpty = false }: Props) {
```

por:

```tsx
export default function InitiativeTracker({ mod = 0, hideEmpty = false, onSelect, selectedId = null, conEstado = false }: Props) {
```

- [ ] **Step 2: Añade el import de `derive` y el lector de estado**

Junto a los imports de arriba del archivo, añade:

```tsx
import { derive } from "@/lib/derive";
import { pgActuales } from "@/lib/estado";
import type { PlayState } from "@/lib/recursos";
```

Y dentro del componente, después de `const { rows } = useInitiative();`, añade:

```tsx
  // Estado del jugador de una fila: PG actuales/máximos y condiciones. Los PNJ
  // no tienen ficha, así que devuelven null (sus PG llegan en la losa siguiente).
  const estadoDe = (r: InitiativeRow): { hp: number; maxHp: number; conds: string[] } | null => {
    if (r.is_npc || !r.user_id) return null;
    const p = party.find((x) => x.user_id === r.user_id);
    if (!p) return null;
    const play = (p.play_state as PlayState | undefined) ?? {};
    const maxHp = derive(p).maxHp;
    return { hp: pgActuales(play, maxHp), maxHp, conds: play.conds ?? [] };
  };
```

- [ ] **Step 3: Haz las filas pulsables y píntales el estado**

Sustituye el `<div key={r.id} …>` de cada fila (el bloque completo desde `{rows.map((r) => (` hasta su `))}`) por:

```tsx
          {rows.map((r) => {
            const est = conEstado ? estadoDe(r) : null;
            const esMia = !r.is_npc && r.user_id === myId;
            const elegible = !!onSelect && !esMia;
            const elegida = selectedId === r.id;
            return (
              <div
                key={r.id}
                onClick={elegible ? () => onSelect!(elegida ? null : r.id) : undefined}
                className={`panel-raised px-3 py-2 flex items-center justify-between gap-3 ${elegible ? "cursor-pointer" : ""}`}
                style={
                  elegida
                    ? { borderColor: "var(--color-ember)", boxShadow: "0 0 0 1px var(--color-ember)" }
                    : r.active
                      ? { borderColor: "var(--color-bronze)", boxShadow: "0 0 0 1px var(--color-bronze), 0 0 20px -4px rgba(201,163,92,0.5)" }
                      : undefined
                }
              >
                <span className="min-w-0">
                  <span className="font-ui text-[13px] font-semibold flex items-center gap-2" style={{ color: r.active ? "var(--color-bronze-bright)" : "var(--color-warm)" }}>
                    {r.active && <i className="fas fa-play text-[10px]" style={{ color: "var(--color-bronze)" }} />}
                    {r.is_npc && <i className="fas fa-dragon text-[11px]" style={{ color: "var(--color-dim)" }} />}
                    {nameFor(r)}
                    {elegida && <i className="fas fa-crosshairs text-[11px]" style={{ color: "var(--color-ember)" }} title="Tu objetivo" />}
                  </span>
                  {est && (
                    <span className="font-ui text-[11px] flex items-center gap-2 mt-0.5" style={{ color: "var(--color-dim)" }}>
                      <span>PG {est.hp}/{est.maxHp}</span>
                      {est.conds.length > 0 && (
                        <span style={{ color: "var(--color-violet)" }}>{est.conds.join(" · ")}</span>
                      )}
                    </span>
                  )}
                </span>
                <span className="font-display font-extrabold text-[15px] shrink-0" style={{ color: "var(--color-arcane-bright)" }}>
                  {r.value ?? "—"}
                </span>
              </div>
            );
          })}
```

- [ ] **Step 4: Verifica tipos y build**

Run: `npx tsc --noEmit && npx next build`
Expected: ambos limpios. Si `derive(p)` da error de tipos, mira cómo lo llama `app/dm/GrupoPanel.tsx` con un miembro de `useParty` y cásteo igual; **no** cambies la firma de `derive`.

Si `--color-violet` no existe en `app/globals.css`, usa `var(--color-arcane-bright)`. Compruébalo:

Run: `grep -n "\-\-color-violet" app/globals.css`
Expected: al menos una línea. Si no sale ninguna, cambia el color como se indica — una variable CSS inexistente **invalida la declaración en silencio** (la lección de `--color-gold`).

- [ ] **Step 5: Commit**

```bash
git add components/InitiativeTracker.tsx
git commit -F - <<'EOF'
feat(combate): la iniciativa puede elegir objetivo y mostrar estado

InitiativeTracker gana tres props opcionales: onSelect/selectedId hacen cada
fila pulsable para elegir objetivo (la tuya no), y conEstado pinta los PG y las
condiciones de los jugadores. Al ser opcionales, su montaje en Panel DM › Dados
sigue igual. Es la base de la pantalla de combate sin tablero: reutiliza la
lista que ya ordenaba por iniciativa y marcaba de quién es el turno.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 3: La pantalla `/combate`

**Files:**
- Create: `components/combate/PanelCombate.tsx` (movido y adaptado)
- Create: `components/combate/DiceFeedStrip.tsx` (movido tal cual)
- Create: `app/combate/page.tsx`
- Modify: `components/personaje/Ataques.tsx` (el tipo `Objetivo` pierde `distancia`)
- Delete: `app/tablero/page.tsx`

- [ ] **Step 1: Mueve `DiceFeedStrip` sin tocar su contenido**

```bash
mkdir -p components/combate
git mv components/tablero/DiceFeedStrip.tsx components/combate/DiceFeedStrip.tsx
```

- [ ] **Step 2: Quita `distancia` del tipo `Objetivo`**

En `components/personaje/Ataques.tsx`, sustituye el tipo:

```tsx
export type Objetivo = {
  /** id de la ficha del tablero, para distinguir objetivos repetidos por nombre. */
  id: number;
  label: string;
  /** Distancia en metros desde la ficha propia, o null si no se puede medir. */
  distancia: number | null;
  /** Condiciones del objetivo si es un jugador legible; PNJ ⇒ vacío. */
  conds: string[];
};
```

por:

```tsx
export type Objetivo = {
  /** id de la fila de iniciativa, para distinguir objetivos repetidos por nombre. */
  id: number;
  label: string;
  /** Condiciones del objetivo si es un jugador legible; PNJ ⇒ vacío. */
  conds: string[];
};
```

- [ ] **Step 3: Crea `components/combate/PanelCombate.tsx`**

```bash
git mv components/tablero/PanelCombate.tsx components/combate/PanelCombate.tsx
```

Y sustituye su contenido **entero** por:

```tsx
"use client";
import { useState } from "react";
import EstadoVivo from "@/components/personaje/EstadoVivo";
import EconomiaTurno from "@/components/personaje/EconomiaTurno";
import Ataques, { type Objetivo } from "@/components/personaje/Ataques";
import Conjuros from "@/components/personaje/Conjuros";
import PozosClase from "@/components/personaje/PozosClase";
import { pozosDe, referenciasDe } from "@/lib/recursos";
import { ataquesPorAccion } from "@/lib/ataque";
import { armaDe } from "@/data/weapons";
import type { FichaViva } from "@/lib/useFichaViva";
import type { PlayState } from "@/lib/recursos";

type Pestaña = "ataques" | "conjuros" | "rasgos";

// La columna de acciones de la pantalla de combate: estado y turno SIEMPRE
// visibles, y lo que se hace en el turno en pestañas para que no se desborde.
//
// El OBJETIVO ya no se elige aquí: se elige tocando una fila de la iniciativa,
// y la página lo pasa ya resuelto. Aquí solo se muestra y se puede soltar.
export default function PanelCombate({
  ficha, objetivo, objetivosDisponibles, onSoltarObjetivo, sessionId, readOnly = false,
}: {
  ficha: FichaViva;
  objetivo: Objetivo | null;
  /** Todos los combatientes apuntables (para los conjuros de varias instancias). */
  objetivosDisponibles: Objetivo[];
  onSoltarObjetivo: () => void;
  sessionId: string | null;
  readOnly?: boolean;
}) {
  const [pestaña, setPestaña] = useState<Pestaña>("ataques");

  const { play, derived, mechanics, clsSlug, level, items, velocidad, onPlayStateChange } = ficha;

  const esConjurador = (mechanics?.caster ?? "none") !== "none";
  // «Rasgos» no es solo pozos que se gastan: también las columnas de REFERENCIA
  // (dado de ataque furtivo del pícaro, trucos y preparados del mago…).
  const tienePozos = !!clsSlug && (pozosDe(clsSlug, level, play).length > 0 || referenciasDe(clsSlug, level).length > 0);
  const tieneArmas = items.some((it) => !!armaDe(it.name));
  const maxAtaques = clsSlug ? ataquesPorAccion(clsSlug, level) : 1;

  const tabs: { id: Pestaña; icon: string; label: string }[] = [
    { id: "ataques", icon: "khanda", label: "Ataques" },
    ...(esConjurador ? [{ id: "conjuros" as Pestaña, icon: "wand-sparkles", label: "Conjuros" }] : []),
    ...(tienePozos ? [{ id: "rasgos" as Pestaña, icon: "gem", label: "Rasgos" }] : []),
  ];
  // Si la pestaña abierta ya no existe (cambio de clase), cae en la primera.
  const activa = tabs.some((t) => t.id === pestaña) ? pestaña : "ataques";

  const cambia = (next: PlayState) => onPlayStateChange(next);

  return (
    <div className="space-y-3">
      {/* SIEMPRE VISIBLE: estado */}
      <section className="panel p-4">
        <p className="eyebrow mb-2"><i className="fas fa-heart-pulse mr-1.5" style={{ color: "var(--color-ember)" }} />Estado</p>
        <EstadoVivo play={play} maxHp={derived.maxHp} onChange={cambia} readOnly={readOnly} />
      </section>

      {/* SIEMPRE VISIBLE: turno */}
      <section className="panel p-4">
        <p className="eyebrow mb-2"><i className="fas fa-hourglass-half mr-1.5" style={{ color: "var(--color-bronze)" }} />Turno</p>
        <EconomiaTurno play={play} velocidad={velocidad} onChange={cambia} readOnly={readOnly} />
      </section>

      {/* ACCIONES: objetivo + pestañas */}
      <section className="panel p-4">
        <div className="panel-raised px-3 py-2 mb-3 flex items-center justify-between gap-2">
          <span className="font-ui text-[12px]" style={{ color: "var(--color-dim)" }}>Objetivo</span>
          {objetivo ? (
            <span className="flex items-center gap-2">
              <span className="font-ui text-[12px] font-bold" style={{ color: "var(--color-ember)" }}>
                <i className="fas fa-crosshairs mr-1.5" />{objetivo.label}
              </span>
              <button className="font-ui text-[11px]" style={{ color: "var(--color-dim)" }} onClick={onSoltarObjetivo}>
                soltar
              </button>
            </span>
          ) : (
            <span className="font-ui text-[12px] italic" style={{ color: "var(--color-dim)" }}>
              toca a alguien en la iniciativa
            </span>
          )}
        </div>

        <div className="flex gap-1 mb-3">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setPestaña(t.id)}
              className="font-ui text-[12px] px-3 py-1.5 rounded-md transition-colors"
              style={{
                background: activa === t.id ? "var(--color-bronze)" : "transparent",
                color: activa === t.id ? "var(--color-night)" : "var(--color-muted)",
                border: `1px solid var(--color-bronze-deep)`,
              }}
            >
              <i className={`fas fa-${t.icon} mr-1.5`} />{t.label}
            </button>
          ))}
        </div>

        {activa === "ataques" && !tieneArmas && (
          <p className="font-ui text-[12px] italic" style={{ color: "var(--color-dim)" }}>
            No llevas ningún arma del catálogo en el inventario.
          </p>
        )}
        {activa === "ataques" && tieneArmas && (
          <Ataques
            play={play}
            items={items}
            abilities={{ fue: derived.abilities.fue.mod, des: derived.abilities.des.mod }}
            prof={derived.prof}
            classWeapons={mechanics?.weapons ?? []}
            sessionId={sessionId}
            objetivo={objetivo}
            maxAtaques={maxAtaques}
            onChange={cambia}
            readOnly={readOnly}
          />
        )}

        {activa === "conjuros" && (
          <Conjuros
            clsSlug={clsSlug}
            level={level}
            caster={mechanics?.caster ?? "none"}
            spellDc={derived.spellDc ?? 0}
            spellAttack={derived.spellAttack ?? 0}
            play={play}
            sessionId={sessionId}
            objetivo={objetivo}
            objetivosDisponibles={objetivosDisponibles}
            onChange={cambia}
            readOnly={readOnly}
          />
        )}

        {activa === "rasgos" && clsSlug && (
          <PozosClase clsSlug={clsSlug} level={level} play={play} onChange={cambia} readOnly={readOnly} />
        )}
      </section>
    </div>
  );
}
```

- [ ] **Step 4: Crea `app/combate/page.tsx`**

```tsx
"use client";
import { useState } from "react";
import { useSession } from "@/components/SessionProvider";
import { useInitiative, type InitiativeRow } from "@/lib/useInitiative";
import { useParty } from "@/lib/character";
import { useFichaViva } from "@/lib/useFichaViva";
import InitiativeTracker from "@/components/InitiativeTracker";
import PanelCombate from "@/components/combate/PanelCombate";
import DiceFeedStrip from "@/components/combate/DiceFeedStrip";
import type { Objetivo } from "@/components/personaje/Ataques";
import type { PlayState } from "@/lib/recursos";

// La pantalla de combate. A la izquierda, los combatientes (la iniciativa, que
// ya tiene una fila por cada uno): tocas a alguien y es tu objetivo. A la
// derecha, tu estado, tu turno y lo que puedes hacer. Abajo, las últimas
// tiradas.
//
// HAY COMBATE si la iniciativa tiene filas; vaciarla lo termina. Sin combate el
// panel derecho sigue entero: entre escenas hay que poder curarse, preparar
// conjuros y gastar rasgos.
export default function CombatePage() {
  const session = useSession();
  const { rows } = useInitiative();
  const { party } = useParty();
  const ficha = useFichaViva(session?.id ?? null, "self");
  const [targetId, setTargetId] = useState<number | null>(null);

  const nombreDe = (r: InitiativeRow): string => {
    if (r.is_npc) return r.npc_name ?? "PNJ";
    return party.find((p) => p.user_id === r.user_id)?.username ?? "jugador";
  };
  // Condiciones del objetivo: solo si es un jugador legible. Los PNJ no tienen
  // ficha (sus PG y condiciones llegan en la losa siguiente).
  const condsDe = (r: InitiativeRow): string[] =>
    r.is_npc || !r.user_id
      ? []
      : ((party.find((p) => p.user_id === r.user_id)?.play_state as PlayState | undefined)?.conds ?? []);

  const comoObjetivo = (r: InitiativeRow): Objetivo => ({ id: r.id, label: nombreDe(r), conds: condsDe(r) });
  // Todos menos tú: el objetivo es para atacar; curarse se hace desde Estado.
  const objetivosDisponibles: Objetivo[] = rows
    .filter((r) => r.is_npc || r.user_id !== session?.id)
    .map(comoObjetivo);
  const fila = targetId !== null ? rows.find((r) => r.id === targetId) ?? null : null;
  const objetivo: Objetivo | null = fila ? comoObjetivo(fila) : null;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <header className="text-center mb-5">
        <p className="eyebrow mb-2"><i className="fas fa-khanda mr-1.5" style={{ color: "var(--color-bronze)" }} />Campo de batalla</p>
        <h1 className="font-display text-3xl md:text-4xl font-extrabold gold-text">Combate</h1>
      </header>

      <div className="grid lg:grid-cols-[1.2fr_1fr] gap-5 items-start">
        <div className="space-y-3">
          <InitiativeTracker
            mod={ficha.derived.abilities.des.mod}
            conEstado
            onSelect={setTargetId}
            selectedId={targetId}
          />
          {rows.length > 0 && (
            <p className="font-ui text-[11px] text-center italic" style={{ color: "var(--color-dim)" }}>
              Toca a un combatiente para apuntarle. Vaciar la iniciativa termina el combate.
            </p>
          )}
        </div>

        <div>
          {!ficha.ready ? (
            <p className="text-center text-sm py-10" style={{ color: "var(--color-dim)" }}>Cargando tu ficha…</p>
          ) : ficha.error ? (
            <p className="text-center text-sm italic py-10" style={{ color: "var(--color-ember)" }}>{ficha.error}</p>
          ) : !ficha.characterId ? (
            <div className="panel p-6 text-center">
              <i className="fas fa-hat-wizard text-2xl mb-2" style={{ color: "var(--color-dim)" }} />
              <p className="font-ui text-[13px]" style={{ color: "var(--color-dim)" }}>
                No tienes un personaje en juego.
              </p>
            </div>
          ) : (
            <PanelCombate
              ficha={ficha}
              objetivo={objetivo}
              objetivosDisponibles={objetivosDisponibles}
              onSoltarObjetivo={() => setTargetId(null)}
              sessionId={session?.id ?? null}
            />
          )}
        </div>
      </div>

      <div className="mt-5">
        <DiceFeedStrip />
      </div>
    </main>
  );
}
```

- [ ] **Step 5: Quita la distancia del selector de `Conjuros`**

`components/personaje/Conjuros.tsx` pinta la distancia en el selector de
objetivos por instancia, así que al quitar `distancia` del tipo deja de
compilar. Busca esta línea:

```tsx
                      <option key={o.id} value={o.id}>{o.label}{o.distancia !== null ? ` · ${o.distancia} m` : ""}</option>
```

y sustitúyela por:

```tsx
                      <option key={o.id} value={o.id}>{o.label}</option>
```

- [ ] **Step 6: Borra la página vieja**

```bash
git rm app/tablero/page.tsx
```

- [ ] **Step 7: Verifica tipos y build**

Run: `npx tsc --noEmit && npx next build`
Expected: **fallará** en `app/dm/TableroPanel.tsx`, que sigue importando `PanelCombate` de la ruta vieja y usando `useBattle`. Es lo esperado: ese archivo se borra en la Tarea 4. Si falla en cualquier OTRO sitio, léelo y arréglalo.

- [ ] **Step 8: Commit**

`git mv` y `git rm` ya dejan sus cambios preparados; solo hay que añadir lo
editado y lo nuevo.

```bash
git add components/combate components/personaje/Ataques.tsx app/combate/page.tsx
git commit -F - <<'EOF'
feat(combate): /combate, con la iniciativa como lista de combatientes

La pantalla de combate deja de tener rejilla: a la izquierda la iniciativa, que
ya tenía una fila por combatiente, y tocar a alguien lo convierte en tu
objetivo. A la derecha el panel de siempre, que ya no elige objetivo: lo recibe
resuelto y solo lo muestra, con un botón para soltarlo. Objetivo pierde
`distancia`, que ya no usa nadie.

Hay combate si la iniciativa tiene filas, así que battle_board.active sobra.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 4: Borrar el tablero

**Files:**
- Delete: `components/tablero/BattleBoard.tsx`, `lib/useBattle.ts`, `lib/tablero.ts`, `scripts/check-tablero.ts`, `app/dm/TableroPanel.tsx`
- Modify: `app/dm/DmDashboard.tsx`, `components/SiteNav.tsx`

- [ ] **Step 1: Borra los archivos**

```bash
git rm components/tablero/BattleBoard.tsx lib/useBattle.ts lib/tablero.ts scripts/check-tablero.ts app/dm/TableroPanel.tsx
```

Si la carpeta `components/tablero/` queda vacía, git la quita sola.

- [ ] **Step 2: Quita la pestaña del Panel DM**

En `app/dm/DmDashboard.tsx`:
- Borra la línea `import TableroPanel from "./TableroPanel";`.
- En el tipo `Tab`, quita `| "tablero"`.
- En el array de pestañas, quita la entrada `["tablero", "Tablero", "fa-chess-board"],`.
- Borra la línea `{tab === "tablero" && <TableroPanel />}`.

- [ ] **Step 3: Cambia el enlace del nav**

En `components/SiteNav.tsx`, sustituye:

```tsx
  { href: "/tablero", label: "Tablero" },
```

por:

```tsx
  { href: "/combate", label: "Combate" },
```

- [ ] **Step 4: Comprueba que no queda ninguna referencia**

Run: `grep -rn "useBattle\|BattleBoard\|lib/tablero\|/tablero\|TableroPanel" app components lib scripts data || echo "SIN REFERENCIAS"`
Expected: `SIN REFERENCIAS`. Si aparece alguna, quítala. (Las menciones dentro de `docs/` y `supabase/` son historia y **no** se tocan.)

- [ ] **Step 5: Verifica tipos y build**

Run: `npx tsc --noEmit && npx next build`
Expected: **ahora sí, los dos limpios**.

- [ ] **Step 6: Commit**

```bash
git add -u app components lib scripts
git commit -F - <<'EOF'
refactor(combate): fuera el tablero de batalla

Se borran BattleBoard, useBattle, lib/tablero.ts, check-tablero y la pestaña
Panel DM › Tablero, cuyos mandos útiles (añadir PNJ, siguiente turno, vaciar)
ya estaban en Panel DM › Dados. El nav pasa a enlazar /combate.

Las tablas battle_tokens y battle_board NO se borran: quedan vacías y sin uso,
documentadas como retiradas. Borrar tablas es irreversible y no gana nada; si
algún día vuelve el mapa, siguen ahí.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 5: Gate final + documentación

**Files:**
- Modify: `HANDOFF.md`
- Modify: vault Obsidian (`C:\Users\carlo\Desktop\Exandria-Obsidian\Exandria`)

- [ ] **Step 1: Gate completo — los diez scripts**

`check-tablero` ya no existe: el gate baja de 11 a 10.

Run: `for s in ficha spells conjuros targeting estado turno ataque clases lore clima; do printf "%-10s " "$s:"; npx tsx scripts/check-$s.ts 2>&1 | tail -1; done`
Expected: los diez terminan en `Todo en verde` (check-clima imprime `Todo OK`).

- [ ] **Step 2: Gate completo — tipos y build**

Run: `npx tsc --noEmit && npx next build`
Expected: ambos limpios.

- [ ] **Step 3: Actualiza `HANDOFF.md`**

- En «Lo último», añade la entrada **14** (2026-07-26): se retira el tablero; `/combate` con la iniciativa como lista de combatientes; las reglas se deducen del arma; sin migración.
- En **Estructura**, cambia `/tablero` por `/combate` y quita la pestaña Tablero del Panel DM.
- En la lista de migraciones, marca **`schema_v22` como ejecutada y luego RETIRADA**: sus tablas siguen ahí, vacías y sin uso, y **no se han borrado** a propósito.
- Añade una sección `## RESUELTO (2026-07-26): fuera el tablero, la iniciativa es el combate ⚔️` con el molde de las demás: las dos razones de la retirada, el hallazgo de que las reglas se deducen del arma, qué se borra y qué no, qué se pierde (medición de movimiento y mapa), y las **pruebas del usuario** copiadas del final del spec.
- En «Siguiente sugerido», pon como continuación los **PG y condiciones de los PNJ** en `initiative` (`schema_v23`), que es lo que quita el papel de la mesa.

- [ ] **Step 4: Actualiza el vault**

En `C:\Users\carlo\Desktop\Exandria-Obsidian\Exandria`:
- `00 Meta/Historial de desarrollo.md`: callout `> [!success] Fuera el tablero: la iniciativa es el combate (2026-07-26)` ARRIBA del de objetivos múltiples, contando por qué se retira, el hallazgo del arma, y que las tablas se dejan muertas sin borrar.
- `20 Arquitectura/Migraciones.md`: marca `schema_v22` como **retirada** (ejecutada, sus tablas siguen existiendo vacías, ya nadie las lee).
- `30 Componentes/Componentes clave.md`: quita `BattleBoard` y el bloque del tablero; añade que `InitiativeTracker` elige objetivo y muestra estado, y que `PanelCombate`/`DiceFeedStrip` viven en `components/combate/`.

- [ ] **Step 5: Commit de la documentación**

```bash
git add HANDOFF.md
git commit -F - <<'EOF'
docs(combate): HANDOFF y vault con la retirada del tablero

/combate sustituye a /tablero: la iniciativa es la lista de combatientes y
tocar a alguien lo apunta. Las reglas se deducen del arma en vez de medir.
schema_v22 queda marcada como retirada: sus tablas siguen ahí, vacías, sin uso
y sin borrar. Siguiente sugerido pasa a los PG de los PNJ en la iniciativa.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

- [ ] **Step 6: Merge a `master` y push** (cuando el usuario lo decida)

```bash
git checkout master && git merge --no-ff quitar-tablero && git push origin master
```

---

## Notas de verificación en vivo (del usuario)

- `/combate` **sin iniciativa**: la izquierda dice que no hay ronda; el panel derecho sigue entero (curarse, preparar conjuros, rasgos).
- El DM añade un PNJ desde Panel DM › Dados ⇒ aparece en la lista del jugador **sin recargar**.
- El jugador tira iniciativa desde `/combate` ⇒ su fila aparece con su valor.
- **Tocar una fila** la marca con la cruz de objetivo; tocarla otra vez la suelta; **tu propia fila no se puede elegir**.
- Con el objetivo **derribado**: atacar con **arma de cuerpo** ⇒ ventaja; con **arco** ⇒ desventaja.
- **Siguiente turno** mueve la marca y limpia la economía del que empieza, sin recargar.
- Ya **no existe** `/tablero` ni la pestaña Panel DM › Tablero, y el nav dice «Combate».
