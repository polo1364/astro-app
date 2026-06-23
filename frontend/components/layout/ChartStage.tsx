import { cn } from "@/lib/utils";

interface ChartStageProps {
  children: React.ReactNode;
  label?: string;
  accent?: "natal" | "transit";
  className?: string;
}

export function ChartStage({
  children,
  label,
  accent = "natal",
  className,
}: ChartStageProps) {
  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      {label && (
        <span
          className={cn(
            "text-xs font-medium uppercase tracking-wider",
            accent === "natal" ? "text-accent-natal" : "text-accent-transit"
          )}
        >
          {label}
        </span>
      )}
      <div className="relative w-full max-w-[420px] aspect-square">
        <div className="absolute inset-0 glass-strong rounded-full chart-ring flex items-center justify-center">
          {children}
        </div>
      </div>
    </div>
  );
}
