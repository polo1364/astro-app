"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BarChart2, Contact, History, Sparkles, Telescope } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ClientIcon } from "@/components/ui/ClientIcon";
import { DeepSeekSettingsModal } from "@/components/settings/DeepSeekSettingsModal";
import { ApiUsageModal } from "@/components/settings/ApiUsageModal";
import { ChartHistoryModal } from "@/components/history/ChartHistoryModal";
import { BirthProfileModal } from "@/components/profiles/BirthProfileModal";
import { VisitorCountBadge } from "@/components/layout/VisitorCountBadge";
import { useChartHistoryContext } from "@/lib/context/ChartHistoryContext";
import { useBirthProfileContext } from "@/lib/context/BirthProfileContext";
import { useMounted } from "@/lib/hooks/useMounted";
import { useDeepSeekConfigured } from "@/lib/hooks/useDeepSeekConfigured";
import { useVisitorCount } from "@/lib/hooks/useVisitorCount";
import { APP_VERSION } from "@/lib/constants/appMeta";

const navLinks = [
  { href: "/", label: "首頁" },
  { href: "/natal", label: "本命盤" },
  { href: "/transit", label: "行運盤" },
];

export function TopNav() {
  const pathname = usePathname();
  const mounted = useMounted();
  const deepSeekConfigured = useDeepSeekConfigured();
  const visitorCount = useVisitorCount();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [usageOpen, setUsageOpen] = useState(false);
  const { modalOpen: historyOpen, setModalOpen: setHistoryOpen } = useChartHistoryContext();
  const { modalOpen: profileOpen, setModalOpen: setProfileOpen } = useBirthProfileContext();

  const actionButtons = (
    <>
      <Button
        variant="secondary"
        size="sm"
        className="px-2 sm:px-3"
        onClick={() => setHistoryOpen(true)}
        aria-label="計算歷史"
      >
        <ClientIcon icon={History} className="size-3.5" />
        <span className="hidden sm:inline">歷史</span>
      </Button>
      <Button
        variant="secondary"
        size="sm"
        className="px-2 sm:px-3"
        onClick={() => setProfileOpen(true)}
        aria-label="基本資料"
      >
        <ClientIcon icon={Contact} className="size-3.5" />
        <span className="hidden sm:inline">基本資料</span>
      </Button>
      <Button
        variant="secondary"
        size="sm"
        className="px-2 sm:px-3"
        onClick={() => setUsageOpen(true)}
        aria-label="解讀用量"
      >
        <ClientIcon icon={BarChart2} className="size-3.5" />
        <span className="hidden sm:inline">用量統計</span>
      </Button>
      {!deepSeekConfigured && (
        <Button
          variant="secondary"
          size="sm"
          className="px-2 sm:px-3"
          onClick={() => setSettingsOpen(true)}
          aria-label="解讀設定"
        >
          <ClientIcon icon={Sparkles} className="size-3.5" />
          <span className="hidden sm:inline">解讀設定</span>
        </Button>
      )}
    </>
  );

  return (
    <>
      <header className="sticky top-0 z-40 glass border-b border-border">
        <div className="max-w-[1600px] mx-auto px-3 sm:px-4">
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-x-2 gap-y-2 sm:gap-4 sm:h-14 py-2 sm:py-0">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 sm:flex-none order-1">
              <Link href="/" prefetch={false} className="flex items-center gap-2 shrink-0 min-w-0">
                <ClientIcon icon={Telescope} className="size-5 text-accent-natal shrink-0" strokeWidth={1.5} />
                <div className="min-w-0">
                  <span className="block text-sm font-semibold text-text-primary tracking-wide truncate">
                    星象觀測台
                  </span>
                  <span className="hidden sm:block text-[10px] text-text-muted">
                    專業占星工作台 · v{APP_VERSION}
                  </span>
                  <span className="sm:hidden text-[10px] text-text-muted">v{APP_VERSION}</span>
                </div>
              </Link>
              {visitorCount !== null && (
                <VisitorCountBadge count={visitorCount} className="hidden sm:flex" />
              )}
            </div>

            <div className="flex items-center gap-1 sm:gap-2 shrink-0 order-2 sm:order-3">
              {actionButtons}
            </div>

            <nav
              className="flex items-center gap-0.5 w-full sm:w-auto sm:flex-1 sm:justify-center order-3 sm:order-2 border-t border-border/50 pt-2 sm:border-0 sm:pt-0"
              aria-label="主要導覽"
            >
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch={false}
                  className={cn(
                    "flex-1 sm:flex-none text-center px-2 sm:px-3 py-2 sm:py-1.5 rounded text-xs font-medium transition-colors",
                    pathname === link.href
                      ? "text-text-primary bg-white/8"
                      : "text-text-muted hover:text-text-secondary"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              {visitorCount !== null && (
                <VisitorCountBadge count={visitorCount} className="sm:hidden ml-1 shrink-0" />
              )}
            </nav>
          </div>
        </div>
      </header>

      {mounted && (
        <>
          <ChartHistoryModal open={historyOpen} onOpenChange={setHistoryOpen} />
          <BirthProfileModal open={profileOpen} onOpenChange={setProfileOpen} />
          <ApiUsageModal open={usageOpen} onOpenChange={setUsageOpen} />
          {!deepSeekConfigured && (
            <DeepSeekSettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
          )}
        </>
      )}
    </>
  );
}
