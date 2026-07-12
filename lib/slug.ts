// Utilidad neutral (sin "use client") para derivar slugs a partir de nombres.
// Vive aquí para poder importarse desde módulos de datos (data/*) sin arrastrar
// la frontera de cliente de lib/useAtlas.ts (o cualquier hook "use client") a
// un componente de servidor.

// slug a partir del nombre (para regiones nuevas).
export function slugify(name: string): string {
  return name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `region-${Date.now()}`;
}
