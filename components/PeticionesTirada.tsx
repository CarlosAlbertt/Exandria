"use client";

import { useMemo, useState } from "react";
import { useSession } from "@/components/SessionProvider";
import { useRollRequests } from "@/lib/useRollRequests";
import { publishRoll } from "@/lib/useDiceFeed";

/**
 * Lo que el DM te ha pedido tirar, encima de cualquier pantalla.
 *
 * **Por qué existe**: hasta ahora las peticiones solo se veían dentro de «Dados
 * del grupo», al final de `/personaje`. Al quitar esa sección se habrían quedado
 * sin ningún sitio donde verse —`useRollRequests` no tenía otro consumidor del
 * lado del jugador—, pero mudarlas aquí no es solo un traslado: antes había que
 * estar en la ficha para enterarse de que te habían pedido algo. Ahora el aviso
 * te encuentra donde estés.
 *
 * Va en el layout, así que se monta en **todas** las páginas. Cuando no hay nada
 * pedido no pinta nada, ni ocupa, ni tapa.
 */
export default function PeticionesTirada() {
  const session = useSession();
  const myId = session?.id ?? "";
  const { requests } = useRollRequests();

  // Las que ya has respondido en esta sesión. La petición sigue ABIERTA para el
  // resto del grupo —una tirada de grupo se le pide a todos—, así que cerrarla
  // no es lo correcto; lo que se recuerda es que TÚ ya has tirado, para no
  // dejarte el aviso puesto delante hasta que el DM la cierre.
  const [respondidas, setRespondidas] = useState<number[]>([]);
  const [busy, setBusy] = useState<number | null>(null);

  // Solo lo dirigido al grupo (target null) o a mí.
  const mias = useMemo(
    () => requests.filter((r) => (r.target === null || r.target === myId) && !respondidas.includes(r.id)),
    [requests, myId, respondidas],
  );

  async function responder(id: number, label: string, formula: string) {
    if (!myId || busy !== null) return;
    setBusy(id);
    // Mismo camino que usaba el panel de dados: la tirada se publica al feed
    // ligada a la petición (`requestId`), que es lo que deja al DM ver quién ha
    // respondido a qué. Sin la opción de tirada privada: el panel de dados la
    // tenía porque el DM tira a escondidas, pero responder a una petición es
    // justo lo contrario, la mesa tiene que ver el resultado.
    await publishRoll(myId, "requested", label, formula, { requestId: id });
    setRespondidas((prev) => [...prev, id]);
    setBusy(null);
  }

  if (!myId || mias.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] w-[min(92vw,26rem)] space-y-2">
      {mias.map((r) => (
        <div
          key={r.id}
          className="panel-raised px-4 py-3 flex items-center justify-between gap-3 dice-entry"
          style={{ borderColor: "var(--color-bronze)" }}
        >
          <div className="min-w-0">
            <p className="eyebrow !text-[9px] mb-0.5">El DM pide una tirada</p>
            <p className="font-ui text-[13px] font-bold truncate" style={{ color: "var(--color-bronze-bright)" }}>
              {r.label}
            </p>
            <p className="font-ui text-[11px]" style={{ color: "var(--color-muted)" }}>{r.formula}</p>
          </div>
          <button
            className="btn-gold shrink-0 !py-1.5 !px-3 text-[12px] disabled:opacity-40"
            onClick={() => responder(r.id, r.label, r.formula)}
            disabled={busy === r.id}
          >
            <i className="fas fa-dice-d20 mr-1.5" />
            {busy === r.id ? "…" : "Tirar"}
          </button>
        </div>
      ))}
    </div>
  );
}
