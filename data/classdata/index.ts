import type { ClassMechanics } from "./types";
import { BARBARO } from "./barbaro";

export const CLASS_MECHANICS: Record<string, ClassMechanics> = {
  barbaro: BARBARO,
};
export function getMechanics(slug: string | null | undefined): ClassMechanics | null {
  return (slug && CLASS_MECHANICS[slug]) || null;
}
export type { ClassMechanics, ClassFeature, CasterKind } from "./types";
