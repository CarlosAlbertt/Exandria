"use client";
import { useCallback, useEffect, useState } from "react";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import { SHOP_TEMPLATES } from "@/data/shopTemplates";

export type ShopItem = { id: number; shop_id: number; name: string; price: number; stock: number | null; notes: string };
export type Shop = { id: number; poi_name: string; name: string; kind: string; npc_prompt: string; greeting: string; items: ShopItem[] };

// --- Lectura (hook) ---------------------------------------------------------
export function useShops(poiName: string | null) {
  const [shops, setShops] = useState<Shop[]>([]);
  const [ready, setReady] = useState(false);

  const load = useCallback(async () => {
    if (!supabaseConfigured || !poiName) { setShops([]); setReady(true); return; }
    const supabase = createClient();
    const { data: shopRows } = await supabase.from("shops").select("*").eq("poi_name", poiName).order("id");
    const list = (shopRows ?? []) as Omit<Shop, "items">[];
    if (list.length === 0) { setShops([]); setReady(true); return; }
    const { data: itemRows } = await supabase.from("shop_items").select("*").in("shop_id", list.map((s) => s.id)).order("id");
    const items = (itemRows ?? []) as ShopItem[];
    setShops(list.map((s) => ({ ...s, items: items.filter((it) => it.shop_id === s.id) })));
    setReady(true);
  }, [poiName]);

  useEffect(() => {
    if (!supabaseConfigured) { setReady(true); return; }
    let mounted = true;
    const supabase = createClient();
    const run = async () => { if (mounted) await load(); };
    run();
    const ch = supabase
      .channel(`shops_rt_${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "shop_items" }, () => { void load(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "shop_log" }, () => { void load(); })
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(ch); };
  }, [load]);

  return { shops, ready, reload: load };
}

// --- CRUD del DM (funciones sueltas) ---------------------------------------
export async function createShop(poiName: string, name: string, kind: string): Promise<number | null> {
  if (!supabaseConfigured) return null;
  const { data } = await createClient().from("shops").insert({ poi_name: poiName, name, kind }).select("id").single();
  return data ? (data as { id: number }).id : null;
}
export async function updateShop(id: number, patch: Partial<Pick<Shop, "name" | "kind" | "npc_prompt" | "greeting">>) {
  if (!supabaseConfigured) return;
  await createClient().from("shops").update(patch).eq("id", id);
}
export async function deleteShop(id: number) {
  if (!supabaseConfigured) return;
  await createClient().from("shops").delete().eq("id", id);
}
export async function addItem(shopId: number, item: { name: string; price: number; stock: number | null; notes?: string }) {
  if (!supabaseConfigured) return;
  await createClient().from("shop_items").insert({ shop_id: shopId, name: item.name, price: item.price, stock: item.stock, notes: item.notes ?? "" });
}
export async function updateItem(id: number, patch: Partial<Pick<ShopItem, "name" | "price" | "stock" | "notes">>) {
  if (!supabaseConfigured) return;
  await createClient().from("shop_items").update(patch).eq("id", id);
}
export async function deleteItem(id: number) {
  if (!supabaseConfigured) return;
  await createClient().from("shop_items").delete().eq("id", id);
}
export async function seedCatalog(shopId: number, kind: string) {
  if (!supabaseConfigured) return;
  const tpl = SHOP_TEMPLATES[kind];
  if (!tpl || tpl.length === 0) return;
  await createClient().from("shop_items").insert(tpl.map((t) => ({ shop_id: shopId, name: t.name, price: t.price, stock: null, notes: "" })));
}
