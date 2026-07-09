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
import { MONJE } from "./monje";
import { PALADIN } from "./paladin";
import { PICARO } from "./picaro";
import { CAZADOR_DE_SANGRE } from "./cazador-de-sangre";

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
  monje: MONJE,
  paladin: PALADIN,
  picaro: PICARO,
  "cazador-de-sangre": CAZADOR_DE_SANGRE,
};
export function getMechanics(slug: string | null | undefined): ClassMechanics | null {
  return (slug ? CLASS_MECHANICS[slug] : null) ?? null;
}
export type { ClassMechanics, ClassFeature, CasterKind } from "./types";
