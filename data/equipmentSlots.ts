// Huecos fijos del muñeco de equipo. Los accesorios dinámicos se generan
// en runtime a partir de data/leveling.ts (ACCESSORY_SLOTS + FIXED_ACCESSORY).
export type SlotDef = { id: string; label: string; icon: string; kind: "armadura" | "arma" };

export const ARMOR_SLOTS: SlotDef[] = [
  { id: "cabeza", label: "Cabeza", icon: "fa-chess-rook", kind: "armadura" },
  { id: "torso", label: "Torso", icon: "fa-shirt", kind: "armadura" },
  { id: "antebrazos", label: "Antebrazos", icon: "fa-hand-fist", kind: "armadura" },
  { id: "manos", label: "Manos", icon: "fa-mitten", kind: "armadura" },
  { id: "piernas", label: "Piernas", icon: "fa-person", kind: "armadura" },
  { id: "pies", label: "Pies", icon: "fa-shoe-prints", kind: "armadura" },
];

export const WEAPON_SLOTS: SlotDef[] = [
  { id: "arma_principal", label: "Principal", icon: "fa-khanda", kind: "arma" },
  { id: "arma_secundaria", label: "Secundaria", icon: "fa-shield-halved", kind: "arma" },
];
