"use client";

import Link from "next/link";
import { categoriaDe, metaDe } from "@/lib/inventario";
import { ARMOR_SLOTS, WEAPON_SLOTS } from "@/data/equipmentSlots";
import VitalesEquipo from "@/components/inventario/VitalesEquipo";
import type { Item } from "@/lib/character";

type Props = {
  equipment: Record<string, Item>;
  /** CA ya calculada (o la que el jugador haya escrito a mano en la hoja). */
  ac: number;
  /** De dónde sale esa CA, en español llano. */
  acSource: string;
  /** Modificador de Fuerza, para los huecos de la bolsa. */
  modFuerza: number;
  /** Suma de qty de la bolsa. */
  usados: number;
  /** Tiles extra opcionales (impacto, daño…), si quien monta esto los tiene. */
  extras?: { label: string; value: string }[];
  /** A dónde lleva el botón. El DM mirando a otro jugador necesita su ?user=. */
  href?: string;
};

// Orden de las chapas: el mismo que el muñeco de arriba a abajo, y los
// accesorios (cuyos ids se generan en runtime) detrás. Sin esto el orden sería
// el de las claves del JSON, que es el orden en que se fue equipando: distinto
// en cada ficha y cambiante al retirar algo.
const ORDEN_HUECOS = [...ARMOR_SLOTS.map((s) => s.id), ...WEAPON_SLOTS.map((s) => s.id)];

/**
 * El equipo, resumido, para la HOJA. Solo lectura y a propósito: lo que un
 * jugador mira en mitad de su turno es qué lleva puesto y cuánta CA tiene, no
 * la lista de sogas y antorchas. Gestionar la bolsa —añadir, soltar, equipar,
 * anotar— pasó entero a /inventario, y de ahí el botón del final: aquí no hay
 * ni un control de edición.
 */
export default function ResumenEquipo({ equipment, ac, acSource, modFuerza, usados, extras, href = "/inventario" }: Props) {
  const puestos = Object.entries(equipment)
    .filter(([, it]) => !!it)
    .sort(([a], [b]) => {
      const ia = ORDEN_HUECOS.indexOf(a);
      const ib = ORDEN_HUECOS.indexOf(b);
      return (ia < 0 ? ORDEN_HUECOS.length : ia) - (ib < 0 ? ORDEN_HUECOS.length : ib);
    });

  return (
    <section className="panel p-5">
      <p className="eyebrow mb-3">
        <i className="fas fa-sack-dollar mr-1.5" style={{ color: "var(--color-bronze)" }} />
        Equipo y bolsa
      </p>

      {puestos.length === 0 ? (
        <p className="font-ui text-[13px] mb-4" style={{ color: "var(--color-dim)" }}>
          No llevas nada puesto.
        </p>
      ) : (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {puestos.map(([slotId, it]) => {
            const m = metaDe(categoriaDe(it.name));
            return (
              <span
                key={slotId}
                className="panel-raised px-2.5 py-1.5 flex items-center gap-2 font-ui text-[12px] font-semibold"
                style={{ color: "var(--color-warm)" }}
              >
                <i className={`fas ${m.icon} text-[12px]`} style={{ color: m.color }} />
                {it.name}
              </span>
            );
          })}
        </div>
      )}

      <VitalesEquipo ac={ac} acSource={acSource} modFuerza={modFuerza} usados={usados} extras={extras} />

      <div className="text-center mt-4">
        <Link href={href} className="btn-gold !py-1.5 !px-4 text-[13px]">
          <i className="fas fa-bag-shopping mr-1.5" />Abrir el inventario
        </Link>
      </div>
    </section>
  );
}
