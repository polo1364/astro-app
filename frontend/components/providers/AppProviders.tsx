"use client";

import * as Tooltip from "@radix-ui/react-tooltip";
import { ChartHistoryProvider } from "@/lib/context/ChartHistoryContext";
import { BirthProfileProvider } from "@/lib/context/BirthProfileContext";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <Tooltip.Provider delayDuration={300}>
      <ChartHistoryProvider>
        <BirthProfileProvider>{children}</BirthProfileProvider>
      </ChartHistoryProvider>
    </Tooltip.Provider>
  );
}
