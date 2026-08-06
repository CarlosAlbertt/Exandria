"use client";
import { useMemo, useState } from "react";
import { useAtlas } from "@/lib/useAtlas";
import { SHOP_KINDS, SHOP_TEMPLATES, kindLabel, normalizaKind } from "@/data/shopTemplates";
import {
  useShops, createShop, updateShop, deleteShop,
  addItem, updateItem, deleteItem, seedCatalog, type Shop, type ShopItem,
} from "@/lib/useShops";
import { generarTienda } from "@/lib/generar";

const inputCls = "w-full bg-[var(--color-night)] rounded-lg px-3 py-1.5 font-body text-[14px] outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)]";

// El tipo de tienda es TEXTO LIBRE: `shops.kind` es `text` y nadie lo valida.
// Las doce plantillas son sugerencias, no una reja — si el DM quiere una
// pescadería, la escribe. Un solo `<datalist>` sirve a los dos inputs (el de
// crear y el de editar), que lo referencian por id.
const KINDS_LIST_ID = "shop-kinds";

function KindsDatalist() {
  return (
    <datalist id={KINDS_LIST_ID}>
      {SHOP_KINDS.map((k) => <option key={k} value={kindLabel(k)} />)}
    </datalist>
  );
}

// El input del tipo. `value` es lo que el DM está tecleando tal cual: la
// normalización a clave se hace AL GUARDAR, no en cada tecla, o pelearía con
// lo que está escribiendo.
function KindInput({ value, onChange, width }: { value: string; onChange: (v: string) => void; width?: number }) {
  return (
    <input
      list={KINDS_LIST_ID}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Tipo (p. ej. Pescadería)"
      title="Elige una sugerencia o escribe el tipo que quieras"
      className={inputCls}
      style={{ color: "var(--color-warm)", ...(width ? { width, flex: "0 0 auto" } : { flex: "0 1 180px" }) }}
    />
  );
}

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
  const [newKind, setNewKind] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);

  async function onCreate() {
    if (!poi || !newName.trim()) return;
    await createShop(poi, newName.trim(), normalizaKind(newKind));
    setNewName("");
    await reload();
  }

  async function onGenerate() {
    if (!poi || busy) return;
    setBusy(true); setMsg(null);
    const kind = normalizaKind(newKind);
    const r = await generarTienda(newName, kind, poi);
    if (r.ok) {
      const id = await createShop(poi, r.data.name, kind);
      if (id != null) await updateShop(id, { greeting: r.data.greeting, npc_prompt: r.data.npc_prompt });
      setNewName("");
      await reload();
    } else {
      setMsg(r.error); setOffline(!!r.offline);
    }
    setBusy(false);
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
            <KindInput value={newKind} onChange={setNewKind} />
            <button onClick={onGenerate} disabled={busy || offline} title="Genera una tienda con tendero IA (usa el nombre como pista, opcional)" className="btn-ghost !py-1.5 !px-3 text-[13px] disabled:opacity-40"><i className={`fas ${busy ? "fa-spinner fa-spin" : "fa-wand-magic-sparkles"} mr-1.5`} />IA</button>
            <button onClick={onCreate} disabled={!newName.trim() || busy} className="btn-gold !py-1.5 !px-3 text-[13px] disabled:opacity-40"><i className="fas fa-plus mr-1.5" />Crear</button>
          </div>
          {msg && <p className="text-[12px] italic" style={{ color: "var(--color-ember)" }}>{msg}</p>}

          {!ready ? <p className="text-sm italic" style={{ color: "var(--color-dim)" }}>Cargando…</p>
            : shops.length === 0 ? <p className="text-sm italic" style={{ color: "var(--color-dim)" }}>Sin tiendas en {poi}.</p>
            : shops.map((s) => <ShopEditor key={s.id} shop={s} onChange={reload} />)}
        </>
      )}
      {/* Va el último a propósito: `space-y-5` da margen a todo hijo menos al
          primero, y un `<datalist>` es `display:none` — de primero empujaría al
          siguiente bloque. Los dos inputs lo alcanzan igual, por id. */}
      <KindsDatalist />
    </div>
  );
}

function ShopEditor({ shop, onChange }: { shop: Shop; onChange: () => void }) {
  const [name, setName] = useState(shop.name);
  const [kind, setKind] = useState(shop.kind);
  const [prompt, setPrompt] = useState(shop.npc_prompt);
  const [greeting, setGreeting] = useState(shop.greeting);
  const [it, setIt] = useState({ name: "", price: "0", stock: "" });

  // La clave se calcula aquí y no en cada tecla: normalizar mientras el DM
  // escribe le cambiaría el texto debajo de los dedos.
  const kindKey = normalizaKind(kind);
  const tienePlantilla = !!SHOP_TEMPLATES[kindKey];

  async function saveMeta() { await updateShop(shop.id, { name: name.trim() || "Tienda", kind: kindKey, npc_prompt: prompt, greeting }); await onChange(); }
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
        <KindInput value={kind} onChange={setKind} width={180} />
        {/* Un tipo escrito a mano no trae plantilla. El botón se deshabilita
            DICIENDO por qué: si no, `seedCatalog` saldría sin hacer nada y el
            DM no sabría si el fallo es suyo o de la app. */}
        <button
          onClick={() => seedCatalog(shop.id, kindKey).then(onChange)}
          disabled={!tienePlantilla}
          className="btn-ghost !py-1.5 !px-3 text-[12px] disabled:opacity-40"
          title={tienePlantilla
            ? `Rellenar catálogo con la plantilla de «${kindLabel(kindKey)}»`
            : "Este tipo no trae plantilla: añade los objetos a mano"}
        ><i className="fas fa-seedling mr-1.5" />Semilla</button>
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
