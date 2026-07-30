# Alcance del jugador para el arranque de campaña — diseño

Fecha: 2026-07-30 · Rama: `alcance-jugador` · **Sin migración.**

## El problema

La app enseña al jugador **nueve secciones** en la barra de navegación, y de
hecho le deja entrar en **todas** las rutas que existen. Para arrancar la
campaña solo debe poder tocar **tres cosas**: su personaje (crearlo y su
ficha), su inventario y el reino. El resto se irá abriendo según avance la
partida.

Y hay un problema más grave debajo: **hoy no hay ninguna puerta**. `proxy.ts`
(el antiguo middleware, Next 16) solo llama a `updateSession`, que refresca la
sesión y redirige a `/login` a quien no esté autenticado. **No mira roles ni
rutas.** Ocultar enlaces del nav no cierra nada: cualquiera que escriba
`/bestiario` en la barra del navegador entra igual.

### El alcance real es mayor que los nueve enlaces

`BASE_LINKS` (`components/SiteNav.tsx:12`) lista nueve rutas, pero hay **tres
más** que el jugador alcanza sin que aparezcan ahí:

- **`/personaje`** — sin enlace propio, pero se llega en un clic desde
  `/inventario` («Ver la hoja», `app/inventario/page.tsx:203`) y desde el
  creador al terminar. Es una de las tres cosas que sí debe tocar.
- **`/lugar`** — **sí tiene enlace visible**: `PartyLocationWidget`
  (`components/PartyLocationWidget.tsx:15`), que vive en la barra. Trae tienda,
  posada, PNJ, tablón de misiones, tirada de saber y clima. Es la superficie
  más grande fuera de la lista de tres.
- **`/taberna`** — chat de grupo con la NPC Garda por IA. Sin enlace en ningún
  sitio; solo se llega por URL.

## Decisiones tomadas (con el usuario, 2026-07-30)

1. **Dónde se corta**: en `proxy.ts` (una sola puerta) **y** el nav pinta solo
   lo permitido. No se guarda en cada página.
2. **`/` (Inicio)**: se convierte en el **panel del jugador** (ficha,
   inventario, reino). El DM sigue viendo la portada de hoy.
3. **La lista permitida**: **fija en código**. Abrir una sección es un commit y
   un despliegue. No se mete en `app_config` — se descarta a propósito para no
   añadir estado nuevo ni pelearse con que `app_config` **no está en la
   publicación realtime** (lección ya pagada dos veces).
4. **Qué ve el jugador en una ruta cerrada**: una página **«esto se abrirá más
   adelante»**, no una redirección silenciosa (que parece un fallo) ni un 404.
5. **`/lugar` queda abierta**; **`/taberna` queda cerrada**.
6. **`/personaje` gana enlace propio** en la barra, con la etiqueta «Ficha».

## El diseño

### 1. Una sola fuente de verdad: `lib/acceso.ts`

Módulo nuevo, sin `"use client"` (lo importan el proxy —runtime de Node/Edge—,
el nav —cliente— y la portada —servidor—), sin dependencias de Supabase.

```ts
import type { Role } from "@/lib/auth";

/** Rutas que un jugador puede ver en el arranque de campaña. */
export const RUTAS_JUGADOR = [
  "/", "/crear", "/personaje", "/inventario", "/reino", "/lugar",
  "/cerrado", "/login",
] as const;

export function puedeVer(role: Role, path: string): boolean;
```

Reglas de `puedeVer`:

- `role === "dm"` → siempre `true`. El DM no pierde nada.
- Jugador → `true` si `path === r` **o** `path.startsWith(r + "/")` para alguna
  `r` de `RUTAS_JUGADOR`.

> **La barra explícita no es cosmética.** `path.startsWith("/reino")` daría
> `true` a `/reinos`, y `startsWith("/")` daría `true` a todo. La comparación
> tiene que ser `path === r || path.startsWith(r + "/")`, con `"/"` tratada
> como caso exacto. El gate lo comprueba.

`/cerrado` y `/login` están en la lista porque son alcanzables por cualquiera;
si no, `/cerrado` se cerraría a sí misma (bucle de rewrite).

**Todo lo demás lee de aquí.** El nav, el proxy y la portada no repiten la
lista.

### 2. La puerta: `lib/supabase/proxy-session.ts`

`proxy.ts` no cambia: sigue delegando en `updateSession`. La lógica de rol
entra en `updateSession`, después del `getUser()` que ya existe y de los dos
redirects de auth que ya hay.

```
si no hay user                    -> (comportamiento actual: a /login)
si la ruta es pública/asset       -> pasa
si puedeVer("player", path)       -> pasa, SIN consultar profiles
si no                             -> consultar profiles.role
                                     dm     -> pasa
                                     player -> rewrite a /cerrado
```

**El orden importa por coste.** Preguntar primero «¿es una ruta que cualquiera
puede ver?» significa que las rutas del jugador (`/`, `/personaje`,
`/inventario`, `/reino`, `/crear`, `/lugar`) **no pagan ninguna consulta
extra**. Solo las rutas cerradas consultan `profiles`, y a esas el jugador casi
nunca llega. El proxy hoy hace un `getUser()` por navegación; esto no añade
otro round-trip en el camino habitual.

`isPublic` ya excluye `/api`, `/_next` y `/favicon.ico`, y el `matcher` de
`proxy.ts` excluye estáticos y `dice-box`. Todo eso sigue igual: **el control
de rol solo se aplica a rutas de página**.

**Rewrite, no redirect**: `NextResponse.rewrite` conserva la URL que el jugador
escribió y no añade entrada al historial. La página `/cerrado` se pinta en su
sitio.

### 3. El nav se deriva, no se duplica

`components/SiteNav.tsx` pasa de dos listas (`BASE_LINKS` + `DM_LINKS`) a
**una** lista de doce entradas (las nueve de `BASE_LINKS`, las dos de DM y
`/personaje`), filtrada por `puedeVer`:

```ts
const links = LINKS.filter((l) => puedeVer(role, l.href));
```

Así **el nav y la puerta no pueden divergir**: si una ruta se abre en
`RUTAS_JUGADOR`, su enlace aparece solo; si se cierra, desaparece solo. Es el
fallo clásico de este tipo de cambio y el diseño lo hace imposible.

Resultado:

- **Jugador**: `Inicio · Ficha · Reino · Crear · Inventario`
- **DM**: los nueve de hoy + `Ficha` + `Narrador` + `Panel DM`

El orden es el histórico de `BASE_LINKS` con `Ficha` insertada en segunda
posición. Se conserva a propósito: así el DM no nota que la barra ha cambiado
de sitio nada.

`PartyLocationWidget` (→ `/lugar`) sigue visible para ambos, porque `/lugar`
queda abierta.

La entrada nueva es `{ href: "/personaje", label: "Ficha" }`, colocada entre
`Inicio` y `Inventario`.

### 4. `/` pasa a ser el panel del jugador

`app/page.tsx` se convierte en server component y lee el rol con
`getSessionProfile()`.

- **DM**: la portada de hoy, sin tocar (hero, intro, tres tarjetas, rejilla de
  continentes).
- **Jugador**: se queda el hero (emblema, título, intro del mundo) y **cuatro
  puertas**: Ficha (`/personaje`), Inventario (`/inventario`), El reino
  (`/reino`), Crear personaje (`/crear`). **Fuera** la tarjeta de «Mapa
  interactivo» y la rejilla de continentes: las dos llevan a `/mapa`, que queda
  cerrada.

Las cuatro puertas son **fijas**: no se consulta si el jugador ya tiene ficha
para esconder «Crear». Se descartó a propósito por la misma razón que en el
nav — no merece una consulta ni un estado más en esta tanda.

### 5. `app/cerrado/page.tsx`

Página nueva, alcanzable por cualquiera. Mensaje en tono de campaña («esto se
abrirá cuando la campaña avance») y, debajo, enlaces a las cuatro puertas del
jugador. **No dice qué ruta se pidió** ni por qué está cerrada: el mensaje es
el mismo para todas.

## El gate: `scripts/check-acceso.ts` (el 25)

Esta tanda toca reglas de acceso, así que el gate tiene que verlas. Reglas:

1. **Toda carpeta de `app/` con un `page.tsx` está clasificada** —permitida o
   cerrada— en una tabla explícita del script. Una ruta nueva que nadie
   clasifique **hace fallar el check**. Es la lección de `check-especies`: sin
   esto, una ruta futura se cuela abierta o cerrada sin que nadie se entere.
2. `puedeVer("dm", x)` es `true` para **todas** las rutas de `app/`.
3. Tabla exacta para el jugador, incluidas las trampas de prefijo:
   `/reino` ✓ · `/reino/wildemount` ✓ · `/reinos` ✗ · `/personaje` ✓ ·
   `/mapa` ✗ · `/bestiario` ✗ · `/taberna` ✗ · `/dm` ✗ · `/lugar` ✓.
4. Todo `href` de la lista del nav pasa `puedeVer` para el rol que lo ve
   (ningún enlace pintado lleva a puerta cerrada).

**Prueba de mutación obligatoria** antes de cerrar: romper `RUTAS_JUGADOR` a
propósito (quitar la barra del `startsWith`, añadir `/mapa`), comprobar que el
check **falla**, restaurar. Restaurar con `git stash`, **nunca con
`git checkout --`** si hay cambios sin commitear en ese archivo.

## Barrido de enlaces internos

Las páginas que quedan abiertas no pueden enlazar a rutas cerradas, o el
jugador se choca contra `/cerrado` desde dentro. Hay que grepear `href="/mapa`,
`/panteon`, `/cronica`, `/bestiario`, `/combate`, `/taberna` en las páginas y
componentes que el jugador ve (`app/page.tsx`, `app/reino/`,
`app/inventario/`, `app/personaje/`, `app/lugar/`, `components/`) y decidir uno
a uno: quitarlo, o condicionarlo al rol. Los conocidos ya: la tarjeta de mapa y
la rejilla de continentes de la portada (resueltos en el punto 4).

## Fuera de alcance, dicho a propósito

- **`/api/*` sigue sin control de rol.** `isPublic` los deja pasar hoy y esto
  no lo cambia. Un jugador con la consola abierta puede llamar `/api/ia` aunque
  `/taberna` esté cerrada. Es una tanda distinta.
- **Las rutas cerradas no se borran ni se desmontan**: siguen ahí, funcionando,
  y el DM las usa. Abrirlas al jugador será añadir una línea a
  `RUTAS_JUGADOR`.
- **Realtime y `EpicOverlay` no se tocan**: la narración del DM sigue llegando
  en cualquier página, incluida `/cerrado`.
- **Sin migración.** Ni tabla, ni columna, ni `app_config`.

## Verificación

Gate: `npx tsc --noEmit` + `npx next build` + **los 25** `scripts/check-*.ts`
en verde, con la prueba de mutación de `check-acceso` hecha.

**No se puede probar en la app viva desde esta sesión** (todo está tras el
login y no se meten credenciales). Lo que tiene que probar el usuario:

1. Con cuenta de **jugador**: la barra enseña `Inicio · Ficha · Inventario ·
   Reino · Crear` y nada más; el widget de ubicación sigue ahí.
2. Escribir `/bestiario`, `/mapa`, `/combate`, `/panteon`, `/cronica`,
   `/taberna` y `/dm` en la barra del navegador → sale la página «se abrirá más
   adelante», **con la URL escrita intacta**.
3. `/reino` y `/reino/wildemount` entran; `/lugar`, `/personaje`,
   `/inventario`, `/crear` entran.
4. `/` enseña las cuatro puertas, sin continentes ni tarjeta de mapa.
5. Con cuenta de **DM**: absolutamente todo como antes, más el enlace «Ficha»
   nuevo (doce en total).
