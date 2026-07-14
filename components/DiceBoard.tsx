"use client";

import { useEffect } from "react";
import { initDiceBox } from "@/lib/diceBox";

// Overlay transparente a pantalla completa donde ruedan los dados físicos.
// pointer-events:none para no bloquear la UI; z alto pero por debajo de
// EpicOverlay. Monta el contenedor e inicializa el singleton una sola vez.
export default function DiceBoard() {
  useEffect(() => {
    void initDiceBox("#dice-board-canvas");
  }, []);

  return (
    <div
      id="dice-board-canvas"
      aria-hidden
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 60 }}
    />
  );
}
