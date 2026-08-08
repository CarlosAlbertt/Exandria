"use client";
// El CÓMO de los avisos: el único archivo de la app que conoce SILEO.
//
// El QUÉ —el texto de cada suceso— vive en `lib/avisos.ts`, que es neutro y
// pasa por `scripts/check-avisos.ts`. Aquí solo se traduce a la llamada de la
// librería y se monta el contenedor.
//
// ⚠️ **SILEO va por la 0.1.5.** Si cambia de API o se abandona, se toca ESTE
// archivo y nada más: los sitios que avisan llaman a `avisar(...)` con un objeto
// del tipo `Aviso`, no a la librería.
import { sileo, Toaster } from "sileo";
import { textoDe, type Aviso } from "@/lib/avisos";

/**
 * Anuncia un suceso.
 *
 * Se puede llamar desde cualquier componente de cliente sin montar nada: el
 * `<Avisos />` del layout ya está puesto. Si no lo estuviera, SILEO se lo traga
 * en silencio y la app sigue funcionando — que es lo que se quiere de un aviso.
 */
export function avisar(a: Aviso): void {
  const { title, description, tono } = textoDe(a);
  sileo[tono]({ title, description });
}

/**
 * El contenedor. Va una sola vez, en el layout.
 *
 * Abajo a la derecha y no arriba: la barra de navegación de la app vive arriba,
 * y un aviso encima del reloj o del pin de ubicación tapa justo lo que el
 * jugador está mirando cuando algo pasa.
 */
export default function Avisos() {
  return <Toaster position="bottom-right" theme="dark" />;
}
