import { colors } from "@/lib/tokens/colors";
import { highlightReport, renderAiReportBody } from "@/lib/utils/highlightReport";

const SHARE_BODY_STYLE = {
  fontSize: 22,
  lineHeight: 1.55,
  color: colors.text.primary,
} as const;

interface AnalysisShareSectionProps {
  title: string;
  body: string;
  accentColor: string;
  variant?: "rule" | "ai";
}

export function AnalysisShareSection({
  title,
  body,
  accentColor,
  variant = "rule",
}: AnalysisShareSectionProps) {
  if (!body.trim()) return null;

  const bodyText = body.replace(/^##\s*[^\n]+\n?/, "");

  return (
    <section
      style={{
        borderLeft: `4px solid ${accentColor}`,
        paddingLeft: 20,
        marginBottom: 24,
      }}
    >
      <p
        style={{
          margin: "0 0 8px",
          fontSize: 24,
          fontWeight: 600,
          color: accentColor,
        }}
      >
        {title}
      </p>
      <div style={SHARE_BODY_STYLE}>
        {variant === "ai" ? (
          renderAiReportBody(bodyText, undefined, "share")
        ) : (
          <div style={{ ...SHARE_BODY_STYLE, whiteSpace: "pre-wrap" }}>
            {highlightReport(bodyText, false, "share")}
          </div>
        )}
      </div>
    </section>
  );
}
