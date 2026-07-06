"use client";

import PortraitFrame from "@/components/PortraitFrame";
import { AbilityKey } from "@/data/rules";
import { ARMOR_SLOTS, WEAPON_SLOTS } from "@/data/equipmentSlots";
import { ACCESSORY_SLOTS, FIXED_ACCESSORY, accessoryCount } from "@/data/leveling";
import type { Item } from "@/lib/character";

type Props = {
  equipment: Record<string, Item>;
  mods: Record<AbilityKey, number>;
  portrait?: string;
  portraitAlt: string;
  onSlotClick: (slotId: string) => void; // vacío = intentar equipar; lleno = retirar
};

/** Genera los ids de hueco de accesorio según los modificadores actuales. */
export function accessorySlotIds(mods: Record<AbilityKey, number>): { id: string; label: string }[] {
  const out: { id: string; label: string }[] = [{ id: FIXED_ACCESSORY.type, label: FIXED_ACCESSORY.label }];
  for (const a of ACCESSORY_SLOTS) {
    const n = accessoryCount(a.mult, mods[a.stat], a.min);
    for (let i = 1; i <= n; i++) out.push({ id: `${a.type}_${i}`, label: `${a.label} ${n > 1 ? i : ""}`.trim() });
  }
  return out;
}

function Slot({ label, icon, item, over, onClick }: { label: string; icon?: string; item?: Item; over?: boolean; onClick: () => void }) {
  return (
    <button className="pd-slot" data-filled={!!item} data-over={over} onClick={onClick} title={item ? `${item.name} — clic para retirar` : label}>
      {item ? (
        <span className="pd-nm">{item.name}</span>
      ) : (
        <>
          <i className={`fas ${icon ?? "fa-plus"} pd-ic`} />
          <span className="pd-lb">{label}</span>
        </>
      )}
    </button>
  );
}

export default function Paperdoll({ equipment, mods, portrait, portraitAlt, onSlotClick }: Props) {
  const accIds = accessorySlotIds(mods);
  const validIds = new Set([
    ...ARMOR_SLOTS.map((s) => s.id), ...WEAPON_SLOTS.map((s) => s.id), ...accIds.map((a) => a.id),
  ]);
  const overflow = Object.keys(equipment).filter((k) => !validIds.has(k));

  return (
    <div className="panel p-5">
      <p className="eyebrow mb-3">Equipo</p>
      <div className="pd-grid">
        <Slot label="Cabeza" icon={ARMOR_SLOTS[0].icon} item={equipment.cabeza} onClick={() => onSlotClick("cabeza")} />
        <div className="pd-figure"><PortraitFrame src={portrait} alt={portraitAlt} size="lg" icon="fa-user" /></div>
        <Slot label="Torso" icon={ARMOR_SLOTS[1].icon} item={equipment.torso} onClick={() => onSlotClick("torso")} />
        <Slot label="Antebrazos" icon={ARMOR_SLOTS[2].icon} item={equipment.antebrazos} onClick={() => onSlotClick("antebrazos")} />
        <Slot label="Manos" icon={ARMOR_SLOTS[3].icon} item={equipment.manos} onClick={() => onSlotClick("manos")} />
        <Slot label="Piernas" icon={ARMOR_SLOTS[4].icon} item={equipment.piernas} onClick={() => onSlotClick("piernas")} />
        <Slot label="Pies" icon={ARMOR_SLOTS[5].icon} item={equipment.pies} onClick={() => onSlotClick("pies")} />
      </div>

      <p className="eyebrow mt-4 mb-2">Armas</p>
      <div className="pd-row">
        {WEAPON_SLOTS.map((s) => (
          <Slot key={s.id} label={s.label} icon={s.icon} item={equipment[s.id]} onClick={() => onSlotClick(s.id)} />
        ))}
      </div>

      <p className="eyebrow mt-4 mb-2">Accesorios</p>
      <div className="pd-row">
        {accIds.map((a) => (
          <Slot key={a.id} label={a.label} icon="fa-gem" item={equipment[a.id]} onClick={() => onSlotClick(a.id)} />
        ))}
        {overflow.map((k) => (
          <Slot key={k} label="De sobra" item={equipment[k]} over onClick={() => onSlotClick(k)} />
        ))}
      </div>
      {overflow.length > 0 && (
        <p className="text-[12px] mt-2 italic" style={{ color: "var(--color-ember)" }}>Hay accesorios equipados que ya no caben (bajó el modificador). Clic para retirarlos.</p>
      )}
    </div>
  );
}
