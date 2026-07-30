# Mecánica por subclase — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dar a las 65 subclases su mecánica real por nivel (rasgos con texto completo), que la ficha pinta según el nivel del personaje.

**Architecture:** Un tipo nuevo `SubclassFeature` y, por clase, un `data/classdata/subclases/<clase>.ts` con `Record<nombreSubclase, SubclassFeature[]>`, más un `index.ts` registro + helper. La ficha añade los rasgos de la subclase elegida a los rasgos base. El gate valida el dato. Se quitan los placeholders `subclass:true` de los archivos de mecánica.

**Tech Stack:** TypeScript, Next.js 16, scripts con `tsx`. El gate real son los `scripts/check-*.ts`.

**Fuentes (65/65):** `C:\Users\carlo\Downloads\subclases.md` (50, se citan líneas) y `docs/superpowers/specs/2026-07-30-subclases-mecanica-fuente15.md` (15). Spec: `docs/superpowers/specs/2026-07-30-subclases-mecanica-design.md`.

**Reglas de transcripción (aplican a TODAS las tareas de datos):**
1. La **clave** del `Record` = nombre EXACTO de la subclase en `data/classes.ts` (no el del encabezado del .md, que a veces lleva "(Adaptado a 5.5e)" etc.).
2. Solo **mecánica**: descarta la línea "Ficción:" cuando exista. Guarda el texto de "Mecánica (5.5e):" o, si no hay split, el párrafo entero.
3. `level` = el nivel que da la fuente para ese rasgo (varía por clase; puede haber **dos rasgos al mismo nivel**). Orden ascendente por nivel.
4. `text`: string. Saltos con `\n`, viñetas con `• `. Escapa comillas dobles internas con `\"`.
5. Nombres de rasgo y de subclase: acentos y apóstrofos verbatim.

---

### Task 1: Arquitectura + Bárbaro (piloto)

**Files:**
- Modify: `data/classdata/types.ts`
- Create: `data/classdata/subclases/barbaro.ts`
- Create: `data/classdata/subclases/index.ts`
- Modify: `data/classdata/barbaro.ts` (quitar placeholders)
- Modify: `components/CharacterSheet.tsx`
- Modify: `scripts/check-clases.ts`

- [ ] **Step 1: Tipo `SubclassFeature` en `types.ts`**

Añadir tras el tipo `ClassFeature`:

```ts
export type SubclassFeature = {
  level: number;   // nivel al que la subclase concede el rasgo (1-20)
  name: string;    // nombre canónico ES del rasgo
  text: string;    // regla completa; \n para saltos, "• " para viñetas
};
```

- [ ] **Step 2: `data/classdata/subclases/barbaro.ts`**

Bárbaro, niveles 3/6/10/14. Fuentes: Furia Bermellón `subclases.md:43-53`; Titán Caído `subclases.md:230-240`; Ceniza Helada / Mutación Salvaje / Rompe-Mares → `fuente15.md` sección Bárbaro. Formato (ejemplo COMPLETO de la 1ª subclase, replica el patrón para las otras 4):

```ts
import type { SubclassFeature } from "../types";

export const BARBARO_SUBCLASSES: Record<string, SubclassFeature[]> = {
  "Senda de la Furia Bermellón": [
    { level: 3, name: "Rabia Insondable", text: "Tu furia no es física, es una presión mental aplastante. Cuando entras en Furia, tus ojos brillan con un rojo oscuro y emites una luz tenue a 10 pies (3 metros). Mientras estés en Furia, puedes elegir que tus ataques cuerpo a cuerpo inflijan daño Psíquico en lugar de su daño normal. Si lo haces, añades tu bonificador de Furia al daño como es habitual. Además, el primer enemigo que reciba daño Psíquico de tus ataques en cada uno de tus turnos pierde la capacidad de realizar Reacciones hasta el inicio de su próximo turno." },
    { level: 6, name: "Mente Alienígena", text: "La luna roja protege tu consciencia. Obtienes Resistencia al daño Psíquico (incluso si no estás en Furia) y adquieres telepatía a 30 pies (9 metros). Además, si fallas una Tirada de Salvación de Inteligencia, Sabiduría o Carisma, puedes usar tu Reacción para gastar un uso de tu Furia y repetir la tirada. Debes usar el nuevo resultado." },
    { level: 10, name: "Presagio de Predathos", text: "Al canalizar el hambre cósmica de Ruidus, puedes devorar la magia circundante. Como Acción Mágica, puedes gastar un uso de tu Furia para lanzar el hechizo Disipar Magia o Miedo. Usas Constitución como tu aptitud mágica para estos hechizos. Puedes lanzar estos hechizos incluso si estás actualmente en Furia, y hacerlo cuenta como si hubieras realizado un ataque para mantener tu Furia activa." },
    { level: 14, name: "Ecos del Devorador", text: "El hambre de la luna roja se manifiesta físicamente cuando destrozas a tus enemigos. Mientras estás en Furia, si asestas un Golpe Crítico a una criatura o la reduces a 0 Puntos de Golpe, invocas un zarcillo carmesí psíquico. Tú recuperas Puntos de Golpe Temporales iguales a 1d12 + tu nivel de Bárbaro, y puedes obligar a una criatura que puedas ver a 30 pies a realizar una Tirada de Salvación de Sabiduría (CD 8 + Competencia + Constitución) o quedar Asustada de ti durante 1 minuto (puede repetir la tirada al final de cada uno de sus turnos)." },
  ],
  "Senda del Titán Caído": [ /* nv3 Piel de Montaña, nv6 Impacto Sísmico, nv10 Raíces de Piedra, nv14 Coloso Primordial — de subclases.md:230-240 */ ],
  "Senda de la Ceniza Helada": [ /* nv3/6/10/14 de fuente15.md */ ],
  "Senda de la Mutación Salvaje": [ /* nv3/6/10/14 de fuente15.md */ ],
  "Senda del Rompe-Mares": [ /* nv3/6/10/14 de fuente15.md */ ],
};
```

Rellena los 4 arrays marcados `/* … */` transcribiendo de la fuente citada según las Reglas de transcripción.

- [ ] **Step 3: `data/classdata/subclases/index.ts`**

```ts
import type { SubclassFeature } from "../types";
import { BARBARO_SUBCLASSES } from "./barbaro";

// slug de clase → nombre de subclase → rasgos. Las clases 2-13 se añaden aquí
// a medida que se transcriben.
export const SUBCLASS_FEATURES: Record<string, Record<string, SubclassFeature[]>> = {
  barbaro: BARBARO_SUBCLASSES,
};

export function subclassFeaturesFor(slug: string, subclase: string | null): SubclassFeature[] {
  if (!subclase) return [];
  return SUBCLASS_FEATURES[slug]?.[subclase] ?? [];
}
```

- [ ] **Step 4: Quitar placeholders de `data/classdata/barbaro.ts`**

Eliminar de su array `features` las 4 entradas con `subclass: true` (niveles 3/6/10/14, blurbs genéricos tipo "La senda primigenia…"). Dejar intactas las features base.

- [ ] **Step 5: UI en `components/CharacterSheet.tsx`**

Añadir el import (junto a los de `@/data/classdata`):

```ts
import { subclassFeaturesFor } from "@/data/classdata/subclases";
```

Reemplazar el bloque `featuresByLevel` (líneas ~266-277) por:

```ts
  const featuresByLevel = useMemo(() => {
    if (!mechanics) return [] as { level: number; feats: { name: string; body: string; sub?: string; preWrap?: boolean }[] }[];
    const items: { level: number; name: string; body: string; sub?: string; preWrap?: boolean }[] = [];
    for (const f of mechanics.features) {
      if (f.level > level || f.subclass) continue; // los placeholders de subclase ya no se pintan
      items.push({ level: f.level, name: f.name, body: f.blurb });
    }
    for (const sf of subclassFeaturesFor(build.cls ?? "", build.subclass)) {
      if (sf.level > level) continue;
      items.push({ level: sf.level, name: sf.name, body: sf.text, sub: build.subclass ?? undefined, preWrap: true });
    }
    const map = new Map<number, { name: string; body: string; sub?: string; preWrap?: boolean }[]>();
    for (const it of items) {
      if (!map.has(it.level)) map.set(it.level, []);
      map.get(it.level)!.push({ name: it.name, body: it.body, sub: it.sub, preWrap: it.preWrap });
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]).map(([lvl, feats]) => ({ level: lvl, feats }));
  }, [mechanics, level, build.subclass, build.cls]);
```

Reemplazar el render de cada feature (líneas ~642-647) por:

```tsx
                        <div key={f.name} className="panel-raised p-3">
                          <p className="font-ui text-[13px] font-bold" style={{ color: "var(--color-parch)" }}>
                            {f.name}{f.sub ? ` — ${f.sub}` : ""}
                          </p>
                          <p className="font-ui text-[12px] mt-1" style={{ color: "var(--color-muted)", whiteSpace: f.preWrap ? "pre-wrap" : undefined }}>{f.body}</p>
                        </div>
```

(El tipo local ya no es `ClassFeature`; si queda un import de `ClassFeature` sin usar, quítalo.)

- [ ] **Step 6: Dientes de calidad en `scripts/check-clases.ts`**

Añadir el import arriba (junto a `import { CLASSES } …`):

```ts
import { SUBCLASS_FEATURES } from "../data/classdata/subclases";
```

Insertar antes del `console.log` final, DESPUÉS del bloque de subclases de la fase 1:

```ts
// --- Mecánica de subclase (data/classdata/subclases): calidad de lo presente ---
for (const c of CLASSES) {
  const reg = SUBCLASS_FEATURES[c.slug] ?? {};
  for (const s of c.subclasses) {
    const feats = reg[s.name];
    if (!feats) continue; // la presencia (65/65) se exige en la tarea final
    check(`${c.slug} · ${s.name}: ≥3 rasgos`, feats.length >= 3);
    check(`${c.slug} · ${s.name}: ≥1 rasgo a nivel 3`, feats.some((f) => f.level === 3));
    check(`${c.slug} · ${s.name}: niveles 1-20 no decrecientes`,
      feats.every((f, i) => f.level >= 1 && f.level <= 20 && (i === 0 || f.level >= feats[i - 1].level)));
    check(`${c.slug} · ${s.name}: name/text no vacíos`, feats.every((f) => f.name.trim().length > 0 && f.text.trim().length > 0));
  }
}
// Sin huérfanos: toda clave del dato existe como subclase en classes.ts
const nombresValidos = new Set(CLASSES.flatMap((c) => c.subclasses.map((s) => s.name)));
for (const [slug, reg] of Object.entries(SUBCLASS_FEATURES)) {
  for (const nombre of Object.keys(reg)) {
    check(`${slug} · ${nombre}: no huérfano`, nombresValidos.has(nombre));
  }
}
```

- [ ] **Step 7: Verificar**

Run: `npx tsc --noEmit` → sin errores.
Run: `npx tsx scripts/check-clases.ts` → "Todo en verde" (Bárbaro valida; las demás subclases aún no tienen dato y no se exige presencia todavía).

- [ ] **Step 8: Commit**

```bash
git add data/classdata/types.ts data/classdata/subclases/barbaro.ts data/classdata/subclases/index.ts data/classdata/barbaro.ts components/CharacterSheet.tsx scripts/check-clases.ts
git commit -F - <<'EOF'
feat: mecanica de subclase - arquitectura + Barbaro piloto

Tipo SubclassFeature, registro subclases/index, helper, UI en la ficha
(pinta los rasgos reales de la subclase elegida), dientes de calidad al
gate y quita los placeholders subclass:true del barbaro. Barbaro con sus
5 subclases como piloto del pipeline.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
```

---

### Tasks 2–13: una clase por tarea

Cada tarea repite EXACTAMENTE el patrón de la Task 1 pasos 2/3/4 para su clase:
1. **Crear** `data/classdata/subclases/<clase>.ts` con `export const <CLASE>_SUBCLASSES: Record<string, SubclassFeature[]> = { … }` (5 subclases, transcritas de las fuentes citadas abajo, según las Reglas de transcripción).
2. **Añadir** a `data/classdata/subclases/index.ts` el `import` y la entrada `<slug>: <CLASE>_SUBCLASSES` en `SUBCLASS_FEATURES`.
3. **Quitar** de `data/classdata/<clase>.ts` las features `subclass: true`.
4. Verificar: `npx tsc --noEmit` y `npx tsx scripts/check-clases.ts` → verde.
5. Commit (solo los archivos tocados): `feat: mecanica de subclase - <Clase>`.

Fuentes por subclase (clave del Record = nombre en `data/classes.ts`):

- [ ] **Task 2 · Bardo** (nv 3/6/14) — Lamento `md:71-85`, Espejismo `md:438-449`, Himno Marcial `md:450-461`, Ecos `md:462-476`, Astros `md:477-491`.
- [ ] **Task 3 · Clérigo** (nv 3/6/17) — Convergencia `md:129-148`, Sangre `md:492-508`, Forja Ancestral `md:509-530`, Cieno `md:531-549`, Puerta Divina `md:550-568`.
- [ ] **Task 4 · Druida** (nv 3/6/10/14) — Ceniza `md:242-264`, Enjambre Feérico `md:795-819`, Tormenta Primigenia `md:820-842`, Espora Abisal `md:843-865`, Escarcha Corrupta `md:866-891`.
- [ ] **Task 5 · Explorador** (nv 3/7/11/15) — Cazador de Malicia `md:163-181`, Vigilante del Telón `md:265-284`, Rastreador de Yermos `md:285-304`, Inquisidor de la Asamblea `md:305-324`, Vigía de Rifenmist `md:325-344`.
- [ ] **Task 6 · Hechicero** (nv 3/6/14/18) — Alma del Luxon `md:149-162`, Corazón de Magma `md:637-656`, Alma Feérica `md:657-676`, Linaje Radiante `md:677-696`, Linaje de la Calamidad `md:697-724`.
- [ ] **Task 7 · Mago** (nv 3/6/10/14) — Invocador de Ecos `md:1-22`, Graviturgia `md:725-745`, Cronurgia `md:746-759`, Hemomante `md:760-776`, Maestro de Sellos `md:777-794`.
- [ ] **Task 8 · Pícaro** (nv 3/9/13/17) — Sombra Dunamántica `md:55-70`, Saqueador Arcano `md:569-584`, Sindicalista de la Myriad `md:585-600`, Fantasma de las Dunas `md:601-620`, Asesino de Azuremita `md:621-636`.
- [ ] **Task 9 · Brujo** (nv 3/6/10/14) — Heraldo de Ruidus `md:205-229`, Leviatán Sellado `md:345-367`, Tejedora `md:368-387`, Archimago Caído `md:388-411`, Espíritu de la Tierra `md:412-437`. (Recuerda: la clave lleva el prefijo "Patrón del/de la …" como en classes.ts.)
- [ ] **Task 10 · Cazador de Sangre** (nv 3/7/11/15) — Velo Carmesí `md:182-204`, Paraje Marchito `md:892-910`, Inquisidor `md:911-929`, Mutante `md:930-951`, Bestia `md:952-976`.
- [ ] **Task 11 · Guerrero** (nv 3/7/10/15/18) — Hoplita de la Puerta Divina `md:24-42`; Elementalista, Caballero de Grifos, Guardia de los Ecos, Rompeasedios → `fuente15.md` sección Guerrero.
- [ ] **Task 12 · Monje** (nv 3/6/11/17) — Camino del Hilo del Destino `md:86-101`; Alma de Cobalto, Cadenas Rotas, Vientos Cenicientos, Mente Vacía → `fuente15.md` sección Monje.
- [ ] **Task 13 · Paladín** (nv 3/7/15/20, dos rasgos a nv3) — Juramento de la Reclamación `md:102-128`; Exilio, Luz Primigenia, Alba, Grilletes → `fuente15.md` sección Paladín.

---

### Task 14: cierre — exigir 65/65 y sin placeholders

**Files:**
- Modify: `scripts/check-clases.ts`

- [ ] **Step 1: Añadir los dientes de completitud**

Insertar tras el bloque de calidad de subclase:

```ts
// --- Mecánica de subclase: completitud (todas las tareas hechas) ---
for (const c of CLASSES) {
  const reg = SUBCLASS_FEATURES[c.slug] ?? {};
  for (const s of c.subclasses) {
    check(`${c.slug} · ${s.name}: tiene mecánica`, Array.isArray(reg[s.name]));
  }
}
check("ningún placeholder subclass:true sobrevive",
  clases.every((c) => (c.features ?? []).every((f) => !f.subclass)));
```

- [ ] **Step 2: Verificar el pipeline completo**

Run: `npx tsc --noEmit` → sin errores.
Run: `npx next build` → OK.
Run (bash tool): `for f in scripts/check-*.ts; do npx tsx "$f" >/dev/null || echo "FALLO: $f"; done` → sin "FALLO".

- [ ] **Step 3: Commit**

```bash
git add scripts/check-clases.ts
git commit -F - <<'EOF'
test: check-clases exige mecanica en las 65 subclases

Cierra los dientes: cada subclase de classes.ts tiene rasgos en
SUBCLASS_FEATURES, y ningun placeholder subclass:true sobrevive en
CLASS_MECHANICS.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
```

---

## Cierre (fuera de las tareas)

Actualizar `HANDOFF.md` (fase 2 hecha) + vault. Verificación viva en `/crear` y la ficha la hace el usuario con sesión (elegir subclase → ver sus rasgos por nivel). Merge a `master` y push.

---

## Self-Review

- **Cobertura del spec:** tipo `SubclassFeature` (T1) ✓; archivos por clase + index + helper (T1–13) ✓; solo-mecánica y formato de texto (Reglas) ✓; quitar placeholders (T1–13, verificado en T14) ✓; UI pinta rasgos reales con pre-wrap (T1) ✓; gate calidad (T1) + integridad referencial/sin huérfanos (T1) + completitud 65/65 y sin placeholders (T14) ✓; fuentes 65/65 citadas por subclase ✓.
- **Verde por commit:** T1–13 no exigen presencia (solo calidad de lo presente), así que cada commit queda verde con datos parciales; la presencia 65/65 se exige en T14 cuando ya está todo. ✓
- **Placeholders del plan:** los `/* … */` de la Task 1 step 2 son las 4 subclases a transcribir de fuente citada, con un ejemplo completo (Furia Bermellón) como plantilla; no son huecos sin especificar. Tasks 2–13 dan fuente exacta por subclase + procedimiento idéntico.
- **Consistencia de tipos:** `SubclassFeature {level,name,text}`, `SUBCLASS_FEATURES[slug][nombre]`, `subclassFeaturesFor(slug, subclase)`, `build.cls`/`build.subclass`, `check(label,cond)` — todos coherentes entre tareas y con el código real leído.
