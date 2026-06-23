import type { ZodiacElement } from "@/lib/data/zodiacSigns";
import { colors } from "@/lib/tokens/colors";

const ELEMENT_COLORS: Record<ZodiacElement, string> = {
  fire: colors.element.fire,
  earth: colors.element.earth,
  air: colors.element.air,
  water: colors.element.water,
};

export function signElementBorderColor(element: ZodiacElement): string {
  return ELEMENT_COLORS[element];
}
