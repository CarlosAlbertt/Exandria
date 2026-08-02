"use client";

import type { Oficio } from "@/lib/materiales";

/**
 * Un material, en el mismo cuadrado que la bolsa de `/inventario`.
 *
 * **La imagen es un fondo CSS sobre el icono de categoría**, y eso es la
 * decisión de la tanda: son 369 materiales y el arte no está. Un `<img>` que no
 * existe deja un roto y un 404 en consola; un fondo que no carga simplemente no
 * pinta y **se ve el icono de debajo**. Los PNG entran en
 * `public/materiales/<oficio>/<n>.png` sin tocar una línea de código.
 *
 * Se referencia por **número de catálogo** y no por nombre porque el número es
 * lo estable: es como el DM y la mesa se refieren a ellos entre sesiones.
 */

/** El icono que se ve mientras el material no tenga PNG. */
const ICONO_CATEGORIA: Record<string, string> = {
  flora: "fa-seedling",
  fauna: "fa-paw",
  mineral: "fa-gem",
  esencia: "fa-droplet",
  herramienta: "fa-screwdriver-wrench",
};
const ICONO_POR_DEFECTO = "fa-flask";

export default function HuecoMaterial({
  oficio, n, nombre, categoria, cantidad, estado, orden, onClick,
}: {
  oficio: Oficio;
  n: number;
  nombre: string;
  categoria?: string;
  cantidad: number;
  /** `listo` lo tienes, `falta` no, `echado` ya está en el caldero. */
  estado: "listo" | "falta" | "echado";
  /** Posición en la que se echó, si ya está dentro. */
  orden?: number;
  onClick?: () => void;
}) {
  const icono = ICONO_CATEGORIA[categoria ?? ""] ?? ICONO_POR_DEFECTO;
  const clases = [
    "mat-hueco",
    estado === "listo" ? "is-listo" : estado === "falta" ? "is-falta" : "is-echado",
    onClick ? "is-clickable" : "",
  ].join(" ");

  const cuerpo = (
    <>
      <i className={`fas ${icono} mat-icono`} aria-hidden />
      <span className="mat-img" style={{ backgroundImage: `url("/materiales/${oficio}/${n}.png")` }} />
      {cantidad > 1 && <span className="mat-qty">{cantidad}</span>}
      {typeof orden === "number" && <span className="mat-orden">{orden}</span>}
    </>
  );

  return (
    <div>
      {onClick ? (
        <button type="button" className={clases} onClick={onClick} aria-label={`Echar ${nombre}`}>
          {cuerpo}
        </button>
      ) : (
        <div className={clases} role="img" aria-label={nombre}>{cuerpo}</div>
      )}
      <p className="mat-nombre" style={estado === "falta" ? { color: "var(--color-ember)" } : undefined}>
        {nombre}
      </p>
    </div>
  );
}
