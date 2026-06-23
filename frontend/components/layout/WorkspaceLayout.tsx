import { cn } from "@/lib/utils";

interface WorkspaceLayoutProps {
  inputRail: React.ReactNode;
  chartStage: React.ReactNode;
  insightRail: React.ReactNode;
  className?: string;
}

export function WorkspaceLayout({
  inputRail,
  chartStage,
  insightRail,
  className,
}: WorkspaceLayoutProps) {
  return (
    <div
      className={cn(
        "grid gap-4",
        "grid-cols-1",
        "lg:grid-cols-[280px_1fr_260px]",
        "xl:grid-cols-[300px_1fr_280px]",
        className
      )}
    >
      <aside className="order-1 lg:order-none">{inputRail}</aside>
      <section className="order-2 lg:order-none min-w-0">{chartStage}</section>
      <aside className="order-3 lg:order-none">{insightRail}</aside>
    </div>
  );
}
