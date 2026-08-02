# Extracción de Componentes: el oficio que consigue los materiales

**Fecha**: 2 de agosto de 2026
**Estado**: recogido del DM, **sin boceto y sin construir**

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

## 5. Lo que hay que decidir antes de escribir código

1. **Dónde se despieza.** ¿En el sitio, nada más matarlo (`/lugar`, con el
   cadáver fresco), o en el taller a la vuelta? Lo primero pide un estado nuevo
   («hay un cadáver aquí»); lo segundo, un inventario de restos.
2. **Cuántas veces se puede despiezar un monstruo.** ¿Uno por cadáver, o el
   bestiario recuerda que ya lo despiezaste y no deja repetir?
3. **Qué pasa al fallar.** Los otros oficios pierden material; aquí **no hay
   material que perder** — lo que se pierde es el cadáver, o la pieza buena, y
   sale una peor.
4. **Si necesita herramientas** (cuchillos, frascos), que el campo `herramienta`
   ya soporta.

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

## 7. Siguiente paso

Un boceto, como los otros cinco: qué se manipula al despiezar. La idea sin
aprobar todavía es que el minijuego sea una **disección** —dónde se corta y con
qué cuidado—, que sería lo único de los siete oficios donde el material **te dice
dónde está lo bueno** si sabes mirar.
