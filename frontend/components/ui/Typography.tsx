import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function TextBody({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-body text-text-primary leading-relaxed", className)}
      {...props}
    />
  );
}

export function TextCaption({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-caption text-text-secondary leading-normal", className)}
      {...props}
    />
  );
}

export function TextLabel({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "text-label font-semibold uppercase tracking-wide text-text-muted",
        className,
      )}
      {...props}
    />
  );
}

export function TextDisplay({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn("text-lg font-semibold text-text-primary", className)}
      {...props}
    />
  );
}
