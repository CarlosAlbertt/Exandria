# Plan — abrir cuatro secciones al jugador, y más tipos de tienda

**Fecha**: 2026-08-06 · **Estado**: **decisiones cerradas, listo para ejecutar**
· **Rama propuesta**: `feat/abrir-secciones-y-tiendas`

> **Las seis decisiones, tomadas por el usuario el 2026-08-06:**
> 1. **Las pistas de `/cronica`**: se abre igual y la fuga queda **anotada como
>    deuda** junto a `/api/*`. No se toca `clues` en esta tanda.
> 2. **Precios: todo en monedas de oro.** Se descarta migrar a cobre.
> 3. **«Hostal» descartado** como tipo de tienda: la posada ya existe.
> 4. ⭐ **El tipo de tienda deja de ser una lista cerrada**: el DM lo **escribe**.
>    Los tipos conocidos pasan de ser una reja a ser **sugerencias con plantilla**.
> 5. **El orden de la barra se queda como está.**
> 6. **Se añaden dos puertas** a la portada: Mapa y Bestiario.

Dos tareas independientes que no comparten un solo archivo. Se pueden hacer en
dos ramas o en una con dos commits; van juntas aquí porque las pediste juntas.

- **Parte A** — abrir `/mapa`, `/panteon`, `/cronica` y `/bestiario` al jugador.
- **Parte B** — ampliar los tipos de tienda (hoy solo tres).

---

# PARTE A — abrir cuatro secciones al jugador

## Lo que hay hoy

`lib/acceso.ts` es la única fuente de verdad. `RUTAS_JUGADOR` tiene siete rutas
más `/cerrado` y `/login`. **La puerta (proxy), la barra (`SiteNav`) y la portada
leen todos de ahí**, así que abrir una sección es añadir su ruta a esa lista:
el enlace del nav aparece solo, y `lib/supabase/proxy-session.ts` deja de
reescribir a `/cerrado`. No hay que tocar ninguna página.

## Auditoría: ¿qué ve el jugador en cada una de las cuatro?

**Esto es lo que había que comprobar antes de abrir nada**, y el resultado es
mejor de lo esperado: **tres de las cuatro ya distinguen el rol**, porque se
escribieron cuando el DM y el jugador compartían app.

| Ruta | ¿Filtra por rol? | Qué ve el jugador |
|---|---|---|
| `/panteon` | **No, y a propósito** | Los 32 dioses enteros. La spec del 2026-07-21 lo decidió así: que los dioses existen no es secreto en Exandria. Es un catálogo de consulta. **Segura tal cual.** |
| `/mapa` | **Sí, a fondo** (`useRole`) | Niebla opaca sobre los continentes sin `revealed`; solo las regiones con `known`; el mapa de región solo con `explored`, si no «Mapa por revelar»; el enlace «Gestionar pines» es `isDM`. **Segura tal cual.** |
| `/bestiario` | **Sí** (`BestiarioView.tsx:27`) | `restrictToDiscovered = !isDM`: solo los monstruos descubiertos. Sin botones de crear/editar/borrar, sin el chip «personalizado», sin el pie del statblock. **Segura tal cual.** |
| `/cronica` | **No, pero la RLS sí** | Ver abajo. |

### `/cronica`, en detalle

No usa `useRole` en ninguna línea, pero **tres de sus cuatro fuentes están
protegidas en la base de datos** (`supabase/schema_v12.sql`):

- `journal_entries` → `using (visible or is_dm())`. Los borradores del DM no salen.
- `npcs_met` → `using (visible or is_dm())`. Los PNJ ocultos no salen.
- `quests` → `using (status <> 'oculta' or is_dm())`. Las misiones ocultas no salen.
  Las de estado `oferta` **sí llegan al navegador del jugador** (la RLS las deja
  pasar, `schema_v17.sql:22` lo dice explícitamente), pero la vista solo pinta
  `activa`, `completada` y `fallida`, así que no se ven. No es una fuga nueva.

> [!warning] ⚠️ **Las pistas NO están protegidas, y esto sí hay que decidirlo**
> `useClues` guarda las pistas en **`app_config`**, cuya política de lectura es
> `for select to authenticated using (true)` (`schema_v5.sql:19`). `/cronica`
> se descarga **todas** las pistas —incluidas las **no descubiertas** y el flag
> `rumor`— y las filtra **en JavaScript** (`CronicaView.tsx:26`).
>
> **Matiz importante y honesto**: esa exposición **ya existe hoy**, con
> `/cronica` cerrada. Cualquier jugador con la consola abierta puede pedir
> `app_config` y leerlas — es el mismo agujero que el HANDOFF ya reconoce en
> `/api/*`. Abrir la página **no amplía el acceso a la base de datos**; lo que
> hace es que el código que las descarga pase a ejecutarse en la sesión del
> jugador todos los días.
>
> ✅ **DECIDIDO: se abre igual y queda anotado como deuda**, junto a `/api/*` sin
> control de rol. Es preexistente y abrir la página no lo empeora. El arreglo de
> raíz —mover `clues` a tabla propia con RLS `discovered or is_dm()`, migración
> `schema_v24`, tocando `useClues`, el panel del DM y el sembrado de rumores en
> los PNJ IA— es una tanda propia. **Va escrito en el HANDOFF, no escondido.**

## Los pasos

### A1 · `lib/acceso.ts` — las cuatro rutas

Añadir a `RUTAS_JUGADOR`, con comentario del porqué de cada una:

```ts
"/panteon",    // catálogo de consulta, sin secretos (spec 2026-07-21)
"/cronica",    // el diario, las misiones y los PNJ ya los filtra la RLS
"/bestiario",  // BestiarioView limita al jugador a los descubiertos
"/mapa",       // niebla, regiones known/explored: ya distingue el rol
```

**No hay que tocar `NAV_LINKS`**: los cuatro enlaces ya están en la lista y
`SiteNav` los filtra con `puedeVer`. Aparecen solos.

### A2 · `scripts/check-acceso.ts` — el gate, en cinco sitios

El gate **fallará** en cuanto se toque `acceso.ts`, que es justo lo que tiene
que hacer. Hay que moverlas de la lista cerrada a la abierta en:

1. `ABIERTAS` (línea 23) — añadir las cuatro.
2. `CERRADAS` (línea 28) — quitarlas; quedan `/oficios`, `/combate`, `/taberna`,
   `/narrador`, `/dm`.
3. `ESPERADAS_ABIERTAS` (línea 63) y 4. `ESPERADAS_CERRADAS` (línea 64) — igual.
5. **La aserción literal del nav (líneas 93-94)**, que compara el orden exacto
   contra `["/", "/personaje", "/reino", "/crear", "/inventario", "/taller"]`.
   Hay que reescribirla con el orden nuevo o rompe.
6. `check("jugador NO ve /mapa/algo (subruta cerrada)")` (línea 38) — esa
   comprobación deja de tener sentido: `/mapa/algo` pasará a ser visible por la
   regla de prefijo. **Sustituirla por otra ruta que siga cerrada** (`/dm/algo`),
   para no perder la comprobación de subrutas heredadas.

### A3 · El orden de la barra — ✅ se queda como está

Con las cuatro abiertas, el jugador pasa de 6 enlaces a 10, en el orden que ya
tiene `NAV_LINKS`:

`Inicio · Ficha · Reino · Panteón · Crónica · Bestiario · Crear · Inventario · Taller · Mapa`

**No se reordena.** Es la misma lista que usa el DM y moverla le cambiaría la
barra a él también, sin que lo haya pedido. **Lo único que hay que hacer aquí es
actualizar la aserción del gate** (paso A2.5), que compara el orden literal.

### A4 · Las puertas de la portada — ✅ dos nuevas

`PUERTAS_JUGADOR` pinta las tarjetas de `/` y de `/cerrado`. Hoy son cuatro
(Ficha, Inventario, Reino, Crear) en rejilla de dos columnas. Se añaden **dos**,
que son las que se miran en mesa; Panteón y Crónica se alcanzan desde la barra:

```ts
{ href: "/mapa", icon: "fa-map-location-dot", label: "El mapa",
  text: "Los cinco continentes, y la niebla sobre lo que aún no habéis hallado.",
  accent: "var(--color-bronze)" },
{ href: "/bestiario", icon: "fa-dragon", label: "El bestiario",
  text: "Las criaturas que habéis llegado a ver, con sus rasgos y sus ataques.",
  accent: "var(--color-ember)" },
```

Con seis, la rejilla `sm:grid-cols-2` queda en tres filas limpias — no hace falta
tocar `PanelJugador.tsx`, que ya recorre la lista. El gate comprueba que toda
puerta esté abierta, así que esto no se puede desincronizar.

### A5 · Gate y verificación

`npx tsc --noEmit` + `npx next build` + los 34 `scripts/check-*.ts`.

**Prueba de mutación** (obligatoria, la tanda toca reglas de acceso):
1. Quitar `/mapa` de `RUTAS_JUGADOR` dejándola en `ESPERADAS_ABIERTAS` → tiene
   que fallar «puedeVer coincide con su clasificación».
2. Dejar `/dm` en `RUTAS_JUGADOR` → tiene que fallar «jugador NO ve /dm».
3. Añadir una puerta a `/cronica` sin abrirla → tiene que fallar la comprobación
   de puertas.

**Lo que solo puedes comprobar tú, en la app viva** (yo no paso del login):
- Entrar como **jugador** y ver que los cuatro enlaces salen y las páginas cargan.
- `/mapa`: que los continentes sin revelar sigan bajo niebla **opaca** y que
  **no** aparezca «Gestionar y editar pines».
- `/bestiario`: que solo salgan los descubiertos y **ningún** botón de edición.
- `/cronica`: que no salga ningún borrador del diario ni PNJ oculto.
- `/panteon`: los 32, que es lo esperado.

---

# PARTE B — más tipos de tienda

## Lo que hay hoy

`data/shopTemplates.ts` es un `Record<string, {name, price}[]>` con tres claves:
`herreria`, `alquimista`, `general`. **`SHOP_KINDS = Object.keys(SHOP_TEMPLATES)`**,
así que los dos desplegables de `app/dm/TiendasPanel.tsx` (crear tienda y editar
tienda) **se rellenan solos**. `shops.kind` es `text` en la base de datos: añadir
claves es **puramente aditivo, sin migración y sin romper las tiendas ya creadas**.

## ⭐ El cambio de forma: el tipo se escribe, no se elige

**Decisión 4, y es la que manda sobre todo lo demás.** Hoy el tipo sale de un
`<select>` alimentado por `SHOP_KINDS`, así que **el catálogo de código es una
reja**: para que exista una pescadería hay que desplegar. A partir de ahora el DM
**escribe** el tipo y los doce conocidos pasan de ser la lista permitida a ser
**sugerencias que además traen plantilla**.

**Encaja sin migración**: `shops.kind` ya es `text` y nadie valida su contenido
contra `SHOP_KINDS` — el `<select>` era la única restricción, y estaba solo en la
interfaz. Quitarla no rompe ninguna fila.

**La forma concreta: un combobox, no un input pelado.** `<input list="…">` con un
`<datalist>` de las doce sugerencias. El DM ve la lista al hacer clic, y si no le
sirve escribe lo que quiera. Se mantienen las tres cosas que la lista daba y un
input pelado perdería:

| | Tipo conocido | Tipo escrito a mano |
|---|---|---|
| **Plantilla** (botón «Semilla») | Rellena el catálogo | **No hay** → el botón se deshabilita y lo dice |
| **Icono** | El suyo | El genérico `fa-store` |
| **Etiqueta bonita** | «Botica del curandero» | Lo que haya escrito, tal cual |

⚠️ **Y una trampa que hay que atajar, o la lista de sugerencias no sirve de nada**:
si el DM elige «Herrería» del desplegable, el navegador escribe en el input el
texto **«Herrería»**, no la clave `herreria`. Guardado así, esa tienda sería un
tipo distinto de las que ya existen en la base de datos —mismo negocio, dos
claves— y **se quedaría sin plantilla ni icono**.

**Solución**: una función `normalizaKind(texto)` que, al guardar, busque el texto
entre las etiquetas conocidas **ignorando mayúsculas y tildes** y devuelva la
clave si acierta; si no acierta, devuelve el texto tal cual, recortado. Así los
doce siempre caen en su clave y lo demás pasa intacto. **Es el mismo truco que
`esOficio()` sobre `characters.skills`**: el nombre vale como clave porque el
gate garantiza que no se repite.

## Tres cosas que hoy se sostienen con tres tipos y se caen con doce

### B0.a · El jugador ve la clave cruda

`components/lugar/ShopSection.tsx:51` pinta `{s.kind}` tal cual: el jugador lee
**«herreria»**, sin tilde y en minúscula. Con `taberna`, `hostal` o `contrabandista`
sigue igual de feo. Y `lib/generar.ts:66` mete la clave cruda en el prompt de la
IA: *«Crea una tienda de tipo "herreria"»*.

**Propuesta**: cambiar la forma del catálogo a

```ts
export type ShopKind = {
  label: string;   // "Herrería" — lo que ve el jugador y lo que lee la IA
  icon: string;    // "fa-hammer" — Font Awesome, como POI_ICON
  items: ShopTemplateItem[];
};
```

`SHOP_KINDS` sigue devolviendo las claves (nada que lo consuma cambia de tipo),
y se añaden `kindLabel(k)` / `kindIcon(k)` **con fallback**. Con la decisión 4 el
fallback deja de ser una red de seguridad y pasa a ser **el camino normal**: es
lo que se ejecuta cada vez que el DM escribe un tipo suyo. `kindLabel` devuelve
el texto tal cual y `kindIcon` el genérico `fa-store`.

### B0.b · Los precios son enteros en po, y media taberna cuesta menos de 1 po

`shop_items.price` es **`int` en piezas de oro** (`schema_v15.sql:38`) y
`characters.gold` también. Una jarra de cerveza son 4 pc = **0,04 po**; una
noche en cama común, 5 pp = 0,5 po. **Redondeadas a entero, o valen 0 o valen 1**
—y 1 po por una cerveza es veinticinco veces el precio del manual—.

Los tres catálogos de hoy esquivan el problema porque venden cosas caras (la
única barata, «Raciones (1 día)», ya está inflada de 0,5 a 1 po). **Taberna,
templo y campamento son catálogos enteros de cosas baratas.**

✅ **DECIDIDO: todo en monedas de oro.** Se descarta migrar el precio a cobre —que
habría sido lo correcto de raíz, pero es migración `v24` con conversión ×100 de
las filas existentes más `lib/shopTx.ts`, `characters.gold` y todas las pantallas
de compraventa: **una tanda propia**. Queda anotado como deuda.

**Cómo se escriben entonces los catálogos baratos**, que es lo único que esta
decisión deja abierto. Sin cobre, un objeto no puede costar menos de 1 po, así
que **se vende la cantidad que vale un oro entero o más**:

- **Por lote donde la unidad sea absurda**: «Ronda para la mesa (5 jarras)» 1 po,
  «Barril de cerveza» 2 po, «Semana de cama común» 3 po, «Raciones (10 días)» 5 po.
  El precio sale honesto respecto al manual **y se juega mejor**: nadie va a la
  taberna a comprar una jarra suelta.
- **Redondeado a 1 po** solo donde el lote no tenga sentido (un símbolo sagrado
  de madera, 1 po en el manual, ya cuadra).

**Ningún objeto de plantilla baja de 1 po** — y eso pasa a ser una invariante que
el gate vigila (paso B6), porque un objeto a 0 po sería gratis en `shopTx.comprar`.

> Esto vale para las **plantillas** que escribo yo. El DM sigue pudiendo teclear
> el precio que quiera en cualquier objeto, incluido 0.

### B0.c · «Hostal» ya existe, y no como tienda

⚠️ **La posada ya está construida y no es una tienda**: es un servicio del POI
(`Poi.services.posada`, `data/pois.ts:15`) que pinta `PosadaSection` en `/lugar`
y **avanza el reloj de campaña** por `app/api/descanso/route.ts` (Fase D). Un
tipo de tienda «hostal» que venda «una noche» sería **una segunda forma de
descansar que no mueve el reloj ni aplica el anti-abuso de 20 h** — dos verdades
para la misma cosa.

✅ **DECIDIDO: «hostal» se descarta como tipo de tienda.** Dormir sigue siendo
cosa de la posada del POI. Lo que sí entra es **`avituallamiento`**, que vende
*provisiones de viaje* y **no vende noches**.

Nota menor del mismo estilo: **`campamento` ya es un `PoiType`** (`data/pois.ts:5`).
Como tipo de tienda no chocaría en código —son dos enumeraciones distintas— pero
sí en la cabeza: el POI *es* un campamento y dentro tiene una tienda de tipo
«campamento». De ahí el nombre `avituallamiento`.

> ⚠️ **Con el tipo libre (decisión 4), nada impide que el DM escriba «hostal».**
> El código no puede evitarlo y no debe intentarlo. **Queda como convención
> escrita**, aquí y en el HANDOFF: si aparece una tienda «hostal» vendiendo
> noches, esas noches no mueven el reloj de campaña.

## Las doce sugerencias

Nueve nuevas, doce en total. **Con la decisión 4 esto ya no es la lista de lo que
puede existir, sino la de lo que viene con plantilla e icono.** Por eso los
solapes que iba a preguntar —`libreria` con `arcano`, `curandero` con
`alquimista`, `mercado_negro` con `general`— **dejan de importar y se quedan las
doce**: solaparse solo significa que el DM tiene dos plantillas parecidas donde
elegir, y antes habría significado gastar un hueco de una reja.

| Clave | Etiqueta | Icono | Qué vende |
|---|---|---|---|
| `general` | Bazar general | `fa-store` | *(ya existe)* |
| `herreria` | Herrería | `fa-hammer` | *(ya existe)* |
| `alquimista` | Alquimista | `fa-flask` | *(ya existe)* |
| `taberna` | Taberna | `fa-beer-mug-empty` | Rondas, comida caliente, barriles, información |
| `templo` | Templo | `fa-place-of-worship` | Agua bendita, incienso, símbolos sagrados, ofrendas, bendiciones |
| `avituallamiento` | Puesto de avituallamiento | `fa-campground` | Raciones, agua, mulas, tiendas de campaña, mantas |
| `establo` | Establo | `fa-horse` | Monturas, carros, arreos, pienso, alquiler por día |
| `sastre` | Sastrería y mercería | `fa-shirt` | Ropa (común, fina, de viaje, disfraz), telas, agujas |
| `arcano` | Emporio arcano | `fa-wand-sparkles` | Focos, componentes caros, pergaminos, tinta, libros de conjuros |
| `curandero` | Botica del curandero | `fa-mortar-pestle` | Kits de sanador, vendas, antitoxina, hierbas, cuidados |
| `mercado_negro` | Trapicheo | `fa-mask` | Venenos, ganzúas, documentos falsos, mercancía sin preguntas |
| `libreria` | Escribanía | `fa-book` | Papel, tinta, mapas, libros, servicios de escriba |

**Los catálogos semilla los escribo yo** con precios del PHB 2024 (mismo criterio
que los tres de hoy: hechos de juego, no inventados), aplicando el lote de la
decisión B0.b. **8-10 objetos por tipo**, que es el tamaño de los actuales.

## Los pasos

### B1 · `data/shopTemplates.ts` — la forma nueva

Cambiar a `Record<string, ShopKind>` con `label`, `icon` e `items`. Mantener
`SHOP_KINDS` exportado igual (claves) para no tocar el resto, y añadir:

- `kindLabel(k)` → `SHOP_TEMPLATES[k]?.label ?? k`
- `kindIcon(k)` → `SHOP_TEMPLATES[k]?.icon ?? "fa-store"`
- `normalizaKind(texto)` → recorre las doce comparando `texto` contra su `label`
  y contra su clave, **sin distinguir mayúsculas ni tildes**
  (`.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase()`); devuelve la
  clave si acierta, y si no el texto recortado. Cadena vacía → `"general"`,
  para que no se guarde una tienda sin tipo.

### B2 · `lib/useShops.ts` — un renglón

`seedCatalog` lee `SHOP_TEMPLATES[kind]` (línea 71) y ahora tiene que leer
`SHOP_TEMPLATES[kind]?.items`. **Es el único consumidor de los items**, y ya
tiene guardia contra `undefined`, que es justo el caso del tipo escrito a mano.

### B3 · `app/dm/TiendasPanel.tsx` — el combobox ⭐

Es el paso con más chicha. Los **dos** `<select>` (líneas 70-72 al crear y
106-108 al editar) pasan a ser el mismo combobox:

```tsx
<input list="shop-kinds" value={kind} onChange={…} placeholder="Tipo (p. ej. Pescadería)" />
<datalist id="shop-kinds">
  {SHOP_KINDS.map((k) => <option key={k} value={kindLabel(k)} />)}
</datalist>
```

Un solo `<datalist>` en el componente padre sirve a los dos inputs: se referencian
por `id`. Y **al guardar se pasa por `normalizaKind`**, no antes: normalizar en
cada tecleo pelearía con lo que el DM está escribiendo.

- **Al crear** (`onCreate`, `onGenerate`): `createShop(poi, name, normalizaKind(kind))`.
- **Al editar** (`saveMeta`): igual, dentro de `updateShop`.
- **El botón «Semilla»** (línea 109) solo funciona con tipo conocido:
  `disabled={!SHOP_TEMPLATES[kind]}` y el `title` lo explica —«este tipo no trae
  plantilla; añade los objetos a mano»—. **Deshabilitado y dicho**, no
  silenciosamente inútil: hoy `seedCatalog` con un tipo desconocido no haría nada
  y el DM no sabría por qué.
- `newKind` arranca en `""` con placeholder, ya no en `SHOP_KINDS[0]`.

### B4 · `components/lugar/ShopSection.tsx` — lo que ve el jugador

Línea 51: `{s.kind}` → icono + `{kindLabel(s.kind)}`.

### B5 · `lib/generar.ts` — que la IA lea la etiqueta

Línea 66: `tipo "${kind}"` → `tipo "${kindLabel(kind)}"`, para que el prompt diga
*«una tienda de tipo "Botica del curandero"»* y no *«curandero»*. Y línea 116 de
`ShopSection`, que compone la persona del tendero, igual.

### B6 · `scripts/check-tiendas.ts` — gate nuevo (el 35) ❗

⚠️ **Antes de crearlo: NO existe hoy.** Lo he comprobado — hay `check-forja.ts`
(los 75 materiales) pero **ningún gate mira las tiendas**. El nombre está libre.

Qué vigila (la tanda toca datos, así que el gate es obligatorio):

**Sobre las plantillas:**
- Toda clave de `SHOP_TEMPLATES` tiene `label`, `icon` e `items` no vacíos.
- **Las tres claves originales siguen existiendo, escritas a mano en el script**
  (`herreria`, `alquimista`, `general`): son las que hay guardadas en filas de
  `shops` reales; borrar una dejaría tiendas sin plantilla ni icono. *Escritas a
  mano y no derivadas del propio catálogo, o el check sería verde por
  construcción — la lección del gate 33.*
- Ningún catálogo vacío; **mínimo 5 objetos** por tipo.
- Precios **enteros y ≥ 1**, que es la invariante que sale de la decisión 2: sin
  cobre, un objeto a 0 po sería gratis en `shopTx.comprar`.
- Sin nombres de objeto repetidos **dentro** de un mismo catálogo.
- **Ninguna etiqueta repetida entre dos claves**, ni ignorando tildes: si
  «Herrería» fuera el `label` de dos tipos, `normalizaKind` tendría que elegir
  uno y el otro sería inalcanzable desde el desplegable.

**Sobre el tipo libre** — aquí es donde este gate se gana el sueldo, porque es
lógica nueva que nadie más mira:
- `normalizaKind("Herrería")` → `"herreria"`. **Es el caso que motiva la función.**
- `normalizaKind("HERRERIA")` y `normalizaKind("  herreria  ")` → `"herreria"`.
- `normalizaKind("Pescadería")` → `"Pescadería"` intacto, que es el caso del DM.
- `normalizaKind("")` → `"general"`, no cadena vacía.
- **Ida y vuelta sobre las doce**: `normalizaKind(kindLabel(k)) === k` para toda
  clave. Sin esto, elegir del desplegable podría dejar de caer en su clave y
  nadie se enteraría hasta ver una tienda sin icono.
- `kindLabel` / `kindIcon` de una clave inventada devuelven el texto y `fa-store`,
  **nunca `undefined`** — es lo que se pinta en `/lugar`.

**Prueba de mutación** (romper, comprobar que falla, restaurar):
1. Borrar `herreria` → falla la lista escrita a mano.
2. Poner un precio a 0 → falla la de precios.
3. Dejar un `label` vacío → falla la de forma.
4. Duplicar un objeto dentro de un catálogo → falla.
5. **Quitarle a `normalizaKind` el borrado de tildes** → tiene que fallar la ida
   y vuelta. *Esta es la que de verdad importa: es un fallo que en la app se ve
   como «la tienda salió sin icono», que nadie relaciona con una tilde.*
6. **Hacer que `normalizaKind` devuelva `"general"` para todo lo desconocido** →
   tiene que fallar el caso «Pescadería», o el tipo libre no sería libre.

### B7 · Gate y verificación

`tsc` + `next build` + **35** checks. En la app viva (tú): Panel DM › Tiendas —

1. Crear una tienda **eligiendo un tipo del desplegable**, darle a **Semilla** y
   comprobar que el catálogo entra.
2. Crear otra **escribiendo un tipo que no exista** («Pescadería»): el botón
   Semilla tiene que salir **deshabilitado y explicándose**, y los objetos se
   añaden a mano.
3. En `/lugar`, que el jugador vea **la etiqueta y el icono** en las dos, y que
   **comprar siga descontando oro**.
4. Que una tienda **creada antes de esta tanda** siga viéndose bien: es la
   comprobación de que el fallback no rompe nada guardado.

---

# Orden de trabajo y commits

Rama `feat/abrir-secciones-y-tiendas`, **pusheada en cuanto exista**.

1. `feat(acceso): el jugador entra en mapa, panteon, cronica y bestiario` — A1 + A2.
2. `feat(acceso): dos puertas nuevas en la portada` — A4.
3. `refactor(tiendas): el tipo de tienda gana etiqueta e icono` — B1, B2, B4, B5,
   **sin añadir tipos ni tocar el `<select>` todavía**. Aislado, para que se vea
   que la forma nueva no rompe las tres tiendas de siempre.
4. `feat(tiendas): el DM escribe el tipo de tienda` — B3, el combobox y
   `normalizaKind`. **Es el commit que cambia el comportamiento**; va solo.
5. `feat(tiendas): nueve tipos nuevos con su catálogo` — los datos.
6. `test(tiendas): gate 35 sobre los catalogos de tienda` — B6.
7. `docs: HANDOFF y prompt al dia`.

**Commitear antes de mutar** (`git checkout --` no restaura lo que git no conoce).

# Deuda que esta tanda deja escrita (no escondida)

Las tres van al HANDOFF, porque las tres son decisiones y no descuidos:

1. **Las pistas de `/cronica` viajan enteras al navegador del jugador** y se
   filtran en JavaScript. Preexistente, misma familia que `/api/*` sin control de
   rol. Arreglo de raíz: `clues` a tabla propia con RLS.
2. **Los precios son enteros en piezas de oro.** Nada puede costar menos de 1 po,
   así que los catálogos baratos se venden por lotes. Arreglo de raíz: migrar a
   cobre y mostrar po/pp/pc.
3. **Un tipo de tienda «hostal» no movería el reloj de campaña.** Con el tipo
   libre el código no puede impedirlo; queda como convención.
