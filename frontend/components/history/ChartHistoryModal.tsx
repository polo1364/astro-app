"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { usePathname } from "next/navigation";
import { Clock, History, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import { useChartHistoryContext } from "@/lib/context/ChartHistoryContext";
import { useChartHistory } from "@/lib/hooks/useChartHistory";
import { clearChartHistory } from "@/lib/storage/chartHistoryDb";
import type { ChartHistoryRecord, ChartKind } from "@/lib/storage/chartHistoryTypes";

function formatSavedAt(ts: number): string {
  const d = new Date(ts);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hour = String(d.getHours()).padStart(2, "0");
  const minute = String(d.getMinutes()).padStart(2, "0");
  return `${month}/${day} ${hour}:${minute}`;
}

function kindFromPath(pathname: string): ChartKind | "all" {
  if (pathname.startsWith("/natal")) return "natal";
  if (pathname.startsWith("/transit")) return "transit";
  return "all";
}

interface ChartHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function HistoryList({
  kind,
  refreshToken,
  onSelect,
  activeId,
}: {
  kind: ChartKind;
  refreshToken: number;
  onSelect: (entry: ChartHistoryRecord) => void;
  activeId: string | null;
}) {
  const { entries, loading, error, remove, refresh } = useChartHistory(kind);

  useEffect(() => {
    if (refreshToken > 0) void refresh();
  }, [refreshToken, refresh]);

  const title = kind === "natal" ? "本命盤" : "行運盤";

  if (loading) {
    return (
      <div className="space-y-2">
        <p className="text-caption text-text-muted mb-2">{title}</p>
        <Skeleton className="h-12 w-full rounded-md" />
        <Skeleton className="h-12 w-full rounded-md" />
      </div>
    );
  }

  if (error) {
    return <Alert variant="info" className="text-caption">{error}</Alert>;
  }

  if (entries.length === 0) {
    return (
      <p className="text-caption text-text-muted py-1">
        尚無{title}紀錄
      </p>
    );
  }

  return (
    <div>
      <p className="text-caption text-text-muted mb-2">{title}</p>
      <ul className="space-y-2">
        {entries.map((entry) => (
          <li key={entry.id}>
            <div
              className={[
                "flex items-start gap-1 rounded-md border px-3 py-2 transition-colors",
                "hover:border-border-strong hover:bg-white/5",
                activeId === entry.id
                  ? "border-accent-natal/40 bg-accent-natal/10"
                  : "border-border-subtle bg-surface/30",
              ].join(" ")}
            >
              <button
                type="button"
                onClick={() => onSelect(entry)}
                className="flex-1 min-w-0 text-left"
              >
                <span className="text-body text-text-primary font-medium line-clamp-2 block">
                  {entry.label}
                </span>
                <span className="flex items-center gap-1 mt-1 text-caption text-text-muted">
                  <Clock className="size-3 shrink-0" />
                  {formatSavedAt(entry.savedAt)}
                </span>
              </button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="shrink-0 -mr-1 -mt-0.5"
                aria-label={`刪除 ${entry.label}`}
                onClick={() => void remove(entry.id)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ChartHistoryModal({ open, onOpenChange }: ChartHistoryModalProps) {
  const pathname = usePathname();
  const viewKind = kindFromPath(pathname);
  const { refreshToken, pageHandlers, notifySaved } = useChartHistoryContext();
  const [confirmClear, setConfirmClear] = useState(false);

  const activeId = pageHandlers?.activeId ?? null;

  function handleSelect(entry: ChartHistoryRecord) {
    if (!pageHandlers || pageHandlers.kind !== entry.kind) return;
    pageHandlers.onLoad(entry);
    onOpenChange(false);
  }

  async function handleClear() {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    if (viewKind === "natal" || viewKind === "all") await clearChartHistory("natal");
    if (viewKind === "transit" || viewKind === "all") await clearChartHistory("transit");
    notifySaved(viewKind === "all" ? "natal" : viewKind, "");
    setConfirmClear(false);
  }

  const title =
    viewKind === "natal"
      ? "本命盤歷史"
      : viewKind === "transit"
        ? "行運盤歷史"
        : "計算歷史";

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {open && (
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay fixed inset-0 z-50" />
          <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 glass-strong rounded-lg p-6 shadow-2xl focus:outline-none max-h-[85vh] flex flex-col"
          aria-describedby="history-desc"
        >
          <div className="flex items-start justify-between mb-4 shrink-0">
            <div className="flex items-center gap-2">
              <History className="size-5 text-accent-natal" />
              <Dialog.Title className="text-base font-semibold text-text-primary">
                {title}
              </Dialog.Title>
            </div>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant={confirmClear ? "danger" : "ghost"}
                size="sm"
                onClick={handleClear}
                onBlur={() => setConfirmClear(false)}
              >
                <Trash2 className="size-3.5" />
                {confirmClear ? "確認清空" : "清空"}
              </Button>
              <Dialog.Close asChild>
                <button
                  className="text-text-muted hover:text-text-primary transition-colors p-1 rounded"
                  aria-label="關閉"
                >
                  <X className="size-4" />
                </button>
              </Dialog.Close>
            </div>
          </div>

          <p id="history-desc" className="text-sm text-text-secondary mb-4 shrink-0">
            計算完成後自動儲存至本機 IndexedDB，最多各保留 50 筆。
            <span className="block mt-1 text-text-muted">
              不會上傳或與他人共享；換裝置或清除瀏覽資料後紀錄將消失。
            </span>
            {viewKind === "all" && (
              <span className="block mt-1 text-text-muted">
                請前往本命盤或行運盤頁面以載入紀錄。
              </span>
            )}
          </p>

          <div className="overflow-y-auto min-h-0 space-y-4 pr-1">
            {(viewKind === "natal" || viewKind === "all") && (
              <HistoryList
                kind="natal"
                refreshToken={refreshToken}
                activeId={pageHandlers?.kind === "natal" ? activeId : null}
                onSelect={handleSelect}
              />
            )}
            {(viewKind === "transit" || viewKind === "all") && (
              <HistoryList
                kind="transit"
                refreshToken={refreshToken}
                activeId={pageHandlers?.kind === "transit" ? activeId : null}
                onSelect={handleSelect}
              />
            )}
          </div>
        </Dialog.Content>
        </Dialog.Portal>
      )}
    </Dialog.Root>
  );
}
