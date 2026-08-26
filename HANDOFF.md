# HANDOFF — Exandria, compañero de campaña D&D

Estado del proyecto para retomar en una sesión nueva sin todo el historial.

## 🚦 ARRANQUE RÁPIDO (última actualización 2026-08-25, por la tarde)

> **LAS REGLAS DE LAS MISIONES YA NO VIVEN DENTRO DE LAS RUTAS.** Dos merges,
> los dos en `master` y desplegados. **Sin ninguna migración** y **sin cambio de
> comportamiento**: todo lo de esta tanda es la misma lógica en otro sitio, más
> el gate que la vigila. Último commit: `merge: entregar una mision es una sola
> regla, y el gate vigila el espejo`.
>
> ### El gate SIGUEN siendo 45 scripts
> No se añadió ninguno. Lo que crece es `check-misiones.ts`, que pasa de **291 a
> 330** comprobaciones. Si buscas dónde se vigila algo de misiones, está todo ahí.
>
> ### Qué se movió, y de dónde
> | Regla | Vivía en | Ahora |
> |---|---|---|
> | `esDelGrupo(tamano)` + `TAMANOS_DE_GRUPO` | `mision-dialogo/route.ts` | `data/misiones/types.ts` |
> | `poiDeMision(lugar)` sobre `esFranja` | `mision-dialogo/route.ts` | `data/misiones/index.ts` + `data/lugares.ts` |
> | `seAsignaAlAceptar(quest, ficha)` | `aceptar-encargo/route.ts` | `lib/misiones.ts` |
> | `motivoNoEntregable` + `RESPUESTA_NO_ENTREGABLE` | `entregar-mision/route.ts` **y** `opcionesDeMision` | `lib/misiones.ts` |
>
> ### ⚠️ EL GATE MIRA LOS DOS LADOS, Y ESA ES LA PIEZA QUE IMPORTA
> Sacar la regla a un módulo no sirve de nada si la ruta se queda con su copia.
> `check-misiones` lee el **TEXTO** de las cuatro rutas y exige dos cosas: que
> importen la regla y que **ya no lleven dentro** el literal que se les quitó.
> Es el mismo truco que ya se le hacía al `CatalogoPanel` con `TAMANOS`.
>
> Si alguna vez hay que volver a escribir una condición dentro de una ruta, el
> gate va a chillar **a propósito**. No se silencia: se mueve la regla.
>
> ### ⚠️ `esDelGrupo` y `seAsignaAlAceptar` NO se unifican, y no es un descuido
> Parecen la misma pregunta —«¿de quién es esta misión?»— y **no pueden serlo**:
> - `esDelGrupo` mira el `tamano` del CATÁLOGO (`data/misiones/`).
> - `seAsignaAlAceptar` mira una fila de `quests`, que **no tiene columna
>   `tamano`** (ver `schema_v12` + `schema_v24`): la escribió el DM a mano y el
>   catálogo no existe ahí. Usa el `npc_id` como marca.
>
> Dos entradas distintas, dos reglas. Juntarlas sería inventarse un dato que no
> está. Hay un check dedicado a **fijar la asimetría** para que nadie la
> «arregle». Si algún día `quests` guarda el tamaño, esto se replantea.
>
> ### El espejo, que es lo que se rompía en silencio
> Entregar una misión estaba escrito **dos veces**: en `opcionesDeMision` (lo que
> el navegador ENSEÑA) y otra vez a mano en la ruta (la PUERTA de verdad). Solo
> la primera la miraba el gate. Podían separarse sin que fallara nada, y el
> síntoma habría sido el peor: el jugador viendo «Está hecho: …» y el servidor
> negándoselo, o al revés.
>
> Ahora las dos preguntan a `motivoNoEntregable`, y el gate comprueba en cuatro
> estados que **la app ofrezca entregar exactamente cuando el servidor lo
> acepta**. La ruta sigue siendo la puerta: se comparte el criterio, no la
> confianza.
>
> Devuelve el MOTIVO y no un booleano porque la ruta necesita decir cuál de las
> tres falló (409, 409, 403 — «no es tuya» es permiso, no estado). El orden de
> las tres —estado, PNJ, dueño— decide qué mensaje lee el jugador y **está fijado
> por el gate**.
>
> ### Prueba de mutación: ocho roturas, ocho cazadas
> Commiteado antes de mutar, `git diff` para confirmar que se aplicaba, y
> restaurado. Las dos que más tranquilidad dan:
> - Volver `opcionesDeMision` a su criterio viejo → **tres** checks en rojo, uno
>   de ellos de los de antes de esta tanda.
> - Re-escribir una condición dentro de la ruta → el check de texto la caza.
>
> ### ⚠️ ESTO NO SE HA EJECUTADO NUNCA
> El gate compila y comprueba las reglas; **nadie ha aceptado ni entregado un
> encargo de verdad**. La extracción conserva las expresiones exactas —por eso se
> hizo así—, pero sin sesión y con la clave de servicio caducada no hay forma de
> ejercitar las rutas desde el repo. Si en mesa algo va raro con una misión de
> grupo o con una entrega, **empieza por ahí**.
>
> ### Y una tercera, que salió al ampliar la auditoría a los COMPONENTES
> `unlockCount` —cuánto saber desbloquea cada total: **10, 15 y 20**— vivía en
> `lib/loreRolls.ts`, que lleva `"use client"` y abre Supabase. **Ningún
> `check-*.ts` puede importar eso**, así que la regla no la miraba nadie. Se fue
> a `lib/saber.ts`, que es puro y que `check-lore` ya leía.
>
> ⚠️ **Y había una SEGUNDA copia que no se veía venir**: la pantalla le dice al
> jugador cuáles son los tramos y los tenía escritos **en la frase** («…más
> recuerdas (10, 15 y 20)»). Se cambia el tramo, el texto sigue prometiendo el
> viejo, y no falla nada. Ahora la frase se compone desde `CDS_SABER` y el gate
> comprueba que no vuelvan a escribirse a mano.
>
> Los tramos van en orden **descendente** a propósito: es lo que hace correcto el
> primer acierto de `unlockCount`. Reordenarlos metería el 20 en el tramo del 10.
> Hay check para eso. Mismos valores que antes: sin cambio de comportamiento.
>
> ### ✅ EL BOSQUE YA SE PUEDE JUGAR: 44 ENTRADAS DE 46
> Había **18 monstruos escritos en las tablas de encuentros que no se podían
> jugar** porque no tenían statblock: `jugablesDe` los descartaba en silencio.
>
> | Franja | Antes | Ahora |
> |---|---|---|
> | linde | 12/15 | **15/15** |
> | espesura | 6/21 | **19/21** |
> | corazón | 10/10 | 10/10 |
>
> Cobertura del Manual: **161 → 175 de 501**. Lotes `lote-11.ts` (los tres de la
> linde) y `lote-12.ts` (los once de la espesura).
>
> ### ⚠️ DOS DE LOS 18 NO ERAN BOCETOS, Y EXTRAERLOS HABRÍA DUPLICADO EL BICHO
> Antes de escribir una sola ficha se cruzaron los 18 contra lo ya extraído:
> - **«Worg»** ya tenía ficha, como **«Huargo»**.
> - **«Duende»** era el **Pixie**, también extraído.
>
> Los dos estaban en la tabla con el nombre INGLÉS mientras la ficha llevaba el
> español, y `jugablesDe` cruza por nombre EXACTO. Parecían faltar y no faltaban.
> La espesura subió de 6 a 8 jugables sin extraer nada.
>
> El check que faltaba ya está: **ningún `PENDIENTE` puede ser el `nameEn` de un
> monstruo con ficha**, y el mensaje dice cuál es. Las dos comprobaciones que
> había miraban el nombre ES, y el problema era justo que la tabla traía el
> inglés — por eso vivieron ahí meses.
>
> ### ⚠️ DOS NOMBRES QUE EL ÍNDICE CORRIGIÓ
> Se habrían escrito mal de fiarse del sentido común:
> - **«Sátiro Juerguista» = Satyr REVELMASTER**, no *Satyr Reveler*. Y no es un
>   sátiro de refuerzo: es **CR 6**, pega tres veces por turno y encanta.
> - **«Lobo Huargo» = Dire Wolf** (Apéndice A). El índice trae también un **Dire
>   Worg** (p. 335) y la elección no es obvia; se fue a Dire Wolf porque la nota
>   de la tabla dice «el lobo de la linde, pero grande» y el Huargo ya está como
>   entrada aparte. **Si la intención era el Dire Worg, se cambia con la p. 335.**
>
> ### El método, que es lo que evita inventarse datos
> **Las estadísticas son HECHOS y salen del libro; el nombre español y el blurb
> los pone quien extrae.** La capa OCR interleava las dos columnas y ya dio un CR
> falso (el Cíclope): se usa para LOCALIZAR, y la verdad es **la página
> renderizada** — `py` + `pypdfium2` a escala 2.5 → PNG → leer visualmente.
> **PDF = página del libro + 2.** Verificado con `py` 3.14.6 y `pypdfium2` 5.11.0.
>
> ### Dos reglas del gate que se aflojaron, y por qué no es hacer trampa
> Las dos eran **más duras que el libro**, y la única forma de pasarlas era
> inventarse datos:
> 1. **«toda ficha tiene al menos 1 acción».** El Hongo Chillón (CR 0) solo tiene
>    una REACCIÓN: grita cuando algo se acerca. Ahora vale acción, reacción,
>    adicional o legendaria; sin ninguna de las cuatro sigue fallando.
> 2. **«xp coincide con CR_XP».** El Manual pone **«CR 0 (XP 0; PB +2)»** al
>    Hongo, y la tabla dice 10. Comprobado a zoom antes de tocar la regla.
>    Abierto **solo en CR 0** y solo a esos dos valores.
>
> ### 🎯 LO QUE QUEDA: DOS, Y LOS DOS SON DECISIÓN TUYA
> - **Jabalí Gigante**: **no existe en el Manual 2024**. No está en el índice y
>   la sección de bestias va Boar → Brown Bear sin nada en medio. Se queda en
>   `PENDIENTES` con la razón al lado (decisión del usuario) para que nadie lo
>   vuelva a añadir sin saberlo. Sacarlo de otro libro rompe la regla de la casa.
> - **Duende Prodigioso** = **Pixie Wonderbringer (p. 244)**, localizado y sin
>   extraer: falta decidir cómo se llama en español. Su pariente ya extraído se
>   llama «Pixie», así que o se castellaniza esa ficha a «Duende» o el nuevo
>   entra como «Pixie Prodigioso».
>
> ### La auditoría de reglas escondidas, y lo que queda
> Se cruzaron los **78 módulos** que importan los 45 checks contra las 8 rutas y
> los 30 hooks. Resultado:
> - **Los 30 hooks están limpios.** `useChronicle` (168 líneas de quests) no
>   tiene ni una regla; `useInitiative` delega en `lib/combate`,
>   `useInventarioVivo` en `lib/derive`. La forma correcta ya estaba.
> - `descanso` y `dm/character` ya importaban sus reglas. Modelo a seguir.
> - **Lo único que queda sin dueño**: `slice(-21)` y `slice(-2)` en
>   `app/api/ia/route.ts` —cuánta conversación se le manda al modelo—. Números
>   mágicos, riesgo bajo, sin tocar.
>
> ### ⚠️ EL SQL DE `schema_v16:26` NO ERA UNA TAREA
> Se citó como PRUEBA de por qué un PNJ con `public = false` desaparece, y se
> ejecutó por error dando `42710: policy already exists` —inofensivo, la política
> ya estaba—. **No hay nada que ejecutar en Supabase.** El error confirmó el
> diagnóstico: `using (public or is_dm())` está activa, así que una fila con
> `public = false` no le llega al jugador.
>
> ### El «solo salía Cora», diagnosticado y a falta de confirmar
> **Es `public = false`, y `poi_name` queda DESCARTADO.** En `npcsDeNodo`
> (`lib/nodos.ts:236`) la rama de un nodo `sub:` filtra **solo** por
> `venue === nodo.id`: dentro del edificio `poi_name` no se mira. Un `poi_name`
> mal escrito rompería la plaza, nunca el interior. Como no salían en ninguno de
> los dos, solo lo explica la RLS escondiendo la fila entera.
>
> Falta que el usuario confirme cómo estaban los cuatro **antes** de tocarlos.
>
> ### ⚠️ EL CHECKBOX NO SE LLAMA «PÚBLICO»
> En Panel DM › PNJs pone **«Visible para los jugadores»**
> (`app/dm/NpcsPanel.tsx:128`). Y hay que pulsar **«Guardar» en cada tarjeta**:
> es un botón por PNJ, no uno global.
>
> ### Abrir pueblos al viaje: es el OJO del Mapa, y no hay nada que programar
> `Viajar` → `destinosDesde` (`lib/viaje.ts:97`) → `poi_state.revealed`. El
> interruptor es el ojo por POI de `app/dm/MapaPanel.tsx:305`, y **abre el
> destino para todos los jugadores**, no solo pinta el pin. Tres reglas que
> ahorran sustos: solo se viaja **desde la plaza** de un pueblo; **falla
> cerrado** (sin fila en `poi_state`, oculto); y **donde está el grupo se ofrece
> siempre**, revelado o no (la regla anti-ratonera).

## 🚦 Antes de eso (2026-08-25, la tanda de misiones)

> **LAS MISIONES YA EXISTEN DE VERDAD, Y LA APP AVISA.** Ocho merges sin
> registrar desde la entrada anterior —dos del 8 por la tarde, seis del 9 y uno
> del 25—. Todo en `master` y desplegado. **Sin ninguna migración.** Último
> commit: `merge: el catalogo de misiones, visible y abrible desde el Panel DM`.
>
> ### ⚠️ EL GATE SON 45, NO 43
> Se sumaron `scripts/check-avisos.ts` y `scripts/check-rastreo.ts`. Si algún
> documento dice 43 o 44, está viejo.
>
> ### Lo que hay ahora, en una tabla
> | Qué | Dónde vive |
> |---|---|
> | **15 misiones preparadas** con escenas, combates medidos y `body` para pegar | `data/misiones/` |
> | El **Panel DM › Catálogo**: verlas y abrirlas de un clic | `app/dm/CatalogoPanel.tsx` |
> | **17 figuras históricas** (Zan, los Drassig, Errevon, el Cónclave, Piedrablanca, el Consejo) | `data/figuras.ts` (prefijo `fig:`) |
> | **10 árboles de diálogo** con las 15 misiones repartidas | `data/dialogos.ts` |
> | Aceptar un encargo hablando **crea la fila** en `quests` | `app/api/mision-dialogo/route.ts` |
> | **Avisos (SILEO)**: qué se dice / cómo se pinta | `lib/avisos.ts` + `components/Avisos.tsx` |
> | Probador de avisos, DM-only | `app/dm/AvisosPanel.tsx` |
>
> ### ⚠️ EL REPARTO DE BYRODEN ES REAL, Y ANTES NO LO ERA
> `npcTemplates.ts` tenía **once PNJ inventados** —Mirna, Vell, Brannoc, Harn…—
> que **no existen en la partida**, y se escribieron once árboles de diálogo
> colgando de ellos. Se tiró todo y se rehízo con los CINCO de verdad, dictados
> por el usuario: **Silas Trumble** (alcalde, en negación), **Garrick Vance**
> (comandante, cicatriz de Thordak), **Elara Teje-Raíces** (sacerdotisa),
> **Cora Mano de Malta** (tabernera) y el **Viejo Yorick** (sepulturero). Más
> cinco nuevos para lo secundario: Nessa, Maela, Bram, Ashwen y el Guardián.
>
> **La lección: `data/` no es la partida.** Antes de escribir para un PNJ, mirar
> `location_npcs`, no las plantillas.
>
> ### ⚠️ ELARA ES LA LÍDER DEL CULTO AL SUSURRADO
> Y **no se la puede destapar hablando**: ninguna tirada, ningún «casi» (decisión
> del usuario). `check-dialogos` lo vigila por dos lados — una lista de palabras
> que nunca puede decir (`PALABRAS_PROHIBIDAS_ELARA`) y que **ninguna** de sus
> opciones lleve `chequeo`. Su única misión —el campanario— existe para mandar a
> los jugadores a la torre y tenerlos lejos del altar.
>
> ### La niebla devora-mentes está RESUELTA
> La cerraron los aventureros. En los diálogos aparece como pasado reciente y
> **nunca** como amenaza abierta. El pueblo acaba de salir de una y no se ha
> repuesto, que es distinto.
>
> ### Cuatro fallos mudos que se cazaron, y de dónde salieron
> - **`mision` de diálogo estaba muerto**: `resolver()` lo devolvía y
>   `DialogoArbol` lo tiraba. Se aceptaba un encargo, el PNJ decía que sí, y no
>   se creaba ninguna fila. Llevaba así desde que se escribió el campo.
> - **SILEO iba sin estilos**: la librería publica `sileo/styles.css` y **no la
>   inyecta sola**. Los toasts salían sin una sola regla y `tsc`, `next build` y
>   las 43 comprobaciones seguían en verde.
> - **`theme` de SILEO describe la PÁGINA, no el aviso**: sus rellenos son
>   `{ light: "#1a1a1a", dark: "#f2f2f2" }`, así que `theme="dark"` daba un aviso
>   BLANCO. El color va explícito: `options={{ fill: "#131b25" }}`.
> - **`check-lugares` contaba CABEZAS** («cada sitio trae DOS»), calco del
>   reparto inventado. Ahora comprueba que esté QUIEN tiene que estar, por
>   nombre.
>
> ### `npcsDeNodo` es EXCLUYENTE, y explica el «solo sale Cora»
> **Sin `venue` se ve en la plaza; con `venue`, solo dentro del edificio.** No
> existe «en los dos». `seedNpcs` le ponía `venue` a todo lo que sembraba, así
> que los cinco quedaban escondidos cada uno en su edificio. Se añadió
> `NpcTemplate.enLaPlaza` (los cinco importantes en la plaza, los secundarios
> dentro) y el gate lo vigila.
>
> ### ⚠️ LO QUE TIENE QUE HACER EL USUARIO A MANO
> 1. **Panel DM › PNJs**, para Silas, Garrick, Elara, Cora y Yorick: sitio → «En
>    Byroden (el pueblo entero)», árbol → su clave (`silas`, `garrick`, `elara`,
>    `cora`, `yorick`), y **Público** marcado. Sus filas ya existían y
>    `puedeSembrar` no siembra encima, así que esto no se puede automatizar.
> 2. **Sigue sin explicarse** por qué los otros cuatro no aparecían **ni dentro
>    de su edificio**. Apunta a `public: false` o a un `poi_name` que no sea
>    exactamente `Byroden`. Se ve de un vistazo en ese panel.
> 3. Las de siempre: **abrir pueblos al viaje** (ojo del Mapa) y **cabeceras
>    16:9**.
>
> ### ⚠️ NO SE PUEDE CONSULTAR SUPABASE DESDE EL REPO
> La `SUPABASE_SERVICE_ROLE_KEY` de `.env.local` devuelve **«Invalid API key»**
> (es de julio). Cualquier duda sobre qué hay en las tablas se resuelve mirando
> el Panel DM, no con un script.
>
> ### La tanda está COMPLETA: las cinco piezas
> 1. Aceptar un encargo hablando crea la fila en `quests`.
> 2. Avisos con SILEO, con color por materia y negritas.
> 3. Diez árboles de diálogo con las quince misiones repartidas.
> 4. **Buscarse la vida**: seis misiones se encuentran mirando.
> 5. Panel DM › Catálogo: verlas y abrirlas de un clic.
>
> ### Buscarse la vida (`lib/rastreo.ts` + `RastreoSection`)
> **Seis de las quince** llevan `descubrimiento` —pericia, CD y el texto de lo
> que se ve— y se encuentran con **Percepción, Perspicacia o Supervivencia** sin
> que nadie las encargue. Las otras nueve siguen necesitando un PNJ, y eso es lo
> que mantiene a los PNJ en el centro: si todas fueran descubribles, hablar sería
> opcional.
>
> ⚠️ **No es `SaberRoll`.** Aquella es Historia/Arcanos/Religión y devuelve lo
> que tu personaje RECUERDA; esta devuelve lo que hay AHÍ DELANTE. El gate exige
> que la pericia sea de las tres de buscar, justo para que no se confundan.
>
> Cuatro decisiones que parecen detalles y no lo son: un `sub:` **hereda** lo de
> su pueblo (si no, entrar en la taberna hacía desaparecer lo que se ve desde la
> plaza); la sección **se enseña siempre**, haya algo o no (si solo saliera
> cuando queda algo, su presencia sería el spoiler); **una tirada por pericia y
> sitio**, guardada en `play_state`; y los rastros se calculan **después** de
> tirar, o dos pestañas encuentran lo mismo dos veces.

## 🚦 Antes de eso (2026-08-08, el corazón)

> **EL CORAZÓN DEL BOSQUE YA TIENE MONSTRUOS.** Dos merges, los dos en `master`
> y desplegados. **Sin migración.** Último commit: `merge: el corazon del bosque
> ya tiene monstruos jugables`.
>
> ### Lo que estaba roto y ya no
> `jugablesDe("corazon")` devolvía **un array vacío**: diez entradas escritas y
> ninguna con statblock, así que en el fondo del bosque no se podía sacar un
> combate de la tabla. Ahora son **10 de 10** y la cobertura del manual sube de
> 151 a **161 de 501**.
>
> | Pieza | Dónde vive |
> |---|---|
> | El gate: **toda franja necesita 5 jugables** | `scripts/check-bosque.ts` |
> | Los diez statblocks del corazón | `data/bestiary/lote-10.ts` (+ índice) |
> | Los diez fuera de `PENDIENTES` | `data/bosque.ts` |
>
> ### El gate, y por qué cuenta fichas y no dificultad
> Las dos líneas que había miraban `jugablesDe` de la linde y de la espesura, una
> a una y con `> 0`, **y se dejaban el corazón fuera** — justo la franja rota.
> Ahora el bucle recorre `ESPERADAS`, así que **una franja nueva entra sola**.
> El mínimo es 5 porque son cinco o seis jugadores y con uno solo la franja no es
> una tabla, es el mismo encuentro repetido. Se pensó y **se descartó** exigir
> además un jugable dentro de la banda de la franja: dejaría **la espesura en
> rojo sin salida a corto plazo** (su máximo real es CR 2 y no tiene nada
> extraído entre 5 y 8). La banda es techo, no suelo; el peso lo pone el número
> de bichos y de eso se encarga `XP_BUDGET`.
>
> ### ⚠️ Las bandas estaban mal apuntadas, y se han corregido
> `check-bosque.ts` decía «linde 2-3, espesura 5-7 y corazón 10-15» y **el
> usuario las corrigió: son 1-3, 5-8 y 9-15**. El desajuste no era inocente: con
> el corazón escrito en 10-15, **ninguno de los diez que lo habitan llegaba a su
> propia banda**, porque el más gordo es el Ent con CR 9. `TECHO_CR.espesura`
> sube de 7 a 8; los otros dos ya coincidían. **El suelo del corazón se queda en
> CR 1** y no sube a 9: echaría a nueve de los diez.
>
> ### ⚠️ Los tres nombres «inventados» quedan CONFIRMADOS
> Triceratops, Cíclope Centinela y Tiranosaurio Rex **no cambian**. El Manual es
> el inglés, así que del PDF no sale ningún nombre español: el ES lo pone siempre
> quien extrae, y los tres traducen bien `Triceratops`, `Cyclops Sentry` y
> `Tyrannosaurus Rex`. **Lo que sí salió torcido fue la capa OCR**, que daba
> «CR 5» para el Cíclope cuando es **CR 6** (XP 2.300; PB +3). Las ocho páginas
> se leyeron renderizadas, que es la única fuente que vale.
>
> ### CR reales de la franja, para calibrar encuentros
> Ent 9 · Tiranosaurio Rex 8 · Centauro Guardián 7 · Oso Lechuza Primigenio 7 ·
> Cíclope Centinela 6 · Unicornio 5 · Triceratops 5 · Bruja Verde 3 · Centauro
> Soldado 2 · Cría de Dragón Verde 2.
>
> ### Cómo está cada franja
> Linde 15 entradas / **12 jugables**; espesura 21 / **6** (pasa el gate por uno,
> y es la siguiente que pide extracción); corazón 10 / **10**. Quedan **18
> pendientes**, quince de ellos de la espesura.
>
> ### Lo que sigue sin verse en la app con datos
> Igual que ayer: `/lugar` y `/dm` están detrás del proxy de auth y **sin sesión
> todo redirige a `/login`**. Nada de esto se ha mirado renderizado con datos
> reales. Y siguen pendientes a mano: **abrir pueblos al viaje** (Panel DM ›
> Mapa, el ojo de cada pueblo — sin ninguno revelado nadie puede viajar) y
> **subir ilustraciones de cabecera** 16:9.

## 🚦 Antes de eso (2026-08-08, cierre)

> **TODO LO DE ESE DÍA ESTÁ EN `master` Y DESPLEGADO.** Ocho merges. **Sin ninguna
> migración**: todo lo nuevo vive en `characters.play_state`, que es `jsonb`.
> Último commit: `merge: el mapa suma lo que conoce cada jugador`.
>
> ### ✅ Las tres migraciones están ejecutadas
> El usuario confirmó el 2026-08-08 haber corrido `v24`, `v25` y `v26`. **No queda
> nada pendiente en Supabase.** Si algo falla en misiones individuales,
> sub-lugares o diálogos, **no es la migración**.
>
> ### ⚠️ LO PRIMERO QUE HAY QUE ARREGLAR — **YA RESUELTO, ver la entrada de arriba**
> **El corazón del bosque no tiene NI UN monstruo jugable.** Diez entradas
> escritas y **ninguna con statblock**, así que `jugablesDe("corazon")` devuelve
> vacío: ahí no puede haber un combate sacado de la tabla, y **nada lo avisa**.
> La espesura está justo (6 de 21); la linde va sobrada (12 de 15).
> Plan: `docs/superpowers/plans/2026-07-13-bestiario-2024.md`.
> ⚠️ Tres de los diez —**Triceratops, Cíclope Centinela, Tiranosaurio Rex**— se
> pidieron en inglés y **los nombres ES los puse yo**. Si al extraerlos salen con
> otro nombre, cambiarlos **en `ENCUENTROS_VERDANTE` Y en `PENDIENTES`**, o el
> gate los tratará como inventados. Va avisado en `data/bosque.ts`.
>
> **Y sería muy sano añadir un gate**: que toda franja tenga al menos N monstruos
> jugables. Hoy el corazón está a cero y ninguna de las 43 comprobaciones lo dice.
>
> ### Lo que se hizo hoy, en una tabla
> | Qué | Dónde vive |
> |---|---|
> | `/lugar` con la hoja de pergamino y **tema por sitio** (4 pieles × 15 tokens) | `app/globals.css`, `data/lugares.ts`, `app/lugar/page.tsx` |
> | La **ventana** de diálogo, retrato cuadrado, d20 girando | `NpcSection.tsx`, `DialogoArbol.tsx` |
> | **Posición por jugador** y viaje entre pueblos revelados | `lib/nodos.ts`, `lib/viaje.ts`, `components/lugar/Viajar.tsx` |
> | **Reloj por jugador** (desfase por ficha) | `lib/useRelojJugador.ts`, `lib/tiempoDescanso.ts` |
> | **Revelar a un jugador** y no al grupo | `lib/revelado.ts` |
> | El **bosque** con las tres franjas y la piel que se cierra | `data/bosque.ts`, `Vereda.tsx`, `RastrosBosque.tsx` |
> | **Panel DM** por familias + portada | `app/dm/DmDashboard.tsx`, `app/dm/ResumenPanel.tsx` |
> | El **XP a quien marques** | `app/dm/GrupoPanel.tsx` |
>
> ### Las cinco reglas puras nuevas, y por qué están fuera de los hooks
> `lib/viaje.ts`, `lib/revelado.ts`, `lib/tiempoDescanso.ts`, `sanearSitio` y
> `ubicacionDeNodo` (en `lib/nodos.ts`). **Todas salieron de dentro de un hook o
> de una ruta**, porque ahí no llega ningún gate. Es la lección de `puedeSembrar`
> y ya van diez veces. Si tocas una regla de estas, **el gate tiene que verla**.
>
> ### Tres invariantes que NO se deben deshacer
> 1. **Sin `sitio` no hay `desfase`.** Volver con el grupo es volver a su hora. Un
>    desfase huérfano deja a alguien ocho horas adelantado **sentado en la misma
>    plaza que los demás**, y eso se lee como que la app miente.
> 2. **La anti-ratonera**: donde está el grupo se ofrece SIEMPRE como destino,
>    revelado o no. Sin ella, revelar Emon y no Byroden dejaba **encerrado** a
>    quien viajara a Emon.
> 3. **La ubicación se RESUELVE, no se copia.** `useMiUbicacion` es la única
>    fuente: la copió `/lugar` y el pin de la barra se lo inventó, y durante un
>    rato la barra decía «Byroden» mientras la pantalla decía «Syngorn».
>
> ### Cuatro fallos que salieron solos al trabajar, y que ya estaban
> - **El reloj se sumaba una vez por cada jugador**: cinco descansando juntos se
>   comían **cuarenta horas** de golpe. Nadie lo veía porque el reloj corre solo.
> - **El que descansaba solo adelantaba a los demás** ocho horas.
> - **El freno del descanso largo era del grupo**: quien se iba solo a Emon no
>   podía descansar porque sus compañeros habían descansado en Byroden.
> - **`useSitio` era el único hook con el canal de realtime sin aleatorizar**, y al
>   meterlo en la barra de navegación dos instancias chocaban en el mismo topic.
>
> ### ⚠️ SIGUE SIN VERSE EN LA APP CON DATOS
> `/lugar` y `/dm` están detrás del proxy de auth: **sin sesión todo redirige a
> `/login`**, así que nada de esto se ha mirado renderizado con datos reales. Lo
> que sí se comprobó va en la entrada de la mañana (banco de CSS con estilos
> computados). **Truco que funciona**: recortar el bloque de `globals.css`, pegarle
> el marcado de los componentes y servirlo desde `public/` —que no pasa por el
> proxy—, medir con `javascript_tool`, y **borrar el HTML al terminar**.
>
> ### Lo que el usuario tiene que hacer a mano
> 1. **Abrir pueblos al viaje**: Panel DM › Mapa y pueblos, el **ojo** de cada
>    pueblo. **Sin ninguno revelado nadie puede viajar** — la sección lo explica,
>    pero no hay caminos.
> 2. **Subir ilustraciones de cabecera** (16:9, 1920×1080). No hay ninguna, así que
>    todos los sitios salen con el cielo del tema y su silueta.
> 3. Decidir el tema de los pueblos que no son Byroden ni Emon (`TEMA_POR_POI`).
>    El **`yermo` está dibujado y no lo usa nadie**.

## 🚦 Antes de eso (2026-08-08, noche)

> **EL RELOJ VA POR JUGADOR, Y LA TANDA ESTÁ COMPLETA.** Rama
> `feat/reloj-por-jugador`. Piezas 3 y 4 del plan
> `docs/superpowers/plans/2026-08-08-posicion-por-jugador.md`. **Sin migración.**
>
> `useRelojJugador` = el reloj del grupo **+ el desfase de esta ficha**. Lo usan
> los cinco sitios que pintan la hora, el cupo del caldero y el descanso.
> **El reloj sigue siendo UNO**: no hay cinco filas en `app_config`, hay la del
> grupo (del DM) y un desfase por ficha encima. El DM no tiene ficha, así que ve
> la del grupo — su reloj es el ancla.
>
> ### ⚠️ SALIERON DOS FALLOS QUE YA ESTABAN EN PRODUCCIÓN
> Los dos vivían dentro de `/api/descanso`, pegados a los `upsert`, **donde
> ningún gate llegaba**. Aparecieron al sacar la regla a `lib/tiempoDescanso.ts`.
>
> 1. **El reloj se sumaba UNA VEZ POR CADA UNO.** Cinco jugadores descansando
>    largo juntos son cinco llamadas, y cada una hacía `epochGameMin = ahora +
>    480`: **el grupo se comía cuarenta horas por una noche.** No lo veía nadie
>    porque el reloj corre solo y nadie lo mira dos veces. Desduplicado con
>    `app_config.ultimo_avance_descanso`.
> 2. **El que descansaba solo adelantaba a los demás.** Un jugador en Emon les
>    metía ocho horas a los cuatro de Byroden sin que hubieran hecho nada.
>
> Ahora: **con el grupo mueve el reloj compartido; por tu cuenta, solo tu
> desfase.**
>
> ### El freno del descanso largo se fue a la ficha
> Vivía en `app_config.last_long_rest`, **del grupo**: quien se iba solo a Emon
> no podía descansar porque sus compañeros habían descansado en Byroden, y el
> mensaje se lo decía tal cual. Ahora `play_state.ultimoLargo`, medido en **su**
> hora (con el desfase dentro) — contra la del grupo le duraría de más, que es
> justo el castigo que esto quita. **La clave compartida queda abandonada**: no
> se borra de `app_config`, simplemente ya no se lee.
>
> ### Una simplificación aceptada, y va dicha
> `PartyLocationWidget` se queda con la hora **del grupo** a propósito: trata de
> dónde está el grupo, no de dónde estás tú. Y el `tallerCupo` que se guarde
> lleva el desfase dentro, así que al volver con el grupo —donde el desfase se
> borra— el cupo dura un poco más de lo apuntado. Es la misma simplificación que
> hace que el viaje de vuelta no se cobre, y el error va hacia no castigar.
>
> ### El gate: 43 (uno nuevo), y CUATRO mutaciones
> `check-descanso` nuevo, **34 comprobaciones**, con una por cada uno de los dos
> fallos de arriba. Las cuatro mutaciones, verificadas con `git diff` antes de
> correr y todas cazadas: reintroducir las 40 h (3 fallos), que el que duerme
> solo arrastre a los demás (4), fallar cerrado y culpar al grupo (5), y sellar
> el freno con la hora del grupo en vez de la propia (3).

## 🚦 Antes de eso (2026-08-08, tarde)

> **CADA JUGADOR ESTÁ DONDE ESTÁ.** Uno en Emon y otro en Byroden, a la vez.
> Rama `feat/posicion-por-jugador`, **pusheada y SIN MERGEAR**. Siete commits.
> **Sin migración** — es la misma columna `play_state`.
>
> El plan, con las siete decisiones del usuario y su motivo:
> `docs/superpowers/plans/2026-08-08-posicion-por-jugador.md`.
>
> ### ⚠️ VA EN DOS TANDAS, Y LA SEGUNDA ESTÁ SIN HACER
> Esta tanda hace las piezas **1, 2, 5, 6 y 7**. Faltan la **3 y la 4**:
> encender el reloj por jugador. **El `desfase` ya se guarda y se acumula**, con
> su invariante vigilada por el gate; lo que falta es **quién lo lee**.
>
> La razón de partirlo la destapó el propio plan: **el desfase es transitorio por
> diseño.** Lo que el jugador se anduvo caduca al mover al grupo, y al caducar el
> `sitio` se borra el `desfase`, así que solo vive entre «me largo a Emon» y «el
> DM mueve al grupo». Es mucha maquinaria —`/api/descanso` con `service_role`, el
> cupo del taller, la crónica— para un estado diseñado para no durar.
>
> **Mientras tanto viajar es gratis e instantáneo**, y se puede ir y volver de
> Emon sin coste. El coste se enseña («6 h 30 de camino») pero no se cobra.
>
> ### Lo que hay que tocar para encender la tanda 2
> `useGameClock` tiene **once consumidores**. Tres no son decoración:
> `app/api/descanso/route.ts`, `components/taller/Caldero.tsx` +
> `lib/recetario.ts` (el cupo cuenta días de juego) y `useChronicle`.
> ⚠️ Y **`/api/descanso` guarda el anti-abuso del descanso largo en
> `app_config.last_long_rest`, compartido** («El grupo ya ha descansado hace
> poco»): con relojes por jugador eso pasa a estar mal y hay que volverlo por
> ficha. El usuario ya decidió que el desfase **sí** afecta a la mecánica.
>
> ### El estado nuevo, sin migración
> ```ts
> play_state.sitio = { nodo, desde, puesto?: "dm" }  // el del DM NO caduca
> play_state.desfase?: number                        // minutos viajando
> ```
> ⚠️ **INVARIANTE: sin `sitio` no hay `desfase`.** Volver con el grupo es volver
> a su hora. Un desfase huérfano dejaría a alguien adelantado ocho horas
> **sentado en la misma plaza que los demás**, y eso no se lee como un fallo: se
> lee como que la app miente. Se escriben juntos, se ignora al leer, y el gate lo
> vigila por las dos vías.
>
> ### Los siete commits
> | Pieza | Qué |
> |---|---|
> | plan | Las siete decisiones, con su motivo |
> | 1 | `Sitio.puesto`, `ubicacionDeNodo`, `lib/viaje.ts`, gate 42 nuevo |
> | 2 | `/lugar` con la ubicación **efectiva** |
> | 5 | «Ponerse en camino» en `/lugar` |
> | XP | **El XP va a quien marques**, no solo a uno o a todos |
> | 6 | Panel DM › Grupo: plantar a cada jugador y traérselo |
> | 7 | `sanearSitio` sale del hook para que el gate la vea |
>
> ### Tres decisiones de diseño que conviene no deshacer
> 1. **Viajar NO es una arista del grafo**, y por eso vive en `lib/viaje.ts` y no
>    en `lib/nodos.ts`. `puedeIr` pregunta «¿hay camino?»; viajar pregunta «¿lo
>    ha revelado el DM?». Como arista habría obligado a reconstruir el grafo con
>    cada pin y a que `check-lugares` tratara media docena de pueblos como
>    salidas de Byroden.
> 2. ⚠️ **LA ANTI-RATONERA: donde está el grupo se ofrece SIEMPRE, revelado o
>    no.** `poi_state` solo tiene fila para lo que el DM ha tocado, así que sin
>    fila no está revelado; si el DM revelaba Emon y no Byroden, quien viajara a
>    Emon **se quedaba encerrado**. Es lo mismo que `check-lugares` vigila con
>    «todo nodo al que se puede entrar tiene por dónde salir».
> 3. **La ubicación se RESUELVE, no se copia.** Guardar continente y región en la
>    ficha sería una segunda fuente que se desincroniza en cuanto el DM mueva un
>    POI — el fallo de `regionEntries()`. Se puede buscar por nombre porque
>    **el nombre de POI es único en todo el mundo y ya hay gate que lo exige**.
>
> ### El gate: 42 (uno nuevo), y SEIS mutaciones
> `tsc` limpio, `next build` limpio, los 42 en verde. `check-viaje` nuevo con
> **74 comprobaciones**. Las seis mutaciones, todas verificadas con `git diff`
> antes de correr el gate y todas cazadas:
>
> | Se rompió | Falló |
> |---|---|
> | El desfase sobrevive sin sitio | 2 |
> | Cualquier `puesto` cuenta como `"dm"` | 3 |
> | Quitar la anti-ratonera | 5 |
> | Lo del DM vuelve a caducar | 3 |
> | Todo POI resuelve a la misma región | 4 |
> | Quitar el suelo del viaje | 3 |
>
> **`sanearSitio` tuvo que salir de `useSitio` para poder mutarla**: una regla
> dentro de un hook no la mira ningún gate. Es la lección de `puedeSembrar`, y
> van nueve.
>
> ### ⚠️ SIN VER EN LA APP, otra vez
> `/lugar` está detrás del proxy de auth y sin sesión redirige a `/login`. Lo
> primero que hay que probar con sesión: revelar Emon en Panel DM › Mapa, que
> aparezca «Ponerse en camino», viajar, y comprobar que en Emon salen **su**
> clima, **su** región y **sus** tienda/posada/tablón/saber.

## 🚦 Antes de eso (2026-08-08, mañana)

> **EL REDISEÑO DE `/lugar` ESTÁ CONSTRUIDO.** Rama `feat/lugar-con-arte`,
> **pusheada**, cinco commits, uno por pieza. **Sin migración nueva.**
>
> ### ✅ LAS TRES MIGRACIONES YA ESTÁN EJECUTADAS
> El usuario confirmó el **2026-08-08** haber corrido `schema_v24.sql`,
> `v25.sql` y `v26.sql`. **Ya no hay nada pendiente en Supabase**, así que si
> algo falla en misiones individuales, sub-lugares o árboles de diálogo, **no
> es la migración**: hay que depurarlo de verdad.
>
> ### ⚠️ LO PRIMERO: ESTO NO SE HA VISTO EN LA APP VIVA
> `/lugar` está detrás del proxy de auth y **sin sesión redirige a `/login`**,
> así que la pantalla real no se ha mirado con datos. Lo que **sí** se comprobó,
> y no es lo mismo:
>
> - El servidor de dev arranca y sirve `/lugar` sin errores de compilación.
> - **Un banco de pruebas del CSS**: se recortó el bloque de `/lugar` de
>   `globals.css` tal cual, se le pegó el marcado que producen los componentes
>   y se midieron los estilos computados en escritorio y en móvil (375). Salió:
>   los cuatro temas resuelven juegos de tokens distintos, la hoja es
>   `#f4ead1` con tinta `#3b2c1b`, el medallón mide 172 con la imagen a 158
>   dentro, la capitular flota a 90 en gótica, la puerta tiene los 82 de
>   sangrado y su lacre de 40 **sin miniatura**, la ventana es fila con la
>   izquierda a 356 y el retrato a 312, la viñeta es `❧`, el calderón `¶`, el
>   d20 gira con `lug-girar`, y **en móvil** el retrato baja a 95 y se pone al
>   lado del nombre, sin desborde horizontal. Cero errores de consola.
> - El banco era de usar y tirar: **no está en el repo**.
>
> **Lo que queda por ver con ojos**: cómo queda con una ilustración de cabecera
> de verdad subida (no hay ninguna todavía) y la costura entre la hoja clara y
> la mesa oscura de abajo.
>
> ### Las cinco piezas, y qué hace cada una
> 1. **`app/globals.css`** — `.tema-valle`, `.tema-ciudadela`, `.tema-yermo`,
>    `.tema-bosque` con **quince tokens** cada uno (hoja, tinta, acento, metal,
>    natura, cielo) y todos los estilos de la hoja y la ventana. Con prefijo
>    `lug-`/`pnj-`: el boceto usa `.grid`, `.body`, `.row`, que pisarían
>    utilidades de Tailwind sin dar ningún error.
> 2. **`data/lugares.ts`** — `TemaLugar`, el registro `TEMAS` con la **silueta
>    de horizonte** de cada tema, `TEMA_POR_POI`, `esTema` y `Nodo.tema`
>    **obligatorio**, siempre resuelto por `construirNodos`.
> 3. **`app/lugar/page.tsx`** + `Salidas.tsx` — cabecera a sangre, hoja a todo
>    ancho, capitular, prosa a dos columnas, rótulos en cinta y puertas con
>    lacre. `Panel DM › Lugares` gana el desplegable de tema.
> 4. **`NpcSection.tsx`** + `DialogoArbol.tsx` — la ventana emergente con
>    retrato cuadrado, y el **d20 girando** mientras el tablero 3D tira.
> 5. **`scripts/check-lugares.ts`** — de 175 a **281 comprobaciones**.
>
> ### SEIS DECISIONES QUE SE TOMARON SIN PREGUNTAR
> El usuario dijo «ponte ya con todo, no preguntes nada». Van declaradas porque
> **todas son revocables en un commit pequeño**:
>
> | Decisión | Por qué | Cómo se revoca |
> |---|---|---|
> | **Hay CUATRO temas, no tres** (se añadió `bosque`) | Las tres franjas de la Verdante son nodos que YA existen y sin él llevarían la piel de otro sitio. `ARTE-IMAGENES.md` ya lo especificaba | Quitar la entrada de `TEMAS`, su bloque CSS y darle otra piel a las franjas |
> | **`Nodo.imagen` es la CABECERA, no una miniatura** | Es lo que hace el boceto. En una lista de seis, la ilustración competía consigo misma | Devolver el `<img>` a `Salidas.tsx` |
> | **Tienda, posada, tablón y saber se quedan DEBAJO de la hoja**, en la mesa oscura | No están rediseñados y son paneles oscuros con texto claro: dentro del pergamino quedarían ilegibles. **Esta tanda no los toca** | Rediseñarlos y subirlos dentro de `.lug-dentro` |
> | **`NpcChat` gana una prop `pergamino`** | Lo comparte con el tendero de `ShopSection`, que sigue oscuro. Sin ella la conversación salía texto claro sobre papel claro | Rediseñar la tienda y quitar la prop |
> | **El scrim va a `z-60`, no al 250 del boceto** | La pila ya está repartida: nav 50, modales 60, peticiones 70, **tablero de dados 80**, EpicOverlay 100. A 250 la ventana tapaba el tablero y, como la tirada se lanza PULSANDO el dado, la conversación se quedaba colgada | — (esto no se revoca, es un fallo evitado) |
> | **`Panel DM › Lugares` gana selector de tema** | Es lo único que hace **alcanzable el yermo**: ningún nodo de la semilla lo declara | Quitar el `<select>` |
>
> ⚠️ **El `yermo` está dibujado y no lo usa nadie todavía.** No hay nodo de
> ruinas en la semilla; solo se llega a él poniéndolo a mano desde el panel.
>
> ### El gate: 41 en verde, y SIETE mutaciones
> `tsc` limpio, `next build` limpio (exit 0 comprobado **sin pipe**, que ahí es
> donde `head` te devuelve su código y no el del compilador), los 41 `check-*`
> en verde. `check-lugares` pasa de 175 a **281**.
>
> **Lo que muerde, y es lo de siempre — el fallo que no grita**: un tema que no
> existe **no da ningún error**. La clase `tema-loquesea` no casa con ninguna
> regla, la hoja se queda **sin los quince tokens**, `var(--hoja)` no resuelve,
> el fondo se vuelve transparente y asoma la app oscura por debajo con la tinta
> parda encima. Se lee fatal y nadie se enteraría.
>
> Las siete mutaciones, todas **verificadas con `git diff` antes de correr el
> gate** y todas cazadas:
>
> | Se rompió | Falló |
> |---|---|
> | `TEMA_POR_POI.Emon` → `"ciudadella"` | 6 comprobaciones |
> | Quitar `--natura` de `.tema-yermo` | `.tema-yermo define --natura` |
> | Renombrar la regla `.tema-bosque` | 16 (la regla + sus quince tokens) |
> | Quitar el seto del `tema` en `aplicarOverride` | 3 |
> | Las franjas a `tema: "valle"` | las tres franjas |
> | `esTema` con `x in TEMAS` en vez de `hasOwnProperty` | `no acepta un método heredado de Object` |
> | Vaciar la silueta del valle | 2 |
>
> **La sexta es la que enseña algo nuevo**: con el operador `in`, un
> `tema: "toString"` en el JSON del DM **habría pasado el seto**, porque
> `"toString" in TEMAS` es `true` por la cadena de prototipos. Por eso el guarda
> usa `Object.prototype.hasOwnProperty.call`, y por eso hay una comprobación que
> lo vigila.
>
> **Y una nota de proceso que funcionó**: se commiteó **antes** de cada
> mutación. `git checkout --` durante la tanda anterior borró `puedeSembrar`
> porque aún no estaba commiteada, y esta vez no pasó.

## 🚦 Antes de eso (2026-08-07, tarde)

> **LA DIRECCIÓN VISUAL DE `/lugar` ESTABA APROBADA Y SIN CONSTRUIR.** Esta es
> la entrada que describe el diseño; **lo construido está arriba**.
>
> ### Lo que se decidió sobre el aspecto, y costó SEIS iteraciones
> No se rediseña a ciegas: **boceto primero**, en `docs/bocetos/`, y se enseña.
> El recorrido, para no repetirlo:
>
> | Boceto | Qué era | Veredicto |
> |---|---|---|
> | `-lugar-rediseno` | A Estampa · B Grabado · **C Códice** | **elige C** |
> | `-codice-y-dialogo` | C + ventana con retrato a la izquierda | bien, pero «la tirada va con los dados que ya hay» |
> | `-codice-fantasia` | más pergamino, sin teclear tiradas | «mezcla fantasía con medieval, más decoración» |
> | `-iluminado` | gótica, rúbrica, orlas, lacre | «**muy oscuro**, más light fantasy» |
> | `-pergamino` | **hoja clara, tinta parda, rojo de rúbrica** | va bien |
> | `-temas` | pantalla entera + **tema por sitio** | «**muy soso**» — eran degradados de relleno |
> | **`-lugar-con-arte`** | lo mismo **con los retratos reales dentro** | **es la buena** |
>
> **La lección**: los bocetos parecían sosos porque los fondos eran degradados.
> **Lo que hace bonita la pantalla es la ilustración, no el marco.** No sigas
> puliendo marcos sin arte dentro.
>
> ### Lo aprobado, en concreto
> - **Pergamino claro** («light fantasy»): la hoja es el fondo (`#f4ead1`), el
>   texto es tinta parda y el acento es **rojo de rúbrica**. La app sigue oscura
>   por fuera —la mesa— y `/lugar` es la hoja encima.
> - **A pantalla completa**, no una columna estrecha.
> - **Tema por sitio.** El nodo declara su `tema` y de ahí salen cielo, silueta,
>   metal (**oro** en el valle, **plata** en la ciudadela) y acento. **La maqueta
>   no cambia: cambia la piel.** Temas dibujados: `valle` (Byroden),
>   `ciudadela` (Emon), `yermo` (ruinas).
> - **Decoración**: capitular iluminada, filete trenzado con roseta, rótulos en
>   cinta, **sellos de lacre** en las puertas, viñeta ❧ por opción, calderón ¶.
>   Todo CSS y SVG en línea, **cero imágenes**.
> - **Diálogo en ventana**: retrato **CUADRADO** enmarcado + conversación. En
>   móvil el retrato se hace pequeño y va al lado del nombre.
> - **La tirada NO se teclea**: `rollVisual` lanza en el tablero y la ventana
>   enseña un d20 girando. El campo manual solo si no hay WebGL.
>
> ### El arte: `docs/ARTE-IMAGENES.md`
> ⚠️ **La primera versión de esa spec estaba MAL en casi todo** y por eso la
> primera imagen que generó el usuario salió fea. Se corrigió mirando
> `CarlosAlbertt/Eranol-APP` (`public/img/npcs/`), que es la referencia buena:
>
> | Decía | Es |
> |---|---|
> | 2:3 vertical | **1:1, 1024×1024** |
> | gouache de cuento | **pintura digital semirrealista** (D&D/MTG) |
> | «acuarela» | **óleo digital SIN NINGUNA línea de tinta** ← la palabra «acuarela» traía el entintado |
> | cintura para arriba | **busto**, la cara llena el cuadro |
> | fondo neutro | **el sitio donde está**, pintado y desenfocado |
> | (nada de luz) | **luz dramática de antorcha**, contraste marcado |
>
> **Ya hay dos retratos buenos** en `public/npcs/`: `silas_trumble.webp`
> (escribano) y `elara_teje_raices.webp` (herborista). Los originales están en
> `C:\Users\carlo\Pictures\NPCs\Byroden`.
> **Convertir siempre a WebP con `sharp`** (ya instalado): 707 KB → 82 KB sin
> perder calidad. Script de una vez, dentro del proyecto para que vea
> `node_modules`.
>
> ### LO SIGUIENTE, y es construir — ✅ HECHO el 2026-08-08, ver arriba
> El boceto `docs/bocetos/2026-08-07-lugar-con-arte.html` **es la referencia
> literal**. Lo que faltaba llevar a la app, y ya está:
> 1. Los tokens de tema a `app/globals.css` (`.tema-valle`, `.tema-ciudadela`…).
> 2. `data/lugares.ts`: el `Nodo` gana **`tema`** e **`imagen` de cabecera**.
> 3. `app/lugar/page.tsx`: cabecera a sangre, hoja a todo ancho, puertas,
>    medallones cuadrados.
> 4. `components/lugar/DialogoArbol.tsx` + `NpcSection`: la ventana emergente.
> 5. Gate: `check-lugares` tiene que exigir que **todo tema declarado exista**.
>
> **Los 41 gates en verde**, `tsc` y `next build` limpios. **Sin ver en la app.**

## 🚦 Antes de eso (2026-08-07, madrugada)

> **YA HAY GENTE EN CADA SITIO.** Rama `feat/pnjs-por-sitio`, mergeada a
> `master`. **Sin migración** (usa el `venue` de la v25).
>
> Los sitios estaban pero **vacíos**: `location_npcs` nace sin nada y había que
> crear cada PNJ a mano. `data/npcTemplates.ts` trae **11 escritos** —dos por
> sitio de Byroden y uno por franja del bosque—, con nombre, oficio y un
> **`prompt` de personalidad de verdad**, que es lo único que la IA lee de un PNJ.
>
> **Escritos y no generados con IA a propósito**: sembrar tiene que funcionar
> **con el túnel de Ollama caído**, y una vez sembrados hablan por IA igual. El
> botón de generar con IA sigue en Panel DM › PNJs para añadir más.
>
> Mismo trato que las tiendas: plantilla en código + botón **«Sembrar gente»** en
> **Panel DM › Lugares**. Un sitio sin plantilla **deshabilita el botón
> explicándose**, en vez de no hacer nada al pulsarlo.
>
> ⚠️ **`seedNpcs` NO PISA LO QUE YA HAYA, y no es un detalle**: el DM tiene PNJ
> creados a mano, y un botón que los duplicara le metería once desconocidos en su
> pueblo sin forma cómoda de deshacerlo.
>
> ⚠️ **Lo primero que hay que mirar en la app**: los PNJ creados ANTES de esto
> tienen **`venue` nulo**, o sea «el pueblo entero». Salen en la plaza de Byroden
> y **en ninguna taberna**. No es que falten: hay que asignarles el sitio en el
> desplegable de **Panel DM › PNJs**.
>
> Los PNJ de las franjas llevan `poi_name` del pueblo desde el que se siembran
> aunque el bosque no sea de nadie: es **para que el DM los encuentre** en el
> panel, que lista por POI. En pantalla los coloca el `venue`.
>
> **Gate 40 ampliado**, con **siete mutaciones más**. Dos avisos de proceso:
>
> > **La mutación encontró otro fallo real, y van ocho.** El guardia
> > anti-duplicado vivía **dentro de `seedNpcs`, pegado a la consulta de
> > Supabase, donde ningún gate llega**: romperlo dejaba el gate verde. Sale a
> > **`puedeSembrar`** en `lib/nodos.ts`, por la misma razón por la que
> > `facesFrom` se exporta.
> >
> > **Y caí en la trampa que este documento ya avisa**: `git checkout --` durante
> > una mutación **borró `puedeSembrar` porque aún no estaba commiteada**. El
> > gate empezó a petar con `puedeSembrar is not a function`. **Commitea ANTES de
> > mutar** — está escrito arriba y aun así pasó.
>
> **Los 40 gates en verde sobre el `master` mergeado**, `tsc` y `next build`
> limpios. **Sin probar en la app viva.**

## 🚦 Antes de eso (2026-08-07, noche)

> **EL JUGADOR SE MUEVE SOLO, POR TARJETAS.** Rama `feat/navegacion-lugares`,
> mergeada a `master`. **CON MIGRACIÓN: `schema_v25` — sin ejecutar.**
>
> Desde Byroden salen **Taberna, Iglesia, Cementerio, Ayuntamiento y El bosque**;
> el bosque lleva a **la linde**, y de ahí a la espesura y al corazón. En cada
> sitio están **sus** PNJ, no los del pueblo entero.
>
> **1 · El modelo es un GRAFO de nodos**, no «un POI tiene una lista de sitios».
> Lo segundo no aguanta el bosque: **la Expansión Verdante es una región, no un
> POI**, y sus franjas no son sub-lugares de Byroden. Un nodo = una tarjeta:
> `poi:Byroden`, `sub:Byroden/taberna`, `franja:linde`.
>
> ⚠️ **Los nodos `poi:` NO se escriben a mano**: se derivan del atlas. Una
> segunda lista de pueblos se desincronizaría del mapa en cuanto el DM añadiera
> uno — el fallo que ya tuvo `regionEntries()`.
>
> **2 · Cada jugador se mueve por su cuenta**, y la posición vive en
> **`characters.play_state.sitio`**, no en `app_config`. La razón que decide:
> **`characters` SÍ está en la publicación realtime y `app_config` NO** (lección
> pagada cinco veces). **Sin `sitio` se está donde el grupo**, así que quien no
> se haya movido nunca ve exactamente lo de antes y el DM conserva el ancla.
>
> ⚠️ **El agujero que tenía y va arreglado**: si el DM plantaba al grupo en Emon,
> quien se había metido en la taberna de Byroden **se quedaba allí solo**. El
> `sitio` guarda ahora **también el ancla desde la que se movió** y caduca en
> cuanto el grupo se muda — sin que el DM limpie nada ni haya que escribir en la
> ficha de cinco personas.
>
> **3 · `schema_v25`: `location_npcs.venue`.** ⚠️ **NULL = el pueblo entero**, que
> es donde salían todos antes: **la migración no esconde a ningún PNJ ya creado**.
> El selector está en **Panel DM › PNJs** y solo ofrece los sitios de SU pueblo
> más las franjas.
>
> **4 · Panel DM › Lugares**, nuevo: nombre, descripción e **imagen por tarjeta**,
> en `app_config` y **sin desplegar** — las imágenes las hace el usuario. Sin
> imagen la tarjeta sale con su icono, no con un hueco roto. Al guardar se
> limpian los campos vacíos: un `imagen: ""` pisaría la semilla con nada.
>
> El clima **solo se pinta al aire libre** (en la taberna sobra) y el ambiente
> que lee la IA lleva ahora **dónde estás**, para que el tabernero y el
> sepulturero no hablen igual. **Tienda, posada, tablón y saber siguen colgando
> del pueblo**: no se han repartido por sitios en esta tanda.
>
> **Gate 40 `check-lugares`**, con **once mutaciones**. Dos hallazgos reales:
>
> > **El gate encontró un fallo de diseño ANTES de escribir la interfaz.** La
> > primera invariante era «todo nodo tiene salidas», y Emon la tumbaba: un
> > pueblo sin sub-lugares no tiene adónde llevarte y **no pasa nada**, porque es
> > el ancla donde el DM te planta. La que muerde de verdad es **«todo nodo al
> > que se puede ENTRAR tiene por dónde salir»** — sin eso el jugador pulsa una
> > tarjeta y se queda encerrado sin más botón que recargar.
> >
> > **Y la mutación destapó otra regla vacía, van siete.** «El override no puede
> > cambiar el id» pasaba siempre porque el caso de prueba **ni siquiera lo
> > intentaba**. El tipo lo prohíbe, pero el override **no viene del tipo: viene
> > de un JSON de `app_config` que escribe el DM**, y ahí TypeScript no llega.
>
> **Los 40 gates en verde sobre el `master` mergeado**, `tsc` y `next build`
> limpios. **Sin probar en la app viva.**
>
> **Lo que esta tanda NO hace, y va dicho**: no se pueden **crear** sitios nuevos
> desde el panel (solo editar los que trae la semilla: Byroden y las tres
> franjas); los demás pueblos siguen sin sub-lugares; y **tiendas y tablón no se
> han movido** a los sitios.
>
> **Y Byroden queda corregido**: el usuario avisó de que ardió en **795 PD** pero
> la campaña va por el **836** — son 41 años, está **reconstruido**. La entrada de
> saber decía «un pueblo del que no queda nada». Ahora dice que se levantó sobre
> sus ruinas y que en el cementerio hay una franja de lápidas con la misma fecha,
> que además engancha con la tarjeta del cementerio.

## 🚦 Antes de eso (2026-08-07)

> **LAS MISIONES SE VUELVEN INDIVIDUALES, EL BOSQUE TIENE PROFUNDIDAD Y EL
> SUSURRADO TIENE HISTORIA.** Tres ramas mergeadas a `master`.
> **CON MIGRACIÓN: `schema_v24` — hay que ejecutarla.**
>
> **1 · Misiones individuales, en plan novela visual.** No se reconstruyó nada:
> **estaba en tres cuartas partes** y se comprobó antes de escribir una línea.
> Ya existían las tarjetas de PNJ (`NpcSection`), el `prompt` por PNJ
> (`location_npcs`, v16) y la memoria por (PNJ, jugador) (`npc_memories`, v18).
>
> **Las cuatro decisiones las tomó el usuario antes de escribir código**: las
> opciones de diálogo **las propone la IA**, la misión se asigna a
> **`character_id` y no a `user_id`**, **solo la ven su jugador y el DM**, y se
> **entrega hablando con el PNJ** que la encargó.
>
> ⚠️ **Cruzar la primera con la cuarta obligó a una decisión de diseño**: las
> opciones de MISIÓN **no salen del modelo**. Si la de entregar dependiera de
> que la IA se acordara, la misión no se podría cerrar unas veces y se cerraría
> sin hacerla otras. Así que **la app las inyecta** (`opcionesDeMision`) y la IA
> solo propone las de conversación. Misma línea que `bolsaDeArena` en el
> caldero: la IA pone la voz, el estado lo mueve el servidor.
>
> **`schema_v24`**: `assigned_character_id` (FK a `characters.id`) y `npc_id`
> (FK a `location_npcs.id`), las dos con **`on delete set null` y NO `cascade`**
> como v14/v19 — borrar un PNJ al reordenar un POI no puede llevarse por
> delante la misión que encargó.
>
> ⚠️ **Y la RLS de lectura se recrea.** La de v12 era
> `status <> 'oculta' or is_dm()`, o sea que **todo el grupo veía toda misión no
> oculta**: con misiones individuales eso hace que «individual» no signifique
> nada. Ahora tres ramas — el DM lo ve todo, una **sin asignar** sigue siendo
> del grupo, y una **asignada** solo la ve quien tiene esa ficha, **incluidas
> sus fichas archivadas** (si no, archivar un personaje le borraría la misión de
> la vista). `oculta` sigue sin enseñarse ni a su asignado.
>
> **Una sola llamada por turno**, no dos: el PNJ responde en personaje y adjunta
> un bloque `<opciones>` que `parseOpciones` recorta antes de pintar **y antes
> de que llegue al resumen de `npc_memories`**. Pedirlas aparte con
> `generarJSON` doblaría el coste contra el `qwen2.5:14b` del túnel (timeout de
> `/api/ia`: 180 s) y la conversación sería inusable. **Falla abierto**: sin
> bloque, texto entero y cero opciones — o sea, la app de antes.
>
> **`/api/entregar-mision`** es el espejo de `aceptar-encargo` y comprueba las
> cuatro condiciones **contra la base de datos**, no contra lo que dijo el
> navegador: activa, de ESE PNJ, de TU ficha, y `eq("status","activa")` en el
> propio update como anti-abuso.
>
> **El saber de una misión individual va SOLO a su dueño** (en el endpoint y en
> el panel del DM): repartirlo al grupo delataría la misión que la RLS acaba de
> esconder.
>
> ⚠️ Y **`aceptar-encargo` pierde el parche** de meter «_Aceptado por X_» dentro
> del `body`: era texto a falta de columna donde apuntarlo, y **reescribía la
> misión del DM cada vez**. Los encargos de tablón (sin `npc_id`) siguen siendo
> del grupo y conservan la nota.
>
> **`useParty` pasa a traer `id`.** Sin él no se puede asignar por ficha, y
> `user_id` no vale: un jugador tiene hasta 3 fichas. Comprobado que nadie
> escribe filas de `party` de vuelta a la base.
>
> **Gate 38 `check-misiones`**, con **ocho mutaciones** — la que más importa es
> la de `visiblePara` dejando pasar una misión asignada a otro, que es **la
> fuga**. Los ids de ficha van escritos a mano en el script, por la lección de
> `check-origen` y `check-tiendas`.
>
> **2 · La Expansión Verdante, por profundidad.** `data/encounters.ts` solo
> traía `XP_BUDGET` y `CR_XP`: presupuesto, **nada geográfico**. `data/bosque.ts`
> es la primera tabla que dice **qué vive dónde**.
>
> Tres franjas de fuera adentro: **linde, espesura y corazón**. ⚠️ El campo se
> llama **`franja` y NO `depth`**: `SaberEntry.depth` habla de **cuánto sabes** y
> este de **dónde estás**, y llamarlos igual los habría confundido para siempre.
>
> **42 entradas, 17 con ficha y 25 esperando extracción.** Se decidió escribir
> la tabla entera y que el bestiario la alcance (van 151 de 501), que es más
> barato que extraer 25 statblocks antes de que la tabla exista **y deja la
> lista de extracción priorizada por lo que el bosque necesita**.
>
> ⚠️ **El prompt anterior estaba desfasado en la lista de extras**: Sátiro,
> Sprite, Perro Parpadeante, Lobo y Micónido Adulto **ya estaban extraídos**. La
> tabla de los 17 sí era correcta (6 sí, 11 no).
>
> **`PENDIENTES` va escrito a mano y esa es la gracia**: sin él, el gate no
> podría distinguir **un nombre mal escrito** de **uno que aún no se ha
> extraído**. Con él muerde por los dos lados — un nombre inventado no está en
> ninguna de las dos listas, y **un lote que extraiga un pendiente falla hasta
> que se le quite de ahí**.
>
> **Gate 39 `check-bosque`**, con **siete mutaciones**.
>
> **3 · Thordak, el Zigurat y el Susurrado.** `data/susurrado.ts`: **19 entradas
> nuevas, `SABER` pasa de 209 a 228** (14 en Tal'Dorei, 5 en Exandria).
>
> No son tres temas sueltos: Thordak dejó Tal'Dorei sin ejército ni consejo
> justo cuando hacía falta mirar debajo de Piedrablanca, el Zigurat es por donde
> se coló lo que había debajo, y el Susurrado es quien se colaba.
>
> Prefijo **`sus:`** propio y no `cl:` (no son lore de continente), con su rama
> en `placeOf`. **Todas `profundo`**, como la Calamidad. Tres cuelgan de POI
> (Emon, Piedrablanca) para que `SaberRoll` tenga dónde dispararse.
>
> ⚠️ **Redacción PROPIA.** La wiki de Critical Role se leyó para documentarse
> —los hechos son de la ambientación— pero **de su prosa no se copia ni se
> traduce una línea**, igual que con los blurbs del Monster Manual.
>
> Las comprobaciones van **dentro de `check-lore`**, que es quien ya responde
> por la integridad de `SABER`; un `check-susurrado.ts` aparte serían dos
> fuentes de verdad. (La lección de `check-forja` / `check-forjado`.)
>
> > **La mutación encontró un fallo real, y van SEIS.** La comprobación de «un
> > personaje recién hecho no sabe ninguna» **no bastaba**: un recién hecho no
> > tiene continente de origen, así que un ámbito de tipo `continente` **se le
> > escapaba entero** — pero en cuanto alguien fuera de Tal'Dorei, toda la
> > historia de Thordak le habría salido sabida de salida. Se añadió la regla
> > directa: ninguna de las tres puede tener ámbito `continente`. **Y otra vez
> > lo que encuentra la mutación es una regla que casi no podía fallar.**
>
> **Los 39 gates en verde YA SOBRE EL `master` MERGEADO** (no solo sobre la base
> de cada rama), con `tsc --noEmit` y `next build` limpios.
> **Sin probar en la app viva.**
>
> ⚠️ **Dos avisos de proceso de esta sesión, dichos y no escondidos:**
> - **Un pipe se tragó un exit code**: `npx tsc --noEmit | head` devuelve el de
>   `head`, así que se dio por bueno un typecheck que traía un error de caché de
>   `.next` de otra rama. Está en el prompt desde hace tandas y volvió a pasar.
> - **Cuatro mutaciones salieron «verdes» sin haberse aplicado**: los `perl -0pi`
>   multilínea usaban `\n` y el working copy tiene **CRLF**. Parecía que el gate
>   no vigilaba nada. **Al mutar, comprueba SIEMPRE con `git diff` que la
>   mutación entró** antes de sacar conclusiones — de repetirlas bien salió el
>   hueco real del punto 3.

## 🚦 Antes de eso (2026-08-06, noche)

> **EL BESTIARIO EMPIEZA A LLENARSE, Y AHORA SE SABE CUÁNTO FALTA.** En
> `master`. **Sin migración.**
>
> **1 · El censo.** `data/bestiary/censo-manual.ts` transcribe el apéndice B del
> manual: **501 statblocks**. Antes no había forma de saber qué faltaba, y las
> dos estimaciones que se hicieron sobre la capa OCR se quedaron cortísimas
> (contar «CR n (XP» daba 286). El cruce **valida las dos listas a la vez**:
> cero de los monstruos ya extraídos se sale del censo.
>
> **2 · Las familias de despiece.** `data/bestiary/familias.ts`: **150 familias
> cubren 456 statblocks**, más **45 Humanoides excluidos** —son personas— = 501.
> La regla la dio el DM: **separa lo que da material distinto, junta lo que da el
> mismo.** Dragones por color y no por edad; mefitos por elemento; modrones
> juntos. Baja el trabajo de materiales de ~1.250 a ~400.
>
> ⚠️ **La edad del dragón no parte la familia pero tampoco da igual**: se
> resuelve por **grado** —lo superior solo de adulto y anciano—, como el
> catálogo ya hacía con «Diente de Vampiro Anciano».
>
> **3 · Ocho lotes extraídos**, por orden de página del manual. **Cobertura: 149
> de 501.** Van hasta la **página 38 del libro**. Estrenan en el bestiario los
> campos `bonusActions`, `reactions`, `legendary` y `gear`, que el tipo traía sin
> usar: el Contemplador con sus diez rayos y la Archibruja con sus acciones
> legendarias son la primera prueba de que la ficha los aguanta.
>
> ⚠️ **Lo que hay que saber para seguir**, y está detallado en el prompt:
> **la capa OCR solo vale para LOCALIZAR** —entrelaza las dos columnas y escribe
> «Basrrrsr» por «Basilisk»—, la verdad es la **página renderizada leída a
> ojo**, y **página de libro = página PDF − 3**. Y **hay que cruzar cada bicho
> con `ALL_MONSTERS` antes de escribirlo**: en el lote 01 escribí cuatro y dos ya
> estaban, lo cazó el gate de slugs únicos.
>
> **Gates 36 y 37 nuevos** (`check-despiece`, `check-familias`), y
> `check-bestiary` gana la comprobación del censo, con mutación pasada: un
> `nameEn` mal escrito deja un monstruo **imposible de cruzar con el libro y no
> se ve en pantalla**.
>
> **Los 37 gates en verde**, con `tsc` y `next build` limpios.

## 🚦 Antes de eso (2026-08-06, tarde)

> **LOS OFICIOS: LOS SIETE ABIERTOS, Y EMPIEZA EL DESPIECE.** En `master`.
> **Sin migración.**
>
> **1 · La clase ya no decide qué oficio aprendes.** `CharClass.oficios` —el
> array de 2–4 por clase— se **borra** de las 13 clases y del tipo; la fuente
> única pasa a ser `rules.OFICIOS`. El cupo no cambia: uno a nivel 1 y otro a
> nivel 7. **Panel DM › Grupo** gana un selector de oficios por jugador que
> **se salta el cupo pero lo canta en ámbar** — premiar con un oficio extra es
> decisión de mesa. Sin tocar `/api/dm/character` (es passthrough y `skills` ya
> pasaba) y sin update optimista, porque `characters` **sí** está en realtime.
>
> ⚠️ Ese selector escribe sobre `c.skills` **crudo**, no sobre el array que la
> tarjeta pinta: ese lleva mezcladas las del **trasfondo**, que son derivadas, y
> guardarlo las grabaría en la columna para siempre.
>
> **2 · Extracción de Componentes estaba bloqueada, y no por lo que decía el
> plan.** Los materiales citan Mantícora, Basilisco, Vampiro, Roc, Grifo,
> Wyvern, Behir, Kraken, Banshee… y **el bestiario solo llega a CR 1/2**. Peor:
> esos bichos **no están en CR 1–2**, así que el lote L2 del plan del 2026-07-13
> no habría desbloqueado nada (Mantícora y Basilisco son CR 3, Wyvern 6, Roc 11,
> Kraken 23). **El orden de extracción pasa a ser «lo que citan los
> materiales», no por CR.**
>
> **3 · `data/despiece.ts`: qué suelta cada monstruo.** `piezasDe(cr, size)` da
> de cuántas cosas **distintas** puede salir —base por CR, +1 si es Grande o
> mayor, acotado a 1–5—. ⚠️ **No confundir con las piezas de un cadáver
> concreto**, que son **1d4** y se tiran al abrirlo (spec del 2026-08-02).
> **22 materiales nuevos** para los 23 bichos de CR 0. **Los Humanoides quedan
> fuera a propósito** y el gate lo vigila: el Plebeyo entraría solo por la regla
> y metería «Hígado de Plebeyo» en el catálogo de cocina.
> Los catálogos pasan de **369 a 391**.
>
> ⚠️ **Hubo que aflojar una invariante, y va dicho**: los catálogos exigían que
> las categorías fueran en **bloques seguidos** (flora → fauna → mineral →
> esencia). Añadir una pieza de `fauna` —cuyo bloque acaba a mitad del
> catálogo— obliga a **renumerar** todo lo de detrás, y el `n` **no se renumera
> nunca** porque es la referencia de mesa («el 46, el residuum»). Chocaban de
> frente. **Gana la numeración**; la regla de bloques pasa a cubrir solo el
> catálogo original y lo nuevo se apila al final.
>
> **Gate 36 `scripts/check-despiece.ts`** — ojo, `check-materiales` es otro y
> `check-bestiary` otro más; este vigila el **puente** entre los dos. Cuatro
> mutaciones, y la que más importa es la del **nombre mal escrito**: sin ella,
> un monstruo al que se le despieza **no suelta nada y no salta ningún error**.
>
> **Pipeline del Monster Manual verificado end-to-end**: 390 páginas volcadas a
> texto (el OCR **entrelaza las dos columnas**, así que solo sirve para
> LOCALIZAR por `XP N`), y el render a PNG con `pypdfium2` scale 2.5 sale
> legible. **Página de libro = página PDF − 3.**
>
> **Los 36 gates en verde**, con `tsc` y `next build` limpios.
> **Sin probar en la app viva.**

## 🚦 Antes de eso (2026-08-06)

> **Lo último (2026-08-06): EL JUGADOR ENTRA EN CUATRO SECCIONES MÁS, Y EL TIPO
> DE TIENDA DEJA DE SER UNA REJA.** Rama `feat/abrir-secciones-y-tiendas`,
> mergeada a `master`. **Sin migración.**
>
> **1 · Se abren `/mapa`, `/panteon`, `/cronica` y `/bestiario`.** Cuatro líneas
> en `RUTAS_JUGADOR` y ya: el nav las filtra con `puedeVer` y el proxy deja de
> reescribirlas a `/cerrado`. **No hubo que tocar ninguna página**, y eso fue la
> sorpresa de la tanda: **tres ya distinguían el rol** de cuando el DM y el
> jugador compartían app. `/mapa` tiene niebla opaca sobre los continentes sin
> `revealed` y solo enseña las regiones con `known`; `/bestiario` limita al
> jugador a los descubiertos y le esconde la edición; `/panteon` es catálogo sin
> secretos a propósito. La cuarta, `/cronica`, no mira el rol pero **la RLS de
> `schema_v12` sí**: el diario y los PNJ piden `visible`, y las misiones
> `status <> 'oculta'`.
> La barra del jugador queda: `Inicio · Ficha · Reino · Panteón · Crónica ·
> Bestiario · Crear · Inventario · Taller · Mapa`. **El orden no se tocó** —es la
> misma lista del DM y reagruparla le movería la barra a él—. La portada gana dos
> puertas, **Mapa** y **Bestiario**, que son las que se miran en mesa.
>
> ⚠️ **Deuda que esta tanda deja escrita, no escondida**: con `/cronica` entra una
> **fuga preexistente**. Las **pistas** viven en `app_config`, cuya política de
> lectura es `using (true)` para cualquier autenticado (`schema_v5.sql:19`), y la
> página **se las descarga todas —incluidas las no descubiertas— para filtrarlas
> en JavaScript**. Abrir la ruta **no amplía el acceso a la base de datos** (un
> jugador ya podía pedirlas por consola: es la misma familia que `/api/*` sin
> control de rol), pero sí hace que ese código corra a diario. **El arreglo de
> raíz es tabla propia con RLS `discovered or is_dm()`**, migración `v24`, y toca
> `useClues`, el panel del DM y el sembrado de rumores en los PNJ IA.
>
> **2 · El tipo de tienda se escribe.** Era un `<select>` sobre `SHOP_KINDS` con
> tres opciones, así que **para que existiera una pescadería había que
> desplegar**. Ahora es un **combobox** (`<input list>` + un `<datalist>` que
> comparten el campo de crear y el de editar): las sugerencias siguen ahí, pero
> no son una reja. **Sin migración** — `shops.kind` ya era `text` y nadie
> validaba su contenido; el desplegable era la única restricción y vivía solo en
> la interfaz.
>
> ⚠️ **`normalizaKind` es lo que hace que la lista siga sirviendo**, y no es
> adorno: al elegir «Herrería» del `<datalist>` el navegador escribe **la
> etiqueta, no la clave**. Guardada tal cual sería un tipo distinto de las
> tiendas que ya existen —mismo negocio, dos claves— y **se quedaría sin
> plantilla ni icono**. La función compara contra etiqueta y clave ignorando
> mayúsculas y tildes; devuelve la clave si acierta y **el texto intacto si no**,
> que es el caso del tipo inventado. Se llama **al guardar**, no en cada tecla.
>
> **3 · Doce tipos, con etiqueta e icono.** Nueve nuevos: taberna, templo,
> avituallamiento, establo, sastre, arcano, curandero, mercado negro y
> escribanía. El jugador ya no lee la clave cruda («herreria») ni la lee la IA en
> el prompt del tendero. El botón **«Semilla» se deshabilita diciendo por qué**
> cuando el tipo no trae plantilla: antes `seedCatalog` habría salido sin hacer
> nada y el DM no sabría si el fallo era suyo.
>
> ⚠️ **Los precios son enteros en piezas de oro** (`shop_items.price` es `int`) y
> **no hay plata ni cobre**. Una jarra de cerveza son 4 pc: o vale 0 —y 0 es
> **gratis** en `shopTx.comprar`, que compara `char.gold < item.price`— o vale 1
> po, veinticinco veces el manual. Por eso **los catálogos baratos se venden por
> lote**: la ronda de diez, el barril de treinta, diez días de pienso y cuadra.
> **Ningún objeto de plantilla baja de 1 po, y el gate lo exige.** El arreglo de
> raíz (migrar a cobre y mostrar po/pp/pc) es una tanda propia.
>
> ⚠️ **No hay tipo «hostal» a propósito**: dormir es la **posada del POI**
> (`Poi.services.posada`), que avanza el reloj de campaña por `/api/descanso` y
> aplica el anti-abuso de 20 h. Con el tipo libre **nada impide que el DM
> escriba «hostal»**, y el código no debe intentarlo — queda como convención: si
> aparece una tienda así vendiendo noches, esas noches no mueven el reloj.
>
> **Gate 35 `scripts/check-tiendas.ts`** (102 comprobaciones), con **prueba de
> mutación de seis roturas**. Ojo: `check-forja.ts` es **otro** (el catálogo de
> 75 materiales) y casi le piso el nombre.
>
> > **La lección, y van cinco**: la mutación destapó que **mis comprobaciones de
> > tildes eran verdes por construcción**. Comparaban `normalizaKind("Herrería")`
> > contra la etiqueta, y **las dos partes pasan por el mismo `plano()`**: quitar
> > el `normalize("NFD")` las movía juntas y la igualdad aguantaba. El caso en
> > mayúsculas tampoco valía, porque la clave `herreria` ya va sin tilde y salvaba
> > la comparación por el otro lado. Lo que sí muerde es el caso del teclado:
> > **«Sastreria y merceria» tiene que dar `sastre`**. Es la tercera vez que lo
> > que encuentra la mutación es *una regla que no podía fallar*.
>
> **4 · Y el mismo día, lo que abrir `/mapa` destapó: EL DM NO PODÍA DESCUBRIR
> UN CONTINENTE.** Rama `fix/revelar-continentes`.
>
> **No es que nunca existiera: se borró.** El interruptor vivía en `MapaPanel`
> como `toggleReveal` y se lo llevó por delante el commit **`5bf5c90` del
> 2026-07-12**, que reescribió ese panel alrededor del atlas. Desde entonces
> `revealed` de los pines de continente **no se podía cambiar desde ninguna
> pantalla**, y `useWorldPois` exportaba `save`, `saveWorldPois` y `newWorldPoi`
> **sin que los llamara nadie**.
>
> ⚠️ **Y no era solo cosa de `/mapa`, que se abrió ese mismo día**: `/reino` lleva
> abierta desde el principio y `ReinoRegions` filtra por el mismo `revealed`, así
> que **los jugadores llevaban tres semanas leyendo «Aún no habéis descubierto
> ningún continente»**. El propio componente le decía al DM «Se revelan desde
> Panel DM › Mapa», **apuntando al botón borrado**.
>
> **Vuelve en Panel DM › Regiones**, no en Mapa: ese panel ya es donde se decide
> qué ve el grupo del mundo, así que continente y región caen en la misma
> pantalla y en ese orden.
>
> **La cascada, decidida con el usuario**: marcar una región **«Conocida»
> descubre su continente**. Una región conocida bajo niebla es **inalcanzable**
> —el jugador no puede entrar en el continente para verla— y el estado se lee
> como un fallo de la app. Es el mismo escalón que ya hacía «Explorada» al poner
> «Conocida». **Solo sube**: dejar de conocerla no vuelve a poner la niebla, que
> taparía las demás de rebote. Para los continentes que ya estén así, la cabecera
> avisa con «N regiones conocidas bajo niebla».
>
> ⚠️ **Y la niebla FALLABA ABIERTA**: `if (!cp || cp.revealed) return null` no
> pintaba nada cuando faltaba el pin, así que **un continente sin pin quedaba
> despejado** sin que nadie lo hubiera descubierto. La regla se muda entera a
> **`lib/niebla.ts`** (módulo neutral, como `lib/slug.ts`) y de paso deja de estar
> **copiada en cuatro sitios** entre `/mapa` y `ReinoRegions`.
>
> > **La lección**: se saca del JSX por la misma razón que `facesFrom` en
> > `lib/diceBox.ts` — **dentro de un `.map` no había forma de comprobarla**, y por
> > eso el fallo abierto sobrevivió. Si una regla de «quién ve qué» vive en el
> > render, no la vigila nadie.
>
> Lo vigila el **gate 25 (`check-acceso`)**, que es la misma pregunta que ya
> responde —quién ve qué— pero dentro de una página en vez de por ruta. Incluye
> que **todo continente de `CONTINENT_VIEW` tenga pin en `WORLD_POIS`**: sin pin,
> y con la niebla ya fallando cerrado, quedaría tapado para siempre y sin
> interruptor. **Cuatro mutaciones probadas**, incluida la de devolver el fallo
> original.
>
> **Los 35 gates en verde**, con `tsc --noEmit` y `next build` limpios.
> **Sin probar en la app viva.**

## 🚦 Antes de eso (2026-08-02): EL CALDERO SE JUEGA Y LOS SIETE OFICIOS BOCETADOS

> **Lo último (2026-08-02): EL CALDERO SE JUEGA, LA FRAGUA EXISTE Y LOS SIETE
> OFICIOS ESTÁN BOCETADOS.** Todo en `master` y desplegado. **Sin migración.**
>
> **1 · Los dados, arreglados tres veces.** El desglose del total solo salía con
> descarte, así que un chequeo con bonificador enseñaba un d20 parado en 12 y un
> **17** encima sin explicar nada — se leía como que el dado daba otro número.
> Ahora salen las caras y el modificador aparte, y con ventaja se marca cuál de
> los dos d20 se cae. Además: el tablero escondía el resultado a los 2000 ms
> fijos, así que subir el `hold` del llamador **no alargaba nada** (los dos
> números son ya la misma constante, `RESULTADO_MS`); se añadió `POSADO_MS`, una
> pausa en la que los dados se quedan **quietos y solos** antes de que salte el
> total; y se barre la mesa **antes** de abrir el tablero, porque se veían unos
> segundos los dados de la tirada anterior. El init de dice-box arranca ahora en
> paralelo con la espera del lanzamiento.
>
> **2 · El caldero es jugable.** Dibujado en SVG (brebaje coloreado por rareza,
> fuego por fase, burbujas), huecos de material **con color por categoría**
> —flora verde, fauna ámbar, mineral azul, esencia violeta— y **materiales que se
> arrastran a la olla** (el clic también vale: en táctil no hay arrastre HTML5).
> Tres fases que **modifican la tirada sin sustituirla**, con tope **±3**. Un
> desastre —pifia o −3— cuesta además **1d4** del tipo que dicta la categoría
> dominante de la receta.
>
> **3 · La fragua existe** (`components/taller/Fragua.tsx`): caldear, martillar a
> compás y templar, con la misma aritmética compartida. **No hay nada que
> forjar** y la pantalla lo dice: el catálogo de piezas lo dicta el DM.
>
> **4 · «Crear» se retira con ficha.** Desaparece de la barra, de la portada y de
> la propia página. `puedeVer` es la PUERTA y `puedeVerAhora` el ESCAPARATE:
> esconder `/crear` **no es seguridad** y el proxy no la trata como tal.
> ⚠️ **Consecuencia**: `/crear` servía también para reeditar la ficha; el jugador
> ya no puede, eso queda en el DM.
>
> **5 · La historia se escribe después.** Panel nuevo bajo la ficha en
> `/personaje`: escribe la misma columna `lore` que el asistente. La hoja del
> jugador sigue siendo de solo lectura; su pasado no.
>
> **Gate: 34 checks en verde** (`check-forjado.ts` es el nuevo; ojo, `check-forja.ts`
> es otro y vigila el catálogo de los 75 materiales), con `tsc` y `next build`
> limpios. **Doce mutaciones probadas** entre las tres tandas.
>
> **Y los siete oficios están bocetados y decididos.** Siete HTML en
> `docs/bocetos/` (se abren con doble clic) y siete specs en
> `docs/superpowers/specs/`. Cada oficio se juega **distinto con el mando en la
> mano**: alquimia ordena y para cursores · forja aguanta un compás ·
> destilación captura una ventana · cristalografía gira, carga y arriesga ·
> tatuaje traza sobre alguien que se mueve · cocina parte la atención en dos y te
> contesta · extracción se juega **entre intentos**, con un saldo que se gasta.

## 🚦 Antes de eso (2026-08-01): EL DM YA PUEDE ENTRAR EN EL TALLER

> **Lo último (2026-08-01): EL DM YA PUEDE ENTRAR EN EL TALLER.**
> Rama `taller-modo-dm`. **Sin migración.**
>
> **El fallo era de acceso, y explica tres tandas de silencio**: `Caldero.tsx`
> se cerraba dos veces —`!inv.characterId` («no tienes un personaje en juego») y
> `!tieneOficio` (la pericia de Alquimia)—, y **el DM no tiene ficha**. Así que
> la única persona que necesitaba probar el taller era la única que no podía
> abrirlo, y por eso alquimia llevaba desde el 2026-07-31 desplegada sin que
> nadie la hubiera visto.
>
> **Las cuatro decisiones las tomó el usuario antes de escribir código**: el DM
> **teclea el modificador** (sin ficha no hay `derive` de donde sacarlo),
> **materiales infinitos y sin guardar nada**, **las 32 recetas** y **el cupo no
> le aplica** (vive en `play_state`, que es de la ficha).
>
> **Dónde vive**: en `app/taller/page.tsx`, **la cáscara, no el caldero**. Hoy
> solo alquimia está construida; si el modo naciera dentro de cada oficio, el
> siguiente taller nacería otra vez invisible. Los cinco que faltan lo heredan y
> lo dicen en su hueco, para que no parezca que el modo no funciona.
>
> **`bolsaDeArena` no es un camino aparte**: fabrica justo lo que la receta pide
> y se la pasa a las MISMAS funciones que usa el jugador (`requisitos`,
> `puedePreparar`, `consumir`). Un modo DM con lógica propia sería lógica que
> nadie prueba — la pantalla que el máster revisa no sería la que juega la mesa.
> La tirada también es la de verdad, por el mismo `rollVisual`.
>
> ⚠️ **Lo que este modo NO prueba, y hay que decirlo**: como no guarda nada,
> **no comprueba que los materiales se descuenten ni que sobreviva a recargar**,
> que es justo lo más sospechoso de alquimia. Eso sigue necesitando **un
> personaje de verdad con la pericia**. Tampoco prueba el cupo. El modo DM sirve
> para ver la interfaz, el libro y la tirada; el circuito de datos, no.
>
> **Quién la ve**: solo el DM, y el rol viene del **servidor**
> (`getSessionProfile` en `app/layout.tsx`). Pero es un filtro de **interfaz, no
> una puerta**: se evalúa en el navegador. Está bien así **porque no hay nada
> que proteger** — el modo no escribe en la bolsa (no hay pociones que robar) y
> las 32 recetas ya viajan en el bundle de todos los jugadores desde que
> `Caldero` es `"use client"` e importa `@/data/recetas`. **El día que el modo
> DM escriba algo, esto deja de valer** y hay que comprobarlo en el servidor.
>
> **`check-recetas` pasa de ~474 a 486 comprobaciones**, con **prueba de
> mutación de cuatro roturas**: la bolsa olvidando las herramientas, la bolsa
> trayendo de más, `modDmValido` sin el guardia de `NaN` —sin él el `NaN` llega
> al total, `NaN >= cd` es `false` y **todas las recetas fallarían sin decir por
> qué**— y la arena ofreciendo solo las recetas iniciales. Las cuatro tumbaron
> el gate y al restaurar volvió a verde.
>
> **Los 33 gates en verde**, con `tsc` y `next build` limpios. **Sin probar en
> la app viva.**

## 🚦 Antes de eso (2026-08-01): TU REGIÓN EN LOS CINCO CONTINENTES

> **Lo último (2026-08-01, mergeado a `master`): TU REGIÓN EXISTE EN LOS CINCO
> CONTINENTES.** Rama `feat/origen-todos-los-continentes`. **Sin migración.**
>
> ⚠️ **Esta rama estuvo un día entero viviendo solo en el clon local**, sin
> pushear, mientras `master` avanzaba **siete commits** por otro lado (el cupo y
> el bestiario). Al mergear no hubo conflicto de código —los dos lados tocaban
> archivos distintos—: **el único choque fueron `HANDOFF.md` y el prompt**. La
> lección va escrita en el prompt de la siguiente sesión: **pushea la rama en
> cuanto exista**.
>
> El usuario avisó de que al crear personaje solo Tal'Dorei ofrecía subregión;
> los otros continentes, nada. El desplegable estaba condicionado a ese nombre
> a mano y solo existía una lista de regiones (`REGIONS` de `data/taldorei.ts`).
>
> **No era cosmético.** `originRegion` decide la entrada **"Tu tierra"** del
> saber inicial, y `regionEntries()` recorría únicamente las regiones de
> Tal'Dorei: un personaje de Marquet, Issylra o los Dientes Rotos **arrancaba
> con menos saber** que uno de Tal'Dorei, y no por diseño.
>
> Lo que **no** hizo falta: inventarse lore. `data/atlas.ts` ya sembraba
> regiones para los cinco continentes (`seedContinent` desde
> `REGIONS_BY_CONTINENT`), e Issylra (4/4) y Marquet (7/7) **ya traían blurb**
> desde `WORLD_POIS`. Las regiones de origen salen de esa **misma semilla**
> (`regionesDeOrigen` / `todasLasRegionesDeOrigen`): no hay una segunda lista a
> mano que se pueda desincronizar del mapa. Lee la semilla **estática** y no el
> atlas guardado del DM a propósito — el catálogo `SABER` se construye a nivel
> de módulo, así que una región que el DM añadiera después se ofrecería **sin
> ninguna entrada de saber detrás**.
>
> De paso, **`placeOf` archivaba TODO id `reg:` en Tal'Dorei**. Con regiones de
> los cinco continentes eso habría colado las de Marquet o Issylra bajo
> Tal'Dorei en `/reino`, en silencio.
>
> **`DETALLE_REGION`** (`data/world.ts`) pone plaza principal y rasgo a las
> once regiones sembradas, que salían con `capital: "—"` y `feature: ""` —
> media entrada de "Tu tierra" frente a la entera de Tal'Dorei. **Mismos
> nombres y mismos slugs**: el atlas no cambia de forma, así que los
> `atlas_defs` ya guardados no necesitan `ATLAS_FIXES` ni migración.
>
> **Gate 33 `scripts/check-origen.ts`**, con prueba de mutación de **cinco**
> roturas. La invariante que vigila es la que faltaba: **ninguna región que el
> selector ofrece puede quedarse sin entrada de saber detrás**.
>
> > **La lección, y esta duele**: la primera versión del check comparaba los
> > slugs congelados de Tal'Dorei contra `REGIONS`… que es de donde el atlas los
> > saca. **Los dos lados se movían juntos: verde por construcción.** Cambiar un
> > slug no tumbaba nada. Lo destapó la prueba de mutación, no la lectura. Ahora
> > los ocho van escritos a mano en el script. Es la **tercera vez** que la
> > mutación encuentra algo real — y la segunda que lo que encuentra es *una
> > regla que no podía fallar*.
>
> **DECIDIDO (2026-08-01): los Dientes Rotos van POR ISLA.** Siguen siendo UNA
> sola región para todo el archipiélago —el único continente así—, y el usuario
> ha decidido partirlos por las **siete islas** de la wiki: Kalutha, Slival,
> Igthuldus, Ruukva, Evaterena, Athova-Rae y Shardborne. La vía de las **dos
> sociedades** (Hueste Osendida y Asamblea Wanderman) **queda descartada como
> división de origen**; sirve como lore dentro del texto de cada isla.
> Ojo al implementarlo: son regiones **nuevas**, así que ahí sí entra
> `mergeAtlas` (solo SUMA regiones), hay que mirar qué pasa con la región
> genérica ya guardada en `atlas_defs`, y **el gate 33 exigirá entrada de saber
> y `DETALLE_REGION` para las siete**. El texto **lo dicta el usuario**: aquí no
> hay blurb sembrado del que tirar, al revés que en las once de esta tanda.
> Detalle en `docs/PROMPT-SIGUIENTE-SESION.md`.
>
> **Los 33 gates en verde ya sobre el `master` mergeado** (no solo sobre la base
> vieja de la rama), con `tsc --noEmit` y `next build` limpios.
>
> **Falta verlo en la app viva**: el asistente no puede pasar del login.

## 🚦 Antes de eso (2026-08-01): EL BESTIARIO SE VEÍA TARDE

> **Lo último (2026-08-01, después del cupo): EL BESTIARIO SE VEÍA TARDE.**
> Rama `bestiario-optimista`. **Sin migración.**
>
> **El fallo**: `saveCustomMonster`, `deleteCustomMonster` y `setDiscovered`
> escribían en `app_config` y **no tocaban el estado local**; `useBestiary`
> confiaba en una suscripción realtime sobre `app_config`, **que no entrega
> nunca**. Así que el DM añadía un monstruo, lo borraba o lo marcaba como
> descubierto y **no pasaba nada hasta recargar** — y lo tercero es justo lo que
> hace que los jugadores lo vean aparecer.
>
> **Es la misma lección por cuarta vez**, y estaba señalada en el prompt de la
> sesión: «`useBestiary` tiene una suscripción que no entrega nunca y sigue
> ahí».
>
> **El arreglo**: las mutaciones se mudan **dentro del hook**, aplican en local
> y luego persisten —el patrón de `lib/useOficios.ts`—, y la suscripción muerta
> se retira con el porqué escrito. **Devuelven además el error**, no solo lo
> dejan en `error`: `SelectorMonstruos` compone su propio aviso («añadido, pero
> no se pudo marcar…») y con el error solo en el estado del hook no podría
> distinguir su fallo del de otra pantalla.
>
> **La mezcla pasa a ser capa pura** (`mergeMonsters`, `conMonstruo`,
> `sinMonstruo`, `conDescubierto`) y `check-bestiary` la comprueba: sustituir en
> vez de duplicar, no mutar el array recibido, no duplicar al marcar dos veces y
> que un personalizado con el slug de uno del manual lo **sustituya** quedando
> marcado. **Tres mutaciones probadas.**
>
> **Los 32 gates en verde.** **Sin probar en la app viva.**

## 🚦 Antes de eso (2026-08-01): EL CUPO DE LAS DOS POCIONES CUMBRE

> **Lo último (2026-08-01): EL CUPO DE LAS DOS POCIONES CUMBRE.**
> Rama `cupo-alquimia`. **Sin migración.**
>
> **Posibilidad** y **Fuerza de gigante (tormentas)** —la única legendaria— se
> siguen fabricando, pero dejan de ser dos recetas caras más y pasan a ser el
> **techo de poder de la campaña**:
> - **Los componentes más difíciles del catálogo.** Posibilidad pide ahora
>   Polvo de Hielo Negro de Aeor y Extracto de Luz de Catha además de la Arena
>   Dunamántica y el Residuum; la legendaria, Escama de Dragón Cromático y
>   Turmalina.
> - **Una cada `1d6` días.** Al **acertar** una de las dos se tira 1d6 y durante
>   esos días **ninguna de las dos** se puede intentar.
>
> **Tres decisiones de alcance, tomadas a propósito:** el cupo es **compartido**
> entre las dos, **solo las bloquea a ellas** —gastarlo no te deja sin poder
> prepararte una curación— y **solo se consume al acertar**, porque fallar ya
> cuesta esos materiales.
>
> **Dónde vive**: `play_state.tallerCupo`, el **minuto de juego absoluto** en
> que se libera. Se compara con el **reloj de campaña y no con la hora real**,
> así que **adelantar días desde Panel DM › Tiempo lo libera** — que es como la
> mesa entiende «vuelve dentro de tres días».
>
> ⚠️ **Al gastarlo se RELEE la ficha y se fusiona `play_state`.** Ahí viven
> también los PG, las condiciones y los usos de clase: escribir el objeto que el
> caldero tenía en memoria borraría lo que el combate hubiera movido mientras la
> pantalla estaba abierta.
>
> **En el tipo**: `Receta` gana `cupo?: true` y `RECETAS_CON_CUPO` dice cuántas
> lo llevan. El gate no comprueba solo **cuántas** sino **cuáles, por slug** —
> probado por mutación: cambiar una por otra deja el número en 2 y el gate lo
> canta igual. También caza quitar el guardia de `NaN` de `cupoHasta` (sin él,
> `Math.min`/`Math.max` propagan el `NaN`, y como `cupoLibre` trata lo no finito
> como libre, **el peor 1d6 sería el que desactiva el freno**) y cambiar el
> `>=` del vencimiento por `>`.
>
> **Los 32 gates en verde.** `check-recetas` pasa de 227 a ~474 comprobaciones.
> **Sin probar en la app viva.**

## 🚦 Antes de eso (2026-07-31, tarde)

> **LOS DADOS NUNCA USARON SUS CARAS.**
> Ramas `fix/tirada-aptitudes-4d6` y `fix/dice-box-lectura-caras`, ambas en
> `master`. **Sin migración.**
>
> El usuario avisó de que la tirada de aptitudes de `/crear` guardaba un número
> distinto del que salía en el tablero, y de que la animación se cortaba antes
> de enseñar el resultado. Eran **dos fallos encadenados**, y el segundo era
> mucho más gordo de lo que parecía:
>
> 1. **`rollVisual` sumaba los cuatro dados y `AbilitiesStep` descartaba el
>    menor por su cuenta**, así que el overlay pintaba un total y la ficha
>    guardaba otro. Ahora el descarte se hace **dentro** de `rollVisual` con la
>    opción `keep`, y bajo el total salen las caras con la descartada tachada.
>    La opción `hold` deja el resultado en pantalla antes de devolver el
>    control: el bucle de seis tiradas se pisaba su propio resultado.
> 2. **La causa de verdad: `dice-box` 1.1.4 resuelve `roll()` con un array
>    PLANO de dados**, no con grupos. Leíamos `res[0].rolls`, que es
>    `undefined`, así que el `.map` lanzaba un `TypeError`, se lo comía el
>    `catch` de `rollVisual`, devolvía `null` y **el llamador tiraba del
>    fallback aleatorio**. Los dados 3D eran decoración: el número salía de un
>    `Math.random()` que no tenía nada que ver con las caras. Llevaba así
>    **desde que existe el tablero**, y afectaba a TODO — aptitudes, el
>    caldero, `SaberRoll` y el feed.
>
> `facesFrom()` (`lib/diceBox.ts`) lee **las dos formas** posibles (dados
> sueltos y grupos con `rolls` dentro) por si cambia la versión, y si no salen
> tantas caras como dados se pidieron **lanza** en vez de componer un total con
> lo que haya: mejor caer al fallback que guardar un número a medias en
> silencio.
>
> **Gate 32 `scripts/check-dados.ts`**, con **prueba de mutación de cuatro
> roturas** — incluida la de volver a leer `res[0].rolls`, que es el fallo
> original: las cuatro tumbaron el gate y al restaurar volvió a verde.
>
> > **La lección**: el fallo sobrevivió tanto porque **la lectura del resultado
> > no era comprobable**. Por eso `facesFrom` se exporta: para que el gate pueda
> > mirarla. Desconfía de cualquier puente con una librería externa que no tenga
> > una prueba de forma.
>
> **VISTO EN LA APP (2026-07-31, noche)**: el usuario confirma que **la tirada
> de 4d6 de `/crear` funciona**. Eso es lo que se probó y es lo único que se da
> por visto. **Siguen SIN comprobarse en partida** las otras tiradas que pasan
> por el mismo `rollVisual` —el caldero de `/taller`, `SaberRoll` en `/lugar` y
> el feed de dados— y **alquimia entera**, que sigue sin verse jugada.

> **Lo último (2026-07-31, madrugada): ALQUIMIA SE JUEGA.**
> Rama `alquimia-jugable`. **Sin migración.** Los 369 materiales dejan de ser
> listas sueltas: se tienen, se gastan y salen pociones de ellos.
>
> **Las ocho decisiones se tomaron con el usuario antes de escribir código**
> (están en la tabla del spec, `docs/superpowers/specs/2026-07-31-alquimia-jugable-design.md`).
> Las tres que más arrastran:
> 1. **Los materiales son objetos de inventario de verdad**, pero **un montón
>    ocupa UN hueco** lleve 1 unidad o 50. Recolectar doce hierbas ya no se come
>    media mochila; llevar treinta materiales **distintos** sí llena la bolsa.
>    La regla vive en `huecosUsados()` (`lib/inventario.ts`), que sustituye a un
>    `reduce` que estaba **duplicado** en `/inventario` y en la ficha.
> 2. **Al fallar la tirada los materiales se gastan igual.** Lo único que cambia
>    entre éxito y fallo es si además entra la poción.
> 3. **El libro de recetas vive en `lore_unlocked`** con prefijo `receta:`, así
>    que hereda gratis el `unlockLore` del DM y los tomos in-game, y **no hace
>    falta migración**. Comprobado que no ensucia `/reino`: sus consumidores
>    recorren el catálogo `SABER`, no el array del personaje.
>
> **Lo nuevo, por piezas:**
> - **`lib/materiales.ts`**: índice único de los seis catálogos. El **nombre** se
>   puede usar como clave porque el gate 30 ya garantiza que no hay ninguno
>   repetido entre los seis (comprobado: cero ambiguos). Es el mismo truco que
>   `esOficio()` sobre `characters.skills`.
> - **`data/recetas.ts`: 32 recetas** — una por **cosa preparable**, no por
>   entrada del catálogo, así que las dos familias se despliegan y **las 25
>   pociones del libro son preparables**. La **CD sale de la rareza** (común 10 →
>   legendaria 22), no se inventa receta a receta.
> - **`/taller`**: una ruta con **pestañas por oficio** (no una ruta por oficio,
>   justo para no volver a tocar `lib/acceso.ts`). Hoy solo el **caldero** de
>   alquimia; las otras cinco dicen «aún no».
> - **`/oficios`**, DM-only: los 369 + las 25 + las 32, buscables y filtrables,
>   con **entregar** (`addItems`/`unlockLore`) y **editar sin desplegar**
>   (`app_config`, claves `materiales_custom` y `recetas_custom`).
> - **Panel DM › Grupo** gana «Enseñar recetas», junto a «Enseñar saber».
> - **Fuera «Dados del grupo» de `/personaje`.** Las peticiones de tirada del DM
>   se mudan a un **aviso flotante** en el layout: antes había que estar en la
>   ficha para enterarse de que te habían pedido algo.
>
> **Gate 31 `scripts/check-recetas.ts`**, con **prueba de mutación de seis
> roturas** (material inexistente, herramienta gastada, CD que no cuadra con la
> rareza, receta borrada, materiales contando por unidad, nombre repetido entre
> catálogos). **La mutación encontró un fallo real**: el índice copiaba campo a
> campo y descartaba `herramienta` en silencio, así que la regla de «ninguna
> receta gasta una herramienta» estaba **vacía** —verde por casualidad—. Se
> arregló con spread, y el gate ahora comprueba además que el **detector
> dispara** contra una receta que la rompe a propósito.
>
> ⚠️ **Nada probado en la app viva** (todo tras el login). **Esta tanda es sobre
> todo interfaz**, así que la validación visual la hace el usuario y habrá idas y
> venidas. Lo primero que conviene mirar: que preparar una poción **descuente los
> materiales y sobreviva a recargar**, y que el aviso de petición de tirada
> aparezca fuera de `/personaje`.
>
> **Lo que sigue sin hacerse**: los otros **cinco talleres** (el patrón ya está),
> **Extracción de Componentes** —decidido que es el oficio que *consigue*
> materiales, pero sin mecánica—, y el campo **`mecanica` de forja sigue sin
> conectar**: forjar con mithril no quita ningún requisito. `data/equipment.ts` y
> `lib/derive.ts` no se tocaron.

## 🚦 Antes de eso (2026-07-31, noche)

> **Lo último (2026-07-31, noche): los SEIS catálogos de oficio.**
> Rama `cocina-ingredientes`. **Sin migración.** **369 entradas** en total, cada
> catálogo con **numeración propia**; no se buscan entre sí.
>
> | Oficio | Archivo | Entradas |
> |---|---|---|
> | Alquimia | `data/alquimia.ts` | 70 |
> | Cocina | `data/cocina.ts` | 100 |
> | Forja | `data/forja.ts` | 75 |
> | Destilación Exandriana | `data/destilacion.ts` | 49 |
> | Cristalografía Arcana | `data/cristalografia.ts` | 50 |
> | Tatuaje Rúnico | `data/tatuaje.ts` | 25 |
>
> **Tres campos que separan cosas distintas**: `mecanica` en forja (regla, no
> sabor), `riesgo` en destilación (el catálogo peligroso: la mitad trae
> contrapartida explícita) y `herramienta` en cristalografía y tatuaje —cinceles,
> agujas, pinzas y paños **no se gastan**; una receta los exige disponibles pero
> no los consume. Confundirlos gastaría el cincel en cada tirada.
>
> **Cuatro arreglos sobre las listas del DM**, dichos y no escondidos: la
> numeración de destilación se cortaba en el 26; **«Extracto de Memoria» venía
> dos veces** en destilación (fusionadas en una); cristalografía venía en dos
> bloques y tatuaje numerado del 51 al 75. Los tres van renumerados desde 1.
>
> **Forja es distinto de los otros dos: trae REGLA, no solo sabor.** El mithril
> anula el requisito de Fuerza de la armadura pesada, la adamantina anula los
> críticos recibidos, el residuum vuelve mágica el arma, la azuremita le cambia
> la aptitud, la madera de bruma da Sutil a un arma pesada… Eso vive en un campo
> **`mecanica`** aparte del `blurb`, para no mezclar regla con descripción.
> ⚠️ **Nada de eso está conectado.** Ni `data/equipment.ts` ni `lib/derive.ts`
> saben que estos materiales existen: forjar un peto de mithril hoy no quita
> ningún requisito. Es catálogo, no mecánica en juego.
>
> **Gates 28 (`check-cocina`), 29 (`check-forja`) y 30 (`check-materiales`)**,
> con las mismas reglas que el de alquimia. El 30 cubre los tres últimos
> catálogos **y centraliza el cruce entre los seis**: un nombre exacto repetido
> entre dos oficios es ambiguo —una receta no sabría de cuál tirar—, así que
> **la lista de solapes se declara y hoy está vacía**. Un mismo material *puede*
> servir a dos oficios (el residuum vale para pociones, para armas y para
> tallar), pero entonces lleva nombre propio en cada catálogo.
> Ese cruce se **quitó** de `check-cocina` y `check-forja`, que lo tenían
> parcial: eran dos fuentes de verdad para la misma regla.
> Probado por mutación: quitarle la mecánica al mithril, duplicar un nombre
> entre cocina y forja, y repetir «Mithril Estelar» en cristalografía (el gate
> dice en qué dos catálogos está).
>
> **Lo que sigue sin existir son las recetas**: qué materiales hacen falta para
> cada cosa, con qué CD y qué pasa al fallar. Los seis catálogos y las 25
> pociones están sueltos.
>
> **LO SIGUIENTE está en `docs/PROMPT-SIGUIENTE-SESION.md`**: darle cuerpo a los
> oficios, en tres partes. **(1)** Una **interfaz propia para cada uno**, no una
> pantalla genérica de fabricar — en Alquimia, un **caldero** y un **libro de
> recetas que el jugador va descubriendo**; y por el estilo el yunque, el
> alambique, las agujas, el tallado y los fuegos. **(2)** Las **recetas y
> mezclas** que unen los 369 materiales con lo que sale de ellos. **(3)** Una
> **pantalla de máster** con TODO —los seis catálogos, las pociones y las
> recetas— **ordenado, buscable y manipulable**: hoy los 369 materiales solo
> existen dentro de archivos de código y el DM no los ve en ninguna pantalla.
> El precedente exacto de eso es **`/bestiario`**, que ya es buscador + filtros
> sobre datos del código **y además deja al DM añadir monstruos propios**; y
> para editar sin desplegar, el **atlas** (`atlas_defs` en `app_config`).
> **Lo que ya existe y no hay que inventar**: la maquinaria de descubrir poco a
> poco es la del saber por origen (`lore_unlocked` + `LorePicker` + `unlockLore`
> en `/api/dm/character`), y por el mismo truco que las pericias de oficio
> **probablemente no haga falta migración**. El precedente de tirada con
> consecuencia es `components/lugar/SaberRoll.tsx`.
> **La decisión más gorda de esa tanda**: si los materiales son objetos de
> inventario de verdad —y ocupan hueco en la bolsa— o llevan un contador aparte.
> Hoy son datos puros: no se pueden tener ni gastar.
> **Y ojo**: si los talleres van en rutas nuevas, **tienen que entrar en
> `lib/acceso.ts`** o el jugador se choca contra `/cerrado`.
>
> **Sigue pendiente de antes**: quitar el apartado «Dados del grupo» de
> `/personaje` (con la pregunta abierta de qué pasa entonces con las peticiones
> de tirada del DM, que solo se ven ahí).

## 🚦 Antes de eso (2026-07-31, tarde)

> **Lo último (2026-07-31, tarde): la fe se descubre, y alquimia con pociones.**
> **La fe deja de elegirse al crear el personaje.** Solo se empieza creyendo en
> algo si **la subclase lo impone** (`deityForSubclass`, 10 subclases); el resto
> sale «aún sin fe» y la descubre jugando. Al cambiar de clase la fe **siempre**
> se cae: la que hubiera venía de la subclase anterior.
> **El mecanismo de descubrimiento** es Panel DM › Grupo, junto a «Enseñar
> saber»: un selector por jugador con el que el DM concede la fe cuando el
> personaje llega a creer en algo. El passthrough de `/api/dm/character` ya
> dejaba pasar la columna `deity`, así que no hizo falta tocar la API.
>
> **`data/alquimia.ts`: los 70 ingredientes** del DM, en cuatro categorías
> (flora 20, fauna 25, mineral 15, esencia 10). Llevan **número de catálogo
> estable** porque es como se referencian entre sesiones («el 46, el residuum»);
> el gate exige que vayan de 1 a 70 sin huecos.
> **`data/pociones.ts`: las 25 pociones** de los libros — **23 de la Guía del
> Dungeon Master 2024 en español** (que el usuario subió a la carpeta de libros
> a mitad de la tanda) y **2 de Wildemount**, las únicas de ese libro. Los otros
> cuatro libros **no tienen ninguna**. Curación y Fuerza de Gigante van como
> **familias con `variantes`** (4 potencias y 5 filas de gigante) en vez de
> duplicadas, que es como las presenta el libro.
> **`scripts/check-alquimia.ts` es el gate 27**, para las dos cosas. Probado por
> mutación: borrar un ingrediente da 3 fallos; quitarle las variantes a Curación
> dejándola en «rareza variable», otros 3.
>
> **Nada de esto tiene mecánica todavía**: no hay recetas, ni CD, ni qué
> ingredientes hacen falta para cada poción. Eso es parte de la mecánica de
> Alquimia, que sigue esperando el contenido de `docs/pericias-borrador.md` §5.
> **Nada probado en la app en vivo.**
> **Nota de proceso**: esta tanda fue a `master` directamente, sin rama feature.
> Salta la convención de siempre; queda dicho, no escondido.

## 🚦 Antes de eso (2026-07-31, mañana)

> **Lo último (2026-07-31): las pericias de oficio, el andamio entero.**
> Siete pericias nuevas homebrew: **Alquimia** (INT), **Forja** (SAB–FUE),
> **Cocina** (SAB), **Cristalografía Arcana** (INT), **Tatuaje Rúnico**
> (DES–INT), **Extracción de Componentes** (DES–INT) y **Destilación
> Exandriana** (SAB). Con ellas son **25**.
> **Aptitud doble = dos tiradas.** La primera es la primaria y es la **única
> que suma competencia**; con la secundaria se tira a aptitud pelada. `derive`
> da dos números (`mod` y `mod2`) y la ficha pinta los dos.
> **Cupo aparte**: `oficioPicks` da **una a nivel 1** (se elige en el creador,
> tercer bloque con su propio contador) y **otra a nivel 7** (se elige en
> `LevelPanel`, junto a los hitos de ASI). Elegir un oficio **no** consume una
> pericia de clase.
> **Sin migración**: `characters.skills` ya era `string[]`, así que los dos
> cupos viven en el mismo array y se separan con `esOficio()`.
> **Gate 26: `scripts/check-pericias.ts`**, con tres mutaciones pasadas
> (invertir el par de aptitudes de una doble, dejar una clase con un solo
> oficio, colar un oficio en un `skillList`).
>
> **Dos cosas que hay que saber:**
> 1. **La ficha ahora GUARDA `skills`.** Hasta ahora las trataba como solo
>    lectura porque solo se elegían en el creador; con la elección del nivel 7
>    eso deja de ser cierto. El passthrough de `/api/dm/character` ya dejaba
>    pasar la columna, así que el DM también puede corregirlo.
> 2. **Clérigo, Guerrero y Paladín recibieron un segundo oficio** porque con el
>    reparto inicial se quedaban en uno y el cupo del nivel 7 no habría tenido
>    nada que elegir. El gate exige **mínimo dos por clase**.
>
> **LO QUE FALTA es el contenido: qué hace cada una de las 25.** Lo dicta el
> usuario y **no se rellena a ojo**. La plantilla y las cuatro cosas que hacen
> falta por pericia están en **`docs/pericias-borrador.md` §5**, junto a las
> cuatro asunciones tomadas para poder avanzar (§4), todas reversibles.
> De paso: **`skillChoices` en los 13 `data/classdata/*.ts` no lo lee nadie** —
> es dato muerto duplicado de `skillList`/`skillCount` en `data/classes.ts`,
> que es lo que el creador usa de verdad. No se tocó.
> **Nada probado en la app en vivo.**

## 🚦 Antes de eso (2026-07-30)

> **Lo último (2026-07-30, noche): el alcance del jugador para el arranque.**
> El jugador solo ve **`/`, `/crear`, `/personaje`, `/inventario`, `/reino` y
> `/lugar`**. `/panteon`, `/cronica`, `/bestiario`, `/mapa`, `/combate`,
> `/taberna`, `/narrador` y `/dm` quedan **cerradas de verdad** y pintan
> **`/cerrado`** («esto se abrirá más adelante»), con la URL escrita intacta
> (`rewrite`, no redirect). **El DM lo sigue viendo todo.**
> **La puerta está en `lib/supabase/proxy-session.ts`**, no en cada página, y
> lee de **`lib/acceso.ts`** — la única fuente de verdad (`RUTAS_JUGADOR`,
> `NAV_LINKS`, `puedeVer(role, path)`). **El nav filtra con la misma función**,
> así que no puede divergir de la puerta: si una ruta se abre, su enlace
> aparece solo; si se cierra, desaparece solo.
> **Coste cero en el camino habitual del jugador**: sus rutas pasan sin
> consultar `profiles`; solo las cerradas consultan el rol. **Al DM sí le
> cuesta**: navegar a cualquiera de las ocho cerradas —que es donde vive— hace
> en el proxy la misma consulta que `getSessionProfile()` ya hace en el layout,
> dos veces por request. Es asumible y no se ha optimizado.
> **`/personaje` gana enlace propio en la barra** («Ficha»). La barra del
> jugador queda: `Inicio · Ficha · Reino · Crear · Inventario`.
> **`/` es ahora el panel del jugador** (cuatro puertas); el DM conserva la
> portada de siempre, movida intacta a `components/home/PortadaDm.tsx`.
> **Abrir una sección = añadir su ruta a `RUTAS_JUGADOR` y desplegar.** Se
> descartó `app_config` **a propósito**: no está en la publicación realtime.
> **`scripts/check-acceso.ts` es el gate 25** y exige que **toda** ruta con
> página de `app/` esté clasificada, **incluidas las anidadas**: tanto
> `app/tesoreria/` como `app/reino/secreto/` hacen fallar el gate (probado por
> mutación). Lo anidado importa porque heredaría el permiso de su padre por la
> regla de prefijo y se colaría abierto. También comprueba que las **puertas**
> del jugador (`PUERTAS_JUGADOR`, las que pintan la portada y `/cerrado`) sigan
> abiertas.
>
> **Tres cosas que hay que saber, y ninguna es un descuido:**
> 1. **Una URL inexistente (`/asdfasdf`) da «se abrirá más adelante», no 404.**
>    Es deliberado: la alternativa —una lista explícita de rutas cerradas— haría
>    que una ruta nueva sin clasificar quedara **abierta** al jugador. Fallar
>    cerrado es la dirección correcta.
> 2. **Si la consulta de rol falla, hasta un DM vería `/cerrado`.** También es la
>    dirección correcta para una puerta. Si le pasa a alguien, el primer sitio
>    donde mirar es que su fila en `profiles` tenga `role = 'dm'`.
> 3. **`/api/*` sigue SIN control de rol.** `isPublic` los deja pasar. Un jugador
>    con la consola abierta puede llamar `/api/ia` aunque `/taberna` esté
>    cerrada. **Es otra tanda**, dicha a propósito, no un olvido.
>
> **El barrido de enlaces cazó uno que el plan no tenía**: `SiteFooter.tsx` se
> renderiza vía `layout.tsx` en **todas** las páginas y enlazaba a `/mapa` y
> `/narrador`. El grep del plan no lo veía porque sus hrefs viven en un array
> (`{ href: "/mapa" }`), no como atributo. También cayó el fallback de continente
> sin página propia de `ReinoRegions` y la sección «Ir al combate» de la ficha.
> **Nada probado en la app en vivo** (todo tras el login): lo que tiene que
> probar el usuario está al final de
> `docs/superpowers/plans/2026-07-30-alcance-jugador-arranque.md`.
>
> **LO SIGUIENTE está en `docs/PROMPT-SIGUIENTE-SESION.md`**, y son dos cosas:
> **(1)** quitar el apartado **«Dados del grupo»** de `/personaje` —la sección de
> `app/personaje/page.tsx` que monta `DicePanel`—, teniendo en cuenta que ahí es
> donde el jugador ve y responde las **peticiones de tirada del DM**
> (`useRollRequests`) y **no hay otro sitio donde las vea**; y **(2)** empezar las
> **mecánicas jugables de las pericias**: primero la lista entera de las 18 (hoy
> en `data/rules.ts` son solo nombre + aptitud, sin una línea de qué hacen) y de
> ahí la mecánica de cada una. El precedente más parecido que ya existe es
> `components/lugar/SaberRoll.tsx`.

> **Lo último (2026-07-30, tarde): el creador rehecho y el arte de las especies.**
> **Escenas de Especie y Clase**: navegan igual (flechas a los lados, emblema
> grande, tira de miniaturas abajo; recorrido por región/grupo). Se arregló que
> el detalle **no crecía** (`.scene-detail` sin `flex:1`) y todo quedaba
> apelotonado a la izquierda, que las flechas eran **barras a toda altura**, y
> que las miniaturas cuadradas **recortaban** el arte vertical. El marco de arte
> gana `.art-bleed` (relleno desenfocado) para que un arte 1024×1024 se vea
> entero en un marco 659×1025.
> **Ventanas emergentes** (`components/crear/Modal.tsx`): en Clase, al elegir
> subclase (descripción + rasgos por nivel + fe); en Especie, tres (elegir
> linaje, describir especie, describir linaje).
> **Fe predefinida**: `data/subclassDeity.ts` — 10 subclases rellenan la deidad.
> **Región nueva «Planos y Paraje Feérico»** (Eladrin, Shadar-kai, Gith) y
> **`scripts/check-especies.ts`, el gate 24**, que valida que la región de cada
> especie exista y que el recorrido cubra las 36 una vez: sin eso una región mal
> escrita **hace desaparecer especies sin ningún error**.
> **Las 36 especies tienen emblema** en `public/species/<slug>.jpg` (JPEG
> 1024×1024, 3,1 MB; llegaron como PNG de 151 MB y se reencodearon).
> Gate: tsc + next build + **24 checks** en verde. UI verificada en navegador con
> banco de pruebas estático; en la app viva la aprobó el usuario.
> *(Lo que este bloque anunciaba como «lo siguiente» —estrechar la app para el
> arranque— **ya está hecho**: es el bloque de arriba, del 2026-07-30 por la
> noche. `docs/PROMPT-SIGUIENTE-SESION.md` apunta ahora a otra cosa.)*

> **Lo último (2026-07-30): subclases rehechas (fase 1, foundation).** Se
> borraron las **52 subclases** viejas (4/clase) y se pusieron **65 nuevas** (13
> clases × 5), ambientación Exandria 2024, de momento **nombre + blurb** en
> `data/classes.ts` (ningún consumidor tocado). **No se añade Artificiero.**
> `subclassLabel` intacto. Nombres del Brujo en formato «Patrón del X». Antes
> `check-clases.ts` no miraba subclases; ahora tiene **dientes** (13 clases, 5
> c/u, 65 total, nombres únicos, name/blurb/label no vacíos). Gate: tsc + next
> build + 23 checks en verde; prueba de mutación confirma que muerden. Spec/plan
> en `docs/superpowers/{specs,plans}/2026-07-30-subclases-rehacer*`.
> **Pendiente que solo hace el usuario**: correr `delete from public.characters;`
> en el SQL Editor de Supabase — las fichas de prueba guardan la subclase por
> nombre y quedaron con nombres inexistentes al renombrar.
> **FASE 2 HECHA: mecánica por subclase (las 65).** Rasgos por nivel de las 65
> subclases en `data/classdata/subclases/<clase>.ts` (13 archivos, tipo nuevo
> `SubclassFeature {level,name,text}`, registro en `subclases/index.ts` +
> `subclassFeaturesFor`). La ficha (`CharacterSheet.tsx`) pinta los rasgos reales
> de la subclase elegida (texto completo, `white-space: pre-wrap`); se quitaron
> los placeholders `subclass:true` de los 13 `classdata`. `check-clases.ts` valida
> integridad referencial nombre↔nombre, ≥3 rasgos/≥1 a nv3, niveles ascendentes,
> no vacíos, y **65/65** con mecánica sin placeholders supervivientes. Fuentes:
> `Downloads/subclases.md` (50) + `docs/superpowers/specs/2026-07-30-subclases-mecanica-fuente15.md`
> (15). Gate: tsc + next build + 23 checks en verde. **Nada probado en la app en
> vivo** (sin sesión): verificar en `/crear` → elegir clase+subclase → ver rasgos
> por nivel en la ficha.

> **Lo último (2026-07-29): dos continentes de atlas.** **Tal'Dorei** pasó de 45
> a **94 POIs** (tres capitales inexistentes, Emon en la región equivocada, las
> coordenadas sin colocar, cero comprobaciones del gate) y **Wildemount** de 25 a
> **158**, reestructurado en **8 regiones —una por hoja de mapa—** en vez de 4.
> De paso se generalizó la maquinaria (`data/regionRatio.ts`, `lib/continente.ts`
> con el gate por continente, `ATLAS_FIXES`) y se arregló que el **visor de
> región descolocaba los pines**. Gate: **23 scripts**. Ver las tres secciones
> RESUELTO de abajo.
> **Faltan Issylra, Marquet y los Dientes Rotos**: no tienen submapa rotulado
> propio, así que necesitan fuentes (mapas o libros) que el usuario pase.

> [!warning] 🎲 **Lo siguiente NO es código: es jugar una sesión.**
> Hay **siete features seguidas en producción y nunca vistas en una partida**
> (G4, O2, la mudanza a `/combate`, los objetivos múltiples, la retirada del
> tablero, la documentación y **la fase 1 de los monstruos**). Todas pasaron el
> gate; ninguna se ha jugado. La séptima se construyó **sabiendo** que la deuda
> existía, así que la cuenta ya no es un descuido: es una decisión que hay que
> pagar antes de la fase 2.
> Esa deuda ya costó una: el **tablero de batalla** se construyó entero —rejilla,
> fichas, medición, migración `schema_v22`— y se retiró **sin haberlo probado
> nunca**, porque no encajaba con cómo se juega. Una sola partida lo habría
> evitado.
> **Las guías de qué probar y en qué pantalla están en cada sección `## RESUELTO`
> de abajo.** Lo más sospechoso, por orden: que el `play_state` (PG, huecos,
> condiciones) **sobreviva a recargar la página**; que el **contador de turno se
> reinicie solo al tocarte**; y que el **realtime entregue sin recargar**.
> La **fase 2** de los monstruos (la «arena») está **bloqueada a propósito** hasta
> que eso pase.

> **Lo último (2026-07-21 → 23)**:
> 1. Se amplió el mundo — Marquet, Issylra y los Dientes Rotos con mapa y saber
>    propios, +50 pines, y `mergeAtlas` para que lo nuevo llegue a un
>    `atlas_defs` ya sembrado sin pisar las ediciones del DM.
> 2. Se **reorganizó `/reino`**: el saber va por **lugar → categoría**, cada
>    lugar con su color, en bloques plegables, con sección propia para
>    **Exandria y la Calamidad** y revelado en bloque para el DM.
> 3. **`/panteon`** (abierta, 32 dioses por bando) y **`/reino/[continente]`**
>    (una página de lore por continente, geografía abierta y el resto gateado).
> 4. **Fase O1 — recursos de clase**: 11 pozos que se gastan con un toque y los
>    recarga el descanso. Migración `schema_v20`.
> 5. **(2026-07-22) La ficha deja de desaparecer** por una migración a medias —
>    cuatro arreglos y la reparación `schema_v21`. Es la tanda más importante de
>    leer: ver su sección RESUELTO.
> 6. **(2026-07-23)** `--color-gold` arreglado (pines de continente y marcos de
>    mapa sin color).
> 7. **(2026-07-23) G1 — estado del combatiente**: PG actuales/temporales,
>    salvaciones de muerte, 14 condiciones y agotamiento en la hoja y en el panel
>    del DM, en vivo; las condiciones aplican ventaja/desventaja de verdad a las
>    tiradas. Primera losa de la jugabilidad 2024. Ver su sección RESUELTO.
> 8. **(2026-07-24) G2 — economía de turno y ataque**: marcador de acción/
>    adicional/reacción/movimiento que se limpia solo al tocarte el turno, y
>    tirada de ataque desde la ficha (tabla de armas, característica correcta,
>    competencia derivada, ventaja de G1). Segunda losa. Ver su RESUELTO.
> 9. **(2026-07-24) G3 — tablero de batalla**: rejilla con fichas que el DM y los
>    jugadores mueven en vivo, con medición de distancia. Tercera losa
>    (`schema_v22`, ya ejecutada). Ver su RESUELTO.
> 10. **(2026-07-25) G4 — targeting**: elegir el objetivo del ataque desde la
>     ficha (usando las posiciones del tablero), con **alcance del arma** que
>     bloquea si no llegas, **ventaja del atacante** por la condición del objetivo,
>     **crítico automático** (20 natural + proximidad) y **fallo automático de
>     salvación** Fue/Des. Cuarta losa, **sin migración**. Ver su RESUELTO.
> 11. **(2026-07-26) Fase O2 — conjuros**: preparar con tope, gastar y recuperar
>     huecos, y **lanzar** (gasta el hueco, lo anuncia al feed y tira lo que el
>     conjuro traiga). Cierra la Fase O. **Sin migración** (`play_state`). La
>     biblioteca de conjuros arranca con **32** y crece. Ver su RESUELTO.
> 12. **(2026-07-26) El tablero es la pantalla de combate**: el combate se muda
>     de `/personaje` a `/tablero` (iniciativa, rejilla, estado y turno fijos, y
>     ataques/conjuros/rasgos en pestañas con **objetivo compartido**). La ficha
>     queda para stats e inventario. **Sin migración.** Ver su RESUELTO.
> 13. **(2026-07-26) Objetivos múltiples**: la acción de Atacar da **N golpes**
>     (eliges objetivo entre golpe y golpe), con **dos armas ligeras** hay un
>     ataque de acción adicional, y los conjuros de **varias instancias** (Rayo
>     Abrasador, Proyectil Mágico) declaran un objetivo por cada una.
>     **Sin migración.** Ver su RESUELTO.
> 14. **(2026-07-26) Fuera el tablero**: se retira la rejilla. **`/combate`**
>     sustituye a `/tablero` y **la iniciativa es la lista de combatientes**:
>     tocas a alguien y es tu objetivo. Las reglas que medían **se deducen del
>     arma**. **Sin migración**; las tablas del tablero quedan **retiradas, no
>     borradas**. Ver su RESUELTO.

> [!tip] ✅ Todas las migraciones al día (v1–v23)
> **`schema_v23` ejecutada el 2026-07-28.** Con ella, los monstruos del bestiario
> guardan PG y condiciones en su fila de `initiative`: el aviso de «falta la
> migración» desaparece y el botón de añadir monstruos se enciende.
> Si alguna vez reaparece ese aviso, la v23 es idempotente y se puede reejecutar
> sin miedo.
> **`schema_v22` está RETIRADA**: se ejecutó el 2026-07-25 para el tablero (G3),
> y al quitar el tablero el 2026-07-26 sus tablas (`battle_tokens`,
> `battle_board`) quedaron **vacías y sin uso**. **No se han borrado a
> propósito**: borrar tablas es irreversible y no gana nada. No hay que hacer
> nada con ellas.
> `schema_v20` (Fase O1, `play_state`) y
> `schema_v21_reparar_characters.sql` (red de seguridad de `characters`)
> ejecutadas. Ante «column characters.X does not exist», reejecutar la **v21**
> (idempotente).

**Hecho y en `master` (pusheado, Vercel auto-despliega)** esta tanda:
- Fases **F** (tablón), **M completa** (generadores IA + documentos in-game +
  memoria de NPC), **N completa** (clima + saber + pistas).
- **Rediseño «saber por origen»**: cada PJ sabe lo suyo (continente, región,
  deidad) y descubre el resto por tomos, misiones, DM a mano o tirada in situ.
- **`/reino` dejó de volcar lore** (panteón por clase, facciones/Wildemount/planos/
  lunas ocultos) + **calendario nuevo** (rueda + vista de mes) replicado en el
  **reloj desplegable del nav**.
- **Clima extremo con efectos de mesa** (desventajas, salvo personajes curtidos).
- **Vault Obsidian actualizado** por completo (Migraciones, Modelo de datos,
  Panel DM, Crónica, Baúl, Componentes, Rutas, Cosmología, Realtime, Glosario…).

**Nada pendiente en el working tree** (`git status` limpio, todo mergeado a
`master`). Verificación: `tsc --noEmit` + `next build` limpios en cada rama, y
**los 19 `scripts/check-*.ts` en verde el 2026-07-28** (ver «Scripts de
comprobación» abajo). **NADA probado en vivo** (sin sesión ni túnel en dev) —
pruebas del usuario anotadas en cada sección RESUELTA de abajo.

**Dónde está la capa de jugabilidad 2024**: **G1** (estado del combatiente),
**G2** (economía de turno + ataque) y **G4** (targeting: objetivo, ventaja del
atacante, crítico y auto-fallo de salvación) están en `master`; la **Fase O**
está cerrada con **O1** (pozos de clase) y **O2** (conjuros); y los **objetivos
múltiples** ya permiten repartir golpes e instancias. **G3 (el tablero de
batalla) ya no existe**: se retiró el 2026-07-26 y el combate se juega en
**`/combate`**, con la iniciativa como lista de combatientes. Su migración
`schema_v22` se ejecutó y quedó **retirada** (ver el aviso de migraciones).

**Siguiente paso**: **jugar una sesión** con todo lo que hay, fase 1 de los
monstruos incluida (ver el aviso 🎲 de arriba). `schema_v23` ya está ejecutada,
así que **no queda nada que preparar**. La **fase 2** (la «arena») no se empieza
hasta entonces.

**Lo siguiente ya está diseñado y decidido, en dos fases** (spec completo en
`docs/superpowers/specs/2026-07-28-monstruos-al-combate-design.md`):

1. **FASE 1 — los monstruos del bestiario entran al combate.** `initiative` gana
   `monster_slug`/`hp`/`hp_max`/`conds` ⇒ **`schema_v23`**, la primera migración
   desde la v22. El DM **añade monstruos desde el bestiario** (con sus PG, su
   modificador de iniciativa y sus personalizados), **por tandas**, así que un
   jefe nunca comparte iniciativa con sus esbirros. El DM ve `11/13`; los
   jugadores ven «malherido». Deja de llevarse la vida en papel, y **arregla que
   las reglas de G4 no funcionaban contra monstruos** (sin `conds` en la fila, un
   goblin derribado no daba ventaja a nadie). **HECHA el 2026-07-28** (spec, plan,
   código y `schema_v23` ejecutada; ver su sección RESUELTO). **Solo falta
   jugarla.**
2. **FASE 2 — la «arena»** (el combate «más gráfico, tipo Pokémon» que pidió el
   usuario): dos bandos enfrentados con retratos y barras de vida, menú de
   acciones tipo consola y caja de texto narrando las tiradas. **Solo piel, cero
   reglas.** El reparto de pantalla está **maquetado y validado**, y descrito al
   final de ese mismo spec.

> ⚠️ **La fase 2 NO se empieza hasta haber jugado una sesión con la fase 1.**
> Decisión del usuario y del asistente, por una razón concreta: se llevan **seis
> features seguidas sin probar en vivo**, y la arena es la primera cuyo acierto
> depende de **cómo se siente jugando**, no de si el código es correcto.

En paralelo: **ampliar la biblioteca de conjuros**
(la semilla son 32 — 11 trucos y 21 de nivel 1–3 —, crece como el bestiario), los
**pozos de las 5 clases que faltan** (bardo, mago,
pícaro, brujo y cazador de sangre — usos derivados de un modificador o fórmula,
otro modelo), **Fase P** (downtime + minijuegos), **Fase Q** (misiones
personales con IA), **C2** (regateo con Persuasión — quedó esperando al control
de descansos, que ya existe), **G** (capa gráfica). Detalle y orden en
`docs/superpowers/specs/2026-07-12-campana-semivirtual-guia.md`.

**Convenciones de trabajo**: rama feature por tarea → gate `tsc --noEmit` +
`next build` (no hay tests; ese es el gate real) → commit por tarea con trailer
`Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` y autor
`CarlosAlbertt` → HANDOFF + vault → merge a `master` + push. **Ojo**: para
mensajes de commit con backticks, usar heredoc (`git commit -F -`), que si no
bash los ejecuta. Clon canónico: `C:\Users\carlo\Downloads\dnd-campaign-app`.

## Qué es
App web multijugador en tiempo real para una campaña de **D&D 2024** en el mundo
de **Exandria**, ambientada en el continente de **Tal'Dorei**. Roles **DM**
(admin) y **jugador**.

- Repo: https://github.com/CarlosAlbertt/Exandria (privado, rama `master`)
- Carpeta local: `C:\Users\carlo\Downloads\dnd-campaign-app`
- Desplegado en Vercel: **https://exandria.vercel.app**
- Cuenta DM: usuario `admin` (email `admin@taldorei.local` en Supabase Auth)

## Stack
Next.js 16 (App Router, Turbopack) · React 19 · Tailwind CSS v4 · TypeScript ·
Supabase (Auth + Postgres + Realtime) · IA local con **Ollama** vía túnel
**cloudflared**.

> `AGENTS.md`: este Next 16 tiene cambios rompedores (p. ej. `middleware`→
> `proxy.ts`). Leer `node_modules/next/dist/docs/` ante dudas de API.

## Estructura
- `app/` — páginas: `/` (home), `/reino` (lore), `/crear` (creador de
  personaje), **`/personaje`** (la ficha: aptitudes, salvaciones y pericias con
  sus tiradas, equipo, inventario, nivel e historia — **el combate ya no vive
  aquí**), **`/combate`** (la **pantalla de combate**: la iniciativa como lista
  de combatientes a la izquierda —tocas a alguien y es tu objetivo—, estado,
  turno y acciones en pestañas a la derecha, y la tira de tiradas abajo. **Sin
  rejilla**: el tablero se retiró el 2026-07-26), `/inventario`, `/mapa`, `/taberna`
  (NPC IA), `/narrador` (chat IA personal), `/cronica` (diario/misiones/PNJ del
  grupo), `/login`, `/dm` (panel DM).
- `app/dm/` — `DmDashboard.tsx` con pestañas: Narración (`NarracionPanel` +
  `AiConfigPanel`), Grupo (`GrupoPanel`), Baúl (`BaulPanel`), Dados
  (`DadosPanel`: pedir tiradas, iniciativa), Crónica (`CronicaPanel`: diario,
  misiones, PNJ), **Mesa** (`EncuentrosPanel`: calculadora de encuentros +
  notas privadas del DM), **Tiempo** (`RelojPanel`: play/pausa, avance rápido
  de descansos/días, fijar fecha y hora del reloj de campaña), Regiones
  (`RegionesPanel`), Mapa (`MapaPanel`), Usuarios (`UsuariosPanel`).
- `app/api/` — `ia` (proxy a Ollama), `admin/users` (crear usuarios,
  service_role), `dm/character` (el DM edita/entrega en la hoja de cualquier
  jugador: `setLevel`, `addXp`, `addItems`, `addGold`, service_role), `version`
  (commit desplegado).
- `data/` — `species.ts` (10 especies + linajes), `classes.ts` (13 clases ×4
  subclases, incl. Cazador de Sangre), `classdata/` (datos mecánicos 2024 por
  clase: rasgos, tabla de progresión, espacios de conjuro — un archivo por
  clase + `spellSlots.ts`/`types.ts`), `backgrounds.ts` (16), `rules.ts`
  (aptitudes/pericias/point-buy), `leveling.ts` (competencia, PG, ASI, tabla
  XP 2024), `encounters.ts` (presupuesto de XP por dificultad + XP por CR,
  DMG 2024), `taldorei.ts` (regiones+MAPS+REGION_RATIO+lore de Tal'Dorei),
  `pois.ts` (tipo `Poi`/`PoiType` + iconos/colores), `atlas.ts` (semilla del
  **atlas por continente**, ver «Atlas» abajo), `npcs.ts`, `equipment.ts`,
  `equipmentSlots.ts`, `loreText.ts` (guía de narración + lore para la IA).
- `lib/` — `supabase/{client,server,env,proxy-session}.ts`, `auth.ts`,
  `character.ts` (+`useParty`), `derive.ts` (motor de ficha derivada: PG, CA,
  modificadores, salvaciones, pericias — misma fuente de verdad para hoja y
  panel DM), `dice.ts` (tiradas), `gameDate.ts` (festividades por fecha de
  campaña, formato "D de Mes, AAAA PD"), `gameClock.ts` (derivación pura del
  reloj: minuto de juego absoluto ↔ fecha/hora/estación/luna/festividad;
  `momentFromGameMin`/`gameMinFromMoment`), `useGameClock.ts` (hook +
  mutaciones del reloj de campaña, ver «Reloj de campaña» abajo), `slug.ts`
  (`slugify`, módulo neutral sin "use client" para poder importarse desde
  `data/*`), hooks realtime: `useLiveSession`, `useRegions`, `usePois`,
  `useGroupAction`, `useNpcChat`, `useDiceFeed`, `useRollRequests`,
  `useInitiative`, `useChronicle`, `useDmStash`, `useAtlas` (ver «Atlas»
  abajo), `useWorldPois`, `narrador.ts` (cliente `/api/ia`).
- `components/` — SiteNav/Footer, EpicOverlay, GroupConsensus, RegionExplore,
  PinDragMap, RegionCard, Emblem, SessionProvider, ErrorBoundary,
  `ClockWidget` (reloj de campaña: variante compacta en la barra de
  navegación y variante grande en paneles).
- `public/maps/` — `taldorei.jpg` es ahora el **mapa del mundo de Exandria**
  (2560×1707, horizontal; sustituyó al mapa vertical solo-continente).
  `public/maps/pueblos/` — mapas de pueblo (emon, oestruun, piedrablanca,
  riscomartillo, stilben, syngorn), enlazados desde `data/townMaps.ts`.
- `data/world.ts` — pines del **mundo** (continentes, regiones, ciudades) con
  jerarquía continente→región→lugar; `data/cosmology.ts` — calendario,
  estaciones, lunas, planos.
- `lib/useAtlas.ts` — regiones+POIs editables de los **5 continentes
  habitados** (Tal'Dorei, Issylra, Wildemount, Marquet, Dientes Rotos),
  persistidas como **JSON en `app_config`** (sin migración; ver «Atlas»
  abajo). `lib/useWorldPois.ts` sigue vivo pero **acotado**: ya no es
  superficie de edición de POIs (eso vive en el atlas, por región); se
  mantiene solo para los **pines de navegación de continente** en `/mapa`
  (clic para hacer zoom), la **niebla** de continentes no revelados y las
  etiquetas de **Mares** (que no tiene regiones). Ver «Atlas» abajo para el
  detalle de la migración y la limitación conocida del editor DM.
- `supabase/schema*.sql` — migraciones (ver abajo). `schema_v7.sql` (tabla
  `world_poi`) quedó **sin uso**: se optó por `app_config` en su lugar.

## Funcionalidades
- **Auth** por usuario+contraseña (mapeo a email sintético `u@taldorei.local`,
  o email completo si lleva `@`). Sin registro público; el DM crea usuarios.
- **Creador de personaje** (localStorage + Supabase si hay sesión): nombre
  obligatorio, especie+linaje obligatorio, clase+subclase, trasfondo, aptitudes
  (compra de puntos 27 + bonus de trasfondo), pericias, historia/lore (12000
  car.). Pasos bloqueados hasta completar. Subrazas: Elfo3, Dracónido10,
  Goliat6, Tiefling3, Aasimar3, Gnomo2, Enano2·, Humano2·, Mediano2· (·=variante
  clásica 2014 añadida a petición; Orco sin subraza — correcto).
- **Inventario** por huecos = 20 + 2×(mod Fuerza). En Supabase con sesión.
- **Mapa** (`/mapa`) jerárquico: **Exandria → continente → regiones
  explorables**. El mapa mundial solo muestra pines de continentes +
  mares/océanos (`useWorldPois`); clic en un continente hace zoom (CSS) y
  revela **sus regiones** (los 5 continentes habitados tienen regiones desde
  el atlas, no solo Tal'Dorei). Pines de continente **con etiqueta**; el
  resto: clic para ver el detalle en el panel lateral. **Niebla** sobre
  continentes no revelados (opaca para jugadores, translúcida/clic-a-través
  para el DM). Botón **pantalla completa**. Cada región abre su visor de zona
  (`RegionExplore`) con submapa (o marco «Región sin mapa propio» si aún no
  tiene imagen) + POIs revelados uno a uno; algunos POIs (Emon, Syngorn…)
  abren además su **mapa de pueblo** a pantalla completa.
- **Atlas por continente** (`data/atlas.ts` + `lib/useAtlas.ts`, key
  `atlas_defs` en `app_config`): generaliza el modelo antiguo de Tal'Dorei
  (`Region`+`Poi`, ex `useTaldorei` — retirado en la limpieza del
  2026-07-12, sin consumidores) a los 5 continentes habitados. `seedAtlas()`
  arma la semilla la primera vez que falta `atlas_defs`: Tal'Dorei reutiliza
  `data/taldorei.ts`/`data/pois.ts` tal cual; Issylra/Wildemount/Marquet/
  Dientes Rotos se generan a partir de `REGIONS_BY_CONTINENT` +
  `WORLD_POIS` (`data/world.ts`), con slugs de región **únicos
  globalmente** (`uniqueRegionSlug`, prefijo de inicial de continente si
  choca) porque `poi_state`/`region_state` indexan por slug sin distinguir
  continente. Si existían `taldorei_defs` (ediciones viejas) y no
  `atlas_defs`, se preservan al sembrar (no se pierden ediciones previas).
  **Cómo subir un submapa de región**: soltar el `.jpg` en
  `public/maps/<continente>/<slug>.jpg` (p. ej. `public/maps/marquet/
  ank-harel.jpg`) y fijar `image` en la región del atlas. Ahora mismo eso es
  **solo de código/seed**: el editor DM (`app/dm/MapaPanel.tsx`) todavía no
  tiene un campo `image` en el formulario de región, así que para
  Issylra/Marquet/Dientes Rotos hay que añadir la ruta a mano (una tabla
  como `WILDEMOUNT_IMAGES` en `data/atlas.ts`, o parchear el JSON de
  `atlas_defs` directamente en Supabase). **Wildemount ya tiene sus 4
  regiones mapeadas** (`WILDEMOUNT_IMAGES` en `data/atlas.ts`: Imperio
  Dwendaliano→zemni_fields, Xhorhas→xhorhas, Costa del Serrallo→
  menagerie_coast_south, Yermos Grisáceos→greying_wildlands); Issylra,
  Marquet y Los Dientes Rotos van con `image: ""` (fallback «Región sin mapa
  propio», POIs igualmente posicionados por % sobre el marco) hasta que se
  suban y enlacen submapas propios. **Limitación conocida** (detectada en la
  revisión de la Tarea 3): en el editor DM, la superficie de arrastre de
  **regiones** siempre es el mapa del mundo (`taldorei.jpg` recortado por
  continente) y sus pines son % del mapa mundial — correcto. Pero para
  **POIs** de una región sin `image` propia, el fondo de arrastre cae al
  mismo mapa del mundo (sin recortar a esa región), así que no representa
  la región real aunque las coordenadas x/y del POI se guardan bien; solo
  se arregla visualmente subiendo un submapa para esa región. **Pines
  planos (`world_pois`) deprecados como superficie de edición**: los POIs
  ahora se crean y editan por región dentro del atlas; `world_pois` se
  conserva solo para los pines de navegación de continente + niebla +
  etiquetas de Mares en `/mapa` (ver bullet de `useWorldPois` arriba). Los
  pines planos que el DM hubiera creado a mano en `world_pois` **no se
  migran automáticamente** a regiones (fuera de alcance del plan del
  2026-07-11) — hay que recrearlos por región si se quieren conservar.
- **Editor de mapa (Panel DM › Mapa)**: selector de **continente** (Tal'Dorei
  · Issylra · Wildemount · Marquet · Los Dientes Rotos — Mares no tiene
  regiones) + sub-pestañas **Regiones** y **POIs por región**, con CRUD
  completo (añadir/editar/borrar/mover el pin de región sobre el mapa del
  mundo/mover y revelar POIs sobre el submapa de la región) para el
  continente elegido. El modo antiguo de pines planos del mundo (`Todos` /
  `Mares` con CRUD manual) se retiró del editor en la Tarea 3 — esos pines
  ahora solo se leen desde `/mapa` (navegación de continente + niebla +
  Mares), ver «Atlas por continente» arriba. Botón **«Ampliar»** en los
  mapas de arrastre con zoom manual (+/-, rueda, arrastrar) solo para el DM.
  Guardado **optimista** (el cambio se ve al instante, luego persiste).
- **Lore del reino** (`/reino`): historia de Exandria por eras (Fundación →
  Arcanos → Calamidad → Divergencia 0 PD → Reclamación → ~836 PD), continentes
  descubiertos, panteón, facciones, **calendario** (328 días/11 meses/semana
  de 7), **estaciones**, **festividades**, **lunas** (Catha/Ruidus) y
  **planos de existencia**.
- **Narración en vivo (Realtime)**: el DM narra (IA o manual) a **todo el grupo**
  o **visión individual** a un jugador → `EpicOverlay` cinemático.
- **Consenso de grupo (portavoz)**: en narración grupal, un jugador "toma la
  palabra", redacta y envía; el resto ve el borrador y marca "de acuerdo". Envío
  habilitado cuando todos los demás están de acuerdo.
- **Taberna** (`/taberna`): chat de grupo en vivo con la NPC **Garda** por IA.
- **Panel DM › Grupo**: ve las fichas de los jugadores (aptitudes, PG, pericias,
  inventario, historia) en tiempo real.
- **IA** vía `/api/ia` → Ollama. Host resoluble desde `app_config.ollama_host`
  (editable por el DM, sin redeploy) o `OLLAMA_HOST` (env). Modelo por defecto
  `qwen2.5:14b`.
- **Reloj de campaña en tiempo real**: corre solo a razón de **10 min reales =
  1 h de juego**, sincronizado en vivo por Realtime (`app_config.campaign_clock`,
  JSON, sin migración). Widget compacto en `SiteNav` y grande en Panel DM ›
  **Tiempo** (`RelojPanel`: play/pausa, +1 h/descanso corto/largo/+1 día, fijar
  fecha y hora exactas). La Crónica (`/cronica` y Panel DM › Crónica) muestra
  la fecha derivada del reloj en vez de texto libre; `app_config.campaign_date`
  queda **deprecado** (ya no se lee ni se escribe).

## Migraciones Supabase (ejecutar en orden si faltan)
`schema.sql` (profiles, region_state, live_session, is_dm(), RLS, Realtime,
trigger de perfil) · `schema_v2.sql` (target de narración, group_action,
action_ready, npc_chat) · `schema_v3.sql` (pin_x/pin_y, poi_state) ·
`schema_v4.sql` (characters + lore) · `schema_v5.sql` (app_config) ·
`schema_v6.sql` (group_action.speaker) · **`schema_v7` (world_poi) no existe**:
se optó por `app_config` en su lugar y **el archivo no está en `supabase/`**, así
que la numeración salta de la v6 a la v8 ·
`schema_v8.sql` (characters: level/gold/asi/equipment/items) · `schema_v9.sql`
(characters.hp_rolls) · `schema_v10.sql` (characters.xp) · `schema_v11.sql`
(dice_rolls, roll_requests, initiative — ya ejecutada) · `schema_v12.sql`
(journal_entries, quests, npcs_met, app_config.campaign_date — ya ejecutada) ·
`schema_v13.sql` (**stat_rolls** — Fase K: tirada única de aptitudes,
inmutable por PK + sin policy de update; solo el DM borra = resetear — **ya
ejecutada** el 2026-07-15) · `schema_v14.sql` (**archivar personaje** — ya ejecutada) ·
`schema_v15.sql` (**tiendas**: shops/shop_items/shop_log — ya ejecutada) ·
`schema_v16.sql` (**PNJs**: location_npcs — ya ejecutada) · `schema_v17.sql`
(**tablón**, Fase F: quests gana el estado `'oferta'` + columnas `poi_name`/
`reward` — ya ejecutada) · `schema_v18.sql` (**memoria de NPC**, Fase M: tabla
`npc_memories` — ya ejecutada) · `schema_v19.sql` (**saber por origen**:
origen/deidad/`lore_unlocked` en `characters`, `quests.unlock_lore`, tabla
`lore_rolls` — ya ejecutada) · `schema_v20.sql` (**Fase O1**:
`characters.play_state jsonb default '{}'`, los usos gastados; **una sola
columna para toda la Fase O** — O2 le añadirá `huecos`/`pacto`/`preparados` sin
otra migración — ya ejecutada) · **`schema_v21_reparar_characters.sql`** (**no
es una feature, es una red de seguridad**: declara de una vez las **25 columnas**
que la app espera de `characters`, cada una con el tipo y el default de la
migración que la introdujo. Idempotente y **solo añade** — ya ejecutada). El
bucket de Storage `assets` (`storage-assets.sql`, Fase H) también ejecutado ·
`schema_v22.sql` (**G3 tablero**: `battle_tokens` + `battle_board`) ·
**`schema_v23.sql`** (**FASE 1 monstruos al combate**: `initiative` gana
`monster_slug`/`hp`/`hp_max`/`conds`, las cuatro opcionales y **solo para PNJ** —
los jugadores siguen en `characters.play_state`. RLS y realtime de la v11 sin
tocar. **Ejecutada el 2026-07-28**). **v1–v23 al día**; `schema_v22` ejecutada el
2026-07-25 (y luego retirada con el tablero), `schema_v23` el 2026-07-28. G4
(targeting), O2 (conjuros), la pantalla de combate y los objetivos múltiples no
llevaron migración.

> [!tip] Ante cualquier «column characters.X does not exist», **reejecutar la
> v21**. Una migración que no llegó a correr entera **no deja rastro**: `add
> column if not exists` no falla, pero tampoco avisa de que en su día no corrió.
> La v21 existe justo para eso y se puede reejecutar sin miedo.

> ⚠️ **`schema_v14` no es como las anteriores.** Todas las demás creaban tablas o
> columnas nuevas y vacías. **Esta reestructura `characters` y `stat_rolls` con
> datos dentro**: mueve la PK de `characters` de `user_id` a `id`, y la de
> `stat_rolls` de `user_id` a `character_id`. Si sale a medias no es «la feature
> nueva no va», es «se han movido las fichas». Va entera en una transacción y es
> idempotente. **El código y la migración tienen que aterrizar juntos**:
> ejecutarla con el código viejo desplegado rompe el guardado de fichas, y
> desplegar el código nuevo sin ejecutarla rompe `/crear` y `/personaje` (piden
> columnas que no existen). Ver el milestone de abajo.

## IA / túnel (ritual tras apagar el PC)
Ver **`GUIA-ARRANQUE.md`**. Resumen: doble clic en
`C:\Users\carlo\Desktop\iniciar-tunel-ia.bat` → copia la URL
`https://….trycloudflare.com` → **Panel DM › Narración › Servidor de IA** →
pegar + Guardar + Probar. (`cloudflared.exe` en `C:\Users\carlo\`.)
Comprobar despliegue: `curl https://exandria.vercel.app/api/version`.

## Env (.env.local / Vercel)
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (o `_ANON_KEY`),
`SUPABASE_SERVICE_ROLE_KEY` (solo servidor, para crear usuarios), opcional
`OLLAMA_HOST` / `OLLAMA_MODEL`.

## Convenciones
- Commits acaban con `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- Autor git del repo: `CarlosAlbertt <CarlosAlbertt@users.noreply.github.com>`
  (Vercel bloquea commits con otro email).
- Hooks Realtime usan nombre de canal único por montaje (React remonta 2×).
- Descripciones de reglas/lore son **resúmenes propios**; los datos mecánicos
  y nombres son hechos. Herramienta de fans no oficial.

## Scripts de comprobación
No hay tests; el gate real es `npx tsc --noEmit` + `npx next build` **más** los
`scripts/check-*.ts` que apliquen. Se ejecutan a mano: `npx tsx scripts/check-X.ts`
(no hay entrada en `package.json`). **Son 33**: a los de siempre se sumaron
`check-especies` (subclases), `check-acceso` (alcance del jugador),
`check-pericias` (oficios), `check-alquimia` (ingredientes y pociones),
`check-cocina`, `check-forja` y `check-materiales` (los otros tres catálogos
más el cruce entre los seis), `check-dados` (el puente con `dice-box`) y
`check-origen` (selector de origen ↔ saber). Las secciones RESUELTO solo
nombran los que tocó cada tanda — los demás siguen vivos aunque no se citen.

**La tabla de abajo se quedó desfasada** (decía «son 30» cuando ya eran 32) y
no se ha recontado entera: fíese del recuento total, no de que la tabla liste
todos. Los 33 en verde el **2026-07-31, noche**. `check-dados` no imprime
líneas `OK`, solo `check-dados: ok` — por eso no tiene número aquí.

| Script | OK |
|---|---|
| **`check-origen`** | **22** |
| **`check-dados`** | (sin conteo, ver arriba) |

Recuento anterior:

| Script | OK | Script | OK |
|---|---|---|---|
| `check-archive` | 13 | `check-ficha` | 11 |
| `check-ataque` | 64 | `check-inventario` | 73 |
| `check-atlas` | 349 | `check-lore` | 69 |
| `check-bestiary` | 1629 | `check-slots` | 15 |
| `check-clases` | 116 | `check-spells` | 28 |
| `check-clima` | 32 | `check-statrolls` | 15 |
| `check-clock` | 20 | **`check-taldorei`** | **937** |
| `check-combate` | 49 | `check-targeting` | 51 |
| `check-conjuros` | 49 | `check-turno` | 26 |
| `check-derive` | 35 | **`check-wildemount`** | **1026** |
| `check-dice` | 20 | `check-estado` | 35 |
| `check-dicebox` | 19 | `check-especies` | 272 |
| **`check-acceso`** | **97** | **`check-pericias`** | **281** |
| **`check-alquimia`** | **82** | **`check-cocina`** | **26** |
| **`check-forja`** | **33** | **`check-materiales`** | **40** |

> Las reglas de `check-taldorei` y `check-wildemount` viven en
> `lib/continente.ts` (`comprobarContinente`): añadir un continente con submapas
> es escribir su `data/<cont>.ts` y un `scripts/check-<cont>.ts` de tres líneas,
> no copiar el gate.

> `check-tablero` se borró con el tablero el 2026-07-26. Las cuentas que citan
> las secciones RESUELTO son las **del día que se escribieron** y algunas ya no
> cuadran (p. ej. O2 dice «check-estado (36)» y «check-targeting (49)»); manda
> esta tabla.

## RESUELTO (2026-07-29): Wildemount, ocho regiones y 158 POIs 🗺️
Rama `atlas-wildemount`. **Sin migración.** Spec y plan en
`docs/superpowers/{specs,plans}/2026-07-29-atlas-wildemount*`. Ejecutada con
subagentes (uno o dos por hoja, revisión del coordinador entre tandas).

**El problema no era el vacío, era el desajuste.** Wildemount tenía 4 regiones
**políticas** y 8 hojas de mapa **geográficas**: el Imperio Dwendaliano ocupaba
dos hojas (Campos Zemni + Valle del Tuétano), la Costa del Serrallo otras dos, y
Eiselcross y la Costa de la Plaga no existían como región. **La mitad del
continente no tenía dónde caer**, y sus 25 POIs se derivaban de `WORLD_POIS`
—los pines del mapa del mundo— con coordenadas que como coordenadas de región no
significan nada.

**Decidido con el usuario**: ocho regiones, una por hoja, **añadiendo** cuatro
(Valle del Tuétano, Costa del Serrallo Norte, Eiselcross, Costa de la Plaga) sin
renombrar las cuatro que había. Es aditivo, así que un `atlas_defs` ya sembrado
recibe las nuevas sin riesgo de duplicar. Lo político (Imperio, Dinastía Kryn,
Concordato Clovis) se cuenta en el blurb de cada región, no en su nombre.

**Lo que hay ahora**: **158 POIs** (eran 25), leídos de los ocho hexmaps
rotulados. Reparto: Imperio 23, Valle del Tuétano 25, Xhorhas 23, Costa del
Serrallo 27, Serrallo Norte 16, Yermos Grisáceos 16, Eiselcross 17, Costa de la
Plaga 11. Las 31 ciudades y fortalezas nuevas tienen pin en el mapa del mundo;
los ~120 accidentes naturales no (mismo criterio que Tal'Dorei).

**Lo que se generalizó, para que el siguiente continente no obligue a copiar:**
- **`REGION_RATIO` → `data/regionRatio.ts`.** Vivía en `data/taldorei.ts`, que
  con 16 regiones dejaba de tener sentido. Cada entrada se comprueba contra la
  cabecera del JPG.
- **Las reglas del gate → `lib/continente.ts`** (`comprobarContinente`).
  `check-taldorei` y `check-wildemount` son ahora tres líneas cada uno. **Cero
  reglas duplicadas.**
- **`TALDOREI_FIXES` → `ATLAS_FIXES`**, con campo `continente` y `borrar?`.
  Wildemount aporta 25 correcciones (los 25 POIs viejos cambiaban de posición
  porque llevaban coordenadas del mundo; seis cambian de región; el «Valle del
  Tuétano» dejó de ser POI y pasó a ser región).
- **Wildemount deja de derivar de `WORLD_POIS`**: `seedAtlas`/`mergeAtlas` tienen
  un mapa `CONTINENTES_PROPIOS` (Tal'Dorei + Wildemount) en vez de una rama
  `if (contName === "Tal'Dorei")`.

> **La regla de contenido de esta tanda**: de la mayoría de estos sitios solo se
> sabe **lo que enseña el mapa**. El blurb describe el terreno, qué tiene al lado
> y qué ruta pasa; **no inventa historia** (batallas, fundadores, maldiciones)
> que no esté en ninguna fuente. Los nombres y datos son hechos; el texto es
> redacción propia. La wiki de Critical Role se consultó por el **panel Browser**
> (`WebFetch` da 402 y `defuddle` 403 contra Fandom).

> **Tres trampas cazadas:**
> 1. **`data/wildemount.ts` ya existía** con las regiones de lore del sistema de
>    Saber. El subagente lo renombró a `WILDEMOUNT_LORE_REGIONS` en vez de
>    pisarlo; `check-lore` confirma que Saber sigue intacto.
> 2. **Choque de nombres entre continentes**, que es real porque `poi_state`
>    indexa por nombre sin distinguir continente. «Frigid Depths» de los Campos
>    Zemni chocaba con «Profundidades Gélidas» de Tal'Dorei → «Mar de las
>    Profundidades Gélidas». `comprobarContinente` recibe los `nombresAjenos` de
>    los otros continentes y lo caza.
> 3. **Rótulos que sangran entre hojas vecinas.** Cada hoja rotula lugares de la
>    de al lado en su borde (Molaesmyr sale en Zemni y en los Yermos; Rumblecusp
>    en el Serrallo y es de los Dientes Rotos). Cada POI se pone **una sola vez**,
>    en la hoja donde su rótulo es central. La unicidad global lo garantiza.

- Verificado: `tsc --noEmit` + `next build` limpios · **los 23 check-scripts en
  verde** (`check-wildemount` 1026, `check-atlas` 349). **NO probado en la app en
  vivo**: `/mapa` exige sesión. La colocación se verificó pintando los 158 pines
  sobre sus ocho hojas (SVG entregados al usuario).
- **Prueba del usuario**: abrir `/mapa` → Wildemount, entrar en las ocho regiones
  y ver que los pines caen sobre su rótulo; que **Eiselcross y la Costa de la
  Plaga** son regiones nuevas navegables; que las ciudades salen en el mapa del
  mundo; y que su `atlas_defs` ya sembrado recibe los cambios sin duplicar (no
  debe aparecer «Valle del Tuétano» como POI ni «Aldea Palebank» en dos sitios).
  Si movió algún pin a mano, se queda donde lo dejó.

## RESUELTO (2026-07-29): el visor de región descolocaba los pines 📍
Rama `fix-visor-region`. **Sin migración.** Salió al probar el atlas nuevo en la
app: **«al pulsar un POI se descoloca el mapa y el POI»**. Eran dos fallos, los
dos preexistentes y los dos amplificados por el contenido nuevo.

1. **Los pines se posicionaban sobre el hueco, no sobre el mapa.** El contenedor
   de `RegionExplore` llevaba `aspectRatio` + `maxHeight: 100%` + un `width`
   explícito. En cuanto el alto disponible no daba para ese aspecto, el alto se
   recortaba y **el ancho no se recalculaba**: el contenedor quedaba deformado
   (medido: **668×230** para una imagen de aspecto 1.294). La imagen se encogía
   y se centraba dentro con `object-contain`, pero los pines seguían en % del
   contenedor **entero** — hasta un **12% del ancho** de separación en un
   portátil a pantalla completa. Ahora la imagen se dimensiona sola
   (`max-w`/`max-h`, alto y ancho automáticos) de modo que **su caja es el
   dibujo**, y los pines viven en una capa medida sobre esa caja con un
   `ResizeObserver`.
2. **El pie tenía dos alturas** —el aviso «Pulsa un punto» y la ficha del POI— y
   el mapa ocupa el hueco que sobra, así que seleccionar recolocaba el mapa y el
   pin se movía **bajo el dedo que acababa de pulsarlo** (medido: 27 px). Los
   blurbs nuevos, de dos y tres líneas, convirtieron un salto imperceptible en
   uno molesto. Ahora el pie tiene **altura fija** y el texto largo hace scroll
   dentro.

**Y un tercero que destapó**: `REGION_RATIO` de Llanuras Divisorias decía
`3300 / 2500` y el JPG es 2000×1545 (**1.294, no 1.320**). Eso deformaba también
la **superficie de arrastre del editor del DM** (`PinDragMap` va con
`background-size: cover`, que solo es exacto si la proporción declarada cuadra
con el archivo): los pines que se arrastraran ahí se guardaban con ~2% de error.
`check-taldorei` ahora **lee la cabecera del JPG** y compara la proporción real
con la declarada. Es la única comprobación que podía cazarlo.

> **La lección de esta tanda, y no es la de siempre**: las cinco anteriores
> fueron «una regla dentro de un componente escapa al gate». Esta es distinta —
> **una regla dentro del CSS no la ve ningún script**. Lo único que se pudo
> automatizar fue la proporción declarada contra el archivo; que los pines caigan
> sobre el dibujo se verificó **midiendo el rectángulo de la imagen y el de la
> capa de pines** en cuatro formas de pantalla (1200×800, 1200×420, 700×900,
> 380×700): coinciden exactamente, la imagen conserva su proporción y abrir la
> ficha no mueve nada. Esa medición no vive en el repo.

- Verificado: `tsc --noEmit` + `next build` limpios · `check-taldorei` y
  `check-atlas` en verde. **La app en vivo la probó el usuario** — así salió el
  fallo.

## RESUELTO (2026-07-29): el atlas de Tal'Dorei, arreglado y poblado 🗺️
Rama `atlas-taldorei`. **Sin migración.** Spec y plan en
`docs/superpowers/{specs,plans}/2026-07-29-atlas-taldorei*`. Ejecutada con
subagentes (uno por tarea, revisión del coordinador entre tareas).

**La sesión iba de poblar los otros cuatro continentes. Al comprobarlo, el que
estaba mal era Tal'Dorei** — el continente donde se juega la campaña. Cuatro
fallos, todos verificados antes de tocar nada:

1. **Tres de las ocho regiones tenían una `capital` que no existe.** Sierras de
   Alabastro apuntaba a «Westruun», que es un POI de **otra región** y encima
   sin traducir (es Oestruun); Pleabruma a «Puerto Sombrío» y Filofulgor a
   «Bys», que **no existen como POI en ningún sitio**. `RegionCard` llevaba
   meses enseñando al jugador una capital a la que no podía ir.
2. **Las coordenadas eran plantilla, no posiciones**: siete pares x/y idénticos
   repetidos entre regiones distintas y todas las capitales en la misma casilla.
   Nadie las colocó nunca sobre el submapa.
3. **Ningún script del gate miraba los 45 POIs de Tal'Dorei.** `check-atlas`
   (118) solo validaba el reparto de `WORLD_POIS` y la unicidad de slugs.
4. **Tal'Dorei no tenía ni un pin en `WORLD_POIS`**: en el mapa del mundo,
   Marquet enseñaba 36 pines y el continente de la campaña, ninguno.

**El hallazgo que lo hizo barato**: los ocho JPG de `public/maps/regions/` son
mapas **rotulados**, y sus hojas se llaman exactamente como las ocho regiones.
Son la fuente de verdad de Tal'Dorei — **no hizo falta ningún libro ni ninguna
wiki**. Al abrirlos salieron fallos que solo se ven mirando el mapa:

- **Cuatro POIs estaban en la región equivocada**: **Emon** (¡la capital!) en la
  Costa Lucidiana cuando su rótulo está en la hoja del Litoral de Filofulgor —
  Emon mira al Mar de Ozmit por el **oeste**, y la Costa Lucidiana es el litoral
  **este**—; **Zephrah** en Crestormentas cuando está en los Summit Peaks de la
  Lucidiana; **Lyrengorn** en Crestormentas cuando está en Torrerrisco; y el
  **Abismo de Cerrofauces** en Pleabruma cuando es el **Ashen Gorge** de
  Crestormentas (renombrado a **Garganta Cenicienta**).
- **Dos nombres propios mal traducidos**: «Lago Anclado» y «Rivera del río
  Anclado» son **Mooren Lake** y **Mooren River Run**. Alguien tradujo *moor*
  como *anclar*; Mooren es un nombre propio.
- **«Bahía de las Dagas» estaba tipada `ciudad`** con blurb de puerto pirata. En
  el mapa, Daggerbay es **una bahía**. No hay ningún puerto ahí.

**Lo que hay ahora**: **94 POIs** (45 arreglados + **49 nuevos** leídos de los
rótulos de las ocho hojas), todos colocados sobre su submapa. La Península de
Pleabruma pasa de 4 a 11: su hoja rotulaba **cinco asentamientos**
(Ezordam-Haar, Hdar-Tye, Ortem-Vellak, Rybad-Kol, T'Zarrm) y el dato conocía
uno. `PoiType` gana **`cueva`** y **`campamento`** (7 tipos). Y las 29 ciudades
y fortalezas del continente ya tienen su pin en el mapa del mundo — los ~60
accidentes naturales **no van**, que ese mapa sirve para navegar entre
continentes, no para el detalle.

> **Cuatro trampas cazadas, y tres las cazó la revisión, no el gate.**
> 1. **Un `Record<PoiType>` escondido en un componente.** Ampliar `PoiType`
>    reventó `TITULO` en `components/reino/ContinenteGeografia.tsx`, que ni el
>    spec ni el plan tenían localizado. Lo cazó `tsc` al instante — que es
>    exactamente para lo que están los `Record` cerrados en vez de arrays
>    sueltos. **Sexta vez** que una regla vive en un componente; primera vez que
>    el diseño la obliga a salir sola.
> 2. **`TALDOREI_FIXES` dejaba un fantasma.** El código del plan construía la
>    lista de destino desde el array **sin el splice** cuando la corrección no
>    cambiaba de región: en un renombre, el filtro por nombre no alcanza al
>    original —el nombre ya es otro— así que el POI viejo sobrevivía. El DM
>    habría acabado con **dos pines**, uno con el nombre retirado. Afectaba a
>    Lago Mooren, Vega del Mooren y Fuerte Daxio.
> 3. **Y el gate no lo veía**, porque sus comprobaciones partían de
>    `seedAtlas()`, que ya trae los nombres nuevos: **ninguna corrección llegaba
>    a casar, así que no probaban nada**. Ahora `check-atlas` reconstruye el
>    estado ANTERIOR deshaciendo cada fix y comprueba lo que importa: el nombre
>    viejo desaparece del continente y el nuevo aparece **una sola vez**.
>    Verificado reintroduciendo el bug a propósito: caza los tres.
> 4. **Un blurb que se quedó mintiendo.** Al renombrar el Lago Mooren, el blurb
>    de la Vega siguió diciendo «el río **Anclado**» — la mistraducción que
>    acababa de salir del nombre. Renombrar un POI no toca los textos que lo
>    citaban. `check-taldorei` gana la comprobación.
> 5. **`seedAtlas()` entrega `data/pois.ts` POR REFERENCIA** (`pois: POIS`, sin
>    copiar). Las simulaciones de `check-atlas` escribían encima y dejaban el
>    módulo tocado en memoria: «Fuerte Daxio» volvía a llamarse «Fort Daxio»
>    para toda comprobación posterior, según el **orden** del archivo. Ahora
>    copian antes de tocar y una comprobación final verifica que el módulo sigue
>    intacto. **Ojo con esto si alguien más consume `seedAtlas()` y muta.**

**Por qué `TALDOREI_FIXES` existe**: `atlas_defs` ya está sembrado en
`app_config`, y `mergeAtlas` **solo suma POIs nuevos por nombre** — no
reposiciona, no renombra y no mueve de región. Sin esa tabla, todo lo de arriba
se habría quedado en el repo y la partida habría seguido con los pines viejos.
Cada corrección **solo se aplica si el POI sigue exactamente como estaba**
(nombre, región y x/y de plantilla); si el DM ya lo movió, **su edición manda**.
Es idempotente.

- **Nuevo script**: `scripts/check-taldorei.ts` (**913** comprobaciones). El
  gate pasa de 21 a **22**. Comprueba: la capital de cada región existe como POI
  **de esa región**, ningún x/y repetido en todo el continente, rango [2,98],
  nombres en español (lista negra de sustantivos comunes ingleses), blurbs de
  40 caracteres mínimo, ningún blurb citando un nombre retirado, `TOWN_MAPS`
  apuntando a POIs vivos, y unicidad de nombre (`poi_state` indexa por nombre).
  `check-atlas` sube de 118 a **206**.
- Verificado: `tsc --noEmit` + `next build` limpios · **los 22 check-scripts en
  verde el 2026-07-29**. **NO probado en la app en vivo**: `/mapa` exige sesión.
  La colocación se verificó pintando los 94 pines sobre sus ocho submapas
  (SVG generados y entregados al usuario), no dentro de la aplicación.
- **Prueba del usuario**: abrir `/mapa`, entrar en las ocho regiones de
  Tal'Dorei y comprobar que cada pin cae sobre su rótulo; que **Emon sale en el
  Litoral de Filofulgor** y ya no en la Costa Lucidiana; que Pleabruma enseña
  sus cinco asentamientos; que las ciudades salen en el mapa del mundo; y —lo
  más importante— que **su `atlas_defs` ya sembrado recibe las correcciones**:
  que no aparezca ningún «Lago Anclado» ni «Fort Daxio» duplicado. Si el DM
  había movido algún pin a mano, ese se queda donde lo dejó.

## RESUELTO (2026-07-28): el inventario, rediseñado 🎒
Rama `inventario-ui`. **Sin migración.** Spec y plan en
`docs/superpowers/{specs,plans}/2026-07-28-inventario-ui*`.

- **`/inventario` deja de redirigir a `/personaje`** y se convierte en la
  pantalla: el muñeco con el retrato del personaje en el centro, las vitales
  debajo, la bolsa agrupada al lado y el detalle del objeto abriéndose en el
  mismo sitio, sin navegar a ningún otro lado. Dos columnas en portátil,
  apiladas en móvil — **se estrecha, no se reordena**, porque el DM juega desde
  un portátil y los jugadores desde el móvil.
- **Lo que hace que se note que pasó algo**: `derive.ts` ya calculaba la CA a
  partir de lo equipado y ya devolvía `acSource` (el motivo en español llano,
  «Coraza + DES (máx 2)»), y nada de eso se mostraba en ningún sitio. El ataque
  y el daño **no están en `derive`**: vienen de `ataqueDe` en `lib/ataque.ts`,
  que ya existía y ya lo cubre `check-ataque`. **Cero reglas nuevas.**
- **La categoría, el icono y el color de cada objeto se deducen del nombre por
  coincidencia exacta, no por subcadena** — para que «Poción de curación mayor»
  salga como «Otro» en vez de arriesgarse a pintar de verde una «Poción de
  veneno».
- **Permisos**, decididos por el usuario a media implementación: el jugador
  **equipa, desequipa y escribe notas**; **añadir, soltar y las cantidades son
  cosa del DM**, que llega a la bolsa de un jugador por `/inventario?user=<id>`.
  Salió de descubrir que `app/personaje/page.tsx:19` pintaba la ficha de un
  jugador **en modo solo lectura incluso para su propio dueño** — nunca podía
  editar la suya.

> **Cuatro trampas cazadas.**
> 1. **El spec afirmaba un bug que no existía**: que soltar un objeto equipado
>    dejaba un hueco obsoleto en el muñeco. Falso — equipar **saca** el objeto
>    de la bolsa (`quitarUno`), así que no hay forma de soltarlo desde ahí para
>    empezar. Venía de leer `changeQty` sin leer `equipInto`.
> 2. **El plan sustituía un comentario verdadero por una tranquilidad falsa.**
>    `data/equipment.ts` llevaba un comentario («mantener sincronizado con
>    `ARMOR_LOOKUP`») que el plan quería borrar dando por hecho que ya no hacía
>    falta. Las dos listas se siguen manteniendo a mano, y una armadura presente
>    solo en una de las dos se ve bien pero no da CA. Ahora hay una comprobación
>    en `check-inventario` que lo exige, en vez de un comentario pidiéndole a
>    alguien que se acuerde.
> 3. **`CATEGORIAS` era un array suelto**: olvidarse de una categoría habría
>    sido silencioso, y `find(...)` habría devuelto `undefined` en tiempo de
>    ejecución detrás de un `!`. Ahora es un `Record` indexado por el tipo del
>    id: **olvidarse de una ya no compila**.
> 4. **El botón «Leer» de los documentos en curso vivía dentro de las filas de
>    objetos de la ficha.** Borrar esa sección entera, como decía el plan,
>    habría dejado sin forma de abrirse a todos los documentos que el DM ya
>    entregó — y leer un tomo es lo que desbloquea el saber. La sección
>    Documentos se queda en la ficha.

- **Fuera a propósito**: peso, rareza, sintonización, arte por objeto,
  arrastrar y soltar, y ampliar `CATALOG` con cascos/guantes/botas (eso es
  contenido, y en 2024 esas piezas no dan CA de todas formas — los cuatro
  huecos huérfanos del muñeco son decorativos por diseño del propio juego).
- Verificado: `tsc --noEmit` + `next build` limpios · **los 21 check-scripts en
  verde** (`check-inventario`, 45) · ESLint sin avisos nuevos en los componentes
  tocados. **Nada probado en vivo**: no hubo sesión disponible, así que la
  pantalla solo se vio en sus estados sin sesión y sin personaje.
- **Prueba del usuario**: equipar una coraza y ver subir la CA con la línea que
  lo explica, y verla salir de la bolsa; desequiparla desde el muñeco y ver
  bajar la CA y volver el objeto a la bolsa; llenar la bolsa y ver la barra
  ponerse roja con el motivo del tope; buscar «pocion» sin tilde y encontrarla
  igual; escribir un objeto a mano y verlo salir como «Otro»; abrir un objeto y
  escribirle una nota; como jugador, confirmar que **no** hay forma de añadir
  ni de soltar nada; como DM, entregarle un objeto a un jugador desde
  `/inventario?user=<id>`; abrirlo en el móvil y comprobar que el muñeco se
  estrecha sin que la página haga scroll lateral; y confirmar que un documento
  se sigue pudiendo abrir con «Leer» desde la ficha.

### Lo que salió al JUGARLO (2026-07-29) — tres arreglos seguidos 💍

**La primera sesión de juego real desde hace ocho features**, y en minutos salieron
tres fallos del mismo sitio: **el selector de huecos del detalle del objeto**. Los
tres eran una lista de opciones viviendo en el componente, donde ningún script mira.

1. **Un anillo se podía equipar como arma.** El selector ofrecía
   `[...WEAPON_SLOTS, ...ARMOR_SLOTS]` a cualquier objeto desconocido, y **no
   ofrecía los huecos de accesorio** — que ya existían (`ACCESSORY_SLOTS` en
   `data/leveling.ts`: anillo, colgante, amuleto, collar) y que el muñeco ya
   pintaba. El único sitio donde un anillo va de verdad era el único que faltaba.
   ⇒ **`tiposDeHuecoPara`** en la capa pura. La línea que traza: *un hueco que
   alimenta una regla solo acepta lo que la app puede verificar*. Los de arma
   alimentan `ataqueDe`, así que solo admiten armas del catálogo — si no, la app
   acabaría enseñando una tirada de ataque para un anillo.
2. **Seguía entrando en la cabeza y el torso.** El primer arreglo dejó
   `["accesorio", "armadura"]` para lo desconocido. ⇒ **un solo tipo de hueco por
   objeto**, sin ofrecer sitios «por si acaso».
3. **Dentro de los accesorios se ofrecían todos**: un anillo podía acabar en el
   collar. ⇒ **`tipoAccesorioDe`**, que reconoce la clase por la **primera palabra
   del nombre** («Anillo de protección» → anillo).
   > **Por qué aquí sí se mira el nombre por partes**, si `categoriaDe` exige
   > coincidencia exacta: cambia lo que se arriesga. Equivocar una categoría pinta
   > de verde una «Poción de veneno» y **miente sobre lo que es**; equivocar esto
   > solo ofrece el dedo en vez del cuello, y el jugador lo ve y elige otro. Y los
   > huecos se llaman **igual** que los objetos, así que la primera palabra es una
   > señal, no una corazonada. «Sortija» no se reconoce y se ofrecen todos.
4. De paso, un caso que se veía roto: los huecos de accesorio **salen de los
   modificadores**, así que con Inteligencia baja no hay ningún anillo donde
   ponerlo. El botón abría una lista vacía; ahora lo dice.

- `check-inventario` pasa de 45 a **73 comprobaciones**.
- **Consecuencias asumidas, dichas para que no sorprendan**: una «Espada de Kael»
  inventada **no** entra en el hueco de arma (la app tampoco sabría calcular su
  ataque); y un «Yelmo» escrito a mano va a un accesorio, no a la cabeza — los
  huecos de cabeza, antebrazos, manos y pies **no tienen nada en el catálogo** que
  los llene, porque en 2024 esas piezas no dan CA. Si se quieren usar de verdad,
  lo que hace falta es **ampliar el catálogo**, no relajar la regla.

> **La lección, otra vez y van cinco**: una regla dentro de un componente escapa al
> gate. `tsc`, `next build` y los 21 scripts estaban en verde con el anillo
> entrando en la mano principal. Lo cazó una partida en cinco minutos.

## RESUELTO (2026-07-28): FASE 1 — los monstruos del bestiario al combate 🐉
Rama `monstruos-al-combate`. **Migración `schema_v23` — ejecutada el
2026-07-28.** Spec y plan en
`docs/superpowers/{specs,plans}/2026-07-28-monstruos-al-combate*`. Ejecutada con
subagentes (implementador + revisión de spec + revisión de calidad por tarea).

- **`schema_v23.sql`**: `initiative` gana `monster_slug`, `hp`, `hp_max` y
  `conds`, las cuatro opcionales. **Solo para PNJ**: los jugadores siguen con sus
  PG y condiciones en `characters.play_state`. **Una sola fuente de verdad por
  combatiente, nunca dos.** Las políticas RLS de la v11 ya servían y no cambian.
- **`lib/combate.ts`** (puro): `saludDe` (PG → palabra), `nombresNumerados`,
  `acotarHp`, `cantidadValida`/`TANDA_MAX` y `cuentaEnMesa`. Verificado por
  **`check-combate` (49)**. El gate pasa de 19 scripts a **20**.
- **El DM añade monstruos del bestiario** desde `InitiativeTracker`, **por
  tandas**: cada tanda tira su propia iniciativa con el modificador de ESE
  monstruo, así que un jefe añadido aparte nunca comparte turno con sus esbirros
  —sale gratis, sin marcar nada— y dentro de una tanda van juntos salvo que se
  pida «iniciativa individual». Añadir marca el monstruo como **descubierto** en
  `/bestiario`.
- **El DM ve `11/13`; los jugadores ven «malherido».** La palabra no lleva
  dígitos a propósito: nadie calcula «le quedan 3». Las **condiciones sí las ve
  todo el mundo**, porque son lo que explica de dónde sale la ventaja.
- **Arregla que G4 no funcionaba contra monstruos**: `condsDe` devolvía `[]` para
  todo PNJ, así que un goblin derribado no daba ventaja a nadie. La regla llevaba
  escrita desde G4 sin aplicarse nunca. **Cero reglas nuevas**: solo deja de
  faltarle el dato.

> **Cuatro trampas cazadas, y tres son la misma lección repitiéndose.**
> 1. **El error tragado, otra vez.** `useInitiative` hacía `const { data } = await
>    …`. Con las columnas nuevas en el `select` y la v23 sin ejecutar, un 42703
>    tumba la consulta entera y `/combate` habría dicho **«Sin ronda de iniciativa
>    en curso»**: el combate desaparecido y la culpa al dato. Se arregló **en la
>    misma tarea** que metía las columnas.
> 2. **Dos reglas fuera de la capa pura.** El clamp de PG vivía en el hook y el
>    tope de cantidad en el componente — y **ningún script cubre ninguno de los
>    dos sitios**. Subieron a `lib/combate.ts` como `acotarHp` y `cantidadValida`.
>    Es la lección de las «dos armas» por tercera vez.
> 3. **El bestiario viajaba al bundle del jugador.** `useBestiary` importado
>    estáticamente metía `data/bestiary` en el grafo de `/combate`: **24,7 KB
>    gzip** de estadísticas que un jugador descarga para un selector que solo ve
>    el DM. Sacar el selector a `components/combate/SelectorMonstruos.tsx` con
>    `next/dynamic` lo saca del bundle — hacerlo *dentro* del mismo archivo no
>    habría servido, porque el import estático se queda.
> 4. **La numeración se repetía entre tandas.** Añadir 3 goblins y luego 2 más
>    daba dos «Goblin 1» y dos «Goblin 2» — y el diseño **empuja** a añadir por
>    tandas, que es lo que evita que el jefe comparta iniciativa. La función
>    estrella rompía a la otra. `nombresNumerados` gana `yaHay` y `cuentaEnMesa`
>    lo cuenta.
> 5. **El selector solo mostraba 10 de los 124** (cazada por el usuario **después
>    del merge**, no por el gate). El desplegable recortaba con `.slice(0, 10)`,
>    así que con orden alfabético el DM veía siempre los diez primeros y ninguno
>    más — y encima el contenedor **ya tenía scroll**, o sea que el tope solo
>    servía para esconder bichos. Se quita el recorte y la búsqueda pasa a
>    `searchMonsters`, que ahora **recibe la lista** (para que encuentre también
>    los personalizados del DM) y **no recorta**: cuántos caben lo decide quien
>    pinta. Con su recuento a la vista («124 monstruos» / «7 de 124») para que
>    volver a perder monstruos se note al abrirlo.
>    > **Por qué el gate no lo vio**: el filtro vivía en el componente. Es la
>    > misma lección por **cuarta** vez en esta misma losa. Ahora está en
>    > `data/bestiary/index.ts` con 12 comprobaciones en `check-bestiary`
>    > (1617 → **1629**), una de ellas justo «la búsqueda vacía no recorta a 10».

- Verificado: `tsc --noEmit` + `next build` limpios · **los 20 check-scripts en
  verde** · ESLint sin avisos en los componentes tocados. **Nada probado en
  vivo.**
- **Prueba del usuario** (tras ejecutar `schema_v23`): añadir 4 goblins ⇒ salen
  «Goblin 1..4» compartiendo iniciativa; añadir un ogro aparte ⇒ tiene la suya;
  con «iniciativa individual», los 4 goblins salen desperdigados; **añadir 3 y
  luego 2 más ⇒ la numeración sigue, sin repetidos**; el DM baja PG a un goblin y
  **el jugador ve «malherido»**, no el número; marcarle **derribado** y atacarle
  con un arma de cuerpo ⇒ **ventaja**, y con un arco ⇒ **desventaja**; el goblin
  aparece **descubierto** en `/bestiario`; buscar algo que no esté (el bestiario
  solo llega a CR 1/2) ⇒ dice que no está y ofrece el PNJ a mano.
- **La degradación sin migración ya no se puede probar** (la v23 se ejecutó el
  mismo día), pero queda escrita porque es la red de seguridad: sin las columnas,
  `useInitiative` reconoce el 42703, lee sin ellas y `/combate` sigue mostrando la
  iniciativa en vez de quedarse vacía; el DM ve el aviso y el botón de añadir se
  apaga. Si algún día se restaura una base vieja, eso es lo que debe pasar.

## RESUELTO (2026-07-26): fuera el tablero, la iniciativa es el combate ⚔️
Rama `quitar-tablero`. **Sin migración.** Spec y plan en
`docs/superpowers/{specs,plans}/2026-07-26-quitar-tablero*`.

- **Por qué se retira**, decidido por el usuario tras mirarlo con calma y **sin
  haberlo probado nunca en vivo**: (1) **no encaja con cómo se juega** —están
  todos en la mesa y el DM narra, así que colocar fichas y medir casillas es
  fricción que no aporta nada que no esté ya sobre la mesa—, y (2) **no compensa
  lo que cuesta mantener**: era la parte más enredada de la app.
- **El hallazgo que lo abarató**: **casi ninguna regla necesitaba medir, se deduce
  del arma**. Con una daga estás en cuerpo a cuerpo por definición; con un arco,
  no. `lib/targeting.ts` cambia `distanciaM: number` por `cuerpoACuerpo: boolean`
  y queda **más simple que antes**. `enAlcance` **se elimina**: sin rejilla no hay
  nada que bloquear, y un absurdo lo corta el DM —igual que la app tampoco compara
  la CA. **Derribado** sigue dando ventaja de cerca y desventaja de lejos, ahora
  de forma directa.
- **`/combate`** sustituye a `/tablero`: a la izquierda **la iniciativa como lista
  de combatientes** (con PG y condiciones de los jugadores), y **tocar una fila la
  convierte en tu objetivo**; a la derecha el `PanelCombate` de siempre, que ya no
  elige objetivo —lo recibe resuelto y solo lo muestra, con botón de soltar—; y la
  tira de tiradas abajo. **Tu propia fila no es elegible.**
- **Un concepto que desapareció solo**: `battle_board.active` marcaba «hay
  combate». Ahora **hay combate si la iniciativa tiene filas**, y vaciarla lo
  termina con un botón que ya existía.
- **Se reutilizó `InitiativeTracker`** en vez de escribir una lista nueva: ya
  ordenaba, marcaba el turno y distinguía PNJ. Solo ganó props **opcionales**
  (`onSelect`/`selectedId`/`conEstado`), así que su montaje en Panel DM › Dados
  siguió igual sin tocarlo.
- **Borrado**: `BattleBoard`, `useBattle`, `lib/tablero.ts`, `check-tablero`,
  `app/tablero/page.tsx` y la pestaña Panel DM › Tablero (sus mandos útiles ya
  estaban en Panel DM › Dados). **375 líneas fuera.** El gate baja de 11 scripts
  a **10**.
  > **Las tablas `battle_tokens`/`battle_board` NO se borran**: quedan vacías y
  > sin uso. Borrar es irreversible y no gana nada; si vuelve el mapa, ahí están.
  > **Trampa cazada**: la hoja seguía enlazando a `/tablero` con un botón que ya
  > no llevaba a ningún sitio. **`tsc` no lo ve** —una ruta no es un símbolo—, lo
  > cazó el `grep` de referencias que el plan pedía.
- **Lo que se pierde, dicho claro**: la **medición de movimiento en metros** (el
  contador de `EconomiaTurno` se queda, pero los metros los lleva el DM a ojo) y
  el **mapa compartido**.
- Verificado: `tsc` + `next build` limpios · **los 10 check-scripts en verde**
  (`check-targeting` adaptado de metros a `cuerpoACuerpo`). **Nada probado en
  vivo.** **Prueba del usuario**: `/combate` sin iniciativa ⇒ el panel derecho
  sigue entero; el DM añade un PNJ desde Panel DM › Dados ⇒ aparece en la lista
  del jugador sin recargar; tocar una fila la apunta y volver a tocarla la suelta;
  **tu propia fila no se puede elegir**; con el objetivo **derribado**, arma de
  cuerpo ⇒ ventaja y arco ⇒ desventaja; «Siguiente turno» mueve la marca y limpia
  la economía; y ya no existe `/tablero` ni la pestaña del DM.

## RESUELTO (2026-07-26): objetivos múltiples 🎯🎯
Rama `objetivos-multiples`. **Sin migración.** Spec y plan en
`docs/superpowers/{specs,plans}/2026-07-26-objetivos-multiples*`. Rompe la
suposición de **un solo objetivo** que arrastraba toda la capa desde G4.

- **La idea rectora**: la selección deja de ser un objetivo y pasa a ser una
  **lista**. Se modela ahora, aunque solo se llene a mano, **para que las áreas
  encajen después sin rehacer nada** — un área no es un caso especial, es otra
  forma de producir la misma lista.
- **N ataques por acción** (`ataquesPorAccion` en `lib/ataque.ts`): **los datos ya
  existían**. El guerrero tiene su columna «Ataques por acción de Atacar»
  (1/2/3/4) y otras cinco clases el rasgo «Ataque Extra» a nv5 (bárbaro,
  explorador, cazador de sangre, paladín, monje). El **primer** golpe paga la
  acción; los siguientes solo gastan ataque. Se resuelven **uno a uno** para poder
  **cambiar de objetivo entre golpe y golpe** — si el primero cae, rediriges.
  Marcador «Ataque 1 de 2» y botón apagado al agotarlos.
  > **Pícaro y bardo se quedan en 1, y es correcto**: en 2024 no tienen Ataque
  > Extra (el escalado del pícaro es el Ataque Furtivo, una vez por turno). Hay
  > comprobaciones que lo **fijan**, para que nadie les regale un ataque inventado.
- **Contador** en `play_state.turno.ataquesUsados` — sin migración, y
  `limpiarTurno` lo borra con el resto al tocarte el turno.
- **Ataque de acción adicional** (dos armas): `Arma` gana `ligera` (Daga, Espada
  corta, Hacha de mano, Cimitarra). Botón «Otra mano» que gasta la **adicional**,
  no un ataque. Su daño **no suma el modificador** (regla base; los estilos de
  combate no están modelados, y **quedarse corto es mejor que pasarse**).
  > **Trampa cazada**: la **Ballesta ligera NO es un arma ligera** pese al nombre
  > (sus propiedades son cargar, dos manos y munición). Hay comprobación.
  > **Trampa peor, cazada en la revisión final**: el botón **no aparecía nunca**
  > con dos armas iguales. La hoja **fusiona los objetos del mismo nombre subiendo
  > `qty`**, así que dos dagas son **una** entrada con `qty: 2`, y el código
  > contaba entradas. Nacía muerto en el caso más común. La regla se subió a la
  > capa pura (`puedeDosArmas`) contando por **cantidad**, con su comprobación —
  > el fallo había pasado el gate en verde porque los scripts solo cubrían
  > funciones puras y esa cuenta vivía en el componente.
- **Conjuros de varias instancias**: `Spell` gana `instancias` (Rayo Abrasador y
  Proyectil Mágico, 3). Se declara **un objetivo por instancia** antes de
  resolver, se gasta **un** hueco y salen N tandas de tiradas etiquetadas «(2 de
  3)». Puedes repartir o concentrar, que es lo que dicen los conjuros.
  > **Arregla una incoherencia de O2**: el campo `damage` significaba dos cosas
  > distintas (Proyectil Mágico guardaba el agregado `3d4+3`, Rayo Abrasador un
  > rayo `2d6`). Ahora es **siempre por instancia**: Proyectil Mágico tira
  > `1d4+1` tres veces.
- **Fuera (a propósito)**: **las áreas** (esfera, cono, línea — necesitan
  geometría de casillas, área legible por máquina en `Spell` y que el tablero
  pinte la plantilla; **es la losa siguiente** y encaja sin rehacer esto), la
  Ráfaga de Golpes del monje (golpes sin arma + coste de foco), los estilos de
  combate, y los conjuros de varios objetivos **sin tirada** (Bendición).
- **Hueco conocido, no introducido aquí**: lanzar un conjuro **no gasta la
  acción**. Se nota más ahora que la economía de ataque está apretada; anotado
  para una tanda futura.
- Verificado: `tsc` + `next build` limpios · **los 11 check-scripts en verde**
  (check-ataque y check-turno ampliados con la derivación por clase, el contador
  y el conteo por cantidad). **Nada probado en vivo.** **Prueba del usuario**:
  guerrero nv5 ⇒ pegar, cambiar de objetivo, pegar, ver «2 de 2» y el botón
  apagado, y que «Siguiente turno» lo reinicie; guerrero nv4 ⇒ un solo ataque, sin
  marcador; pícaro con **dos dagas** ⇒ sale «Otra mano», gasta la adicional y el
  daño va **sin** modificador; pícaro ⇒ **no** tiene segundo ataque de la acción;
  mago ⇒ Rayo Abrasador repartido entre dos enemigos da tres tandas y gasta **un**
  hueco; Proyectil Mágico ⇒ tres dardos de `1d4+1`, no un `3d4+3`.

## RESUELTO (2026-07-26): el tablero es la pantalla de combate 🎮

> [!note] 🔀 **Léase `/combate` donde ponga `/tablero`.** Esta sección se escribió
> antes de la retirada del tablero (ese mismo día): la mudanza del combate fuera
> de `/personaje` **sigue vigente**, pero la ruta se renombró a **`/combate`** y
> la rejilla ya no está. Su **prueba del usuario**, al final, hay que traducirla:
> donde dice «abrir `/tablero`» es `/combate`, y donde dice «poblar la rejilla»
> es «poblar la iniciativa».

Rama `tablero-combate`. **Sin migración.** Spec y plan en
`docs/superpowers/{specs,plans}/2026-07-26-tablero-combate*`. **No hay reglas
nuevas**: G1–G4 y O2 ya estaban; esto es **mudanza y composición**.

- **El porqué**: las cinco losas fueron aterrizando en la hoja porque era donde
  vivía la ficha, y `/personaje` acabó haciendo dos trabajos que no se parecen
  (consultar tu ficha y jugar el combate) mientras `/tablero` solo pintaba la
  rejilla. Petición del usuario: la ficha para stats e inventario, y el combate
  en el tablero.
- **`lib/useFichaViva.ts`** (el único refactor): carga la ficha activa con el
  `selectTolerante` de siempre, la deriva, escucha su fila en vivo, limpia el
  turno cuando te toca y persiste `play_state` (self → `saveCharacter`, dm →
  `/api/dm/character`). Es la **única fuente de `play_state`** para quien lo
  consume; `character`/`items`/`level` van **solo de lectura**.
  > **Trampa cazada**: `loadActiveCharacter` devuelve `null` **tanto** si no hay
  > ficha **como** si la consulta falló, y no los distingue (el error ya queda en
  > la consola). La primera versión afirmaba «no se ha podido cargar la ficha»
  > también a quien simplemente no tiene personaje. Confundir dos estados
  > distintos es la forma exacta del bug del 22-07: ahora no se afirma nada y la
  > pantalla dice «no tienes un personaje en juego».
- **La hoja no se tocó por dentro.** Al quitarle los componentes de combate,
  `CharacterSheet` **deja de escribir** `play_state` (solo lo lee para la ventaja
  de sus botones de salvación y pericia), así que su **carga se queda intacta** —
  el archivo que provocó el bug de las fichas desaparecidas se toca lo mínimo. De
  991 a 898 líneas, todo borrados salvo el enlace «Ir al tablero».
  > **Segunda trampa**: el plan decía que se podía borrar la ref
  > `lastWrittenPlay`. **Falso**: la lee también la suscripción realtime, que se
  > queda. El subagente lo cazó antes de romperlo.
- **`/tablero`**: iniciativa arriba (**sin `hideEmpty`**, así que un jugador ya
  puede tirar iniciativa y **abrir la ronda él mismo** — antes tenía que abrirla
  el DM), rejilla a la izquierda, `PanelCombate` a la derecha y `DiceFeedStrip`
  abajo. **Ya no exige combate activo**: sin rejilla se puede curar, preparar
  conjuros y gastar rasgos, que es lo que hace falta entre escenas. Distingue con
  honestidad cuatro estados: cargando, falta `schema_v22` (solo se lo dice al
  DM), no hay combate, y no tienes personaje.
- **`components/tablero/PanelCombate.tsx`**: estado y turno **siempre visibles**,
  el **objetivo en la cabecera compartido** por ataques y conjuros, y las
  acciones en **pestañas** (⚔ Ataques · ✦ Conjuros · ◈ Rasgos) que solo se pintan
  si la clase las tiene (un bárbaro no ve una pestaña de conjuros vacía).
- **`Ataques`/`Conjuros`** reciben el objetivo por props (opcionales, así
  `GrupoPanel` compiló sin tocarse). `Ataques` pierde su desplegable, sus hooks y
  la partición en dos que hizo falta en G4 para no abrir canales realtime de más:
  sin hooks propios ya no hay nada que ahorrar. **La lógica de G4 no cambió** —
  mismo bloqueo de alcance, misma ventaja combinada, mismo crítico. `Conjuros`
  solo **nombra** el objetivo en el anuncio: resolver el efecto de cada conjuro
  quedó fuera de O2 y sigue fuera.
- **Panel DM › Tablero** monta la misma pantalla junto a sus mandos de siempre;
  si el DM no tiene personaje, el panel no se pinta y queda como antes. **Panel
  DM › Grupo no se toca**: es su panel de control del grupo, no una pantalla de
  juego.
- **Fuera (a propósito)**: reglas nuevas, rediseñar `BattleBoard`, tocar
  `GrupoPanel`, y mover las tiradas de pericia y salvación fuera de la ficha (son
  de la ficha).
- Verificado: `tsc` + `next build` limpios · **los 11 check-scripts en verde**
  (incluido **`check-ficha` (11)**, que cubre justo la carga tolerante). Ejecutado
  con subagentes; la revisión cazó las dos trampas de arriba, ambas mías.
  **Nada probado en vivo.** **Prueba del usuario**: `/tablero` sin combate ⇒ se
  ven estado, turno y pestañas; iniciar combate desde el DM y poblar ⇒ la rejilla
  aparece sin recargar; elegir objetivo y atacar ⇒ gasta la acción y sale en la
  tira; cambiar a Conjuros con el mismo objetivo y lanzar ⇒ el anuncio lo nombra;
  **recargar la página** ⇒ no se pierde nada de `play_state`; `/personaje` sigue
  entera y sin combate; el DM ve la misma pantalla con sus mandos.

## RESUELTO (2026-07-26): Fase O2 — conjuros 🔮
Rama `o2-conjuros`. **Sin migración.** Spec y plan en
`docs/superpowers/{specs,plans}/2026-07-26-o2-conjuros*`. **Cierra la Fase O**:
O1 eran los pozos de usos de clase, O2 son los conjuros. El estado va en
`characters.play_state` —la misma columna de O1/G1/G2— con tres claves nuevas:
`huecos` (gastados por nivel), `preparados` (ids) y `concentrando`.

- **Lo que ya existía y no se rehízo**: `slotsFor` (tablas full/half/pact de
  `spellSlots.ts`), `derive` (que ya calculaba CD, ataque de conjuro y los
  espacios máximos), y las columnas **«Trucos»** y **«Conjuros preparados»** que
  las 8 clases conjuradoras ya declaraban. Los topes por nivel **ya eran datos**.
- **`data/spells.ts`** (nuevo): tipo `Spell` con efecto **opcional**
  (`attack`/`save`/`damage`/`heal`) y una **semilla de 32** conjuros —11 trucos y
  21 de nivel 1–3— que cubre las 8 clases. **Crece sesión a sesión**, como el
  bestiario y el atlas: no se escribió el SRD entero (habría acabado a medias como
  el bestiario). Mecánicas = hechos; descripciones = redacción propia.
  > **Regla del campo `damage`**: son los dados que se tiran **de una vez**. Por
  > eso Proyectil Mágico lleva el total de sus tres dardos (impactan siempre) y
  > Rayo Abrasador lleva el de **un** rayo (cada uno tiene su tirada de ataque).
- **`lib/conjuros.ts`** (puro, molde de `recursos.ts`): `huecosDe`, `gastarHueco`,
  `devolverHueco`, `recargarHuecos`, `topePreparados`/`topeTrucos` (leen las
  columnas de la clase; **paladín y explorador no tienen trucos** ⇒ 0),
  `cuentaTrucos`/`cuentaPreparados` (parten `preparados` por el nivel del
  conjuro), `preparar`/`despreparar` (respetan el tope que toca) y
  `setConcentracion`. Como en O1 se guarda **lo gastado**, así que al subir de
  nivel los huecos nuevos llegan solos. Verificado por **`check-conjuros` (49)**.
- **Lanzar**: gasta el hueco (el **upcast** lo eliges: cualquier nivel ≥ el del
  conjuro), **anuncia al feed** y tira lo que traiga (ataque de conjuro, daño,
  curación). Los **trucos** no gastan; los **rituales** tampoco (botón aparte, y
  se anuncian como «(ritual)»). La **concentración** es una a la vez y la nueva
  reemplaza a la anterior.
- **Notas en el feed** (`publishNote`/`esNota` + `DicePanel`): una fila sin dados
  para anunciar sin fingir una tirada; se pinta con una chapa **CONJURO** en vez
  del «[] = 0» que habría salido. Reutilizable por lo que venga.
- **`Conjuros.tsx`** (molde de `PozosClase`): CD y ataque, chapas de hueco
  pulsables por nivel, marcador de concentración, trucos y preparados con
  «Lanzar», y un selector para preparar hasta el tope. En la hoja y en Panel DM ›
  Grupo (ahí `sessionId={null}`: el DM ajusta, no tira por el jugador).
- **Descanso**: `/api/descanso` recarga los huecos junto a los pozos de O1 —
  largo lo devuelve todo, corto solo los de **pacto** del brujo.
- **Fuera (a propósito)**: el SRD entero (la semilla crece), un motor de efectos
  por conjuro, el escalado automático (trucos por nivel y daño por upcast: lo dice
  la descripción y lo aplica la mesa), y la **salvación de Constitución por daño**
  de la concentración (marcador manual).
- Verificado: `tsc` + `next build` limpios · **`check-spells` y `check-conjuros`
  en verde** · check-targeting (49), check-estado (36), check-turno, check-ataque,
  check-tablero, check-clases (116), check-lore (69), check-ficha (11), check-clima
  sin regresión. Ejecutado con subagentes (implementador + revisión por tarea); se
  cazaron y arreglaron **tres cosas**: dos errores de datos míos (Rayo de Escarcha
  no es del brujo; Favor Divino es de Evocación, no Transmutación) y el ritual que
  se anunciaba como «(nivel 0)». **Nada probado en vivo** (sin sesión en dev).
  **Prueba del usuario**: con un mago nv3, preparar hasta el tope y ver que no deja
  pasarse; gastar un hueco y ver que persiste al recargar; lanzar Rayo de Escarcha
  y ver el anuncio + la tirada; Curar Heridas y ver la curación; lanzar un conjuro
  de nivel 1 en un hueco de nivel 2 y comprobar que gasta el de 2; Detectar Magia
  como ritual (no gasta); Bendición y luego Telaraña (la concentración se
  reemplaza); descanso largo devuelve los huecos y el corto no, salvo con brujo.

## RESUELTO (2026-07-25): G4 — targeting 🎯⚔️
Rama `g4-targeting`. **Sin migración.** Spec y plan en
`docs/superpowers/{specs,plans}/2026-07-25-g4-targeting*`. Cuarta losa de la
jugabilidad 2024, sobre G1/G2/G3. Cierra las **cuatro reglas** que G1/G2/G3
dejaron documentadas a propósito «para cuando haya objetivo». La idea rectora de
siempre: la app **aplica** la regla, no solo la recuerda.

- **`lib/targeting.ts`** (puro, molde de `estado.ts`/`ataque.ts`): `ventajaAtacante`
  (condición del objetivo + distancia), `combinar` (anulación 2024 **global** sobre
  todas las fuentes: la propia de G1 + la del objetivo), `enAlcance` (bloqueo),
  `autoFallaSalvacion`, `ventajaSalvacion` (Des por restringido), `critProximidad`,
  y `formulaDaño` (dobla los **dados** en crítico, no el mod; reusa `parseFormula`
  de `dice.ts` en vez de un regex propio — un dado malformado no se dobla en
  silencio). Verificado por **`check-targeting` (49)**.
- **El objetivo vive en la ficha, no en el lienzo**: `Ataques.tsx` gana un
  desplegable con las fichas del tablero (`useBattle`) y la **distancia en vivo**
  desde tu propia ficha. «Sobre el tablero» = usa sus posiciones, sin rehacer el
  board. Se descartó clicar el lienzo (duplicaría la UI de ataque con el DM
  presente).
- **Las cuatro reglas al atacar**: (1) **alcance duro** — daga a >1,5 m no deja
  atacar ni gasta la acción; (2) **ventaja combinada** — la propia (envenenado…)
  más la del objetivo (cegado/derribado/restringido/paralizado/aturdido/
  inconsciente), con la anulación 2024; (3) **crítico** — 20 natural (vía
  `dice.critState`) **o** proximidad (≤1,5 m vs paralizado/inconsciente, cualquier arma)
  dobla los dados de daño; (4) las condiciones del objetivo solo se leen si es un
  **jugador** legible por `useParty`; PNJ ⇒ el DM juzga (los lleva a mano).
- **Salvaciones** (`CharacterSheet.tsx`): el botón ya tenía la característica
  (`a.key`), solo faltaba usarla. Ahora con paralizado/aturdido/inconsciente/
  petrificado, la salvación de **Fue/Des falla automáticamente** con un aviso en
  línea (no se tira, no ensucia el feed: una salvación aquí es un d20 que la mesa
  compara con la CD, y un auto-fallo no tiene ni dado ni CD; el DM ya ve las
  condiciones en vivo). Y la de **Des estando restringido** se tira con
  desventaja. **Cierra la omisión honesta que G1 anotó.**
- **Degrada a G2 exacto**: sin tablero/objetivo (distancia desconocida) no hay
  bloqueo de alcance ni ventaja de objetivo, solo la propia. Además, `Ataques` se
  **parte en dos** (`Ataques` sin hooks + `AtaquesInteractivo`) para que el montaje
  inerte del Panel DM › Grupo (N fichas con `sessionId=null`) **no abra N canales
  realtime** inútiles.
- **Fuera (a propósito)**: estado de PNJ en el tablero (la IA-Ollama o el juego
  desde casa lo pedirán), toggle manual de ventaja, comparar la tirada con la CA
  (la mesa juzga el impacto, como desde G2), y el alcance normal/largo de las
  armas a distancia (el catálogo no trae esos metros).
- Verificado: `tsc` + `next build` limpios · **`check-targeting` (49) en verde** ·
  check-estado (36 — con el auto-fallo/restringido), check-turno, check-ataque,
  check-tablero, check-clases (116), check-lore (69) sin regresión. Ejecutado con
  subagentes (implementador + revisión de spec + revisión de calidad por tarea; se
  cazaron y arreglaron dos cosas de calidad: `formulaDaño` que se tragaba un dado
  malformado, y el `Ataques` que suscribía realtime estando inerte). **Nada
  probado en vivo** (sin sesión ni fichas en el tablero en dev). **Prueba del
  usuario**: daga a 6 m ⇒ bloqueado; acercar a ≤1,5 m ⇒ deja atacar; objetivo
  jugador derribado a quemarropa ⇒ ventaja, a distancia ⇒ desventaja; 20 natural ⇒
  daño doblado; cuerpo a un jugador inconsciente a quemarropa ⇒ daño doblado;
  paralizado + salvación de Fuerza ⇒ fallo automático; restringido + salvación de
  Destreza ⇒ desventaja.

## RESUELTO (2026-07-24): G3 — tablero de batalla 🗺️♟️ (RETIRADO el 2026-07-26)

> [!warning] ⚰️ **Esta sección es historia, no instrucciones.** El tablero se
> **retiró entero** el 2026-07-26 (ver la sección «fuera el tablero» arriba).
> Nada de lo que describe sigue en el código: `BattleBoard`, `useBattle`,
> `lib/tablero.ts`, `check-tablero` y `/tablero` están **borrados**.
> Su migración **`schema_v22` se ejecutó el 2026-07-25 y ya no hace falta**: sus
> tablas quedaron vacías y sin uso, y **no hay que ejecutar nada**. Se conserva
> el relato por el porqué de la retirada.

Rama `g3-tablero`. **Migración `schema_v22` — ejecutada el 2026-07-25, hoy
retirada.** Spec y plan
en `docs/superpowers/{specs,plans}/2026-07-24-g3-tablero*`. Tercera losa
de la jugabilidad 2024, sobre G1/G2. Primera con **estado compartido de verdad**.

- **`schema_v22.sql`**: dos tablas nuevas con RLS y realtime — `battle_tokens`
  (una ficha por combatiente: mover el DM cualquiera, el jugador la suya;
  crear/borrar el DM) y `battle_board` (fila única: fondo, cols/filas, `active`;
  editar el DM). `is_dm()` ya existía. **Primera pendiente desde la v21.**
- **`lib/tablero.ts`** (puro): `celda(pos, cols, rows)` y `distanciaMetros`
  (Chebyshev de casillas × 1,5 m, regla 2024 simplificada: toda casilla, también
  la diagonal, es 1,5 m). Verificado por `check-tablero.ts`.
- **`lib/useBattle.ts`**: hook realtime de ambas tablas + mutaciones (mover,
  añadir PNJ/jugador, borrar, vaciar, config, poblar desde iniciativa). **Degrada
  con elegancia**: si las tablas faltan (`42P01`, migración sin ejecutar) devuelve
  `missing = true` y vacío, así la app **compila y arranca sin `schema_v22`**.
- **`components/tablero/BattleBoard.tsx`**: rejilla cols×filas sobre fondo
  opcional, fichas por %, **arrastre optimista** (patrón de `PinDragMap`) solo de
  las que `canMove` permite, y **distancia en metros** a la ficha seleccionada.
- **`/tablero`** (vista del jugador): mueve su ficha, ve distancias; avisa si no
  hay combate o falta la migración. Enlace «Tablero» en `SiteNav`.
- **Panel DM › Tablero** (`TableroPanel`): iniciar/pausar combate, fondo/cols/
  filas, **poblar desde la iniciativa** (una ficha por combatiente), añadir/borrar
  PNJ, vaciar, y el tablero con todas las fichas movibles.
- **Fuera de G3 → G4**: el **targeting** (elegir objetivo) y con él el fallo
  automático de salvación, la ventaja para el atacante, el crítico automático y el
  alcance del arma que bloquee el ataque. G3 da posición y distancia; el resto lo
  juzga la mesa con eso delante.
- Verificado: `tsc` + `next build` limpios · **`check-tablero` en verde** ·
  check-turno, check-ataque, check-estado (35), check-clases (116), check-lore
  (69) sin regresión. **Nada probado en vivo** (sin sesión ni tablas en dev; el
  hook degrada). **Prueba del usuario** (tras `schema_v22`): activar el combate,
  poblar desde iniciativa, mover una ficha como DM y verla en la vista del
  jugador sin recargar; como jugador mover la propia y no otra; seleccionar dos
  fichas y ver la distancia.

## RESUELTO (2026-07-24): G2 — economía de turno y ataque desde la ficha ⚔️⏱️
Rama `g2-economia-turno`. **Sin migración.** Spec y plan en
`docs/superpowers/{specs,plans}/2026-07-24-g2-economia-de-turno*`. Segunda losa
de la jugabilidad 2024, sobre G1.

- **`data/weapons.ts`**: stats 2024 de las 12 armas del catálogo (dado, tipo,
  alcance, sutil, versátil). `armaDe(nombre)`.
- **`lib/turno.ts`** (puro): economía del turno sobre `play_state.turno` —
  acción/adicional/reacción (booleanos) + movimiento en metros. `limpiarTurno`
  borra la clave. No toca `usos`/`hp`/`conds`.
- **`lib/ataque.ts`** (puro): `ataqueDe(arma, abilities, prof, classWeapons)` —
  elige la característica (cuerpo→Fue, distancia→Des, sutil→la mejor), deriva la
  competencia de `classdata.weapons` × la categoría del arma, y calcula impacto
  (mod + competencia) y daño (dado + mod).
- **`EconomiaTurno.tsx`** (chapas de acción/adicional/reacción + contador de
  movimiento) y **`Ataques.tsx`** (lista las armas del inventario `c.items` que
  existen en `ARMAS`; botón que tira impacto con la ventaja de G1 y daño, y gasta
  la acción). Montados en la hoja y en Panel DM › Grupo.
- **Reset automático**: la hoja `self` se suscribe a su fila de `initiative`; al
  pasar a `active` (empieza tu turno) limpia el turno. `initiative` ya publica.
- **Ataque = kinds existentes**: impacto con `"attack"` (ya en `D20_KINDS`, anima
  como d20 y aplica adv), daño con `"custom"` (fórmula). Sin `RollKind` nuevos.
- **Trampa cazada**: `c.inventory` en `useParty` es `string[]` **legado** (ya no
  se escribe); el inventario real es `c.items` (`Item[]` con `.name`). `Ataques`
  del DM usa `c.items`.
- Verificado: `tsc` + `next build` limpios · **`check-turno` y `check-ataque` en
  verde** · check-estado (35), check-clases (116), check-lore (69) sin regresión.
  **No probado en vivo sin sesión.** Prueba del usuario: atacar y ver que gasta la
  acción; «Siguiente turno» hasta que te toque y ver la economía limpia sin
  recargar; arma competente vs no competente en el impacto; envenenado ⇒ 2d20 la
  peor en el ataque.

## RESUELTO (2026-07-23): G1 — estado del combatiente ⚔️❤️
Rama `g1-estado-combatiente`. **Sin migración.** Spec y plan en
`docs/superpowers/{specs,plans}/2026-07-23-g1-estado-combatiente*`. Primera losa
de la jugabilidad de combate 2024 (siguen **G2** economía de turno, **G3**
tablero, **O2** conjuros). La app está pensada para jugar autodidacta en casa:
**aplica** la regla, no solo la recuerda.

- **`lib/estado.ts`** (puro): PG actuales/temporales, salvaciones de muerte,
  **14 condiciones** de 2024 (el agotamiento es la 15ª, va aparte con niveles
  0–6), todo sobre `play_state` sin tocar `usos`. Se guarda el PG absoluto;
  ausente = máximo. Daño come temporales primero; a 0 PG marca fallo de muerte
  (2 si crítico); curar levanta y limpia.
- **Las condiciones muerden la tirada**: `ventajaDe(conds, tipo)` resuelve
  (des)ventaja con la anulación 2024, y los botones de salvación y pericia de la
  hoja pasan ese `adv` a `publishRoll` (que ya lo aceptaba). Envenenado/asustado
  ⇒ 2d20 la peor. Acotado con honestidad: fallo automático de salvación y ventaja
  para el atacante necesitan otro combatiente → **G3**; la salvación de Des de
  «restringido» se omite hasta que el botón pase la característica (mejor no
  aplicar que aplicar de más).
- **`EstadoVivo.tsx`**: barra de PG con daño/curar/temporales, salvaciones de
  muerte a 0 PG, condiciones como chapas con la regla en el tooltip, agotamiento.
  Montado en la hoja (sección «Estado de combate») y en Panel DM › Grupo (que
  además muestra PG actual/máx). Contrato de `PozosClase`.
- **En vivo**: la hoja `self` se suscribe a su fila (`characters` ya publica); el
  DM te pega y lo ves sin recargar, con guard anti-eco para no pisar lo que estás
  editando. Nota: jsonb reordena claves, así que el guard es best-effort — los
  datos son los mismos y el realtime entrega en orden de commit, converge.
- **Trampa cazada**: el spec decía «15 condiciones» por error (son 14 + el
  agotamiento aparte); un subagente llegó a inventar una condición para cuadrar
  el conteo. Se quitó y se corrigió el conteo a 14 en datos, script y spec.
- Verificado: `tsc` + `next build` limpios · **`scripts/check-estado.ts` (35) en
  verde** · check-clases (116) y check-lore (69) sin regresión. **No probado en
  vivo sin sesión.** Prueba del usuario: bajar a 0 PG y ver las salvaciones;
  3 fallos ⇒ «ha caído»; curar limpia; que el DM aplique daño y el jugador lo vea
  sin recargar; activar envenenado, tirar una pericia y ver 2d20 con la peor.

## RESUELTO (2026-07-23): los dorados que no existían 🎨
Rama `fix-color-gold`. **Sin migración.** Ítem del backlog, más grande de lo que
parecía: no era una línea, eran **seis usos en tres archivos** de **dos**
variables que nunca se definieron.

- `--color-gold` y `--color-gold-line` **no están en `globals.css`** (el alias
  legacy es `--gold` → `--color-bronze`). Un `var()` sin definir **invalida la
  declaración entera** (*invalid at computed-value time*), así que el color
  cae al heredado y el borde desaparece — **en silencio**, sin error de build.
- Arreglado: `WORLD_COLOR.continente` (`data/world.ts`) y los dos **eyebrow** de
  `/mapa` («Continente» / «Exandria») → `--color-bronze`, el mismo tono que el
  punto de continente de `ReinoRegions` desde el 2026-07-21. Los cuatro **marcos
  de imagen** (mapa de pueblo en `/mapa`, `PinDragMap`, `RegionExplore` ×2) →
  `--color-bronze-deep`, el borde metálico que ya usan las chapas `.tome-*`.
- El comentario de `data/saber.ts` que documentaba el fallo se actualiza para no
  quedar mintiendo.
- Verificado: `tsc --noEmit` + `next build` limpios · `check-lore` 69 en verde.
  **No probado en vivo**: `/mapa` pide sesión. **Prueba del usuario**: mirar los
  pines de continente del mapa mundial (con color bronce) y el borde de los
  mapas de pueblo y del arrastre del DM.

## RESUELTO (2026-07-22): la ficha deja de desaparecer 🩹
Sin rama propia (cuatro `fix` seguidos sobre `master`: `4689f98`, `2fc405c`,
`9905c96`, `a898585`). **Migración `schema_v21_reparar_characters.sql`.**
**La sección más importante de este documento**: es el caso real de las dos
lecciones de arriba, y la razón de que exista la v21.

**Síntoma**: la cuenta de DM crea un personaje, el contador dice «Tienes 1 de 3»
y la hoja sale vacía, sin forma de salir. El personaje **estaba intacto en la
base**.

**Causa**: `loadActiveCharacter` pedía `play_state` (columna de la Fase O1) con
la `schema_v20` **sin ejecutar**. Postgres tumba la consulta **entera**, y la
función hacía `const { data } = await …` **descartando el error**: devolvía
`null`, y la hoja lo leía como «no tienes personaje». El contador usa otra
consulta más corta, sin esa columna, y por eso seguía diciendo la verdad — de
ahí la contradicción. Luego apareció el mismo fallo con **`lore`** (columna de
la `schema_v4`) en una base donde esa migración **no llegó a correr entera**.

- **`selectTolerante`** (`lib/character.ts`): el primer intento va con todas las
  columnas — una base al día no paga nada. Si Postgres devuelve **42703**, se lee
  **del propio error qué columna falta**, se quita del `select` y se reintenta,
  hasta que pase o no quede nada que quitar. Se degrada perdiendo campos, **nunca
  la ficha entera**. Mismo trato en `useParty` (donde el síntoma habría sido el
  DM viendo el grupo vacío sin ninguna pista).
  > **Intento fallido, anotado a propósito**: el primer arreglo reintentaba con
  > una lista fija `FIELDS_BASE` de columnas «viejas y seguras». `lore` estaba en
  > esa lista, así que el reintento **volvía a pedir la columna que faltaba**.
  > Suposición equivocada. Ahora no se supone nada: se lee el error.
- **`saveCharacter` devuelve el error** en vez de tragárselo, y aplica el mismo
  blindaje al escribir: si falta una columna, la quita del patch y reintenta, así
  se guarda **todo lo demás** en vez de perderse el personaje por un campo.
- **Ficha fantasma**: `createCharacter` inserta la fila **vacía** (solo
  `user_id`) y el borrador se guarda **después**. Si ese guardado fallaba,
  quedaba la fila sin especie ni clase, **el hueco gastado** y ni un aviso. Ahora
  `/crear` comprueba el error, avisa, **no navega** y conserva el borrador de
  localStorage; y una fila sin especie ni clase se trata como **«a medio crear»**
  — se ofrece terminarla reutilizando la misma fila, sin gastar otro hueco de los
  tres.
- **`humanDbError`** traduce 42703 a «falta ejecutar una migración», que es
  siempre lo que significa.
- **`supabase/schema_v21_reparar_characters.sql`**: la solución de fondo. Las 25
  columnas que la app espera de `characters`, declaradas de una vez, idempotente.
- Verificado: `tsc --noEmit` + `next build` limpios · **`scripts/check-ficha.ts`
  con 11 comprobaciones en verde** (el caso real sin `lore`, varias columnas
  ausentes a la vez, y que un error que no sea 42703 **se propague** en vez de
  entrar en bucle).

## RESUELTO (2026-07-21): Fase O1 — recursos de clase ⚔️
Rama `fase-o1-recursos`. **Migración `schema_v20.sql` — ya ejecutada** (el
2026-07-22, después de que su ausencia hiciera desaparecer la ficha; ver la
sección RESUELTO del 2026-07-22 arriba).
Spec y plan en `docs/superpowers/{specs,plans}/2026-07-21-fase-o1-recursos-de-clase*`.

La **Fase O se parte en dos**: **O1** (esto) son los pozos de usos de clase;
**O2** serán los conjuros por tramos, empezando por trucos y niveles 1–3. O1 va
primero porque no depende de cargar el SRD, beneficia a las clases que hoy no
tienen nada mecánico, y deja probado el motor de gasto y recarga que O2 usará.

- **Qué columnas son pozos** (`data/classdata/types.ts`): `ClassResource` gana
  `spend: { key, recharge: "corto"|"largo" }`. La tabla de progresión mezclaba
  **pozos** (Furias, Puntos de foco) con **referencia** (Daño de furia, Dado de
  Artes Marciales); ahora se distinguen. **11 pozos en 8 clases**:

  | Clase | Pozo | key | Recarga |
  |---|---|---|---|
  | Bárbaro | Furias | `furias` | largo |
  | Clérigo | Canalizar Divinidad | `canalizar-divinidad` | corto |
  | Druida | Forma Salvaje | `forma-salvaje` | corto |
  | Explorador | Enemigo Predilecto | `enemigo-predilecto` | largo |
  | Guerrero | Segundo Aliento | `segundo-aliento` | corto |
  | Guerrero | Acción Sorpresiva | `accion-sorpresiva` | corto |
  | Guerrero | Indomable | `indomable` | largo |
  | Hechicero | Puntos de hechicería | `puntos-de-hechiceria` | largo |
  | Monje | Puntos de foco | `puntos-de-foco` | corto |
  | Paladín | Canalizar Divinidad | `canalizar-divinidad` | corto |
  | Paladín | Imposición de Manos | `imposicion-de-manos` | largo |

  > **Trampa cazada**: las tablas usan **`"—"`** para los niveles en que aún no
  > tienes el rasgo y **`"Ilimitados"`** para la Forma Salvaje del druida a
  > nv20. Se traducen en `lib/recursos.ts`, **no en los datos**: la tabla es lo
  > que imprime el libro y se muestra tal cual como referencia. `"—"` → 0 (no se
  > lista); `"Ilimitados"` → `Pozo.ilimitado`, y la UI pone una chapa en vez de
  > puntitos.
- **Clases sin pozo en O1** (necesitan pozo derivado de característica o de
  fórmula, pasada aparte): **bardo** (Inspiración Bárdica sale del mod. de
  Carisma), **mago** (Recuperación Arcana), **pícaro**, **brujo** y **cazador de
  sangre**. Los pozos de **subclase** también quedan fuera.
- **`lib/recursos.ts`** (nuevo, puro como `derive.ts`/`gameClock.ts`):
  `pozosDe`, `referenciasDe`, `gastar`, `devolver`, `recargar`. Se guarda **lo
  GASTADO, no lo restante** — así, al subir de nivel, los usos nuevos llegan
  solos en vez de quedarse un máximo desfasado.
- **`schema_v20.sql`**: `characters.play_state jsonb default '{}'`. **Una sola
  columna** para toda la Fase O: O2 le añadirá las claves `huecos`, `pacto` y
  `preparados` sin otra migración. Todas las escrituras **fusionan**, nunca
  reemplazan el jsonb entero.
- **Hoja** (`components/personaje/PozosClase.tsx`): una fila por pozo con
  **puntos pulsables** — un toque gasta, un toque en uno gastado lo devuelve —,
  cuántos quedan y con qué descanso recarga. Debajo, las columnas de referencia
  en una línea. Las **chapas estáticas de `resourceChips` se retiran**;
  `spellSlotChips` se queda para O2. Guardado optimista con el patrón que ya
  usaban `onRollHp`/`openDocument`.
- **Descanso** (`app/api/descanso/route.ts`): corto recarga los pozos de descanso
  corto, largo los recarga todos, y devuelve el `play_state` nuevo para que la
  hoja se refresque sin recargar. **Ojo**: el `update` de la ficha antes se
  saltaba cuando el descanso era gratis; ahora corre siempre (el oro solo se
  escribe si cuesta), que si no el descanso corto no recargaría nada.
- **DM**: `/api/dm/character` gana la operación `setUses` (fusiona sobre
  `play_state`, con `play_state` añadido a su `select` para no pisar lo demás), y
  Panel DM › Grupo monta los mismos contadores bajo cada jugador.
- Verificado: `tsc --noEmit` + `next build` limpios · **`scripts/check-clases.ts`
  con 116 comprobaciones en verde** (forma de las tablas, que los pozos no
  decrezcan al subir, los centinelas por nivel, y que gastar/devolver/recargar
  respeten topes y no toquen las claves de otras fases) · `check-lore.ts` sigue
  en 69. **NO probado en vivo**: los contadores necesitan una ficha con sesión.
  **Prueba del usuario** (tras `schema_v20.sql`): con un bárbaro, gastar una
  furia y ver que persiste al recargar; descanso corto → no la devuelve; descanso
  largo → sí. Con un monje, que el foco vuelva con el corto.

## RESUELTO (2026-07-21): panteón propio y una página por continente 🕯️🗺️
Rama `panteon-continentes`. **Sin migración.** Spec y plan en
`docs/superpowers/{specs,plans}/2026-07-21-panteon-y-continentes*`. Petición del
usuario: sacar el panteón a un botón del navbar con los dioses separados por
bando y detallados, y tener el lore de **cada continente por separado**, aparte
de los desplegables.

- **`/panteon`** (`app/panteon/page.tsx` + `components/panteon/`): **abierta, sin
  candados** — decisión del usuario. `PanteonBrowser` pinta tres bloques por
  bando, cada uno con su color y su blurb: **Deidades Primarias** (12,
  `--color-divino`), **Dioses Traidores** (9, `--color-ember`) e **Ídolos
  Menores** (11, `--color-violet`). Buscador por nombre/epíteto/esfera (sin
  acentos) y filtro de bando. `DeityCard` se despliega con la ficha entera:
  alineamiento, esfera, dominios, símbolo, día santo, los tres preceptos, el
  blurb y el tipo de patrón si es un ídolo. **Sin ruta por dios** (32 rutas para
  lo que cabe en una tarjeta, no compensa). `SiteNav` gana el botón tras «Reino».
  > **Consecuencia asumida**: los Dioses Traidores y sus preceptos pasan a ser de
  > consulta pública. En `/reino` siguen gateados por clase de fe; esta página no
  > los sustituye, los añade.
  > **Corrección de datos**: el panteón son **32** dioses, no 33 — los Ídolos
  > Menores son 11. Y el **Luxon no declara `patron`** a propósito: se le venera,
  > pero no es un patrón de brujo con quien pactar. Las comprobaciones se
  > ajustaron a los datos, no al revés.
- **`/reino/[continente]`** (`app/reino/[continente]/page.tsx`): ruta dinámica
  sobre los **cinco continentes habitados**. `generateStaticParams` desde
  `HABITADOS`; slug desconocido → `notFound()`. Slugs reales: `tal-dorei`,
  `marquet`, `issylra`, `wildemount`, `dientes-rotos`. En Next 16 `params` es una
  **promesa** y hay que esperarla (confirmado en `node_modules/next/dist/docs/`).
- **`data/saber.ts`** gana `HABITADOS` (PLACES sin «Exandria») y
  `continentBySlug(slug): SaberPlace | null`.
- **Reparto abierto/gateado** en la página de continente, decidido con el
  usuario: **geografía y cultura abiertas** (categorías `Geografía` y `Vida y
  lenguas` — se compran en cualquier puerto), **historia, fe, potencias, cosmos y
  secretos gateados** por el saber por origen. Cuando no sabes nada de lo
  gateado, se muestra el contador «N cosas por descubrir» sin listar títulos.
- **`ContinenteGeografia`** saca regiones y POIs del **atlas** (`useAtlas`), no de
  `data/world.ts`, para que refleje las ediciones del DM. Los POIs van agrupados
  por tipo (ciudades, fortalezas, ruinas, parajes, peligros).
- **`ReinoRegions`**: cada tarjeta de continente es ahora un enlace a su página.
  El slug sale de `c.continent` (canónico, «Dientes Rotos»), **no** de `c.name`
  («Los Dientes Rotos»). Se respeta la niebla: solo se enlazan los continentes
  revelados. De paso, el punto de color pasa de `var(--color-gold)` (inexistente,
  salía sin fondo) a `var(--color-bronze)`.
  > **Limitación conocida**: la página no bloquea por niebla, solo deja de
  > enlazarse. Quien teclee la URL puede abrirla; lo abierto es geografía y lo
  > sensible sigue gateado.
- Verificado: `tsc --noEmit` + `next build` limpios · **`scripts/check-lore.ts`
  con 69 comprobaciones en verde** (14 nuevas: slugs de continente, que ninguna
  página se quede sin sección abierta, y la integridad del panteón) · y **prueba
  real en navegador** (excluyendo `reino` y `panteon` del matcher de `proxy.ts`,
  **ya revertido**): `/panteon` con sus 3 bloques 12/9/11, 32 tarjetas, colores
  correctos y la ficha completa al desplegar; `/reino/marquet` con sus 7 regiones
  y `/reino/dientes-rotos` con el contador «8 cosas por descubrir».
  **Prueba del usuario**: entrar con un PJ y ver que su continente le abre más
  cosas, y como DM que los botones de revelar funcionan también aquí.

## RESUELTO (2026-07-21): /reino organizado por lugar, color y categoría 🎨
Rama `reino-saber-organizado`. **Sin migración.** Spec y plan en
`docs/superpowers/{specs,plans}/2026-07-21-reino-saber-organizado*`. Petición del
usuario: «no me gusta cómo está organizado el lore» — separarlo por región y por
colores, una sección para Exandria y la Calamidad, y poder ir mostrando u
ocultando por continentes / regiones / historia / secretos.

- **El saber se etiqueta en los datos** (`data/saber.ts`): `SaberEntry` gana
  `place` (Exandria · Tal'Dorei · Marquet · Issylra · Wildemount · Dientes
  Rotos) y `category` (Geografía · Historia · Fe · Potencias · Vida y lenguas ·
  Cosmos · Secretos), derivados **una sola vez** en `tag()` a partir del prefijo
  del id y del ámbito. Las generadoras devuelven ahora
  `Omit<SaberEntry, "place"|"category">[]`. «Exandria» es el cajón de lo que no
  es de ningún continente: panteón, eras, lunas, planos, la Calamidad.
- **Un color por lugar** (`PLACE_ACCENT` + `PLACE_ICON`), no por categoría: tiñe
  el borde del bloque, la chapa de categoría y el filo de cada tarjeta.
  > **Trampa cazada**: `var(--color-gold)` **no existe** en `globals.css` (el
  > alias legacy es `--gold` → `--color-bronze`). `WORLD_COLOR` de
  > `data/world.ts` la usa, así que **los pines de continente de `/mapa` salen
  > sin color** — fallo previo, no arreglado aquí (**ya arreglado el
  > 2026-07-23**, ver su sección RESUELTO arriba: eran seis usos, no uno). En
  > `PLACE_ACCENT` se usan solo variables reales: Exandria `--color-divino`,
  > Tal'Dorei `--color-bronze`. Verificado en navegador: los seis resuelven.
- **Cambio de regla en `lib/saber.ts`**: `revealed` abre **cualquier** entrada,
  no solo las de ámbito `secreto` — es lo que permite revelar una categoría
  entera. El `case "secreto"` se deja en el switch (ya inalcanzable) como
  documentación y por si alguien reordena las comprobaciones.
- **Revelado en bloque**: `useLoreRevealed` gana `revealMany`/`hideMany`
  (optimistas, mismo patrón que `toggle`). El DM tiene «Revelar todo / Ocultar
  todo» en cada **categoría** y «Revelar el bloque / Ocultarlo» en cada
  **lugar**. Sigue todo en `app_config.lore_revealed`, sin migración. **Afecta a
  todo el grupo**; lo individual sigue en `lore_unlocked` (Panel DM › Grupo).
- **`components/SaberSection.tsx` (112 líneas) se parte en cuatro**, en
  `components/reino/`: `SaberCard` (tarjeta) · `SaberCategory` (subgrupo
  plegable + botones DM de bloque) · `SaberPlace` (bloque de lugar con su color)
  · `SaberBrowser` (orquestador: ctx, agrupación, contadores y qué acordeones
  están abiertos — el **único** con estado). El viejo se borró.
- **Acordeones**: al entrar se abren tu tierra y Exandria; el DM entra con todo
  plegado. No se persiste. Barra con «solo lo que sé» (ahora también para el
  jugador), «desplegar/plegar todo» y el contador global.
- **Bloque de un lugar del que no sabes nada**: se lista igual, pero **sin
  tarjetas** — «De estas tierras no sabes nada todavía · N cosas por descubrir».
  Mantiene el principio de que un candado con el título puesto ya spoilea.
- **`data/calamidad.ts`** (nuevo) + `components/reino/CalamidadSection.tsx`:
  `CALAMIDAD_RELATO`, cinco actos **abiertos a todo el mundo** (la Fundación · la
  Era de los Arcanos · Vespin Chloras · dos siglos de guerra · la Divergencia), y
  `CALAMIDAD_LORE`, **14 entradas gateadas** (ids `cal:*`, reutilizan
  `ContinentLoreEntry`): Ritual de Siembra, Vespin Chloras, Ghor Dranas, asalto a
  Vasselheim, ciudades voladoras, Trono del Archicorazón, Vestigios, Puerta
  Divina, Sarenrae, Ioun, cómo cambió el mapa, lo que se perdió, y dos secretos
  (Aeor bajo el hielo, Alyxian). Sustituye al bloque «Lo que todo el mundo sabe»;
  **`HISTORIA_BREVE` no se borra** de `loreTiers.ts` (la usa el narrador IA).
  Las `cal:*` se **excluyen** del navegador del saber para no leerse dos veces,
  pero **sí cuentan** en el contador global (es el marcador del personaje).
- **Orden final de `/reino`**: cabecera · Exandria y la Calamidad · Saber del
  mundo · `ReinoRegions` · calendario.
- **Limitación conocida**: `CalamidadSection` y `SaberBrowser` montan cada uno su
  `useLoreRevealed`. Como `app_config` no dispara realtime para quien escribe, si
  el DM revela algo en una sección la otra no se entera hasta recargar.
- Verificado: `tsc --noEmit` + `next build` limpios · **`npx tsx
  scripts/check-lore.ts` con 55 comprobaciones en verde** · y **prueba real en el
  navegador** (excluyendo `reino` del matcher de `proxy.ts` temporalmente, **ya
  revertido**): los seis bloques con sus colores resueltos, Exandria mostrando la
  línea de «no sabes nada» con cero tarjetas, y el resto listando solo lo sabido.
  **Falta probar con sesión**: **Prueba del usuario** — entrar con un PJ y ver que
  se abren tu tierra y Exandria; entrar como DM y probar «Revelar todo» de una
  categoría y ver que al jugador le aparece.

## RESUELTO (2026-07-21): lore de Marquet, Issylra y los Dientes Rotos 🌍📚
Rama `lore-continentes`. **Sin migración.** Los tres continentes que solo eran
pines sueltos pasan a tener mapa poblado y saber propio, al nivel de Wildemount.

- **`data/world.ts` +50 pines y 3 regiones nuevas**: Marquet gana **Montañas
  Aggrad** y **Arenas Panagrip** (Golfo de los Dones, Bóveda de Shumas,
  Ascuacorona, Escaldaviento, Cael Morrow, La Falla, Caída del Rey, Loonpur,
  Nadigarh, Heartmoor + aldea, Sendas Honradas, Evishi, Goradire, Otoladume,
  Refugio Sapiro, Isla de Droojh, Valle Hundido, Eish Allay, Lago Koron,
  Seminario Aydinlan, Turbión de Seda, Montañas Kaal, Canal Lapis, Gelvaan,
  Sruwargas, Volcán Suuthan); Issylra gana **Alcance Caramarin** (Bosque Vesper,
  Tundra Thorain, Muldire, Zenwick, Valle Cegado, Criptas de Thomara,
  Marrowglade, Puente Ascendente, Shorecomb, Scaldseat, Yunque Primigenio,
  Garganta Espectro, Camino Exterior, Hearthdell, Endovaar, Yermo Serratus,
  Cañón Irriam, Lago Umamu); Dientes Rotos gana Igthuldus, Pico Athos, Slival,
  Shardborne, arrecifes Utu y Bermellón, Monte Ygora, Kurunpa-Mina y Yutazo.
  Mares gana el Mar Berilo. **`Ruukvaya` renombrada a `Ruukva`** (el nombre de
  la ambientación).
- **`mergeAtlas` en `data/atlas.ts` + `lib/useAtlas.ts`**: `seedAtlas` solo
  corría la **primera** vez, así que ampliar `world.ts` no llegaba nunca a un
  `atlas_defs` ya sembrado en Supabase. Ahora, al cargar, lo guardado **manda** y
  se le **suman** las regiones y POIs que falten (por nombre). No renombra, no
  reposiciona, no borra: blurbs editados, pines movidos y POIs inventados por el
  DM se quedan como están. Un POI que ya exista en cualquier región del
  continente cuenta como presente (si el DM lo movió, no se duplica). Persiste
  solo si hubo cambios, y es **idempotente**.
  > **Ojo con el rename**: la fusión suma, no renombra. En un atlas ya sembrado
  > aparecerá **Ruukva** al lado de la vieja **Ruukvaya**; borrar la vieja a mano
  > desde Panel DM › Mapa › POIs por región.
- **`data/continentes.ts`** (nuevo, patrón de `data/wildemount.ts`): 45 entradas
  de lore con redacción propia, cada una con su `tier` — `continente` (lo sabe
  quien es de allí), `erudito` + pericia, `oculto` (potencias y sociedades, hay
  que descubrirlas) y `secreto` (lo revela el DM). Cubre geografía, gentes,
  lengua y cocina de Marquet; el golpe de Gruumsh/Alyxian que creó el Rumedam y
  hundió Cael Morrow; la fundación de Ank'Harel por J'mon Sa Ord y el asedio de
  Thordak; la Guerra Ápice y las cinco potencias marquesianas; el frío, la fe y
  el recelo arcano de Issylra, Thomara, Marrowglade, el Yunque Primigenio y el
  portal del Lago Umamu; y en los Dientes Rotos las islas que se mueven, la
  Hueste Osendada y la Asamblea Wanderman, Domunas, el Monte Ygora, la noche que
  Avalir rompió el continente, Evontra'vir y las Fauces de Chynes. Muchas llevan
  `poi`, así que entran en la **tirada de saber in situ** de `/lugar`.
- **`data/saber.ts`** las traduce a ámbitos con `scopeOfContinentLore`; ids
  prefijados `cl:<continente>:<id>`.
- Verificado: `tsc --noEmit` + `next build` limpios **y `npx tsx
  scripts/check-lore.ts` con 35 comprobaciones en verde** — ids únicos, todo
  `poi` citado existe en `WORLD_POIS`, las reglas del saber por origen (forastero
  no sabe / nativo sí / erudito por pericia / oculto solo desbloqueado / secreto
  solo revelado / el DM lo ve todo), slugs de región únicos globalmente y la
  fusión del atlas (recupera lo que falta, respeta lo editado, no duplica, es
  idempotente). **No probado en vivo.** **Prueba del usuario**: abrir `/mapa`,
  entrar en Marquet/Issylra/Dientes Rotos y ver las regiones y POIs nuevos; crear
  un PJ con origen en uno de esos continentes y comprobar en `/reino` que sabe lo
  suyo y tiene el resto con candado.

## RESUELTO (2026-07-19): el clima extremo pasa factura ❄️🔥
Rama `clima-efectos`. **Sin migración.** Amplía el clima de la Fase N (que ya
estaba completa) con **consecuencias de mesa**.

- **`Weather` gana `efectos`** (`lib/weather.ts`): `frio_extremo`,
  `calor_extremo`, `viento_fuerte`, `lluvia_intensa`, `niebla_densa`. `EFECTOS`
  guarda la **regla** de cada uno (salvación de Constitución por hora de
  exposición → agotamiento; desventaja en ataques a distancia y Percepción por
  oído; desventaja en Percepción por vista; zona muy oscurecida). Reglas de
  entorno estándar, redacción propia. Etiquetados **~35** climas duros de la
  tabla; el resto queda llevadero (`esDuro()`).
- **Exenciones por personaje** — **convención de mesa de esta campaña**, no RAW,
  en una tabla editable de un vistazo: **Explorador** (clase) y **Guía**
  (trasfondo) se libran de **todo**; **Bárbaro** y **Goliat**, del **frío**;
  **Marinero**, de **viento y lluvia**; la pericia **Supervivencia**, de **frío y
  calor**. `exencionPara(efecto, pj)` devuelve el **motivo** escrito, y
  `efectosPara(weather, pj)` reparte en `afectan` / `exentos`.
- **UI**: `components/lugar/ClimaEfectos.tsx` bajo el badge de `/lugar` — lista
  lo que te pega (con su regla) y, aparte, **lo que te saltas y por qué**; si no
  hay ficha en juego lo dice. El icono del **nav** (`PartyLocationWidget`) se
  pone en **color de alarma** cuando el tiempo aprieta. `ambientLine` avisa a los
  NPCs IA de que el tiempo es duro.
- Verificado: `tsc` + `next build` limpios **y `npx tsx scripts/check-clima.ts`
  con 32 comprobaciones en verde** — determinismo del clima, zonas y heurística,
  que todo efecto de la tabla exista en `EFECTOS`, y el reparto afectan/exentos
  por tipo de personaje (al Goliat le pegan 2 de 3 en una ventisca y se libra del
  frío; al Explorador ninguno; sin ficha, nadie exento).

> Nota de higiene: el cuerpo del commit `feat(clima)` perdió la palabra
> «efectos» porque los backticks del mensaje se ejecutaron como sustitución de
> comandos en bash. Sin efecto en el código; para mensajes con backticks, usar
> heredoc.

## RESUELTO (2026-07-19): /reino deja de spoilear + calendario animado 🔒🗓️
Rama `reino-oculto`. **Sin migración.** Petición del usuario: «quitar/ocultar el
lore a los jugadores, dejar una historia más breve; el panteón solo para clases
como paladín o clérigo; facciones y Wildemount, hasta que se descubran; y el
calendario más animado».

- **Ámbitos nuevos en el saber** (`data/saber.ts` + `lib/saber.ts`):
  - **`deidad` gana `side`**: tu deidad **siempre**; del resto solo quien tiene
    el oficio — **primarios** → `clerigo|paladin|druida`; **Traidores** →
    `clerigo|paladin`; **Ídolos Menores** → `clerigo|paladin|brujo`. El ctx gana
    `cls`.
  - **`oculto`**: solo por descubrimiento. Ahí van **facciones de Tal'Dorei**,
    **potencias/lenguas/vida cotidiana de Wildemount**.
  - Las **regiones de Wildemount** son `continente:Wildemount` profundo → las
    sabe quien **es de allí**. La **historia detallada** (`HISTORY`) y la
    **cronología** (`HISTORY_TIMELINE`) piden **Historia**; los **planos**,
    **Arcanos**.
- **`isListed` cambia de criterio**: ya **no se lista lo que no se sabe**. Un
  candado con el título puesto **ya spoilea** (ver «La Garra Carmesí» bloqueada
  revela que la facción existe). El jugador ve **lo que sabe** + un **contador**
  («te quedan N por descubrir»); el DM lo ve todo.
- **`/reino` adelgazado**: se quedan **historia breve** (`HISTORIA_BREVE`, 3
  párrafos de taberna), el **saber del PJ**, las **regiones**, el **calendario**
  y las **lunas**. Fuera: el volcado de eras, cronología, panteón, facciones,
  Wildemount y planos — todo eso vive ahora en el saber y se descubre.
- **`components/reino/CalendarWheel.tsx`**: rueda SVG del año — los 11 meses
  repartidos por sus **días reales**, teñidos por **estación**, festividades como
  marcas en el aro (la de hoy **late**), **aguja** en el día de campaña (gira con
  el reloj) y luna+fecha en el centro; semana con el día actual resaltado.
  **Trampa cazada**: las coordenadas van **redondeadas a 2 decimales** a
  propósito — Node y el navegador no dan el mismo último bit en `sin/cos` y sin
  eso React lanzaba **hydration mismatch** en cada arco.
- Verificado: `tsc --noEmit` + `next build` limpios **y prueba real en el
  navegador** (excluyendo `reino` del matcher de `proxy.ts` temporalmente, **ya
  revertido**): 11 arcos sin `NaN`, etiquetas de los 11 meses, centro con «1 de
  Horisal · 836 PD · Invierno · Cuarto creciente», SVG 340×340, y **HTML del
  servidor idéntico al DOM** (cero decimales largos) → mismatch resuelto.
  > Ojo: el buffer de consola del navegador **no se limpia** al recargar; los
  > errores de hidratación seguían apareciendo con coordenadas que ya no existían
  > en el DOM. Se confirmó comparando el HTML servido con `fetch`.
- **Lunas también ocultas** (ajuste posterior, rama `reino-lunas`): `MOONS` pasa
  al saber con ámbito **`oculto`** y sale de `/reino`. Que **hay dos lunas** y que
  la roja da mala espina sigue siendo **común** (entrada `lunas-calendario` de
  `loreTiers`); lo que se sabe **de** ellas hay que ganárselo. La **fase lunar**
  del centro del calendario se queda: se ve mirando al cielo.
- **Calendario ampliado** (rama `calendario-completo`, 2ª pasada a petición del
  usuario: «me gusta lo nuevo pero no lo veo completo»):
  - **Cabecera**: fecha larga, día de la semana, **hora** (con icono sol/luna),
    **estación** + días que le quedan, **fase de Catha** y **cuenta atrás a la
    próxima festividad** (+ chapa si hoy es fiesta).
  - **Rueda**: **anillo de estaciones** etiquetado, los 11 meses por sus días
    reales teñidos por estación (el actual **late** con `<animate>`),
    festividades en el aro (la de hoy palpita), aguja en el día. **Los meses son
    clicables.**
  - **Vista de mes** (nueva): rejilla de semanas de 7 **alineada con el reloj**
    (offset por día absoluto `año*328 + doy-1`), hoy resaltado, fin de semana
    teñido, festividades marcadas y listadas debajo, y la **fase de Catha en cada
    día** — `moonPhaseForDay(absDay)` se **exportó de `lib/gameClock.ts`** para no
    duplicar el ciclo de 33 días. Botón «Mes actual».
  - La lista suelta de festividades **sale de `/reino`**: la cubre la vista de mes.
  - Verificado en navegador: 11 arcos de mes + 4 de estación, **29 celdas** en
    Horisal y **32** al pulsar Sydenstar (con sus 2 fiestas), **día 1 en la
    columna de Folsen**, igual que el `weekdayName` del reloj (la aritmética del
    offset casa con `momentFromGameMin`), 29 lunas, y **cero decimales largos**
    en el SSR.
- **Reloj de la barra desplegable** (rama `reloj-nav`): la chapa compacta del nav
  pasa a **botón** → abre un panel (`components/ClockPopover.tsx`) con fecha
  larga, día de la semana, hora, **estación + días que le quedan**, fase de
  Catha, chapa si hoy es fiesta, la **rejilla del mes en curso** (hoy resaltado,
  fin de semana, festividades marcadas), la **próxima fiesta con cuenta atrás** y
  enlace al calendario completo. Cierra con **Escape** o **clic fuera**. Así no
  hace falta entrar a `/reino` para mirar la hora o el mes.
- **`lib/calendar.ts`** (nuevo): la aritmética del calendario (`STARTS`,
  `doyFromDate`, `SEASON_RANGES`/`seasonOfDay`/`daysLeftInSeason`, `HOLIDAY_DOY`/
  `nextHoliday`, `absDayOf`, `monthCells`, `isWeekend`, `holidayAt`) sale de
  `CalendarWheel` a un **módulo puro compartido**, para que la rueda de `/reino`
  y el desplegable del nav **no se separen**. `CalendarWheel` refactorizado
  encima. `ClockWidget` pierde la variante `compact` (ya sin usuarios; sigue la
  grande en `/lugar` «de camino» y Panel DM › Tiempo).
- **Estado final de `/reino`**: intro · historia breve · saber del PJ ·
  `ReinoRegions` · calendario. Nada más.
- **Pendiente de decidir**: `ReinoRegions` sigue mostrando las 8 regiones de
  Tal'Dorei con su blurb a todo el mundo (geografía a la vista). Si se quiere
  gatear también, la entrada `reg:<slug>` del saber ya existe.

## RESUELTO (2026-07-19): Saber por origen 📚 (rediseño del saber)
Rama `fase-n-saber-origen`. Spec/plan en
`docs/superpowers/{specs,plans}/2026-07-19-saber-por-origen*`. Migración
`schema_v19`. **Sustituye el modelo de saber que la Fase N había dejado**
(era solo por pericia): ahora cada PJ **sabe lo suyo** y descubre el resto.

**Decisiones del usuario** (preguntadas antes de implementar): base por
**origen + deidad** y **además** la pericia sigue abriendo lo erudito; región =
**continente Y subregión** (subregión solo en Tal'Dorei); deidad **opcional**
(«sin fe»); y **las cuatro vías** de descubrimiento.

- **Derivar, no duplicar**: la lore base **no se reescribe**. `data/saber.ts`
  la **deriva** de lo que ya había — `pantheon.ts` (33 deidades: blurb,
  preceptos, símbolo, día santo), `taldorei.ts` (`REGIONS`) y `world.ts`
  (continentes). A mano solo queda la capa curada de `loreTiers.ts` (erudito +
  secretos), que se **reencaja** en el modelo nuevo (sus `comun` pasan a saber
  básico de continente).
- **Modelo**: `SaberEntry { id, scope, depth, topic, title, text, poi? }` con
  `scope ∈ continente | region | deidad | erudito | secreto`.
  `lib/saber.ts` es **puro**: `knows(entry, ctx)` con
  `ctx = { isDm, originContinent, originRegion, deity, skills, unlocked, revealed }`.
  Reglas: continente **básico** lo sabe todo el mundo («un poco»); continente
  **profundo** solo si es el tuyo; región solo si es la tuya; deidad solo si es
  la tuya; erudito por pericia; secreto si el DM lo reveló. **`unlocked` abre
  cualquier entrada** — es la puerta común de las cuatro vías.
- **Migración `schema_v19`** (agrupada): `characters` gana `origin_continent`,
  `origin_region`, `deity`, `lore_unlocked jsonb`; `quests` gana `unlock_lore
  jsonb`; y tabla **`lore_rolls`** (character_id, poi_name, total) con PK
  compuesta — una tirada de saber por lugar y personaje (filosofía Fase K).
- **Creador**: origen y fe se piden en el paso **Trasfondo** (`BackgroundScene`),
  no en una runa nueva, para **no tocar el gate de 6 pasos**. Continente → si es
  Tal'Dorei, subregión → deidad. Todo opcional.
- **`/reino`**: `SaberSection` reescrito sobre el modelo — agrupa por ámbito,
  cuenta «conoces N de M», filtro «solo lo que sé», candado con el motivo
  (`lockReason`), y el DM revela/oculta secretos inline. Los secretos no
  revelados **no se listan** al jugador.
- **Las cuatro vías de descubrimiento**:
  1. **Tomos**: `ItemDoc.unlockLore` — al abrir el documento en el visor, esas
     entradas se añaden al saber **de ese personaje** (solo en la ficha propia).
     El DM elige qué enseña desde el Baúl con `LorePicker` (buscador+casillas).
  2. **Misiones**: `quests.unlock_lore`; al pasar la misión a `completada`, el
     DM la reparte **a todo el grupo** vía `/api/dm/character` (op `unlockLore`).
  3. **DM a mano**: bloque «Enseñar saber» por jugador en Panel DM › Grupo.
  4. **Tirada in situ**: `SaberRoll` en `/lugar` — «¿Qué sé de esto?» con
     Historia/Arcanos/Religión (mod y competencia de `derive`), dados 3D, tramos
     **10/15/20** → 1/2/3 entradas del lugar (su región, su continente a fondo,
     lo ligado al POI). **Una por lugar y PJ**; repetir exige que el DM borre la
     fila de `lore_rolls`.
- Verificado: `tsc --noEmit` + `next build` limpios **por etapa** (4 etapas).
  **Sin sesión en dev**: no probado en vivo. **Prueba del usuario** (tras
  `schema_v19.sql`): crear/editar PJ con origen y deidad → en `/reino` ves tu
  región, tu continente a fondo y tu deidad, y el resto con candado; entregar un
  tomo que enseñe algo y leerlo; completar una misión con saber; enseñar a mano;
  y tirar «¿Qué sé de esto?» en `/lugar`.

## RESUELTO (2026-07-19): Fase N (partes 2 y 3) — saber + pistas 🌍
Rama `fase-n-completa`. Spec/plan en
`docs/superpowers/{specs,plans}/2026-07-19-fase-n-completar*`. **Completa la
Fase N** (con la parte 1 de más abajo). **Sin migración** (todo `app_config` +
la ficha).

- **Saber del mundo por personaje**: sección nueva «Saber del mundo» en `/reino`
  (`components/SaberSection.tsx`, client) sobre un dataset curado por niveles
  (`data/loreTiers.ts`: `tier ∈ comun|erudito|secreto` + `unlockSkill`). **Común**
  para todos; **erudito** si el PJ tiene la pericia (`loadActiveCharacter().skills`
  → Historia/Arcanos/Religión/Naturaleza; si no, tarjeta bloqueada);
  **secreto** revelado por el DM (`app_config.lore_revealed`,
  `lib/useLoreRevealed.ts`, optimista) — los no revelados **no se listan** a los
  jugadores, y el DM revela/oculta **inline**. **No se tocó** la lore estática
  existente de `/reino`. **Diferido**: la **tirada de saber in situ** (dados +
  persistencia por-POI estilo Fase K) — N-tirada.
- **Pistas y rumores**: `app_config.clues` (`lib/useClues.ts`, optimista) —
  `Clue {texto, mision?, lugar?, discovered, rumor}`. El DM las gestiona en la
  sección «Pistas y rumores» de `CronicaPanel` (crear con datalists de
  quests/POIs, revelar/ocultar, borrar). Las **descubiertas** salen en `/cronica`
  (bloque «Pistas»). Las marcadas **rumor** y sin descubrir se **siembran en los
  NPCs IA** de `/lugar` (se añaden al `ambient` de tendero/PNJ, filtradas al POI
  actual o sin lugar); el DM las marca descubiertas a mano.
- Verificado: `tsc --noEmit` + `next build` limpios. **Sin sesión en dev**: no
  probado en vivo. **Prueba del usuario**: en `/reino`, un PJ con Historia ve la
  lore de Historia y el resto bloqueado; el DM revela un secreto y el jugador lo
  ve. Crear una pista, revelarla → sale en `/cronica`; una pista-rumor → un NPC
  IA la deja caer.

## RESUELTO (2026-07-19): Fase N (parte 1) — clima por región y estación 🌦️
Rama `fase-n-clima`. Spec/plan en
`docs/superpowers/{specs,plans}/2026-07-19-fase-n-clima*`. **Sin migración.**
Alcance acotado a la pieza autocontenida; «saber del mundo por pericia» y
«pistas/rumores» **diferidos**.

- **`lib/weather.ts`** (puro, patrón de `lib/gameClock.ts`): `weatherFor(
  continent, regionSlug, regionName?, moment)` devuelve `{ condition, icon,
  temp }` **determinista** — semilla = hash `regionSlug|year|dayOfYear` (mismo
  clima todo el día de juego, cambia al siguiente). `zoneFor` elige zona
  (`templado|frio|arido|costero|humedo|brumoso`): **mapa explícito** de las 8
  regiones de Tal'Dorei → **heurística por palabras** del slug/nombre
  (montaña→frío, costa→costero, desierto→árido, bosque→húmedo, bruma→brumoso) →
  **por continente** (Marquet árido, Wildemount frío, Dientes Rotos húmedo) →
  templado. Tabla de condiciones por zona×estación (las 4 de `cosmology.ts`).
  `ambientLine` arma una frase de contexto para los NPCs.
- **`/lugar`**: badge de clima bajo la cabecera (icono + condición + temp +
  estación), con `useGameClock`+`momentFromGameMin`.
- **Nav** (`PartyLocationWidget`): icono del clima del lugar del grupo junto al
  📍 (+ tooltip con condición/temp).
- **NPCs IA**: `/lugar` pasa `ambient` (la frase) a `ShopSection` (tendero) y
  `NpcSection` (PNJ), que la añaden al system prompt → los NPCs pueden comentar
  el tiempo. Con el túnel caído no cambia nada (solo es texto en el prompt).
- **Diferido**: **saber del mundo por pericia** (`tier`/`unlockSkill` en la lore
  de `cosmology.ts`/`taldorei.ts` + derivación con `derive` + `/reino` +
  tirada de saber in situ — feature grande, N-saber), **pistas/rumores**
  (`app_config.clues` + siembra en NPCs — N-pistas).
- Verificado: `tsc --noEmit` + `next build` limpios. **Sin sesión en dev**: no
  probado en vivo. **Prueba del usuario**: fijar ubicación del grupo y ver el
  clima en `/lugar` y el icono en el nav; que sea el mismo dentro del día de
  juego y cambie al avanzar el reloj a otro día; que difiera por región (una de
  montaña vs. la costa).

## RESUELTO (2026-07-19): Fase M (partes 2 y 3) — documentos + memoria 🤖
Rama `fase-m-completa`. Spec/plan en
`docs/superpowers/{specs,plans}/2026-07-19-fase-m-completar*`. **Completa la
Fase M** (con la parte 1 de más abajo). Migración `schema_v18` (memoria).

- **Documentos in-game** (sin migración): `Item.doc?: {titulo,texto,imagen?}` en
  el jsonb de `items` (`lib/character.ts`). El DM adjunta un documento a una
  entrada del **Baúl** (`BaulPanel`, sección plegable + botón «✨ IA» →
  `generarDocumento`) y lo entrega; `/api/dm/character` acepta `doc` en
  `addItems` y **no fusiona** documentos por nombre (cada carta es única). El
  jugador lo abre con **«Leer»** → `DocViewer` (modal pergamino) en
  `CharacterSheet`, también en la hoja de solo-lectura.
- **Memoria de NPC** (`schema_v18`): tabla `npc_memories (npc_ref, user_id,
  summary, updated_at)`, PK compuesta, RLS (jugador la suya, DM todas), realtime.
  `lib/useNpcMemory.ts`. `NpcChat` gana `memoryRef` (`npc:<id>`): carga el
  resumen del jugador y lo **inyecta al system prompt**; al cerrar el chat con
  conversación, la IA lo **resume** (integrando el previo) y lo persiste
  (fire-and-forget en el cleanup del desmontaje). `NpcSection` lo pasa. El DM
  lee/edita/olvida las memorias en el bloque «Memorias» de `NpcsPanel`. El
  tendero (`ShopSection`) aún no lleva memoria (diferido si hace falta).
- Verificado: `tsc --noEmit` + `next build` limpios. **Sin sesión ni túnel en
  dev**: no probado en vivo. **Prueba del usuario** (tras `schema_v18.sql`, con
  Ollama): adjuntar un documento en el Baúl y entregarlo → el jugador lo lee;
  hablar con un PNJ, cerrar, volver → debe recordar; el DM ve la memoria.

## RESUELTO (2026-07-19): Fase M (parte 1) — generadores IA del DM 🤖
Rama `fase-m-generadores-ia`. Spec/plan en
`docs/superpowers/{specs,plans}/2026-07-19-fase-m-generadores-ia*`. **Sin
migración.** Alcance acotado a la pieza con superficie hoy (los tres formularios
DM + `/api/ia` ya existen); documentos in-game y memoria de NPC **diferidos**.

- **`lib/generar.ts`**: `generarJSON<T>(persona, prompt)` llama a `narrar()`
  (`/api/ia` → Ollama) con un persona que **exige JSON puro en español
  ambientado en Exandria** y **parsea con tolerancia** (quita vallas ```json,
  recorta del primer `{` al último `}`). Propaga `offline` (túnel caído) para
  desactivar los botones. Envoltorios: `generarNpc`→`{name,role,prompt}`,
  `generarTienda`→`{name,greeting,npc_prompt}`, `generarEncargo`→
  `{title,body,reward}`. La `pista` es el texto que el DM ya tenga escrito
  (nombre a medias, «tabernero elfo gruñón»); vacía = la IA inventa de cero.
- **Botón «✨ IA»** en tres formularios: `NpcsPanel` (crea el PNJ ya formado:
  `createNpc`+`updateNpc` con el prompt), `TiendasPanel` (crea la tienda +
  `greeting`/`npc_prompt`; el catálogo sigue en «Semilla»), `CronicaPanel`
  (**rellena** el form de misiones sin escribir en BD y pone estado `oferta` si
  estaba en `activa` → encaja con el tablón de la Fase F). Todos con
  busy/spinner + aviso de error; se desactivan si `offline`.
- **Diferido**: **documentos in-game** (campo `doc` en items + entrega por Baúl
  + visor de pergamino — feature propia, M-docs), **memoria de NPC** (tabla
  `npc_memories`, resumen al cerrar chat + inyección al prompt — **necesita
  migración**, M-memory), y **catálogo de tienda por IA** (ya hay «Semilla»).
- Verificado: `tsc --noEmit` + `next build` limpios. **Sin sesión DM ni túnel en
  dev**: no probado en vivo. **Prueba del usuario** (con Ollama arriba y el túnel
  fijado): pulsar «✨ IA» en cada formulario y ver que rellena/crea con JSON
  coherente; con el túnel caído, el botón se desactiva.

## RESUELTO (2026-07-19): Fase F — tablón de misiones 📜
Rama `fase-f-tablon`. Spec/plan en
`docs/superpowers/{specs,plans}/2026-07-19-fase-f-tablon*`. Vive en `/lugar`.

- **Migración `schema_v17.sql`**: `quests` (schema_v12) gana el estado
  `'oferta'` (recrea el CHECK de `status`) + columnas `poi_name text` (POI donde
  se publica, casa con `Poi.name`) y `reward text` (recompensa en texto). RLS y
  Realtime sin cambios (la policy de lectura ya dejaba ver todo lo que no es
  `'oculta'`; `quests` ya estaba en la publicación). **Ya ejecutada** (2026-07-21).
- **UI DM** (`app/dm/CronicaPanel.tsx`): el CRUD de misiones ya existía; se
  amplía con `'oferta'` en `QUEST_LABEL`/`QUEST_COLOR` (el select de estado lo
  recoge solo) + inputs **POI** (con `<datalist>` de todos los POIs del atlas
  vía `useAtlas` → autocompleta exacto, evita typos) y **recompensa**. La lista
  muestra POI + recompensa. Publicar una oferta = misión con estado `'oferta'`.
- **UI jugador** (`components/lugar/TablonSection.tsx`, solo si
  `poi.services.tablon`): lista las quests con `poi_name === poi.name` y
  `status === 'oferta'` (vienen de `useChronicle`, ya realtime) → botón
  **«Aceptar encargo»**. Se retiró la última tarjeta placeholder de
  `ServiceSections.tsx`, que se queda sin cards y **se borra** (ya no se importa
  en `/lugar`).
- **Endpoint `app/api/aceptar-encargo/route.ts`** (`service_role`, patrón de
  `/api/descanso`): la escritura en `quests` es DM-only por RLS, así que el
  jugador acepta por servidor. Valida que sigue en `'oferta'` (anti-abuso: no
  re-aceptar), pasa a `'activa'` y **appendea al body una nota de quién la
  aceptó** (nombre del personaje activo) — cumple «con nota de quién lo aceptó»
  sin columna nueva. Cliente en `lib/encargo.ts` (espejo de `lib/descanso.ts`).
- **`/cronica` no se ensucia**: `CronicaView` ya filtra `status === 'activa'` /
  `completada|fallida`, así que `'oferta'` cae fuera de ambas listas (solo se le
  añadió el badge por completitud del `Record`). Aceptar → aparece como activa.
- **Diferido**: recompensa **mecánica** (oro/XP automáticos al completar; hoy
  `reward` es descriptivo, el DM la entrega a mano), caducidad/límite de ofertas,
  nota automática en el diario más allá del append al body.
- Verificado: `tsc --noEmit` + `next build` limpios (ruta `/api/aceptar-encargo`
  y `/lugar` presentes). **Sin sesión en dev**: no probado en vivo. **Prueba del
  usuario** (tras `schema_v17.sql`): en el POI donde esté el grupo, marcar
  `tablón` en el POI, publicar una oferta con ese POI desde Panel DM › Crónica,
  verla en `/lugar`, Aceptar, y que pase a activa en `/cronica` con la nota.

## RESUELTO (2026-07-17): Fase E — NPCs por ubicación 🗣️
Rama `fase-e-npcs`. Spec en
`docs/superpowers/specs/2026-07-17-fase-e-npcs-design.md`. Vive en `/lugar`.

- **Migración `schema_v16.sql`**: tabla `location_npcs` (poi_name, name, role,
  prompt, public, portrait). RLS: jugadores ven los `public`, el DM todos;
  escritura DM. Realtime. **Ya ejecutada** (2026-07-21).
- **Chat IA reutilizable** `components/lugar/NpcChat.tsx` (`narrar` con persona).
  `lib/useNpcs.ts` (por POI, realtime, CRUD). `/lugar` › «Gente del lugar»
  (`NpcSection`): lista NPCs visibles → chat en personaje. Editor DM: pestaña
  **«PNJs»** (`NpcsPanel`).
- **Diferido**: auto-insert en `npcs_met` (códice), chat grupal en vivo,
  contexto de reloj en el prompt.
- Verificado: `tsc` + `build` limpios. **Prueba del usuario** (tras
  `schema_v16.sql`): crear un NPC en un POI y hablarle desde `/lugar`.

## RESUELTO (2026-07-17): Fase D — posada, descansos que mueven el reloj 🛏️
Rama `fase-d-posada`. Spec en
`docs/superpowers/specs/2026-07-17-fase-d-posada-design.md`. Vive en `/lugar`.
**Sin migración** (usa `app_config` + `characters`).

- **Endpoint `app/api/descanso/route.ts`** (`service_role`, como
  `/api/dm/character`): el descanso del jugador necesita escribir el reloj
  (`app_config.campaign_clock`, RLS DM-only), así que va por servidor. Jugador
  autenticado → cobra el oro de su ficha activa + avanza el reloj (**+1 h corto**
  / **+8 h largo**). **Anti-abuso**: ≥20 h de juego entre descansos largos
  (`app_config.last_long_rest`).
- **Precios FIJOS** (`lib/descanso.ts`): corto 0, cama común 5 po, habitación
  20 po. *Configurable por POI → diferido* (no se tocó el tipo `services.posada`,
  hoy booleano).
- **UI** `components/lugar/PosadaSection.tsx` (solo si `poi.services.posada`):
  botón corto; largo con selector común/habitación + confirmación; muestra y
  actualiza el oro. Se retiró la tarjeta placeholder «Posada» de `ServiceSections`.
- **Diferido**: nota automática en la Crónica ("pasó la noche en…"), reset del
  flag de regateo (Fase C2), restaurar PG actuales (no se trackean aún).
- Verificado: `tsc --noEmit` + `next build` limpios. **Sin sesión en dev**: no
  probado en vivo. **Prueba del usuario**: en un POI con posada, descanso corto
  (avanza 1 h), largo (cobra, avanza 8 h, bloquea el segundo seguido). Necesita
  `SUPABASE_SERVICE_ROLE_KEY` en Vercel (ya está).

## RESUELTO (2026-07-17): Fase C — tiendas con IA 🛒
Rama `fase-c-tiendas`. Spec/plan en
`docs/superpowers/{specs,plans}/2026-07-17-fase-c-tiendas*`. Vive en `/lugar`
(Fase B). Ejecutado inline.

- **Migración `schema_v15.sql`** (la guía la llamaba v13, ya usada): tablas
  `shops` (poi_name, name, kind, npc_prompt, greeting), `shop_items` (shop_id,
  name, price, stock nullable=∞, notes), `shop_log` (compra/venta, user_id
  `default auth.uid()`). RLS: lectura autenticados; shops/items **crea/borra**
  DM; **update de shop_items autenticados** (el jugador decrementa stock al
  comprar — confianza de mesa); shop_log insert propio. Realtime en shop_items y
  shop_log. **Ya ejecutada** (2026-07-21).
- **Compra/venta contra la ficha real** (`lib/shopTx.ts`): comprar = resta oro +
  añade item (`mergeItem`) + decrementa stock + fila en `shop_log`; vender =
  **mitad** del precio de catálogo (solo objetos que la tienda tiene por nombre).
  Persiste con `saveCharacter` (sesión del jugador, RLS de propietario).
  Validación en cliente (oro/stock), errores en español.
- **Hook** `lib/useShops.ts` (carga por POI + realtime + CRUD del DM +
  `seedCatalog`). Plantillas `data/shopTemplates.ts` (herrería/alquimista/general,
  precios PHB).
- **Editor DM** (`app/dm/TiendasPanel.tsx`, pestaña **«Tiendas»**): selector de
  POI, crear/editar/borrar tienda, catálogo CRUD, botón **«Semilla {kind}»**.
- **`/lugar`** (`components/lugar/ShopSection.tsx`): lista tiendas del POI →
  catálogo (Comprar), Vender, y **chat del tendero IA** (`narrar` con persona =
  prompt + catálogo). Muestra el oro del jugador. La tarjeta placeholder «Tienda»
  de `ServiceSections` se retiró (ahora es real); posada/NPCs/tablón siguen
  placeholder.
- **Diferido (C2/Fase D)**: **regateo** (tirada de Persuasión con dados 3D +
  descuento por tramos + una vez por descanso) — depende del control de descansos.
- Verificado: `tsc --noEmit` + `next build` limpios en cada commit. **Sin sesión
  en dev**: no probado en vivo. **Prueba del usuario** (tras `schema_v15.sql`):
  crear tienda + semilla (DM), comprar/vender desde `/lugar` con un jugador y ver
  oro/inventario/stock cambiar, y el chat del tendero.

## RESUELTO (2026-07-17): Fase B — modo ubicación "Estás en…" 📍
Rama `fase-b-modo-ubicacion`. Spec/plan en
`docs/superpowers/{specs,plans}/2026-07-17-fase-b-modo-ubicacion*`. Ejecutado con
subagentes (Task 6 docs inline). Base de las fases C–F.

- **Ubicación del grupo**: `app_config.party_location` (JSON
  `{ continent, regionSlug, poiName } | null`, **sin migración**) vía
  `lib/usePartyLocation.ts` (**mutación optimista** — `app_config` no dispara
  realtime, ver memoria del proyecto).
- **El DM la fija** desde el editor de mapa (Panel DM › Mapa › POIs por región):
  botón **"El grupo está aquí"** por POI (resalta el actual) + botón global
  **"El grupo viaja"** (limpia). Guardado optimista.
- **Widget en nav** (`PartyLocationWidget`, junto al reloj): "📍 {poiName}" →
  `/lugar`; invisible si no hay ubicación.
- **Página `/lugar`** (player+DM, sin gate): cabecera del POI (nombre/tipo/blurb
  del atlas) + imagen del pueblo si `townMap(poiName)` + **secciones de
  servicio**. Sin ubicación o POI no hallado → **"De camino…"** con la región y
  el reloj.
- **`Poi.services?`** (`{ tienda?: string[]; posada?: boolean; npcs?: string[];
  tablon?: boolean }`, opcional, sin migración) editable en el form de POI del
  DM (checkboxes posada/tablón, ids coma-separados tienda/npcs). Las **secciones
  de servicio** en `/lugar` (`components/lugar/ServiceSections.tsx`) son
  **placeholders "Próximamente (Fase C/D/E/F)"** — cada fase C–F sustituye el
  cuerpo de su tarjeta sin tocar el resto.
- **Fuera de alcance**: la funcionalidad real de tienda/posada/NPC/tablón (fases
  C–F). B deja el hueco montado.
- Verificado: `tsc --noEmit` + `next build` limpios en cada commit (5 tareas de
  código); `/lugar` en la tabla de rutas. **Sin sesión en dev**: no se probó en
  vivo (superficies DM y `/lugar` redirigen a `/login` sin sesión). **Prueba del
  usuario**: fijar ubicación en un POI, ver el widget y `/lugar` con cabecera +
  mapa de pueblo, marcar servicios y ver las tarjetas placeholder, "El grupo
  viaja" → "De camino…". Sin migración.

## RESUELTO (2026-07-17): Fase H — subida de imágenes (Storage) 🖼️
Rama `fase-h-subida-imagenes`. Spec en
`docs/superpowers/specs/2026-07-17-fase-h-subida-imagenes-design.md`; plan en
`docs/superpowers/plans/2026-07-17-fase-h-subida-imagenes.md`. Alcance: "Fase H
entera" acotada a lo que tiene superficie hoy (NPC/battlemaps/tokens diferidos a
sus fases E/I).

- **Infra**: `lib/storage.ts` (`uploadImage(folder, filename, file, maxWidth)`:
  resize/compresión canvas → JPEG 0.85 → sube a bucket `assets` con `upsert` →
  URL pública con cache-bust) + `components/ImageUpload.tsx` genérico (preview,
  subida, **fallback a URL manual** si Storage no configurado).
- **Integraciones (4)**: (1) campo de **submapa** en el editor de región
  (`MapaPanel`, folder `maps/`) → cierra el hueco Issylra/Marquet/Dientes Rotos;
  (2) pestaña DM **«Arte»** (`ArtePanel`) para **retratos de especie/linaje/
  clase** → override en `app_config.art_overrides` (`useArt`+`artSrc`), leído por
  el creador (`SpeciesScene`/`ClassScene`); (3) **mapas de pueblo data-driven**
  (`useTownMaps`, `app_config.town_maps`, sección en «Arte») — `TOWN_MAPS` queda
  como defaults; (4) **arte de monstruo** en el formulario del bestiario
  (reutiliza `Monster.image`, ya reservado; se guarda en `custom_monsters` y se
  pinta en el statblock).
- **Sin migración de tablas**; los overrides van en `app_config` (realtime,
  patrón `useDmStash`). **Paso manual pendiente del usuario**: ejecutar
  `supabase/storage-assets.sql` (crea bucket público `assets` + policies de
  escritura solo DM vía `is_dm()`). Sin él, la subida cae al **fallback de URL
  manual** (no rompe nada).
- Verificado: `tsc --noEmit` + `next build` + `check-bestiary` limpios en cada
  commit (7 tareas). **NADA probado contra Storage/BD** (sin bucket ni sesión DM
  en dev; las superficies DM/`/crear` redirigen a `/login` sin sesión). **Prueba
  en vivo del usuario**: tras crear el bucket, subir un submapa a una región de
  Marquet y verlo en `/mapa`; subir un retrato de especie y verlo en `/crear`;
  subir arte a un monstruo custom; añadir un mapa de pueblo.

## RESUELTO (2026-07-17): Fase L — control de acceso por rol 🔒
Rama `fase-l-acceso-por-rol`. Spec en
`docs/superpowers/specs/2026-07-17-fase-l-acceso-por-rol-design.md`; plan en
`docs/superpowers/plans/2026-07-17-fase-l-acceso-por-rol.md`. Ejecutado con
subagentes (implementador + revisor spec + revisor calidad por tarea).

- **`/narrador` pasa a DM-only** con gate de **servidor** (no ocultar botones):
  `app/narrador/page.tsx` se parte en server component (`getSessionProfile()` →
  sin perfil `redirect("/login")`, `role !== "dm"` `redirect("/")`) +
  `app/narrador/NarradorClient.tsx` (el chat cliente, lógica intacta). Mismo
  patrón que `/dm` → `DmDashboard`. Era un narrador IA personal del jugador; se
  cierra por decisión del usuario — su chat IA sigue en la **Taberna**.
- **`SiteNav`**: `/narrador` sale de `BASE_LINKS` y entra en `DM_LINKS` junto a
  `/dm`; el jugador no ve ninguno de los dos (desktop y móvil derivan del mismo
  array `links`). Ocultar es cosmético; la garantía es el redirect de servidor.
- **Auditoría de superficies** (tabla en la spec, regla nueva: toda ruta declara
  su rol): el resto ya estaba gateado (`/dm`, `/api/dm/character`,
  `/api/admin/users`) — sin cambio de código. **`/api/ia` se queda autenticado**
  (Taberna/NPCs lo usan; cerrarlo los rompería). RLS sin tocar; `dm_notes`
  legible por consola sigue aceptado.
- Verificado: `tsc --noEmit` + `next build` limpios (`/narrador` es ruta
  dinámica `ƒ`); dos revisiones por tarea; y en navegador **anon en `/narrador`
  redirige a `/login`** (dev server). Sin migración.

> **PENDIENTE de prueba del usuario** (necesita sesión, sin credenciales en dev):
> **jugador logueado** que navegue a `/narrador` debe redirigir a `/`, y su nav
> no debe mostrar "Narrador"; el **DM** sí lo ve y entra.

## RESUELTO ESTA SESIÓN (2026-07-02 → 2026-07-03)
1. **Botón "Terminar" del DM**: el bug real era que `EpicOverlay` se monta a
   pantalla completa y tapaba el botón "Terminar" del panel (inalcanzable). El
   botón que sí se podía pulsar ("Cerrar para todos") no limpiaba nada. Fix:
   ese botón (renombrado **"Terminar escena"**) ahora hace
   `epic_mode:false + narrator_typing:false + resetGroup()`.
2. **Recuadro de votación lento**: era el efecto de máquina de escribir de
   `EpicOverlay`, no el textarea (el fix de `localDraft` con debounce ya
   estaba bien). Acelerado el intervalo.
3. **Mapa "MAPA"**: se sustituyó el mapa vertical (solo Tal'Dorei) por el
   **mapa del mundo de Exandria** horizontal, con navegación jerárquica,
   niebla, zoom y pantalla completa.
4. **Lore ampliada**: calendario, estaciones, festividades, lunas, planos y
   una historia de Exandria datada por eras (ver `data/cosmology.ts`).
5. **Editor de mapa completo**: todos los pines del mundo y las regiones/POIs
   de Tal'Dorei son ahora editables por el DM (CRUD), sin necesidad de
   migraciones (se guardan como JSON en `app_config`). Se corrigió un bug por
   el que un pin arrastrado "volvía" a su sitio (faltaba actualización
   optimista, ya que `app_config` no tiene Realtime).
6. Añadidos lugares que faltaban en la lore: Hupperdook, Shadycreek Run
   (Wildemount), Jrusar (Marquet), Deastok, Terrah, Zephrah, Vesrah
   (los 4 enclaves Ashari: Pyrah=fuego, Terrah=tierra, Zephrah=aire,
   Vesrah=agua).

## PENDIENTE / A VIGILAR
- **Posiciones de pines del mundo se reiniciaron**: al mover el almacén de
  pines del mundo de la tabla `world_poi` (schema_v7, sin uso ahora) a
  `app_config`, las posiciones/revelados que ya hubieras ajustado en `world_poi`
  no se migraron. Los pines del mundo parten de los valores por defecto del
  código; hay que **recolocarlos y revelarlos de nuevo** desde Panel DM ›
  Mapa (ya persiste bien tras el fix del bug #5).
- **Sin probar en vivo con 2 jugadores reales** ninguno de los cambios de esta
  sesión (no había credenciales Supabase en el entorno de desarrollo; todo se
  verificó con `tsc --noEmit` + `next build` limpios, y análisis de código).
  Falta la prueba real: Terminar escena, consenso de grupo, mapa jerárquico,
  editor de pines, niebla.
- **`data/pois.ts` / `data/taldorei.ts`** siguen existiendo como *valores por
  defecto* pero la fuente de verdad en producción, una vez editado algo, es
  `app_config` (`taldorei_defs`). Si se quiere "resetear" Tal'Dorei a los
  defaults del código, borrar esa key en `app_config`.

## RESUELTO (2026-07-17): Archivar personaje 📦
Trabajo directo en `master`. Diseño en
`docs/superpowers/specs/2026-07-17-archivar-personaje-design.md`; plan en
`docs/superpowers/plans/2026-07-17-archivar-personaje.md`. Ejecutado con
subagentes (implementador + revisor por tarea).

> ⚠️ **PENDIENTE del usuario: ejecutar `supabase/schema_v14.sql`.** Sin ella,
> `/crear` y `/personaje` **no funcionan** (piden columnas que no existen).

**Qué es**: el jugador **retira** su personaje (deja de jugarlo; lo ve en gris en
`/personaje`). No se borra. El **DM lo conserva**, puede **devolverlo a juego** o
**borrarlo de verdad** para hacer sitio.

**Modelo nuevo**: `characters` pasa de una fila por jugador (`user_id` era PK) a
**varias** — `id` PK, `user_id` FK, `archived_at IS NULL` = en juego. **Uno
activo, máximo 3 por jugador** (1 activo + 2 archivados).

**Las tres garantías están en la BD, no en el cliente**:
- **Uno activo** → índice único **parcial**: `characters (user_id) where archived_at is null`.
- **Máximo 3** → trigger `guard_limite_personajes` (`before insert`).
- **Solo el DM desarchiva** → trigger `guard_desarchivar`, **no RLS**: `with
  check` **no ve el valor viejo**, así que la RLS no puede distinguir archivar de
  desarchivar. El jugador hace el viaje de ida; la vuelta, solo el DM. Además el
  `delete` pasa a `using (public.is_dm())` (la policy `for all` de v4 se parte).

**⚠️ La trampa que casi nos come, anotada para que no se repita**: restaurar y
borrar **NO van por `/api/dm/character`** con `service_role`. `service_role` salta
la RLS **pero no los triggers** (disparan con cualquier rol), y sin JWT
`auth.uid()` es `null` → `is_dm()` da `false` → `guard_desarchivar` **rechazaría
al propio DM**. Van con la **sesión del DM** desde `GrupoPanel`, como
«Resetear aptitudes», que ya funciona así porque la RLS lo cubre.

**El flujo**: `/crear` **edita tu activo**. Para hacerte otro, primero lo
**archivas** desde `/personaje`; entonces `/crear` no encuentra activo y **crea
uno** al primer guardado (antes lo creaba solo el `upsert`). Con 3 y ninguno
activo, `/crear` **bloquea al entrar** y el DM tiene que borrar uno.

**`stat_rolls` pasa a `character_id` como PK**: **nuevo personaje, nueva tirada**.
Esto **relaja la Fase K a propósito** — decisión explícita del usuario. La Fase K
(2026-07-15) impedía repetir tirada con bloqueo de servidor; ahora el camino para
repetir es *archivar → crear otro → tirar*. Está **acotado**: son **3 tiradas por
jugador** y luego hace falta que el DM borre un archivado. Pero **el freno deja de
ser el servidor y pasa a ser el DM**. Mesa de amigos; no es un descuido.

**Archivos**: `lib/archive.ts` (reglas puras + `scripts/check-archive.ts`),
`lib/character.ts` (`loadActiveCharacter`/`listCharacters`/`createCharacter`/
`saveCharacter(id)`/`archiveCharacter`; **`saveCharacter` ya no es un upsert por
`user_id`** porque el índice único nuevo es **parcial** y no sirve como target de
conflicto), `app/crear/page.tsx`, `components/CharacterSheet.tsx`,
`app/dm/GrupoPanel.tsx`, `app/api/dm/character/route.ts`.

**Tres bugs que cazaron las revisiones y que compilaban sin rechistar** (ninguno
lo habrían visto `tsc` ni `build`):
1. **La API del DM le daba el XP a los 3 personajes**: `update .eq("user_id")`
   sin filtrar; y su `maybeSingle()` habría reventado en cuanto alguien
   archivara. Acotado al activo.
2. **El botón de retirar, invisible**: se iba a condicionar a `!readOnly`, pero
   **la ficha propia de un jugador ES `readOnly`** (bloqueo del DM de
   2026-07-07). Va bajo `saveMode === "self"`, como `canRollHp`.
3. **Bloqueo mutuo DM/jugador**: `useParty` solo trae activos, así que un jugador
   que archivara su único personaje **desaparecía del Panel DM** — y el DM no
   podía devolvérselo ni borrárselo; si además tenía 3, `/crear` le mandaba pedir
   sitio al DM y el DM no lo veía. Arreglado con el bloque **«Jugadores sin
   personaje en juego»**, y también el early-return de «Aún no hay fichas», que
   tapaba el panel entero en campañas de un solo jugador.

**Limitación conocida**: el trigger del límite tiene una **race** teórica (dos
inserts simultáneos podrían colar un 4º personaje). Se arreglaría con
`pg_advisory_xact_lock`; se dejó fuera por sobre-ingeniería — exige dos pestañas
creando personaje en el mismo milisegundo, y el daño es una fila de más.

- Verificado: `tsc`, `build` y los 4 `check-*` limpios en cada commit; dos
  revisiones por tarea; y las 12 consultas a `characters` repasadas una por una
  (cada una filtra `archived_at`, va por `id`, o es la lista de archivados del
  DM). **NADA se ha probado contra la BD**: no hay credenciales en desarrollo y
  la migración no está ejecutada. Esta feature es casi toda base de datos, así
  que es más ciego de lo habitual. **Solo el usuario puede probar**: archivar, el
  límite de 3, devolver a juego, borrar, y que el XP del DM solo le llegue al
  activo.

## RESUELTO (2026-07-16): Creador — una escena por paso 🎬
Trabajo directo en `master`. Diseño en
`docs/superpowers/specs/2026-07-16-crear-escenas-por-paso-design.md`;
plan en `docs/superpowers/plans/2026-07-16-crear-escenas-por-paso.md`.
Ejecutado con subagentes (implementador + revisor de spec + revisor de calidad
por tarea).

> **El círculo de invocación se RETIRÓ.** El milestone de abajo (2026-07-15)
> describe una UI que ya no existe: se conserva por historia, no como
> referencia. `InvocationCircle.tsx`, `Medallion.tsx` y `DetailPanel.tsx`
> están borrados.

**El problema** (medido en el navegador a 1280px): la página topaba en 1152px;
el círculo medía 300px perdido en una columna de 824px mientras el carril se
ahogaba a 280px; y los **pasos 3–5 se renderizaban dentro de ese carril**, así
que las tres tarjetas de método del paso Aptitudes medían **75px de ancho por
425 de alto**, con los títulos partidos en 2–3 líneas. `min(74vw, 300px)` topa
en 300px desde vw≥405: el círculo no crecía por mucha pantalla que hubiera.

**Falso positivo descartado**: las runas **no** estaban mal colocadas ni
recortadas. Medido a 375, 900 y 1280px, `--r: min(37vw,150px)` era exactamente
la mitad de `min(74vw,300px)`, así que caían siempre sobre el aro. Lo que se
percibía como «cortada» era que cada runa estaba centrada en la línea del aro y
la mitad sobresalía del disco.

**Qué hay ahora**: cada paso es su propia escena a pantalla completa
(`max-w-[1600px]`), y la navegación es una **barra de runas** (`RuneBar`) con el
**mismo gate** de siempre.
- `components/crear/RuneBar.tsx` — las 6 runas: encendida = completo, resaltada
  = actual, apagada + `disabled` = no alcanzable (`maxStep`). Ahora el nombre
  del paso es **texto visible**, no un `title` oculto; por eso el último paso
  pasó de «Resumen» a **«Ficha»** (su nombre en el resto del proyecto).
- `components/crear/ArtPanel.tsx` — retrato vertical de **260px**
  (`aspect-ratio: 659/1025`, el tamaño real del arte de clase) o **silueta**
  rúnica. Sustituye al medallón de 168px recortado en círculo.
- `steps/SpeciesScene.tsx` — acordeón por región (más grande: filas de 38px,
  nombre a 14px) | retrato | detalle con origen, tamaño, velocidad, rasgos y el
  **linaje** como sub-elección.
- `steps/ClassScene.tsx` — **flechas** ◀ ▶ (una clase cada vez, arte grande) +
  **tira de las 13** miniaturas para saltar y ver cuánto queda. Sin acordeón ni
  buscador aquí. Recorre por grupo (Marcial · Arcano · Divino · Primigenio).
  **Ojo**: hojear con las flechas **compromete la elección** (`onPick` =
  `pickClass`, que limpia subclase y pericias) — es el comportamiento deseado.
- `steps/BackgroundScene.tsx` — lista + detalle en dos bloques. **Sin arte**:
  `backgrounds.ts` no tiene campo `image` ni está previsto.
- `steps/SkillsScene.tsx` y `steps/SummaryScene.tsx` — salieron de `page.tsx` a
  archivos propios. Pericias en dos bloques; la Ficha enseña héroe e historia en
  paralelo. `page.tsx` baja de ~575 a ~350 líneas: solo estado, validación, gate
  y guardado.
- El tipo **`Build` vive ahora en `lib/character.ts`** (es el borrador en curso;
  `CharacterData` es la ficha guardada). No en `page.tsx`: importar tipos desde
  `app/` invertía la dirección de dependencia y no tenía precedente en el repo.
- Limpieza: `abbrOf()` sube a `data/rules.ts` (estaba duplicada); se borra
  `RailOption.children` + `.rail-nest` (la sub-elección anidada en el carril,
  sin productor desde que linaje y subclase viven en el detalle de su escena).

**Bug arreglado — «error al crear otro personaje»**: `reset()` («Empezar de
nuevo») ponía `statMethod: null` **solo en cliente**; la fila de `stat_rolls`
seguía en la BD, el selector reaparecía y el `insert` chocaba con la PK,
soltando el texto crudo de Postgres (`duplicate key value violates unique
constraint "stat_rolls_pkey"`). Con 4d6 era peor: se lanzaban los **seis dados
antes** del insert.
- **El bloqueo del servidor es correcto y no se tocó** (PK + sin policy de
  UPDATE). Lo que fallaba era el cliente.
- Ahora `reset()` **conserva** `statMethod` y `rolled`: rehaces el personaje,
  no la tirada — *la tirada es del jugador, no del personaje*. `pickDados`
  **comprueba** `loadStatRoll` antes de tirar (cortesía; la garantía sigue
  siendo la PK), y cualquier error de la BD se **traduce** al español.
- **`assign` no se persiste**: se **deriva de `base`** con `deriveAssign`
  (`lib/statRolls.ts`, verificada por `check-statrolls.ts`). Antes, al volver a
  `/crear` con una tirada hecha, `assign` vacío hacía `stepDone[3]` falso y el
  gate te obligaba a reasignar los 6 valores **siempre**. Sin migración.

**Arte** (al escribir esto): `public/classes/` con **11 de 13** y
`public/species/` **vacío** → silueta. A 260px canta mucho más que en la
miniatura de 30px de antes. Formato: vertical ~659×1025, <32 KB, en
`public/species/<slug>.jpg` y `public/species/lineages/<slug>.jpg`.
> **Al día 2026-07-23**: `public/classes/` está **completo, 13 de 13 `.png`**
> (el usuario subió las que faltaban el 2026-07-22). `public/species/` sigue
> vacío.

- Verificado: `tsc`, `build` y los 3 `check-*` limpios en **cada** commit; dos
  revisiones (spec + calidad) por tarea; **y prueba real en el navegador**
  (excluyendo `crear` del matcher del proxy temporalmente, ya revertido).
  Medido a 1280px, antes → después:

  | | Antes | Ahora |
  |---|---|---|
  | Tarjeta de método (ancho) | 75px | **328px** |
  | Tarjeta de método (alto) | 425px | **175px** |
  | Líneas del título | 2 y 3 | **1** |
  | Alto de la descripción | 180–200px | **40px** |

  Comprobado además: 6 runas con los labels correctos (**«Ficha»**, no
  «Resumen»), el **gate intacto** (entrando de cero solo la 1ª activa), **cero
  rastro** de `.crear-grid`/`.inv-circle`/`.medallion`, sin scroll horizontal, y
  en el paso Clase el **arte real de Clérigo carga** (`659×1025` en panel de
  260×452), 2 flechas, **tira de 13 sin ninguna rota**, siluetas exactamente en
  **Bardo y Paladín**, 4 dominios y el `aria-live` anunciando la clase. Pulsar ▶
  pasa de Clérigo (9/13) a Paladín (10/13) actualizando arte, anuncio y
  miniatura activa. **Confirmado funcionando por el usuario** (2026-07-17).
  Sin migración.

  > **Ojo al verificar `/crear` en el futuro**: el dev server debe arrancarse
  > **después** de excluir `crear` del matcher de `proxy.ts`. Si se edita el
  > proxy con el servidor ya en marcha, no lo recoge y `/crear` sigue
  > redirigiendo a `/login`.

## RESUELTO (2026-07-15): Creador — Círculo de invocación + Fase K 🔮
> ⚠️ **Histórico**: el círculo se retiró el 2026-07-16 (ver arriba). Esta
> sección describe la UI anterior.

Trabajo directo en `master`. Diseño en
`docs/superpowers/specs/2026-07-15-creador-circulo-invocacion-design.md`;
plan en `docs/superpowers/plans/2026-07-15-creador-circulo-invocacion.md`.
Ejecutado con subagentes (implementador + revisor por tarea).

- **El tomo (`CharacterBook.tsx`) se retiró**: `/crear` es ahora un **círculo
  de invocación**. `components/crear/`:
  - `InvocationCircle.tsx` — dos aros + **6 runas = los pasos**: encendida =
    completo, resaltada = actual, apagada/deshabilitada = aún no alcanzable
    (respeta el gate de `stepDone`/`maxStep`). No hay barra de progreso.
  - `Medallion.tsx` — **arte real si existe, silueta rúnica generativa si no**
    (nunca un hueco vacío). Resetea el fallo de carga al cambiar `src`.
  - `OptionRail.tsx` — carril de opciones con miniatura + nombre + subtítulo,
    en **acordeón**: las 36 especies se pliegan por **región** (7 grupos con
    recuento, **una abierta a la vez**, y se **auto-abre** la de la especie
    elegida) y las 13 clases por **grupo** (Marcial/Arcano/Divino/Primigenio;
    `CLASSES` se ordena por grupo porque el carril agrupa runs consecutivos).
    **Buscador** arriba que filtra por nombre entre TODAS (sin acentos) y
    muestra resultados planos. La **sub-elección va anidada bajo la opción
    seleccionada** (`RailOption.children`): el **linaje** bajo su especie y la
    **subclase** bajo su clase — antes se renderizaban al final de la lista y
    había que pasar las 36 especies para verlos.
  - `DetailPanel.tsx` — **detalle bajo el círculo** (blurb, origen, rasgos,
    dado de golpe, etc.). Se añadió tras detectar que el rediseño se había
    dejado fuera el texto necesario para poder elegir con criterio.
  - `steps/AbilitiesStep.tsx` — el paso de Aptitudes (Fase K).
- **Fase K — aptitudes de tirada única** (`supabase/schema_v13.sql`, **ya
  ejecutada** por el usuario): el jugador elige **una vez** entre **4d6**
  (con los dados 3D de la Fase A; el jugador lanza, estilo BG3), **array
  estándar** (15/14/13/12/10/8) o **point-buy 27**. `lib/statRolls.ts`
  (`dropLowest`, `STANDARD_ARRAY`, `Assign`/`ASSIGN_EMPTY`,
  `isAssignComplete`, `loadStatRoll`, `saveStatRoll`), verificado por
  `scripts/check-statrolls.ts`.
  - **Bloqueo real**: `stat_rolls` tiene `user_id` como **PK** (una fila = una
    tirada) y **sin policy de UPDATE** (con RLS, sin policy = denegado) → no se
    puede repetir la tirada. **Solo el DM borra** (`is_dm()`) = **resetear**:
    botón «Resetear aptitudes» por jugador en **Panel DM › Grupo** (sin
    endpoint: la RLS ya lo cubre).
  - **Sin sesión** (modo localStorage): solo array/point-buy — los dados
    exigen sesión para poder bloquearse.
  - *Modelo de confianza*: los dados ruedan en cliente y el cliente inserta,
    así que alguien con consola podría falsear UNA inserción (como las tiendas
    autoservicio); lo que el sistema garantiza es que **no hay repetición**.
- **Decisión clave**: `base` (`Record<AbilityKey, number>`) **sigue siendo la
  fuente de verdad** de las puntuaciones; dados/array solo cambian **cómo** se
  rellena (asignando por índice, porque los valores pueden repetirse). Por eso
  `finalScores`, `saveCharacter` y la hoja **no se tocaron**.
- **Arte**: `public/classes/` tiene **11 de 13** (faltan `bardo.jpg` y
  `paladin.jpg` → caen a la silueta, es lo esperado); `public/species/` sigue
  **vacío** (las 36 especies van con silueta). En cuanto se suelte un `.jpg`
  aparece solo; con la **Fase H** admitirá URLs de Storage.
- Verificado: `tsc`, `build` y los 3 `check-*` limpios **+ prueba real en el
  navegador** (excluyendo `crear` del matcher del proxy temporalmente, ya
  revertido): rejilla 2 columnas, 6 runas con el gate correcto (solo la 1ª
  activa al entrar), 36 especies en 7 grupos regionales, medallón con silueta,
  y en el paso Clase **`/classes/mago.jpg` carga de verdad** (698px) junto con
  las 11 miniaturas existentes. **Pendiente de prueba en vivo del usuario**: el
  paso de dados (4d6 ×6 con el overlay BG3) y el reset del DM.

## RESUELTO (2026-07-15): Fase A — Dados 3D con física 🎲
Trabajo directo en `master`. Plan en
`docs/superpowers/plans/2026-07-13-fase-a-dados-3d.md`; spec en la guía
`docs/superpowers/specs/2026-07-12-campana-semivirtual-guia.md` (§Fase A).
Ejecutado con subagentes (implementador + revisor por tarea).

- **Dependencia nueva**: `@3d-dice/dice-box` (WebGL/BabylonJS + física). Assets
  **commiteados** en `public/dice-box/assets/` (copiados por
  `scripts/copy-dice-assets.mjs`, que corre en `postinstall` — para builds
  fiables en Vercel y offline). El postinstall propio del paquete deja un
  duplicado en `public/assets/` → **ignorado** en `.gitignore`.
- **`lib/diceBox.ts`** (singleton imperativo, no-hook): `initDiceBox(selector)`,
  `rollVisual(formula, opts)`, `isDiceBoxSupported()` (SSR/WebGL/
  `prefers-reduced-motion`), color de dado y sonido en localStorage
  (`getDiceColor`/`setDiceColor`, `getDiceSound`/`setDiceSound`; clac de
  colisión con WebAudio). Sin tipos propios del paquete →
  `types/dice-box.d.ts`.
- **`components/DiceBoard.tsx`**: **overlay de tirada estilo Baldur's Gate**,
  on-demand (montado en `app/layout.tsx` dentro de `SessionProvider`, z 80 <
  EpicOverlay z-100). Aparece SOLO cuando hace falta una tirada: un **d20
  grande centrado** + "Pulsa para tirar" (con la etiqueta y el modificador);
  el jugador **pulsa para lanzar**, ruedan los dados físicos, sale el **total
  grande** (con destello de crítico/pifia) y se cierra solo (~2 s) o al hacer
  clic. Fases del overlay: `ready → rolling → result → hidden`.
  - **`rollVisual` es interactivo**: emite fase `ready`, **espera
    `triggerThrow()`** (el clic del jugador) y solo entonces lanza la física;
    devuelve las caras a `publishRoll`, que publica al feed. Los 6 llamadores
    no cambian. `setBoardListener`/`triggerThrow`/`isAwaitingThrow` en
    `lib/diceBox.ts`.
  - **Init perezoso**: dice-box (y su bucle de render WebGL) arranca en la
    **primera tirada**, no en cada página. El `#dice-board-canvas` sí se monta
    siempre (y con tamaño fijo, nunca `display:none`) para que dice-box mida
    bien el lienzo.
  - **Perf** (arregla el "petado" reportado): `enableShadows:false`, un
    **único `AudioContext` reutilizado** (antes uno nuevo por colisión) e init
    perezoso. `scale:6`, color por defecto rojo `#b3202e` (números blancos del
    tema legibles); ajustables en `lib/diceBox.ts`.
  - **Historia**: overlay transparente a pantalla completa (dados diminutos) →
    mesa de fieltro centrada auto-roll → bandeja plegable → **overlay BG3
    interactivo** (el jugador lanza). El bug de "solo se veía el total" venía
    del canvas en un contenedor de tamaño 0 al iniciar + saturación de render;
    el "petado", de sombras + AudioContext por colisión + render global
    permanente.
  - **Sizing del canvas** (bug que impedía ver los dados): dice-box dejaba su
    canvas a 0×0 (offscreen) / 300×150 y no lo ajustaba → no se renderizaba
    nada, solo se veía el total. Fix: `offscreen:false` +
    `fitCanvasToContainer()` (fija el búfer al tamaño del contenedor + `resize`
    para Babylon; se re-aplica en cada resize de ventana). Confirmado en vivo:
    canvas 0×0 → 560×518 y dados visibles con números.
  - ✅ **Confirmado funcionando por el usuario** (2026-07-15): dados grandes,
    números legibles, rinde bien. `scale:6` y color rojo por defecto,
    ajustables en `lib/diceBox.ts`.
- **Integración por `publishRoll`** (`lib/useDiceFeed.ts`): se extrajo
  `publishRollResult` (insert en BD de una tirada YA resuelta); `publishRoll`
  intenta `rollVisual` (construye el `RollResult` con las **caras físicas**,
  helpers puros `rollFromDice`/`d20FromDice` en `lib/dice.ts`) y **cae al
  `roll()`/`d20Check()` aleatorio** si el tablero no está soportado/listo.
  Firma pública intacta → los 6 llamadores (DicePanel, InitiativeTracker,
  CharacterSheet) siguen igual.
- **Efectos en el feed** (`DicePanel` + `globals.css`): nat 20 → destello
  dorado + "¡CRÍTICO!"; nat 1 → tinte rojo + "PIFIA" (`critState`), animación
  de entrada; todo respeta `prefers-reduced-motion`. Controles de color y
  sonido en el panel. **Toast** de tirada ajena por realtime (A2).
- **Fix de proxy** (`proxy.ts`): los assets `.json`/`.wasm` de dice-box caían
  en el matcher del auth-proxy (307 a `/login` sin sesión / round-trip inútil
  con sesión) → **`dice-box` añadido a las exclusiones del matcher**.
- Verificado: `npx tsc --noEmit`, `next build` y `scripts/check-dicebox.ts`
  (19 checks) + `check-dice.ts` limpios; dev server arranca sin errores de
  consola y **los assets de dice-box se sirven 200 por HTTP** (`theme.config.json`,
  `ammo.wasm.wasm`, texturas) tras el fix de proxy. **PENDIENTE de prueba en
  vivo por el usuario**: iniciar sesión y tirar (hoja, dado rápido, fórmula,
  iniciativa, petición) para ver rodar los dados y el crítico/pifia — requiere
  login (no disponible en esta sesión). Sin migración.
- **Nota lint**: `npm run lint` está roto **repo-wide** por
  `react-hooks/set-state-in-effect` (React 19 más estricto) en ~7 archivos
  preexistentes; el `useEffect` de carga de color/sonido en `DicePanel` añade
  un caso más del **mismo patrón hydration-safe** ya usado en todos los hooks
  realtime del repo. `tsc`/`build` limpios (gates reales del proyecto).

## RESUELTO (2026-07-13): Bestiario 2024 + formulario de monstruos del DM

Plan en `docs/superpowers/plans/2026-07-13-bestiario-2024.md`. Página
**/bestiario** (buscador nombre ES/EN, filtros CR/tipo, statblocks 2024) con
**124 monstruos extraídos** del MM 2024 (todo CR 0, 1/8, 1/4, 1/2 —
`data/bestiary/cr-*.ts`, validados por `scripts/check-bestiary.ts` y muestreo
visual contra el PDF). **Formulario del DM** («Añadir monstruo», solo DM):
statblock completo con CR propio → XP/BC autocalculados; se guardan en
`app_config.custom_monsters` (sin migración) y PISAN al estático si el slug
coincide (aviso en el formulario). **Descubrimiento**: jugadores solo ven
`app_config.bestiary_discovered`; toggle por ficha + vista previa DM.
Hook: `lib/useBestiary.ts` (merge estáticos+custom, realtime).

**PENDIENTE de esta fase**: lotes de extracción J4 (CR 1–2), J5 (CR 3–5),
J6 (CR 6–30) — ~370 monstruos; J8 integración con la calculadora de
encuentros (añadir por nombre desde el bestiario). Pipeline: la capa OCR del
PDF entrelaza columnas — SOLO sirve para localizar; la verdad terrena es la
página renderizada (`py` + pypdfium2 → PNG → lectura visual). Convención:
datos mecánicos = hechos; blurbs/textos = redacción propia ≤300 chars.
Fuente: `C:\Users\carlo\Desktop\Exandria-Obsidian\Exandria\Books\DnD 5e 2024
Monster Manual Alternate Cover.pdf` (390 págs; pageNNN.txt del dump = índice
pypdfium2 NNN-1).

## RESUELTO (2026-07-12): Atlas — regiones explorables en todos los continentes
Trabajo directo en `master` (sin rama aparte). Plan en
`docs/superpowers/plans/2026-07-11-atlas-continentes.md` (4 tareas); diseño en
`docs/superpowers/specs/2026-07-11-atlas-y-calendario-design.md`.

1. **Modelo y semilla del atlas** (`data/atlas.ts` + `lib/useAtlas.ts`, key
   `atlas_defs` en `app_config`, sin migración): generaliza el modelo de
   Tal'Dorei (`Region`+`Poi`) a los 5 continentes habitados. `seedAtlas()`
   reutiliza Tal'Dorei tal cual y genera Issylra/Wildemount/Marquet/Dientes
   Rotos desde `WORLD_POIS`, con slugs de región únicos globalmente
   (`uniqueRegionSlug`). `scripts/check-atlas.ts` verifica slugs únicos,
   reparto completo de POIs y las 4 imágenes de Wildemount.
2. **`/mapa` con regiones por continente**: cualquier continente (no solo
   Tal'Dorei) muestra sus regiones como pines y abre `RegionExplore` al
   pulsar una; se retiraron los pines planos por continente (`useWorldPois`
   se queda solo para navegación de continente + niebla + Mares).
3. **Editor DM por continente** (`app/dm/MapaPanel.tsx`): selector de
   continente + pestañas Regiones/POIs por región con CRUD completo sobre
   el atlas de cada continente; se retiró el modo antiguo de pines planos
   del mundo del editor.
4. **Limpieza y documentación** (esta tarea): borrado `lib/useTaldorei.ts`
   (sin consumidores tras las tareas 2-3, confirmado por grep; su
   re-export de `slugify` tampoco se usaba, ya todo importa de
   `lib/slug.ts`); `lib/useWorldPois.ts` confirmado con consumidores
   (`app/mapa/page.tsx`, `components/ReinoRegions.tsx`) — se mantiene.
   `components/RegionExplore.tsx` revisado: el fallback «Región sin mapa
   propio» ya se leía claro para regiones nuevas sin imagen; no se tocó.
   Ver «Atlas por continente» arriba para el detalle de cómo subir
   submapas y la limitación conocida del editor DM (fondo de arrastre de
   POIs sin recortar a la región cuando no hay `image`).
- Verificado: `tsc --noEmit`, `next build` y `npx tsx scripts/check-atlas.ts`
  limpios en las 4 tareas. Sin credenciales Supabase en este entorno: no se
  probó en vivo (crear región/POI desde el editor DM en un continente nuevo,
  revelar y explorar como jugador); solo build + análisis de código, igual
  que sesiones anteriores.

## RESUELTO (2026-07-11): Calendario exandriano en tiempo real
Trabajo directo en `master` (sin rama aparte). Plan en
`docs/superpowers/plans/2026-07-11-calendario-tiempo-real.md` (5 tareas);
diseño en `docs/superpowers/specs/2026-07-11-atlas-y-calendario-design.md`.

1. **Longitudes de mes + derivación pura** (`data/cosmology.ts`: `monthDays`;
   `lib/gameClock.ts`): convierte un minuto de juego absoluto (desde año 0 PD)
   en `GameMoment` (año/mes/día/hora/minuto/día de la semana/estación/fase
   lunar de Catha/festividad/`dateStr`) y viceversa
   (`momentFromGameMin`/`gameMinFromMoment`), sin React ni Supabase.
2. **Fuente y hook del reloj** (`lib/useGameClock.ts`): `campaign_clock` (JSON
   en `app_config`, **sin migración**) con `epochRealMs`/`epochGameMin`/
   `running`/`msPerGameMin` (10000 ms = 10 s reales por minuto de juego → 10
   min reales = 1 h de juego). Arranca corriendo por defecto (836 PD, 1 de
   Horisal, 08:00 la primera vez). Realtime + tick de 1 s en cliente
   (`useGameClock()` → `{ clock, nowGameMin, ready }`); mutaciones
   `setClockRunning`, `advanceGame`, `setGameDateTime`.
3. **Widget de reloj** (`components/ClockWidget.tsx`): variante compacta en
   `SiteNav` (icono de luna + fecha/hora) y variante grande (día de semana,
   fecha completa, hora, estación, fase lunar, chip de festividad).
4. **Panel DM "Tiempo"** (`app/dm/RelojPanel.tsx`, pestaña en
   `DmDashboard.tsx`): reloj grande + controles play/pausa, avance rápido
   (+1 h, descanso corto/largo, +1 día) y formulario para fijar fecha/hora
   exactas (selects de mes/día + año/hora/minuto).
5. **La Crónica lee el reloj**: `CronicaView` y Panel DM › `CronicaPanel` ya
   no leen `campaign_date` (texto libre); derivan la fecha de
   `useGameClock()` + `momentFromGameMin`. Se retiró el input manual de fecha
   del panel DM (sustituido por una nota que remite a la pestaña Tiempo) y
   `campaignDate`/`setCampaignDate` se eliminaron de `lib/useChronicle.ts`
   (sin más consumidores, confirmado por grep). `app_config.campaign_date`
   queda deprecado: la columna/fila puede seguir existiendo pero nada la lee.
- Verificado: `tsc --noEmit`, `next build` y `eslint` limpios. Sin
  credenciales Supabase en este entorno: no se probó en vivo con el reloj
  corriendo de verdad (Realtime, tick, controles DM); solo build + análisis
  de código, igual que sesiones anteriores.

## RESUELTO (2026-07-10): Kit D&D completo — clases, ficha, dados, crónica, encuentros
Trabajo directo en `master` (sin rama aparte). Plan en
`docs/superpowers/plans/2026-07-09-dnd-toolkit.md` (12 tareas).

1. **Datos mecánicos de clase 2024** (`data/classdata/`): las 13 clases (12
   PHB + Cazador de Sangre) con rasgos por nivel, tabla de progresión y
   espacios de conjuro (`spellSlots.ts`: full/half/pact casters).
2. **Ficha derivada** (`lib/derive.ts`): motor puro que calcula PG, CA,
   modificadores, salvaciones y pericias a partir de la ficha guardada; es la
   misma fuente de verdad que usan `/personaje` y Panel DM › Grupo, para que
   DM y jugador vean siempre los mismos números.
3. **Dados e iniciativa en vivo** (`schema_v11`): tiradas compartidas
   (`lib/dice.ts` + `useDiceFeed`), peticiones de tirada del DM al grupo o a
   un jugador (`useRollRequests`), e iniciativa en vivo con control de turno
   del DM (`useInitiative`). UI en Panel DM › Dados (`DadosPanel`) y también
   visible para el jugador en `/personaje`.
4. **Crónica de campaña** (`schema_v12`): diario de sesión, misiones (activa/
   completada/fallida/oculta) y PNJ conocidos, más fecha narrativa con
   festividades (`lib/gameDate.ts`). Página `/cronica` para el grupo (solo ve
   lo publicado/visible) y Panel DM › Crónica (`CronicaPanel`) con control
   total, incl. borradores y ocultos.
5. **Calculadora de encuentros + notas del DM** (Panel DM › Mesa,
   `EncuentrosPanel`): presupuesto de XP del grupo por dificultad
   (`data/encounters.ts`, tabla DMG 2024) vs. XP de los monstruos puestos en
   la mesa, veredicto Baja/Moderada/Alta/Mortal, y botón **Repartir XP**
   (reparte el XP de los monstruos entre el grupo vía la misma API
   `/api/dm/character` que usa Grupo). **Notas privadas del DM** por región o
   personaje, guardadas en `app_config` (`dm_notes`, un JSON por ámbito).
   *Nota de seguridad*: la política RLS de `app_config` (`schema_v5`) permite
   `select` a **cualquier usuario autenticado**, no solo al DM — un jugador
   con acceso a la consola podría leer `dm_notes` llamando directo a la API de
   Supabase. Aceptable por ahora (juego de confianza entre amigos), pero si se
   quiere blindar de verdad habría que mover las notas a su propia tabla con
   política de `select` restringida a `is_dm()`.
- Verificado: `tsc --noEmit`, `next build` y `eslint` limpios en los archivos
  tocados; sanity check de `data/encounters.ts` con `tsx` (presupuesto de
  grupo y XP por CR contra los valores esperados).

> **PENDIENTE del usuario: ejecutar `supabase/schema_v11.sql` y
> `supabase/schema_v12.sql`** (dados/iniciativa y crónica). Sin ellas la nube
> ignora esas tablas/columnas.

## RESUELTO (2026-07-07): Nivel / XP por el DM
Rama `dm-nivel-xp`. Spec/plan en
`docs/superpowers/{specs,plans}/2026-07-07-dm-nivel-xp*`.

- **Progresión (ambas)**: `characters.xp` (jsonb→int, **schema_v10**) + `level`.
  El DM **da XP** (el nivel sube al cruzar umbral de la tabla 2024) o **fuerza
  nivel** (hito). `data/leveling.ts`: `XP_THRESHOLDS`, `levelFromXp`, `xpForNext`.
- **Panel DM › Grupo**: por jugador **nivel ±** y **Dar XP**, más acciones de
  grupo **"Subir nivel a todos"** y **"Dar XP a todos"**. Vía la API
  `/api/dm/character` (ampliada con `setLevel` y `addXp`, cálculo en servidor).
- **Excepción al bloqueo**: el jugador puede **tirar su propia vida (PG)** de los
  niveles alcanzados sin tirada (único control activo en su hoja); una vez tirado
  **queda fijo** (el DM puede re-tirar para corregir). Persiste solo `hp_rolls`
  saltando el gate de solo-lectura. Las ASI las sigue repartiendo el DM.
- **Hoja**: barra de **XP** (`xp / xpForNext`) en el panel de nivel.
- Verificado: `tsc`/`build`/`lint` limpios + preview del jugador (barra XP, solo
  botón Tirar, sin steppers; tirar fija el PG). Control DM validado por build.

> **PENDIENTE del usuario: ejecutar `supabase/schema_v10.sql`** (columna `xp`).

## RESUELTO (2026-07-07): Control del DM — hoja bloqueada, dados de PG, Baúl
Rama `dm-control-baul`. Spec/plan en
`docs/superpowers/{specs,plans}/2026-07-07-dm-control-baul*`.

- **Hoja `/personaje` solo lectura para jugadores**: el jugador ve su ficha sin
  poder editar (nivel, ASI, oro, objetos, equipo). El **DM edita** la hoja de un
  jugador vía **`/personaje?user=<id>`** (botón "Editar hoja" en Panel DM › Grupo).
  La hoja se extrajo a `components/CharacterSheet.tsx` (`readOnly`/`saveMode`).
- **Escritura del DM sobre hojas ajenas** = API `app/api/dm/character/route.ts`
  con `service_role` (verifica rol DM; hace patch directo o *append* de
  objetos/oro). Requiere `SUPABASE_SERVICE_ROLE_KEY` (ya usado por crear usuarios).
- **Dados de PG**: nivel 1 = dado de clase al máx + CON; cada nivel nuevo, botón
  "Tirar" (`d<dado> + CON`), tiradas guardadas en `characters.hp_rolls` (jsonb,
  **schema_v9**). `data/leveling.ts`: `rollHitDie`, `maxHpFromRolls`.
- **Retrato de identidad más pequeño** (`PortraitFrame size="md"`, 84px).
- **El Baúl del Dungeon Master** (Panel DM › pestaña "Baúl"): el DM guarda
  entradas `{ nombre, tipo: mágico|normal|oro, cantidad, notas }` en `app_config`
  (`dm_stash`), y las **entrega** a uno o varios jugadores (oro→`gold`,
  objeto→`items`) vía la API; opción de quitar del baúl al entregar. Realtime lo
  refleja en la hoja del jugador. `lib/useDmStash.ts`, `app/dm/BaulPanel.tsx`.
- Verificado: `tsc`/`build` limpios + preview del jugador en solo lectura e
  imagen pequeña. La parte DM (editar por `?user=`, API, entrega, Baúl) no se
  probó en vivo por falta de sesión DM/credenciales; validada por build + análisis.

> **PENDIENTE del usuario: ejecutar `supabase/schema_v9.sql`** (columna
> `hp_rolls`). El Baúl y la edición DM necesitan `SUPABASE_SERVICE_ROLE_KEY` en el
> servidor. Falta **mergear la rama a `master`** y desplegar.

## RESUELTO (2026-07-07): Hoja de personaje interactiva (`/personaje`)
Rama `personaje-hoja-interactiva`. Spec/plan en
`docs/superpowers/{specs,plans}/2026-07-07-hoja-personaje-interactiva*`.

- **Página `/personaje`**: hub interactivo de la ficha. Paneles: identidad,
  **nivel 1-20 + mejoras (ASI 2024 por clase)** con reparto +2 por hito y PG/
  competencia derivados, aptitudes (base+trasfondo+ASI), estadísticas derivadas
  (PG, competencia, iniciativa, velocidad, **CA editable** —solo sesión),
  **oro**, **inventario** de objetos enriquecidos `{nombre, cantidad, notas}`
  (capacidad 20+2×FUE), y **muñeco de equipo (paperdoll)**.
- **Muñeco**: armadura (cabeza, torso, antebrazos, manos, piernas, pies, 1 c/u),
  armas (principal, secundaria) y **accesorios dinámicos**: collar 1 fijo,
  **anillos = 2×mód INT**, colgantes = mód SAB, amuletos = mód CAR (recalculan al
  variar atributos). Equipar/retirar mueve objetos entre inventario y huecos.
- **Botón "Crear personaje"** en el capítulo Ficha de `/crear` → guarda y navega
  a `/personaje`. **`/inventario` redirige** a `/personaje`.
- Componentes: `components/LevelPanel.tsx`, `components/Paperdoll.tsx`;
  reglas en `data/leveling.ts` + `data/equipmentSlots.ts`; tipos ampliados en
  `lib/character.ts` (`Item`, `Asi`, campos `level/gold/asi/equipment/items`,
  retrocompat `inventory`→`items`).
- Verificado: `tsc`/`build`/`lint`(nuevos archivos) limpios + preview en :3100
  (nivel→ASI→PG, escalado de accesorios con INT, equipar/retirar).

> **PENDIENTE del usuario: ejecutar `supabase/schema_v8.sql`** en Supabase
> (añade `level, gold, asi, equipment, items`). Sin ella, la nube ignora estos
> campos; en local funciona con `localStorage`. Falta también **mergear la rama
> a `master`** y desplegar.

## RESUELTO (2026-07-06): Rebrand a Exandria + roster + tomo de creación
Trabajado en la rama `exandria-rebrand-roster` (fuera de `master`).
Spec y plan en `docs/superpowers/{specs,plans}/2026-07-06-exandria-rebrand-roster*`.

1. **Rebrand a Exandria (solo texto visible)**: metadatos (`app/layout.tsx`),
   marca en Nav/Footer/Emblem/Home/Login, prompts de IA (`data/loreText.ts`,
   `app/api/ia/route.ts`). **No** se renombró `data/taldorei.ts` ni `CONTINENT`.
   El encuadre general habla de Exandria (mundo); la campaña sigue en Tal'Dorei.
2. **`/reino` → mundo**: "El Mundo de Exandria" con `WORLD_INTRO` nuevo en
   `data/cosmology.ts`; las regiones de Tal'Dorei siguen como sección.
3. **Roster ampliado a ~36 especies** (`data/species.ts`) agrupadas por región
   (`REGIONS` + `regionSpecies()`, campos nuevos `region`/`origin`/`image`/
   `homebrew`). Añadidas 26: Tal'Dorei (centauro, hombre lagarto, hada, sátiro,
   hobgoblin), Wildemount (goblin, osgo, minotauro, firbolg, kenku), Marquet
   (aarakocra, replicante, liebrén, tabaxi, yuan-ti), Issylra/Ashari (genasí),
   Infraoscuridad/planar (duergar, svirfneblin, kobold, **sangre bestial**
   [homebrew, "a criterio del DM"], eladrin, shadar-kai, gith) y océanos (elfo
   marino, tritón, tortoga).
4. **Clases**: añadido **Cazador de Sangre** (Blood Hunter) + campo `image`.
5. **`/crear` rediseñado como TOMO** (libro doble página, giro 3D, índices de
   capítulo): `components/CharacterBook.tsx` (carcasa) + `components/PortraitFrame.tsx`
   (hueco de imagen con placeholder). Capítulos: Razas · Clases · Trasfondos ·
   Aptitudes · Pericias · Ficha. Índice a la izquierda (Razas por región),
   detalle con retrato + descripción a la derecha. Cae a página única en móvil.
   La lógica de estado/validación del creador se conservó intacta.
   Verificado: `tsc --noEmit` + `next build` limpios, y preview visual
   (escritorio, giro, detalle, móvil). Sin credenciales Supabase, no probado en
   vivo multijugador (igual que sesiones previas).

### PENDIENTE de este milestone
- **Iconos de clase subidos** (`public/classes/<slug>.jpg`, 11 archivos,
  todos < 32 KB) — solo faltan **bardo.jpg** y **paladin.jpg** (no hay icono
  de origen en el vault); `PortraitFrame` muestra su fallback normal.
- **Subir los retratos reales restantes** (`.jpg`) a `public/species/<slug>.jpg`
  y `public/species/lineages/<slug-linaje>.jpg`. Sin ellos se ve un marco con
  icono (por diseño). Ver README «Imágenes de personaje». Slugs = campo `slug`
  en `data/species.ts` / `data/classes.ts`; el slug de linaje se deriva con
  `slugify(nombre)` en `app/crear/page.tsx`.
- **Mecánica de especies homebrew** (Sangre Bestial): rasgos resumidos, a
  afinar con el DM si se juegan.
- **Mergear la rama** `exandria-rebrand-roster` a `master` y desplegar (Vercel).

## Backlog
- **Retratos de personaje**: `public/classes/` **completo (13 de 13 `.png`)**
  desde el 2026-07-22. Siguen sin subir `public/species/` y
  `public/species/lineages/` → silueta con marco (por diseño).
- **Bestiario a medias**: 124 monstruos, solo **CR 0–1/2** completo.
- **PG actuales y condiciones en vivo** en la ficha · **modo espectador/TV**.
- **Spec de lore de Wildemount** (`docs/wildemount-lore-spec.md`): escrita,
  pendiente de ejecutar (ampliar la lore del segundo continente jugable).
- Notas del DM: si algún día importa que sean *de verdad* privadas, moverlas
  de `app_config` a una tabla propia con RLS `is_dm()`-only (ver nota de
  seguridad en el milestone 2026-07-10).
- ~~Archivar personaje~~ → **hecho el 2026-07-17**, ver su milestone arriba.
