"use client";
import { useEffect, useRef, useState } from "react";
import { useSession } from "@/components/SessionProvider";
import { useShops, type Shop, type ShopItem } from "@/lib/useShops";
import { buy, sell, type ShopChar } from "@/lib/shopTx";
import { loadActiveCharacter, type Item } from "@/lib/character";
import { narrar, type Msg } from "@/lib/narrador";

export default function ShopSection({ poiName, ambient }: { poiName: string; ambient?: string }) {
  const session = useSession();
  const { shops, ready } = useShops(poiName);
  const [openId, setOpenId] = useState<number | null>(null);
  const [char, setChar] = useState<ShopChar | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let on = true;
    (async () => {
      if (!session?.id) return;
      const c = await loadActiveCharacter(session.id);
      if (on) setChar(c ? { id: c.id, gold: c.gold ?? 0, items: (c.items ?? []) as Item[] } : null);
    })();
    return () => { on = false; };
  }, [session?.id]);

  if (!ready || shops.length === 0) return null; // sin tiendas: nada que mostrar
  const open = shops.find((s) => s.id === openId) ?? null;

  async function doBuy(item: ShopItem) {
    if (!char) { setMsg("No tienes una ficha en juego."); return; }
    const r = await buy(char, item);
    if (r.ok) { setChar({ ...char, gold: r.gold, items: r.items }); setMsg(`Compraste ${item.name} por ${item.price} po.`); }
    else setMsg(r.error);
  }
  async function doSell(shop: Shop, name: string, basePrice: number) {
    if (!char) { setMsg("No tienes una ficha en juego."); return; }
    const r = await sell(char, shop.id, name, basePrice);
    if (r.ok) { setChar({ ...char, gold: r.gold, items: r.items }); setMsg(`Vendiste ${name} por ${Math.floor(basePrice / 2)} po.`); }
    else setMsg(r.error);
  }

  return (
    <section className="mt-6">
      <p className="eyebrow mb-2"><i className="fas fa-store mr-2" style={{ color: "var(--color-bronze)" }} />Tiendas{char ? <span className="ml-2" style={{ color: "var(--color-bronze-bright)" }}>· {char.gold} po</span> : null}</p>

      {!open ? (
        <div className="grid sm:grid-cols-2 gap-2">
          {shops.map((s) => (
            <button key={s.id} onClick={() => setOpenId(s.id)} className="panel-raised p-3 text-left hover:border-[var(--color-bronze)] transition-colors">
              <p className="font-display font-extrabold text-[15px]" style={{ color: "var(--color-parch)" }}>{s.name}</p>
              <p className="font-ui text-[12px]" style={{ color: "var(--color-dim)" }}>{s.kind} · {s.items.length} objetos</p>
            </button>
          ))}
        </div>
      ) : (
        <div className="panel-raised p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-display font-extrabold text-[17px] gold-text">{open.name}</p>
            <button onClick={() => { setOpenId(null); setMsg(null); }} className="btn-ghost !py-1 !px-2 text-[12px]"><i className="fas fa-arrow-left mr-1" />Volver</button>
          </div>
          {open.greeting && <p className="font-body text-[14px] italic" style={{ color: "var(--color-muted)" }}>“{open.greeting}”</p>}
          {msg && <p className="font-ui text-[12px]" style={{ color: "var(--color-bronze-bright)" }}>{msg}</p>}

          {/* Catálogo */}
          <div className="space-y-1.5">
            <p className="eyebrow !text-[9px]">Catálogo</p>
            {open.items.length === 0 && <p className="text-sm italic" style={{ color: "var(--color-dim)" }}>Sin género.</p>}
            {open.items.map((it) => {
              const noStock = it.stock !== null && it.stock <= 0;
              const noGold = !char || char.gold < it.price;
              return (
                <div key={it.id} className="flex items-center gap-2">
                  <span className="font-ui text-[13px] flex-1 min-w-0 truncate" style={{ color: "var(--color-warm)" }}>{it.name}</span>
                  <span className="font-ui text-[12px]" style={{ color: "var(--color-dim)" }}>{it.stock === null ? "∞" : it.stock}</span>
                  <span className="font-ui text-[13px] font-bold w-16 text-right" style={{ color: "var(--color-bronze-bright)" }}>{it.price} po</span>
                  <button onClick={() => doBuy(it)} disabled={noStock || noGold} title={noStock ? "Sin existencias" : noGold ? "Sin oro" : "Comprar"} className="btn-gold !py-1 !px-2.5 text-[12px] disabled:opacity-40"><i className="fas fa-coins" /></button>
                </div>
              );
            })}
          </div>

          {/* Vender: objetos del jugador que la tienda compra (por nombre) */}
          {char && char.items.length > 0 && (
            <div className="space-y-1.5">
              <p className="eyebrow !text-[9px]">Vender (mitad de precio)</p>
              {char.items.map((pi) => {
                const cat = open.items.find((c) => c.name === pi.name);
                if (!cat) return null;
                return (
                  <div key={pi.id} className="flex items-center gap-2">
                    <span className="font-ui text-[13px] flex-1 min-w-0 truncate" style={{ color: "var(--color-warm)" }}>{pi.name} ×{pi.qty}</span>
                    <span className="font-ui text-[13px] font-bold w-16 text-right" style={{ color: "var(--color-primitivo)" }}>{Math.floor(cat.price / 2)} po</span>
                    <button onClick={() => doSell(open, pi.name, cat.price)} className="btn-ghost !py-1 !px-2.5 text-[12px]"><i className="fas fa-hand-holding-dollar" /></button>
                  </div>
                );
              })}
            </div>
          )}

          <Shopkeeper shop={open} ambient={ambient} />
        </div>
      )}
    </section>
  );
}

// Chat del tendero: reusa la IA con el prompt del NPC + el catálogo inyectado.
function Shopkeeper({ shop, ambient }: { shop: Shop; ambient?: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const persona = `${shop.npc_prompt || `Eres el tendero de "${shop.name}", una tienda de tipo ${shop.kind}.`}\nCatálogo (nombre — precio po): ${shop.items.map((i) => `${i.name} — ${i.price}`).join("; ") || "vacío"}. Atiende con brevedad y en personaje; no inventes precios fuera del catálogo.${ambient ? `\n${ambient}` : ""}`;

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next); setInput(""); setLoading(true);
    const r = await narrar({ messages: next, persona });
    if (r.ok) setMessages((m) => [...m, { role: "assistant", content: r.reply || "…" }]);
    else setMessages((m) => [...m, { role: "assistant", content: "(El tendero está ocupado ahora mismo.)" }]);
    setLoading(false);
  }

  if (!open) return <button onClick={() => setOpen(true)} className="btn-ghost !py-1.5 !px-3 text-[12px]"><i className="fas fa-comments mr-1.5" />Hablar con el tendero</button>;
  return (
    <div className="space-y-2">
      <div className="max-h-[220px] overflow-y-auto flex flex-col gap-2 pr-1">
        {messages.length === 0 && <p className="text-sm italic" style={{ color: "var(--color-dim)" }}>Salúdale o pregúntale qué recomienda.</p>}
        {messages.map((m, i) => (
          <div key={i} className={`max-w-[85%] px-3 py-2 rounded-2xl ${m.role === "user" ? "self-end" : "self-start"}`} style={{ background: m.role === "user" ? "var(--color-raised)" : "var(--color-night)", border: "1px solid var(--color-line)" }}>
            <p className="font-body text-[14px] whitespace-pre-wrap" style={{ color: "var(--color-warm)" }}>{m.content}</p>
          </div>
        ))}
        {loading && <p className="pulse font-ui text-[12px] self-start" style={{ color: "var(--color-muted)" }}>El tendero piensa…</p>}
        <div ref={endRef} />
      </div>
      <div className="flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); send(); } }} placeholder="Escribe…" disabled={loading}
          className="flex-1 bg-[var(--color-night)] rounded-lg px-3 py-2 font-body text-[14px] outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)]" style={{ color: "var(--color-warm)" }} />
        <button onClick={send} disabled={loading || !input.trim()} className="btn-gold !px-3"><i className="fas fa-paper-plane" /></button>
      </div>
    </div>
  );
}
