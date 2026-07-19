"use client";
import { useMemo, useState } from "react";
import { useAtlas } from "@/lib/useAtlas";
import { SHOP_KINDS } from "@/data/shopTemplates";
import {
  useShops, createShop, updateShop, deleteShop,
  addItem, updateItem, deleteItem, seedCatalog, type Shop, type ShopItem,
} from "@/lib/useShops";

const inputCls = "w-full bg-[var(--color-night)] rounded-lg px-3 py-1.5 font-body text-[14px] outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)]";

export default function TiendasPanel() {
  const { atlas } = useAtlas();
  const poiNames = useMemo(() => {
    const set = new Set<string>();
    for (const cont of Object.values(atlas)) for (const arr of Object.values(cont.pois ?? {})) for (const p of arr) set.add(p.name);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [atlas]);

  const [poi, setPoi] = useState("");
  const { shops, ready, reload } = useShops(poi || null);
  const [newName, setNewName] = useState("");
  const [newKind, setNewKind] = useState(SHOP_KINDS[0]);

  async function onCreate() {
    if (!poi || !newName.trim()) return;
    await createShop(poi, newName.trim(), newKind);
    setNewName("");
    await reload();
  }

  return (
    <div className="panel p-6 space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-ui text-[11px] font-bold uppercase tracking-wide" style={{ color: "var(--color-dim)" }}>POI</span>
        <select value={poi} onChange={(e) => setPoi(e.target.value)} className="bg-[var(--color-night)] rounded-lg px-3 py-1.5 font-ui text-[13px] border border-[var(--color-line)]" style={{ color: "var(--color-warm)" }}>
          <option value="">— Elige un lugar —</option>
          {poiNames.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      {!poi ? (
        <p className="text-sm italic" style={{ color: "var(--color-dim)" }}>Elige un POI para gestionar sus tiendas.</p>
      ) : (
        <>
          <div className="panel-raised p-3 flex flex-wrap items-end gap-2">
            <div className="flex-1 min-w-[160px]">
              <p className="eyebrow !text-[9px] mb-1">Nueva tienda en {poi}</p>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nombre (p. ej. La Yunque Ardiente)" className={inputCls} style={{ color: "var(--color-warm)" }} />
            </div>
            <select value={newKind} onChange={(e) => setNewKind(e.target.value)} className="bg-[var(--color-night)] rounded-lg px-2 py-1.5 font-ui text-[13px] border border-[var(--color-line)]" style={{ color: "var(--color-warm)" }}>
              {SHOP_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
            <button onClick={onCreate} disabled={!newName.trim()} className="btn-gold !py-1.5 !px-3 text-[13px] disabled:opacity-40"><i className="fas fa-plus mr-1.5" />Crear</button>
          </div>

          {!ready ? <p className="text-sm italic" style={{ color: "var(--color-dim)" }}>Cargando…</p>
            : shops.length === 0 ? <p className="text-sm italic" style={{ color: "var(--color-dim)" }}>Sin tiendas en {poi}.</p>
            : shops.map((s) => <ShopEditor key={s.id} shop={s} onChange={reload} />)}
        </>
      )}
    </div>
  );
}

function ShopEditor({ shop, onChange }: { shop: Shop; onChange: () => void }) {
  const [name, setName] = useState(shop.name);
  const [kind, setKind] = useState(shop.kind);
  const [prompt, setPrompt] = useState(shop.npc_prompt);
  const [greeting, setGreeting] = useState(shop.greeting);
  const [it, setIt] = useState({ name: "", price: "0", stock: "" });

  async function saveMeta() { await updateShop(shop.id, { name: name.trim() || "Tienda", kind, npc_prompt: prompt, greeting }); await onChange(); }
  async function onAddItem() {
    if (!it.name.trim()) return;
    await addItem(shop.id, { name: it.name.trim(), price: Number(it.price) || 0, stock: it.stock.trim() === "" ? null : Number(it.stock) });
    setIt({ name: "", price: "0", stock: "" });
    await onChange();
  }

  return (
    <div className="panel-raised p-4 space-y-3">
      <div className="flex flex-wrap gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} style={{ color: "var(--color-warm)", flex: "1 1 160px" }} />
        <select value={kind} onChange={(e) => setKind(e.target.value)} className="bg-[var(--color-night)] rounded-lg px-2 py-1.5 font-ui text-[13px] border border-[var(--color-line)]" style={{ color: "var(--color-warm)" }}>
          {SHOP_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
        <button onClick={() => seedCatalog(shop.id, kind).then(onChange)} className="btn-ghost !py-1.5 !px-3 text-[12px]" title="Rellenar catálogo con la plantilla"><i className="fas fa-seedling mr-1.5" />Semilla</button>
        <button onClick={() => { if (confirm(`¿Borrar la tienda "${shop.name}"?`)) deleteShop(shop.id).then(onChange); }} className="btn-ghost !py-1.5 !px-3 text-[12px]" style={{ color: "var(--color-ember)" }}><i className="fas fa-trash" /></button>
      </div>
      <input value={greeting} onChange={(e) => setGreeting(e.target.value)} placeholder="Saludo del tendero" className={inputCls} style={{ color: "var(--color-warm)" }} />
      <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={2} placeholder="Prompt del tendero IA (personalidad, tono)" className={`${inputCls} resize-none`} style={{ color: "var(--color-warm)" }} />
      <button onClick={saveMeta} className="btn-gold !py-1.5 !px-3 text-[12px]"><i className="fas fa-check mr-1.5" />Guardar tienda</button>

      <div className="space-y-1.5">
        <p className="eyebrow !text-[9px]">Catálogo ({shop.items.length})</p>
        {shop.items.map((item) => <ItemRow key={item.id} item={item} onChange={onChange} />)}
        <div className="flex flex-wrap gap-2 items-end pt-1">
          <input value={it.name} onChange={(e) => setIt({ ...it, name: e.target.value })} placeholder="Objeto" className={inputCls} style={{ color: "var(--color-warm)", flex: "1 1 140px" }} />
          <input value={it.price} onChange={(e) => setIt({ ...it, price: e.target.value })} placeholder="po" type="number" className={inputCls} style={{ color: "var(--color-warm)", width: 80, flex: "0 0 auto" }} />
          <input value={it.stock} onChange={(e) => setIt({ ...it, stock: e.target.value })} placeholder="stock (∞)" type="number" className={inputCls} style={{ color: "var(--color-warm)", width: 90, flex: "0 0 auto" }} />
          <button onClick={onAddItem} disabled={!it.name.trim()} className="btn-ghost !py-1.5 !px-3 text-[12px] disabled:opacity-40"><i className="fas fa-plus" /></button>
        </div>
      </div>
    </div>
  );
}

function ItemRow({ item, onChange }: { item: ShopItem; onChange: () => void }) {
  const [price, setPrice] = useState(String(item.price));
  const [stock, setStock] = useState(item.stock === null ? "" : String(item.stock));
  const dirty = price !== String(item.price) || stock !== (item.stock === null ? "" : String(item.stock));
  return (
    <div className="flex items-center gap-2">
      <span className="font-ui text-[13px] flex-1 min-w-0 truncate" style={{ color: "var(--color-warm)" }}>{item.name}</span>
      <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" className={inputCls} style={{ color: "var(--color-warm)", width: 70, flex: "0 0 auto" }} />
      <input value={stock} onChange={(e) => setStock(e.target.value)} type="number" placeholder="∞" className={inputCls} style={{ color: "var(--color-warm)", width: 70, flex: "0 0 auto" }} />
      {dirty && <button onClick={() => updateItem(item.id, { price: Number(price) || 0, stock: stock.trim() === "" ? null : Number(stock) }).then(onChange)} className="btn-ghost !p-0 w-7 h-7 text-[11px]" title="Guardar"><i className="fas fa-check" /></button>}
      <button onClick={() => deleteItem(item.id).then(onChange)} className="btn-ghost !p-0 w-7 h-7 text-[11px]" style={{ color: "var(--color-ember)" }}><i className="fas fa-trash" /></button>
    </div>
  );
}
