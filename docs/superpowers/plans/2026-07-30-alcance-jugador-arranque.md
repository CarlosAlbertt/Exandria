# Alcance del jugador para el arranque — plan de implementación

> **Para agentes:** SUB-SKILL OBLIGATORIA: usa `superpowers:subagent-driven-development`
> (recomendado) o `superpowers:executing-plans` para ejecutar este plan tarea a
> tarea. Los pasos usan casillas (`- [ ]`) para el seguimiento.

**Objetivo:** que el jugador solo pueda ver y alcanzar `/`, `/crear`,
`/personaje`, `/inventario`, `/reino` y `/lugar`; el resto se cierra de verdad
(no solo se oculta) y muestra una página «se abrirá más adelante». El DM sigue
viéndolo todo.

**Arquitectura:** una sola fuente de verdad (`lib/acceso.ts`) con la lista de
rutas del jugador, la lista del nav y la función `puedeVer(role, path)`. El
proxy la usa como puerta (rewrite a `/cerrado`), el nav filtra sus enlaces con
ella y la portada decide con ella qué pinta. Un script de gate nuevo
(`scripts/check-acceso.ts`) exige que **toda** ruta de `app/` esté clasificada,
así que una ruta futura no se cuela sin decidir.

**Stack:** Next.js 16 (App Router, `proxy.ts` en vez de `middleware`) · React 19
· TypeScript · Supabase SSR. **Sin migración.**

**Spec:** `docs/superpowers/specs/2026-07-30-alcance-jugador-arranque-design.md`

**Rama:** `alcance-jugador` (ya creada; el spec ya está commiteado en ella).

> **No hay tests.** El gate real es `npx tsc --noEmit` + `npx next build` + los
> `scripts/check-*.ts`. Donde este plan dice «escribe el test que falla», se
> refiere al **script de comprobación**, que se escribe antes que el código y
> se ejecuta para verlo fallar. Es el mismo ciclo.

---

## Estructura de archivos

**Crear:**
- `lib/acceso.ts` — la fuente de verdad: `RUTAS_JUGADOR`, `RUTA_CERRADA`,
  `NAV_LINKS`, `puedeVer(role, path)`. Sin `"use client"` y sin importar
  Supabase: lo consumen el proxy (servidor), el nav (cliente) y la portada
  (servidor).
- `scripts/check-acceso.ts` — el gate 25.
- `app/cerrado/page.tsx` — la página «se abrirá más adelante».
- `components/home/PortadaDm.tsx` — la portada de hoy, movida tal cual.
- `components/home/PanelJugador.tsx` — las cuatro puertas del jugador.

**Modificar:**
- `lib/supabase/proxy-session.ts` — la puerta por rol.
- `components/SiteNav.tsx:12-34` — dos listas → una filtrada.
- `app/page.tsx` — pasa a server component que elige portada según rol.
- `components/ReinoRegions.tsx:24` — el enlace a `/mapa`, solo para el DM.
- `components/CharacterSheet.tsx:528-537` — la sección «Ir al combate», solo
  para el DM.
- `HANDOFF.md` — estado.

**No se toca:** `proxy.ts` (sigue delegando en `updateSession`), ninguna de las
rutas cerradas, ninguna tabla, `app_config`.

---

### Tarea 1: `lib/acceso.ts` y el gate de `puedeVer`

**Archivos:**
- Crear: `lib/acceso.ts`
- Crear: `scripts/check-acceso.ts`

- [ ] **Paso 1: escribe el gate que falla**

Crea `scripts/check-acceso.ts`:

```ts
// Comprobación manual del alcance del jugador (lib/acceso.ts).
// Uso: npx tsx scripts/check-acceso.ts
import { puedeVer, RUTAS_JUGADOR, RUTA_CERRADA } from "../lib/acceso";

let failures = 0;
function check(label: string, condition: boolean) {
  if (condition) console.log(`OK   ${label}`);
  else { console.log(`FAIL ${label}`); failures++; }
}

// --- El DM lo ve todo -------------------------------------------------------
for (const p of ["/", "/mapa", "/bestiario", "/combate", "/dm", "/taberna", "/reino/wildemount"]) {
  check(`dm ve ${p}`, puedeVer("dm", p) === true);
}

// --- El jugador ve exactamente su lista ------------------------------------
const ABIERTAS = ["/", "/crear", "/personaje", "/inventario", "/reino", "/lugar", "/cerrado", "/login"];
for (const p of ABIERTAS) {
  check(`jugador ve ${p}`, puedeVer("player", p) === true);
}

const CERRADAS = ["/panteon", "/cronica", "/bestiario", "/mapa", "/combate", "/taberna", "/narrador", "/dm"];
for (const p of CERRADAS) {
  check(`jugador NO ve ${p}`, puedeVer("player", p) === false);
}

// --- Subrutas: la barra tiene que ser explícita ----------------------------
check("jugador ve /reino/wildemount (subruta)", puedeVer("player", "/reino/wildemount") === true);
check("jugador ve /reino/tal-dorei (subruta)", puedeVer("player", "/reino/tal-dorei") === true);
check("jugador NO ve /reinos (prefijo falso)", puedeVer("player", "/reinos") === false);
check("jugador NO ve /personajes (prefijo falso)", puedeVer("player", "/personajes") === false);
check("jugador NO ve /mapa/algo (subruta cerrada)", puedeVer("player", "/mapa/algo") === false);
check('"/" no abre todo por prefijo', puedeVer("player", "/dm") === false);

// --- Coherencia de la lista ------------------------------------------------
check("RUTAS_JUGADOR incluye la ruta cerrada (si no, bucle de rewrite)",
  (RUTAS_JUGADOR as readonly string[]).includes(RUTA_CERRADA));
check("RUTAS_JUGADOR incluye /login", (RUTAS_JUGADOR as readonly string[]).includes("/login"));
check("RUTAS_JUGADOR sin duplicados",
  new Set(RUTAS_JUGADOR).size === RUTAS_JUGADOR.length);
check("todas las RUTAS_JUGADOR empiezan por /",
  RUTAS_JUGADOR.every((r) => r.startsWith("/")));
check("ninguna RUTAS_JUGADOR acaba en / salvo la raíz",
  RUTAS_JUGADOR.every((r) => r === "/" || !r.endsWith("/")));

console.log(failures === 0 ? `\nTodo OK` : `\n${failures} FALLOS`);
process.exit(failures === 0 ? 0 : 1);
```

- [ ] **Paso 2: ejecútalo para verlo fallar**

```bash
npx tsx scripts/check-acceso.ts
```

Esperado: **error de módulo no encontrado** (`Cannot find module '../lib/acceso'`).
Eso es el rojo de este ciclo.

- [ ] **Paso 3: escribe `lib/acceso.ts`**

```ts
import type { Role } from "@/lib/auth";

/**
 * Las rutas que un jugador puede ver durante el arranque de campaña.
 * Abrir una sección es añadir su ruta aquí y desplegar: el nav, la puerta del
 * proxy y la portada leen todos de esta lista, así que no pueden divergir.
 * `/cerrado` y `/login` van dentro porque son alcanzables por cualquiera (si
 * `/cerrado` se cerrase a sí misma, el rewrite entraría en bucle).
 */
export const RUTAS_JUGADOR = [
  "/",
  "/crear",
  "/personaje",
  "/inventario",
  "/reino",
  "/lugar",
  "/cerrado",
  "/login",
] as const;

/** La página que se pinta en lugar de una ruta cerrada. */
export const RUTA_CERRADA = "/cerrado";

/** Los enlaces de la barra, en orden. `SiteNav` los filtra con `puedeVer`. */
export const NAV_LINKS: { href: string; label: string }[] = [
  { href: "/", label: "Inicio" },
  { href: "/personaje", label: "Ficha" },
  { href: "/reino", label: "Reino" },
  { href: "/panteon", label: "Panteón" },
  { href: "/cronica", label: "Crónica" },
  { href: "/bestiario", label: "Bestiario" },
  { href: "/crear", label: "Crear" },
  { href: "/inventario", label: "Inventario" },
  { href: "/mapa", label: "Mapa" },
  { href: "/combate", label: "Combate" },
  { href: "/narrador", label: "Narrador" },
  { href: "/dm", label: "Panel DM" },
];

/**
 * ¿Puede este rol ver esta ruta? El DM lo ve todo.
 * La barra del `startsWith` es obligatoria: sin ella `/reino` dejaría entrar a
 * `/reinos`, y `/` dejaría entrar a todo.
 */
export function puedeVer(role: Role, path: string): boolean {
  if (role === "dm") return true;
  return RUTAS_JUGADOR.some(
    (r) => path === r || (r !== "/" && path.startsWith(r + "/"))
  );
}
```

- [ ] **Paso 4: ejecuta el gate para verlo pasar**

```bash
npx tsx scripts/check-acceso.ts
```

Esperado: todas las líneas `OK`, última línea `Todo OK`, código de salida 0.

- [ ] **Paso 5: prueba de mutación**

Rompe `puedeVer` a propósito quitando la barra:
`path.startsWith(r + "/")` → `path.startsWith(r)`. Ejecuta el script.
Esperado: **FALLA** en `jugador NO ve /reinos` y `jugador NO ve /personajes`.

Restaura con `git stash` o deshaciendo la edición a mano. **No uses
`git checkout --`**: te llevas por delante el archivo entero, que aún no está
commiteado.

Segunda mutación: añade `"/mapa"` a `RUTAS_JUGADOR`. Esperado: **FALLA** en
`jugador NO ve /mapa`. Restaura igual.

- [ ] **Paso 6: commit**

```bash
git add lib/acceso.ts scripts/check-acceso.ts
git commit -m "feat: lib/acceso, la fuente de verdad del alcance del jugador"
```

---

### Tarea 2: el gate exige que toda ruta esté clasificada

Esta es la regla que impide que una ruta futura se cuele sin decidir. Sin
ella, quien añada `app/tienda/page.tsx` la deja abierta o cerrada sin
enterarse.

**Archivos:**
- Modificar: `scripts/check-acceso.ts`

- [ ] **Paso 1: añade la regla al gate**

Añade al final de `scripts/check-acceso.ts`, **antes** del bloque
`console.log(failures === 0 ...)`:

```ts
// --- Toda ruta de app/ está clasificada ------------------------------------
// Si añades una página nueva, decláralas aquí. Que este check falle es lo que
// impide que una ruta nueva se cuele abierta (o cerrada) sin decidirlo.
import { readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

// `process.cwd()` y no `__dirname`: es lo que usan check-taldorei y
// check-atlas, y los scripts se lanzan siempre desde la raíz del repo.
const APP = join(process.cwd(), "app");

// Rutas de primer nivel esperadas, clasificadas a mano.
const ESPERADAS_ABIERTAS = ["/", "/crear", "/personaje", "/inventario", "/reino", "/lugar", "/cerrado", "/login"];
const ESPERADAS_CERRADAS = ["/panteon", "/cronica", "/bestiario", "/mapa", "/combate", "/taberna", "/narrador", "/dm"];

// ¿Hay algún page.tsx en este árbol? (una ruta puede tener la página en un
// subdirectorio dinámico, p. ej. app/reino/[continente]/page.tsx)
function tienePagina(dir: string): boolean {
  if (existsSync(join(dir, "page.tsx"))) return true;
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .some((e) => tienePagina(join(dir, e.name)));
}

const descubiertas: string[] = [];
if (existsSync(join(APP, "page.tsx"))) descubiertas.push("/");
for (const e of readdirSync(APP, { withFileTypes: true })) {
  if (!e.isDirectory() || e.name === "api") continue;
  if (tienePagina(join(APP, e.name))) descubiertas.push("/" + e.name);
}

const clasificadas = new Set([...ESPERADAS_ABIERTAS, ...ESPERADAS_CERRADAS]);
for (const r of descubiertas) {
  check(`ruta ${r} está clasificada en check-acceso`, clasificadas.has(r));
  check(`ruta ${r}: puedeVer coincide con su clasificación`,
    puedeVer("player", r) === ESPERADAS_ABIERTAS.includes(r));
}
for (const r of clasificadas) {
  check(`la ruta clasificada ${r} existe en app/`, descubiertas.includes(r));
}

// --- Los enlaces del nav no llevan a puerta cerrada ------------------------
for (const l of NAV_LINKS) {
  check(`nav: el DM puede ver ${l.href}`, puedeVer("dm", l.href) === true);
}
const navJugador = NAV_LINKS.filter((l) => puedeVer("player", l.href)).map((l) => l.href);
check("nav del jugador = Inicio, Ficha, Reino, Crear, Inventario",
  JSON.stringify(navJugador) === JSON.stringify(["/", "/personaje", "/reino", "/crear", "/inventario"]));
check("nav: sin hrefs duplicados",
  new Set(NAV_LINKS.map((l) => l.href)).size === NAV_LINKS.length);
check("nav: ninguna etiqueta vacía", NAV_LINKS.every((l) => l.label.trim().length > 0));
```

Y cambia la primera línea del archivo para importar también `NAV_LINKS`:

```ts
import { puedeVer, RUTAS_JUGADOR, RUTA_CERRADA, NAV_LINKS } from "../lib/acceso";
```

> Mueve los dos `import` de `node:fs` / `node:path` arriba del todo, con los
> demás imports. Van escritos aquí junto a su bloque para que se lea seguido,
> pero TypeScript los quiere arriba.

- [ ] **Paso 2: ejecuta el gate**

```bash
npx tsx scripts/check-acceso.ts
```

Esperado: **FALLA** en `la ruta clasificada /cerrado existe en app/` — la
página aún no existe (se crea en la Tarea 3). Todo lo demás en `OK`.

Ese fallo es correcto y esperado: confirma que la regla muerde.

- [ ] **Paso 3: commit**

```bash
git add scripts/check-acceso.ts
git commit -m "test: el gate exige clasificar toda ruta de app/"
```

---

### Tarea 3: la página `/cerrado`

**Archivos:**
- Crear: `app/cerrado/page.tsx`

- [ ] **Paso 1: escribe la página**

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import Emblem from "@/components/Emblem";

export const metadata: Metadata = { title: "Aún no" };

const PUERTAS = [
  { href: "/personaje", icon: "fa-scroll", label: "Tu ficha" },
  { href: "/inventario", icon: "fa-sack-xmark", label: "Tu inventario" },
  { href: "/reino", icon: "fa-book-open", label: "El reino" },
];

export default function CerradoPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-24 text-center">
      <div className="flex justify-center mb-6 opacity-60"><Emblem size={72} /></div>
      <p className="eyebrow mb-4">Aún no</p>
      <h1 className="font-display text-4xl font-bold gold-text mb-5">
        Esto se abrirá más adelante
      </h1>
      <p className="prose-lore lead max-w-lg mx-auto !mb-10">
        Esta parte del compañero aún no está en vuestras manos. Se abrirá cuando
        la campaña llegue a ella.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        {PUERTAS.map((p) => (
          <Link key={p.href} href={p.href} className="btn-ghost">
            <i className={`fas ${p.icon} mr-2`} />{p.label}
          </Link>
        ))}
      </div>
    </main>
  );
}
```

- [ ] **Paso 2: ejecuta el gate**

```bash
npx tsx scripts/check-acceso.ts
```

Esperado: `Todo OK`, salida 0. El fallo de la Tarea 2 desaparece porque la
ruta ya existe.

- [ ] **Paso 3: comprueba que compila**

```bash
npx tsc --noEmit
```

Esperado: sin salida (limpio).

- [ ] **Paso 4: commit**

```bash
git add app/cerrado/page.tsx
git commit -m "feat: pagina /cerrado para las rutas que aun no se abren"
```

---

### Tarea 4: la puerta en el proxy

**Archivos:**
- Modificar: `lib/supabase/proxy-session.ts`

- [ ] **Paso 1: añade el import**

En `lib/supabase/proxy-session.ts`, tras los imports que ya hay:

```ts
import { puedeVer, RUTA_CERRADA } from "@/lib/acceso";
```

- [ ] **Paso 2: añade la puerta**

Sustituye el bloque final (desde el comentario `// Autenticado visitando /login`
hasta el `return response;`) por:

```ts
  // Autenticado visitando /login -> al inicio
  if (user && path === "/login") {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/";
    return NextResponse.redirect(redirect);
  }

  // Puerta por rol. El orden importa por coste: las rutas del jugador pasan
  // sin consultar `profiles`, así que el camino habitual no paga ningún
  // round-trip extra. Solo las rutas cerradas consultan el rol.
  if (user && !isPublic && !puedeVer("player", path)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role !== "dm") {
      const cerrado = request.nextUrl.clone();
      cerrado.pathname = RUTA_CERRADA;
      // `rewrite` conserva la URL escrita y no ensucia el historial. Hay que
      // arrastrar las cookies que `setAll` puso en `response`: a diferencia de
      // un redirect, el rewrite no vuelve a pasar por el proxy, así que si se
      // pierden la sesión refrescada se tira.
      const res = NextResponse.rewrite(cerrado);
      response.cookies.getAll().forEach((c) => res.cookies.set(c));
      return res;
    }
  }

  return response;
```

- [ ] **Paso 3: comprueba que compila y construye**

```bash
npx tsc --noEmit
```

Esperado: limpio.

```bash
npx next build
```

Esperado: build correcto. **`/cerrado` tiene que aparecer** en la tabla de
rutas de la salida.

- [ ] **Paso 4: commit**

```bash
git add lib/supabase/proxy-session.ts
git commit -m "feat: el proxy cierra por rol las rutas fuera del alcance del jugador"
```

---

### Tarea 5: el nav se deriva de `lib/acceso`

**Archivos:**
- Modificar: `components/SiteNav.tsx:12-34`

- [ ] **Paso 1: sustituye las dos listas por una filtrada**

Borra el bloque `const BASE_LINKS = [...]` (líneas 12-22) y añade a los
imports:

```ts
import { NAV_LINKS, puedeVer } from "@/lib/acceso";
```

Dentro del componente, borra el bloque `const DM_LINKS = [...]` y la línea
`const links = role === "dm" ? [...BASE_LINKS, ...DM_LINKS] : BASE_LINKS;`, y
pon en su lugar:

```ts
  // Una sola lista, filtrada por la misma función que usa la puerta del proxy:
  // así el nav no puede enseñar un enlace que lleve a puerta cerrada.
  const links = NAV_LINKS.filter((l) => puedeVer(role, l.href));
```

El resto del componente no se toca: los dos `links.map(...)` (escritorio y
móvil) siguen igual.

- [ ] **Paso 2: comprueba**

```bash
npx tsc --noEmit
```

Esperado: limpio. (Si queda algún uso de `BASE_LINKS` o `DM_LINKS`, `tsc` lo
canta aquí.)

```bash
npx tsx scripts/check-acceso.ts
```

Esperado: `Todo OK`.

- [ ] **Paso 3: commit**

```bash
git add components/SiteNav.tsx
git commit -m "feat: el nav pinta solo las rutas que el rol puede ver"
```

---

### Tarea 6: `/` pasa a ser el panel del jugador

**Archivos:**
- Crear: `components/home/PortadaDm.tsx`
- Crear: `components/home/PanelJugador.tsx`
- Modificar: `app/page.tsx`

- [ ] **Paso 1: mueve la portada de hoy a `components/home/PortadaDm.tsx`**

**Cópiala con `cp`, no la reescribas.** Es la portada del DM y tiene que
quedar byte a byte idéntica salvo el nombre del componente:

```bash
mkdir -p components/home && cp app/page.tsx components/home/PortadaDm.tsx
```

Y ahora **una sola edición** en `components/home/PortadaDm.tsx`: la línea

```tsx
export default function HomePage() {
```

pasa a

```tsx
export default function PortadaDm() {
```

Nada más. Ni los imports, ni `CONTINENTES`, ni una línea del JSX.

- [ ] **Paso 2: escribe `components/home/PanelJugador.tsx`**

```tsx
import Link from "next/link";
import Emblem from "@/components/Emblem";
import { WORLD_INTRO } from "@/data/cosmology";

// Las cuatro puertas del arranque de campaña. Son fijas: no se consulta si el
// jugador ya tiene ficha para esconder «Crear personaje».
const PUERTAS = [
  { icon: "fa-scroll", href: "/personaje", title: "Tu ficha", text: "Aptitudes, salvaciones, pericias, equipo y nivel de tu héroe.", accent: "var(--color-arcane)" },
  { icon: "fa-sack-xmark", href: "/inventario", title: "Tu inventario", text: "Lo que llevas encima, lo que pesa y lo que llevas puesto.", accent: "var(--color-bronze)" },
  { icon: "fa-book-open", href: "/reino", title: "El reino", text: "La historia de Exandria y las tierras que vais conociendo.", accent: "var(--color-primitivo)" },
  { icon: "fa-hat-wizard", href: "/crear", title: "Crear personaje", text: "Especie, clase, trasfondo y aptitudes del reglamento 2024.", accent: "var(--color-violet)" },
];

export default function PanelJugador() {
  return (
    <main>
      <section className="relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 pt-20 pb-10 text-center reveal">
          <div className="flex justify-center mb-6"><Emblem size={92} /></div>
          <p className="eyebrow mb-5">Escenario de campaña · Exandria</p>
          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl font-extrabold gold-text leading-[0.95] mb-6">
            Exandria
          </h1>
          <p className="prose-lore lead max-w-2xl mx-auto">{WORLD_INTRO}</p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid sm:grid-cols-2 gap-5">
          {PUERTAS.map((c) => (
            <Link key={c.href} href={c.href} className="pick-card p-7 block"
              style={{ ["--accent" as string]: c.accent, ["--glow" as string]: "rgba(69,199,189,0.3)" }}>
              <i className={`fas ${c.icon} text-3xl mb-4`} style={{ color: c.accent }} />
              <h3 className="font-display text-xl font-bold mb-2" style={{ color: "var(--color-parch)" }}>{c.title}</h3>
              <p style={{ color: "var(--color-muted)", fontSize: "15px", lineHeight: 1.6 }}>{c.text}</p>
              <span className="mt-4 inline-flex items-center gap-2 font-ui text-[12px] font-bold tracking-wide" style={{ color: c.accent }}>
                Entrar <i className="fas fa-arrow-right-long" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Paso 3: `app/page.tsx` elige según el rol**

Sustituye **todo** el contenido de `app/page.tsx` por:

```tsx
import { getSessionProfile } from "@/lib/auth";
import PortadaDm from "@/components/home/PortadaDm";
import PanelJugador from "@/components/home/PanelJugador";

export default async function HomePage() {
  const profile = await getSessionProfile();
  // Sin sesión el proxy ya manda a /login; si llegara aquí, la portada del
  // jugador es la más segura (no enseña rutas cerradas).
  return profile?.role === "dm" ? <PortadaDm /> : <PanelJugador />;
}
```

> `app/layout.tsx` ya llama a `getSessionProfile()`. Esto añade una segunda
> consulta en la portada. Se acepta: es una sola página y evita bajar la
> portada a cliente.

- [ ] **Paso 4: comprueba**

```bash
npx tsc --noEmit
```

Esperado: limpio.

```bash
npx next build
```

Esperado: build correcto.

- [ ] **Paso 5: commit**

```bash
git add app/page.tsx components/home/PortadaDm.tsx components/home/PanelJugador.tsx
git commit -m "feat: la portada del jugador son sus cuatro puertas"
```

---

### Tarea 7: barrido de enlaces a rutas cerradas

Dos páginas abiertas enlazan a rutas cerradas. Si no se tocan, el jugador se
choca contra `/cerrado` desde dentro de la app.

**Archivos:**
- Modificar: `components/ReinoRegions.tsx:24`
- Modificar: `components/CharacterSheet.tsx:528-537`

- [ ] **Paso 1: `ReinoRegions` — el «Ver en el mapa»**

`components/ReinoRegions.tsx` ya tiene `const isDM = role === "dm";` (línea
13). Cambia la línea 24:

```tsx
        <Link href="/mapa" className="btn-ghost !py-2 !px-4 text-[12px]">Ver en el mapa →</Link>
```

por:

```tsx
        {isDM && <Link href="/mapa" className="btn-ghost !py-2 !px-4 text-[12px]">Ver en el mapa →</Link>}
```

- [ ] **Paso 2: `CharacterSheet` — la sección de combate**

`components/CharacterSheet.tsx` ya tiene `const session = useSession();` (línea
62). Envuelve la sección entera (el bloque `{/* El combate se juega en
/combate */}` más su `<section>…</section>`, líneas 528-537) en una condición:

```tsx
          {/* El combate se juega en /combate (cerrado para el jugador en el arranque) */}
          {session?.role === "dm" && (
            <section className="panel p-5 text-center">
              <p className="eyebrow mb-2"><i className="fas fa-khanda mr-1.5" style={{ color: "var(--color-bronze)" }} />Combate</p>
              <p className="font-ui text-[13px] mb-3" style={{ color: "var(--color-muted)" }}>
                Los puntos de golpe, las condiciones, el turno, los ataques y los conjuros se llevan desde la pantalla de combate.
              </p>
              <Link href="/combate" className="btn-gold !py-1.5 !px-4 text-[13px]">
                <i className="fas fa-khanda mr-1.5" />Ir al combate
              </Link>
            </section>
          )}
```

- [ ] **Paso 3: comprueba que no queda ninguno**

```bash
npx tsx scripts/check-acceso.ts
```

Esperado: `Todo OK`.

Y el barrido a mano, que el gate no puede hacer (son hrefs literales dentro de
JSX):

```bash
grep -rn 'href="/\(mapa\|panteon\|cronica\|bestiario\|combate\|taberna\|narrador\|dm\)' app components
```

Esperado: solo quedan hits **dentro de rutas cerradas** (`app/mapa/`,
`app/dm/`, …) o **envueltos en una condición de rol**. Revisa uno a uno; si
aparece uno nuevo en página abierta, condiciónalo igual.

- [ ] **Paso 4: comprueba que compila**

```bash
npx tsc --noEmit
```

Esperado: limpio.

- [ ] **Paso 5: commit**

```bash
git add components/ReinoRegions.tsx components/CharacterSheet.tsx
git commit -m "fix: las paginas abiertas dejan de enlazar a rutas cerradas"
```

---

### Tarea 8: gate completo, documentación y merge

**Archivos:**
- Modificar: `HANDOFF.md`

- [ ] **Paso 1: el gate entero**

```bash
npx tsc --noEmit
```

Esperado: limpio.

```bash
npx next build
```

Esperado: build correcto, con `/cerrado` en la tabla de rutas.

Los **25** scripts:

```bash
for s in scripts/check-*.ts; do echo "== $s"; npx tsx "$s" || echo "FALLA $s"; done
```

Esperado: los 25 terminan en `Todo OK`. Ninguna línea `FALLA`.

- [ ] **Paso 2: segunda prueba de mutación, ya con todo montado**

Añade una carpeta `app/prueba/page.tsx` con un componente vacío:

```tsx
export default function Prueba() { return <main />; }
```

```bash
npx tsx scripts/check-acceso.ts
```

Esperado: **FALLA** en `ruta /prueba está clasificada en check-acceso`. Es la
regla que impide que una ruta futura se cuele.

Borra `app/prueba/` y vuelve a ejecutarlo. Esperado: `Todo OK`.

- [ ] **Paso 3: actualiza `HANDOFF.md`**

Añade al principio de la sección «🚦 ARRANQUE RÁPIDO» un bloque nuevo,
**encima** del de las subclases, con este contenido:

```markdown
> **Lo último (2026-07-30, noche): el alcance del jugador para el arranque.**
> El jugador solo ve **`/`, `/crear`, `/personaje`, `/inventario`, `/reino` y
> `/lugar`**; `/panteon`, `/cronica`, `/bestiario`, `/mapa`, `/combate`,
> `/taberna`, `/narrador` y `/dm` quedan cerradas y pintan
> **`/cerrado`** («esto se abrirá más adelante»), con la URL escrita intacta
> (`rewrite`, no redirect). El DM lo sigue viendo todo.
> **La puerta está en `lib/supabase/proxy-session.ts`**, no en cada página, y
> lee de **`lib/acceso.ts`** — la única fuente de verdad (`RUTAS_JUGADOR`,
> `NAV_LINKS`, `puedeVer(role, path)`). El nav filtra sus enlaces con **la
> misma función**, así que **no puede divergir de la puerta**.
> **Coste cero en el camino habitual**: las rutas del jugador pasan sin
> consultar `profiles`; solo las cerradas consultan el rol.
> **`/personaje` gana enlace propio en la barra** («Ficha»). La barra del
> jugador queda: `Inicio · Ficha · Reino · Crear · Inventario`.
> **`/` es ahora el panel del jugador** (cuatro puertas); el DM conserva la
> portada de siempre (`components/home/PortadaDm.tsx`).
> **Abrir una sección = añadir su ruta a `RUTAS_JUGADOR` y desplegar.** Se
> descartó `app_config` a propósito (no está en la publicación realtime).
> **`scripts/check-acceso.ts` es el gate 25** y exige que **toda** carpeta de
> `app/` con página esté clasificada: una ruta nueva sin clasificar **falla**.
> **Sigue fuera de alcance**: `/api/*` no tiene control de rol. Un jugador
> puede llamar `/api/ia` aunque `/taberna` esté cerrada. Es otra tanda.
```

Actualiza también la sección «Scripts de comprobación»: donde dice **«Son
23»**, poner **«Son 25»** (`check-especies` entró con las subclases y
`check-acceso` con esta tanda), y añadir `check-acceso` a la tabla.

- [ ] **Paso 4: commit de la documentación**

```bash
git add HANDOFF.md
git commit -m "docs: HANDOFF con el alcance del jugador para el arranque"
```

- [ ] **Paso 5: merge a master y push**

```bash
git checkout master
git merge --no-ff alcance-jugador
git push
```

- [ ] **Paso 6: comprueba el despliegue**

```bash
curl https://exandria.vercel.app/api/version
```

Esperado: el commit del merge.

---

## Lo que tiene que probar el usuario (no se puede desde aquí)

Todo está tras el login y no se meten credenciales. Con la app desplegada:

1. **Cuenta de jugador**: la barra enseña `Inicio · Ficha · Reino · Crear ·
   Inventario` y nada más. El widget de ubicación (→ `/lugar`) sigue ahí.
2. Escribe a mano en la barra del navegador `/bestiario`, `/mapa`, `/combate`,
   `/panteon`, `/cronica`, `/taberna`, `/narrador` y `/dm`: sale la página «se
   abrirá más adelante» **y la URL escrita se queda tal cual**.
3. `/reino` y `/reino/wildemount` entran. `/lugar`, `/personaje`,
   `/inventario` y `/crear` entran.
4. `/` enseña las cuatro puertas: sin rejilla de continentes y sin tarjeta de
   mapa.
5. Dentro de `/reino` no aparece el botón «Ver en el mapa»; dentro de la ficha
   no aparece la sección «Ir al combate».
6. **Cuenta de DM**: todo exactamente como antes, más el enlace «Ficha» nuevo
   (doce en la barra). La portada del DM, idéntica.
7. **Recarga estando en una ruta cerrada**: sigue saliendo `/cerrado` y **la
   sesión no se cae** (es lo que comprueba el arrastre de cookies del rewrite).
