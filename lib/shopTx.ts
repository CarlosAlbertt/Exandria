"use client";
// Transacciones de tienda contra la ficha real del jugador. Autoservicio
// (modelo de confianza de mesa): valida en cliente, escribe la ficha, decrementa
// stock y registra en shop_log. La ficha se persiste con la sesión del jugador
// (RLS de propietario, igual que la tirada de PG).
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import { saveCharacter, type Item } from "@/lib/character";
import type { ShopItem } from "@/lib/useShops";

export type ShopChar = { id: string; gold: number; items: Item[] };
export type TxResult = { ok: true; gold: number; items: Item[] } | { ok: false; error: string };

// Añade 1 unidad: sube qty si ya existe por nombre, si no añade una entrada.
export function mergeItem(items: Item[], name: string): Item[] {
  const i = items.findIndex((it) => it.name === name);
  if (i >= 0) return items.map((it, j) => (j === i ? { ...it, qty: it.qty + 1 } : it));
  return [...items, { id: `buy-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, name, qty: 1 }];
}

// Quita 1 unidad: baja qty; si llega a 0, elimina la entrada.
export function removeOne(items: Item[], name: string): Item[] {
  const i = items.findIndex((it) => it.name === name);
  if (i < 0) return items;
  const it = items[i];
  if (it.qty <= 1) return items.filter((_, j) => j !== i);
  return items.map((x, j) => (j === i ? { ...x, qty: x.qty - 1 } : x));
}

export async function buy(char: ShopChar, item: ShopItem): Promise<TxResult> {
  if (!supabaseConfigured) return { ok: false, error: "Sin conexión." };
  if (char.gold < item.price) return { ok: false, error: "No tienes oro suficiente." };
  if (item.stock !== null && item.stock <= 0) return { ok: false, error: "Sin existencias." };
  const gold = char.gold - item.price;
  const items = mergeItem(char.items, item.name);
  await saveCharacter(char.id, { gold, items });
  const supabase = createClient();
  if (item.stock !== null) await supabase.from("shop_items").update({ stock: item.stock - 1 }).eq("id", item.id);
  await supabase.from("shop_log").insert({ shop_id: item.shop_id, item: item.name, price: item.price, kind: "compra" });
  return { ok: true, gold, items };
}

// Vender: precio = mitad (redondeo abajo) del precio pasado. Quita 1 del item.
export async function sell(char: ShopChar, shopId: number, itemName: string, basePrice: number): Promise<TxResult> {
  if (!supabaseConfigured) return { ok: false, error: "Sin conexión." };
  if (!char.items.some((it) => it.name === itemName)) return { ok: false, error: "No tienes ese objeto." };
  const price = Math.floor(basePrice / 2);
  const gold = char.gold + price;
  const items = removeOne(char.items, itemName);
  await saveCharacter(char.id, { gold, items });
  await createClient().from("shop_log").insert({ shop_id: shopId, item: itemName, price, kind: "venta" });
  return { ok: true, gold, items };
}
