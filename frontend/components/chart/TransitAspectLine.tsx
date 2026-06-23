import type { TransitAspect } from "@/lib/types/transit";
import { AstroTerm } from "@/components/ui/AstroTerm";
import { plainTransitHighlight } from "@/lib/data/plainLanguage";
import { aspectColorByName, planetColorByName } from "@/lib/tokens/colors";
import { cn } from "@/lib/utils";

interface TransitAspectLineProps {
  aspect: TransitAspect;
  className?: string;
  showPlain?: boolean;
}

export function TransitAspectLine({ aspect, className, showPlain = true }: TransitAspectLineProps) {
  const natalName = aspect.natalPlanet || aspect.natalPoint || "";
  return (
    <div className={cn("border-l-4 border-accent-transit/40 pl-3 space-y-1", className)}>
      <div className="text-body text-text-primary flex flex-wrap items-center gap-x-1 gap-y-0.5">
        <AstroTerm
          term={aspect.transitPlanet}
          className="font-semibold"
          style={{ color: planetColorByName[aspect.transitPlanet] }}
        >
          {aspect.transitPlanet}
        </AstroTerm>
        <AstroTerm
          term={aspect.type}
          className="font-semibold"
          style={{ color: aspectColorByName[aspect.type] }}
        >
          {aspect.type}
        </AstroTerm>
        <AstroTerm
          term={natalName}
          className="font-medium"
          style={{ color: planetColorByName[natalName] }}
        >
          {natalName}
        </AstroTerm>
        <span className="text-text-gold tabular-nums text-caption">({aspect.orb})</span>
        <span
          className={cn(
            "text-caption font-medium",
            aspect.applying ? "text-status-ok" : "text-text-secondary",
          )}
        >
          {aspect.applying ? "入相" : "出相"}
        </span>
      </div>
      {showPlain && (
        <p className="text-caption text-text-secondary leading-snug">
          {plainTransitHighlight(aspect.transitPlanet, aspect.type, natalName, aspect.applying)}
        </p>
      )}
    </div>
  );
}
