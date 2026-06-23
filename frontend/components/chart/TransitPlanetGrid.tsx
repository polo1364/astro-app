import type { TransitPlanet } from "@/lib/types/transit";
import { Badge } from "@/components/ui/Badge";
import { PlainHint } from "@/components/ui/PlainHint";
import { AstroTerm } from "@/components/ui/AstroTerm";
import { plainTransitPlanetLine } from "@/lib/data/plainLanguage";
import { planetColorByName, signElementColor } from "@/lib/tokens/colors";

const GRID_WITH_HOUSE = "80px 80px 88px 52px 52px";
const GRID_NO_HOUSE = "80px 80px 88px 52px";

export function TransitPlanetGrid({
  planets,
  hideHouse = false,
}: {
  planets: TransitPlanet[];
  hideHouse?: boolean;
}) {
  const gridCols = hideHouse ? GRID_NO_HOUSE : GRID_WITH_HOUSE;

  return (
    <div>
      <div className="data-row-header" style={{ gridTemplateColumns: gridCols }}>
        <span><AstroTerm term="行星">行星</AstroTerm></span>
        <span><AstroTerm term="星座">星座</AstroTerm></span>
        <span><AstroTerm term="度數">度數</AstroTerm></span>
        {!hideHouse && <span><AstroTerm term="落宮">落宮</AstroTerm></span>}
        <span><AstroTerm term="逆行">逆行</AstroTerm></span>
      </div>
      {planets.map((p) => (
        <div key={p.name} className="data-row-stack px-4 py-3 space-y-2">
          <div
            className="grid items-center gap-x-3 text-body"
            style={{ gridTemplateColumns: gridCols }}
          >
            <AstroTerm
              term={p.name}
              className="font-semibold"
              style={{ color: planetColorByName[p.name] ?? "#fbbf24" }}
            >
              {p.name}
            </AstroTerm>
            <AstroTerm
              term={p.sign}
              style={{ color: signElementColor[p.sign] }}
            >
              {p.sign}
            </AstroTerm>
            <span className="tabular-nums text-text-gold">{p.degree}</span>
            {!hideHouse && (
              <span className="tabular-nums text-text-gold font-medium">
                {p.natalHouse && p.natalHouse > 0 ? p.natalHouse : "—"}
              </span>
            )}
            <span>
              {p.retrograde ? (
                <Badge variant="warning">R</Badge>
              ) : (
                <span className="text-text-muted">—</span>
              )}
            </span>
          </div>
          <PlainHint>
            {plainTransitPlanetLine(p.name, p.sign, p.retrograde, p.natalHouse, hideHouse)}
          </PlainHint>
        </div>
      ))}
    </div>
  );
}
