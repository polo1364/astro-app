import { AstroTerm } from "@/components/ui/AstroTerm";
import { PlainHint } from "@/components/ui/PlainHint";
import type { ElementStat } from "@/lib/mock/natal";
import { plainElementLine } from "@/lib/data/plainLanguage";
import { colors } from "@/lib/tokens/colors";

const elementColors: Record<string, string> = {
  火: colors.element.fire,
  土: colors.element.earth,
  風: colors.element.air,
  水: colors.element.water,
};

export function ElementStats({ elements }: { elements: ElementStat[] }) {
  return (
    <div className="space-y-4">
      {elements.map((el) => (
        <div key={el.element} className="space-y-1.5">
          <div className="flex items-center gap-3">
            <span className="text-body w-8 font-semibold" style={{ color: elementColors[el.element] }}>
              <AstroTerm term={el.element}>{el.element}</AstroTerm>
            </span>
            <div className="flex-1 h-2 rounded-full bg-white/8 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${el.percent}%`,
                  backgroundColor: elementColors[el.element] ?? "#a8a3b8",
                }}
              />
            </div>
            <span
              className="text-body tabular-nums w-10 text-right font-medium"
              style={{ color: elementColors[el.element] }}
            >
              {el.percent}%
            </span>
          </div>
          <PlainHint className="ml-11">{plainElementLine(el.element, el.percent)}</PlainHint>
        </div>
      ))}
    </div>
  );
}
