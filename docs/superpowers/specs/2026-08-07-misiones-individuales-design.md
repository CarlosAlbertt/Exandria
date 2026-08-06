# Misiones individuales, en plan novela visual

**Fecha**: 7 de agosto de 2026
**Estado**: decisiones cerradas con el usuario, **sin construir**
**Migración**: sí — `schema_v24`

---

## 1. Qué se pide

Misiones **secundarias e individuales** —de un jugador, no del grupo—
presentadas como una **novela visual**: tarjetas de PNJ con los que hablar y
**opciones de diálogo** sobre el prompt propio de cada PNJ.

## 2. Lo que YA está construido, comprobado en código

No es una pantalla nueva: son **tres cuartas partes de una que ya existe**.

| Pieza | Dónde | Estado |
|---|---|---|
| PNJ por POI, con `prompt`, `public` y `portrait` | `location_npcs` (`schema_v16`) | hecho |
| Memoria por (PNJ, jugador) | `npc_memories` (`schema_v18`) | hecho |
| Tarjetas de PNJ con retrato → abren conversación | `components/lugar/NpcSection.tsx` | hecho |
| Persona compuesta (prompt del PNJ + ambiente del lugar) | `personaFor()`, `NpcSection.tsx:40` | hecho |
| Chat con la IA, resumen al cerrar | `components/lugar/NpcChat.tsx` | hecho |
| El DM los crea, edita y los genera con IA | `app/dm/NpcsPanel.tsx`, `generarNpc` | hecho |
| Segundo ejemplo vivo del mismo patrón | `ShopSection` (tendero) | hecho |
| Misiones con `title, body, status, poi_name, reward, unlock_lore` | `quests` (v12 + v17 + v19) | hecho |
| El jugador acepta ofertas del tablón | `TablonSection` + `/api/aceptar-encargo` | hecho |
| Generación IA de estructuras con claves fijas | `lib/generar.ts` (`generarJSON` + `parseJSON`) | hecho |

## 3. Lo que falta, y solo eso

1. **Opciones de diálogo.** `NpcChat` es una caja de texto libre y nada más.
2. **Vínculo PNJ → misión.** `location_npcs` y `quests` no se conocen.
3. **Columna de asignado en `quests`.** No hay forma de dar una misión a alguien.
4. **El jugador no puede entregar.** Solo el DM cierra una misión a mano.

## 4. Las cuatro decisiones, tomadas por el usuario el 2026-08-07

| Decisión | Elegido | Por qué, y qué se descartó |
|---|---|---|
| **De dónde salen las opciones** | **Las propone la IA**, manteniendo la caja de texto libre | Encaja con lo que ya hay (`generarNpc`, `generarEncargo`) y no obliga al DM a escribir un árbol por PNJ. Se descartó que las escribiera el DM (contenido a mano, la novela visual se queda muda si no escribe) y la novela visual pura sin texto libre (perdería la libertad que hoy existe). |
| **A qué se asigna** | **`character_id`** | Es estrictamente más información: de ficha siempre se llega al jugador (`characters.user_id`), al revés no. Y la misión **muere con la ficha archivada**, que es lo correcto: el encargo era de ESE personaje, no del jugador. Se descartó `user_id` (coherente con `npc_memories`, pero el personaje nuevo heredaría el encargo de un muerto) y las dos columnas (dos fuentes de verdad que se desincronizan). |
| **Quién la ve** | **Solo su jugador y el DM** | Es lo que hace que «individual» signifique algo. Requiere tocar la RLS de `quests`. Se descartó que el grupo la viera etiquetada (más simple, pero el secreto individual no existiría). |
| **Cómo se entrega** | **Opción de diálogo con el PNJ** | Es lo que hace que el PNJ importe. Se descartó el botón suelto en `/cronica` (rompe la ficción). |

## 5. La consecuencia de cruzar la 1ª con la 4ª, y es de diseño

**Las opciones de misión NO las propone la IA.** Si la opción de entregar
saliera del modelo, se le olvidaría cuando toca y la inventaría cuando no —
y entonces la misión no se podría cerrar, o se cerraría sin haberla hecho.

Así que las opciones tienen **dos orígenes distintos y se ven igual**:

- **Las de conversación**: 2–4 por turno, las **propone la IA** a partir del
  prompt del PNJ y de lo hablado. Son sabor, no tienen efecto.
- **Las de misión**: las **inyecta la app**, deterministas, calculadas del
  estado de `quests`. Son dos:
  - **«Acepto el encargo»**, si este PNJ tiene una misión en `oferta` sin
    asignar.
  - **«Está hecho»**, si este PNJ tiene una misión `activa` asignada a la ficha
    activa de quien habla.

Esto es lo mismo que ya se decidió en el caldero con `bolsaDeArena`: **la
mecánica no pasa por la IA**. La IA pone la voz; el estado lo mueve el servidor.

## 6. Cómo salen las opciones de la IA sin doblar el coste

`generarJSON` hace **una llamada aparte** que devuelve JSON. Aquí eso costaría
**dos llamadas por turno** contra un `qwen2.5:14b` local por túnel cloudflared
(el timeout de `/api/ia` es de 180 s): la conversación se volvería inusable.

**Una sola llamada.** El PNJ responde en personaje y **añade al final un bloque
delimitado** con las opciones; `NpcChat` lo recorta antes de pintar la respuesta:

```
…lo que el PNJ dice, en personaje.

<opciones>
- Pregúntale por el bosque.
- Ofrécele monedas.
- Despídete.
</opciones>
```

**Falla abierto a lo que ya funciona**: si el modelo no emite el bloque —o lo
emite mal— se pinta la respuesta entera menos el bloque y **quedan solo la caja
de texto y las opciones de misión**. Que es exactamente la app de hoy. Ninguna
conversación se rompe porque el modelo no colabore.

⚠️ **El recorte tiene que ser a prueba de bloque a medias.** Un `<opciones>` sin
cierre —el modelo se quedó sin `num_predict`— no puede acabar impreso en el
globo de diálogo. El parser corta desde la apertura hasta el final si no hay
cierre.

## 7. La migración: `schema_v24`

```sql
-- quests: dos columnas y una RLS nueva.
alter table public.quests add column if not exists assigned_character_id uuid
  references public.characters(id) on delete set null;
alter table public.quests add column if not exists npc_id bigint
  references public.location_npcs(id) on delete set null;
```

**`on delete set null` en las dos, y no `cascade`.** Borrar un PNJ no puede
borrar la misión que encargó: el DM perdería el encargo por reordenar el POI.
Y archivar una ficha **no** la borra (`archived_at`, no `delete`), así que el
`set null` de `assigned_character_id` solo salta si el DM borra el personaje
de verdad — y entonces la misión vuelve a estar sin asignar, que es lo sensato.

**La RLS de lectura**, que hoy es `status <> 'oculta' or is_dm()`:

```sql
using (
  public.is_dm()
  or (status <> 'oculta' and assigned_character_id is null)
  or (status <> 'oculta' and assigned_character_id in (
        select id from public.characters where user_id = auth.uid()))
)
```

Tres ramas, y las tres importan:
- El DM lo ve todo, como siempre.
- Una misión **sin asignar** sigue siendo del grupo: se ve igual que hoy.
- Una misión **asignada** solo la ve quien tiene esa ficha. Incluye las fichas
  **archivadas** del jugador: la misión de un personaje retirado sigue siendo
  suya de leer.
- `oculta` sigue siendo el borrador del DM y **no** se le enseña ni a su dueño.

La escritura no cambia: `quests` sigue siendo DM-only y los dos caminos del
jugador van por `service_role`, igual que `/api/aceptar-encargo`.

## 8. Dónde vive la regla, y por qué no en el JSX

⚠️ **La lección de `lib/niebla.ts` y de `facesFrom`**: una regla de «quién ve
qué» escrita dentro de un `.map` **no la vigila nadie**, y por eso la niebla
falló abierta durante semanas.

Así que van a **`lib/misiones.ts`**, módulo puro sin React ni Supabase:

- `visiblePara(quest, { esDm, misFichas })` — el espejo exacto de la RLS. La
  base de datos la vuelve a garantizar por su cuenta; esto es para que la
  interfaz sepa qué ofrecer **y para que el gate pueda mirarla**.
- `opcionesDeMision(quests, npcId, fichaActivaId)` — las opciones inyectadas.
  Devuelve `[]`, la de aceptar o la de entregar. Nunca las dos.
- `parseOpciones(reply)` — devuelve `{ texto, opciones }`. El recorte del bloque.

## 9. Las piezas a construir

1. **`schema_v24.sql`** — las dos columnas y la RLS.
2. **`lib/misiones.ts`** — las tres funciones puras de arriba.
3. **`lib/useChronicle.ts`** — `Quest` gana `assigned_character_id` y `npc_id`,
   y `QUEST_FIELDS` los dos campos. Sin esto la RLS filtra bien y la interfaz
   no sabe de quién es la misión.
4. **`NpcChat`** — pinta las opciones bajo el globo, mantiene la caja de texto,
   recorta el bloque y llama a la acción al pulsar una de misión.
5. **`NpcSection`** — le pasa a `NpcChat` el `npcId` y la ficha activa.
6. **`/api/entregar-mision`** — `service_role`, espejo de `/api/aceptar-encargo`:
   comprueba que la misión existe, está `activa`, es de este PNJ y está asignada
   a la ficha activa de quien llama; la pasa a `completada` y aplica
   `unlock_lore`. Anti-abuso por `eq("status", "activa")` en el propio update,
   igual que el tablón.
7. **`/api/aceptar-encargo`** — gana el asignado: al aceptar una oferta con
   `npc_id`, escribe `assigned_character_id`. Y entonces **se le puede quitar el
   parche del `body`**: hoy mete «_Aceptado por X_» dentro del texto de la
   misión porque no había columna donde ponerlo (`route.ts:28-31`).
8. **Panel DM › Crónica** — el formulario de misión gana **PNJ que la encarga**
   (de `useAllNpcs`) y **asignada a** (de `useParty`).
9. **`/cronica`** — la misión asignada se pinta marcada como individual.
10. **`scripts/check-misiones.ts`** — el gate 38.

## 10. El gate 38 y qué tendría que romperse

**La pregunta de siempre: ¿qué rompo para que falle?** Si la respuesta es «las
dos mitades a la vez», no vigila nada — es lo que pasó con `check-tiendas` y con
`check-origen`.

Mutaciones a probar, todas sobre `lib/misiones.ts` porque es donde vive la regla:

| Rotura | Qué debe cantar |
|---|---|
| `visiblePara` deja pasar una misión asignada a otro | **La fuga.** Un jugador leyendo la misión secreta de otro. |
| `visiblePara` enseña una `oculta` a su asignado | El borrador del DM en pantalla. |
| `visiblePara` esconde una **sin asignar** | Las misiones de grupo desaparecerían de `/cronica`. |
| `opcionesDeMision` ofrece entregar una misión de **otro PNJ** | Entregarías el encargo del herrero al tabernero. |
| `opcionesDeMision` ofrece entregar una `oferta` sin aceptar | Cerrar una misión que nunca empezó. |
| `opcionesDeMision` devuelve las dos a la vez | Aceptar y entregar en el mismo turno. |
| `parseOpciones` no recorta un `<opciones>` **sin cerrar** | El bloque crudo impreso en el globo del PNJ. |
| `parseOpciones` devuelve el texto con el bloque dentro | Lo mismo, en el caso normal. |

⚠️ **Y la que de verdad hay que escribir a mano**: la lista de fichas del
jugador en el caso de prueba **no puede salir de la misma función que la
compone**, o las dos mitades se mueven juntas y el check es verde por
construcción. Van escritas literales en el script.

## 11. Lo que esta tanda NO hace, y va dicho

- **No toca `services.tablon`.** El tablón sigue apareciendo solo en los POI que
  lo tienen en `data/pois.ts`, que hoy son muy pocos. Si «no salen misiones» en
  la app, es eso y no el código. Las misiones de PNJ **no** dependen del tablón.
- **No arregla la fuga de las pistas de `/cronica`** (`app_config` con
  `using (true)`, deuda preexistente). Es otra tanda; se apunta que la RLS de
  esta misión es el patrón que le tocaría.
- **No cambia `npc_memories`**, que seguirá yendo por `user_id` mientras la
  misión va por `character_id`. **Son dos ejes distintos a propósito**: el PNJ
  recuerda al **jugador** entre personajes; el encargo es de la **ficha**.
- **No se prueba en la app viva.** Todo está tras el login.
