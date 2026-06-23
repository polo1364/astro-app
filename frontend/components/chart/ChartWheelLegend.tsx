import type { Planet } from "@/lib/mock/natal";
import { PLAIN_PLANETS } from "@/lib/data/plainLanguage";
import { planetColorByName } from "@/lib/tokens/colors";

export function ChartWheelLegend({ planets }: { planets: Planet[] }) {
  return (
    <div className="px-4 pb-4 grid gap-1.5 sm:grid-cols-2">
      {planets.map((p) => {
        const hint = PLAIN_PLANETS[p.name];
        if (!hint) return null;
        const color = planetColorByName[p.name];
        return (
          <div key={p.name} className="text-caption leading-snug flex gap-1.5">
            <span className="font-medium shrink-0" style={color ? { color } : undefined}>
              {p.name}
            </span>
            <span className="text-text-muted">{hint}</span>
          </div>
        );
      })}
    </div>
  );
}
