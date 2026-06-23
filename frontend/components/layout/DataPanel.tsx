import { cn } from "@/lib/utils";

interface DataPanelProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function DataPanel({ title, children, className }: DataPanelProps) {
  return (
    <div className={cn("glass-strong rounded-lg overflow-hidden", className)}>
      {title && (
        <div className="px-4 py-2.5 border-b border-border">
          <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            {title}
          </h4>
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}
