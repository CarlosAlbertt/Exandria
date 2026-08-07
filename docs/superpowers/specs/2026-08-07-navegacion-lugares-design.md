# Navegación por lugares: tarjetas, sub-lugares y bosque por zonas

**Fecha**: 7 de agosto de 2026
**Estado**: decisiones cerradas con el usuario, **sin construir**
**Migración**: sí — `schema_v25`

---

## 1 · Qué se pide

Que el jugador **se mueva solo** por tarjetas. En Byroden ve **Taberna, Iglesia,
Cementerio, Ayuntamiento y Bosque**; entra donde quiera; el Bosque lleva a la
**Expansión Verdante, que tiene zonas**; y en cada sitio están **los PNJ de ese
sitio**, no los del pueblo entero.

## 2 · Lo que hay hoy, comprobado en código

| Pieza | Estado |
|---|---|
| `/lugar` renderiza **UN** POI, con tienda, posada, PNJ, tablón y saber | hecho |
| `location_npcs.poi_name` ata los PNJ **al pueblo entero** | hecho, y es el problema |
| `party_location` en `app_config`: **un solo valor compartido** | hecho |
| Su política es **`cfg: el DM edita`** → el jugador **no puede moverse** | la reja |
| Solo `MapaPanel` escribe la ubicación | hecho |
| `TOWN_MAPS` + override en `app_config`: imagen por pueblo **sin desplegar** | hecho |
| Byroden existe (`data/pois.ts:112`), la Expansión Verdante también | hecho |
| Las tres franjas del bosque (`data/bosque.ts`) | hecho **ayer** |

**No hay ningún concepto de sub-lugar.** Eso es lo que falta de verdad.

## 3 · Las cuatro decisiones del usuario (2026-08-07)

| Decisión | Elegido | Por qué |
|---|---|---|
| **Quién se mueve** | **Cada jugador por su cuenta** | Es a donde ya apunta la app: la memoria de PNJ va por jugador y las misiones por ficha. Y nadie te arrastra a mitad de conversación. Se descartó mover el grupo entero (uno pulsa y mueve a cinco) y dejar el POI en manos del DM (entonces ir al bosque no lo decides tú). |
| **Dónde viven los sub-lugares** | **`app_config`, editable sin desplegar** | La app ya se peleó con esto en las tiendas: *«para que existiera una pescadería había que desplegar»*. Semilla en código + override del DM, como el atlas y como `TOWN_MAPS`. |
| **Cómo se atan los PNJ** | **Columna `venue` nueva** | Un PNJ **sin `venue` sigue saliendo en el pueblo entero**, así que los que el DM ya tiene creados no se rompen ni desaparecen. Se descartó meterlo dentro del `poi_name` (clave compuesta en un campo de texto: se rompe con una tilde). |
| **Zonas del bosque** | **Las tres franjas de `data/bosque.ts`** | Linde, espesura y corazón ya tienen etiqueta, descripción y tabla de encuentros. Cero invención y le da uso inmediato a la tanda de ayer. |

## 4 · El modelo: un grafo de nodos, y una tarjeta por nodo

Lo que se pide no son «sub-lugares de un pueblo»: es **moverse**. Byroden → el
bosque → más adentro → volver. Si se modela como «un POI tiene una lista de
sitios», el bosque no cabe, porque la Expansión Verdante **es una región, no un
POI**, y sus franjas no son sub-lugares de Byroden.

Así que un **nodo**, y una **tarjeta por nodo**:

```ts
type Nodo = {
  id: string;            // "poi:Byroden", "sub:Byroden/taberna", "franja:linde"
  nombre: string;
  icono: string;         // Font Awesome, como POI_ICON
  blurb: string;
  imagen?: string;       // la pones tú; se puede editar sin desplegar
  salidas: string[];     // ids de nodos a los que se puede ir DESDE aquí
};
```

Las salidas son **dirigidas a propósito**: bajar al corazón del bosque y no
poder volver por donde entraste es una situación que el DM puede querer. El gate
avisa de las asimétricas en vez de prohibirlas.

**Byroden** sale con cinco: taberna, iglesia, cementerio, ayuntamiento y
`franja:linde` (la tarjeta se llama «El bosque»). Las franjas encadenan
linde ↔ espesura ↔ corazón, y la linde vuelve a Byroden.

⚠️ **Los nodos `poi:` NO se escriben a mano**: se derivan del atlas, que ya tiene
los POI de los cinco continentes. Escribirlos otra vez sería una segunda lista
que se desincroniza del mapa — el mismo fallo que ya tuvo `regionEntries()`.

## 5 · Dónde está cada jugador

**En `characters.play_state`**, no en `app_config`:

```ts
play_state.sitio = { nodo: string } | undefined
```

Tres razones, y la tercera es la que decide:
1. Es literalmente «estado de juego», que es lo que esa columna guarda.
2. Va **por ficha**, que es la granularidad que pidió el usuario.
3. ⚠️ **`characters` SÍ está en la publicación realtime y `app_config` NO.** Esa
   lección va pagada **cuatro veces** en este repo. Poniéndolo aquí, el DM ve
   moverse a la gente en vivo y **no hace falta update optimista**.

**Sin `sitio` el jugador está donde diga `party_location`**, que sigue siendo del
DM. Así que **nada se rompe el día de la migración**: quien no se haya movido
nunca sigue viendo exactamente lo de hoy, y el DM conserva el poder de plantar a
todo el mundo en un sitio (mover el ancla **borra los `sitio` individuales**: es
lo que significa «nos vamos todos de aquí»).

## 6 · Qué cambia en `/lugar`

De una página que pinta un POI a una que pinta **el nodo donde estás**:

1. **Cabecera** del nodo: imagen, nombre, blurb. El clima y el reloj solo en los
   nodos al aire libre.
2. **Las tarjetas de salida**, que es lo nuevo.
3. **Lo de siempre, filtrado**: `NpcSection` recibe el `venue`; tienda, posada,
   tablón y `SaberRoll` **siguen colgando del POI** y solo se pintan en el nodo
   del pueblo. Una taberna que es un `sub:` puede tener su propio tendero por la
   vía de siempre (`shops`), pero eso no es de esta tanda.

## 7 · Las piezas

1. **`schema_v25.sql`** — `location_npcs.venue text`. Nada más: sin RLS nueva
   (la de v16 ya vale) y sin tocar realtime.
2. **`data/lugares.ts`** — el tipo `Nodo`, la semilla de Byroden y las franjas.
3. **`lib/nodos.ts`** — **puro**, como `lib/niebla.ts` y `lib/misiones.ts`:
   `nodoId()`, `resolver()`, `salidasDe()`, `nodoDelJugador()`. Aquí vive la
   regla, para que el gate pueda mirarla.
4. **`lib/useLugares.ts`** — semilla + override de `app_config`, calcado de
   `useTownMaps`.
5. **`lib/useSitio.ts`** — dónde estoy y `mover()`, sobre `play_state`.
6. **`app/lugar/page.tsx`** — cabecera, rejilla de tarjetas, sección filtrada.
7. **Panel DM** — editar sub-lugares, salidas e imágenes; y el botón de plantar
   al grupo, que ya existe en `MapaPanel`.
8. **`scripts/check-lugares.ts`** — el gate 40.

## 8 · El gate 40 y qué tendría que romperse

| Rotura | Qué canta |
|---|---|
| Una salida apunta a un nodo que no existe | **La tarjeta a ninguna parte.** El jugador pulsa y se queda en blanco. |
| Un nodo sin ninguna salida | Se entra y **no se puede salir**. |
| Byroden pierde una de sus cinco | La navegación que pidió el usuario, rota en silencio. |
| Las franjas dejan de encadenar | No se puede llegar al corazón del bosque. |
| `nodoDelJugador` ignora el `sitio` y devuelve siempre el ancla | Moverse deja de tener efecto y **no salta nada**. |
| `nodoDelJugador` devuelve un nodo con `sitio` vacío | El jugador nuevo aparece en un sitio al azar en vez de con el grupo. |
| Un `venue` de PNJ que no es ningún nodo | Ese PNJ **no sale en ninguna pantalla**, en silencio. Es el mismo fallo que `check-despiece` cazó con el nombre mal escrito. |

⚠️ **La lista de las cinco salidas de Byroden va escrita a mano en el script.** Si
saliera de la semilla, las dos mitades se moverían juntas y borrar el cementerio
no rompería nada — la lección de `check-origen` y `check-tiendas`, por sexta vez.

## 9 · Lo que esta tanda NO hace

- **No pone imágenes.** Las hace el usuario; la app deja el hueco y el campo para
  pegar la URL sin desplegar.
- **No mueve tiendas ni tablón a los sub-lugares.** Siguen colgando del POI.
- **No toca `party_location`** ni su RLS: el DM sigue siendo quien planta al
  grupo, y eso no era el problema.
- **No puebla los otros pueblos.** Byroden entero y el bosque; el resto los añade
  el DM desde el panel, que para eso no hace falta desplegar.
