"use client";

import { useEffect, useState } from "react";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import { narrar } from "@/lib/narrador";

// El DM pega aquí la URL del túnel (cloudflared) tras cada arranque. Se guarda
// en app_config y /api/ia la usa: sin tocar Vercel ni redeploy.
export default function AiConfigPanel() {
  const [url, setUrl] = useState("");
  const [saved, setSaved] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!supabaseConfigured) return;
    createClient().from("app_config").select("value").eq("key", "ollama_host").maybeSingle()
      .then(({ data }) => { const v = data?.value ?? ""; setUrl(v); setSaved(v); });
  }, []);

  async function save() {
    setBusy(true); setMsg(null);
    const value = url.trim().replace(/\/+$/, "");
    const { error } = await createClient().from("app_config").upsert({ key: "ollama_host", value, updated_at: new Date().toISOString() });
    setBusy(false);
    if (error) setMsg({ ok: false, text: error.message });
    else { setSaved(value); setMsg({ ok: true, text: "Guardado. Ya lo usan todos, sin redeploy." }); }
  }

  async function test() {
    setBusy(true); setMsg(null);
    const r = await narrar({ messages: [{ role: "user", content: "Responde solo: OK" }] });
    setBusy(false);
    setMsg(r.ok ? { ok: true, text: `IA responde: ${r.reply.slice(0, 60)}` } : { ok: false, text: r.error });
  }

  const dirty = url.trim().replace(/\/+$/, "") !== (saved ?? "");

  return (
    <div className="panel p-5 mb-6" style={{ borderColor: "color-mix(in srgb, var(--color-arcane) 30%, var(--color-line))" }}>
      <p className="eyebrow mb-1"><i className="fas fa-plug mr-1.5" style={{ color: "var(--color-arcane)" }} />Servidor de IA (túnel)</p>
      <p className="text-[13px] mb-3" style={{ color: "var(--color-muted)" }}>
        Pega aquí la URL de cloudflared tras cada arranque. Se guarda para todos; no hay que tocar Vercel.
      </p>
      <div className="flex gap-2 flex-wrap">
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://algo-algo.trycloudflare.com"
          className="flex-1 min-w-[220px] bg-[var(--color-night)] rounded-lg px-3 py-2 font-ui text-[13px] outline-none border border-[var(--color-line)] focus:border-[var(--color-arcane)]" style={{ color: "var(--color-warm)" }} />
        <button className="btn-gold !py-2 !px-4 text-[12px]" onClick={save} disabled={busy || !dirty}><i className="fas fa-floppy-disk mr-1.5" />Guardar</button>
        <button className="btn-ghost !py-2 !px-4 text-[12px]" onClick={test} disabled={busy}><i className="fas fa-vial mr-1.5" />Probar</button>
      </div>
      {msg && <p className="text-[12px] mt-2 italic" style={{ color: msg.ok ? "var(--color-primitivo)" : "var(--color-ember)" }}>{msg.text}</p>}
      {saved && !dirty && <p className="text-[11px] mt-2" style={{ color: "var(--color-dim)" }}>Activo: {saved}</p>}
    </div>
  );
}
