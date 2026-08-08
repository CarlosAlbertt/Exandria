// MISIONES DEL GRUPO ENTERO. Dos: esta y «Lo que subió del suelo»
// (`data/misiones/zigurat.ts`), que va aparte por lo larga que es.
//
// Presupuesto (`XP_BUDGET`) para SEIS jugadores: nivel 4 → 1500 baja / 2250
// moderada / 3000 alta.

import type { Mision } from "./types";

export const GRUPO: Mision[] = [
  {
    slug: "partida-que-no-volvio",
    titulo: "La partida que no volvió",
    tamano: "grupo",
    jugadores: 6,
    nivel: [4, 5],
    lugar: "franja:espesura",
    encargante: "El alguacil de Byroden",
    gancho:
      "Byroden pagó a ocho mercenarios para que entraran en la espesura y le quitaran el " +
      "campamento goblinoide de encima. Eso fue hace once días. Ayer volvió uno, sin armas, y " +
      "solo repite que «ahora hay más». El alguacil ya no tiene dinero para contratar a otros " +
      "ocho: contrata al grupo.",
    escenas: [
      {
        titulo: "1 · El que volvió",
        texto:
          "Está en la taberna y no habla con nadie. Perspicacia CD 13: no está en shock, está " +
          "aterrado de que lo sigan. Medicina CD 12: lo que tiene en la espalda no son heridas " +
          "de pelea, son marcas de haber sido arrastrado. Persuasión CD 15 o Medicina y una " +
          "noche: cuenta que a los otros siete no los mataron. Los cambiaron de sitio.",
      },
      {
        titulo: "2 · El campamento, que ya no es un campamento",
        texto:
          "Lo que había hace once días era una partida de saqueo. Lo que hay ahora es una " +
          "empalizada, un foso y turnos de guardia — han llegado hobgoblins de más adentro y " +
          "han tomado el mando. Sigilo en grupo CD 14 para acercarse de noche; quien falle " +
          "estropea la ventaja del primer turno para todos.",
      },
      {
        titulo: "3 · Los siete",
        texto:
          "Los mercenarios están vivos, en una zanja cubierta, y no los guardan por rescate: " +
          "los guardan para cavar. Están abriendo una trinchera hacia el norte, hacia la " +
          "linde, y la dirección de la trinchera es la pista gorda — van hacia el zigurat. " +
          "Sacarlos de la zanja durante el combate cuesta dos turnos de alguien y es la " +
          "decisión que define la sesión.",
      },
      {
        titulo: "4 · El jefe y lo que lleva encima",
        texto:
          "El capitán no es goblinoide y por eso manda: es un bandido humano que se ha " +
          "instalado a dirigir esto. Lleva al cuello una esfera de piedra pulida que gira " +
          "despacio, y no sabe qué es. Sabe que le hace obedecer a los que no le obedecían.",
      },
    ],
    encuentros: [
      {
        nombre: "El campamento fortificado",
        monstruos: [
          { name: "Hobgoblin Guerrero", n: 8 },
          { name: "Capitán Bandido", n: 2 },
          { name: "Huargo", n: 4 },
        ],
        xp: 2100,
        nota:
          "Moderado tirando a alto para seis a nivel 4 (1500 / 2250 / 3000). Se pelea POR " +
          "OLEADAS y con reloj: seis hobgoblins y los huargos de entrada, los dos capitanes y " +
          "el resto cuando suena el cuerno (ronda 3). Silenciar el cuerno en las dos primeras " +
          "rondas —es un objetivo, CA 12, cualquiera que llegue— quita ocho monstruos de la " +
          "pelea y es la jugada que premia el plan. Si nadie lo silencia, esto muerde de " +
          "verdad y hay que estar dispuesto a que caiga alguien.",
      },
    ],
    recompensa:
      "120 po del pueblo y el material del campamento (armas, dos ballestas y provisiones para " +
      "un mes). Los siete mercenarios vivos deben una, y son siete espadas que el DM puede meter " +
      "en cualquier misión posterior. Y del cuello del capitán: la primera esfera del sello de " +
      "Ioun. Quedan cuatro.",
    siFalla:
      "El campamento aguanta y la trinchera sigue avanzando. En tres semanas llega al cráter, y " +
      "quien esté cavando entra en el zigurat antes que el grupo. A partir de ahí las misiones " +
      "de la zona cambian de tono: ya no se trata de llegar antes, sino de recuperar lo que " +
      "otro abrió.",
    body:
      "Byroden pagó a ocho mercenarios para limpiar el campamento goblinoide de la espesura. " +
      "Volvió uno. Se busca al grupo entero, y se paga lo que queda en el común del pueblo.",
  },
];
