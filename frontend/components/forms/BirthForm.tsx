"use client";

import { useState } from "react";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ClientIcon } from "@/components/ui/ClientIcon";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { BirthFormFields } from "@/components/forms/BirthFormFields";
import { defaultBirthData } from "@/lib/data/defaultBirthData";
import { pickSampleBirth } from "@/lib/data/randomFill";
import type { BirthFormData } from "@/lib/data/types";

export type { BirthFormData };

interface BirthFormProps {
  value?: BirthFormData;
  onChange?: (data: BirthFormData) => void;
  onSubmit: (data: BirthFormData) => void;
  loading?: boolean;
  accent?: "natal" | "transit";
  showSampleFill?: boolean;
  /** 自訂範例載入（行運頁可同時填行運日期）；未提供則僅載入出生資料 */
  onSampleFill?: () => void;
  submitLabel?: string;
}

export function BirthForm({
  value,
  onChange,
  onSubmit,
  loading,
  accent = "natal",
  showSampleFill = true,
  onSampleFill,
  submitLabel,
}: BirthFormProps) {
  const [internalData, setInternalData] = useState<BirthFormData>(defaultBirthData);

  const data = value ?? internalData;

  function updateData(next: BirthFormData) {
    if (onChange) onChange(next);
    else setInternalData(next);
  }

  function handleSampleFill() {
    if (onSampleFill) {
      onSampleFill();
    } else {
      updateData(pickSampleBirth());
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>出生資料</CardTitle>
        {showSampleFill && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleSampleFill}
            aria-label="載入範例出生資料"
          >
            <ClientIcon icon={BookOpen} className="size-3.5" />
            載入範例案例
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-caption text-text-muted">
          星盤依出生時間與地點計算，與性別無關；姓名僅供顯示。
        </p>
        <BirthFormFields data={data} onChange={updateData} />
        <Button
          className="w-full mt-2"
          onClick={() => onSubmit(data)}
          disabled={loading}
        >
          {loading
            ? "生成中…"
            : submitLabel ?? (accent === "natal" ? "計算命盤" : "計算行運")}
        </Button>
      </CardContent>
    </Card>
  );
}
