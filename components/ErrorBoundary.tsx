"use client";

import React from "react";

// Aísla fallos de un subárbol (p. ej. hooks de Realtime) para que no tumben
// el resto de la app.
export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { err: boolean }
> {
  state = { err: false };
  static getDerivedStateFromError() {
    return { err: true };
  }
  componentDidCatch(error: unknown) {
    console.error("ErrorBoundary atrapó:", error);
  }
  render() {
    if (this.state.err) return this.props.fallback ?? null;
    return this.props.children;
  }
}
