"use client";
import { useMemo, useState } from "react";
import { SABER, scopeLabel } from "@/data/saber";

// Selector de entradas de saber (para tomos, misiones y la concesión del DM).
// Con ~60 entradas un <select multiple> es incómodo: aquí va buscador + lista
// con casillas + resumen de lo elegido.

// Marcas diacríticas combinantes: se construye desde string para no meter
// caracteres combinantes sueltos en el fuente.
const DIACRITICS = new RegExp("[̀-ͯ]", "g");
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(DIACRITICS, "");

export default function LorePicker({ value, onChange, label = "Qué enseña" }: {
  value: string[];
  onChange: (ids: string[]) => void;
  label?: string;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const matches = useMemo(() => {
    const needle = norm(q.trim());
    const list = needle
      ? SABER.filter((e) => norm(`${e.title} ${e.topic} ${scopeLabel(e.scope)}`).includes(needle))
      : SABER;
    return list.slice(0, 60);
  }, [q]);

  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);

  return (
    <div>
      <button type="button" onClick={() => setOpen((o) => !o)} className="font-ui text-[12px] font-semibold flex items-center gap-2" style={{ color: "var(--color-arcane-bright)" }}>
        <i className={`fas ${open ? "fa-chevron-down" : "fa-chevron-right"}`} /><i className="fas fa-book" />{label}{value.length ? ` · ${value.length}` : ""}
      </button>

      {open && (
        <div className="panel-raised p-3 mt-2 space-y-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar saber…"
            className="w-full bg-[var(--color-night)] rounded-lg px-3 py-1.5 font-ui text-[13px] outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)]"
            style={{ color: "var(--color-warm)" }} />
          <div className="max-h-[220px] overflow-y-auto space-y-1 pr-1">
            {matches.map((e) => (
              <label key={e.id} className="flex items-start gap-2 cursor-pointer font-ui text-[12px] py-0.5" style={{ color: "var(--color-warm)" }}>
                <input type="checkbox" checked={value.includes(e.id)} onChange={() => toggle(e.id)} className="mt-0.5 accent-[var(--color-bronze)]" />
                <span className="min-w-0">
                  {e.title}
                  <span className="ml-1.5" style={{ color: "var(--color-dim)" }}>· {scopeLabel(e.scope)}</span>
                </span>
              </label>
            ))}
            {matches.length === 0 && <p className="text-[12px] italic" style={{ color: "var(--color-dim)" }}>Nada que coincida.</p>}
          </div>
          {value.length > 0 && (
            <button type="button" onClick={() => onChange([])} className="btn-ghost !py-1 !px-2 text-[11px]">
              <i className="fas fa-xmark mr-1" />Quitar los {value.length}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
