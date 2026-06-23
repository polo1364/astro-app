import { AstroTerm } from "@/components/ui/AstroTerm";
import { PlainHint } from "@/components/ui/PlainHint";
import type { Pattern } from "@/lib/mock/natal";
import { PLAIN_PATTERN_NAMES, plainPatternLine } from "@/lib/data/plainLanguage";
import { planetColorByName } from "@/lib/tokens/colors";

export function PatternList({ patterns }: { patterns: Pattern[] }) {
  if (patterns.length === 0) {
    return <p className="text-body text-text-muted px-1">尚無特殊格局</p>;
  }
  return (
    <div className="space-y-4">
      {patterns.map((p) => {
        const displayName = PLAIN_PATTERN_NAMES[p.name] ?? p.name;
        return (
          <div key={p.name} className="border-l-4 border-accent-natal/50 pl-4 space-y-1.5">
            <p className="text-body font-semibold text-accent-natal">
              <AstroTerm term="格局">{displayName}</AstroTerm>
            </p>
            <p className="text-caption text-text-muted">
              {p.planets.map((pl, i) => (
                <span key={pl}>
                  {i > 0 && " · "}
                  <AstroTerm
                    term={pl}
                    className="font-medium"
                    style={{ color: planetColorByName[pl] }}
                  >
                    {pl}
                  </AstroTerm>
                </span>
              ))}
            </p>
            <PlainHint>{plainPatternLine(p.name, p.planets)}</PlainHint>
            {p.description && (
              <p className="text-caption text-text-secondary leading-snug">{p.description}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
