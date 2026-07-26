# El tablero como pantalla de combate — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mudar el combate de `/personaje` a `/tablero`: la ficha queda para stats e inventario, y el tablero pasa a ser la pantalla donde se pelea (iniciativa, rejilla, estado, turno, ataques, conjuros y rasgos con objetivo compartido).

**Architecture:** Un hook nuevo, `lib/useFichaViva.ts`, carga la ficha activa, la deriva, se suscribe a sus cambios en vivo, limpia el turno cuando te toca y persiste `play_state`. Lo consumen la pantalla de combate y el panel del DM. `CharacterSheet` **pierde los montajes de combate** y pasa a ser un lector de `play_state` (lo necesita para la ventaja de sus botones de tirada), así que su carga **no se toca**. Todo lo demás es composición: los componentes de G1/G2/G4/O2 se reutilizan tal cual.

**Tech Stack:** TypeScript · Next.js 16 (App Router) · React 19 · Supabase Realtime. No hay framework de test: el gate son `npx tsx scripts/check-*.ts`, `npx tsc --noEmit` y `npx next build`.

**Spec:** `docs/superpowers/specs/2026-07-26-tablero-combate-design.md`

**Rama:** `tablero-combate` (creada, con el spec comiteado). Trabajar desde `C:\Users\carlo\Downloads\dnd-campaign-app`. Si `git` dice «not a git repository», usar `git -C "C:\Users\carlo\Downloads\dnd-campaign-app"`. Los heredoc de commit necesitan el **bash tool** (el shell por defecto es PowerShell). **Nunca `git add -A`.**

> **Refinamiento sobre el spec, descubierto al planificar.** El spec preveía que
> `CharacterSheet` consumiera el hook y adelgazara su carga. Al mirar el código se
> ve que, **una vez quitados los componentes de combate, `CharacterSheet` ya no
> escribe `play_state`**: solo lo lee, para la ventaja de los botones de salvación
> y pericia. Por eso **su carga se deja intacta** (menos riesgo sobre el archivo
> que provocó el bug del 2026-07-22) y el hook nace solo para las pantallas
> nuevas. La parte realmente delicada —el `selectTolerante` de
> `loadActiveCharacter`— **ya era compartida**, así que esto no duplica nada
> importante.

---

## File Structure

- **Create** `lib/useFichaViva.ts` — carga la ficha activa (vía `loadActiveCharacter`), la deriva, escucha su fila en vivo, limpia el turno al empezar tu turno y persiste `play_state`. Única fuente de `play_state` para las pantallas de combate.
- **Create** `components/tablero/PanelCombate.tsx` — la columna derecha: estado y turno siempre visibles, cabecera con el objetivo, y las pestañas Ataques · Conjuros · Rasgos. Dueño del objetivo y de la pestaña abierta.
- **Modify** `components/personaje/Ataques.tsx` — recibe el objetivo por props; deja de tener su propio desplegable y sus hooks realtime.
- **Modify** `components/personaje/Conjuros.tsx` — recibe el objetivo y lo nombra en el anuncio.
- **Modify** `components/CharacterSheet.tsx` — quita los montajes de combate y el reset de turno; queda ficha pura.
- **Modify** `app/tablero/page.tsx` — la pantalla de combate del jugador.
- **Modify** `app/dm/TableroPanel.tsx` — la misma pantalla más los mandos del DM.
- **Modify** `HANDOFF.md` + vault — documentación (Tarea 7).

---

## Task 1: El hook `lib/useFichaViva.ts`

**Files:**
- Create: `lib/useFichaViva.ts`

- [ ] **Step 1: Crea `lib/useFichaViva.ts` con este contenido exacto**

```ts
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import { loadActiveCharacter, saveCharacter, type CharacterData, type Item } from "@/lib/character";
import { derive, type Derived } from "@/lib/derive";
import { getMechanics, type ClassMechanics } from "@/data/classdata";
import { getSpecies } from "@/data/species";
import { limpiarTurno } from "@/lib/turno";
import type { PlayState } from "@/lib/recursos";

export type FichaViva = {
  ready: boolean;
  characterId: string | null;
  clsSlug: string;
  level: number;
  items: Item[];
  /** Velocidad de la especie en metros (9 si no hay especie todavía). */
  velocidad: number;
  play: PlayState;
  derived: Derived;
  mechanics: ClassMechanics | null;
  onPlayStateChange: (next: PlayState) => void;
  /** Error de carga, PROPAGADO. Nunca se traga: un error tragado disfraza el fallo. */
  error: string | null;
};

/**
 * La ficha activa de un jugador, viva: cargada, derivada, al día por Realtime y
 * con el estado de juego persistido. La usan las pantallas de COMBATE (el
 * tablero del jugador y el del DM); la hoja de personaje conserva su propia
 * carga porque además edita el build (nivel, oro, equipo, objetos).
 *
 * Es la ÚNICA fuente de `play_state` para quien la consume: `character`,
 * `items` y `level` se exponen SOLO DE LECTURA.
 *
 * `saveMode`: "self" guarda con saveCharacter; "dm" va por /api/dm/character
 * (service_role), igual que hace la hoja cuando el DM edita a otro jugador.
 */
export function useFichaViva(targetUserId: string | null, saveMode: "self" | "dm" = "self"): FichaViva {
  const [row, setRow] = useState<(CharacterData & { id: string }) | null>(null);
  const [play, setPlay] = useState<PlayState>({});
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Última play_state que ESTE cliente escribió: para ignorar el eco de Realtime
  // de la propia escritura y no pisar un segundo toque rápido del jugador.
  const lastWritten = useRef<string | null>(null);
  // `active` previo de mi fila de iniciativa: el turno se limpia solo en la
  // transición false→true (empieza mi turno), no en cada evento.
  const prevActive = useRef(false);

  // --- Carga -----------------------------------------------------------------
  useEffect(() => {
    let done = false;
    (async () => {
      if (!targetUserId) { if (!done) setReady(true); return; }
      const r = await loadActiveCharacter(targetUserId);
      if (done) return;
      // `loadActiveCharacter` devuelve null en DOS casos que no puede distinguir:
      // que no haya ficha activa, y que la consulta fallara (eso ya lo registra
      // él en la consola). Así que aquí NO se afirma un fallo: se deja
      // `characterId` a null y el consumidor dice «no tienes personaje en
      // juego», que es el caso común. Si de verdad fue un error, está en la
      // consola del navegador — que es donde hay que mirar cuando algo
      // desaparece. `error` queda para fallos que sí sepamos nombrar.
      if (r) {
        setRow(r as CharacterData & { id: string });
        if (r.play_state && typeof r.play_state === "object") setPlay(r.play_state as PlayState);
      }
      setReady(true);
    })();
    return () => { done = true; };
  }, [targetUserId]);

  // --- En vivo: la fila propia de `characters` (schema_v4 ya publica) --------
  useEffect(() => {
    if (!supabaseConfigured || !targetUserId) return;
    const supabase = createClient();
    const ch = supabase
      .channel(`ficha_viva_rt_${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "characters", filter: `user_id=eq.${targetUserId}` },
        (p) => {
          const next = (p.new as { play_state?: PlayState }).play_state;
          if (!next || typeof next !== "object") return;
          // Guard anti-eco: si es la que acabamos de escribir, no repintar.
          // jsonb reordena claves, así que es best-effort; los datos son los
          // mismos y el realtime entrega en orden de commit, converge.
          if (JSON.stringify(next) === lastWritten.current) return;
          setPlay(next);
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [targetUserId]);

  // --- Reset del turno: al pasar mi fila de iniciativa a `active` ------------
  useEffect(() => {
    if (!supabaseConfigured || !targetUserId || saveMode !== "self") return;
    const supabase = createClient();
    const ch = supabase
      .channel(`ficha_viva_ini_${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "initiative", filter: `user_id=eq.${targetUserId}` },
        (p) => {
          const active = !!(p.new as { active?: boolean } | null)?.active;
          const empieza = active && !prevActive.current;
          prevActive.current = active;
          if (!empieza) return;
          setPlay((prev) => {
            const next = limpiarTurno(prev);
            lastWritten.current = JSON.stringify(next);
            if (row?.id) void saveCharacter(row.id, { play_state: next });
            return next;
          });
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [targetUserId, saveMode, row?.id]);

  // --- Persistencia optimista de play_state ---------------------------------
  const onPlayStateChange = useCallback((next: PlayState) => {
    lastWritten.current = JSON.stringify(next);
    setPlay(next);
    if (!targetUserId) return;
    if (saveMode === "self") {
      if (row?.id) void saveCharacter(row.id, { play_state: next });
      return;
    }
    void fetch("/api/dm/character", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: targetUserId, patch: { play_state: next } }),
    });
  }, [targetUserId, saveMode, row?.id]);

  // --- Derivación ------------------------------------------------------------
  const derived = useMemo(
    () => derive({
      level: row?.level ?? 1,
      cls: row?.cls ?? null,
      base: row?.base,
      bonus: row?.bonus,
      asi: row?.asi,
      skills: row?.skills,
      equipment: row?.equipment,
      hp_rolls: row?.hp_rolls,
    }),
    [row],
  );

  const mechanics = useMemo(() => getMechanics(row?.cls), [row?.cls]);
  const velocidad = useMemo(() => (row?.species ? getSpecies(row.species)?.speed ?? 9 : 9), [row?.species]);

  return {
    ready,
    characterId: row?.id ?? null,
    clsSlug: row?.cls ?? "",
    level: row?.level ?? 1,
    items: Array.isArray(row?.items) ? row.items : [],
    velocidad,
    play,
    derived,
    mechanics,
    onPlayStateChange,
    error,
  };
}
```

- [ ] **Step 2: Comprueba las firmas reales antes de dar por bueno el tipado**

Run: `npx tsc --noEmit`
Expected: sin errores.

Si sale algún error de tipos, **lee la firma real** del símbolo implicado y ajusta la llamada — no cambies la forma pública de `FichaViva`. Sitios probables:
- `derive` está en `lib/derive.ts` y su firma es `derive(c: Partial<CharacterData>): Derived`; comprueba que `Derived` se exporta (si no, expórtalo).
- `loadActiveCharacter` está en `lib/character.ts`; comprueba qué devuelve exactamente (incluye `id`).
- `getSpecies` está en `data/species.ts`; comprueba el nombre del campo de velocidad (`speed`).
- `getMechanics`/`ClassMechanics` salen de `@/data/classdata`.

Si algo no cuadra y no lo puedes resolver limpiamente, **para y reporta BLOCKED** con el error exacto.

- [ ] **Step 3: Verifica el build**

Run: `npx next build`
Expected: compila sin errores.

- [ ] **Step 4: Regresión de la carga de ficha**

Run: `npx tsx scripts/check-ficha.ts`
Expected: `Todo en verde` (11 comprobaciones). Este script cubre la carga tolerante que el hook reutiliza.

- [ ] **Step 5: Commit**

```bash
git add lib/useFichaViva.ts
git commit -F - <<'EOF'
feat(tablero): hook useFichaViva para las pantallas de combate

Carga la ficha activa con el selectTolerante de siempre, la deriva, escucha su
fila en vivo, limpia el turno cuando te toca y persiste play_state (self por
saveCharacter, dm por /api/dm/character). Es la única fuente de play_state
para quien lo consume; character, items y level van solo de lectura. El error
de carga se propaga, no se traga.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 2: `CharacterSheet` queda como ficha pura

**Files:**
- Modify: `components/CharacterSheet.tsx`

Objetivo: quitar de la hoja todo lo que se muda al tablero. **`playState` se queda** (los botones de salvación y pericia lo leen para la ventaja de G1 y el fallo automático de G4), pero la hoja deja de **escribirlo**.

- [ ] **Step 1: Borra la sección «Estado de combate» entera**

Borra este bloque completo (está entre la sección de CA y la de SALVACIONES, alrededor de las líneas 634-671):

```tsx
          {/* ESTADO DE COMBATE (PG, muerte, condiciones, agotamiento) */}
          <section className="panel p-5">
            <p className="eyebrow mb-3"><i className="fas fa-heart-pulse mr-1.5" style={{ color: "var(--color-ember)" }} />Estado de combate</p>
            <EstadoVivo
              play={playState}
              maxHp={d.maxHp}
              onChange={onPlayStateChange}
              readOnly={readOnly && saveMode !== "self"}
            />
            <EconomiaTurno
              play={playState}
              velocidad={species?.speed ?? 9}
              onChange={onPlayStateChange}
              readOnly={readOnly && saveMode !== "self"}
            />
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
            <Conjuros
              clsSlug={build.cls ?? ""}
              level={level}
              caster={mechanics?.caster ?? "none"}
              spellDc={d.spellDc ?? 0}
              spellAttack={d.spellAttack ?? 0}
              play={playState}
              sessionId={isOwner ? session!.id : null}
              onChange={onPlayStateChange}
              readOnly={readOnly && saveMode !== "self"}
            />
          </section>
```

En su lugar, deja un enlace al tablero (usa el `Link` de `next/link`, que ya está importado en el archivo):

```tsx
          {/* El combate se juega en el tablero (ver /tablero) */}
          <section className="panel p-5 text-center">
            <p className="eyebrow mb-2"><i className="fas fa-chess-board mr-1.5" style={{ color: "var(--color-bronze)" }} />Combate</p>
            <p className="font-ui text-[13px] mb-3" style={{ color: "var(--color-muted)" }}>
              Los puntos de golpe, las condiciones, el turno, los ataques y los conjuros se llevan desde el tablero.
            </p>
            <Link href="/tablero" className="btn-gold !py-1.5 !px-4 text-[13px]">
              <i className="fas fa-chess-board mr-1.5" />Ir al tablero
            </Link>
          </section>
```

- [ ] **Step 2: Quita el montaje de `PozosClase`**

Borra estas tres líneas (alrededor de la 777-779):

```tsx
            {build.cls && (
              <PozosClase clsSlug={build.cls} level={level} play={playState} onChange={onPlayStateChange} readOnly={readOnly} />
            )}
```

- [ ] **Step 3: Quita el montaje de `InitiativeTracker`**

Borra este bloque (alrededor de la 567-571):

```tsx
      {isOwner && (
        <div className="mb-6">
          <InitiativeTracker mod={d.abilities.des.mod} hideEmpty />
        </div>
      )}
```

- [ ] **Step 4: Quita el efecto de reset del turno**

Borra el `useEffect` entero que se suscribe a `initiative` y llama a `limpiarTurno` (empieza con el comentario «Reset del turno: al pasar mi fila de iniciativa a `active`» y termina en `}, [saveMode, targetUserId, characterId]);`). Esa responsabilidad se muda al hook de la Tarea 1.

- [ ] **Step 5: Quita `onPlayStateChange` y las importaciones que sobran**

- Borra la función `onPlayStateChange` completa (con su comentario) — ya no la usa nadie en este archivo.
- Borra la ref `lastWrittenPlay` y la ref `prevActive` (solo las usaban el efecto y la función que acabas de borrar).
- Borra estos imports, que ya no se usan: `PozosClase`, `EstadoVivo`, `EconomiaTurno`, `Ataques`, `Conjuros`, `InitiativeTracker`, `limpiarTurno`.
- **NO borres**: `playState`/`setPlayState`, la suscripción realtime a `characters` (mantiene las condiciones al día para los botones de tirada), `ventajaDe`, `autoFallaSalvacion`, `combinar`, `ventajaSalvacion`, ni el tipo `PlayState`.

- [ ] **Step 6: Comprueba que no queda nada colgando**

Run: `npx tsc --noEmit`
Expected: sin errores. Si `tsc` avisa de una variable declarada y no usada (p. ej. `species`, `mechanics`, `items`, `isOwner`), **comprueba antes si la usa otra parte del archivo** — `mechanics` alimenta los rasgos de clase, `items` el inventario, `isOwner` los botones de tirada. Solo borra lo que de verdad quede huérfano.

- [ ] **Step 7: Verifica el build**

Run: `npx next build`
Expected: compila sin errores.

- [ ] **Step 8: Regresión**

Run: `npx tsx scripts/check-ficha.ts && npx tsx scripts/check-estado.ts && npx tsx scripts/check-targeting.ts`
Expected: los tres `Todo en verde`.

- [ ] **Step 9: Commit**

```bash
git add components/CharacterSheet.tsx
git commit -F - <<'EOF'
refactor(tablero): la hoja de personaje deja de llevar el combate

Se quitan de /personaje el estado de combate, la economía de turno, los
ataques, los conjuros, los pozos de clase y la iniciativa: se juegan en el
tablero, y la hoja enlaza allí. La hoja conserva play_state SOLO DE LECTURA,
que es lo que necesitan la ventaja de sus botones de salvación y pericia y el
fallo automático de G4, así que su carga no se toca. El reset del turno se
muda al hook useFichaViva.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 3: El objetivo llega por props a `Ataques` y `Conjuros`

**Files:**
- Modify: `components/personaje/Ataques.tsx`
- Modify: `components/personaje/Conjuros.tsx`

El objetivo pasa a ser del padre (`PanelCombate`, Tarea 4), para que lo compartan las dos pestañas. Las props nuevas son **opcionales**, así que el montaje de `app/dm/GrupoPanel.tsx` **compila sin tocarse** (allí no hay objetivo: es el panel de control del DM, no una pantalla de juego).

- [ ] **Step 1: Reescribe `components/personaje/Ataques.tsx` por completo**

```tsx
"use client";
import { useState } from "react";
import { armaDe, type Arma } from "@/data/weapons";
import { ataqueDe, type Ataque } from "@/lib/ataque";
import { gastar, turnoDe } from "@/lib/turno";
import { ventajaDe } from "@/lib/estado";
import { ventajaAtacante, combinar, enAlcance, critProximidad, formulaDaño } from "@/lib/targeting";
import { publishRoll } from "@/lib/useDiceFeed";
import { critState } from "@/lib/dice";
import { fmtMod } from "@/data/rules";
import type { PlayState } from "@/lib/recursos";

/** El objetivo elegido en el tablero, ya resuelto por el padre. */
export type Objetivo = {
  label: string;
  /** Distancia en metros desde la ficha propia, o null si no se puede medir. */
  distancia: number | null;
  /** Condiciones del objetivo si es un jugador legible; PNJ ⇒ vacío. */
  conds: string[];
};

// Lista de ataques con las armas del inventario que existen en la tabla ARMAS.
// Tira impacto (d20 + mod, con la ventaja combinada de G1 + la del objetivo) y
// daño (dado + mod, doblado en crítico), y marca la acción gastada.
//
// El OBJETIVO lo elige el padre (PanelCombate) y lo comparte con los conjuros.
// Sin objetivo, o sin distancia medible, se degrada al comportamiento de G2:
// solo la ventaja propia, sin bloqueo de alcance ni crítico por proximidad.
export default function Ataques({
  play, items, abilities, prof, classWeapons, sessionId, objetivo, onChange, readOnly = false,
}: {
  play: PlayState;
  items: { name: string }[];
  abilities: { fue: number; des: number };
  prof: number;
  classWeapons: string[];
  sessionId: string | null;
  objetivo?: Objetivo | null;
  onChange: (next: PlayState) => void;
  readOnly?: boolean;
}) {
  const [err, setErr] = useState<string | null>(null);

  const armas = items.map((it) => armaDe(it.name)).filter((a): a is Arma => !!a);
  // Únicas por nombre (no listar dos veces la misma arma apilada).
  const vistas = new Set<string>();
  const lista = armas.filter((a) => (vistas.has(a.nombre) ? false : (vistas.add(a.nombre), true)));
  if (lista.length === 0) return null;

  const accionGastada = turnoDe(play).accion;
  const puedeAtacar = !!sessionId && !readOnly;
  const distancia = objetivo?.distancia ?? null;
  const condsObjetivo = objetivo?.conds ?? [];

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

    // Crítico: 20 natural o proximidad (≤1,5 m vs paralizado/inconsciente).
    const critNat = !!result && critState(result.formula, result.rolls) === "crit";
    const critProx = distancia !== null && critProximidad(condsObjetivo, distancia);
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
              {puedeAtacar && (
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

> **Qué cambió y qué NO**: desaparecen el `<select>` interno, el estado `targetId`,
> las llamadas a `useBattle`/`useParty`, la prop `ownUserId` y la partición en
> `Ataques`/`AtaquesInteractivo` (ya no hace falta: sin hooks propios no hay
> canales realtime que ahorrar). **La lógica de G4 no se toca**: mismo bloqueo de
> alcance, misma ventaja combinada, mismo crítico, mismo daño doblado.

- [ ] **Step 2: Añade el objetivo a `components/personaje/Conjuros.tsx`**

En el import de tipos, añade `Objetivo`:

```tsx
import type { Objetivo } from "@/components/personaje/Ataques";
```

En la lista de props del componente `Conjuros`, añade `objetivo` (después de `sessionId`):

```tsx
  objetivo?: Objetivo | null;
```

y en la desestructuración de argumentos, añade `objetivo,` justo después de `sessionId,`.

Dentro de `lanzar`, sustituye la línea que construye el anuncio:

```tsx
    const { error: e0 } = await publishNote(sessionId, `Lanza ${etiqueta}${cd}`);
```

por:

```tsx
    const haciaObjetivo = objetivo ? ` → ${objetivo.label}` : "";
    const { error: e0 } = await publishNote(sessionId, `Lanza ${etiqueta}${haciaObjetivo}${cd}`);
```

> El objetivo aquí es **información para la mesa**, no una regla: O2 dejó fuera
> resolver el efecto de cada conjuro y sigue fuera.

- [ ] **Step 3: Verifica tipos y build**

Run: `npx tsc --noEmit && npx next build`
Expected: ambos limpios. `app/dm/GrupoPanel.tsx` debe compilar **sin tocarlo** (las props nuevas son opcionales, y allí ya no se pasaba `ownUserId`… si `tsc` se queja de `ownUserId` en `GrupoPanel`, es que sí se pasaba: quítalo de ese montaje y nada más).

- [ ] **Step 4: Regresión**

Run: `npx tsx scripts/check-targeting.ts && npx tsx scripts/check-ataque.ts && npx tsx scripts/check-conjuros.ts`
Expected: los tres `Todo en verde`.

- [ ] **Step 5: Commit**

```bash
git add components/personaje/Ataques.tsx components/personaje/Conjuros.tsx
git commit -F - <<'EOF'
refactor(tablero): el objetivo llega por props a ataques y conjuros

Ataques deja de tener su propio desplegable y sus hooks de tablero: recibe un
Objetivo ya resuelto (etiqueta, distancia y condiciones) del padre, que lo
comparte con los conjuros. La lógica de G4 (alcance, ventaja, crítico) no
cambia. Conjuros nombra el objetivo en el anuncio, sin aplicar reglas nuevas.
Las props son opcionales, así que el panel del DM compila sin tocarse.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 4: `components/tablero/PanelCombate.tsx`

**Files:**
- Create: `components/tablero/PanelCombate.tsx`

- [ ] **Step 1: Crea el archivo con este contenido exacto**

```tsx
"use client";
import { useState } from "react";
import EstadoVivo from "@/components/personaje/EstadoVivo";
import EconomiaTurno from "@/components/personaje/EconomiaTurno";
import Ataques, { type Objetivo } from "@/components/personaje/Ataques";
import Conjuros from "@/components/personaje/Conjuros";
import PozosClase from "@/components/personaje/PozosClase";
import { pozosDe } from "@/lib/recursos";
import { distanciaMetros } from "@/lib/tablero";
import type { Token, Board } from "@/lib/useBattle";
import type { FichaViva } from "@/lib/useFichaViva";
import type { PlayState } from "@/lib/recursos";

type Pestaña = "ataques" | "conjuros" | "rasgos";

// La columna derecha de la pantalla de combate: estado y turno SIEMPRE
// visibles, y las acciones en pestañas para que la lista no se desborde.
// Es el dueño del OBJETIVO, que comparten ataques y conjuros.
export default function PanelCombate({
  ficha, tokens, board, ownUserId, condsDe, sessionId, readOnly = false,
}: {
  ficha: FichaViva;
  tokens: Token[];
  board: Board;
  /** El user_id cuya ficha se está jugando (para localizar su token). */
  ownUserId: string | null;
  /** Condiciones de un token que sea jugador; PNJ o ilegible ⇒ []. */
  condsDe: (t: Token) => string[];
  sessionId: string | null;
  readOnly?: boolean;
}) {
  const [pestaña, setPestaña] = useState<Pestaña>("ataques");
  const [targetId, setTargetId] = useState<number | null>(null);

  const { play, derived, mechanics, clsSlug, level, items, velocidad, onPlayStateChange } = ficha;

  const miFicha = tokens.find((t) => t.user_id != null && t.user_id === ownUserId) ?? null;
  const objetivos = tokens.filter((t) => (!miFicha || t.id !== miFicha.id) && !t.dead);
  const token = targetId !== null ? tokens.find((t) => t.id === targetId) ?? null : null;

  const distanciaA = (t: Token): number | null =>
    miFicha ? distanciaMetros(miFicha, t, board.cols, board.rows) : null;

  const objetivo: Objetivo | null = token
    ? { label: token.label, distancia: distanciaA(token), conds: condsDe(token) }
    : null;

  const esConjurador = (mechanics?.caster ?? "none") !== "none";
  const tienePozos = !!clsSlug && pozosDe(clsSlug, level, play).length > 0;

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
          {objetivos.length === 0 ? (
            <span className="font-ui text-[12px] italic" style={{ color: "var(--color-dim)" }}>sin fichas en el tablero</span>
          ) : (
            <select
              className="font-ui text-[12px] bg-transparent text-right"
              style={{ color: "var(--color-parch)" }}
              value={targetId ?? ""}
              onChange={(e) => setTargetId(e.target.value === "" ? null : Number(e.target.value))}
            >
              <option value="">Sin objetivo</option>
              {objetivos.map((t) => {
                const d = distanciaA(t);
                return <option key={t.id} value={t.id}>{t.label}{d !== null ? ` · ${d} m` : ""}</option>;
              })}
            </select>
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

        {activa === "ataques" && (
          <Ataques
            play={play}
            items={items}
            abilities={{ fue: derived.abilities.fue.mod, des: derived.abilities.des.mod }}
            prof={derived.prof}
            classWeapons={mechanics?.weapons ?? []}
            sessionId={sessionId}
            objetivo={objetivo}
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

- [ ] **Step 2: Verifica tipos y build**

Run: `npx tsc --noEmit && npx next build`
Expected: ambos limpios. Si `EstadoVivo` o `EconomiaTurno` piden alguna prop que aquí no se pasa, **lee sus firmas** en `components/personaje/` y añádela; no cambies su forma pública.

- [ ] **Step 3: Commit**

```bash
git add components/tablero/PanelCombate.tsx
git commit -F - <<'EOF'
feat(tablero): PanelCombate, la columna de acciones del tablero

Estado y turno siempre visibles; el objetivo en la cabecera, compartido por
ataques y conjuros; y las acciones en pestañas (ataques, conjuros, rasgos),
que solo se pintan si la clase las tiene. Es composición: reutiliza
EstadoVivo, EconomiaTurno, Ataques, Conjuros y PozosClase sin cambiarlos.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 5: La pantalla — `app/tablero/page.tsx`

**Files:**
- Modify: `app/tablero/page.tsx`

- [ ] **Step 1: Sustituye TODO el contenido de `app/tablero/page.tsx` por**

```tsx
"use client";
import { useSession } from "@/components/SessionProvider";
import { useBattle, moveToken, type Token } from "@/lib/useBattle";
import { useFichaViva } from "@/lib/useFichaViva";
import { useParty } from "@/lib/character";
import BattleBoard from "@/components/tablero/BattleBoard";
import PanelCombate from "@/components/tablero/PanelCombate";
import InitiativeTracker from "@/components/InitiativeTracker";
import DiceFeedStrip from "@/components/tablero/DiceFeedStrip";
import type { PlayState } from "@/lib/recursos";

// La pantalla de combate del jugador: iniciativa arriba, tablero a la
// izquierda, estado/turno/acciones a la derecha y la tira de tiradas abajo.
// Funciona SIN combate activo: sin rejilla se puede igualmente curar, preparar
// conjuros o gastar un pozo (si no, no habría dónde hacerlo entre escenas).
export default function TableroPage() {
  const session = useSession();
  const isDM = session?.role === "dm";
  const { tokens, board, ready, missing } = useBattle();
  const ficha = useFichaViva(session?.id ?? null, "self");
  const { party } = useParty();

  const condsDe = (t: Token): string[] =>
    t.user_id
      ? ((party.find((p) => p.user_id === t.user_id)?.play_state as PlayState | undefined)?.conds ?? [])
      : [];

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <header className="text-center mb-5">
        <p className="eyebrow mb-2"><i className="fas fa-chess-board mr-1.5" style={{ color: "var(--color-bronze)" }} />Campo de batalla</p>
        <h1 className="font-display text-3xl md:text-4xl font-extrabold gold-text">Tablero</h1>
      </header>

      {/* Sin `hideEmpty`: aquí SIEMPRE se ve, así que un jugador puede tirar
          iniciativa y abrir la ronda él mismo. En la hoja iba con hideEmpty y
          por eso no aparecía hasta que el DM creaba la primera fila. */}
      <div className="mb-4">
        <InitiativeTracker mod={ficha.derived.abilities.des.mod} />
      </div>

      <div className="grid lg:grid-cols-[1.7fr_1fr] gap-5 items-start">
        <div>
          {!ready ? (
            <p className="text-center text-sm py-10" style={{ color: "var(--color-dim)" }}>Cargando…</p>
          ) : missing ? (
            <p className="text-center text-sm italic py-10" style={{ color: "var(--color-ember)" }}>
              El tablero no está listo{isDM ? ": ejecuta supabase/schema_v22.sql en Supabase." : "."}
            </p>
          ) : !board.active ? (
            <div className="panel p-8 text-center">
              <i className="fas fa-peace text-3xl mb-3" style={{ color: "var(--color-dim)" }} />
              <p className="font-ui text-[13px]" style={{ color: "var(--color-dim)" }}>
                No hay combate en curso. Puedes seguir curándote, preparando conjuros y gastando rasgos.
              </p>
            </div>
          ) : (
            <>
              <BattleBoard
                tokens={tokens}
                board={board}
                canMove={(t: Token) => !!session && t.user_id === session.id}
                onMove={(id, x, y) => { void moveToken(id, x, y); }}
              />
              <p className="text-[12px] mt-2 text-center italic" style={{ color: "var(--color-dim)" }}>
                Arrastra tu ficha. Toca una ficha para ver a qué distancia está.
              </p>
            </>
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
              tokens={tokens}
              board={board}
              ownUserId={session?.id ?? null}
              condsDe={condsDe}
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

- [ ] **Step 2: Crea `components/tablero/DiceFeedStrip.tsx`**

La tira estrecha de últimas tiradas (el `DicePanel` completo no cabe aquí: trae dado rápido, fórmula libre y peticiones del DM).

```tsx
"use client";
import { useDiceFeed, esNota } from "@/lib/useDiceFeed";
import { useParty } from "@/lib/character";
import { fmtRoll, critState } from "@/lib/dice";

// Las últimas tiradas del grupo, en una línea, para ver el resultado sin salir
// del tablero. El panel completo (dado rápido, fórmula libre, peticiones del
// DM) sigue en /personaje.
export default function DiceFeedStrip({ limit = 6 }: { limit?: number }) {
  const { rolls } = useDiceFeed();
  const { party } = useParty();
  const nameFor = (id: string) => party.find((p) => p.user_id === id)?.username ?? "alguien";

  if (rolls.length === 0) return null;

  return (
    <section className="panel p-3">
      <p className="eyebrow mb-2"><i className="fas fa-dice-d20 mr-1.5" style={{ color: "var(--color-bronze)" }} />Últimas tiradas</p>
      <div className="space-y-1">
        {rolls.slice(0, limit).map((r) => {
          const nota = esNota(r);
          const modifier = r.total - r.rolls.reduce((a, b) => a + b, 0);
          const crit = nota ? null : critState(r.formula, r.rolls);
          return (
            <div key={r.id} className="flex items-center justify-between gap-3 text-[12px]">
              <span className="min-w-0 truncate">
                <span className="font-ui font-bold" style={{ color: "var(--color-arcane-bright)" }}>{nameFor(r.user_id)}</span>
                <span className="font-ui mx-1.5" style={{ color: "var(--color-dim)" }}>·</span>
                <span className="font-ui" style={{ color: "var(--color-warm)" }}>{r.label}</span>
              </span>
              <span className="shrink-0 flex items-center gap-2">
                {crit === "crit" && <span className="font-ui text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "var(--color-bronze)", color: "var(--color-night)" }}>¡CRÍTICO!</span>}
                {crit === "fumble" && <span className="font-ui text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "var(--color-ember)", color: "var(--color-night)" }}>PIFIA</span>}
                {nota ? (
                  <span className="font-ui text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "var(--color-arcane)", color: "var(--color-night)" }}>CONJURO</span>
                ) : (
                  <span className="font-ui font-bold" style={{ color: "var(--color-bronze-bright)" }}>
                    {fmtRoll({ formula: r.formula, rolls: r.rolls, modifier, total: r.total })}
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Verifica tipos y build**

Run: `npx tsc --noEmit && npx next build`
Expected: ambos limpios.

- [ ] **Step 4: Commit**

```bash
git add app/tablero/page.tsx components/tablero/DiceFeedStrip.tsx
git commit -F - <<'EOF'
feat(tablero): /tablero pasa a ser la pantalla de combate

Iniciativa arriba, tablero a la izquierda, PanelCombate a la derecha y una
tira con las últimas tiradas abajo. Ya no exige combate activo: sin rejilla se
puede curar, preparar conjuros y gastar rasgos, que es lo que hace falta entre
escenas. La ficha viene de useFichaViva y las condiciones del objetivo de
useParty, como en G4.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 6: La misma pantalla para el DM

**Files:**
- Modify: `app/dm/TableroPanel.tsx`

`app/dm/TableroPanel.tsx` son 76 líneas. Ya importa `useParty` (línea 5) y ya tiene `const { party } = useParty();` (línea 11): **reutiliza los que hay**, no los declares otra vez. Los mandos del DM (líneas ~29-58: iniciar/pausar, fondo, cols/filas, poblar, PNJ, vaciar) se conservan **tal cual**.

- [ ] **Step 1: Añade los imports**

Junto a los imports existentes (arriba del archivo):

```tsx
import { useSession } from "@/components/SessionProvider";
import { useFichaViva } from "@/lib/useFichaViva";
import PanelCombate from "@/components/tablero/PanelCombate";
import type { Token } from "@/lib/useBattle";
import type { PlayState } from "@/lib/recursos";
```

- [ ] **Step 2: Añade el estado del panel**

Junto a `const { party } = useParty();` (línea 11), debajo:

```tsx
  const session = useSession();
  const ficha = useFichaViva(session?.id ?? null, "self");
  const condsDe = (t: Token): string[] =>
    t.user_id
      ? ((party.find((p) => p.user_id === t.user_id)?.play_state as PlayState | undefined)?.conds ?? [])
      : [];
```

- [ ] **Step 3: Envuelve el tablero y añade el panel al lado**

Sustituye estas dos líneas (60-61):

```tsx
      {/* Tablero */}
      <BattleBoard tokens={tokens} board={board} canMove={() => true} onMove={(id, x, y) => { void moveToken(id, x, y); }} />
```

por:

```tsx
      {/* Tablero + panel de combate del propio DM */}
      <div className="grid lg:grid-cols-[1.7fr_1fr] gap-5 items-start">
        <BattleBoard tokens={tokens} board={board} canMove={() => true} onMove={(id, x, y) => { void moveToken(id, x, y); }} />
        {ficha.ready && !ficha.error && ficha.characterId && (
          <PanelCombate
            ficha={ficha}
            tokens={tokens}
            board={board}
            ownUserId={session?.id ?? null}
            condsDe={condsDe}
            sessionId={session?.id ?? null}
          />
        )}
      </div>
```

> **Ojo**: el DM puede no tener personaje. Por eso el panel solo se pinta si
> `ficha.characterId` existe; si no, el DM ve el tablero y sus mandos exactamente
> como hasta ahora. Para llevar a los jugadores tiene Panel DM › Grupo, que **no
> se toca**.

- [ ] **Step 4: Verifica tipos y build**

Run: `npx tsc --noEmit && npx next build`
Expected: ambos limpios.

- [ ] **Step 5: Commit**

```bash
git add app/dm/TableroPanel.tsx
git commit -F - <<'EOF'
feat(tablero): el DM tiene la pantalla de combate con sus mandos

Panel DM › Tablero conserva iniciar/pausar, fondo, poblar y los PNJ, y suma el
PanelCombate al lado del tablero para jugar su propia ficha. Si el DM no tiene
personaje, el panel no se pinta y todo queda como antes. Panel DM › Grupo, que
es donde lleva a los jugadores, no se toca.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 7: Gate final + documentación

**Files:**
- Modify: `HANDOFF.md`
- Modify: vault Obsidian (`C:\Users\carlo\Desktop\Exandria-Obsidian\Exandria`)

- [ ] **Step 1: Gate completo — los once scripts**

Run: `for s in ficha spells conjuros targeting estado turno ataque tablero clases lore clima; do printf "%-10s " "$s:"; npx tsx scripts/check-$s.ts 2>&1 | tail -1; done`
Expected: los once terminan en `Todo en verde` (check-clima imprime `Todo OK`).

- [ ] **Step 2: Gate completo — tipos y build**

Run: `npx tsc --noEmit && npx next build`
Expected: ambos limpios.

- [ ] **Step 3: Actualiza `HANDOFF.md`**

- En «Lo último» de la cabecera, añade la entrada **12** (2026-07-26): el combate se muda de `/personaje` a `/tablero`; la ficha queda para stats e inventario; sin migración.
- En **Estructura**, corrige la descripción de `/tablero` (ya no es «la rejilla», es la pantalla de combate) y la de `/personaje`.
- Añade una sección `## RESUELTO (2026-07-26): el tablero es la pantalla de combate 🎮` con el molde de las demás: rama `tablero-combate`, sin migración, `useFichaViva`, `PanelCombate`, `DiceFeedStrip`, el corte de `CharacterSheet`, el objetivo compartido, que `/tablero` ya no exige combate activo, la vista del DM, lo que queda fuera (reglas nuevas, rediseñar `BattleBoard`, tocar `GrupoPanel`) y las **pruebas del usuario** copiadas del final del spec.

- [ ] **Step 4: Actualiza el vault**

En `C:\Users\carlo\Desktop\Exandria-Obsidian\Exandria`:
- `00 Meta/Historial de desarrollo.md`: callout `> [!success] El tablero es la pantalla de combate (2026-07-26)` ARRIBA del de O2, con el reparto de la pantalla, el porqué del hook y el corte limpio de `/personaje`.
- `30 Componentes/Componentes clave.md`: añade `PanelCombate` y `DiceFeedStrip`, y anota que `Ataques`/`Conjuros` reciben el objetivo por props.
- Si hay una nota de rutas, corrige qué hace `/tablero` y qué `/personaje`.

- [ ] **Step 5: Commit de la documentación**

```bash
git add HANDOFF.md
git commit -F - <<'EOF'
docs(tablero): HANDOFF y vault con la pantalla de combate

El combate se juega en /tablero (iniciativa, rejilla, estado, turno, ataques,
conjuros y rasgos con objetivo compartido) y /personaje queda para stats e
inventario. Sin migración: composición más el hook useFichaViva.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

- [ ] **Step 6: Merge a `master` y push** (tras las pruebas en vivo del usuario, o cuando él lo decida)

```bash
git checkout master && git merge --no-ff tablero-combate && git push origin master
```

---

## Notas de verificación en vivo (del usuario)

Sin sesión ni tablas del tablero en dev, nada de esto se prueba desde aquí. Tras desplegar:

- Entrar en `/tablero` **sin combate**: se ven estado, turno y las pestañas; la rejilla dice que no hay combate.
- Iniciar el combate desde Panel DM › Tablero y **poblar desde iniciativa**: la rejilla aparece en la ventana del jugador **sin recargar**.
- Elegir objetivo y **atacar** desde el tablero: gasta la acción y sale en la tira de tiradas.
- Cambiar a **Conjuros** con el mismo objetivo puesto y lanzar uno: el anuncio nombra al objetivo.
- **Recargar la página**: no se pierde nada de `play_state` (PG, huecos, condiciones).
- `/personaje`: sigue enseñando la ficha entera y **ya no** tiene ataques ni conjuros; el enlace al tablero funciona.
- El **DM** ve la misma pantalla con sus mandos; si el DM no tiene personaje, solo el tablero.
