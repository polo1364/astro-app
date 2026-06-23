import { AppFooter } from "@/components/layout/AppFooter";
import { PageContainer } from "@/components/layout/PageContainer";
import { TopNav } from "@/components/layout/TopNav";

export function AppShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <>
      <TopNav />
      <PageContainer className={className}>{children}</PageContainer>
      <AppFooter />
    </>
  );
}
