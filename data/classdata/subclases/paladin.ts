import type { SubclassFeature } from "../types";

// Rasgos de subclase del Paladín (niveles 3/3/7/15/20; dos rasgos a nv3:
// Conjuros del Juramento + Canalizar Divinidad). Clave = nombre en data/classes.ts.
export const PALADIN_SUBCLASSES: Record<string, SubclassFeature[]> = {
  "Juramento de la Reclamación": [
    { level: 3, name: "Conjuros del Juramento", text: "Siempre tienes preparados estos conjuros (no cuentan para tu límite diario):\n• Nivel 3: Identificar, Detectar Magia\n• Nivel 5: Localizar Objeto, Silencio\n• Nivel 9: Disipar Magia, Levantar Maldición\n• Nivel 13: Ojo Arcano, Localizar Criatura\n• Nivel 17: Conocimiento Legendario, Pasatiempo" },
    { level: 3, name: "Canalizar Divinidad", text: "Obtienes dos opciones para usar tu Canalizar Divinidad (Channel Divinity):\n• Sellar la Reliquia: Como Acción Adicional, levantas tu Símbolo Sagrado y pronuncias un veto divino contra un enemigo a 30 pies de ti. La criatura debe hacer una Tirada de Salvación de Carisma. Si falla, durante 1 minuto no puede lanzar ningún hechizo ni activar objetos mágicos. (Puede repetir la salvación al final de cada uno de sus turnos para liberarse).\n• Golpe Desarmador: Inmediatamente después de impactar a una criatura con un ataque de arma cuerpo a cuerpo, puedes usar tu Canalizar Divinidad para obligar al objetivo a hacer una Tirada de Salvación de Fuerza. Si falla, suelta un objeto que esté sosteniendo (tu elección) y la energía divina arrastra el objeto por el suelo hasta tu mano libre (o hasta tus pies si no tienes manos libres)." },
    { level: 7, name: "Aura de Supresión", text: "Tu mera presencia estabiliza las energías salvajes del mundo. Irradias un aura de 10 pies (3 metros). Tú y las criaturas amistosas dentro del aura tenéis Resistencia al daño provocado por hechizos y trampas mágicas. A nivel 18, esta aura se expande a 30 pies." },
    { level: 15, name: "Buscador Implacable", text: "Las ilusiones y la oscuridad ya no pueden ocultar las ruinas a tus ojos. Eres inmune a las condiciones Cegado y Sordo. Además, obtienes Visión Verdadera (Truesight) a una distancia de 30 pies (9 metros)." },
    { level: 20, name: "Custodio de la Divergencia", text: "Puedes invocar el poder absoluto de un protector antiguo. Como Acción Adicional, te transformas en un avatar de contención mágica durante 1 minuto, ganando los siguientes beneficios:\n• Cualquier criatura enemiga que empiece su turno a 30 pies de ti pierde los beneficios de la invisibilidad mágica y su velocidad de Vuelo se reduce a 0.\n• Tus ataques con armas infligen 1d8 de daño de Fuerza extra.\n• Puedes lanzar Disipar Magia como Acción Adicional en cada uno de tus turnos sin gastar un espacio de conjuro. Una vez que usas este rasgo, no puedes volver a usarlo hasta que finalices un Descanso Largo (o gastando un espacio de conjuro de nivel 5 para reactivarlo, según las normas de los Paladines de nivel 20 en 5.5e)." },
  ],
  "Juramento del Exilio": [
    { level: 3, name: "Conjuros del Juramento", text: "Siempre tienes preparados: Protección contra el Bien y el Mal, Paso Brumoso." },
    { level: 3, name: "Canalizar Divinidad — Ancla Dimensional", text: "Como Acción Mágica, envuelves a un enemigo a 30 pies en cadenas planas. Salvación de Carisma. Si falla, durante 1 minuto no puede teletransportarse ni viajar a otros planos, y su velocidad se reduce a la mitad." },
    { level: 7, name: "Aura de Cerrazón", text: "(Aura de 10 pies). Los enemigos dentro del aura reciben 1d8 de daño de Fuerza por cada 5 pies que intenten teletransportarse (y el teletransporte falla si superan sus PG)." },
    { level: 15, name: "Castigo Desterrador", text: "Cuando usas tu Golpe Divino (Divine Smite) contra una Aberración, Celestial, Corruptor o Elemental, el objetivo queda Derrumbado automáticamente y tiene Desventaja en sus ataques en su próximo turno." },
    { level: 20, name: "Caballero del Vacío", text: "(Avatar de 1 minuto). Eres Inmune al daño de Fuerza y Psíquico. Cualquier criatura extraplanar a 30 pies de ti tiene Desventaja en todas las salvaciones. Tus ataques infligen 1d8 daño de Fuerza adicional." },
  ],
  "Juramento de la Luz Primigenia": [
    { level: 3, name: "Conjuros del Juramento", text: "Siempre tienes preparados: Caída de Pluma, Regalo de Alacridad." },
    { level: 3, name: "Canalizar Divinidad — Pozo de Gravedad", text: "Como Acción Adicional, designas un punto a 30 pies. Todos los enemigos a 15 pies del punto deben salvar Fuerza o ser arrastrados violentamente hacia el centro y quedar Derrumbados." },
    { level: 7, name: "Aura de Probabilidad", text: "(Aura de 10 pies). Cualquier aliado dentro del aura que saque un 1 en una tirada de ataque o salvación, puede volver a tirar el dado (debe usar el nuevo resultado)." },
    { level: 15, name: "Resplandor Dunamántico", text: "Cuando golpeas a un enemigo con tu Golpe Divino, ralentizas su tiempo: no puede tomar Reacciones y pierde su Acción Adicional en su próximo turno." },
    { level: 20, name: "Avatar del Luxon", text: "(Avatar de 1 minuto). Irradias luz de estrellas. Obtienes velocidad de Vuelo (Flotar). Puedes usar la reacción del rasgo Aura de Probabilidad en CUALQUIER tirada (amiga o enemiga) dentro de 30 pies, forzando rerolls a voluntad (hasta 1 vez por turno)." },
  ],
  "Juramento del Alba": [
    { level: 3, name: "Conjuros del Juramento", text: "Siempre tienes preparados: Fuego Feérico, Rayo Guía." },
    { level: 3, name: "Canalizar Divinidad — Ceguera Solar", text: "Como Acción Mágica, alzas tu símbolo. Los enemigos en un cono de 30 pies deben salvar Constitución o quedar Cegados durante 1 minuto." },
    { level: 7, name: "Aura del Amanecer", text: "(Aura de 10 pies). El aura emite luz diurna. Los muertos vivientes y los infectados (vampiros) que comiencen su turno en el aura reciben daño Radiante igual a tu modificador de Carisma." },
    { level: 15, name: "Corazón de la Estrella", text: "Tu Golpe Divino inflige 1d8 de daño Radiante extra pasivamente, y si golpeas a un enemigo Cegado, recuperas Puntos de Golpe iguales al daño Radiante infligido." },
    { level: 20, name: "Dios del Sol", text: "(Avatar de 1 minuto). Te conviertes en puro fuego blanco. Eres Inmune al daño Radiante y de Fuego. Tus ataques de arma causan ceguera automática, y emites una onda de calor continuo: los enemigos a 30 pies reciben 2d10 daño Radiante al inicio de su turno." },
  ],
  "Juramento de los Grilletes": [
    { level: 3, name: "Conjuros del Juramento", text: "Siempre tienes preparados: Orden Imperiosa (Command), Inmovilizar Persona." },
    { level: 3, name: "Canalizar Divinidad — Cadenas de la Ley", text: "Como Acción Adicional, arrojas grilletes de luz a un enemigo a 30 pies. Salvación de Fuerza. Si falla, queda Restringido (Restrained) durante 1 minuto." },
    { level: 7, name: "Aura del Guardián", text: "(Aura de 10 pies). El área dentro de tu aura se considera Terreno Difícil exclusivo para tus enemigos." },
    { level: 15, name: "Sentencia de Bloqueo", text: "Cuando impactas a una criatura con tu Golpe Divino, su velocidad se reduce a 0 hasta el final de tu próximo turno, y no puede beneficiarse de bonificaciones mágicas a su velocidad." },
    { level: 20, name: "Alcaide Absoluto", text: "(Avatar de 1 minuto). Eres Inmune al daño mágico no elemental. Si un enemigo intenta moverse o atacar a alguien que no seas tú a 30 pies, puedes usar tu Reacción para golpearlo con cadenas mágicas a distancia, aturdiéndolo (Stunned) automáticamente si el impacto acierta." },
  ],
};
