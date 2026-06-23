import { APP_AUTHOR, APP_NAME, APP_VERSION } from "@/lib/constants/appMeta";
import { cn } from "@/lib/utils";

export function AppFooter({ className }: { className?: string }) {
  return (
    <footer
      className={cn(
        "shrink-0 border-t border-border/60 px-3 py-3 sm:py-4 text-center text-[11px] sm:text-xs text-text-muted",
        className
      )}
    >
      <p className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-0.5 sm:gap-1.5">
        <span>{APP_NAME}</span>
        <span className="hidden sm:inline" aria-hidden>
          ·
        </span>
        <span>
          作者 {APP_AUTHOR} · v{APP_VERSION}
        </span>
      </p>
    </footer>
  );
}
