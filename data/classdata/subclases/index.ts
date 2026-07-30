import type { SubclassFeature } from "../types";
import { BARBARO_SUBCLASSES } from "./barbaro";
import { BARDO_SUBCLASSES } from "./bardo";
import { CLERIGO_SUBCLASSES } from "./clerigo";
import { DRUIDA_SUBCLASSES } from "./druida";
import { EXPLORADOR_SUBCLASSES } from "./explorador";
import { GUERRERO_SUBCLASSES } from "./guerrero";
import { HECHICERO_SUBCLASSES } from "./hechicero";
import { MAGO_SUBCLASSES } from "./mago";
import { MONJE_SUBCLASSES } from "./monje";
import { PALADIN_SUBCLASSES } from "./paladin";
import { PICARO_SUBCLASSES } from "./picaro";
import { BRUJO_SUBCLASSES } from "./brujo";
import { CAZADOR_DE_SANGRE_SUBCLASSES } from "./cazador-de-sangre";

// slug de clase → nombre de subclase → rasgos por nivel. Las clases 2-13 se
// añaden aquí a medida que se transcriben.
export const SUBCLASS_FEATURES: Record<string, Record<string, SubclassFeature[]>> = {
  barbaro: BARBARO_SUBCLASSES,
  bardo: BARDO_SUBCLASSES,
  clerigo: CLERIGO_SUBCLASSES,
  druida: DRUIDA_SUBCLASSES,
  explorador: EXPLORADOR_SUBCLASSES,
  guerrero: GUERRERO_SUBCLASSES,
  hechicero: HECHICERO_SUBCLASSES,
  mago: MAGO_SUBCLASSES,
  monje: MONJE_SUBCLASSES,
  paladin: PALADIN_SUBCLASSES,
  picaro: PICARO_SUBCLASSES,
  brujo: BRUJO_SUBCLASSES,
  "cazador-de-sangre": CAZADOR_DE_SANGRE_SUBCLASSES,
};

export function subclassFeaturesFor(slug: string, subclase: string | null): SubclassFeature[] {
  if (!subclase) return [];
  return SUBCLASS_FEATURES[slug]?.[subclase] ?? [];
}
