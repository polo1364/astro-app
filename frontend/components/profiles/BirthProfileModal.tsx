"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { usePathname } from "next/navigation";
import { Clock, Contact, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Input, Label, FieldGroup } from "@/components/ui/FormControls";
import { BirthFormFields } from "@/components/forms/BirthFormFields";
import { Skeleton } from "@/components/ui/Skeleton";
import { Spinner } from "@/components/ui/Spinner";
import { useBirthProfileContext } from "@/lib/context/BirthProfileContext";
import { defaultBirthData } from "@/lib/data/defaultBirthData";
import type { BirthFormData } from "@/lib/data/types";
import { useBirthProfiles } from "@/lib/hooks/useBirthProfiles";
import { buildProfileLabel } from "@/lib/storage/birthProfileTypes";

function formatSavedAt(ts: number): string {
  const d = new Date(ts);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hour = String(d.getHours()).padStart(2, "0");
  const minute = String(d.getMinutes()).padStart(2, "0");
  return `${month}/${day} ${hour}:${minute}`;
}

function isChartPage(pathname: string): boolean {
  return pathname.startsWith("/natal") || pathname.startsWith("/transit");
}

interface BirthProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BirthProfileModal({ open, onOpenChange }: BirthProfileModalProps) {
  const pathname = usePathname();
  const onChartPage = isChartPage(pathname);
  const { refreshToken, pageHandlers, notifySaved } = useBirthProfileContext();
  const { entries, loading, error, save, remove, refresh, clearAll } = useBirthProfiles();
  const [draftData, setDraftData] = useState<BirthFormData>(defaultBirthData);
  const [labelInput, setLabelInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );
  const [confirmClear, setConfirmClear] = useState(false);

  const activeProfileId = pageHandlers?.activeProfileId ?? null;

  useEffect(() => {
    if (refreshToken > 0) void refresh();
  }, [refreshToken, refresh]);

  useEffect(() => {
    if (!open) return;
    setSaveMessage(null);
    setConfirmClear(false);
    const initial = pageHandlers?.birthData ?? defaultBirthData;
    setDraftData(initial);
    setLabelInput(buildProfileLabel(initial));
  }, [open, pageHandlers?.birthData]);

  function applyToPageForm(data: BirthFormData, profileId: string | null) {
    pageHandlers?.setBirthData(data);
    pageHandlers?.setActiveProfileId(profileId);
  }

  async function handleSave() {
    setSaving(true);
    setSaveMessage(null);
    try {
      const label = labelInput.trim() || buildProfileLabel(draftData);
      const saved = await save({
        label,
        birthForm: draftData,
      });
      applyToPageForm(draftData, saved.id);
      notifySaved(saved.id);
      setSaveMessage({ type: "success", text: "基本資料已儲存" });
    } catch {
      setSaveMessage({ type: "error", text: "儲存失敗，請稍後再試" });
    } finally {
      setSaving(false);
    }
  }

  function handleLoadFromList(profileId: string, form: BirthFormData) {
    setDraftData(form);
    setLabelInput(buildProfileLabel(form));
    applyToPageForm(form, profileId);
    if (onChartPage) onOpenChange(false);
  }

  function handleApplyToForm() {
    if (!pageHandlers) return;
    applyToPageForm(draftData, activeProfileId);
    onOpenChange(false);
  }

  async function handleClear() {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    await clearAll();
    pageHandlers?.setActiveProfileId(null);
    notifySaved("");
    setConfirmClear(false);
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {open && (
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay fixed inset-0 z-50" />
          <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 glass-strong rounded-lg p-6 shadow-2xl focus:outline-none max-h-[90vh] flex flex-col"
          aria-describedby="profile-desc"
        >
          <div className="flex items-start justify-between mb-4 shrink-0">
            <div className="flex items-center gap-2">
              <Contact className="size-5 text-accent-natal" />
              <Dialog.Title className="text-base font-semibold text-text-primary">
                基本資料
              </Dialog.Title>
            </div>
            <div className="flex items-center gap-1">
              {entries.length > 0 && (
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
              )}
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

          <p id="profile-desc" className="text-sm text-text-secondary mb-4 shrink-0">
            填寫姓名、出生日期、時間與地點等資訊，可儲存至本機（最多 30 筆），並帶入左側出生表單。
            <span className="block mt-1 text-text-muted">
              星盤計算與性別無關；姓名僅供顯示與辨識。
            </span>
            <span className="block mt-1 text-text-muted">
              不會上傳或與他人共享；換裝置或清除瀏覽資料後需重新輸入。
            </span>
          </p>

          <div className="overflow-y-auto min-h-0 pr-1 space-y-4">
            <div className="rounded-md border border-border-subtle bg-surface/30 p-3 space-y-3">
              <p className="text-caption text-text-muted">填寫出生資料</p>
              <BirthFormFields
                data={draftData}
                onChange={setDraftData}
                idPrefix="profile"
              />
              <FieldGroup>
                <Label htmlFor="profile-label">儲存名稱</Label>
                <Input
                  id="profile-label"
                  value={labelInput}
                  onChange={(e) => setLabelInput(e.target.value)}
                  placeholder={buildProfileLabel(draftData)}
                />
              </FieldGroup>
              {saveMessage && (
                <Alert
                  variant={saveMessage.type === "error" ? "error" : "success"}
                  className="text-caption"
                >
                  {saveMessage.text}
                </Alert>
              )}
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  className="flex-1"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? <Spinner className="size-4" /> : "儲存基本資料"}
                </Button>
                {onChartPage && pageHandlers && (
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex-1"
                    onClick={handleApplyToForm}
                  >
                    帶入左側表單
                  </Button>
                )}
              </div>
              {!onChartPage && (
                <p className="text-caption text-text-muted">
                  前往本命盤或行運盤頁面後，可使用「帶入左側表單」。
                </p>
              )}
            </div>

            <div>
              <p className="text-caption text-text-muted mb-2">已儲存的基本資料</p>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-14 w-full rounded-md" />
                  <Skeleton className="h-14 w-full rounded-md" />
                </div>
              ) : error ? (
                <Alert variant="info" className="text-caption">{error}</Alert>
              ) : entries.length === 0 ? (
                <p className="text-caption text-text-muted py-2">尚無已儲存的基本資料</p>
              ) : (
                <ul className="space-y-2">
                  {entries.map((entry) => (
                    <li key={entry.id}>
                      <div
                        className={[
                          "rounded-md border px-3 py-2",
                          activeProfileId === entry.id
                            ? "border-accent-natal/40 bg-accent-natal/10"
                            : "border-border-subtle bg-surface/30",
                        ].join(" ")}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-body text-text-primary font-medium line-clamp-2">
                              {entry.label}
                            </p>
                            <p className="text-caption text-text-muted mt-0.5">
                              {entry.birthForm.date}{" "}
                              {entry.birthForm.birthTimeUnknown
                                ? "時間不詳"
                                : entry.birthForm.time}
                              {entry.birthForm.city ? ` · ${entry.birthForm.city}` : ""}
                              {entry.birthForm.houseSystem
                                ? ` · ${entry.birthForm.houseSystem}`
                                : ""}
                            </p>
                            <div className="flex items-center gap-1 mt-1 text-caption text-text-muted">
                              <Clock className="size-3" />
                              {formatSavedAt(entry.savedAt)}
                            </div>
                          </div>
                          <div className="flex flex-col gap-1 shrink-0">
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => handleLoadFromList(entry.id, entry.birthForm)}
                            >
                              帶入
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              aria-label={`刪除 ${entry.label}`}
                              onClick={() => void remove(entry.id)}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Dialog.Content>
        </Dialog.Portal>
      )}
    </Dialog.Root>
  );
}
