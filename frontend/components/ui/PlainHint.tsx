import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PlainHintProps {
  children: ReactNode;
  className?: string;
}

/** 表格列下方一行白話 */
export function PlainHint({ children, className }: PlainHintProps) {
  if (!children) return null;
  return (
    <p
      className={cn(
        "border-l-2 border-report-ai/25 pl-2.5 text-caption text-text-secondary leading-snug",
        className,
      )}
    >
      {children}
    </p>
  );
}
