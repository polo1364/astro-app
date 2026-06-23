import { aspectColorByName } from "@/lib/tokens/colors";
import { AstroTerm } from "@/components/ui/AstroTerm";

const ASPECT_LEGEND = [
  { type: "合相", hint: "兩星黏在一起" },
  { type: "六分", hint: "好配合" },
  { type: "四分", hint: "容易卡住" },
  { type: "三分", hint: "很順" },
  { type: "對分", hint: "互相拉" },
] as const;

export function ChartAspectLegend() {
  return (
    <div className="px-4 pb-4 border-t border-border/50">
      <p className="text-caption font-medium text-text-primary mb-2">圖上線條代表什麼？</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {ASPECT_LEGEND.map(({ type, hint }) => (
          <div key={type} className="flex items-center gap-2 text-caption">
            <span
              className="w-6 h-0.5 shrink-0 rounded"
              style={{ backgroundColor: aspectColorByName[type] }}
            />
            <AstroTerm term={type} style={{ color: aspectColorByName[type] }}>
              {type}
            </AstroTerm>
            <span className="text-text-muted">{hint}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
