"use client";
import { useState } from "react";
import { uploadImage, isStorageConfigured } from "@/lib/storage";

type Props = {
  folder: string;
  filename: string;
  label?: string;
  currentUrl?: string;
  maxWidth?: number;
  onUploaded: (url: string) => void;
};

export default function ImageUpload({ folder, filename, label, currentUrl, maxWidth = 1600, onUploaded }: Props) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [manual, setManual] = useState("");

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true); setErr(null);
    try {
      const url = await uploadImage(folder, filename, file, maxWidth);
      onUploaded(url);
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Error al subir.");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  return (
    <div className="space-y-2">
      {label && <p className="eyebrow">{label}</p>}
      {currentUrl && (
        <div className="flex items-center gap-2">
          <img src={currentUrl} alt="" className="w-16 h-16 object-cover rounded-lg border border-[var(--color-line)]" />
          <button type="button" onClick={() => onUploaded("")} className="btn-ghost !py-1 !px-2 text-[12px]" style={{ color: "var(--color-ember)" }}>
            <i className="fas fa-xmark mr-1" />Quitar
          </button>
        </div>
      )}
      {isStorageConfigured ? (
        <label className="btn-ghost !py-1.5 !px-3 text-[13px] cursor-pointer inline-flex items-center">
          <i className={`fas ${busy ? "fa-spinner fa-spin" : "fa-upload"} mr-1.5`} />
          {busy ? "Subiendo…" : "Subir imagen"}
          <input type="file" accept="image/*" onChange={onPick} disabled={busy} className="hidden" />
        </label>
      ) : (
        <div className="flex gap-2">
          <input value={manual} onChange={(e) => setManual(e.target.value)} placeholder="Pega una URL de imagen"
            className="flex-1 bg-[var(--color-night)] rounded-lg px-3 py-1.5 font-ui text-[12px] border border-[var(--color-line)]" style={{ color: "var(--color-warm)" }} />
          <button type="button" onClick={() => manual.trim() && onUploaded(manual.trim())} className="btn-gold !py-1.5 !px-3 text-[12px]">Guardar</button>
        </div>
      )}
      {err && <p className="text-[12px]" style={{ color: "var(--color-ember)" }}><i className="fas fa-circle-info mr-1" />{err}</p>}
    </div>
  );
}
