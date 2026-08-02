# Plan · El caldero gráfico y la manipulación de Alquimia

Spec: `docs/superpowers/specs/2026-08-02-caldero-grafico-design.md`
Rama: `caldero-grafico` → merge a `master`.
Un commit por pieza, para poder parar en cualquier punto con el árbol limpio.

---

## Pieza 1 · La capa pura (`lib/manipulacion.ts`)

Nada de React. Es lo que el gate puede llamar.

- `Fase = "echar" | "pipeta" | "cocer"`, `Punto = -1 | 0 | 1`.
- `TOPE = 3` y `totalManipulacion(puntos)` con **clamp a ±3**.
- `puntoEchar(jugado, receta)`: +1 si el orden coincide, −1 si no.
- `puntoPipeta(p)` y `puntoCocer(p)` sobre una posición normalizada 0–1, con las
  bandas como constantes exportadas (el gate las lee, no las repite).
- `categoriaDominante(receta)`: la categoría más repetida **contando
  cantidades**; empate → la del primer material de la receta.
- `DANO_POR_CATEGORIA` y `danoDeReceta(receta)`, que devuelve `null` si la
  categoría no está en el mapa. **Nada de respaldo silencioso**: el gate exige
  que las 32 recetas den un tipo.
- `esDesastre(caraD20, totalManipulacion)`: pifia natural o −3.
- `colorBrebaje(rareza)`: el color del líquido del caldero.

**Commit**: `feat(taller): la manipulacion como capa pura`

## Pieza 2 · El caldero dibujado (`components/taller/CalderoSvg.tsx`)

SVG, sin assets. Props: `color` del brebaje, `fuego` encendido, `burbujas`.
Hierro con degradado, asa, tres patas, borde de bronce, brebaje con degradado
radial, burbujas, vapor y leña. Con `prefers-reduced-motion` no anima.

**Commit**: `feat(taller): el caldero se dibuja`

## Pieza 3 · El hueco de material (`components/taller/HuecoMaterial.tsx`)

Cuadrado como el de la bolsa. Pinta `/materiales/<oficio>/<n>.png` **como fondo
CSS sobre el icono de categoría**: si el PNG no está, no hay error ni hueco en
blanco — se ve el icono. Los PNG entran en `public/` sin tocar código.

**Commit**: `feat(taller): huecos de material con imagen y respaldo`

## Pieza 4 · Las tres fases (`components/taller/Manipulacion.tsx`)

Máquina de estados `echar → pipeta → cocer → listo`. Botón rojo de parada con la
acción escrita y `espacio` como equivalente. Cada fase muestra el punto que
sacó. Emite el total a la pieza 5.

**Commit**: `feat(taller): echar, dosificar y cocer`

## Pieza 5 · El caldero, montado (`components/taller/Caldero.tsx`)

- El libro pasa a pestaña; el banco ocupa el ancho.
- `preparar` recibe el bono de manipulación y lo suma al `mod`.
- La cara del d20 sale de `rolls[0]` para poder detectar la pifia.
- **Desastre** → `aplicarDaño` de `lib/estado.ts`, con relectura y fusión de
  `play_state` como hace `gastarCupo`.
- **Caja de arena**: manipula, no descuenta, no gasta cupo, **no aplica daño**;
  el mensaje dice el daño que se habría llevado.

**Commit**: `feat(taller): el caldero jugable`

## Pieza 6 · El gate (`scripts/check-recetas.ts`)

Cinco reglas nuevas, **cada una probada por mutación**:

1. el clamp del ±3 se cumple con todas las combinaciones;
2. las 32 recetas tienen categoría dominante conocida;
3. el mapa categoría → daño cubre las cuatro categorías;
4. el empate de dominante es determinista;
5. toda receta tiene al menos un material.

**Commit**: `test(taller): el gate vigila la manipulacion`

## Cierre

`npx tsc --noEmit` + `npx next build` + los `scripts/check-*.ts` en verde, merge
a `master` y push.
