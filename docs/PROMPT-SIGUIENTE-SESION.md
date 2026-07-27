Retomo Exandria, mi app de campaña de D&D 2024. Clon canónico:
`C:\Users\carlo\Downloads\dnd-campaign-app` (rama `master`, repo privado
CarlosAlbertt/Exandria, desplegada en exandria.vercel.app).

**Lee primero `HANDOFF.md`** — es el documento de estado vivo. El vault de
Obsidian (`C:\Users\carlo\Desktop\Exandria-Obsidian\Exandria`) está al día a
2026-07-28 y explica el porqué de las decisiones.

## ⚠️ LO PRIMERO: esta vez no es una migración, es PROBAR

**No hay ninguna migración pendiente de ejecutar** (v1–v22 al día; la v22 quedó
*retirada*, ver abajo). Lo pendiente es otra cosa: hay **seis features seguidas
desplegadas en producción y nunca vistas en una partida**. Las escribimos, pasaron
el gate (`tsc`, `next build` y los scripts de comprobación) y se mergearon, pero
**nadie las ha jugado**.

Esa deuda ya me costó una: monté un **tablero de batalla** entero —rejilla, fichas
arrastrables, medición de distancia, con su migración— y, al mirarlo con calma,
decidí **retirarlo sin haberlo probado nunca**, porque no encajaba con cómo
jugamos. Se tiró trabajo que una sola partida habría evitado.

**Si te pido código nuevo antes de contarte cómo fue una sesión de prueba,
recuérdamelo.** Y la fase 2 del combate (la «arena») está **bloqueada a propósito**
hasta que eso pase.

Las guías de qué probar y **en qué pantalla exactamente** están en cada sección
`## RESUELTO` de `HANDOFF.md`. Lo más sospechoso, por orden: que el `play_state`
(PG, huecos, condiciones) **sobreviva a recargar la página**; que el contador de
turno se reinicie solo al tocarme; y que el realtime entregue sin recargar.

## Dónde lo dejamos (28 de julio de 2026)

Sesión larga. Seis cosas en `master`, en este orden:

1. **G4 — targeting**: elegir objetivo y, con eso, ventaja del atacante por la
   condición del objetivo, crítico automático (20 natural + proximidad) y fallo
   automático de salvación de Fue/Des. Sin migración.
2. **Fase O2 — conjuros**: preparar con tope, gastar y recuperar huecos, y lanzar
   (gasta el hueco, lo anuncia al feed y tira lo que el conjuro traiga).
   Biblioteca semilla de **32 conjuros que crece**, como el bestiario. Sin
   migración.
3. **El combate se muda de `/personaje` a su propia pantalla**: la ficha queda
   para stats e inventario. Hook `useFichaViva`.
4. **Objetivos múltiples**: la acción de Atacar da **N golpes** (eliges objetivo
   entre golpe y golpe), ataque de **acción adicional** con dos armas ligeras, y
   conjuros de **varias instancias** (Rayo Abrasador, Proyectil Mágico).
5. **Fuera el tablero**: se retira la rejilla. **`/combate`** sustituye a
   `/tablero` y **la iniciativa es la lista de combatientes**: tocas a alguien y
   es tu objetivo. Las reglas que medían distancia **se deducen del arma** (con una
   daga estás en cuerpo a cuerpo por definición), lo que dejó `lib/targeting.ts`
   más simple que antes.
6. **Documentación**: HANDOFF y vault al día con todo lo anterior.

**`schema_v22` está RETIRADA**: se ejecutó para el tablero y, al quitarlo, sus
tablas (`battle_tokens`, `battle_board`) quedaron vacías y sin uso. **No se han
borrado a propósito** y **no hay que hacer nada con ellas**.

## Lo siguiente, ya diseñado y sin código

Spec completo en
`docs/superpowers/specs/2026-07-28-monstruos-al-combate-design.md`, en dos fases:

- **FASE 1 — los monstruos del bestiario entran al combate.** `initiative` gana
  `monster_slug`/`hp`/`hp_max`/`conds` ⇒ **`schema_v23`** (la primera desde la
  v22; **el archivo todavía no existe**). El DM añade monstruos desde un selector
  del bestiario —con sus PG, su modificador de iniciativa y los personalizados—
  **por tandas**, así que un jefe nunca comparte iniciativa con sus esbirros. El
  DM ve `11/13`; los jugadores ven «malherido», no el número. **Arregla de paso**
  que las reglas de G4 no funcionaban contra monstruos: sin `conds` en la fila, un
  goblin derribado no daba ventaja a nadie. **Falta el plan y el código.**
- **FASE 2 — la «arena»**: el combate «más gráfico, tipo Pokémon» que pedí. Dos
  bandos enfrentados con retratos y barras de vida, menú de acciones tipo consola,
  y caja de texto narrando las tiradas **y por qué** (la app calcula la ventaja
  pero hoy no la explica). **Solo piel, cero reglas.** El reparto está maquetado,
  validado y descrito al final de ese mismo spec, junto con el dato que manda
  sobre él: hay **13 retratos de clase** pero **0 imágenes de monstruo**, así que
  los 124 irán con **icono + color por tipo de criatura** hasta que haya arte.
  **No empezar hasta haber jugado con la fase 1.**

Otras cosas en el backlog: ampliar la biblioteca de conjuros (32 y creciendo), los
**pozos de las 5 clases que faltan** (bardo, mago, pícaro, brujo, cazador de
sangre), el **bestiario a medias** (124 monstruos, solo CR 0–1/2), Fase P
(downtime + minijuegos), Fase Q (misiones con IA), C2 (regateo con Persuasión),
modo espectador/TV y los retratos de especie (`public/species/lineages/` vacío).

## Cómo trabajamos

- Rama feature por tarea → gate `npx tsc --noEmit` + `npx next build` (**no hay
  tests; ese es el gate real**) + los scripts que apliquen → commit por tarea →
  actualizar `HANDOFF.md` y el vault → merge a `master` y push.
- **Los 10 scripts de comprobación**: `check-ficha` (11), `check-spells`,
  `check-conjuros`, `check-targeting`, `check-estado`, `check-turno`,
  `check-ataque`, `check-clases` (116), `check-lore` (69), `check-clima`.
  (`check-tablero` se borró con el tablero.)
- Para features nuevas: **brainstorming → spec → plan → ejecución** con las skills
  de superpowers. Specs y planes en `docs/superpowers/{specs,plans}/`.
- **La capa pura y su script primero, la UI después.** Cada capa nueva
  (`lib/estado.ts`, `lib/turno.ts`, `lib/ataque.ts`, `lib/targeting.ts`,
  `lib/conjuros.ts`) es pura, fusiona `play_state` sin pisar las claves de las
  demás, y se verifica con un `scripts/check-*.ts`.
- Ejecutar los planes **con subagentes** (implementador + revisión por tarea) va
  bien: en esta sesión cazaron **cuatro fallos reales** que el gate no veía.
- Commits acaban con `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
  Autor `CarlosAlbertt` (Vercel bloquea otros emails). Con backticks en el
  mensaje, usar `git commit -F -` con heredoc, y **el bash tool** (el shell por
  defecto es PowerShell).
- **Nunca `git add -A` a ciegas**: añade los archivos que has tocado.
- Convención de contenido: las mecánicas y los nombres son hechos de la
  ambientación; **todos los blurbs y descripciones son redacción original en
  español**, nunca prosa de los libros. Herramienta de fans no oficial.
- `AGENTS.md`: este Next.js 16 tiene cambios rompedores. Ante dudas de API, lee
  `node_modules/next/dist/docs/`, no tires de memoria.

## Lecciones que me costaron caro, no las repitas

1. **Un error tragado disfraza el fallo.** `const { data } = await …` sin mirar
   `error` convirtió «falta una columna» en «no tienes personaje». Si algo
   desaparece, sospecha de la consulta antes que del dato, y **pídeme la consola
   del navegador**. (De ahí `schema_v21` y el `selectTolerante` de
   `lib/character.ts`.)
2. **El código y la migración aterrizan juntos.** Añadir una columna al `select`
   antes de ejecutar la migración rompe la app.
3. **Sobre-aplicar es peor que no aplicar.** En una app que impone reglas,
   quedarse corto es preferible. Y **revisa lo que devuelven los subagentes**: uno
   llegó a inventarse una condición para cuadrar un conteo mal puesto en un spec.
4. **No confundas dos estados distintos.** `loadActiveCharacter` devuelve `null`
   tanto si no hay ficha como si la consulta falló. Afirmar «no se ha podido
   cargar la ficha» a quien simplemente no tiene personaje es el mismo error de
   julio con otra cara.
5. **Una regla que vive en un componente escapa al gate.** El botón de «dos armas»
   nació muerto —contaba entradas del inventario en vez de cantidad, y la hoja
   fusiona los objetos del mismo nombre subiendo `qty`— y **pasó el gate en
   verde**, porque los scripts solo cubren funciones puras. Si es una regla, va a
   `lib/` con su script.
6. **`tsc` no ve un enlace muerto.** Al borrar `/tablero`, la hoja se quedó con un
   botón «Ir al tablero» que no llevaba a ningún sitio: una ruta no es un símbolo.
   Al borrar rutas, **grep de referencias**.
7. **Un comentario que se queda mintiendo se arregla**, no se deja ahí.
8. **La de esta sesión: construir seis cosas seguidas sin probar ninguna sale
   caro.** El tablero se tiró entero por eso.

Empieza leyendo `HANDOFF.md` y dime qué ves antes de proponer nada.
