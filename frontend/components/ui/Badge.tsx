import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "natal" | "transit" | "success" | "warning" | "muted";
}

const variants = {
  default: "bg-white/10 text-text-secondary border-border",
  natal: "bg-accent-natal/15 text-accent-natal border-accent-natal/30",
  transit: "bg-accent-transit/15 text-accent-transit border-accent-transit/30",
  success: "bg-green-500/15 text-green-400 border-green-500/30",
  warning: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  muted: "bg-white/5 text-text-muted border-border",
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium border",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
