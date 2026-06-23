"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PublicDailyPanel } from "@/features/daily/PublicDailyPanel";
import { PersonalDailyPanel } from "@/features/daily/PersonalDailyPanel";

type HomeView = "public" | "personal";

export function HomePage() {
  const [view, setView] = useState<HomeView>("public");

  return (
    <>
      <AppShell className="py-5 sm:py-12">
        {view === "public" ? (
          <PublicDailyPanel onEnterPersonal={() => setView("personal")} />
        ) : (
          <PersonalDailyPanel onBack={() => setView("public")} />
        )}
      </AppShell>
    </>
  );
}
