# G4 — Targeting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elegir el objetivo de un ataque desde la ficha (usando las posiciones del tablero) y aplicar las cuatro reglas que G1/G2/G3 dejaron documentadas: ventaja del atacante por condición del objetivo, alcance del arma (bloqueo duro), fallo automático de salvación Fue/Des (+ desventaja de Des por restringido), y crítico automático (20 natural + proximidad).

**Architecture:** Capa pura nueva `lib/targeting.ts` (verificada por `scripts/check-targeting.ts` **antes** de tocar UI), luego dos puntos de cableado: `Ataques.tsx` (desplegable de objetivo + alcance/ventaja/crítico, leyendo tokens de `useBattle` y condiciones del objetivo-jugador de `useParty`) y las salvaciones de `CharacterSheet.tsx` (auto-fallo en línea + desventaja de restringido). Sin migración. Degrada al comportamiento G2 exacto cuando no hay tablero/objetivo.

**Tech Stack:** TypeScript · Next.js 16 (App Router) · React 19 · Supabase Realtime. Los "tests" son scripts `scripts/check-*.ts` ejecutados con `npx tsx` (no hay framework de test; ese es el gate real), más `npx tsc --noEmit` y `npx next build`.

**Spec:** `docs/superpowers/specs/2026-07-25-g4-targeting-design.md`

---

## File Structure

- **Create** `lib/targeting.ts` — reglas puras de targeting: `ventajaAtacante`, `combinar`, `enAlcance`, `autoFallaSalvacion`, `ventajaSalvacion`, `critProximidad`, `formulaDaño`. Sin React ni Supabase. Molde de `lib/ataque.ts`/`lib/estado.ts`.
- **Create** `scripts/check-targeting.ts` — verifica cada función de `lib/targeting.ts`. Patrón `check()` de `scripts/check-ataque.ts`.
- **Modify** `components/personaje/Ataques.tsx` — nuevo prop `ownUserId`; desplegable de objetivo desde `useBattle`; al atacar aplica alcance (bloqueo), ventaja combinada y crítico (20 natural o proximidad) con daño doblado.
- **Modify** `components/CharacterSheet.tsx` — pasa `ownUserId={targetUserId}` a `Ataques`; el botón de salvación aplica auto-fallo (aviso en línea, sin tirar) y desventaja de Des por restringido.
- **Modify** `HANDOFF.md` + vault Obsidian — documentación (Tarea 4).

---

## Task 1: Capa pura `lib/targeting.ts` + su script

**Files:**
- Create: `scripts/check-targeting.ts`
- Create: `lib/targeting.ts`

- [ ] **Step 1: Escribe el script de comprobación (el "test" que falla)**

Crea `scripts/check-targeting.ts` con este contenido exacto:

```ts
// Comprobación de las reglas de targeting. Uso: npx tsx scripts/check-targeting.ts
import {
  ventajaAtacante, combinar, enAlcance, autoFallaSalvacion,
  ventajaSalvacion, critProximidad, formulaDaño,
} from "../lib/targeting";
import { ARMAS } from "../data/weapons";

let failures = 0;
function check(label: string, cond: boolean) {
  if (cond) console.log(`OK   ${label}`);
  else { console.log(`FAIL ${label}`); failures++; }
}

// --- ventajaAtacante -----------------------------------------------------
for (const s of ["cegado", "paralizado", "petrificado", "restringido", "aturdido", "inconsciente"]) {
  const v = ventajaAtacante([s], 1.5);
  check(`${s}: atacante con ventaja`, v.adv === true && v.dis === false);
}
check("apresado NO da ventaja al atacante", (() => { const v = ventajaAtacante(["apresado"], 1.5); return !v.adv && !v.dis; })());
check("sin condiciones: ni ventaja ni desventaja", (() => { const v = ventajaAtacante([], 1.5); return !v.adv && !v.dis; })());
check("derribado a ≤1,5 m: ventaja (cuerpo)", (() => { const v = ventajaAtacante(["derribado"], 1.5); return v.adv && !v.dis; })());
check("derribado a >1,5 m: desventaja (distancia)", (() => { const v = ventajaAtacante(["derribado"], 3); return !v.adv && v.dis; })());
check("cegado + derribado a distancia: ambas caras", (() => { const v = ventajaAtacante(["cegado", "derribado"], 6); return v.adv && v.dis; })());

// --- combinar (anulación 2024, global) -----------------------------------
check("combinar: solo ventaja objetivo ⇒ adv", combinar(null, { adv: true, dis: false }) === "adv");
check("combinar: solo desventaja objetivo ⇒ dis", combinar(null, { adv: false, dis: true }) === "dis");
check("combinar: nada ⇒ null", combinar(null, { adv: false, dis: false }) === null);
check("combinar: propia dis + objetivo adv ⇒ null (anula)", combinar("dis", { adv: true, dis: false }) === null);
check("combinar: propia dis + objetivo dis ⇒ dis", combinar("dis", { adv: false, dis: true }) === "dis");
check("combinar: objetivo con ambas caras ⇒ null", combinar(null, { adv: true, dis: true }) === null);
check("combinar: propia adv + objetivo adv ⇒ adv", combinar("adv", { adv: true, dis: false }) === "adv");

// --- enAlcance -----------------------------------------------------------
check("daga (cuerpo) a 1,5 m: llega", enAlcance(ARMAS["Daga"], 1.5) === true);
check("daga (cuerpo) a 3 m: NO llega", enAlcance(ARMAS["Daga"], 3) === false);
check("arco corto (distancia) a 20 m: llega", enAlcance(ARMAS["Arco corto"], 20) === true);
check("espada larga (cuerpo) a 0 m: llega", enAlcance(ARMAS["Espada larga"], 0) === true);

// --- autoFallaSalvacion --------------------------------------------------
for (const s of ["paralizado", "aturdido", "inconsciente", "petrificado"]) {
  check(`${s}: auto-falla salvación de Fuerza`, autoFallaSalvacion([s], "fue") === true);
  check(`${s}: auto-falla salvación de Destreza`, autoFallaSalvacion([s], "des") === true);
  check(`${s}: NO auto-falla salvación de Constitución`, autoFallaSalvacion([s], "con") === false);
}
check("envenenado NO auto-falla salvación de Fuerza", autoFallaSalvacion(["envenenado"], "fue") === false);
check("sin condición: no auto-falla", autoFallaSalvacion([], "fue") === false);

// --- ventajaSalvacion ----------------------------------------------------
check("restringido: salvación de Des con desventaja", ventajaSalvacion(["restringido"], "des") === "dis");
check("restringido: salvación de Fue sin desventaja", ventajaSalvacion(["restringido"], "fue") === null);
check("sin restringido: salvación de Des sin desventaja", ventajaSalvacion(["envenenado"], "des") === null);

// --- critProximidad ------------------------------------------------------
check("paralizado, cuerpo a ≤1,5 m: crítico por proximidad", critProximidad(ARMAS["Daga"], ["paralizado"], 1.5) === true);
check("inconsciente, cuerpo a ≤1,5 m: crítico por proximidad", critProximidad(ARMAS["Daga"], ["inconsciente"], 1.5) === true);
check("paralizado, cuerpo a 3 m: NO crítico (lejos)", critProximidad(ARMAS["Daga"], ["paralizado"], 3) === false);
check("paralizado, distancia a 1,5 m: NO crítico (no cuerpo)", critProximidad(ARMAS["Arco corto"], ["paralizado"], 1.5) === false);
check("cegado, cuerpo a ≤1,5 m: NO crítico (condición no aplica)", critProximidad(ARMAS["Daga"], ["cegado"], 1.5) === false);

// --- formulaDaño ---------------------------------------------------------
check("daño normal 1d8+3", formulaDaño("1d8", 3, false) === "1d8+3");
check("daño crítico dobla dados 1d8 ⇒ 2d8+3", formulaDaño("1d8", 3, true) === "2d8+3");
check("daño crítico mod negativo 1d6-1 ⇒ 2d6-1", formulaDaño("1d6", -1, true) === "2d6-1");
check("daño mod 0 conserva +0", formulaDaño("1d4", 0, false) === "1d4+0");

if (failures) { console.log(`\n${failures} FALLos`); process.exit(1); }
console.log("\nTodo en verde");
```

- [ ] **Step 2: Ejecuta el script para verificar que falla**

Run: `npx tsx scripts/check-targeting.ts`
Expected: FALLA con `Cannot find module '../lib/targeting'` (el módulo aún no existe).

- [ ] **Step 3: Escribe `lib/targeting.ts`**

Crea `lib/targeting.ts` con este contenido exacto:

```ts
// Reglas de targeting de combate 2024, PURO (sin React ni Supabase). Molde de
// lib/ataque.ts / lib/estado.ts. Junta estado (G1), ataque (G2) y posición (G3):
// ventaja del atacante por la condición del objetivo, alcance del arma, fallo
// automático de salvación y crítico por proximidad. Mecánicas = hechos 2024.
import type { Arma } from "@/data/weapons";

/**
 * Ventaja/desventaja que gana EL ATACANTE por la condición del objetivo + la
 * distancia. Devuelve flags crudos (sin colapsar) para que la anulación 2024 se
 * aplique una sola vez, global, en `combinar`.
 */
export function ventajaAtacante(
  condsObjetivo: string[],
  distanciaM: number,
): { adv: boolean; dis: boolean } {
  const c = new Set(condsObjetivo);
  let adv = false;
  let dis = false;
  // Atacar a estos objetivos es con ventaja (RAW 2024):
  for (const s of ["cegado", "paralizado", "petrificado", "restringido", "aturdido", "inconsciente"])
    if (c.has(s)) adv = true;
  // Derribado: ventaja a ≤1,5 m (cuerpo), desventaja a >1,5 m (distancia).
  if (c.has("derribado")) { if (distanciaM <= 1.5) adv = true; else dis = true; }
  // apresado (grappled) NO da ventaja al atacante.
  return { adv, dis };
}

/**
 * Anulación 2024 sobre TODAS las fuentes: la ventaja propia (envenenado/asustado,
 * vía estado.ventajaDe) + la del objetivo. Cualquier adv Y cualquier dis ⇒ recto.
 * `propia` ya viene colapsada de ventajaDe; hoy no hay fuentes de ventaja propia,
 * así que colapsarla antes es sin pérdida.
 */
export function combinar(
  propia: "adv" | "dis" | null,
  objetivo: { adv: boolean; dis: boolean },
): "adv" | "dis" | null {
  const adv = objetivo.adv || propia === "adv";
  const dis = objetivo.dis || propia === "dis";
  if (adv && dis) return null;
  if (adv) return "adv";
  if (dis) return "dis";
  return null;
}

/**
 * ¿El arma llega a esa distancia? Cuerpo ⇒ ≤1,5 m (el catálogo no tiene armas de
 * alcance extendido). Distancia ⇒ siempre llega en el tablero (30 m × 18 m por
 * defecto; el catálogo no trae normal/largo).
 */
export function enAlcance(arma: Arma, distanciaM: number): boolean {
  return arma.alcance === "distancia" ? true : distanciaM <= 1.5;
}

/**
 * ¿Se auto-falla esta salvación por condición? Fue/Des con paralizado/aturdido/
 * inconsciente/petrificado ⇒ fallo automático (no se tira).
 */
export function autoFallaSalvacion(conds: string[], caracteristica: string): boolean {
  if (caracteristica !== "fue" && caracteristica !== "des") return false;
  const c = new Set(conds);
  return ["paralizado", "aturdido", "inconsciente", "petrificado"].some((s) => c.has(s));
}

/**
 * Desventaja de la salvación por condición específica de característica. Hoy solo
 * restringido ⇒ desventaja en la salvación de Des. Cierra la omisión honesta de G1.
 */
export function ventajaSalvacion(conds: string[], caracteristica: string): "dis" | null {
  return caracteristica === "des" && conds.includes("restringido") ? "dis" : null;
}

/**
 * ¿El ataque es crítico por proximidad? Cuerpo a ≤1,5 m contra objetivo
 * paralizado/inconsciente. (El 20 natural va aparte, vía dice.critState.)
 */
export function critProximidad(arma: Arma, condsObjetivo: string[], distanciaM: number): boolean {
  if (arma.alcance !== "cuerpo" || distanciaM > 1.5) return false;
  const c = new Set(condsObjetivo);
  return c.has("paralizado") || c.has("inconsciente");
}

/**
 * Fórmula de daño del arma. En crítico se DOBLAN los dados, no el modificador:
 * "1d8" + mod 3 crítico ⇒ "2d8+3". Sin crítico conserva el "+0" (compat con G2).
 */
export function formulaDaño(dado: string, mod: number, crit: boolean): string {
  const m = dado.match(/^(\d+)d(\d+)$/);
  const dados = crit && m ? `${parseInt(m[1], 10) * 2}d${m[2]}` : dado;
  return `${dados}${mod >= 0 ? "+" : ""}${mod}`;
}
```

- [ ] **Step 4: Ejecuta el script para verificar que pasa**

Run: `npx tsx scripts/check-targeting.ts`
Expected: cada línea `OK …` y al final `Todo en verde` (código de salida 0).

- [ ] **Step 5: Commit**

```bash
git add lib/targeting.ts scripts/check-targeting.ts
git commit -F - <<'EOF'
feat(g4): capa pura de targeting + check-targeting

ventajaAtacante (condición del objetivo + distancia), combinar (anulación
2024 global), enAlcance (bloqueo cuerpo >1,5 m), autoFallaSalvacion,
ventajaSalvacion (Des por restringido) y critProximidad. formulaDaño dobla
los dados en crítico. Verificado por scripts/check-targeting.ts.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 2: Cablear el objetivo en `Ataques.tsx`

**Files:**
- Modify: `components/CharacterSheet.tsx:646-655` (pasar el nuevo prop `ownUserId`)
- Modify: `components/personaje/Ataques.tsx` (reescritura del componente)

- [ ] **Step 1: Pasa `ownUserId` a `Ataques` en `CharacterSheet.tsx`**

En `components/CharacterSheet.tsx`, en el montaje de `<Ataques …>` (líneas 646-655), añade una prop. Cambia:

```tsx
            <Ataques
              play={playState}
              items={items}
              abilities={{ fue: d.abilities.fue.mod, des: d.abilities.des.mod }}
              prof={d.prof}
              classWeapons={mechanics?.weapons ?? []}
              sessionId={isOwner ? session!.id : null}
              onChange={onPlayStateChange}
              readOnly={readOnly && saveMode !== "self"}
            />
```

por (añade la línea `ownUserId={targetUserId}`):

```tsx
            <Ataques
              play={playState}
              items={items}
              abilities={{ fue: d.abilities.fue.mod, des: d.abilities.des.mod }}
              prof={d.prof}
              classWeapons={mechanics?.weapons ?? []}
              sessionId={isOwner ? session!.id : null}
              ownUserId={targetUserId}
              onChange={onPlayStateChange}
              readOnly={readOnly && saveMode !== "self"}
            />
```

- [ ] **Step 2: Reescribe `components/personaje/Ataques.tsx`**

Sustituye TODO el contenido de `components/personaje/Ataques.tsx` por:

```tsx
"use client";
import { useState } from "react";
import { armaDe, type Arma } from "@/data/weapons";
import { ataqueDe, type Ataque } from "@/lib/ataque";
import { gastar, turnoDe } from "@/lib/turno";
import { ventajaDe } from "@/lib/estado";
import { useBattle } from "@/lib/useBattle";
import { useParty } from "@/lib/character";
import { distanciaMetros } from "@/lib/tablero";
import { ventajaAtacante, combinar, enAlcance, critProximidad, formulaDaño } from "@/lib/targeting";
import { publishRoll } from "@/lib/useDiceFeed";
import { critState } from "@/lib/dice";
import { fmtMod } from "@/data/rules";
import type { PlayState } from "@/lib/recursos";

// Lista de ataques con las armas del inventario que existen en la tabla ARMAS.
// Cada una tira impacto (d20 + mod, con la ventaja combinada de G1 + la del
// objetivo) y daño (dado + mod, doblado en crítico), y marca la acción gastada.
// El objetivo se elige de un desplegable con las fichas del tablero (useBattle);
// la distancia se mide desde la ficha propia. Sin objetivo/ficha ⇒ comportamiento
// G2 exacto (solo ventaja propia, sin bloqueo de alcance). Las condiciones del
// objetivo solo se leen si es un JUGADOR legible por useParty; PNJ ⇒ el DM juzga.
export default function Ataques({
  play, items, abilities, prof, classWeapons, sessionId, ownUserId, onChange, readOnly = false,
}: {
  play: PlayState;
  items: { name: string }[];
  abilities: { fue: number; des: number };
  prof: number;
  classWeapons: string[];
  sessionId: string | null;
  ownUserId?: string | null;
  onChange: (next: PlayState) => void;
  readOnly?: boolean;
}) {
  const [err, setErr] = useState<string | null>(null);
  const [targetId, setTargetId] = useState<number | null>(null);
  const { tokens, board } = useBattle();
  const { party } = useParty();

  const armas = items.map((it) => armaDe(it.name)).filter((a): a is NonNullable<typeof a> => !!a);
  // Únicas por nombre (no listar dos veces la misma arma apilada).
  const vistas = new Set<string>();
  const lista = armas.filter((a) => (vistas.has(a.nombre) ? false : (vistas.add(a.nombre), true)));
  if (lista.length === 0) return null;

  const accionGastada = turnoDe(play).accion;

  // Ficha propia en el tablero y objetivos posibles (las demás).
  const miFicha = tokens.find((t) => t.user_id != null && t.user_id === ownUserId) ?? null;
  const objetivos = tokens.filter((t) => !miFicha || t.id !== miFicha.id);
  const objetivo = targetId !== null ? tokens.find((t) => t.id === targetId) ?? null : null;

  const distancia = miFicha && objetivo
    ? distanciaMetros(miFicha, objetivo, board.cols, board.rows)
    : null;

  // Condiciones del objetivo: solo si es un jugador legible por useParty.
  const condsObjetivo: string[] = objetivo?.user_id
    ? ((party.find((p) => p.user_id === objetivo.user_id)?.play_state as PlayState | undefined)?.conds ?? [])
    : [];

  const distanciaDe = (t: { x: number; y: number }): number | null =>
    miFicha ? distanciaMetros(miFicha, t, board.cols, board.rows) : null;

  async function atacar(arma: Arma, atk: Ataque) {
    if (!sessionId || readOnly) return;
    setErr(null);

    // Alcance (bloqueo duro): solo cuando hay distancia medida.
    if (distancia !== null && !enAlcance(arma, distancia)) {
      setErr(`Fuera de alcance (${distancia} m).`);
      return;
    }

    // Ventaja combinada: la propia (G1) + la del objetivo (si hay distancia).
    const advObjetivo = distancia !== null ? ventajaAtacante(condsObjetivo, distancia) : { adv: false, dis: false };
    const adv = combinar(ventajaDe(play, "ataque"), advObjetivo);

    const etiquetaObj = objetivo ? ` → ${objetivo.label}` : "";
    const { error, result } = await publishRoll(
      sessionId, "attack", `Ataque: ${arma.nombre}${etiquetaObj}`, "1d20",
      { mod: atk.modImpacto, adv: adv ?? undefined },
    );
    if (error) { setErr(error); return; }

    // Crítico: 20 natural (por la tirada) o proximidad (cuerpo ≤1,5 m vs
    // paralizado/inconsciente). No se acumula: un único doblado.
    const critNat = !!result && critState(result.formula, result.rolls) === "crit";
    const critProx = distancia !== null && critProximidad(arma, condsObjetivo, distancia);
    const crit = critNat || critProx;

    const { error: e2 } = await publishRoll(
      sessionId, "custom", `Daño: ${arma.nombre}${crit ? " (crítico)" : ""}`,
      formulaDaño(arma.dado, atk.modDaño, crit),
    );
    if (e2) { setErr(e2); return; }
    onChange(gastar(play, "accion"));
  }

  return (
    <div className="mb-4">
      <p className="font-ui text-[12px] font-bold mb-1.5" style={{ color: "var(--color-parch)" }}>Ataques</p>

      {sessionId && !readOnly && objetivos.length > 0 && (
        <select
          className="w-full mb-2 panel-raised px-3 py-1.5 font-ui text-[12px] bg-transparent"
          style={{ color: "var(--color-parch)" }}
          value={targetId ?? ""}
          onChange={(e) => setTargetId(e.target.value === "" ? null : Number(e.target.value))}
        >
          <option value="">Sin objetivo</option>
          {objetivos.map((t) => {
            const d = distanciaDe(t);
            return <option key={t.id} value={t.id}>{t.label}{d !== null ? ` · ${d} m` : ""}</option>;
          })}
        </select>
      )}

      <div className="space-y-1.5">
        {lista.map((arma) => {
          const atk = ataqueDe(arma, abilities, prof, classWeapons);
          return (
            <div key={arma.nombre} className="panel-raised px-3 py-2 flex items-center justify-between gap-2">
              <div>
                <p className="font-ui text-[13px] font-bold" style={{ color: "var(--color-parch)" }}>{arma.nombre}</p>
                <p className="font-ui text-[11px]" style={{ color: "var(--color-dim)" }}>
                  impacto {fmtMod(atk.modImpacto)} · daño {arma.dado}{atk.modDaño !== 0 ? fmtMod(atk.modDaño) : ""} {arma.tipo}
                  {!atk.competente && " · no competente"}
                </p>
              </div>
              {sessionId && !readOnly && (
                <button
                  className="btn-gold !py-1 !px-3 text-[12px]"
                  title={accionGastada ? "Ya gastaste la acción (desmárcala en el turno para volver a atacar)" : "Atacar (gasta la acción)"}
                  onClick={() => atacar(arma, atk)}
                >
                  <i className="fas fa-khanda mr-1.5" />Atacar
                </button>
              )}
            </div>
          );
        })}
      </div>
      {err && <p className="text-[12px] mt-1 italic" style={{ color: "var(--color-ember)" }}>{err}</p>}
    </div>
  );
}
```

> **Nota de tipos:** `useParty` devuelve `PartyMember[]` con `play_state: Record<string, unknown>`; por eso el cast `as PlayState | undefined` antes de leer `.conds`. `ataqueDe` ya exporta el tipo `Ataque`; `armaDe`/`Arma` salen de `data/weapons`.
>
> **`ownUserId` es opcional (`?`) a propósito:** `Ataques` también se monta en `app/dm/GrupoPanel.tsx:335` con `sessionId={null}` y **sin** `ownUserId`. Al ser opcional, ese montaje **compila sin tocarse**; allí el desplegable está oculto (`sessionId` null) y `atacar` retorna pronto, así que `ownUserId` es inerte. No hace falta editar `GrupoPanel.tsx`.

- [ ] **Step 3: Verifica el tipado**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 4: Verifica el build**

Run: `npx next build`
Expected: compila sin errores.

- [ ] **Step 5: Regresión de las capas puras tocadas de cerca**

Run: `npx tsx scripts/check-targeting.ts && npx tsx scripts/check-ataque.ts && npx tsx scripts/check-tablero.ts && npx tsx scripts/check-turno.ts && npx tsx scripts/check-estado.ts`
Expected: `Todo en verde` en los cinco.

- [ ] **Step 6: Commit**

```bash
git add components/personaje/Ataques.tsx components/CharacterSheet.tsx
git commit -F - <<'EOF'
feat(g4): objetivo de ataque desde la ficha con alcance, ventaja y crítico

Ataques gana un desplegable de objetivo alimentado por useBattle, con la
distancia en vivo desde la ficha propia. Al atacar aplica el bloqueo de
alcance (duro), la ventaja combinada (propia + condición del objetivo) y el
crítico automático (20 natural o proximidad ≤1,5 m vs paralizado/inconsciente)
doblando los dados de daño. Degrada a G2 sin tablero/objetivo. Las condiciones
del objetivo se leen solo si es un jugador legible por useParty.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 3: Salvaciones — auto-fallo y desventaja de restringido

**Files:**
- Modify: `components/CharacterSheet.tsx` (imports, un estado nuevo, el `onClick` de salvación y una línea de render)

- [ ] **Step 1: Añade los imports de targeting**

En `components/CharacterSheet.tsx`, junto al import de `ventajaDe` (línea 27, `import { ventajaDe } from "@/lib/estado";`), añade debajo:

```tsx
import { autoFallaSalvacion, combinar, ventajaSalvacion } from "@/lib/targeting";
```

- [ ] **Step 2: Añade el estado del aviso de auto-fallo**

Junto a `const [rollErr, setRollErr] = useState<string | null>(null);` (línea 132), añade debajo:

```tsx
  const [saveAuto, setSaveAuto] = useState<string | null>(null); // aviso de salvación auto-fallada (no se tira)
```

- [ ] **Step 3: Reemplaza el `onClick` del botón de salvación**

En el botón de salvación (líneas 674-677), cambia:

```tsx
                        onClick={async () => {
                          const { error } = await publishRoll(session!.id, "save", `Salvación de ${a.name}`, "1d20", { mod: sv.mod, adv: ventajaDe(playState, "salvez") ?? undefined });
                          setRollErr(error);
                        }}
```

por:

```tsx
                        onClick={async () => {
                          const conds = playState.conds ?? [];
                          if (autoFallaSalvacion(conds, a.key)) {
                            const causa = ["paralizado", "aturdido", "inconsciente", "petrificado"].find((s) => conds.includes(s));
                            setSaveAuto(`Salvación de ${a.name}: fallo automático (${causa}).`);
                            setRollErr(null);
                            return;
                          }
                          setSaveAuto(null);
                          const adv = combinar(
                            ventajaDe(playState, "salvez"),
                            { adv: false, dis: ventajaSalvacion(conds, a.key) === "dis" },
                          );
                          const { error } = await publishRoll(session!.id, "save", `Salvación de ${a.name}`, "1d20", { mod: sv.mod, adv: adv ?? undefined });
                          setRollErr(error);
                        }}
```

- [ ] **Step 4: Muestra el aviso de auto-fallo bajo las salvaciones**

En la sección SALVACIONES, junto a la línea del error (línea 690):

```tsx
            {rollErr && <p className="text-[12px] mt-2 italic" style={{ color: "var(--color-ember)" }}>{rollErr}</p>}
```

añade debajo:

```tsx
            {saveAuto && <p className="text-[12px] mt-2 italic" style={{ color: "var(--color-ember)" }}>{saveAuto}</p>}
```

- [ ] **Step 5: Verifica el tipado**

Run: `npx tsc --noEmit`
Expected: sin errores. (`a.key` es `AbilityKey`, compatible con el parámetro `string` de `autoFallaSalvacion`/`ventajaSalvacion`.)

- [ ] **Step 6: Verifica el build**

Run: `npx next build`
Expected: compila sin errores.

- [ ] **Step 7: Regresión de estado**

Run: `npx tsx scripts/check-estado.ts`
Expected: `Todo en verde` (35 comprobaciones).

- [ ] **Step 8: Commit**

```bash
git add components/CharacterSheet.tsx
git commit -F - <<'EOF'
feat(g4): salvaciones con auto-fallo y desventaja de restringido

El botón de salvación pasa la característica (a.key): con paralizado/aturdido/
inconsciente/petrificado, la salvación de Fue/Des falla automáticamente con un
aviso en línea, sin tirar; y la salvación de Des estando restringido se tira
con desventaja. Cierra la omisión honesta que G1 dejó anotada.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 4: Gate final + documentación

**Files:**
- Modify: `HANDOFF.md` (cabecera + nueva sección RESUELTO de G4)
- Modify: vault Obsidian (`C:\Users\carlo\Desktop\Exandria-Obsidian\Exandria`) — nota de G4 donde corresponda (Jugabilidad/Combate)

- [ ] **Step 1: Gate completo — todas las capas puras**

Run: `npx tsx scripts/check-targeting.ts && npx tsx scripts/check-estado.ts && npx tsx scripts/check-turno.ts && npx tsx scripts/check-ataque.ts && npx tsx scripts/check-tablero.ts && npx tsx scripts/check-clases.ts && npx tsx scripts/check-lore.ts`
Expected: `Todo en verde` en los siete (check-estado 35, check-clases 116, check-lore 69, sin regresión).

- [ ] **Step 2: Gate completo — tipos y build**

Run: `npx tsc --noEmit && npx next build`
Expected: ambos limpios.

- [ ] **Step 3: Actualiza `HANDOFF.md`**

- En el bloque «Lo último» y en «Siguiente sugerido» de la cabecera: marca G4 como hecho en `master` (sin migración) y mueve el «Siguiente sugerido» a **O2 — conjuros** / pozos de las 5 clases / Fase P/Q (G4 ya no es lo siguiente).
- Añade una sección `## RESUELTO (2026-07-25): G4 — targeting` describiendo: rama `g4-targeting`, sin migración, `lib/targeting.ts` + `check-targeting`, el desplegable de objetivo en la ficha, las cuatro reglas (ventaja del atacante, alcance duro, auto-fallo de salvación + restringido, crítico 20 natural + proximidad), la degradación a G2, la decisión de auto-fallo en línea (no en el feed), y la lista de **pruebas del usuario** (copiar la del final del spec). Sigue el molde de las secciones RESUELTO de G1/G2/G3.

- [ ] **Step 4: Actualiza el vault**

En `C:\Users\carlo\Desktop\Exandria-Obsidian\Exandria`, añade/actualiza la nota de la capa de jugabilidad de combate con G4 (targeting): las cuatro reglas, que la capa pura es `lib/targeting.ts`, y el porqué de la decisión de auto-fallo en línea. Enlaza con las notas de G1/G2/G3 si existen.

- [ ] **Step 5: Commit de la documentación**

```bash
git add HANDOFF.md
git commit -F - <<'EOF'
docs(g4): HANDOFF y vault con la losa de targeting

Cuarta losa de la jugabilidad 2024 en master, sin migración. Cierra las
cuatro reglas de G1/G2/G3. Siguiente sugerido pasa a O2 (conjuros).

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

> El vault está fuera del repo; se guarda aparte (no entra en el commit de git).

- [ ] **Step 6: Merge a `master` y push** (tras tus pruebas en vivo, o cuando lo decidas)

```bash
git checkout master && git merge --no-ff g4-targeting && git push origin master
```

---

## Notas de verificación en vivo (tuyas — no automatizables aquí)

Sin sesión ni tablas del tablero en dev, nada de G4 se prueba en vivo desde aquí. Tras desplegar:

- Atacar con daga a un objetivo a 6 m ⇒ **bloqueado** («Fuera de alcance»); acercar la ficha a ≤1,5 m ⇒ deja atacar.
- Objetivo (un jugador) **derribado**, atacar a quemarropa ⇒ **ventaja**; a distancia ⇒ **desventaja**.
- Sacar un **20 natural** ⇒ daño doblado en el feed.
- Atacar cuerpo a un jugador **inconsciente** a quemarropa ⇒ daño doblado.
- Personaje **paralizado**, tirar salvación de Fuerza ⇒ **fallo automático** en línea (no tira).
- Salvación de Destreza estando **restringido** ⇒ se tira con **desventaja**.
```
