# Extracción de Componentes: el oficio que consigue los materiales

**Fecha**: 2 de agosto de 2026
**Estado**: boceto aprobado, decisiones cerradas, **sin construir**

---

## 1. Qué es

El **séptimo oficio**. Cuando el grupo **descubre un monstruo y lo derrota**, quien
tenga la pericia puede **estudiarlo y despiezarlo** para sacar componentes: las
glándulas, escamas, colmillos y vísceras con los que luego se prepara una poción,
se cocina un guiso o se forja una hoja.

## 2. Por qué no es «un taller más»

Los seis talleres **gastan** materiales. Este los **consigue**. Es la primera
mitad de un bucle que hoy no existe:

> hoy los materiales **aparecen de la nada**. El DM los concede a mano y ya está.
> Sin una forma de conseguirlos, «al fallar se pierden los ingredientes» no
> significa nada: no cuesta nada reponerlos porque no cuesta nada tenerlos.

Extracción es lo que le da peso a todo lo demás que ya está construido.

## 3. Lo que lo hace barato, y es la clave

**No necesita catálogo propio.** Es el único de los siete del que **no hay que
dictar qué produce**, porque lo que produce **ya está escrito**: los seis
catálogos tienen **88 materiales que son piezas de monstruo**.

| Catálogo | Piezas de monstruo |
|---|---|
| alquimia | 19 |
| cocina | 24 |
| forja | 16 |
| destilación | 9 |
| cristalografía | 11 |
| tatuaje | 9 |
| **total** | **88 de 369** |

Ancas de Sapo Gigante, Pechuga de Roc, Glándula de Monstruo Oxidífero, Veneno de
Basilisco Fermentado, Púa de Mantícora, Diente de Vampiro Anciano, Escama de
Sirena Triturada… Están todos, en su catálogo y con su número.

**Lo que falta no es inventar: es emparejar.** Qué monstruo suelta qué material,
de entre los 88 que ya existen. Eso lo dicta el DM, pero es una tarea de
relacionar cosas escritas, no de escribir cosas nuevas — muchísimo más barato que
las listas que bloquean a forja, destilación, cristalografía y tatuaje.

## 4. Con qué engancha, y ya está construido

- **`/bestiario`** guarda ya qué monstruos están **descubiertos**
  (`discovered`, `marcarDescubierto` en `lib/useBestiary.ts`), y el combate marca
  el descubrimiento al enfrentarlos. La condición «descubierto **y** derrotado»
  tiene media pieza hecha.
- **`/inventario`** ya apila materiales y les da **un hueco por montón**
  (`huecosUsados`), que es exactamente lo que hace falta para que recolectar no
  arruine la bolsa.
- **`/taller`** es una ruta con pestañas: abrir la séptima **no vuelve a pasar
  por `lib/acceso.ts` ni por el nav**, que es justo para lo que se hizo así.

## 5. Las decisiones, cerradas

**Tomadas por el DM el 2026-08-02.**

| # | Decisión | Elegido |
|---|---|---|
| 1 | Dónde se despieza | **En el sitio, con el cadáver fresco** (`/lugar`). No se arrastra el bicho al taller. |
| 2 | Cuánto da un monstruo | **1d4 componentes en total**, por cadáver. |
| 3 | Qué se pierde al fallar | **El material.** Cada intento fallido se come una de las piezas que ese cadáver tenía. |
| 4 | ¿Herramientas? | **Sí.** Cuchillos y frascos: se exigen a mano y no se gastan. |

Consecuencias que salen de ahí, y conviene tenerlas escritas:

- **El cadáver es un recurso que se agota.** 1d4 se tira **al abrirlo**, no por
  intento: el jugador ve cuántas piezas hay y cada fallo se lleva una. Tirarlo
  por intento haría que fallar saliera gratis.
- **Fallar cuesta de verdad**, y es lo que hace que el oficio sea una habilidad y
  no un botón: con cuatro piezas y mala mano, te llevas dos.
- **Sin herramientas no se abre nada.** Es el segundo oficio que usa el campo
  `herramienta` (con cristalografía), y el primero que se construiría — así que
  sería el estreno de una regla que el gate vigila desde alquimia y que **ninguna
  receta usa todavía**.

## 5 bis. La lista del DM: cadáveres a mano

**Requisito del DM, y manda sobre lo demás:** *la mesa no siempre pasa por la
app*. Muchos combates se juegan en la mesa y la app no se entera, así que **no
vale** con que los cadáveres aparezcan solos al derrotar un monstruo en
`/combate`.

Hace falta que el DM pueda **mantener a mano la lista de monstruos despiezables**:
añadir «aquí hay un tal cosa recién muerto», quitarlo, y que los jugadores del
sitio lo vean.

Forma mínima que encaja con lo que ya existe:

- **Una entrada por cadáver**, no por monstruo: el mismo bicho puede caer dos
  veces en dos sitios. Cada entrada guarda **qué monstruo**, **dónde** y
  **cuántas piezas le quedan**.
- **El DM la edita desde su panel**, junto al bestiario, que es donde ya vive la
  lista de monstruos y donde va a buscarlos.
- **Se llena de dos formas**: a mano (el caso normal) **y** automáticamente al
  derrotar uno en `/combate`. Lo segundo es un extra; lo primero es el requisito.
- **Un cadáver se agota o se retira**: cuando se queda sin piezas desaparece
  solo, y el DM puede borrarlo antes si la escena se acabó.

> [!warning] **La trampa que ya ha mordido cuatro veces**
> Esta lista vivirá en **`app_config`**, como el bestiario, el atlas y los mapas.
> **`app_config` NO está en la publicación `supabase_realtime`**: una suscripción
> `postgres_changes` sobre esa tabla **no dispara nunca**. El hook que la lea
> tiene que hacer **update optimista** —mutar el estado local al instante y
> persistir en paralelo—, como ya hacen `lib/useBestiary.ts` y `lib/useOficios.ts`.
> Sin eso, el DM añade un cadáver y no lo ve hasta recargar; eso mismo pasó con
> el bestiario el 2026-08-01 y era un fallo de cara al usuario, no teoría.

## 6. El aviso técnico: el séptimo oficio rompe suposiciones

`Oficio` es hoy una unión de seis, y **todo el índice de materiales asume que
cada oficio tiene catálogo**:

- `MATERIALES` reparte los 369 entre los seis, y `scripts/check-recetas.ts`
  comprueba el reparto exacto por oficio;
- `check-materiales.ts` y `check-forja.ts` cuentan catálogos;
- `OFICIOS_ORDEN`, `OFICIO_LABEL` y `OFICIO_PERICIA` son `Record<Oficio, …>`, así
  que añadir el séptimo **obliga a rellenarlos** — eso es bueno, TypeScript
  avisa.

**Extracción sería el primer `Oficio` SIN materiales propios**, y esa es
exactamente la suposición que hoy no está escrita en ningún sitio. Al añadirlo
hay que decidir si es un `Oficio` de pleno derecho (y los checks aprenden que
puede tener cero materiales) o un tipo aparte. **No conviene resolverlo a ojo el
día de la prisa.**

## 6 bis. Lo que sigue faltando

**El emparejamiento monstruo → material.** Es lo único que el DM tiene que
dictar, y sigue siendo mucho más barato que las listas que bloquean a los otros
cuatro talleres: es elegir, de entre los **88 materiales que ya existen**, cuáles
suelta cada bicho.

Con 124 monstruos en el bestiario (CR 0–1/2) no hace falta cubrirlos todos para
empezar: **un monstruo sin emparejar simplemente no es despiezable**, y eso se
puede decir en pantalla sin que parezca un fallo.

## 7. Las tres fases

**Boceto aprobado el 2026-08-02**: `docs/bocetos/extraccion-despiece.html`

| Fase | Qué se hace | +1 | 0 | −1 |
|---|---|---|---|---|
| **1 · Estudiar** | Leer el cadáver: destapa dónde están las piezas | los ves | intuyes uno | no ves nada |
| **2 · Cortar** | Elegir el punto y **medir la profundidad** | justo | llegas mal | corto, o tan hondo que revientas la pieza |
| **3 · Guardar** | Al frasco antes de que se eche a perder | fresca | pasable | se echó a perder |

Mismo ±1 por fase y mismo tope **±3** que los otros seis.

### Y lo que lo hace distinto de los seis

En los talleres se tira **una vez** y lo que salga, salió. Aquí el cadáver es un
**saldo que se gasta**: 1d4 piezas, y cada fallo se come una. La consecuencia es
que **la tensión no está dentro de una barra sino entre intentos**: llevas dos
piezas buenas y queda una, ¿la intentas o te vas?

De ahí sale lo único que ningún otro taller tiene: **un botón de retirarte con lo
que llevas**. En los demás no hay nada que conservar hasta que termina.

## 8. La decisión: se puede cortar a ciegas

**Elegida por el DM el 2026-08-02 (opción C de tres).**

**Estudiar es opcional.** Sin estudiar se puede cortar igual, pero **no sabes si
ese punto tenía algo**: cortas donde te parece y te la juegas.

Es lo que convierte estudiar en una **decisión** y no en un trámite, y encaja con
que cada fallo cueste una pieza: el que tiene prisa paga por tenerla.

Al construirlo, eso significa que la fase 1 **no bloquea** a la 2 —se puede saltar
y la pantalla tiene que dejarlo claro sin regañar— y que un corte a ciegas necesita
**su propia forma de resolverse**: no es un −1, es no saber qué había ahí.

Descartadas: *gratis y una sola vez* (estudiar deja de ser una decisión) y *antes
de cada corte* (alarga demasiado un despiece de cuatro piezas).
