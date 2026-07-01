// Catálogo de equipo de aventurero. Nombres genéricos de objetos (no protegidos)
// para poblar el inventario. Cada objeto ocupa un hueco (slot).

export type ItemCat = "Armas" | "Armaduras" | "Aventura" | "Consumibles" | "Herramientas";

export const CATALOG: Record<ItemCat, string[]> = {
  Armas: [
    "Daga", "Espada corta", "Espada larga", "Hacha de mano", "Maza", "Bastón",
    "Arco corto", "Arco largo", "Ballesta ligera", "Lanza", "Martillo de guerra", "Cimitarra",
  ],
  Armaduras: [
    "Armadura de cuero", "Cota de mallas", "Cota de escamas", "Coraza", "Escudo",
  ],
  Aventura: [
    "Mochila", "Soga de cáñamo (15 m)", "Antorcha", "Yesca y pedernal", "Saco de dormir",
    "Raciones (1 día)", "Odre de agua", "Linterna", "Aceite (frasco)", "Piqueta",
    "Gancho de escalada", "Catalejo", "Espejo de acero", "Cuerda de seda",
  ],
  Consumibles: [
    "Poción de curación", "Antídoto", "Frasco de ácido", "Fuego del alquimista",
    "Hierbas medicinales", "Comida de viaje",
  ],
  Herramientas: [
    "Herramientas de ladrón", "Kit de herborista", "Instrumento musical", "Suministros de caligrafía",
    "Herramientas de artesano", "Kit de sanador", "Juego de dados", "Herramientas de navegante",
  ],
};

export const STARTER_KIT = ["Mochila", "Saco de dormir", "Raciones (1 día)", "Odre de agua", "Antorcha", "Yesca y pedernal", "Soga de cáñamo (15 m)"];
