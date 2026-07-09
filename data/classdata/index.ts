import type { ClassMechanics } from "./types";
import { BARBARO } from "./barbaro";
import { BARDO } from "./bardo";
import { BRUJO } from "./brujo";
import { CLERIGO } from "./clerigo";
import { DRUIDA } from "./druida";

export const CLASS_MECHANICS: Partial<Record<string, ClassMechanics>> = {
  barbaro: BARBARO,
  bardo: BARDO,
  brujo: BRUJO,
  clerigo: CLERIGO,
  druida: DRUIDA,
};
export function getMechanics(slug: string | null | undefined): ClassMechanics | null {
  return (slug ? CLASS_MECHANICS[slug] : null) ?? null;
}
export type { ClassMechanics, ClassFeature, CasterKind } from "./types";
