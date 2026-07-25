"use client";

import { useEffect, useState } from "react";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import { roll, d20Check, type RollResult } from "@/lib/dice";
import { rollVisual } from "@/lib/diceBox";

// Refleja el check constraint de dice_rolls.kind en la BD (schema_v11).
export type RollKind = "ability" | "save" | "skill" | "attack" | "custom" | "requested";

export type DiceRoll = {
  id: number;
  user_id: string;
  kind: RollKind;
  label: string;
  formula: string;
  rolls: number[];
  total: number;
  private: boolean;
  request_id: number | null;
  created_at: string;
};

const DICE_FIELDS = "id, user_id, kind, label, formula, rolls, total, private, request_id, created_at";

// Tipos de tirada que usan d20Check con modificador (el resto tira la fórmula).
const D20_KINDS: RollKind[] = ["ability", "save", "skill", "attack"];

// Feed de tiradas del grupo: últimas 50, más reciente primero. Las tiradas
// privadas ya llegan filtradas por RLS (autor o DM). Los DELETE del DM
// quitan cada fila por id (un borrado masivo emite un evento por fila).
export function useDiceFeed() {
  const [rolls, setRolls] = useState<DiceRoll[]>([]);
  const [ready, setReady] = useState(() => !supabaseConfigured);

  useEffect(() => {
    if (!supabaseConfigured) return;
    const supabase = createClient();
    let mounted = true;

    supabase
      .from("dice_rolls")
      .select(DICE_FIELDS)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (!mounted) return;
        if (data) setRolls(data as DiceRoll[]);
        setReady(true);
      });

    const ch = supabase
      .channel(`dice_rolls_rt_${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "dice_rolls" }, (p) => {
        const r = p.new as DiceRoll;
        setRolls((prev) => (prev.some((x) => x.id === r.id) ? prev : [r, ...prev].slice(0, 50)));
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "dice_rolls" }, (p) => {
        const old = p.old as { id?: number };
        if (old?.id != null) setRolls((prev) => prev.filter((x) => x.id !== old.id));
      })
      .subscribe();

    return () => { mounted = false; supabase.removeChannel(ch); };
  }, []);

  return { rolls, ready };
}

// Inserta en la BD una tirada YA resuelta (por la física o por el fallback).
async function publishRollResult(
  userId: string,
  kind: RollKind,
  label: string,
  result: RollResult,
  opts?: { priv?: boolean; requestId?: number }
): Promise<{ error: string | null; result: RollResult }> {
  const { error } = await createClient().from("dice_rolls").insert({
    user_id: userId,
    kind,
    label,
    formula: result.formula,
    rolls: result.rolls,
    total: result.total,
    private: opts?.priv ?? false,
    request_id: opts?.requestId ?? null,
  });
  return { error: error?.message ?? null, result };
}

// Publica una tirada. Anima con el tablero físico si está disponible y
// construye el resultado con las caras que se vieron; si no, cae al roll()/
// d20Check() aleatorio de siempre. Rechaza fórmulas inválidas sin tocar la BD.
export async function publishRoll(
  userId: string,
  kind: RollKind,
  label: string,
  formula: string,
  opts?: { priv?: boolean; requestId?: number; adv?: "adv" | "dis"; mod?: number }
): Promise<{ error: string | null; result: RollResult | null }> {
  if (!supabaseConfigured) return { error: "Supabase no configurado", result: null };

  const isCheck = D20_KINDS.includes(kind) && typeof opts?.mod === "number";

  // 1) Intento visual (física). null si el tablero no está soportado/listo.
  const visual = isCheck
    ? await rollVisual(formula, { check: true, mod: opts!.mod as number, adv: opts?.adv, label })
    : await rollVisual(formula, { label });

  // 2) Fallback aleatorio, idéntico al comportamiento previo.
  const result = visual ?? (isCheck ? d20Check(opts!.mod as number, opts?.adv) : roll(formula));
  if (!result) return { error: "Fórmula de dado no válida.", result: null };

  return publishRollResult(userId, kind, label, result, { priv: opts?.priv, requestId: opts?.requestId });
}

/**
 * Publica una NOTA en el feed: una fila sin dados (`rolls: []`, `total: 0`) que
 * solo lleva etiqueta. La usa el lanzamiento de conjuros para anunciar «X lanza
 * Bola de Fuego (nivel 3)» sin fingir una tirada. `DicePanel` las pinta sin
 * desglose. Reutilizable por cualquier anuncio futuro.
 */
export async function publishNote(
  userId: string,
  label: string,
  opts?: { priv?: boolean },
): Promise<{ error: string | null }> {
  if (!supabaseConfigured) return { error: "Supabase no configurado" };
  const { error } = await createClient().from("dice_rolls").insert({
    user_id: userId,
    kind: "custom",
    label,
    formula: "",
    rolls: [],
    total: 0,
    private: opts?.priv ?? false,
    request_id: null,
  });
  return { error: error?.message ?? null };
}

/** ¿Esta fila del feed es una nota (anuncio sin dados) y no una tirada? */
export function esNota(r: { rolls: number[]; formula: string }): boolean {
  return r.rolls.length === 0 && r.formula === "";
}
