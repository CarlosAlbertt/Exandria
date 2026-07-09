import type { ClassMechanics } from "./types";
import { BARBARO } from "./barbaro";
import { BARDO } from "./bardo";
import { BRUJO } from "./brujo";
import { CLERIGO } from "./clerigo";
import { DRUIDA } from "./druida";
import { EXPLORADOR } from "./explorador";
import { GUERRERO } from "./guerrero";
import { HECHICERO } from "./hechicero";
import { MAGO } from "./mago";

export const CLASS_MECHANICS: Partial<Record<string, ClassMechanics>> = {
  barbaro: BARBARO,
  bardo: BARDO,
  brujo: BRUJO,
  clerigo: CLERIGO,
  druida: DRUIDA,
  explorador: EXPLORADOR,
  guerrero: GUERRERO,
  hechicero: HECHICERO,
  mago: MAGO,
};
export function getMechanics(slug: string | null | undefined): ClassMechanics | null {
  return (slug ? CLASS_MECHANICS[slug] : null) ?? null;
}
export type { ClassMechanics, ClassFeature, CasterKind } from "./types";
