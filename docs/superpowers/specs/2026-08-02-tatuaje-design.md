# La camilla: tatuaje rúnico, el trazo y el portador

**Fecha**: 2 de agosto de 2026
**Estado**: boceto aprobado, decisión cerrada, **sin construir**
**Boceto**: `docs/bocetos/tatuaje-camilla.html`

---

## 1. Lo propio de este oficio: el material es una persona

En los otros cinco talleres, cuando algo sale mal se pierde una mezcla, una pieza
o una gema. Aquí **el portador se va con ello puesto**. El catálogo lo dice en su
primera línea: «un tatuaje mágico no exige sintonización, **pero duele**».

Todo lo que sigue sale del propio catálogo, no de invención:

- **Resina de Rifenmist**: «anestésico imprescindible para tatuar cuello, cara o
  pecho sin que el portador entre en shock por el dolor mágico» → hay **zonas del
  cuerpo** y unas duelen más que otras.
- **Cera de Abeja Gigante**: «transfiere los planos y plantillas rúnicas del
  pergamino a la piel antes de pinchar» → hay una fase de **plantilla**.
- **Rocío de la Luna Catha**: «disolvente que limpia tatuajes fallidos o
  maldecidos» → **un tatuaje fallido es una cosa que existe** y hay que borrarla.

Y como cristalografía, su catálogo ya trae **herramientas** (`herramienta: true`):
púas, agujas, cera, anestésico, sellador. Se exigen y no son el pigmento.

## 2. Las tres fases

| Fase | Qué se hace | +1 | 0 | −1 |
|---|---|---|---|---|
| **1 · Dónde va** | Elegir la zona del cuerpo que le toca a esa runa | la zona propia | una que vale | la equivocada, o una que duele el doble sin anestésico |
| **2 · Trazar** | Llevar la aguja por la línea sin salirse | línea limpia | se sale un poco | se sale |
| **3 · Aguantar** | Levantar la aguja justo cuando el portador va a dar el tirón | a tiempo | tarde | en pleno tirón |

Mismo ±1 por fase y mismo tope **±3**, por las mismas funciones que los demás.

## 3. Por qué estas tres

Dos cosas que no tiene ningún otro taller:

- **Una fase que es saber, no reflejos.** «Dónde va» no se juega con la muñeca:
  se acierta o no. Es la única de los seis oficios que premia **conocer el
  material** en vez de tener buen pulso, y la única que se puede jugar igual de
  bien con el ratón que sin él.
- **Un material que se mueve solo.** El portador respira, le duele y da tirones.
  En los otros cinco nada reacciona a lo que hace el jugador.

## 4. La decisión: la runa torcida hace otra cosa

**Elegida por el DM el 2026-08-02 (opción A de tres).**

Un desastre **no borra el tatuaje**: lo deja **mal**, y el portador se queda con
una runa que no es la que pidió. **Qué hace esa runa lo decide el DM.**

Es lo más fiel al oficio —«se va con ello puesto»— y lo que hace que tatuar a
alguien tenga consecuencias que se recuerdan tres sesiones después.

> ⚠️ **Lo que esta decisión cuesta, y hay que decirlo:** es la única de los
> cuatro desastres que **no se puede resolver sola en código**. El 1d4 de
> alquimia lo aplica `aplicarDaño`; la gema rota de cristalografía se descuenta;
> el riesgo de destilación saldrá del propio material. Aquí, en cambio, la app
> puede marcar el tatuaje como **torcido** y avisar al DM, pero **qué hace** solo
> lo sabe la mesa. Al construirlo, eso significa:
> - guardar en la ficha que ese tatuaje salió torcido, no solo que salió;
> - enseñárselo al DM en su panel, porque si no, nadie se acuerda en la sesión
>   siguiente;
> - **no inventarse un efecto por defecto**, que sería justo lo contrario de lo
>   que se ha decidido.
>
> Descartadas: *cuesta PG y la sesión* (limpia de aplicar pero convierte el
> oficio en otro más) y *deja cicatriz en la zona* (buena idea a largo plazo,
> pero pide estado nuevo por personaje y por zona del cuerpo).

## 5. Lo que falta para poder construirlo

- **Qué tatuajes existen y qué hace cada uno.** Los 25 del catálogo son tintas y
  utillaje, no runas. Mismo tope que los otros cuatro sin construir.
- **El mapa de zonas del cuerpo**, que hoy no existe en ninguna parte: cuáles
  son, cuáles duelen el doble y qué runa le toca a cada una.

## 6. Fuera de alcance

- Borrar un tatuaje con el disolvente. Existe en el catálogo y encaja, pero es
  otra pantalla y otra tanda.
