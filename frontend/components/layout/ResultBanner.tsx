import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

interface ResultBannerProps {
  title: string;
  subtitle?: string;
  accent?: "natal" | "transit";
  className?: string;
}

export function ResultBanner({
  title,
  subtitle,
  accent = "natal",
  className,
}: ResultBannerProps) {
  return (
    <div
      tabIndex={-1}
      className={cn(
        "glass rounded-lg px-5 py-4 flex items-center justify-between gap-4",
        className
      )}
    >
      <div>
        <h2
          className={cn(
            "font-display text-2xl font-semibold tracking-tight",
            accent === "natal" ? "text-accent-natal" : "text-accent-transit"
          )}
          style={{ fontFamily: "var(--font-display)" }}
        >
          {title}
        </h2>
        {subtitle && (
          <p className="text-base text-text-secondary mt-1 tabular-nums">{subtitle}</p>
        )}
      </div>
      <Badge variant={accent === "natal" ? "natal" : "transit"}>
        {accent === "natal" ? "本命盤" : "行運盤"}
      </Badge>
    </div>
  );
}
