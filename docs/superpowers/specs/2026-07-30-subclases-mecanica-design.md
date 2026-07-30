# Mecánica por subclase (2026-07-30)

## Objetivo

Dar a las 65 subclases (fase 1: nombre+blurb, ya en `master`) su **mecánica real
por nivel**: cada subclase muestra en la ficha sus rasgos (nivel, nombre, texto
de regla completo) según el nivel del personaje. Hoy el modelo no puede: los
rasgos `subclass: true` en `data/classdata/*` son placeholders genéricos, iguales
para las 5 subclases de una clase.

## Fuentes (cobertura 65/65)

- **50 subclases**: `C:\Users\carlo\Downloads\subclases.md` (976 líneas, fuera del
  repo; se citan rangos de línea en el plan).
- **15 subclases** (Bárbaro Ceniza Helada / Mutación Salvaje / Rompe-Mares;
  Guerrero Elementalista / Caballero de Grifos / Guardia de los Ecos /
  Rompeasedios; Monje Alma de Cobalto / Cadenas Rotas / Vientos Cenicientos /
  Mente Vacía; Paladín Exilio / Luz Primigenia / Alba / Grilletes):
  `docs/superpowers/specs/2026-07-30-subclases-mecanica-fuente15.md` (en el repo).

Convención del repo: la mecánica son **hechos** y se transcriben tal cual; se
descarta la línea de "Ficción" (sabor). El blurb de la subclase en `classes.ts`
ya aporta el tono.

## Alcance

- **Crea**: `data/classdata/subclases/<clase>.ts` (13 archivos),
  `data/classdata/subclases/index.ts` (registro + helper).
- **Modifica**: `data/classdata/types.ts` (tipo nuevo), `components/CharacterSheet.tsx`
  (pintar rasgos reales), `scripts/check-clases.ts` (dientes de mecánica).
- **No toca**: los archivos de mecánica base (`data/classdata/barbaro.ts`…) salvo
  para **quitar** de su `features` los placeholders `subclass: true` (ver abajo).

## Modelo de datos

En `data/classdata/types.ts`:

```ts
export type SubclassFeature = {
  level: number;   // nivel al que la subclase concede el rasgo (1-20)
  name: string;    // nombre canónico ES del rasgo (p. ej. "Aura Glaciar")
  text: string;    // regla completa; \n para saltos, "• " para viñetas
};
```

Un archivo por clase, p. ej. `data/classdata/subclases/barbaro.ts`:

```ts
import type { SubclassFeature } from "../types";

export const BARBARO_SUBCLASSES: Record<string, SubclassFeature[]> = {
  "Senda de la Furia Bermellón": [
    { level: 3, name: "Rabia Insondable", text: "…" },
    // …
  ],
  // … las otras 4 sendas
};
```

La **clave** de cada `Record` es el **nombre exacto** de la subclase en
`data/classes.ts` (integridad referencial que valida el gate).

`data/classdata/subclases/index.ts`:

```ts
import { BARBARO_SUBCLASSES } from "./barbaro";
// … imports de las 13 clases
export const SUBCLASS_FEATURES: Record<string, Record<string, SubclassFeature[]>> = {
  barbaro: BARBARO_SUBCLASSES,
  // … las 13, por slug de clase
};
export function subclassFeaturesFor(slug: string, subclase: string | null): SubclassFeature[] {
  if (!subclase) return [];
  return SUBCLASS_FEATURES[slug]?.[subclase] ?? [];
}
```

## Contenido

- **Los niveles de cada rasgo salen de la fuente, no se inventan.** Varían por
  clase y no siguen todos el 3/6/10/14 por defecto — p. ej. Clérigo va a 3/6/17,
  Paladín a 3/7/15/20, Explorador y Cazador de Sangre a 3/7/11/15, Guerrero a
  3/7/10/15/18, Pícaro a 3/9/13/17, Bardo a 3/6/14. Ante duda, el nivel que ponga
  la fuente para ese rasgo.
  Puede haber **dos rasgos al mismo nivel** (p. ej. Paladín nv3: Conjuros +
  Canalizar Divinidad; Guardia de los Ecos nv3: Manifestar Eco + Cambio de Lugar).
  El número de rasgos por subclase = lo que dé la fuente (3–6).
- `text`: string plano. Saltos con `\n`, viñetas con `• `. Sin librería markdown.

## Placeholders viejos

Cada clase tiene hoy ~4 features `subclass: true` en su archivo de `classdata`
(texto genérico tipo "La senda primigenia otorga un rasgo culminante…"). **Se
eliminan** de `features`; los rasgos de subclase ya no salen de ahí sino del dato
nuevo. Las features base (no-subclase) de cada clase se quedan igual.

## UI (`components/CharacterSheet.tsx`)

Hoy (línea ~268) filtra `mechanics.features` incluyendo los `subclass:true`
genéricos si hay subclase elegida, y (línea ~644) pega el nombre de la subclase
al rasgo genérico. Cambia a:

- Las features base se pintan como hasta ahora (ya sin los placeholders de
  subclase, que se han quitado del dato).
- Si `build.subclass` está elegida, se añaden sus `SubclassFeature` con
  `level <= nivel` (vía `subclassFeaturesFor(cls.slug, build.subclass)`), cada
  una con su `name` y su `text` completo. El `text` se pinta con
  `white-space: pre-wrap` para respetar saltos y viñetas.

## Dientes al gate (`scripts/check-clases.ts`, ampliado)

Sobre `CLASSES` (classes.ts) y `SUBCLASS_FEATURES` (dato nuevo):

- **Integridad referencial**: cada una de las 65 subclases de `classes.ts` tiene
  entrada en `SUBCLASS_FEATURES[slug]`, y no hay entradas huérfanas (toda clave
  del dato nuevo existe como subclase en `classes.ts`).
- Por subclase: **≥3 rasgos**; **≥1 rasgo a nivel 3**; cada rasgo con `level`
  1–20 y la lista **ordenada de forma no decreciente** por nivel; `name` y `text`
  no vacíos (tras `trim()`).
- Ningún placeholder `subclass: true` sobrevive en `CLASS_MECHANICS` (se
  eliminaron).

## Secuenciación (multi-sesión)

- **Tarea 1 — arquitectura + piloto**: tipo `SubclassFeature`, `index.ts` con el
  registro, helper, cambios de UI, dientes del gate, quitar placeholders de
  `barbaro.ts`, y **Bárbaro** entero (`barbaro.ts` subclases, 5 subclases) como
  clase piloto. Deja el pipeline verde de punta a punta.
- **Tareas 2–13 — una clase por tarea**: cada tarea crea
  `data/classdata/subclases/<clase>.ts` con sus 5 subclases transcritas de la
  fuente, quita los placeholders del `classdata` de esa clase, y el gate valida.
  Cada tarea = commit verde. Orden sugerido: primero las 9 clases completas en el
  `.md`, luego las que usaron fuente15 (Guerrero, Monje, Paladín) — Bárbaro ya en
  la tarea 1.

## Gate de cierre

`npx tsc --noEmit` + `npx next build` + los 23 `scripts/check-*.ts` en verde
(check-clases.ts con los dientes de mecánica; no se añade script nuevo). Verificación viva en `/crear` y en
la ficha la hace el usuario con sesión. `HANDOFF.md` + vault al terminar.
