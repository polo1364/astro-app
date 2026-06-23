import type { House } from "@/lib/mock/natal";
import { PlainHint } from "@/components/ui/PlainHint";
import { AstroTerm } from "@/components/ui/AstroTerm";
import { plainHouseLine } from "@/lib/data/plainLanguage";
import { signElementColor } from "@/lib/tokens/colors";

const HOUSE_TERMS: Record<number, string> = {
  1: "第1宮", 2: "第2宮", 3: "第3宮", 4: "第4宮",
  5: "第5宮", 6: "第6宮", 7: "第7宮", 8: "第8宮",
  9: "第9宮", 10: "第10宮", 11: "第11宮", 12: "第12宮",
};

const GRID_COLS = "48px 72px 1fr";

export function HouseTable({ houses }: { houses: House[] }) {
  if (!houses.length) {
    return (
      <p className="text-body text-text-muted px-4 py-5">
        需要出生時間與地點才能計算宮位。
      </p>
    );
  }

  return (
    <div>
      <div className="data-row-header" style={{ gridTemplateColumns: GRID_COLS }}>
        <span>宮位</span>
        <span>星座</span>
        <span className="text-right">起點度數</span>
      </div>
      {houses.map((h) => (
        <div key={h.number} className="data-row-stack px-4 py-3 space-y-2">
          <div
            className="grid items-center gap-x-3 text-body"
            style={{ gridTemplateColumns: GRID_COLS }}
          >
            <span className="tabular-nums text-text-gold font-semibold">
              <AstroTerm term={HOUSE_TERMS[h.number] ?? String(h.number)}>
                {h.number}
              </AstroTerm>
            </span>
            <AstroTerm
              term={h.sign}
              className="font-medium"
              style={{ color: signElementColor[h.sign] }}
            >
              {h.sign}
            </AstroTerm>
            <span className="tabular-nums text-text-secondary text-right">{h.degree}</span>
          </div>
          <PlainHint>{plainHouseLine(h.number, h.sign)}</PlainHint>
        </div>
      ))}
    </div>
  );
}
