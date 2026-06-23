import { cn } from "@/lib/utils";

export function PageContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main className={cn("flex-1 max-w-[1600px] w-full mx-auto px-3 sm:px-4 py-4 sm:py-6", className)}>
      {children}
    </main>
  );
}
