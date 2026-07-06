"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// El inventario vive ahora en la hoja interactiva /personaje.
export default function InventarioRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/personaje");
  }, [router]);
  return null;
}
