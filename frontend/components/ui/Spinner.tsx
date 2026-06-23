import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="載入中"
      className={cn(
        "size-5 rounded-full border-2 border-accent-natal/30 border-t-accent-natal animate-spin",
        className
      )}
    />
  );
}
