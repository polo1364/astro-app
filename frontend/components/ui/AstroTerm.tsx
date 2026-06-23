"use client";

import * as Tooltip from "@radix-ui/react-tooltip";
import { getGlossary } from "@/lib/data/glossary";
import { cn } from "@/lib/utils";
import type { CSSProperties, ReactNode } from "react";

interface AstroTermProps {
  term?: string;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function AstroTerm({ term, children, className, style }: AstroTermProps) {
  const label = term ?? (typeof children === "string" ? children : "");
  const explanation = getGlossary(label);
  const text = children ?? term;

  if (!label || !explanation) {
    return (
      <span className={className} style={style}>
        {text}
      </span>
    );
  }

  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <span
          className={cn(
            "border-b border-dotted border-text-muted/50 cursor-help text-sm",
            className,
          )}
          style={style}
        >
          {text}
        </span>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          side="top"
          sideOffset={6}
          className="z-50 max-w-[280px] rounded-md bg-black/85 px-3 py-2 text-sm text-text-primary shadow-lg backdrop-blur-sm leading-relaxed"
        >
          {explanation}
          <Tooltip.Arrow className="fill-black/85" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
