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
import { useChartHistoryContext } from "@/lib/context/ChartHistoryContext";
import { useBirthProfileContext } from "@/lib/context/BirthProfileContext";
import { useMounted } from "@/lib/hooks/useMounted";
import { useDeepSeekConfigured } from "@/lib/hooks/useDeepSeekConfigured";
import { useVisitorCount } from "@/lib/hooks/useVisitorCount";

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

  return (
    <>
      <header className="sticky top-0 z-40 glass border-b border-border">
        <div className="max-w-[1600px] mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 shrink-0 min-w-0">
            <Link href="/" prefetch={false} className="flex items-center gap-2.5 shrink-0">
              <ClientIcon icon={Telescope} className="size-5 text-accent-natal" strokeWidth={1.5} />
              <div>
                <span className="text-sm font-semibold text-text-primary tracking-wide">
                  星象觀測台
                </span>
                <span className="hidden sm:block text-[10px] text-text-muted">
                  專業占星工作台
                </span>
              </div>
            </Link>
            {visitorCount !== null && (
              <span
                className="text-[10px] text-text-muted tabular-nums shrink-0"
                aria-label={`累計瀏覽 ${visitorCount.toLocaleString("zh-TW")} 人次`}
              >
                {visitorCount.toLocaleString("zh-TW")}
              </span>
            )}
          </div>

          <nav className="flex items-center gap-1" aria-label="主要導覽">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                prefetch={false}
                className={cn(
                  "px-3 py-1.5 rounded text-xs font-medium transition-colors",
                  pathname === link.href
                    ? "text-text-primary bg-white/8"
                    : "text-text-muted hover:text-text-secondary"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setHistoryOpen(true)}
              aria-label="計算歷史"
            >
              <ClientIcon icon={History} className="size-3.5" />
              <span className="hidden sm:inline">歷史</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setProfileOpen(true)}
              aria-label="基本資料"
            >
              <ClientIcon icon={Contact} className="size-3.5" />
              <span className="hidden sm:inline">基本資料</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setUsageOpen(true)}
              aria-label="API 用量"
            >
              <ClientIcon icon={BarChart2} className="size-3.5" />
              <span className="hidden sm:inline">API 用量</span>
            </Button>
            {!deepSeekConfigured && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSettingsOpen(true)}
                aria-label="解讀設定"
              >
                <ClientIcon icon={Sparkles} className="size-3.5" />
                <span className="hidden sm:inline">解讀設定</span>
              </Button>
            )}
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
