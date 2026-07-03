// Mapas de pueblos/ciudades: imagen a pantalla completa al clicar el lugar.
// La clave es el NOMBRE exacto del punto (POI de región o pin del mundo).
// Añade aquí más a medida que tengas imágenes en public/maps/pueblos/.

export const TOWN_MAPS: Record<string, string> = {
  Emon: "/maps/pueblos/emon.png",
  Oestruun: "/maps/pueblos/oestruun.png",
  Piedrablanca: "/maps/pueblos/piedrablanca.png",
  Riscomartillo: "/maps/pueblos/riscomartillo.png",
  Stilben: "/maps/pueblos/stilben.png",
  Syngorn: "/maps/pueblos/syngorn.png",
};

export function townMap(name: string): string | undefined {
  return TOWN_MAPS[name];
}
