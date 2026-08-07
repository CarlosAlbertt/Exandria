# Posición por jugador: uno en Emon y otro en Byroden

> Pedido el 2026-08-08. **Las siete decisiones las tomó el usuario antes de
> escribir una línea**, y van en la tabla de abajo con su motivo: sin ellas este
> plan tendría cuatro formas distintas y todas defendibles.

## Qué se pide

Que **cada jugador esté donde esté**, y que puedan estar en pueblos distintos a
la vez. Hoy no se puede.

## Por qué hoy no se puede, y no es un olvido

| Pieza de hoy | Qué hace | Por qué estorba |
|---|---|---|
| `app_config.party_location` | **Un** ancla para todo el grupo: continente + región + pueblo | Es una sola fila. No hay «dónde está cada uno» |
| `play_state.sitio = { nodo, desde }` | Lo que el jugador se anda por su cuenta | **Caduca en cuanto el ancla cambia** (`sitioVigente`), y eso se puso a propósito: si el DM plantaba al grupo en Emon, quien estaba en la taberna de Byroden se quedaba allí solo |
| `puedeIr` | Solo deja moverse por aristas del grafo | **No hay aristas pueblo→pueblo.** Nadie puede ir de Byroden a Emon |

Resultado: dos jugadores pueden estar en sitios distintos **del mismo pueblo**,
nunca en pueblos distintos.

### Y un fallo que aparecería solo, si se cambiara únicamente el nodo

`Byroden` está en `peninsula-pleabruma` y `Emon` en `litoral-filofulgor`.
`/lugar` saca la región, el clima y el `poi` de `location.regionSlug`, que es del
**grupo**. Un jugador en Emon con el ancla en Byroden vería el clima y la región
de Pleabruma, y `poisOf` no encontraría Emon: **se quedaría sin tienda, sin
posada, sin tablón y sin tirada de saber, en silencio.** Por eso la ubicación
efectiva se resuelve, no se hereda.

## Las siete decisiones

| # | Decisión | Por qué |
|---|---|---|
| 1 | **Mueven los dos: el DM y el jugador** | El jugador puede viajar por su cuenta, no solo andar por su pueblo |
| 2 | **Lo que puso el DM aguanta; lo que se anduvo el jugador caduca** | Distingue «el DM te plantó en Emon» de «te metiste en la taberna». Conserva la red que evita quedarse solo |
| 3 | **Alcance completo**: región, clima, tienda, posada, tablón y saber del pueblo donde estés | Lo de arriba. Y el continente y la región se **miran en el atlas**, no se copian en la ficha: una segunda copia se desincroniza — la lección de `regionEntries()` |
| 4 | **El DM coloca desde Panel DM › Grupo** | Ya está ahí para dar XP y objetos, y de un vistazo ve quién está dónde |
| 5 | **Se viaja a cualquier POI revelado del mismo continente** | Reutiliza la niebla que ya existe (`poi_state.revealed`), que el DM ya maneja. Sin lista nueva que se desincronice del mapa |
| 6 | **Viajar cuesta tiempo, por distancia en el mapa** | — |
| 7 | **El desfase es POR JUGADOR y afecta también a la mecánica** | Es su hora de verdad: descanso, cupo del caldero y crónica incluidos |

## El estado nuevo

`characters.play_state` (jsonb, **sin migración**: es la misma columna):

```ts
sitio: {
  nodo: string;
  desde: string;
  /** Quién lo puso. El del DM NO caduca al mover al grupo. Ausente = jugador. */
  puesto?: "dm";
}
/** Minutos de juego acumulados viajando. Nunca negativo. */
desfase?: number;
```

⚠️ **INVARIANTE: sin `sitio` no hay `desfase`.** Volver con el grupo es volver a
su hora. Un desfase huérfano dejaría a alguien adelantado ocho horas **sentado en
la misma plaza que los demás**, y eso no se lee como un fallo: se lee como que la
app miente. Se borran juntos, y el gate lo vigila.

## Las siete piezas, en orden

1. **Las reglas puras** — `lib/viaje.ts` nuevo (destinos, coste), `Sitio.puesto`
   en `lib/nodos.ts`, `ubicacionDeNodo` (resolver el POI en el atlas).
   Módulos neutros, sin `"use client"`, para que el gate los mire — la razón por
   la que `facesFrom` y `puedeSembrar` están exportadas.
2. **`/lugar` con la ubicación EFECTIVA** — región, clima, tienda, posada,
   tablón y saber del sitio donde estás, no del ancla.
3. **El reloj del jugador en pantalla** — `useRelojJugador`, y los cuatro que
   pintan la hora: `ClockWidget`, `ClockPopover`, `PartyLocationWidget`, `/lugar`.
4. **El reloj del jugador en la mecánica** — el cupo del caldero, la crónica y
   **`/api/descanso`**, que además guarda el anti-abuso del descanso largo en
   `app_config.last_long_rest`, **compartido**: con relojes por jugador eso pasa
   a estar mal y se vuelve por ficha.
5. **Viajar, en `/lugar`** — los destinos revelados con lo que cuesta cada uno.
6. **Panel DM › Grupo** — colocar a cada jugador, «traer al grupo» y «traer a
   todos», por el endpoint `/api/dm/character` que ya existe.
7. **El gate** — `check-viaje` nuevo y `check-lugares` ampliado, con mutación.

## Lo que este plan NO hace, y va dicho

- **No hay viaje entre continentes.** Solo dentro del mismo, que es lo decidido.
- **El grafo no gana aristas pueblo→pueblo.** `puedeIr` sigue vigilando el andar
  por el pueblo y el bosque; viajar es otra puerta, con su propia regla, porque
  su permiso no es una arista: es que el POI esté **revelado**.
- **El reloj sigue siendo uno.** El desfase se suma encima; no hay cinco relojes
  en `app_config`.
