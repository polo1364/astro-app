"use client";

import { Users } from "lucide-react";
import { ClientIcon } from "@/components/ui/ClientIcon";
import { cn } from "@/lib/utils";

interface VisitorCountBadgeProps {
  count: number;
  className?: string;
}

export function VisitorCountBadge({ count, className }: VisitorCountBadgeProps) {
  const formatted = count.toLocaleString("zh-TW");

  return (
    <div
      className={cn(
        "group relative flex items-center gap-1.5 shrink-0",
        "rounded-full border border-accent-natal/25 bg-accent-natal/8",
        "px-2 py-0.5 sm:px-2.5 sm:py-1 backdrop-blur-sm",
        "shadow-[0_0_12px_rgba(196,181,253,0.12)]",
        "transition-colors hover:border-accent-natal/40 hover:bg-accent-natal/12",
        className
      )}
      aria-label={`累計瀏覽 ${formatted} 人次`}
      title="累計瀏覽人次"
    >
      <span
        className="absolute inset-0 rounded-full bg-gradient-to-r from-accent-natal/0 via-accent-natal/10 to-accent-natal/0 opacity-0 transition-opacity group-hover:opacity-100"
        aria-hidden
      />
      <ClientIcon
        icon={Users}
        className="relative size-3 text-accent-natal/80"
        strokeWidth={2}
      />
      <span className="relative text-[10px] sm:text-[11px] font-semibold tabular-nums tracking-wide text-accent-natal">
        {formatted}
      </span>
    </div>
  );
}
