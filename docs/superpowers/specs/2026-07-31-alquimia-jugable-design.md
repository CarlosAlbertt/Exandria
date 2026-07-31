# Alquimia jugable — diseño

Convertir el oficio de **Alquimia** en algo que se juegue: un taller con caldero,
un libro de recetas que se descubre, y una pantalla de máster desde la que el DM
ve y manipula los 369 materiales. Alquimia va **entera** y queda como **patrón**
para los otros cinco oficios.

Precedentes que se copian, no se inventan: `/bestiario` (buscador + filtros +
edición del DM sobre datos del código), `components/lugar/SaberRoll.tsx` (tirada
con consecuencia), `lore_unlocked` + `LorePicker` + `unlockLore` (descubrir poco
a poco), `lib/useBestiary.ts` (persistir en `app_config` sin migración).

## Las ocho decisiones (tomadas con el usuario, 2026-07-31)

| # | Decisión | Elegido |
|---|---|---|
| 1 | Alcance | **Solo Alquimia, entera.** Patrón para los otros cinco. |
| 2 | Materiales | **Objetos de inventario reales**, apilables. |
| 3 | Huecos | **Un montón = 1 hueco**, por muchas unidades que lleve. |
| 4 | Descubrir receta | DM desde Panel DM › Grupo · tomo in-game · algunas ya sabidas |
| 5 | Fallo de tirada | **Se pierden los materiales, se puede reintentar.** |
| 6 | Taller | Ruta **`/taller`** con pestañas por oficio. |
| 7 | Pantalla de máster | Ruta propia **`/oficios`**, DM-only. Consultar + entregar + editar. |
| 8 | Extracción de Componentes | Es el oficio que **consigue** materiales. Sin catálogo propio. |

Y la que arrastra la sesión anterior: al quitar «Dados del grupo» de
`/personaje`, las peticiones de tirada del DM pasan a un **aviso flotante**
visible desde cualquier pantalla.

## 1. El índice de materiales — `lib/materiales.ts`

Los seis catálogos son seis arrays con seis tipos distintos. Nada los une hoy.

`MATERIALES` es la unión, cada entrada etiquetada con su oficio:

```ts
export type Oficio = "alquimia" | "cocina" | "forja" | "destilacion" | "cristalografia" | "tatuaje";
export type Material = {
  oficio: Oficio;
  n: number;            // número de catálogo, propio de cada oficio
  name: string;
  blurb: string;
  category?: string;     // solo alquimia, cocina y forja la tienen
  herramienta?: true;    // cristalografía, tatuaje: NO se gasta
  riesgo?: true;         // destilación
  mecanica?: string;     // forja: regla de verdad, no sabor
};
```

**Por qué el nombre puede ser la clave**: el gate 30 (`check-materiales.ts`) ya
declara que **no hay ningún nombre exacto repetido entre los seis catálogos** y
la lista de solapes está vacía. Ese invariante es lo que permite que
`materialPorNombre(name)` sea determinista, y por tanto que un objeto de la bolsa
llamado «Raíz de Oloore» **sea** el material 1 de alquimia sin columna nueva ni
migración. Es el mismo truco que `esOficio()` sobre `characters.skills`.

⚠️ **Este índice ata el gate 30 a algo nuevo.** Si algún día se admite un nombre
repetido entre catálogos, esto deja de ser determinista. `check-recetas.ts` lo
vuelve a comprobar desde este lado para que el acoplamiento no sea tácito.

## 2. Los huecos — `huecosUsados()` en `lib/inventario.ts`

Hoy la bolsa cuenta **por unidades**: `items.reduce((s, i) => s + i.qty, 0)`,
duplicado en `app/inventario/page.tsx:60` y `components/CharacterSheet.tsx:301`.
Con eso, recolectar 12 hierbas se come 12 de los 20+2×FUE huecos.

Regla nueva, en **una sola función** que el gate ve:

```ts
export function huecosUsados(items: Item[]): number {
  return items.reduce((s, i) => s + (esMaterial(i.name) ? 1 : i.qty), 0);
}
```

- Un montón de materiales ocupa **1 hueco** tenga 1 unidad o 50.
- Todo lo demás cuenta **por unidad**, exactamente como hasta ahora: armas,
  armaduras y pociones no cambian de comportamiento.
- Llevar 30 materiales **distintos** sí llena la bolsa: ocupan sitio de verdad,
  que es lo que el usuario pidió.

Los dos `reduce` se sustituyen por esta llamada. No se toca `devolver()`, que ya
fusiona por nombre y es de lo que depende `puedeDosArmas`.

## 3. Las recetas — `data/recetas.ts`

Lo que hoy no existe: qué materiales lleva cada poción, contra qué se tira y qué
pasa al fallar.

```ts
export type Receta = {
  slug: string;                        // id estable, kebab-case
  oficio: Oficio;                      // esta tanda: siempre "alquimia"
  produce: string;                     // slug de data/pociones.ts
  variante?: string;                   // nombre de la variante, en las familias
  cd: number;
  materiales: { n: number; qty: number }[];  // n = catálogo de alquimia
  inicial?: true;                      // se sabe al elegir la pericia
};
```

**Una receta por cosa preparable**, no por entrada del catálogo: las dos familias
se despliegan. 23 pociones simples + 4 potencias de Curación + 5 filas de Fuerza
de Gigante = **32 recetas**, y toda poción del libro es preparable.

**La CD sale de la rareza**, no se inventa por receta:

| Rareza | CD |
|---|---|
| Común | 10 |
| Infrecuente | 13 |
| Rara | 16 |
| Muy rara | 19 |
| Legendaria | 22 |

Las **iniciales** son las comunes: quien elige la pericia Alquimia arranca con el
libro con algo dentro y no con un caldero vacío.

## 4. El libro de recetas — sin migración

Va en **`characters.lore_unlocked`** con el prefijo **`receta:<slug>`**, que es
el patrón que ya usan `reg:` y `cont:x:profundo`.

Sale gratis, y esa es la razón de elegirlo:
- El DM concede desde Panel DM › Grupo con la op **`unlockLore`** de
  `/api/dm/character`, que ya fusiona sin pisar.
- Un tomo in-game enseña recetas con **`openDocument`** (`ItemDoc.unlockLore`),
  que ya existe.
- **Cero migración**: la columna ya es `jsonb` desde `schema_v19`.

**Comprobado que no ensucia `/reino`**: los cuatro consumidores de lore
(`SaberBrowser`, `ContinentePage`, `CalamidadSection`, `SaberRoll`) recorren
`SABER` y preguntan `unlocked.includes(id)`. Iteran el catálogo, no el array del
personaje, así que un id que no es de saber **no se pinta en ningún sitio**.

Las **iniciales no se persisten**: se derivan de tener la pericia. Un personaje
que pierde Alquimia deja de saberlas, que es lo correcto.

## 5. El taller — `/taller`

Ruta nueva con **pestañas por oficio**; hoy solo Alquimia está construida y las
otras cinco salen como «aún no». Una sola entrada en `RUTAS_JUGADOR` para las
seis: añadir un oficio mañana no vuelve a tocar `lib/acceso.ts`.

> ⚠️ `/taller` **entra en `RUTAS_JUGADOR`** (`lib/acceso.ts`) o el jugador choca
> contra `/cerrado`, y `check-acceso.ts` (gate 25) falla si se olvida.

**El caldero**, dos columnas:
- **El libro** (izquierda): las recetas sabidas, con buscador. Cada una enseña lo
  que produce, su CD y sus materiales. Las que no se saben **no aparecen**: el
  libro es lo que el personaje ha descubierto, no el catálogo.
- **El caldero** (derecha): al elegir receta, cada material sale marcado como
  disponible o **en falta** (contra la bolsa real). El botón **Preparar** se
  enciende solo si están todos.

**Preparar** tira Alquimia con `rollVisual` (el mismo camino que `SaberRoll`) y
compara con la CD:
- **Éxito**: se consumen los materiales y la poción entra en la bolsa.
- **Fallo**: **se consumen igual** y no sale nada. Se puede reintentar si queda
  material. El coste del fallo es el material, que es lo que hace que recolectar
  importe.

Las **herramientas no se gastan** nunca. Alquimia no las usa todavía, pero el
tipo y la comprobación entran ya porque cristalografía y tatuaje sí, y ese es el
campo que el prompt avisa de no confundir.

## 6. La pantalla de máster — `/oficios`, DM-only

Al estilo `/bestiario`, que es el precedente exacto. **Todo junto**: los 369
materiales de los seis catálogos + las 25 pociones + las 32 recetas.

- **Buscar** por texto y **filtrar** por oficio, categoría, rareza, si es
  herramienta y si tiene riesgo.
- **Entregar** materiales a un jugador con `addItems` de `/api/dm/character`, que
  ya apila por nombre. Entregar recetas con `unlockLore`.
- **Editar el catálogo** sin desplegar: materiales y recetas propios, persistidos
  como JSON en `app_config` (claves `oficios_custom` y `recetas_custom`),
  superpuestos por nombre/slug igual que `mergeMonsters`.

> ⚠️ **`app_config` NO está en la publicación realtime.** Es una lección ya
> pagada dos veces —`useBestiary` se suscribe a `app_config` y esa suscripción no
> entrega nunca—. Aquí el guardado es **optimista**: el estado local se actualiza
> al escribir y no se espera a ningún evento.

`/oficios` **no entra** en `RUTAS_JUGADOR`: el jugador ve su libro en el taller,
no el catálogo entero.

## 7. Las peticiones de tirada

Se quita la sección «Dados del grupo» de `app/personaje/page.tsx` entera. Como
`useRollRequests` no tenía otro consumidor del lado del jugador, las peticiones
del DM pasan a un **aviso flotante** montado en el layout: aparece encima de
cualquier pantalla cuando el DM pide una tirada, con el botón de tirar.

Es más que un traslado: hoy el jugador tiene que estar en `/personaje` para
enterarse de que le han pedido algo. El dado de valor libre **se aparca**, como
estaba decidido.

## 8. El gate — `scripts/check-recetas.ts` (31)

Lo que el prompt exige y las cuatro últimas tandas enseñaron:

- Toda receta apunta a **materiales que existen** en `data/alquimia.ts`.
- Toda receta produce una **poción que existe** en `data/pociones.ts`, y si
  declara `variante`, que esa variante exista en esa familia.
- Una receta de una familia **tiene** que declarar variante; una de una poción
  simple **no puede**.
- La **CD concuerda con la rareza** de lo que produce.
- Ninguna receta **gasta una herramienta**.
- Las 25 pociones están **todas cubiertas** por al menos una receta.
- `huecosUsados` cuenta 1 por montón de material y `qty` por lo demás.
- El índice de materiales **no tiene nombres ambiguos** entre catálogos (vuelve a
  comprobar el invariante del gate 30 desde el lado que ahora depende de él).

Con **prueba de mutación**: romper cada regla a propósito, ver fallar el gate,
restaurar. Y **commitear antes de mutar**, que `git checkout --` no restaura un
archivo que git aún no conoce.

## Lo que esta tanda NO hace

- Los otros cinco oficios: solo la pestaña «aún no» en `/taller`.
- **Extracción de Componentes**: se decide que es el oficio que *consigue*
  materiales, pero su mecánica no se construye aquí.
- El campo **`mecanica`** de forja sigue **sin conectar**: forjar un peto de
  mithril sigue sin quitar el requisito de Fuerza. `data/equipment.ts` y
  `lib/derive.ts` no se tocan.
- Nada probado en la app viva: todo está tras el login y la validación visual la
  hace el usuario.
