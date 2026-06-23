"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";
import { BarChart2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { getApiUsage, type ApiUsageSummary } from "@/lib/api";

interface ApiUsageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatNum(n: number): string {
  return n.toLocaleString("zh-TW");
}

export function ApiUsageModal({ open, onOpenChange }: ApiUsageModalProps) {
  const [loading, setLoading] = useState(false);
  const [backendOnline, setBackendOnline] = useState(true);
  const [summary, setSummary] = useState<ApiUsageSummary | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setSummary(null);
    getApiUsage()
      .then((data) => {
        setSummary(data);
        setBackendOnline(true);
      })
      .catch(() => {
        setBackendOnline(false);
        setSummary(null);
      })
      .finally(() => setLoading(false));
  }, [open]);

  const totals = summary?.totals;
  const hasData = (totals?.requestCount ?? 0) > 0;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {open && (
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay fixed inset-0 z-50" />
          <Dialog.Content
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 glass-strong rounded-lg p-6 shadow-2xl focus:outline-none max-h-[90vh] overflow-y-auto"
            aria-describedby="api-usage-desc"
          >
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-2">
                <BarChart2 className="size-5 text-accent-natal" />
                <Dialog.Title className="text-base font-semibold text-text-primary">
                  解讀用量
                </Dialog.Title>
              </div>
              <Dialog.Close asChild>
                <button
                  className="text-text-muted hover:text-text-primary transition-colors p-1 rounded"
                  aria-label="關閉"
                >
                  <X className="size-4" />
                </button>
              </Dialog.Close>
            </div>

            <p id="api-usage-desc" className="text-sm text-text-secondary mb-4">
              本 App 累計 AI 解讀用量（依功能分類）。
            </p>

            {!backendOnline && (
              <Alert variant="info" title="計算服務暫不可用" className="mb-4">
                無法載入用量統計，請確認計算服務已啟動。
              </Alert>
            )}

            {loading && (
              <div className="flex justify-center py-8">
                <Spinner className="size-6" />
              </div>
            )}

            {!loading && backendOnline && !hasData && (
              <Alert variant="info" className="mb-4">
                尚無解讀記錄
              </Alert>
            )}

            {!loading && totals && hasData && (
              <>
                <div className="grid grid-cols-2 gap-3 mb-5 text-sm">
                  <div className="rounded-md bg-white/5 px-3 py-2">
                    <div className="text-[10px] text-text-muted">總請求次數</div>
                    <div className="font-semibold tabular-nums">{formatNum(totals.requestCount)}</div>
                  </div>
                  <div className="rounded-md bg-white/5 px-3 py-2">
                    <div className="text-[10px] text-text-muted">總用量</div>
                    <div className="font-semibold tabular-nums">{formatNum(totals.totalTokens)}</div>
                  </div>
                  <div className="rounded-md bg-white/5 px-3 py-2">
                    <div className="text-[10px] text-text-muted">輸入量</div>
                    <div className="font-semibold tabular-nums">{formatNum(totals.promptTokens)}</div>
                  </div>
                  <div className="rounded-md bg-white/5 px-3 py-2">
                    <div className="text-[10px] text-text-muted">輸出量</div>
                    <div className="font-semibold tabular-nums">{formatNum(totals.completionTokens)}</div>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-md border border-border">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border text-text-muted">
                        <th className="text-left px-3 py-2 font-medium">功能</th>
                        <th className="text-right px-3 py-2 font-medium">次數</th>
                        <th className="text-right px-3 py-2 font-medium">用量</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(summary?.byFeature ?? []).map((row) => (
                        <tr key={row.feature} className="border-b border-border/50 last:border-0">
                          <td className="px-3 py-2 text-text-secondary">{row.labelZh}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{formatNum(row.requestCount)}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{formatNum(row.totalTokens)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="mt-4 text-[10px] text-text-muted leading-relaxed">
                  每日運勢含排程自動生成內容，次數可能高於手動操作。
                </p>
              </>
            )}

            <div className="flex justify-end mt-5">
              <Dialog.Close asChild>
                <Button variant="ghost">關閉</Button>
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      )}
    </Dialog.Root>
  );
}
