import type { SubclassFeature } from "../types";
import { BARBARO_SUBCLASSES } from "./barbaro";

// slug de clase → nombre de subclase → rasgos por nivel. Las clases 2-13 se
// añaden aquí a medida que se transcriben.
export const SUBCLASS_FEATURES: Record<string, Record<string, SubclassFeature[]>> = {
  barbaro: BARBARO_SUBCLASSES,
};

export function subclassFeaturesFor(slug: string, subclase: string | null): SubclassFeature[] {
  if (!subclase) return [];
  return SUBCLASS_FEATURES[slug]?.[subclase] ?? [];
}
