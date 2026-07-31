"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession } from "@/components/SessionProvider";
import { useInventarioVivo } from "@/lib/useInventarioVivo";
import { devolver, huecosDe, huecosUsados, quitarUno } from "@/lib/inventario";
import { CATALOG, type ItemCat } from "@/data/equipment";
import Paperdoll from "@/components/Paperdoll";
import BolsaAgrupada from "@/components/inventario/BolsaAgrupada";
import DetalleObjeto from "@/components/inventario/DetalleObjeto";
import VitalesEquipo from "@/components/inventario/VitalesEquipo";
import { getSpecies } from "@/data/species";
import { getMechanics } from "@/data/classdata";
import { armaDe } from "@/data/weapons";
import { ataqueDe } from "@/lib/ataque";
import { fmtMod } from "@/data/rules";
import type { Item } from "@/lib/character";

/**
 * La pantalla del inventario: el muñeco con lo que llevas puesto a la
 * izquierda, la bolsa a la derecha y el detalle del objeto elegido debajo de
 * ella.
 *
 * En el móvil las dos columnas se apilan y el muñeco queda ARRIBA, que es el
 * orden del DOM: media mesa juega desde el teléfono y lo primero que se mira
 * es qué llevas encima. La rejilla se ESTRECHA, no se recoloca: así el DM en
 * su portátil y un jugador en el móvil ven la misma pantalla y pueden
 * señalarse cosas por voz sin traducir posiciones.
 */
function InventarioInner() {
  const session = useSession();
  const role = session?.role ?? "player";
  const wantUser = useSearchParams().get("user");

  // El DM abre la bolsa de otro jugador con ?user=<id>, igual que la hoja
  // (/personaje?user=). Cualquier otro caso es tu propia bolsa.
  const comoDm = role === "dm" && !!wantUser;
  const targetUserId = comoDm ? wantUser : session?.id ?? null;
  const inv = useInventarioVivo(targetUserId, comoDm ? "dm" : "self");

  // PERMISOS (decididos con el usuario, no deducidos aquí):
  //  · Ponerte y quitarte cosas, y anotarlas, es TUYO: eres el dueño de la
  //    ficha (o el DM, que puede tocar cualquiera). Que la hoja de /personaje
  //    sea de solo lectura para el jugador no tiene que ver: allí se editan
  //    los NÚMEROS del personaje, aquí solo se decide qué te pones.
  //  · Lo que HAY en la bolsa lo controla el DM: soltar, cantidades y añadir
  //    son suyos. Un jugador no se regala una poción ni tira el mcguffin.
  const esDueño = !!session && !!targetUserId && session.id === targetUserId;
  const puedeEquipar = esDueño || role === "dm";
  const puedeEditarContenido = role === "dm";

  // Solo el id: el objeto se vuelve a buscar en la bolsa VIVA en cada pintado,
  // así que si el DM se lo lleva (o baja la cantidad) el detalle se cierra o se
  // actualiza solo, sin quedarse enseñando una copia muerta.
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(null);
  const seleccionado = inv.items.find((i) => i.id === seleccionadoId) ?? null;

  const usados = useMemo(() => huecosUsados(inv.items), [inv.items]);
  const capacidad = huecosDe(inv.mods.fue);
  const lleno = usados >= capacidad;

  // Lo que el DM está escribiendo para dar a mano, y la pestaña del catálogo.
  const [nuevo, setNuevo] = useState("");
  const [cat, setCat] = useState<ItemCat>("Aventura");

  /* --- equipar / retirar / soltar / anotar ------------------------------- */

  // Mismo trato que `equipInto` en la hoja: el objeto SALE de la bolsa y, si el
  // hueco estaba ocupado, el anterior VUELVE a ella. Nunca se pierde nada.
  const onEquipar = (item: Item, slotId: string) => {
    if (!puedeEquipar) return;
    const anterior = inv.equipment[slotId];
    inv.setItems((prev) => {
      let next = quitarUno(prev, item.id);
      if (anterior) next = devolver(next, anterior);
      return next;
    });
    inv.setEquipment((prev) => ({
      ...prev,
      [slotId]: { id: item.id, name: item.name, qty: 1, notes: item.notes },
    }));
  };

  // Clic en un hueco del muñeco. Lleno = retirar. Vacío no hace nada a
  // propósito: aquí se equipa desde el detalle del objeto (que ya sabe a qué
  // hueco va cada cosa), no con el modo «elige hueco y luego objeto» de la
  // hoja, que obliga a recordar qué habías pulsado.
  const onSlotClick = (slotId: string) => {
    if (!puedeEquipar) return;
    const puesto = inv.equipment[slotId];
    if (!puesto) return;
    inv.setItems((prev) => devolver(prev, puesto));
    inv.setEquipment((prev) => {
      const next = { ...prev };
      delete next[slotId];
      return next;
    });
  };

  const onSoltar = (item: Item) => {
    if (!puedeEditarContenido) return;
    inv.setItems((prev) => quitarUno(prev, item.id));
  };

  const onNotas = (item: Item, notas: string) => {
    if (!puedeEquipar) return;
    inv.setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, notes: notas } : i)));
  };

  // DAR UN OBJETO. Venía de la hoja (`addItem` en CharacterSheet), con sus dos
  // reglas intactas: se fusiona por NOMBRE EXACTO subiendo `qty` —lo mismo que
  // hace `devolver`, y de ahí que dos dagas sean una entrada `×2`— y no se
  // añade nada con la bolsa llena. Aquí solo lo ve el DM: en la hoja este
  // formulario salía con `!readOnly`, que también incluía al DM mirando su
  // propia hoja, pero el reparto de botín es suyo en las dos pantallas.
  const onAñadir = (nombre: string) => {
    if (!puedeEditarContenido) return;
    const n = nombre.trim();
    if (!n || lleno) return;
    inv.setItems((prev) => {
      const idx = prev.findIndex((i) => i.name === n);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return next;
      }
      return [...prev, { id: crypto.randomUUID(), name: n, qty: 1 }];
    });
  };

  /* --- vitales ----------------------------------------------------------- */

  // Impacto y daño del arma que llevas en la mano principal. `derive()` no los
  // da (no sabe de armas), pero `ataqueDe` sí y ya está comprobado por
  // scripts/check-ataque.ts: aquí no se calcula ni un número a mano. Sin arma
  // equipada —o con un arma que no está en la tabla, como un mandoble rúnico
  // regalado por el DM— no hay tiles extra y la fila enseña solo la CA.
  const extras = useMemo(() => {
    const principal = inv.equipment.arma_principal;
    const arma = principal ? armaDe(principal.name) : null;
    if (!arma) return [];
    const atk = ataqueDe(
      arma,
      { fue: inv.mods.fue, des: inv.mods.des },
      inv.derived.prof,
      getMechanics(inv.character?.cls)?.weapons ?? [],
    );
    return [
      { label: "Impacto", value: fmtMod(atk.modImpacto) },
      { label: "Daño", value: `${atk.dadoDaño}${atk.modDaño !== 0 ? fmtMod(atk.modDaño) : ""}` },
    ];
  }, [inv.equipment, inv.mods, inv.derived.prof, inv.character?.cls]);

  const especie = inv.character?.species ? getSpecies(inv.character.species) : undefined;
  const nombre = inv.character?.name?.trim() || "Personaje sin nombre";

  /* --- los estados ------------------------------------------------------- */

  if (!inv.ready) {
    return (
      <p className="text-center text-sm py-16" style={{ color: "var(--color-dim)" }}>
        Abriendo la bolsa…
      </p>
    );
  }

  // NO HAY PERSONAJE. No se dice «no se pudo cargar»: `loadActiveCharacter`
  // devuelve `null` tanto si la consulta falló como si simplemente no tienes
  // ficha en juego, y el segundo caso es el común. Afirmarle un fallo a quien
  // solo tiene la cuenta recién hecha es exactamente el error que costó la
  // migración de reparación del 2026-07-22; el detalle real de un fallo de
  // carga lo deja `loadActiveCharacter` en la consola del navegador.
  if (!inv.characterId) {
    return (
      <div className="panel p-8 text-center max-w-md mx-auto">
        <i className="fas fa-sack-xmark text-3xl mb-3" style={{ color: "var(--color-dim)" }} />
        <p className="font-ui text-[14px] mb-4" style={{ color: "var(--color-muted)" }}>
          {comoDm ? "Ese jugador no tiene un personaje en juego." : "No tienes un personaje en juego."}
        </p>
        {/* Solo en la bolsa propia: al DM mirando a otro jugador no se le
            ofrece crearle la ficha desde aquí — /crear crea la SUYA. */}
        {!comoDm && (
          <Link href="/crear" className="btn-gold !py-1.5 !px-4 text-[13px]">
            <i className="fas fa-hat-wizard mr-1.5" />Crear personaje
          </Link>
        )}
      </div>
    );
  }

  return (
    <>
      <header className="flex items-center justify-between gap-3 flex-wrap mb-5">
        <div className="min-w-0">
          <p className="eyebrow mb-1">
            <i className="fas fa-sack-dollar mr-1.5" style={{ color: "var(--color-bronze)" }} />
            Bolsa y equipo
          </p>
          <h1 className="font-display text-3xl md:text-4xl font-extrabold gold-text truncate">{nombre}</h1>
        </div>
        <Link href={comoDm ? `/personaje?user=${wantUser}` : "/personaje"} className="btn-ghost !py-1.5 !px-3 text-[13px] shrink-0">
          <i className="fas fa-scroll mr-1.5" />Ver la hoja
        </Link>
      </header>

      {/* El error que el hook sabe NOMBRAR es el del guardado, y llega con la
          bolsa ya en pantalla. Va como aviso encima y no como pantalla
          completa: esconder la bolsa justo cuando no se está guardando deja al
          jugador sin ver lo único que le importa mirar. */}
      {inv.error && (
        <p className="panel p-3 mb-4 font-ui text-[13px] font-semibold text-center" style={{ color: "var(--color-ember)" }}>
          <i className="fas fa-circle-exclamation mr-1.5" />{inv.error}
        </p>
      )}

      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-5 items-start">
        <div className="min-w-0">
          <Paperdoll
            equipment={inv.equipment}
            mods={inv.mods}
            portrait={especie ? `/species/${especie.slug}.jpg` : undefined}
            portraitAlt={nombre}
            onSlotClick={onSlotClick}
            pie={
              <div className="mt-4">
                <VitalesEquipo
                  ac={inv.derived.ac}
                  acSource={inv.derived.acSource}
                  modFuerza={inv.mods.fue}
                  usados={usados}
                  extras={extras}
                />
              </div>
            }
          />
          {puedeEquipar && Object.keys(inv.equipment).length > 0 && (
            <p className="font-ui text-[11px] italic text-center mt-2" style={{ color: "var(--color-dim)" }}>
              Toca algo que lleves puesto para guardarlo en la bolsa.
            </p>
          )}
        </div>

        <div className="panel p-5 min-w-0">
          <p className="eyebrow mb-3">
            <i className="fas fa-bag-shopping mr-1.5" style={{ color: "var(--color-bronze)" }} />
            La bolsa
          </p>
          <BolsaAgrupada items={inv.items} seleccionado={seleccionadoId} onSelect={(it) => setSeleccionadoId(it.id)} />
          {seleccionado && (
            <DetalleObjeto
              item={seleccionado}
              equipment={inv.equipment}
              mods={inv.mods}
              puedeEquipar={puedeEquipar}
              puedeEditarContenido={puedeEditarContenido}
              onEquipar={onEquipar}
              onSoltar={onSoltar}
              onNotas={onNotas}
              onCerrar={() => setSeleccionadoId(null)}
            />
          )}

          {/* DAR UN OBJETO (solo el DM). Va al final del panel de la bolsa, no
              arriba: lo que se consulta cien veces por sesión es lo que hay
              dentro; repartir botín pasa una vez cada tanto. */}
          {puedeEditarContenido && (
            <div className="mt-5 pt-4" style={{ borderTop: "1px solid var(--color-line)" }}>
              <p className="eyebrow mb-3">
                <i className="fas fa-hand-holding-heart mr-1.5" style={{ color: "var(--color-bronze)" }} />
                Dar un objeto
              </p>

              {/* El motivo de que no se pueda, dicho: sin esto los chips se
                  quedan grises y no hay forma de saber por qué. */}
              {lleno && (
                <p className="font-ui text-[12px] italic mb-3" style={{ color: "var(--color-ember)" }}>
                  <i className="fas fa-circle-exclamation mr-1.5" />
                  La bolsa está llena ({usados} de {capacidad} huecos). Sube la Fuerza del personaje para ampliarla, o suelta algo primero.
                </p>
              )}

              <div className="flex gap-2 mb-3">
                <input
                  value={nuevo}
                  onChange={(e) => setNuevo(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { onAñadir(nuevo); setNuevo(""); } }}
                  placeholder="Objeto personalizado…"
                  className="flex-1 min-w-0 bg-[var(--color-night)] rounded-lg px-3 py-2 font-ui text-[13px] outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)] transition-colors"
                  style={{ color: "var(--color-warm)" }}
                />
                <button
                  type="button"
                  className="stat-btn !w-9 !h-9 shrink-0"
                  onClick={() => { onAñadir(nuevo); setNuevo(""); }}
                  disabled={lleno || !nuevo.trim()}
                >
                  +
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-3">
                {(Object.keys(CATALOG) as ItemCat[]).map((c) => (
                  <button key={c} type="button" className="chip" data-on={cat === c} onClick={() => setCat(c)}>{c}</button>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {CATALOG[cat].map((it) => (
                  <button
                    key={it}
                    type="button"
                    onClick={() => onAñadir(it)}
                    disabled={lleno}
                    className="chip disabled:opacity-40"
                    title={lleno ? "La bolsa está llena" : "Añadir a la bolsa"}
                  >
                    {it} <i className="fas fa-plus text-[9px] ml-0.5" style={{ color: "var(--color-bronze)" }} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function InventarioPage() {
  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* useSearchParams obliga a un límite de Suspense en el App Router (si no,
          la ruta entera se sale del prerenderizado). Mismo montaje que
          /personaje, que lee el mismo ?user=. */}
      <Suspense fallback={null}>
        <InventarioInner />
      </Suspense>
    </main>
  );
}
