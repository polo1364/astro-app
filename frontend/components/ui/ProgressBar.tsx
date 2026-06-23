import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  className?: string;
  trackClassName?: string;
  barClassName?: string;
  label?: string;
}

export function ProgressBar({
  value,
  className,
  trackClassName,
  barClassName,
  label,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <div className="flex items-center justify-between gap-2 text-caption">
          <span className="text-report-ai font-medium">{label}</span>
          <span className="text-text-muted tabular-nums">{Math.round(clamped)}%</span>
        </div>
      )}
      <div
        className={cn(
          "h-2 w-full overflow-hidden rounded-full bg-white/10",
          trackClassName,
        )}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(clamped)}
        aria-label={label ?? "進度"}
      >
        <div
          className={cn(
            "h-full rounded-full bg-gradient-to-r from-report-ai/70 to-report-ai transition-[width] duration-300 ease-out",
            barClassName,
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
