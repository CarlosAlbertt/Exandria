"use client";

import React from "react";

// Aísla fallos de un subárbol (p. ej. hooks de Realtime) para que no tumben
// el resto de la app.
// `fallback` acepta una función para poder ENSEÑAR EL MENSAJE.
//
// ⚠️ Antes solo podía devolver `null`, y eso convertía cualquier throw en una
// pantalla en blanco —o en el «This page couldn't load» del navegador—, que es
// lo peor posible para diagnosticar: el error existía solo en la consola del
// jugador, que es justo quien no la va a abrir. Con el mensaje a la vista, quien
// se lo encuentra puede leerlo y contarlo.
export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode | ((mensaje: string) => React.ReactNode) },
  { err: boolean; mensaje: string }
> {
  state = { err: false, mensaje: "" };
  static getDerivedStateFromError(error: unknown) {
    return { err: true, mensaje: error instanceof Error ? error.message : String(error) };
  }
  componentDidCatch(error: unknown) {
    console.error("ErrorBoundary atrapó:", error);
  }
  render() {
    if (this.state.err) {
      const { fallback } = this.props;
      return typeof fallback === "function" ? fallback(this.state.mensaje) : fallback ?? null;
    }
    return this.props.children;
  }
}
