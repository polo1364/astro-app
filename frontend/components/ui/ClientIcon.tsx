"use client";

import { useMounted } from "@/lib/hooks/useMounted";
import type { LucideIcon } from "lucide-react";

interface ClientIconProps {
  icon: LucideIcon;
  className?: string;
  strokeWidth?: number;
}

/** Lucide SVGs can mismatch on hydration; render after mount. */
export function ClientIcon({ icon: Icon, className, strokeWidth }: ClientIconProps) {
  const mounted = useMounted();
  if (!mounted) {
    return <span className={className} aria-hidden="true" />;
  }
  return <Icon className={className} strokeWidth={strokeWidth} />;
}
