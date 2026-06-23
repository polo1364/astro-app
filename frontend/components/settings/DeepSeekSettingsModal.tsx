"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";
import { X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldGroup } from "@/components/ui/FormControls";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import {
  getDeepSeekStatus,
  saveDeepSeekKey,
  testDeepSeekConnection,
} from "@/lib/api";

interface DeepSeekSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeepSeekSettingsModal({ open, onOpenChange }: DeepSeekSettingsModalProps) {
  const [apiKey, setApiKey] = useState("");
  const [configured, setConfigured] = useState(false);
  const [maskedKey, setMaskedKey] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [backendOnline, setBackendOnline] = useState(true);

  useEffect(() => {
    if (!open) return;
    setMessage(null);
    getDeepSeekStatus()
      .then((status) => {
        setConfigured(status.configured);
        setMaskedKey(status.maskedKey);
        setBackendOnline(true);
      })
      .catch(() => {
        setBackendOnline(false);
        setConfigured(false);
      });
  }, [open]);

  async function handleSave() {
    if (!apiKey.trim()) {
      setMessage({ type: "error", text: "請輸入 API Key" });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      await saveDeepSeekKey(apiKey.trim());
      setConfigured(true);
      setMaskedKey(`sk-****${apiKey.slice(-4)}`);
      setApiKey("");
      setMessage({ type: "success", text: "API Key 已儲存至伺服器" });
    } catch {
      setMessage({ type: "error", text: "儲存失敗，請確認計算服務已啟動" });
    } finally {
      setLoading(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    setMessage(null);
    try {
      const result = await testDeepSeekConnection();
      setMessage({
        type: result.success ? "success" : "error",
        text: result.message,
      });
    } catch {
      setMessage({ type: "error", text: "連線失敗，請確認計算服務與 API Key 設定" });
    } finally {
      setTesting(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {open && (
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay fixed inset-0 z-50" />
          <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 glass-strong rounded-lg p-6 shadow-2xl focus:outline-none max-h-[90vh] overflow-y-auto"
          aria-describedby="deepseek-desc"
        >
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-2">
              <Sparkles className="size-5 text-accent-natal" />
              <Dialog.Title className="text-base font-semibold text-text-primary">
                解讀服務設定
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

          <p id="deepseek-desc" className="text-sm text-text-secondary mb-4">
            用於星盤文字解讀。API Key 保存在伺服器端，不會暴露給瀏覽器。（服務供應：DeepSeek）
          </p>

          {!backendOnline && (
            <Alert variant="info" title="計算服務暫不可用" className="mb-4">
              本地開發請啟動計算服務（port 8001）。Railway 部署請在 Variables 設定 DEEPSEEK_API_KEY。
            </Alert>
          )}

          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs text-text-muted">狀態</span>
            <Badge variant={configured ? "success" : "muted"}>
              {configured ? `已設定 ${maskedKey ?? ""}` : "未設定"}
            </Badge>
          </div>

          <FieldGroup className="mb-4">
            <Label htmlFor="deepseek-key">API Key</Label>
            <Input
              id="deepseek-key"
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              autoComplete="off"
            />
          </FieldGroup>

          {message && (
            <Alert
              variant={message.type === "error" ? "error" : message.type === "success" ? "success" : "info"}
              className="mb-4"
            >
              {message.text}
            </Alert>
          )}

          <div className="flex gap-2 justify-end">
            <Dialog.Close asChild>
              <Button variant="ghost">取消</Button>
            </Dialog.Close>
            <Button variant="secondary" onClick={handleTest} disabled={testing || !configured}>
              {testing ? <Spinner className="size-4" /> : "驗證連線"}
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? <Spinner className="size-4" /> : "儲存"}
            </Button>
          </div>
        </Dialog.Content>
        </Dialog.Portal>
      )}
    </Dialog.Root>
  );
}
