"use client";

import { useState } from "react";
import { TopNav } from "@/components/layout/TopNav";
import { PageContainer } from "@/components/layout/PageContainer";
import { PublicDailyPanel } from "@/features/daily/PublicDailyPanel";
import { PersonalDailyPanel } from "@/features/daily/PersonalDailyPanel";

type HomeView = "public" | "personal";

export function HomePage() {
  const [view, setView] = useState<HomeView>("public");

  return (
    <>
      <TopNav />
      <PageContainer className="py-8 sm:py-12">
        {view === "public" ? (
          <PublicDailyPanel onEnterPersonal={() => setView("personal")} />
        ) : (
          <PersonalDailyPanel onBack={() => setView("public")} />
        )}
      </PageContainer>
    </>
  );
}
