import type { Planet } from "@/lib/mock/natal";
import { Badge } from "@/components/ui/Badge";
import { PlainHint } from "@/components/ui/PlainHint";
import { AstroTerm } from "@/components/ui/AstroTerm";
import { plainPlanetLine } from "@/lib/data/plainLanguage";
import { planetColorByName, signElementColor } from "@/lib/tokens/colors";

const GRID_WITH_HOUSE = "88px 72px 88px 52px 52px";
const GRID_NO_HOUSE = "88px 72px 88px 52px";

function ColoredPlanet({ name }: { name: string }) {
  const color = planetColorByName[name];
  return (
    <AstroTerm term={name} className="font-semibold" style={color ? { color } : undefined}>
      {name}
    </AstroTerm>
  );
}

function ColoredSign({ sign }: { sign: string }) {
  const color = signElementColor[sign];
  return (
    <AstroTerm term={sign} style={color ? { color } : undefined}>
      {sign}
    </AstroTerm>
  );
}

export function PlanetTable({
  planets,
  hideHouse = false,
}: {
  planets: Planet[];
  hideHouse?: boolean;
}) {
  const rows = planets.filter((p) => p.name !== "上升" && p.name !== "中天");
  const gridCols = hideHouse ? GRID_NO_HOUSE : GRID_WITH_HOUSE;

  return (
    <div>
      <div className="data-row-header" style={{ gridTemplateColumns: gridCols }}>
        <span>行星</span>
        <span>星座</span>
        <span>度數</span>
        {!hideHouse && <span>宮位</span>}
        <span>R</span>
      </div>
      {rows.map((p) => (
        <div key={p.name} className="data-row-stack px-4 py-3 space-y-2">
          <div
            className="grid items-center gap-x-3 gap-y-1 text-body"
            style={{ gridTemplateColumns: gridCols }}
          >
            <ColoredPlanet name={p.name} />
            <ColoredSign sign={p.sign} />
            <span className="tabular-nums text-text-gold">{p.degree}</span>
            {!hideHouse && (
              <span className="tabular-nums text-text-gold font-medium">
                {p.house > 0 ? p.house : "—"}
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
            {plainPlanetLine(p.name, p.sign, p.house, p.retrograde, hideHouse)}
          </PlainHint>
        </div>
      ))}
    </div>
  );
}
